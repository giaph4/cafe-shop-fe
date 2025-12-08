<template>
    <div class="settings-section">
        <header class="settings-section__header">
            <div class="settings-section__title-group">
                <i class="bi bi-shield-lock settings-section__icon"></i>
                <div>
                    <h2 class="settings-section__title">Bảo mật</h2>
                    <p class="settings-section__description">Quản lý mật khẩu và các thiết lập bảo mật</p>
                </div>
            </div>
        </header>

        <div class="settings-section__content">
            <div class="settings-alert">
                <i class="bi bi-info-circle settings-alert__icon"></i>
                <div class="settings-alert__content">
                    <strong>Yêu cầu mật khẩu:</strong>
                    <ul>
                        <li>Ít nhất 8 ký tự</li>
                        <li>Bao gồm chữ hoa và chữ thường</li>
                        <li>Bao gồm ít nhất một số</li>
                    </ul>
                </div>
            </div>

            <Form
                :validation-schema="passwordSchema"
                @submit="handleChangePassword"
                v-slot="{ errors, isSubmitting }"
            >
                <div class="settings-form">
                    <div class="settings-form__group">
                        <label class="settings-form__label">
                            Mật khẩu hiện tại <span class="text-danger">*</span>
                        </label>
                        <Field
                            name="currentPassword"
                            v-slot="{ field }"
                        >
                            <PasswordInput
                                v-bind="field"
                                :model-value="passwordForm.currentPassword"
                                @update:model-value="passwordForm.currentPassword = $event"
                                :input-class="['settings-form__input', { 'is-invalid': errors.currentPassword }]"
                                autocomplete="current-password"
                                placeholder="Nhập mật khẩu hiện tại"
                            />
                        </Field>
                        <ErrorMessage name="currentPassword" class="settings-form__error" />
                    </div>

                    <div class="settings-form__group">
                        <label class="settings-form__label">
                            Mật khẩu mới <span class="text-danger">*</span>
                        </label>
                        <Field
                            name="newPassword"
                            v-slot="{ field }"
                        >
                            <PasswordInput
                                v-bind="field"
                                :model-value="passwordForm.newPassword"
                                @update:model-value="passwordForm.newPassword = $event"
                                :input-class="['settings-form__input', { 'is-invalid': errors.newPassword }]"
                                autocomplete="new-password"
                                placeholder="Nhập mật khẩu mới"
                            />
                        </Field>
                        <ErrorMessage name="newPassword" class="settings-form__error" />
                    </div>

                    <div class="settings-form__group">
                        <label class="settings-form__label">
                            Xác nhận mật khẩu mới <span class="text-danger">*</span>
                        </label>
                        <Field
                            name="confirmPassword"
                            v-slot="{ field }"
                        >
                            <PasswordInput
                                v-bind="field"
                                :model-value="passwordForm.confirmPassword"
                                @update:model-value="passwordForm.confirmPassword = $event"
                                :input-class="['settings-form__input', { 'is-invalid': errors.confirmPassword }]"
                                autocomplete="new-password"
                                placeholder="Nhập lại mật khẩu mới"
                            />
                        </Field>
                        <ErrorMessage name="confirmPassword" class="settings-form__error" />
                    </div>

                    <div class="settings-form__actions">
                        <button
                            type="button"
                            class="btn btn-outline-secondary"
                            @click="handleResetPasswordForm"
                            :disabled="isSubmitting || changingPassword"
                        >
                            <i class="bi bi-arrow-counterclockwise me-2"></i>
                            Đặt lại
                        </button>
                        <button
                            type="submit"
                            class="btn btn-primary"
                            :disabled="isSubmitting || changingPassword"
                        >
                            <span v-if="isSubmitting || changingPassword" class="spinner-border spinner-border-sm me-2"></span>
                            <i v-else class="bi bi-shield-check me-2"></i>
                            Đổi mật khẩu
                        </button>
                    </div>
                </div>
            </Form>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { useSettingsStore } from '@/store/settings'
import { toast } from 'vue3-toastify'
import PasswordInput from '@/components/common/PasswordInput.vue'

const settingsStore = useSettingsStore()

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

const handleChangePassword = async () => {
    changingPassword.value = true
    try {
        await settingsStore.changePassword(
            passwordForm.currentPassword,
            passwordForm.newPassword
        )
        toast.success('Đã đổi mật khẩu thành công!')
        handleResetPasswordForm()
    } catch (error) {
        toast.error(error?.response?.data?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu cũ.')
    } finally {
        changingPassword.value = false
    }
}

const handleResetPasswordForm = () => {
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
}
</script>

<style scoped>
.settings-section__icon-wrapper {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--color-soft-primary) 0%, rgba(var(--color-primary-rgb, 13, 110, 253), 0.1) 100%);
    border-radius: var(--radius-lg);
    border: 2px solid var(--color-border-contrast);
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb, 13, 110, 253), 0.15);
}

.settings-section__icon {
    font-size: var(--font-size-2xl);
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 2px 4px rgba(var(--color-primary-rgb, 13, 110, 253), 0.2));
}

.settings-alert {
    display: flex;
    gap: var(--spacing-4);
    padding: var(--spacing-5);
    background: linear-gradient(135deg, var(--color-soft-info) 0%, rgba(var(--color-info-rgb, 13, 202, 240), 0.05) 100%);
    border: 2px solid var(--color-info);
    border-radius: var(--radius-lg);
    margin-bottom: var(--spacing-8);
    box-shadow: 0 2px 8px rgba(var(--color-info-rgb, 13, 202, 240), 0.1);
    position: relative;
    overflow: hidden;
}

.settings-alert::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(180deg, var(--color-info) 0%, var(--color-info-light) 100%);
}

.settings-alert__icon {
    font-size: var(--font-size-2xl);
    color: var(--color-info);
    flex-shrink: 0;
    margin-top: var(--spacing-1);
    background: var(--color-card);
    padding: var(--spacing-2);
    border-radius: var(--radius-base);
    box-shadow: 0 2px 4px rgba(var(--color-info-rgb, 13, 202, 240), 0.2);
}

.settings-alert__content {
    flex: 1;
    color: var(--color-text);
    font-size: var(--font-size-sm);
    font-family: var(--font-family-sans);
}

.settings-alert__content strong {
    display: block;
    margin-bottom: var(--spacing-2);
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
}

.settings-alert__content ul {
    margin: var(--spacing-2) 0 0 0;
    padding-left: var(--spacing-5);
    list-style-type: disc;
}

.settings-alert__content li {
    margin-bottom: var(--spacing-1);
    line-height: var(--line-height-relaxed);
}
</style>
