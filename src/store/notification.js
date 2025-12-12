import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as notificationService from '@/api/notificationService'
import logger from '@/utils/logger'

export const useNotificationStore = defineStore('notification', () => {
    const notifications = ref([])
    const unreadCount = ref(0)
    const loading = ref(false)
    const error = ref(null)
    const pollingInterval = ref(null)
    const isPolling = ref(false)
    const settings = ref({
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

    // Computed
    const unreadNotifications = computed(() =>
        notifications.value.filter(n => !n.read)
    )

    const notificationsByType = computed(() => {
        const grouped = {
            order: [],
            inventory: [],
            staff: [],
            system: [],
            custom: []
        }
        notifications.value.forEach(n => {
            if (grouped[n.type]) {
                grouped[n.type].push(n)
            }
        })
        return grouped
    })

    const criticalNotifications = computed(() =>
        notifications.value.filter(n => n.priority === 'critical' && !n.read)
    )

    // Actions
    const loadNotifications = async () => {
        loading.value = true
        error.value = null
        try {
            const data = await notificationService.getNotifications()
            notifications.value = data.notifications || []
            unreadCount.value = data.unreadCount || 0
            logger.log('[NotificationStore] Loaded notifications', { count: notifications.value.length })
        } catch (err) {
            error.value = err.message || 'Không thể tải thông báo'
            logger.error('[NotificationStore] Failed to load notifications', err)
        } finally {
            loading.value = false
        }
    }

    const addNotification = (notification) => {
        const newNotification = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ...notification,
            createdAt: new Date().toISOString(),
            read: false
        }

        notifications.value.unshift(newNotification)

        // Giới hạn số lượng notifications (giữ 100 mới nhất)
        if (notifications.value.length > 100) {
            notifications.value = notifications.value.slice(0, 100)
        }

        // Cập nhật unread count
        if (!newNotification.read) {
            unreadCount.value++
        }

        // Show browser notification nếu được bật
        if (settings.value.browserPush && 'Notification' in window && Notification.permission === 'granted') {
            showBrowserNotification(newNotification)
        }

        // Play sound nếu được bật
        if (settings.value.sound && newNotification.priority === 'critical') {
            playNotificationSound()
        }

        // Lưu vào localStorage
        saveToLocalStorage()

        logger.log('[NotificationStore] Added notification', newNotification)
        return newNotification
    }

    const markAsRead = async (notificationId) => {
        const notification = notifications.value.find(n => n.id === notificationId)
        if (notification && !notification.read) {
            notification.read = true
            unreadCount.value = Math.max(0, unreadCount.value - 1)
            saveToLocalStorage()

            try {
                await notificationService.markAsRead(notificationId)
            } catch (err) {
                logger.error('[NotificationStore] Failed to mark as read', err)
            }
        }
    }

    const markAllAsRead = async () => {
        const unreadIds = unreadNotifications.value.map(n => n.id)
        notifications.value.forEach(n => {
            n.read = true
        })
        unreadCount.value = 0
        saveToLocalStorage()

        try {
            await notificationService.markAllAsRead()
        } catch (err) {
            logger.error('[NotificationStore] Failed to mark all as read', err)
        }
    }

    const deleteNotification = async (notificationId) => {
        const index = notifications.value.findIndex(n => n.id === notificationId)
        if (index !== -1) {
            const notification = notifications.value[index]
            if (!notification.read) {
                unreadCount.value = Math.max(0, unreadCount.value - 1)
            }
            notifications.value.splice(index, 1)
            saveToLocalStorage()

            try {
                await notificationService.deleteNotification(notificationId)
            } catch (err) {
                logger.error('[NotificationStore] Failed to delete notification', err)
            }
        }
    }

    const clearAll = async () => {
        notifications.value = []
        unreadCount.value = 0
        saveToLocalStorage()

        try {
            await notificationService.clearAll()
        } catch (err) {
            logger.error('[NotificationStore] Failed to clear all', err)
        }
    }

    const startPolling = (interval = 30000) => {
        if (isPolling.value) {
            stopPolling()
        }

        isPolling.value = true
        pollingInterval.value = setInterval(async () => {
            if (!settings.value.enabled) return
            if (isQuietHours()) return

            try {
                await notificationService.checkForNewNotifications()
            } catch (err) {
                logger.error('[NotificationStore] Polling error', err)
            }
        }, interval)

        logger.log('[NotificationStore] Started polling', { interval })
    }

    const stopPolling = () => {
        if (pollingInterval.value) {
            clearInterval(pollingInterval.value)
            pollingInterval.value = null
        }
        isPolling.value = false
        logger.log('[NotificationStore] Stopped polling')
    }

    const isQuietHours = () => {
        if (!settings.value.quietHours.enabled) return false

        const now = new Date()
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        const { start, end } = settings.value.quietHours

        // Nếu start > end (ví dụ: 22:00 - 08:00), nghĩa là qua đêm
        if (start > end) {
            return currentTime >= start || currentTime <= end
        }
        // Nếu start <= end (ví dụ: 08:00 - 22:00)
        return currentTime >= start && currentTime <= end
    }

    const showBrowserNotification = (notification) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: notification.id,
                requireInteraction: notification.priority === 'critical'
            })
        }
    }

    const playNotificationSound = () => {
        try {
            const audio = new Audio('/sounds/notification.mp3')
            audio.volume = 0.5
            audio.play().catch(err => {
                logger.warn('[NotificationStore] Failed to play sound', err)
            })
        } catch (err) {
            logger.warn('[NotificationStore] Sound not available', err)
        }
    }

    const requestBrowserPermission = async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission()
            if (permission === 'granted') {
                settings.value.browserPush = true
                saveSettings()
            }
            return permission
        }
        return Notification.permission
    }

    const saveToLocalStorage = () => {
        try {
            const data = {
                notifications: notifications.value.slice(0, 50), // Chỉ lưu 50 mới nhất
                unreadCount: unreadCount.value,
                lastUpdated: new Date().toISOString()
            }
            localStorage.setItem('notifications', JSON.stringify(data))
        } catch (err) {
            logger.warn('[NotificationStore] Failed to save to localStorage', err)
        }
    }

    const loadFromLocalStorage = () => {
        try {
            const data = localStorage.getItem('notifications')
            if (data) {
                const parsed = JSON.parse(data)
                notifications.value = parsed.notifications || []
                unreadCount.value = parsed.unreadCount || 0
            }
        } catch (err) {
            logger.warn('[NotificationStore] Failed to load from localStorage', err)
        }
    }

    const loadSettings = () => {
        try {
            const data = localStorage.getItem('notificationSettings')
            if (data) {
                settings.value = { ...settings.value, ...JSON.parse(data) }
            }
        } catch (err) {
            logger.warn('[NotificationStore] Failed to load settings', err)
        }
    }

    const saveSettings = () => {
        try {
            localStorage.setItem('notificationSettings', JSON.stringify(settings.value))
        } catch (err) {
            logger.warn('[NotificationStore] Failed to save settings', err)
        }
    }

    const updateSettings = (newSettings) => {
        settings.value = { ...settings.value, ...newSettings }
        saveSettings()
    }

    // Initialize
    loadFromLocalStorage()
    loadSettings()

    return {
        // State
        notifications,
        unreadCount,
        loading,
        error,
        isPolling,
        settings,

        // Computed
        unreadNotifications,
        notificationsByType,
        criticalNotifications,

        // Actions
        loadNotifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        startPolling,
        stopPolling,
        requestBrowserPermission,
        updateSettings
    }
})

