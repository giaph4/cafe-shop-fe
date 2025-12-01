<template>
    <Teleport to="body">
        <div class="modal fade" ref="modalRef" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Cập nhật trạng thái ca làm</h5>
                        <button type="button" class="btn-close" @click="hide"></button>
                    </div>
                    <form @submit.prevent="handleSubmit">
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Trạng thái hiện tại</label>
                                <div class="form-control-plaintext">
                                    <span class="badge" :class="getStatusBadgeClass(currentStatus)">
                                        {{ getStatusLabel(currentStatus) }}
                                    </span>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Trạng thái mới <span class="text-danger">*</span></label>
                                <select
                                    class="form-select"
                                    v-model="selectedStatus"
                                    :class="{ 'is-invalid': errors.status }"
                                    required
                                >
                                    <option value="">-- Chọn trạng thái --</option>
                                    <option
                                        v-for="status in statusOptions"
                                        :key="status.value"
                                        :value="status.value"
                                    >
                                        {{ status.label }}
                                    </option>
                                </select>
                                <div class="invalid-feedback" v-if="errors.status">{{ errors.status }}</div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Ghi chú</label>
                                <textarea
                                    class="form-control"
                                    v-model="notes"
                                    rows="3"
                                    placeholder="Nhập ghi chú (tùy chọn)"
                                ></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" @click="hide" :disabled="submitting">
                                Hủy
                            </button>
                            <button type="submit" class="btn btn-primary" :disabled="submitting || !selectedStatus">
                                <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                                Cập nhật
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { Modal } from 'bootstrap'
import { SHIFT_STATUSES } from '@/api/shiftService'

const props = defineProps({
    statusOptions: {
        type: Array,
        default: () => SHIFT_STATUSES
    }
})

const emit = defineEmits(['submit'])

const modalRef = ref(null)
let modalInstance = null

const currentStatus = ref('')
const selectedStatus = ref('')
const notes = ref('')
const submitting = ref(false)
const errors = reactive({})

const getStatusLabel = (status) => {
    const option = props.statusOptions.find(s => s.value === status)
    return option?.label || status
}

const getStatusBadgeClass = (status) => {
    switch (status) {
        case 'PLANNED':
            return 'bg-info text-dark'
        case 'LOCKED':
            return 'bg-secondary'
        case 'IN_PROGRESS':
            return 'bg-primary'
        case 'DONE':
            return 'bg-success'
        case 'CANCELLED':
            return 'bg-danger'
        default:
            return 'bg-secondary'
    }
}

const show = (instance) => {
    if (!instance) return
    currentStatus.value = instance.status || ''
    selectedStatus.value = instance.status || ''
    notes.value = instance.notes || ''
    errors.status = ''
    modalInstance?.show()
}

const hide = () => {
    modalInstance?.hide()
    // Reset form after modal is hidden
    setTimeout(() => {
        currentStatus.value = ''
        selectedStatus.value = ''
        notes.value = ''
        errors.status = ''
    }, 300)
}

const handleSubmit = () => {
    // Validation
    errors.status = ''
    if (!selectedStatus.value) {
        errors.status = 'Vui lòng chọn trạng thái mới.'
        return
    }

    if (!props.statusOptions.some(s => s.value === selectedStatus.value)) {
        errors.status = 'Trạng thái không hợp lệ.'
        return
    }

    submitting.value = true
    emit('submit', {
        status: selectedStatus.value,
        notes: notes.value?.trim() || null
    })
}

const setSubmitting = (value) => {
    submitting.value = value
    if (!value) {
        hide()
    }
}

defineExpose({
    show,
    hide,
    setSubmitting
})

import { onMounted, onBeforeUnmount } from 'vue'

onMounted(() => {
    modalInstance = new Modal(modalRef.value, { backdrop: 'static' })
})

onBeforeUnmount(() => {
    modalInstance?.dispose()
})
</script>

<style scoped>
/* Modal styles đã được chuẩn hóa trong components.scss */
</style>

