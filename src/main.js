import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './store/auth'
import { resolveInitialTheme, applyThemeClass, persistTheme } from '@/utils/theme'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'aos/dist/aos.css'
import 'vue3-toastify/dist/index.css'
import './assets/styles/base.css'
import './assets/styles/standardized-components.css'

// PrimeVue
import PrimeVue from 'primevue/config'

import Toast from 'vue3-toastify'
import AOS from 'aos'
import christmasDirective from '@/directives/christmas'

const initialTheme = resolveInitialTheme()
applyThemeClass(initialTheme)
persistTheme(initialTheme)

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(VueQueryPlugin)
app.use(router)
app.use(PrimeVue)

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
    bodyClassName: 'di-body',
})



AOS.init({
    duration: 800,
    once: true,
})

// Đăng ký directive Christmas
app.directive('christmas', christmasDirective.default || christmasDirective)

// Import và sử dụng plugin tự động áp dụng Christmas effect
import christmasAutoApply from '@/plugins/christmasAutoApply'

const authStore = useAuthStore(pinia)
authStore.checkAuth().then(() => {
    app.mount('#app')
    // Áp dụng plugin sau khi app đã mount
    app.use(christmasAutoApply)
})
