import { defineRule, configure } from 'vee-validate'
import { required, email, min } from '@vee-validate/rules'
import { localize, setLocale } from '@vee-validate/i18n'
import vi from '@vee-validate/i18n/dist/locale/vi.json'

// Định nghĩa các rules
defineRule('required', required)
defineRule('email', email)
defineRule('min', min)

// Cấu hình để hiển thị thông báo lỗi
configure({
    generateMessage: localize({
        vi,
    }),
})

// Đặt ngôn ngữ mặc định là Tiếng Việt
setLocale('vi')