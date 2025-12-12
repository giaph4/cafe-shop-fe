<template>
  <div class="theme-builder">
    <div class="theme-builder__header">
      <h3 class="theme-builder__title">
        <i class="bi bi-palette-fill" />
        Tạo Theme Tùy Chỉnh
      </h3>
      <p class="theme-builder__description">
        Tạo theme riêng của bạn bằng cách chọn màu sắc. Thay đổi sẽ được xem trước ngay lập tức.
      </p>
    </div>

    <div class="theme-builder__content">
      <!-- Color Picker Section -->
      <div class="theme-builder__colors">
        <div
          v-for="colorKey in colorKeys"
          :key="colorKey"
          class="theme-builder__color-item"
        >
          <label class="theme-builder__color-label">
            <span class="theme-builder__color-name">{{ getColorLabel(colorKey) }}</span>
            <span class="theme-builder__color-value">{{ customColors[colorKey] }}</span>
          </label>
          <div class="theme-builder__color-controls">
            <input
              v-model="customColors[colorKey]"
              type="color"
              class="theme-builder__color-input"
              @input="updatePreview"
            >
            <input
              v-model="customColors[colorKey]"
              type="text"
              class="theme-builder__color-text"
              placeholder="#000000"
              @input="updatePreview"
            >
            <button
              class="theme-builder__color-preset-btn"
              @click="showPresets(colorKey)"
            >
              <i class="bi bi-palette" />
            </button>
          </div>
        </div>
      </div>

      <!-- Preset Colors Modal -->
      <div
        v-if="showPresetModal"
        class="theme-builder__preset-modal"
        @click.self="showPresetModal = false"
      >
        <div class="theme-builder__preset-content">
          <div class="theme-builder__preset-header">
            <h4>Chọn màu cho {{ getColorLabel(selectedColorKey) }}</h4>
            <button
              class="theme-builder__preset-close"
              @click="showPresetModal = false"
            >
              <i class="bi bi-x-lg" />
            </button>
          </div>
          <div class="theme-builder__preset-grid">
            <button
              v-for="preset in getPresetsForColor(selectedColorKey)"
              :key="preset"
              class="theme-builder__preset-item"
              :style="{ backgroundColor: preset }"
              @click="selectPreset(preset)"
            >
              <span class="theme-builder__preset-code">{{ preset }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Theme Name & Actions -->
      <div class="theme-builder__actions">
        <div class="theme-builder__name-input">
          <label>Tên Theme</label>
          <input
            v-model="themeName"
            type="text"
            placeholder="Nhập tên theme..."
            class="theme-builder__name-field"
          >
        </div>
        <div class="theme-builder__buttons">
          <button
            class="theme-builder__btn theme-builder__btn--secondary"
            @click="resetColors"
          >
            <i class="bi bi-arrow-counterclockwise" />
            Đặt lại
          </button>
          <button
            class="theme-builder__btn theme-builder__btn--primary"
            :disabled="!themeName.trim()"
            @click="saveTheme"
          >
            <i class="bi bi-save" />
            Lưu Theme
          </button>
        </div>
      </div>

      <!-- Saved Themes List -->
      <div
        v-if="savedThemes.length > 0"
        class="theme-builder__saved"
      >
        <h4 class="theme-builder__saved-title">
          Theme đã lưu
        </h4>
        <div class="theme-builder__saved-grid">
          <div
            v-for="theme in savedThemes"
            :key="theme.id"
            class="theme-builder__saved-item"
          >
            <div class="theme-builder__saved-preview">
              <div
                v-for="(color, key) in theme.colors"
                :key="key"
                class="theme-builder__saved-color"
                :style="{ backgroundColor: color }"
              />
            </div>
            <div class="theme-builder__saved-info">
              <div class="theme-builder__saved-name">
                {{ theme.name }}
              </div>
              <div class="theme-builder__saved-actions">
                <button
                  class="theme-builder__saved-btn"
                  @click="loadTheme(theme)"
                >
                  <i class="bi bi-upload" />
                  Tải
                </button>
                <button
                  class="theme-builder__saved-btn"
                  @click="exportTheme(theme)"
                >
                  <i class="bi bi-download" />
                  Xuất
                </button>
                <button
                  class="theme-builder__saved-btn theme-builder__saved-btn--danger"
                  @click="deleteTheme(theme.id)"
                >
                  <i class="bi bi-trash" />
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Export/Import Section -->
      <div class="theme-builder__import-export">
        <div class="theme-builder__import-export-item">
          <label>Xuất Theme</label>
          <div class="theme-builder__import-export-controls">
            <textarea
              :value="exportJson"
              readonly
              class="theme-builder__json-textarea"
              rows="4"
            />
            <button
              class="theme-builder__btn theme-builder__btn--secondary"
              @click="copyToClipboard"
            >
              <i class="bi bi-clipboard" />
              Sao chép
            </button>
          </div>
        </div>
        <div class="theme-builder__import-export-item">
          <label>Nhập Theme (JSON)</label>
          <div class="theme-builder__import-export-controls">
            <textarea
              v-model="importJson"
              class="theme-builder__json-textarea"
              rows="4"
              placeholder="Dán JSON theme vào đây..."
            />
            <button
              class="theme-builder__btn theme-builder__btn--primary"
              :disabled="!importJson.trim()"
              @click="importTheme"
            >
              <i class="bi bi-upload" />
              Nhập
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useSettingsStore } from '@/store/settings'
import { generateThemeId, exportTheme as exportThemeUtil, importTheme as importThemeUtil } from '@/utils/customTheme'
import { useToast } from '@/composables/useToast'

const settingsStore = useSettingsStore()
const toast = useToast()

// Color definitions
const colorKeys = ['primary', 'secondary', 'accent', 'background', 'text', 'success', 'warning', 'danger']

const customColors = ref({
    primary: '#0D6EFD',
    secondary: '#6C757D',
    accent: '#0DCAF0',
    background: '#FFFFFF',
    text: '#212529',
    success: '#198754',
    warning: '#FFC107',
    danger: '#DC3545'
})

const themeName = ref('')
const showPresetModal = ref(false)
const selectedColorKey = ref(null)
const importJson = ref('')

const savedThemes = computed(() => settingsStore.customThemes)

const exportJson = computed(() => {
    if (!themeName.value.trim()) return ''
    const themeData = {
        name: themeName.value,
        colors: { ...customColors.value },
        createdAt: new Date().toISOString()
    }
    return exportThemeUtil(themeData)
})

// Color labels
const getColorLabel = (key) => {
    const labels = {
        primary: 'Màu chính',
        secondary: 'Màu phụ',
        accent: 'Màu nhấn',
        background: 'Nền',
        text: 'Chữ',
        success: 'Thành công',
        warning: 'Cảnh báo',
        danger: 'Nguy hiểm'
    }
    return labels[key] || key
}

// Color presets
const colorPresets = {
    primary: ['#0D6EFD', '#6F42C1', '#198754', '#FFC107', '#DC3545', '#0DCAF0', '#6610F2', '#D63384'],
    secondary: ['#6C757D', '#495057', '#868E96', '#ADB5BD', '#CED4DA', '#DEE2E6', '#E9ECEF', '#F8F9FA'],
    accent: ['#0DCAF0', '#20C997', '#FFC107', '#FD7E14', '#E91E63', '#9C27B0', '#3F51B5', '#00BCD4'],
    background: ['#FFFFFF', '#F8F9FA', '#E9ECEF', '#DEE2E6', '#1A252F', '#121212', '#0A192F', '#1C1C1C'],
    text: ['#212529', '#495057', '#6C757D', '#FFFFFF', '#F8F9FA', '#E9ECEF', '#DEE2E6', '#ADB5BD'],
    success: ['#198754', '#157347', '#20C997', '#10B981', '#059669', '#047857', '#065F46', '#064E3B'],
    warning: ['#FFC107', '#FFB300', '#FFA000', '#FF8F00', '#FF6F00', '#FF9800', '#F57C00', '#E65100'],
    danger: ['#DC3545', '#BB2D3B', '#B02A5B', '#C0392B', '#A93226', '#E81123', '#D10E1F', '#B71C1C']
}

const getPresetsForColor = (key) => colorPresets[key] || []

const showPresets = (colorKey) => {
    selectedColorKey.value = colorKey
    showPresetModal.value = true
}

const selectPreset = (color) => {
    if (selectedColorKey.value) {
        customColors.value[selectedColorKey.value] = color
        updatePreview()
    }
    showPresetModal.value = false
}

// Update preview
const updatePreview = () => {
    if (typeof document === 'undefined') return
    const root = document.documentElement

    // Apply custom colors as CSS variables
    Object.entries(customColors.value).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value)
    })
}

// Reset colors
const resetColors = () => {
    customColors.value = {
        primary: '#0D6EFD',
        secondary: '#6C757D',
        accent: '#0DCAF0',
        background: '#FFFFFF',
        text: '#212529',
        success: '#198754',
        warning: '#FFC107',
        danger: '#DC3545'
    }
    updatePreview()
    toast.info('Đã đặt lại màu sắc')
}

// Save theme
const saveTheme = () => {
    if (!themeName.value.trim()) {
        toast.error('Vui lòng nhập tên theme')
        return
    }

    const themeData = {
        id: generateThemeId(),
        name: themeName.value.trim(),
        colors: { ...customColors.value },
        createdAt: new Date().toISOString()
    }

    settingsStore.saveCustomTheme(themeData)
    toast.success(`Đã lưu theme "${themeName.value}"`)
    themeName.value = ''
}

// Load theme
const loadTheme = (theme) => {
    customColors.value = { ...theme.colors }
    themeName.value = theme.name
    updatePreview()
    toast.info(`Đã tải theme "${theme.name}"`)
}

// Delete theme
const deleteTheme = (themeId) => {
    if (confirm('Bạn có chắc muốn xóa theme này?')) {
        settingsStore.deleteCustomTheme(themeId)
        toast.success('Đã xóa theme')
    }
}

// Export theme
const exportTheme = (theme) => {
    const json = exportThemeUtil(theme)
    importJson.value = json
    toast.info('Đã sao chép theme vào ô nhập')
}

// Import theme
const importTheme = () => {
    try {
        const themeData = importThemeUtil(importJson.value)
        if (!themeData.name || !themeData.colors) {
            throw new Error('Invalid theme format')
        }

        // Load theme
        customColors.value = { ...themeData.colors }
        themeName.value = themeData.name || ''
        updatePreview()

        // Optionally save
        if (confirm('Bạn có muốn lưu theme này không?')) {
            const themeToSave = {
                id: generateThemeId(),
                name: themeData.name,
                colors: themeData.colors,
                createdAt: new Date().toISOString()
            }
            settingsStore.saveCustomTheme(themeToSave)
            toast.success('Đã nhập và lưu theme')
        } else {
            toast.success('Đã nhập theme')
        }

        importJson.value = ''
    } catch (error) {
        toast.error('Lỗi: Định dạng JSON không hợp lệ')
        console.error('Import theme error:', error)
    }
}

// Copy to clipboard
const copyToClipboard = () => {
    if (!exportJson.value) {
        toast.error('Không có gì để sao chép')
        return
    }

    navigator.clipboard.writeText(exportJson.value).then(() => {
        toast.success('Đã sao chép vào clipboard')
    }).catch(() => {
        toast.error('Không thể sao chép')
    })
}

// Watch for changes
watch(customColors, () => {
    updatePreview()
}, { deep: true })

onMounted(() => {
    updatePreview()
})
</script>

<style scoped>
.theme-builder {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
}

.theme-builder__header {
    margin-bottom: var(--spacing-4);
}

.theme-builder__title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    margin: 0 0 var(--spacing-2) 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
}

.theme-builder__title i {
    color: var(--color-primary);
}

.theme-builder__description {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    margin: 0;
}

/* Color Picker */
.theme-builder__colors {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--spacing-4);
    margin-bottom: var(--spacing-6);
}

.theme-builder__color-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    padding: var(--spacing-4);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
}

.theme-builder__color-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text);
}

.theme-builder__color-name {
    color: var(--color-heading);
}

.theme-builder__color-value {
    font-family: 'Courier New', monospace;
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
}

.theme-builder__color-controls {
    display: flex;
    gap: var(--spacing-2);
    align-items: center;
}

.theme-builder__color-input {
    width: 60px;
    height: 40px;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    padding: 0;
    background: none;
}

.theme-builder__color-text {
    flex: 1;
    padding: var(--spacing-2) var(--spacing-3);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-input-bg);
    color: var(--color-text);
    font-family: 'Courier New', monospace;
    font-size: var(--font-size-sm);
}

.theme-builder__color-text:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(var(--bs-primary-rgb, 13, 110, 253), 0.1);
}

.theme-builder__color-preset-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    color: var(--color-text);
    cursor: pointer;
    transition: all var(--transition-base);
}

.theme-builder__color-preset-btn:hover {
    border-color: var(--color-primary);
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

/* Preset Modal */
.theme-builder__preset-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: var(--spacing-4);
}

.theme-builder__preset-content {
    background: var(--color-elevated);
    border-radius: var(--radius-lg);
    padding: var(--spacing-6);
    max-width: 600px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: var(--shadow-xl);
}

.theme-builder__preset-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-4);
    padding-bottom: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
}

.theme-builder__preset-header h4 {
    margin: 0;
    font-size: var(--font-size-lg);
    color: var(--color-heading);
}

.theme-builder__preset-close {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all var(--transition-base);
}

.theme-builder__preset-close:hover {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.theme-builder__preset-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--spacing-3);
}

.theme-builder__preset-item {
    aspect-ratio: 1;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-base);
    position: relative;
    overflow: hidden;
}

.theme-builder__preset-item:hover {
    transform: scale(1.05);
    border-color: var(--color-primary);
    box-shadow: var(--shadow-md);
}

.theme-builder__preset-code {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: var(--spacing-1);
    font-size: var(--font-size-xs);
    font-family: 'Courier New', monospace;
    text-align: center;
    opacity: 0;
    transition: opacity var(--transition-base);
}

.theme-builder__preset-item:hover .theme-builder__preset-code {
    opacity: 1;
}

/* Actions */
.theme-builder__actions {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    padding: var(--spacing-5);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
}

.theme-builder__name-input {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.theme-builder__name-input label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
}

.theme-builder__name-field {
    padding: var(--spacing-3);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-input-bg);
    color: var(--color-text);
    font-size: var(--font-size-base);
}

.theme-builder__name-field:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(var(--bs-primary-rgb, 13, 110, 253), 0.1);
}

.theme-builder__buttons {
    display: flex;
    gap: var(--spacing-3);
    justify-content: flex-end;
}

.theme-builder__btn {
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

.theme-builder__btn--primary {
    background: var(--color-primary);
    color: var(--color-primary-contrast);
    border-color: var(--color-primary);
}

.theme-builder__btn--primary:hover:not(:disabled) {
    background: var(--color-primary-dark);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.theme-builder__btn--primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.theme-builder__btn--secondary {
    background: var(--color-card);
    color: var(--color-text);
    border-color: var(--color-border);
}

.theme-builder__btn--secondary:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

/* Saved Themes */
.theme-builder__saved {
    margin-top: var(--spacing-6);
}

.theme-builder__saved-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    margin: 0 0 var(--spacing-4) 0;
}

.theme-builder__saved-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-4);
}

.theme-builder__saved-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
    padding: var(--spacing-4);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
}

.theme-builder__saved-preview {
    display: flex;
    height: 48px;
    border-radius: var(--radius-sm);
    overflow: hidden;
    border: 1px solid var(--color-border);
}

.theme-builder__saved-color {
    flex: 1;
    height: 100%;
}

.theme-builder__saved-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.theme-builder__saved-name {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
}

.theme-builder__saved-actions {
    display: flex;
    gap: var(--spacing-2);
}

.theme-builder__saved-btn {
    padding: var(--spacing-1) var(--spacing-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    color: var(--color-text);
    font-size: var(--font-size-xs);
    cursor: pointer;
    transition: all var(--transition-base);
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
}

.theme-builder__saved-btn:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

.theme-builder__saved-btn--danger:hover {
    background: var(--color-soft-rose);
    border-color: var(--color-danger);
    color: var(--color-danger);
}

/* Import/Export */
.theme-builder__import-export {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-4);
    margin-top: var(--spacing-6);
}

.theme-builder__import-export-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    padding: var(--spacing-4);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
}

.theme-builder__import-export-item label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
}

.theme-builder__import-export-controls {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.theme-builder__json-textarea {
    width: 100%;
    padding: var(--spacing-3);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-input-bg);
    color: var(--color-text);
    font-family: 'Courier New', monospace;
    font-size: var(--font-size-xs);
    resize: vertical;
}

.theme-builder__json-textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(var(--bs-primary-rgb, 13, 110, 253), 0.1);
}

/* Responsive */
@media (max-width: 768px) {
    .theme-builder__colors {
        grid-template-columns: 1fr;
    }

    .theme-builder__saved-grid {
        grid-template-columns: 1fr;
    }

    .theme-builder__import-export {
        grid-template-columns: 1fr;
    }
}
</style>

