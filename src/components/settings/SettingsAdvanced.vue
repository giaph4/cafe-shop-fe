<template>
    <div class="settings-section">
        <header class="settings-section__header">
            <div class="settings-section__title-group">
                <div class="settings-section__icon-wrapper">
                    <i class="bi bi-gear-wide-connected settings-section__icon"></i>
                </div>
                <div>
                    <h2 class="settings-section__title">Nâng cao</h2>
                    <p class="settings-section__description">Cài đặt hệ thống và hiệu suất nâng cao</p>
                </div>
            </div>
        </header>

        <div class="settings-section__content">
            <!-- System Info -->
            <div class="settings-item settings-item--info">
                <div class="settings-item__header">
                    <div class="settings-item__info">
                        <label class="settings-item__label">
                            <i class="bi bi-info-circle me-2"></i>
                            Thông tin hệ thống
                        </label>
                        <p class="settings-item__description">Thông tin về phiên bản và cấu hình hệ thống</p>
                    </div>
                </div>
                <div class="settings-item__control">
                    <div class="settings-info-grid">
                        <div class="settings-info-item">
                            <span class="settings-info-item__label">Phiên bản</span>
                            <span class="settings-info-item__value">1.0.0</span>
                        </div>
                        <div class="settings-info-item">
                            <span class="settings-info-item__label">Môi trường</span>
                            <span class="settings-info-item__value">Production</span>
                        </div>
                        <div class="settings-info-item">
                            <span class="settings-info-item__label">Trình duyệt</span>
                            <span class="settings-info-item__value">{{ browserInfo }}</span>
                        </div>
                        <div class="settings-info-item">
                            <span class="settings-info-item__label">Độ phân giải</span>
                            <span class="settings-info-item__value">{{ screenResolution }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Performance Settings -->
            <div class="settings-item">
                <div class="settings-item__header">
                    <div class="settings-item__info">
                        <label class="settings-item__label">
                            <i class="bi bi-speedometer2 me-2"></i>
                            Tối ưu hiệu suất
                        </label>
                        <p class="settings-item__description">Giảm hiệu ứng và animation để tăng hiệu suất</p>
                    </div>
                </div>
                <div class="settings-item__control">
                    <label class="settings-toggle">
                        <input
                            type="checkbox"
                            v-model="localSettings.reduceMotion"
                            @change="handleReduceMotionChange"
                            class="settings-toggle__input"
                        />
                        <span class="settings-toggle__slider"></span>
                        <span class="settings-toggle__label">
                            {{ localSettings.reduceMotion ? 'Đã bật' : 'Đã tắt' }}
                        </span>
                    </label>
                </div>
            </div>

            <!-- Data Management -->
            <div class="settings-item settings-item--danger">
                <div class="settings-item__header">
                    <div class="settings-item__info">
                        <label class="settings-item__label">
                            <i class="bi bi-database me-2"></i>
                            Quản lý dữ liệu
                        </label>
                        <p class="settings-item__description">Xóa cache và dữ liệu đã lưu cục bộ</p>
                    </div>
                </div>
                <div class="settings-item__control">
                    <button
                        type="button"
                        class="btn btn-outline-danger"
                        @click="handleClearCache"
                        :disabled="clearingCache"
                    >
                        <span v-if="clearingCache" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="bi bi-trash me-2"></i>
                        Xóa cache
                    </button>
                </div>
            </div>

            <!-- Reset Settings -->
            <div class="settings-item settings-item--danger">
                <div class="settings-item__header">
                    <div class="settings-item__info">
                        <label class="settings-item__label">
                            <i class="bi bi-arrow-counterclockwise me-2"></i>
                            Đặt lại cài đặt
                        </label>
                        <p class="settings-item__description">
                            Đặt lại tất cả cài đặt về mặc định. Hành động này không thể hoàn tác.
                        </p>
                    </div>
                </div>
                <div class="settings-item__control">
                    <button
                        type="button"
                        class="btn btn-outline-danger"
                        @click="handleResetSettings"
                        :disabled="resettingSettings"
                    >
                        <span v-if="resettingSettings" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="bi bi-exclamation-triangle me-2"></i>
                        Đặt lại tất cả
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useSettingsStore } from '@/store/settings'
import { toast } from 'vue3-toastify'
import { LIGHT_THEME } from '@/utils/theme'

const settingsStore = useSettingsStore()

const localSettings = reactive({
    reduceMotion: localStorage.getItem('reduceMotion') === 'true'
})

const clearingCache = ref(false)
const resettingSettings = ref(false)

const browserInfo = computed(() => {
    const ua = navigator.userAgent
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Safari')) return 'Safari'
    if (ua.includes('Edge')) return 'Edge'
    return 'Unknown'
})

const screenResolution = computed(() => {
    return `${window.screen.width}x${window.screen.height}`
})

const handleReduceMotionChange = () => {
    localStorage.setItem('reduceMotion', String(localSettings.reduceMotion))
    if (localSettings.reduceMotion) {
        document.documentElement.style.setProperty('--transition-base', '0s')
        document.documentElement.style.setProperty('--transition-fast', '0s')
        document.documentElement.style.setProperty('--transition-slow', '0s')
    } else {
        document.documentElement.style.removeProperty('--transition-base')
        document.documentElement.style.removeProperty('--transition-fast')
        document.documentElement.style.removeProperty('--transition-slow')
    }
    toast.success(`Tối ưu hiệu suất đã ${localSettings.reduceMotion ? 'bật' : 'tắt'}`)
}

const handleClearCache = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa cache? Dữ liệu đã lưu cục bộ sẽ bị xóa.')) {
        return
    }

    clearingCache.value = true
    try {
        // Clear localStorage except theme and essential settings
        const theme = localStorage.getItem('app-theme')
        const language = localStorage.getItem('language')
        
        localStorage.clear()
        
        // Restore essential settings
        if (theme) localStorage.setItem('app-theme', theme)
        if (language) localStorage.setItem('language', language)
        
        toast.success('Đã xóa cache thành công!')
        setTimeout(() => {
            window.location.reload()
        }, 1000)
    } catch (error) {
        toast.error('Không thể xóa cache. Vui lòng thử lại.')
    } finally {
        clearingCache.value = false
    }
}

const handleResetSettings = async () => {
    if (!confirm('Bạn có chắc chắn muốn đặt lại tất cả cài đặt? Hành động này không thể hoàn tác.')) {
        return
    }

    resettingSettings.value = true
    try {
        // Reset to defaults
        settingsStore.setTheme(LIGHT_THEME)
        settingsStore.setLanguage('vi')
        settingsStore.setNotificationSound(true)
        settingsStore.setChristmasEffect(false)
        
        // Clear other settings
        localStorage.removeItem('emailNotifications')
        localStorage.removeItem('pushNotifications')
        localStorage.removeItem('reduceMotion')
        
        toast.success('Đã đặt lại tất cả cài đặt về mặc định!')
        setTimeout(() => {
            window.location.reload()
        }, 1000)
    } catch (error) {
        toast.error('Không thể đặt lại cài đặt. Vui lòng thử lại.')
    } finally {
        resettingSettings.value = false
    }
}

onMounted(() => {
    if (localSettings.reduceMotion) {
        handleReduceMotionChange()
    }
})
</script>

<style scoped>
.settings-section__icon-wrapper {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--color-soft-primary) 0%, rgba(var(--color-primary-rgb, 13, 110, 253), 0.1) 100%);
    border-radius: var(--radius-lg);
    border: 2px solid var(--color-border-contrast);
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb, 13, 110, 253), 0.15);
}

.settings-section__icon {
    font-size: var(--font-size-2xl);
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 2px 4px rgba(var(--color-primary-rgb, 13, 110, 253), 0.2));
}

.settings-item--info {
    background: linear-gradient(135deg, var(--color-soft-info) 0%, rgba(var(--color-info-rgb, 13, 202, 240), 0.05) 100%);
    border-color: var(--color-info);
    border-width: 2px;
}

.settings-item--info::before {
    background: linear-gradient(90deg, var(--color-info) 0%, var(--color-info-light) 100%);
}

.settings-item--danger {
    border-color: var(--color-danger);
    border-width: 2px;
    background: linear-gradient(135deg, rgba(var(--color-danger-rgb, 220, 53, 69), 0.05) 0%, var(--color-card-muted) 100%);
}

.settings-item--danger::before {
    background: linear-gradient(90deg, var(--color-danger) 0%, var(--color-danger-light) 100%);
}

.settings-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-4);
    width: 100%;
    max-width: 600px;
}

.settings-info-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    padding: var(--spacing-4);
    background: linear-gradient(135deg, var(--color-card) 0%, var(--color-card-muted) 100%);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-base);
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
}

.settings-info-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    background: linear-gradient(180deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    transform: scaleY(0);
    transform-origin: top;
    transition: transform 0.3s ease;
}

.settings-info-item:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-sm);
    transform: translateY(-2px);
}

.settings-info-item:hover::before {
    transform: scaleY(1);
}

.settings-info-item__label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
}

.settings-info-item__value {
    font-size: var(--font-size-base);
    color: var(--color-heading);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

@media (max-width: 768px) {
    .settings-info-grid {
        grid-template-columns: 1fr;
    }
}
</style>
