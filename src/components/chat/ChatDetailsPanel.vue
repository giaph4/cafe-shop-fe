<template>
    <aside class="chat-details" :class="panelClass" v-if="conversation">
        <header class="chat-details__header">
            <div class="chat-details__main">
                <div class="chat-details__avatar" :class="{ 'chat-details__avatar--group': isGroupConversation }">
                    <img v-if="conversationAvatar" :src="conversationAvatar" :alt="conversationTitle" />
                    <span v-else>{{ conversationInitials }}</span>
                </div>
                <div class="chat-details__titles">
                    <h4>{{ conversationTitle }}</h4>
                    <div class="chat-details__status" :data-status="socketStatus">
                        <span class="chat-details__status-dot"></span>
                        <span>{{ socketLabel }}</span>
                    </div>
                </div>
            </div>
            <div class="chat-details__actions">
                <button type="button" class="chat-details__icon-button" :disabled="!conversation">
                    <i class="bi bi-telephone"></i>
                </button>
                <button type="button" class="chat-details__icon-button" :disabled="!conversation">
                    <i class="bi bi-camera-video"></i>
                </button>
                <button type="button" class="chat-details__icon-button" :disabled="!conversation">
                    <i class="bi bi-three-dots"></i>
                </button>
            </div>
        </header>

        <section class="chat-details__section" :class="sectionClass">
            <header class="chat-details__section-heading">Tùy chọn</header>
            <ul class="chat-details__list">
                <li>
                    <button type="button" class="chat-details__list-item">
                        <i class="bi bi-bell"></i>
                        <div>
                            <strong>Tắt thông báo</strong>
                            <small>Không làm phiền cuộc trò chuyện này</small>
                        </div>
                        <i class="bi bi-chevron-right"></i>
                    </button>
                </li>
                <li>
                    <button type="button" class="chat-details__list-item">
                        <i class="bi bi-search"></i>
                        <div>
                            <strong>Tìm trong cuộc trò chuyện</strong>
                            <small>Tìm kiếm tin nhắn hoặc file</small>
                        </div>
                        <i class="bi bi-chevron-right"></i>
                    </button>
                </li>
            </ul>
        </section>

        <section class="chat-details__section" :class="sectionClass">
            <header class="chat-details__section-heading">
                Thành viên
                <span class="chat-details__badge">{{ members.length }}</span>
            </header>
            <div v-if="membersLoading" class="chat-details__members chat-details__members--loading">
                <div v-for="i in 4" :key="`detail-member-${i}`" class="chat-details__member-skeleton shimmer"></div>
            </div>
            <ul v-else class="chat-details__members">
                <li v-for="member in members" :key="member.userId" class="chat-details__member">
                    <div class="chat-details__member-avatar">
                        <img v-if="member.avatarUrl" :src="member.avatarUrl" :alt="member.fullName" />
                        <span v-else>{{ initials(member.fullName) }}</span>
                    </div>
                    <div class="chat-details__member-info">
                        <strong>{{ member.fullName }}</strong>
                        <small>{{ roleLabel(member.role) }}</small>
                    </div>
                    <button type="button" class="chat-details__icon-button chat-details__icon-button--ghost">
                        <i class="bi bi-chat-dots"></i>
                    </button>
                </li>
            </ul>
        </section>

        <section class="chat-details__section" :class="sectionClass">
            <header class="chat-details__section-heading">File phương tiện</header>
            <div class="chat-details__media" v-if="recentFiles.length">
                <button v-for="file in recentFiles" :key="file.id" type="button" class="chat-details__media-item">
                    <i class="bi bi-file-earmark"></i>
                    <span>{{ file.name }}</span>
                </button>
            </div>
            <div class="chat-details__empty" v-else>
                <i class="bi bi-images"></i>
                <p>Chưa có file nào được chia sẻ.</p>
            </div>
        </section>
    </aside>
    <aside v-else class="chat-details chat-details--empty" :class="panelClass">
        <div class="chat-details__empty">
            <i class="bi bi-info-circle"></i>
            <p>Chọn cuộc trò chuyện để xem thông tin chi tiết.</p>
        </div>
    </aside>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    conversation: { type: Object, default: null },
    members: { type: Array, default: () => [] },
    membersLoading: { type: Boolean, default: false },
    currentUserId: { type: Number, default: null },
    socketStatus: { type: String, default: 'disconnected' },
    socketLabel: { type: String, default: '' },
    socketIcon: { type: String, default: '' },
    lastMessage: { type: Object, default: null },
    layout: { type: String, default: 'slack' }
})

const layoutVariant = computed(() => (props.layout || 'slack').toLowerCase())
const panelClass = computed(() => `chat-details--${layoutVariant.value}`)
const sectionClass = computed(() => ({
    'chat-details__section--bordered': layoutVariant.value === 'slack',
    'chat-details__section--minimal': layoutVariant.value === 'minimal',
    'chat-details__section--cards': layoutVariant.value === 'whatsapp'
}))

const isGroupConversation = computed(() => props.conversation?.type === 'GROUP')

const conversationTitle = computed(() => props.conversation?.title || 'Hội thoại')

const conversationAvatar = computed(() => {
    if (props.conversation?.avatarUrl) return props.conversation.avatarUrl
    const other = props.conversation?.participants?.find((item) => item.userId !== props.currentUserId)
    return other?.avatarUrl || null
})

const conversationInitials = computed(() => initials(conversationTitle.value))

const recentFiles = computed(() => {
    if (!props.conversation?.recentFiles) return []
    return props.conversation.recentFiles.slice(0, 6)
})

const initials = (value) => {
    if (!value) return 'NV'
    return value
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0])
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
</script>

<style scoped>
.chat-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 1.25rem 1.5rem;
    gap: 1.5rem;
    color: inherit;
}

.chat-details--empty {
    align-items: center;
    justify-content: center;
}

.chat-details--minimal {
    padding: 1rem 1.1rem;
    gap: 1.1rem;
    background: rgba(148, 163, 184, 0.08);
    border-radius: 18px;
}

.chat-details--whatsapp {
    background: rgba(255, 255, 255, 0.82);
    border-radius: 18px;
    box-shadow: 0 8px 32px rgba(17, 27, 33, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.04);
}

.chat-details__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.chat-details__main {
    display: flex;
    align-items: center;
    gap: 0.85rem;
}

.chat-details__avatar {
    width: 56px;
    height: 56px;
    border-radius: 20px;
    background: linear-gradient(145deg, rgba(24, 119, 242, 0.18), rgba(9, 132, 227, 0.18));
    display: grid;
    place-items: center;
    font-weight: 700;
    color: #0f172a;
    overflow: hidden;
    text-transform: uppercase;
}

.chat-details__avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.chat-details__avatar--group {
    border-radius: 18px;
}

.chat-details__titles {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.chat-details__titles h4 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
}

.chat-details__status {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    color: var(--shell-text-secondary, #4b5563);
}

.chat-details--whatsapp .chat-details__status {
    color: rgba(17, 27, 33, 0.72);
}

.chat-details__status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--shell-accent, #006aff);
    box-shadow: 0 0 0 4px rgba(0, 106, 255, 0.12);
}

.chat-details__status[data-status='disconnected'] .chat-details__status-dot,
.chat-details__status[data-status='error'] .chat-details__status-dot {
    background: #ef4444;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.12);
}

.chat-details__status[data-status='connecting'] .chat-details__status-dot {
    background: #f59e0b;
    box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.16);
}

.chat-details__actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.chat-details--minimal .chat-details__actions {
    display: none;
}

.chat-details__icon-button {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    border: none;
    background: rgba(15, 23, 42, 0.06);
    color: inherit;
    display: grid;
    place-items: center;
    transition: background 0.18s ease, transform 0.18s ease;
}

.chat-details__icon-button:hover {
    background: rgba(24, 119, 242, 0.12);
    transform: translateY(-1px);
}

.chat-details__icon-button:disabled {
    opacity: 0.5;
    pointer-events: none;
}

.chat-details__icon-button--ghost {
    background: transparent;
}

.chat-details__section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.chat-details__section--bordered {
    padding: 1rem;
    border-radius: 16px;
    background: rgba(148, 163, 184, 0.08);
}

.chat-details__section--minimal {
    gap: 0.75rem;
}

.chat-details__section--cards {
    padding: 1rem;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.72);
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.04);
}

.chat-details__section-heading {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--shell-text-secondary, #4b5563);
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.chat-details__badge {
    background: rgba(24, 119, 242, 0.12);
    color: var(--shell-accent, #006aff);
    border-radius: 999px;
    padding: 0.1rem 0.45rem;
    font-size: 0.7rem;
    font-weight: 600;
}

.chat-details__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.75rem;
}

.chat-details__list-item {
    width: 100%;
    border: none;
    background: rgba(15, 23, 42, 0.04);
    border-radius: 14px;
    padding: 0.7rem 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: inherit;
    transition: background 0.18s ease, transform 0.18s ease;
}

.chat-details__list-item:hover {
    background: rgba(24, 119, 242, 0.12);
    transform: translateY(-1px);
}

.chat-details__list-item i:last-child {
    margin-left: auto;
    color: rgba(15, 23, 42, 0.2);
}

.chat-details__list-item strong {
    display: block;
    font-size: 0.95rem;
}

.chat-details__list-item small {
    color: var(--shell-text-secondary, #4b5563);
    font-size: 0.75rem;
}

.chat-details__members {
    display: grid;
    gap: 0.75rem;
    list-style: none;
    margin: 0;
    padding: 0;
}

.chat-details__member {
    display: flex;
    align-items: center;
    gap: 0.65rem;
}

.chat-details__member-avatar {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    background: rgba(24, 119, 242, 0.16);
    display: grid;
    place-items: center;
    font-weight: 600;
    color: var(--shell-accent, #006aff);
    overflow: hidden;
}

.chat-details__member-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.chat-details__member-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
}

.chat-details__member-info strong {
    font-size: 0.92rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.chat-details__member-info small {
    font-size: 0.75rem;
    color: var(--shell-text-secondary, #4b5563);
}

.chat-details__members--loading {
    grid-template-columns: 1fr;
}

.chat-details__member-skeleton {
    height: 52px;
    border-radius: 16px;
    background: linear-gradient(90deg, rgba(229, 231, 235, 0.5) 25%, rgba(229, 231, 235, 0.3) 50%, rgba(229, 231, 235, 0.5) 75%);
    background-size: 200% 100%;
}

.chat-details__media {
    display: grid;
    gap: 0.65rem;
}

.chat-details__media-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(15, 23, 42, 0.05);
    border-radius: 12px;
    padding: 0.6rem 0.75rem;
    border: none;
    color: inherit;
    transition: background 0.18s ease, transform 0.18s ease;
}

.chat-details--whatsapp .chat-details__media-item {
    background: rgba(17, 27, 33, 0.08);
}

.chat-details__media-item:hover {
    background: rgba(24, 119, 242, 0.12);
    transform: translateY(-1px);
}

.chat-details--whatsapp .chat-details__media-item:hover {
    background: rgba(0, 168, 132, 0.15);
}

.chat-details__empty {
    text-align: center;
    display: grid;
    gap: 0.5rem;
    color: var(--shell-text-secondary, #4b5563);
    display: grid;
    place-items: center;
    gap: 0.5rem;
}

.chat-details__empty i {
    font-size: 2rem;
    color: var(--shell-accent, #006aff);
}

.shimmer {
    animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}

:global([data-bs-theme='dark']) .chat-details {
    background: transparent;
}

:global([data-bs-theme='dark']) .chat-details__icon-button {
    background: rgba(255, 255, 255, 0.08);
}

:global([data-bs-theme='dark']) .chat-details--whatsapp {
    background: rgba(17, 27, 33, 0.9);
    border-color: rgba(0, 0, 0, 0.35);
}

:global([data-bs-theme='dark']) .chat-details__section--bordered {
    background: rgba(15, 23, 42, 0.58);
}

:global([data-bs-theme='dark']) .chat-details__section--cards {
    background: rgba(17, 27, 33, 0.8);
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.35);
}

:global([data-bs-theme='dark']) .chat-details__list-item {
    background: rgba(30, 41, 59, 0.55);
}

:global([data-bs-theme='dark']) .chat-details__list-item i:last-child {
    color: rgba(226, 232, 240, 0.16);
}

:global([data-bs-theme='dark']) .chat-details__member-avatar {
    background: rgba(35, 116, 225, 0.24);
    color: #fff;
}

:global([data-bs-theme='dark']) .chat-details__media-item {
    background: rgba(255, 255, 255, 0.04);
}

:global([data-bs-theme='dark']) .chat-details__media-item:hover,
:global([data-bs-theme='dark']) .chat-details__list-item:hover {
    background: rgba(35, 116, 225, 0.18);
}

:global([data-bs-theme='dark']) .chat-details__empty {
    color: rgba(176, 179, 184, 0.9);
}
</style>
