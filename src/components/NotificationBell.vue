<template>
  <div
    ref="dropdownRef"
    class="notification-bell"
  >
    <button
      class="notification-bell__button"
      type="button"
      :aria-label="`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ''}`"
      @click="toggleDropdown"
    >
      <span
        v-if="unreadCount > 0"
        class="notification-bell__badge"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
      <i class="bi bi-bell" />
    </button>

    <Transition name="dropdown">
      <div
        v-if="dropdownOpen"
        class="notification-bell__dropdown"
        @click.stop
      >
        <div class="notification-bell__header">
          <h3 class="notification-bell__title">
            Thông báo
            <span
              v-if="unreadCount > 0"
              class="notification-bell__count"
            >
              {{ unreadCount }} mới
            </span>
          </h3>
          <div class="notification-bell__actions">
            <button
              v-if="unreadCount > 0"
              class="notification-bell__action-btn"
              type="button"
              title="Đánh dấu tất cả đã đọc"
              @click="markAllAsRead"
            >
              <i class="bi bi-check-all" />
            </button>
            <button
              class="notification-bell__action-btn"
              type="button"
              title="Xem tất cả"
              @click="goToNotificationCenter"
            >
              <i class="bi bi-arrow-right" />
            </button>
          </div>
        </div>

        <div class="notification-bell__content">
          <LoadingState
            v-if="loading"
            text="Đang tải thông báo..."
            :compact="true"
          />
          <div
            v-else-if="notifications.length === 0"
            class="notification-bell__empty"
          >
            <i class="bi bi-bell-slash" />
            <p>Không có thông báo</p>
          </div>
          <div
            v-else
            class="notification-bell__list"
          >
            <button
              v-for="notification in displayNotifications"
              :key="notification.id"
              class="notification-bell__item"
              :class="{
                'notification-bell__item--unread': !notification.read,
                [`notification-bell__item--${notification.priority}`]: true
              }"
              type="button"
              @click="handleNotificationClick(notification)"
            >
              <div class="notification-bell__item-icon">
                <i :class="getNotificationIcon(notification.type)" />
              </div>
              <div class="notification-bell__item-content">
                <div class="notification-bell__item-title">
                  {{ notification.title }}
                </div>
                <div class="notification-bell__item-message">
                  {{ notification.message }}
                </div>
                <div class="notification-bell__item-time">
                  {{ formatTime(notification.createdAt) }}
                </div>
              </div>
              <button
                v-if="!notification.read"
                class="notification-bell__item-dot"
                type="button"
                @click.stop="markAsRead(notification.id)"
              >
                <span />
              </button>
              <button
                class="notification-bell__item-delete"
                type="button"
                title="Xóa"
                @click.stop="deleteNotification(notification.id)"
              >
                <i class="bi bi-x" />
              </button>
            </button>
          </div>
        </div>

        <div
          v-if="notifications.length > 0"
          class="notification-bell__footer"
        >
          <button
            class="notification-bell__footer-btn"
            type="button"
            @click="goToNotificationCenter"
          >
            Xem tất cả thông báo
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/store/notification'
import { storeToRefs } from 'pinia'
import LoadingState from '@/components/common/LoadingState.vue'

const router = useRouter()
const notificationStore = useNotificationStore()
const { notifications, unreadCount, loading } = storeToRefs(notificationStore)

const dropdownRef = ref(null)
const dropdownOpen = ref(false)

const displayNotifications = computed(() =>
    notifications.value.slice(0, 10) // Hiển thị 10 mới nhất
)

const toggleDropdown = () => {
    dropdownOpen.value = !dropdownOpen.value
    if (dropdownOpen.value) {
        notificationStore.loadNotifications()
    }
}

const handleNotificationClick = (notification) => {
    notificationStore.markAsRead(notification.id)

    if (notification.action?.route) {
        router.push(notification.action.route)
        dropdownOpen.value = false
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

const goToNotificationCenter = () => {
    dropdownOpen.value = false
    router.push('/notifications')
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
        year: 'numeric'
    })
}

const handleClickOutside = (event) => {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
        dropdownOpen.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
    notificationStore.loadNotifications()
    notificationStore.startPolling(30000) // Poll mỗi 30 giây
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
    notificationStore.stopPolling()
})
</script>

<style scoped>
.notification-bell {
    position: relative;
}

.notification-bell__button {
    position: relative;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
    display: grid;
    place-items: center;
    color: var(--color-text-muted);
    font-size: 1.18rem;
    transition: all 0.18s ease;
    cursor: pointer;
}

.notification-bell__button:hover {
    background: rgba(44, 120, 115, 0.12);
    border-color: rgba(44, 120, 115, 0.3);
    color: var(--color-primary);
    transform: translateY(-1px);
}

.notification-bell__badge {
    position: absolute;
    top: 6px;
    right: 6px;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 9px;
    background: #ef4444;
    color: white;
    font-size: 0.7rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 0 2px var(--color-card-muted);
}

.notification-bell__dropdown {
    position: absolute;
    top: calc(100% + 12px);
    right: 0;
    width: 400px;
    max-height: 600px;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    display: flex;
    flex-direction: column;
    z-index: 1000;
    overflow: hidden;
}

.notification-bell__header {
    padding: 16px;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--color-card);
}

.notification-bell__title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-heading);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
}

.notification-bell__count {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-primary);
    background: rgba(44, 120, 115, 0.1);
    padding: 2px 8px;
    border-radius: 12px;
}

.notification-bell__actions {
    display: flex;
    gap: 8px;
}

.notification-bell__action-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.notification-bell__action-btn:hover {
    background: var(--color-card-muted);
    color: var(--color-heading);
}

.notification-bell__content {
    flex: 1;
    overflow-y: auto;
    max-height: 400px;
}

.notification-bell__empty {
    padding: 48px 24px;
    text-align: center;
    color: var(--color-text-muted);
}

.notification-bell__empty i {
    font-size: 3rem;
    margin-bottom: 12px;
    opacity: 0.5;
}

.notification-bell__empty p {
    margin: 0;
    font-size: 0.9rem;
}

.notification-bell__list {
    display: flex;
    flex-direction: column;
}

.notification-bell__item {
    position: relative;
    padding: 12px 16px;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    transition: background 0.2s ease;
    display: flex;
    gap: 12px;
    align-items: flex-start;
    border-bottom: 1px solid var(--color-border-soft);
}

.notification-bell__item:hover {
    background: var(--color-card-muted);
}

.notification-bell__item--unread {
    background: rgba(44, 120, 115, 0.05);
}

.notification-bell__item--unread:hover {
    background: rgba(44, 120, 115, 0.1);
}

.notification-bell__item--critical {
    border-left: 3px solid #ef4444;
}

.notification-bell__item--warning {
    border-left: 3px solid #f59e0b;
}

.notification-bell__item--info {
    border-left: 3px solid #3b82f6;
}

.notification-bell__item-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--color-card-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
    font-size: 1.1rem;
    flex-shrink: 0;
}

.notification-bell__item--critical .notification-bell__item-icon {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
}

.notification-bell__item--warning .notification-bell__item-icon {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
}

.notification-bell__item-content {
    flex: 1;
    min-width: 0;
}

.notification-bell__item-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-heading);
    margin-bottom: 4px;
}

.notification-bell__item-message {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin-bottom: 4px;
    line-height: 1.4;
}

.notification-bell__item-time {
    font-size: 0.75rem;
    color: var(--color-text-subtle);
}

.notification-bell__item-dot {
    position: absolute;
    top: 16px;
    right: 40px;
    width: 8px;
    height: 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 0;
}

.notification-bell__item-dot span {
    display: block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-primary);
}

.notification-bell__item-delete {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.notification-bell__item:hover .notification-bell__item-delete {
    opacity: 1;
}

.notification-bell__item-delete:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
}

.notification-bell__footer {
    padding: 12px 16px;
    border-top: 1px solid var(--color-border);
    background: var(--color-card-muted);
}

.notification-bell__footer-btn {
    width: 100%;
    padding: 8px;
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.notification-bell__footer-btn:hover {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
    transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}

@media (max-width: 768px) {
    .notification-bell__dropdown {
        width: calc(100vw - 32px);
        right: -16px;
    }
}
</style>

