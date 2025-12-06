<template>
    <Teleport to="body">
        <div class="modal fade" ref="modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title">Tạo tài khoản nhân viên</h5>
                            <p class="text-muted mb-0">Nhập thông tin nhân viên mới, hệ thống sẽ tạo tài khoản đăng
                                nhập.</p>
                        </div>
                        <button type="button" class="btn-close" @click="hide"></button>
                    </div>

                    <form @submit.prevent="handleSubmit">
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Tên đăng nhập <span class="text-danger">*</span></label>
                                <input
                                    v-model.trim="form.username"
                                    type="text"
                                    class="form-control"
                                    :class="{'is-invalid': errors.username}"
                                    maxlength="50"
                                    autocomplete="off"
                                    :disabled="submitting"
                                />
                                <div class="invalid-feedback" v-if="errors.username">{{ errors.username }}</div>
                            </div>

                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label">Mật khẩu <span class="text-danger">*</span></label>
                                    <input
                                        v-model="form.password"
                                        type="password"
                                        class="form-control"
                                        :class="{'is-invalid': errors.password}"
                                        autocomplete="new-password"
                                        :disabled="submitting"
                                    />
                                    <div class="invalid-feedback" v-if="errors.password">{{ errors.password }}</div>
                                    <div class="form-text">Ít nhất 8 ký tự gồm chữ hoa, chữ thường, số và ký tự đặc
                                        biệt.
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Xác nhận mật khẩu <span
                                        class="text-danger">*</span></label>
                                    <input
                                        v-model="form.confirmPassword"
                                        type="password"
                                        class="form-control"
                                        :class="{'is-invalid': errors.confirmPassword}"
                                        autocomplete="new-password"
                                        :disabled="submitting"
                                    />
                                    <div class="invalid-feedback" v-if="errors.confirmPassword">
                                        {{ errors.confirmPassword }}
                                    </div>
                                </div>
                            </div>

                            <div class="mt-3">
                                <label class="form-label">Họ và tên <span class="text-danger">*</span></label>
                                <input
                                    v-model.trim="form.fullName"
                                    type="text"
                                    class="form-control"
                                    :class="{'is-invalid': errors.fullName}"
                                    maxlength="100"
                                    :disabled="submitting"
                                />
                                <div class="invalid-feedback" v-if="errors.fullName">{{ errors.fullName }}</div>
                            </div>

                            <div class="row g-3 mt-1">
                                <div class="col-md-6">
                                    <label class="form-label">Email <span class="text-danger">*</span></label>
                                    <input
                                        v-model.trim="form.email"
                                        type="email"
                                        class="form-control"
                                        :class="{'is-invalid': errors.email}"
                                        maxlength="100"
                                        :disabled="submitting"
                                    />
                                    <div class="invalid-feedback" v-if="errors.email">{{ errors.email }}</div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Số điện thoại <span class="text-danger">*</span></label>
                                    <input
                                        v-model.trim="form.phone"
                                        type="tel"
                                        class="form-control"
                                        :class="{'is-invalid': errors.phone}"
                                        placeholder="0901234567"f
                                        :disabled="submitting"
                                    />
                                    <div class="invalid-feedback" v-if="errors.phone">{{ errors.phone }}</div>
                                </div>
                            </div>

                            <div class="mt-3">
                                <label class="form-label">Phân quyền <span class="text-danger">*</span></label>
                                <div class="role-box">
                                    <div class="form-check" v-for="role in roles" :key="role.id">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            :id="`create-role-${role.id}`"
                                            :value="role.id"
                                            :checked="form.roleIds.includes(role.id)"
                                            @change="toggleRole(role.id)"
                                            :disabled="submitting"
                                        />
                                        <label class="form-check-label" :for="`create-role-${role.id}`">
                                            {{ role.name }}
                                        </label>
                                    </div>
                                </div>
                                <div class="text-danger small" v-if="errors.roleIds">{{ errors.roleIds }}</div>
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" @click="hide"
                                    :disabled="submitting">
                                Hủy
                            </button>
                            <button type="submit" class="btn btn-primary" :disabled="submitting">
                                <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                                Tạo tài khoản
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import {reactive, ref, watch, onMounted, onBeforeUnmount} from 'vue'
import {Modal} from 'bootstrap'
import {toast} from 'vue3-toastify'

const props = defineProps({
    roles: {
        type: Array,
        default: () => []
    },
    submitting: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['submit'])

const modal = ref(null)
let modalInstance = null

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,64}$/
const USERNAME_MIN = 3
const USERNAME_MAX = 50

const makeEmptyForm = () => ({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    phone: '',
    roleIds: []
})

const form = reactive(makeEmptyForm())
const errors = reactive({})

const resetForm = () => {
    Object.assign(form, makeEmptyForm())
    Object.keys(errors).forEach((key) => {
        errors[key] = ''
    })
}

const validate = () => {
    let valid = true
    Object.keys(errors).forEach((key) => {
        errors[key] = ''
    })

    if (!form.username) {
        errors.username = 'Tên đăng nhập là bắt buộc.'
        valid = false
    } else if (form.username.length < USERNAME_MIN || form.username.length > USERNAME_MAX) {
        errors.username = `Tên đăng nhập phải từ ${USERNAME_MIN}-${USERNAME_MAX} ký tự.`
        valid = false
    }

    if (!form.password) {
        errors.password = 'Mật khẩu là bắt buộc.'
        valid = false
    } else if (!PASSWORD_REGEX.test(form.password)) {
        errors.password = 'Mật khẩu phải gồm chữ hoa, chữ thường, số và ký tự đặc biệt (8-64 ký tự).'
        valid = false
    }

    if (!form.confirmPassword) {
        errors.confirmPassword = 'Vui lòng nhập lại mật khẩu.'
        valid = false
    } else if (form.confirmPassword !== form.password) {
        errors.confirmPassword = 'Mật khẩu xác nhận không khớp.'
        valid = false
    }

    if (!form.fullName) {
        errors.fullName = 'Họ và tên là bắt buộc.'
        valid = false
    }

    if (!form.email) {
        errors.email = 'Email là bắt buộc.'
        valid = false
    } else {
        const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/
        if (!emailRegex.test(form.email)) {
            errors.email = 'Email không hợp lệ.'
            valid = false
        }
    }

    if (!form.phone) {
        errors.phone = 'Số điện thoại là bắt buộc.'
        valid = false
    } else {
        const phoneRegex = /^(\+?84|0)\d{9}$/
        if (!phoneRegex.test(form.phone)) {
            errors.phone = 'Số điện thoại không hợp lệ.'
            valid = false
        }
    }

    if (!form.roleIds.length) {
        errors.roleIds = 'Phải chọn ít nhất một quyền.'
        valid = false
    }

    return valid
}

const handleSubmit = () => {
    if (!validate()) {
        return
    }
    emit('submit', {
        username: form.username.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        roleIds: [...form.roleIds]
    })
}

const toggleRole = (roleId) => {
    const index = form.roleIds.indexOf(roleId)
    if (index === -1) {
        form.roleIds.push(roleId)
    } else {
        form.roleIds.splice(index, 1)
    }
}

watch(() => props.roles, (newRoles) => {
    if (!newRoles?.length && form.roleIds.length) {
        form.roleIds = []
    }
})

const show = () => {
    resetForm()
    if (!props.roles.length) {
        toast.warning('Chưa tải được danh sách quyền. Vui lòng thử lại.')
    }
    modalInstance?.show()
}

const hide = () => modalInstance?.hide()

onMounted(() => {
    modalInstance = new Modal(modal.value, {backdrop: 'static'})
})

onBeforeUnmount(() => {
    modalInstance?.dispose()
})

defineExpose({show, hide})
</script>

<style scoped>
.role-box {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-3) var(--spacing-4);
    max-height: 220px;
    overflow-y: auto;
    background: var(--color-card-muted);
    transition: border-color var(--transition-base);
}

.role-box :global(.form-check) {
    margin-bottom: var(--spacing-2);
}

.role-box :global(.form-check-label) {
    font-size: var(--font-size-base);
    color: var(--color-heading);
    cursor: pointer;
    margin-left: var(--spacing-2);
    line-height: var(--line-height-normal);
    font-weight: var(--font-weight-normal);
    font-family: var(--font-family-sans);
}

.role-box :global(.form-check-input) {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    cursor: pointer;
    margin-top: 0.15rem;
    transition: all var(--transition-base);
}

.role-box :global(.form-check-input:checked) {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
}

.role-box :global(.form-check-input:focus) {
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

:deep(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
}

:deep(.modal-header) {
    padding: var(--spacing-6);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-4);
    flex-shrink: 0;
}

:deep(.modal-header .modal-title) {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-xl);
    color: var(--color-heading);
    margin: 0 0 var(--spacing-1) 0;
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-tight);
    font-family: var(--font-family-sans);
}

:deep(.modal-header .text-muted) {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
    line-height: var(--line-height-normal);
}

/* Sử dụng style chung từ base.css */

:deep(.modal-body) {
    padding: var(--spacing-6);
    color: var(--color-text);
    font-size: var(--font-size-base);
    line-height: var(--line-height-relaxed);
    flex: 1 1 auto;
    overflow-y: auto;
    max-height: calc(100vh - 200px);
}

:deep(.modal-body .form-label) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
    display: block;
}

:deep(.modal-body .form-control),
:deep(.modal-body .form-select) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    line-height: var(--line-height-normal);
    transition: all var(--transition-base);
    width: 100%;
    font-family: var(--font-family-sans);
}

:deep(.modal-body .form-control:focus),
:deep(.modal-body .form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

:deep(.modal-body .form-control:hover:not(:focus)),
:deep(.modal-body .form-select:hover:not(:focus)) {
    border-color: var(--color-border);
}

:deep(.modal-body .form-control.is-invalid),
:deep(.modal-body .form-select.is-invalid) {
    border-color: var(--color-danger);
}

:deep(.modal-body .form-control.is-invalid:focus),
:deep(.modal-body .form-select.is-invalid:focus) {
    outline: 2px solid var(--color-danger);
    outline-offset: 0;
    box-shadow: none;
}

:deep(.modal-body .invalid-feedback) {
    display: block;
    margin-top: var(--spacing-1);
    font-size: var(--font-size-xs);
    color: var(--color-danger);
}

:deep(.modal-body .form-text) {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
    line-height: var(--line-height-normal);
}

:deep(.modal-footer) {
    padding: var(--spacing-4) var(--spacing-6);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--spacing-2);
    flex-shrink: 0;
}

:deep(.modal-footer .btn) {
    font-size: var(--font-size-base);
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    transition: all var(--transition-base);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    font-weight: var(--font-weight-medium);
    line-height: var(--line-height-normal);
    font-family: var(--font-family-sans);
}

:deep(.modal-footer .btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

:deep(.modal-footer .btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

:deep(.modal-footer .btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

:deep(.modal-footer .btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

:deep(.modal-footer .btn i) {
    font-size: 18px;
    line-height: 1;
}
</style>
