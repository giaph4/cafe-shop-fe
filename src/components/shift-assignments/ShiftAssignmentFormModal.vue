<template>
  <Teleport to="body">
    <div
      ref="modal"
      class="modal fade shift-assignment-form-modal"
      tabindex="-1"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ isEditMode ? 'Chỉnh sửa phân công' : 'Tạo phân công mới' }}
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
                  <label class="form-label">Ca làm <span class="text-danger">*</span></label>
                  <select
                    v-model.number="form.shiftId"
                    class="form-select"
                    :disabled="isEditMode"
                    required
                  >
                    <option :value="null">
                      Chọn ca làm
                    </option>
                    <option
                      v-for="opt in shiftOptions"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Nhân viên <span class="text-danger">*</span></label>
                  <select
                    v-model.number="form.userId"
                    class="form-select"
                    :disabled="isEditMode"
                    required
                  >
                    <option :value="null">
                      Chọn nhân viên
                    </option>
                    <option
                      v-for="opt in staffOptions"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-md-4">
                  <label class="form-label">Vai trò</label>
                  <input
                    v-model.trim="form.roleName"
                    type="text"
                    class="form-control"
                    maxlength="50"
                  >
                </div>
                <div class="col-md-4">
                  <label class="form-label">Giờ bắt đầu <span class="text-danger">*</span></label>
                  <input
                    v-model="form.plannedStart"
                    type="time"
                    class="form-control"
                    required
                    @change="recomputeMinutes"
                  >
                </div>
                <div class="col-md-4">
                  <label class="form-label">Giờ kết thúc <span class="text-danger">*</span></label>
                  <input
                    v-model="form.plannedEnd"
                    type="time"
                    class="form-control"
                    required
                    @change="recomputeMinutes"
                  >
                </div>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-md-4">
                  <label class="form-label">Số phút <span class="text-danger">*</span></label>
                  <input
                    v-model.number="form.plannedMinutes"
                    type="number"
                    class="form-control"
                    min="15"
                    step="5"
                    required
                  >
                </div>
                <div class="col-md-4">
                  <label class="form-label">Lương giờ</label>
                  <input
                    v-model.number="form.hourlyRate"
                    type="number"
                    class="form-control"
                    min="0"
                    step="1000"
                  >
                </div>
                <div class="col-md-4">
                  <label class="form-label">Phụ cấp cố định</label>
                  <input
                    v-model.number="form.fixedAllowance"
                    type="number"
                    class="form-control"
                    min="0"
                    step="1000"
                  >
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Ghi chú</label>
                <textarea
                  v-model.trim="form.notes"
                  class="form-control"
                  rows="3"
                  maxlength="500"
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
                {{ submitting ? 'Đang lưu...' : isEditMode ? 'Cập nhật' : 'Tạo mới' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Modal } from 'bootstrap'

const props = defineProps({
    assignment: { type: Object, default: null },
    shiftOptions: { type: Array, default: () => [] },
    staffOptions: { type: Array, default: () => [] },
    submitting: { type: Boolean, default: false }
})

const emit = defineEmits(['submit'])

const modal = ref(null)
let modalInstance = null

const defaultForm = () => ({
    shiftId: null,
    userId: null,
    roleName: '',
    plannedStart: '',
    plannedEnd: '',
    plannedMinutes: 0,
    hourlyRate: null,
    fixedAllowance: null,
    notes: ''
})

const form = ref(defaultForm())

const isEditMode = computed(() => Boolean(props.assignment?.id))

const resetForm = () => {
    form.value = defaultForm()
}

const populateFromAssignment = () => {
    if (!props.assignment) {
        resetForm()
        return
    }
    form.value = {
        shiftId: props.assignment.shiftId ?? null,
        userId: props.assignment.userId ?? null,
        roleName: props.assignment.roleName ?? '',
        plannedStart: props.assignment.plannedStart ?? '',
        plannedEnd: props.assignment.plannedEnd ?? '',
        plannedMinutes: props.assignment.plannedMinutes ?? 0,
        hourlyRate: props.assignment.hourlyRate ?? null,
        fixedAllowance: props.assignment.fixedAllowance ?? null,
        notes: props.assignment.notes ?? ''
    }
}

watch(() => props.assignment, populateFromAssignment, { immediate: true })

const recomputeMinutes = () => {
    if (!form.value.plannedStart || !form.value.plannedEnd) return
    const start = new Date(`2000-01-01T${form.value.plannedStart}`)
    const end = new Date(`2000-01-01T${form.value.plannedEnd}`)
    if (end > start) {
        const diffMs = end - start
        const diffMinutes = Math.floor(diffMs / 60000)
        form.value.plannedMinutes = diffMinutes
    }
}

const validateForm = () => {
    if (!form.value.shiftId) {
        return { valid: false, message: 'Vui lòng chọn ca làm.' }
    }
    if (!form.value.userId) {
        return { valid: false, message: 'Vui lòng chọn nhân viên.' }
    }
    if (!form.value.plannedStart || !form.value.plannedEnd) {
        return { valid: false, message: 'Vui lòng nhập giờ bắt đầu và kết thúc.' }
    }
    if (form.value.plannedStart >= form.value.plannedEnd) {
        return { valid: false, message: 'Giờ bắt đầu phải trước giờ kết thúc.' }
    }
    if (!form.value.plannedMinutes || form.value.plannedMinutes < 15) {
        return { valid: false, message: 'Số phút phải tối thiểu 15 phút.' }
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
        shiftId: form.value.shiftId,
        userId: form.value.userId,
        roleName: form.value.roleName || null,
        plannedStart: form.value.plannedStart,
        plannedEnd: form.value.plannedEnd,
        plannedMinutes: form.value.plannedMinutes,
        hourlyRate: form.value.hourlyRate || null,
        fixedAllowance: form.value.fixedAllowance || null,
        notes: form.value.notes || null
    }
    emit('submit', payload)
}

const show = () => modalInstance?.show()
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
:global(.shift-assignment-form-modal .modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

:global(.shift-assignment-form-modal .modal-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
}

:global(.shift-assignment-form-modal .modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

:global(.shift-assignment-form-modal .modal-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

:global(.shift-assignment-form-modal .form-label) {
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

:global(.shift-assignment-form-modal .form-select),
:global(.shift-assignment-form-modal .form-control) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

:global(.shift-assignment-form-modal .form-select:focus),
:global(.shift-assignment-form-modal .form-control:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

:global(.shift-assignment-form-modal .form-select:disabled),
:global(.shift-assignment-form-modal .form-control:disabled) {
    background: var(--color-card-muted);
    opacity: 0.7;
}

:global(.shift-assignment-form-modal .modal-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
}

:global(.shift-assignment-form-modal .modal-footer .btn) {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

:global(.shift-assignment-form-modal .modal-footer .btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

:global(.shift-assignment-form-modal .modal-footer .btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

:global(.shift-assignment-form-modal .modal-footer .btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

:global(.shift-assignment-form-modal .modal-footer .btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}
</style>
