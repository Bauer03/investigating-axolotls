<template>
  <div class="content flx gp2 pd2">
    <div class="validate-left glass-sidebar flx col gp1 pd2">
      <h3 class="txt-col">Images to Validate</h3>
      <div class="flx col gp05">
        <div
          v-for="image in processedImages"
          :key="image.inputPath"
          class="glass-list-item pd1"
          :class="{ selected: selectedImage?.inputPath === image.inputPath }"
          @click="newSelectedImage(image)"
        >
          <span>{{ image.data?.image_name }}</span>
        </div>
      </div>
    </div>

    <div class="validate-right flx col gp2 flex-1">
      <div class="glass-preview">
        <img
          :src="selectedImage?.inputPath || ''"
          alt="Preview of model's keypoint distribution"
          class="validate-preview w-full"
          style="display: block; max-height: 60vh; object-fit: contain"
        />
      </div>

      <div class="glass-panel pd2">
        <div class="validation-controls flx gp1 jc-c">
          <button class="discreet-btn flx gp05 al-c">
            <span class="material-icons-outlined">edit</span>
            Edit Keypoints
          </button>
          <button class="accent-btn flx gp05 al-c">
            <span class="material-icons-outlined">check</span>
            Validate Image
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
const selectedImage = ref<ImageFile | null>(null) // initialized to first image in list returned

// TODO: add global indicator that there are images to validate. that way, i can easily separate validate view from output view.
const processedImages = computed(() => {
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
