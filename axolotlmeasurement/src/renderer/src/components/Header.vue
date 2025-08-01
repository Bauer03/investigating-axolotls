<template>
  <nav class="flx">
    <router-link to="/">Input</router-link>
    <router-link to="/output">Output</router-link>
  </nav>
</template>

<script setup lang="ts"></script>

<style scoped>
nav {
  justify-content: flex-end;
  padding: var(--sp2) var(--sp4);
  gap: var(--sp4);
  background-color: var(--bg-col-alt);
  color: var(--txt-col);

  a {
    font-size: var(--fs-lg);
  }
}

.router-link-exact-active {
  color: var(--accent-col);
}
</style>
