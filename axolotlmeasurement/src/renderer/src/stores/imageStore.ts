import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ImageFile, AxoData, Keypoint } from 'src/types'

export const useImageStore = defineStore('imageStore', () => {
  const imageList = ref<ImageFile[]>([])
  const selectedValidationImagePath = ref<string | null>(null)
  const selectedGalleryImagePath = ref<string | null>(null)

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
          console.log(`Error: Image ${file.inputPath} already exists in database, skipping.`)
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
    return imageList.value.find((image) => image.inputPath === selectedValidationImagePath.value) || null
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

  async function getValidationList(): Promise<ImageFile[]> {
    return imageList.value.filter((image) => {
      return image.processed && !image.verified
    })
  }

  async function clearGallery(): Promise<void> {
    await window.api.deleteImagesWhere({ verified: true })
    imageList.value = imageList.value.filter((image) => !image.verified)
  }

  async function bulkUpdateProcessedImages(processedData: AxoData[]): Promise<void> {
    const resultsMap = new Map(processedData.map((data) => [data.image_name, data]))

    for (const imageInStore of imageList.value) {
      if (resultsMap.has(imageInStore.name)) {
        const result = resultsMap.get(imageInStore.name)!

        imageInStore.processed = true
        imageInStore.data = result

        await window.api.updateImage(imageInStore.inputPath, {
          processed: true,
          keypoints: JSON.stringify(result.keypoints)
        })
      }
    }
  }

  async function updateImage(inputPath: string, updates: Partial<ImageFile>): Promise<void> {
    const imageInStore = imageList.value.find((img) => img.inputPath === inputPath)
    if (imageInStore) {
      // Handle keypoints update properly
      if ('keypoints' in updates && updates.keypoints) {
        const keypoints = updates.keypoints as Keypoint[]

        // Update the keypoints field
        imageInStore.keypoints = keypoints

        // Also update the data.keypoints if data exists
        if (!imageInStore.data) {
          imageInStore.data = {
            image_name: imageInStore.name,
            bounding_box: [],
            keypoints: keypoints // Keep as Keypoint[] objects
          }
        } else {
          imageInStore.data.keypoints = keypoints // Keep as Keypoint[] objects
        }
      }

      // Update other fields
      Object.assign(imageInStore, updates)

      // Prepare database updates
      const dbUpdates: Record<string, unknown> = { ...updates }
      if (dbUpdates.keypoints) {
        dbUpdates.keypoints = JSON.stringify(dbUpdates.keypoints)
      }

      await window.api.updateImage(inputPath, dbUpdates)
    }
  }

  async function loadExistingImages(): Promise<void> {
    try {
      const existingImages = await window.api.getDBImages()
      imageList.value = existingImages
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
    getValidationList,
    galleryList,
    validationList
  }
})
