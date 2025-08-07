import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ImageFile, AxoData } from 'src/types'

export const useImageStore = defineStore('imageStore', () => {
  const imageList = ref<ImageFile[]>([])
  const selectedToValidatePath = ref<string | null>(null)
  const selectedGalleryImagePath = ref<string | null>(null) // variable name length would probably give Caleb a heart attack

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
          (error as { message?: string }).message?.includes('UNIQUE constraint failed') // not sure that this error is always bc of this but..
        ) {
          console.log(`Error: Image ${file.inputPath} already exists in database, skipping.`)
        } else {
          console.error(`Failed to add image ${file.inputPath}:`, error)
        }
      }
    }

    // Only add successfully inserted images to the local state
    if (successfullyAdded.length > 0) {
      const currentPaths = new Set(imageList.value.map((img) => img.inputPath))
      const newFilesToAdd = successfullyAdded.filter((file) => !currentPaths.has(file.inputPath))
      imageList.value = [...imageList.value, ...newFilesToAdd]
    }
  }

  const selectedToValidate = computed(() => {
    if (!selectedToValidatePath.value) {
      return null
    }
    // find image in imagelist using path
    return imageList.value.find((image) => image.inputPath === selectedToValidatePath.value) || null
  })

  const selectedGalleryImage = computed(() => {
    if (!selectedGalleryImagePath.value) {
      return null
    }
    return imageList.value.find((img) => img.inputPath === selectedGalleryImagePath.value) || null
  })

  function selectImage(path: string): void {
    selectedToValidatePath.value = path
  }

  function unselectImage(): void {
    selectedToValidatePath.value = null
  }

  // delete single image. Just needs path to work right.
  async function removeImage(pathToRemove: string): Promise<void> {
    const success = await window.api.deleteImage(pathToRemove)
    if (success) {
      imageList.value = imageList.value.filter((image) => image.inputPath !== pathToRemove)
    }
  }

  /**
   * Deletes all images that have NOT been processed yet.
   * Called from the Input view.
   */
  async function clearAllInputImages(): Promise<void> {
    await window.api.deleteImagesWhere({ processed: false })
    imageList.value = imageList.value.filter((image) => image.processed)
  }

  /**
   * Deletes all images that have been processed but NOT verified.
   * Called from the Validation view.
   */
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
    // no need for db calls, this just reads from store
    return imageList.value.filter((image) => {
      return image.processed && !image.verified
    })
  }

  /**
   * Deletes all images that HAVE been verified.
   * Called from the Gallery view.
   */
  async function clearGallery(): Promise<void> {
    await window.api.deleteImagesWhere({ verified: true })
    imageList.value = imageList.value.filter((image) => !image.verified)
  }

  // --- Data Update Action ---
  async function bulkUpdateProcessedImages(processedData: AxoData[]): Promise<void> {
    const resultsMap = new Map(processedData.map((data) => [data.image_name, data]))

    for (const imageInStore of imageList.value) {
      if (resultsMap.has(imageInStore.name)) {
        const result = resultsMap.get(imageInStore.name)!

        // Update local state
        imageInStore.processed = true
        imageInStore.data = result

        // Persist change to the database
        await window.api.updateImage(imageInStore.inputPath, {
          processed: true,
          keypoints: JSON.stringify(result.keypoints) // keypoints are stored as a string
        })
      }
    }
  }

  // Also needed for verifying/correcting points
  async function updateImageVerification(
    inputPath: string,
    updatedData: { verified: boolean; keypoints: string }
  ): Promise<void> {
    const imageInStore = imageList.value.find((img) => img.inputPath === inputPath)
    if (imageInStore) {
      imageInStore.verified = updatedData.verified
      if (!imageInStore.data) {
        imageInStore.data = {
          image_name: imageInStore.name,
          bounding_box: [],
          keypoints: JSON.parse(updatedData.keypoints)
        }
      } else {
        imageInStore.data.keypoints = JSON.parse(updatedData.keypoints)
      }
      await window.api.updateImage(inputPath, updatedData)
    }
  }

  // Pinia setup store: use onStoreInit
  // @ts-ignore: onStoreInit may not be typed in some environments
  if (typeof window !== 'undefined' && typeof __VUE_DEVTOOLS_GLOBAL_HOOK__ === 'undefined') {
    // @ts-ignore: onStoreInit may not be typed in some environments
    if (typeof onStoreInit === 'function') {
      // @ts-ignore: onStoreInit may not be typed in some environments
      onStoreInit(() => {
        loadExistingImages()
      })
    } else {
      // fallback: call manually in your app's entry point
      loadExistingImages()
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

  return {
    loadExistingImages,
    imageList,
    addImages,
    removeImage,
    bulkUpdateProcessedImages,
    updateImageVerification,
    clearAllInputImages,
    clearValidationList,
    clearGallery,
    selectImage,
    selectedToValidate,
    unselectImage,
    selectedGalleryImage,
    getValidationList,
    validationList
  }
})
