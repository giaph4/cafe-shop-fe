<template>
  <div
    class="message-bubble"
    :class="{
      'message-bubble--own': isOwn,
      'message-bubble--recalled': message.status === 'RECALLED'
    }"
  >
    <div
      v-if="!isOwn && showAvatar"
      class="message-bubble__avatar"
    >
      <img
        v-if="senderAvatar"
        :src="senderAvatar"
        :alt="senderName"
      >
      <div
        v-else
        class="message-bubble__avatar-placeholder"
      >
        {{ senderInitials }}
      </div>
    </div>
    <div class="message-bubble__content">
      <div
        v-if="!isOwn && showAvatar"
        class="message-bubble__header"
      >
        <span class="message-bubble__sender">{{ senderName }}</span>
      </div>
      <div class="message-bubble__body">
        <div
          v-if="message.status === 'RECALLED'"
          class="message-bubble__recalled"
        >
          <i class="bi bi-x-circle me-1" />
          Tin nhắn đã được thu hồi
        </div>
        <div
          v-else-if="message.contentType === 'TEXT'"
          class="message-bubble__text"
        >
          {{ message.content }}
        </div>
        <div
          v-else-if="message.contentType === 'EMOJI'"
          class="message-bubble__emoji"
        >
          {{ message.metadata || message.content }}
        </div>
        <div
          v-else-if="message.contentType === 'IMAGE' || message.contentType === 'VIDEO' || message.contentType === 'AUDIO' || message.contentType === 'FILE'"
          class="message-bubble__attachment"
        >
          <div
            v-if="message.content"
            class="message-bubble__text mb-2"
          >
            {{ message.content }}
          </div>
          <div class="message-bubble__files">
            <div
              v-for="(file, index) in message.attachments"
              :key="file.id || index"
              class="message-bubble__file"
            >
              <div
                v-if="message.contentType === 'IMAGE' && file.previewUrl"
                class="message-bubble__image-preview"
              >
                <img
                  :src="file.previewUrl || file.storedUrl"
                  :alt="file.originalName"
                  class="message-bubble__image"
                  @click="handleFileClick(file)"
                >
              </div>
              <div
                v-else
                class="message-bubble__file-item"
                @click="handleFileClick(file)"
              >
                <i
                  v-if="message.contentType === 'IMAGE'"
                  class="bi bi-image me-2"
                />
                <i
                  v-else-if="message.contentType === 'VIDEO'"
                  class="bi bi-play-circle me-2"
                />
                <i
                  v-else-if="message.contentType === 'AUDIO'"
                  class="bi bi-music-note me-2"
                />
                <i
                  v-else
                  class="bi bi-file-earmark me-2"
                />
                <span>{{ file.originalName }}</span>
                <a
                  :href="file.storedUrl"
                  target="_blank"
                  class="ms-2"
                  @click.stop
                >
                  <i class="bi bi-download" />
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
          class="bi bi-check2-all ms-1"
          :style="{ color: 'var(--color-primary)' }"
          :title="`Đã xem bởi ${message.seenByUserIds.length} người`"
        />
        <i
          v-else-if="isOwn"
          class="bi bi-check2 text-muted ms-1"
        />
      </div>
    </div>
    <div
      v-if="message.status !== 'RECALLED' && isOwn"
      class="message-bubble__actions"
    >
      <button
        class="btn btn-sm btn-link text-muted p-0"
        :title="'Thu hồi tin nhắn'"
        @click="$emit('recall')"
      >
        <i class="bi bi-x-circle" />
      </button>
      <button
        class="btn btn-sm btn-link text-muted p-0"
        :title="'Xóa tin nhắn'"
        @click="$emit('delete')"
      >
        <i class="bi bi-trash" />
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

<style scoped>
/* Message Bubble - Chuẩn hóa theo base.css */
.message-bubble {
    display: flex;
    gap: var(--spacing-2);
    margin-bottom: var(--spacing-4);
    padding: 0 var(--spacing-4);
    transition: background var(--transition-base);
}

.message-bubble:hover .message-bubble__actions {
    opacity: 1;
}

.message-bubble--own {
    flex-direction: row-reverse;
}

.message-bubble--own .message-bubble__content {
    align-items: flex-end;
}

.message-bubble--own .message-bubble__body {
    background: var(--color-primary);
    color: var(--color-text-inverse);
    border-radius: var(--radius-sm) var(--radius-sm) 4px var(--radius-sm);
}

.message-bubble--recalled {
    opacity: 0.6;
}

/* Avatar - Chuẩn hóa, không dùng gradient */
.message-bubble__avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
}

.message-bubble__avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.message-bubble__avatar-placeholder {
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
}

.message-bubble__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
}

.message-bubble__header {
    margin-bottom: var(--spacing-1);
}

.message-bubble__sender {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.message-bubble__body {
    background: var(--color-card-muted);
    color: var(--color-text);
    padding: var(--spacing-3) var(--spacing-3);
    border-radius: var(--radius-sm) var(--radius-sm) var(--radius-sm) 4px;
    max-width: 70%;
    word-wrap: break-word;
    border: 1px solid var(--color-border);
}

.message-bubble--own .message-bubble__body {
    border-color: var(--color-primary);
}

.message-bubble__text {
    white-space: pre-wrap;
    line-height: var(--line-height-base);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.message-bubble__emoji {
    font-size: 2rem;
    line-height: 1;
}

.message-bubble__attachment .message-bubble__files {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.message-bubble__attachment .message-bubble__file {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.message-bubble__attachment .message-bubble__file-item {
    display: flex;
    align-items: center;
    padding: var(--spacing-2);
    background: rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-base);
    cursor: pointer;
    transition: background var(--transition-base);
    font-size: var(--font-size-base);
    gap: var(--spacing-2);
}

.message-bubble__attachment .message-bubble__file-item:hover {
    background: rgba(255, 255, 255, 0.3);
}

.message-bubble__attachment .message-bubble__file-item i {
    font-size: 18px;
    line-height: 1;
}

.message-bubble__attachment .message-bubble__image-preview {
    border-radius: var(--radius-sm);
    overflow: hidden;
    max-width: 300px;
    cursor: pointer;
    transition: transform var(--transition-base);
}

.message-bubble__attachment .message-bubble__image-preview:hover {
    transform: scale(1.02);
}

.message-bubble__attachment .message-bubble__image {
    width: 100%;
    height: auto;
    display: block;
    max-height: 300px;
    object-fit: contain;
}

.message-bubble__recalled {
    font-style: italic;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.message-bubble__footer {
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
    margin-top: var(--spacing-1);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.message-bubble__footer i {
    font-size: 16px;
    line-height: 1;
}

.message-bubble__actions {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    opacity: 0;
    transition: opacity var(--transition-base);
    padding: var(--spacing-1) 0;
}

.message-bubble__actions .btn {
    padding: var(--spacing-1);
    border-radius: var(--radius-sm);
    transition: all var(--transition-base);
}

.message-bubble__actions .btn:hover {
    background: var(--color-card-muted);
    color: var(--color-primary);
}

.message-bubble__actions .btn i {
    font-size: 16px;
    line-height: 1;
}
</style>

