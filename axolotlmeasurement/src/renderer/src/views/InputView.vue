<template>
  <div v-if="!imageStore.imageList || imagesToProcess.length <= 0" class="flx col al-c gp2 pd4">
    <div>
      <h1 class="txt-c">Welcome to MeasuringAxolotls!</h1>
    </div>
    <div class="flx col gp1">
      <span class="txt-c">Upload images to get started.</span>
      <div class="draganddrop glass-panel flx col al-c gp1 pd2">
        <span>Drag and drop images/folders here (WIP)</span>
        <span>or</span>
        <div class="flx gp1">
          <button class="accent-btn gp1 flx al-c" @click="requestFileDialog('file')">
            <span>Upload image</span>
            <span class="material-icons-outlined icon">add_photo_alternate</span>
          </button>
          <button class="accent-btn gp1 flx al-c" @click="requestFileDialog('folder')">
            <span>Upload folder</span>
            <span class="material-icons-outlined icon">folder</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="flx col al-c gp1 w-full pd1 pt2">
    <div class="flx al-c jc-sb w-full">
      <h3 class="txt-col">{{ prepText }}</h3>
      <div class="flx gp1">
        <button class="accent-btn gp1 flx al-c" @click="requestFileDialog('file')">
          <span>Upload image</span>
          <span class="material-icons-outlined icon">add_photo_alternate</span>
        </button>
        <button class="accent-btn gp1 flx al-c" @click="requestFileDialog('folder')">
          <span>Upload folder</span>
          <span class="material-icons-outlined icon">folder</span>
        </button>
      </div>
    </div>

    <div v-if="isLoading === true" class="flx pd4 jc-c">
      <span class="material-symbols-outlined loading icon">progress_activity</span>
    </div>

    <div v-else class="flx col pd1 w-full selection-container br jc-sb gp05">
      <!-- check w/ calvin about making gap between list items smaller -->
      <TransitionGroup name="list">
        <div v-for="image in imagesToProcess" :key="image.inputPath" class="glass-list-item">
          <span>{{ image.name }}</span>
          <button class="closebtn" @click="removeFile(image.inputPath)">
            <span class="material-icons-outlined icon">close</span>
          </button>
        </div>
      </TransitionGroup>
    </div>

    <div class="flx gp1 w-full jc-end">
      <button class="discreet-btn flx gp1 al-c" @click="clearInput">
        <span>Reset input</span><span class="material-icons-outlined icon">delete</span>
      </button>
      <button class="accent-btn flx gp1 al-c" @click="startProcessing">
        <span>Start</span><span class="material-icons-outlined icon">chevron_right</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useImageStore } from '../stores/imageStore'
import { fileOptions, ImageFile } from '../../../types'

const imageStore = useImageStore()
let filePaths: string[] | undefined
const router = useRouter()
const isLoading = ref<boolean>(false)
const successfulFiles = ref<ImageFile[]>([])
const failedFileCount = ref<number>(0)
const prepText = computed(() => {
  return imagesToProcess.value.length <= 1
    ? 'Preparing ' + imagesToProcess.value.length + ' image'
    : 'Preparing ' + imagesToProcess.value.length + ' images'
})
import type { ComputedRef } from 'vue'

const imagesToProcess: ComputedRef<ImageFile[]> = computed(() => {
  return imageStore.imageList.filter((img) => {
    return !img.processed
  })
})

/**
 * Opens dialog for user to select files/folder
 * @returns Array of user-selected file paths
 */
async function requestFileDialog(type: fileOptions): Promise<void> {
  filePaths = (await window.api.fileUploadRequest(type)) as string[] | undefined

  if (filePaths && filePaths.length > 0) {
    console.log('Selected file paths in renderer:', filePaths)
    filePaths.filter((path) => {
      // check database and filter out paths already present in db? Not sure if this is the right spot
      return path.length >= 1 // placeholder
    })
    readSelectedFiles(filePaths)
  } else {
    console.warn('No files selected or dialog was canceled.')
  }
}

// This function is only triggered on attempt at file upload
async function readSelectedFiles(selectedPaths: string[]): Promise<void> {
  const existingPaths = new Set(imagesToProcess.value.map((image) => image.inputPath))
  const newPaths = selectedPaths.filter((path) => !existingPaths.has(path))

  if (newPaths.length === 0) {
    alert('All images are already uploaded!')
    return
  }

  const newFiles: ImageFile[] = []

  for (const path of newPaths) {
    const fileName = path.split(/[\\/]/).pop() || 'unknown_file'
    const newImage: ImageFile = {
      name: fileName,
      inputPath: path,
      outputPath: '',
      verified: false,
      processed: false,
      keypoints: [], // Start with empty array
      boundingBox: [] // Start with empty array
    }
    newFiles.push(newImage)
  }

  imageStore.addImages(newFiles)
  console.log(`Added ${newFiles.length} new files.`)
}

function clearInput(): void {
  successfulFiles.value = []
  failedFileCount.value = 0
  isLoading.value = false
  imageStore.clearAllInputImages() // selectedToProcess is reset by imageStore function
}

async function removeFile(path: string): Promise<void> {
  imageStore.removeImage(path)
}

async function startProcessing(): Promise<void> {
  isLoading.value = true
  const initTime = Date.now()
  let paths = imagesToProcess.value.map((elm) => elm.inputPath)
  const fileCount = paths.length
  console.log(paths)

  try {
    const res = await window.api.fs.processImages(paths)
    const timeTaken = (Date.now() - initTime) / 1000
    paths = []

    if ('error' in res) {
      throw new Error(res.error)
    }
    console.log('Response from backend:', res)
    imageStore.bulkUpdateProcessedImages(res.data)

    alert(`Processed ${fileCount} images in ${timeTaken.toFixed(2)} seconds.`)

    // after images have been processed, I'm sending the user to validate view to verify changes
    router.push('Validate')
  } catch (error) {
    console.error('Error processing images:', error)
    alert('There was an error processing the images. Please check the console for more details.')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.draganddrop {
  border: 1px dashed var(--bg-col-alt);
}

.selection-container {
  max-height: 50vh;
  overflow-y: scroll;
  scrollbar-gutter: stable;
  scrollbar-track-color: none;
  color: var(--txt-col);
  /* background-color: var(--bg-col-alt); */
}

.closebtn {
  color: var(--txt-col);
  background-color: inherit;
}

.biggerxpadding {
  padding: var(--sp1) var(--sp2);
}

.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

.list-leave-active {
  position: absolute;
}
</style>
