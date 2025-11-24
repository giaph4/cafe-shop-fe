/**
 * Composable for Async Operations
 * Chuẩn hóa loading và error states cho async operations
 */

import { ref, computed } from 'vue'
import { useErrorHandler } from './useErrorHandler'

/**
 * Composable for managing async operations
 * @param {Object} options - Options
 * @param {string} options.context - Context for error handling
 * @param {boolean} options.showToast - Show toast on error (default: true)
 * @returns {Object} Async operation utilities
 */
export const useAsyncOperation = (options = {}) => {
    const {
        context = 'Operation',
        showToast = true
    } = options

    const loading = ref(false)
    const error = ref(null)
    const { handleError: handleApiError } = useErrorHandler({ context, showToast })

    /**
     * Execute async operation with loading and error handling
     * @param {Function} operation - Async operation to execute
     * @param {Object} operationOptions - Options for this operation
     * @returns {Promise} Operation result
     */
    const execute = async (operation, operationOptions = {}) => {
        const {
            onSuccess,
            onError,
            resetError = true
        } = operationOptions

        loading.value = true
        if (resetError) {
            error.value = null
        }

        try {
            const result = await operation()
            
            if (onSuccess && typeof onSuccess === 'function') {
                onSuccess(result)
            }
            
            return result
        } catch (err) {
            const errorMessage = handleApiError(err)
            error.value = errorMessage
            
            if (onError && typeof onError === 'function') {
                onError(err, errorMessage)
            }
            
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Reset error state
     */
    const resetError = () => {
        error.value = null
    }

    /**
     * Reset all states
     */
    const reset = () => {
        loading.value = false
        error.value = null
    }

    /**
     * Check if operation is loading
     */
    const isLoading = computed(() => loading.value)

    /**
     * Check if there is an error
     */
    const hasError = computed(() => !!error.value)

    return {
        loading,
        error,
        isLoading,
        hasError,
        execute,
        resetError,
        reset
    }
}

