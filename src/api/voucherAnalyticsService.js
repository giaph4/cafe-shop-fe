import { buildApiError } from '@/utils/errorHandler'
import api from './axios'

const toNumber = (value) => {
    if (value === null || value === undefined) return 0
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
}

const _calculateVoucherDiscount = (voucher, orderAmount) => {
    if (!voucher || !orderAmount) return 0

    if (voucher.type === 'FIXED_AMOUNT') {
        return Math.min(toNumber(voucher.discountValue), toNumber(orderAmount))
    } else if (voucher.type === 'PERCENTAGE') {
        const discount = (toNumber(orderAmount) * toNumber(voucher.discountValue)) / 100
        const maxDiscount = voucher.maximumDiscountAmount ? toNumber(voucher.maximumDiscountAmount) : Infinity
        return Math.min(discount, maxDiscount)
    }
    return 0
}

export const analyzeVoucherPerformance = async ({ startDate, endDate, voucherId = null }) => {
    try {
        // Call backend API instead of calculating locally
        const params = { startDate, endDate }
        if (voucherId) {
            params.voucherId = voucherId
        }
        
        const { data } = await api.get('/api/v1/reports/voucher-analytics', { params })

        if (!data) {
            throw new Error('Không nhận được dữ liệu từ server')
        }

        // Normalize response to match frontend expectations
        return {
            summary: {
                totalVouchers: data.summary?.totalVouchers || 0,
                activeVouchers: data.summary?.activeVouchers || 0,
                totalUsage: data.summary?.totalUsage || 0,
                totalDiscount: toNumber(data.summary?.totalDiscount),
                totalRevenue: toNumber(data.summary?.totalRevenue),
                totalIncrementalRevenue: toNumber(data.summary?.totalIncrementalRevenue),
                avgROI: toNumber(data.summary?.avgROI),
                totalNewCustomers: data.summary?.totalNewCustomers || 0
            },
            vouchers: (data.vouchers || []).map(v => ({
                voucherId: v.voucherId,
                code: v.code,
                type: v.type,
                discountValue: toNumber(v.discountValue),
                description: v.description,
                validFrom: v.validFrom,
                validTo: v.validTo,
                active: v.active,
                metrics: {
                    totalUsage: v.metrics?.totalUsage || 0,
                    totalDiscount: toNumber(v.metrics?.totalDiscount),
                    totalRevenue: toNumber(v.metrics?.totalRevenue),
                    avgOrderValue: toNumber(v.metrics?.avgOrderValue),
                    uniqueCustomers: v.metrics?.uniqueCustomers || 0,
                    incrementalRevenue: toNumber(v.metrics?.incrementalRevenue),
                    incrementalRevenueTotal: toNumber(v.metrics?.incrementalRevenueTotal),
                    roi: toNumber(v.metrics?.roi),
                    costPerAcquisition: toNumber(v.metrics?.costPerAcquisition),
                    daysWithVoucher: v.metrics?.daysWithVoucher || 0,
                    avgRevenueWithVoucher: toNumber(v.metrics?.avgRevenueWithVoucher),
                    avgRevenueWithoutVoucher: toNumber(v.metrics?.avgRevenueWithoutVoucher)
                },
                orders: (v.orders || []).map(order => ({
                    id: order.id,
                    date: order.date,
                    amount: toNumber(order.amount),
                    discount: toNumber(order.discount),
                    customerId: order.customerId
                }))
            })),
            meta: {
                startDate: data.meta?.startDate || startDate,
                endDate: data.meta?.endDate || endDate,
                generatedAt: data.meta?.generatedAt || new Date().toISOString(),
                totalOrders: data.meta?.totalOrders || 0,
                voucherUsageCount: data.meta?.voucherUsageCount || 0
            }
        }
    } catch (error) {
        throw buildApiError(error)
    }
}

export const getVoucherUsageOverTime = async ({ startDate, endDate, voucherId = null }) => {
    try {
        // Call backend API instead of calculating locally
        const params = { startDate, endDate }
        if (voucherId) {
            params.voucherId = voucherId
        }
        
        const { data } = await api.get('/api/v1/reports/voucher-usage-over-time', { params })

        if (!data) {
            return []
        }

        // Normalize response to match frontend expectations
        return (Array.isArray(data) ? data : []).map(item => ({
            date: item.date,
            usageCount: item.usageCount || 0,
            totalDiscount: toNumber(item.totalDiscount),
            totalRevenue: toNumber(item.totalRevenue)
        }))
    } catch (error) {
        throw buildApiError(error)
    }
}

export const compareVoucherStrategies = async ({ startDate, endDate, voucherIds }) => {
    try {
        if (!Array.isArray(voucherIds) || voucherIds.length < 2) {
            throw new Error('Cần ít nhất 2 voucher để so sánh')
        }

        const results = await Promise.all(
            voucherIds.map(id => analyzeVoucherPerformance({ startDate, endDate, voucherId: id }))
        )

        return results.map((result, index) => ({
            voucherId: voucherIds[index],
            voucher: result.vouchers[0],
            metrics: result.vouchers[0]?.metrics || {}
        }))
    } catch (error) {
        throw buildApiError(error)
    }
}

export const exportVoucherAnalytics = (analyticsData) => {
    try {
        const data = [
            ['Mã voucher', 'Loại', 'Số lần dùng', 'Tổng giảm giá', 'Doanh thu', 'ROI (%)', 'Khách hàng mới', 'Trạng thái'],
            ...analyticsData.vouchers.map(v => [
                v.code,
                v.type === 'FIXED_AMOUNT' ? 'Giảm cố định' : 'Giảm %',
                v.metrics.totalUsage,
                v.metrics.totalDiscount,
                v.metrics.totalRevenue,
                v.metrics.roi,
                v.metrics.uniqueCustomers,
                v.active ? 'Hoạt động' : 'Tạm dừng'
            ])
        ]

        return {
            filename: `phan-tich-voucher-${new Date().toISOString().split('T')[0]}.xlsx`,
            data,
            sheetName: 'Phân tích Voucher'
        }
    } catch (error) {
        throw buildApiError(error)
    }
}

