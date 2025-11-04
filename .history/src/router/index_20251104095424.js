import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../pages/Dashboard.vue'

const routes = [
    {
        path: '/',
        name: 'Dashboard',
        component: Dashboard
    },
    // Thêm các routes khác sau
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router