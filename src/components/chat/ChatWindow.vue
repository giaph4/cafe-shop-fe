<template>
    <div class="chat-window">
        <template v-if="conversation">
            <header class="chat-window__header">
                <div class="chat-window__user">
                    <div class="chat-window__avatar">
                        <img v-if="conversation.avatarUrl" :src="conversation.avatarUrl" :alt="conversation.name" />
                        <span v-else>{{ getInitials(conversation.name) }}</span>
                    </div>
                    <div class="chat-window__info">
                        <div class="chat-window__name">{{ conversation.name }}</div>
                        <div class="chat-window__status">Đang trực tuyến</div>
                    </div>
                </div>
                <div class="chat-window__actions">
                    <button type="button" class="chat-window__action-btn">
                        <i class="bi bi-search"></i>
                    </button>
                    <button type="button" class="chat-window__action-btn">
                        <i class="bi bi-telephone"></i>
                    </button>
                    <button type="button" class="chat-window__action-btn">
                        <i class="bi bi-camera-video"></i>
                    </button>
                    <button type="button" class="chat-window__action-btn">
                        <i class="bi bi-info-circle"></i>
                    </button>
                </div>
            </header>

            <div class="chat-window__banner">
                <i class="bi bi-lock-fill"></i>
                <span>Được mã hóa đầu cuối</span>
            </div>

            <div class="chat-window__messages" ref="messagesContainer">
                <div
                    v-for="message in messages"
                    :key="message.id"
                    class="chat-window__message"
                    :class="{ 'chat-window__message--own': message.senderId === currentUserId }"
                >
                    <ChatMessageBubble :message="message" :current-user-id="currentUserId" />
                </div>
            </div>

            <div class="chat-window__input">
                <button type="button" class="chat-window__input-btn">
                    <i class="bi bi-emoji-smile"></i>
                </button>
                <input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    v-model="inputText"
                    @keydown.enter="handleSend"
                />
                <button type="button" class="chat-window__input-btn">
                    <i class="bi bi-paperclip"></i>
                </button>
                <button
                    type="button"
                    class="chat-window__send-btn"
                    :disabled="!inputText.trim()"
                    @click="handleSend"
                >
                    <i class="bi bi-send-fill"></i>
                </button>
            </div>
        </template>
        <div v-else class="chat-window__empty">
            <i class="bi bi-chat-dots"></i>
            <h3>Chọn một cuộc trò chuyện để bắt đầu</h3>
            <p>Danh sách cuộc trò chuyện nằm bên trái, hãy chọn hoặc tạo cuộc trò chuyện mới.</p>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import ChatMessageBubble from './ChatMessageBubble.vue'

const props = defineProps({
    conversation: {
        type: Object,
        default: null
    },
    messages: {
        type: Array,
        default: () => []
    },
    currentUserId: {
        type: [String, Number],
        required: true
    }
})

const emit = defineEmits(['send'])

const inputText = ref('')
const messagesContainer = ref(null)

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

const handleSend = () => {
    if (!inputText.value.trim()) return
    emit('send', inputText.value.trim())
    inputText.value = ''
}

watch(() => props.messages.length, () => {
    nextTick(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
    })
}, { immediate: true })
</script>

<style scoped>
.chat-window {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #f0f2f5;
}

.chat-window__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: #ffffff;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.chat-window__user {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.chat-window__avatar {
    width: 40px;
    height: 40px;
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

.chat-window__avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.chat-window__name {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #050505;
}

.chat-window__status {
    font-size: 0.8125rem;
    color: #65676b;
}

.chat-window__actions {
    display: flex;
    gap: 0.5rem;
}

.chat-window__action-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: #65676b;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s ease;
}

.chat-window__action-btn:hover {
    background: #e4e6eb;
}

.chat-window__banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: #ffffff;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    font-size: 0.8125rem;
    color: #65676b;
}

.chat-window__banner i {
    color: #1877f2;
}

.chat-window__messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.chat-window__message {
    display: flex;
}

.chat-window__message--own {
    justify-content: flex-end;
}

.chat-window__input {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #ffffff;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.chat-window__input input {
    flex: 1;
    border: none;
    outline: none;
    padding: 0.5rem 1rem;
    background: #f0f2f5;
    border-radius: 20px;
    font-size: 0.9375rem;
    color: #050505;
}

.chat-window__input input::placeholder {
    color: #65676b;
}

.chat-window__input-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: #65676b;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s ease;
}

.chat-window__input-btn:hover {
    background: #e4e6eb;
}

.chat-window__send-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: #1877f2;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s ease;
}

.chat-window__send-btn:hover:not(:disabled) {
    background: #166fe5;
}

.chat-window__send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.chat-window__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 3rem;
    color: #65676b;
}

.chat-window__empty i {
    font-size: 4rem;
    margin-bottom: 1rem;
    color: #bcc0c4;
}

.chat-window__empty h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #050505;
    margin: 0 0 0.5rem 0;
}

.chat-window__empty p {
    font-size: 0.9375rem;
    margin: 0;
}
</style>

