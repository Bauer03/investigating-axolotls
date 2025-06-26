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
// import { ref } from 'vue'
import { fileOptions } from '../../../types'
import { useImageStore } from '../stores/imageStore'

const imageStore = useImageStore();

async function requestFileDialog(type: fileOptions): Promise<void> {
  const filePaths = (await window.api.fileUploadRequest(type)) as string[] | undefined

  if (filePaths && filePaths.length > 0) {
    console.log('Selected files in renderer:', filePaths)
    // update state based on files.
  } else {
    console.log('No files selected or dialog was canceled.')
  }
}
</script>

<style scoped>
.draganddrop {
  border: 1px dashed var(--bg-col-alt);
}
</style>
