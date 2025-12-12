<template>
  <div class="settings-section">
    <header class="settings-section__header">
      <div class="settings-section__title-group">
        <i class="bi bi-sliders settings-section__icon" />
        <div>
          <h2 class="settings-section__title">
            Cài đặt chung
          </h2>
          <p class="settings-section__description">
            Quản lý các cài đặt cơ bản của hệ thống
          </p>
        </div>
      </div>
    </header>

    <div class="settings-section__content">
      <!-- Language Setting -->
      <div class="settings-item">
        <div class="settings-item__header">
          <div class="settings-item__info">
            <label class="settings-item__label">
              <i class="bi bi-translate me-2" />
              Ngôn ngữ
            </label>
            <p class="settings-item__description">
              Chọn ngôn ngữ hiển thị cho giao diện
            </p>
          </div>
        </div>
        <div class="settings-item__control">
          <select
            v-model="localSettings.language"
            class="form-select settings-select"
            @change="handleLanguageChange"
          >
            <option value="vi">
              Tiếng Việt
            </option>
            <option value="en">
              English
            </option>
          </select>
        </div>
      </div>

      <!-- Notification Sound -->
      <div class="settings-item">
        <div class="settings-item__header">
          <div class="settings-item__info">
            <label class="settings-item__label">
              <i class="bi bi-volume-up me-2" />
              Âm thanh thông báo
            </label>
            <p class="settings-item__description">
              Bật/tắt âm thanh khi có thông báo mới
            </p>
          </div>
        </div>
        <div class="settings-item__control">
          <label class="settings-toggle">
            <input
              v-model="localSettings.notificationSound"
              type="checkbox"
              class="settings-toggle__input"
              @change="handleNotificationSoundChange"
            >
            <span class="settings-toggle__slider" />
            <span class="settings-toggle__label">
              {{ localSettings.notificationSound ? 'Đã bật' : 'Đã tắt' }}
            </span>
          </label>
        </div>
      </div>

      <!-- Christmas Effect -->
      <div class="settings-item">
        <div class="settings-item__header">
          <div class="settings-item__info">
            <label class="settings-item__label">
              <i class="bi bi-snow me-2" />
              Hiệu ứng Noel
            </label>
            <p class="settings-item__description">
              Bật hiệu ứng Noel khi click vào các button trong hệ thống
            </p>
          </div>
        </div>
        <div class="settings-item__control">
          <label class="settings-toggle">
            <input
              v-model="localSettings.christmasEffect"
              type="checkbox"
              class="settings-toggle__input"
              @change="handleChristmasEffectChange"
            >
            <span class="settings-toggle__slider" />
            <span class="settings-toggle__label">
              {{ localSettings.christmasEffect ? 'Đã bật' : 'Đã tắt' }}
            </span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { useSettingsStore } from '@/store/settings'
import { toast } from 'vue3-toastify'

const settingsStore = useSettingsStore()

const localSettings = reactive({
    language: settingsStore.language,
    notificationSound: settingsStore.notificationSound,
    christmasEffect: settingsStore.christmasEffectEnabled
})

const handleLanguageChange = () => {
    settingsStore.setLanguage(localSettings.language)
    toast.success('Đã cập nhật ngôn ngữ')
}

const handleNotificationSoundChange = () => {
    settingsStore.setNotificationSound(localSettings.notificationSound)
    toast.success(`Âm thanh thông báo đã ${localSettings.notificationSound ? 'bật' : 'tắt'}`)
}

const handleChristmasEffectChange = () => {
    settingsStore.setChristmasEffect(localSettings.christmasEffect)
    toast.success(`Hiệu ứng Noel đã ${localSettings.christmasEffect ? 'bật' : 'tắt'}`)
}

// Sync with store changes
watch(() => settingsStore.language, (newVal) => {
    localSettings.language = newVal
})

watch(() => settingsStore.notificationSound, (newVal) => {
    localSettings.notificationSound = newVal
})

watch(() => settingsStore.christmasEffectEnabled, (newVal) => {
    localSettings.christmasEffect = newVal
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

.settings-select {
    min-width: 200px;
    padding: var(--spacing-2) var(--spacing-3);
    border: 1px solid var(--color-input-border);
    border-radius: var(--radius-sm);
    background: var(--color-input-bg);
    color: var(--color-text);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
    transition: border-color var(--transition-base);
    cursor: pointer;
}

.settings-select:hover {
    border-color: var(--color-border-strong);
}

.settings-select:focus {
    border-color: var(--color-primary);
    outline: none;
    box-shadow: 0 0 0 2px var(--color-soft-primary);
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

@media (max-width: 768px) {
    .settings-item {
        flex-direction: column;
        align-items: flex-start;
    }

    .settings-item__control {
        width: 100%;
    }

    .settings-select {
        width: 100%;
        min-width: auto;
    }
}
</style>
