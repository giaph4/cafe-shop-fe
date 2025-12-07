import axios from 'axios'
import {
    getAccessToken,
    getRefreshToken,
    persistTokens,
    clearTokens,
    clearUser
} from '@/utils/tokenStorage'
import logger from '@/utils/logger'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000
})

// Biến để tránh race condition khi nhiều request cùng lúc gọi refresh token
let isRefreshing = false
let failedQueue = []

// Hàm xử lý các request đang chờ sau khi refresh token thành công
const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error)
        } else {
            // Resolve với token để request có thể retry
            prom.resolve(token)
        }
    })
    failedQueue = []
}

api.interceptors.request.use((config) => {
    const token = getAccessToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

/**
 * Retry logic với exponential backoff cho network errors
 * @param {Object} config - Axios request config
 * @param {Error} error - Error object
 * @returns {Promise} - Retry promise hoặc reject
 */
const retryRequest = async (config, error) => {
    const retryConfig = config || {}
    const retryCount = retryConfig._retryCount ?? 0
    
    // Chỉ retry cho network errors hoặc timeout, không retry cho 4xx (trừ 401 đã xử lý riêng)
    const isNetworkError = !error.response && (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message === 'Network Error')
    const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout')
    const isRetryableStatus = error.response?.status >= 500 && error.response?.status < 600

    if (!isNetworkError && !isTimeout && !isRetryableStatus) {
        return Promise.reject(error)
    }

    // Với 5xx errors, chỉ retry 1 lần (vì nếu backend lỗi thì retry nhiều lần cũng không giúp)
    // Với network errors, retry 3 lần
    const maxRetries = isRetryableStatus ? 1 : (retryConfig._maxRetries ?? 3)
    const retryDelay = retryConfig._retryDelay ?? 1000

    // Không retry nếu đã vượt quá số lần retry tối đa
    if (retryCount >= maxRetries) {
        return Promise.reject(error)
    }

    // Tính toán delay với exponential backoff: delay * 2^retryCount
    const delay = retryDelay * Math.pow(2, retryCount)

    // Log retry trong development
    if (import.meta.env.DEV) {
        logger.warn(`[Axios Retry] Retrying request (${retryCount + 1}/${maxRetries}) after ${delay}ms:`, {
            url: config?.url,
            method: config?.method,
            error: error.message || error.code
        })
    }

    // Đợi delay trước khi retry
    await new Promise(resolve => setTimeout(resolve, delay))

    // Tăng retry count và retry request
    const newConfig = {
        ...config,
        _retryCount: retryCount + 1,
        _maxRetries: maxRetries,
        _retryDelay: retryDelay
    }

    return api(newConfig)
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { response, config } = error || {}
        const status = response?.status
        const originalRequest = config

        // Xử lý retry cho network errors trước
        if (!response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
            // Nếu request đã có _skipRetry flag, không retry
            if (originalRequest?._skipRetry) {
                return Promise.reject(error)
            }
            // Thử retry với exponential backoff
            return retryRequest(originalRequest, error)
        }

        // Xử lý các status codes khác (không phải 401 hoặc đã retry 401 rồi)
        if (status !== 401 || originalRequest._retry) {
            // Retry cho 5xx errors (server errors)
            if (status >= 500 && status < 600 && !originalRequest._skipRetry) {
                return retryRequest(originalRequest, error)
            }

            // Xử lý 401 khi đã retry rồi (refresh token thất bại)
            if (status === 401 && originalRequest._retry) {
                clearTokens()
                clearUser()
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { config } }))
                }
            }
            return Promise.reject(error)
        }

        // Nếu đang refresh token, thêm request vào queue
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                // Lưu cả originalRequest để có thể retry sau khi refresh thành công
                failedQueue.push({ resolve, reject, originalRequest })
            })
                .then((token) => {
            // Retry request với token mới
            originalRequest.headers.Authorization = `Bearer ${token}`
            // Đảm bảo request này không bị đánh dấu _retry để tránh infinite loop
            delete originalRequest._retry
            // Reset retry count để có thể retry lại nếu cần
            delete originalRequest._retryCount
            return api(originalRequest)
                })
                .catch((err) => {
                    return Promise.reject(err)
                })
        }

        // Bắt đầu refresh token
        originalRequest._retry = true
        isRefreshing = true

        const refreshTokenValue = getRefreshToken()

        // Nếu không có refresh token, logout ngay
        if (!refreshTokenValue) {
            isRefreshing = false
            clearTokens()
            clearUser()
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { config } }))
            }
            return Promise.reject(error)
        }

        try {
            // Gọi API refresh token (không dùng api instance để tránh loop)
            const refreshResponse = await axios.post(
                `${API_BASE_URL}/api/v1/auth/refresh`,
                { refreshToken: refreshTokenValue },
                {
                    timeout: 10000,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            )

            const { data } = refreshResponse

            // Lấy access token mới từ response
            // Hỗ trợ cả accessToken và token (tương tự như login)
            const newAccessToken = data?.accessToken || data?.token
            const newRefreshToken = data?.refreshToken || refreshTokenValue

            if (!newAccessToken) {
                throw new Error('Invalid refresh token response: missing access token')
            }

            // Lưu tokens mới
            persistTokens(
                newAccessToken,
                newRefreshToken,
                {
                    expiresIn: data?.expiresIn,
                    refreshExpiresIn: data?.refreshExpiresIn,
                    refreshedAt: Date.now()
                }
            )

            // Cập nhật header mặc định
            api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`

            // Cập nhật header cho request ban đầu
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

            // Xử lý queue: resolve tất cả các request đang chờ với token mới
            // Các request trong queue sẽ tự retry với token mới
            processQueue(null, newAccessToken)

            // Retry request ban đầu với token mới
            // Đảm bảo request này không bị đánh dấu _retry để tránh infinite loop
            delete originalRequest._retry
            // Reset retry count để có thể retry lại nếu cần
            delete originalRequest._retryCount
            return api(originalRequest)
        } catch (refreshError) {
            // Refresh token thất bại, logout
            isRefreshing = false
            processQueue(refreshError, null)
            clearTokens()
            clearUser()

            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { config, refreshError } }))
            }

            return Promise.reject(refreshError)
        } finally {
            isRefreshing = false
        }
    }
)

export default api