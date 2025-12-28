import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useShortcutsStore } from '@/store/shortcuts'
import { useSidebarStore } from '@/store/sidebar'
import { toast } from 'vue3-toastify'

/**
 * Composable quản lý keyboard shortcuts
 * @param {Object} options - Tùy chọn cấu hình
 * @param {string} options.page - Tên trang để load page-specific shortcuts
 * @param {Object} options.shortcuts - Custom shortcuts cho trang này
 * @param {boolean} options.enabled - Bật/tắt shortcuts
 */
export const useKeyboardShortcuts = (options = {}) => {
    const {
        page = null,
        shortcuts = {},
        enabled = true
    } = options

    const shortcutsStore = useShortcutsStore()
    const sidebarStore = useSidebarStore()

    const isEnabled = ref(enabled)

    /**
     * Phân tích chuỗi key thành key và modifiers
     */
    const parseKey = (keyString) => {
        const parts = keyString.toLowerCase().split('+').map(s => s.trim())
        const key = parts[parts.length - 1]
        const modifiers = parts.slice(0, -1)
        return { key, modifiers }
    }

    /**
     * Kiểm tra event có khớp với shortcut không
     */
    const matchesShortcut = (event, shortcut) => {
        if (!shortcut) return false

        const { key } = parseKey(shortcut.key || '')
        const eventKey = event.key.toLowerCase()
        const eventCode = event.code.toLowerCase()

        // Kiểm tra key match
        const keyMatch = eventKey === key ||
            eventCode === key ||
            (key === ' ' && eventCode === 'space') ||
            (key === 'escape' && eventKey === 'escape')

        if (!keyMatch) return false

        // Kiểm tra modifiers
        const requiredModifiers = shortcut.modifiers || []
        const hasCtrl = requiredModifiers.includes('ctrl') || requiredModifiers.includes('meta')
        const hasShift = requiredModifiers.includes('shift')
        const hasAlt = requiredModifiers.includes('alt')

        const ctrlMatch = hasCtrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey)
        const shiftMatch = hasShift ? event.shiftKey : !event.shiftKey
        const altMatch = hasAlt ? event.altKey : !event.altKey

        return ctrlMatch && shiftMatch && altMatch
    }

    /**
     * Xử lý global shortcuts
     */
    const handleGlobalShortcut = (event, action) => {
        switch (action) {
            case 'command-palette':
                event.preventDefault()
                window.dispatchEvent(new CustomEvent('shortcut:command-palette'))
                break

            case 'shortcuts-help':
                event.preventDefault()
                window.dispatchEvent(new CustomEvent('shortcut:shortcuts-help'))
                break

            case 'toggle-sidebar':
                event.preventDefault()
                sidebarStore.toggleCollapsed()
                toast.info('Sidebar toggled')
                break

            case 'open-settings':
                event.preventDefault()
                window.dispatchEvent(new CustomEvent('shortcut:open-settings'))
                break

            case 'quick-nav':
                event.preventDefault()
                window.dispatchEvent(new CustomEvent('shortcut:quick-nav'))
                break

            case 'close-modal': {
                // Đóng tất cả modals đang mở
                const modals = document.querySelectorAll('.modal.show')
                modals.forEach(modal => {
                    // eslint-disable-next-line no-undef
                    const bsModal = bootstrap?.Modal?.getInstance(modal)
                    if (bsModal) {
                        bsModal.hide()
                    }
                })
                break
            }
            default:
                break
        }
    }

    /**
     * Xử lý page-specific shortcuts
     */
    const handlePageShortcut = (event, _action, handler) => {
        if (handler && typeof handler === 'function') {
            event.preventDefault()
            handler(event)
            toast.info('Shortcut executed')
        }
    }

    /**
     * Handler chính cho keyboard event
     */
    const handleKeyDown = (event) => {
        if (!isEnabled.value) return

        // Bỏ qua nếu đang nhập trong input/textarea
        const target = event.target
        if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
            // Chỉ cho phép một số shortcuts trong input
            const allowedInInput = ['Escape', 'Enter']
            if (!allowedInInput.includes(event.key)) {
                return
            }
        }

        // Kiểm tra global shortcuts trước
        const globalShortcuts = shortcutsStore.getCategoryShortcuts('global')
        for (const [action, config] of Object.entries(globalShortcuts)) {
            if (matchesShortcut(event, config)) {
                handleGlobalShortcut(event, action)
                return
            }
        }

        // Kiểm tra page-specific shortcuts
        if (page) {
            const pageShortcuts = shortcutsStore.getCategoryShortcuts(page)
            for (const [action, config] of Object.entries(pageShortcuts)) {
                if (matchesShortcut(event, config)) {
                    const handler = shortcuts[action]
                    handlePageShortcut(event, action, handler)
                    return
                }
            }
        }

        // Kiểm tra custom shortcuts được truyền vào
        for (const [_action, config] of Object.entries(shortcuts)) {
            if (typeof config === 'object' && config.key) {
                if (matchesShortcut(event, config)) {
                    if (config.handler && typeof config.handler === 'function') {
                        event.preventDefault()
                        config.handler(event)
                    }
                    return
                }
            }
        }
    }

    /**
     * Bật shortcuts
     */
    const enable = () => {
        isEnabled.value = true
    }

    /**
     * Tắt shortcuts
     */
    const disable = () => {
        isEnabled.value = false
    }

    /**
     * Toggle shortcuts
     */
    const toggle = () => {
        isEnabled.value = !isEnabled.value
    }

    // Đăng ký event listeners
    onMounted(() => {
        window.addEventListener('keydown', handleKeyDown)
    })

    onBeforeUnmount(() => {
        window.removeEventListener('keydown', handleKeyDown)
    })

    return {
        isEnabled,
        enable,
        disable,
        toggle,
        handleKeyDown
    }
}
