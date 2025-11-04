import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth' // Import Pinia store
import MainLayout from '../layouts/MainLayout.vue'
import Dashboard from '../pages/Dashboard.vue'
import Login from '../pages/Login.vue'
import Products from '../pages/Products.vue'
import Orders from '../pages/Orders.vue'

const routes = [
    {
        path: '/',
        component: MainLayout,
        meta: { requiresAuth: true }, // Yêu cầu đăng nhập cho layout này
        children: [
            {
                path: '',
                name: 'Dashboard',
                component: Dashboard,
            },
            {
                path: 'products',
                name: 'Quản lý Sản phẩm',
                component: Products,
            },
            {
                path: 'orders',
                name: 'Quản lý Hoá đơn',
                component: Orders,
            },
            // ... các route con khác
        ]
    },
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { requiresGuest: true }, // Chỉ cho phép truy cập khi CHƯA đăng nhập
    },
    // {
    //   path: '/:pathMatch(.*)*',
    //   name: 'NotFound',
    //   component: () => import('../pages/NotFound.vue') // (Nên tạo trang 404)
    // }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    linkActiveClass: 'active',
})

// === Navigation Guard ===
router.beforeEach((to, from, next) => {
    // Khởi tạo store BÊN TRONG guard
    const authStore = useAuthStore()
    const isAuthenticated = authStore.isAuthenticated

    // 1. Nếu route yêu cầu đăng nhập (requiresAuth) VÀ chưa đăng nhập
    if (to.meta.requiresAuth && !isAuthenticated) {
        next({ name: 'Login' }) // Chuyển đến trang Login
    }
    // 2. Nếu route yêu cầu là khách (requiresGuest) VÀ đã đăng nhập
    else if (to.meta.requiresGuest && isAuthenticated) {
        next({ name: 'Dashboard' }) // Chuyển đến trang Dashboard
    }
    else {
        next() // Cho phép đi tiếp
    }
})

export default router