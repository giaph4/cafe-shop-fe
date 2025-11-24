/**
 * Composable for Bootstrap Modal
 * Chuẩn hóa modal initialization và management
 */

import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Modal } from 'bootstrap'

/**
 * Composable for managing Bootstrap modal
 * @param {Object} options - Modal options
 * @param {boolean} options.backdrop - Backdrop option (default: 'static')
 * @param {boolean} options.keyboard - Keyboard option (default: false)
 * @returns {Object} Modal utilities
 */
export const useModal = (options = {}) => {
    const modalRef = ref(null)
    let modalInstance = null

    const {
        backdrop = 'static',
        keyboard = false
    } = options

    /**
     * Initialize modal instance
     */
    const initModal = () => {
        if (modalRef.value && !modalInstance) {
            modalInstance = new Modal(modalRef.value, {
                backdrop,
                keyboard
            })
        }
    }

    /**
     * Show modal
     */
    const show = () => {
        if (!modalInstance) {
            initModal()
        }
        modalInstance?.show()
    }

    /**
     * Hide modal
     */
    const hide = () => {
        modalInstance?.hide()
    }

    /**
     * Toggle modal
     */
    const toggle = () => {
        if (!modalInstance) {
            initModal()
        }
        modalInstance?.toggle()
    }

    /**
     * Dispose modal instance
     */
    const dispose = () => {
        if (modalInstance) {
            modalInstance.dispose()
            modalInstance = null
        }
    }

    /**
     * Check if modal is shown
     */
    const isShown = () => {
        return modalInstance?._isShown || false
    }

    onMounted(() => {
        initModal()
    })

    onBeforeUnmount(() => {
        dispose()
    })

    return {
        modalRef,
        show,
        hide,
        toggle,
        dispose,
        isShown
    }
}

