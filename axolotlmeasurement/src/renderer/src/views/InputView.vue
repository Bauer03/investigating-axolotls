<template>
  <div v-if="!imageStore.imageList || imagesToProcess.length <= 0" class="flx col al-c gp2 pd4">
    <div>
      <h1 class="txt-c">Welcome to MeasuringAxolotls!</h1>
    </div>
    <div class="flx col gp1">
      <span class="txt-c">Upload images to get started.</span>
      <div class="flx al-c gp1 jc-c">
        <label for="model-select-welcome" class="txt-col">Model:</label>
        <select id="model-select-welcome" v-model="imageStore.selectedModel" class="model-select">
          <option v-if="imageStore.availableModels.length === 0" value="" disabled>
            No models found
          </option>
          <option v-for="model in imageStore.availableModels" :key="model" :value="model">
            {{ model }}
          </option>
        </select>
        <button
          class="discreet-btn flx al-c"
          title="Refresh model list"
          @click="imageStore.loadModels()"
        >
          <span class="material-icons-outlined icon">refresh</span>
        </button>
        <button
          class="discreet-btn flx al-c"
          title="Open models folder"
          @click="openModelsFolder"
        >
          <span class="material-icons-outlined icon">folder_open</span>
        </button>
      </div>
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

  <div v-else class="flx col al-c gp1 w-full pd1 pt2 input-active-container">
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

    <div class="flx al-c gp1">
      <label for="model-select" class="txt-col">Model:</label>
      <select
        id="model-select"
        v-model="imageStore.selectedModel"
        class="model-select"
        :disabled="isLoading"
      >
        <option v-if="imageStore.availableModels.length === 0" value="" disabled>
          No models found
        </option>
        <option v-for="model in imageStore.availableModels" :key="model" :value="model">
          {{ model }}
        </option>
      </select>
      <button
        class="discreet-btn flx al-c"
        title="Refresh model list"
        :disabled="isLoading"
        @click="imageStore.loadModels()"
      >
        <span class="material-icons-outlined icon">refresh</span>
      </button>
      <button
        class="discreet-btn flx al-c"
        title="Open models folder"
        :disabled="isLoading"
        @click="openModelsFolder"
      >
        <span class="material-icons-outlined icon">folder_open</span>
      </button>
    </div>

    <div v-if="isLoading === true" class="flx pd4 jc-c">
      <span class="material-symbols-outlined loading icon">progress_activity</span>
    </div>

    <div v-else class="flx col pd1 w-full selection-container br gp05">
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
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useImageStore } from '../stores/imageStore'
import { fileOptions, ImageFile } from '../../../types'

const imageStore = useImageStore()
let filePaths: string[] | undefined
const router = useRouter()
const isLoading = ref<boolean>(false)

onMounted(async () => {
  await imageStore.loadModels()
})
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
      boundingBox: [], // Start with empty array
      modelName: ''
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

async function openModelsFolder(): Promise<void> {
  await window.api.models.openModelsFolder()
}

async function removeFile(path: string): Promise<void> {
  imageStore.removeImage(path)
}

async function startProcessing(): Promise<void> {
  if (!imageStore.selectedModel) {
    alert('No model selected. Please place .pt files in the models folder and refresh.')
    return
  }

  isLoading.value = true
  const initTime = Date.now()
  let paths = imagesToProcess.value.map((elm) => elm.inputPath)
  const fileCount = paths.length
  console.log(paths)

  try {
    const res = await window.api.fs.processImages(paths, imageStore.selectedModel)
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

.input-active-container {
  height: 100%; /* fill the router-view-wrapper flex child */
}

.selection-container {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
  color: var(--txt-col);
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

.model-select {
  padding: 0.4rem 0.8rem;
  border-radius: var(--br);
  background-color: var(--bg-col);
  color: var(--txt-col);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: var(--fs-sm);
  min-width: 150px;
}

.model-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
