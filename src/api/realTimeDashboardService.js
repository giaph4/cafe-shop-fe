import { buildApiError } from '@/utils/errorHandler'
import logger from '@/utils/logger'
import * as reportService from './reportService'
import * as orderService from './orderService'
import * as inventoryService from './inventoryManagementService'
import * as tableService from './tableService'
import * as shiftService from './shiftService'

const toNumber = (value) => {
    if (value === null || value === undefined) return 0
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
}

export const getRealTimeDashboard = async (userRole, userId = null) => {
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayStr = today.toISOString().split('T')[0]

        const [
            dashboardData,
            pendingOrders,
            lowStockItems,
            tables,
            currentShift
        ] = await Promise.all([
            getRoleDashboard(userRole, userId),
            orderService.getOrdersByStatus('PENDING').catch(() => []),
            inventoryService.analyzeInventory({ includeStable: false }).then(data => (data.items || []).filter(item =>
                item.alertStatus?.status === 'CRITICAL' ||
                    item.alertStatus?.status === 'WARNING' ||
                    item.alertStatus?.status === 'INFO'
            )).catch(() => []),
            tableService.getTables().catch(() => []),
            (async () => {
                try {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const todayStr = today.toISOString().split('T')[0]
                    const shifts = await shiftService.listShiftInstances({
                        startDate: todayStr,
                        endDate: todayStr,
                        status: 'IN_PROGRESS'
                    })
                    const shiftsList = Array.isArray(shifts) ? shifts : (shifts?.content || [])
                    return shiftsList.length > 0 ? shiftsList[0] : null
                } catch {
                    return null
                }
            })()
        ])

        const pendingOrdersList = Array.isArray(pendingOrders) ? pendingOrders : (pendingOrders?.content || [])
        const lowStockList = Array.isArray(lowStockItems) ? lowStockItems : (lowStockItems?.content || [])
        const tablesList = Array.isArray(tables) ? tables : (tables?.content || [])

        const revenueToday = dashboardData.revenueToday || 0
        const ordersToday = dashboardData.ordersToday || 0
        const activeTables = tablesList.filter(t => t.status === 'OCCUPIED' || t.status === 'RESERVED').length
        const staffOnDuty = currentShift ? (currentShift.assignments?.length || 0) : 0

        const alerts = generateAlerts({
            pendingOrders: pendingOrdersList,
            lowStockItems: lowStockList,
            tables: tablesList,
            revenueToday,
            ordersToday
        })

        const hourlyRevenue = await generateHourlyRevenue(todayStr)

        return {
            kpis: {
                revenueToday,
                ordersToday,
                activeTables,
                staffOnDuty,
                avgOrderValue: ordersToday > 0 ? revenueToday / ordersToday : 0
            },
            alerts,
            pendingOrders: pendingOrdersList.slice(0, 10),
            lowStockItems: lowStockList.slice(0, 10),
            tables: tablesList,
            currentShift,
            hourlyRevenue,
            lastUpdated: new Date().toISOString()
        }
    } catch (error) {
        throw buildApiError(error)
    }
}

const getRoleDashboard = async (_userRole, _userId) => {
    try {
        const today = new Date().toISOString().split('T')[0]
        const [dashboardStats, todayRevenue] = await Promise.all([
            reportService.getDashboardStats().catch(() => null),
            reportService.getDailyRevenue(today).catch(() => null)
        ])

        return {
            revenueToday: toNumber(todayRevenue?.totalRevenue || dashboardStats?.todayRevenue || 0),
            ordersToday: toNumber(dashboardStats?.todayOrders || 0)
        }
    } catch (error) {
        logger.warn('[RealTimeDashboard] Không thể lấy dữ liệu dashboard theo vai trò, sử dụng giá trị mặc định', error)
        return { revenueToday: 0, ordersToday: 0 }
    }
}

const generateAlerts = (data) => {
    const alerts = []

    if (data.pendingOrders.length > 10) {
        alerts.push({
            type: 'critical',
            title: 'Nhiều đơn đang chờ',
            message: `Có ${data.pendingOrders.length} đơn hàng đang chờ xử lý`,
            action: 'Xem danh sách đơn hàng',
            count: data.pendingOrders.length
        })
    }

    if (data.lowStockItems.length > 0) {
        const critical = data.lowStockItems.filter(item => (item.stockLevel / item.minStockLevel) < 0.2).length
        if (critical > 0) {
            alerts.push({
                type: 'critical',
                title: 'Nguyên liệu sắp hết',
                message: `Có ${critical} nguyên liệu sắp hết cần bổ sung ngay`,
                action: 'Xem danh sách nguyên liệu',
                count: critical
            })
        } else {
            alerts.push({
                type: 'warning',
                title: 'Nguyên liệu sắp hết',
                message: `Có ${data.lowStockItems.length} nguyên liệu cần chú ý`,
                action: 'Xem danh sách nguyên liệu',
                count: data.lowStockItems.length
            })
        }
    }

    const occupiedTables = data.tables.filter(t => t.status === 'OCCUPIED').length
    const totalTables = data.tables.length
    if (totalTables > 0 && (occupiedTables / totalTables) > 0.9) {
        alerts.push({
            type: 'warning',
            title: 'Bàn gần hết',
            message: `${occupiedTables}/${totalTables} bàn đang được sử dụng`,
            action: 'Xem sơ đồ bàn',
            count: occupiedTables
        })
    }

    if (data.revenueToday === 0 && new Date().getHours() >= 10) {
        alerts.push({
            type: 'info',
            title: 'Chưa có doanh thu hôm nay',
            message: 'Chưa có đơn hàng nào được tạo hôm nay',
            action: null,
            count: 0
        })
    }

    return alerts
}

const generateHourlyRevenue = async (date) => {
    try {
        const hourlyData = await reportService.getHourlySales(date)
        const items = hourlyData?.items || []

        // Transform API data to match expected format
        const hours = []
        const now = new Date()
        const currentHour = now.getHours()

        // Create a map of hour -> data
        const hourMap = new Map()
        items.forEach(item => {
            const hour = item.hour || item.hourOfDay || 0
            hourMap.set(hour, {
                revenue: toNumber(item.revenue || item.totalRevenue || 0),
                orders: toNumber(item.orderCount || item.orders || 0)
            })
        })

        // Fill hours from 0 to current hour
        for (let i = 0; i <= currentHour; i++) {
            const data = hourMap.get(i) || { revenue: 0, orders: 0 }
            hours.push({
                hour: i,
                revenue: data.revenue,
                orders: data.orders
            })
        }

        return hours
    } catch (error) {
        logger.error('[RealTimeDashboard] Không thể lấy dữ liệu doanh thu theo giờ:', error)
        // Trả về mảng rỗng nếu API thất bại
        const hours = []
        const now = new Date()
        const currentHour = now.getHours()
        for (let i = 0; i <= currentHour; i++) {
            hours.push({
                hour: i,
                revenue: 0,
                orders: 0
            })
        }
        return hours
    }
}

export const getHistoricalComparison = async (compareType = 'yesterday') => {
    try {
        const today = new Date()
        const compareDate = new Date()

        if (compareType === 'yesterday') {
            compareDate.setDate(compareDate.getDate() - 1)
        } else if (compareType === 'lastWeek') {
            compareDate.setDate(compareDate.getDate() - 7)
        }

        const todayStr = today.toISOString().split('T')[0]
        const compareStr = compareDate.toISOString().split('T')[0]

        const [todayRevenueData, compareRevenueData, todayStats, compareOrdersData] = await Promise.all([
            reportService.getDailyRevenue(todayStr).catch(() => ({ totalRevenue: 0 })),
            reportService.getDailyRevenue(compareStr).catch(() => ({ totalRevenue: 0 })),
            reportService.getDashboardStats().catch(() => ({ todayOrders: 0 })),
            orderService.getOrdersByDateRange(compareStr, compareStr, 0, 1000).catch(() => [])
        ])

        const todayRevenue = toNumber(todayRevenueData.totalRevenue || 0)
        const compareRevenue = toNumber(compareRevenueData.totalRevenue || 0)
        const todayOrders = toNumber(todayStats.todayOrders || 0)
        const compareOrdersList = Array.isArray(compareOrdersData) ? compareOrdersData : (compareOrdersData?.content || [])
        const compareOrders = compareOrdersList.length

        return {
            revenue: {
                today: todayRevenue,
                compare: compareRevenue,
                change: compareRevenue > 0 ? ((todayRevenue - compareRevenue) / compareRevenue) * 100 : 0
            },
            orders: {
                today: todayOrders,
                compare: compareOrders,
                change: compareOrders > 0 ? ((todayOrders - compareOrders) / compareOrders) * 100 : 0
            },
            compareType
        }
    } catch (error) {
        throw buildApiError(error)
    }
}

