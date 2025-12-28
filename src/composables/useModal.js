/**
 * Composable quản lý Bootstrap Modal
 * Chuẩn hóa khởi tạo và quản lý modal
 */

import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Modal } from 'bootstrap'

/**
 * Composable quản lý Bootstrap modal
 * @param {Object} options - Tùy chọn modal
 * @param {boolean|string} options.backdrop - Tùy chọn backdrop (mặc định: 'static')
 * @param {boolean} options.keyboard - Cho phép đóng bằng phím ESC (mặc định: false)
 * @returns {Object} Các utility modal
 */
export const useModal = (options = {}) => {
    const modalRef = ref(null)
    let modalInstance = null

    const {
        backdrop = 'static',
        keyboard = false
    } = options

    /**
     * Khởi tạo instance modal
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
     * Hiển thị modal
     */
    const show = () => {
        if (!modalInstance) {
            initModal()
        }
        modalInstance?.show()
    }

    /**
     * Ẩn modal
     */
    const hide = () => {
        modalInstance?.hide()
    }

    /**
     * Chuyển đổi trạng thái modal (hiển thị/ẩn)
     */
    const toggle = () => {
        if (!modalInstance) {
            initModal()
        }
        modalInstance?.toggle()
    }

    /**
     * Hủy instance modal
     */
    const dispose = () => {
        if (modalInstance) {
            modalInstance.dispose()
            modalInstance = null
        }
    }

    /**
     * Kiểm tra xem modal có đang hiển thị không
     * @returns {boolean} True nếu modal đang hiển thị
     */
    const isShown = () => modalInstance?._isShown || false

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

