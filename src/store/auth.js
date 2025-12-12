import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as authService from '@/api/authService'
import api from '@/api/axios'
import logger from '@/utils/logger'
import {
    getAccessToken,
    getRefreshToken,
    persistTokens,
    clearTokens,
    persistUser,
    getUserFromStorage,
    clearUser
} from '@/utils/tokenStorage'

export const useAuthStore = defineStore('auth', () => {
    const token = ref(getAccessToken() || null)
    const refreshToken = ref(getRefreshToken() || null)
    const user = ref(getUserFromStorage())
    const router = useRouter()

    const isAuthenticated = computed(() => Boolean(token.value))
    const userRoles = computed(() => user.value?.roles?.map(r => r.name) || [])
    const isAdmin = computed(() => userRoles.value.includes('ROLE_ADMIN'))
    const isManager = computed(() => userRoles.value.includes('ROLE_MANAGER'))
    const isStaff = computed(() => userRoles.value.includes('ROLE_STAFF'))

    const setAuthData = ({ accessToken, refreshToken: nextRefresh, user: nextUser, meta }) => {
        if (!accessToken || !nextUser) return
        token.value = accessToken
        refreshToken.value = typeof nextRefresh === 'string' && nextRefresh.length ? nextRefresh : null
        user.value = nextUser
        persistTokens(accessToken, refreshToken.value || '', meta)
        persistUser(nextUser)
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
    }

    const updateUserFromProfile = (profile) => {
        if (!profile) return
        const currentUser = user.value || {}

        const mappedRoles = Array.isArray(profile.roles)
            ? profile.roles.map((role) => ({ id: role.id, name: role.name }))
            : currentUser.roles || []

        const nextUser = {
            ...currentUser,
            id: profile.id ?? currentUser.id ?? null,
            username: profile.username ?? currentUser.username ?? null,
            fullName: profile.fullName ?? currentUser.fullName ?? '',
            roles: mappedRoles,
            avatar: profile.avatarUrl ?? null,
            avatarUrl: profile.avatarUrl ?? null,
            email: profile.email ?? currentUser.email ?? null,
            status: profile.status ?? currentUser.status ?? null
        }

        user.value = nextUser
        persistUser(nextUser)

        if (token.value) {
            api.defaults.headers.common.Authorization = `Bearer ${token.value}`
        }
    }

    const clearAuthData = () => {
        token.value = null
        refreshToken.value = null
        user.value = null
        clearTokens()
        clearUser()
        delete api.defaults.headers.common.Authorization
    }

    const decodeToken = (jwt) => {
        if (!jwt) return null
        try {
            const parts = jwt.split('.')
            if (parts.length !== 3) return null
            const payload = parts[1]
                .replace(/-/g, '+')
                .replace(/_/g, '/')
            const decoded = JSON.parse(atob(payload))
            return decoded
        } catch {
            // JWT decode failed - return null silently
            return null
        }
    }

    const buildUserFromToken = (claims) => {
        if (!claims) return null

        const roles = Array.isArray(claims.authorities)
            ? claims.authorities.map((role) => typeof role === 'string' ? role : role.authority)
            : []

        return {
            id: claims.userId ?? null,
            username: claims.sub ?? claims.username ?? null,
            fullName: claims.fullName ?? '',
            roles: roles.filter(Boolean).map((role) => ({ name: role }))
        }
    }

    const isTokenExpired = (claims) => {
        if (!claims?.exp) return false
        const currentTime = Math.floor(Date.now() / 1000)
        return claims.exp < currentTime
    }

    const login = async (credentials) => {
        const data = await authService.login(credentials)

        /**
         * Map response từ backend về format chuẩn.
         * Hỗ trợ nhiều format response khác nhau:
         * - Format 1: { accessToken, refreshToken, user, expiresIn, refreshExpiresIn }
         * - Format 2: { token, refreshToken, user, username }
         * - Format 3: { access_token, refresh_token, user } (OAuth2 style)
         *
         * @param {Object} payload - Response từ backend
         * @returns {Object|null} Mapped response hoặc null nếu không hợp lệ
         */
        const mapResponse = (payload) => {
            if (!payload || typeof payload !== 'object') {
                if (import.meta.env.DEV) {
                    logger.warn('[AuthStore] Invalid login response payload:', payload)
                }
                return null
            }

            // Format 1: accessToken (chuẩn)
            if (payload.accessToken) {
                const accessToken = String(payload.accessToken).trim()
                if (!accessToken) {
                    if (import.meta.env.DEV) {
                        logger.warn('[AuthStore] accessToken is empty')
                    }
                    return null
                }

                const claims = decodeToken(accessToken)
                const derivedUser = payload.user
                    || buildUserFromToken(claims)
                    || null

                if (!derivedUser) {
                    if (import.meta.env.DEV) {
                        logger.warn('[AuthStore] Could not derive user from accessToken or payload.user')
                    }
                }

                return {
                    accessToken,
                    refreshToken: String(payload.refreshToken || '').trim(),
                    user: derivedUser,
                    meta: {
                        expiresIn: payload.expiresIn,
                        refreshExpiresIn: payload.refreshExpiresIn,
                        loggedInAt: Date.now()
                    }
                }
            }

            // Format 2: token (legacy)
            if (payload.token) {
                const token = String(payload.token).trim()
                if (!token) {
                    if (import.meta.env.DEV) {
                        logger.warn('[AuthStore] token is empty')
                    }
                    return null
                }

                const claims = decodeToken(token)
                const derivedUser = payload.user
                    || buildUserFromToken(claims)
                    || {
                        id: claims?.userId ?? null,
                        username: payload.username || claims?.sub || claims?.username || null,
                        fullName: claims?.fullName || payload.fullName || payload.username || '',
                        roles: Array.isArray(claims?.authorities)
                            ? claims.authorities.map(r => ({ name: typeof r === 'string' ? r : r.authority }))
                            : []
                    }

                return {
                    accessToken: token,
                    refreshToken: String(payload.refreshToken || '').trim(),
                    user: derivedUser,
                    meta: {
                        loggedInAt: Date.now(),
                        expiresIn: claims?.exp ? claims.exp - Math.floor(Date.now() / 1000) : null
                    }
                }
            }

            // Format 3: access_token (OAuth2 style)
            if (payload.access_token) {
                const accessToken = String(payload.access_token).trim()
                if (!accessToken) {
                    if (import.meta.env.DEV) {
                        logger.warn('[AuthStore] access_token is empty')
                    }
                    return null
                }

                const claims = decodeToken(accessToken)
                const derivedUser = payload.user
                    || buildUserFromToken(claims)
                    || null

                return {
                    accessToken,
                    refreshToken: String(payload.refresh_token || '').trim(),
                    user: derivedUser,
                    meta: {
                        expiresIn: payload.expires_in,
                        refreshExpiresIn: payload.refresh_expires_in,
                        loggedInAt: Date.now()
                    }
                }
            }

            // Không tìm thấy format hợp lệ
            if (import.meta.env.DEV) {
                logger.warn('[AuthStore] Unknown login response format. Expected accessToken, token, or access_token:', Object.keys(payload))
            }
            return null
        }

        const mapped = mapResponse(data)
        if (!mapped?.accessToken || !mapped.user) {
            throw new Error('Invalid login response payload')
        }

        setAuthData(mapped)
    }

    const logout = () => {
        clearAuthData()
        if (router) {
            router.push('/login')
        } else {
            // Fallback for non-component usage
            window.location.href = '/login'
        }
    }

    const checkAuth = async () => {
        const storedAccess = getAccessToken()
        const storedUser = getUserFromStorage()

        if (!storedAccess || !storedUser) {
            clearAuthData()
            return
        }

        token.value = storedAccess
        refreshToken.value = getRefreshToken() || null
        user.value = storedUser
        api.defaults.headers.common.Authorization = `Bearer ${storedAccess}`

        const claims = decodeToken(storedAccess)
        if (claims && isTokenExpired(claims)) {
            // Token đã hết hạn, thử refresh nếu có refresh token
            const storedRefresh = getRefreshToken()
            if (storedRefresh) {
                try {
                    await refreshAccessToken()
                    // Refresh thành công, token mới đã được cập nhật trong interceptor
                    const newAccess = getAccessToken()
                    if (newAccess) {
                        token.value = newAccess
                        refreshToken.value = getRefreshToken() || null
                        api.defaults.headers.common.Authorization = `Bearer ${newAccess}`
                    }
                } catch (error) {
                    // Refresh thất bại, logout
                    logger.warn('Failed to refresh token on checkAuth:', error)
                    clearAuthData()
                }
            } else {
                // Không có refresh token, logout
                clearAuthData()
            }
        }
    }

    /**
     * Refresh access token bằng refresh token hiện tại
     * @returns {Promise<void>}
     */
    const refreshAccessToken = async () => {
        const currentRefresh = getRefreshToken()
        if (!currentRefresh) {
            throw new Error('No refresh token available')
        }

        try {
            const data = await authService.refreshToken(currentRefresh)

            // Map response tương tự như login
            const mapResponse = (payload) => {
                if (!payload) return null
                if (payload.accessToken) {
                    const derivedUser = payload.user || buildUserFromToken(decodeToken(payload.accessToken)) || user.value
                    return {
                        accessToken: payload.accessToken,
                        refreshToken: payload.refreshToken || currentRefresh,
                        user: derivedUser,
                        meta: {
                            expiresIn: payload.expiresIn,
                            refreshExpiresIn: payload.refreshExpiresIn,
                            refreshedAt: Date.now()
                        }
                    }
                }

                if (payload.token) {
                    const claims = decodeToken(payload.token)
                    const derivedUser = payload.user
                        || buildUserFromToken(claims)
                        || user.value
                        || {
                            id: claims?.userId ?? null,
                            username: claims?.sub || claims?.username || null,
                            fullName: claims?.fullName || '',
                            roles: []
                        }

                    return {
                        accessToken: payload.token,
                        refreshToken: payload.refreshToken || currentRefresh,
                        user: derivedUser,
                        meta: { refreshedAt: Date.now() }
                    }
                }

                return null
            }

            const mapped = mapResponse(data)
            if (!mapped?.accessToken) {
                throw new Error('Invalid refresh token response: missing access token')
            }

            // Cập nhật auth data với token mới
            setAuthData(mapped)
        } catch (error) {
            // Refresh thất bại, logout
            clearAuthData()
            throw error
        }
    }

    const handleUnauthorized = () => {
        clearAuthData()
        if (router.currentRoute.value?.name !== 'Login') {
            router.push('/login')
        }
    }

    // MEMORY LEAK FIX: Store cleanup function để có thể remove listener
    let unauthorizedListener = null
    if (typeof window !== 'undefined') {
        unauthorizedListener = handleUnauthorized
        window.addEventListener('auth:unauthorized', handleUnauthorized)
    }

    // Cleanup function để remove event listener
    const cleanup = () => {
        if (typeof window !== 'undefined' && unauthorizedListener) {
            window.removeEventListener('auth:unauthorized', unauthorizedListener)
            unauthorizedListener = null
        }
    }

    return {
        token,
        user,
        isAuthenticated,
        userRoles,
        isAdmin,
        isManager,
        isStaff,
        login,
        logout,
        checkAuth,
        refreshAccessToken,
        updateUserFromProfile,
        handleUnauthorized,
        cleanup
    }
})
