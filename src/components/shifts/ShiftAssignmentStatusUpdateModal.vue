<template>
  <Teleport to="body">
    <div
      ref="modalRef"
      class="modal fade shift-assignment-status-modal"
      tabindex="-1"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Cập nhật trạng thái phân công
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="hide"
            />
          </div>
          <form @submit.prevent="handleSubmit">
            <div class="modal-body">
              <div class="mb-4">
                <label class="status-label">TRẠNG THÁI</label>
                <div class="status-display">
                  <span
                    class="badge status-badge"
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
import { ASSIGNMENT_STATUSES } from '@/api/shiftService'

const props = defineProps({
    statusOptions: {
        type: Array,
        default: () => ASSIGNMENT_STATUSES
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
        case 'SCHEDULED':
            return 'bg-info text-dark'
        case 'CONFIRMED':
            return 'bg-primary'
        case 'IN_PROGRESS':
            return 'bg-warning text-dark'
        case 'COMPLETED':
            return 'bg-success'
        case 'CANCELLED':
            return 'bg-danger'
        default:
            return 'bg-secondary'
    }
}

const show = (assignment) => {
    if (!assignment) return
    currentStatus.value = assignment.status || ''
    selectedStatus.value = assignment.status || ''
    notes.value = assignment.notes || ''
    errors.status = ''
    modalInstance?.show()
}

const hide = () => {
    modalInstance?.hide()
    setTimeout(() => {
        currentStatus.value = ''
        selectedStatus.value = ''
        notes.value = ''
        errors.status = ''
    }, 300)
}

const handleSubmit = () => {
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
:global(.shift-assignment-status-modal .modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

:global(.shift-assignment-status-modal .modal-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
}

:global(.shift-assignment-status-modal .modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

:global(.shift-assignment-status-modal .modal-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

:global(.shift-assignment-status-modal .form-label) {
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

:global(.shift-assignment-status-modal .form-select),
:global(.shift-assignment-status-modal .form-control) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

:global(.shift-assignment-status-modal .form-select:focus),
:global(.shift-assignment-status-modal .form-control:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

:global(.shift-assignment-status-modal .form-select.is-invalid) {
    border-color: var(--color-danger);
}

:global(.shift-assignment-status-modal .invalid-feedback) {
    color: var(--color-danger);
    font-size: var(--font-size-sm);
    font-family: var(--font-family-sans);
}

.status-label {
    display: block;
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-sm);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.status-display {
    padding: var(--spacing-2) 0;
    display: flex;
    align-items: center;
}

:global(.shift-assignment-status-modal .badge.status-badge) {
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    display: inline-block;
    min-width: 120px;
    text-align: center;
}

:global(.shift-assignment-status-modal .badge.bg-info) {
    background: var(--color-soft-indigo);
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
}

:global(.shift-assignment-status-modal .badge.bg-primary) {
    background: var(--color-primary);
    color: var(--color-text-inverse);
    border: 1px solid var(--color-primary);
}

:global(.shift-assignment-status-modal .badge.bg-warning) {
    background: var(--color-soft-amber);
    color: var(--color-warning);
    border: 1px solid var(--color-warning);
}

:global(.shift-assignment-status-modal .badge.bg-success) {
    background: var(--color-soft-emerald);
    color: var(--color-success);
    border: 1px solid var(--color-success);
}

:global(.shift-assignment-status-modal .badge.bg-danger) {
    background: var(--color-soft-rose);
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
}

:global(.shift-assignment-status-modal .badge.bg-secondary) {
    background: var(--color-card-muted);
    color: var(--color-heading);
    border: 1px solid var(--color-border);
}

:global(.shift-assignment-status-modal .modal-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
}

:global(.shift-assignment-status-modal .modal-footer .btn) {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

:global(.shift-assignment-status-modal .modal-footer .btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

:global(.shift-assignment-status-modal .modal-footer .btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

:global(.shift-assignment-status-modal .modal-footer .btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

:global(.shift-assignment-status-modal .modal-footer .btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}
</style>

