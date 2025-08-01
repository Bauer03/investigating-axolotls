import { createRouter, createWebHashHistory } from 'vue-router'
import InputView from '../views/InputView.vue'
import OutputView from '../views/OutputView.vue'

const routes = [
  {
    path: '/',
    name: 'Input',
    component: InputView
  },
  {
    path: '/output',
    name: 'Output',
    component: OutputView,
    children: [
      // Importing these dynamically for optimization hopefully.
      {
        path: 'validate',
        name: 'OutputValidate',
        component: () => import('../views/ValidateView.vue')
      },
      {
        path: 'gallery',
        name: 'OutputGallery',
        component: () => import('../views/GalleryView.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
