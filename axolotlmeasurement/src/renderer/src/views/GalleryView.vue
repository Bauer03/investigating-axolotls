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
            <div @click="downloadAllImageData" class="glass-list-item">
              Images <span class="material-icons-outlined">download</span>
            </div>
            <div @click="downloadAllKeypointData" class="glass-list-item">
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
          :key="image.data?.image_name"
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
          :keypoints="
            typeof selectedImage.keypoints === 'string'
              ? JSON.parse(selectedImage.keypoints)
              : selectedImage.keypoints
          "
          class="selected-image gallery-image"
          @click="openFullscreen(selectedImage)"
        />
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

const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const toggleDropdown = (): void => {
  isDropdownOpen.value = !isDropdownOpen.value
}
onClickOutside(dropdownRef, () => {
  isDropdownOpen.value = false
})

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

// --- Placeholder functions (unchanged) ---
const downloadAllImageData = async (): Promise<void> => {
  alert('Download All IMAGES functionality to be implemented!')
  isDropdownOpen.value = false
}
const downloadAllKeypointData = async (): Promise<void> => {
  alert('Download All DATA functionality to be implemented!')
  isDropdownOpen.value = false
}
const downloadImage = (image: ImageFile | null): void => {
  if (!image) return
  alert(`Downloading ${image.name}... (to be implemented)`)
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
  const keypoints =
    typeof image.keypoints === 'string' ? JSON.parse(image.keypoints) : image.keypoints || []
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
</style>
