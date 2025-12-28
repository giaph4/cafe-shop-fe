/**
 * Composable để quản lý accordion state với localStorage persistence
 */
import { ref, watch, onMounted } from 'vue'

export function useAccordionState(key, defaultState = {}) {
    const storageKey = `accordion-state-${key}`
    
    // Load từ localStorage hoặc dùng default
    const loadState = () => {
        try {
            const stored = localStorage.getItem(storageKey)
            if (stored) {
                return JSON.parse(stored)
            }
        } catch (error) {
            console.warn('Không thể load accordion state từ localStorage:', error)
        }
        return { ...defaultState }
    }
    
    const state = ref(loadState())
    
    // Save vào localStorage khi state thay đổi
    watch(
        state,
        (newState) => {
            try {
                localStorage.setItem(storageKey, JSON.stringify(newState))
            } catch (error) {
                console.warn('Không thể save accordion state vào localStorage:', error)
            }
        },
        { deep: true }
    )
    
    const toggle = (section) => {
        if (state.value[section] !== undefined) {
            state.value[section] = !state.value[section]
        }
    }
    
    const set = (section, value) => {
        if (state.value[section] !== undefined) {
            state.value[section] = value
        }
    }
    
    const reset = () => {
        state.value = { ...defaultState }
    }
    
    return {
        state,
        toggle,
        set,
        reset
    }
}

