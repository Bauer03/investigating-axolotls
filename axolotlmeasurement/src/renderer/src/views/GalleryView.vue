<template>
  <div v-if="galleryImages.length <= 0">
    <span>
      You don't have any images in your gallery. Head to the 'input' tab to get started!
    </span>
  </div>
  <div v-else class="content flx gp2 pd2">
    <div class="gallery-left glass-sidebar flx col gp1 pd2">
      <h3 class="txt-col">Verified Images</h3>
      <div class="flx col gp05">
        <div
          v-for="image in galleryImages"
          :key="image.inputPath"
          :class="{ selected: selectedImage?.inputPath === image.inputPath }"
          class="glass-list-item pd1"
          @click="newSelectedImage(image)"
        >
          <span>{{ image.data?.image_name }}</span>
        </div>
      </div>
    </div>

    <div class="gallery-right flx col gp2">
      <div class="glass-preview">
        <img
          :src="selectedImage?.inputPath || 'icon.png'"
          alt="Preview of model's keypoint distribution"
          class="gallery-image w-full"
        />
      </div>

      <div class="glass-panel pd2">
        <h4 class="txt-col">Gallery Controls</h4>
        <div class="flx gp1">
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
  </div>
</template>
<script setup lang="ts">
import { useImageStore } from '../stores/imageStore'
import { ImageFile } from 'src/types'
import { computed, ref, ComputedRef } from 'vue'

const imageStore = useImageStore()
const selectedImage = ref<ImageFile | null>(null)

// galleryImages are all images which have been passed through the model AND verfied by the user.
const galleryImages: ComputedRef<ImageFile[]> = computed(() => {
  return imageStore.imageList.filter((img: ImageFile) => {
    return img.processed && img.verified
  })
})

function newSelectedImage(newImg: ImageFile): void {
  if (newImg) {
    selectedImage.value = newImg
  }
}
</script>
<style scoped>
.gallery-image {
  object-fit: contain;
  max-width: 40vw;
  height: 40vw;
}
</style>
