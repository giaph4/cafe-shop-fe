/**
 * API Configuration constants
 * MAGIC NUMBER FIX: Centralize all API-related constants để dễ maintain và test
 */

/**
 * Default timeout cho API requests (milliseconds)
 * 15 seconds = 15000ms
 */
export const API_TIMEOUT = 15000

/**
 * API base URL từ environment variable
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

/**
 * WebSocket endpoints
 */
export const WS_ENDPOINT = import.meta.env.VITE_CHAT_WS_ENDPOINT
export const SHIFT_WS_ENDPOINT = import.meta.env.VITE_SHIFT_WS_ENDPOINT

/**
 * Retry configuration
 */
export const MAX_RETRY_ATTEMPTS = 3
export const RETRY_DELAY_MS = 1000

/**
 * Refresh token timeout (milliseconds)
 * HANGING REQUESTS FIX: Timeout ngắn hơn cho refresh token để tránh hang quá lâu
 * Refresh token nên nhanh hơn normal requests (5s thay vì 15s)
 */
export const REFRESH_TOKEN_TIMEOUT = 5000

