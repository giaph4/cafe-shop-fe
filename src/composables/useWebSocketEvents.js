/**
 * === SECTION: UNIFIED WEBSOCKET EVENTS COMPOSABLE ===
 * Composable chung cho WebSocket connections với STOMP
 * PERFORMANCE FIX: Gộp useTableEvents và useDashboardEvents để giảm code duplication
 * MEMORY LEAK FIX: Đảm bảo cleanup đúng cách khi component unmount
 */

import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { ref, onBeforeUnmount } from 'vue'
import { getAccessToken } from '@/utils/tokenStorage'
import logger from '@/utils/logger'

// === SECTION: UTILITY FUNCTIONS ===

if (typeof window !== 'undefined' && typeof window.global === 'undefined') {
    window.global = window
}

const normalizeUrl = (value) => (value ? value.replace(/\/?$/, '') : '')

const appendTokenParam = (baseUrl, token) => {
    if (!baseUrl) return baseUrl
    try {
        const url = new URL(baseUrl, typeof window !== 'undefined' ? window.location.origin : undefined)
        url.searchParams.set('token', token)
        return url.toString()
    } catch (error) {
        logger.warn('Failed to build WebSocket URL, fallback to manual concat', error)
        const separator = baseUrl.includes('?') ? '&' : '?'
        return `${baseUrl}${separator}token=${encodeURIComponent(token)}`
    }
}

// === SECTION: WEBSOCKET CONFIGURATION ===

const apiBase = normalizeUrl(import.meta.env.VITE_API_BASE_URL)
const configuredShiftWs = normalizeUrl(import.meta.env.VITE_SHIFT_WS_ENDPOINT)
const configuredChatWs = normalizeUrl(import.meta.env.VITE_CHAT_WS_ENDPOINT)
const rawWsEndpoint = configuredShiftWs || configuredChatWs || (apiBase ? `${apiBase}/ws` : '/ws')
const WS_ENDPOINT = rawWsEndpoint.startsWith('http') || rawWsEndpoint.startsWith('ws')
    ? rawWsEndpoint
    : `${window.location.origin}${rawWsEndpoint.startsWith('/') ? '' : '/'}${rawWsEndpoint}`

// === SECTION: MAIN COMPOSABLE ===

/**
 * Composable để kết nối WebSocket và nhận real-time updates
 * @param {Function} handleEvent - Callback function để xử lý events từ WebSocket
 * @param {Object} options - Options
 * @param {string} options.destination - STOMP destination topic (required)
 * @param {string} options.context - Context name for logging (default: 'WebSocket')
 * @returns {Object} Object chứa client, connected, connecting, lastError, connect, disconnect, ensureConnected
 */
export const useWebSocketEvents = (handleEvent, options = {}) => {
    const {
        destination,
        context = 'WebSocket'
    } = options

    if (!destination) {
        logger.error(`[${context}] Destination is required`)
        throw new Error('WebSocket destination is required')
    }

    const client = ref(null)
    const connected = ref(false)
    const connecting = ref(false)
    const lastError = ref(null)
    const lastEvent = ref(null)
    const reconnectAttempts = ref(0)
    let subscription = null

    // === SECTION: CLEANUP FUNCTIONS ===

    const clearSubscription = () => {
        if (subscription) {
            try {
                subscription.unsubscribe()
            } catch (error) {
                logger.warn(`[${context}] Failed to unsubscribe`, error)
            }
            subscription = null
        }
    }

    const cleanupClient = async () => {
        clearSubscription()
        if (client.value) {
            try {
                await client.value.deactivate()
            } catch (error) {
                logger.warn(`[${context}] Failed to deactivate STOMP client`, error)
            }
            client.value = null
        }
        connected.value = false
        connecting.value = false
    }

    // === SECTION: CLIENT BUILDING ===

    const buildClient = () => {
        const token = getAccessToken()
        if (!token) {
            logger.warn(`[${context}] No access token available`)
            cleanupClient()
            return null
        }

        const httpUrlWithToken = appendTokenParam(WS_ENDPOINT, token)

        const instance = new Client({
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            brokerURL: undefined,
            webSocketFactory: () => new SockJS(httpUrlWithToken, null, { transports: ['websocket'] }),
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            debug: import.meta.env.DEV ? logger.debug : undefined
        })

        instance.beforeConnect = () => {
            connecting.value = true
        }

        instance.onConnect = () => {
            connected.value = true
            connecting.value = false
            lastError.value = null
            reconnectAttempts.value = 0
            clearSubscription()
            
            // Subscribe to destination topic
            subscription = instance.subscribe(destination, (message) => {
                try {
                    const payload = JSON.parse(message.body)
                    lastEvent.value = payload
                    if (typeof handleEvent === 'function') {
                        handleEvent(payload)
                    }
                } catch (error) {
                    logger.warn(`[${context}] Failed to parse event payload`, error)
                }
            })
        }

        instance.onStompError = (frame) => {
            lastError.value = frame
            logger.warn(`[${context}] STOMP error received`, frame)
        }

        instance.onWebSocketError = (event) => {
            lastError.value = event
            logger.warn(`[${context}] WebSocket error`, event)
        }

        instance.onWebSocketClose = (event) => {
            connected.value = false
            connecting.value = false
            if (!event.wasClean) {
                reconnectAttempts.value += 1
            }
        }

        instance.onDisconnect = () => {
            connected.value = false
        }

        return instance
    }

    // === SECTION: CONNECTION MANAGEMENT ===

    const connect = () => {
        if (connecting.value) {
            return
        }
        if (client.value) {
            if (!client.value.active) {
                connecting.value = true
                client.value.activate()
            }
            return
        }
        const instance = buildClient()
        if (!instance) return
        client.value = instance
        connecting.value = true
        instance.activate()
    }

    const disconnect = () => {
        cleanupClient()
    }

    const ensureConnected = () => {
        if (!connected.value && !connecting.value) {
            connect()
        }
    }

    // === SECTION: CLEANUP ON UNMOUNT ===

    onBeforeUnmount(() => {
        cleanupClient()
    })

    return {
        client,
        connected,
        connecting,
        lastError,
        lastEvent,
        reconnectAttempts,
        connect,
        disconnect,
        ensureConnected
    }
}

// === SECTION: CONVENIENCE EXPORTS ===

/**
 * Composable cho Table status updates
 * @param {Function} handleEvent - Event handler
 * @returns {Object} WebSocket composable result
 */
export const useTableEvents = (handleEvent) => {
    return useWebSocketEvents(handleEvent, {
        destination: '/topic/tables/status-updates',
        context: 'TableEvents'
    })
}

/**
 * Composable cho Dashboard updates
 * @param {Function} handleEvent - Event handler
 * @returns {Object} WebSocket composable result
 */
export const useDashboardEvents = (handleEvent) => {
    return useWebSocketEvents(handleEvent, {
        destination: '/topic/dashboard/updates',
        context: 'DashboardEvents'
    })
}

