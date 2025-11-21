import {defineStore} from 'pinia'
import {ref, computed, shallowReactive} from 'vue'
import { chatConversations, chatMessages } from '@/api/chat'
import { normalizeConversation, normalizeMessage } from '@/api/chat/normalizers'
import * as userService from '@/api/userService'

export const useChatStore = defineStore('chat', () => {
    const createConversationPageState = () => ({
        page: 0,
        size: 20,
        totalPages: 0,
        totalElements: 0,
        first: true,
        last: true,
        empty: true
    })

    const createMessagePageState = () => ({
        page: 0,
        size: 20,
        totalPages: 0,
        totalElements: 0,
        numberOfElements: 0,
        beforeCursor: null,
        hasMore: true,
        first: true,
        last: false,
        empty: true
    })

    const conversations = ref([])
    const conversationPage = ref(createConversationPageState())
    const conversationsLoading = ref(false)
    const conversationsError = ref(null)

    const messages = shallowReactive(new Map())
    const messagePageInfo = shallowReactive(new Map())
    const messageLoading = shallowReactive(new Map())
    const messageError = shallowReactive(new Map())

    const pendingMessages = shallowReactive(new Map())
    const typingStates = shallowReactive(new Map())
    const typingTimers = new Map()

    const conversationMembers = shallowReactive(new Map())
    const membersLoading = shallowReactive(new Map())
    const membersError = shallowReactive(new Map())

    const directorySource = ref([])
    const directoryUsers = ref([])
    const directoryLoading = ref(false)
    const directoryError = ref(null)

    const currentConversationId = ref(null)

    const getMessages = (conversationId) => messages.get(conversationId) || []
    const getPendingMessages = (conversationId) => pendingMessages.get(conversationId) || []
    const getMessagePageInfo = (conversationId) => messagePageInfo.get(conversationId) || createMessagePageState()
    const getConversationMembers = (conversationId) => conversationMembers.get(conversationId) || []
    const getMembersLoading = (conversationId) => Boolean(membersLoading.get(conversationId))

    const setMessages = (conversationId, items) => {
        messages.set(conversationId, items)
    }

    const toNumberOrNull = (value) => {
        if (value === null || value === undefined) return null
        const num = Number(value)
        return Number.isFinite(num) ? num : null
    }

    const normalizeMessageIdentity = (payload) => normalizeMessage(payload)

    const sanitizeDirectoryUser = (user) => {
        if (!user || typeof user !== 'object') return null
        const id = toNumberOrNull(user.id)
        if (!id) return null
        return {
            id,
            username: user.username ?? '',
            fullName: user.fullName ?? user.username ?? '',
            avatarUrl: user.avatarUrl ?? null,
            status: user.status ?? null,
            roles: Array.isArray(user.roles) ? user.roles.map((role) => role?.name ?? role) : []
        }
    }

    const ensureDirectoryLoaded = async () => {
        if (directorySource.value.length || directoryLoading.value) return
        directoryLoading.value = true
        directoryError.value = null
        try {
            const page = await userService.getUsers({ page: 0, size: 200, sort: 'fullName,asc' })
            const items = Array.isArray(page?.content) ? page.content : Array.isArray(page?.items) ? page.items : []
            directorySource.value = items
                .map(sanitizeDirectoryUser)
                .filter((item) => item && item.status !== 'LOCKED' && item.status !== 'INACTIVE')
            directoryUsers.value = [...directorySource.value]
        } catch (error) {
            directoryError.value = error
        } finally {
            directoryLoading.value = false
        }
    }

    const filterDirectoryUsers = (query = '') => {
        const keyword = query.trim().toLowerCase()
        if (!keyword) {
            directoryUsers.value = [...directorySource.value]
            return
        }
        directoryUsers.value = directorySource.value.filter((user) => {
            const tokens = [user.fullName, user.username]
            return tokens.some((token) => token?.toLowerCase().includes(keyword))
        })
    }

    const searchDirectoryUsers = async (query = '') => {
        await ensureDirectoryLoaded()
        filterDirectoryUsers(query)
    }

    const compareConversations = (a, b) => {
        if (a?.pinned && !b?.pinned) return -1
        if (!a?.pinned && b?.pinned) return 1
        const aTime = a?.updatedAt ? new Date(a.updatedAt).getTime() : 0
        const bTime = b?.updatedAt ? new Date(b.updatedAt).getTime() : 0
        return bTime - aTime
    }

    const sortConversations = () => {
        conversations.value = [...conversations.value].sort(compareConversations)
    }

    const upsertConversation = (summary) => {
        if (!summary) return
        const index = conversations.value.findIndex((item) => item.id === summary.id)
        if (index !== -1) {
            conversations.value.splice(index, 1, { ...conversations.value[index], ...summary })
        } else {
            conversations.value.unshift(summary)
        }
        sortConversations()
    }

    const removeConversation = (conversationId) => {
        const index = conversations.value.findIndex((item) => item.id === conversationId)
        if (index !== -1) {
            conversations.value.splice(index, 1)
        }
    }

    const loadConversations = async ({page = 0, size = 20} = {}) => {
        conversationsLoading.value = true
        conversationsError.value = null
        try {
            const response = await chatConversations.listConversations({ page, size })
            if (page === 0) {
                conversations.value = [...response.items]
            } else {
                conversations.value = [...conversations.value, ...response.items]
            }
            sortConversations()
            conversationPage.value = {
                page: response.page,
                size: response.size,
                totalPages: response.totalPages,
                totalElements: response.totalElements,
                first: response.first,
                last: response.last,
                empty: response.empty
            }
        } catch (error) {
            conversationsError.value = error
        } finally {
            conversationsLoading.value = false
        }
    }

    const loadMessages = async (conversationId, {beforeMessageId, page = 0, size = 20} = {}) => {
        if (!conversationId) return
        messageLoading.set(conversationId, true)
        messageError.set(conversationId, null)
        try {
            const response = await chatMessages.listMessages(conversationId, {beforeMessageId, page, size})
            const current = getMessages(conversationId)
            if (page === 0 && !beforeMessageId) {
                setMessages(conversationId, response.items)
            } else {
                setMessages(conversationId, [...response.items, ...current])
            }
            const beforeCursor = response.items.length
                ? response.items[response.items.length - 1].id
                : beforeMessageId || null
            messagePageInfo.set(conversationId, {
                page: response.page,
                size: response.size,
                totalPages: response.totalPages,
                totalElements: response.totalElements,
                numberOfElements: response.numberOfElements,
                beforeCursor,
                hasMore: !response.last && response.totalElements > 0,
                first: response.first,
                last: response.last,
                empty: response.empty
            })
        } catch (error) {
            messageError.set(conversationId, error)
        } finally {
            messageLoading.set(conversationId, false)
        }
    }

    const loadConversationMembers = async (conversationId, { force = false } = {}) => {
        if (!conversationId) return
        if (conversationMembers.has(conversationId) && !force) return
        if (membersLoading.get(conversationId)) return
        membersLoading.set(conversationId, true)
        membersError.delete(conversationId)
        try {
            const data = await chatConversations.listMembers(conversationId)
            conversationMembers.set(conversationId, data)
        } catch (error) {
            membersError.set(conversationId, error)
        } finally {
            membersLoading.set(conversationId, false)
        }
    }

    const addPendingMessage = (conversationId, tempId, payload) => {
        const pending = [...getPendingMessages(conversationId), {
            tempId,
            status: 'sending',
            createdAt: new Date().toISOString(),
            error: null,
            progress: null,
            ...payload
        }]
        pendingMessages.set(conversationId, pending)
    }

    const resolvePendingMessage = (conversationId, tempId, message) => {
        const pending = getPendingMessages(conversationId)
        const index = pending.findIndex((item) => item.tempId === tempId)
        if (index !== -1) {
            pending.splice(index, 1)
        }
        pendingMessages.set(conversationId, pending)

        const normalized = normalizeMessageIdentity(message)
        if (!normalized) {
            return
        }

        const list = [...getMessages(conversationId)]
        const existingIndex = list.findIndex((item) => item.id === normalized.id)
        if (existingIndex !== -1) {
            list.splice(existingIndex, 1, { ...list[existingIndex], ...normalized })
        } else {
            list.push(normalized)
        }
        list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
        setMessages(conversationId, list)
        upsertConversation({ id: conversationId, lastMessage: normalized, updatedAt: normalized.updatedAt || normalized.createdAt })
    }

    const failPendingMessage = (conversationId, tempId, error) => {
        const pending = getPendingMessages(conversationId)
        const index = pending.findIndex((item) => item.tempId === tempId)
        if (index !== -1) {
            pending[index].error = error
            pending[index].status = 'failed'
        }
        pendingMessages.set(conversationId, [...pending])
    }

    const updatePendingMessage = (conversationId, tempId, patch) => {
        const pending = getPendingMessages(conversationId)
        const index = pending.findIndex((item) => item.tempId === tempId)
        if (index !== -1) {
            pending[index] = {...pending[index], ...patch}
            pendingMessages.set(conversationId, [...pending])
        }
    }

    const appendIncomingMessage = (message) => {
        const normalized = normalizeMessageIdentity(message)
        if (!normalized?.conversationId) return
        const conversationId = normalized.conversationId
        const list = [...getMessages(conversationId)]
        const index = list.findIndex((item) => item.id === normalized.id)
        if (index !== -1) {
            list.splice(index, 1, { ...list[index], ...normalized })
        } else {
            list.push(normalized)
            list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
        }
        setMessages(conversationId, list)
        upsertConversation({ id: conversationId, lastMessage: normalized, updatedAt: normalized.updatedAt || normalized.createdAt })
    }

    const applyConversationUpdate = (summary) => {
        if (!summary) return
        const normalized = normalizeConversation(summary) || summary
        upsertConversation(normalized)
    }

    const removeMessage = (conversationId, messageId) => {
        if (!conversationId || !messageId) return
        const list = getMessages(conversationId)
        const index = list.findIndex((item) => item.id === messageId)
        if (index !== -1) {
            list.splice(index, 1)
            setMessages(conversationId, [...list])
        }
    }

    const applyRecallEvent = (message) => {
        if (!message?.conversationId || !message?.id) return
        const normalized = normalizeMessageIdentity(message)
        if (!normalized) return
        const list = getMessages(normalized.conversationId)
        const index = list.findIndex((item) => item.id === normalized.id)
        if (index !== -1) {
            list.splice(index, 1, {...list[index], ...normalized})
            setMessages(normalized.conversationId, list)
        } else {
            setMessages(normalized.conversationId, [...list, normalized])
        }
        upsertConversation({
            id: normalized.conversationId,
            lastMessage: normalized,
            updatedAt: normalized.updatedAt || normalized.createdAt
        })
    }

    const applySeenEvent = (conversationId, payload) => {
        const list = getMessages(conversationId)
        const index = list.findIndex((item) => item.id === payload.messageId)
        if (index !== -1) {
            const target = list[index]
            const seenByUserIds = new Set(target.seenByUserIds || [])
            seenByUserIds.add(payload.userId)
            list.splice(index, 1, {...target, seenByUserIds: Array.from(seenByUserIds)})
            setMessages(conversationId, list)
        }
    }

    const clearTypingTimeout = (conversationId, userId) => {
        const timers = typingTimers.get(conversationId)
        if (timers?.has(userId)) {
            clearTimeout(timers.get(userId))
            timers.delete(userId)
        }
    }

    const scheduleTypingTimeout = (conversationId, userId) => {
        clearTypingTimeout(conversationId, userId)
        const timers = typingTimers.get(conversationId) || new Map()
        const timeout = setTimeout(() => {
            const convTyping = typingStates.get(conversationId)
            if (convTyping) {
                convTyping.delete(userId)
                typingStates.set(conversationId, new Map(convTyping))
            }
            clearTypingTimeout(conversationId, userId)
        }, 4000)
        timers.set(userId, timeout)
        typingTimers.set(conversationId, timers)
    }

    const applyTypingEvent = (conversationId, payload) => {
        if (!conversationId || !payload?.userId) return
        const {userId, typing, displayName, fullName} = payload
        const convTyping = typingStates.get(conversationId) || new Map()

        if (!typing) {
            convTyping.delete(userId)
            clearTypingTimeout(conversationId, userId)
            typingStates.set(conversationId, new Map(convTyping))
            return
        }

        convTyping.set(userId, {
            userId,
            typing: true,
            displayName: displayName || fullName || 'Thành viên'
        })
        typingStates.set(conversationId, new Map(convTyping))
        scheduleTypingTimeout(conversationId, userId)
    }

    const getTypingUsers = (conversationId, excludeUserId) => {
        const convTyping = typingStates.get(conversationId)
        if (!convTyping) return []
        return Array.from(convTyping.values())
            .filter((item) => item.typing && item.userId !== excludeUserId)
            .map((item) => item.displayName)
    }

    const setConversationPinned = async (conversationId, pinned) => {
        if (!conversationId) return
        await chatConversations.pinConversation(conversationId, pinned)
        const updated = await chatConversations.getConversation(conversationId)
        upsertConversation(updated)
        sortConversations()
    }

    const recallMessage = async (conversationId, messageId) => {
        if (!conversationId || !messageId) return null
        const message = await chatMessages.recallMessage(messageId)
        applyRecallEvent(message)
        return message
    }

    const deleteMessage = async (conversationId, messageId) => {
        if (!conversationId || !messageId) return
        await chatMessages.deleteMessageForCurrentUser(messageId)
        removeMessage(conversationId, messageId)
    }

    const markMessageSeen = async (conversationId, messageId, userId) => {
        if (!conversationId || !messageId) return
        await chatMessages.markSeen(conversationId, messageId)
        if (userId) {
            applySeenEvent(conversationId, { messageId, userId })
        }
    }

    const clear = () => {
        conversations.value = []
        conversationPage.value = createConversationPageState()
        conversationsError.value = null
        messages.clear()
        messagePageInfo.clear()
        messageLoading.clear()
        messageError.clear()
        pendingMessages.clear()
        typingStates.clear()
        typingTimers.forEach((conversationTimers) => {
            conversationTimers.forEach((timeoutId) => clearTimeout(timeoutId))
        })
        typingTimers.clear()
        conversationMembers.clear()
        membersLoading.clear()
        membersError.clear()
        directorySource.value = []
        directoryUsers.value = []
        directoryLoading.value = false
        directoryError.value = null
        currentConversationId.value = null
    }

    const hasMoreConversations = computed(() => !conversationPage.value.last && !conversationPage.value.empty)

    return {
        conversations,
        conversationPage,
        conversationsLoading,
        conversationsError,
        messages,
        messagePageInfo,
        messageLoading,
        messageError,
        pendingMessages,
        currentConversationId,
        directoryUsers,
        directoryLoading,
        directoryError,
        hasMoreConversations,
        getMessages,
        getPendingMessages,
        getMessagePageInfo,
        getConversationMembers,
        getMembersLoading,
        loadConversations,
        loadMessages,
        loadConversationMembers,
        addPendingMessage,
        resolvePendingMessage,
        failPendingMessage,
        updatePendingMessage,
        appendIncomingMessage,
        applyConversationUpdate,
        applyRecallEvent,
        removeMessage,
        applySeenEvent,
        applyTypingEvent,
        getTypingUsers,
        upsertConversation,
        removeConversation,
        setConversationPinned,
        recallMessage,
        deleteMessage,
        markMessageSeen,
        searchDirectoryUsers,
        ensureDirectoryLoaded,
        clear
    }
})
