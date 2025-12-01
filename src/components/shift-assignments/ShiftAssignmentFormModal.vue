<template>
    <Teleport to="body">
        <div class="modal fade" ref="modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">{{ isEditMode ? 'Chỉnh sửa phân công' : 'Tạo phân công mới' }}</h5>
                        <button type="button" class="btn-close" @click="hide"></button>
                    </div>

                    <form @submit.prevent="handleSubmit">
                        <div class="modal-body">
                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label">Ca làm <span class="text-danger">*</span></label>
                                    <select
                                        class="form-select"
                                        v-model.number="form.shiftId"
                                        :disabled="isEditMode"
                                        required
                                    >
                                        <option :value="null">Chọn ca làm</option>
                                        <option v-for="opt in shiftOptions" :key="opt.value" :value="opt.value">
                                            {{ opt.label }}
                                        </option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Nhân viên <span class="text-danger">*</span></label>
                                    <select
                                        class="form-select"
                                        v-model.number="form.userId"
                                        :disabled="isEditMode"
                                        required
                                    >
                                        <option :value="null">Chọn nhân viên</option>
                                        <option v-for="opt in staffOptions" :key="opt.value" :value="opt.value">
                                            {{ opt.label }}
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div class="row g-3 mb-3">
                                <div class="col-md-4">
                                    <label class="form-label">Vai trò</label>
                                    <input type="text" class="form-control" v-model.trim="form.roleName" maxlength="50" />
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Giờ bắt đầu <span class="text-danger">*</span></label>
                                    <input type="time" class="form-control" v-model="form.plannedStart" required @change="recomputeMinutes" />
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Giờ kết thúc <span class="text-danger">*</span></label>
                                    <input type="time" class="form-control" v-model="form.plannedEnd" required @change="recomputeMinutes" />
                                </div>
                            </div>

                            <div class="row g-3 mb-3">
                                <div class="col-md-4">
                                    <label class="form-label">Số phút <span class="text-danger">*</span></label>
                                    <input type="number" class="form-control" min="15" step="5" v-model.number="form.plannedMinutes" required />
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Lương giờ</label>
                                    <input type="number" class="form-control" min="0" step="1000" v-model.number="form.hourlyRate" />
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Phụ cấp cố định</label>
                                    <input type="number" class="form-control" min="0" step="1000" v-model.number="form.fixedAllowance" />
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Ghi chú</label>
                                <textarea class="form-control" rows="3" v-model.trim="form.notes" maxlength="500"></textarea>
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" @click="hide">Hủy</button>
                            <button type="submit" class="btn btn-primary" :disabled="submitting">
                                <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
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

