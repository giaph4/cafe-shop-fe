<template>
    <aside class="chat-sidebar">
        <header class="chat-sidebar__header">
            <h2>Trò chuyện</h2>
            <button type="button" class="chat-sidebar__new-btn" @click="$emit('create')">
                <i class="bi bi-plus-lg"></i>
            </button>
        </header>

        <div class="chat-sidebar__search">
            <i class="bi bi-search"></i>
            <input
                type="text"
                placeholder="Tìm kiếm hội thoại hoặc người dùng"
                v-model="searchTerm"
            />
        </div>

        <div class="chat-sidebar__filters">
            <button
                v-for="filter in filters"
                :key="filter.value"
                type="button"
                class="chat-sidebar__filter"
                :class="{ 'chat-sidebar__filter--active': activeFilter === filter.value }"
                @click="activeFilter = filter.value"
            >
                {{ filter.label }}
            </button>
        </div>

        <div class="chat-sidebar__list">
            <div
                v-for="conversation in filteredConversations"
                :key="conversation.id"
                class="chat-sidebar__item"
                :class="{ 'chat-sidebar__item--active': conversation.id === activeConversationId }"
                @click="$emit('select', conversation.id)"
            >
                <div class="chat-sidebar__avatar">
                    <img v-if="conversation.avatarUrl" :src="conversation.avatarUrl" :alt="conversation.name" />
                    <span v-else>{{ getInitials(conversation.name) }}</span>
                </div>
                <div class="chat-sidebar__content">
                    <div class="chat-sidebar__name">{{ conversation.name }}</div>
                    <div class="chat-sidebar__preview">{{ conversation.lastMessage?.content || 'Chưa có tin nhắn' }}</div>
                </div>
                <div class="chat-sidebar__meta">
                    <div class="chat-sidebar__time">{{ formatTime(conversation.lastMessage?.createdAt) }}</div>
                    <div v-if="conversation.unreadCount > 0" class="chat-sidebar__badge">
                        {{ conversation.unreadCount }}
                    </div>
                </div>
            </div>
        </div>
    </aside>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
    conversations: {
        type: Array,
        default: () => []
    },
    activeConversationId: {
        type: [String, Number],
        default: null
    },
    currentUserId: {
        type: [String, Number],
        required: true
    }
})

defineEmits(['select', 'create'])

const searchTerm = ref('')
const activeFilter = ref('all')

const filters = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Đã ghim', value: 'pinned' },
    { label: 'Chưa đọc', value: 'unread' }
]

const filteredConversations = computed(() => {
    let result = [...props.conversations]

    // Filter by search term
    if (searchTerm.value) {
        const term = searchTerm.value.toLowerCase()
        result = result.filter(c => 
            c.name?.toLowerCase().includes(term) ||
            c.lastMessage?.content?.toLowerCase().includes(term)
        )
    }

    // Filter by active filter
    if (activeFilter.value === 'pinned') {
        result = result.filter(c => c.pinned)
    } else if (activeFilter.value === 'unread') {
        result = result.filter(c => c.unreadCount > 0)
    }

    // Sort: pinned first, then by last message time
    result.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        const timeA = a.lastMessage?.createdAt || 0
        const timeB = b.lastMessage?.createdAt || 0
        return timeB - timeA
    })

    return result
})

const getInitials = (name) => {
    if (!name) return 'U'
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(s => s[0])
        .join('')
        .toUpperCase()
}

const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Vừa xong'
    if (minutes < 60) return `${minutes} phút trước`
    if (hours < 24) return `${hours} giờ trước`
    if (days < 7) return `${days} ngày trước`
    return date.toLocaleDateString('vi-VN')
}
</script>

<style scoped>
.chat-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #ffffff;
    border-right: 1px solid rgba(0, 0, 0, 0.1);
}

.chat-sidebar__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.chat-sidebar__header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #050505;
}

.chat-sidebar__new-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: #e4e6eb;
    color: #050505;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s ease;
}

.chat-sidebar__new-btn:hover {
    background: #d0d2d6;
}

.chat-sidebar__search {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.chat-sidebar__search i {
    color: #65676b;
}

.chat-sidebar__search input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 0.9375rem;
    color: #050505;
}

.chat-sidebar__search input::placeholder {
    color: #65676b;
}

.chat-sidebar__filters {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.chat-sidebar__filter {
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 500;
    color: #65676b;
    cursor: pointer;
    transition: all 0.15s ease;
}

.chat-sidebar__filter:hover {
    background: #f0f2f5;
}

.chat-sidebar__filter--active {
    background: #1877f2;
    color: #ffffff;
}

.chat-sidebar__list {
    flex: 1;
    overflow-y: auto;
}

.chat-sidebar__item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    cursor: pointer;
    transition: background 0.15s ease;
}

.chat-sidebar__item:hover {
    background: #f0f2f5;
}

.chat-sidebar__item--active {
    background: #e7f3ff;
}

.chat-sidebar__avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #e4e6eb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: #050505;
    flex-shrink: 0;
    overflow: hidden;
}

.chat-sidebar__avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.chat-sidebar__content {
    flex: 1;
    min-width: 0;
}

.chat-sidebar__name {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #050505;
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.chat-sidebar__preview {
    font-size: 0.8125rem;
    color: #65676b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.chat-sidebar__meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
    flex-shrink: 0;
}

.chat-sidebar__time {
    font-size: 0.75rem;
    color: #65676b;
}

.chat-sidebar__badge {
    min-width: 20px;
    height: 20px;
    padding: 0 0.375rem;
    border-radius: 10px;
    background: #1877f2;
    color: #ffffff;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
