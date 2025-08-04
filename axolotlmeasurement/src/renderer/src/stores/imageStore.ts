// src/renderer/src/stores/imageStore.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ImageFile, AxoData } from 'src/types'

export const useImageStore = defineStore('imageStore', () => {
  const imageList = ref<ImageFile[]>([])
  const selectedImagePath = ref<string | null>(null)

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
          console.log(`Image ${file.inputPath} already exists in database, skipping.`)
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

  const selectedImage = computed(() => {
    if (!selectedImagePath.value) {
      // no path selected means no selected image
      return null
    }
    // find image in imagelist using path
    return imageList.value.find((image) => image.inputPath === selectedImagePath.value) || null
  })

  function selectImage(path: string): void {
    selectedImagePath.value = path
  }

  function unselectImage(): void {
    selectedImagePath.value = null
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
          keypoints: JSON.stringify(result.keypoints) // Ensure keypoints are stored as a string
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
    selectedImage,
    unselectImage
  }
})
