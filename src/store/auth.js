import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as authService from '@/api/authService'
import api from '@/api/axios'
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

    const isAuthenticated = computed(() => !!token.value)
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
        } catch (error) {
            console.error('Failed to decode JWT', error)
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

        const mapResponse = (payload) => {
            if (!payload) return null
            if (payload.accessToken) {
                const derivedUser = payload.user || buildUserFromToken(decodeToken(payload.accessToken)) || null
                return {
                    accessToken: payload.accessToken,
                    refreshToken: payload.refreshToken || '',
                    user: derivedUser,
                    meta: {
                        expiresIn: payload.expiresIn,
                        refreshExpiresIn: payload.refreshExpiresIn,
                        loggedInAt: Date.now()
                    }
                }
            }

            if (payload.token) {
                const claims = decodeToken(payload.token)
                const derivedUser = payload.user
                    || buildUserFromToken(claims)
                    || {
                        id: claims?.userId ?? null,
                        username: payload.username || claims?.sub || null,
                        fullName: claims?.fullName || payload.username || '',
                        roles: []
                    }

                return {
                    accessToken: payload.token,
                    refreshToken: payload.refreshToken || '',
                    user: derivedUser,
                    meta: { loggedInAt: Date.now() }
                }
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
            clearAuthData()
        }
    }

    const handleUnauthorized = () => {
        clearAuthData()
        if (router.currentRoute.value?.name !== 'Login') {
            router.push('/login')
        }
    }

    if (typeof window !== 'undefined') {
        window.addEventListener('auth:unauthorized', handleUnauthorized)
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
        updateUserFromProfile,
        handleUnauthorized
    }
})
