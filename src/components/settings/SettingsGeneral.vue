<template>
    <div class="settings-section">
        <header class="settings-section__header">
            <div class="settings-section__title-group">
                <i class="bi bi-sliders settings-section__icon"></i>
                <div>
                    <h2 class="settings-section__title">Cài đặt chung</h2>
                    <p class="settings-section__description">Quản lý các cài đặt cơ bản của hệ thống</p>
                </div>
            </div>
        </header>

        <div class="settings-section__content">
            <!-- Language Setting -->
            <div class="settings-item">
                <div class="settings-item__header">
                    <div class="settings-item__info">
                        <label class="settings-item__label">
                            <i class="bi bi-translate me-2"></i>
                            Ngôn ngữ
                        </label>
                        <p class="settings-item__description">Chọn ngôn ngữ hiển thị cho giao diện</p>
                    </div>
                </div>
                <div class="settings-item__control">
                    <select
                        v-model="localSettings.language"
                        class="form-select settings-select"
                        @change="handleLanguageChange"
                    >
                        <option value="vi">Tiếng Việt</option>
                        <option value="en">English</option>
                    </select>
                </div>
            </div>

            <!-- Notification Sound -->
            <div class="settings-item">
                <div class="settings-item__header">
                    <div class="settings-item__info">
                        <label class="settings-item__label">
                            <i class="bi bi-volume-up me-2"></i>
                            Âm thanh thông báo
                        </label>
                        <p class="settings-item__description">Bật/tắt âm thanh khi có thông báo mới</p>
                    </div>
                </div>
                <div class="settings-item__control">
                    <label class="settings-toggle">
                        <input
                            type="checkbox"
                            v-model="localSettings.notificationSound"
                            @change="handleNotificationSoundChange"
                            class="settings-toggle__input"
                        />
                        <span class="settings-toggle__slider"></span>
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
                            <i class="bi bi-snow me-2"></i>
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
                            type="checkbox"
                            v-model="localSettings.christmasEffect"
                            @change="handleChristmasEffectChange"
                            class="settings-toggle__input"
                        />
                        <span class="settings-toggle__slider"></span>
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
    gap: var(--spacing-8);
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.settings-section__header {
    border-bottom: 2px solid var(--color-border);
    padding-bottom: var(--spacing-5);
    margin-bottom: var(--spacing-2);
}

.settings-section__title-group {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-4);
}

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

.settings-section__title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    margin: 0 0 var(--spacing-2) 0;
    font-family: var(--font-family-sans);
    letter-spacing: -0.02em;
}

.settings-section__description {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    margin: 0;
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-medium);
    line-height: var(--line-height-relaxed);
}

.settings-section__content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
}

.settings-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    padding: var(--spacing-5);
    background: linear-gradient(135deg, var(--color-card) 0%, var(--color-card-muted) 100%);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.settings-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
}

.settings-item:hover {
    border-color: var(--color-border-strong);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
}

.settings-item:hover::before {
    transform: scaleX(1);
}

.settings-item__header {
    flex: 1;
}

.settings-item__info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.settings-item__label {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin: 0;
    display: flex;
    align-items: center;
    font-family: var(--font-family-sans);
    gap: var(--spacing-2);
}

.settings-item__label i {
    color: var(--color-primary);
    font-size: var(--font-size-xl);
}

.settings-item__description {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
    line-height: var(--line-height-relaxed);
    font-family: var(--font-family-sans);
}

.settings-item__control {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 200px;
}

.settings-select {
    width: 100%;
    max-width: 300px;
    padding: var(--spacing-3) var(--spacing-4);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-base);
    background: var(--color-card);
    color: var(--color-text);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-medium);
    transition: all 0.2s ease;
    cursor: pointer;
}

.settings-select:hover {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-soft-primary);
}

.settings-select:focus {
    border-color: var(--color-primary);
    outline: none;
    box-shadow: 0 0 0 4px var(--color-soft-primary);
}

.settings-toggle {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
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
    width: 52px;
    height: 28px;
    background: var(--color-border);
    border-radius: var(--radius-full);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.settings-toggle__slider::before {
    content: '';
    position: absolute;
    width: 22px;
    height: 22px;
    left: 3px;
    top: 3px;
    background: var(--color-card);
    border-radius: var(--radius-full);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.settings-toggle__input:checked + .settings-toggle__slider {
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    box-shadow: 0 0 0 3px var(--color-soft-primary), inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.settings-toggle__input:checked + .settings-toggle__slider::before {
    transform: translateX(24px);
    box-shadow: 0 2px 8px rgba(var(--color-primary-rgb, 13, 110, 253), 0.4);
}

.settings-toggle__label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

@media (max-width: 768px) {
    .settings-item {
        flex-direction: column;
    }

    .settings-item__control {
        justify-content: flex-start;
        min-width: auto;
        width: 100%;
    }

    .settings-select {
        max-width: 100%;
    }
}
</style>
