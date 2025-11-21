const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const TOKEN_META_KEY = 'tokenMeta'
const USER_KEY = 'user'

const emit = (name, detail) => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent(name, { detail }))
}

export const getAccessToken = () => {
    if (typeof localStorage === 'undefined') return ''
    return localStorage.getItem(ACCESS_TOKEN_KEY) || ''
}

export const getRefreshToken = () => {
    if (typeof localStorage === 'undefined') return ''
    return localStorage.getItem(REFRESH_TOKEN_KEY) || ''
}

export const persistTokens = (accessToken, refreshToken, meta = {}) => {
    if (typeof localStorage === 'undefined') return
    if (accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    }
    if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    }
    if (meta && Object.keys(meta).length) {
        localStorage.setItem(TOKEN_META_KEY, JSON.stringify(meta))
    }
    emit('auth:tokens-updated', { accessToken: accessToken || '', refreshToken: refreshToken || '', meta })
}

export const getTokenMeta = () => {
    if (typeof localStorage === 'undefined') return {}
    try {
        const raw = localStorage.getItem(TOKEN_META_KEY)
        return raw ? JSON.parse(raw) : {}
    } catch (error) {
        console.warn('Failed to parse token metadata', error)
        return {}
    }
}

export const clearTokens = () => {
    if (typeof localStorage === 'undefined') return
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(TOKEN_META_KEY)
    emit('auth:tokens-cleared')
}

export const clearUser = () => {
    if (typeof localStorage === 'undefined') return
    localStorage.removeItem(USER_KEY)
    emit('auth:user-cleared')
}

export const persistUser = (user) => {
    if (typeof localStorage === 'undefined') return
    if (!user) {
        localStorage.removeItem(USER_KEY)
        emit('auth:user-cleared')
        return
    }
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    emit('auth:user-updated', { user })
}

export const getUserFromStorage = () => {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
        return JSON.parse(raw)
    } catch (error) {
        console.warn('Failed to parse user data', error)
        return null
    }
}

export const TOKEN_STORAGE_KEYS = Object.freeze({
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    TOKEN_META_KEY,
    USER_KEY
})
