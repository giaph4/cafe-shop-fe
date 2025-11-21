.chat-conversation-item__pin {
    opacity: 0;
    transition: opacity 0.2s ease;
}

.chat-conversation-item:hover .chat-conversation-item__pin,
.chat-conversation-item.chat-conversation-item--active .chat-conversation-item__pin {
    opacity: 1;
}
<template>
    <button
        type="button"
        class="chat-conversation-item"
        :class="{ 'chat-conversation-item--active': isActive }"
        @click="$emit('select', conversation.id)"
    >
        <div class="chat-conversation-item__avatar" :class="{ 'chat-conversation-item__avatar--group': isGroup }">
            <i v-if="isGroup" class="bi bi-people"></i>
            <img v-else-if="conversation.avatarUrl" :src="conversation.avatarUrl" alt="avatar" />
            <span v-else>{{ initials }}</span>
        </div>
        <div class="chat-conversation-item__content">
            <div class="chat-conversation-item__header">
                <div class="chat-conversation-item__title">
                    <span class="title-text">
                        {{ displayTitle }}
                        <i
                            v-if="conversation.pinned"
                            class="bi bi-pin-angle-fill chat-conversation-item__pin-indicator"
                        ></i>
                    </span>
                    <small class="subtitle" v-if="subtitle">{{ subtitle }}</small>
                </div>
                <div class="chat-conversation-item__meta">
                    <button
                        type="button"
                        class="chat-conversation-item__pin-button chat-conversation-item__pin"
                        :aria-label="conversation.pinned ? 'Bỏ ghim cuộc trò chuyện' : 'Ghim cuộc trò chuyện'"
                        @click.stop="emitTogglePin"
                    >
                        <i :class="conversation.pinned ? 'bi bi-pin-angle-fill chat-conversation-item__pin-icon--active' : 'bi bi-pin-angle'" />
                    </button>
                    <small class="chat-conversation-item__time" :title="exactUpdatedAt">
                        {{ relativeUpdatedAt }}
                    </small>
                </div>
            </div>
            <div class="chat-conversation-item__footer">
                <span class="last-message" v-if="lastMessagePreview">
                    <i v-if="lastMessageIcon" :class="lastMessageIcon"></i>
                    <span>{{ lastMessagePreview }}</span>
                </span>
                <span v-else class="chat-conversation-item__empty">Chưa có tin nhắn</span>
                <span v-if="conversation.unreadCount > 0" class="chat-conversation-item__badge">
                    {{ conversation.unreadCount }}
                </span>
            </div>
        </div>
    </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    conversation: { type: Object, required: true },
    isActive: { type: Boolean, default: false },
    currentUserId: { type: Number, default: null }
})

const emit = defineEmits(['select', 'toggle-pin'])

const isGroup = computed(() => props.conversation?.type === 'GROUP')

const participants = computed(() => props.conversation?.participants || [])

const displayTitle = computed(() => {
    if (props.conversation?.title) return props.conversation.title
    if (!participants.value.length) return 'Hội thoại'
    const others = participants.value.filter((member) => member.userId !== props.currentUserId)
    if (!others.length) return participants.value[0]?.fullName || 'Bạn'
    if (others.length === 1) return others[0].fullName || others[0].username || 'Thành viên'
    return `${others[0].fullName || others[0].username || 'Thành viên'} +${others.length - 1}`
})

const initials = computed(() => {
    const title = displayTitle.value
    if (!title) return 'C'
    return title
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase()
})

const subtitle = computed(() => {
    if (!participants.value.length || isGroup.value) return null
    const other = participants.value.find((member) => member.userId !== props.currentUserId)
    return other?.username || other?.fullName || null
})

const lastMessage = computed(() => props.conversation?.lastMessage || null)

const lastMessageIcon = computed(() => {
    if (!lastMessage.value) return null
    if (lastMessage.value.status === 'RECALLED') return 'bi bi-slash-circle text-warning'
    switch (lastMessage.value.contentType) {
        case 'IMAGE':
            return 'bi bi-image'
        case 'VIDEO':
            return 'bi bi-camera-video'
        case 'AUDIO':
            return 'bi bi-mic'
        case 'FILE':
            return 'bi bi-paperclip'
        case 'EMOJI':
            return 'bi bi-emoji-smile'
        default:
            return null
    }
})

const lastMessagePreview = computed(() => {
    if (!lastMessage.value) return ''
    if (lastMessage.value.status === 'RECALLED') return 'Tin nhắn đã được thu hồi'
    if (lastMessage.value.content) return lastMessage.value.content
    if (lastMessage.value.attachments?.length) return `${lastMessage.value.attachments.length} tệp đính kèm`
    return ''
})

const exactUpdatedAt = computed(() => props.conversation?.updatedAt ? new Date(props.conversation.updatedAt).toLocaleString() : '')

const relativeUpdatedAt = computed(() => {
    if (!props.conversation?.updatedAt) return ''
    const date = new Date(props.conversation.updatedAt)
    const now = new Date()
    const diffMs = now - date
    const diffMinutes = Math.floor(diffMs / 60000)
    if (diffMinutes < 1) return 'Vừa xong'
    if (diffMinutes < 60) return `${diffMinutes} phút trước`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} giờ trước`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays} ngày trước`
    return date.toLocaleDateString()
})

const emitTogglePin = () => {
    emit('toggle-pin', props.conversation)
}
</script>

<style scoped>
.chat-conversation-item {
    display: flex;
    gap: 0.85rem;
    width: 100%;
    border: none;
    background: transparent;
    padding: 0.75rem 1rem;
    border-radius: 14px;
    text-align: left;
    transition: background-color 0.2s ease, transform 0.2s ease;
}

.chat-conversation-item:hover {
    background-color: rgba(99, 102, 241, 0.08);
    transform: translateY(-1px);
}

.chat-conversation-item--active {
    background-color: rgba(99, 102, 241, 0.14);
    box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.25);
}

.chat-conversation-item__avatar {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(79, 70, 229, 0.18), rgba(14, 116, 144, 0.18));
    display: grid;
    place-items: center;
    color: #1e293b;
    font-weight: 600;
    font-size: 0.95rem;
    overflow: hidden;
}

.chat-conversation-item__avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.chat-conversation-item__avatar--group {
    background: linear-gradient(135deg, rgba(14, 165, 233, 0.22), rgba(59, 130, 246, 0.2));
    color: #0f172a;
    font-size: 1.1rem;
}

.chat-conversation-item__content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
}

.chat-conversation-item__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.75rem;
}

.chat-conversation-item__meta {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.chat-conversation-item__title {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    max-width: calc(100% - 80px);
}

.chat-conversation-item__title .title-text {
    font-weight: 600;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.chat-conversation-item__pin-indicator {
    color: #f59e0b;
    font-size: 0.95rem;
}

.chat-conversation-item__title .subtitle {
    color: #64748b;
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.chat-conversation-item__time {
    color: #94a3b8;
    flex-shrink: 0;
}

.chat-conversation-item__footer {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    align-items: center;
}

.chat-conversation-item__footer .last-message {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: #475569;
    font-size: 0.85rem;
    min-width: 0;
    overflow: hidden;
}

.chat-conversation-item__footer .last-message span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.chat-conversation-item__footer .badge {
    flex-shrink: 0;
}

:global([data-bs-theme='dark']) .chat-conversation-item {
    color: #e2e8f0;
}

:global([data-bs-theme='dark']) .chat-conversation-item:hover {
    background-color: rgba(59, 130, 246, 0.18);
}

:global([data-bs-theme='dark']) .chat-conversation-item--active {
    background-color: rgba(99, 102, 241, 0.35);
    box-shadow: inset 0 0 0 1px rgba(14, 165, 233, 0.4);
}

:global([data-bs-theme='dark']) .chat-conversation-item__title .title-text {
    color: #e2e8f0;
}

:global([data-bs-theme='dark']) .chat-conversation-item__title .subtitle {
    color: rgba(226, 232, 240, 0.7);
}

:global([data-bs-theme='dark']) .chat-conversation-item__time {
    color: rgba(148, 163, 184, 0.7);
}

:global([data-bs-theme='dark']) .chat-conversation-item__footer .last-message {
    color: rgba(203, 213, 225, 0.85);
}
</style>
