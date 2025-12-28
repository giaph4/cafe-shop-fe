import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import {
    getStoredTheme,
    applyThemeClass,
    persistTheme,
    normalizeTheme,
    resolveInitialTheme
} from '@/utils/theme'
import {
    loadCustomThemes,
    saveCustomThemes,
    loadLayoutPreferences,
    saveLayoutPreferences,
    loadComponentStyles,
    saveComponentStyles,
    loadDarkModeSettings,
    saveDarkModeSettings
} from '@/utils/customTheme'

export const useSettingsStore = defineStore('settings', () => {
    const authStore = useAuthStore()

    // System Settings - sử dụng theme system có sẵn
    const currentTheme = ref(normalizeTheme(getStoredTheme() || resolveInitialTheme()))
    const language = ref(localStorage.getItem('language') || 'vi')
    const notificationSound = ref(localStorage.getItem('notificationSound') !== 'false')
    const christmasEffectEnabled = ref(localStorage.getItem('christmasEffectEnabled') === 'true')
    const showDevDemoFeatures = ref(localStorage.getItem('showDevDemoFeatures') !== 'false')

    // Custom Theme & Appearance Settings
    const customThemes = ref(loadCustomThemes())
    const layoutPreferences = ref(loadLayoutPreferences())
    const componentStyles = ref(loadComponentStyles())
    const darkModeSettings = ref(loadDarkModeSettings())

    // User Profile (lấy từ authStore)
    const userProfile = computed(() => {
        const user = authStore.user
        if (!user) return null
        return {
            id: user.id || null,
            username: user.username || '',
            fullName: user.fullName || user.name || '',
            email: user.email || '',
            avatarUrl: user.avatarUrl || user.avatar || undefined
        }
    })

    // Actions
    const setTheme = (theme) => {
        const normalized = normalizeTheme(theme)
        currentTheme.value = normalized
        applyThemeClass(normalized)
        persistTheme(normalized)
    }

    const setLanguage = (value) => {
        language.value = value
        localStorage.setItem('language', value)
    }

    const setNotificationSound = (value) => {
        notificationSound.value = value
        localStorage.setItem('notificationSound', String(value))
    }

    const setChristmasEffect = (value) => {
        christmasEffectEnabled.value = value
        localStorage.setItem('christmasEffectEnabled', String(value))
    }

    const setShowDevDemoFeatures = (value) => {
        showDevDemoFeatures.value = value
        localStorage.setItem('showDevDemoFeatures', String(value))
    }

    const updateProfile = async (profileData) => {
        // Cập nhật profile: gọi API để cập nhật profile
        // Ví dụ: await updateUserProfile(profileData)
        // Tạm thời chỉ cập nhật local state
        if (authStore.user) {
            authStore.updateUserFromProfile({
                ...authStore.user,
                ...profileData
            })
        }
    }

    const changePassword = async () =>
        // Đổi mật khẩu: gọi API để đổi mật khẩu
        // Ví dụ: await changeUserPassword({ currentPassword, newPassword })
        // Tạm thời chỉ return success
        Promise.resolve({ success: true })


    // Custom Theme Actions
    const saveCustomTheme = (themeData) => {
        const existingIndex = customThemes.value.findIndex(t => t.id === themeData.id)
        if (existingIndex >= 0) {
            customThemes.value[existingIndex] = themeData
        } else {
            customThemes.value.push(themeData)
        }
        saveCustomThemes(customThemes.value)
    }

    const deleteCustomTheme = (themeId) => {
        customThemes.value = customThemes.value.filter(t => t.id !== themeId)
        saveCustomThemes(customThemes.value)
    }

    const applyCustomTheme = (themeData) => {
        // Apply custom theme CSS variables
        if (typeof document !== 'undefined') {
            const root = document.documentElement
            Object.entries(themeData.colors || {}).forEach(([key, value]) => {
                root.style.setProperty(`--color-${key}`, value)
            })
        }
    }

    // Layout Preferences Actions
    const updateLayoutPreferences = (preferences) => {
        layoutPreferences.value = { ...layoutPreferences.value, ...preferences }
        saveLayoutPreferences(layoutPreferences.value)
        applyLayoutPreferences()
    }

    const applyLayoutPreferences = () => {
        if (typeof document === 'undefined') return
        const root = document.documentElement
        const prefs = layoutPreferences.value

        // Sidebar width - set data attribute
        if (prefs.sidebarWidth) {
            root.setAttribute('data-sidebar-width', prefs.sidebarWidth)
        }

        // Spacing - set data attribute and CSS variable
        if (prefs.spacing) {
            root.setAttribute('data-spacing', prefs.spacing)
            const spacingMultiplier = prefs.spacing === 'compact' ? 0.85 : prefs.spacing === 'comfortable' ? 1.15 : 1
            root.style.setProperty('--spacing-multiplier', spacingMultiplier)
        }

        // Font size - set data attribute and CSS variable
        if (prefs.fontSize) {
            root.setAttribute('data-font-size', prefs.fontSize)
            const fontSizeMultiplier = prefs.fontSize === 'small' ? 0.9 : prefs.fontSize === 'large' ? 1.1 : 1
            root.style.setProperty('--font-size-multiplier', fontSizeMultiplier)
        }

        // Border radius - set data attribute
        if (prefs.borderRadius) {
            root.setAttribute('data-border-radius', prefs.borderRadius)
        }

        // Animations - set data attribute
        if (prefs.animations) {
            root.setAttribute('data-animations', prefs.animations)
        }
    }

    // Component Styles Actions
    const updateComponentStyles = (styles) => {
        componentStyles.value = { ...componentStyles.value, ...styles }
        saveComponentStyles(componentStyles.value)
        applyComponentStyles()
    }

    const applyComponentStyles = () => {
        if (typeof document === 'undefined') return
        const root = document.documentElement
        const styles = componentStyles.value

        // Button style
        if (styles.buttonStyle) {
            root.setAttribute('data-button-style', styles.buttonStyle)
        }

        // Table style
        if (styles.tableStyle) {
            root.setAttribute('data-table-style', styles.tableStyle)
        }

        // Card style
        if (styles.cardStyle) {
            root.setAttribute('data-card-style', styles.cardStyle)
        }

        // Input style
        if (styles.inputStyle) {
            root.setAttribute('data-input-style', styles.inputStyle)
        }
    }

    // Dark Mode Settings Actions
    const updateDarkModeSettings = (settings) => {
        darkModeSettings.value = { ...darkModeSettings.value, ...settings }
        saveDarkModeSettings(darkModeSettings.value)
    }

    // Initialize theme on store creation
    const stored = getStoredTheme()
    if (stored) {
        currentTheme.value = normalizeTheme(stored)
    }

    // Apply preferences on init
    applyLayoutPreferences()
    applyComponentStyles()

    return {
        // State
        currentTheme,
        language,
        notificationSound,
        christmasEffectEnabled,
        showDevDemoFeatures,
        userProfile,
        customThemes,
        layoutPreferences,
        componentStyles,
        darkModeSettings,
        // Actions
        setTheme,
        setLanguage,
        setNotificationSound,
        setChristmasEffect,
        setShowDevDemoFeatures,
        updateProfile,
        changePassword,
        // Custom Theme Actions
        saveCustomTheme,
        deleteCustomTheme,
        applyCustomTheme,
        // Layout Actions
        updateLayoutPreferences,
        applyLayoutPreferences,
        // Component Styles Actions
        updateComponentStyles,
        applyComponentStyles,
        // Dark Mode Actions
        updateDarkModeSettings
    }
})
