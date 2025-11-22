/**
 * Centralized error handling utilities
 * Chuẩn hóa xử lý lỗi trong toàn bộ ứng dụng
 */
import { ERROR_MESSAGES } from '@/constants'
import { showError } from './toast'

/**
 * Extract error message from error object
 * @param {Error} error - Error object
 * @returns {string} Error message
 */
export function getErrorMessage(error) {
  if (!error) return ERROR_MESSAGES.UNKNOWN_ERROR

  // Network error
  if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
    return ERROR_MESSAGES.NETWORK_ERROR
  }

  // HTTP error response
  if (error.response) {
    const status = error.response.status
    const message = error.response.data?.message

    if (message) return message

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
        return ERROR_MESSAGES.SERVER_ERROR
      default:
        return ERROR_MESSAGES.UNKNOWN_ERROR
    }
  }

  // Generic error message
  return error.message || ERROR_MESSAGES.UNKNOWN_ERROR
}

/**
 * Handle error and show toast
 * @param {Error} error - Error object
 * @param {Object} [options] - Options
 * @param {boolean} [options.showToast=true] - Show error toast
 * @param {Function} [options.onError] - Custom error handler
 */
export function handleError(error, options = {}) {
  const {
    showToast = true,
    onError
  } = options

  const message = getErrorMessage(error)

  if (showToast) {
    showError(message)
  }

  if (onError) {
    onError(error, message)
  }

  return message
}

/**
 * Check if error is a specific HTTP status
 * @param {Error} error - Error object
 * @param {number} status - HTTP status code
 * @returns {boolean}
 */
export function isErrorStatus(error, status) {
  return error?.response?.status === status
}

/**
 * Check if error is network error
 * @param {Error} error - Error object
 * @returns {boolean}
 */
export function isNetworkError(error) {
  return error?.code === 'NETWORK_ERROR' || error?.message === 'Network Error'
}

/**
 * Log error to console (for debugging)
 * @param {Error} error - Error object
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
    console.warn(logMessage, error)
  } else if (level === 'info') {
    console.info(logMessage, error)
  } else {
    console.error(logMessage, error)
  }
}

