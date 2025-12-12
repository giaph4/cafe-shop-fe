import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * Store quản lý keyboard shortcuts
 */
export const useShortcutsStore = defineStore('shortcuts', () => {
    // Default shortcuts config
    const defaultShortcuts = {
        global: {
            'command-palette': { key: 'k', modifiers: ['ctrl', 'meta'], description: 'Mở Command Palette' },
            'shortcuts-help': { key: '/', modifiers: ['ctrl', 'meta'], description: 'Hiển thị shortcuts help' },
            'toggle-sidebar': { key: 'b', modifiers: ['ctrl', 'meta'], description: 'Toggle sidebar' },
            'open-settings': { key: ',', modifiers: ['ctrl', 'meta'], description: 'Mở Settings' },
            'quick-nav': { key: 'p', modifiers: ['ctrl', 'meta'], description: 'Quick page navigation' },
            'close-modal': { key: 'Escape', modifiers: [], description: 'Đóng modal/filter' }
        },
        dashboard: {
            'refresh': { key: 'r', modifiers: [], description: 'Refresh dashboard' },
            'fullscreen': { key: 'f', modifiers: [], description: 'Fullscreen mode' }
        },
        orders: {
            'new-order': { key: 'n', modifiers: [], description: 'Tạo đơn hàng mới' },
            'focus-filter': { key: 'f', modifiers: [], description: 'Focus vào filter' }
        },
        products: {
            'new-product': { key: 'n', modifiers: [], description: 'Tạo sản phẩm mới' },
            'edit-selected': { key: 'e', modifiers: [], description: 'Chỉnh sửa item đã chọn' }
        },
        customers: {
            'new-customer': { key: 'n', modifiers: [], description: 'Tạo khách hàng mới' },
            'search': { key: 's', modifiers: [], description: 'Focus vào search' }
        },
        table: {
            'arrow-up': { key: 'ArrowUp', modifiers: [], description: 'Di chuyển lên' },
            'arrow-down': { key: 'ArrowDown', modifiers: [], description: 'Di chuyển xuống' },
            'arrow-left': { key: 'ArrowLeft', modifiers: [], description: 'Di chuyển trái' },
            'arrow-right': { key: 'ArrowRight', modifiers: [], description: 'Di chuyển phải' },
            'enter': { key: 'Enter', modifiers: [], description: 'Edit cell / Open detail' },
            'space': { key: ' ', modifiers: [], description: 'Select row' },
            'select-all': { key: 'a', modifiers: ['ctrl', 'meta'], description: 'Select all' },
            'delete': { key: 'Delete', modifiers: [], description: 'Delete selected' }
        }
    }

    // User custom shortcuts (loaded from localStorage)
    const customShortcuts = ref({})

    // Recent actions for command palette
    const recentActions = ref([])

    /**
     * Get shortcut config
     */
    const getShortcut = (category, action) => {
        const custom = customShortcuts.value[category]?.[action]
        if (custom) {
            return { ...defaultShortcuts[category]?.[action], ...custom }
        }
        return defaultShortcuts[category]?.[action] || null
    }

    /**
     * Get all shortcuts for a category
     */
    const getCategoryShortcuts = (category) => {
        const defaults = defaultShortcuts[category] || {}
        const customs = customShortcuts.value[category] || {}
        return { ...defaults, ...customs }
    }

    /**
     * Get all shortcuts
     */
    const getAllShortcuts = computed(() => {
        const all = {}
        Object.keys(defaultShortcuts).forEach(category => {
            all[category] = getCategoryShortcuts(category)
        })
        return all
    })

    /**
     * Update shortcut
     */
    const updateShortcut = (category, action, config) => {
        if (!customShortcuts.value[category]) {
            customShortcuts.value[category] = {}
        }
        customShortcuts.value[category][action] = config
        saveToLocalStorage()
    }

    /**
     * Reset shortcut to default
     */
    const resetShortcut = (category, action) => {
        if (customShortcuts.value[category]?.[action]) {
            delete customShortcuts.value[category][action]
            if (Object.keys(customShortcuts.value[category]).length === 0) {
                delete customShortcuts.value[category]
            }
            saveToLocalStorage()
        }
    }

    /**
     * Reset all shortcuts
     */
    const resetAllShortcuts = () => {
        customShortcuts.value = {}
        saveToLocalStorage()
    }

    /**
     * Add recent action
     */
    const addRecentAction = (action) => {
        const index = recentActions.value.findIndex(a => a.id === action.id)
        if (index >= 0) {
            recentActions.value.splice(index, 1)
        }
        recentActions.value.unshift(action)
        // Keep only last 10
        if (recentActions.value.length > 10) {
            recentActions.value = recentActions.value.slice(0, 10)
        }
        saveRecentActions()
    }

    /**
     * Save to localStorage
     */
    const saveToLocalStorage = () => {
        try {
            localStorage.setItem('custom_shortcuts', JSON.stringify(customShortcuts.value))
        } catch (error) {
            console.error('Error saving shortcuts to localStorage:', error)
        }
    }

    /**
     * Load from localStorage
     */
    const loadFromLocalStorage = () => {
        try {
            const data = localStorage.getItem('custom_shortcuts')
            if (data) {
                customShortcuts.value = JSON.parse(data)
            }
        } catch (error) {
            console.error('Error loading shortcuts from localStorage:', error)
            customShortcuts.value = {}
        }
    }

    /**
     * Save recent actions
     */
    const saveRecentActions = () => {
        try {
            localStorage.setItem('recent_actions', JSON.stringify(recentActions.value))
        } catch (error) {
            console.error('Error saving recent actions:', error)
        }
    }

    /**
     * Load recent actions
     */
    const loadRecentActions = () => {
        try {
            const data = localStorage.getItem('recent_actions')
            if (data) {
                recentActions.value = JSON.parse(data)
            }
        } catch (error) {
            console.error('Error loading recent actions:', error)
            recentActions.value = []
        }
    }

    /**
     * Export shortcuts config
     */
    const exportShortcuts = () => JSON.stringify({
        customShortcuts: customShortcuts.value,
        recentActions: recentActions.value
    }, null, 2)

    /**
     * Import shortcuts config
     */
    const importShortcuts = (configJson) => {
        try {
            const config = typeof configJson === 'string' ? JSON.parse(configJson) : configJson
            if (config.customShortcuts) {
                customShortcuts.value = config.customShortcuts
            }
            if (config.recentActions) {
                recentActions.value = config.recentActions
            }
            saveToLocalStorage()
            saveRecentActions()
            return true
        } catch (error) {
            console.error('Error importing shortcuts:', error)
            return false
        }
    }

    // Initialize
    loadFromLocalStorage()
    loadRecentActions()

    return {
        defaultShortcuts,
        customShortcuts,
        recentActions,
        getShortcut,
        getCategoryShortcuts,
        getAllShortcuts,
        updateShortcut,
        resetShortcut,
        resetAllShortcuts,
        addRecentAction,
        exportShortcuts,
        importShortcuts
    }
})

