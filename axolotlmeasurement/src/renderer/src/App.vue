<script setup lang="ts">
import Header from './components/Header.vue'
import { onMounted } from 'vue'
import { useImageStore } from './stores/imageStore'

const imageStore = useImageStore()

onMounted(async () => {
  const allImages = await window.api.getDBImages()
  await imageStore.addImages(allImages)
  await imageStore.loadExistingImages()
})
</script>

<template>
  <Header></Header>
  <main class="main-content flx jc-c">
    <RouterView />
  </main>
</template>

<style>
.main-content {
  flex: 1;
}
</style>
