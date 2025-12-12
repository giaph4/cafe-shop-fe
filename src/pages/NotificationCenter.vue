<template>
  <div
    class="page-container container-fluid"
    data-aos="fade-up"
    style="background: var(--color-body-bg); padding: var(--spacing-4);"
  >
    <div class="page-header card-shadow">
      <div>
        <h2 class="page-title">
          Trung tâm thông báo
        </h2>
        <p class="page-subtitle">
          Quản lý và xem tất cả thông báo của bạn
        </p>
      </div>
      <div class="d-flex flex-wrap gap-2 align-items-center">
        <button
          v-if="unreadCount > 0"
          class="btn btn-outline-primary"
          type="button"
          @click="markAllAsRead"
        >
          <i class="bi bi-check-all me-2" />
          Đánh dấu tất cả đã đọc
        </button>
        <button
          class="btn btn-outline-danger"
          type="button"
          @click="showClearConfirm = true"
        >
          <i class="bi bi-trash me-2" />
          Xóa tất cả
        </button>
        <button
          class="btn btn-outline-secondary"
          type="button"
          @click="goToSettings"
        >
          <i class="bi bi-gear me-2" />
          Cài đặt
        </button>
      </div>
    </div>

    <div class="card filter-card mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-center">
          <div class="col-md-3">
            <label class="form-label">Lọc theo loại</label>
            <select
              v-model="filterType"
              class="form-select"
            >
              <option value="all">
                Tất cả
              </option>
              <option value="order">
                Đơn hàng
              </option>
              <option value="inventory">
                Tồn kho
              </option>
              <option value="staff">
                Nhân sự
              </option>
              <option value="system">
                Hệ thống
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Lọc theo trạng thái</label>
            <select
              v-model="filterRead"
              class="form-select"
            >
              <option value="all">
                Tất cả
              </option>
              <option value="unread">
                Chưa đọc
              </option>
              <option value="read">
                Đã đọc
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Lọc theo mức độ</label>
            <select
              v-model="filterPriority"
              class="form-select"
            >
              <option value="all">
                Tất cả
              </option>
              <option value="critical">
                Nghiêm trọng
              </option>
              <option value="warning">
                Cảnh báo
              </option>
              <option value="info">
                Thông tin
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Tìm kiếm</label>
            <input
              v-model="searchKeyword"
              type="text"
              class="form-control"
              placeholder="Tìm kiếm..."
            >
          </div>
        </div>
      </div>
    </div>

    <div class="card tabs-card">
      <div class="card-body">
        <LoadingState
          v-if="loading"
          text="Đang tải thông báo..."
        />
        <div
          v-else-if="filteredNotifications.length === 0"
          class="empty-state"
        >
          <i class="bi bi-bell-slash" />
          <h3>Không có thông báo</h3>
          <p>{{ hasFilters ? 'Thử thay đổi bộ lọc' : 'Bạn chưa có thông báo nào' }}</p>
        </div>
        <div
          v-else
          class="notifications-list"
        >
          <div
            v-for="notification in filteredNotifications"
            :key="notification.id"
            class="notification-item"
            :class="{
              'notification-item--unread': !notification.read,
              [`notification-item--${notification.priority}`]: true
            }"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-item__icon">
              <i :class="getNotificationIcon(notification.type)" />
            </div>
            <div class="notification-item__content">
              <div class="notification-item__header">
                <h4 class="notification-item__title">
                  {{ notification.title }}
                </h4>
                <div class="notification-item__actions">
                  <button
                    v-if="!notification.read"
                    class="notification-item__action-btn"
                    type="button"
                    title="Đánh dấu đã đọc"
                    @click.stop="markAsRead(notification.id)"
                  >
                    <i class="bi bi-check" />
                  </button>
                  <button
                    class="notification-item__action-btn notification-item__action-btn--delete"
                    type="button"
                    title="Xóa"
                    @click.stop="deleteNotification(notification.id)"
                  >
                    <i class="bi bi-trash" />
                  </button>
                </div>
              </div>
              <p class="notification-item__message">
                {{ notification.message }}
              </p>
              <div class="notification-item__footer">
                <span class="notification-item__time">
                  <i class="bi bi-clock" />
                  {{ formatTime(notification.createdAt) }}
                </span>
                <span
                  v-if="notification.type"
                  class="notification-item__type"
                >
                  {{ getTypeLabel(notification.type) }}
                </span>
              </div>
            </div>
            <div
              v-if="!notification.read"
              class="notification-item__indicator"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Clear Confirm Modal -->
    <div
      v-if="showClearConfirm"
      class="modal-overlay"
      @click="showClearConfirm = false"
    >
      <div
        class="modal-content"
        @click.stop
      >
        <h3>Xác nhận xóa</h3>
        <p>Bạn có chắc chắn muốn xóa tất cả thông báo?</p>
        <div class="modal-actions">
          <button
            class="btn btn-outline-secondary"
            type="button"
            @click="showClearConfirm = false"
          >
            Hủy
          </button>
          <button
            class="btn btn-danger"
            type="button"
            @click="clearAll"
          >
            Xóa tất cả
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/store/notification'
import { storeToRefs } from 'pinia'
import LoadingState from '@/components/common/LoadingState.vue'

const router = useRouter()
const notificationStore = useNotificationStore()
const { notifications, unreadCount, loading } = storeToRefs(notificationStore)

const filterType = ref('all')
const filterRead = ref('all')
const filterPriority = ref('all')
const searchKeyword = ref('')
const showClearConfirm = ref(false)

const filteredNotifications = computed(() => {
    let filtered = [...notifications.value]

    // Filter by type
    if (filterType.value !== 'all') {
        filtered = filtered.filter(n => n.type === filterType.value)
    }

    // Filter by read status
    if (filterRead.value === 'unread') {
        filtered = filtered.filter(n => !n.read)
    } else if (filterRead.value === 'read') {
        filtered = filtered.filter(n => n.read)
    }

    // Filter by priority
    if (filterPriority.value !== 'all') {
        filtered = filtered.filter(n => n.priority === filterPriority.value)
    }

    // Search
    if (searchKeyword.value.trim()) {
        const keyword = searchKeyword.value.toLowerCase()
        filtered = filtered.filter(n =>
            n.title.toLowerCase().includes(keyword) ||
            n.message.toLowerCase().includes(keyword)
        )
    }

    return filtered
})

const hasFilters = computed(() => filterType.value !== 'all' ||
        filterRead.value !== 'all' ||
        filterPriority.value !== 'all' ||
        searchKeyword.value.trim() !== '')

const handleNotificationClick = (notification) => {
    markAsRead(notification.id)
    if (notification.action?.route) {
        router.push(notification.action.route)
    }
}

const markAsRead = async (notificationId) => {
    await notificationStore.markAsRead(notificationId)
}

const markAllAsRead = async () => {
    await notificationStore.markAllAsRead()
}

const deleteNotification = async (notificationId) => {
    await notificationStore.deleteNotification(notificationId)
}

const clearAll = async () => {
    await notificationStore.clearAll()
    showClearConfirm.value = false
}

const goToSettings = () => {
    router.push('/notifications/settings')
}

const getNotificationIcon = (type) => {
    const icons = {
        order: 'bi bi-receipt',
        inventory: 'bi bi-box-seam',
        staff: 'bi bi-person-check',
        system: 'bi bi-info-circle',
        custom: 'bi bi-bell'
    }
    return icons[type] || 'bi bi-bell'
}

const getTypeLabel = (type) => {
    const labels = {
        order: 'Đơn hàng',
        inventory: 'Tồn kho',
        staff: 'Nhân sự',
        system: 'Hệ thống',
        custom: 'Tùy chỉnh'
    }
    return labels[type] || type
}

const formatTime = (dateString) => {
    if (!dateString) return ''

    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Vừa xong'
    if (minutes < 60) return `${minutes} phút trước`
    if (hours < 24) return `${hours} giờ trước`
    if (days < 7) return `${days} ngày trước`

    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

onMounted(() => {
    notificationStore.loadNotifications()
})
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

.filter-card,
.tabs-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.filter-card .card-body {
    background: var(--color-card);
}

.tabs-card .card-body {
    background: var(--color-card);
    padding: var(--spacing-4);
}

.empty-state {
    padding: 64px 24px;
    text-align: center;
    color: var(--color-text-muted);
}

.empty-state i {
    font-size: 4rem;
    margin-bottom: 16px;
    opacity: 0.3;
}

.empty-state h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-heading);
    margin-bottom: 8px;
}

.empty-state p {
    margin: 0;
    font-size: 0.9rem;
}

.notifications-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.notification-item {
    position: relative;
    padding: 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-card);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    gap: 16px;
    align-items: flex-start;
}

.notification-item:hover {
    border-color: var(--color-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
}

.notification-item--unread {
    background: rgba(44, 120, 115, 0.05);
    border-color: rgba(44, 120, 115, 0.2);
}

.notification-item--critical {
    border-left: 4px solid #ef4444;
}

.notification-item--warning {
    border-left: 4px solid #f59e0b;
}

.notification-item--info {
    border-left: 4px solid #3b82f6;
}

.notification-item__icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-lg);
    background: var(--color-card-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
    font-size: 1.5rem;
    flex-shrink: 0;
}

.notification-item--critical .notification-item__icon {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
}

.notification-item--warning .notification-item__icon {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
}

.notification-item__content {
    flex: 1;
    min-width: 0;
}

.notification-item__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
}

.notification-item__title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-heading);
    margin: 0;
    flex: 1;
}

.notification-item__actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.notification-item:hover .notification-item__actions {
    opacity: 1;
}

.notification-item__action-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: var(--color-card-muted);
    color: var(--color-text-muted);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.notification-item__action-btn:hover {
    background: var(--color-primary);
    color: white;
}

.notification-item__action-btn--delete:hover {
    background: #ef4444;
    color: white;
}

.notification-item__message {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    margin: 0 0 12px 0;
    line-height: 1.5;
}

.notification-item__footer {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 0.85rem;
    color: var(--color-text-subtle);
}

.notification-item__time {
    display: flex;
    align-items: center;
    gap: 4px;
}

.notification-item__type {
    padding: 2px 8px;
    background: var(--color-card-muted);
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
}

.notification-item__indicator {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(44, 120, 115, 0.2);
}

/* Modal */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.modal-content {
    background: var(--color-card);
    border-radius: var(--radius-lg);
    padding: 24px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-content h3 {
    margin: 0 0 12px 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-heading);
}

.modal-content p {
    margin: 0 0 24px 0;
    color: var(--color-text-muted);
}

.modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}
</style>

