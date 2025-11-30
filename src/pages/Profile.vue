<template>
    <div class="profile-page" data-aos="fade-up">
        <header class="profile-header">
            <div class="profile-header__title">
                <h2>Hồ sơ cá nhân</h2>
                <p>Cập nhật thông tin tài khoản, bảo mật và thiết lập cá nhân của bạn.</p>
            </div>
            <div class="profile-header__meta" v-if="profile">
                <span>Tham gia ngày {{ formatDate(profile.createdAt) }}</span>
                <span class="bullet" v-if="profile.createdAt && profile.updatedAt"/>
                <span v-if="profile.updatedAt">Cập nhật gần nhất {{ formatDateTime(profile.updatedAt) }}</span>
            </div>
        </header>

        <div class="profile-layout" v-if="profile">
            <section class="profile-card profile-card--main">
                <header class="profile-card__header">
                    <div class="profile-avatar">
                        <div class="profile-avatar__mask">
                            <img v-if="avatarPreview" :src="avatarPreview" alt="Avatar"/>
                            <div v-else class="profile-avatar__placeholder">{{ initials }}</div>
                        </div>
                        <div class="profile-avatar__actions">
                            <label class="btn btn-sm btn-outline-primary" :class="{'disabled': saving}" tabindex="0">
                                <i class="bi bi-cloud-arrow-up me-2"></i>Chọn ảnh
                                <input ref="avatarInputRef" type="file" accept="image/*" class="visually-hidden" :disabled="saving" @change="handleAvatarSelect"/>
                            </label>
                            <button v-if="avatarPreview" class="btn btn-sm btn-outline-secondary" type="button" :disabled="saving" @click="openAvatarEditor">
                                <i class="bi bi-pencil me-2"></i>Chỉnh sửa
                            </button>
                            <button v-if="avatarPreview" class="btn btn-sm btn-outline-danger" type="button" :disabled="saving" @click="handleAvatarRemove">
                                <i class="bi bi-trash me-2"></i>Xoá ảnh
                            </button>
                        </div>
                        <small class="profile-avatar__hint">Hỗ trợ JPG, JPEG, PNG, GIF, WEBP • Tối đa 5MB</small>
                    </div>
                    <div class="profile-summary">
                        <div class="profile-summary__top">
                            <div>
                                <h3>{{ form.fullName || profile.username }}</h3>
                                <p class="profile-summary__username">@{{ profile.username }}</p>
                            </div>
                            <span class="profile-status" :data-status="form.status">{{ translateStatus(form.status) }}</span>
                        </div>
                        <div class="profile-summary__roles">
                            <span v-for="role in profile.roles" :key="role.id" class="badge bg-soft">{{ role.name }}</span>
                        </div>
                    </div>
                </header>

                <Form 
                    class="profile-form" 
                    :validation-schema="profileSchema" 
                    @submit="handleSubmit"
                    v-slot="{ errors: formErrors, isSubmitting }"
                >
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Họ và tên <span class="text-danger">*</span></label>
                            <Field
                                name="fullName"
                                type="text"
                                class="form-control"
                                v-model.trim="form.fullName"
                                :class="{'is-invalid': formErrors.fullName}"
                                :disabled="saving || isSubmitting"
                                maxlength="120"
                            />
                            <ErrorMessage name="fullName" class="invalid-feedback" />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Số điện thoại <span class="text-danger">*</span></label>
                            <Field
                                name="phone"
                                type="tel"
                                class="form-control"
                                v-model.trim="form.phone"
                                :class="{'is-invalid': formErrors.phone}"
                                :disabled="saving || isSubmitting"
                                placeholder="0901234567"
                                maxlength="12"
                            />
                            <ErrorMessage name="phone" class="invalid-feedback" />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Email</label>
                            <Field
                                name="email"
                                type="email"
                                class="form-control"
                                v-model.trim="form.email"
                                :class="{'is-invalid': formErrors.email}"
                                :disabled="saving || isSubmitting"
                                maxlength="120"
                            />
                            <ErrorMessage name="email" class="invalid-feedback" />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Trạng thái tài khoản <span class="text-danger">*</span></label>
                            <Field
                                name="status"
                                as="select"
                                class="form-select"
                                v-model="form.status"
                                :class="{'is-invalid': formErrors.status}"
                                :disabled="saving || isSubmitting || !profileCanChangeStatus"
                            >
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="INACTIVE">INACTIVE</option>
                            </Field>
                            <ErrorMessage name="status" class="invalid-feedback" />
                        </div>
                        <div class="col-12">
                            <label class="form-label">Địa chỉ</label>
                            <Field
                                name="address"
                                as="textarea"
                                rows="3"
                                class="form-control"
                                v-model.trim="form.address"
                                :class="{'is-invalid': formErrors.address}"
                                :disabled="saving || isSubmitting"
                                maxlength="255"
                            />
                            <ErrorMessage name="address" class="invalid-feedback" />
                        </div>
                        <div class="col-12" v-if="isAdmin">
                            <label class="form-label">Quyền <span class="text-danger">*</span></label>
                            <div class="role-selection" :class="{'is-invalid': errors.roleIds}">
                                <div class="form-check" v-for="role in availableRoles" :key="role.id">
                                    <input 
                                        class="form-check-input" 
                                        type="checkbox" 
                                        :id="`role-${role.id}`" 
                                        :value="role.id" 
                                        :checked="form.roleIds.includes(role.id)" 
                                        :disabled="saving || isSubmitting" 
                                        @change="toggleRole(role.id)"
                                    >
                                    <label class="form-check-label" :for="`role-${role.id}`">{{ role.name }}</label>
                                </div>
                            </div>
                            <div v-if="errors.roleIds" class="invalid-feedback d-block">
                                {{ errors.roleIds }}
                            </div>
                        </div>
                    </div>

                    <div class="profile-form__actions">
                        <button class="btn btn-outline-secondary" type="button" :disabled="saving || isSubmitting" @click="resetForm">Đặt lại</button>
                        <button class="btn btn-primary" type="submit" :disabled="saving || isSubmitting">
                            <span v-if="saving || isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                            Lưu thay đổi
                        </button>
                    </div>
                </Form>
            </section>

            <section class="profile-card profile-card--security">
                <header class="profile-card__header">
                    <div>
                        <h4>Đổi mật khẩu</h4>
                        <p>Thay đổi mật khẩu để bảo vệ tài khoản của bạn.</p>
                    </div>
                </header>

                <Form 
                    class="profile-form" 
                    :validation-schema="passwordSchema" 
                    @submit="handlePasswordSubmit"
                    v-slot="{ errors: passwordFormErrors, isSubmitting: isPasswordSubmitting }"
                >
                    <div class="row g-3">
                        <div class="col-12">
                            <label class="form-label">Mật khẩu hiện tại <span class="text-danger">*</span></label>
                            <Field
                                name="currentPassword"
                                type="password"
                                class="form-control"
                                v-model.trim="passwordForm.currentPassword"
                                :class="{'is-invalid': passwordFormErrors.currentPassword}"
                                :disabled="passwordChanging || isPasswordSubmitting"
                                autocomplete="current-password"
                            />
                            <ErrorMessage name="currentPassword" class="invalid-feedback" />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Mật khẩu mới <span class="text-danger">*</span></label>
                            <Field
                                name="newPassword"
                                type="password"
                                class="form-control"
                                v-model.trim="passwordForm.newPassword"
                                :class="{'is-invalid': passwordFormErrors.newPassword}"
                                :disabled="passwordChanging || isPasswordSubmitting"
                                autocomplete="new-password"
                            />
                            <ErrorMessage name="newPassword" class="invalid-feedback" />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Xác nhận mật khẩu <span class="text-danger">*</span></label>
                            <Field
                                name="confirmationPassword"
                                type="password"
                                class="form-control"
                                v-model.trim="passwordForm.confirmationPassword"
                                :class="{'is-invalid': passwordFormErrors.confirmationPassword}"
                                :disabled="passwordChanging || isPasswordSubmitting"
                                autocomplete="new-password"
                            />
                            <ErrorMessage name="confirmationPassword" class="invalid-feedback" />
                        </div>
                        <div class="col-12">
                            <small class="text-muted">Mật khẩu mới tối thiểu 6 ký tự, nên bao gồm chữ hoa, chữ thường và số.</small>
                        </div>
                    </div>
                    <div class="profile-form__actions">
                        <button class="btn btn-outline-secondary" type="button" :disabled="passwordChanging || isPasswordSubmitting" @click="resetPasswordForm">Đặt lại</button>
                        <button class="btn btn-primary" type="submit" :disabled="passwordChanging || isPasswordSubmitting">
                            <span v-if="passwordChanging || isPasswordSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                            Đổi mật khẩu
                        </button>
                    </div>
                </Form>
            </section>
        </div>

        <LoadingState v-if="loading" text="Đang tải hồ sơ..." />
        <ErrorState
            v-else-if="!profile"
            title="Không thể tải hồ sơ"
            message="Không thể tải hồ sơ của bạn. Vui lòng thử lại."
            :show-retry="true"
            :retry-handler="() => profileStore.loadProfile(authStore.user?.id)"
        />

        <AvatarEditorModal ref="avatarEditorRef" @apply="handleAvatarEditorApply" @closed="handleAvatarEditorClosed"/>
    </div>
</template>

<script setup>
import {computed, onBeforeUnmount, onMounted, reactive, ref, watch} from 'vue'
import {useRouter} from 'vue-router'
import {storeToRefs} from 'pinia'
import {Form, Field, ErrorMessage} from 'vee-validate'
import * as yup from 'yup'
import {useAuthStore} from '@/store/auth'
import {useProfileStore} from '@/store/profile'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import AvatarEditorModal from '@/components/staff/AvatarEditorModal.vue'
import {uploadFile, deleteFile, extractFileName} from '@/api/fileService'
import {formatDate, formatDateTime} from '@/utils/formatters'
import {toast} from 'vue3-toastify'
import logger from '@/utils/logger'

const MAX_AVATAR_SIZE = 5 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()

const { profile, roles: availableRoles, loading, saving, passwordChanging, isAdmin } = storeToRefs(profileStore)

const form = reactive({
    fullName: '',
    phone: '',
    email: '',
    status: 'ACTIVE',
    roleIds: [],
    address: '',
    avatarUrl: '',
    removeAvatar: false
})

const passwordForm = reactive({
    currentPassword: '',
    newPassword: '',
    confirmationPassword: ''
})

// Yup validation schemas
const phoneRegex = /^(\+?84|0)\d{9}$/

const profileSchema = computed(() => {
    // Không validate roleIds trong schema vì nó không được bind vào Field
    // Sẽ validate thủ công trong handleSubmit
    return yup.object({
        fullName: yup.string().trim().required('Họ tên là bắt buộc.').max(120, 'Họ tên tối đa 120 ký tự.'),
        phone: yup
            .string()
            .trim()
            .required('Số điện thoại là bắt buộc.')
            .matches(phoneRegex, 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại 10 số, bắt đầu bằng 0 hoặc +84.'),
        email: yup
            .string()
            .trim()
            .nullable()
            .transform((value) => (value === '' ? null : value))
            .email('Email không hợp lệ.')
            .max(120, 'Email tối đa 120 ký tự.'),
        status: yup.string().oneOf(['ACTIVE', 'INACTIVE'], 'Trạng thái không hợp lệ.').required('Trạng thái là bắt buộc.'),
        address: yup
            .string()
            .trim()
            .nullable()
            .transform((value) => (value === '' ? null : value))
            .max(255, 'Địa chỉ tối đa 255 ký tự.')
    })
})

const passwordSchema = yup.object({
    currentPassword: yup.string().required('Vui lòng nhập mật khẩu hiện tại.'),
    newPassword: yup
        .string()
        .required('Vui lòng nhập mật khẩu mới.')
        .min(6, 'Mật khẩu mới tối thiểu 6 ký tự.'),
    confirmationPassword: yup
        .string()
        .required('Vui lòng nhập lại mật khẩu mới.')
        .oneOf([yup.ref('newPassword')], 'Mật khẩu xác nhận không khớp.')
})

const errors = reactive({})
const passwordErrors = reactive({})

const avatarInputRef = ref(null)
const avatarEditorRef = ref(null)
const avatarFile = ref(null)
const avatarPreview = ref('')
const originalAvatarUrl = ref('')
const avatarEditorPaused = ref(false)

const initials = computed(() => {
    const source = form.fullName || profile.value?.fullName || profile.value?.username || ''
    return source
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase())
        .slice(0, 2)
        .join('') || 'USER'
})

const profileCanChangeStatus = computed(() => isAdmin.value)

const syncFormFromProfile = () => {
    if (!profile.value) return
    form.fullName = profile.value.fullName || ''
    form.phone = profile.value.phone || ''
    form.email = profile.value.email || ''
    form.status = profile.value.status || 'ACTIVE'
    form.address = profile.value.address || ''
    form.avatarUrl = profile.value.avatarUrl || ''
    form.roleIds = Array.isArray(profile.value.roles) ? profile.value.roles.map((role) => role.id) : []
    form.removeAvatar = false
    avatarPreview.value = form.avatarUrl
    originalAvatarUrl.value = form.avatarUrl
    avatarFile.value = null
}

const resetForm = () => {
    syncFormFromProfile()
    clearErrors()
}

const clearErrors = () => {
    Object.keys(errors).forEach((key) => {
        errors[key] = ''
    })
}

const clearPasswordErrors = () => {
    Object.keys(passwordErrors).forEach((key) => {
        passwordErrors[key] = ''
    })
}

const toggleRole = (roleId) => {
    if (!isAdmin.value) return
    if (form.roleIds.includes(roleId)) {
        form.roleIds = form.roleIds.filter((id) => id !== roleId)
    } else {
        form.roleIds = [...form.roleIds, roleId]
    }
}

const handleAvatarSelect = (event) => {
    const file = event.target?.files?.[0]
    if (!file) return

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
        toast.error('Định dạng ảnh không được hỗ trợ. Hãy chọn JPG, JPEG, PNG, GIF hoặc WEBP.')
        event.target.value = ''
        return
    }

    if (file.size > MAX_AVATAR_SIZE) {
        toast.error('Kích thước ảnh tối đa 5MB. Vui lòng chọn ảnh khác.')
        event.target.value = ''
        return
    }

    if (avatarPreview.value && avatarPreview.value.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview.value)
    }

    avatarFile.value = file
    avatarPreview.value = URL.createObjectURL(file)
    form.removeAvatar = false
}

const handleAvatarRemove = () => {
    if (avatarFile.value) {
        if (avatarPreview.value && avatarPreview.value.startsWith('blob:')) {
            URL.revokeObjectURL(avatarPreview.value)
        }
        avatarFile.value = null
        avatarPreview.value = originalAvatarUrl.value || ''
        form.removeAvatar = !originalAvatarUrl.value
        return
    }

    if (!avatarPreview.value) return

    if (avatarPreview.value.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview.value)
    }

    avatarPreview.value = ''
    form.removeAvatar = true
}

const openAvatarEditor = () => {
    if (!avatarPreview.value) {
        toast.info('Chưa có ảnh nào để chỉnh sửa.')
        return
    }
    avatarEditorPaused.value = true
    avatarEditorRef.value?.open(avatarPreview.value)
}

const handleAvatarEditorApply = ({file, url}) => {
    if (!file || !url) return
    if (avatarPreview.value && avatarPreview.value.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview.value)
    }
    avatarFile.value = file
    avatarPreview.value = url
    form.removeAvatar = false
}

const handleAvatarEditorClosed = () => {
    if (!avatarEditorPaused.value) return
    avatarEditorPaused.value = false
}

const handleSubmit = async (values) => {
    // values từ vee-validate đã được validate
    const userId = authStore.user?.id
    if (!userId) {
        toast.error('Không xác định được người dùng hiện tại.')
        return
    }

    // Validate roleIds thủ công nếu là admin
    if (isAdmin.value) {
        if (!Array.isArray(form.roleIds) || form.roleIds.length === 0) {
            errors.roleIds = 'Phải chọn ít nhất một quyền.'
            toast.error('Phải chọn ít nhất một quyền.')
            return
        }
        // Đảm bảo roleIds là mảng số nguyên hợp lệ
        const validRoleIds = form.roleIds.filter(id => Number.isInteger(id) && id > 0)
        if (validRoleIds.length === 0) {
            errors.roleIds = 'Phải chọn ít nhất một quyền hợp lệ.'
            toast.error('Phải chọn ít nhất một quyền hợp lệ.')
            return
        }
        form.roleIds = validRoleIds
    }

    const previousAvatarUrl = originalAvatarUrl.value
    let uploadedFileName = ''

    try {
        let avatarUrl = form.avatarUrl?.trim() || null
        let removeFlag = form.removeAvatar && !avatarFile.value

        if (avatarFile.value) {
            const response = await uploadFile(avatarFile.value)
            avatarUrl = response?.fileUrl || null
            uploadedFileName = extractFileName(response?.fileUrl)
            removeFlag = false
        }

        // Merge values từ vee-validate với form state
        const payload = {
            fullName: (values?.fullName || form.fullName || '').trim(),
            phone: (values?.phone || form.phone || '').trim(),
            email: (values?.email || form.email || '')?.trim() || null,
            status: values?.status || form.status,
            roleIds: isAdmin.value ? [...form.roleIds] : (profile.value?.roles?.map(r => r.id) || []),
            avatarUrl: removeFlag ? null : avatarUrl,
            address: (values?.address || form.address || '')?.trim() || null,
            removeAvatar: removeFlag
        }

        const updated = await profileStore.updateProfile(userId, payload)
        toast.success('Đã cập nhật hồ sơ cá nhân.')
        
        // Clear errors sau khi thành công
        clearErrors()
        
        syncFormFromProfile()

        if ((avatarFile.value || removeFlag) && previousAvatarUrl) {
            const oldFileName = extractFileName(previousAvatarUrl)
            if (oldFileName && oldFileName !== uploadedFileName) {
                try {
                    await deleteFile(oldFileName)
                } catch (cleanupErr) {
                    // Ignore cleanup errors - không ảnh hưởng đến việc cập nhật profile
                    logger.warn('Failed to delete old avatar file:', cleanupErr)
                }
            }
        }

        avatarFile.value = null
        form.removeAvatar = false
    } catch (err) {
        logger.error('Failed to update profile:', err)
        mapApiErrors(err)
    }
}

const mapApiErrors = (err) => {
    clearErrors()
    const message = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi cập nhật hồ sơ.'
    
    // Hiển thị lỗi chung cho người dùng
    if (!err.response?.data?.message || !message.includes('Phone number already exists') && 
        !message.includes('Email already exists') && 
        !message.includes('must have at least one role') &&
        !message.includes('User not found')) {
        toast.error(message)
    }
    
    // Xử lý các lỗi cụ thể
    if (message.includes('Phone number already exists') || message.includes('Số điện thoại đã tồn tại')) {
        errors.phone = 'Số điện thoại đã tồn tại.'
        toast.error('Số điện thoại đã tồn tại. Vui lòng sử dụng số điện thoại khác.')
    } else if (message.includes('Email already exists') || message.includes('Email đã được sử dụng')) {
        errors.email = 'Email đã được sử dụng.'
        toast.error('Email đã được sử dụng. Vui lòng sử dụng email khác.')
    } else if (message.includes('must have at least one role') || message.includes('Phải chọn ít nhất một quyền')) {
        errors.roleIds = 'Phải chọn ít nhất một quyền.'
        toast.error('Phải chọn ít nhất một quyền.')
    } else if (message.includes('User not found') || message.includes('Không tìm thấy người dùng')) {
        toast.error('Không tìm thấy người dùng. Vui lòng đăng nhập lại.')
        router.push('/login')
        return
    } else if (message.includes('Full name') || message.includes('Họ tên')) {
        errors.fullName = 'Họ tên không hợp lệ.'
    } else if (message.includes('Phone') || message.includes('Số điện thoại')) {
        errors.phone = 'Số điện thoại không hợp lệ.'
    } else if (message.includes('Email')) {
        errors.email = 'Email không hợp lệ.'
    }
}

const handlePasswordSubmit = async (values) => {
    // values từ vee-validate đã được validate
    try {
        await profileStore.changePassword({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
            confirmationPassword: values.confirmationPassword
        })
        toast.success('Đã đổi mật khẩu thành công.')
        resetPasswordForm()
    } catch (err) {
        logger.error('Failed to change password:', err)
        const message = err.response?.data?.message || err.message || 'Không thể đổi mật khẩu.'
        
        // Hiển thị lỗi chung nếu không phải lỗi cụ thể
        let hasSpecificError = false
        
        if (message.includes('Incorrect current password') || message.includes('Mật khẩu hiện tại không đúng')) {
            passwordErrors.currentPassword = 'Mật khẩu hiện tại không đúng.'
            toast.error('Mật khẩu hiện tại không đúng.')
            hasSpecificError = true
        }
        if (message.includes('do not match') || message.includes('không khớp')) {
            passwordErrors.confirmationPassword = 'Mật khẩu xác nhận không khớp.'
            if (!hasSpecificError) {
                toast.error('Mật khẩu xác nhận không khớp.')
            }
            hasSpecificError = true
        }
        if (message.includes('cannot be the same as the old password') || message.includes('không được trùng')) {
            passwordErrors.newPassword = 'Mật khẩu mới không được trùng mật khẩu cũ.'
            if (!hasSpecificError) {
                toast.error('Mật khẩu mới không được trùng mật khẩu cũ.')
            }
            hasSpecificError = true
        }
        
        if (!hasSpecificError) {
            toast.error(message)
        }
    }
}

const resetPasswordForm = () => {
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmationPassword = ''
    clearPasswordErrors()
}

const handleGlobalClick = (event) => {
    if (!avatarInputRef.value) return
    if (!event.target || event.target === avatarInputRef.value) return
}

onMounted(async () => {
    if (!authStore.user?.id) {
        await authStore.checkAuth()
    }
    if (!authStore.user?.id) {
        router.push('/login')
        return
    }

    await profileStore.loadProfile(authStore.user.id)
    await profileStore.loadRoles()
    syncFormFromProfile()

    window.addEventListener('pointerdown', handleGlobalClick)
})

onBeforeUnmount(() => {
    window.removeEventListener('pointerdown', handleGlobalClick)
    if (avatarPreview.value && avatarPreview.value.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview.value)
    }
})

watch(profile, () => {
    syncFormFromProfile()
})

const translateStatus = (status) => {
    switch (status) {
        case 'ACTIVE':
            return 'ĐANG HOẠT ĐỘNG'
        case 'INACTIVE':
            return 'ĐÃ KHOÁ'
        default:
            return status
    }
}
</script>

<style scoped>
.profile-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding-bottom: 3rem;
}

.profile-header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.5rem;
    border-radius: 22px;
    border: 1px solid var(--color-border);
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-soft);
}

.profile-header__title h2 {
    font-weight: 700;
    color: var(--color-heading);
}

.profile-header__title p {
    margin: 0.35rem 0 0;
    color: var(--color-text-muted);
}

.profile-header__meta {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--color-text-muted);
    font-size: 0.9rem;
}

.profile-header__meta .bullet {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--color-text-muted);
}

.profile-layout {
    display: grid;
    grid-template-columns: minmax(0, 2.1fr) minmax(0, 1fr);
    gap: 1.5rem;
}

.profile-card {
    border-radius: 20px;
    border: 1px solid var(--color-border);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-soft);
    padding: 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    transition: border-color var(--transition-all), box-shadow var(--transition-all);
}

.profile-card__header {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
    padding-bottom: 1.5rem;
}


.profile-avatar {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-start;
}

.profile-avatar__mask {
    width: 104px;
    height: 104px;
    border-radius: 24px;
    overflow: hidden;
    border: 2px solid rgba(148, 163, 184, 0.35);
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(148, 163, 184, 0.12);
}

.profile-avatar__mask img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.profile-avatar__placeholder {
    font-weight: 700;
    font-size: 2rem;
    color: var(--color-primary);
}

.profile-avatar__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.profile-avatar__hint {
    font-size: 0.78rem;
    color: var(--color-text-muted);
}

.profile-summary {
    flex: 1;
    min-width: 220px;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.profile-summary__top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
}

.profile-summary__top h3 {
    font-weight: 700;
    color: var(--color-heading);
}

.profile-summary__username {
    margin: 0.2rem 0 0;
    color: var(--color-text-muted);
}

.profile-summary__roles {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.profile-status {
    padding: 0.5rem 0.9rem;
    border-radius: 999px;
    font-weight: 600;
    letter-spacing: 0.05em;
    font-size: 0.75rem;
    background: rgba(99, 102, 241, 0.12);
    color: var(--color-primary);
}

.profile-status[data-status="INACTIVE"] {
    background: rgba(239, 68, 68, 0.12);
    color: #dc2626;
}

.profile-form .form-label {
    font-weight: 600;
    color: var(--color-heading);
}

.profile-form__actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1rem;
}

.role-selection {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-3) var(--spacing-4);
    background: var(--color-card-muted);
    max-height: 220px;
    overflow-y: auto;
    display: grid;
    gap: var(--spacing-2);
    transition: border-color var(--transition-fast);
}

.role-selection.is-invalid {
    border-color: var(--color-danger);
}

@media (max-width: 992px) {
    .profile-layout {
        grid-template-columns: 1fr;
    }

    .profile-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .profile-header__meta {
        width: 100%;
        flex-wrap: wrap;
    }

    .profile-card__header {
        flex-direction: column;
    }

    .profile-summary {
        width: 100%;
    }
}

@media (max-width: 768px) {
    .profile-page {
        gap: var(--spacing-4);
        padding-bottom: var(--spacing-8);
    }

    .profile-header {
        padding: var(--spacing-4);
    }

    .profile-card {
        padding: var(--spacing-4);
    }

    .profile-avatar__actions {
        width: 100%;
    }

    .profile-avatar__actions .btn {
        flex: 1;
        min-width: 0;
    }

    .profile-form__actions {
        flex-direction: column-reverse;
    }

    .profile-form__actions .btn {
        width: 100%;
    }
}

</style>
