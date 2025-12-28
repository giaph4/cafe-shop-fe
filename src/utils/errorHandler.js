/**
 * Hệ thống xử lý lỗi tập trung cho toàn bộ ứng dụng
 * Gộp tất cả error handlers vào một file để giảm bundle size
 * Chuẩn hóa error messages để tránh rò rỉ thông tin nhạy cảm
 */

import { ERROR_MESSAGES } from '@/constants/index'
import { showError } from './toast'
import logger from './logger'

/**
 * Trích xuất thông báo lỗi từ đối tượng lỗi
 * Hỗ trợ nhiều định dạng: AxiosError, Error, và custom error objects
 * @param {Error|AxiosError|Object} error - Đối tượng lỗi
 * @returns {string} Thông báo lỗi
 */
export function getErrorMessage (error) {
    if (!error) return ERROR_MESSAGES.UNKNOWN_ERROR

    // Network error
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        return ERROR_MESSAGES.NETWORK_ERROR
    }

    // Axios error response
    if (error.response) {
        const status = error.response.status
        const data = error.response.data || {}

        // Ưu tiên message từ backend
        if (data.message) return data.message
        if (data.error) return data.error
        if (typeof data === 'string') return data

        // Fallback theo status code
        switch (status) {
            case 400:
                return ERROR_MESSAGES.VALIDATION_ERROR
            case 401:
                return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
            case 403:
                return ERROR_MESSAGES.UNAUTHORIZED
            case 404:
                return ERROR_MESSAGES.NOT_FOUND
            case 500:
            case 502:
            case 503:
                return ERROR_MESSAGES.SERVER_ERROR
            default:
                return ERROR_MESSAGES.UNKNOWN_ERROR
        }
    }

    // Standard error message
    if (error.message) return error.message

    return ERROR_MESSAGES.UNKNOWN_ERROR
}

/**
 * Trích xuất thông báo lỗi (alias để tương thích)
 * @param {Error|AxiosError} error - Đối tượng lỗi
 * @returns {string} Thông báo lỗi
 */
export const extractErrorMessage = getErrorMessage

/**
 * Tạo đối tượng lỗi chuẩn hóa từ lỗi API
 * Dùng cho API services để chuẩn hóa định dạng lỗi
 * @param {Error|AxiosError} error - Đối tượng lỗi từ axios
 * @returns {Object} Đối tượng lỗi đã chuẩn hóa
 */
export const buildApiError = (error) => {
    const response = error?.response
    const status = response?.status
    const data = response?.data || {}

    return {
        status: status || null,
        code: data.code || null,
        message: getErrorMessage(error),
        details: data.details || null,
        originalError: error
    }
}

/**
 * Kiểm tra xem lỗi có phải là một HTTP status cụ thể không
 * @param {Error|AxiosError} error - Đối tượng lỗi
 * @param {number} status - Mã HTTP status
 * @returns {boolean}
 */
export function isErrorStatus (error, status) {
    return error?.response?.status === status
}

/**
 * Check if error is network error
 * @param {Error|AxiosError} error - Error object
 * @returns {boolean}
 */
export function isNetworkError (error) {
    return !error?.response && (
        error?.code === 'ECONNABORTED' ||
        error?.code === 'ERR_NETWORK' ||
        error?.code === 'NETWORK_ERROR' ||
        error?.message === 'Network Error'
    )
}

/**
 * Kiểm tra xem lỗi có phải là timeout không
 * @param {Error|AxiosError} error - Đối tượng lỗi
 * @returns {boolean}
 */
export function isTimeoutError (error) {
    return error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')
}

/**
 * Kiểm tra xem lỗi có thể retry được không (lỗi 5xx)
 * @param {Error|AxiosError} error - Đối tượng lỗi
 * @returns {boolean}
 */
export function isRetryableError (error) {
    const status = error?.response?.status
    return status >= 500 && status < 600
}

/**
 * Xử lý lỗi và hiển thị toast
 * @param {Error|AxiosError} error - Đối tượng lỗi
 * @param {Object} [options] - Tùy chọn
 * @param {boolean} [options.showToast=true] - Hiển thị toast lỗi
 * @param {Function} [options.onError] - Handler lỗi tùy chỉnh
 * @param {string} [options.context] - Ngữ cảnh để logging
 * @returns {string} Thông báo lỗi
 */
export function handleError (error, options = {}) {
    const {
        showToast = true,
        onError,
        context = 'Error'
    } = options

    const message = getErrorMessage(error)

    // Log error trong development
    if (import.meta.env.DEV) {
        logger.error(`[${context}]`, error)
    }

    if (showToast) {
        showError(message)
    }

    if (onError && typeof onError === 'function') {
        onError(error, message)
    }

    return message
}

/**
 * Xử lý lỗi API với pattern chuẩn hóa
 * Alias để tương thích với useErrorHandler composable
 * @param {Error|AxiosError} error - Đối tượng lỗi
 * @param {Object} options - Tùy chọn
 * @param {string} options.context - Ngữ cảnh của lỗi (để logging)
 * @param {boolean} options.showToast - Hiển thị toast thông báo (mặc định: true)
 * @param {string} options.fallbackMessage - Thông báo fallback (deprecated, dùng ERROR_MESSAGES)
 * @returns {string} Thông báo lỗi
 */
export function handleApiError (error, options = {}) {
    const {
        context = 'API',
        showToast = true
    } = options

    return handleError(error, { showToast, context })
}

/**
 * Ghi log lỗi (để debug)
 * @param {Error|AxiosError} error - Đối tượng lỗi
 * @param {string} [context] - Ngữ cảnh nơi lỗi xảy ra
 * @param {Object} [options] - Tùy chọn
 * @param {string} [options.level='error'] - Mức log (error, warn, info)
 */
export function logError (error, context = '', options = {}) {
    const { level = 'error' } = options
    const message = getErrorMessage(error)

    const logMessage = context
        ? `[${context}] ${message}`
        : message

    if (level === 'warn') {
        logger.warn(logMessage, error)
    } else if (level === 'info') {
        logger.info(logMessage, error)
    } else {
        logger.error(logMessage, error)
    }
}
