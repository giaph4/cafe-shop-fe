<template>
    <div class="chat-attachment-preview">
        <div
            v-for="attachment in attachments"
            :key="attachment.id || attachment.originalName"
            class="chat-attachment-preview__item"
        >
            <div class="chat-attachment-preview__icon">
                <i :class="iconFor(attachment)"></i>
            </div>
            <div class="chat-attachment-preview__meta">
                <span class="chat-attachment-preview__name" :title="attachment.originalName">
                    {{ attachment.originalName }}
                </span>
                <small class="chat-attachment-preview__size" v-if="attachment.size">{{ formatSize(attachment.size) }}</small>
            </div>
            <a
                v-if="attachment.storedUrl"
                class="chat-attachment-preview__action"
                :href="attachment.storedUrl"
                target="_blank"
                rel="noopener"
            >
                <i class="bi bi-download"></i>
            </a>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    attachments: { type: Array, default: () => [] }
})

const formatSize = (bytes) => {
    if (!bytes) return ''
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

const iconFor = (attachment) => {
    const mime = attachment?.mimeType || ''
    if (mime.startsWith('image/')) return 'bi bi-image'
    if (mime.startsWith('video/')) return 'bi bi-camera-video'
    if (mime.startsWith('audio/')) return 'bi bi-music-note-beamed'
    if (mime.includes('pdf')) return 'bi bi-file-earmark-pdf'
    if (mime.includes('zip') || mime.includes('rar')) return 'bi bi-file-earmark-zip'
    return 'bi bi-paperclip'
}
</script>

<style scoped>
.chat-attachment-preview {
    display: grid;
    gap: 0.5rem;
}

.chat-attachment-preview__item {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.5rem 0.65rem;
    border-radius: 12px;
    background: rgba(148, 163, 184, 0.15);
}

.chat-attachment-preview__icon {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    background: rgba(59, 130, 246, 0.15);
    display: grid;
    place-items: center;
    color: #2563eb;
    font-size: 1.1rem;
}

.chat-attachment-preview__meta {
    flex: 1;
    min-width: 0;
}

.chat-attachment-preview__name {
    display: block;
    font-weight: 600;
    color: #1f2937;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.chat-attachment-preview__size {
    color: rgba(71, 85, 105, 0.65);
    font-size: 0.8rem;
}

.chat-attachment-preview__action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 12px;
    border: 1px solid rgba(37, 99, 235, 0.35);
    color: #2563eb;
    transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}

.chat-attachment-preview__action:hover {
    background: rgba(37, 99, 235, 0.12);
    border-color: rgba(37, 99, 235, 0.55);
    transform: translateY(-1px);
}

@media (prefers-color-scheme: dark) {
    .chat-attachment-preview__item {
        background: rgba(30, 41, 59, 0.7);
    }

    .chat-attachment-preview__icon {
        background: rgba(59, 130, 246, 0.25);
        color: rgba(191, 219, 254, 0.95);
    }

    .chat-attachment-preview__name {
        color: rgba(226, 232, 240, 0.95);
    }

    .chat-attachment-preview__size {
        color: rgba(148, 163, 184, 0.72);
    }

    .chat-attachment-preview__action {
        border-color: rgba(99, 102, 241, 0.45);
        color: rgba(191, 219, 254, 0.95);
        background: rgba(37, 99, 235, 0.15);
    }
}
</style>
