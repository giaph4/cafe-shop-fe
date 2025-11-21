import { ensureArray } from './transformers'

const toInteger = (value, fallback = null) => {
    if (value === null || value === undefined) return fallback
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
}

const toBoolean = (value, fallback = false) => {
    if (typeof value === 'boolean') return value
    if (value === null || value === undefined) return fallback
    return Boolean(value)
}

const toNullableString = (value) => {
    if (typeof value !== 'string') return null
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
}

const toStringRequired = (value, fallback = '') => {
    if (typeof value === 'string' && value.trim().length) {
        return value
    }
    return fallback
}

const sanitizeEnum = (value, allowed, fallback) => {
    if (typeof value === 'string' && allowed.has(value)) {
        return value
    }
    return fallback
}

const MESSAGE_TYPES = new Set(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'EMOJI'])
const MESSAGE_STATUSES = new Set(['SENT', 'RECALLED'])
const CONVERSATION_TYPES = new Set(['DIRECT', 'GROUP'])
const MEMBER_ROLES = new Set(['OWNER', 'ADMIN', 'MEMBER'])

export const normalizeAttachment = (payload) => {
    if (!payload || typeof payload !== 'object') return null
    return {
        id: toInteger(payload.id),
        originalName: toStringRequired(payload.originalName, ''),
        storedUrl: toStringRequired(payload.storedUrl, ''),
        previewUrl: toNullableString(payload.previewUrl),
        mimeType: toNullableString(payload.mimeType),
        size: toInteger(payload.size)
    }
}

export const normalizeMessage = (payload) => {
    if (!payload || typeof payload !== 'object') return null

    const attachments = ensureArray(payload.attachments)
        .map(normalizeAttachment)
        .filter(Boolean)

    const seenByUserIds = ensureArray(payload.seenByUserIds)
        .map((id) => toInteger(id))
        .filter((id) => id !== null)

    const contentType = sanitizeEnum(payload.contentType, MESSAGE_TYPES, 'TEXT')
    const status = sanitizeEnum(payload.status, MESSAGE_STATUSES, 'SENT')

    return {
        id: toInteger(payload.id),
        conversationId: toInteger(payload.conversationId),
        senderId: toInteger(payload.senderId),
        senderName: toStringRequired(payload.senderName, 'Không xác định'),
        senderAvatar: toNullableString(payload.senderAvatar),
        content: typeof payload.content === 'string' ? payload.content : null,
        contentType,
        status,
        metadata: typeof payload.metadata === 'string' ? payload.metadata : null,
        createdAt: typeof payload.createdAt === 'string' ? payload.createdAt : null,
        updatedAt: typeof payload.updatedAt === 'string' ? payload.updatedAt : null,
        attachments,
        seenByUserIds
    }
}

export const normalizeConversationMember = (payload) => {
    if (!payload || typeof payload !== 'object') return null
    const userId = toInteger(payload.userId)
    if (!userId) return null

    const role = sanitizeEnum((payload.role || '').toString().toUpperCase(), MEMBER_ROLES, 'MEMBER')

    return {
        userId,
        username: toNullableString(payload.username),
        fullName: toStringRequired(payload.fullName, payload.username || 'Thành viên'),
        avatarUrl: toNullableString(payload.avatarUrl),
        role,
        pinned: toBoolean(payload.pinned, false),
        muted: toBoolean(payload.muted, false),
        lastReadMessageId: toInteger(payload.lastReadMessageId)
    }
}

export const normalizeConversation = (payload) => {
    if (!payload || typeof payload !== 'object') return null
    const id = toInteger(payload.id)
    if (!id) return null

    const type = sanitizeEnum(payload.type, CONVERSATION_TYPES, 'DIRECT')
    const participants = ensureArray(payload.participants)
        .map(normalizeConversationMember)
        .filter(Boolean)

    let unreadCount = toInteger(payload.unreadCount, 0)
    unreadCount = Number.isFinite(unreadCount) && unreadCount > 0 ? unreadCount : 0

    const lastMessage = payload.lastMessage ? normalizeMessage(payload.lastMessage) : null

    return {
        id,
        type,
        title: toNullableString(payload.title),
        avatarUrl: toNullableString(payload.avatarUrl),
        createdBy: toInteger(payload.createdBy),
        updatedAt: typeof payload.updatedAt === 'string'
            ? payload.updatedAt
            : (typeof payload.createdAt === 'string' ? payload.createdAt : null),
        lastMessage,
        unreadCount,
        pinned: toBoolean(payload.pinned, false),
        participants
    }
}

export const normalizeConversationList = (items) => ensureArray(items)
    .map(normalizeConversation)
    .filter(Boolean)

export const normalizeMessageList = (items) => ensureArray(items)
    .map(normalizeMessage)
    .filter(Boolean)

export const normalizeMemberList = (items) => ensureArray(items)
    .map(normalizeConversationMember)
    .filter(Boolean)
