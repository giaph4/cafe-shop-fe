/**
 * @typedef {Object} ConversationMember
 * @property {number} userId
 * @property {string | null | undefined} [username]
 * @property {string} fullName
 * @property {string | null | undefined} [avatarUrl]
 * @property {'OWNER' | 'ADMIN' | 'MEMBER'} role
 * @property {boolean} pinned
 * @property {boolean} muted
 * @property {number | null | undefined} [lastReadMessageId]
 */

/**
 * @typedef {Object} MessageAttachment
 * @property {number} id
 * @property {string} originalName
 * @property {string} storedUrl
 * @property {string | null | undefined} [previewUrl]
 * @property {string | null | undefined} [mimeType]
 * @property {number | null | undefined} [size]
 */

/**
 * @typedef {'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'EMOJI'} MessageType
 */

/**
 * @typedef {'SENT' | 'RECALLED'} MessageStatus
 */

/**
 * @typedef {Object} Message
 * @property {number} id
 * @property {number} conversationId
 * @property {number} senderId
 * @property {string} senderName
 * @property {string | null | undefined} [senderAvatar]
 * @property {string | null | undefined} [content]
 * @property {MessageType} contentType
 * @property {MessageStatus} status
 * @property {string | null | undefined} [metadata]
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {MessageAttachment[]} attachments
 * @property {number[]} seenByUserIds
 */

/**
 * @typedef {Object} ConversationSummary
 * @property {number} id
 * @property {'DIRECT' | 'GROUP'} type
 * @property {string | null | undefined} [title]
 * @property {string | null | undefined} [avatarUrl]
 * @property {string} updatedAt
 * @property {Message | null | undefined} [lastMessage]
 * @property {number} unreadCount
 * @property {boolean} pinned
 * @property {ConversationMember[]} participants
 */

/**
 * @typedef {Object} ConversationPage
 * @property {ConversationSummary[]} items
 * @property {number} page
 * @property {number} size
 * @property {number} totalPages
 * @property {number} totalElements
 */

/**
 * @typedef {Object} MessagePage
 * @property {Message[]} items
 * @property {number} page
 * @property {number} size
 * @property {number} totalPages
 * @property {number} totalElements
 */

/**
 * @typedef {Object} SeenEventPayload
 * @property {number} messageId
 * @property {number} userId
 */

/**
 * @typedef {{ code: string, message: string, details?: Record<string, unknown> }} ApiErrorResponse
 */
