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
            :class="{ selected: imageStore.selectedToValidate?.inputPath === image.inputPath }"
            @click="imageStore.selectImage(image.inputPath, 'verify')"
          >
            <span>{{ image.name }}</span>
          </div>
        </transition-group>
      </div>
    </div>

    <div class="validate-right flx col gp1">
      <div class="glass-preview">
        <img
          :src="imageStore.selectedToValidate?.inputPath || ''"
          alt="Preview of model's keypoint distribution"
          class="validate-image w-full"
        />
      </div>

      <div class="glass-panel pd1">
        <div class="validation-controls flx gp1 jc-end">
          <button
            class="discreet-btn flx gp05 al-c"
            @click="editKeypoints(imageStore.selectedToValidate?.inputPath)"
          >
            <span class="material-icons-outlined">edit</span>
            Edit Keypoints
          </button>
          <button
            class="accent-btn flx gp05 al-c"
            @click="confirmImage(imageStore.selectedToValidate?.inputPath)"
          >
            <span class="material-icons-outlined">check</span>
            Validate Image
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useImageStore } from '../stores/imageStore'
import { ImageFile } from 'src/types'
import { computed, ComputedRef, ref } from 'vue'

const imageStore = useImageStore()
let curKeypoints = ref<string>('')

// 'to validate' images have been passed through model, but have yet to be verified by user.
// 'img.verified' is set to true when user confirms or corrects model keypoints. since computed, will update automatically.
const imagesToValidate: ComputedRef<ImageFile[]> = computed(() => {
  return imageStore.imageList.filter((img: ImageFile) => {
    return img.processed && !img.verified
  })
})

function editKeypoints(inputPath?: string): void {
  // find image in imagestore.
  // req fullscreen, with painted keypoints onto image.
  // display keypoints-annotated image, where keypoints can be changed
  // add 'confirm keypoints' button
  // onclick of button, save new keypoints, toggle fullscreen.
  console.log('editing keypoints for: ' + inputPath)
}

function confirmImage(inputPath?: string): void {
  // get image from image store.
  const confimg = imageStore.imageList.find((img: ImageFile) => img.inputPath === inputPath)
  if (confimg && curKeypoints) {
    imageStore.updateImageVerification(confimg.inputPath, {
      verified: true,
      keypoints: JSON.stringify(curKeypoints.value)
    })
  }
  // call imageStore.updateImageVerification(). Pass in inputPath, and then associated model-returned keypoints.
  console.log('Sending to gallery: ' + inputPath)
}
</script>
<style scoped>
.validate-image {
  object-fit: contain;
  aspect-ratio: 16/9;
  max-width: 50vw;
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
</style>
