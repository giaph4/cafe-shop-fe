import api from '@/api/axios'
import { buildApiError } from '@/api/utils/errorHandler'
import { normalizePage } from './transformers'
import { normalizeMessage, normalizeMessageList } from './normalizers'

/**
 * @param {number} conversationId
 * @param {{ beforeMessageId?: number, page?: number, size?: number }} [params]
 * @returns {Promise<import('./types').MessagePage>}
 */
export const listMessages = async (conversationId, params = {}) => {
    const { beforeMessageId, page = 0, size = 20 } = params
    try {
        const { data } = await api.get(`/api/chat/conversations/${conversationId}/messages`, {
            params: {
                beforeMessageId,
                page,
                size
            }
        })
        const normalized = normalizePage(data)
        const items = normalizeMessageList(normalized.items)
        return { ...normalized, items }
    } catch (error) {
        throw buildApiError(error)
    }
}

/**
 * @param {number} conversationId
 * @param {string} content
 * @returns {Promise<import('./types').Message>}
 */
export const sendTextMessage = async (conversationId, content) => {
    const body = new URLSearchParams({ content: content?.trim?.() ?? '' })
    try {
        const { data } = await api.post(`/api/chat/conversations/${conversationId}/messages/text`, body, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        return normalizeMessage(data)
    } catch (error) {
        throw buildApiError(error)
    }
}

/**
 * @param {number} conversationId
 * @param {string} code
 * @returns {Promise<import('./types').Message>}
 */
export const sendEmojiMessage = async (conversationId, code) => {
    const body = new URLSearchParams({ code })
    try {
        const { data } = await api.post(`/api/chat/conversations/${conversationId}/messages/emoji`, body, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        return normalizeMessage(data)
    } catch (error) {
        throw buildApiError(error)
    }
}

/**
 * @param {number} conversationId
 * @param {{ files: File[], messageText?: string }} payload
 * @param {(progress: number) => void} [onProgress]
 * @returns {Promise<import('./types').Message>}
 */
export const sendAttachmentMessage = async (conversationId, payload, onProgress) => {
    const form = new FormData()
    if (payload?.messageText) {
        form.append('messageText', payload.messageText)
    }
    if (Array.isArray(payload?.files)) {
        payload.files.forEach((file) => {
            if (file) {
                form.append('files', file)
            }
        })
    }

    try {
        const { data } = await api.post(`/api/chat/conversations/${conversationId}/messages/attachments`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (event) => {
                if (!onProgress || !event?.total) return
                const percentage = Math.round((event.loaded / event.total) * 100)
                onProgress(percentage)
            }
        })
        return normalizeMessage(data)
    } catch (error) {
        throw buildApiError(error)
    }
}

/**
 * @param {number} messageId
 * @returns {Promise<import('./types').Message>}
 */
export const recallMessage = async (messageId) => {
    try {
        const { data } = await api.post(`/api/chat/messages/${messageId}/recall`)
        return normalizeMessage(data)
    } catch (error) {
        throw buildApiError(error)
    }
}

/**
 * @param {number} messageId
 * @returns {Promise<void>}
 */
export const deleteMessageForCurrentUser = async (messageId) => {
    try {
        await api.delete(`/api/chat/messages/${messageId}`)
    } catch (error) {
        throw buildApiError(error)
    }
}

/**
 * @param {number} conversationId
 * @param {number} messageId
 * @returns {Promise<void>}
 */
export const markSeen = async (conversationId, messageId) => {
    try {
        await api.post(`/api/chat/conversations/${conversationId}/messages/${messageId}/seen`)
    } catch (error) {
        throw buildApiError(error)
    }
}
