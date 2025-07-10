<template>
  <div v-if="outputImages.length === 0" class="container h-full flx col jc-c txt-l gp2">
    <h3>Looks like you haven’t sent any images to the model yet!</h3>
    <h3>
      Head to the <span class="italic">Input</span> tab and upload some images to get started. When
      they've been through the model, they'll end up here.
    </h3>
  </div>
  <div v-else class="flx col">
    <span>yaay images</span>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useImageStore } from '../stores/imageStore'
import { ImageFile } from 'src/types'
let outputImages: ImageFile[] = [] // change this to a ref eventually, i'm just lazy and avoiding errors for now

const imageStore = useImageStore()

onMounted(() => {
  outputImages = imageStore.imageList.filter((img) => {
    return img.outputImage.outputPath !== undefined
  })
})
</script>

<style scoped>
.container {
  max-width: 500px;
}
</style>
