<template>
  <div class="container h-full flx jc-c al-c">
    <div v-if="!imageStore.imageList || imageStore.imageList.length === 0" class="flx col al-c gp2">
      <div class="pd4">
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

    <div v-else class="flx col al-c gp1 w-full">
      <div class="flx al-c jc-sb glass-container-solid w-full gp4 biggerxpadding">
        <h3 class="txt-col">Preparing {{ imageStore.imageList.length }} images</h3>
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

      <div class="glass-selection flx col pd1 w-full selection-container br jc-sb gp05">
        <TransitionGroup name="list">
          <div
            v-for="image in imageStore.imageList"
            :key="image.inputPath"
            class="glass-list-item flx w-full al-c jc-sb list-image"
          >
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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

// function ImageGallery(): JSX.Element {
//   const [images, setImages] = useState<ImageFile[]>([]);

//   // 👇 Fetch images from the main process when the component loads
//   useEffect(() => {
//     async function fetchImages() {
//       const allImages = await window.electronAPI.getAllImages();
//       setImages(allImages);
//     }

//     fetchImages();
//   }, []);

//   // 👇 Example of how you might add a new image
//   const handleAddImage = async (newImage: ImageFile) => {
//     await window.electronAPI.addImage(newImage);
//     // Optionally, refresh the list after adding
//     const allImages = await window.electronAPI.getAllImages();
//     setImages(allImages);
//   };

//   return (
//     <div>
//       <h2>Image Gallery</h2>
//       <ul>
//         {images.map((image) => (
//           <li key={image.id}>{image.name}</li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// export default ImageGallery;

// This function is only triggered on
async function readSelectedFiles(selectedPaths: string[]): Promise<void> {
  // prevents uploading duplicates
  const existingPaths = new Set(imageStore.imageList.map((image) => image.inputPath))
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
      verified: false,
      processed: false,
      data: {
        image_name: fileName,
        bounding_box: [],
        keypoints: []
      }
    }
    newFiles.push(newImage)
    await window.api.addDBImage(newImage) // since I'm storing images to sqlite db before processing, need to make sure I add
    // calls to appropriate delete endpoint if user clears out their input, whether that's one file or 3k.
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
  imageStore.clearAllInputImages()
}

async function removeFile(path: string): Promise<void> {
  imageStore.removeImage(path)
}

// in InputView.vue

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

    // after images have been processed, I'm sending the user to output view to verify changes
    router.push('Output')
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
  /* max-height: 50vh; */
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
