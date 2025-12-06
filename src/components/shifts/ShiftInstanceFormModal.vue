<template>
    <Teleport to="body">
        <div class="modal fade shift-instance-form-modal" ref="modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">{{ isEditMode ? 'Chỉnh sửa ca làm' : 'Tạo ca làm mới' }}</h5>
                        <button type="button" class="btn-close" @click="hide"></button>
                    </div>

                    <form @submit.prevent="handleSubmit">
                        <div class="modal-body">
                            <div class="mb-4">
                                <label class="form-label">Template ca làm <span class="text-danger">*</span></label>
                                <select
                                    class="form-select"
                                    v-model="form.templateId"
                                    :disabled="isEditMode"
                                    required
                                    @change="handleTemplateChange"
                                >
                                    <option :value="null">Chọn template</option>
                                    <option v-for="template in templates" :key="template.id" :value="template.id">
                                        {{ template.name }} ({{ formatTime(template.startTime) }} - {{ formatTime(template.endTime) }})
                                    </option>
                                </select>
                            </div>

                            <div class="row g-3 mb-4">
                                <div class="col-md-6">
                                    <label class="form-label">Ngày chính <span class="text-danger">*</span></label>
                                    <input type="date" class="form-control" v-model="form.primaryDate" required />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Thêm ngày khác</label>
                                    <div class="input-group">
                                        <input type="date" class="form-control" v-model="extraDateInput" />
                                        <button class="btn btn-outline-primary" type="button" @click="addExtraDate">Thêm</button>
                                    </div>
                                    <small class="text-muted">Có thể tạo nhiều ca từ cùng một template trong một lần.</small>
                                </div>
                            </div>

                            <div v-if="form.extraDates.length" class="mb-4">
                                <span class="badge badge-extra-date me-2" v-for="date in form.extraDates" :key="date">
                                    {{ date }}
                                    <button type="button" class="btn-close btn-close-sm ms-2" aria-label="X" @click="removeExtraDate(date)"></button>
                                </span>
                            </div>

                            <div class="row g-3 mb-4">
                                <div class="col-md-6">
                                    <label class="form-label">Giờ bắt đầu <span class="text-danger">*</span></label>
                                    <input type="time" class="form-control" v-model="form.startTime" required />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Giờ kết thúc <span class="text-danger">*</span></label>
                                    <input type="time" class="form-control" v-model="form.endTime" required />
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
import {computed, ref, watch, onMounted, onBeforeUnmount} from 'vue'
import {Modal} from 'bootstrap'
import {toast} from 'vue3-toastify'

const props = defineProps({
    templates: {type: Array, default: () => []},
    instance: {type: Object, default: null},
    submitting: {type: Boolean, default: false}
})

const emit = defineEmits(['submit'])

const modal = ref(null)
let modalInstance = null

const defaultForm = () => ({
    templateId: null,
    primaryDate: '',
    extraDates: [],
    startTime: '',
    endTime: '',
    notes: ''
})

const form = ref(defaultForm())
const extraDateInput = ref('')

const isEditMode = computed(() => Boolean(props.instance?.id))

const resetForm = () => {
    form.value = defaultForm()
    extraDateInput.value = ''
}

const populateFromInstance = () => {
    if (!props.instance) {
        resetForm()
        return
    }
    form.value = {
        templateId: props.instance.templateId ?? null,
        primaryDate: props.instance.shiftDate ?? '',
        extraDates: [],
        startTime: props.instance.startTime ?? '',
        endTime: props.instance.endTime ?? '',
        notes: props.instance.notes ?? ''
    }
}

watch(() => props.instance, populateFromInstance, {immediate: true})

const addExtraDate = () => {
    if (!extraDateInput.value) return
    if (extraDateInput.value === form.value.primaryDate) {
        toast.warning('Ngày bổ sung trùng với ngày chính.')
        return
    }
    if (form.value.extraDates.includes(extraDateInput.value)) {
        toast.warning('Ngày này đã được thêm.')
        return
    }
    form.value.extraDates.push(extraDateInput.value)
    extraDateInput.value = ''
}

const removeExtraDate = (date) => {
    form.value.extraDates = form.value.extraDates.filter((d) => d !== date)
}

const formatTime = (time) => {
    if (!time) return '--:--'
    return time.length === 5 ? time : time.slice(0, 5)
}

const handleTemplateChange = () => {
    if (isEditMode.value) return
    const template = props.templates.find((tpl) => tpl.id === form.value.templateId)
    if (template) {
        form.value.startTime = formatTime(template.startTime)
        form.value.endTime = formatTime(template.endTime)
    }
}

const validateForm = () => {
    if (!form.value.templateId) {
        toast.warning('Vui lòng chọn template ca làm.')
        return false
    }
    if (!form.value.primaryDate) {
        toast.warning('Vui lòng chọn ngày ca làm.')
        return false
    }
    if (!form.value.startTime || !form.value.endTime) {
        toast.warning('Vui lòng nhập giờ bắt đầu và kết thúc.')
        return false
    }
    if (form.value.startTime >= form.value.endTime) {
        toast.warning('Giờ bắt đầu phải trước giờ kết thúc.')
        return false
    }
    return true
}

const buildPayload = () => {
    const payload = {
        templateId: form.value.templateId,
        startTime: form.value.startTime,
        endTime: form.value.endTime,
        notes: form.value.notes || null
    }
    const allDates = [form.value.primaryDate, ...form.value.extraDates]
    if (allDates.length > 1 && !isEditMode.value) {
        payload.dates = allDates
    } else {
        payload.shiftDate = form.value.primaryDate
    }
    return payload
}

const handleSubmit = () => {
    if (!validateForm()) return
    const payload = buildPayload()
    emit('submit', payload)
}

const show = () => modalInstance?.show()
const hide = () => modalInstance?.hide()

defineExpose({show, hide})

onMounted(() => {
    modalInstance = new Modal(modal.value, {backdrop: 'static'})
})

onBeforeUnmount(() => {
    modalInstance?.dispose()
})
</script>

<style scoped>
.shift-instance-form-modal :global(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.shift-instance-form-modal :global(.modal-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
}

.shift-instance-form-modal :global(.modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

.shift-instance-form-modal :global(.modal-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.shift-instance-form-modal :global(.modal-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
}

.shift-instance-form-modal :global(.form-label) {
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.shift-instance-form-modal :global(.form-control),
.shift-instance-form-modal :global(.form-select) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.shift-instance-form-modal :global(.form-control:focus),
.shift-instance-form-modal :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.shift-instance-form-modal :global(.text-muted) {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    font-family: var(--font-family-sans);
}

.shift-instance-form-modal :global(.btn) {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.shift-instance-form-modal :global(.btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.shift-instance-form-modal :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.shift-instance-form-modal :global(.btn-outline-primary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.shift-instance-form-modal :global(.btn-outline-primary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.shift-instance-form-modal :global(.btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.shift-instance-form-modal :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.badge-extra-date {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-1) var(--spacing-2);
    background: var(--color-soft-primary);
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.btn-close-sm {
    width: 0.75rem;
    height: 0.75rem;
    opacity: 0.7;
}
</style>
