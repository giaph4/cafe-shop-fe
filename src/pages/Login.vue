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
                        </div>
                    </article>
                </div>
            </section>

            <section class="login-form">
                <div class="card-body">
                    <h2>Chào mừng trở lại!</h2>
                    <p>Nhập thông tin đăng nhập để tiếp tục quản lý quán của bạn.</p>

                    <Form @submit="handleLogin" :validation-schema="loginSchema" v-slot="{ errors }">
                        <div class="mb-3">
                            <label for="username" class="form-label">Tên đăng nhập</label>
                            <Field name="username" type="text" class="form-control"
                                :class="{ 'is-invalid': errors.username }" id="username"
                                placeholder="ví dụ: staff01" />
                            <ErrorMessage name="username" class="invalid-feedback" />
                        </div>

                        <div class="mb-3">
                            <label for="password" class="form-label">Mật khẩu</label>
                            <Field name="password" type="password" class="form-control"
                                :class="{ 'is-invalid': errors.password }" id="password"
                                placeholder="Nhập mật khẩu" />
                            <ErrorMessage name="password" class="invalid-feedback" />
                        </div>

                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" value="" id="rememberMe">
                                <label class="form-check-label" for="rememberMe">
                                    Ghi nhớ lần đăng nhập này
                                </label>
                            </div>
                            <button type="button" class="btn btn-link p-0 forgot-password">Quên mật khẩu?</button>
                        </div>

                        <div class="d-grid">
                            <button type="submit" class="btn btn-primary" :disabled="isLoading">
                                <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status"
                                    aria-hidden="true"></span>
                                <span v-else>Đăng nhập</span>
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

const loginSchema = yup.object({
    username: yup.string()
        .required('Tên đăng nhập là bắt buộc')
        .min(4, 'Tên đăng nhập phải có ít nhất 4 ký tự'),
    password: yup.string()
        .required('Mật khẩu là bắt buộc')
        .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
})

const handleLogin = async (values) => {
    isLoading.value = true
    try {
        await authStore.login(values)

        router.push('/')

    } catch (error) {
        // Login error handled by toast notification
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            toast.error('Tên đăng nhập hoặc mật khẩu không đúng.')
        } else {
            toast.error('Đã xảy ra lỗi. Vui lòng thử lại.')
        }
    } finally {
        isLoading.value = false
    }
}
</script>

<style scoped>
.form-control-lg {
    border-radius: 12px;
    padding: 0.75rem 1rem;
}
</style>