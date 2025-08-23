<template>
  <div class="keypoint-container">
    <img
      ref="imageRef"
      :src="imageSrc"
      alt="Keypoint image"
      class="display-image"
      @load="updateImageDimensions"
    />
    <div
      v-for="(point, index) in scaledKeypoints"
      :key="index"
      class="keypoint-dot"
      :class="{ editable: isEditable }"
      :style="{ left: `${point.x}px`, top: `${point.y}px` }"
      @mousedown="startDrag($event, index)"
    >
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

const emit = defineEmits(['update:keypoints']) // Define the event we will emit

const imageRef = ref<HTMLImageElement | null>(null)
const displayedWidth = ref(0)
const displayedHeight = ref(0)
const naturalWidth = ref(0)
const naturalHeight = ref(0)

// State for dragging logic
const draggingIndex = ref<number | null>(null)

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
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}

function onDrag(event: MouseEvent): void {
  if (draggingIndex.value === null || !imageRef.value || !props.keypoints) return

  const rect = imageRef.value.getBoundingClientRect()

  // Mouse position relative to the displayed image
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  // Convert mouse position back to the original image's scale
  let newX = mouseX / scaleX.value
  let newY = mouseY / scaleY.value

  // Clamp the values to stay within the image boundaries
  newX = Math.max(0, Math.min(newX, naturalWidth.value))
  newY = Math.max(0, Math.min(newY, naturalHeight.value))

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
  max-width: 100%;
  height: auto;
  opacity: 0.8;
}

.keypoint-dot {
  position: absolute;
  width: 12px;
  height: 12px;
  background-color: hsla(160, 100%, 37%, 0.75);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  border: 1px solid white;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  pointer-events: none; /* non-interactive by default*/
}

/* active when dots are editable */
.keypoint-dot.editable {
  pointer-events: auto; /*clickable */
  cursor: grab;
}

.keypoint-dot.editable:active {
  cursor: grabbing;
}

.keypoint-label {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 10px;
  white-space: nowrap;
}
</style>
