<template>
    <div
        class="message-bubble"
        :class="{
            'message-bubble--own': isOwn,
            'message-bubble--recalled': message.status === 'RECALLED'
        }"
    >
        <div class="message-bubble__avatar" v-if="!isOwn && showAvatar">
            <img v-if="senderAvatar" :src="senderAvatar" :alt="senderName" />
            <div v-else class="message-bubble__avatar-placeholder">
                {{ senderInitials }}
            </div>
        </div>
        <div class="message-bubble__content">
            <div class="message-bubble__header" v-if="!isOwn && showAvatar">
                <span class="message-bubble__sender">{{ senderName }}</span>
            </div>
            <div class="message-bubble__body">
                <div v-if="message.status === 'RECALLED'" class="message-bubble__recalled">
                    <i class="bi bi-x-circle me-1"></i>
                    Tin nhắn đã được thu hồi
                </div>
                <div v-else-if="message.contentType === 'TEXT'" class="message-bubble__text">
                    {{ message.content }}
                </div>
                <div v-else-if="message.contentType === 'EMOJI'" class="message-bubble__emoji">
                    {{ message.metadata || message.content }}
                </div>
                <div v-else-if="message.contentType === 'IMAGE' || message.contentType === 'VIDEO' || message.contentType === 'AUDIO' || message.contentType === 'FILE'" class="message-bubble__attachment">
                    <div v-if="message.content" class="message-bubble__text mb-2">
                        {{ message.content }}
                    </div>
                    <div class="message-bubble__files">
                        <div
                            v-for="(file, index) in message.attachments"
                            :key="file.id || index"
                            class="message-bubble__file"
                        >
                            <div v-if="message.contentType === 'IMAGE' && file.previewUrl" class="message-bubble__image-preview">
                                <img
                                    :src="file.previewUrl || file.storedUrl"
                                    :alt="file.originalName"
                                    @click="handleFileClick(file)"
                                    class="message-bubble__image"
                                />
                            </div>
                            <div v-else class="message-bubble__file-item" @click="handleFileClick(file)">
                                <i v-if="message.contentType === 'IMAGE'" class="bi bi-image me-2"></i>
                                <i v-else-if="message.contentType === 'VIDEO'" class="bi bi-play-circle me-2"></i>
                                <i v-else-if="message.contentType === 'AUDIO'" class="bi bi-music-note me-2"></i>
                                <i v-else class="bi bi-file-earmark me-2"></i>
                                <span>{{ file.originalName }}</span>
                                <a
                                    :href="file.storedUrl"
                                    target="_blank"
                                    class="ms-2"
                                    @click.stop
                                >
                                    <i class="bi bi-download"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="message-bubble__footer">
                <span class="message-bubble__time">{{ formatTime(message.createdAt) }}</span>
                <i
                    v-if="isOwn && message.seenByUserIds && message.seenByUserIds.length > 0"
                    class="bi bi-check2-all text-primary ms-1"
                    :title="`Đã xem bởi ${message.seenByUserIds.length} người`"
                ></i>
                <i
                    v-else-if="isOwn"
                    class="bi bi-check2 text-muted ms-1"
                ></i>
            </div>
        </div>
        <div class="message-bubble__actions" v-if="message.status !== 'RECALLED' && isOwn">
            <button
                class="btn btn-sm btn-link text-muted p-0"
                @click="$emit('recall')"
                :title="'Thu hồi tin nhắn'"
            >
                <i class="bi bi-x-circle"></i>
            </button>
            <button
                class="btn btn-sm btn-link text-muted p-0"
                @click="$emit('delete')"
                :title="'Xóa tin nhắn'"
            >
                <i class="bi bi-trash"></i>
            </button>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatDateTime } from '@/utils/formatters'

const props = defineProps({
    message: {
        type: Object,
        required: true
    },
    isOwn: {
        type: Boolean,
        default: false
    },
    showAvatar: {
        type: Boolean,
        default: true
    },
    senderName: {
        type: String,
        default: ''
    },
    senderAvatar: {
        type: String,
        default: null
    }
})

const emit = defineEmits(['recall', 'delete', 'file-click'])

const senderInitials = computed(() => {
    if (!props.senderName) return 'U'
    return props.senderName
        .split(' ')
        .map(word => word[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
})

const formatTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Vừa xong'
    if (minutes < 60) return `${minutes} phút trước`
    return formatDateTime(dateString, 'HH:mm DD/MM/YYYY')
}

const handleFileClick = (file) => {
    emit('file-click', file)
}
</script>

<style scoped lang="scss">
.message-bubble {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding: 0 1rem;
    transition: background 0.2s;

    &:hover .message-bubble__actions {
        opacity: 1;
    }

    &--own {
        flex-direction: row-reverse;

        .message-bubble__content {
            align-items: flex-end;
        }

        .message-bubble__body {
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
            color: white;
            border-radius: var(--component-radius-sm) var(--component-radius-sm) 4px var(--component-radius-sm);
        }
    }

    &--recalled {
        opacity: 0.6;
    }
    
    // Hiển thị preview cho image
    .message-bubble__attachment-image {
        max-width: 300px;
        max-height: 300px;
        border-radius: 8px;
        cursor: pointer;
    }
}

.message-bubble__avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
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

.message-bubble__avatar-placeholder {
    color: white;
    font-weight: 600;
    font-size: 0.75rem;
}

.message-bubble__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
}

.message-bubble__header {
    margin-bottom: 0.25rem;
}

.message-bubble__sender {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted);
}

.message-bubble__body {
    background: var(--color-card-muted);
    color: var(--color-heading);
    padding: 0.75rem var(--component-padding-sm);
    border-radius: var(--component-radius-sm) var(--component-radius-sm) var(--component-radius-sm) 4px;
    max-width: 70%;
    word-wrap: break-word;
}

.message-bubble__text {
    white-space: pre-wrap;
    line-height: 1.5;
}

.message-bubble__emoji {
    font-size: 2rem;
    line-height: 1;
}

.message-bubble__attachment {
    .message-bubble__files {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .message-bubble__file {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .message-bubble__file-item {
        display: flex;
        align-items: center;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
            background: rgba(255, 255, 255, 0.3);
        }
    }

    .message-bubble__image-preview {
        border-radius: 8px;
        overflow: hidden;
        max-width: 300px;
        cursor: pointer;
        transition: transform 0.2s;

        &:hover {
            transform: scale(1.02);
        }
    }

    .message-bubble__image {
        width: 100%;
        height: auto;
        display: block;
        max-height: 300px;
        object-fit: contain;
    }
}

.message-bubble__recalled {
    font-style: italic;
    color: var(--color-text-muted);
    font-size: 0.875rem;
}

.message-bubble__footer {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: var(--color-text-muted);
}

.message-bubble__actions {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    opacity: 0;
    transition: opacity 0.2s;
    padding: 0.25rem 0;
}
</style>

