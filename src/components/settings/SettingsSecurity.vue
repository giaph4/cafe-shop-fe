<template>
  <div class="settings-section">
    <header class="settings-section__header">
      <div class="settings-section__title-group">
        <i class="bi bi-shield-lock settings-section__icon" />
        <div>
          <h2 class="settings-section__title">
            Bảo mật
          </h2>
          <p class="settings-section__description">
            Quản lý mật khẩu và các thiết lập bảo mật
          </p>
        </div>
      </div>
    </header>

    <div class="settings-section__content">
      <div class="settings-alert">
        <i class="bi bi-info-circle settings-alert__icon" />
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
        v-slot="{ errors, isSubmitting }"
        :validation-schema="passwordSchema"
        @submit="handleChangePassword"
      >
        <div class="settings-form">
          <div class="settings-form__group">
            <label class="settings-form__label">
              Mật khẩu hiện tại <span class="text-danger">*</span>
            </label>
            <Field
              v-slot="{ field }"
              name="currentPassword"
            >
              <PasswordInput
                v-bind="field"
                :model-value="passwordForm.currentPassword"
                :input-class="['form-control', 'settings-form__input', { 'is-invalid': errors.currentPassword }]"
                autocomplete="current-password"
                placeholder="Nhập mật khẩu hiện tại"
                @update:model-value="passwordForm.currentPassword = $event"
              />
            </Field>
            <ErrorMessage
              name="currentPassword"
              class="settings-form__error"
            />
          </div>

          <div class="settings-form__group">
            <label class="settings-form__label">
              Mật khẩu mới <span class="text-danger">*</span>
            </label>
            <Field
              v-slot="{ field }"
              name="newPassword"
            >
              <PasswordInput
                v-bind="field"
                :model-value="passwordForm.newPassword"
                :input-class="['form-control', 'settings-form__input', { 'is-invalid': errors.newPassword }]"
                autocomplete="new-password"
                placeholder="Nhập mật khẩu mới"
                @update:model-value="passwordForm.newPassword = $event"
              />
            </Field>
            <ErrorMessage
              name="newPassword"
              class="settings-form__error"
            />
          </div>

          <div class="settings-form__group">
            <label class="settings-form__label">
              Xác nhận mật khẩu mới <span class="text-danger">*</span>
            </label>
            <Field
              v-slot="{ field }"
              name="confirmPassword"
            >
              <PasswordInput
                v-bind="field"
                :model-value="passwordForm.confirmPassword"
                :input-class="['form-control', 'settings-form__input', { 'is-invalid': errors.confirmPassword }]"
                autocomplete="new-password"
                placeholder="Nhập lại mật khẩu mới"
                @update:model-value="passwordForm.confirmPassword = $event"
              />
            </Field>
            <ErrorMessage
              name="confirmPassword"
              class="settings-form__error"
            />
          </div>

          <div class="settings-form__actions">
            <button
              type="button"
              class="btn btn-outline-secondary"
              :disabled="isSubmitting || changingPassword"
              @click="handleResetPasswordForm"
            >
              <i class="bi bi-arrow-counterclockwise me-2" />
              Đặt lại
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="isSubmitting || changingPassword"
            >
              <span
                v-if="isSubmitting || changingPassword"
                class="spinner-border spinner-border-sm me-2"
              />
              <i
                v-else
                class="bi bi-shield-check me-2"
              />
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
.settings-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-5);
}

.settings-section__header {
    border-bottom: 1px solid var(--color-border);
    padding-bottom: var(--spacing-4);
    margin-bottom: var(--spacing-3);
}

.settings-section__title-group {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
}

.settings-section__icon {
    font-size: var(--font-size-xl);
    color: var(--color-primary);
    flex-shrink: 0;
}

.settings-section__title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin: 0 0 var(--spacing-1) 0;
    font-family: var(--font-family-sans);
}

.settings-section__description {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
    font-family: var(--font-family-sans);
    line-height: var(--line-height-normal);
}

.settings-section__content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-5);
}

.settings-alert {
    display: flex;
    gap: var(--spacing-3);
    padding: var(--spacing-4);
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
    border-left: 3px solid var(--color-primary);
    border-radius: var(--radius-base);
    margin-bottom: var(--spacing-4);
}

.settings-alert__icon {
    font-size: var(--font-size-lg);
    color: var(--color-primary);
    flex-shrink: 0;
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
    padding-left: var(--spacing-4);
    list-style-type: disc;
}

.settings-alert__content li {
    margin-bottom: var(--spacing-1);
    line-height: var(--line-height-normal);
}

.settings-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-5);
}

.settings-form__group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.settings-form__label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    margin-bottom: 0;
}

.settings-form__input {
    width: 100%;
    max-width: 500px;
}

.settings-form__input :deep(.form-control) {
    padding: var(--spacing-2) var(--spacing-3);
    border: 1px solid var(--color-input-border);
    border-radius: var(--radius-sm);
    background: var(--color-input-bg);
    color: var(--color-text);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
    transition: border-color var(--transition-base);
}

.settings-form__input :deep(.form-control:hover) {
    border-color: var(--color-border-strong);
}

.settings-form__input :deep(.form-control:focus) {
    border-color: var(--color-primary);
    outline: none;
    box-shadow: 0 0 0 2px var(--color-soft-primary);
}

.settings-form__input :deep(.form-control.is-invalid) {
    border-color: var(--color-danger);
}

.settings-form__error {
    color: var(--color-danger);
    font-size: var(--font-size-xs);
    margin-top: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.settings-form__actions {
    display: flex;
    gap: var(--spacing-3);
    margin-top: var(--spacing-1);
    padding-top: var(--spacing-4);
    border-top: 1px solid var(--color-border);
}

.settings-form__actions .btn {
    min-width: 120px;
}

@media (max-width: 768px) {
    .settings-form__input {
        max-width: 100%;
    }

    .settings-form__actions {
        flex-direction: column-reverse;
        gap: var(--spacing-2);
    }

    .settings-form__actions .btn {
        width: 100%;
        min-width: auto;
    }
}
</style>
