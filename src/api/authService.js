import api from './axios'

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
