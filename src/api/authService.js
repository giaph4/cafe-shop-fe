import api from './axios'
import { buildApiError } from '@/utils/errorHandler'

/**
 * 1.1 Đăng ký tài khoản mới
 */
export const register = async (userData) => {
    const { data } = await api.post('/api/v1/auth/register', userData)
    return data
}

/**
 * 1.2 Đăng nhập
 */
export const login = async (credentials) => {
    const { data } = await api.post('/api/v1/auth/login', credentials)
    return data
}

/**
 * 1.3 Refresh token
 * Gọi API refresh token để lấy access token mới khi token cũ hết hạn
 * @param {string} refreshToken - Refresh token hiện tại
 * @returns {Promise<{accessToken: string, refreshToken?: string, user?: object, expiresIn?: number, refreshExpiresIn?: number}>}
 */
export const refreshToken = async (refreshToken) => {
    if (!refreshToken || typeof refreshToken !== 'string' || !refreshToken.trim()) {
        throw new Error('Refresh token is required')
    }
    
    // Gọi API refresh token với refresh token trong body
    const { data } = await api.post('/api/v1/auth/refresh', { refreshToken })
    return data
}