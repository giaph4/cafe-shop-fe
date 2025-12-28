import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import PrimeVue from 'primevue/config'
import Toast from 'vue3-toastify'
import AOS from 'aos'

import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { useAuthStore } from './store/auth'
import { resolveInitialTheme, applyThemeClass, persistTheme } from '@/utils/theme'
import christmasDirective from '@/directives/christmas'
import christmasAutoApply from '@/plugins/christmasAutoApply'

// Import CSS
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'aos/dist/aos.css'
import 'vue3-toastify/dist/index.css'
import './assets/styles/base.css'
import './assets/styles/standardized-components.css'
import './assets/styles/custom-theme.css'

// Khởi tạo theme ban đầu
const initialTheme = resolveInitialTheme()
applyThemeClass(initialTheme)
persistTheme(initialTheme)

// Tạo ứng dụng Vue
const app = createApp(App)
const pinia = createPinia()

// Đăng ký các plugin
app.use(pinia)
app.use(VueQueryPlugin)
app.use(router)
app.use(i18n)
app.use(PrimeVue)

// Cấu hình Toast
app.use(Toast, {
    position: 'top-center',
    timeout: 2600,
    closeOnClick: true,
    pauseOnHover: false,
    pauseOnFocusLoss: false,
    draggable: false,
    hideProgressBar: true,
    closeButton: false,
    icon: true,
    maxToasts: 2,
    newestOnTop: true,
    toastClassName: 'di-toast',
    bodyClassName: 'di-body'
})

// Khởi tạo AOS (Animate On Scroll)
AOS.init({
    duration: 800,
    once: true
})

// Đăng ký directive hiệu ứng Giáng Sinh
app.directive('christmas', christmasDirective.default || christmasDirective)

// Kiểm tra authentication và mount app
const authStore = useAuthStore(pinia)
authStore.checkAuth().then(() => {
    app.use(christmasAutoApply)
    app.mount('#app')
})
