<template>
  <div class="content flx gp2 pd2">
    <div class="gallery-left glass-sidebar flx col gp1 pd2">
      <h3 class="txt-col">Verified Images</h3>
      <div class="flx col gp05">
        <div
          v-for="image in verifiedImages"
          :key="image.inputPath"
          :class="{ selected: selectedImage?.inputPath === image.inputPath }"
          class="glass-list-item pd1"
          @click="newSelectedImage(image)"
        >
          <span>{{ image.data?.image_name }}</span>
        </div>
      </div>
    </div>

    <div class="gallery-right flx col gp2 flex-1">
      <div class="glass-preview">
        <img
          :src="selectedImage?.inputPath || 'icon.png'"
          alt="Preview of model's keypoint distribution"
          class="gallery-preview w-full"
          style="display: block; max-height: 60vh; object-fit: contain;"
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
import { computed, ref } from 'vue'

const imageStore = useImageStore()
const selectedImage = ref<ImageFile | null>(null)

// TODO: add global indicator that there are images to validate. that way, i can easily separate validate view from output view.
const verifiedImages = computed(() => {
  return imageStore.imageList.filter((img: ImageFile) => {
    return img.processed && !img.verified
  })
})

function newSelectedImage(newImg: ImageFile): void {
  if (newImg) {
    selectedImage.value = newImg
  }
}
</script>
