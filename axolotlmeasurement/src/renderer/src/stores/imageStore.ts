// src/renderer/src/stores/imageStore.ts

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ImageFile, AxoData } from 'src/types'

export const useImageStore = defineStore('imageStore', () => {
  const imageList = ref<ImageFile[]>([])

  function addImages(files: ImageFile[]): void {
    // You should also call the DB to add these images here
    // For each file in files -> window.electronAPI.addImage(file)
    imageList.value = [...imageList.value, ...files]
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

  return {
    imageList,
    addImages,
    removeImage,
    bulkUpdateProcessedImages,
    updateImageVerification,
    clearAllInputImages,
    clearValidationList,
    clearGallery
  }
})
