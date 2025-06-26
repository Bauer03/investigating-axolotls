import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ImageFile {
  name: string
  path: string
}

export const useImageStore = defineStore('imageStore', () => {
  const imageList = ref<ImageFile[]>([]) // will allow me to reference images across web app - helpful in output especially.

  function addImages(files: ImageFile[]): void {
    imageList.value = [...imageList.value, ...files]
  }

  function clearImages(): void {
    imageList.value = []
  }

  return { imageList, addImages, clearImages }
})
