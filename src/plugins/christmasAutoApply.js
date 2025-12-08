/**
 * Plugin tự động áp dụng hiệu ứng Noel cho tất cả button trong project
 * Sử dụng event delegation để bắt tất cả click trên button
 */
let globalSpawnEffect = null

export function setGlobalSpawnEffectForPlugin(spawnEffectFn) {
    globalSpawnEffect = spawnEffectFn
}

export default {
    install(app) {
        // Event delegation để bắt tất cả click trên button
        const handleButtonClick = (event) => {
            const target = event.target.closest('button, .btn, [role="button"]')
            if (!target) return
            
            // Chỉ áp dụng cho button không disabled và không phải button đóng modal/dialog
            if (target.disabled || target.classList.contains('btn-close')) return
            
            // Kiểm tra Christmas effect có được bật không
            try {
                const pinia = app.config.globalProperties.$pinia || app._context?.provides?.pinia
                if (!pinia) return
                
                const { useSettingsStore } = require('@/store/settings')
                const settingsStore = useSettingsStore(pinia)
                
                if (!settingsStore.christmasEffectEnabled) return
                
                // Gọi spawnEffect nếu có global function
                if (globalSpawnEffect) {
                    globalSpawnEffect(target)
                }
            } catch (error) {
                // Ignore errors
                console.debug('Christmas effect error:', error)
            }
        }
        
        // Thêm global event listener sau khi app mount
        app.mixin({
            mounted() {
                // Chỉ thêm listener một lần
                if (!document.body.hasAttribute('data-christmas-listener')) {
                    document.body.setAttribute('data-christmas-listener', 'true')
                    document.addEventListener('click', handleButtonClick, true)
                }
            }
        })
    }
}