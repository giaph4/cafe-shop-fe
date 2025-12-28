/**
 * Composable xử lý lỗi cho Vue components
 * Sử dụng unified error handler từ utils để đảm bảo tính nhất quán
 */

import {
    handleError as handleErrorUtil,
    handleApiError as handleApiErrorUtil,
    extractErrorMessage,
    getErrorMessage
} from '@/utils/errorHandler'

/**
 * Composable xử lý lỗi trong Vue components
 * @param {Object} options - Tùy chọn
 * @param {string} options.context - Ngữ cảnh để xử lý lỗi
 * @param {boolean} options.showToast - Hiển thị toast khi có lỗi (mặc định: true)
 * @returns {Object} Các utility xử lý lỗi
 */
export function useErrorHandler (options = {}) {
    const {
        context = 'Component',
        showToast = true
    } = options

    /**
     * Xử lý lỗi với ngữ cảnh và tùy chọn đã cấu hình
     * @param {Error|AxiosError} error - Đối tượng lỗi
     * @param {string} [overrideContext] - Ghi đè ngữ cảnh cho lần gọi này
     * @returns {string} Thông báo lỗi
     */
    const handleError = (error, overrideContext) => handleErrorUtil(error, {
        context: overrideContext || context,
        showToast
    })

    /**
     * Xử lý lỗi API
     * @param {Error|AxiosError} error - Đối tượng lỗi
     * @returns {string} Thông báo lỗi
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
