/**
 * === SECTION: ERROR HANDLER COMPOSABLE ===
 * Vue composable wrapper cho error handling utilities
 * PERFORMANCE FIX: Sử dụng unified error handler từ utils
 */

import {
    handleError as handleErrorUtil,
    handleApiError as handleApiErrorUtil,
    extractErrorMessage,
    getErrorMessage
} from '@/utils/errorHandler'

/**
 * Composable for error handling trong Vue components
 * @param {Object} options - Options
 * @param {string} options.context - Context for error handling
 * @param {boolean} options.showToast - Show toast on error (default: true)
 * @returns {Object} Error handling utilities
 */
export function useErrorHandler (options = {}) {
    const {
        context = 'Component',
        showToast = true
    } = options

    /**
     * Handle error với context và options đã cấu hình
     * @param {Error|AxiosError} error - Error object
     * @param {string} [overrideContext] - Override context cho lần gọi này
     * @returns {string} Error message
     */
    const handleError = (error, overrideContext) => handleErrorUtil(error, {
        context: overrideContext || context,
        showToast
    })

    /**
     * Handle API error
     * @param {Error|AxiosError} error - Error object
     * @returns {string} Error message
     */
    const handleApiError = (error) => handleApiErrorUtil(error, {
        context,
        showToast
    })

    return {
        handleError,
        handleApiError,
        extractErrorMessage,
        getErrorMessage
    }
}

// Re-export utilities để dùng trực tiếp nếu cần
export { extractErrorMessage, getErrorMessage, handleApiError } from '@/utils/errorHandler'
