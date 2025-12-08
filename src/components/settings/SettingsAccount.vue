<template>
    <div class="settings-section">
        <header class="settings-section__header">
            <div class="settings-section__title-group">
                <i class="bi bi-person-circle settings-section__icon"></i>
                <div>
                    <h2 class="settings-section__title">Tài khoản</h2>
                    <p class="settings-section__description">Quản lý thông tin tài khoản cá nhân của bạn</p>
                </div>
            </div>
        </header>

        <div class="settings-section__content">
            <!-- User Profile Card -->
            <div v-if="settingsStore.userProfile" class="settings-profile-card">
                <div class="settings-profile-card__avatar">
                    <img
                        v-if="settingsStore.userProfile.avatarUrl"
                        :src="settingsStore.userProfile.avatarUrl"
                        alt="Avatar"
                        class="settings-profile-card__avatar-img"
                    />
                    <div v-else class="settings-profile-card__avatar-placeholder">
                        <i class="bi bi-person-circle"></i>
                    </div>
                </div>
                <div class="settings-profile-card__info">
                    <h3 class="settings-profile-card__name">
                        {{ settingsStore.userProfile.fullName || settingsStore.userProfile.username }}
                    </h3>
                    <p class="settings-profile-card__email">{{ settingsStore.userProfile.email }}</p>
                    <p class="settings-profile-card__username">@{{ settingsStore.userProfile.username }}</p>
                </div>
            </div>

            <!-- Account Form -->
            <Form
                :validation-schema="accountSchema"
                @submit="handleSaveAccount"
                v-slot="{ errors, isSubmitting }"
            >
                <div class="settings-form">
                    <div class="settings-form__group">
                        <label class="settings-form__label">
                            Họ tên <span class="text-danger">*</span>
                        </label>
                        <Field
                            name="fullName"
                            v-model="accountForm.fullName"
                            as="input"
                            type="text"
                            class="form-control settings-form__input"
                            :class="{ 'is-invalid': errors.fullName }"
                            placeholder="Nhập họ tên của bạn"
                        />
                        <ErrorMessage name="fullName" class="settings-form__error" />
                    </div>

                    <div class="settings-form__group">
                        <label class="settings-form__label">
                            Email <span class="text-danger">*</span>
                        </label>
                        <Field
                            name="email"
                            v-model="accountForm.email"
                            as="input"
                            type="email"
                            class="form-control settings-form__input"
                            :class="{ 'is-invalid': errors.email }"
                            placeholder="your.email@example.com"
                        />
                        <ErrorMessage name="email" class="settings-form__error" />
                    </div>

                    <div class="settings-form__actions">
                        <button
                            type="button"
                            class="btn btn-outline-secondary"
                            @click="handleResetAccountForm"
                            :disabled="isSubmitting || savingAccount"
                        >
                            <i class="bi bi-arrow-counterclockwise me-2"></i>
                            Đặt lại
                        </button>
                        <button
                            type="submit"
                            class="btn btn-primary"
                            :disabled="isSubmitting || savingAccount"
                        >
                            <span v-if="isSubmitting || savingAccount" class="spinner-border spinner-border-sm me-2"></span>
                            <i v-else class="bi bi-check-lg me-2"></i>
                            Lưu thay đổi
                        </button>
                    </div>
                </div>
            </Form>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref, watch, onMounted } from 'vue'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { useSettingsStore } from '@/store/settings'
import { toast } from 'vue3-toastify'

const settingsStore = useSettingsStore()

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

const handleResetAccountForm = () => {
    if (settingsStore.userProfile) {
        accountForm.fullName = settingsStore.userProfile.fullName || ''
        accountForm.email = settingsStore.userProfile.email || ''
    }
}

// Initialize form
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

onMounted(() => {
    if (settingsStore.userProfile) {
        accountForm.fullName = settingsStore.userProfile.fullName || ''
        accountForm.email = settingsStore.userProfile.email || ''
    }
})
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

.settings-profile-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-5);
    padding: var(--spacing-6);
    background: linear-gradient(135deg, var(--color-card) 0%, var(--color-card-muted) 100%);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    margin-bottom: var(--spacing-8);
    box-shadow: var(--shadow-md);
    position: relative;
    overflow: hidden;
}

.settings-profile-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
}

.settings-profile-card__avatar {
    width: 100px;
    height: 100px;
    border-radius: var(--radius-full);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    border: 4px solid var(--color-card);
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb, 13, 110, 253), 0.3);
    position: relative;
}

.settings-profile-card__avatar::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: var(--radius-full);
    padding: 4px;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.settings-profile-card:hover .settings-profile-card__avatar::after {
    opacity: 1;
}

.settings-profile-card__avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.settings-profile-card__avatar-placeholder {
    font-size: 3rem;
    color: var(--color-text-muted);
}

.settings-profile-card__info {
    flex: 1;
    min-width: 0;
}

.settings-profile-card__name {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    margin: 0 0 var(--spacing-1) 0;
    font-family: var(--font-family-sans);
}

.settings-profile-card__email {
    font-size: var(--font-size-base);
    color: var(--color-text);
    margin: 0 0 var(--spacing-1) 0;
    font-family: var(--font-family-sans);
}

.settings-profile-card__username {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
    font-family: var(--font-family-sans);
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
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.settings-form__input {
    width: 100%;
    max-width: 500px;
    padding: var(--spacing-3) var(--spacing-4);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-base);
    background: var(--color-card);
    color: var(--color-text);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-medium);
    transition: all 0.2s ease;
}

.settings-form__input:hover {
    border-color: var(--color-border-strong);
    box-shadow: 0 0 0 3px var(--color-soft-primary);
}

.settings-form__input:focus {
    border-color: var(--color-primary);
    outline: none;
    box-shadow: 0 0 0 4px var(--color-soft-primary);
}

.settings-form__input.is-invalid {
    border-color: var(--color-danger);
}

.settings-form__error {
    color: var(--color-danger);
    font-size: var(--font-size-sm);
    margin-top: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.settings-form__actions {
    display: flex;
    gap: var(--spacing-3);
    margin-top: var(--spacing-2);
}

@media (max-width: 768px) {
    .settings-profile-card {
        flex-direction: column;
        text-align: center;
    }

    .settings-form__input {
        max-width: 100%;
    }

    .settings-form__actions {
        flex-direction: column-reverse;
    }

    .settings-form__actions .btn {
        width: 100%;
    }
}
</style>
