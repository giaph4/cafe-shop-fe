import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import router from './router'

// Import CSS
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'animate.css'
import 'aos/dist/aos.css'
import '@fortawesome/fontawesome-free/css/all.min.css'

import 'vue3-toastify/dist/index.css';

import '@/assets/styles/main.scss'

import AOS from 'aos'

const app = createApp(App)

app.use(createPinia())
app.use(VueQueryPlugin)
app.use(router)

app.mount('#app')
=
AOS.init({
    duration: 800,
    once: false,
})