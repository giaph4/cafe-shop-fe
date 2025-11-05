import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  const token = ref(localStorage.getItem('token'))
  const user = ref(null)

  try {
    const raw = localStorage.getItem('user')
    if (raw && raw !== 'undefined') {
      user.value = JSON.parse(raw)
    }
  } catch (e) {
    console.error('Lỗi parse user:', e)
  }

  const isAuthenticated = computed(() => !!token.value)

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
    router.push('/login')
  }

  return { token, user, isAuthenticated, login, logout, setUser }
})
