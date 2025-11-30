<template>
    <div class="login-wrapper">
        <div class="login-card" data-aos="fade-up">
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
                            <p class="demo-note">Bạn có thể sử dụng các tài khoản này để đăng nhập và trải nghiệm hệ thống.</p>
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
                            <Field 
                                name="username" 
                                type="text" 
                                class="form-control"
                                :class="{ 'is-invalid': errors.username }" 
                                id="username"
                                placeholder="ví dụ: staff01"
                                autocomplete="username"
                            />
                            <ErrorMessage name="username" class="invalid-feedback" />
                        </div>

                        <div class="login-form__field">
                            <label for="password" class="form-label">Mật khẩu</label>
                            <div class="password-input-wrapper">
                                <Field 
                                    name="password" 
                                    :type="showPassword ? 'text' : 'password'" 
                                    class="form-control"
                                    :class="{ 'is-invalid': errors.password }" 
                                    id="password"
                                    placeholder="Nhập mật khẩu"
                                    autocomplete="current-password"
                                />
                                <button
                                    type="button"
                                    class="password-toggle"
                                    @click="showPassword = !showPassword"
                                    :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'"
                                    tabindex="0"
                                >
                                    <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                                </button>
                            </div>
                            <ErrorMessage name="password" class="invalid-feedback" />
                        </div>

                        <div class="login-form__options">
                            <div class="form-check">
                                <input 
                                    class="form-check-input" 
                                    type="checkbox" 
                                    id="rememberMe"
                                    v-model="rememberMe"
                                />
                                <label class="form-check-label" for="rememberMe">
                                    Ghi nhớ lần đăng nhập này
                                </label>
                            </div>
                            <button 
                                type="button" 
                                class="btn btn-link p-0 login-form__forgot"
                                @click="handleForgotPassword"
                            >
                                Quên mật khẩu?
                            </button>
                        </div>

                        <div class="login-form__submit">
                            <button 
                                type="submit" 
                                class="btn btn-primary w-100" 
                                :disabled="isLoading"
                            >
                                <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
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
import '@/assets/styles/login.scss'

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
