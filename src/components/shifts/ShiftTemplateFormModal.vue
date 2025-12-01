<template>
    <Teleport to="body">
        <div class="modal fade" ref="modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">{{ props.template ? 'Cập nhật ca mẫu' : 'Tạo ca mẫu mới' }}</h5>
                        <button type="button" class="btn-close" @click="hide"></button>
                    </div>

                    <div class="modal-body">
                        <form class="row g-3" @submit.prevent="handleSubmit">
                            <div class="col-md-6">
                                <label class="form-label">Tên ca <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" v-model.trim="form.name" maxlength="120" placeholder="Ví dụ: Ca sáng" />
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Vai trò yêu cầu</label>
                                <div class="roles-input form-control" @click="focusRoleInput">
                                    <span v-for="role in form.roles" :key="role" class="role-chip">
                                        {{ role }}
                                        <button type="button" class="btn-close btn-close-white btn-close-sm" @click.stop="removeRole(role)"></button>
                                    </span>
                                    <input
                                        ref="roleInputRef"
                                        v-model="form.rolesInput"
                                        type="text"
                                        class="role-entry"
                                        placeholder="Nhập và nhấn Enter"
                                        @keydown.enter.prevent="appendRole"
                                        @keydown.",".prevent="appendRole"
                                        @blur="appendRole"
                                    />
                                </div>
                            </div>
                            <div class="col-12">
                                <label class="form-label">Mô tả</label>
                                <textarea class="form-control" rows="2" v-model.trim="form.description" maxlength="1000" placeholder="Giới thiệu ngắn về ca làm"></textarea>
                            </div>
                            <div class="col-md-3 col-sm-6">
                                <label class="form-label">Giờ bắt đầu <span class="text-danger">*</span></label>
                                <input type="time" class="form-control" v-model="form.startTime" />
                            </div>
                            <div class="col-md-3 col-sm-6">
                                <label class="form-label">Giờ kết thúc <span class="text-danger">*</span></label>
                                <input type="time" class="form-control" v-model="form.endTime" />
                            </div>
                            <div class="col-md-3 col-sm-6">
                                <label class="form-label">Lương giờ mặc định</label>
                                <input type="number" class="form-control" min="0" step="1000" v-model.number="form.defaultHourlyRate" placeholder="VD: 35000" />
                            </div>
                            <div class="col-md-3 col-sm-6">
                                <label class="form-label">Phụ cấp cố định</label>
                                <input type="number" class="form-control" min="0" step="1000" v-model.number="form.defaultFixedAllowance" placeholder="VD: 20000" />
                            </div>
                        </form>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" @click="hide">Hủy</button>
                        <button type="button" class="btn btn-primary" :disabled="props.submitting" @click="handleSubmit">
                            <span v-if="props.submitting" class="spinner-border spinner-border-sm me-2"></span>
                            {{ props.template ? 'Cập nhật' : 'Tạo ca mẫu' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import {onBeforeUnmount, onMounted, reactive, ref, watch} from 'vue'
import {Modal} from 'bootstrap'
import {toast} from 'vue3-toastify'

const props = defineProps({
    template: {
        type: Object,
        default: null
    },
    submitting: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['submit'])

const modal = ref(null)
let modalInstance = null
const roleInputRef = ref(null)

const form = reactive({
    name: '',
    description: '',
    startTime: '',
    endTime: '',
    roles: [],
    rolesInput: '',
    defaultHourlyRate: null,
    defaultFixedAllowance: null
})

const normalizeTime = (value) => {
    if (!value) return ''
    return value.length > 5 ? value.slice(0, 5) : value
}

const resetForm = () => {
    form.name = ''
    form.description = ''
    form.startTime = ''
    form.endTime = ''
    form.roles = []
    form.rolesInput = ''
    form.defaultHourlyRate = null
    form.defaultFixedAllowance = null
}

const hydrateForm = (template) => {
    if (!template) {
        resetForm()
        return
    }
    form.name = template.name || ''
    form.description = template.description || ''
    form.startTime = normalizeTime(template.startTime)
    form.endTime = normalizeTime(template.endTime)
    form.roles = Array.isArray(template.requiredRoles) ? [...template.requiredRoles] : []
    form.rolesInput = ''
    form.defaultHourlyRate = template.defaultHourlyRate ?? null
    form.defaultFixedAllowance = template.defaultFixedAllowance ?? null
}

watch(() => props.template, (value) => {
    hydrateForm(value)
}, {immediate: true})

const focusRoleInput = () => {
    roleInputRef.value?.focus()
}

const sanitizeRole = (value) => value?.trim().toUpperCase()

const appendRole = () => {
    const candidate = sanitizeRole(form.rolesInput)
    if (candidate && !form.roles.includes(candidate)) {
        form.roles.push(candidate)
    }
    form.rolesInput = ''
}

const removeRole = (role) => {
    form.roles = form.roles.filter((item) => item !== role)
}

const validateForm = () => {
    if (!form.name) {
        toast.warning('Vui lòng nhập tên ca mẫu.')
        return false
    }
    if (!form.startTime || !form.endTime) {
        toast.warning('Vui lòng chọn giờ bắt đầu và kết thúc.')
        return false
    }
    if (form.startTime >= form.endTime) {
        toast.warning('Giờ bắt đầu phải trước giờ kết thúc.')
        return false
    }
    return true
}

const buildPayload = () => ({
    name: form.name,
    description: form.description || null,
    startTime: form.startTime,
    endTime: form.endTime,
    requiredRoles: form.roles,
    defaultHourlyRate: form.defaultHourlyRate ?? null,
    defaultFixedAllowance: form.defaultFixedAllowance ?? null
})

const handleSubmit = () => {
    appendRole()
    if (!validateForm()) return
    emit('submit', buildPayload())
}

const show = () => {
    hydrateForm(props.template)
    modalInstance?.show()
}

const hide = () => modalInstance?.hide()

defineExpose({show, hide})

onMounted(() => {
    modalInstance = new Modal(modal.value, {backdrop: 'static'})
})

onBeforeUnmount(() => modalInstance?.dispose())
</script>

<style scoped>
.roles-input {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    min-height: 2.6rem;
    flex-wrap: wrap;
    cursor: text;
    padding: 0.45rem 0.6rem;
}

.role-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: var(--color-primary);
    color: white;
    border-radius: var(--radius-full);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
}

.btn-close-sm {
    width: 0.55rem;
    height: 0.55rem;
    opacity: 0.7;
}

.role-entry {
    border: none;
    outline: none;
    flex: 1;
    min-width: 120px;
}
</style>
