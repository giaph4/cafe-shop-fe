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
                        <div v-if="settingsStore.userProfile" class="settings-modal__user-info">
                            <div class="settings-modal__avatar">
                                <img
                                    v-if="settingsStore.userProfile.avatarUrl"
                                    :src="settingsStore.userProfile.avatarUrl"
                                    alt="Avatar"
                                    class="settings-modal__avatar-img"
                                />
                                <div v-else class="settings-modal__avatar-placeholder">
                                    <i class="bi bi-person-circle"></i>
                                </div>
                            </div>
                            <div class="settings-modal__user-details">
                                <h6 class="settings-modal__user-name">{{ settingsStore.userProfile.fullName || settingsStore.userProfile.username }}</h6>
                                <small class="settings-modal__user-email">{{ settingsStore.userProfile.email }}</small>
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
                            <span>Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số</span>
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
        animation: fadeIn var(--transition-base);
    }

    // Animation cho dialog (modal content)
    :deep(.p-dialog) {
        border-radius: var(--radius-sm);
        overflow: hidden;
        background: var(--color-card) !important;
        border: 1px solid var(--color-border);
        opacity: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        animation: modalSlideIn var(--transition-smooth);
        transform-origin: center center;
    }

    :deep(.p-dialog-header) {
        background: var(--color-card) !important;
        color: var(--color-heading) !important;
        border-radius: 0;
        padding: var(--spacing-4);
        border-bottom: 1px solid var(--color-border);

        .p-dialog-title {
            font-weight: var(--font-weight-semibold);
            font-size: var(--font-size-xl);
            line-height: var(--line-height-tight);
            margin: 0;
            color: var(--color-heading) !important;
            font-family: var(--font-family-sans);
        }

        .p-dialog-header-icon {
            color: var(--color-heading) !important;
            width: 2rem;
            height: 2rem;
            border-radius: var(--radius-sm);
            transition: background-color var(--transition-base);

            &:hover {
                background: var(--color-card-muted) !important;
            }
        }
    }

    :deep(.p-dialog-content) {
        padding: var(--spacing-4);
        background: var(--color-card) !important;
    }

    :deep(.p-dialog-footer) {
        padding: var(--spacing-4);
        border-top: 1px solid var(--color-border);
        display: flex;
        justify-content: flex-end;
        gap: var(--spacing-2);
        background: var(--color-card) !important;
    }

    :deep(.p-tabview) {
        .p-tabview-nav {
            border-bottom: 1px solid var(--color-border);
            margin-bottom: var(--spacing-4);
            background: transparent;

            li {
                margin-right: var(--spacing-1);

                .p-tabview-nav-link {
                    padding: var(--spacing-2) var(--spacing-4);
                    font-weight: var(--font-weight-medium);
                    color: var(--color-text-muted);
                    border: none;
                    border-bottom: 2px solid transparent;
                    background: transparent;
                    transition: all var(--transition-base);
                    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
                    font-family: var(--font-family-sans);
                    font-size: var(--font-size-base);

                    &:hover {
                        background: var(--color-card-muted);
                        color: var(--color-primary);
                    }

                    &.p-highlight {
                        color: var(--color-primary);
                        border-bottom-color: var(--color-primary);
                        background: var(--color-card-muted);
                        font-weight: var(--font-weight-semibold);
                    }
                }
            }
        }

        .p-tabview-panels {
            padding: 0;
        }
    }

    .settings-modal__user-info {
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
        padding: var(--spacing-3);
        border-radius: var(--radius-sm);
        background: var(--color-card-muted);
        border: 1px solid var(--color-border);
        margin-bottom: var(--spacing-4);
    }

    .settings-modal__avatar {
        width: 64px;
        height: 64px;
        border-radius: var(--radius-full);
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-card-muted);
        border: 2px solid var(--color-border);
        flex-shrink: 0;
    }

    .settings-modal__avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .settings-modal__avatar-placeholder {
        font-size: 2.5rem;
        color: var(--color-text-muted);
    }

    .settings-modal__user-details {
        flex: 1;
        min-width: 0;
    }

    .settings-modal__user-name {
        margin: 0 0 var(--spacing-1);
        font-weight: var(--font-weight-semibold);
        color: var(--color-heading);
        font-size: var(--font-size-base);
        font-family: var(--font-family-sans);
    }

    .settings-modal__user-email {
        color: var(--color-text-muted);
        font-size: var(--font-size-sm);
        font-family: var(--font-family-sans);
    }

    .form-label {
        font-weight: var(--font-weight-medium);
        color: var(--color-heading);
        font-size: var(--font-size-base);
        margin-bottom: var(--spacing-2);
        font-family: var(--font-family-sans);
    }

    .form-control {
        border-radius: var(--radius-sm);
        border: 1px solid var(--color-border);
        background: var(--color-card);
        color: var(--color-heading);
        padding: var(--spacing-2) var(--spacing-3);
        font-size: var(--font-size-base);
        font-family: var(--font-family-sans);
    }

    .form-control:focus {
        border-color: var(--color-primary);
        outline: 2px solid var(--color-primary);
        outline-offset: 0;
        box-shadow: none;
    }

    .form-control.is-invalid {
        border-color: var(--color-danger);
    }

    .invalid-feedback {
        color: var(--color-danger);
        font-size: var(--font-size-sm);
        font-family: var(--font-family-sans);
    }

    .text-muted {
        color: var(--color-text-muted);
        font-family: var(--font-family-sans);
    }

    .alert-info {
        border-radius: var(--radius-sm);
        border: 1px solid var(--color-border);
        background: var(--color-card-muted);
        color: var(--color-heading);
        padding: var(--spacing-3);
        font-family: var(--font-family-sans);
    }

    :deep(.p-inputswitch) {
        width: 3rem;
        height: 1.75rem;

        .p-inputswitch-slider {
            background: var(--color-border);
            border-radius: var(--radius-full);
            transition: background-color var(--transition-base);

            &:before {
                background: var(--color-white);
                width: 1.25rem;
                height: 1.25rem;
                border-radius: var(--radius-full);
                transition: transform var(--transition-base);
            }
        }

        &.p-inputswitch-checked .p-inputswitch-slider {
            background: var(--color-primary);

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
            padding: var(--spacing-2) var(--spacing-3);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            background: var(--color-card);
            color: var(--color-heading);
            transition: all var(--transition-base);
            font-family: var(--font-family-sans);
            font-size: var(--font-size-base);
        }

        &.p-focus .p-dropdown-label {
            border-color: var(--color-primary);
            outline: 2px solid var(--color-primary);
            outline-offset: 0;
            box-shadow: none;
        }

        .p-dropdown-panel {
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            margin-top: var(--spacing-1);
            background: var(--color-card);

            .p-dropdown-items {
                padding: var(--spacing-2);

                .p-dropdown-item {
                    padding: var(--spacing-2) var(--spacing-3);
                    border-radius: var(--radius-sm);
                    transition: all var(--transition-base);
                    font-family: var(--font-family-sans);
                    font-size: var(--font-size-base);

                    &:hover {
                        background: var(--color-card-muted);
                        color: var(--color-primary);
                    }

                    &.p-highlight {
                        background: var(--color-card-muted);
                        color: var(--color-primary);
                    }
                }
            }
        }
    }

    :deep(.p-button) {
        padding: var(--spacing-2) var(--spacing-4);
        font-weight: var(--font-weight-medium);
        border-radius: var(--radius-sm);
        transition: all var(--transition-base);
        border: 1px solid transparent;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-2);
        font-family: var(--font-family-sans);
        font-size: var(--font-size-base);

        &.p-button-primary {
            background: var(--color-primary);
            border-color: var(--color-primary);
            color: var(--color-text-inverse);

            &:hover:not(:disabled) {
                background: var(--color-primary-dark);
                border-color: var(--color-primary-dark);
            }

            &:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
        }

        &.p-button-secondary {
            background: var(--color-card);
            border: 1px solid var(--color-primary);
            color: var(--color-primary);

            &:hover:not(:disabled) {
                background: var(--color-soft-primary);
                border-color: var(--color-primary-dark);
                color: var(--color-primary-dark);
            }
        }

        &.p-button-outlined {
            background: var(--color-card);
            border: 1px solid var(--color-primary);
            color: var(--color-primary);

            &:hover:not(:disabled) {
                background: var(--color-soft-primary);
                border-color: var(--color-primary-dark);
                color: var(--color-primary-dark);
            }
        }

        .p-button-loading-icon {
            margin-right: var(--spacing-2);
        }
    }

    // Responsive adjustments
    @media (max-width: 768px) {
        :deep(.p-dialog) {
            width: 95vw !important;
            max-width: 95vw !important;
            margin: var(--spacing-4);
        }

        :deep(.p-dialog-header) {
            padding: var(--spacing-4);
        }

        :deep(.p-dialog-content) {
            padding: var(--spacing-4);
        }

        :deep(.p-dialog-footer) {
            padding: var(--spacing-3) var(--spacing-4);
            flex-direction: column-reverse;

            .p-button {
                width: 100%;
            }
        }

        :deep(.p-tabview-nav) {
            flex-wrap: wrap;

            li {
                flex: 1;
                min-width: 0;

                .p-tabview-nav-link {
                    padding: var(--spacing-2) var(--spacing-3);
                    font-size: var(--font-size-sm);
                }
            }
        }

        .settings-modal__user-info {
            flex-direction: column;
            text-align: center;
        }

        .settings-modal__user-details {
            text-align: center;
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
    animation: fadeOut var(--transition-fast) ease-in forwards;
}

.settings-modal.p-dialog.p-dialog-leave-active {
    animation: modalSlideOut var(--transition-fast) cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
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

