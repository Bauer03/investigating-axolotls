<template>
  <div class="container h-full flx jc-c al-c">
    <div v-if="!imageStore.imageList || imageStore.imageList.length === 0" class="flx col al-c gp2">
      <div>
        <h1>Welcome to MeasuringAxolotls!</h1>
      </div>
      <div class="flx col gp1">
        <span>Upload images to get started.</span>
        <div class="draganddrop flx col al-c gp1 pd2">
          <span>Drag and drop images/folders here</span>
          <span>or</span>
          <div class="button-cont flx gp1">
            <button class="accent-btn gp1 flx al-c" @click="requestFileDialog('file')">
              <span>Upload image</span>
              <span class="material-icons-outlined icon">add_photo_alternate</span>
            </button>
            <button class="accent-btn gp1 flx al-c" @click="requestFileDialog('folder')">
              <span>Upload folder</span> <span class="material-icons-outlined icon">folder</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flx col al-c gp1">
      <h2>Preparing {{ imageStore.imageList.length }} images</h2>
      <div v-for="image in imageStore.imageList" :key="image.path">
        <span>{{ image.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { fileOptions } from '../../../types'
import { ImageFile, useImageStore } from '../stores/imageStore'

const imageStore = useImageStore()
let filePaths: string[] | undefined // doesn't need to be a ref, right?
const isLoading = ref<boolean>(false) // use for loading anim when waiting for image upload
const successfulFiles = ref<ImageFile[]>([])
const failedFileCount = ref<number>(0)

/**
 * Opens dialog for user to select files/folder
 * @returns Array of user-selected file paths
 */
async function requestFileDialog(type: fileOptions): Promise<void> {
  filePaths = (await window.api.fileUploadRequest(type)) as string[] | undefined

  if (filePaths && filePaths.length > 0) {
    console.log('Selected files in renderer:', filePaths)
    readSelectedFiles(filePaths)
  } else {
    console.warn('No files selected or dialog was canceled.')
  }
}

async function readSelectedFiles(selectedPaths: string[]): Promise<void> {
  isLoading.value = true // handle in ui
  successfulFiles.value = []
  failedFileCount.value = 0

  const readPromises = selectedPaths?.map((path) => window.api.fs.readFile(path))

  const results = await Promise.allSettled(readPromises)

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      // 'result.value' has the file content
      successfulFiles.value.push(result.value as unknown as ImageFile) // just temporary lol will fix on next push
    } else {
      failedFileCount.value++
      // logging failed file. surely won't regret this
      console.error(`Failed to read ${failedFileCount[index]}:`, result.reason) // result.reason shows error
    }
  })

  isLoading.value = false
  await imageStore.addImages(successfulFiles.value)
  console.log(`Finished. Read ${successfulFiles.value.length} files successfully.`)
}
</script>

<style scoped>
.draganddrop {
  border: 1px dashed var(--bg-col-alt);
}
</style>
