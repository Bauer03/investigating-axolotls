<template>
  <div v-if="imagesToValidate.length <= 0" class="pd4">
    <span> You currently have no images to validate. Head to the 'input' tab to get started! </span>
  </div>

  <div v-else class="content flx pd1 pt2">
    <div class="validate-left flx col gp05">
      <h3 class="txt-col">{{ headertext }}</h3>
      <div class="action-bar flx jc-sb">
        <button class="danger-btn discreet-btn flx al-c jc-c gp1" @click="confirmClearValidation()">
          <span class="material-icons-outlined">delete_sweep</span>
          <span>Clear List</span>
        </button>
      </div>

      <div class="flx col gp05 list-container">
        <transition-group>
          <div
            v-for="image in imagesToValidate"
            :key="image.inputPath"
            class="glass-list-item flx al-c jc-sb"
            :class="{ selected: selectedImage?.inputPath === image.inputPath }"
            @click="imageStore.selectImage(image.inputPath, 'validation')"
          >
            <span>{{ image.name }}</span>
            <button class="discreet-btn list-delete-btn" @click.stop="deleteSingleImage(image)">
              <span class="material-icons-outlined">delete</span>
            </button>
          </div>
        </transition-group>
      </div>
    </div>

    <div class="validate-right flx col gp1">
      <div class="glass-preview flx">
        <KeypointDisplay
          v-if="selectedImage"
          :image-src="selectedImage.inputPath"
          :keypoints="selectedImage.keypoints"
          class="selected-image validate-image"
          @click="openFullscreen(selectedImage)"
        />
      </div>

      <div class="glass-panel pd1">
        <div class="validation-controls flx gp1 jc-end">
          <button class="discreet-btn flx gp05 al-c" @click="editKeypoints(selectedImage)">
            <span class="material-icons-outlined">edit</span>
            Edit Keypoints
          </button>
          <button class="accent-btn flx gp05 al-c" @click="confirmImage(selectedImage)">
            <span class="material-icons-outlined">check</span>
            Validate Image
          </button>
        </div>
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
import { computed, ComputedRef, onMounted, ref, Ref } from 'vue'
import { ImageFile, Keypoint } from 'src/types'
import KeypointDisplay from '../components/KeypointDisplay.vue'
const headertext: ComputedRef<string> = computed(() => {
  return (
    'Validating ' +
    imageStore.validationList.length +
    (imageStore.validationList.length === 1 ? ' image' : ' images')
  )
})

const imageStore = useImageStore()
const selectedImage = computed(() => imageStore.selectedValidationImage)

// 'to validate' images have been passed through model, but have yet to be verified by user.
const imagesToValidate = computed(() => {
  return imageStore.imageList.filter((img: ImageFile) => img.processed && !img.verified)
})

const confirmClearValidation = (): void => {
  const isConfirmed = window.confirm(
    'Are you sure you want to remove all images from this validation list?'
  )
  if (isConfirmed) {
    imageStore.clearValidationList()
  }
}

const deleteSingleImage = (image: ImageFile): void => {
  // removeImage handles the logic in the store
  imageStore.removeImage(image.inputPath)
}

function editKeypoints(image: ImageFile | null): void {
  if (image) {
    openFullscreen(image)
  }
}

async function confirmImage(image: ImageFile | null): Promise<void> {
  if (image) {
    const keypointsToSave = image.data?.keypoints || []
    await imageStore.updateImage(image.inputPath, {
      verified: true,
      data.keypoints = keypointsToSave
    })
    imageStore.selectImage(imageStore.validationList[0].inputPath, 'validation')
  }
}

// --- Fullscreen modal logic ---
const fullscreenImage = ref<ImageFile | null>(null)
const editedKeypoints: Ref<Keypoint[]> = ref([])

function openFullscreen(image: ImageFile): void {
  fullscreenImage.value = image
  const keypoints = image.data?.keypoints
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
  if (imagesToValidate.value.length > 0 && !selectedImage.value) {
    imageStore.selectImage(imagesToValidate.value[0].inputPath, 'validation')
  }
})
</script>

<style scoped>
.validate-left {
  width: 250px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.list-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  max-height: 40vh;
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
.glass-preview {
  align-self: flex-start;
  flex-shrink: 0;
  max-width: 100%;
}
.validate-right {
  flex-grow: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden; /* contain content */
}
.content {
  width: 100%;
  height: calc(100vh - 140px);
  display: flex;
  align-items: stretch;
  gap: 1rem;
  overflow: hidden;
}
.action-bar {
  padding-bottom: 0.5rem;
}
.action-bar .danger-btn {
  width: 100%;
}
.validate-image {
  width: 100%;
  height: auto;
  object-fit: contain;
  cursor: pointer;
  max-height: 65vh;
}

/* --- New styles for list item delete button --- */
.list-delete-btn {
  padding: 2px;
  line-height: 0;
  border-radius: 50%;
}
.list-delete-btn .material-icons-outlined {
  font-size: 18px;
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
