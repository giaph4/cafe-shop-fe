import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { routes } from './routes'

const router = createRouter({
    history: createWebHistory(),
    routes,
    linkActiveClass: 'active'
})

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    const isAuthenticated = authStore.isAuthenticated

    if (to.meta.requiresAuth && !isAuthenticated) {
        next({ name: 'Login' })
        return
    }

    if (to.meta.requiresGuest && isAuthenticated) {
        next({ name: 'Dashboard' })
        return
    }

    const allowedRoles = to.meta?.allowedRoles
    if (Array.isArray(allowedRoles) && allowedRoles.length) {
        if (!isAuthenticated) {
            next({ name: 'Login' })
            return
        }

        const roles = authStore.userRoles || []
        const hasPermission = allowedRoles.some((role) => roles.includes(role))

        if (!hasPermission) {
            next({ name: 'Dashboard' })
            return
        }
    }

    next()
})

export default router
