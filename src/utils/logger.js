/**
 * Logger utility để replace console statements trong production
 * PERFORMANCE & SECURITY FIX: Disable console trong production để tránh performance issues và data leakage
 *
 * Usage:
 * import logger from '@/utils/logger'
 * logger.log('message')
 * logger.error('error')
 * logger.warn('warning')
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development'

/**
 * Logger object với các methods tương tự console
 * Trong production, các methods sẽ no-op để tránh performance issues
 */
const logger = {
    /**
     * Log message (chỉ trong development)
     */
    log: (...args) => {
        if (isDevelopment) {
            console.log(...args)
        }
    },

    /**
     * Log error (luôn log trong production để debug)
     */
    error: (...args) => {
        if (isDevelopment) {
            console.error(...args)
        } else {
            // Trong production, có thể gửi errors đến error tracking service
            // Ví dụ: Sentry, LogRocket, etc.
            // Error tracking service integration có thể được thêm ở đây
        }
    },

    /**
     * Log warning (chỉ trong development)
     */
    warn: (...args) => {
        if (isDevelopment) {
            console.warn(...args)
        }
    },

    /**
     * Log info (chỉ trong development)
     */
    info: (...args) => {
        if (isDevelopment) {
            console.info(...args)
        }
    },

    /**
     * Log debug (chỉ trong development)
     */
    debug: (...args) => {
        if (isDevelopment) {
            console.debug(...args)
        }
    },

    /**
     * Log table (chỉ trong development)
     */
    table: (...args) => {
        if (isDevelopment) {
            console.table(...args)
        }
    },

    /**
     * Log group (chỉ trong development)
     */
    group: (...args) => {
        if (isDevelopment) {
            console.group(...args)
        }
    },

    /**
     * End group (chỉ trong development)
     */
    groupEnd: () => {
        if (isDevelopment) {
            console.groupEnd()
        }
    }
}

export default logger

