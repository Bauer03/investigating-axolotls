<template>
  <div class="content flx gp1">
    <div class="gallery-left">
      <div v-for="image in verifiedImages" :key="image.inputPath" @click="newSelectedImage(image)">
        <span>Image name is {{ image.data?.image_name }}</span>
      </div>
    </div>
    <div class="gallery-right flx col gp1">
      <img
        :src="selectedImage?.inputPath || 'icon.png'"
        alt="Preview of model's keypoint distribution"
        class="gallery-preview"
      />
      <div class="flx gp1">this will contain the contents of the user's gallery</div>
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
