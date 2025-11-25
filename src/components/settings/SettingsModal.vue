<template>
    <Dialog
        v-model:visible="visible"
        modal
        :header="'Cài đặt hệ thống'"
        :style="{ width: '90vw', maxWidth: '800px' }"
        :closable="true"
        :draggable="false"
        class="settings-modal"
        @hide="handleClose"
    >
        <TabView>
            <!-- Tab 1: Chung -->
            <TabPanel header="Chung">
                <div class="d-flex flex-column gap-4">
                    <div class="row g-3">
                        <div class="col-12">
                            <label class="form-label fw-semibold d-flex align-items-center gap-2">
                                <i class="bi bi-palette"></i>
                                Giao diện
                            </label>
                            <Dropdown
                                v-model="generalSettings.theme"
                                :options="themeOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Chọn giao diện"
                                class="w-100"
                                @change="handleThemeChange"
                            />
                        </div>

                        <div class="col-12">
                            <label class="form-label fw-semibold d-flex align-items-center gap-2">
                                <i class="bi bi-translate"></i>
                                Ngôn ngữ
                            </label>
                            <Dropdown
                                v-model="generalSettings.language"
                                :options="languageOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Chọn ngôn ngữ"
                                class="w-100"
                                @change="handleLanguageChange"
                            />
                        </div>

                        <div class="col-12">
                            <label class="form-label fw-semibold d-flex align-items-center gap-2">
                                <i class="bi bi-volume-up"></i>
                                Âm thanh thông báo
                            </label>
                            <div class="d-flex align-items-center gap-3">
                                <InputSwitch v-model="generalSettings.notificationSound" @change="handleNotificationSoundChange" />
                                <span class="text-muted">{{ generalSettings.notificationSound ? 'Đã bật' : 'Đã tắt' }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="d-flex justify-content-end gap-2 mt-3">
                        <Button
                            @click="handleSaveGeneralSettings"
                            :loading="savingGeneral"
                            severity="primary"
                        >
                            <i class="bi bi-check-lg me-2"></i>
                            Lưu cài đặt
                        </Button>
                    </div>
                </div>
            </TabPanel>

            <!-- Tab 2: Tài khoản -->
            <TabPanel header="Tài khoản">
                <Form
                    :validation-schema="accountSchema"
                    @submit="handleSaveAccount"
                    v-slot="{ errors, isSubmitting }"
                >
                    <div class="d-flex flex-column gap-4">
                        <!-- User Info Display -->
                        <div v-if="settingsStore.userProfile" class="d-flex align-items-center gap-3 p-3 bg-light rounded">
                            <div class="avatar-container">
                                <img
                                    v-if="settingsStore.userProfile.avatarUrl"
                                    :src="settingsStore.userProfile.avatarUrl"
                                    alt="Avatar"
                                    class="avatar-img"
                                />
                                <div v-else class="avatar-placeholder">
                                    <i class="bi bi-person-circle"></i>
                                </div>
                            </div>
                            <div>
                                <h6 class="mb-1">{{ settingsStore.userProfile.fullName || settingsStore.userProfile.username }}</h6>
                                <small class="text-muted">{{ settingsStore.userProfile.email }}</small>
                            </div>
                        </div>

                        <div class="row g-3">
                            <div class="col-12">
                                <label class="form-label fw-semibold">
                                    Họ tên <span class="text-danger">*</span>
                                </label>
                                <Field
                                    name="fullName"
                                    v-model="accountForm.fullName"
                                    as="input"
                                    type="text"
                                    class="form-control"
                                    :class="{ 'is-invalid': errors.fullName }"
                                />
                                <ErrorMessage name="fullName" class="invalid-feedback" />
                            </div>

                            <div class="col-12">
                                <label class="form-label fw-semibold">
                                    Email <span class="text-danger">*</span>
                                </label>
                                <Field
                                    name="email"
                                    v-model="accountForm.email"
                                    as="input"
                                    type="email"
                                    class="form-control"
                                    :class="{ 'is-invalid': errors.email }"
                                />
                                <ErrorMessage name="email" class="invalid-feedback" />
                            </div>
                        </div>

                        <div class="d-flex justify-content-end gap-2 mt-3">
                            <Button
                                severity="secondary"
                                outlined
                                @click="handleResetAccountForm"
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                :loading="isSubmitting || savingAccount"
                                severity="primary"
                            >
                                <i class="bi bi-check-lg me-2"></i>
                                Lưu thay đổi
                            </Button>
                        </div>
                    </div>
                </Form>
            </TabPanel>

            <!-- Tab 3: Bảo mật -->
            <TabPanel header="Bảo mật">
                <Form
                    :validation-schema="passwordSchema"
                    @submit="handleChangePassword"
                    v-slot="{ errors, isSubmitting }"
                >
                    <div class="d-flex flex-column gap-4">
                        <div class="alert alert-info d-flex align-items-center gap-2">
                            <i class="bi bi-info-circle"></i>
                            <span>Mật khẩu mới phải có ít nhất 8 ký tự</span>
                        </div>

                        <div class="row g-3">
                            <div class="col-12">
                                <label class="form-label fw-semibold">
                                    Mật khẩu cũ <span class="text-danger">*</span>
                                </label>
                                <Field
                                    name="currentPassword"
                                    v-model="passwordForm.currentPassword"
                                    as="input"
                                    type="password"
                                    class="form-control"
                                    :class="{ 'is-invalid': errors.currentPassword }"
                                    autocomplete="current-password"
                                />
                                <ErrorMessage name="currentPassword" class="invalid-feedback" />
                            </div>

                            <div class="col-12">
                                <label class="form-label fw-semibold">
                                    Mật khẩu mới <span class="text-danger">*</span>
                                </label>
                                <Field
                                    name="newPassword"
                                    v-model="passwordForm.newPassword"
                                    as="input"
                                    type="password"
                                    class="form-control"
                                    :class="{ 'is-invalid': errors.newPassword }"
                                    autocomplete="new-password"
                                />
                                <ErrorMessage name="newPassword" class="invalid-feedback" />
                            </div>

                            <div class="col-12">
                                <label class="form-label fw-semibold">
                                    Nhập lại mật khẩu mới <span class="text-danger">*</span>
                                </label>
                                <Field
                                    name="confirmPassword"
                                    v-model="passwordForm.confirmPassword"
                                    as="input"
                                    type="password"
                                    class="form-control"
                                    :class="{ 'is-invalid': errors.confirmPassword }"
                                    autocomplete="new-password"
                                />
                                <ErrorMessage name="confirmPassword" class="invalid-feedback" />
                            </div>
                        </div>

                        <div class="d-flex justify-content-end gap-2 mt-3">
                            <Button
                                severity="secondary"
                                outlined
                                @click="handleResetPasswordForm"
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                :loading="isSubmitting || changingPassword"
                                severity="primary"
                            >
                                <i class="bi bi-shield-check me-2"></i>
                                Đổi mật khẩu
                            </Button>
                        </div>
                    </div>
                </Form>
            </TabPanel>
        </TabView>

        <template #footer>
            <Button
                severity="secondary"
                outlined
                @click="handleClose"
            >
                Đóng
            </Button>
        </template>
    </Dialog>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { toast } from 'vue3-toastify'
import Dialog from 'primevue/dialog'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import InputSwitch from 'primevue/inputswitch'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import { useSettingsStore } from '@/store/settings'
import { LIGHT_THEME, COMFORT_THEME, DARK_THEME } from '@/utils/theme'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue'])

const settingsStore = useSettingsStore()
const { userProfile, currentTheme } = storeToRefs(settingsStore)

const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

// General Settings - sử dụng theme system có sẵn
const generalSettings = reactive({
    theme: currentTheme.value,
    language: settingsStore.language,
    notificationSound: settingsStore.notificationSound
})

const themeOptions = [
    { label: 'Chế độ sáng', value: LIGHT_THEME, icon: 'bi-sun' },
    { label: 'Chế độ dịu mắt', value: COMFORT_THEME, icon: 'bi-droplet-half' },
    { label: 'Chế độ tối', value: DARK_THEME, icon: 'bi-moon-stars' }
]

const languageOptions = [
    { label: 'Tiếng Việt', value: 'vi' },
    { label: 'English', value: 'en' }
]

const savingGeneral = ref(false)

// Account Form
const accountForm = reactive({
    fullName: '',
    email: ''
})

const accountSchema = yup.object({
    fullName: yup
        .string()
        .trim()
        .required('Họ tên là bắt buộc')
        .min(2, 'Họ tên phải có ít nhất 2 ký tự')
        .max(100, 'Họ tên không được vượt quá 100 ký tự'),
    email: yup
        .string()
        .trim()
        .required('Email là bắt buộc')
        .email('Email không hợp lệ')
        .max(255, 'Email không được vượt quá 255 ký tự')
})

const savingAccount = ref(false)

// Password Form
const passwordForm = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
})

const passwordSchema = yup.object({
    currentPassword: yup
        .string()
        .required('Mật khẩu cũ là bắt buộc'),
    newPassword: yup
        .string()
        .required('Mật khẩu mới là bắt buộc')
        .min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường và một số'
        ),
    confirmPassword: yup
        .string()
        .required('Nhập lại mật khẩu là bắt buộc')
        .oneOf([yup.ref('newPassword')], 'Mật khẩu nhập lại không khớp')
})

const changingPassword = ref(false)

// Watch userProfile to populate account form
watch(
    () => settingsStore.userProfile,
    (profile) => {
        if (profile) {
            accountForm.fullName = profile.fullName || ''
            accountForm.email = profile.email || ''
        }
    },
    { immediate: true }
)

// Watch visible to reset forms when modal opens
watch(visible, (isVisible) => {
    if (isVisible) {
        // Reset general settings to current store values
        generalSettings.theme = currentTheme.value
        generalSettings.language = settingsStore.language
        generalSettings.notificationSound = settingsStore.notificationSound

        // Reset account form
        if (settingsStore.userProfile) {
            accountForm.fullName = settingsStore.userProfile.fullName || ''
            accountForm.email = settingsStore.userProfile.email || ''
        }

        // Reset password form
        passwordForm.currentPassword = ''
        passwordForm.newPassword = ''
        passwordForm.confirmPassword = ''
    }
})

// Handlers
const handleThemeChange = () => {
    // Apply immediately for better UX
    settingsStore.setTheme(generalSettings.theme)
}

const handleLanguageChange = () => {
    settingsStore.setLanguage(generalSettings.language)
}

const handleNotificationSoundChange = () => {
    settingsStore.setNotificationSound(generalSettings.notificationSound)
}

const handleSaveGeneralSettings = async () => {
    savingGeneral.value = true
    try {
        settingsStore.setTheme(generalSettings.theme)
        settingsStore.setLanguage(generalSettings.language)
        settingsStore.setNotificationSound(generalSettings.notificationSound)
        toast.success('Đã lưu cài đặt chung thành công!')
    } catch (error) {
        toast.error('Không thể lưu cài đặt. Vui lòng thử lại.')
    } finally {
        savingGeneral.value = false
    }
}

const handleSaveAccount = async () => {
    savingAccount.value = true
    try {
        await settingsStore.updateProfile({
            fullName: accountForm.fullName,
            email: accountForm.email
        })
        toast.success('Đã cập nhật thông tin tài khoản thành công!')
    } catch (error) {
        toast.error(error?.response?.data?.message || 'Không thể cập nhật thông tin. Vui lòng thử lại.')
    } finally {
        savingAccount.value = false
    }
}

const handleChangePassword = async () => {
    changingPassword.value = true
    try {
        await settingsStore.changePassword(
            passwordForm.currentPassword,
            passwordForm.newPassword
        )
        toast.success('Đã đổi mật khẩu thành công!')
        // Reset form
        passwordForm.currentPassword = ''
        passwordForm.newPassword = ''
        passwordForm.confirmPassword = ''
    } catch (error) {
        toast.error(error?.response?.data?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu cũ.')
    } finally {
        changingPassword.value = false
    }
}

const handleResetAccountForm = () => {
    if (settingsStore.userProfile) {
        accountForm.fullName = settingsStore.userProfile.fullName || ''
        accountForm.email = settingsStore.userProfile.email || ''
    }
}

const handleResetPasswordForm = () => {
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
}

const handleClose = () => {
    visible.value = false
}

onMounted(() => {
    // Initialize forms
    if (settingsStore.userProfile) {
        accountForm.fullName = settingsStore.userProfile.fullName || ''
        accountForm.email = settingsStore.userProfile.email || ''
    }
})
</script>

<style scoped lang="scss">
.settings-modal {
    // Animation cho modal mask (backdrop)
    :deep(.p-dialog-mask) {
        animation: fadeIn 0.3s ease-out;
    }

    // Animation cho dialog (modal content)
    :deep(.p-dialog) {
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
        background: #ffffff !important;
        border: 1px solid #e5e7eb;
        opacity: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        animation: modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        transform-origin: center center;
    }

    :deep(.p-dialog-header) {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        background-color: transparent !important;
        color: white !important;
        border-radius: 0;
        padding: 1.5rem;
        border-bottom: none;

        .p-dialog-title {
            font-weight: 700;
            font-size: 1.5rem;
            margin: 0;
            color: white !important;
        }

        .p-dialog-header-icon {
            color: white !important;
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 8px;
            transition: background-color 0.2s;

            &:hover {
                background: rgba(255, 255, 255, 0.2) !important;
            }
        }
    }

    :deep(.p-dialog-content) {
        padding: 1.5rem;
        background: #ffffff !important;
    }

    :deep(.p-dialog-footer) {
        padding: 1rem 1.5rem;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        background: #ffffff !important;
    }

    :deep(.p-tabview) {
        .p-tabview-nav {
            border-bottom: 2px solid #e5e7eb;
            margin-bottom: 1.5rem;
            background: transparent;

            li {
                margin-right: 0.5rem;

                .p-tabview-nav-link {
                    padding: 0.75rem 1.5rem;
                    font-weight: 600;
                    color: #6b7280;
                    border: none;
                    border-bottom: 3px solid transparent;
                    background: transparent;
                    transition: all 0.2s;
                    border-radius: 8px 8px 0 0;

                    &:hover {
                        background: rgba(102, 126, 234, 0.08);
                        color: #667eea;
                    }

                    &.p-highlight {
                        color: #667eea;
                        border-bottom-color: #667eea;
                        background: rgba(102, 126, 234, 0.1);
                    }
                }
            }
        }

        .p-tabview-panels {
            padding: 0;
        }
    }

    .avatar-container {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f3f4f6;
        border: 2px solid #e5e7eb;
        flex-shrink: 0;

        .avatar-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .avatar-placeholder {
            font-size: 2.5rem;
            color: #9ca3af;
        }
    }

    :deep(.p-inputswitch) {
        width: 3rem;
        height: 1.75rem;

        .p-inputswitch-slider {
            background: #d1d5db;
            border-radius: 30px;
            transition: background-color 0.2s;

            &:before {
                background: white;
                width: 1.25rem;
                height: 1.25rem;
                border-radius: 50%;
                transition: transform 0.2s;
            }
        }

        &.p-inputswitch-checked .p-inputswitch-slider {
            background: #667eea;

            &:before {
                transform: translateX(1.25rem);
            }
        }
    }

    :deep(.p-dropdown) {
        width: 100%;

        .p-dropdown-trigger {
            width: 3rem;
        }

        .p-dropdown-label {
            padding: 0.5rem 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            background: white;
            transition: all 0.2s;
        }

        &.p-focus .p-dropdown-label {
            border-color: #667eea;
            box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }

        .p-dropdown-panel {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
            margin-top: 0.25rem;

            .p-dropdown-items {
                padding: 0.5rem;

                .p-dropdown-item {
                    padding: 0.5rem 0.75rem;
                    border-radius: 6px;
                    transition: all 0.2s;

                    &:hover {
                        background: rgba(102, 126, 234, 0.1);
                        color: #667eea;
                    }

                    &.p-highlight {
                        background: rgba(102, 126, 234, 0.15);
                        color: #667eea;
                    }
                }
            }
        }
    }

    :deep(.p-button) {
        padding: 0.625rem 1.5rem;
        font-weight: 600;
        border-radius: 8px;
        transition: all 0.2s;
        border: 1px solid transparent;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;

        &.p-button-primary {
            background: #667eea;
            border-color: #667eea;
            color: white;

            &:hover:not(:disabled) {
                background: #5568d3;
                border-color: #5568d3;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }

            &:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
        }

        &.p-button-secondary {
            background: white;
            border-color: #d1d5db;
            color: #374151;

            &:hover:not(:disabled) {
                background: #f9fafb;
                border-color: #9ca3af;
            }
        }

        &.p-button-outlined {
            background: transparent;
            border: 1px solid #d1d5db;
            color: #374151;

            &:hover:not(:disabled) {
                background: #f9fafb;
                border-color: #9ca3af;
            }
        }

        .p-button-loading-icon {
            margin-right: 0.5rem;
        }
    }
}

// Keyframes cho animation
@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes modalSlideIn {
    from {
        opacity: 0;
        transform: translateY(-30px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

// Animation khi đóng modal
.settings-modal.p-dialog-mask.p-dialog-mask-leave-active {
    animation: fadeOut 0.25s ease-in forwards;
}

.settings-modal.p-dialog.p-dialog-leave-active {
    animation: modalSlideOut 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes fadeOut {
    from {
        opacity: 1;
    }
    to {
        opacity: 0;
    }
}

@keyframes modalSlideOut {
    from {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
    to {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
    }
}
</style>

