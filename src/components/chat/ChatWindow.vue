<template>
    <section class="chat-window" :class="windowClass" v-if="conversation">
        <header class="chat-window__header" :class="headerClass">
            <div class="chat-window__identity">
                <div class="chat-window__avatar" :class="{ 'chat-window__avatar--group': isGroupConversation }">
                    <img v-if="conversationAvatar" :src="conversationAvatar" :alt="conversationTitle">
                    <span v-else>{{ conversationInitials }}</span>
                </div>
                <div class="chat-window__meta">
                    <h4>{{ conversationTitle }}</h4>
                    <small>{{ participantsSummary }}</small>
                </div>
            </div>
            <div class="chat-window__header-actions">
                <button type="button" class="chat-window__icon" disabled>
                    <i class="bi bi-telephone"></i>
                </button>
                <button type="button" class="chat-window__icon" disabled>
                    <i class="bi bi-camera-video"></i>
                </button>
                <button type="button" class="chat-window__icon" @click="$emit('refresh', conversation.id)">
                    <i class="bi bi-arrow-clockwise"></i>
                </button>
            </div>
        </header>

        <div class="chat-window__body" :class="bodyClass" ref="scrollContainer" @scroll="handleScroll">
            <div v-if="showWallpaper" class="chat-window__wallpaper"></div>
            <div v-if="loadingState === 'initial'" class="chat-window__skeletons">
                <div v-for="i in 6" :key="i" class="chat-window__skeleton shimmer"></div>
            </div>
            <template v-else>
                <div class="chat-window__history-indicator" v-if="hasMore">
                    <button type="button" class="chat-window__load-more" @click="emitLoadMore">
                        Xem tin nhắn cũ hơn
                    </button>
                </div>
                <div class="chat-window__messages">
                    <ChatMessageBubble
                        v-for="message in orderedMessages"
                        :key="message.id || message.tempId"
                        :message="message"
                        :current-user-id="currentUserId"
                        :show-header="showSenderHeader(message)"
                        :seen-by="seenByNames(message)"
                        @retry="(payload) => $emit('retry', payload)"
                        @recall="(payload) => $emit('recall', payload)"
                    >
                        <template #attachments="{ attachments }">
                            <ChatAttachmentPreview :attachments="attachments" />
                        </template>
                    </ChatMessageBubble>
                    <div v-if="typingUsers.length" class="chat-window__typing">
                        <span class="typing-dots">
                            <span></span><span></span><span></span>
                        </span>
                        <small>{{ typingUsers.join(', ') }} đang nhập...</small>
                    </div>
                </div>
            </template>
        </div>

        <ChatInput
            :is-sending="pendingSending"
            :layout="layout"
            @send-text="$emit('send-text', $event)"
            @send-attachments="$emit('send-attachments', $event)"
            @send-emoji="$emit('send-emoji', $event)"
            @typing="$emit('typing', $event)"
        />
    </section>
    <div v-else class="chat-window__empty" :class="windowClass">
        <i class="bi bi-chat-text"></i>
        <h5>Chọn một cuộc trò chuyện để bắt đầu</h5>
        <p class="chat-window__empty-description">Danh sách cuộc trò chuyện nằm bên trái, hãy chọn hoặc tạo cuộc trò chuyện mới.</p>
    </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import ChatMessageBubble from './ChatMessageBubble.vue'
import ChatAttachmentPreview from './ChatAttachmentPreview.vue'
import ChatInput from './ChatInput.vue'

const props = defineProps({
    conversation: { type: Object, default: null },
    messages: { type: Array, default: () => [] },
    pendingMessages: { type: Array, default: () => [] },
    typingUsers: { type: Array, default: () => [] },
    currentUserId: { type: Number, default: null },
    hasMore: { type: Boolean, default: false },
    loadingState: { type: String, default: 'idle' }, // 'initial' | 'loading-more' | 'idle'
    pendingSending: { type: Boolean, default: false },
    members: { type: Array, default: () => [] },
    membersLoading: { type: Boolean, default: false },
    layout: { type: String, default: 'slack' }
})

const emit = defineEmits(['load-more', 'send-text', 'send-attachments', 'typing', 'retry', 'refresh', 'scroll-bottom', 'recall'])

const scrollContainer = ref(null)
const previousMessageCount = ref(0)

const layoutVariant = computed(() => (props.layout || 'slack').toLowerCase())
const windowClass = computed(() => `chat-window--${layoutVariant.value}`)
const headerClass = computed(() => ({
    'chat-window__header--borderless': layoutVariant.value === 'minimal',
    'chat-window__header--muted': layoutVariant.value === 'whatsapp'
}))
const bodyClass = computed(() => ({
    'chat-window__body--tight': layoutVariant.value === 'minimal',
    'chat-window__body--pattern': layoutVariant.value === 'whatsapp'
}))
const showWallpaper = computed(() => layoutVariant.value === 'whatsapp')

const orderedMessages = computed(() => {
    const base = Array.isArray(props.messages) ? [...props.messages] : []
    const pending = Array.isArray(props.pendingMessages) ? props.pendingMessages.map((item) => ({
        ...item,
        status: item.status || 'sending'
    })) : []
    return [...base, ...pending].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
})

const conversationTitle = computed(() => props.conversation?.title || defaultTitle())
const isGroupConversation = computed(() => props.conversation?.type === 'GROUP')
const conversationMembers = computed(() => {
    if (Array.isArray(props.members) && props.members.length) return props.members
    return props.conversation?.participants || []
})

const participantsSummary = computed(() => {
    if (!conversationMembers.value.length) return '—'
    const names = conversationMembers.value
        .filter((member) => member.userId !== props.currentUserId)
        .map((member) => member.fullName || member.username || 'Thành viên')
    if (!names.length) return 'Bạn'
    if (names.length === 1) return names[0]
    if (names.length === 2) return `${names[0]} và ${names[1]}`
    return `${names[0]} và ${names.length - 1} thành viên khác`
})

const conversationAvatar = computed(() => {
    if (props.conversation?.avatarUrl) return props.conversation.avatarUrl
    if (!isGroupConversation.value) {
        const other = conversationMembers.value.find((member) => member.userId !== props.currentUserId)
        return other?.avatarUrl || null
    }
    return null
})

const conversationInitials = computed(() => {
    if (props.conversation?.title) return initials(props.conversation.title)
    const other = conversationMembers.value.find((member) => member.userId !== props.currentUserId)
    if (other?.fullName) return initials(other.fullName)
    if (other?.username) return initials(other.username)
    return 'NH'
})

const showSenderHeader = (message) => props.conversation?.type === 'GROUP' && message.senderId !== props.currentUserId

const seenByNames = (message) => {
    if (!message?.seenByUserIds?.length || message.senderId !== props.currentUserId) return []
    const map = new Map(conversationMembers.value.map((member) => [member.userId, member.fullName || member.username || 'Thành viên']))
    return message.seenByUserIds
        .filter((id) => id !== props.currentUserId)
        .map((id) => map.get(id))
        .filter(Boolean)
}

const scrollToBottom = (options = { smooth: false }) => {
    nextTick(() => {
        const container = scrollContainer.value
        if (!container) return
        const behavior = options.smooth ? 'smooth' : 'auto'
        container.scrollTo({ top: container.scrollHeight, behavior })
        emit('scroll-bottom')
    })
}

watch(
    () => orderedMessages.value.length,
    (newCount, oldCount) => {
        if (newCount > oldCount && newCount !== previousMessageCount.value) {
            const latest = orderedMessages.value[orderedMessages.value.length - 1]
            const isOwn = latest?.senderId === props.currentUserId
            scrollToBottom({ smooth: isOwn })
            previousMessageCount.value = newCount
        }
    }
)

watch(
    () => props.conversation?.id,
    () => {
        nextTick(() => {
            const container = scrollContainer.value
            if (container) {
                container.scrollTop = container.scrollHeight
            }
        })
        previousMessageCount.value = orderedMessages.value.length
    }
)

const handleScroll = () => {
    const container = scrollContainer.value
    if (!container) return

    if (container.scrollTop <= 80 && props.hasMore && props.loadingState !== 'loading-more') {
        emitLoadMore()
    }

    const distanceToBottom = container.scrollHeight - (container.scrollTop + container.clientHeight)
    if (distanceToBottom <= 60) {
        emit('scroll-bottom')
    }
}

const emitLoadMore = () => {
    emit('load-more')
}

const initials = (value) => {
    if (!value) return 'NV'
    return value
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
}

const roleLabel = (role) => {
    switch (role) {
        case 'OWNER':
            return 'Chủ nhóm'
        case 'ADMIN':
            return 'Quản trị'
        default:
            return 'Thành viên'
    }
}

function defaultTitle() {
    if (!conversationMembers.value.length) return 'Hội thoại'
    const others = conversationMembers.value.filter((member) => member.userId !== props.currentUserId)
    if (!others.length) return conversationMembers.value[0]?.fullName || 'Hội thoại'
    if (others.length === 1) return others[0].fullName || others[0].username || 'Hội thoại'
    return 'Nhóm trò chuyện'
}
</script>

<style scoped>
.chat-window {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--shell-pane-alt, #f7f8fa);
    position: relative;
    overflow: hidden;
}

.chat-window--minimal {
    background: var(--shell-pane-bg, #fff);
}

.chat-window--whatsapp {
    background: url('data:image/svg+xml,%3Csvg width="320" height="320" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" opacity="0.15"%3E%3Cpath d="M160 0C71.6 0 0 71.6 0 160s71.6 160 160 160 160-71.6 160-160S248.4 0 160 0zm0 304c-79.5 0-144-64.5-144-144S80.5 16 160 16s144 64.5 144 144-64.5 144-144 144z" fill='%2300a884'/%3E%3C/svg%3E'), linear-gradient(180deg, #efeae2 0%, #d5dbd3 100%);
    background-size: 480px 480px, cover;
}

.chat-window__empty {
    flex: 1;
    display: grid;
    place-items: center;
    text-align: center;
    padding: 3rem 1rem;
    color: rgba(71, 85, 105, 0.75);
    background: var(--shell-pane-alt, #f7f8fa);
}

.chat-window__empty i {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.chat-window__header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--shell-border, rgba(15, 23, 42, 0.06));
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
}

.chat-window__header--borderless {
    border-bottom: none;
    padding: 0.75rem 1.25rem;
}

.chat-window__header--muted {
    border-bottom-color: rgba(0, 0, 0, 0.05);
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(6px);
}

.chat-window__identity {
    display: flex;
    align-items: center;
    gap: 0.85rem;
}

.chat-window__avatar {
    width: 50px;
    height: 50px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.45), rgba(37, 99, 235, 0.75));
    color: #fff;
    font-weight: 700;
    display: grid;
    place-items: center;
    overflow: hidden;
    text-transform: uppercase;
}

.chat-window__avatar--group {
    border-radius: 18px;
}

.chat-window__avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.chat-window__meta {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.chat-window__meta h4 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
}

.chat-window__meta small {
    color: rgba(71, 85, 105, 0.75);
}

.chat-window__header-actions {
    display: flex;
    align-items: center;
    gap: 0.35rem;
}

.chat-window__icon {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    border: none;
    background: rgba(15, 23, 42, 0.06);
    display: grid;
    place-items: center;
    color: inherit;
    transition: background 0.18s ease, transform 0.18s ease;
}

.chat-window__icon:hover:not(:disabled) {
    background: rgba(0, 106, 255, 0.15);
    transform: translateY(-1px);
    color: var(--shell-accent, #006aff);
}

.chat-window__icon:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.chat-window__body {
    flex: 1;
    overflow-y: auto;
    padding: 1.25rem 1.5rem;
    position: relative;
    display: flex;
    flex-direction: column;
}

.chat-window__body--tight {
    padding: 0.85rem 1rem;
}

.chat-window__body--pattern {
    padding: 1.5rem 2rem;
}

.chat-window__wallpaper {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: url('data:image/svg+xml,%3Csvg width="320" height="320" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" opacity="0.12"%3E%3Cpath d="M56 48a8 8 0 018-8h192a8 8 0 018 8v224a8 8 0 01-8 8H64a8 8 0 01-8-8z" fill='%23008363'/%3E%3C/svg%3E');
    background-size: 320px 320px;
}

.chat-window__messages {
    margin-top: auto;
    display: flex;
    flex-direction: column;
}

.chat-window__history-indicator {
    text-align: center;
    margin-bottom: 0.75rem;
}

.chat-window__load-more {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border: none;
    border-radius: 999px;
    padding: 0.45rem 1.1rem;
    background: rgba(37, 99, 235, 0.12);
    color: var(--shell-accent, #2563eb);
    font-weight: 600;
    transition: background 0.18s ease, transform 0.18s ease;
}

.chat-window__load-more:hover {
    background: rgba(37, 99, 235, 0.2);
    transform: translateY(-1px);
}

.chat-window__skeletons {
    display: grid;
    gap: 1rem;
}

.chat-window__skeleton {
    height: 70px;
    border-radius: 18px;
    background: linear-gradient(90deg, rgba(226, 232, 240, 0.6) 25%, rgba(226, 232, 240, 0.3) 50%, rgba(226, 232, 240, 0.6) 75%);
    background-size: 200% 100%;
}

.shimmer {
    animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

.chat-window__typing {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 1rem 0;
    color: rgba(71, 85, 105, 0.7);
}

.typing-dots {
    display: inline-flex;
    gap: 0.2rem;
}

.typing-dots span {
    width: 6px;
    height: 6px;
    background: rgba(148, 163, 184, 0.8);
    border-radius: 999px;
    animation: typing 1s infinite ease-in-out;
}

.typing-dots span:nth-child(2) { animation-delay: 0.15s; }
.typing-dots span:nth-child(3) { animation-delay: 0.3s; }

@keyframes typing {
    0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
    40% { opacity: 1; transform: translateY(-2px); }
}

:global([data-bs-theme='dark']) .chat-window {
    background: var(--shell-pane-alt, #242526);
}

:global([data-bs-theme='dark']) .chat-window--whatsapp {
    background: linear-gradient(180deg, #1f2c34 0%, #111b21 100%);
}

:global([data-bs-theme='dark']) .chat-window__header--muted {
    background: rgba(17, 27, 33, 0.92);
    border-bottom-color: rgba(255, 255, 255, 0.07);
}

:global([data-bs-theme='dark']) .chat-window__header {
    border-bottom-color: rgba(148, 163, 184, 0.18);
}

:global([data-bs-theme='dark']) .chat-window__meta small {
    color: rgba(176, 179, 184, 0.85);
}

:global([data-bs-theme='dark']) .chat-window__icon {
    background: rgba(255, 255, 255, 0.05);
}

:global([data-bs-theme='dark']) .chat-window__icon:hover:not(:disabled) {
    background: rgba(35, 116, 225, 0.22);
    color: rgba(199, 210, 254, 0.95);
}

:global([data-bs-theme='dark']) .chat-window__empty {
    background: var(--shell-pane-alt, #242526);
    color: rgba(176, 179, 184, 0.85);
}

.chat-window__empty-description {
    color: rgba(71, 85, 105, 0.7);
    max-width: 36ch;
    margin: 0 auto;
}

:global([data-bs-theme='dark']) .chat-window--whatsapp .chat-window__empty {
    background: rgba(17, 27, 33, 0.92);
}

:global([data-bs-theme='dark']) .chat-window__typing {
    color: rgba(176, 179, 184, 0.8);
}

:global([data-bs-theme='dark']) .chat-window__skeleton {
    background: linear-gradient(90deg, rgba(51, 65, 85, 0.55) 25%, rgba(51, 65, 85, 0.3) 50%, rgba(51, 65, 85, 0.55) 75%);
}

:global([data-bs-theme='dark']) .chat-window--whatsapp :deep(.chat-message__bubble) {
    background: rgba(32, 44, 51, 0.9);
    box-shadow: none;
}

:global([data-bs-theme='dark']) .chat-window--whatsapp :deep(.chat-message--self .chat-message__bubble) {
    background: #005c4b;
    color: rgba(226, 232, 240, 0.96);
}
</style>
