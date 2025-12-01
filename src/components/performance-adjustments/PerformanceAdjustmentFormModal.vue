<template>
    <Teleport to="body">
        <div class="modal fade" ref="modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Tạo điều chỉnh hiệu suất mới</h5>
                        <button type="button" class="btn-close" @click="hide"></button>
                    </div>

                    <form @submit.prevent="handleSubmit">
                        <div class="modal-body">
                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label">Phân công <span class="text-danger">*</span></label>
                                    <select
                                        class="form-select"
                                        v-model.number="form.assignmentId"
                                        required
                                    >
                                        <option :value="null">Chọn phân công</option>
                                        <option v-for="opt in assignmentOptions" :key="opt.value" :value="opt.value">
                                            {{ opt.label }}
                                        </option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Loại <span class="text-danger">*</span></label>
                                    <select
                                        class="form-select"
                                        v-model="form.type"
                                        required
                                    >
                                        <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">
                                            {{ opt.label }}
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label">Số tiền <span class="text-danger">*</span></label>
                                    <input
                                        type="number"
                                        class="form-control"
                                        min="0"
                                        step="1000"
                                        v-model.number="form.amount"
                                        placeholder="VD: 50000"
                                        required
                                    />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Ngày hiệu lực</label>
                                    <input
                                        type="datetime-local"
                                        class="form-control"
                                        v-model="form.effectiveAt"
                                    />
                                    <small class="text-muted">Để trống sẽ dùng thời gian hiện tại</small>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Lý do</label>
                                <textarea
                                    class="form-control"
                                    rows="3"
                                    v-model.trim="form.reason"
                                    maxlength="500"
                                    placeholder="Nhập lý do điều chỉnh (tùy chọn)"
                                ></textarea>
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" @click="hide">Hủy</button>
                            <button type="submit" class="btn btn-primary" :disabled="submitting">
                                <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                                {{ submitting ? 'Đang lưu...' : 'Tạo mới' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Modal } from 'bootstrap'

const props = defineProps({
    adjustment: { type: Object, default: null },
    assignmentOptions: { type: Array, default: () => [] },
    typeOptions: { type: Array, default: () => [] },
    submitting: { type: Boolean, default: false }
})

const emit = defineEmits(['submit'])

const modal = ref(null)
let modalInstance = null

const defaultForm = () => ({
    assignmentId: null,
    type: props.typeOptions[0]?.value || 'BONUS',
    amount: '',
    reason: '',
    effectiveAt: ''
})

const form = ref(defaultForm())

const resetForm = () => {
    form.value = defaultForm()
}

watch(() => props.typeOptions, (options) => {
    if (options.length && !form.value.type) {
        form.value.type = options[0].value
    }
}, { immediate: true })

const validateForm = () => {
    if (!form.value.assignmentId) {
        return { valid: false, message: 'Vui lòng chọn phân công.' }
    }
    if (!form.value.type) {
        return { valid: false, message: 'Vui lòng chọn loại điều chỉnh.' }
    }
    if (!form.value.amount || Number(form.value.amount) <= 0) {
        return { valid: false, message: 'Vui lòng nhập số tiền hợp lệ.' }
    }
    return { valid: true }
}

import { toast } from 'vue3-toastify'

const handleSubmit = () => {
    const validation = validateForm()
    if (!validation.valid) {
        toast.error(validation.message)
        return
    }
    const payload = {
        assignmentId: form.value.assignmentId,
        type: form.value.type,
        amount: Number(form.value.amount),
        reason: form.value.reason || null,
        effectiveAt: form.value.effectiveAt || null
    }
    emit('submit', payload)
    resetForm()
}

const show = () => {
    resetForm()
    modalInstance?.show()
}

const hide = () => modalInstance?.hide()

defineExpose({ show, hide })

onMounted(() => {
    modalInstance = new Modal(modal.value, { backdrop: 'static' })
})

onBeforeUnmount(() => {
    modalInstance?.dispose()
})
</script>

