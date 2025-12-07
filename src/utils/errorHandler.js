/**
 * === SECTION: UNIFIED ERROR HANDLING SYSTEM ===
 * Centralized error handling utilities cho toàn bộ ứng dụng
 * PERFORMANCE FIX: Gộp tất cả error handlers vào một file để giảm bundle size
 * SECURITY FIX: Chuẩn hóa error messages để tránh leak thông tin nhạy cảm
 */

import { ERROR_MESSAGES } from '@/constants'
import { showError } from './toast'
import logger from './logger'

// === SECTION: ERROR MESSAGE EXTRACTION ===

/**
 * Extract error message from error object
 * Hỗ trợ nhiều format: AxiosError, Error, và custom error objects
 * @param {Error|AxiosError|Object} error - Error object
 * @returns {string} Error message
 */
export function getErrorMessage(error) {
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
 * Extract error message (alias for compatibility)
 * @param {Error|AxiosError} error - Error object
 * @returns {string} Error message
 */
export const extractErrorMessage = getErrorMessage

// === SECTION: API ERROR BUILDING ===

/**
 * Build standardized error object from API error
 * Dùng cho API services để chuẩn hóa error format
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
        message: getErrorMessage(error),
        details: data.details || null,
        originalError: error
    }
}

// === SECTION: ERROR TYPE CHECKING ===

/**
 * Check if error is a specific HTTP status
 * @param {Error|AxiosError} error - Error object
 * @param {number} status - HTTP status code
 * @returns {boolean}
 */
export function isErrorStatus(error, status) {
    return error?.response?.status === status
}

/**
 * Check if error is network error
 * @param {Error|AxiosError} error - Error object
 * @returns {boolean}
 */
export function isNetworkError(error) {
    return !error?.response && (
        error?.code === 'ECONNABORTED' || 
        error?.code === 'ERR_NETWORK' || 
        error?.code === 'NETWORK_ERROR' ||
        error?.message === 'Network Error'
    )
}

/**
 * Check if error is timeout error
 * @param {Error|AxiosError} error - Error object
 * @returns {boolean}
 */
export function isTimeoutError(error) {
    return error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')
}

/**
 * Check if error is retryable (5xx errors)
 * @param {Error|AxiosError} error - Error object
 * @returns {boolean}
 */
export function isRetryableError(error) {
    const status = error?.response?.status
    return status >= 500 && status < 600
}

// === SECTION: ERROR HANDLING ===

/**
 * Handle error and show toast
 * @param {Error|AxiosError} error - Error object
 * @param {Object} [options] - Options
 * @param {boolean} [options.showToast=true] - Show error toast
 * @param {Function} [options.onError] - Custom error handler
 * @param {string} [options.context] - Context for logging
 * @returns {string} Error message
 */
export function handleError(error, options = {}) {
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
 * Handle API error with standardized pattern
 * Alias cho compatibility với useErrorHandler composable
 * @param {Error|AxiosError} error - Error object
 * @param {Object} options - Options
 * @param {string} options.context - Context of the error (for logging)
 * @param {boolean} options.showToast - Show toast notification (default: true)
 * @param {string} options.fallbackMessage - Fallback message (deprecated, dùng ERROR_MESSAGES)
 * @returns {string} Error message
 */
export function handleApiError(error, options = {}) {
    const {
        context = 'API',
        showToast = true
    } = options

    return handleError(error, { showToast, context })
}

// === SECTION: ERROR LOGGING ===

/**
 * Log error to console (for debugging)
 * @param {Error|AxiosError} error - Error object
 * @param {string} [context] - Context where error occurred
 * @param {Object} [options] - Options
 * @param {string} [options.level='error'] - Log level (error, warn, info)
 */
export function logError(error, context = '', options = {}) {
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
