import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ImageFile {
  name: string // to display file name (helps user identify files, say in case they want to remove them, or check if one already exists)
  filePath: string // sent to model for processing. no idea right now if that will require some kind of processing, we'll see.
}

export const useImageStore = defineStore('imageStore', () => {
  const imageList = ref<ImageFile[]>([]) // will allow me to reference images across web app - helpful in output especially.

  function addImages(files: ImageFile[]): void {
    imageList.value = [...imageList.value, ...files]
  }

  function clearImages(): void {
    imageList.value = []
  }

  function removeImage(path: string): void {
    imageList.value = imageList.value.filter((image) => image.filePath !== path)
  }

  return { imageList, addImages, clearImages, removeImage }
})
