<template>
    <div class="login-wrapper" data-aos="fade-up">
        <div class="login-card">
            <section class="login-hero">
                <div class="brand">

                    <div class="brand-text">
                        <h1>Cafe Đời Thứ 3</h1>
                        <p class="brand-tagline">Quản lý quán cà phê thông minh</p>
                    </div>
                </div>

                <div class="highlights">
                    <article class="highlight-item">
                        <div class="icon">
                            <i class="bi bi-graph-up"></i>
                        </div>
                        <div class="text">
                            <h3>Thống kê tức thì</h3>
                            <p>Xem doanh thu, đơn hàng và hoạt động của quán ngay lập tức.</p>
                        </div>
                    </article>
                    <article class="highlight-item">
                        <div class="icon">
                            <i class="bi bi-people"></i>
                        </div>
                        <div class="text">
                            <h3>Quản lý nhân viên</h3>
                            <p>Phân ca làm việc, theo dõi hiệu suất và quản lý lương thưởng.</p>
                        </div>
                    </article>
                    <article class="highlight-item">
                        <div class="icon">
                            <i class="bi bi-bag-check"></i>
                        </div>
                        <div class="text">
                            <h3>Quản lý kho</h3>
                            <p>Theo dõi nguyên liệu, nhập hàng và cảnh báo khi sắp hết.</p>
                        </div>
                    </article>
                    <article class="highlight-item highlight-item--demo">
                        <div class="icon">
                            <i class="bi bi-key"></i>
                        </div>
                        <div class="text">
                            <h3>Tài khoản demo</h3>
                            <div class="demo-accounts">
                                <div class="demo-account">
                                    <span class="demo-role">Admin:</span>
                                    <code>admin_demo</code> / <code>Admindemo1234.</code>
                                </div>
                                <div class="demo-account">
                                    <span class="demo-role">Manager:</span>
                                    <code>manager_demo</code> / <code>Managerdemo1234.</code>
                                </div>
                                <div class="demo-account">
                                    <span class="demo-role">Staff:</span>
                                    <code>staff_demo</code> / <code>Staffdemo1234.</code>
                                </div>
                            </div>
                            <p class="demo-note">Bạn có thể sử dụng các tài khoản này để đăng nhập và trải nghiệm hệ
                                thống.</p>
                        </div>
                    </article>
                </div>
            </section>

            <section class="login-form">
                <div class="login-form__content">
                    <div class="login-form__header">
                        <h2 class="login-form__title">Chào mừng trở lại!</h2>
                        <p class="login-form__subtitle">Nhập thông tin đăng nhập để tiếp tục quản lý quán của bạn.</p>
                    </div>

                    <Form @submit="handleLogin" :validation-schema="loginSchema" v-slot="{ errors }">
                        <div class="login-form__field">
                            <label for="username" class="form-label">Tên đăng nhập</label>
                            <Field name="username" type="text" class="form-control"
                                :class="{ 'is-invalid': errors.username }" id="username" placeholder="ví dụ: staff01"
                                autocomplete="username" />
                            <ErrorMessage name="username" class="invalid-feedback" />
                        </div>

                        <div class="login-form__field">
                            <label for="password" class="form-label">Mật khẩu</label>
                            <div class="password-input-wrapper">
                                <Field name="password" :type="showPassword ? 'text' : 'password'" class="form-control"
                                    :class="{ 'is-invalid': errors.password }" id="password" placeholder="Nhập mật khẩu"
                                    autocomplete="current-password" />
                                <button type="button" class="password-toggle" @click="showPassword = !showPassword"
                                    :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'" tabindex="0">
                                    <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                                </button>
                            </div>
                            <ErrorMessage name="password" class="invalid-feedback" />
                        </div>

                        <div class="login-form__options">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="rememberMe" v-model="rememberMe" />
                                <label class="form-check-label" for="rememberMe">
                                    Ghi nhớ lần đăng nhập này
                                </label>
                            </div>
                            <button type="button" class="btn btn-link p-0 login-form__forgot"
                                @click="handleForgotPassword">
                                Quên mật khẩu?
                            </button>
                        </div>

                        <div class="login-form__submit">
                            <button type="submit" class="btn btn-primary w-100" :disabled="isLoading">
                                <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"
                                    aria-hidden="true"></span>
                                <i v-else class="bi bi-box-arrow-in-right me-2"></i>
                                <span>{{ isLoading ? 'Đang đăng nhập...' : 'Đăng nhập' }}</span>
                            </button>
                        </div>
                    </Form>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { toast } from 'vue3-toastify'

const router = useRouter()
const authStore = useAuthStore()
const isLoading = ref(false)
const rememberMe = ref(false)
const showPassword = ref(false)

const loginSchema = yup.object({
    username: yup.string()
        .required('Tên đăng nhập là bắt buộc')
        .min(4, 'Tên đăng nhập phải có ít nhất 4 ký tự'),
    password: yup.string()
        .required('Mật khẩu là bắt buộc')
        .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
})

const handleLogin = async (values) => {
    if (isLoading.value) return

    isLoading.value = true
    try {
        await authStore.login(values)

        // Handle remember me if needed
        if (rememberMe.value) {
            // Store remember me preference
            localStorage.setItem('rememberMe', 'true')
        } else {
            localStorage.removeItem('rememberMe')
        }

        toast.success('Đăng nhập thành công!')
        router.push('/')
    } catch (error) {
        // Login error handled by toast notification
        if (error.response) {
            const status = error.response.status
            if (status === 401 || status === 403) {
                toast.error('Tên đăng nhập hoặc mật khẩu không đúng.')
            } else if (status === 423) {
                toast.error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.')
            } else if (status >= 500) {
                toast.error('Lỗi hệ thống. Vui lòng thử lại sau.')
            } else {
                toast.error(error.response.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            }
        } else if (error.request) {
            toast.error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.')
        } else {
            toast.error('Đã xảy ra lỗi. Vui lòng thử lại.')
        }
    } finally {
        isLoading.value = false
    }
}

const handleForgotPassword = () => {
    toast.info('Tính năng quên mật khẩu đang được phát triển. Vui lòng liên hệ quản trị viên.')
}
</script>

<style scoped>
/* ============================================
   LOGIN PAGE - CHUẨN HÓA THEO GLOBAL DESIGN SYSTEM
   Tuân thủ nghiêm ngặt base.css và 3 theme
   ============================================ */

/* Container chuẩn hóa */
.login-wrapper {
    background: var(--color-body-bg);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-8);
}

.login-card {
    width: 100%;
    max-width: 1024px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    overflow: hidden;
    box-shadow: var(--shadow-base);
    position: relative;
}

/* Hero Section */
.login-hero {
    background: var(--color-card-muted);
    padding: clamp(var(--spacing-12), 5vw, var(--spacing-16));
    color: var(--color-heading);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-10);
    justify-content: space-between;
}

.login-hero .brand {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
}

.login-hero .brand-text h1 {
    margin: 0;
    font-weight: var(--font-weight-bold);
    font-size: clamp(var(--font-size-2xl), 3vw, var(--font-size-3xl));
    letter-spacing: var(--letter-spacing-tight);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.login-hero .brand-text .brand-tagline {
    display: inline-block;
    margin-top: var(--spacing-2);
    font-size: clamp(var(--font-size-sm), 2vw, var(--font-size-base));
    color: var(--color-text-muted);
    font-weight: var(--font-weight-normal);
    line-height: var(--line-height-normal);
    font-family: var(--font-family-sans);
}

/* Highlights */
.login-hero .highlights {
    display: grid;
    gap: var(--spacing-4);
}

.login-hero .highlights .highlight-item {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    border-radius: var(--radius-base);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    transition: background-color var(--transition-base), border-color var(--transition-base);
}

.login-hero .highlights .highlight-item:hover {
    background-color: var(--color-card-muted);
    border-color: var(--color-border-strong);
}

.login-hero .highlights .highlight-item--demo {
    background: var(--color-soft-amber);
    border: 1px dashed var(--color-border-strong);
}

.login-hero .highlights .highlight-item .icon {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    display: grid;
    place-items: center;
    font-size: var(--font-size-xl);
    background: var(--color-soft-primary);
    color: var(--color-primary);
    flex-shrink: 0;
}

.login-hero .highlights .highlight-item .text h3 {
    font-size: var(--font-size-md);
    margin: 0 0 var(--spacing-1) 0;
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.login-hero .highlights .highlight-item .text p {
    margin: var(--spacing-1) 0 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    line-height: var(--line-height-normal);
    font-family: var(--font-family-sans);
}

.login-hero .highlights .highlight-item--demo .demo-accounts {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    margin-top: var(--spacing-2);
    font-size: var(--font-size-sm);
}

.login-hero .highlights .highlight-item--demo .demo-accounts .demo-account {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    flex-wrap: wrap;
}

.login-hero .highlights .highlight-item--demo .demo-accounts .demo-account .demo-role {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    min-width: 60px;
}

.login-hero .highlights .highlight-item--demo .demo-accounts .demo-account code {
    background: var(--color-card-muted);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-xs);
    font-size: var(--font-size-xs);
    color: var(--color-text);
    font-family: "Courier New", monospace;
    border: 1px solid var(--color-border);
}

.login-hero .highlights .highlight-item--demo .demo-note {
    margin-top: var(--spacing-2);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-style: italic;
}

/* Form Section */
.login-form {
    padding: clamp(var(--spacing-10), 5vw, var(--spacing-16));
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: var(--color-card);
}

.login-form__content {
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
}

.login-form__header {
    margin-bottom: var(--spacing-8);
}

.login-form__title {
    font-size: clamp(var(--font-size-2xl), 2.5vw, var(--font-size-3xl));
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--spacing-2);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-tight);
    font-family: var(--font-family-sans);
}

.login-form__subtitle {
    color: var(--color-text-muted);
    margin-bottom: 0;
    line-height: var(--line-height-relaxed);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

/* Form Fields */
.login-form__field {
    margin-bottom: var(--spacing-6);
}

.login-form__field .form-label {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
    font-size: var(--font-size-sm);
    font-family: var(--font-family-sans);
}

.login-form__field .form-control {
    border-radius: var(--radius-base);
    border: 1px solid var(--color-input-border);
    padding: var(--spacing-3) var(--spacing-4);
    transition: border-color var(--transition-base), background-color var(--transition-base);
    font-size: var(--font-size-base);
    background: var(--color-input-bg);
    color: var(--color-text);
    line-height: var(--line-height-normal);
    font-family: var(--font-family-sans);
}

.login-form__field .form-control::placeholder {
    color: var(--color-placeholder);
    opacity: 0.7;
}

.login-form__field .form-control:hover:not(:focus) {
    border-color: var(--color-border-strong);
}

.login-form__field .form-control:focus {
    border-color: var(--color-input-focus);
    background: var(--color-card);
    outline: none;
    box-shadow: none;
}

.login-form__field .form-control.is-invalid {
    border-color: var(--color-danger);
}

.login-form__field .form-control.is-invalid:focus {
    box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.1);
}

.login-form__field .invalid-feedback {
    display: block;
    margin-top: var(--spacing-1);
    font-size: var(--font-size-xs);
    color: var(--color-danger);
    font-family: var(--font-family-sans);
}

/* Password Input Wrapper */
.login-form__field .password-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.login-form__field .password-input-wrapper .form-control {
    padding-right: calc(var(--spacing-10) + var(--spacing-2));
}

.login-form__field .password-input-wrapper .password-toggle {
    position: absolute;
    right: var(--spacing-3);
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: var(--spacing-2);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color var(--transition-base), background-color var(--transition-base);
    z-index: 1;
    border-radius: var(--radius-sm);
}

.login-form__field .password-input-wrapper .password-toggle:hover {
    color: var(--color-primary);
    background: var(--color-card-muted);
}

.login-form__field .password-input-wrapper .password-toggle:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

.login-form__field .password-input-wrapper .password-toggle i {
    font-size: var(--font-size-lg);
    line-height: 1;
}

/* Form Options */
.login-form__options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-6);
    flex-wrap: wrap;
    gap: var(--spacing-2);
}

.login-form__options .form-check-input {
    border-radius: var(--radius-xs);
    cursor: pointer;
    transition: all var(--transition-base);
    border: 1px solid var(--color-input-border);
}

.login-form__options .form-check-input:checked {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
}

.login-form__options .form-check-input:focus {
    outline: 1px solid var(--color-input-focus);
    outline-offset: 2px;
    box-shadow: none;
}

.login-form__options .form-check-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    cursor: pointer;
    user-select: none;
    transition: color var(--transition-base);
    font-family: var(--font-family-sans);
}

.login-form__options .form-check-label:hover {
    color: var(--color-primary);
}

.login-form__forgot {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    text-decoration: none;
    transition: color var(--transition-base);
    padding: 0;
    border: none;
    background: transparent;
    font-family: var(--font-family-sans);
}

.login-form__forgot:hover {
    color: var(--color-primary);
    text-decoration: underline;
}

/* Submit Button - Flat Button Style */
.login-form__submit {
    margin-top: var(--spacing-4);
}

.login-form__submit .btn-primary {
    border-radius: var(--radius-base);
    padding: var(--spacing-3) var(--spacing-6);
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--letter-spacing-normal);
    background: var(--color-primary);
    border: 1px solid var(--color-primary);
    color: var(--color-text-inverse);
    transition: background-color var(--transition-base), border-color var(--transition-base);
    box-shadow: none;
    font-family: var(--font-family-sans);
}

.login-form__submit .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-dark);
    border-color: var(--color-primary-dark);
    transform: none;
    box-shadow: none;
}

.login-form__submit .btn-primary:active:not(:disabled) {
    background: var(--color-primary-dark);
    transform: none;
}

.login-form__submit .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

/* Responsive */
@media (max-width: 992px) {
    .login-wrapper {
        padding: var(--spacing-6);
    }

    .login-hero {
        display: none;
    }

    .login-card {
        max-width: 520px;
        grid-template-columns: 1fr;
    }

    .login-form {
        padding: var(--spacing-8);
    }

    .login-form__content {
        max-width: 100%;
    }
}

@media (max-width: 576px) {
    .login-wrapper {
        padding: var(--spacing-4);
    }

    .login-form {
        padding: var(--spacing-6);
    }

    .login-form__title {
        font-size: var(--font-size-xl);
    }

    .login-form__options {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-3);
    }
}
</style>