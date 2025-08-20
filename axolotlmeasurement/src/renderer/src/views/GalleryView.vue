<template>
  <div v-if="galleryImages.length <= 0">
    <span>
      You don't have any images in your gallery. Head to the 'input' tab to get started!
    </span>
  </div>

  <div v-else class="content flx gp1 pd1 pt2">
    <div class="gallery-left flx col gp1">
      <h3 class="txt-col">Your Images</h3>
      <div class="flx col gp05">
        <div
          v-for="image in galleryImages"
          :key="image.data?.image_name"
          :class="{ selected: selectedImage?.inputPath === image.inputPath }"
          class="glass-list-item"
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
        <button class="discreet-btn flx gp05 al-c">
          <span class="material-icons-outlined">download</span>
          Export Data
        </button>
        <button class="discreet-btn flx gp05 al-c">
          <span class="material-icons-outlined">share</span>
          Share Results
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
import { ImageFile, Keypoint } from 'src/types'
import KeypointDisplay from '../components/KeypointDisplay.vue'

const imageStore = useImageStore()
const galleryImages = computed(() => imageStore.galleryList)
const selectedImage = computed(() => imageStore.selectedGalleryImage)

const fullscreenImage = ref<ImageFile | null>(null)
const editedKeypoints: Ref<Keypoint[]> = ref([])

function openFullscreen(image: ImageFile): void {
  fullscreenImage.value = image
  // Parse keypoints if they're stored as string, otherwise use as is
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
.gallery-image {
  object-fit: cover;
  height: 250px;
  max-width: 50vw;
  cursor: pointer;
}

.gallery-left {
  width: max-content;
}

.content {
  width: 100%;
  display: flex;
  gap: var(--gp1);
  justify-content: space-between;
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
