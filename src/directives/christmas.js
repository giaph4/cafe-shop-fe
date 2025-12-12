import { useSettingsStore } from '@/store/settings'

// Global reference để lưu spawnEffect function
let globalSpawnEffect = null

/**
 * Set global spawn effect function từ ChristmasEffect component
 */
export function setGlobalSpawnEffect (spawnEffectFn) {
    globalSpawnEffect = spawnEffectFn
}

/**
 * Directive Vue để thêm hiệu ứng Noel vào button
 * Sử dụng: v-christmas
 *
 * Tự động thêm event listener click và tạo hiệu ứng nổ cây thông Noel
 * Chỉ hoạt động khi setting Christmas effect được bật
 */
export default {
    mounted (el) {
        const settingsStore = useSettingsStore()

        // Kiểm tra xem Christmas effect có được bật không
        if (!settingsStore.christmasEffectEnabled) {
            return
        }

        // Lưu handler để có thể remove sau
        el._christmasHandler = () => {
            if (globalSpawnEffect) {
                globalSpawnEffect(el)
            }
        }

        // Thêm event listener (sử dụng capture phase để chạy trước)
        el.addEventListener('click', el._christmasHandler, true)

        // Thêm class để styling
        el.classList.add('has-christmas-effect')
    },

    updated (el) {
        const settingsStore = useSettingsStore()

        // Nếu setting thay đổi, cập nhật lại
        if (settingsStore.christmasEffectEnabled && !el._christmasHandler) {
            el._christmasHandler = () => {
                if (globalSpawnEffect) {
                    globalSpawnEffect(el)
                }
            }
            el.addEventListener('click', el._christmasHandler, true)
            el.classList.add('has-christmas-effect')
        } else if (!settingsStore.christmasEffectEnabled && el._christmasHandler) {
            el.removeEventListener('click', el._christmasHandler, true)
            el._christmasHandler = null
            el.classList.remove('has-christmas-effect')
        }
    },

    unmounted (el) {
        // Cleanup
        if (el._christmasHandler) {
            el.removeEventListener('click', el._christmasHandler, true)
            el._christmasHandler = null
        }
        el.classList.remove('has-christmas-effect')
    }
}
