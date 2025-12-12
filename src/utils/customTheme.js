/**
 * Custom Theme Utilities
 * Xử lý lưu trữ và tải custom themes, layout preferences, component styles, dark mode settings
 */

const CUSTOM_THEMES_KEY = 'app-custom-themes'
const LAYOUT_PREFERENCES_KEY = 'app-layout-preferences'
const COMPONENT_STYLES_KEY = 'app-component-styles'
const DARK_MODE_SETTINGS_KEY = 'app-dark-mode-settings'

// ============================================
// Custom Themes
// ============================================

export const loadCustomThemes = () => {
    if (typeof localStorage === 'undefined') return []
    try {
        const stored = localStorage.getItem(CUSTOM_THEMES_KEY)
        return stored ? JSON.parse(stored) : []
    } catch (error) {
        console.error('Error loading custom themes:', error)
        return []
    }
}

export const saveCustomThemes = (themes) => {
    if (typeof localStorage === 'undefined') return
    try {
        localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes))
    } catch (error) {
        console.error('Error saving custom themes:', error)
    }
}

export const exportTheme = (themeData) => JSON.stringify(themeData, null, 2)

export const importTheme = (jsonString) => {
    try {
        return JSON.parse(jsonString)
    } catch (error) {
        throw new Error('Invalid theme JSON format')
    }
}

export const generateThemeId = () => `custom-theme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// ============================================
// Layout Preferences
// ============================================

const defaultLayoutPreferences = {
    sidebarWidth: 'normal', // 'collapsed', 'normal', 'expanded'
    spacing: 'normal', // 'compact', 'normal', 'comfortable'
    fontSize: 'normal', // 'small', 'normal', 'large'
    borderRadius: 'normal', // 'sharp', 'normal', 'rounded'
    animations: 'on' // 'on', 'off', 'reduced'
}

export const loadLayoutPreferences = () => {
    if (typeof localStorage === 'undefined') return defaultLayoutPreferences
    try {
        const stored = localStorage.getItem(LAYOUT_PREFERENCES_KEY)
        return stored ? { ...defaultLayoutPreferences, ...JSON.parse(stored) } : defaultLayoutPreferences
    } catch (error) {
        console.error('Error loading layout preferences:', error)
        return defaultLayoutPreferences
    }
}

export const saveLayoutPreferences = (preferences) => {
    if (typeof localStorage === 'undefined') return
    try {
        localStorage.setItem(LAYOUT_PREFERENCES_KEY, JSON.stringify(preferences))
    } catch (error) {
        console.error('Error saving layout preferences:', error)
    }
}

// ============================================
// Component Styles
// ============================================

const defaultComponentStyles = {
    buttonStyle: 'filled', // 'flat', 'outlined', 'filled'
    tableStyle: 'bordered', // 'minimal', 'bordered', 'striped'
    cardStyle: 'elevated', // 'flat', 'elevated', 'bordered'
    inputStyle: 'rounded' // 'square', 'rounded', 'outlined'
}

export const loadComponentStyles = () => {
    if (typeof localStorage === 'undefined') return defaultComponentStyles
    try {
        const stored = localStorage.getItem(COMPONENT_STYLES_KEY)
        return stored ? { ...defaultComponentStyles, ...JSON.parse(stored) } : defaultComponentStyles
    } catch (error) {
        console.error('Error loading component styles:', error)
        return defaultComponentStyles
    }
}

export const saveComponentStyles = (styles) => {
    if (typeof localStorage === 'undefined') return
    try {
        localStorage.setItem(COMPONENT_STYLES_KEY, JSON.stringify(styles))
    } catch (error) {
        console.error('Error saving component styles:', error)
    }
}

// ============================================
// Dark Mode Settings
// ============================================

const defaultDarkModeSettings = {
    autoDarkMode: false,
    autoDarkModeStart: '18:00', // HH:mm format
    autoDarkModeEnd: '06:00', // HH:mm format
    customDarkColors: null, // { primary, secondary, background, text }
    contrastRatio: 'AA' // 'AA', 'AAA', 'custom'
}

export const loadDarkModeSettings = () => {
    if (typeof localStorage === 'undefined') return defaultDarkModeSettings
    try {
        const stored = localStorage.getItem(DARK_MODE_SETTINGS_KEY)
        return stored ? { ...defaultDarkModeSettings, ...JSON.parse(stored) } : defaultDarkModeSettings
    } catch (error) {
        console.error('Error loading dark mode settings:', error)
        return defaultDarkModeSettings
    }
}

export const saveDarkModeSettings = (settings) => {
    if (typeof localStorage === 'undefined') return
    try {
        localStorage.setItem(DARK_MODE_SETTINGS_KEY, JSON.stringify(settings))
    } catch (error) {
        console.error('Error saving dark mode settings:', error)
    }
}

// ============================================
// Contrast Ratio Calculator
// ============================================

/**
 * Calculate relative luminance of a color
 * @param {string} color - Hex color string (e.g., '#FFFFFF')
 * @returns {number} Relative luminance (0-1)
 */
const getLuminance = (color) => {
    const rgb = hexToRgb(color)
    if (!rgb) return 0

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
        val = val / 255
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Calculate contrast ratio between two colors
 * @param {string} color1 - First color (hex)
 * @param {string} color2 - Second color (hex)
 * @returns {number} Contrast ratio (1-21)
 */
export const getContrastRatio = (color1, color2) => {
    const lum1 = getLuminance(color1)
    const lum2 = getLuminance(color2)

    const lighter = Math.max(lum1, lum2)
    const darker = Math.min(lum1, lum2)

    return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if contrast ratio meets WCAG standards
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @param {string} level - 'AA' or 'AAA'
 * @param {string} size - 'normal' or 'large'
 * @returns {object} { passes, ratio, level }
 */
export const checkContrastCompliance = (foreground, background, level = 'AA', size = 'normal') => {
    const ratio = getContrastRatio(foreground, background)

    let requiredRatio
    if (level === 'AAA') {
        requiredRatio = size === 'large' ? 4.5 : 7
    } else {
        requiredRatio = size === 'large' ? 3 : 4.5
    }

    return {
        passes: ratio >= requiredRatio,
        ratio: Math.round(ratio * 100) / 100,
        requiredRatio,
        level,
        size
    }
}

/**
 * Convert hex color to RGB
 * @param {string} hex - Hex color string
 * @returns {object|null} { r, g, b } or null
 */
const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null
}

/**
 * Check if current time is within dark mode time range
 * @param {string} startTime - Start time (HH:mm)
 * @param {string} endTime - End time (HH:mm)
 * @returns {boolean}
 */
export const isDarkModeTime = (startTime, endTime) => {
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    // Handle overnight range (e.g., 18:00 to 06:00)
    if (startMinutes > endMinutes) {
        return currentMinutes >= startMinutes || currentMinutes < endMinutes
    }

    return currentMinutes >= startMinutes && currentMinutes < endMinutes
}

