import api from './axios'
import { cleanParams } from './utils'
import { buildApiError } from '@/utils/errorHandler'

const BASE_URL = '/api/admin/analytics'

const toNumber = (value, fallback = 0) => {
    if (value === null || value === undefined) return fallback
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isNaN(parsed) ? fallback : parsed
}

const buildMeta = (extra = {}) => ({
    fetchedAt: new Date().toISOString(),
    ...extra
})

const normalizeBestSeller = (item) => ({
    productId: item?.productId ?? null,
    productName: typeof item?.productName === 'string' ? item.productName : null,
    totalQuantity: toNumber(item?.totalQuantity, 0),
    totalRevenue: toNumber(item?.totalRevenue, 0)
})

const normalizeCustomerMetric = (item) => ({
    customerId: item?.customerId ?? null,
    customerName: typeof item?.customerName === 'string' ? item.customerName : null,
    phone: typeof item?.phone === 'string' ? item.phone : null,
    orderCount: toNumber(item?.orderCount, 0),
    totalSpend: toNumber(item?.totalSpend, 0),
    averageSpend: toNumber(item?.averageSpend, 0)
})

const normalizeStaffMetric = (item) => ({
    staffId: item?.staffId ?? null,
    staffName: typeof item?.staffName === 'string' ? item.staffName : null,
    orderCount: toNumber(item?.orderCount, 0),
    totalRevenue: toNumber(item?.totalRevenue, 0)
})

export const normalizeDashboardMetrics = (payload, metaSource = null) => {
    if (!payload || typeof payload !== 'object') return null

    const topProducts = Array.isArray(payload.topProducts)
        ? payload.topProducts.map(normalizeBestSeller)
        : []

    const topCustomers = Array.isArray(payload.topCustomers)
        ? payload.topCustomers.map(normalizeCustomerMetric)
        : []

    const topStaff = Array.isArray(payload.topStaff)
        ? payload.topStaff.map(normalizeStaffMetric)
        : []

    return {
        from: payload.from ?? null,
        to: payload.to ?? null,
        totalOrders: toNumber(payload.totalOrders, 0),
        paidOrders: toNumber(payload.paidOrders, 0),
        cancelledOrders: toNumber(payload.cancelledOrders, 0),
        totalRevenue: toNumber(payload.totalRevenue, 0),
        averageOrderValue: toNumber(payload.averageOrderValue, 0),
        totalDiscount: toNumber(payload.totalDiscount, 0),
        voucherUsageCount: toNumber(payload.voucherUsageCount, 0),
        topProducts,
        topCustomers,
        topStaff,
        meta: buildMeta({ source: metaSource || 'AdminAnalyticsController#getMetrics' })
    }
}

export const getAdminMetrics = async ({
    from,
    to,
    includeTopProducts = true,
    includeVoucherStats = true,
    includeCustomerStats = true
} = {}) => {
    const params = cleanParams({
        from,
        to,
        includeTopProducts,
        includeVoucherStats,
        includeCustomerStats
    })
    const { data } = await api.get(`${BASE_URL}/metrics`, { params })
    return normalizeDashboardMetrics(data)
}

export const generateAdminInsight = async (payload) => {
    const body = {
        from: payload?.from,
        to: payload?.to,
        question: payload?.question ?? '',
        includeTopProducts: payload?.includeTopProducts ?? true,
        includeVoucherStats: payload?.includeVoucherStats ?? true,
        includeCustomerStats: payload?.includeCustomerStats ?? true
    }

    const { data } = await api.post(`${BASE_URL}/insight`, body)

    return {
        request: {
            from: data?.request?.from ?? body.from,
            to: data?.request?.to ?? body.to,
            question: data?.request?.question ?? body.question,
            includeTopProducts: data?.request?.includeTopProducts ?? body.includeTopProducts,
            includeVoucherStats: data?.request?.includeVoucherStats ?? body.includeVoucherStats,
            includeCustomerStats: data?.request?.includeCustomerStats ?? body.includeCustomerStats
        },
        metrics: normalizeDashboardMetrics(data?.metrics, 'AdminAnalyticsController#generateInsight'),
        aiInsightMarkdown: typeof data?.aiInsightMarkdown === 'string' ? data.aiInsightMarkdown : '',
        generatedAt: data?.generatedAt ?? new Date().toISOString()
    }
}

