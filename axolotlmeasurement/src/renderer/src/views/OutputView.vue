<template>
  <div v-if="processedImages.length === 0" class="container h-full flx col jc-c txt-l gp2">
    <h3>Looks like you haven’t sent any images to the model yet!</h3>
    <h3>
      Head to the <span class="italic">Input</span> tab and upload some images to get started. When
      they've been through the model, they'll end up here.
    </h3>
  </div>

  <div v-else class="flx col">
    <div v-for="image in processedImages" :key="image.inputPath">
      <span>Image name is {{ image.data?.image_name }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useImageStore } from '../stores/imageStore'
import { ImageFile } from 'src/types'
import { computed } from 'vue'

const imageStore = useImageStore()

const processedImages = computed(() => {
  return imageStore.imageList.filter((img: ImageFile) => {
    return img.processed && !img.verified
  })
})
</script>

<style scoped>
.container {
  max-width: 500px;
}
</style>
