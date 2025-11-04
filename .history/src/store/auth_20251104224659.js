import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios'

/**
 * HÀM MỚI: Helper để parse JSON từ localStorage một cách an toàn
 * Xử lý các trường hợp 'undefined', 'null', hoặc chuỗi rỗng.
 */
const safeJsonParse = (item) => {
    if (!item || item === 'undefined' || item === 'null' || item === '') {
        return null;
    }
    try {
        return JSON.parse(item);
    } catch (e) {
        console.error("Lỗi khi parse 'user' từ localStorage, reset về null.", e);
        localStorage.removeItem('user'); // Xoá dữ liệu hỏng
        return null;
    }
}

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token') || null)

    // SỬA LỖI (Dòng 8): Sử dụng helper an toàn
    const user = ref(safeJsonParse(localStorage.getItem('user')))

    const router = useRouter()
    const isAuthenticated = computed(() => !!token.value)
    const userRole = computed(() => user.value?.roles?.[0] || null)

    function setUser(newToken, userData) {
        token.value = newToken
        user.value = userData
        localStorage.setItem('token', newToken)

        // SỬA LỖI (Dòng 20): Đảm bảo không bao giờ lưu 'undefined'.
        // Nếu userData không tồn tại, lưu 'null' (chuỗi JSON hợp lệ)
        localStorage.setItem('user', JSON.stringify(userData || null))

        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    }

    async function login(credentials) {
    },

    }

    function logout() {
        token.value = null
        user.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        delete api.defaults.headers.common['Authorization']
        if (router) {
            router.push('/login')
        } else {
            // Fallback nếu router chưa sẵn sàng
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