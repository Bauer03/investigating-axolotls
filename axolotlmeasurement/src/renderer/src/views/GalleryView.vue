<template>
  <div v-if="galleryImages.length <= 0">
    <span>
      You don't have any images in your gallery. Head to the 'input' tab to get started!
    </span>
  </div>

  <div v-else class="content flx pd1 pt2 gp1">
    <div class="gallery-left flx col gp05">
      <h3 class="txt-col">Your Images</h3>
      <div class="action-bar flx gp1">
        <div ref="dropdownRef" class="dropdown-container">
          <button class="accent-btn flx al-c jc-sb gp2" @click="toggleDropdown">
            <span>Download All</span>
            <span class="material-icons-outlined">
              {{ isDropdownOpen ? 'expand_less' : 'expand_more' }}
            </span>
          </button>
          <div v-if="isDropdownOpen" class="dropdown-menu glass-panel">
            <div class="glass-list-item" @click="downloadAllImages()">
              Images <span class="material-icons-outlined">download</span>
            </div>
            <div class="glass-list-item" @click="downloadAllKeypointData">
              Data (.csv) <span class="material-icons-outlined">download</span>
            </div>
          </div>
        </div>
        <button class="discreet-btn danger-btn flx al-c jc-c" @click="confirmDeleteAll">
          <span class="material-icons-outlined">delete</span>
        </button>
      </div>
      <div class="flx col gp05 list-container">
        <div
          v-for="image in galleryImages"
          :key="image.name"
          :class="{ selected: selectedImage?.inputPath === image.inputPath }"
          class="glass-list-item p-1"
          @click="imageStore.selectImage(image.inputPath, 'gallery')"
        >
          <span>{{ image.name }}</span>
        </div>
      </div>
    </div>

    <div class="gallery-right flx col gp1">
      <div class="glass-preview flx">
        <KeypointDisplay
          v-if="selectedImage"
          :image-src="selectedImage.inputPath"
          :keypoints="selectedImage.keypoints"
          class="selected-image"
          @click="openFullscreen(selectedImage)"
        />
      </div>

      <div v-if="selectedImage?.modelName" class="model-info txt-col">
        Model: {{ selectedImage.modelName }}
      </div>

      <div v-if="selectedImage?.measurements" class="glass-panel pd1 measurements-panel">
        <span class="measurements-title txt-col">Measurements (px)</span>
        <div class="measurements-grid">
          <span class="txt-col">SVL (total)</span>
          <span class="measurement-value">{{ selectedImage.measurements.total_length.toFixed(1) }}</span>
          <span class="txt-col">Head → midU</span>
          <span class="measurement-value">{{ selectedImage.measurements.head_to_midU.toFixed(1) }}</span>
          <span class="txt-col">midU → midL</span>
          <span class="measurement-value">{{ selectedImage.measurements.midU_to_midL.toFixed(1) }}</span>
          <span class="txt-col">midL → legs</span>
          <span class="measurement-value">{{ selectedImage.measurements.midL_to_legs_midpoint.toFixed(1) }}</span>
          <span class="txt-col">legs → Tail</span>
          <span class="measurement-value">{{ selectedImage.measurements.legs_midpoint_to_tail.toFixed(1) }}</span>
        </div>
      </div>

      <div class="glass-panel pd1 flx gp1 jc-end">
        <button class="discreet-btn flx gp05 al-c" @click="copyData(selectedImage)">
          <span class="material-icons-outlined">content_copy</span>
          Copy Data
        </button>
        <button class="discreet-btn flx gp05 al-c" @click="downloadImage(selectedImage)">
          <span class="material-icons-outlined">download</span>
          Download image
        </button>
        <button
          class="danger-btn discreet-btn flx gp05 al-c"
          @click="deleteSingleImage(selectedImage)"
        >
          <span class="material-icons-outlined">delete</span>
          Delete Image
        </button>
      </div>
    </div>
  </div>

  <div v-if="fullscreenImage" class="fullscreen-modal" @click.self="closeFullscreen">
    <div class="fullscreen-content">
      <KeypointDisplay
        v-if="fullscreenImage"
        v-model:keypoints="editedKeypoints"
        :image-src="fullscreenImage.inputPath"
        :is-editable="true"
        class="fullscreen-image"
      />

      <div class="fullscreen-buttons flx gp1 jc-end">
        <button class="discreet-btn" @click="closeFullscreen">Cancel</button>
        <button class="accent-btn" @click="saveAndCloseFullscreen">Save and Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useImageStore } from '../stores/imageStore'
import { computed, onMounted, ref, Ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { ImageFile, Keypoint } from 'src/types'
import KeypointDisplay from '../components/KeypointDisplay.vue'

const imageStore = useImageStore()
const galleryImages = computed(() => imageStore.galleryList)
const selectedImage = computed(() => imageStore.selectedGalleryImage)
const isDownloadingAll = ref(false)
const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const toggleDropdown = (): void => {
  isDropdownOpen.value = !isDropdownOpen.value
}
onClickOutside(dropdownRef, () => {
  isDropdownOpen.value = false
})

const downloadAllImages = async (): Promise<void> => {
  if (isDownloadingAll.value || imageStore.imageList.length === 0) return

  isDownloadingAll.value = true
  console.log('Starting batch download process...')

  const filesToSave: { name: string; data: string; metadata?: Record<string, string> }[] = []

  // Use a canvas that is not attached to the DOM
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    alert('Could not create a canvas context.')
    isDownloadingAll.value = false
    return
  }

  // Process each image sequentially to avoid overwhelming the renderer
  for (const image of imageStore.imageList) {
    try {
      const base64Data = await window.api.fs.readFile(image.inputPath)
      const imageUrl = `data:image/png;base64,${base64Data}`

      // We need to wrap the image loading in a promise
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          ctx.drawImage(img, 0, 0)

          // Draw keypoints
          if (image.keypoints) {
            image.keypoints.forEach((kp) => {
              ctx.beginPath()
              ctx.arc(kp.x, kp.y, 10, 0, 2 * Math.PI)
              ctx.fillStyle = 'hsla(160, 100%, 37%, 0.75)'
              ctx.fill()
              ctx.strokeStyle = 'white'
              ctx.lineWidth = 2
              ctx.stroke()
            })
          }

          // Draw model name at bottom-left
          if (image.modelName) {
            const fontSize = Math.max(12, Math.floor(img.naturalHeight / 50))
            ctx.font = `${fontSize}px sans-serif`
            ctx.lineWidth = 3
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)'
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
            const text = `Model: ${image.modelName}`
            const padding = 10
            const textY = img.naturalHeight - padding
            ctx.strokeText(text, padding, textY)
            ctx.fillText(text, padding, textY)
          }

          resolve(canvas.toDataURL('image/png'))
        }
        img.onerror = reject
        img.src = imageUrl
      })

      filesToSave.push({
        name: `processed_${image.name}.png`,
        data: dataUrl,
        metadata: image.modelName ? { Model: image.modelName } : undefined
      })
    } catch (error) {
      console.error(`Failed to process image ${image.name}:`, error)
    }
  }

  // Now send the complete list to the main process
  if (filesToSave.length > 0) {
    console.log(`Sending ${filesToSave.length} images to the main process to be saved.`)
    const result = await window.api.downloadAllImages(filesToSave)
    alert(result.message) // Show the result to the user
  } else {
    alert('No images were processed to download.')
  }

  isDownloadingAll.value = false
}

// clearing gallery
const confirmDeleteAll = (): void => {
  const isConfirmed = window.confirm(
    'Are you sure you want to delete all images and data from your gallery? This action cannot be undone.'
  )
  if (isConfirmed) {
    imageStore.clearGallery()
  }
}

const deleteSingleImage = (image: ImageFile | null): void => {
  if (!image) return
  imageStore.removeImage(image.inputPath)
}

const downloadAllKeypointData = async (): Promise<void> => {
  alert('Download All DATA functionality to be implemented!')
  isDropdownOpen.value = false
}
async function downloadImage(image: ImageFile | null): Promise<void> {
  if (!image) return

  try {
    const base64Data = await window.api.fs.readFile(image.inputPath)
    const imageUrl = `data:image/png;base64,${base64Data}`

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not create canvas context'))
          return
        }

        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        ctx.drawImage(img, 0, 0)

        // Draw keypoints
        if (image.keypoints && image.keypoints.length > 0) {
          image.keypoints.forEach((kp) => {
            ctx.beginPath()
            ctx.arc(kp.x, kp.y, 10, 0, 2 * Math.PI)
            ctx.fillStyle = 'hsla(160, 100%, 37%, 0.75)'
            ctx.fill()
            ctx.strokeStyle = 'white'
            ctx.lineWidth = 2
            ctx.stroke()
          })
        }

        // Draw model name at bottom-left
        if (image.modelName) {
          const fontSize = Math.max(12, Math.floor(img.naturalHeight / 50))
          ctx.font = `${fontSize}px sans-serif`
          ctx.lineWidth = 3
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)'
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
          const text = `Model: ${image.modelName}`
          const padding = 10
          const textY = img.naturalHeight - padding
          ctx.strokeText(text, padding, textY)
          ctx.fillText(text, padding, textY)
        }

        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = reject
      img.src = imageUrl
    })

    // Embed model metadata into PNG
    let finalDataUrl = dataUrl
    if (image.modelName) {
      const enrichedBase64 = await window.api.fs.embedPngMetadata(dataUrl, {
        Model: image.modelName
      })
      finalDataUrl = `data:image/png;base64,${enrichedBase64}`
    }

    const link = document.createElement('a')
    link.href = finalDataUrl
    link.download = `processed_${image.name}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error(`Error downloading image: ${error}`)
    alert('Failed to download image.')
  }
}
const copyData = (image: ImageFile | null): void => {
  if (!image) return
  alert(`Copying data for ${image.name}... (to be implemented)`)
}

// --- logic for edit keypoint fullscreen modal
const fullscreenImage = ref<ImageFile | null>(null)
const editedKeypoints: Ref<Keypoint[]> = ref([])

function openFullscreen(image: ImageFile): void {
  fullscreenImage.value = image
  const keypoints = image.keypoints
  editedKeypoints.value = JSON.parse(JSON.stringify(keypoints))
}

function closeFullscreen(): void {
  fullscreenImage.value = null
  editedKeypoints.value = []
}

async function saveAndCloseFullscreen(): Promise<void> {
  if (fullscreenImage.value) {
    await imageStore.updateImage(fullscreenImage.value.inputPath, {
      keypoints: editedKeypoints.value
    })
  }
  closeFullscreen()
}

onMounted(() => {
  if (galleryImages.value.length > 0 && !selectedImage.value) {
    imageStore.selectImage(galleryImages.value[0].inputPath, 'gallery')
  }
})
</script>
<style scoped>
.content {
  width: 100%;
  height: calc(100vh - 140px);
  display: flex;
  align-items: stretch;
  gap: 1rem;
  overflow: hidden;
}
.gallery-left {
  width: 250px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.list-container {
  flex-grow: 1;
  overflow-y: auto;
  min-height: 0;
  max-height: 40vh;
}

.gallery-right {
  flex-grow: 1;
  min-width: 0;
}

.action-bar {
  padding-bottom: 0.5rem;
}

.action-bar .dropdown-container {
  flex-grow: 1;
}

.gallery-image {
  user-select: none;
  -webkit-user-drag: none;
  width: 100%;
  height: auto;
  object-fit: contain;
  cursor: pointer;
  max-height: 65vh;
}

.danger-btn {
  background-color: #ff4d4d;
  color: white;
}

.danger-btn:hover {
  background-color: #cc0000;
}

.danger-btn.discreet-btn {
  background-color: transparent;
  color: #ff4d4d;
}

.danger-btn.discreet-btn:hover {
  background-color: rgba(255, 77, 77, 0.1);
  color: #cc0000;
}

.dropdown-menu.glass-panel {
  box-shadow: none;
}

.dropdown-container {
  position: relative;
}
.dropdown-menu {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  width: 100%;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 0.5rem;
  border-radius: var(--br);
}
.model-info {
  font-size: var(--fs-sm);
  opacity: 0.8;
  padding: 0 0.25rem;
}

.glass-preview {
  align-self: flex-start;
  flex-shrink: 0;
  max-width: 100%;
}
.fullscreen-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.fullscreen-content {
  display: flex;
  flex-direction: column;
  gap: var(--sp1);
}
.fullscreen-image {
  width: 80vw;
  height: auto;
  border-radius: var(--br);
  object-fit: contain;
}
.fullscreen-buttons {
  padding: var(--sp1);
  background-color: var(--bg-col);
  border-radius: var(--br);
}

.measurements-panel {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.measurements-title {
  font-size: var(--fs-sm);
  font-weight: 600;
  opacity: 0.9;
}

.measurements-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.2rem 1rem;
  font-size: var(--fs-sm);
}

.measurement-value {
  color: var(--txt-col);
  opacity: 0.8;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
