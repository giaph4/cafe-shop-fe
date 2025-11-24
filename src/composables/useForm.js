/**
 * Composable for Form Management
 * Chuẩn hóa form state, validation, và submission
 */

import { reactive, ref, computed } from 'vue'
import { useAsyncOperation } from './useAsyncOperation'

/**
 * Composable for managing form state and validation
 * @param {Object} options - Options
 * @param {Object} options.initialValues - Initial form values
 * @param {Function} options.validator - Validation function
 * @param {Function} options.onSubmit - Submit handler
 * @param {string} options.context - Context for error handling
 * @returns {Object} Form utilities
 */
export const useForm = (options = {}) => {
    const {
        initialValues = {},
        validator = null,
        onSubmit = null,
        context = 'Form'
    } = options

    const formData = reactive({ ...initialValues })
    const errors = reactive({})
    const touched = reactive({})
    const { loading, error, execute } = useAsyncOperation({ context })

    /**
     * Reset form to initial values
     */
    const reset = () => {
        Object.keys(formData).forEach(key => {
            formData[key] = initialValues[key] ?? ''
        })
        clearErrors()
        clearTouched()
    }

    /**
     * Clear all errors
     */
    const clearErrors = () => {
        Object.keys(errors).forEach(key => {
            errors[key] = ''
        })
    }

    /**
     * Clear all touched fields
     */
    const clearTouched = () => {
        Object.keys(touched).forEach(key => {
            touched[key] = false
        })
    }

    /**
     * Set error for a field
     * @param {string} field - Field name
     * @param {string} message - Error message
     */
    const setError = (field, message) => {
        errors[field] = message
        touched[field] = true
    }

    /**
     * Set errors for multiple fields
     * @param {Object} fieldErrors - Object with field names as keys and error messages as values
     */
    const setErrors = (fieldErrors) => {
        Object.entries(fieldErrors).forEach(([field, message]) => {
            setError(field, message)
        })
    }

    /**
     * Clear error for a field
     * @param {string} field - Field name
     */
    const clearError = (field) => {
        errors[field] = ''
    }

    /**
     * Mark field as touched
     * @param {string} field - Field name
     */
    const setTouched = (field) => {
        touched[field] = true
    }

    /**
     * Validate form
     * @returns {boolean} True if valid
     */
    const validate = () => {
        clearErrors()
        
        if (!validator || typeof validator !== 'function') {
            return true
        }

        const validationErrors = validator(formData)
        
        if (validationErrors && typeof validationErrors === 'object') {
            setErrors(validationErrors)
            return Object.keys(validationErrors).length === 0
        }

        return true
    }

    /**
     * Validate a single field
     * @param {string} field - Field name
     * @returns {boolean} True if valid
     */
    const validateField = (field) => {
        clearError(field)
        setTouched(field)

        if (!validator || typeof validator !== 'function') {
            return true
        }

        const validationErrors = validator(formData)
        
        if (validationErrors && validationErrors[field]) {
            setError(field, validationErrors[field])
            return false
        }

        return true
    }

    /**
     * Handle form submission
     * @param {Object} event - Form submit event (optional)
     */
    const handleSubmit = async (event) => {
        if (event) {
            event.preventDefault()
        }

        if (!validate()) {
            return false
        }

        if (!onSubmit || typeof onSubmit !== 'function') {
            return false
        }

        try {
            await execute(() => onSubmit(formData))
            return true
        } catch (err) {
            // Error already handled by useAsyncOperation
            return false
        }
    }

    /**
     * Check if form is valid
     */
    const isValid = computed(() => {
        return Object.values(errors).every(error => !error)
    })

    /**
     * Check if form has been touched
     */
    const isTouched = computed(() => {
        return Object.values(touched).some(t => t)
    })

    /**
     * Check if form is dirty (values changed from initial)
     */
    const isDirty = computed(() => {
        return Object.keys(formData).some(key => {
            return formData[key] !== (initialValues[key] ?? '')
        })
    })

    return {
        formData,
        errors,
        touched,
        loading,
        error,
        isValid,
        isTouched,
        isDirty,
        reset,
        validate,
        validateField,
        setError,
        setErrors,
        clearError,
        clearErrors,
        setTouched,
        clearTouched,
        handleSubmit
    }
}

