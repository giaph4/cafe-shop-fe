import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios'

export const useAuthStore = defineStore('auth', () => {
  const storedToken = localStorage.getItem('token')
  const storedUser = localStorage.getItem('user')

  const token = ref(storedToken || null)
  const user = ref(storedUser ? JSON.parse(storedUser) : null)
  const router = useRouter()

  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.roles?.[0] || null)

  function setUser(newToken, userData) {
    token.value = newToken
    user.value = userData
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(userData))
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  async function login(credentials) {
    const response = await api.post('/auth/login', credentials)
    const { token: newToken, user: userData } = response.data
    setUser(newToken, userData)
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
