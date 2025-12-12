import { defineRule, configure } from 'vee-validate'
import { required, email, min } from '@vee-validate/rules'
import { localize, setLocale } from '@vee-validate/i18n'
import vi from '@vee-validate/i18n/dist/locale/vi.json'

defineRule('required', required)
defineRule('email', email)
defineRule('min', min)

configure({
    generateMessage: localize({
        vi
    })
})

setLocale('vi')
