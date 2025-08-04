import { createRouter, createWebHashHistory } from 'vue-router'
import InputView from '../views/InputView.vue'

const routes = [
  {
    path: '/',
    name: 'Input',
    component: InputView
  },
  {
    path: '/validate',
    name: 'Validate',
    component: () => import('../views/ValidateView.vue')
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: () => import('../views/GalleryView.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
