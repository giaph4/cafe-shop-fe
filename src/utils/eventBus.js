/**
 * Event bus utility for custom events
 * SEPARATION OF CONCERNS FIX: Tách event emission logic ra khỏi tokenStorage
 * 
 * Usage:
 * import { emit, on, off } from '@/utils/eventBus'
 * emit('auth:tokens-updated', { accessToken, refreshToken })
 * on('auth:tokens-updated', (event) => { ... })
 */

/**
 * Emit custom event
 * 
 * @param {string} name - Event name
 * @param {any} detail - Event detail/data
 */
export const emit = (name, detail) => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent(name, { detail }))
}

/**
 * Listen to custom event
 * 
 * @param {string} name - Event name
 * @param {Function} handler - Event handler
 * @returns {Function} - Cleanup function
 */
export const on = (name, handler) => {
    if (typeof window === 'undefined') return () => {}
    
    window.addEventListener(name, handler)
    
    // Return cleanup function
    return () => {
        window.removeEventListener(name, handler)
    }
}

/**
 * Remove event listener
 * 
 * @param {string} name - Event name
 * @param {Function} handler - Event handler
 */
export const off = (name, handler) => {
    if (typeof window === 'undefined') return
    window.removeEventListener(name, handler)
}

