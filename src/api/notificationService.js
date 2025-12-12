import * as orderService from './orderService'
import * as inventoryService from './inventoryManagementService'
import * as shiftService from './shiftService'
import * as realTimeDashboardService from './realTimeDashboardService'
import { useNotificationStore } from '@/store/notification'
import { useAuthStore } from '@/store/auth'
import logger from '@/utils/logger'

// Cache để tránh duplicate notifications
const notificationCache = new Map()
const CACHE_DURATION = 60000 // 1 phút

// Lấy notifications từ localStorage (client-side only)
export const getNotifications = () => {
    try {
        const store = useNotificationStore()
        const notifications = store.notifications || []
        const unreadCount = notifications.filter(n => !n.read).length

        return {
            notifications,
            unreadCount,
            total: notifications.length
        }
    } catch (err) {
        logger.error('[NotificationService] Failed to get notifications', err)
        return { notifications: [], unreadCount: 0, total: 0 }
    }
}

// Check for new notifications từ các APIs
export const checkForNewNotifications = async () => {
    try {
        const store = useNotificationStore()
        const settings = store.settings

        const checks = []

        // Check orders nếu được bật
        if (settings.orderNotifications) {
            checks.push(checkOrderNotifications())
        }

        // Check inventory nếu được bật
        if (settings.inventoryAlerts) {
            checks.push(checkInventoryAlerts())
        }

        // Check staff notifications nếu được bật
        if (settings.staffNotifications) {
            checks.push(checkStaffNotifications())
        }

        // Check real-time dashboard alerts
        checks.push(checkRealTimeAlerts())

        await Promise.all(checks)
    } catch (err) {
        logger.error('[NotificationService] Failed to check notifications', err)
    }
}

// Check order notifications
const checkOrderNotifications = async () => {
    try {
        const store = useNotificationStore()
        const cacheKey = 'orders'
        const cached = notificationCache.get(cacheKey)

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return
        }

        const pendingOrders = await orderService.getOrdersByStatus('PENDING', 0, 100)
        const ordersList = Array.isArray(pendingOrders) ? pendingOrders : (pendingOrders?.content || [])

        // Notification khi có nhiều đơn đang chờ
        if (ordersList.length > 10) {
            const notificationId = `order-pending-${ordersList.length}`
            if (!isNotificationExists(notificationId)) {
                store.addNotification({
                    type: 'order',
                    priority: 'warning',
                    title: 'Nhiều đơn đang chờ',
                    message: `Có ${ordersList.length} đơn hàng đang chờ xử lý`,
                    action: {
                        label: 'Xem đơn hàng',
                        route: '/orders?status=PENDING'
                    },
                    metadata: {
                        count: ordersList.length,
                        notificationId
                    }
                })
                notificationCache.set(cacheKey, { timestamp: Date.now() })
            }
        }

        // Notification cho đơn mới (check từng đơn)
        for (const order of ordersList.slice(0, 5)) {
            const notificationId = `order-new-${order.id}`
            if (!isNotificationExists(notificationId) && isRecentOrder(order)) {
                store.addNotification({
                    type: 'order',
                    priority: 'info',
                    title: 'Đơn hàng mới',
                    message: `Đơn hàng #${order.id} - ${formatCurrency(order.totalAmount || 0)}`,
                    action: {
                        label: 'Xem chi tiết',
                        route: `/orders/${order.id}`
                    },
                    metadata: {
                        orderId: order.id,
                        notificationId
                    }
                })
            }
        }
    } catch (err) {
        logger.error('[NotificationService] Failed to check order notifications', err)
    }
}

// Check inventory alerts
const checkInventoryAlerts = async () => {
    try {
        const store = useNotificationStore()
        const cacheKey = 'inventory'
        const cached = notificationCache.get(cacheKey)

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return
        }

        const analysis = await inventoryService.analyzeInventory({ includeStable: false })
        const items = analysis?.items || []

        // Critical items
        const criticalItems = items.filter(item =>
            item.alertStatus?.status === 'CRITICAL'
        )

        if (criticalItems.length > 0) {
            const notificationId = `inventory-critical-${Date.now()}`
            if (!isNotificationExists(notificationId)) {
                store.addNotification({
                    type: 'inventory',
                    priority: 'critical',
                    title: 'Nguyên liệu sắp hết',
                    message: `Có ${criticalItems.length} nguyên liệu sắp hết cần bổ sung ngay`,
                    action: {
                        label: 'Xem danh sách',
                        route: '/inventory?alert=critical'
                    },
                    metadata: {
                        count: criticalItems.length,
                        items: criticalItems.slice(0, 3).map(i => i.name),
                        notificationId
                    }
                })
            }
        }

        // Warning items
        const warningItems = items.filter(item =>
            item.alertStatus?.status === 'WARNING'
        )

        if (warningItems.length > 0 && criticalItems.length === 0) {
            const notificationId = `inventory-warning-${Date.now()}`
            if (!isNotificationExists(notificationId)) {
                store.addNotification({
                    type: 'inventory',
                    priority: 'warning',
                    title: 'Nguyên liệu cần chú ý',
                    message: `Có ${warningItems.length} nguyên liệu cần chú ý`,
                    action: {
                        label: 'Xem danh sách',
                        route: '/inventory?alert=warning'
                    },
                    metadata: {
                        count: warningItems.length,
                        notificationId
                    }
                })
            }
        }

        notificationCache.set(cacheKey, { timestamp: Date.now() })
    } catch (err) {
        logger.error('[NotificationService] Failed to check inventory alerts', err)
    }
}

// Check staff notifications
const checkStaffNotifications = async () => {
    try {
        const store = useNotificationStore()
        const cacheKey = 'staff'
        const cached = notificationCache.get(cacheKey)

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION * 2) {
            return
        }

        // Check upcoming shifts
        const assignments = await shiftService.getAssignmentsForCurrentUser()
        const assignmentsList = Array.isArray(assignments) ? assignments : []

        const now = new Date()
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

        for (const assignment of assignmentsList) {
            if (assignment.status === 'SCHEDULED' || assignment.status === 'CONFIRMED') {
                const _shiftDate = new Date(assignment.shiftDate)
                const shiftStart = new Date(`${assignment.shiftDate}T${assignment.startTime || '08:00'}`)

                // Reminder 1 giờ trước khi shift bắt đầu
                if (shiftStart > now && shiftStart <= oneHourFromNow) {
                    const notificationId = `shift-reminder-${assignment.id}`
                    if (!isNotificationExists(notificationId)) {
                        store.addNotification({
                            type: 'staff',
                            priority: 'info',
                            title: 'Nhắc nhở ca làm việc',
                            message: 'Ca làm việc của bạn bắt đầu sau 1 giờ',
                            action: {
                                label: 'Xem chi tiết',
                                route: `/shifts/assignments/${assignment.id}`
                            },
                            metadata: {
                                assignmentId: assignment.id,
                                shiftDate: assignment.shiftDate,
                                notificationId
                            }
                        })
                    }
                }
            }
        }

        notificationCache.set(cacheKey, { timestamp: Date.now() })
    } catch (err) {
        logger.error('[NotificationService] Failed to check staff notifications', err)
    }
}

// Check real-time dashboard alerts
const checkRealTimeAlerts = async () => {
    try {
        const store = useNotificationStore()
        const { userRole, userId } = getCurrentUser()

        if (!userRole) return

        const cacheKey = 'realtime-alerts'
        const cached = notificationCache.get(cacheKey)

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return
        }

        const dashboard = await realTimeDashboardService.getRealTimeDashboard(userRole, userId)
        const alerts = dashboard?.alerts || []

        for (const alert of alerts) {
            const notificationId = `realtime-${alert.type}-${alert.count || Date.now()}`
            if (!isNotificationExists(notificationId)) {
                store.addNotification({
                    type: alert.type === 'critical' ? 'system' : 'order',
                    priority: alert.type,
                    title: alert.title,
                    message: alert.message,
                    action: alert.action ? {
                        label: alert.action,
                        route: getActionRoute(alert.action)
                    } : null,
                    metadata: {
                        alertType: alert.type,
                        count: alert.count,
                        notificationId
                    }
                })
            }
        }

        notificationCache.set(cacheKey, { timestamp: Date.now() })
    } catch (err) {
        logger.error('[NotificationService] Failed to check real-time alerts', err)
    }
}

// Helper functions
const isNotificationExists = (notificationId) => {
    const store = useNotificationStore()
    return store.notifications.some(n =>
        n.metadata?.notificationId === notificationId
    )
}

const isRecentOrder = (order) => {
    if (!order.createdAt) return false
    const createdAt = new Date(order.createdAt)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return createdAt > fiveMinutesAgo
}

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
}).format(value || 0)

const getCurrentUser = () => {
    try {
        const authStore = useAuthStore()
        const userRoles = authStore.userRoles || []
        return {
            userRole: userRoles[0] || null,
            userId: authStore.user?.id || null
        }
    } catch {
        return { userRole: null, userId: null }
    }
}

const getActionRoute = (action) => {
    const routeMap = {
        'Xem danh sách đơn hàng': '/orders?status=PENDING',
        'Xem danh sách nguyên liệu': '/inventory',
        'Xem sơ đồ bàn': '/tables'
    }
    return routeMap[action] || '/'
}

// Mark as read (client-side only)
export const markAsRead = (_notificationId) =>
    // Client-side only, không cần API call
    ({ success: true })


// Mark all as read
export const markAllAsRead = () =>
    // Client-side only
    ({ success: true })


// Delete notification
export const deleteNotification = (_notificationId) =>
    // Client-side only
    ({ success: true })


// Clear all notifications
export const clearAll = () =>
    // Client-side only
    ({ success: true })

