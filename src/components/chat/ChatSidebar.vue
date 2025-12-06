<template>
    <div class="chat-sidebar">
        <div class="chat-sidebar__header">
            <h5 class="chat-sidebar__title">Hội thoại</h5>
            <button class="btn btn-sm btn-primary" @click="$emit('create-conversation')">
                <i class="bi bi-plus-lg me-1"></i>
                Tạo mới
            </button>
        </div>

        <div class="chat-sidebar__search">
            <div class="input-group">
                <span class="input-group-text bg-white">
                    <i class="bi bi-search"></i>
                </span>
                <input
                    type="text"
                    class="form-control"
                    placeholder="Tìm kiếm hội thoại..."
                    v-model="searchQuery"
                    @input="handleSearch"
                />
            </div>
        </div>

        <div class="chat-sidebar__list" v-if="!loading">
            <div
                v-for="conversation in filteredConversations"
                :key="conversation.id"
                class="conversation-item"
                :class="{
                    'conversation-item--active': selectedConversationId === conversation.id,
                    'conversation-item--pinned': conversation.pinned
                }"
                @click="$emit('select', conversation)"
            >
                <div class="conversation-item__avatar">
                    <img
                        v-if="getConversationAvatar(conversation)"
                        :src="getConversationAvatar(conversation)"
                        :alt="getConversationName(conversation)"
                    />
                    <div v-else class="conversation-item__avatar-placeholder">
                        {{ getConversationInitials(conversation) }}
                    </div>
                </div>
                <div class="conversation-item__content">
                    <div class="conversation-item__header">
                        <h6 class="conversation-item__name">{{ getConversationName(conversation) }}</h6>
                        <span class="conversation-item__time" v-if="conversation.lastMessage">
                            {{ formatTime(conversation.lastMessage.createdAt) }}
                        </span>
                    </div>
                    <div class="conversation-item__preview">
                        <span class="conversation-item__last-message" v-if="conversation.lastMessage">
                            <span v-if="conversation.lastMessage.recalled" class="text-muted fst-italic">
                                Tin nhắn đã được thu hồi
                            </span>
                            <span v-else-if="conversation.lastMessage.status === 'RECALLED'" class="text-muted fst-italic">
                                Tin nhắn đã được thu hồi
                            </span>
                            <span v-else-if="conversation.lastMessage.contentType === 'TEXT'">
                                {{ conversation.lastMessage.content }}
                            </span>
                            <span v-else-if="conversation.lastMessage.contentType === 'EMOJI'">
                                {{ conversation.lastMessage.metadata || conversation.lastMessage.content }}
                            </span>
                            <span v-else-if="['IMAGE', 'VIDEO', 'AUDIO', 'FILE'].includes(conversation.lastMessage.contentType)">
                                <i class="bi bi-paperclip me-1"></i>
                                {{ conversation.lastMessage.attachments?.length || 0 }} tệp đính kèm
                            </span>
                        </span>
                    </div>
                </div>
                <div class="conversation-item__badges">
                    <span
                        v-if="conversation.unreadCount > 0"
                        class="badge bg-primary rounded-pill"
                    >
                        {{ conversation.unreadCount > 99 ? '99+' : conversation.unreadCount }}
                    </span>
                </div>
                <div class="conversation-item__actions" @click.stop>
                    <button
                        class="btn btn-sm btn-link text-muted p-1"
                        @click="$emit('toggle-pin', conversation)"
                        :title="conversation.pinned ? 'Bỏ ghim' : 'Ghim'"
                    >
                        <i :class="conversation.pinned ? 'bi bi-pin-angle-fill text-warning' : 'bi bi-pin-angle'"></i>
                    </button>
                </div>
            </div>
        </div>

        <div class="chat-sidebar__loading" v-if="loading">
            <div class="spinner-border spinner-border-sm" style="color: var(--color-primary);"></div>
            <span class="ms-2">Đang tải...</span>
        </div>

        <div class="chat-sidebar__empty" v-if="!loading && filteredConversations.length === 0">
            <i class="bi bi-chat-dots fs-1 text-muted"></i>
            <p class="text-muted mb-0">Chưa có hội thoại nào</p>
        </div>

        <div class="chat-sidebar__pagination" v-if="hasMore">
            <button class="btn btn-sm btn-outline-primary w-100" @click="$emit('load-more')" :disabled="loadingMore">
                <span v-if="loadingMore" class="spinner-border spinner-border-sm me-2" style="color: var(--color-primary);"></span>
                Tải thêm
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatDateTime } from '@/utils/formatters'

const props = defineProps({
    conversations: {
        type: Array,
        default: () => []
    },
    selectedConversationId: {
        type: Number,
        default: null
    },
    loading: {
        type: Boolean,
        default: false
    },
    loadingMore: {
        type: Boolean,
        default: false
    },
    hasMore: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['select', 'create-conversation', 'load-more', 'search', 'toggle-pin'])

const searchQuery = ref('')

const filteredConversations = computed(() => {
    if (!searchQuery.value.trim()) {
        return props.conversations
    }
    const query = searchQuery.value.toLowerCase()
    return props.conversations.filter(conv => {
        const name = getConversationName(conv).toLowerCase()
        const lastMessage = conv.lastMessage?.content?.toLowerCase() || ''
        return name.includes(query) || lastMessage.includes(query)
    })
})

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

const formatTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Vừa xong'
    if (minutes < 60) return `${minutes} phút`
    if (hours < 24) return `${hours} giờ`
    if (days < 7) return `${days} ngày`
    return formatDateTime(dateString, 'DD/MM/YYYY')
}

const handleSearch = () => {
    emit('search', searchQuery.value)
}
</script>

<style scoped>
/* Chat Sidebar - Chuẩn hóa theo base.css */
.chat-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--color-card);
    border-right: 1px solid var(--color-border);
    width: 320px;
    flex-shrink: 0;
}

/* Header - Chuẩn hóa, không dùng gradient */
.chat-sidebar__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-3) var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card-muted);
}

.chat-sidebar__title {
    margin: 0;
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-lg);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.chat-sidebar__header .btn {
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    gap: 6px;
    font-family: var(--font-family-sans);
}

.chat-sidebar__header .btn i {
    font-size: 18px;
    line-height: 1;
}

/* Search - Chuẩn hóa */
.chat-sidebar__search {
    padding: var(--spacing-3);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card-muted);
}

.chat-sidebar__search .input-group-text {
    border-right: none;
    border-color: var(--color-border);
    background: var(--color-card);
    border-radius: var(--radius-sm) 0 0 var(--radius-sm);
}

.chat-sidebar__search .input-group-text i {
    font-size: 18px;
    line-height: 1;
    color: var(--color-text-muted);
}

.chat-sidebar__search .form-control {
    border-left: none;
    border-color: var(--color-border);
    background: var(--color-card);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    height: 40px;
    font-size: var(--font-size-base);
    padding: var(--spacing-2) var(--spacing-3);
    font-family: var(--font-family-sans);
}

.chat-sidebar__search .form-control:focus {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

/* List - Chuẩn hóa */
.chat-sidebar__list {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-2) 0;
}

.conversation-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-3) var(--spacing-4);
    cursor: pointer;
    transition: all var(--transition-base);
    border-bottom: 1px solid var(--color-border);
    position: relative;
}

.conversation-item:hover {
    background: var(--color-card-muted);
}

.conversation-item--active {
    background: var(--color-card-muted);
    border-left: 3px solid var(--color-primary);
}

.conversation-item--pinned {
    background: var(--color-card-muted);
}

.conversation-item--pinned::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--color-warning);
}

/* Avatar - Chuẩn hóa, không dùng gradient */
.conversation-item__avatar {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-sm);
    overflow: hidden;
    flex-shrink: 0;
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
}

.conversation-item__avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.conversation-item__avatar-placeholder {
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-lg);
}

.conversation-item__content {
    flex: 1;
    min-width: 0;
}

.conversation-item__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-2);
    margin-bottom: var(--spacing-1);
}

.conversation-item__name {
    margin: 0;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: var(--font-family-sans);
}

.conversation-item__time {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    white-space: nowrap;
    flex-shrink: 0;
}

.conversation-item__preview {
    display: flex;
    align-items: center;
}

.conversation-item__last-message {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}

.conversation-item__badges {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--spacing-1);
    flex-shrink: 0;
}

.conversation-item__badges .badge {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    background: var(--color-primary);
    color: var(--color-text-inverse);
    font-family: var(--font-family-sans);
}

.conversation-item__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
    opacity: 0;
    transition: opacity var(--transition-base);
    flex-shrink: 0;
}

.conversation-item:hover .conversation-item__actions {
    opacity: 1;
}

.conversation-item__actions .btn {
    padding: var(--spacing-1);
    border-radius: var(--radius-sm);
    transition: all var(--transition-base);
}

.conversation-item__actions .btn:hover {
    background: var(--color-card-muted);
    color: var(--color-primary);
}

.chat-sidebar__loading,
.chat-sidebar__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-6) var(--spacing-4);
    color: var(--color-text-muted);
    gap: var(--spacing-3);
}

.chat-sidebar__loading i,
.chat-sidebar__empty i {
    font-size: 48px;
    line-height: 1;
}

.chat-sidebar__loading span,
.chat-sidebar__empty p {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
}

.chat-sidebar__pagination {
    padding: var(--spacing-3);
    border-top: 1px solid var(--color-border);
    background: var(--color-card-muted);
}

.chat-sidebar__pagination .btn {
    width: 100%;
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    gap: 6px;
    font-family: var(--font-family-sans);
}

.chat-sidebar__pagination .btn i {
    font-size: 18px;
    line-height: 1;
}

/* Responsive */
@media (max-width: 768px) {
    .chat-sidebar {
        width: 100%;
    }
}
</style>

