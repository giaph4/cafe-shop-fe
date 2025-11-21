<template>
    <form class="chat-input" :class="inputClass" @submit.prevent="handleSubmit">
        <div class="chat-input__attachments" v-if="attachments.length">
            <div class="chat-input__attachment" v-for="(file, index) in attachments" :key="`${file.name}-${index}`">
                <div class="chat-input__attachment-icon">
                    <i class="bi" :class="iconFor(file)"></i>
                </div>
                <div class="chat-input__attachment-info">
                    <span class="chat-input__attachment-name" :title="file.name">{{ file.name }}</span>
                    <span class="chat-input__attachment-size">{{ formatSize(file.size) }}</span>
                </div>
                <button
                    type="button"
                    class="chat-input__attachment-remove"
                    @click="removeAttachment(index)"
                    aria-label="Xoá tệp đính kèm"
                >
                    <i class="bi bi-x"></i>
                </button>
            </div>
        </div>

        <div class="chat-input__row">
            <button
                ref="emojiTriggerRef"
                type="button"
                class="chat-input__icon-button chat-input__emoji-button"
                :class="buttonClass"
                @click.stop="toggleEmojiPanel"
            >
                <i class="bi bi-emoji-smile"></i>
            </button>
            <button
                type="button"
                class="chat-input__icon-button"
                :class="buttonClass"
                @click="triggerFilePicker"
                aria-label="Đính kèm tệp"
            >
                <i class="bi bi-paperclip"></i>
            </button>
            <textarea
                ref="textareaRef"
                class="chat-input__textarea"
                rows="1"
                placeholder="Nhập tin nhắn..."
                v-model="content"
                @input="autoResize"
                @keydown.enter.exact.prevent="handleSubmit"
                @keydown.enter.shift.exact.stop
            ></textarea>
            <button
                type="submit"
                class="chat-input__send-button"
                :class="buttonClass"
                :disabled="isSending || isEmpty"
                aria-label="Gửi tin nhắn"
            >
                <span v-if="isSending" class="chat-input__spinner" aria-hidden="true"></span>
                <i v-else class="bi bi-send"></i>
            </button>

            <transition name="chat-input__emoji-fade">
                <div
                    v-if="showEmojiPanel"
                    ref="emojiPanelRef"
                    class="chat-input__emoji-panel"
                >
                    <button
                        v-for="emoji in emojiPalette"
                        :key="emoji"
                        type="button"
                        class="chat-input__emoji-option"
                        @click="handleEmojiSelect(emoji)"
                    >
                        {{ emoji }}
                    </button>
                </div>
            </transition>
        </div>

        <input
            ref="fileInputRef"
            type="file"
            class="chat-input__file-input"
            multiple
            :accept="accept"
            @change="handleFileSelect"
        />
    </form>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
    isSending: { type: Boolean, default: false },
    accept: { type: String, default: 'image/*,video/*,audio/*,.pdf,.zip,.rar,.doc,.docx,.xls,.xlsx' },
    layout: { type: String, default: 'slack' }
})

const emit = defineEmits(['send-text', 'send-attachments', 'typing', 'send-emoji'])

const content = ref('')
const attachments = ref([])
const textareaRef = ref(null)
const fileInputRef = ref(null)
let typingTimeout = null

const isEmpty = computed(() => !content.value.trim() && attachments.value.length === 0)

const layoutVariant = computed(() => (props.layout || 'slack').toLowerCase())
const inputClass = computed(() => `chat-input--${layoutVariant.value}`)
const buttonClass = computed(() => ({
    'chat-input__icon-button--soft': layoutVariant.value === 'whatsapp',
    'chat-input__icon-button--outline': layoutVariant.value === 'minimal'
}))

const showEmojiPanel = ref(false)
const emojiTriggerRef = ref(null)
const emojiPanelRef = ref(null)
const emojiPalette = ['😀', '😁', '😂', '😊', '😍', '🥰', '😎', '🤩', '😘', '🤗', '🤔', '😴', '😭', '😡', '👍', '🙏', '👏', '💪', '🔥', '🎉']

const autoResize = () => {
    const el = textareaRef.value
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`
    emitTyping()
}

watch(content, () => {
    emitTyping()
})

const emitTyping = () => {
    emit('typing', true)
    if (typingTimeout) clearTimeout(typingTimeout)
    typingTimeout = setTimeout(() => {
        emit('typing', false)
    }, 1500)
}

let lastSubmitAt = 0
const SUBMIT_DEBOUNCE_MS = 200

const handleSubmit = () => {
    const text = content.value.trim()
    const files = attachments.value

    if (!text && !files.length) {
        return
    }

    const now = Date.now()
    if (now - lastSubmitAt < SUBMIT_DEBOUNCE_MS) {
        return
    }
    lastSubmitAt = now

    if (files.length) {
        emit('send-attachments', { files, messageText: text })
    } else {
        emit('send-text', text)
    }

    content.value = ''
    attachments.value = []
    if (textareaRef.value) {
        textareaRef.value.style.height = 'auto'
    }
    emit('typing', false)
}

const triggerFilePicker = () => {
    fileInputRef.value?.click()
}

const toggleEmojiPanel = () => {
    showEmojiPanel.value = !showEmojiPanel.value
}

const closeEmojiPanel = () => {
    showEmojiPanel.value = false
}

const handleEmojiSelect = (emoji) => {
    emit('send-emoji', emoji)
    closeEmojiPanel()
}

const handleDocumentClick = (event) => {
    if (!showEmojiPanel.value) return
    const panel = emojiPanelRef.value
    const trigger = emojiTriggerRef.value
    if (!panel || !trigger) {
        closeEmojiPanel()
        return
    }
    const target = event.target
    if (panel.contains(target) || trigger.contains(target)) {
        return
    }
    closeEmojiPanel()
}

const handleEscape = (event) => {
    if (event.key === 'Escape') {
        closeEmojiPanel()
    }
}

onMounted(() => {
    document.addEventListener('click', handleDocumentClick)
    document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleDocumentClick)
    document.removeEventListener('keydown', handleEscape)
})

const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    attachments.value = [...attachments.value, ...files]
    nextTick(() => {
        event.target.value = ''
    })
}

const removeAttachment = (index) => {
    attachments.value.splice(index, 1)
}

const formatSize = (bytes) => {
    if (!bytes) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
    return `${(bytes / Math.pow(1024, exponent)).toFixed(1)} ${units[exponent]}`
}

const iconFor = (file) => {
    const type = file.type || ''
    if (type.startsWith('image/')) return 'bi bi-image'
    if (type.startsWith('video/')) return 'bi bi-camera-video'
    if (type.startsWith('audio/')) return 'bi bi-music-note-beamed'
    if (type.includes('pdf')) return 'bi bi-file-earmark-pdf'
    if (type.includes('zip') || type.includes('rar')) return 'bi bi-file-earmark-zip'
    return 'bi bi-paperclip'
}
</script>

<style scoped>
.chat-input {
    border-top: 1px solid rgba(148, 163, 184, 0.2);
    padding: 1rem;
    background: rgba(255, 255, 255, 0.95);
    position: sticky;
    bottom: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.chat-input--minimal {
    border-top: 1px solid rgba(148, 163, 184, 0.18);
    background: rgba(248, 250, 252, 0.92);
}

.chat-input--whatsapp {
    background: rgba(240, 242, 245, 0.9);
    border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.chat-input__attachments {
    display: grid;
    gap: 0.5rem;
}

.chat-input__attachment {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    background: rgba(148, 163, 184, 0.12);
    padding: 0.5rem 0.65rem;
    border-radius: 12px;
}

.chat-input__attachment-size {
    font-size: 0.8rem;
    color: rgba(71, 85, 105, 0.7);
}

.chat-input__attachment-remove {
    border: none;
    background: rgba(239, 68, 68, 0.12);
    color: #b91c1c;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    transition: background 0.18s ease, color 0.18s ease;
}

.chat-input__attachment-remove:hover {
    background: rgba(239, 68, 68, 0.18);
    color: #991b1b;
}

.chat-input__attachment-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(59, 130, 246, 0.18);
    display: grid;
    place-items: center;
    color: #2563eb;
}

.chat-input__attachment-info {
    flex: 1;
    min-width: 0;
}

.chat-input__attachment-name {
    font-weight: 600;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.chat-input__row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    position: relative;
}

.chat-input__icon-button {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: rgba(248, 250, 252, 0.9);
    color: rgba(51, 65, 85, 0.88);
    transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
}

.chat-input__icon-button:hover {
    border-color: rgba(59, 130, 246, 0.45);
    color: var(--shell-accent, #006aff);
    transform: translateY(-1px);
}

.chat-input__icon-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

.chat-input__send-button {
    width: 46px;
    height: 46px;
    border-radius: 16px;
    border: none;
    background: linear-gradient(135deg, #2563eb, #4f46e5);
    color: #ffffff;
    display: grid;
    place-items: center;
    font-size: 1.05rem;
    transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.chat-input__send-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 16px 28px rgba(37, 99, 235, 0.28);
}

.chat-input__send-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
}

.chat-input__spinner {
    width: 18px;
    height: 18px;
    border: 3px solid rgba(255, 255, 255, 0.35);
    border-top-color: #ffffff;
    border-radius: 999px;
    animation: chat-input-spin 0.8s linear infinite;
}

@keyframes chat-input-spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

.chat-input--minimal .chat-input__icon-button {
    background: rgba(248, 250, 252, 0.9);
}

.chat-input--whatsapp .chat-input__icon-button {
    background: rgba(0, 168, 132, 0.12);
    border: none;
    color: #008069;
}

.chat-input--whatsapp .chat-input__icon-button:hover {
    background: rgba(0, 168, 132, 0.2);
}

.chat-input__textarea {
    resize: none;
    border-radius: 16px;
    padding: 0.7rem 0.9rem;
    max-height: 200px;
    line-height: 1.4;
    background: rgba(248, 250, 252, 0.9);
}

.chat-input--minimal .chat-input__textarea {
    border-radius: 14px;
    background: rgba(148, 163, 184, 0.12);
    border: 1px solid rgba(148, 163, 184, 0.24);
}

.chat-input--whatsapp .chat-input__textarea {
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(0, 0, 0, 0.06);
    padding-inline: 1.2rem;
}

.chat-input__textarea:focus {
    box-shadow: none;
    border-color: rgba(59, 130, 246, 0.4);
}

.chat-input__emoji-button {
    background: rgba(15, 23, 42, 0.05);
}

.chat-input--minimal .chat-input__emoji-button {
    border-color: rgba(148, 163, 184, 0.35);
    background: rgba(248, 250, 252, 0.9);
}

.chat-input--whatsapp .chat-input__emoji-button {
    background: rgba(0, 168, 132, 0.12);
    color: #008069;
    border: none;
}

.chat-input__emoji-panel {
    position: absolute;
    bottom: 56px;
    left: 0;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0.4rem;
    padding: 0.6rem;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
    border: 1px solid rgba(148, 163, 184, 0.2);
    z-index: 6;
    min-width: 240px;
}

.chat-input__emoji-option {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    border: none;
    background: transparent;
    font-size: 1.4rem;
    line-height: 1;
    transition: transform 0.15s ease, background 0.15s ease;
}

.chat-input__emoji-option:hover {
    background: rgba(59, 130, 246, 0.1);
    transform: translateY(-2px);
}

.chat-input__file-input {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
}

.chat-input__emoji-fade-enter-active,
.chat-input__emoji-fade-leave-active {
    transition: opacity 0.18s ease, transform 0.18s ease;
}

.chat-input__emoji-fade-enter-from,
.chat-input__emoji-fade-leave-to {
    opacity: 0;
    transform: translateY(6px);
}

:global([data-bs-theme='dark']) .chat-input {
    background: rgba(15, 23, 42, 0.92);
    border-top-color: rgba(99, 102, 241, 0.35);
}

:global([data-bs-theme='dark']) .chat-input__emoji-panel {
    background: rgba(15, 23, 42, 0.96);
    border-color: rgba(99, 102, 241, 0.35);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
}

:global([data-bs-theme='dark']) .chat-input__emoji-option:hover {
    background: rgba(99, 102, 241, 0.28);
}

:global([data-bs-theme='dark']) .chat-input__attachment {
    background: rgba(30, 41, 59, 0.7);
}

:global([data-bs-theme='dark']) .chat-input__attachment-name {
    color: rgba(226, 232, 240, 0.95);
}

:global([data-bs-theme='dark']) .chat-input__textarea {
    background: rgba(30, 41, 59, 0.85);
    color: rgba(226, 232, 240, 0.95);
    border-color: rgba(99, 102, 241, 0.4);
}
</style>
