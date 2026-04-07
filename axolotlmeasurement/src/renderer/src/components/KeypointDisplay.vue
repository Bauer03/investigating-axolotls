<template>
  <div class="keypoint-container" :style="containerZoomStyle">
    <img
      ref="imageRef"
      :src="safeImageSrc"
      alt="Keypoint image"
      class="display-image"
      @load="updateImageDimensions"
    />
    <div
      v-for="(point, index) in scaledKeypoints"
      :key="index"
      class="keypoint-wrapper"
      :style="{ left: `${point.x}px`, top: `${point.y}px` }"
    >
      <svg
        class="keypoint-pin"
        :class="{ editable: isEditable }"
        width="8"
        height="12"
        viewBox="0 0 16 24"
        xmlns="http://www.w3.org/2000/svg"
        @mousedown="startDrag($event, index)"
      >
        <path
          d="M8 23 C4 18 0 14 0 8 A8 8 0 0 1 16 8 C16 14 12 18 8 23 Z"
          fill="hsla(160, 100%, 37%, 0.85)"
          stroke="white"
          stroke-width="1.5"
        />
      </svg>
      <span class="keypoint-label">{{ point.name }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Keypoint } from 'src/types'

const props = defineProps<{
  imageSrc: string
  keypoints?: Keypoint[]
  isEditable?: boolean // enable/disable editing
}>()

// Convert a raw local file path to our custom protocol URL so Electron serves
// it correctly, even when the path contains spaces or special characters.
const safeImageSrc = computed(() => {
  const src = props.imageSrc
  if (!src) return ''
  // Already a data URL or custom protocol — pass through unchanged
  if (src.startsWith('data:') || src.startsWith('axolotl-file://')) return src
  // Convert Windows backslashes, then percent-encode the path component only
  const normalized = src.replace(/\\/g, '/')
  return 'axolotl-file://' + normalized.split('/').map(encodeURIComponent).join('/')
})

const emit = defineEmits(['update:keypoints', 'zoom-changed'])

const imageRef = ref<HTMLImageElement | null>(null)
const displayedWidth = ref(0)
const displayedHeight = ref(0)
const naturalWidth = ref(0)
const naturalHeight = ref(0)

// State for dragging logic
const draggingIndex = ref<number | null>(null)
const lastMouseX = ref(0)
const lastMouseY = ref(0)

// Zoom state
const zoomActive = ref(false)
const zoomScale = 2
const zoomOriginX = ref(50) // % within container
const zoomOriginY = ref(50)

const containerZoomStyle = computed(() => {
  if (!zoomActive.value) return {}
  return {
    transform: `scale(${zoomScale})`,
    transformOrigin: `${zoomOriginX.value}% ${zoomOriginY.value}%`
  }
})

function resetZoom(): void {
  zoomActive.value = false
  emit('zoom-changed', false)
}

defineExpose({ resetZoom })

const updateImageDimensions = (): void => {
  if (imageRef.value) {
    displayedWidth.value = imageRef.value.clientWidth
    displayedHeight.value = imageRef.value.clientHeight
    naturalWidth.value = imageRef.value.naturalWidth
    naturalHeight.value = imageRef.value.naturalHeight
  }
}

const scaleX = computed(() =>
  naturalWidth.value > 0 ? displayedWidth.value / naturalWidth.value : 0
)
const scaleY = computed(() =>
  naturalHeight.value > 0 ? displayedHeight.value / naturalHeight.value : 0
)

const scaledKeypoints = computed(() => {
  if (!props.keypoints || !scaleX.value || !scaleY.value) {
    return []
  }
  return props.keypoints.map((kp) => ({
    ...kp,
    x: kp.x * scaleX.value,
    y: kp.y * scaleY.value
  }))
})

// following logic on drag and drop not mine, pasted & modified from csci432
function startDrag(event: MouseEvent, index: number): void {
  if (!props.isEditable) return
  event.preventDefault()
  draggingIndex.value = index

  // Activate zoom centered on the clicked keypoint (only on first click)
  if (!zoomActive.value) {
    const kp = scaledKeypoints.value[index]
    zoomOriginX.value = displayedWidth.value > 0 ? (kp.x / displayedWidth.value) * 100 : 50
    zoomOriginY.value = displayedHeight.value > 0 ? (kp.y / displayedHeight.value) * 100 : 50
    zoomActive.value = true
    emit('zoom-changed', true)
  }

  // Record starting mouse position for delta-based dragging (avoids snap-to-cursor)
  lastMouseX.value = event.clientX
  lastMouseY.value = event.clientY

  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}

function onDrag(event: MouseEvent): void {
  if (draggingIndex.value === null || !imageRef.value || !props.keypoints) return

  const rect = imageRef.value.getBoundingClientRect()

  // Use delta from last position so the keypoint moves with the cursor without snapping
  const dx = event.clientX - lastMouseX.value
  const dy = event.clientY - lastMouseY.value
  lastMouseX.value = event.clientX
  lastMouseY.value = event.clientY

  // Convert screen-pixel delta to natural image coords (rect.width accounts for CSS zoom)
  const naturalDx = (dx / rect.width) * naturalWidth.value
  const naturalDy = (dy / rect.height) * naturalHeight.value

  const kp = props.keypoints[draggingIndex.value]
  let newX = Math.max(0, Math.min(kp.x + naturalDx, naturalWidth.value))
  let newY = Math.max(0, Math.min(kp.y + naturalDy, naturalHeight.value))

  // Create a new keypoints array with the updated position
  const newKeypoints = [...props.keypoints]
  newKeypoints[draggingIndex.value] = {
    ...newKeypoints[draggingIndex.value],
    x: newX,
    y: newY
  }

  // Emit the change to the parent component
  emit('update:keypoints', newKeypoints)
}

function stopDrag(): void {
  draggingIndex.value = null
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
}

const resizeObserver = new ResizeObserver(updateImageDimensions)

onMounted(() => {
  if (imageRef.value) {
    resizeObserver.observe(imageRef.value)
  }
})

onUnmounted(() => {
  if (imageRef.value) {
    resizeObserver.unobserve(imageRef.value)
  }
  // Clean up window event listeners in case a drag is interrupted
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
})
</script>

<style scoped>
.keypoint-container {
  position: relative;
  display: inline-block;
  line-height: 0;
}

.display-image {
  user-select: none;
  -webkit-user-drag: none;
  max-width: 100%;
  height: auto;
  opacity: 0.8;
}

.keypoint-wrapper {
  position: absolute;
  transform: translate(-50%, -100%); /* tip (bottom-center of SVG) sits at coordinate */
  pointer-events: none;
}

.keypoint-pin {
  display: block;
  filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.5));
  pointer-events: none;
}

/* active when dots are editable */
.keypoint-pin.editable {
  pointer-events: auto;
  cursor: grab;
}

.keypoint-pin.editable:active {
  cursor: grabbing;
}

.keypoint-label {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 7px 6px;
  border-radius: 3px;
  font-size: 10px;
  white-space: nowrap;
}
</style>
