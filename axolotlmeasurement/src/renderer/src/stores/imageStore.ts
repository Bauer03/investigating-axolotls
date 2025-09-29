import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ImageFile, AxoData, Keypoint } from 'src/types'

export const useImageStore = defineStore('imageStore', () => {
  const imageList = ref<ImageFile[]>([])
  const selectedValidationImagePath = ref<string | null>(null)
  const selectedGalleryImagePath = ref<string | null>(null)
  // const KEYPOINT_NAMES: Keypoint['name'][] = ['Snout', 'Neck', 'Mid-body', 'Tail Base']

  /**
   * Parses the raw, stringified, deeply nested array from the database
   * into the clean Keypoint[] format used by the UI components.
   * @param rawKeypoints - Can be a string, number[][], or already parsed array.
   * @returns A clean Keypoint[] array or an empty array if input is invalid.
   */
  function parseAndFormatKeypoints(
    rawKeypoints: string | Keypoint[] | number[][] | undefined
  ): Keypoint[] {
    if (!rawKeypoints) return []

    let parsed: number[][] = []
    try {
      const data = typeof rawKeypoints === 'string' ? JSON.parse(rawKeypoints) : rawKeypoints

      // Handle the deeply nested array format from your backend
      if (Array.isArray(data) && Array.isArray(data[0]) && Array.isArray(data[0][0])) {
        parsed = data[0]
      } else if (Array.isArray(data) && Array.isArray(data[0]) && typeof data[0][0] === 'number') {
        parsed = data
      } else if (Array.isArray(data) && data[0]?.name !== undefined) {
        // Already in correct format
        return data as Keypoint[]
      } else {
        return []
      }

      return parsed.map((point, index) => ({
        name: `Keypoint ${index + 1}`,
        x: point[0],
        y: point[1]
      }))
    } catch (error) {
      console.error('Failed to parse keypoints:', rawKeypoints, error)
      return []
    }
  }
  async function addImages(files: ImageFile[]): Promise<void> {
    const successfullyAdded: ImageFile[] = []

    for (const file of files) {
      try {
        await window.api.addDBImage(file)
        successfullyAdded.push(file)
      } catch (error: unknown) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof (error as { message?: string }).message === 'string' &&
          (error as { message?: string }).message?.includes('UNIQUE constraint failed')
        ) {
          console.log(`Image ${file.inputPath} already exists, skipping.`)
        } else {
          console.error(`Failed to add image ${file.inputPath}:`, error)
        }
      }
    }

    if (successfullyAdded.length > 0) {
      const currentPaths = new Set(imageList.value.map((img) => img.inputPath))
      const newFilesToAdd = successfullyAdded.filter((file) => !currentPaths.has(file.inputPath))
      imageList.value = [...imageList.value, ...newFilesToAdd]
    }
  }

  const selectedValidationImage = computed(() => {
    if (!selectedValidationImagePath.value) {
      return null
    }
    return (
      imageList.value.find((image) => image.inputPath === selectedValidationImagePath.value) || null
    )
  })

  const selectedGalleryImage = computed(() => {
    if (!selectedGalleryImagePath.value) {
      return null
    }
    return imageList.value.find((img) => img.inputPath === selectedGalleryImagePath.value) || null
  })

  function selectImage(path: string, destination: 'validation' | 'gallery'): void {
    if (destination === 'validation') {
      selectedValidationImagePath.value = path
    } else if (destination === 'gallery') {
      selectedGalleryImagePath.value = path
    }
  }

  function unselectImage(): void {
    selectedValidationImagePath.value = null
    selectedGalleryImagePath.value = null
  }

  async function removeImage(pathToRemove: string): Promise<void> {
    const success = await window.api.deleteImage(pathToRemove)
    if (success) {
      imageList.value = imageList.value.filter((image) => image.inputPath !== pathToRemove)
    }
    selectedValidationImagePath.value = validationList.value[0].inputPath
    selectedGalleryImagePath.value = galleryList.value[0].inputPath
  }

  async function clearAllInputImages(): Promise<void> {
    await window.api.deleteImagesWhere({ processed: false })
    imageList.value = imageList.value.filter((image) => image.processed)
  }

  async function clearValidationList(): Promise<void> {
    await window.api.deleteImagesWhere({ processed: true, verified: false })
    imageList.value = imageList.value.filter((image) => !image.processed || image.verified)
  }

  const validationList = computed(() => {
    return imageList.value.filter((img) => {
      return img.processed && !img.verified
    })
  })

  async function clearGallery(): Promise<void> {
    await window.api.deleteImagesWhere({ verified: true })
    imageList.value = imageList.value.filter((image) => !image.verified)
  }

  async function bulkUpdateProcessedImages(processedData: AxoData[]): Promise<void> {
    const resultsMap = new Map<string, AxoData>()
    for (const result of processedData) {
      resultsMap.set(result.image_name, result)
    }

    for (const imageInStore of imageList.value) {
      if (resultsMap.has(imageInStore.name)) {
        const result = resultsMap.get(imageInStore.name)!
        const formattedKeypoints = parseAndFormatKeypoints(result.keypoints)

        // Update local state - everything goes directly on the image object
        imageInStore.processed = true
        imageInStore.keypoints = formattedKeypoints
        imageInStore.boundingBox = result.bounding_box

        // Update database
        await window.api.updateImage(imageInStore.inputPath, {
          processed: true,
          keypoints: formattedKeypoints,
          boundingBox: result.bounding_box
        })
      }
    }
  }

  async function updateImage(inputPath: string, updates: Partial<ImageFile>): Promise<void> {
    const imageInStore = imageList.value.find((img) => img.inputPath === inputPath)
    if (imageInStore) {
      // Simply merge the updates into the image object for local state
      Object.assign(imageInStore, updates)

      try {
        // Create a plain object copy to send through IPC
        // Removes Vue's reactive proxies that can't be cloned, otherwise get errors
        const plainUpdates = JSON.parse(JSON.stringify(updates))

        await window.api.updateImage(inputPath, plainUpdates)
      } catch (error) {
        console.error(`Failed to update image ${inputPath}:`, error)
        // could revert the local state change if the database update failed?
        throw error
      }
    }
  }

  async function loadExistingImages(): Promise<void> {
    try {
      const existingImages = await window.api.getDBImages()
      imageList.value = existingImages.map((img) => ({
        ...img,
        keypoints: parseAndFormatKeypoints(img.keypoints),
        boundingBox: img.boundingBox || []
      }))
    } catch (error) {
      console.error('Failed to load existing images:', error)
    }
  }

  const galleryList = computed(() => {
    return imageList.value.filter((img) => {
      return img.processed && img.verified
    })
  })

  return {
    loadExistingImages,
    imageList,
    addImages,
    removeImage,
    bulkUpdateProcessedImages,
    updateImage,
    clearAllInputImages,
    clearValidationList,
    clearGallery,
    selectImage,
    selectedValidationImage,
    unselectImage,
    selectedGalleryImage,
    galleryList,
    validationList
  }
})
