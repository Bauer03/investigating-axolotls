import { createRouter, createWebHistory } from 'vue-router'
import InputView from '../views/InputView.vue'

const routes = [
  {
    path: '/',
    name: 'Input',
    component: InputView
  },
  {
    path: '/output',
    name: 'Output',
    component: () => import('../views/OutputView.vue') // trying this out for performance, since output view can end up holding thousands of images.
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
