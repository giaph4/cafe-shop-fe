/**
 * Shared API Error Handler
 * Chuẩn hóa xử lý lỗi cho tất cả API services
 */

/**
 * Build standardized error object from API error
 * @param {Error|AxiosError} error - Error object from axios
 * @returns {Object} Standardized error object
 */
export const buildApiError = (error) => {
    const response = error?.response
    const status = response?.status
    const data = response?.data || {}
    
    return {
        status: status || null,
        code: data.code || null,
        message: data.message || error?.message || 'Đã xảy ra lỗi không xác định.',
        details: data.details || null,
        originalError: error
    }
}

/**
 * Check if error is a specific HTTP status
 * @param {Error|AxiosError} error - Error object
 * @param {number} status - HTTP status code
 * @returns {boolean}
 */
export const isErrorStatus = (error, status) => {
    return error?.response?.status === status
}

/**
 * Check if error is a network error
 * @param {Error|AxiosError} error - Error object
 * @returns {boolean}
 */
export const isNetworkError = (error) => {
    return !error?.response && (
        error?.code === 'ECONNABORTED' || 
        error?.code === 'ERR_NETWORK' || 
        error?.message === 'Network Error'
    )
}

/**
 * Check if error is a timeout error
 * @param {Error|AxiosError} error - Error object
 * @returns {boolean}
 */
export const isTimeoutError = (error) => {
    return error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')
}

/**
 * Check if error is retryable (5xx errors)
 * @param {Error|AxiosError} error - Error object
 * @returns {boolean}
 */
export const isRetryableError = (error) => {
    const status = error?.response?.status
    return status >= 500 && status < 600
}

