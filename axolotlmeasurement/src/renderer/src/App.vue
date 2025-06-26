<script setup lang="ts">
import Header from './components/Header.vue'
</script>

<template>
  <Header></Header>
  <main class="main-content flx jc-c">
    <router-view></router-view>
  </main>
</template>

<style>
.main-content {
  flex: 1;
}
</style>
