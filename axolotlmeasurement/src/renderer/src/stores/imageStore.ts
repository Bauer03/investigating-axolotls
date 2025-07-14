import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ImageFile } from 'src/types'

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

  return { imageList, addImages, clearImages, removeImage, clearInput }
})
