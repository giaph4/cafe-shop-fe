<template>
    <div class="chat-status-toast" :class="statusClass">
        <i :class="statusIcon"></i>
        <span>{{ statusText }}</span>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    status: {
        type: String,
        default: 'connected',
        validator: (value) => ['connected', 'connecting', 'disconnected', 'error'].includes(value)
    }
})

const statusIcon = computed(() => {
    switch (props.status) {
        case 'connecting':
            return 'bi bi-arrow-repeat'
        case 'disconnected':
            return 'bi bi-wifi-off'
        case 'error':
            return 'bi bi-exclamation-triangle'
        default:
            return 'bi bi-check-circle'
    }
})

const statusText = computed(() => {
    switch (props.status) {
        case 'connecting':
            return 'Đang kết nối lại...'
        case 'disconnected':
            return 'Đã mất kết nối realtime'
        case 'error':
            return 'Realtime gặp sự cố'
        default:
            return 'Đã kết nối realtime'
    }
})

const statusClass = computed(() => `chat-status-toast--${props.status}`)
</script>

<style scoped>
.chat-status-toast {
    position: fixed;
    bottom: 18px;
    right: 24px;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 1rem;
    border-radius: 999px;
    box-shadow: 0 12px 40px rgba(15, 23, 42, 0.18);
    font-weight: 600;
    background: rgba(255, 255, 255, 0.95);
    color: #1e293b;
}

.chat-status-toast i {
    font-size: 1.1rem;
}

.chat-status-toast--connecting {
    background: rgba(250, 204, 21, 0.18);
    color: #92400e;
}

.chat-status-toast--disconnected {
    background: rgba(248, 113, 113, 0.18);
    color: #b91c1c;
}

.chat-status-toast--error {
    background: rgba(248, 113, 113, 0.24);
    color: #991b1b;
}

.chat-status-toast--connected {
    background: rgba(34, 197, 94, 0.18);
    color: #166534;
}

@media (prefers-color-scheme: dark) {
    .chat-status-toast {
        background: rgba(15, 23, 42, 0.92);
        color: rgba(226, 232, 240, 0.96);
    }

    .chat-status-toast--connected {
        background: rgba(34, 197, 94, 0.22);
        color: rgba(167, 243, 208, 0.95);
    }

    .chat-status-toast--connecting {
        background: rgba(250, 204, 21, 0.22);
        color: rgba(253, 224, 71, 0.95);
    }

    .chat-status-toast--disconnected,
    .chat-status-toast--error {
        background: rgba(248, 113, 113, 0.24);
        color: rgba(254, 226, 226, 0.95);
    }
}
</style>
