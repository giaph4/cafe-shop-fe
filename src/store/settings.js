import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import {
    getStoredTheme,
    applyThemeClass,
    persistTheme,
    LIGHT_THEME,
    COMFORT_THEME,
    DARK_THEME,
    normalizeTheme,
    resolveInitialTheme
} from '@/utils/theme'

export const useSettingsStore = defineStore('settings', () => {
    const authStore = useAuthStore()

    // System Settings - sử dụng theme system có sẵn
    const currentTheme = ref(normalizeTheme(getStoredTheme() || resolveInitialTheme()))
    const language = ref(localStorage.getItem('language') || 'vi')
    const notificationSound = ref(localStorage.getItem('notificationSound') !== 'false')
    const christmasEffectEnabled = ref(localStorage.getItem('christmasEffectEnabled') === 'true')

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

    const updateProfile = async (profileData) => {
        // TODO: Gọi API để cập nhật profile
        // Ví dụ: await updateUserProfile(profileData)
        // Tạm thời chỉ cập nhật local state
        if (authStore.user) {
            authStore.updateUserFromProfile({
                ...authStore.user,
                ...profileData
            })
        }
    }

    const changePassword = async (currentPassword, newPassword) => {
        // TODO: Gọi API để đổi mật khẩu
        // Ví dụ: await changeUserPassword({ currentPassword, newPassword })
        // Tạm thời chỉ return success
        return Promise.resolve({ success: true })
    }

    // Initialize theme on store creation
    const stored = getStoredTheme()
    if (stored) {
        currentTheme.value = normalizeTheme(stored)
    }

    return {
        // State
        currentTheme,
        language,
        notificationSound,
        christmasEffectEnabled,
        userProfile,
        // Actions
        setTheme,
        setLanguage,
        setNotificationSound,
        setChristmasEffect,
        updateProfile,
        changePassword
    }
})
