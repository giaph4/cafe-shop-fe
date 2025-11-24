import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { ref } from 'vue'
import { getAccessToken } from '@/utils/tokenStorage'
import logger from '@/utils/logger'

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

const apiBase = normalizeUrl(import.meta.env.VITE_API_BASE_URL)
const configuredShiftWs = normalizeUrl(import.meta.env.VITE_SHIFT_WS_ENDPOINT)
const configuredChatWs = normalizeUrl(import.meta.env.VITE_CHAT_WS_ENDPOINT)
const rawWsEndpoint = configuredShiftWs || configuredChatWs || (apiBase ? `${apiBase}/ws` : '/ws')
const WS_ENDPOINT = rawWsEndpoint.startsWith('http') || rawWsEndpoint.startsWith('ws')
    ? rawWsEndpoint
    : `${window.location.origin}${rawWsEndpoint.startsWith('/') ? '' : '/'}${rawWsEndpoint}`

const DESTINATION = '/topic/shifts/session-events'

export const useShiftSessionEvents = (handleEvent) => {
    const client = ref(null)
    const connected = ref(false)
    const connecting = ref(false)
    const lastError = ref(null)
    const lastSessionEvent = ref(null)
    const reconnectAttempts = ref(0)
    let subscription = null

    const clearSubscription = () => {
        if (subscription) {
            try {
                subscription.unsubscribe()
            } catch (error) {
                logger.warn('Failed to unsubscribe from shift session events', error)
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
                logger.warn('Failed to deactivate shift session STOMP client', error)
            }
            client.value = null
        }
        connected.value = false
        connecting.value = false
    }

    const buildClient = () => {
        const token = getAccessToken()
        if (!token) {
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
            subscription = instance.subscribe(DESTINATION, (message) => {
                try {
                    const payload = JSON.parse(message.body)
                    lastSessionEvent.value = payload
                    if (typeof handleEvent === 'function') {
                        handleEvent(payload)
                    }
                } catch (error) {
                    logger.warn('Failed to parse shift session event payload', error)
                }
            })
        }

        instance.onStompError = (frame) => {
            lastError.value = frame
            logger.warn('STOMP error received for shift session events', frame)
        }

        instance.onWebSocketError = (event) => {
            lastError.value = event
            logger.warn('WebSocket error for shift session events', event)
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

    return {
        client,
        connected,
        connecting,
        lastError,
        lastSessionEvent,
        reconnectAttempts,
        connect,
        disconnect,
        ensureConnected
    }
}
