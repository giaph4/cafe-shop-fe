<template>
    <aside class="chat-sidebar" :class="layoutClass">
        <header class="chat-sidebar__header" :class="headerClass">
            <div class="chat-sidebar__title">
                <span class="chat-sidebar__title-icon">
                    <i class="bi bi-chat-square-text"></i>
                </span>
                <div>
                    <h2>Tin nhắn</h2>
                    <small>Quản lý mọi cuộc trò chuyện</small>
                </div>
            </div>
            <button type="button" class="chat-sidebar__new" @click="$emit('create-conversation')">
                <i class="bi bi-pencil-square"></i>
                <span>Tạo mới</span>
            </button>
        </header>

        <label class="chat-sidebar__search" :class="searchClass" @focusin="ensureDirectory">
            <i class="bi bi-search"></i>
            <input
                type="search"
                v-model="search"
                :placeholder="searchPlaceholder"
                @focus="ensureDirectory"
            />
        </label>

        <div class="chat-sidebar__body" :class="bodyClass">
            <section class="chat-sidebar__section chat-sidebar__section--list">
                <div class="chat-sidebar__scroll" ref="scrollContainer" @scroll="handleScroll">
                    <div v-if="isLoading" class="chat-sidebar__skeletons">
                        <div v-for="i in 6" :key="i" class="chat-sidebar__skeleton shimmer"></div>
                    </div>
                    <div v-else-if="!filteredConversations.length" class="chat-sidebar__empty">
                        <span class="chat-sidebar__empty-icon">
                            <i class="bi bi-chat-square-dots"></i>
                        </span>
                        <p>Chưa có hội thoại nào</p>
                        <small>Nhấn “Tạo mới” để bắt đầu trao đổi.</small>
                    </div>
                    <ul v-else class="chat-sidebar__list">
                        <li v-for="conversation in filteredConversations" :key="conversation.id">
                            <ChatConversationItem
                                :conversation="conversation"
                                :current-user-id="currentUserId"
                                :is-active="conversation.id === activeConversationId"
                                @select="$emit('select', $event)"
                                @toggle-pin="emitTogglePin"
                            />
                        </li>
                    </ul>
                    <footer v-if="hasMore && !isLoading" class="chat-sidebar__load-more">
                        <button type="button" class="chat-sidebar__load-more-button" @click="$emit('load-more')">
                            <i class="bi bi-arrow-down-circle"></i>
                            <span>Tải thêm</span>
                        </button>
                    </footer>
                </div>
            </section>
        </div>
    </aside>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import ChatConversationItem from './ChatConversationItem.vue'

const props = defineProps({
    conversations: { type: Array, default: () => [] },
    isLoading: { type: Boolean, default: false },
    hasMore: { type: Boolean, default: false },
    activeConversationId: { type: Number, default: null },
    currentUserId: { type: Number, default: null },
    directory: {
        type: Object,
        default: () => ({ users: [], loading: false, error: null })
    },
    layout: { type: String, default: 'slack' }
})

const emit = defineEmits(['select', 'load-more', 'create-conversation', 'toggle-pin', 'search', 'start-direct'])

const search = ref('')
const scrollContainer = ref(null)

const layoutClass = computed(() => `chat-sidebar--${props.layout || 'slack'}`)
const headerClass = computed(() => ({
    'chat-sidebar__header--compact': props.layout === 'minimal',
    'chat-sidebar__header--accent': props.layout === 'whatsapp'
}))
const searchClass = computed(() => ({
    'chat-sidebar__search--pill': props.layout !== 'minimal',
    'chat-sidebar__search--underline': props.layout === 'minimal'
}))
const bodyClass = computed(() => ({
    'chat-sidebar__body--spacious': props.layout === 'slack',
    'chat-sidebar__body--compact': props.layout === 'minimal',
    'chat-sidebar__body--cards': props.layout === 'whatsapp'
}))

const searchPlaceholder = computed(() => {
    switch (props.layout) {
        case 'minimal':
            return 'Tìm hội thoại hoặc người dùng'
        case 'whatsapp':
            return 'Tìm kiếm hoặc bắt đầu trò chuyện mới'
        default:
            return 'Tìm kiếm trên Messenger'
    }
})

const filteredConversations = computed(() => {
    if (!search.value.trim()) return props.conversations
    const keyword = search.value.trim().toLowerCase()
    return props.conversations.filter((conversation) => {
        const title = conversation.title || ''
        const participantNames = (conversation.participants || [])
            .map((member) => member.fullName || member.username || '')
            .join(' ')
        return [title, participantNames].some((text) => text.toLowerCase().includes(keyword))
    })
})

const handleScroll = () => {
    if (!scrollContainer.value || props.isLoading || !props.hasMore) return
    const container = scrollContainer.value
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 40) {
        // near bottom
        emitLoadMore()
    }
}

const emitLoadMore = () => {
    if (!props.hasMore) return
    emit('load-more')
}

const emitTogglePin = (conversation) => {
    emit('toggle-pin', conversation)
}

const ensureDirectory = () => {
    emit('search', search.value)
}

watch(search, (value) => {
    emit('search', value)
})

const emitStartDirect = (user) => {
    emit('start-direct', user)
}

const directorySectionVisible = computed(() => search.value.length > 0 || props.directory.users.length > 0 || props.directory.loading)

const initialsOf = (name) => {
    if (!name) return 'NV'
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
}
</script>

<style scoped>
.chat-sidebar {
    --sidebar-bg: var(--shell-pane-bg, #ffffff);
    --sidebar-border: var(--shell-border, rgba(15, 23, 42, 0.06));
    --sidebar-accent: var(--shell-accent, #006aff);
    --sidebar-accent-soft: var(--shell-accent-soft, rgba(0, 106, 255, 0.12));
    --sidebar-text-primary: var(--shell-text-primary, #0f172a);
    --sidebar-text-secondary: var(--shell-text-secondary, #4b5563);

    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    width: 100%;
    background: var(--sidebar-bg);
    color: var(--sidebar-text-primary);
    padding: 1.5rem 1.4rem 1.75rem;
    gap: 1.25rem;
    border-right: 1px solid var(--sidebar-border);
    transition: background 0.24s ease;
}

.chat-sidebar--minimal {
    --sidebar-bg: transparent;
    --sidebar-border: transparent;
    padding: 1.1rem 0.75rem 1.1rem;
    gap: 0.9rem;
}

.chat-sidebar--whatsapp {
    --sidebar-bg: linear-gradient(180deg, rgba(240, 242, 245, 0.92) 0%, rgba(224, 228, 232, 0.92) 100%);
    --sidebar-border: rgba(0, 0, 0, 0.04);
    --sidebar-accent: #00a884;
    --sidebar-accent-soft: rgba(0, 168, 132, 0.18);
    padding: 1.6rem 1.35rem;
}

.chat-sidebar__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0 0.25rem;
}

.chat-sidebar__title {
    display: flex;
    align-items: center;
    gap: 0.85rem;
}

.chat-sidebar__title-icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: rgba(37, 99, 235, 0.12);
    color: var(--sidebar-accent);
}

.chat-sidebar__title h2 {
    font-size: 1.2rem;
    margin: 0;
    font-weight: 700;
}

.chat-sidebar__title small {
    display: block;
    color: var(--sidebar-text-secondary);
}

.chat-sidebar__header--compact h2 {
    font-size: 1.05rem;
}

.chat-sidebar__header--accent h2 {
    color: var(--sidebar-accent);
}

.chat-sidebar__new {
    background: linear-gradient(135deg, var(--sidebar-accent), #5b7bff);
    border: none;
    color: #fff;
    padding: 0.5rem 1.2rem;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.95rem;
    font-weight: 600;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
    box-shadow: 0 14px 26px rgba(37, 99, 235, 0.22);
}

.chat-sidebar__new:hover {
    transform: translateY(-1px);
    box-shadow: 0 18px 36px rgba(37, 99, 235, 0.3);
}

.chat-sidebar__search {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 0.75rem;
    border-radius: 18px;
    background: rgba(15, 23, 42, 0.04);
    border: 1px solid rgba(148, 163, 184, 0.12);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
}

.chat-sidebar__search input {
    border: none;
    background: transparent;
    flex: 1;
    padding: 0;
    font-size: 0.95rem;
    font-weight: 500;
    color: inherit;
    outline: none;
}

.chat-sidebar__search input::placeholder {
    color: rgba(71, 85, 105, 0.6);
}

.chat-sidebar__search--underline:focus-within {
    border-color: var(--sidebar-accent);
    box-shadow: 0 0 0 2px rgba(0, 106, 255, 0.12);
}

.chat-sidebar__body--spacious {
    background: rgba(15, 23, 42, 0.02);
    border-radius: 20px;
    padding: 0.9rem;
}

.chat-sidebar__body--cards {
    background: rgba(255, 255, 255, 0.92);
    border-radius: 22px;
    padding: 1rem;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
}

.chat-sidebar__list {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    list-style: none;
    margin: 0;
    padding: 0;
}

.chat-sidebar__section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-height: 0;
}

.chat-sidebar__scroll {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
}

.chat-sidebar__skeletons {
    display: grid;
    gap: 0.65rem;
}

.chat-sidebar__skeleton {
    height: 64px;
    border-radius: 18px;
}

.chat-sidebar__empty {
    text-align: center;
    padding: 3.2rem 1.5rem;
    color: var(--sidebar-text-secondary);
    display: grid;
    gap: 0.65rem;
    background: rgba(248, 249, 253, 0.7);
    border-radius: 22px;
    border: 1px dashed rgba(148, 163, 184, 0.35);
}

.chat-sidebar__empty-icon {
    width: 60px;
    height: 60px;
    border-radius: 20px;
    display: grid;
    place-items: center;
    margin: 0 auto 0.25rem;
    background: rgba(37, 99, 235, 0.12);
    color: var(--sidebar-accent);
    font-size: 1.75rem;
}

.chat-sidebar__directory-button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.55rem 0.65rem;
    border: none;
    border-radius: inherit;
    background: transparent;
    color: inherit;
    transition: background 0.2s ease, transform 0.2s ease;
}

.chat-sidebar__directory-button:hover {
    background: rgba(99, 102, 241, 0.08);
    transform: translateX(2px);
}

.chat-sidebar__directory-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    background: rgba(15, 23, 42, 0.08);
    display: grid;
    place-items: center;
}

.chat-sidebar__directory-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.chat-sidebar__directory-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
}

.chat-sidebar__directory-info strong {
    font-size: 0.88rem;
}

.chat-sidebar__directory-info small {
    color: var(--shell-text-secondary, rgba(71, 85, 105, 0.65));
    font-size: 0.75rem;
}

.chat-sidebar__directory-action {
    color: var(--shell-accent, #006aff);
    font-size: 1rem;
}

.chat-sidebar__directory-empty {
    padding: 0.65rem;
    text-align: center;
    font-size: 0.8rem;
    color: var(--shell-text-secondary, rgba(71, 85, 105, 0.7));
}

.chat-sidebar__load-more {
    display: flex;
    justify-content: center;
    margin-top: 0.5rem;
}

.chat-sidebar__load-more-button {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border: none;
    border-radius: 999px;
    padding: 0.5rem 1.1rem;
    background: rgba(37, 99, 235, 0.1);
    color: var(--sidebar-accent);
    font-weight: 600;
    transition: background 0.18s ease, transform 0.18s ease;
}

.chat-sidebar__load-more-button:hover {
    background: rgba(37, 99, 235, 0.18);
    transform: translateY(-1px);
}

.chat-sidebar__scroll::-webkit-scrollbar {
    width: 6px;
}

.chat-sidebar__scroll::-webkit-scrollbar-thumb {
    background-color: rgb(148, 163, 184, 0.45);
    border-radius: 999px;
}

:global([data-bs-theme='dark']) .chat-sidebar {
    background: rgba(15, 23, 42, 0.96);
    color: rgba(226, 232, 240, 0.95);
    --sidebar-text-secondary: rgba(148, 163, 184, 0.85);
    --sidebar-border: rgba(148, 163, 184, 0.18);
}

:global([data-bs-theme='dark']) .chat-sidebar--minimal {
    background: transparent;
}

:global([data-bs-theme='dark']) .chat-sidebar--whatsapp {
    background: linear-gradient(180deg, rgba(23, 39, 47, 0.95) 0%, rgba(15, 25, 32, 0.95) 100%);
    --sidebar-accent: #2f7f6f;
    --sidebar-accent-soft: rgba(47, 127, 111, 0.28);
}

:global([data-bs-theme='dark']) .chat-sidebar__new {
    background: rgba(255, 255, 255, 0.08);
}

:global([data-bs-theme='dark']) .chat-sidebar__badge {
    background: rgba(35, 116, 225, 0.22);
    color: rgba(199, 210, 254, 0.95);
}

:global([data-bs-theme='dark']) .chat-sidebar__skeleton,
:global([data-bs-theme='dark']) .chat-sidebar__directory-skeleton {
    background: linear-gradient(90deg, rgba(51, 65, 85, 0.55), rgba(51, 65, 85, 0.3), rgba(51, 65, 85, 0.55));
}

:global([data-bs-theme='dark']) .chat-sidebar--whatsapp .chat-sidebar__skeleton {
    background: linear-gradient(90deg, rgba(34, 53, 48, 0.55), rgba(34, 53, 48, 0.3), rgba(34, 53, 48, 0.55));
}

:global([data-bs-theme='dark']) .chat-sidebar__empty {
    color: rgba(148, 163, 184, 0.78);
}
:global([data-bs-theme='dark']) .chat-sidebar__directory-button:hover {
    background: rgba(35, 116, 225, 0.18);
}

:global([data-bs-theme='dark']) .chat-sidebar__directory-avatar {
    background: rgba(35, 116, 225, 0.28);
    color: rgba(226, 232, 240, 0.95);
}

:global([data-bs-theme='dark']) .chat-sidebar__directory-info small {
    color: rgba(189, 197, 209, 0.75);
}

:global([data-bs-theme='dark']) .chat-sidebar__directory-empty {
    color: rgba(176, 179, 184, 0.75);
}

:global([data-bs-theme='dark']) .chat-sidebar__load-more-button {
    background: rgba(35, 116, 225, 0.16);
    color: rgba(199, 210, 254, 0.95);
}

:global([data-bs-theme='dark']) .chat-sidebar__load-more-button:hover {
    background: rgba(35, 116, 225, 0.24);
}
</style>
