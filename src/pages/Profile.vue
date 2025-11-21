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

                <form class="profile-form" @submit.prevent="handleSubmit">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Họ và tên <span class="text-danger">*</span></label>
                            <input v-model.trim="form.fullName" type="text" class="form-control" :class="{'is-invalid': errors.fullName}" :disabled="saving" maxlength="120"/>
                            <div class="invalid-feedback" v-if="errors.fullName">{{ errors.fullName }}</div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Số điện thoại <span class="text-danger">*</span></label>
                            <input v-model.trim="form.phone" type="tel" class="form-control" :class="{'is-invalid': errors.phone}" :disabled="saving" placeholder="0901234567" maxlength="12"/>
                            <div class="invalid-feedback" v-if="errors.phone">{{ errors.phone }}</div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Email</label>
                            <input v-model.trim="form.email" type="email" class="form-control" :class="{'is-invalid': errors.email}" :disabled="saving" maxlength="120"/>
                            <div class="invalid-feedback" v-if="errors.email">{{ errors.email }}</div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Trạng thái tài khoản <span class="text-danger">*</span></label>
                            <select v-model="form.status" class="form-select" :class="{'is-invalid': errors.status}" :disabled="saving || !profileCanChangeStatus">
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="INACTIVE">INACTIVE</option>
                            </select>
                            <div class="invalid-feedback" v-if="errors.status">{{ errors.status }}</div>
                        </div>
                        <div class="col-12">
                            <label class="form-label">Địa chỉ</label>
                            <textarea v-model.trim="form.address" rows="3" class="form-control" :class="{'is-invalid': errors.address}" :disabled="saving" maxlength="255"></textarea>
                            <div class="invalid-feedback" v-if="errors.address">{{ errors.address }}</div>
                        </div>
                        <div class="col-12" v-if="isAdmin">
                            <label class="form-label">Quyền <span class="text-danger">*</span></label>
                            <div class="role-selection" :class="{'is-invalid': errors.roleIds}">
                                <div class="form-check" v-for="role in availableRoles" :key="role.id">
                                    <input class="form-check-input" type="checkbox" :id="`role-${role.id}`" :value="role.id" :checked="form.roleIds.includes(role.id)" :disabled="saving" @change="toggleRole(role.id)">
                                    <label class="form-check-label" :for="`role-${role.id}`">{{ role.name }}</label>
                                </div>
                            </div>
                            <div class="invalid-feedback" v-if="errors.roleIds">{{ errors.roleIds }}</div>
                        </div>
                    </div>

                    <div class="profile-form__actions">
                        <button class="btn btn-outline-secondary" type="button" :disabled="saving" @click="resetForm">Đặt lại</button>
                        <button class="btn btn-primary" type="submit" :disabled="saving">
                            <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                            Lưu thay đổi
                        </button>
                    </div>
                </form>
            </section>

            <section class="profile-card profile-card--security">
                <header class="profile-card__header">
                    <div>
                        <h4>Đổi mật khẩu</h4>
                        <p>Thay đổi mật khẩu để bảo vệ tài khoản của bạn.</p>
                    </div>
                </header>

                <form class="profile-form" @submit.prevent="handlePasswordSubmit">
                    <div class="row g-3">
                        <div class="col-12">
                            <label class="form-label">Mật khẩu hiện tại <span class="text-danger">*</span></label>
                            <input v-model.trim="passwordForm.currentPassword" type="password" class="form-control" :class="{'is-invalid': passwordErrors.currentPassword}" :disabled="passwordChanging" autocomplete="current-password"/>
                            <div class="invalid-feedback" v-if="passwordErrors.currentPassword">{{ passwordErrors.currentPassword }}</div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Mật khẩu mới <span class="text-danger">*</span></label>
                            <input v-model.trim="passwordForm.newPassword" type="password" class="form-control" :class="{'is-invalid': passwordErrors.newPassword}" :disabled="passwordChanging" autocomplete="new-password"/>
                            <div class="invalid-feedback" v-if="passwordErrors.newPassword">{{ passwordErrors.newPassword }}</div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Xác nhận mật khẩu <span class="text-danger">*</span></label>
                            <input v-model.trim="passwordForm.confirmationPassword" type="password" class="form-control" :class="{'is-invalid': passwordErrors.confirmationPassword}" :disabled="passwordChanging" autocomplete="new-password"/>
                            <div class="invalid-feedback" v-if="passwordErrors.confirmationPassword">{{ passwordErrors.confirmationPassword }}</div>
                        </div>
                        <div class="col-12">
                            <small class="text-muted">Mật khẩu mới tối thiểu 6 ký tự, nên bao gồm chữ hoa, chữ thường và số.</small>
                        </div>
                    </div>
                    <div class="profile-form__actions">
                        <button class="btn btn-outline-secondary" type="button" :disabled="passwordChanging" @click="resetPasswordForm">Đặt lại</button>
                        <button class="btn btn-primary" type="submit" :disabled="passwordChanging">
                            <span v-if="passwordChanging" class="spinner-border spinner-border-sm me-2"></span>
                            Đổi mật khẩu
                        </button>
                    </div>
                </form>
            </section>
        </div>

        <EmptyState v-if="!loading && !profile" title="Không có dữ liệu" message="Không thể tải hồ sơ của bạn. Vui lòng thử lại."/>
        <div v-if="loading" class="profile-loading">
            <div class="spinner-border text-primary"></div>
            <p>Đang tải hồ sơ...</p>
        </div>

        <AvatarEditorModal ref="avatarEditorRef" @apply="handleAvatarEditorApply" @closed="handleAvatarEditorClosed"/>
    </div>
</template>

<script setup>
import {computed, onBeforeUnmount, onMounted, reactive, ref, watch} from 'vue'
import {useRouter} from 'vue-router'
import {storeToRefs} from 'pinia'
import {useAuthStore} from '@/store/auth'
import {useProfileStore} from '@/store/profile'
import EmptyState from '@/components/common/EmptyState.vue'
import AvatarEditorModal from '@/components/staff/AvatarEditorModal.vue'
import {uploadFile, deleteFile, extractFileName} from '@/api/fileService'
import {formatDate, formatDateTime} from '@/utils/formatters'
import {toast} from 'vue3-toastify'

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

const validateForm = () => {
    clearErrors()
    let valid = true

    if (!form.fullName) {
        errors.fullName = 'Họ tên là bắt buộc.'
        valid = false
    }

    if (!form.phone) {
        errors.phone = 'Số điện thoại là bắt buộc.'
        valid = false
    } else if (!/^(\+?84|0)\d{9}$/.test(form.phone)) {
        errors.phone = 'Số điện thoại không hợp lệ.'
        valid = false
    }

    if (form.email) {
        const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/
        if (!emailRegex.test(form.email)) {
            errors.email = 'Email không hợp lệ.'
            valid = false
        }
    }

    if (!form.status) {
        errors.status = 'Trạng thái là bắt buộc.'
        valid = false
    }

    if (form.address && form.address.length > 255) {
        errors.address = 'Địa chỉ tối đa 255 ký tự.'
        valid = false
    }

    if (isAdmin.value && (!form.roleIds || !form.roleIds.length)) {
        errors.roleIds = 'Phải chọn ít nhất một quyền.'
        valid = false
    }

    return valid
}

const validatePasswordForm = () => {
    clearPasswordErrors()
    let valid = true

    if (!passwordForm.currentPassword) {
        passwordErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.'
        valid = false
    }

    if (!passwordForm.newPassword) {
        passwordErrors.newPassword = 'Vui lòng nhập mật khẩu mới.'
        valid = false
    } else if (passwordForm.newPassword.length < 6) {
        passwordErrors.newPassword = 'Mật khẩu mới tối thiểu 6 ký tự.'
        valid = false
    }

    if (!passwordForm.confirmationPassword) {
        passwordErrors.confirmationPassword = 'Vui lòng nhập lại mật khẩu mới.'
        valid = false
    } else if (passwordForm.newPassword && passwordForm.newPassword !== passwordForm.confirmationPassword) {
        passwordErrors.confirmationPassword = 'Mật khẩu xác nhận không khớp.'
        valid = false
    }

    return valid
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

const handleSubmit = async () => {
    if (!validateForm()) return
    const userId = authStore.user?.id
    if (!userId) {
        toast.error('Không xác định được người dùng hiện tại.')
        return
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

        const payload = {
            fullName: form.fullName.trim(),
            phone: form.phone.trim(),
            email: form.email?.trim() || null,
            status: form.status,
            roleIds: [...form.roleIds],
            avatarUrl: removeFlag ? null : avatarUrl,
            address: form.address?.trim() || null,
            removeAvatar: removeFlag
        }

        const updated = await profileStore.updateProfile(userId, payload)
        toast.success('Đã cập nhật hồ sơ cá nhân.')
        syncFormFromProfile()

        if ((avatarFile.value || removeFlag) && previousAvatarUrl) {
            const oldFileName = extractFileName(previousAvatarUrl)
            if (oldFileName && oldFileName !== uploadedFileName) {
                try {
                    await deleteFile(oldFileName)
                } catch (cleanupErr) {
                    console.warn('Không thể xoá ảnh cũ:', cleanupErr)
                }
            }
        }

        avatarFile.value = null
        form.removeAvatar = false
    } catch (err) {
        mapApiErrors(err)
    }
}

const mapApiErrors = (err) => {
    clearErrors()
    const message = err.response?.data?.message
    if (!message) return
    if (message.includes('Phone number already exists')) {
        errors.phone = 'Số điện thoại đã tồn tại.'
    }
    if (message.includes('Email already exists')) {
        errors.email = 'Email đã được sử dụng.'
    }
    if (message.includes('must have at least one role')) {
        errors.roleIds = 'Phải chọn ít nhất một quyền.'
    }
    if (message.includes('User not found')) {
        toast.error('Không tìm thấy người dùng. Vui lòng đăng nhập lại.')
        router.push('/login')
    }
}

const handlePasswordSubmit = async () => {
    if (!validatePasswordForm()) return

    try {
        await profileStore.changePassword({...passwordForm})
        toast.success('Đã đổi mật khẩu thành công.')
        resetPasswordForm()
    } catch (err) {
        const message = err.response?.data?.message
        if (!message) return
        if (message.includes('Incorrect current password')) {
            passwordErrors.currentPassword = 'Mật khẩu hiện tại không đúng.'
        }
        if (message.includes('do not match')) {
            passwordErrors.confirmationPassword = 'Mật khẩu xác nhận không khớp.'
        }
        if (message.includes('cannot be the same as the old password')) {
            passwordErrors.newPassword = 'Mật khẩu mới không được trùng mật khẩu cũ.'
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
    border-radius: 16px;
    padding: 0.9rem 1rem;
    background: var(--color-card-muted);
    max-height: 220px;
    overflow-y: auto;
    display: grid;
    gap: 0.5rem;
}

.role-selection.is-invalid {
    border-color: var(--bs-danger);
}

.profile-loading {
    display: grid;
    place-items: center;
    gap: 0.75rem;
    padding: 3rem 0;
    color: var(--color-text-muted);
}

@media (max-width: 992px) {
    .profile-layout {
        grid-template-columns: 1fr;
    }
}

.dark-theme .profile-card {
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(17, 24, 39, 0.92));
    border-color: rgba(129, 140, 248, 0.28);
    box-shadow: 0 24px 50px rgba(2, 6, 23, 0.6);
}

.dark-theme .profile-header {
    border-color: rgba(129, 140, 248, 0.25);
    background: linear-gradient(180deg, rgba(37, 47, 70, 0.96), rgba(17, 24, 39, 0.92));
}

.dark-theme .profile-status {
    background: rgba(129, 140, 248, 0.18);
    color: #c7d2ff;
}

.dark-theme .profile-status[data-status="INACTIVE"] {
    background: rgba(248, 113, 113, 0.22);
    color: #fecaca;
}

.comfort-theme .profile-card {
    border-color: rgba(95, 111, 148, 0.28);
    background: linear-gradient(170deg, rgba(245, 241, 235, 0.98), rgba(236, 232, 226, 0.92));
}

.comfort-theme .profile-header {
    border-color: rgba(95, 111, 148, 0.24);
    background: linear-gradient(165deg, rgba(248, 244, 238, 0.98), rgba(236, 231, 224, 0.92));
}

.comfort-theme .profile-status {
    background: rgba(95, 111, 148, 0.16);
    color: #3f4a63;
}

</style>
