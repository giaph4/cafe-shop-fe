<template>
    <div class="settings-section">
        <header class="settings-section__header">
            <div class="settings-section__title-group">
                <div class="settings-section__icon-wrapper">
                    <i class="bi bi-bell settings-section__icon"></i>
                </div>
                <div>
                    <h2 class="settings-section__title">Thông báo</h2>
                    <p class="settings-section__description">Quản lý các thiết lập thông báo và cảnh báo</p>
                </div>
            </div>
        </header>

        <div class="settings-section__content">
            <!-- Notification Sound -->
            <div class="settings-item">
                <div class="settings-item__header">
                    <div class="settings-item__info">
                        <label class="settings-item__label">
                            <i class="bi bi-volume-up me-2"></i>
                            Âm thanh thông báo
                        </label>
                        <p class="settings-item__description">Phát âm thanh khi có thông báo mới</p>
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

            <!-- Email Notifications -->
            <div class="settings-item">
                <div class="settings-item__header">
                    <div class="settings-item__info">
                        <label class="settings-item__label">
                            <i class="bi bi-envelope me-2"></i>
                            Thông báo qua Email
                        </label>
                        <p class="settings-item__description">Nhận thông báo quan trọng qua email</p>
                    </div>
                </div>
                <div class="settings-item__control">
                    <label class="settings-toggle">
                        <input
                            type="checkbox"
                            v-model="localSettings.emailNotifications"
                            @change="handleEmailNotificationsChange"
                            class="settings-toggle__input"
                        />
                        <span class="settings-toggle__slider"></span>
                        <span class="settings-toggle__label">
                            {{ localSettings.emailNotifications ? 'Đã bật' : 'Đã tắt' }}
                        </span>
                    </label>
                </div>
            </div>

            <!-- Push Notifications -->
            <div class="settings-item">
                <div class="settings-item__header">
                    <div class="settings-item__info">
                        <label class="settings-item__label">
                            <i class="bi bi-bell-fill me-2"></i>
                            Thông báo đẩy
                        </label>
                        <p class="settings-item__description">Nhận thông báo đẩy trên trình duyệt (yêu cầu quyền)</p>
                    </div>
                </div>
                <div class="settings-item__control">
                    <label class="settings-toggle">
                        <input
                            type="checkbox"
                            v-model="localSettings.pushNotifications"
                            @change="handlePushNotificationsChange"
                            class="settings-toggle__input"
                            :disabled="!pushNotificationSupported"
                        />
                        <span class="settings-toggle__slider"></span>
                        <span class="settings-toggle__label">
                            {{ localSettings.pushNotifications ? 'Đã bật' : 'Đã tắt' }}
                        </span>
                    </label>
                    <small v-if="!pushNotificationSupported" class="settings-item__hint">
                        Trình duyệt không hỗ trợ thông báo đẩy
                    </small>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useSettingsStore } from '@/store/settings'
import { toast } from 'vue3-toastify'

const settingsStore = useSettingsStore()

const pushNotificationSupported = computed(() => {
    return 'Notification' in window && 'serviceWorker' in navigator
})

const localSettings = reactive({
    notificationSound: settingsStore.notificationSound,
    emailNotifications: localStorage.getItem('emailNotifications') !== 'false',
    pushNotifications: localStorage.getItem('pushNotifications') === 'true'
})

const handleNotificationSoundChange = () => {
    settingsStore.setNotificationSound(localSettings.notificationSound)
    toast.success(`Âm thanh thông báo đã ${localSettings.notificationSound ? 'bật' : 'tắt'}`)
}

const handleEmailNotificationsChange = () => {
    localStorage.setItem('emailNotifications', String(localSettings.emailNotifications))
    toast.success(`Thông báo email đã ${localSettings.emailNotifications ? 'bật' : 'tắt'}`)
}

const handlePushNotificationsChange = async () => {
    if (localSettings.pushNotifications && pushNotificationSupported.value) {
        try {
            const permission = await Notification.requestPermission()
            if (permission === 'granted') {
                localStorage.setItem('pushNotifications', 'true')
                toast.success('Đã bật thông báo đẩy')
            } else {
                localSettings.pushNotifications = false
                toast.warning('Quyền thông báo đẩy bị từ chối')
            }
        } catch (error) {
            localSettings.pushNotifications = false
            toast.error('Không thể bật thông báo đẩy')
        }
    } else {
        localStorage.setItem('pushNotifications', 'false')
        toast.success('Đã tắt thông báo đẩy')
    }
}

watch(() => settingsStore.notificationSound, (newVal) => {
    localSettings.notificationSound = newVal
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

.settings-item__hint {
    display: block;
    margin-top: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-style: italic;
    font-family: var(--font-family-sans);
    background: var(--color-card-muted);
    border-radius: var(--radius-sm);
    border-left: 3px solid var(--color-warning);
}
</style>
