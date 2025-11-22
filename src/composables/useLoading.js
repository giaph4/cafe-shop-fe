/**
 * Composable for standardized loading state management
 * Chuẩn hóa quản lý loading state trong toàn bộ ứng dụng
 */

import { ref } from 'vue'

/**
 * Composable for loading state
 * @param {boolean} initialState - Initial loading state
 * @returns {Object} - Loading state utilities
 */
export function useLoading(initialState = false) {
    const loading = ref(initialState)

    const setLoading = (value) => {
        loading.value = Boolean(value)
    }

    const withLoading = async (asyncFn) => {
        try {
            setLoading(true)
            return await asyncFn()
        } finally {
            setLoading(false)
        }
    }

    return {
        loading,
        setLoading,
        withLoading
    }
}

