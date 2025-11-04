import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import MainLayout from '../layouts/MainLayout.vue'
import Dashboard from '../pages/Dashboard.vue'
import Login from '../pages/Login.vue'
import Products from '../pages/Products.vue'
import Orders from '../pages/Orders.vue'
import Categories from '../pages/Categories.vue'


const routes = [
    {
        path: '/',
        component: MainLayout,
        meta: { requiresAuth: true },
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
            {
                path: 'categories',
                name: 'Quản lý Danh mục',
                component: Categories,
              },
        ]
    },
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { requiresGuest: true },
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

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    const isAuthenticated = authStore.isAuthenticated
 
    if (to.meta.requiresAuth && !isAuthenticated) {
        next({ name: 'Login' }) // Chuyển đến trang Login
    }
    else if (to.meta.requiresGuest && isAuthenticated) {
        next({ name: 'Dashboard' })
    }
    else {
        next() 
    }
})

export default router