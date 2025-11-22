<template>
    <aside class="chat-details">
        <template v-if="conversation">
            <header class="chat-details__header">
                <div class="chat-details__user">
                    <div class="chat-details__avatar">
                        <img v-if="conversation.avatarUrl" :src="conversation.avatarUrl" :alt="conversation.name" />
                        <span v-else>{{ getInitials(conversation.name) }}</span>
                    </div>
                    <div class="chat-details__info">
                        <div class="chat-details__name">{{ conversation.name }}</div>
                        <div class="chat-details__status">Đang trực tuyến</div>
                    </div>
                </div>
            </header>

            <div class="chat-details__encryption">
                <i class="bi bi-lock-fill"></i>
                <span>Được mã hóa đầu cuối</span>
            </div>

            <div class="chat-details__quick-actions">
                <button type="button" class="chat-details__quick-action">
                    <i class="bi bi-person-circle"></i>
                    <span>Trang cá nhân</span>
                </button>
                <button type="button" class="chat-details__quick-action">
                    <i class="bi bi-bell-slash"></i>
                    <span>Tắt thông báo</span>
                </button>
                <button type="button" class="chat-details__quick-action">
                    <i class="bi bi-search"></i>
                    <span>Tìm kiếm</span>
                </button>
            </div>

            <section class="chat-details__section">
                <ul class="chat-details__list">
                    <li>
                        <button type="button" class="chat-details__list-item">
                            <i class="bi bi-info-circle"></i>
                            <span>Thông tin về đoạn chat</span>
                            <i class="bi bi-chevron-down"></i>
                        </button>
                    </li>
                    <li>
                        <button type="button" class="chat-details__list-item">
                            <i class="bi bi-palette"></i>
                            <span>Tùy chỉnh đoạn chat</span>
                            <i class="bi bi-chevron-down"></i>
                        </button>
                    </li>
                    <li>
                        <button type="button" class="chat-details__list-item">
                            <i class="bi bi-images"></i>
                            <span>File phương tiện & file</span>
                            <i class="bi bi-chevron-down"></i>
                        </button>
                    </li>
                    <li>
                        <button type="button" class="chat-details__list-item">
                            <i class="bi bi-shield-lock"></i>
                            <span>Quyền riêng tư và hỗ trợ</span>
                            <i class="bi bi-chevron-down"></i>
                        </button>
                    </li>
                </ul>
            </section>

            <section class="chat-details__section">
                <header class="chat-details__section-heading">
                    Thành viên
                    <span class="chat-details__badge">{{ conversation.participants?.length || 0 }}</span>
                </header>
                <ul class="chat-details__members">
                    <li
                        v-for="participant in conversation.participants"
                        :key="participant.userId"
                        class="chat-details__member"
                    >
                        <div class="chat-details__member-avatar">
                            <img v-if="participant.avatarUrl" :src="participant.avatarUrl" :alt="participant.fullName" />
                            <span v-else>{{ getInitials(participant.fullName) }}</span>
                        </div>
                        <div class="chat-details__member-info">
                            <strong>{{ participant.fullName }}</strong>
                            <small>{{ getRoleLabel(participant.role) }}</small>
                        </div>
                    </li>
                </ul>
            </section>
        </template>
        <div v-else class="chat-details__empty">
            <i class="bi bi-info-circle"></i>
            <p>Chọn cuộc trò chuyện để xem thông tin chi tiết.</p>
        </div>
    </aside>
</template>

<script setup>
const props = defineProps({
    conversation: {
        type: Object,
        default: null
    },
    currentUserId: {
        type: [String, Number],
        required: true
    }
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

const getRoleLabel = (role) => {
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
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #ffffff;
    border-left: 1px solid rgba(0, 0, 0, 0.1);
    overflow-y: auto;
}

.chat-details__header {
    padding: 1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.chat-details__user {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.chat-details__avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #e4e6eb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: #050505;
    overflow: hidden;
    flex-shrink: 0;
}

.chat-details__avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.chat-details__name {
    font-size: 1.0625rem;
    font-weight: 600;
    color: #050505;
}

.chat-details__status {
    font-size: 0.8125rem;
    color: #65676b;
    margin-top: 0.25rem;
}

.chat-details__encryption {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    color: #65676b;
    font-size: 0.8125rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.chat-details__encryption i {
    color: #1877f2;
}

.chat-details__quick-actions {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    padding: 1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.chat-details__quick-action {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 0.5rem;
    border: none;
    background: transparent;
    border-radius: 8px;
    color: #050505;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s ease;
}

.chat-details__quick-action:hover {
    background: #f0f2f5;
}

.chat-details__quick-action i {
    font-size: 1.5rem;
    color: #1877f2;
}

.chat-details__section {
    padding: 1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.chat-details__section-heading {
    font-size: 0.8125rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #65676b;
    font-weight: 600;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.chat-details__badge {
    padding: 0.125rem 0.5rem;
    border-radius: 10px;
    background: #e4e6eb;
    color: #050505;
    font-size: 0.75rem;
    font-weight: 600;
}

.chat-details__list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.chat-details__list-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border: none;
    background: transparent;
    border-radius: 8px;
    color: #050505;
    font-size: 0.9375rem;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s ease;
}

.chat-details__list-item:hover {
    background: #f0f2f5;
}

.chat-details__list-item i:first-child {
    color: #65676b;
}

.chat-details__list-item i:last-child {
    margin-left: auto;
    color: #65676b;
    font-size: 0.875rem;
}

.chat-details__members {
    list-style: none;
    padding: 0;
    margin: 0;
}

.chat-details__member {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    border-radius: 8px;
    transition: background 0.15s ease;
}

.chat-details__member:hover {
    background: #f0f2f5;
}

.chat-details__member-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #e4e6eb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: #050505;
    overflow: hidden;
    flex-shrink: 0;
    font-size: 0.9rem;
}

.chat-details__member-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.chat-details__member-info {
    flex: 1;
    min-width: 0;
}

.chat-details__member-info strong {
    display: block;
    font-size: 0.9375rem;
    font-weight: 600;
    color: #050505;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.chat-details__member-info small {
    font-size: 0.8125rem;
    color: #65676b;
}

.chat-details__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 3rem 1.5rem;
    color: #65676b;
}

.chat-details__empty i {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #bcc0c4;
}

.chat-details__empty p {
    font-size: 0.9375rem;
    margin: 0;
}
</style>

