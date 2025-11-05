import { defineStore } from 'pinia'
import api from '@/api/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: (() => {
      const userData = localStorage.getItem('user')
      try {
        return userData && userData !== 'undefined' ? JSON.parse(userData) : null
      } catch {
        return null
      }
    })(),
    token: (() => {
      const tokenData = localStorage.getItem('token')
      return tokenData && tokenData !== 'undefined' ? tokenData : null
    })(),
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    async login(username, password) {
      try {
        const response = await api.post('/auth/login', { username, password })
        const { token, user } = response.data

        this.token = token
        this.user = user

        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        return true
      } catch (error) {
        console.error('Login failed:', error)
        throw error
      }
    },

    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    restoreSession() {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')

      if (token && user && user !== 'undefined') {
        try {
          this.token = token
          this.user = JSON.parse(user)
        } catch {
          this.logout()
        }
      }
    },
  },
})
