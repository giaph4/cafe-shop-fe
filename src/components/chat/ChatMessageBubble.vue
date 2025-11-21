<template>
    <div
        class="chat-message"
        :class="{
            'chat-message--self': isSelf,
            'chat-message--failed': message.status === 'failed' || message.status === 'error'
        }"
    >
        <div class="chat-message__avatar" v-if="!isSelf">
            <img v-if="message.senderAvatar" :src="message.senderAvatar" :alt="message.senderName" />
            <span v-else>{{ initials }}</span>
        </div>

        <div class="chat-message__body">
            <div class="chat-message__header" v-if="showHeader">
                <strong>{{ message.senderName }}</strong>
                <small>{{ formattedCreatedAt }}</small>
            </div>

            <div class="chat-message__bubble">
                <template v-if="message.status === 'RECALLED'">
                    <i class="bi bi-slash-circle chat-message__recalled-icon"></i>
                    <span>Tin nhắn đã được thu hồi</span>
                </template>
                <template v-else>
                    <p v-if="message.content" v-html="sanitizedContent"></p>
                    <div v-if="message.attachments?.length" class="chat-message__attachments">
                        <slot name="attachments" :attachments="message.attachments"></slot>
                    </div>
                    <div v-if="message.status === 'sending'" class="chat-message__progress">
                        <div class="chat-message__progress-track">
                            <div class="chat-message__progress-bar" :style="{ width: `${uploadProgress}%` }"></div>
                        </div>
                    </div>
                    <div v-if="message.status === 'failed' && message.error" class="chat-message__error">
                        <i class="bi bi-exclamation-triangle"></i>
                        <span>{{ message.error }}</span>
                        <button type="button" class="chat-message__retry" @click="$emit('retry', message)">Gửi lại</button>
                    </div>
                </template>
            </div>

            <div class="chat-message__meta">
                <slot name="meta">
                    <small v-if="seenBy?.length && isSelf" class="chat-message__status">
                        Đã xem bởi {{ seenBy.join(', ') }}
                    </small>
                </slot>
                <button
                    v-if="canRecall"
                    type="button"
                    class="chat-message__recall"
                    @click="emitRecall"
                >
                    <i class="bi bi-arrow-counterclockwise"></i>
                    Thu hồi
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import DOMPurify from 'dompurify'

const props = defineProps({
    message: { type: Object, required: true },
    currentUserId: { type: Number, default: null },
    seenBy: { type: Array, default: () => [] },
    showHeader: { type: Boolean, default: false }
})

const emit = defineEmits(['retry', 'recall'])

const isSelf = computed(() => props.message?.senderId === props.currentUserId)

const initials = computed(() => {
    if (!props.message?.senderName) return 'U'
    return props.message.senderName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase()
})

const uploadProgress = computed(() => props.message?.progress ?? 30)

const sanitizedContent = computed(() => DOMPurify.sanitize(props.message?.content || ''))

const formattedCreatedAt = computed(() => {
    if (!props.message?.createdAt) return ''
    const date = new Date(props.message.createdAt)
    return `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
})

const canRecall = computed(() => isSelf.value && props.message?.status !== 'RECALLED' && Number.isFinite(props.message?.id))

const emitRecall = () => {
    if (!canRecall.value) return
    emit('recall', props.message)
}
</script>

<style scoped>
.chat-message {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.chat-message--self {
    flex-direction: row-reverse;
}

.chat-message__avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(14, 165, 233, 0.3));
    color: #1e293b;
    display: grid;
    place-items: center;
    font-weight: 600;
    overflow: hidden;
}

.chat-message__avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.chat-message__body {
    max-width: min(70%, 540px);
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.chat-message__header {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
    color: #475569;
    font-size: 0.85rem;
}

.chat-message__bubble {
    background: rgba(59, 130, 246, 0.1);
    border-radius: 16px 16px 16px 4px;
    padding: 0.75rem 1rem;
    color: #0f172a;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
    position: relative;
    overflow-wrap: anywhere;
    font-size: 0.95rem;
}

.chat-message--self .chat-message__bubble {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.8), rgba(59, 130, 246, 0.8));
    color: #f8fafc;
    border-radius: 16px 16px 4px 16px;
}

.chat-message__bubble p {
    margin-bottom: 0;
}

.chat-message__attachments {
    margin-top: 0.65rem;
    display: grid;
    gap: 0.5rem;
}

.chat-message__progress {
    margin-top: 0.5rem;
}

.chat-message__progress-track {
    height: 4px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.35);
    overflow: hidden;
}

.chat-message__progress-bar {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(135deg, #2563eb, #4f46e5);
    transition: width 0.2s ease;
}

.chat-message__meta {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    font-size: 0.75rem;
    gap: 0.35rem;
}

.chat-message__status {
    color: rgba(71, 85, 105, 0.65);
}

.chat-message__recall,
.chat-message__retry {
    border: none;
    background: transparent;
    font-size: 0.78rem;
    font-weight: 600;
    color: rgba(37, 99, 235, 0.85);
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0;
    transition: color 0.18s ease;
}

.chat-message__recall:hover,
.chat-message__retry:hover {
    color: #2563eb;
}

.chat-message__recalled-icon {
    margin-right: 0.4rem;
    color: #facc15;
}

.chat-message--failed .chat-message__bubble {
    background: rgba(248, 113, 113, 0.12);
    border: 1px dashed rgba(248, 113, 113, 0.6);
    color: #b91c1c;
}

.chat-message__error {
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
}

:global([data-bs-theme='dark']) .chat-message__header {
    color: rgba(203, 213, 225, 0.75);
}

:global([data-bs-theme='dark']) .chat-message__bubble {
    background: rgba(30, 41, 59, 0.75);
    color: rgba(226, 232, 240, 0.96);
    box-shadow: inset 0 1px 0 rgba(148, 163, 184, 0.25);
}

:global([data-bs-theme='dark']) .chat-message--self .chat-message__bubble {
    background: linear-gradient(135deg, rgba(129, 140, 248, 0.92), rgba(96, 165, 250, 0.92));
}

:global([data-bs-theme='dark']) .chat-message--failed .chat-message__bubble {
    background: rgba(239, 68, 68, 0.16);
    border-color: rgba(248, 113, 113, 0.45);
    color: rgba(254, 226, 226, 0.95);
}
</style>
