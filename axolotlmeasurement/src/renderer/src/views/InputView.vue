<template>
  <div v-if="!imageStore.imageList || imagesToProcess.length <= 0" class="flx col al-c gp2 pd4">
    <div>
      <h1 class="txt-c">Welcome to MeasuringAxolotls!</h1>
    </div>
    <div class="flx col gp1">
      <span class="txt-c">Upload images to get started.</span>
      <div class="draganddrop glass-panel flx col al-c gp1 pd2">
        <span>Drag and drop images/folders here (TODO)</span>
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

    <div class="flx col pd1 w-full selection-container br jc-sb gp05">
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
import { fileOptions, ProcessSuccess, ProcessError } from '../../../types'
import { useImageStore } from '../stores/imageStore'
import { ImageFile } from '../../../types'

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
    readSelectedFiles(filePaths)
  } else {
    console.warn('No files selected or dialog was canceled.')
  }
}

// This function is only triggered on
async function readSelectedFiles(selectedPaths: string[]): Promise<void> {
  // prevents uploading duplicates
  const existingPaths = new Set(imagesToProcess.value.map((image) => image.inputPath))
  const newPaths = selectedPaths.filter((path) => !existingPaths.has(path))

  if (newPaths.length === 0) {
    alert('All images are already uploaded! Ensure your images have unique file names.') // alert probably acceptable here
    return
  }

  const newFiles: ImageFile[] = []

  for (const path of newPaths) {
    const fileName = path.split(/[\\/]/).pop() || 'unknown_file'
    const newImage = {
      name: fileName,
      inputPath: path,
      outputPath: '', // not fully certian how i'll use this but
      verified: false,
      processed: false,
      data: {
        image_name: fileName,
        bounding_box: [],
        keypoints: []
      }
    }
    newFiles.push(newImage)
  }
  imageStore.addImages(newFiles) // adds images to image store (thus updating UI).
  console.log(
    `Added ${newFiles.length} new files. Skipped ${selectedPaths.length - newPaths.length} duplicates.`
  )
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
  const paths = imageStore.imageList.map((elm) => elm.inputPath)
  const fileCount = paths.length

  try {
    const res: ProcessSuccess | ProcessError = await window.api.fs.processImages(paths)
    const timeTaken = (Date.now() - initTime) / 1000

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
