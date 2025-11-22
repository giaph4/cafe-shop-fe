/**
 * Composable for standardized API calls
 * Chuẩn hóa API calls với loading, error handling tự động
 */

import { ref } from 'vue'
import { useLoading } from './useLoading'
import { useErrorHandler } from './useErrorHandler'

/**
 * Composable for API calls with automatic loading and error handling
 * @param {Object} options - Options
 * @param {boolean} options.autoLoading - Auto manage loading state (default: true)
 * @param {boolean} options.showErrorToast - Show error toast (default: true)
 * @param {string} options.errorContext - Context for error logging
 * @returns {Object} - API call utilities
 */
export function useApiCall(options = {}) {
    const {
        autoLoading = true,
        showErrorToast = true,
        errorContext = 'API'
    } = options

    const { loading, setLoading, withLoading } = useLoading()
    const { handleError } = useErrorHandler({ context: errorContext, showToast: showErrorToast })
    const error = ref(null)

    /**
     * Execute API call with automatic loading and error handling
     * @param {Function} apiFn - API function to call
     * @param {Array} args - Arguments to pass to API function
     * @returns {Promise} - API call result
     */
    const execute = async (apiFn, ...args) => {
        error.value = null
        
        try {
            if (autoLoading) {
                return await withLoading(async () => {
                    return await apiFn(...args)
                })
            } else {
                return await apiFn(...args)
            }
        } catch (err) {
            error.value = handleError(err)
            throw err
        }
    }

    /**
     * Reset error state
     */
    const resetError = () => {
        error.value = null
    }

    return {
        loading,
        error,
        setLoading,
        execute,
        resetError,
        withLoading
    }
}

