import { toast } from 'vue3-toastify'

const defaultOptions = {
    position: toast.POSITION.TOP_RIGHT,
    autoClose: 3000,
    hideProgressBar: false,
    pauseOnHover: true,
    closeOnClick: true
}

export const showSuccess = (message, options = {}) => {
    toast.success(message, { ...defaultOptions, ...options })
}

export const showError = (message, options = {}) => {
    toast.error(message, { ...defaultOptions, ...options })
}

export const showInfo = (message, options = {}) => {
    toast.info(message, { ...defaultOptions, ...options })
}

export const showWarning = (message, options = {}) => {
    toast.warning(message, { ...defaultOptions, ...options })
}
