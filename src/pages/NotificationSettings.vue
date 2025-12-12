<template>
  <div
    class="page-container container-fluid"
    data-aos="fade-up"
    style="background: var(--color-body-bg); padding: var(--spacing-4);"
  >
    <div class="page-header card-shadow">
      <div>
        <h2 class="page-title">
          Cài đặt thông báo
        </h2>
        <p class="page-subtitle">
          Tùy chỉnh cách bạn nhận thông báo
        </p>
      </div>
      <button
        class="btn btn-outline-secondary"
        type="button"
        @click="$router.back()"
      >
        <i class="bi bi-arrow-left me-2" />
        Quay lại
      </button>
    </div>

    <div class="card settings-card mb-4">
      <div class="card-body">
        <h3 class="settings-section-title">
          <i class="bi bi-toggle-on me-2" />
          Bật/Tắt thông báo
        </h3>
        <div class="settings-item">
          <div class="settings-item__content">
            <label class="settings-item__label">
              Bật thông báo
            </label>
            <p class="settings-item__description">
              Bật hoặc tắt tất cả thông báo
            </p>
          </div>
          <div class="form-check form-switch">
            <input
              id="enableNotifications"
              v-model="localSettings.enabled"
              class="form-check-input"
              type="checkbox"
              role="switch"
              @change="updateSettings"
            >
            <label
              class="form-check-label"
              for="enableNotifications"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="card settings-card mb-4">
      <div class="card-body">
        <h3 class="settings-section-title">
          <i class="bi bi-bell me-2" />
          Loại thông báo
        </h3>
        <div class="settings-item">
          <div class="settings-item__content">
            <label class="settings-item__label">
              Thông báo đơn hàng
            </label>
            <p class="settings-item__description">
              Nhận thông báo về đơn hàng mới, thay đổi trạng thái, hủy đơn
            </p>
          </div>
          <div class="form-check form-switch">
            <input
              id="orderNotifications"
              v-model="localSettings.orderNotifications"
              class="form-check-input"
              type="checkbox"
              role="switch"
              :disabled="!localSettings.enabled"
              @change="updateSettings"
            >
            <label
              class="form-check-label"
              for="orderNotifications"
            />
          </div>
        </div>

        <div class="settings-item">
          <div class="settings-item__content">
            <label class="settings-item__label">
              Cảnh báo tồn kho
            </label>
            <p class="settings-item__description">
              Nhận cảnh báo khi nguyên liệu sắp hết hoặc hết hàng
            </p>
          </div>
          <div class="form-check form-switch">
            <input
              id="inventoryAlerts"
              v-model="localSettings.inventoryAlerts"
              class="form-check-input"
              type="checkbox"
              role="switch"
              :disabled="!localSettings.enabled"
              @change="updateSettings"
            >
            <label
              class="form-check-label"
              for="inventoryAlerts"
            />
          </div>
        </div>

        <div class="settings-item">
          <div class="settings-item__content">
            <label class="settings-item__label">
              Thông báo nhân sự
            </label>
            <p class="settings-item__description">
              Nhận thông báo về ca làm việc, điểm danh, nhắc nhở
            </p>
          </div>
          <div class="form-check form-switch">
            <input
              id="staffNotifications"
              v-model="localSettings.staffNotifications"
              class="form-check-input"
              type="checkbox"
              role="switch"
              :disabled="!localSettings.enabled"
              @change="updateSettings"
            >
            <label
              class="form-check-label"
              for="staffNotifications"
            />
          </div>
        </div>

        <div class="settings-item">
          <div class="settings-item__content">
            <label class="settings-item__label">
              Thông báo hệ thống
            </label>
            <p class="settings-item__description">
              Nhận thông báo từ hệ thống, cập nhật, bảo trì
            </p>
          </div>
          <div class="form-check form-switch">
            <input
              id="systemNotifications"
              v-model="localSettings.systemNotifications"
              class="form-check-input"
              type="checkbox"
              role="switch"
              :disabled="!localSettings.enabled"
              @change="updateSettings"
            >
            <label
              class="form-check-label"
              for="systemNotifications"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="card settings-card mb-4">
      <div class="card-body">
        <h3 class="settings-section-title">
          <i class="bi bi-volume-up me-2" />
          Tùy chọn hiển thị
        </h3>
        <div class="settings-item">
          <div class="settings-item__content">
            <label class="settings-item__label">
              Phát âm thanh
            </label>
            <p class="settings-item__description">
              Phát âm thanh khi có thông báo quan trọng
            </p>
          </div>
          <div class="form-check form-switch">
            <input
              id="sound"
              v-model="localSettings.sound"
              class="form-check-input"
              type="checkbox"
              role="switch"
              :disabled="!localSettings.enabled"
              @change="updateSettings"
            >
            <label
              class="form-check-label"
              for="sound"
            />
          </div>
        </div>

        <div class="settings-item">
          <div class="settings-item__content">
            <label class="settings-item__label">
              Thông báo trình duyệt
            </label>
            <p class="settings-item__description">
              Hiển thị thông báo trên trình duyệt (cần cấp quyền)
            </p>
          </div>
          <div class="d-flex align-items-center gap-2">
            <div class="form-check form-switch">
              <input
                id="browserPush"
                v-model="localSettings.browserPush"
                class="form-check-input"
                type="checkbox"
                role="switch"
                :disabled="!localSettings.enabled || !browserPushSupported"
                @change="handleBrowserPushChange"
              >
              <label
                class="form-check-label"
                for="browserPush"
              />
            </div>
            <button
              v-if="!browserPushPermissionGranted && browserPushSupported"
              class="btn btn-sm btn-outline-primary"
              type="button"
              @click="requestBrowserPermission"
            >
              Cấp quyền
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="card settings-card mb-4">
      <div class="card-body">
        <h3 class="settings-section-title">
          <i class="bi bi-moon me-2" />
          Giờ yên tĩnh
        </h3>
        <div class="settings-item">
          <div class="settings-item__content">
            <label class="settings-item__label">
              Bật giờ yên tĩnh
            </label>
            <p class="settings-item__description">
              Tắt thông báo trong khoảng thời gian chỉ định
            </p>
          </div>
          <div class="form-check form-switch">
            <input
              id="quietHoursEnabled"
              v-model="localSettings.quietHours.enabled"
              class="form-check-input"
              type="checkbox"
              role="switch"
              :disabled="!localSettings.enabled"
              @change="updateSettings"
            >
            <label
              class="form-check-label"
              for="quietHoursEnabled"
            />
          </div>
        </div>

        <div
          v-if="localSettings.quietHours.enabled"
          class="row g-3 mt-3"
        >
          <div class="col-md-6">
            <label class="form-label">Từ</label>
            <input
              v-model="localSettings.quietHours.start"
              type="time"
              class="form-control"
              :disabled="!localSettings.enabled"
              @change="updateSettings"
            >
          </div>
          <div class="col-md-6">
            <label class="form-label">Đến</label>
            <input
              v-model="localSettings.quietHours.end"
              type="time"
              class="form-control"
              :disabled="!localSettings.enabled"
              @change="updateSettings"
            >
          </div>
        </div>
      </div>
    </div>

    <div class="alert alert-info">
      <i class="bi bi-info-circle me-2" />
      Cài đặt được lưu tự động và áp dụng ngay lập tức
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useNotificationStore } from '@/store/notification'
import { storeToRefs } from 'pinia'

const notificationStore = useNotificationStore()
const { settings } = storeToRefs(notificationStore)

const localSettings = ref({
    enabled: true,
    sound: true,
    browserPush: false,
    email: false,
    quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
    },
    orderNotifications: true,
    inventoryAlerts: true,
    staffNotifications: true,
    systemNotifications: true
})

const browserPushSupported = computed(() => 'Notification' in window)
const browserPushPermissionGranted = computed(() =>
    'Notification' in window && Notification.permission === 'granted'
)

onMounted(() => {
    // Load settings từ store
    localSettings.value = { ...settings.value }
})

const updateSettings = () => {
    notificationStore.updateSettings(localSettings.value)
}

const handleBrowserPushChange = async () => {
    if (localSettings.value.browserPush && !browserPushPermissionGranted.value) {
        await requestBrowserPermission()
    }
    updateSettings()
}

const requestBrowserPermission = async () => {
    const permission = await notificationStore.requestBrowserPermission()
    if (permission === 'granted') {
        localSettings.value.browserPush = true
        updateSettings()
    }
}
</script>

<style scoped>
.page-header {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-4);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    margin-bottom: var(--spacing-4);
}

.page-title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.page-subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.settings-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.settings-card .card-body {
    padding: var(--spacing-4);
}

.settings-section-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-heading);
    margin-bottom: var(--spacing-4);
    display: flex;
    align-items: center;
}

.settings-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-3) 0;
    border-bottom: 1px solid var(--color-border-soft);
}

.settings-item:last-child {
    border-bottom: none;
}

.settings-item__content {
    flex: 1;
    min-width: 0;
}

.settings-item__label {
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--color-heading);
    margin-bottom: 4px;
    display: block;
}

.settings-item__description {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin: 0;
}

.form-check-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>

