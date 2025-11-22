<template>
    <div class="message-bubble" :class="messageClass">
        <div class="message-bubble__content">
            <div v-if="message.content" class="message-bubble__text">{{ message.content }}</div>
            <div v-if="message.attachments?.length" class="message-bubble__attachments">
                <div
                    v-for="attachment in message.attachments"
                    :key="attachment.id"
                    class="message-bubble__attachment"
                >
                    <img v-if="attachment.mimeType?.startsWith('image/')" :src="attachment.storedUrl" :alt="attachment.originalName" />
                    <div v-else class="message-bubble__file">
                        <i class="bi bi-file-earmark"></i>
                        <span>{{ attachment.originalName }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="message-bubble__time">{{ formatTime(message.createdAt) }}</div>
    </div>
</template>

<script setup>
const props = defineProps({
    message: {
        type: Object,
        required: true
    },
    currentUserId: {
        type: [String, Number],
        required: true
    }
})

const messageClass = computed(() => {
    return {
        'message-bubble--own': props.message.senderId === props.currentUserId,
        'message-bubble--other': props.message.senderId !== props.currentUserId
    }
})

const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<script>
import { computed } from 'vue'
</script>

<style scoped>
.message-bubble {
    max-width: 65%;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.message-bubble--own {
    align-self: flex-end;
}

.message-bubble--other {
    align-self: flex-start;
}

.message-bubble__content {
    padding: 0.5rem 0.75rem;
    border-radius: 18px;
    word-wrap: break-word;
}

.message-bubble--own .message-bubble__content {
    background: #1877f2;
    color: #ffffff;
    border-bottom-right-radius: 4px;
}

.message-bubble--other .message-bubble__content {
    background: #e4e6eb;
    color: #050505;
    border-bottom-left-radius: 4px;
}

.message-bubble__text {
    font-size: 0.9375rem;
    line-height: 1.4;
}

.message-bubble__attachments {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.message-bubble__attachment img {
    max-width: 200px;
    border-radius: 8px;
}

.message-bubble__file {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 8px;
}

.message-bubble__time {
    font-size: 0.75rem;
    color: #65676b;
    padding: 0 0.5rem;
    align-self: flex-end;
}
</style>

