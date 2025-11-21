<template>
    <div class="chat-shell" :class="[themeClass, layoutClass]">
        <section class="chat-shell__workspace">
            <header class="chat-shell__toolbar">
                <div class="chat-shell__toolbar-leading">
                    <div class="chat-shell__brand-icon">
                        <i class="bi bi-messenger"></i>
                    </div>
                    <div class="chat-shell__toolbar-info">
                        <h1>{{ layoutTitle }}</h1>
                        <p>{{ layoutDescription }}</p>
                    </div>
                </div>
                <div class="chat-shell__toolbar-actions">
                    <button
                        type="button"
                        class="chat-shell__mobile-toggle"
                        @click="toggleMobileSidebar"
                        aria-label="Mở danh sách hội thoại"
                    >
                        <i :class="mobileSidebarIcon"></i>
                        <span>{{ mobileSidebarLabel }}</span>
                    </button>
                    <div class="chat-shell__layout-switch" role="group" aria-label="Chọn bố cục chat">
                        <button
                            v-for="option in layoutOptions"
                            :key="option.value"
                            type="button"
                            class="chat-shell__layout-button"
                            :class="{ 'chat-shell__layout-button--active': layoutMode === option.value }"
                            @click="setLayout(option.value)"
                        >
                            <i :class="option.icon"></i>
                            <span>{{ option.label }}</span>
                        </button>
                    </div>
                    <button type="button" class="chat-shell__primary-action" @click="openCreateModal">
                        <i class="bi bi-plus-lg"></i>
                        <span>Cuộc trò chuyện mới</span>
                    </button>
                    <button
                        type="button"
                        class="chat-shell__details-toggle"
                        :disabled="!layoutAllowsDetails"
                        @click="toggleDetailsPanel"
                    >
                        <i :class="detailsToggleIcon"></i>
                        <span>{{ detailsToggleLabel }}</span>
                    </button>
                </div>
            </header>

            <div class="chat-shell__panes">
                <div
                    class="chat-shell__pane chat-shell__pane--sidebar"
                    :class="{ 'chat-shell__pane--sidebar-open': mobileSidebarOpen }"
                >
                    <ChatSidebar
                        :conversations="conversations"
                        :is-loading="sidebarLoading"
                        :has-more="chatStore.hasMoreConversations"
                        :active-conversation-id="currentConversationId"
                        :current-user-id="currentUserId"
                        :directory="directory"
                        :layout="layoutMode"
                        @select="handleSelectConversation"
                        @load-more="loadMoreConversations"
                        @create-conversation="openCreateModal"
                        @search="handleDirectorySearch"
                        @toggle-pin="handleTogglePin"
                        @start-direct="handleStartDirect"
                    />
                </div>

                <div class="chat-shell__pane chat-shell__pane--thread">
                    <ChatWindow
                        :conversation="activeConversation"
                        :messages="activeMessages"
                        :pending-messages="pendingMessages"
                        :typing-users="typingUsers"
                        :current-user-id="currentUserId"
                        :has-more="messagePageInfo.hasMore"
                        :loading-state="messageLoadingState"
                        :pending-sending="isSending"
                        :members="conversationMembers"
                        :members-loading="membersLoading"
                        :layout="layoutMode"
                        @load-more="loadMoreMessages"
                        @send-text="sendTextMessage"
                        @send-attachments="sendAttachmentMessage"
                        @send-emoji="sendEmojiMessage"
                        @typing="handleTyping"
                        @retry="retryPendingMessage"
                        @refresh="refreshConversation"
                        @recall="handleRecallMessage"
                        @scroll-bottom="handleScrolledToBottom"
                    />

                    <div v-if="layoutMode === 'minimal' && showDetailsPanel" class="chat-shell__inline-details">
                        <ChatDetailsPanel
                            :conversation="activeConversation"
                            :members="conversationMembers"
                            :members-loading="membersLoading"
                            :current-user-id="currentUserId"
                            :socket-status="socketStatus"
                            :socket-label="socketStatusLabel"
                            :socket-icon="socketStatusIcon"
                            :last-message="lastSentMessage"
                            :layout="layoutMode"
                        />
                    </div>
                </div>

                <div
                    v-if="layoutMode !== 'minimal' && showDetailsPanel"
                    class="chat-shell__pane chat-shell__pane--details"
                >
                    <ChatDetailsPanel
                        :conversation="activeConversation"
                        :members="conversationMembers"
                        :members-loading="membersLoading"
                        :current-user-id="currentUserId"
                        :socket-status="socketStatus"
                        :socket-label="socketStatusLabel"
                        :socket-icon="socketStatusIcon"
                        :last-message="lastSentMessage"
                        :layout="layoutMode"
                    />
                </div>
            </div>
            <div
                v-if="mobileSidebarOpen"
                class="chat-shell__overlay"
                @click="closeMobileSidebar"
                aria-hidden="true"
            ></div>
        </section>

        <ChatCreateConversationModal
            :show="showCreateModal"
            :loading="creatingConversation"
            @close="closeCreateModal"
            @submit="handleCreateConversation"
        />

        <ChatStatusToast v-if="socketStatus !== 'connected'" :status="socketStatus" />
    </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import ChatSidebar from '@/components/chat/ChatSidebar.vue'
import ChatWindow from '@/components/chat/ChatWindow.vue'
import ChatCreateConversationModal from '@/components/chat/ChatCreateConversationModal.vue'
import ChatStatusToast from '@/components/chat/ChatStatusToast.vue'
import ChatDetailsPanel from '@/components/chat/ChatDetailsPanel.vue'
import { useChatStore } from '@/store/chat'
import { useAuthStore } from '@/store/auth'
import { chatConversations, chatMessages } from '@/api/chat'
import { useChatSocket } from '@/composables/useChatSocket'
import { toast } from 'vue3-toastify'
import { useThemePreference } from '@/composables/useThemePreference'

const chatStore = useChatStore()
const authStore = useAuthStore()
const { connect, disconnect, switchConversation, sendTyping, ensureConnected, connected, reconnecting, lastError } = useChatSocket()
const { isDark } = useThemePreference()

const { currentConversationId } = storeToRefs(chatStore)

const LAYOUT_STORAGE_KEY = 'chat.layout.mode'

const layoutMeta = {
    minimal: {
        title: 'Không gian tối giản',
        description: 'Giao diện gọn nhẹ tập trung vào nội dung trò chuyện.',
        icon: 'bi bi-bounding-box',
        defaultDetails: false,
        allowDetails: true
    },
    slack: {
        title: 'Bố cục Slack',
        description: 'Ba cột song song giúp kiểm soát hội thoại và thông tin.',
        icon: 'bi bi-layout-three-columns',
        defaultDetails: true,
        allowDetails: true
    },
    whatsapp: {
        title: 'Phong cách WhatsApp',
        description: 'Sidebar sáng, nền hội thoại hoa văn và bong bóng bo tròn.',
        icon: 'bi bi-chat-dots',
        defaultDetails: false,
        allowDetails: true
    }
}

const layoutOptions = Object.entries(layoutMeta).map(([value, meta]) => ({
    value,
    label: meta.title,
    icon: meta.icon
}))

const resolveInitialLayout = () => {
    if (typeof window === 'undefined') return 'slack'
    const stored = window.localStorage.getItem(LAYOUT_STORAGE_KEY)
    if (stored && layoutMeta[stored]) {
        return stored
    }
    return 'slack'
}

const layoutMode = ref(resolveInitialLayout())
const showDetailsPanel = ref(layoutMeta[layoutMode.value]?.defaultDetails ?? true)

const mobileSidebarOpen = ref(false)
const isMobileViewport = ref(false)

const layoutClass = computed(() => `chat-shell--${layoutMode.value}`)
const layoutTitle = computed(() => layoutMeta[layoutMode.value]?.title ?? 'Không gian trò chuyện')
const layoutDescription = computed(() => layoutMeta[layoutMode.value]?.description ?? 'Chọn bố cục phù hợp với thói quen làm việc của bạn.')
const layoutAllowsDetails = computed(() => layoutMeta[layoutMode.value]?.allowDetails !== false)

const detailsToggleLabel = computed(() => (showDetailsPanel.value ? 'Ẩn panel chi tiết' : 'Hiển thị panel chi tiết'))
const detailsToggleIcon = computed(() => (showDetailsPanel.value ? 'bi bi-layout-sidebar-inset' : 'bi bi-layout-sidebar'))
const mobileSidebarIcon = computed(() => (mobileSidebarOpen.value ? 'bi bi-x-lg' : 'bi bi-list'))
const mobileSidebarLabel = computed(() => (mobileSidebarOpen.value ? 'Đóng danh sách' : 'Danh sách'))

const applyLayoutDefaults = (mode) => {
    const meta = layoutMeta[mode]
    if (!meta) return
    showDetailsPanel.value = meta.defaultDetails
}

const setLayout = (mode) => {
    if (!layoutMeta[mode] || layoutMode.value === mode) return
    layoutMode.value = mode
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(LAYOUT_STORAGE_KEY, mode)
    }
    applyLayoutDefaults(mode)
}

const toggleDetailsPanel = () => {
    if (!layoutAllowsDetails.value) return
    showDetailsPanel.value = !showDetailsPanel.value
}

const toggleMobileSidebar = () => {
    if (!isMobileViewport.value) return
    mobileSidebarOpen.value = !mobileSidebarOpen.value
}

const closeMobileSidebar = () => {
    mobileSidebarOpen.value = false
}

const updateViewportFlags = () => {
    if (typeof window === 'undefined') return
    const matches = window.matchMedia('(max-width: 860px)').matches
    isMobileViewport.value = matches
    if (!matches) {
        closeMobileSidebar()
    }
}

const themeClass = computed(() => (isDark.value ? 'chat-shell--dark' : 'chat-shell--light'))

const showCreateModal = ref(false)
const creatingConversation = ref(false)
const isSending = ref(false)
const messageLoadingState = ref('initial') // 'initial' | 'loading-more' | 'idle'
const socketStatus = computed(() => {
    if (lastError.value) return 'error'
    if (reconnecting.value) return 'connecting'
    if (!connected.value) return 'disconnected'
    return 'connected'
})

const statusMetaMap = {
    connected: {
        icon: 'bi bi-check-circle-fill',
        label: 'Đang trực tuyến'
    },
    connecting: {
        icon: 'bi bi-arrow-repeat',
        label: 'Đang kết nối lại'
    },
    disconnected: {
        icon: 'bi bi-slash-circle',
        label: 'Mất kết nối'
    },
    error: {
        icon: 'bi bi-exclamation-triangle',
        label: 'Lỗi kết nối'
    }
}

const socketStatusMeta = computed(() => statusMetaMap[socketStatus.value] || statusMetaMap.disconnected)
const socketStatusLabel = computed(() => socketStatusMeta.value.label)
const socketStatusIcon = computed(() => socketStatusMeta.value.icon)

const currentUserId = computed(() => authStore.user?.id ?? null)

const conversations = computed(() => chatStore.conversations)
const activeConversation = computed(() => {
    if (!currentConversationId.value) return null
    return chatStore.conversations.find((item) => item.id === currentConversationId.value) || null
})
const activeMessages = computed(() => chatStore.getMessages(currentConversationId.value))
const pendingMessages = computed(() => chatStore.getPendingMessages(currentConversationId.value))
const typingUsers = computed(() => chatStore.getTypingUsers(currentConversationId.value, currentUserId.value))
const messagePageInfo = computed(() => chatStore.getMessagePageInfo(currentConversationId.value))
const sidebarLoading = computed(() => chatStore.conversationsLoading)
const conversationMembers = computed(() => chatStore.getConversationMembers(currentConversationId.value))
const membersLoading = computed(() => chatStore.getMembersLoading(currentConversationId.value))
const directory = computed(() => ({
    users: chatStore.directoryUsers,
    loading: chatStore.directoryLoading,
    error: chatStore.directoryError
}))

const lastSentMessage = computed(() => {
    const messages = activeMessages.value
    if (!messages?.length) return null
    return messages[messages.length - 1]
})

const loadInitialConversations = async () => {
    try {
        await chatStore.loadConversations({ page: 0, size: 20 })
        messageLoadingState.value = 'idle'
    } catch (error) {
        handleApiError(error, 'Không tải được danh sách cuộc trò chuyện')
    }
}

const loadMoreConversations = async () => {
    if (!chatStore.hasMoreConversations || chatStore.conversationsLoading) return
    try {
        const nextPage = chatStore.conversationPage.page + 1
        await chatStore.loadConversations({ page: nextPage, size: chatStore.conversationPage.size })
    } catch (error) {
        handleApiError(error, 'Không tải thêm được cuộc trò chuyện')
    }
}

const loadMessages = async ({ conversationId, beforeMessageId } = {}) => {
    if (!conversationId) return
    messageLoadingState.value = beforeMessageId ? 'loading-more' : 'initial'
    try {
        await chatStore.loadMessages(conversationId, { beforeMessageId })
        messageLoadingState.value = 'idle'
    } catch (error) {
        messageLoadingState.value = 'idle'
        handleApiError(error, 'Không tải được tin nhắn')
    }
}

const loadMoreMessages = async () => {
    const info = chatStore.getMessagePageInfo(currentConversationId.value)
    if (!info.hasMore || messageLoadingState.value === 'loading-more') return
    try {
        await loadMessages({ conversationId: currentConversationId.value, beforeMessageId: info.beforeCursor })
    } catch (error) {
        handleApiError(error, 'Không tải thêm tin nhắn')
    }
}

const handleSelectConversation = async (conversationId) => {
    if (!conversationId || conversationId === currentConversationId.value) return
    currentConversationId.value = conversationId
    await chatStore.loadConversationMembers(conversationId)
    await loadMessages({ conversationId })
    switchConversation(conversationId)
    ensureConnected()
    await attemptMarkSeen()
    if (isMobileViewport.value) {
        closeMobileSidebar()
    }
}

const sendTextMessage = async (content) => {
    if (!currentConversationId.value || !content) return
    const tempId = `temp-${Date.now()}`
    chatStore.addPendingMessage(currentConversationId.value, tempId, {
        senderId: currentUserId.value,
        senderName: authStore.user?.fullName || authStore.user?.username || 'Bạn',
        content,
        contentType: 'TEXT'
    })

    isSending.value = true
    try {
        const message = await chatMessages.sendTextMessage(currentConversationId.value, content)
        chatStore.resolvePendingMessage(currentConversationId.value, tempId, message)
    } catch (error) {
        chatStore.failPendingMessage(currentConversationId.value, tempId, resolveErrorMessage(error))
        handleApiError(error, 'Gửi tin nhắn thất bại')
    } finally {
        isSending.value = false
    }
}

const sendEmojiMessage = async (emojiCode) => {
    if (!currentConversationId.value || !emojiCode) return
    const code = typeof emojiCode === 'string' ? emojiCode.trim() : ''
    if (!code) return

    const tempId = `temp-${Date.now()}-emoji`
    chatStore.addPendingMessage(currentConversationId.value, tempId, {
        senderId: currentUserId.value,
        senderName: authStore.user?.fullName || authStore.user?.username || 'Bạn',
        content: code,
        contentType: 'EMOJI'
    })

    isSending.value = true
    try {
        const message = await chatMessages.sendEmojiMessage(currentConversationId.value, code)
        chatStore.resolvePendingMessage(currentConversationId.value, tempId, message)
    } catch (error) {
        chatStore.failPendingMessage(currentConversationId.value, tempId, resolveErrorMessage(error))
        handleApiError(error, 'Không thể gửi emoji')
    } finally {
        isSending.value = false
    }
}

const sendAttachmentMessage = async ({ files, messageText }) => {
    if (!currentConversationId.value || !files?.length) return
    const tempId = `temp-${Date.now()}`
    chatStore.addPendingMessage(currentConversationId.value, tempId, {
        senderId: currentUserId.value,
        senderName: authStore.user?.fullName || authStore.user?.username || 'Bạn',
        content: messageText,
        contentType: 'FILE',
        attachments: files.map((file) => ({ originalName: file.name, size: file.size }))
    })

    isSending.value = true
    try {
        const message = await chatMessages.sendAttachmentMessage(
            currentConversationId.value,
            { files, messageText },
            (progress) => chatStore.updatePendingMessage(currentConversationId.value, tempId, { progress })
        )
        chatStore.resolvePendingMessage(currentConversationId.value, tempId, message)
    } catch (error) {
        chatStore.failPendingMessage(currentConversationId.value, tempId, resolveErrorMessage(error))
        handleApiError(error, 'Gửi tệp đính kèm thất bại')
    } finally {
        isSending.value = false
    }
}

const retryPendingMessage = (pendingMessage) => {
    if (pendingMessage.contentType === 'TEXT') {
        sendTextMessage(pendingMessage.content)
    } else {
        toast.info('Vui lòng gửi lại tệp thủ công.', { autoClose: 3000 })
    }
}

const handleTyping = (typing) => {
    if (!currentConversationId.value) return
    sendTyping(currentConversationId.value, typing)
}

const handleScrolledToBottom = () => {
    attemptMarkSeen()
}

const handleDirectorySearch = async (keyword) => {
    await chatStore.searchDirectoryUsers(keyword)
}

const handleStartDirect = async (user) => {
    if (!user?.id) return
    const existing = chatStore.conversations.find((item) => item.type === 'DIRECT' && item.participants?.some((participant) => participant.userId === user.id))
    if (existing) {
        await handleSelectConversation(existing.id)
        return
    }

    try {
        isSending.value = true
        const conversation = await chatConversations.createDirectConversation(user.id)
        chatStore.upsertConversation(conversation)
        currentConversationId.value = conversation.id
        await chatStore.loadConversationMembers(conversation.id)
        await loadMessages({ conversationId: conversation.id })
        switchConversation(conversation.id)
        ensureConnected()
        toast.success(`Đã tạo hội thoại với ${user.fullName || user.username}`)
    } catch (error) {
        handleApiError(error, 'Không thể mở cuộc trò chuyện 1-1')
    } finally {
        isSending.value = false
    }
}

const attemptMarkSeen = async () => {
    const conversationId = currentConversationId.value
    if (!conversationId) return
    const messages = activeMessages.value
    if (!messages?.length) return
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage?.id || lastMessage.senderId === currentUserId.value) return
    try {
        await chatStore.markMessageSeen(conversationId, lastMessage.id, currentUserId.value)
    } catch (error) {
        console.warn('[Chat] mark seen failed', error)
    }
}

const handleRecallMessage = async (message) => {
    if (!message?.id || !currentConversationId.value) return
    try {
        await chatStore.recallMessage(currentConversationId.value, message.id)
        toast.success('Đã thu hồi tin nhắn')
    } catch (error) {
        handleApiError(error, 'Không thể thu hồi tin nhắn')
    }
}

const handleTogglePin = async (conversation) => {
    if (!conversation?.id) return
    try {
        await chatStore.setConversationPinned(conversation.id, !conversation.pinned)
        toast.success(conversation.pinned ? 'Đã bỏ ghim cuộc trò chuyện' : 'Đã ghim cuộc trò chuyện')
    } catch (error) {
        handleApiError(error, 'Không thể cập nhật trạng thái ghim')
    }
}

const refreshConversation = async () => {
    if (!currentConversationId.value) return
    await chatStore.loadConversationMembers(currentConversationId.value)
    await loadMessages({ conversationId: currentConversationId.value })
    await attemptMarkSeen()
}

const openCreateModal = () => {
    showCreateModal.value = true
}

const closeCreateModal = () => {
    if (creatingConversation.value) return
    showCreateModal.value = false
}

const handleCreateConversation = async (payload) => {
    creatingConversation.value = true
    try {
        let conversation
        if (payload.type === 'DIRECT') {
            conversation = await chatConversations.createDirectConversation(payload.targetUserId)
        } else {
            conversation = await chatConversations.createGroupConversation({ title: payload.title, memberIds: payload.memberIds })
        }
        chatStore.upsertConversation(conversation)
        currentConversationId.value = conversation.id
        await loadMessages({ conversationId: conversation.id })
        toast.success('Tạo cuộc trò chuyện thành công!')
        showCreateModal.value = false
        ensureConnected()
    } catch (error) {
        handleApiError(error, 'Không tạo được cuộc trò chuyện mới')
    } finally {
        creatingConversation.value = false
    }
}

const handleApiError = (error, fallbackMessage) => {
    const message = resolveErrorMessage(error) || fallbackMessage
    toast.error(message, { autoClose: 3200 })
}

const resolveErrorMessage = (error) => {
    if (error?.response?.data?.message) return error.response.data.message
    if (error?.response?.data?.code) return `Mã lỗi: ${error.response.data.code}`
    if (error?.message) return error.message
    return ''
}

onMounted(async () => {
    updateViewportFlags()
    if (typeof window !== 'undefined') {
        window.addEventListener('resize', updateViewportFlags)
    }
    await loadInitialConversations()
    await chatStore.ensureDirectoryLoaded()
    applyLayoutDefaults(layoutMode.value)
    connect()
    await attemptMarkSeen()
})

onBeforeUnmount(() => {
    disconnect()
    if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateViewportFlags)
    }
})

watch(currentConversationId, (conversationId) => {
    if (conversationId) {
        chatStore.loadConversationMembers(conversationId)
    }
})

watch(
    () => authStore.user,
    (user) => {
        if (!user) {
            disconnect()
            chatStore.clear()
        }
    }
)
</script>

<style scoped>
.chat-shell {
    --shell-bg: radial-gradient(circle at top, #f7f8fb 0%, #eef1f7 55%, #e6ebf2 100%);
    --shell-border: rgba(15, 23, 42, 0.05);
    --shell-pane-bg: rgba(255, 255, 255, 0.85);
    --shell-pane-alt: rgba(247, 249, 252, 0.85);
    --shell-text-primary: #0f172a;
    --shell-text-secondary: #4b5563;
    --shell-accent: #2563eb;
    --shell-accent-soft: rgba(37, 99, 235, 0.14);
    --shell-separator: rgba(15, 23, 42, 0.04);

    min-height: 100vh;
    background: var(--shell-bg);
    color: var(--shell-text-primary);
    display: flex;
    justify-content: center;
    align-items: stretch;
    padding: 2.5rem 2rem;
    box-sizing: border-box;
}

.chat-shell__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 1.25rem 1.75rem;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid rgba(148, 163, 184, 0.16);
}

.chat-shell__toolbar-leading {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 0;
}

.chat-shell__brand-icon {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    font-size: 1.4rem;
    color: #2563eb;
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(129, 140, 248, 0.18));
    box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.15);
}

.chat-shell__toolbar-info {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
}

.chat-shell__toolbar-info h1 {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--shell-text-primary);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.chat-shell__toolbar-info p {
    margin: 0;
    color: var(--shell-text-secondary);
    font-size: 0.95rem;
    max-width: 32ch;
}

.chat-shell__toolbar-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.chat-shell__mobile-toggle {
    display: none;
    align-items: center;
    gap: 0.5rem;
    border: none;
    border-radius: 999px;
    padding: 0.55rem 1rem;
    background: rgba(37, 99, 235, 0.12);
    color: #1d4ed8;
    font-weight: 600;
    transition: background 0.2s ease, transform 0.2s ease;
}

.chat-shell__mobile-toggle:hover {
    background: rgba(37, 99, 235, 0.18);
    transform: translateY(-1px);
}

.chat-shell__layout-switch {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.05);
    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.16);
}

.chat-shell__layout-button {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border: none;
    background: transparent;
    padding: 0.45rem 0.9rem;
    border-radius: 999px;
    color: var(--shell-text-secondary);
    font-weight: 600;
    font-size: 0.9rem;
    transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.chat-shell__layout-button i {
    font-size: 1rem;
}

.chat-shell__layout-button:hover {
    background: rgba(37, 99, 235, 0.12);
    color: var(--shell-text-primary);
    transform: translateY(-1px);
}

.chat-shell__layout-button--active {
    background: linear-gradient(135deg, #2563eb, #4f46e5);
    color: #ffffff;
    box-shadow: 0 10px 25px rgba(37, 99, 235, 0.25);
}

.chat-shell__primary-action,
.chat-shell__details-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    border-radius: 12px;
    border: none;
    padding: 0.55rem 1.15rem;
    font-weight: 600;
    transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.chat-shell__primary-action {
    background: linear-gradient(135deg, #2563eb, #4f46e5);
    color: #ffffff;
    box-shadow: 0 16px 30px rgba(37, 99, 235, 0.25);
}

.chat-shell__primary-action:hover {
    transform: translateY(-1px);
    box-shadow: 0 20px 36px rgba(37, 99, 235, 0.3);
}

.chat-shell__details-toggle {
    background: rgba(15, 23, 42, 0.05);
    color: var(--shell-text-secondary);
    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
}

.chat-shell__details-toggle:hover:not(:disabled) {
    background: rgba(37, 99, 235, 0.12);
    color: var(--shell-text-primary);
}

.chat-shell__details-toggle:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
}

.chat-shell--dark .chat-shell__toolbar {
    background: rgba(17, 24, 39, 0.9);
    border-bottom-color: rgba(59, 130, 246, 0.25);
}

.chat-shell--dark .chat-shell__layout-switch {
    background: rgba(59, 130, 246, 0.12);
    box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.24);
}

.chat-shell--dark .chat-shell__layout-button {
    color: rgba(203, 213, 225, 0.9);
}

.chat-shell--dark .chat-shell__layout-button:hover {
    color: #e2e8f0;
}

.chat-shell--dark .chat-shell__mobile-toggle {
    background: rgba(59, 130, 246, 0.16);
    color: #93c5fd;
}

.chat-shell--dark .chat-shell__details-toggle {
    background: rgba(15, 23, 42, 0.6);
    color: rgba(226, 232, 240, 0.86);
    box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.24);
}

.chat-shell__workspace {
    position: relative;
    width: min(1220px, 100%);
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr) 300px;
    min-height: calc(100vh - 5rem);
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(18px);
    border-radius: 36px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    box-shadow: 0 38px 70px rgba(15, 23, 42, 0.14);
    overflow: hidden;
    transition: grid-template-columns 0.24s ease, box-shadow 0.24s ease, backdrop-filter 0.24s ease;
}

.chat-shell__pane {
    border-right: 1px solid rgba(148, 163, 184, 0.12);
    min-height: 0;
    background: var(--shell-pane-bg);
    display: flex;
}

.chat-shell__pane--sidebar {
    flex-direction: column;
}

.chat-shell__pane--thread {
    background: var(--shell-pane-alt);
    flex-direction: column;
}

.chat-shell--minimal .chat-shell__workspace {
    grid-template-columns: minmax(0, 1fr);
}

.chat-shell--minimal .chat-shell__pane--sidebar {
    border-right: none;
}

.chat-shell--minimal .chat-shell__pane--thread {
    border-radius: 24px;
    margin: 1.2rem;
    overflow: hidden;
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
}

.chat-shell--minimal .chat-shell__inline-details {
    margin-top: 1.2rem;
}

.chat-shell--whatsapp .chat-shell__workspace {
    grid-template-columns: 360px minmax(0, 1fr);
    background: linear-gradient(180deg, #eae6df 0%, #d1d7db 100%);
}

.chat-shell--whatsapp .chat-shell__pane--sidebar {
    background: linear-gradient(180deg, rgba(230, 235, 239, 0.95) 0%, rgba(218, 228, 222, 0.95) 100%);
}

.chat-shell--whatsapp .chat-shell__pane--thread {
    background: transparent;
}

.chat-shell__pane--details {
    background: var(--shell-pane-bg);
}

.chat-shell__pane--details:last-child {
    border-right: none;
}

.chat-shell__pane--sidebar-open {
    transform: translateX(0) !important;
}

.chat-shell__overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(4px);
    z-index: 4;
}

.chat-shell--dark {
    --shell-bg: radial-gradient(circle at top, #0f172a 0%, #0b1220 45%, #070c19 100%);
    --shell-border: rgba(59, 130, 246, 0.2);
    --shell-pane-bg: rgba(22, 31, 45, 0.82);
    --shell-pane-alt: rgba(15, 22, 35, 0.82);
    --shell-text-primary: #e6ebff;
    --shell-text-secondary: #98a2b3;
    --shell-accent: #5b8bff;
    --shell-accent-soft: rgba(91, 139, 255, 0.18);
    --shell-separator: rgba(91, 139, 255, 0.18);
}

.chat-shell ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

.chat-shell ::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.45);
    border-radius: 999px;
}

.chat-shell--dark ::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.45);
}

@media (max-width: 1440px) {
    .chat-shell__workspace {
        width: min(1120px, 100%);
    }
}

@media (max-width: 1320px) {
    .chat-shell__workspace {
        width: min(1040px, 100%);
        grid-template-columns: 280px minmax(0, 1fr) 260px;
    }
}

@media (max-width: 1120px) {
    .chat-shell__workspace {
        width: min(960px, 100%);
        grid-template-columns: 260px minmax(0, 1fr);
    }

    .chat-shell__pane--details {
        display: none;
    }
}

@media (max-width: 920px) {
    .chat-shell {
        padding: 1.75rem 1.25rem;
    }

    .chat-shell__workspace {
        width: 100%;
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: auto minmax(0, 1fr);
        border-radius: 28px;
    }

    .chat-shell__pane--sidebar {
        position: absolute;
        inset: 0;
        transform: translateX(-100%);
        transition: transform 0.28s ease;
        z-index: 5;
        max-width: 320px;
        box-shadow: 0 24px 48px rgba(15, 23, 42, 0.18);
        background: var(--shell-pane-bg);
    }

    .chat-shell__mobile-toggle {
        display: inline-flex;
    }

    .chat-shell__toolbar {
        position: sticky;
        top: 0;
        z-index: 4;
        background: rgba(255, 255, 255, 0.96);
        backdrop-filter: blur(6px);
        box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
    }

    .chat-shell--dark .chat-shell__toolbar {
        background: rgba(15, 23, 42, 0.92);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
    }

    .chat-shell__pane--thread {
        border-right: none;
        margin: 0;
        border-radius: 0;
        box-shadow: none;
    }
}

@media (max-width: 640px) {
    .chat-shell {
        padding: 1.25rem 1rem;
    }

    .chat-shell__workspace {
        min-height: calc(100vh - 2.5rem);
        border-radius: 20px;
    }

    .chat-shell__toolbar-actions {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
    }

    .chat-shell__primary-action {
        justify-content: center;
        width: 100%;
    }

    .chat-shell__layout-switch {
        width: 100%;
        justify-content: center;
        flex-wrap: wrap;
    }

    .chat-shell__layout-button {
        flex: 1 1 48%;
    }

    .chat-shell__details-toggle {
        width: 100%;
        justify-content: center;
    }

    .chat-shell--whatsapp .chat-shell__workspace {
        background: linear-gradient(180deg, #efeae2 0%, #d1d7db 100%);
    }
}
</style>
