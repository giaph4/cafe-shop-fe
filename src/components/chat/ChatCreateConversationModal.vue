<template>
    <transition name="fade">
        <div v-if="show" class="chat-create-modal">
            <div class="chat-create-modal__backdrop" @click="emitClose"></div>
            <div class="chat-create-modal__dialog" role="dialog" aria-modal="true">
                <header class="chat-create-modal__header">
                    <h5>Tạo cuộc trò chuyện mới</h5>
                    <button type="button" class="chat-create-modal__close" aria-label="Đóng" @click="emitClose">
                        <i class="bi bi-x"></i>
                    </button>
                </header>

                <form @submit.prevent="handleSubmit" class="chat-create-modal__form">
                    <div class="chat-create-modal__field">
                        <label class="chat-create-modal__label">Loại cuộc trò chuyện</label>
                        <div class="chat-create-modal__segment">
                            <label class="chat-create-modal__segment-option">
                                <input
                                    type="radio"
                                    name="conversation-type"
                                    value="DIRECT"
                                    v-model="form.type"
                                />
                                <span>1-1</span>
                            </label>
                            <label class="chat-create-modal__segment-option">
                                <input
                                    type="radio"
                                    name="conversation-type"
                                    value="GROUP"
                                    v-model="form.type"
                                />
                                <span>Nhóm</span>
                            </label>
                        </div>
                    </div>

                    <div v-if="form.type === 'DIRECT'" class="chat-create-modal__field">
                        <label class="chat-create-modal__label" for="targetUserId">ID người cần trò chuyện</label>
                        <input
                            id="targetUserId"
                            type="number"
                            class="chat-create-modal__input"
                            min="1"
                            v-model.trim="form.targetUserId"
                            required
                        />
                        <p class="chat-create-modal__helper">Nhập ID của thành viên bạn muốn tạo cuộc trò chuyện 1-1.</p>
                    </div>

                    <template v-else>
                        <div class="chat-create-modal__field">
                            <label class="chat-create-modal__label" for="groupTitle">Tên nhóm</label>
                            <input
                                id="groupTitle"
                                type="text"
                                class="chat-create-modal__input"
                                maxlength="120"
                                v-model.trim="form.groupTitle"
                                required
                            />
                            <p class="chat-create-modal__helper">Đặt tên dễ nhớ cho cuộc trò chuyện nhóm.</p>
                        </div>
                        <div class="chat-create-modal__field">
                            <label class="chat-create-modal__label" for="memberIds">Thành viên (ID)</label>
                            <input
                                id="memberIds"
                                type="text"
                                class="chat-create-modal__input"
                                v-model="form.memberIds"
                                placeholder="Ví dụ: 102,103,104"
                            />
                            <p class="chat-create-modal__helper">Nhập danh sách ID, cách nhau bằng dấu phẩy. Bỏ trống nếu chỉ có bạn.</p>
                        </div>
                    </template>

                    <div v-if="errorMessage" class="chat-create-modal__error">{{ errorMessage }}</div>

                    <div class="chat-create-modal__actions">
                        <button
                            type="button"
                            class="chat-create-modal__btn chat-create-modal__btn--ghost"
                            @click="emitClose"
                            :disabled="loading"
                        >
                            Huỷ
                        </button>
                        <button
                            type="submit"
                            class="chat-create-modal__btn chat-create-modal__btn--primary"
                            :disabled="loading"
                        >
                            <span v-if="loading" class="chat-create-modal__spinner" aria-hidden="true"></span>
                            <span v-else>Tạo cuộc trò chuyện</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { reactive, watch, ref } from 'vue'

const props = defineProps({
    show: { type: Boolean, default: false },
    loading: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'submit'])

const form = reactive({
    type: 'DIRECT',
    targetUserId: '',
    groupTitle: '',
    memberIds: ''
})

const errorMessage = ref('')

watch(
    () => props.show,
    (value) => {
        if (value) {
            resetForm()
        }
    }
)

const resetForm = () => {
    form.type = 'DIRECT'
    form.targetUserId = ''
    form.groupTitle = ''
    form.memberIds = ''
    errorMessage.value = ''
}

const emitClose = () => {
    if (props.loading) return
    emit('close')
}

const handleSubmit = () => {
    if (props.loading) return

    if (form.type === 'DIRECT') {
        if (!form.targetUserId) {
            errorMessage.value = 'Vui lòng nhập ID người cần trò chuyện.'
            return
        }
        const target = Number(form.targetUserId)
        if (!Number.isFinite(target) || target <= 0) {
            errorMessage.value = 'ID người dùng không hợp lệ.'
            return
        }
        errorMessage.value = ''
        emit('submit', { type: 'DIRECT', targetUserId: target })
        return
    }

    if (!form.groupTitle.trim()) {
        errorMessage.value = 'Tên nhóm không được để trống.'
        return
    }
    const memberIds = form.memberIds
        .split(',')
        .map((id) => Number(id.trim()))
        .filter((id) => Number.isFinite(id) && id > 0)

    errorMessage.value = ''
    emit('submit', {
        type: 'GROUP',
        title: form.groupTitle.trim(),
        memberIds
    })
}
</script>

<style scoped>
.chat-create-modal {
    position: fixed;
    inset: 0;
    z-index: 1050;
    display: flex;
    align-items: center;
    justify-content: center;
}

.chat-create-modal__backdrop {
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.6);
}

.chat-create-modal__dialog {
    position: relative;
    z-index: 1;
    width: min(420px, 90vw);
    background: #ffffff;
    border-radius: 18px;
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.25);
    padding: 1.5rem;
}

.chat-create-modal__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    gap: 1rem;
}

.chat-create-modal__header h5 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 700;
}

.chat-create-modal__close {
    border: none;
    background: rgba(15, 23, 42, 0.05);
    width: 36px;
    height: 36px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    color: #475569;
    transition: background 0.2s ease, transform 0.2s ease;
}

.chat-create-modal__close:hover {
    background: rgba(37, 99, 235, 0.15);
    transform: translateY(-1px);
}

.chat-create-modal__form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.chat-create-modal__field {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
}

.chat-create-modal__label {
    font-weight: 600;
    color: #0f172a;
}

.chat-create-modal__input {
    border: 1px solid rgba(148, 163, 184, 0.35);
    border-radius: 12px;
    padding: 0.6rem 0.75rem;
    font-size: 0.95rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.chat-create-modal__input:focus {
    outline: none;
    border-color: rgba(37, 99, 235, 0.55);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.chat-create-modal__helper {
    margin: 0;
    font-size: 0.8rem;
    color: rgba(71, 85, 105, 0.7);
}

.chat-create-modal__segment {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.2rem;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.05);
}

.chat-create-modal__segment-option {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.45rem 0.95rem;
    border-radius: 999px;
    cursor: pointer;
    font-weight: 600;
    color: #475569;
    transition: background 0.2s ease, color 0.2s ease;
}

.chat-create-modal__segment-option input {
    appearance: none;
    width: 14px;
    height: 14px;
    border: 1px solid rgba(148, 163, 184, 0.6);
    border-radius: 50%;
    position: relative;
}

.chat-create-modal__segment-option input:checked {
    border-color: #2563eb;
    background: #2563eb;
}

.chat-create-modal__segment-option input:checked::after {
    content: '';
    position: absolute;
    inset: 3px;
    border-radius: 50%;
    background: #ffffff;
}

.chat-create-modal__segment-option input:focus-visible {
    outline: 2px solid rgba(37, 99, 235, 0.4);
    outline-offset: 2px;
}

.chat-create-modal__segment-option:hover {
    background: rgba(37, 99, 235, 0.1);
    color: #2563eb;
}

.chat-create-modal__segment-option input:checked + span,
.chat-create-modal__segment-option span {
    pointer-events: none;
}

.chat-create-modal__segment-option input:checked + span {
    color: #1d4ed8;
}

.chat-create-modal__error {
    padding: 0.65rem 0.85rem;
    border-radius: 12px;
    background: rgba(248, 113, 113, 0.12);
    color: #b91c1c;
    font-weight: 600;
}

.chat-create-modal__actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
}

.chat-create-modal__btn {
    border: none;
    border-radius: 12px;
    padding: 0.55rem 1.2rem;
    font-weight: 600;
    transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.chat-create-modal__btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.chat-create-modal__btn--ghost {
    background: rgba(15, 23, 42, 0.05);
    color: #475569;
}

.chat-create-modal__btn--ghost:hover:not(:disabled) {
    background: rgba(37, 99, 235, 0.12);
    transform: translateY(-1px);
}

.chat-create-modal__btn--primary {
    background: linear-gradient(135deg, #2563eb, #4f46e5);
    color: #ffffff;
    box-shadow: 0 16px 36px rgba(37, 99, 235, 0.25);
}

.chat-create-modal__btn--primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 20px 44px rgba(37, 99, 235, 0.3);
}

.chat-create-modal__spinner {
    width: 18px;
    height: 18px;
    border: 3px solid rgba(255, 255, 255, 0.35);
    border-top-color: #ffffff;
    border-radius: 999px;
    animation: chat-create-spin 0.8s linear infinite;
}

@keyframes chat-create-spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

.fade-enter-active, .fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from, .fade-leave-to {
    opacity: 0;
}

@media (prefers-color-scheme: dark) {
    .chat-create-modal__dialog {
        background: rgba(15, 23, 42, 0.95);
        color: rgba(226, 232, 240, 0.96);
        box-shadow: 0 24px 60px rgba(2, 6, 23, 0.6);
    }

    .chat-create-modal__backdrop {
        background: rgba(15, 23, 42, 0.72);
    }

    .chat-create-modal__input {
        background: rgba(15, 23, 42, 0.8);
        border-color: rgba(99, 102, 241, 0.35);
        color: rgba(226, 232, 240, 0.95);
    }

    .chat-create-modal__label,
    .chat-create-modal__segment-option span {
        color: rgba(226, 232, 240, 0.9);
    }

    .chat-create-modal__helper {
        color: rgba(148, 163, 184, 0.75);
    }

    .chat-create-modal__segment {
        background: rgba(59, 130, 246, 0.12);
    }

    .chat-create-modal__segment-option {
        color: rgba(203, 213, 225, 0.85);
    }

    .chat-create-modal__segment-option:hover {
        background: rgba(59, 130, 246, 0.22);
    }

    .chat-create-modal__segment-option input {
        border-color: rgba(148, 163, 184, 0.5);
    }

    .chat-create-modal__btn--ghost {
        background: rgba(255, 255, 255, 0.05);
        color: rgba(226, 232, 240, 0.82);
    }

    .chat-create-modal__close {
        background: rgba(37, 99, 235, 0.16);
        color: rgba(226, 232, 240, 0.85);
    }
}
</style>
