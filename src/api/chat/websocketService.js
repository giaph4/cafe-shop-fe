import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import logger from '@/utils/logger'
import { useAuthStore } from '@/store/auth'
import { getAccessToken } from '@/utils/tokenStorage'

let stompClient = null
let reconnectAttempts = 0
let subscriptions = []
let currentConversationId = null
const MAX_RECONNECT_ATTEMPTS = 10
const RECONNECT_DELAY = 5000

// Normalize URL helper
const normalizeUrl = (value) => (value ? value.replace(/\/?$/, '') : '')

/**
 * Khởi tạo WebSocket connection cho chat
 * @param {Function} onMessage - Callback khi nhận tin nhắn mới
 * @param {Function} onConversationUpdate - Callback khi hội thoại được cập nhật
 * @param {Function} onMessageSeen - Callback khi tin nhắn được đánh dấu đã đọc
 * @returns {Object} { connect, disconnect, subscribeConversation }
 */
export const initChatWebSocket = (onMessage, onConversationUpdate, onMessageSeen) => {
    const authStore = useAuthStore()

    const buildClient = () => {
        const token = getAccessToken()

        if (!token) {
            logger.warn('No token available for WebSocket connection')
            return null
        }

        // Build WebSocket URL - endpoint là /ws (không phải /ws/chat)
        const apiBase = normalizeUrl(import.meta.env.VITE_API_BASE_URL)
        const configuredChatWs = normalizeUrl(import.meta.env.VITE_CHAT_WS_ENDPOINT)
        const rawWsEndpoint = configuredChatWs || (apiBase ? `${apiBase}/ws` : '/ws')
        let wsBaseUrl = rawWsEndpoint.startsWith('http') || rawWsEndpoint.startsWith('ws')
            ? rawWsEndpoint
            : `${window.location.origin}${rawWsEndpoint.startsWith('/') ? '' : '/'}${rawWsEndpoint}`

        // Thêm token vào query parameter để JwtHandshakeInterceptor có thể đọc được
        // Backend hỗ trợ cả Authorization header và token query parameter
        const separator = wsBaseUrl.includes('?') ? '&' : '?'
        wsBaseUrl = `${wsBaseUrl}${separator}token=${encodeURIComponent(token)}`

        logger.info(`Connecting to WebSocket: ${wsBaseUrl.replace(/token=[^&]+/, 'token=***')}`)

        const socket = new SockJS(wsBaseUrl, null, {
            transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
            transportOptions: {
                'xhr-polling': { timeout: 20000 }
            }
        })

        const client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: RECONNECT_DELAY,
            maxWebSocketChunkSize: 8 * 1024,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            debug: import.meta.env.DEV ? (str) => logger.debug(str) : undefined,
            onConnect: () => {
                logger.info('Chat WebSocket connected')
                reconnectAttempts = 0

                // Subscribe to conversation updates (global)
                subscriptions.push(
                    client.subscribe('/topic/conversations', (message) => {
                        try {
                            const data = JSON.parse(message.body)
                            onConversationUpdate?.(data)
                        } catch (err) {
                            logger.error('Error parsing conversation update:', err)
                        }
                    })
                )

                // Subscribe to current conversation messages if selected
                if (currentConversationId) {
                    subscribeToConversation(client, currentConversationId, onMessage, onMessageSeen)
                }
            },
            onStompError: (frame) => {
                const errorMsg = frame.headers?.['message'] || 'Unknown STOMP error'
                logger.error('STOMP error:', errorMsg)
                
                // Nếu lỗi 401 hoặc 403, thử refresh token
                if (frame.headers?.['status'] === '401' || frame.headers?.['status'] === '403') {
                    handleTokenExpired()
                }
            },
            onWebSocketError: (event) => {
                logger.error('WebSocket error:', event)
            },
            onWebSocketClose: (event) => {
                logger.warn('Chat WebSocket closed', event.code)
                
                // Nếu close code là 1006 (abnormal closure) hoặc 1008 (policy violation)
                // có thể do token hết hạn
                if (event.code === 1006 || event.code === 1008) {
                    handleTokenExpired()
                } else if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts++
                    setTimeout(() => {
                        if (stompClient && !stompClient.connected) {
                            logger.info(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`)
                            stompClient.activate()
                        }
                    }, RECONNECT_DELAY)
                }
            },
            onDisconnect: () => {
                logger.info('Chat WebSocket disconnected')
                subscriptions = []
            }
        })

        return client
    }

    const handleTokenExpired = async () => {
        try {
            const authStore = useAuthStore()
            await authStore.refreshAccessToken()
            // Reconnect với token mới
            disconnect()
            setTimeout(() => {
                connect()
            }, 1000)
        } catch (err) {
            logger.error('Failed to refresh token, redirecting to login:', err)
            // Redirect to login nếu refresh thất bại
            if (typeof window !== 'undefined') {
                window.location.href = '/login'
            }
        }
    }

    const subscribeToConversation = (client, conversationId, onMessage, onMessageSeen) => {
        // Subscribe to messages in conversation
        subscriptions.push(
            client.subscribe(`/topic/conversations/${conversationId}`, (message) => {
                try {
                    const data = JSON.parse(message.body)
                    onMessage?.(data)
                } catch (err) {
                    logger.error('Error parsing message:', err)
                }
            })
        )

        // Subscribe to seen events
        subscriptions.push(
            client.subscribe(`/topic/conversations/${conversationId}/seen`, (message) => {
                try {
                    const data = JSON.parse(message.body)
                    onMessageSeen?.(data)
                } catch (err) {
                    logger.error('Error parsing message seen:', err)
                }
            })
        )
    }

    const connect = () => {
        if (stompClient && stompClient.connected) {
            logger.info('WebSocket already connected')
            return
        }

        // Disconnect existing client if any
        if (stompClient) {
            try {
                stompClient.deactivate()
            } catch (err) {
                logger.warn('Error deactivating existing client:', err)
            }
            stompClient = null
        }

        stompClient = buildClient()
        if (stompClient) {
            try {
                stompClient.activate()
            } catch (err) {
                logger.error('Error activating WebSocket client:', err)
            }
        }
    }

    const disconnect = () => {
        if (stompClient) {
            subscriptions.forEach(sub => {
                try {
                    sub.unsubscribe()
                } catch (err) {
                    logger.warn('Error unsubscribing:', err)
                }
            })
            subscriptions = []
            stompClient.deactivate()
            stompClient = null
        }
    }

    const subscribeConversation = (conversationId) => {
        if (!stompClient || !stompClient.connected) {
            logger.warn('Cannot subscribe: WebSocket not connected')
            return
        }

        // Unsubscribe from previous conversation
        if (currentConversationId && currentConversationId !== conversationId) {
            subscriptions.forEach(sub => {
                try {
                    if (sub.id?.includes(`/topic/conversations/${currentConversationId}`)) {
                        sub.unsubscribe()
                    }
                } catch (err) {
                    logger.warn('Error unsubscribing from previous conversation:', err)
                }
            })
        }

        currentConversationId = conversationId
        subscribeToConversation(stompClient, conversationId, onMessage, onMessageSeen)
    }

    return {
        connect,
        disconnect,
        subscribeConversation,
        isConnected: () => stompClient?.connected || false
    }
}

/**
 * Ngắt kết nối WebSocket
 */
export const disconnectChatWebSocket = () => {
    if (stompClient) {
        subscriptions.forEach(sub => {
            try {
                sub.unsubscribe()
            } catch (err) {
                logger.warn('Error unsubscribing:', err)
            }
        })
        subscriptions = []
        if (stompClient.connected) {
            stompClient.deactivate()
        }
        stompClient = null
        currentConversationId = null
    }
}

