<script setup lang="ts">
import Header from './components/Header.vue'
import { onMounted } from 'vue'
import { useImageStore } from './stores/imageStore'

const imageStore = useImageStore()

onMounted(async () => {
  await imageStore.loadExistingImages()
})
</script>

<template>
  <Header></Header>
  <div class="router-view-wrapper">
    <RouterView />
  </div>
</template>

<style>
.router-view-wrapper {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
