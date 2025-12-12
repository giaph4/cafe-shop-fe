<template>
  <div class="layout-customizer">
    <div class="layout-customizer__header">
      <h3 class="layout-customizer__title">
        <i class="bi bi-layout-sidebar" />
        Tùy Chỉnh Bố Cục
      </h3>
      <p class="layout-customizer__description">
        Điều chỉnh kích thước, khoảng cách và phong cách của giao diện.
      </p>
    </div>

    <div class="layout-customizer__content">
      <!-- Sidebar Width -->
      <div class="layout-customizer__section">
        <div class="layout-customizer__section-header">
          <label class="layout-customizer__label">
            <i class="bi bi-arrows-angle-contract" />
            Độ rộng Sidebar
          </label>
          <p class="layout-customizer__hint">
            Điều chỉnh độ rộng của sidebar khi mở rộng
          </p>
        </div>
        <div class="layout-customizer__options">
          <button
            v-for="option in sidebarWidthOptions"
            :key="option.value"
            class="layout-customizer__option"
            :class="{ 'layout-customizer__option--active': preferences.sidebarWidth === option.value }"
            @click="updatePreference('sidebarWidth', option.value)"
          >
            <i :class="`bi ${option.icon}`" />
            <span>{{ option.label }}</span>
          </button>
        </div>
      </div>

      <!-- Spacing -->
      <div class="layout-customizer__section">
        <div class="layout-customizer__section-header">
          <label class="layout-customizer__label">
            <i class="bi bi-distribute-vertical" />
            Khoảng cách
          </label>
          <p class="layout-customizer__hint">
            Điều chỉnh khoảng cách giữa các phần tử
          </p>
        </div>
        <div class="layout-customizer__options">
          <button
            v-for="option in spacingOptions"
            :key="option.value"
            class="layout-customizer__option"
            :class="{ 'layout-customizer__option--active': preferences.spacing === option.value }"
            @click="updatePreference('spacing', option.value)"
          >
            <i :class="`bi ${option.icon}`" />
            <span>{{ option.label }}</span>
          </button>
        </div>
      </div>

      <!-- Font Size -->
      <div class="layout-customizer__section">
        <div class="layout-customizer__section-header">
          <label class="layout-customizer__label">
            <i class="bi bi-type" />
            Kích thước chữ
          </label>
          <p class="layout-customizer__hint">
            Điều chỉnh kích thước font chữ toàn hệ thống
          </p>
        </div>
        <div class="layout-customizer__options">
          <button
            v-for="option in fontSizeOptions"
            :key="option.value"
            class="layout-customizer__option"
            :class="{ 'layout-customizer__option--active': preferences.fontSize === option.value }"
            @click="updatePreference('fontSize', option.value)"
          >
            <i :class="`bi ${option.icon}`" />
            <span>{{ option.label }}</span>
          </button>
        </div>
      </div>

      <!-- Border Radius -->
      <div class="layout-customizer__section">
        <div class="layout-customizer__section-header">
          <label class="layout-customizer__label">
            <i class="bi bi-border-all" />
            Bo góc
          </label>
          <p class="layout-customizer__hint">
            Điều chỉnh độ bo góc của các phần tử
          </p>
        </div>
        <div class="layout-customizer__options">
          <button
            v-for="option in borderRadiusOptions"
            :key="option.value"
            class="layout-customizer__option"
            :class="{ 'layout-customizer__option--active': preferences.borderRadius === option.value }"
            @click="updatePreference('borderRadius', option.value)"
          >
            <i :class="`bi ${option.icon}`" />
            <span>{{ option.label }}</span>
          </button>
        </div>
      </div>

      <!-- Animations -->
      <div class="layout-customizer__section">
        <div class="layout-customizer__section-header">
          <label class="layout-customizer__label">
            <i class="bi bi-lightning-charge" />
            Hiệu ứng chuyển động
          </label>
          <p class="layout-customizer__hint">
            Bật/tắt hoặc giảm hiệu ứng chuyển động
          </p>
        </div>
        <div class="layout-customizer__options">
          <button
            v-for="option in animationOptions"
            :key="option.value"
            class="layout-customizer__option"
            :class="{ 'layout-customizer__option--active': preferences.animations === option.value }"
            @click="updatePreference('animations', option.value)"
          >
            <i :class="`bi ${option.icon}`" />
            <span>{{ option.label }}</span>
          </button>
        </div>
      </div>

      <!-- Reset Button -->
      <div class="layout-customizer__actions">
        <button
          class="layout-customizer__reset-btn"
          @click="resetPreferences"
        >
          <i class="bi bi-arrow-counterclockwise" />
          Đặt lại mặc định
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useSettingsStore } from '@/store/settings'
import { useToast } from '@/composables/useToast'

const settingsStore = useSettingsStore()
const toast = useToast()

const preferences = ref({ ...settingsStore.layoutPreferences })

const sidebarWidthOptions = [
    { value: 'collapsed', label: 'Thu gọn', icon: 'bi-arrows-angle-contract' },
    { value: 'normal', label: 'Bình thường', icon: 'bi-arrows-angle-expand' },
    { value: 'expanded', label: 'Mở rộng', icon: 'bi-arrows-fullscreen' }
]

const spacingOptions = [
    { value: 'compact', label: 'Chật', icon: 'bi-compress' },
    { value: 'normal', label: 'Bình thường', icon: 'bi-distribute-vertical' },
    { value: 'comfortable', label: 'Thoải mái', icon: 'bi-arrows-expand' }
]

const fontSizeOptions = [
    { value: 'small', label: 'Nhỏ', icon: 'bi-type-h1' },
    { value: 'normal', label: 'Bình thường', icon: 'bi-type' },
    { value: 'large', label: 'Lớn', icon: 'bi-type-h1' }
]

const borderRadiusOptions = [
    { value: 'sharp', label: 'Sắc cạnh', icon: 'bi-square' },
    { value: 'normal', label: 'Bình thường', icon: 'bi-square-rounded' },
    { value: 'rounded', label: 'Bo tròn', icon: 'bi-circle' }
]

const animationOptions = [
    { value: 'on', label: 'Bật', icon: 'bi-lightning-charge-fill' },
    { value: 'reduced', label: 'Giảm', icon: 'bi-lightning-charge' },
    { value: 'off', label: 'Tắt', icon: 'bi-lightning' }
]

const updatePreference = (key, value) => {
    preferences.value[key] = value
    settingsStore.updateLayoutPreferences(preferences.value)
    toast.success('Đã cập nhật tùy chỉnh bố cục')
}

const resetPreferences = () => {
    preferences.value = {
        sidebarWidth: 'normal',
        spacing: 'normal',
        fontSize: 'normal',
        borderRadius: 'normal',
        animations: 'on'
    }
    settingsStore.updateLayoutPreferences(preferences.value)
    toast.info('Đã đặt lại về mặc định')
}

// Watch for external changes
watch(() => settingsStore.layoutPreferences, (newPrefs) => {
    preferences.value = { ...newPrefs }
}, { deep: true })
</script>

<style scoped>
.layout-customizer {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
}

.layout-customizer__header {
    margin-bottom: var(--spacing-4);
}

.layout-customizer__title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    margin: 0 0 var(--spacing-2) 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
}

.layout-customizer__title i {
    color: var(--color-primary);
}

.layout-customizer__description {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    margin: 0;
}

.layout-customizer__content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
}

.layout-customizer__section {
    padding: var(--spacing-5);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
}

.layout-customizer__section-header {
    margin-bottom: var(--spacing-4);
}

.layout-customizer__label {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
}

.layout-customizer__label i {
    color: var(--color-primary);
}

.layout-customizer__hint {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: var(--spacing-1) 0 0 0;
}

.layout-customizer__options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--spacing-3);
}

.layout-customizer__option {
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
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
}

.layout-customizer__option:hover {
    border-color: var(--color-primary);
    background: var(--color-soft-primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
}

.layout-customizer__option--active {
    border-color: var(--color-primary);
    background: var(--color-primary);
    color: var(--color-primary-contrast);
    box-shadow: 0 0 0 3px rgba(var(--bs-primary-rgb, 13, 110, 253), 0.15);
}

.layout-customizer__option i {
    font-size: var(--font-size-xl);
}

.layout-customizer__actions {
    display: flex;
    justify-content: flex-end;
    padding-top: var(--spacing-4);
    border-top: 1px solid var(--color-border);
}

.layout-customizer__reset-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-3) var(--spacing-5);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-card);
    color: var(--color-text);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: all var(--transition-base);
}

.layout-customizer__reset-btn:hover {
    border-color: var(--color-danger);
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

/* Responsive */
@media (max-width: 768px) {
    .layout-customizer__options {
        grid-template-columns: 1fr;
    }
}
</style>

