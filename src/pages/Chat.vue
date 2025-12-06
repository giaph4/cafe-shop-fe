<template>
    <div class="chat-page">
        <div class="chat-page__header">
            <div class="chat-page__header-content">
                <div class="chat-page__header-title-section">
                    <h2 class="chat-page__title">Trò chuyện nội bộ</h2>
                    <p class="chat-page__subtitle">Giao tiếp và cộng tác với đồng nghiệp trong thời gian thực.</p>
                </div>
                <div class="chat-page__header-actions">
                    <button class="btn btn-outline-secondary" @click="refreshConversations" :disabled="loading">
                        <i class="bi bi-arrow-clockwise me-2"></i>
                        Làm mới
                    </button>
                </div>
            </div>
        </div>

        <div class="chat-container">
            <ChatSidebar
                :conversations="conversations"
                :selected-conversation-id="selectedConversation?.id"
                :loading="loading"
                :loading-more="loadingMore"
                :has-more="hasMoreConversations"
                @select="handleSelectConversation"
                @create-conversation="showCreateModal"
                @load-more="loadMoreConversations"
                @toggle-pin="handleTogglePin"
            />

            <div class="chat-main">
                <div v-if="!selectedConversation" class="chat-empty">
                    <i class="bi bi-chat-dots fs-1 text-muted mb-3"></i>
                    <h5 class="text-muted">Chọn một hội thoại để bắt đầu</h5>
                </div>

                <div v-else class="chat-window">
                    <div class="chat-window__header">
                        <div class="chat-window__header-info">
                            <div class="chat-window__avatar">
                                <img
                                    v-if="getConversationAvatar(selectedConversation)"
                                    :src="getConversationAvatar(selectedConversation)"
                                    :alt="getConversationName(selectedConversation)"
                                />
                                <div v-else class="chat-window__avatar-placeholder">
                                    {{ getConversationInitials(selectedConversation) }}
                                </div>
                            </div>
                            <div>
                                <h6 class="chat-window__name mb-0">
                                    {{ getConversationName(selectedConversation) }}
                                </h6>
                                <small class="text-muted" v-if="selectedConversation.type === 'GROUP'">
                                    {{ selectedConversation.memberCount || 0 }} thành viên
                                </small>
                            </div>
                        </div>
                        <div class="chat-window__header-actions">
                            <button
                                class="btn btn-sm btn-link text-muted p-0"
                                @click="showDetails = !showDetails"
                                :title="'Chi tiết hội thoại'"
                            >
                                <i class="bi bi-info-circle"></i>
                            </button>
                        </div>
                    </div>

                    <div class="chat-window__messages" ref="messagesContainerRef" @scroll="handleMessagesScroll">
                        <div v-if="loadingMessages && messages.length === 0" class="chat-window__loading">
                            <div class="spinner-border spinner-border-sm" style="color: var(--color-primary);"></div>
                        </div>
                        <div v-else-if="messages.length === 0" class="chat-window__empty">
                            <p class="text-muted">Chưa có tin nhắn nào</p>
                        </div>
                        <div v-else>
                            <div v-if="loadingMoreMessages" class="chat-window__loading-more">
                                <div class="spinner-border spinner-border-sm text-muted"></div>
                            </div>
                            <div
                                v-for="(message, index) in messages"
                                :key="message.id"
                            >
                                <ChatMessageBubble
                                    :message="message"
                                    :is-own="message.senderId === currentUserId"
                                    :show-avatar="shouldShowAvatar(message, index)"
                                    :sender-name="getSenderName(message)"
                                    :sender-avatar="getSenderAvatar(message)"
                                    @recall="handleRecallMessage(message.id)"
                                    @delete="handleDeleteMessage(message.id)"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <ChatInput
                        :sending="sendingMessage"
                        @send-text="handleSendText"
                        @send-attachment="handleSendAttachment"
                    />
                </div>
            </div>

            <div v-if="showDetails && selectedConversation" class="chat-details">
                <div class="chat-details__header">
                    <h6 class="mb-0">Chi tiết hội thoại</h6>
                    <button class="btn btn-sm btn-link p-0" @click="showDetails = false">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <div class="chat-details__content">
                    <div class="chat-details__section">
                        <div class="chat-details__section-header">
                            <h6 class="chat-details__section-title mb-0">Thành viên</h6>
                            <button
                                v-if="selectedConversation?.type === 'GROUP'"
                                class="btn btn-sm btn-primary"
                                @click="showAddMemberModal = true"
                            >
                                <i class="bi bi-plus-lg me-1"></i>
                                Thêm
                            </button>
                        </div>
                        <div class="chat-details__members">
                            <div
                                v-for="member in conversationMembers"
                                :key="member.userId"
                                class="chat-details__member"
                            >
                                <div class="chat-details__member-avatar">
                                    <img v-if="member.avatarUrl" :src="member.avatarUrl" :alt="member.fullName" />
                                    <div v-else class="chat-details__member-placeholder">
                                        {{ getMemberInitials(member) }}
                                    </div>
                                </div>
                                <div class="chat-details__member-info">
                                    <div class="chat-details__member-name">{{ member.fullName || member.username }}</div>
                                    <div class="chat-details__member-role">
                                        <select
                                            v-if="selectedConversation?.type === 'GROUP' && member.userId !== currentUserId && canManageMembers"
                                            class="form-select form-select-sm"
                                            :value="member.role"
                                            @change="handleUpdateRole(member.userId, $event.target.value)"
                                        >
                                            <option value="MEMBER">Thành viên</option>
                                            <option value="ADMIN">Quản trị viên</option>
                                        </select>
                                        <span v-else>{{ member.role === 'ADMIN' ? 'Quản trị viên' : 'Thành viên' }}</span>
                                    </div>
                                </div>
                                <div class="chat-details__member-actions" v-if="selectedConversation?.type === 'GROUP' && member.userId !== currentUserId && canManageMembers">
                                    <button
                                        class="btn btn-sm btn-link text-danger p-0"
                                        @click="handleRemoveMember(member.userId)"
                                        :title="'Xóa thành viên'"
                                    >
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Add Member Modal -->
                <Teleport to="body">
                    <div v-if="showAddMemberModal" class="modal fade show" style="display: block;" @click.self="showAddMemberModal = false">
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content" @click.stop>
                                <div class="modal-header">
                                    <h5 class="modal-title">Thêm thành viên</h5>
                                    <button type="button" class="btn-close" @click="showAddMemberModal = false"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="mb-3">
                                        <label class="form-label">Chọn thành viên</label>
                                        <div class="member-selection" style="max-height: 300px; overflow-y: auto;">
                                            <div
                                                v-for="user in availableUsers"
                                                :key="user.id"
                                                class="form-check"
                                            >
                                                <input
                                                    class="form-check-input"
                                                    type="checkbox"
                                                    :id="`add-user-${user.id}`"
                                                    :value="user.id"
                                                    v-model="selectedMemberIdsToAdd"
                                                    :disabled="conversationMembers.some(m => m.userId === user.id)"
                                                />
                                                <label class="form-check-label" :for="`add-user-${user.id}`">
                                                    {{ user.fullName || user.username }}
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-outline-secondary" @click="showAddMemberModal = false">
                                        Hủy
                                    </button>
                                    <button
                                        type="button"
                                        class="btn btn-primary"
                                        @click="handleAddMembers"
                                        :disabled="selectedMemberIdsToAdd.length === 0 || addingMembers"
                                    >
                                        <span v-if="addingMembers" class="spinner-border spinner-border-sm me-2"></span>
                                        Thêm
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-if="showAddMemberModal" class="modal-backdrop fade show"></div>
                </Teleport>
            </div>
        </div>

        <CreateConversationModal ref="createModalRef" @created="handleConversationCreated" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { Teleport } from 'vue'
import { useAuthStore } from '@/store/auth'
import ChatSidebar from '@/components/chat/ChatSidebar.vue'
import ChatMessageBubble from '@/components/chat/ChatMessageBubble.vue'
import ChatInput from '@/components/chat/ChatInput.vue'
import CreateConversationModal from '@/components/chat/CreateConversationModal.vue'
import {
    listConversations,
    getConversation,
    listMessages,
    listMembers,
    pinConversation,
    addMembers,
    removeMember,
    updateMemberRole
} from '@/api/chat/conversationService'
import { getUsers } from '@/api/userService'
import {
    sendTextMessage,
    sendEmojiMessage,
    sendAttachmentMessage,
    recallMessage,
    deleteMessage,
    markMessageSeen
} from '@/api/chat/messageService'
import { initChatWebSocket, disconnectChatWebSocket } from '@/api/chat/websocketService'
import { toast } from 'vue3-toastify'
import logger from '@/utils/logger'

const authStore = useAuthStore()
const currentUserId = computed(() => authStore.user?.id)

const conversations = ref([])
const selectedConversation = ref(null)
const messages = ref([])
const conversationMembers = ref([])
const loading = ref(false)
const loadingMessages = ref(false)
const loadingMore = ref(false)
const sendingMessage = ref(false)
const showDetails = ref(false)

const page = ref(0)
const size = ref(20)
const hasMoreConversations = ref(true)
const messagesPage = ref(0)
const hasMoreMessages = ref(true)
const loadingMoreMessages = ref(false)

const messagesContainerRef = ref(null)
const createModalRef = ref(null)
const showAddMemberModal = ref(false)
const availableUsers = ref([])
const selectedMemberIdsToAdd = ref([])
const addingMembers = ref(false)

const canManageMembers = computed(() => {
    if (!selectedConversation.value || selectedConversation.value.type !== 'GROUP') return false
    const currentMember = conversationMembers.value.find(m => m.userId === currentUserId.value)
    return currentMember?.role === 'ADMIN'
})

let wsConnection = null

const getConversationName = (conversation) => {
    if (conversation.type === 'DIRECT') {
        return conversation.otherMember?.fullName || conversation.otherMember?.username || 'Người dùng'
    }
    return conversation.title || 'Nhóm không tên'
}

const getConversationAvatar = (conversation) => {
    if (conversation.type === 'DIRECT') {
        return conversation.otherMember?.avatarUrl
    }
    return conversation.avatarUrl
}

const getConversationInitials = (conversation) => {
    const name = getConversationName(conversation)
    return name
        .split(' ')
        .map(word => word[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

const getSenderName = (message) => {
    return message.senderName || message.sender?.fullName || message.sender?.username || 'Người dùng'
}

const getSenderAvatar = (message) => {
    return message.senderAvatar || message.sender?.avatarUrl
}

const getMemberInitials = (member) => {
    const name = member.fullName || member.username || 'U'
    return name
        .split(' ')
        .map(word => word[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

const shouldShowAvatar = (message, index) => {
    if (message.senderId === currentUserId.value) return false
    if (index === 0) return true
    const prevMessage = messages.value[index - 1]
    return prevMessage.senderId !== message.senderId ||
           new Date(message.createdAt) - new Date(prevMessage.createdAt) > 300000 // 5 minutes
}

const loadConversations = async () => {
    loading.value = true
    try {
        const response = await listConversations(0, size.value)
        const loadedConversations = response.content || []
        conversations.value = loadedConversations
        // Sort: pinned first
        conversations.value.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1
            if (!a.pinned && b.pinned) return 1
            return 0
        })
        hasMoreConversations.value = !response.last
    } catch (err) {
        logger.error('Failed to load conversations:', err)
        toast.error('Không thể tải danh sách hội thoại.')
    } finally {
        loading.value = false
    }
}

const loadMoreConversations = async () => {
    if (loadingMore.value || !hasMoreConversations.value) return
    loadingMore.value = true
    try {
        const response = await listConversations(page.value + 1, size.value)
        const newConversations = response.content || []
        conversations.value.push(...newConversations)
        // Sort: pinned first
        conversations.value.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1
            if (!a.pinned && b.pinned) return 1
            return 0
        })
        hasMoreConversations.value = !response.last
        page.value++
    } catch (err) {
        logger.error('Failed to load more conversations:', err)
    } finally {
        loadingMore.value = false
    }
}

const handleSelectConversation = async (conversation) => {
    selectedConversation.value = conversation
    messages.value = []
    messagesPage.value = 0
    hasMoreMessages.value = true
    showDetails.value = false
    
    // Subscribe to conversation WebSocket topic
    if (wsConnection) {
        wsConnection.subscribeConversation(conversation.id)
    }
    
    await loadMessages()
    await loadMembers()
    
    // Mark all messages as seen
    if (messages.value.length > 0) {
        const lastMessage = messages.value[messages.value.length - 1]
        if (lastMessage && lastMessage.senderId !== currentUserId.value) {
            try {
                await markMessageSeen(conversation.id, lastMessage.id)
            } catch (err) {
                logger.warn('Failed to mark message as seen:', err)
            }
        }
    }
    
    // Scroll to bottom after messages are loaded
    await nextTick()
    scrollToBottom()
}

const loadMessages = async (beforeMessageId = null) => {
    if (!selectedConversation.value) return
    if (beforeMessageId) {
        loadingMoreMessages.value = true
    } else {
        loadingMessages.value = true
    }
    try {
        const response = await listMessages(
            selectedConversation.value.id,
            messagesPage.value,
            20,
            beforeMessageId
        )
        const newMessages = response.content || []
        if (beforeMessageId) {
            // Load older messages - prepend to beginning
            messages.value = [...newMessages.reverse(), ...messages.value]
        } else {
            // Initial load - replace all
            messages.value = newMessages.reverse()
        }
        hasMoreMessages.value = !response.last
        
        // Mark all messages as seen after initial load
        if (newMessages.length > 0 && currentUserId.value && !beforeMessageId) {
            const unreadMessages = newMessages.filter(m => 
                m.senderId !== currentUserId.value && 
                (!m.seenByUserIds || !m.seenByUserIds.includes(currentUserId.value))
            )
            if (unreadMessages.length > 0) {
                const lastUnread = unreadMessages[unreadMessages.length - 1]
                try {
                    await markMessageSeen(selectedConversation.value.id, lastUnread.id)
                } catch (err) {
                    logger.warn('Failed to mark messages as seen:', err)
                }
            }
        }
    } catch (err) {
        logger.error('Failed to load messages:', err)
        toast.error('Không thể tải tin nhắn.')
    } finally {
        loadingMessages.value = false
        loadingMoreMessages.value = false
    }
}

const handleMessagesScroll = async (event) => {
    const container = event.target
    if (!container || !hasMoreMessages.value || loadingMoreMessages.value) return
    
    // Load more when scrolled to top (within 100px)
    if (container.scrollTop < 100 && messages.value.length > 0) {
        const firstMessage = messages.value[0]
        if (firstMessage && !loadingMoreMessages.value) {
            // Save current scroll position
            const previousScrollHeight = container.scrollHeight
            const previousScrollTop = container.scrollTop
            
            // Load older messages
            await loadMessages(firstMessage.id)
            
            // Restore scroll position after new messages are added
            await nextTick()
            const newScrollHeight = container.scrollHeight
            const heightDifference = newScrollHeight - previousScrollHeight
            container.scrollTop = previousScrollTop + heightDifference
        }
    }
}

const loadMembers = async () => {
    if (!selectedConversation.value) return
    try {
        conversationMembers.value = await listMembers(selectedConversation.value.id)
    } catch (err) {
        logger.error('Failed to load members:', err)
    }
}

const scrollToBottom = () => {
    nextTick(() => {
        if (messagesContainerRef.value) {
            messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight
        }
    })
}

const handleSendText = async (content) => {
    if (!selectedConversation.value || !content.trim()) return
    sendingMessage.value = true
    try {
        await sendTextMessage(selectedConversation.value.id, content.trim())
        // Message will be received via WebSocket
    } catch (err) {
        logger.error('Failed to send message:', err)
        toast.error(err.response?.data?.message || 'Không thể gửi tin nhắn.')
    } finally {
        sendingMessage.value = false
    }
}

const handleSendEmoji = async (code) => {
    if (!selectedConversation.value) return
    sendingMessage.value = true
    try {
        await sendEmojiMessage(selectedConversation.value.id, code)
    } catch (err) {
        logger.error('Failed to send emoji:', err)
        toast.error('Không thể gửi emoji.')
    } finally {
        sendingMessage.value = false
    }
}

const handleSendAttachment = async (messageText, files) => {
    if (!selectedConversation.value || !files || files.length === 0) return
    sendingMessage.value = true
    try {
        await sendAttachmentMessage(selectedConversation.value.id, messageText, files)
        // Message will be received via WebSocket
    } catch (err) {
        logger.error('Failed to send attachment:', err)
        const errorMsg = err.response?.data?.message || 'Không thể gửi file đính kèm.'
        if (errorMsg.includes('FILE-TOO-LARGE') || errorMsg.includes('too large')) {
            toast.error('File quá lớn. Vui lòng chọn file nhỏ hơn.')
        } else if (errorMsg.includes('415') || errorMsg.includes('format')) {
            toast.error('Định dạng file không được hỗ trợ.')
    } else {
            toast.error(errorMsg)
        }
    } finally {
        sendingMessage.value = false
    }
}

const handleRecallMessage = async (messageId) => {
    try {
        await recallMessage(messageId)
        // Update message in list
        const message = messages.value.find(m => m.id === messageId)
        if (message) {
            message.status = 'RECALLED'
            message.content = null
            message.metadata = null
        }
        toast.success('Đã thu hồi tin nhắn.')
    } catch (err) {
        logger.error('Failed to recall message:', err)
        toast.error(err.response?.data?.message || 'Không thể thu hồi tin nhắn.')
    }
}

const handleDeleteMessage = async (messageId) => {
    try {
        await deleteMessage(messageId)
        messages.value = messages.value.filter(m => m.id !== messageId)
        toast.success('Đã xóa tin nhắn.')
    } catch (err) {
        logger.error('Failed to delete message:', err)
        toast.error('Không thể xóa tin nhắn.')
    }
}

const handleConversationCreated = (conversation) => {
    // Add to beginning and sort (pinned first)
    conversations.value.unshift(conversation)
    conversations.value.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return 0
    })
    handleSelectConversation(conversation)
}

const showCreateModal = () => {
    createModalRef.value?.show()
}

const refreshConversations = () => {
    page.value = 0
    loadConversations()
}

const handleTogglePin = async (conversation) => {
    try {
        await pinConversation(conversation.id, !conversation.pinned)
        // Update conversation in list
        const index = conversations.value.findIndex(c => c.id === conversation.id)
        if (index !== -1) {
            conversations.value[index].pinned = !conversation.pinned
            // Sort: pinned first
            conversations.value.sort((a, b) => {
                if (a.pinned && !b.pinned) return -1
                if (!a.pinned && b.pinned) return 1
                return 0
            })
        }
        toast.success(conversation.pinned ? 'Đã bỏ ghim hội thoại.' : 'Đã ghim hội thoại.')
    } catch (err) {
        logger.error('Failed to toggle pin:', err)
        toast.error('Không thể thay đổi trạng thái ghim.')
    }
}

// WebSocket handlers
const handleNewMessage = (message) => {
    if (selectedConversation.value && message.conversationId === selectedConversation.value.id) {
        // Check if message already exists (avoid duplicates)
        const existingIndex = messages.value.findIndex(m => m.id === message.id)
        if (existingIndex === -1) {
            messages.value.push(message)
            nextTick(() => {
                scrollToBottom()
            })
            // Mark as seen
            if (message.senderId !== currentUserId.value) {
                markMessageSeen(selectedConversation.value.id, message.id).catch(() => {})
            }
        } else {
            // Update existing message (e.g., status change, recall)
            messages.value[existingIndex] = message
        }
    }
    // Update conversation in list
    const index = conversations.value.findIndex(c => c.id === message.conversationId)
    if (index !== -1) {
        conversations.value[index].lastMessage = message
        conversations.value[index].updatedAt = message.createdAt
        // Only increment unread if not current conversation and not own message
        if (selectedConversation.value?.id !== message.conversationId && message.senderId !== currentUserId.value) {
            conversations.value[index].unreadCount = (conversations.value[index].unreadCount || 0) + 1
        }
    }
}

const handleConversationUpdate = (conversation) => {
    const index = conversations.value.findIndex(c => c.id === conversation.id)
    if (index !== -1) {
        conversations.value[index] = conversation
        // Sort: pinned first
        conversations.value.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1
            if (!a.pinned && b.pinned) return 1
            return 0
        })
    } else {
        conversations.value.unshift(conversation)
    }
    if (selectedConversation.value?.id === conversation.id) {
        selectedConversation.value = conversation
    }
}

const handleMessageSeen = (data) => {
    // Update seen status in messages
    const message = messages.value.find(m => m.id === data.messageId)
    if (message) {
        if (!message.seenByUserIds) {
            message.seenByUserIds = []
        }
        if (!message.seenByUserIds.includes(data.userId)) {
            message.seenByUserIds.push(data.userId)
        }
    }
}

onMounted(async () => {
    await loadConversations()
    
    // Initialize WebSocket - delay một chút để đảm bảo auth store đã sẵn sàng
    await nextTick()
    wsConnection = initChatWebSocket(
        handleNewMessage,
        handleConversationUpdate,
        handleMessageSeen
    )
    if (wsConnection) {
        // Delay connection để tránh race condition
        setTimeout(() => {
            wsConnection.connect()
        }, 500)
    }
})

onBeforeUnmount(() => {
    if (wsConnection) {
        wsConnection.disconnect()
    }
    disconnectChatWebSocket()
})

watch(() => selectedConversation.value?.id, () => {
    if (selectedConversation.value) {
        scrollToBottom()
    }
})

watch(showAddMemberModal, (isOpen) => {
    if (isOpen) {
        loadAvailableUsers()
        selectedMemberIdsToAdd.value = []
    }
})

const loadAvailableUsers = async () => {
    try {
        const response = await getUsers({ size: 100 })
        availableUsers.value = response.content || []
    } catch (err) {
        logger.error('Failed to load users:', err)
        toast.error('Không thể tải danh sách người dùng.')
    }
}

const handleAddMembers = async () => {
    if (!selectedConversation.value || selectedMemberIdsToAdd.value.length === 0) return
    addingMembers.value = true
    try {
        await addMembers(selectedConversation.value.id, selectedMemberIdsToAdd.value)
        await loadMembers()
        await loadAvailableUsers()
        selectedMemberIdsToAdd.value = []
        showAddMemberModal.value = false
        toast.success('Đã thêm thành viên thành công.')
    } catch (err) {
        logger.error('Failed to add members:', err)
        toast.error(err.response?.data?.message || 'Không thể thêm thành viên.')
    } finally {
        addingMembers.value = false
    }
}

const handleRemoveMember = async (memberId) => {
    if (!selectedConversation.value) return
    if (!window.confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?')) return
    try {
        await removeMember(selectedConversation.value.id, memberId)
        await loadMembers()
        toast.success('Đã xóa thành viên thành công.')
    } catch (err) {
        logger.error('Failed to remove member:', err)
        toast.error(err.response?.data?.message || 'Không thể xóa thành viên.')
    }
}

const handleUpdateRole = async (memberId, newRole) => {
    if (!selectedConversation.value) return
    try {
        await updateMemberRole(selectedConversation.value.id, memberId, newRole)
        await loadMembers()
        toast.success('Đã cập nhật vai trò thành công.')
    } catch (err) {
        logger.error('Failed to update role:', err)
        toast.error(err.response?.data?.message || 'Không thể cập nhật vai trò.')
    }
}
</script>

<style scoped>
/* Chat Page - Chuẩn hóa theo base.css */
.chat-page {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 80px);
    padding: var(--spacing-4);
    gap: var(--spacing-4);
    background: var(--color-body-bg);
}

/* Header - Chuẩn hóa */
.chat-page__header {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    margin-bottom: 0;
    padding: var(--spacing-4);
}

.chat-page__header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    flex-wrap: wrap;
}

.chat-page__header-title-section {
    flex: 1;
    min-width: 0;
}

.chat-page__title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.chat-page__subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-weight: var(--font-weight-normal);
    font-family: var(--font-family-sans);
}

/* Container - Chuẩn hóa */
.chat-container {
    display: flex;
    flex: 1;
    min-height: 0;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    overflow: hidden;
}

.chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.chat-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-text-muted);
    gap: var(--spacing-3);
}

.chat-empty i {
    font-size: 48px;
    line-height: 1;
}

.chat-empty h5 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
}

/* Chat Window - Chuẩn hóa */
.chat-window {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.chat-window__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-3) var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card-muted);
}

.chat-window__header-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
}

.chat-window__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    background: var(--color-bg-muted);
    border: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.chat-window__avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.chat-window__avatar-placeholder {
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
}

.chat-window__name {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

.chat-window__messages {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-3) 0;
    background: var(--color-body-bg);
}

.chat-window__loading,
.chat-window__loading-more,
.chat-window__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-6);
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
}

/* Chat Details - Chuẩn hóa */
.chat-details {
    width: 300px;
    border-left: 1px solid var(--color-border);
    background: var(--color-card);
    display: flex;
    flex-direction: column;
}

.chat-details__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-3) var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card-muted);
}

.chat-details__header h6 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

.chat-details__content {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-4) var(--spacing-5);
}

.chat-details__section {
    margin-bottom: var(--spacing-5);
}

.chat-details__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-4);
}

.chat-details__section-title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

.chat-details__members {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.chat-details__member {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2);
    border-radius: var(--radius-base);
    transition: background-color var(--transition-base);
}

.chat-details__member:hover {
    background: var(--color-card-muted);
}

.chat-details__member-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.chat-details__member-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.chat-details__member-placeholder {
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
}

.chat-details__member-info {
    flex: 1;
    min-width: 0;
}

.chat-details__member-name {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.chat-details__member-role {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
}

.chat-details__member-role select {
    font-size: var(--font-size-base);
    height: 32px;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-base);
}

/* Modal - Chuẩn hóa */
.chat-page :global(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-modal);
}

.chat-page :global(.modal-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
}

.chat-page :global(.modal-body) {
    padding: var(--spacing-5);
    background: var(--color-card);
}

.chat-page :global(.modal-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
    gap: var(--spacing-2);
}

.chat-page :global(.modal-title) {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.chat-page :global(.member-selection) {
    max-height: 300px;
    overflow-y: auto;
    padding: var(--spacing-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card-muted);
}

.chat-page :global(.form-check) {
    padding: var(--spacing-2);
    border-radius: var(--radius-sm);
    transition: background-color var(--transition-base);
}

.chat-page :global(.form-check:hover) {
    background: var(--color-card);
}

/* Responsive */
@media (max-width: 768px) {
    .chat-page {
        padding: var(--spacing-2);
        gap: var(--spacing-3);
    }

    .chat-details {
        width: 100%;
        border-left: none;
        border-top: 1px solid var(--color-border);
    }
}
</style>

