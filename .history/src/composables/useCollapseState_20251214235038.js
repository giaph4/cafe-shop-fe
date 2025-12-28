/**
 * Composable để quản lý trạng thái collapse với localStorage
 * Tự động lưu và khôi phục trạng thái khi F5
 */

import { ref, watch, onMounted } from 'vue'
import logger from '@/utils/logger'

/**
 * Tạo ref với localStorage persistence
 * @param {string} key - Key trong localStorage
 * @param {any} defaultValue - Giá trị mặc định
 * @param {Object} options - Options
 * @param {boolean} options.autoSave - Tự động lưu khi thay đổi (default: true)
 * @returns {Ref} Reactive ref với localStorage sync
 */
export const useCollapseState = (key, defaultValue = false, options = {}) => {
    const { autoSave = true } = options
    
    // Load từ localStorage khi khởi tạo
    const loadFromStorage = () => {
        try {
            const stored = localStorage.getItem(key)
            if (stored !== null) {
                return JSON.parse(stored)
            }
        } catch (error) {
            logger.warn(`[useCollapseState] Failed to load ${key}:`, error)
        }
        return defaultValue
    }
    
    // Tạo ref với giá trị từ localStorage
    const state = ref(loadFromStorage())
    
    // Lưu vào localStorage khi thay đổi
    const saveToStorage = (value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value))
        } catch (error) {
            logger.warn(`[useCollapseState] Failed to save ${key}:`, error)
        }
    }
    
    // Watch để auto-save
    if (autoSave) {
        watch(state, (newValue) => {
            saveToStorage(newValue)
        }, { immediate: false })
    }
    
    // Expose method để save manually nếu cần
    state.save = () => saveToStorage(state.value)
    state.load = () => {
        state.value = loadFromStorage()
    }
    
    return state
}

/**
 * Composable để quản lý nhiều collapse states cùng lúc
 * @param {Object} config - Object với key-value pairs: { 'key1': defaultValue1, 'key2': defaultValue2 }
 * @returns {Object} Object chứa các ref states
 */
export const useMultipleCollapseStates = (config) => {
    const states = {}
    const prefix = 'collapse_state_'
    
    for (const [key, defaultValue] of Object.entries(config)) {
        const storageKey = `${prefix}${key}`
        states[key] = useCollapseState(storageKey, defaultValue)
    }
    
    return states
}
