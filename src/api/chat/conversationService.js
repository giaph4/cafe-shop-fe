import api from '@/api/axios'
import { buildApiError } from '@/api/utils/errorHandler'
import { normalizePage } from './transformers'
import {
    normalizeConversation,
    normalizeConversationList,
    normalizeMemberList
} from './normalizers'

/**
 * @param {{ page?: number, size?: number }} [params]
 * @returns {Promise<import('./types').ConversationPage>}
 */
export const listConversations = async (params = {}) => {
    const { page = 0, size = 20 } = params
    try {
        const { data } = await api.get('/api/chat/conversations', {
            params: { page, size }
        })
        const normalized = normalizePage(data)
        const items = normalizeConversationList(normalized.items)
        return { ...normalized, items }
    } catch (error) {
        throw buildApiError(error)
    }
}

/**
 * @param {number} conversationId
 * @returns {Promise<import('./types').ConversationSummary>}
 */
export const getConversation = async (conversationId) => {
    try {
        const { data } = await api.get(`/api/chat/conversations/${conversationId}`)
        return normalizeConversation(data)
    } catch (error) {
        throw buildApiError(error)
    }
}

/**
 * @param {number} targetUserId
 * @returns {Promise<import('./types').ConversationSummary>}
 */
export const createDirectConversation = async (targetUserId) => {
    try {
        const { data } = await api.post(`/api/chat/conversations/direct/${targetUserId}`)
        return normalizeConversation(data)
    } catch (error) {
        throw buildApiError(error)
    }
}

/**
 * @param {{ title: string, memberIds?: number[] }} payload
 * @returns {Promise<import('./types').ConversationSummary>}
 */
export const createGroupConversation = async (payload) => {
    const body = {
        title: payload?.title ?? '',
        memberIds: Array.isArray(payload?.memberIds) ? payload.memberIds : []
    }
    try {
        const { data } = await api.post('/api/chat/conversations/group', body)
        return normalizeConversation(data)
    } catch (error) {
        throw buildApiError(error)
    }
}

/**
 * @param {number} conversationId
 * @returns {Promise<import('./types').ConversationMember[]>}
 */
export const listMembers = async (conversationId) => {
    try {
        const { data } = await api.get(`/api/chat/conversations/${conversationId}/members`)
        return normalizeMemberList(data)
    } catch (error) {
        throw buildApiError(error)
    }
}

/**
 * @param {number} conversationId
 * @param {boolean} pinned
 * @returns {Promise<void>}
 */
export const pinConversation = async (conversationId, pinned) => {
    try {
        await api.patch(`/api/chat/conversations/${conversationId}/pin`, null, {
            params: { pinned }
        })
    } catch (error) {
        throw buildApiError(error)
    }
}

/**
 * @param {number} conversationId
 * @param {number[]} memberIds
 * @returns {Promise<void>}
 */
export const addMembers = async (conversationId, memberIds) => {
    try {
        await api.post(`/api/chat/conversations/${conversationId}/members`, memberIds)
    } catch (error) {
        throw buildApiError(error)
    }
}

/**
 * @param {number} conversationId
 * @param {number} memberId
 * @returns {Promise<void>}
 */
export const removeMember = async (conversationId, memberId) => {
    try {
        await api.delete(`/api/chat/conversations/${conversationId}/members/${memberId}`)
    } catch (error) {
        throw buildApiError(error)
    }
}

/**
 * @param {number} conversationId
 * @param {number} memberId
 * @param {'OWNER' | 'ADMIN' | 'MEMBER'} role
 * @returns {Promise<void>}
 */
export const updateMemberRole = async (conversationId, memberId, role) => {
    try {
        await api.patch(`/api/chat/conversations/${conversationId}/members/${memberId}/role`, null, {
            params: { role }
        })
    } catch (error) {
        throw buildApiError(error)
    }
}

/**
 * @param {number} conversationId
 * @param {boolean} pinned
 * @returns {Promise<void>}
 */
export const togglePinned = async (conversationId, pinned) => {
    try {
        await api.patch(`/api/chat/conversations/${conversationId}/pin`, null, {
            params: { pinned }
        })
    } catch (error) {
        throw buildApiError(error)
    }
}
