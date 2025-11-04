import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios'

export const useAuthStore = defineStore('auth', () => {
    // === STATE ===
    // Lấy token và user từ localStorage khi khởi tạo
    const token = ref(localStorage.getItem('token') || null)
    const user = ref(JSON.parse(localStorage.getItem('user')) || null)
    const router = useRouter()

    // === GETTERS ===
    // Kiểm tra xem người dùng đã đăng nhập chưa
    const isAuthenticated = computed(() => !!token.value)
    // Lấy vai trò của người dùng (ví dụ: 'ADMIN', 'MANAGER', 'STAFF')
    const userRole = computed(() => user.value?.roles?.[0] || null)

    // === ACTIONS ===

    /**
     * Đặt token và thông tin người dùng vào state và localStorage
     * @param {string} newToken - JWT token
     * @param {object} userData - Thông tin user từ API
     */
    function setUser(newToken, userData) {
        token.value = newToken
        user.value = userData
        localStorage.setItem('token', newToken)
        localStorage.setItem('user', JSON.stringify(userData))

        // Cập nhật header cho các request axios sau này
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    }

    /**
     * Gọi API đăng nhập
     * @param {object} credentials - { username, password }
     */
    async function login(credentials) {
        // Gọi API POST /api/v1/auth/login
        const response = await api.post('/auth/login', credentials)

        // API trả về { token, user }
        const { token: newToken, user: userData } = response.data

        // Lưu thông tin
        setUser(newToken, userData)
    }

    /**
     * Đăng xuất
     */
    function logout() {
        token.value = null
        user.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        delete api.defaults.headers.common['Authorization']
        if (router) {
            router.push('/login')
        } else {
            window.location.href = '/login'
        }
    }

    return {
        token,
        user,
        isAuthenticated,
        userRole,
        login,
        logout,
        setUser
    }
})