<template>
  <div v-if="imagesToValidate.length <= 0" class="pd4">
    <span> You currently have no images to validate. Head to the 'input' tab to get started! </span>
  </div>

  <div v-else class="content flx gp1 pd1 pt2">
    <div class="validate-left flx col gp1">
      <h3 class="txt-col">Images to Validate</h3>
      <div class="flx col gp05">
        <!-- haven't implemented this yet, but will allow transitions -->
        <transition-group>
          <div
            v-for="image in imagesToValidate"
            :key="image.inputPath"
            class="glass-list-item"
            :class="{ selected: imageStore.selectedValidationImage?.inputPath === image.inputPath }"
            @click="imageStore.selectImage(image.inputPath, 'validation')"
          >
            <span>{{ image.name }}</span>
          </div>
        </transition-group>
      </div>
    </div>

    <div class="validate-right flx col gp1">
      <div class="glass-preview flx">
        <img
          :src="selectedImage?.inputPath || ''"
          alt="selected image"
          class="selected-image validate-image"
          @click="selectedImage && openFullscreen(selectedImage)"
        />
      </div>

      <div class="glass-panel pd1">
        <div class="validation-controls flx gp1 jc-end">
          <button
            class="discreet-btn flx gp05 al-c"
            @click="editKeypoints(imageStore.selectedValidationImage?.inputPath)"
          >
            <span class="material-icons-outlined">edit</span>
            Edit Keypoints
          </button>
          <button
            class="accent-btn flx gp05 al-c"
            @click="confirmImage(imageStore.selectedValidationImage?.inputPath)"
          >
            <span class="material-icons-outlined">check</span>
            Validate Image
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-if="fullscreenImage" class="fullscreen-modal" @click.self="closeFullscreen">
    <div class="fullscreen-content">
      <img :src="fullscreenImage.inputPath" alt="Fullscreen Image" class="fullscreen-image" />
      <div class="fullscreen-buttons flx gp1 jc-end">
        <button class="discreet-btn" @click="closeFullscreen">Cancel</button>
        <button class="accent-btn" @click="saveAndCloseFullscreen">Save and Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useImageStore } from '../stores/imageStore'
import { computed, onMounted, ref, Ref } from 'vue'
import { ImageFile, Keypoint } from 'src/types'

const imageStore = useImageStore()
const validationImages = computed(() => imageStore.validationList)
const selectedImage = computed(() => imageStore.selectedValidationImage)

const fullscreenImage = ref<ImageFile | null>(null)
const editedKeypoints: Ref<Keypoint[]> = ref([])

function openFullscreen(image: ImageFile): void {
  fullscreenImage.value = image
  // Parse keypoints if they're stored as string, otherwise use as-is
  const keypoints =
    typeof image.keypoints === 'string' ? JSON.parse(image.keypoints) : image.keypoints || []
  editedKeypoints.value = JSON.parse(JSON.stringify(keypoints))
}

function closeFullscreen(): void {
  fullscreenImage.value = null
  editedKeypoints.value = []
}

async function saveAndCloseFullscreen(): Promise<void> {
  if (fullscreenImage.value) {
    await imageStore.updateImage(fullscreenImage.value.inputPath, {
      keypoints: editedKeypoints.value
    })
  }
  closeFullscreen()
}

// 'to validate' images have been passed through model, but have yet to be verified by user.
// 'img.verified' is set to true when user confirms or corrects model keypoints. since computed, will update automatically.
const imagesToValidate = computed(() => {
  return imageStore.imageList.filter((img: ImageFile) => {
    return img.processed && !img.verified
  })
})

function editKeypoints(inputPath?: string): void {
  const imageToEdit = imageStore.imageList.find((img: ImageFile) => img.inputPath === inputPath)
  if (imageToEdit) {
    openFullscreen(imageToEdit)
  }
  console.log('editing keypoints for: ' + inputPath)
}

function confirmImage(inputPath?: string): void {
  const confimg = imageStore.imageList.find((img: ImageFile) => img.inputPath === inputPath)
  if (confimg) {
    const keypointsToSave = confimg.data?.keypoints || []
    imageStore.updateImage(confimg.inputPath, {
      verified: true,
      keypoints: keypointsToSave
    })
  }
}

onMounted(() => {
  if (validationImages.value.length > 0 && !selectedImage.value) {
    imageStore.selectImage(validationImages.value[0].inputPath, 'validation')
  }
})
</script>

<style scoped>
.validate-image {
  object-fit: cover;
  height: 250px;
  max-width: 50vw;
  cursor: pointer;
}

.validate-left {
  width: max-content;
}

.content {
  width: 100%;
  display: flex;
  gap: var(--gp1);
  justify-content: space-between;
}

.fullscreen-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.fullscreen-content {
  display: flex;
  flex-direction: column;
  gap: var(--sp1);
}

.fullscreen-image {
  width: 80vw;
  height: auto;
  border-radius: var(--br);
  object-fit: contain;
}

.fullscreen-buttons {
  padding: var(--sp1);
  background-color: var(--bg-col);
  border-radius: var(--br);
}
</style>
