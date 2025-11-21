import {defineStore} from 'pinia'
import {ref, computed} from 'vue'
import {useAuthStore} from '@/store/auth'
import * as userService from '@/api/userService'

export const useProfileStore = defineStore('profile', () => {
    const authStore = useAuthStore()

    const profile = ref(null)
    const roles = ref([])
    const loading = ref(false)
    const saving = ref(false)
    const passwordChanging = ref(false)
    const error = ref('')

    const isAdmin = computed(() => authStore.userRoles.includes('ROLE_ADMIN'))

    const setProfile = (data) => {
        profile.value = data
        authStore.updateUserFromProfile(data)
    }

    const loadProfile = async (userId) => {
        if (!userId) {
            error.value = 'Không xác định được người dùng hiện tại.'
            return
        }
        loading.value = true
        error.value = ''
        try {
            const data = await userService.getUserById(userId)
            setProfile(data)
        } catch (err) {
            console.error(err)
            error.value = err.response?.data?.message || 'Không thể tải thông tin hồ sơ.'
        } finally {
            loading.value = false
        }
    }

    const loadRoles = async () => {
        if (!isAdmin.value) {
            roles.value = profile.value?.roles || []
            return
        }
        try {
            const data = await userService.getAllRoles()
            roles.value = data
        } catch (err) {
            console.error(err)
        }
    }

    const updateProfile = async (userId, payload) => {
        if (!userId) {
            throw new Error('Thiếu thông tin người dùng để cập nhật.')
        }
        saving.value = true
        error.value = ''
        try {
            const body = userService.buildUserUpdatePayload(payload)
            const data = await userService.updateUser(userId, body)
            setProfile(data)
            return data
        } catch (err) {
            console.error(err)
            error.value = err.response?.data?.message || 'Không thể cập nhật hồ sơ.'
            throw err
        } finally {
            saving.value = false
        }
    }

    const changePassword = async (payload) => {
        passwordChanging.value = true
        error.value = ''
        try {
            const trimmed = {
                currentPassword: payload.currentPassword?.trim() || '',
                newPassword: payload.newPassword?.trim() || '',
                confirmationPassword: payload.confirmationPassword?.trim() || ''
            }
            await userService.changePassword(trimmed)
        } catch (err) {
            console.error(err)
            error.value = err.response?.data?.message || 'Không thể đổi mật khẩu.'
            throw err
        } finally {
            passwordChanging.value = false
        }
    }

    return {
        profile,
        roles,
        loading,
        saving,
        passwordChanging,
        error,
        isAdmin,
        loadProfile,
        loadRoles,
        updateProfile,
        changePassword
    }
})
