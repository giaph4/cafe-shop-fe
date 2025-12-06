<template>
    <div class="chat-input">
        <div class="chat-input__toolbar">
            <button
                class="btn btn-sm btn-link text-muted"
                @click="toggleEmojiPicker"
                :title="'Chọn emoji'"
            >
                <i class="bi bi-emoji-smile"></i>
            </button>
            <button
                class="btn btn-sm btn-link text-muted"
                @click="triggerFileInput"
                :title="'Đính kèm file'"
            >
                <i class="bi bi-paperclip"></i>
            </button>
            <input
                ref="fileInputRef"
                type="file"
                multiple
                class="d-none"
                @change="handleFileSelect"
            />
        </div>
        <div class="chat-input__main">
            <textarea
                ref="textareaRef"
                v-model="messageText"
                class="form-control chat-input__textarea"
                placeholder="Nhập tin nhắn..."
                rows="1"
                @keydown.enter.exact.prevent="handleEnter"
                @keydown.enter.shift.exact="handleShiftEnter"
                @input="handleInput"
            ></textarea>
            <button
                class="btn btn-primary chat-input__send"
                @click="handleSend"
                :disabled="!canSend || sending"
            >
                <span v-if="sending" class="spinner-border spinner-border-sm"></span>
                <i v-else class="bi bi-send-fill"></i>
            </button>
        </div>
        <div v-if="selectedFiles.length > 0" class="chat-input__files">
            <div
                v-for="(file, index) in selectedFiles"
                :key="index"
                class="chat-input__file-item"
            >
                <span class="chat-input__file-name">{{ file.name }}</span>
                <button
                    class="btn btn-sm btn-link text-danger p-0"
                    @click="removeFile(index)"
                >
                    <i class="bi bi-x"></i>
                </button>
            </div>
        </div>
        <EmojiPicker
            v-if="showEmojiPicker"
            @select="handleEmojiSelect"
            @close="showEmojiPicker = false"
        />
    </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import EmojiPicker from './EmojiPicker.vue'

const props = defineProps({
    sending: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['send-text', 'send-emoji', 'send-attachment'])

const messageText = ref('')
const selectedFiles = ref([])
const showEmojiPicker = ref(false)
const textareaRef = ref(null)
const fileInputRef = ref(null)

const canSend = computed(() => {
    return (messageText.value.trim().length > 0) || selectedFiles.value.length > 0
})

const handleInput = () => {
    nextTick(() => {
        if (textareaRef.value) {
            textareaRef.value.style.height = 'auto'
            textareaRef.value.style.height = `${Math.min(textareaRef.value.scrollHeight, 120)}px`
        }
    })
}

const handleEnter = () => {
    if (canSend.value && !props.sending) {
        handleSend()
    }
}

const handleShiftEnter = () => {
    messageText.value += '\n'
    handleInput()
}

const handleSend = () => {
    if (!canSend.value || props.sending) return

    if (selectedFiles.value.length > 0) {
        emit('send-attachment', messageText.value.trim() || null, selectedFiles.value)
        selectedFiles.value = []
    } else if (messageText.value.trim()) {
        emit('send-text', messageText.value.trim())
    }

    messageText.value = ''
    nextTick(() => {
        if (textareaRef.value) {
            textareaRef.value.style.height = 'auto'
        }
    })
}

const toggleEmojiPicker = () => {
    showEmojiPicker.value = !showEmojiPicker.value
}

const handleEmojiSelect = (emoji) => {
    messageText.value += emoji
    showEmojiPicker.value = false
    nextTick(() => {
        textareaRef.value?.focus()
    })
}

const triggerFileInput = () => {
    fileInputRef.value?.click()
}

const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || [])
    selectedFiles.value.push(...files)
    event.target.value = ''
}

const removeFile = (index) => {
    selectedFiles.value.splice(index, 1)
}
</script>

<style scoped>
/* Chat Input - Chuẩn hóa theo base.css */
.chat-input {
    position: relative;
    padding: var(--spacing-3);
    background: var(--color-card);
    border-top: 1px solid var(--color-border);
}

.chat-input__toolbar {
    display: flex;
    gap: var(--spacing-2);
    margin-bottom: var(--spacing-2);
}

.chat-input__toolbar .btn {
    padding: var(--spacing-2);
    border-radius: var(--radius-sm);
    transition: all var(--transition-base);
}

.chat-input__toolbar .btn:hover {
    background: var(--color-card-muted);
    color: var(--color-primary);
}

.chat-input__toolbar .btn i {
    font-size: 18px;
    line-height: 1;
}

.chat-input__main {
    display: flex;
    gap: var(--spacing-2);
    align-items: flex-end;
}

.chat-input__textarea {
    flex: 1;
    resize: none;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    max-height: 120px;
    transition: all var(--transition-base);
    background: var(--color-card);
    color: var(--color-text);
    font-family: var(--font-family-sans);
}

.chat-input__textarea:focus {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.chat-input__send {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    flex-shrink: 0;
    background: var(--color-primary);
    border: none;
    color: var(--color-text-inverse);
    transition: all var(--transition-base);
}

.chat-input__send:hover:not(:disabled) {
    background: var(--color-primary-dark);
}

.chat-input__send:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.chat-input__send i {
    font-size: 18px;
    line-height: 1;
}

.chat-input__files {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    margin-top: var(--spacing-2);
    padding-top: var(--spacing-2);
    border-top: 1px solid var(--color-border);
}

.chat-input__file-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-3);
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.chat-input__file-item:hover {
    background: var(--color-card);
    border-color: var(--color-primary);
}

.chat-input__file-name {
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--color-text);
}

.chat-input__file-item .btn {
    padding: var(--spacing-1);
    border-radius: var(--radius-sm);
    transition: all var(--transition-base);
}

.chat-input__file-item .btn:hover {
    background: var(--color-card-muted);
    color: var(--color-danger);
}

.chat-input__file-item .btn i {
    font-size: 16px;
    line-height: 1;
}
</style>

