import api from './axios'
import { cleanParams } from './utils'
import { buildApiError } from './utils/errorHandler'

const BASE_URL = '/api/admin/dashboard'

const toNumber = (value, fallback = 0) => {
    if (value === null || value === undefined) return fallback
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isNaN(parsed) ? fallback : parsed
}

const normalizeRevenueSnapshot = (revenue) => {
    if (!revenue) return null
    return {
        today: toNumber(revenue.today),
        month: toNumber(revenue.month),
        year: toNumber(revenue.year),
        averageOrderValue: toNumber(revenue.averageOrderValue),
        todayProfit: toNumber(revenue.todayProfit),
        monthProfit: toNumber(revenue.monthProfit)
    }
}

const normalizeOrderSnapshot = (orders) => {
    if (!orders) return null
    return {
        today: toNumber(orders.today, 0),
        month: toNumber(orders.month, 0),
        year: toNumber(orders.year, 0),
        cancelledToday: toNumber(orders.cancelledToday, 0),
        cancelledMonth: toNumber(orders.cancelledMonth, 0)
    }
}

const normalizeInventorySnapshot = (inventory) => {
    if (!inventory) return null
    return {
        lowStockItems: toNumber(inventory.lowStockItems, 0),
        totalSuppliers: toNumber(inventory.totalSuppliers, 0),
        pendingPurchaseOrders: toNumber(inventory.pendingPurchaseOrders, 0)
    }
}

const normalizeTopProductMetric = (item) => ({
    productId: item?.productId ?? null,
    productName: item?.productName ?? null,
    quantity: toNumber(item?.quantity, 0),
    revenue: toNumber(item?.revenue, 0)
})

const normalizeTopCustomerMetric = (item) => ({
    customerId: item?.customerId ?? null,
    customerName: item?.customerName ?? null,
    phone: item?.phone ?? null,
    orders: toNumber(item?.orders, 0),
    spend: toNumber(item?.spend, 0)
})

const normalizeTopStaffMetric = (item) => ({
    staffId: item?.staffId ?? null,
    staffName: item?.staffName ?? null,
    orders: toNumber(item?.orders, 0),
    revenue: toNumber(item?.revenue, 0)
})

const normalizeSystemAlert = (alert) => ({
    type: alert?.type ?? null,
    message: alert?.message ?? null,
    severity: alert?.severity ?? null
})

export const getAdminDashboard = async ({ range, from, to } = {}) => {
    const params = cleanParams({ range, from, to })
    const { data } = await api.get(BASE_URL, { params })

    if (!data) return null

    return {
        revenue: normalizeRevenueSnapshot(data.revenue),
        orders: normalizeOrderSnapshot(data.orders),
        inventory: normalizeInventorySnapshot(data.inventory),
        topStaff: Array.isArray(data.topStaff) ? data.topStaff.map(normalizeTopStaffMetric) : [],
        topProducts: Array.isArray(data.topProducts) ? data.topProducts.map(normalizeTopProductMetric) : [],
        topCustomers: Array.isArray(data.topCustomers) ? data.topCustomers.map(normalizeTopCustomerMetric) : [],
        alerts: Array.isArray(data.alerts) ? data.alerts.map(normalizeSystemAlert) : []
    }
}

