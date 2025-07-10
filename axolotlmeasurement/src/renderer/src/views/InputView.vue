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
          <div class="flx gp1">
            <button class="accent-btn gp1 flx al-c" @click="requestFileDialog('file')">
              <span>Upload image</span>
              <span class="material-icons-outlined icon">add_photo_alternate</span>
            </button>
            <button class="accent-btn gp1 flx al-c" @click="requestFileDialog('folder')">
              <span>Upload folder [WIP]</span>
              <span class="material-icons-outlined icon">folder</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flx col al-c gp1">
      <div class="flx al-c jc-sb bg-alt w-full br gp4 biggerxpadding">
        <h3 class="txt-col-alt">Preparing {{ imageStore.imageList.length }} images</h3>
        <div class="flx gp1">
          <button class="accent-btn gp1 flx al-c" @click="requestFileDialog('file')">
            <span>Upload image</span>
            <span class="material-icons-outlined icon">add_photo_alternate</span>
          </button>
          <button class="accent-btn gp1 flx al-c" @click="requestFileDialog('folder')">
            <span>Upload folder [WIP]</span>
            <span class="material-icons-outlined icon">folder</span>
          </button>
        </div>
      </div>
      <div class="flx col pd1 w-full bg-alt selection-container br jc-sb gp05">
        <TransitionGroup name="list">
          <div
            v-for="image in imageStore.imageList"
            :key="image.inputPath"
            class="flx w-full al-c jc-sb br list-image"
          >
            <span>{{ image.name }}</span>
            <!--for some reason, this doesn't look like it's rendering -->
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { fileOptions } from '../../../types'
import { useImageStore } from '../stores/imageStore'
import { ImageFile } from '../../../types'

const imageStore = useImageStore()
let filePaths: string[] | undefined
const isLoading = ref<boolean>(false)
const successfulFiles = ref<ImageFile[]>([])
const failedFileCount = ref<number>(0)

/**
 * Opens dialog for user to select files/folder
 * @returns Array of user-selected file paths
 */
async function requestFileDialog(type: fileOptions): Promise<void> {
  filePaths = (await window.api.fileUploadRequest(type)) as string[] | undefined

  // handle folder case. Since security says I can't just ask for file paths in a folder,
  // Pass the folder's path to the python backend, and get the list of file paths back.

  if (filePaths && filePaths.length > 0) {
    console.log('Selected file paths in renderer:', filePaths)
    readSelectedFiles(filePaths)
  } else {
    console.warn('No files selected or dialog was canceled.')
  }
}

async function readSelectedFiles(selectedPaths: string[]): Promise<void> {
  isLoading.value = true
  successfulFiles.value = []
  failedFileCount.value = 0

  // hopefully an efficient way to handle thousands of images being selected, as only using file path + file name, which are pulled from path
  selectedPaths.forEach((path) => {
    const fileName = path.split(/[\\/]/).pop() || 'unknown_file' // Handles both Windows and Unix paths, pulled from online.
    successfulFiles.value.push({
      name: fileName,
      inputPath: path,
      verified: false
    })
  })

  isLoading.value = false
  imageStore.addImages(successfulFiles.value)
  console.log(`Finished. Stored ${successfulFiles.value.length} file paths successfully.`)
  console.log(successfulFiles.value)
}

function clearInput(): void {
  // more stuff may be needed here later on.
  successfulFiles.value = []
  failedFileCount.value = 0
  isLoading.value = false
  imageStore.clearImages()
}

function removeFile(path: string): void {
  imageStore.removeImage(path)
}

function startProcessing(): void {
  console.log('sending images to model')
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
  div {
    background-color: var(--bg-col);
  }
}

.list-image {
  padding: var(--sp05) var(--sp2);
}

.closebtn {
  color: var(--txt-col);
  background-color: inherit;
  padding-right: 0;
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
