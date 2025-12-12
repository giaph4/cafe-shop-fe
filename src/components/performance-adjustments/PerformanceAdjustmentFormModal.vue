<template>
  <Teleport to="body">
    <div
      ref="modal"
      class="modal fade performance-adjustment-form-modal"
      tabindex="-1"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Tạo điều chỉnh hiệu suất mới
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="hide"
            />
          </div>

          <form @submit.prevent="handleSubmit">
            <div class="modal-body">
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Phân công <span class="text-danger">*</span></label>
                  <select
                    v-model.number="form.assignmentId"
                    class="form-select"
                    required
                  >
                    <option :value="null">
                      Chọn phân công
                    </option>
                    <option
                      v-for="opt in assignmentOptions"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Loại <span class="text-danger">*</span></label>
                  <select
                    v-model="form.type"
                    class="form-select"
                    required
                  >
                    <option
                      v-for="opt in typeOptions"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Số tiền <span class="text-danger">*</span></label>
                  <input
                    v-model.number="form.amount"
                    type="number"
                    class="form-control"
                    min="0"
                    step="1000"
                    placeholder="VD: 50000"
                    required
                  >
                </div>
                <div class="col-md-6">
                  <label class="form-label">Ngày hiệu lực</label>
                  <input
                    v-model="form.effectiveAt"
                    type="datetime-local"
                    class="form-control"
                  >
                  <small class="text-muted">Để trống sẽ dùng thời gian hiện tại</small>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Lý do</label>
                <textarea
                  v-model.trim="form.reason"
                  class="form-control"
                  rows="3"
                  maxlength="500"
                  placeholder="Nhập lý do điều chỉnh (tùy chọn)"
                />
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="hide"
              >
                Hủy
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="submitting"
              >
                <span
                  v-if="submitting"
                  class="spinner-border spinner-border-sm me-2"
                />
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

<style scoped>
:global(.performance-adjustment-form-modal .modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

:global(.performance-adjustment-form-modal .modal-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
}

:global(.performance-adjustment-form-modal .modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

:global(.performance-adjustment-form-modal .modal-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

:global(.performance-adjustment-form-modal .form-label) {
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

:global(.performance-adjustment-form-modal .form-select),
:global(.performance-adjustment-form-modal .form-control) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

:global(.performance-adjustment-form-modal .form-select:focus),
:global(.performance-adjustment-form-modal .form-control:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

:global(.performance-adjustment-form-modal .text-muted) {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

:global(.performance-adjustment-form-modal .modal-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
}

:global(.performance-adjustment-form-modal .modal-footer .btn) {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

:global(.performance-adjustment-form-modal .modal-footer .btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

:global(.performance-adjustment-form-modal .modal-footer .btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

:global(.performance-adjustment-form-modal .modal-footer .btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

:global(.performance-adjustment-form-modal .modal-footer .btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}
</style>

