<template>
  <div class="dark-mode-advanced">
    <div class="dark-mode-advanced__header">
      <h3 class="dark-mode-advanced__title">
        <i class="bi bi-moon-stars" />
        Dark Mode Nâng Cao
      </h3>
      <p class="dark-mode-advanced__description">
        Tùy chỉnh dark mode tự động, màu sắc tùy chỉnh và kiểm tra độ tương phản.
      </p>
    </div>

    <div class="dark-mode-advanced__content">
      <!-- Auto Dark Mode -->
      <div class="dark-mode-advanced__section">
        <div class="dark-mode-advanced__section-header">
          <label class="dark-mode-advanced__label">
            <i class="bi bi-clock" />
            Dark Mode Tự Động
          </label>
          <p class="dark-mode-advanced__hint">
            Tự động chuyển sang dark mode theo thời gian
          </p>
        </div>
        <div class="dark-mode-advanced__toggle">
          <label class="dark-mode-advanced__switch">
            <input
              v-model="settings.autoDarkMode"
              type="checkbox"
              @change="updateSettings"
            >
            <span class="dark-mode-advanced__slider" />
          </label>
          <span class="dark-mode-advanced__toggle-label">
            {{ settings.autoDarkMode ? 'Bật' : 'Tắt' }}
          </span>
        </div>
        <div
          v-if="settings.autoDarkMode"
          class="dark-mode-advanced__time-range"
        >
          <div class="dark-mode-advanced__time-input">
            <label>Bắt đầu</label>
            <input
              v-model="settings.autoDarkModeStart"
              type="time"
              @change="updateSettings"
            >
          </div>
          <div class="dark-mode-advanced__time-input">
            <label>Kết thúc</label>
            <input
              v-model="settings.autoDarkModeEnd"
              type="time"
              @change="updateSettings"
            >
          </div>
        </div>
      </div>

      <!-- Custom Dark Colors -->
      <div class="dark-mode-advanced__section">
        <div class="dark-mode-advanced__section-header">
          <label class="dark-mode-advanced__label">
            <i class="bi bi-palette" />
            Màu Dark Mode Tùy Chỉnh
          </label>
          <p class="dark-mode-advanced__hint">
            Tùy chỉnh màu sắc cho dark mode
          </p>
        </div>
        <div class="dark-mode-advanced__colors">
          <div
            v-for="colorKey in darkColorKeys"
            :key="colorKey"
            class="dark-mode-advanced__color-item"
          >
            <label class="dark-mode-advanced__color-label">
              {{ getDarkColorLabel(colorKey) }}
            </label>
            <div class="dark-mode-advanced__color-controls">
              <input
                v-model="darkColors[colorKey]"
                type="color"
                class="dark-mode-advanced__color-input"
                @input="updateDarkColors"
              >
              <input
                v-model="darkColors[colorKey]"
                type="text"
                class="dark-mode-advanced__color-text"
                placeholder="#000000"
                @input="updateDarkColors"
              >
            </div>
          </div>
        </div>
        <div class="dark-mode-advanced__color-actions">
          <button
            class="dark-mode-advanced__btn dark-mode-advanced__btn--secondary"
            @click="resetDarkColors"
          >
            <i class="bi bi-arrow-counterclockwise" />
            Đặt lại
          </button>
          <button
            class="dark-mode-advanced__btn dark-mode-advanced__btn--primary"
            @click="saveDarkColors"
          >
            <i class="bi bi-save" />
            Lưu màu
          </button>
        </div>
      </div>

      <!-- Contrast Ratio Checker -->
      <div class="dark-mode-advanced__section">
        <div class="dark-mode-advanced__section-header">
          <label class="dark-mode-advanced__label">
            <i class="bi bi-eye" />
            Kiểm Tra Độ Tương Phản
          </label>
          <p class="dark-mode-advanced__hint">
            Kiểm tra độ tương phản giữa màu chữ và nền theo tiêu chuẩn WCAG
          </p>
        </div>
        <div class="dark-mode-advanced__contrast-checker">
          <div class="dark-mode-advanced__contrast-inputs">
            <div class="dark-mode-advanced__contrast-input">
              <label>Màu chữ (Foreground)</label>
              <div class="dark-mode-advanced__contrast-color-controls">
                <input
                  v-model="contrastForeground"
                  type="color"
                  class="dark-mode-advanced__contrast-color-picker"
                >
                <input
                  v-model="contrastForeground"
                  type="text"
                  class="dark-mode-advanced__contrast-color-text"
                  placeholder="#000000"
                >
              </div>
            </div>
            <div class="dark-mode-advanced__contrast-input">
              <label>Màu nền (Background)</label>
              <div class="dark-mode-advanced__contrast-color-controls">
                <input
                  v-model="contrastBackground"
                  type="color"
                  class="dark-mode-advanced__contrast-color-picker"
                >
                <input
                  v-model="contrastBackground"
                  type="text"
                  class="dark-mode-advanced__contrast-color-text"
                  placeholder="#FFFFFF"
                >
              </div>
            </div>
          </div>
          <div class="dark-mode-advanced__contrast-preview">
            <div
              class="dark-mode-advanced__contrast-sample"
              :style="{
                backgroundColor: contrastBackground,
                color: contrastForeground
              }"
            >
              <div class="dark-mode-advanced__contrast-sample-text">
                Văn bản mẫu để kiểm tra độ tương phản
              </div>
            </div>
          </div>
          <div class="dark-mode-advanced__contrast-results">
            <div class="dark-mode-advanced__contrast-result">
              <div class="dark-mode-advanced__contrast-ratio">
                <span class="dark-mode-advanced__contrast-label">Tỷ lệ tương phản:</span>
                <span class="dark-mode-advanced__contrast-value">{{ contrastResult.ratio }}:1</span>
              </div>
              <div class="dark-mode-advanced__contrast-compliance">
                <div
                  v-for="compliance in complianceResults"
                  :key="compliance.key"
                  class="dark-mode-advanced__compliance-item"
                  :class="{
                    'dark-mode-advanced__compliance-item--pass': compliance.passes,
                    'dark-mode-advanced__compliance-item--fail': !compliance.passes
                  }"
                >
                  <i
                    :class="`bi ${compliance.passes ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`"
                  />
                  <span>{{ compliance.label }}</span>
                  <span class="dark-mode-advanced__compliance-status">
                    {{ compliance.passes ? 'Đạt' : 'Không đạt' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contrast Level Setting -->
      <div class="dark-mode-advanced__section">
        <div class="dark-mode-advanced__section-header">
          <label class="dark-mode-advanced__label">
            <i class="bi bi-shield-check" />
            Tiêu Chuẩn Tương Phản
          </label>
          <p class="dark-mode-advanced__hint">
            Chọn mức độ tương phản yêu cầu
          </p>
        </div>
        <div class="dark-mode-advanced__options">
          <button
            v-for="option in contrastLevelOptions"
            :key="option.value"
            class="dark-mode-advanced__option"
            :class="{ 'dark-mode-advanced__option--active': settings.contrastRatio === option.value }"
            @click="updateSetting('contrastRatio', option.value)"
          >
            <i :class="`bi ${option.icon}`" />
            <span>{{ option.label }}</span>
            <span class="dark-mode-advanced__option-desc">{{ option.description }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useSettingsStore } from '@/store/settings'
import { useToast } from '@/composables/useToast'
import { checkContrastCompliance, isDarkModeTime } from '@/utils/customTheme'

const settingsStore = useSettingsStore()
const toast = useToast()

const settings = ref({ ...settingsStore.darkModeSettings })
const darkColors = ref({
    primary: '#5D6D7E',
    secondary: '#6C757D',
    background: '#1A252F',
    text: '#F8F9FA'
})

const contrastForeground = ref('#F8F9FA')
const contrastBackground = ref('#1A252F')

const darkColorKeys = ['primary', 'secondary', 'background', 'text']

const contrastLevelOptions = [
    {
        value: 'AA',
        label: 'AA',
        description: 'Tối thiểu (4.5:1)',
        icon: 'bi-shield-check'
    },
    {
        value: 'AAA',
        label: 'AAA',
        description: 'Khuyến nghị (7:1)',
        icon: 'bi-shield-fill-check'
    }
]

const contrastResult = computed(() => {
    if (!contrastForeground.value || !contrastBackground.value) {
        return { ratio: 0, passes: false }
    }
    try {
        const result = checkContrastCompliance(
            contrastForeground.value,
            contrastBackground.value,
            settings.value.contrastRatio,
            'normal'
        )
        return result
    } catch {
        return { ratio: 0, passes: false }
    }
})

const complianceResults = computed(() => {
    if (!contrastForeground.value || !contrastBackground.value) {
        return []
    }
    return [
        {
            key: 'aa-normal',
            label: 'AA - Chữ thường',
            passes: checkContrastCompliance(contrastForeground.value, contrastBackground.value, 'AA', 'normal').passes
        },
        {
            key: 'aa-large',
            label: 'AA - Chữ lớn',
            passes: checkContrastCompliance(contrastForeground.value, contrastBackground.value, 'AA', 'large').passes
        },
        {
            key: 'aaa-normal',
            label: 'AAA - Chữ thường',
            passes: checkContrastCompliance(contrastForeground.value, contrastBackground.value, 'AAA', 'normal').passes
        },
        {
            key: 'aaa-large',
            label: 'AAA - Chữ lớn',
            passes: checkContrastCompliance(contrastForeground.value, contrastBackground.value, 'AAA', 'large').passes
        }
    ]
})

const getDarkColorLabel = (key) => {
    const labels = {
        primary: 'Màu chính',
        secondary: 'Màu phụ',
        background: 'Nền',
        text: 'Chữ'
    }
    return labels[key] || key
}

const updateSettings = () => {
    settingsStore.updateDarkModeSettings(settings.value)
    if (settings.value.autoDarkMode) {
        startAutoDarkModeCheck()
    } else {
        stopAutoDarkModeCheck()
    }
    toast.success('Đã cập nhật cài đặt dark mode')
}

const updateSetting = (key, value) => {
    settings.value[key] = value
    updateSettings()
}

const updateDarkColors = () => {
    // Live preview
    if (typeof document !== 'undefined') {
        const root = document.documentElement
        Object.entries(darkColors.value).forEach(([key, value]) => {
            root.style.setProperty(`--color-dark-${key}`, value)
        })
    }
}

const saveDarkColors = () => {
    settings.value.customDarkColors = { ...darkColors.value }
    updateSettings()
    toast.success('Đã lưu màu dark mode tùy chỉnh')
}

const resetDarkColors = () => {
    darkColors.value = {
        primary: '#5D6D7E',
        secondary: '#6C757D',
        background: '#1A252F',
        text: '#F8F9FA'
    }
    updateDarkColors()
    toast.info('Đã đặt lại màu dark mode')
}

// Auto dark mode check
let autoDarkModeInterval = null

const checkAutoDarkMode = () => {
    if (!settings.value.autoDarkMode) return

    const isDark = isDarkModeTime(
        settings.value.autoDarkModeStart,
        settings.value.autoDarkModeEnd
    )

    // Apply dark mode if needed
    if (isDark && !document.documentElement.classList.contains('dark-mode-active')) {
        document.documentElement.classList.add('dark-mode-active')
        if (settings.value.customDarkColors) {
            Object.entries(settings.value.customDarkColors).forEach(([key, value]) => {
                document.documentElement.style.setProperty(`--color-${key}`, value)
            })
        }
    } else if (!isDark && document.documentElement.classList.contains('dark-mode-active')) {
        document.documentElement.classList.remove('dark-mode-active')
        // Reset colors
        Object.keys(settings.value.customDarkColors || {}).forEach(key => {
            document.documentElement.style.removeProperty(`--color-${key}`)
        })
    }
}

const startAutoDarkModeCheck = () => {
    if (autoDarkModeInterval) return
    checkAutoDarkMode() // Check immediately
    autoDarkModeInterval = setInterval(checkAutoDarkMode, 60000) // Check every minute
}

const stopAutoDarkModeCheck = () => {
    if (autoDarkModeInterval) {
        clearInterval(autoDarkModeInterval)
        autoDarkModeInterval = null
    }
    document.documentElement.classList.remove('dark-mode-active')
}

// Watch for external changes
watch(() => settingsStore.darkModeSettings, (newSettings) => {
    settings.value = { ...newSettings }
    if (newSettings.customDarkColors) {
        darkColors.value = { ...newSettings.customDarkColors }
    }
}, { deep: true })

watch(contrastForeground, () => {
    // Recalculate contrast
})

watch(contrastBackground, () => {
    // Recalculate contrast
})

onMounted(() => {
    if (settings.value.customDarkColors) {
        darkColors.value = { ...settings.value.customDarkColors }
    }
    if (settings.value.autoDarkMode) {
        startAutoDarkModeCheck()
    }
})

onBeforeUnmount(() => {
    stopAutoDarkModeCheck()
})
</script>

<style scoped>
.dark-mode-advanced {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
}

.dark-mode-advanced__header {
    margin-bottom: var(--spacing-4);
}

.dark-mode-advanced__title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    margin: 0 0 var(--spacing-2) 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
}

.dark-mode-advanced__title i {
    color: var(--color-primary);
}

.dark-mode-advanced__description {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    margin: 0;
}

.dark-mode-advanced__content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
}

.dark-mode-advanced__section {
    padding: var(--spacing-5);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
}

.dark-mode-advanced__section-header {
    margin-bottom: var(--spacing-4);
}

.dark-mode-advanced__label {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
}

.dark-mode-advanced__label i {
    color: var(--color-primary);
}

.dark-mode-advanced__hint {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: var(--spacing-1) 0 0 0;
}

/* Toggle Switch */
.dark-mode-advanced__toggle {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
}

.dark-mode-advanced__switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 26px;
}

.dark-mode-advanced__switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.dark-mode-advanced__slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--color-border);
    transition: var(--transition-base);
    border-radius: var(--radius-full);
}

.dark-mode-advanced__slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: var(--transition-base);
    border-radius: 50%;
}

.dark-mode-advanced__switch input:checked + .dark-mode-advanced__slider {
    background-color: var(--color-primary);
}

.dark-mode-advanced__switch input:checked + .dark-mode-advanced__slider:before {
    transform: translateX(24px);
}

.dark-mode-advanced__toggle-label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text);
}

/* Time Range */
.dark-mode-advanced__time-range {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-4);
    margin-top: var(--spacing-4);
    padding-top: var(--spacing-4);
    border-top: 1px solid var(--color-border);
}

.dark-mode-advanced__time-input {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.dark-mode-advanced__time-input label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
}

.dark-mode-advanced__time-input input {
    padding: var(--spacing-3);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-input-bg);
    color: var(--color-text);
    font-size: var(--font-size-base);
}

.dark-mode-advanced__time-input input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(var(--bs-primary-rgb, 13, 110, 253), 0.1);
}

/* Colors */
.dark-mode-advanced__colors {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-4);
    margin-bottom: var(--spacing-4);
}

.dark-mode-advanced__color-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.dark-mode-advanced__color-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
}

.dark-mode-advanced__color-controls {
    display: flex;
    gap: var(--spacing-2);
    align-items: center;
}

.dark-mode-advanced__color-input {
    width: 50px;
    height: 40px;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    padding: 0;
}

.dark-mode-advanced__color-text {
    flex: 1;
    padding: var(--spacing-2) var(--spacing-3);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-input-bg);
    color: var(--color-text);
    font-family: 'Courier New', monospace;
    font-size: var(--font-size-sm);
}

.dark-mode-advanced__color-actions {
    display: flex;
    gap: var(--spacing-3);
    justify-content: flex-end;
}

.dark-mode-advanced__btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-3) var(--spacing-5);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: all var(--transition-base);
}

.dark-mode-advanced__btn--primary {
    background: var(--color-primary);
    color: var(--color-primary-contrast);
    border-color: var(--color-primary);
}

.dark-mode-advanced__btn--primary:hover {
    background: var(--color-primary-dark);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.dark-mode-advanced__btn--secondary {
    background: var(--color-card);
    color: var(--color-text);
    border-color: var(--color-border);
}

.dark-mode-advanced__btn--secondary:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

/* Contrast Checker */
.dark-mode-advanced__contrast-checker {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
}

.dark-mode-advanced__contrast-inputs {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-4);
}

.dark-mode-advanced__contrast-input {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.dark-mode-advanced__contrast-input label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
}

.dark-mode-advanced__contrast-color-controls {
    display: flex;
    gap: var(--spacing-2);
    align-items: center;
}

.dark-mode-advanced__contrast-color-picker {
    width: 50px;
    height: 40px;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    padding: 0;
}

.dark-mode-advanced__contrast-color-text {
    flex: 1;
    padding: var(--spacing-2) var(--spacing-3);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-input-bg);
    color: var(--color-text);
    font-family: 'Courier New', monospace;
    font-size: var(--font-size-sm);
}

.dark-mode-advanced__contrast-preview {
    margin: var(--spacing-4) 0;
}

.dark-mode-advanced__contrast-sample {
    padding: var(--spacing-6);
    border-radius: var(--radius-md);
    border: 2px solid var(--color-border);
    min-height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.dark-mode-advanced__contrast-sample-text {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-medium);
}

.dark-mode-advanced__contrast-results {
    padding: var(--spacing-4);
    background: var(--color-card-muted);
    border-radius: var(--radius-md);
}

.dark-mode-advanced__contrast-ratio {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-4);
    padding-bottom: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
}

.dark-mode-advanced__contrast-label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
}

.dark-mode-advanced__contrast-value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
    font-family: 'Courier New', monospace;
}

.dark-mode-advanced__contrast-compliance {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.dark-mode-advanced__compliance-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
}

.dark-mode-advanced__compliance-item--pass {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.dark-mode-advanced__compliance-item--fail {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.dark-mode-advanced__compliance-status {
    margin-left: auto;
    font-weight: var(--font-weight-semibold);
}

/* Options */
.dark-mode-advanced__options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-3);
}

.dark-mode-advanced__option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-4);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-card);
    color: var(--color-text);
    cursor: pointer;
    transition: all var(--transition-base);
    text-align: center;
}

.dark-mode-advanced__option:hover {
    border-color: var(--color-primary);
    background: var(--color-soft-primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
}

.dark-mode-advanced__option--active {
    border-color: var(--color-primary);
    background: var(--color-primary);
    color: var(--color-primary-contrast);
    box-shadow: 0 0 0 3px rgba(var(--bs-primary-rgb, 13, 110, 253), 0.15);
}

.dark-mode-advanced__option i {
    font-size: var(--font-size-xl);
}

.dark-mode-advanced__option-desc {
    font-size: var(--font-size-xs);
    opacity: 0.8;
}

/* Responsive */
@media (max-width: 768px) {
    .dark-mode-advanced__colors {
        grid-template-columns: 1fr;
    }

    .dark-mode-advanced__contrast-inputs {
        grid-template-columns: 1fr;
    }

    .dark-mode-advanced__options {
        grid-template-columns: 1fr;
    }
}
</style>

