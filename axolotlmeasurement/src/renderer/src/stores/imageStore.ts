import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ImageFile } from 'src/types'
import { AxoData } from 'src/types'

export const useImageStore = defineStore('imageStore', () => {
  const imageList = ref<ImageFile[]>([]) // will allow me to reference images across web app - helpful in output especially.

  function addImages(files: ImageFile[]): void {
    imageList.value = [...imageList.value, ...files]
  }

  function clearImages(): void {
    imageList.value = []
  }

  function removeImage(path: string): void {
    imageList.value = imageList.value.filter((image) => image.inputPath !== path)
  }

  function clearInput(): void {
    imageList.value = imageList.value.filter((image) => image.processed)
  }

  function bulkUpdateProcessedImages(processedData: AxoData[]): void {
    const resultsMap = new Map(processedData.map((data) => [data.image_name, data]))

    imageList.value.forEach((imageInStore) => {
      if (resultsMap.has(imageInStore.name)) {
        const result = resultsMap.get(imageInStore.name)!
        imageInStore.processed = true
        imageInStore.data = result
        console.log('New image added to store: ', result)
      }
    })
  }

  return { imageList, addImages, clearImages, removeImage, clearInput, bulkUpdateProcessedImages }
})
