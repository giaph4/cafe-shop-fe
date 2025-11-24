/**
 * Composable for standardized error handling
 * Chuẩn hóa xử lý lỗi trong toàn bộ ứng dụng
 */

import { toast } from 'vue3-toastify'
import logger from '@/utils/logger'

/**
 * Extract error message from error object
 * @param {Error|AxiosError} error - Error object
 * @returns {string} - Error message
 */
export function extractErrorMessage(error) {
    if (!error) return 'Đã xảy ra lỗi không xác định.'
    
    // Axios error
    if (error.response) {
        const data = error.response.data
        if (data?.message) return data.message
        if (data?.error) return data.error
        if (typeof data === 'string') return data
    }
    
    // Standard error
    if (error.message) return error.message
    
    return 'Đã xảy ra lỗi không xác định.'
}

/**
 * Handle API error with standardized pattern
 * @param {Error|AxiosError} error - Error object
 * @param {Object} options - Options
 * @param {string} options.context - Context of the error (for logging)
 * @param {boolean} options.showToast - Show toast notification (default: true)
 * @param {string} options.fallbackMessage - Fallback message if error extraction fails
 * @returns {string} - Error message
 */
export function handleApiError(error, options = {}) {
    const {
        context = 'API',
        showToast = true,
        fallbackMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.'
    } = options

    const message = extractErrorMessage(error) || fallbackMessage

    // Log error in development
    if (import.meta.env.DEV) {
        logger.error(`[${context}]`, error)
    }

    // Show toast notification
    if (showToast) {
        toast.error(message, {
            autoClose: 3000
        })
    }

    return message
}

/**
 * Composable for error handling
 * @param {Object} options - Options
 * @returns {Object} - Error handling utilities
 */
export function useErrorHandler(options = {}) {
    const handleError = (error, context) => {
        return handleApiError(error, {
            ...options,
            context: context || options.context
        })
    }

    return {
        handleError,
        extractErrorMessage,
        handleApiError
    }
}

