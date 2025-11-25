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

<style scoped lang="scss">
.chat-input {
    position: relative;
    padding: 1rem;
    background: #ffffff;
    border-top: 1px solid #e2e8f0;
}

.chat-input__toolbar {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.chat-input__main {
    display: flex;
    gap: 0.75rem;
    align-items: flex-end;
}

.chat-input__textarea {
    flex: 1;
    resize: none;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 0.75rem 1rem;
    font-size: 0.9375rem;
    line-height: 1.5;
    max-height: 120px;
    transition: border-color 0.2s;

    &:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
    }
}

.chat-input__send {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    flex-shrink: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;

    &:hover:not(:disabled) {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    &:disabled {
        opacity: 0.5;
    }
}

.chat-input__files {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #f1f5f9;
}

.chat-input__file-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.875rem;
}

.chat-input__file-name {
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>

