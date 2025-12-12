import { showSuccess, showError, showInfo, showWarning } from '@/utils/toast'

export const useToast = () => ({
    success: showSuccess,
    error: showError,
    info: showInfo,
    warning: showWarning
})

