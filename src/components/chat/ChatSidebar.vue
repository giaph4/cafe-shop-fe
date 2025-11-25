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
            <div class="spinner-border spinner-border-sm text-primary"></div>
            <span class="ms-2">Đang tải...</span>
        </div>

        <div class="chat-sidebar__empty" v-if="!loading && filteredConversations.length === 0">
            <i class="bi bi-chat-dots fs-1 text-muted"></i>
            <p class="text-muted mb-0">Chưa có hội thoại nào</p>
        </div>

        <div class="chat-sidebar__pagination" v-if="hasMore">
            <button class="btn btn-sm btn-outline-primary w-100" @click="$emit('load-more')" :disabled="loadingMore">
                <span v-if="loadingMore" class="spinner-border spinner-border-sm me-2"></span>
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

<style scoped lang="scss">
.chat-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #ffffff;
    border-right: 1px solid #e2e8f0;
}

.chat-sidebar__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem;
    border-bottom: 1px solid #e2e8f0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    .chat-sidebar__title {
        margin: 0;
        font-weight: 700;
        font-size: 1.25rem;
        color: white;
    }

    .btn {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
        color: white;

        &:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.4);
        }
    }
}

.chat-sidebar__search {
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;

    .input-group-text {
        border-right: none;
        border-color: #e2e8f0;
    }

    .form-control {
        border-left: none;
        border-color: #e2e8f0;

        &:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }
    }
}

.chat-sidebar__list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem 0;
}

.conversation-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1.25rem;
    cursor: pointer;
    transition: all 0.2s;
    border-bottom: 1px solid #f1f5f9;

    &:hover {
        background: #f8fafc;
    }

    &--active {
        background: linear-gradient(90deg, rgba(102, 126, 234, 0.1), transparent);
        border-left: 3px solid #667eea;
    }

    &--pinned {
        background: #fffbf0;
    }
}

.conversation-item__avatar {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    overflow: hidden;
    flex-shrink: 0;
    background: linear-gradient(135deg, #667eea, #764ba2);
    display: flex;
    align-items: center;
    justify-content: center;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
}

.conversation-item__avatar-placeholder {
    color: white;
    font-weight: 700;
    font-size: 1.125rem;
}

.conversation-item__content {
    flex: 1;
    min-width: 0;
}

.conversation-item__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
}

.conversation-item__name {
    margin: 0;
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.conversation-item__time {
    font-size: 0.75rem;
    color: #64748b;
    white-space: nowrap;
    flex-shrink: 0;
}

.conversation-item__preview {
    display: flex;
    align-items: center;
}

.conversation-item__last-message {
    font-size: 0.8125rem;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}

.conversation-item__badges {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
    flex-shrink: 0;
}

.conversation-item__actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    opacity: 0;
    transition: opacity 0.2s;
    flex-shrink: 0;
}

.conversation-item:hover .conversation-item__actions {
    opacity: 1;
}

.chat-sidebar__loading,
.chat-sidebar__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1.5rem;
    color: #64748b;
}

.chat-sidebar__pagination {
    padding: 1rem;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
}
</style>

