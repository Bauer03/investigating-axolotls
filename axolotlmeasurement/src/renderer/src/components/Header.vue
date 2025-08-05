<template>
  <nav class="flx">
    <div class="nav flx">
      <router-link to="/">Input</router-link>
      <router-link to="/validate">Validate</router-link>
      <router-link to="/gallery">Gallery</router-link>
    </div>
  </nav>
</template>

<script setup lang="ts"></script>

<style scoped>
/* Enhanced Header.vue styles */
nav {
  justify-content: flex-end;
  padding: var(--sp1) var(--sp2);
  background-color: var(--bg-col-alt);
  border-radius: var(--br);
}

.nav {
  justify-items: center;
  align-items: center;
  padding: var(--sp05);
  gap: var(--sp1);

  /* Enhanced glass effect - this and below glass effects pulled from https://hype4.academy/tools/glassmorphism-generator  */
  background: linear-gradient(135deg, rgba(185, 185, 185, 0.6) 0%, rgba(185, 185, 185, 0.2) 100%);
  backdrop-filter: blur(15px) saturate(1.2);
  -webkit-backdrop-filter: blur(15px) saturate(1.2);

  /* Glass-like borders and shadows */
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 0 -1px 0 rgba(255, 255, 255, 0.1);

  color: var(--txt-col);
  border-radius: var(--br);
  position: relative;
  overflow: hidden;

  transition:
    background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    color 0.3s cubic-bezier(0.6, 0, 0.2, 1),
    border 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  a {
    padding: 0.7rem var(--sp2);
    font-size: var(--fs-lg);
    border-radius: var(--br);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  /* Hover effect for links */
  a:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    &:not(.router-link-exact-active) {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  /* Add a subtle shine effect */
  a::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  a:hover::before {
    left: 100%;
  }
}

/* Enhanced active link styling */
.router-link-exact-active {
  background: linear-gradient(135deg, rgba(228, 113, 36, 0.9) 0%, rgba(228, 113, 36, 0.7) 100%);
  color: var(--bg-col-alt);
  box-shadow:
    0 4px 16px rgba(228, 113, 36, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.router-link-exact-active:hover {
  background: linear-gradient(135deg, rgba(228, 113, 36, 1) 0%, rgba(228, 113, 36, 0.8) 100%);
  box-shadow:
    0 6px 20px rgba(228, 113, 36, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

/* Optional: Add a subtle glow to the entire nav on hover */
.nav:hover {
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -1px 0 rgba(255, 255, 255, 0.2);
}
</style>
