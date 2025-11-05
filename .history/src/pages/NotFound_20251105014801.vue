<template>
    <div class="login-wrapper">
        <div class="container">
            <div class="row justify-content-center align-items-center min-vh-100">
                <div class="col-md-6 col-lg-4">
                    <div class="card p-4" data-aos="fade-up">
                        <div class="card-body">
                            <div class="text-center mb-4">
                                <i class="bi bi-cup-hot-fill text-primary" style="font-size: 3rem;"></i>
                                <h2 class="mt-2">Cafe Dashboard</h2>
                                <p class="text-muted">Chào mừng trở lại, vui lòng đăng nhập.</p>
                            </div>

                            <Form @submit="handleLogin" :validation-schema="loginSchema" v-slot="{ errors }">
                                <div class="mb-3">
                                    <label for="username" class="form-label fw-bold">Tên đăng nhập</label>
                                    <Field name="username" type="text" class="form-control form-control-lg"
                                        :class="{ 'is-invalid': errors.username }" id="username"
                                        placeholder="Nhân viên 01" />
                                    <ErrorMessage name="username" class="invalid-feedback" />
                                </div>

                                <div class="mb-3">
                                    <label for="password" class="form-label fw-bold">Mật khẩu</label>
                                    <Field name="password" type="password" class="form-control form-control-lg"
                                        :class="{ 'is-invalid': errors.password }" id="password"
                                        placeholder="••••••••" />
                                    <ErrorMessage name="password" class="invalid-feedback" />
                                </div>

                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" value="" id="rememberMe">
                                        <label class="form-check-label small" for="rememberMe">
                                            Ghi nhớ tôi
                                        </label>
                                    </div>
                                    <a href="#" class="small text-primary text-decoration-none">Quên mật khẩu?</a>
                                </div>

                                <div class="d-grid">
                                    <button type="submit" class="btn btn-primary btn-lg" :disabled="isLoading">
                                        <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status"
                                            aria-hidden="true"></span>
                                        <span v-else>Đăng nhập</span>
                                    </button>
                                </div>
                            </Form>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>

</script>

<style scoped>

</style>