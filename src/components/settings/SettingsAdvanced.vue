<template>
  <div class="settings-section">
    <header class="settings-section__header">
      <div class="settings-section__title-group">
        <i class="bi bi-gear-wide-connected settings-section__icon" />
        <div>
          <h2 class="settings-section__title">
            Nâng cao
          </h2>
          <p class="settings-section__description">
            Cài đặt hệ thống và hiệu suất nâng cao
          </p>
        </div>
      </div>
    </header>

    <div class="settings-section__content">
      <!-- System Info -->
      <div class="settings-item settings-item--info">
        <div class="settings-item__header">
          <div class="settings-item__info">
            <label class="settings-item__label">
              <i class="bi bi-info-circle me-2" />
              Thông tin hệ thống
            </label>
            <p class="settings-item__description">
              Thông tin về phiên bản và cấu hình hệ thống
            </p>
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
              <i class="bi bi-speedometer2 me-2" />
              Tối ưu hiệu suất
            </label>
            <p class="settings-item__description">
              Giảm hiệu ứng và animation để tăng hiệu suất
            </p>
          </div>
        </div>
        <div class="settings-item__control">
          <label class="settings-toggle">
            <input
              v-model="localSettings.reduceMotion"
              type="checkbox"
              class="settings-toggle__input"
              @change="handleReduceMotionChange"
            >
            <span class="settings-toggle__slider" />
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
              <i class="bi bi-database me-2" />
              Quản lý dữ liệu
            </label>
            <p class="settings-item__description">
              Xóa cache và dữ liệu đã lưu cục bộ
            </p>
          </div>
        </div>
        <div class="settings-item__control">
          <button
            type="button"
            class="btn btn-outline-danger"
            :disabled="clearingCache"
            @click="handleClearCache"
          >
            <span
              v-if="clearingCache"
              class="spinner-border spinner-border-sm me-2"
            />
            <i
              v-else
              class="bi bi-trash me-2"
            />
            Xóa cache
          </button>
        </div>
      </div>

      <!-- Reset Settings -->
      <div class="settings-item settings-item--danger">
        <div class="settings-item__header">
          <div class="settings-item__info">
            <label class="settings-item__label">
              <i class="bi bi-arrow-counterclockwise me-2" />
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
            :disabled="resettingSettings"
            @click="handleResetSettings"
          >
            <span
              v-if="resettingSettings"
              class="spinner-border spinner-border-sm me-2"
            />
            <i
              v-else
              class="bi bi-exclamation-triangle me-2"
            />
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

const screenResolution = computed(() => `${window.screen.width}x${window.screen.height}`)

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
    } catch {
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
    } catch {
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
.settings-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-5);
}

.settings-section__header {
    border-bottom: 1px solid var(--color-border);
    padding-bottom: var(--spacing-4);
    margin-bottom: var(--spacing-3);
}

.settings-section__title-group {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
}

.settings-section__icon {
    font-size: var(--font-size-xl);
    color: var(--color-primary);
    flex-shrink: 0;
}

.settings-section__title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin: 0 0 var(--spacing-1) 0;
    font-family: var(--font-family-sans);
}

.settings-section__description {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
    font-family: var(--font-family-sans);
    line-height: var(--line-height-normal);
}

.settings-section__content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
}

.settings-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    transition: border-color var(--transition-base), background-color var(--transition-base);
}

.settings-item:hover {
    border-color: var(--color-border-strong);
    background: var(--color-card-muted);
}

.settings-item--info {
    background: var(--color-card-muted);
    border-left: 3px solid var(--color-primary);
}

.settings-item--danger {
    border-left: 3px solid var(--color-danger);
}

.settings-item__header {
    flex: 1;
    min-width: 0;
}

.settings-item__info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.settings-item__label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    margin: 0;
    display: flex;
    align-items: center;
    font-family: var(--font-family-sans);
    gap: var(--spacing-2);
}

.settings-item__label i {
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
}

.settings-item__description {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
    line-height: var(--line-height-normal);
    font-family: var(--font-family-sans);
}

.settings-item__control {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-shrink: 0;
}

.settings-toggle {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    cursor: pointer;
    user-select: none;
}

.settings-toggle__input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
}

.settings-toggle__slider {
    position: relative;
    width: 44px;
    height: 24px;
    background: var(--color-border);
    border-radius: var(--radius-full);
    transition: background-color var(--transition-base);
    flex-shrink: 0;
}

.settings-toggle__slider::before {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
    left: 3px;
    top: 3px;
    background: var(--color-card);
    border-radius: var(--radius-full);
    transition: transform var(--transition-base);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.settings-toggle__input:checked + .settings-toggle__slider {
    background: var(--color-primary);
}

.settings-toggle__input:checked + .settings-toggle__slider::before {
    transform: translateX(20px);
}

.settings-toggle__label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-normal);
    font-family: var(--font-family-sans);
}

.settings-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--spacing-3);
    width: 100%;
    max-width: 600px;
}

.settings-info-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    padding: var(--spacing-3);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    transition: border-color var(--transition-base);
}

.settings-info-item:hover {
    border-color: var(--color-border-strong);
}

.settings-info-item__label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.settings-info-item__value {
    font-size: var(--font-size-base);
    color: var(--color-heading);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

@media (max-width: 768px) {
    .settings-item {
        flex-direction: column;
        align-items: flex-start;
    }

    .settings-item__control {
        width: 100%;
    }

    .settings-info-grid {
        grid-template-columns: 1fr;
    }
}
</style>
