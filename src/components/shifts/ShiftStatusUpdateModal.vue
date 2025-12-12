<template>
  <Teleport to="body">
    <div
      ref="modalRef"
      class="modal fade shift-status-update-modal"
      tabindex="-1"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Cập nhật trạng thái ca làm
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="hide"
            />
          </div>
          <form @submit.prevent="handleSubmit">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Trạng thái hiện tại</label>
                <div class="form-control-plaintext">
                  <span
                    class="badge"
                    :class="getStatusBadgeClass(currentStatus)"
                  >
                    {{ getStatusLabel(currentStatus) }}
                  </span>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Trạng thái mới <span class="text-danger">*</span></label>
                <select
                  v-model="selectedStatus"
                  class="form-select"
                  :class="{ 'is-invalid': errors.status }"
                  required
                >
                  <option value="">
                    -- Chọn trạng thái --
                  </option>
                  <option
                    v-for="status in statusOptions"
                    :key="status.value"
                    :value="status.value"
                  >
                    {{ status.label }}
                  </option>
                </select>
                <div
                  v-if="errors.status"
                  class="invalid-feedback"
                >
                  {{ errors.status }}
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Ghi chú</label>
                <textarea
                  v-model="notes"
                  class="form-control"
                  rows="3"
                  placeholder="Nhập ghi chú (tùy chọn)"
                />
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-secondary"
                :disabled="submitting"
                @click="hide"
              >
                Hủy
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="submitting || !selectedStatus"
              >
                <span
                  v-if="submitting"
                  class="spinner-border spinner-border-sm me-2"
                />
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
import { ref, reactive } from 'vue'
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
.shift-status-update-modal :global(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.shift-status-update-modal :global(.modal-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
}

.shift-status-update-modal :global(.modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    font-family: var(--font-family-sans);
}

.shift-status-update-modal :global(.modal-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.shift-status-update-modal :global(.modal-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
}

.shift-status-update-modal :global(.form-label) {
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.shift-status-update-modal :global(.form-control-plaintext) {
    padding: var(--spacing-2) 0;
}

.shift-status-update-modal :global(.badge) {
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    min-width: 120px;
    text-align: center;
    border: 2px solid;
}

.shift-status-update-modal :global(.badge.bg-info) {
    background: var(--color-info-soft, #d1ecf1);
    color: var(--color-info-dark, #0c5460);
    border-color: var(--color-info, #0dcaf0);
}

.shift-status-update-modal :global(.badge.bg-secondary) {
    background: var(--color-card-muted);
    color: var(--color-heading);
    border-color: var(--color-border);
}

.shift-status-update-modal :global(.badge.bg-primary) {
    background: var(--color-primary-soft);
    color: var(--color-primary);
    border-color: var(--color-primary);
}

.shift-status-update-modal :global(.badge.bg-success) {
    background: var(--color-success-soft, #d1e7dd);
    color: var(--color-success-dark, #0f5132);
    border-color: var(--color-success, #198754);
}

.shift-status-update-modal :global(.badge.bg-danger) {
    background: var(--color-soft-rose);
    color: var(--color-danger-dark, #a0281d);
    border-color: var(--color-danger);
}

.shift-status-update-modal :global(.form-select) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.shift-status-update-modal :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.shift-status-update-modal :global(.form-select.is-invalid) {
    border-color: var(--color-danger);
}

.shift-status-update-modal :global(.invalid-feedback) {
    color: var(--color-danger);
    font-size: var(--font-size-sm);
    font-family: var(--font-family-sans);
    margin-top: var(--spacing-1);
}

.shift-status-update-modal :global(.form-control) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.shift-status-update-modal :global(.form-control:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.shift-status-update-modal :global(.btn) {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.shift-status-update-modal :global(.btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.shift-status-update-modal :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.shift-status-update-modal :global(.btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.shift-status-update-modal :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}
</style>

