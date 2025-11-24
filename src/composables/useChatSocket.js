import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { ref } from 'vue'
import { getAccessToken } from '@/utils/tokenStorage'
import { useChatStore } from '@/store/chat'
import { useAuthStore } from '@/store/auth'
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
        logger.warn('Failed to construct WebSocket URL, fallback to manual concat', error)
        const separator = baseUrl.includes('?') ? '&' : '?'
        return `${baseUrl}${separator}token=${encodeURIComponent(token)}`
    }
}

const apiBase = normalizeUrl(import.meta.env.VITE_API_BASE_URL)
const configuredWs = normalizeUrl(import.meta.env.VITE_CHAT_WS_ENDPOINT)
const rawWsEndpoint = configuredWs || (apiBase ? `${apiBase}/ws` : '/ws')
const WS_ENDPOINT = rawWsEndpoint.startsWith('http') || rawWsEndpoint.startsWith('ws')
    ? rawWsEndpoint
    : `${window.location.origin}${rawWsEndpoint.startsWith('/') ? '' : '/'}${rawWsEndpoint}`

export const useChatSocket = () => {
    const client = ref(null)
    const connected = ref(false)
    const reconnecting = ref(false)
    const lastError = ref(null)

    const chatStore = useChatStore()
    useAuthStore()

    const conversationSubscriptions = new Map()

    const cleanup = () => {
        if (client.value) {
            try {
                client.value.deactivate()
            } catch (error) {
                logger.warn('Failed to deactivate STOMP client', error)
            }
            client.value = null
        }
        connected.value = false
    }

    const buildClient = () => {
        const token = getAccessToken()
        if (!token) {
            cleanup()
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

        const onConnect = () => {
            connected.value = true
            reconnecting.value = false
            lastError.value = null

            subscriptions.conversations = instance.subscribe('/topic/conversations', (message) => {
                const payload = JSON.parse(message.body)
                chatStore.applyConversationUpdate(payload)
            })
        }

        const subscriptions = {}

        instance.onConnect = onConnect

        instance.onDisconnect = () => {
            connected.value = false
        }

        instance.onStompError = (frame) => {
            lastError.value = frame
        }

        instance.onWebSocketError = (event) => {
            lastError.value = event
        }

        instance.onWebSocketClose = () => {
            connected.value = false
            reconnecting.value = true
        }

        return instance
    }

    const connect = (conversationId) => {
        if (client.value) {
            cleanup()
        }

        const instance = buildClient()
        if (!instance) return

        client.value = instance

        const onConnect = () => {
            connected.value = true
            reconnecting.value = false
            lastError.value = null

            subscriptions.conversations = instance.subscribe('/topic/conversations', (message) => {
                const payload = JSON.parse(message.body)
                chatStore.applyConversationUpdate(payload)
            })

            if (conversationId) {
                switchConversation(conversationId)
            }
        }

        instance.onConnect = onConnect

        instance.activate()
    }

    const unsubscribeConversation = (conversationId) => {
        const subs = conversationSubscriptions.get(conversationId)
        if (subs) {
            subs.forEach((sub) => {
                try {
                    sub.unsubscribe()
                } catch (error) {
                    logger.warn('Failed to unsubscribe conversation channel', error)
                }
            })
            conversationSubscriptions.delete(conversationId)
        }
    }

    const watchConversation = (conversationId) => {
        if (!client.value || !connected.value || !conversationId) return
        if (conversationSubscriptions.has(conversationId)) return

        const subs = []
        subs.push(
            client.value.subscribe(`/topic/conversations/${conversationId}`, (message) => {
                const payload = JSON.parse(message.body)
                chatStore.appendIncomingMessage(payload)
            })
        )

        subs.push(
            client.value.subscribe(`/topic/conversations/${conversationId}/seen`, (message) => {
                const payload = JSON.parse(message.body)
                chatStore.applySeenEvent(conversationId, payload)
            })
        )

        subs.push(
            client.value.subscribe(`/topic/conversations/${conversationId}/typing`, (message) => {
                const payload = JSON.parse(message.body)
                chatStore.applyTypingEvent(conversationId, payload)
            })
        )

        conversationSubscriptions.set(conversationId, subs)
    }

    const switchConversation = (conversationId) => {
        if (!conversationId) return
        Array.from(conversationSubscriptions.keys()).forEach((id) => {
            if (id !== conversationId) {
                unsubscribeConversation(id)
            }
        })
        watchConversation(conversationId)
    }

    const sendTyping = (conversationId, typing) => {
        if (!client.value || !connected.value) return
        client.value.publish({
            destination: '/app/chat.typing',
            body: JSON.stringify({ conversationId, typing })
        })
    }

    const disconnect = () => {
        Array.from(conversationSubscriptions.keys()).forEach(unsubscribeConversation)
        cleanup()
    }

    const reset = () => {
        disconnect()
        chatStore.clear()
    }

    const ensureConnected = () => {
        if (connected.value || reconnecting.value) return
        const instance = buildClient()
        if (!instance) return
        client.value = instance
        instance.activate()
    }

    const stop = () => {
        if (client.value) {
            try {
                client.value.deactivate()
            } finally {
                client.value = null
            }
        }
        Array.from(conversationSubscriptions.keys()).forEach(unsubscribeConversation)
        connected.value = false
    }

    return {
        client,
        connected,
        reconnecting,
        lastError,
        connect,
        disconnect,
        watchConversation,
        switchConversation,
        unsubscribeConversation,
        sendTyping,
        reset,
        ensureConnected,
        stop
    }
}
