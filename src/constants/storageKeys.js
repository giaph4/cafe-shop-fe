/**
 * LocalStorage keys constants
 * MAGIC STRING FIX: Centralize all localStorage keys để dễ maintain
 *
 * Usage:
 * import { STORAGE_KEYS } from '@/constants/storageKeys'
 * localStorage.setItem(STORAGE_KEYS.FILE_MANAGEMENT_FILES, data)
 */

export const STORAGE_KEYS = Object.freeze({
    // Auth keys (đã có trong tokenStorage.js, nhưng export để reference)
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    TOKEN_META: 'tokenMeta',
    USER: 'user',

    // File management
    FILE_MANAGEMENT_FILES: 'fileManagement:files'

    // Add more keys here as needed
})

