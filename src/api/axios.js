import axios from 'axios'
import {
    getAccessToken,
    clearTokens,
    clearUser
} from '@/utils/tokenStorage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000
})

api.interceptors.request.use((config) => {
    const token = getAccessToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const { response, config } = error || {}
        const status = response?.status

        if (status === 401) {
            clearTokens()
            clearUser()
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { config } }))
            }
        }

        return Promise.reject(error)
    }
)

export default api