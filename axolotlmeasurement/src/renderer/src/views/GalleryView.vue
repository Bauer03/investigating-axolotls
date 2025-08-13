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
      <div class="glass-preview">
        <img
          :src="selectedImage?.inputPath || ''"
          alt="Preview of model's keypoint distribution"
          class="gallery-image w-full"
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
</template>

<script setup lang="ts">
import { useImageStore } from '../stores/imageStore'
import { computed, onMounted } from 'vue'

const imageStore = useImageStore()
const galleryImages = computed(() => imageStore.galleryList)
const selectedImage = computed(() => imageStore.selectedGalleryImage)

onMounted(() => {
  if (galleryImages.value.length > 0 && !selectedImage.value) {
    imageStore.selectImage(galleryImages.value[0].inputPath, 'gallery')
  }
})
</script>

<style scoped>
.gallery-image {
  object-fit: contain;
  aspect-ratio: 16/9;
  max-width: 50vw;
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
</style>
