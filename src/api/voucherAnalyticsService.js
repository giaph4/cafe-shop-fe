import { buildApiError } from '@/utils/errorHandler'
import * as voucherService from './voucherService'
import * as orderService from './orderService'
import * as reportService from './reportService'
import * as adminAnalyticsService from './adminAnalyticsService'
import * as customerService from './customerService'

const toNumber = (value) => {
    if (value === null || value === undefined) return 0
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
}

const calculateVoucherDiscount = (voucher, orderAmount) => {
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
        const [vouchers, orders, revenueData, metrics] = await Promise.all([
            voucherService.searchVouchers({ 
                active: '', 
                page: 0, 
                size: 1000 
            }),
            orderService.getOrdersByDateRange(startDate, endDate, 0, 1000),
            reportService.getRevenueByDate(startDate, endDate),
            adminAnalyticsService.getAdminMetrics({ from: startDate, to: endDate })
        ])

        const vouchersList = Array.isArray(vouchers) 
            ? vouchers 
            : (vouchers?.content || [])
        
        const ordersList = Array.isArray(orders)
            ? orders
            : (orders?.content || [])

        const filteredVouchers = voucherId
            ? vouchersList.filter(v => v.id === voucherId)
            : vouchersList.filter(v => {
                const validFrom = v.validFrom ? new Date(v.validFrom) : null
                const validTo = v.validTo ? new Date(v.validTo) : null
                const start = new Date(startDate)
                const end = new Date(endDate)
                
                if (validFrom && validTo) {
                    return (validFrom <= end && validTo >= start)
                }
                return true
            })

        const voucherAnalytics = filteredVouchers.map(voucher => {
            const voucherOrders = ordersList.filter(order => 
                order.voucherCode === voucher.code || order.voucherId === voucher.id
            )

            const totalUsage = voucherOrders.length
            const totalDiscount = voucherOrders.reduce((sum, order) => {
                return sum + toNumber(order.discountAmount || 0)
            }, 0)

            const totalRevenue = voucherOrders.reduce((sum, order) => {
                return sum + toNumber(order.totalAmount || 0)
            }, 0)

            const avgOrderValue = totalUsage > 0 ? totalRevenue / totalUsage : 0

            const uniqueCustomers = new Set(
                voucherOrders
                    .filter(order => order.customerId)
                    .map(order => order.customerId)
            ).size

            const revenueDataEntries = revenueData?.entries || []
            const voucherDates = new Set(
                voucherOrders.map(order => {
                    const date = new Date(order.createdAt || order.paidAt)
                    return date.toISOString().split('T')[0]
                })
            )

            const daysWithVoucher = Array.from(voucherDates)
            const daysWithoutVoucher = revenueDataEntries
                .filter(entry => !voucherDates.has(entry.date))
                .map(entry => toNumber(entry.value))

            const avgRevenueWithVoucher = daysWithVoucher.length > 0
                ? daysWithVoucher.reduce((sum, date) => {
                    const entry = revenueDataEntries.find(e => e.date === date)
                    return sum + toNumber(entry?.value || 0)
                }, 0) / daysWithVoucher.length
                : 0

            const avgRevenueWithoutVoucher = daysWithoutVoucher.length > 0
                ? daysWithoutVoucher.reduce((sum, val) => sum + val, 0) / daysWithoutVoucher.length
                : 0

            const incrementalRevenue = avgRevenueWithVoucher - avgRevenueWithoutVoucher
            const incrementalRevenueTotal = incrementalRevenue * daysWithVoucher.length

            const roi = totalDiscount > 0
                ? ((incrementalRevenueTotal - totalDiscount) / totalDiscount) * 100
                : 0

            const costPerAcquisition = uniqueCustomers > 0
                ? totalDiscount / uniqueCustomers
                : 0

            return {
                voucherId: voucher.id,
                code: voucher.code,
                type: voucher.type,
                discountValue: toNumber(voucher.discountValue),
                description: voucher.description,
                validFrom: voucher.validFrom,
                validTo: voucher.validTo,
                active: voucher.active,
                metrics: {
                    totalUsage,
                    totalDiscount,
                    totalRevenue,
                    avgOrderValue: Math.round(avgOrderValue),
                    uniqueCustomers,
                    incrementalRevenue: Math.round(incrementalRevenue),
                    incrementalRevenueTotal: Math.round(incrementalRevenueTotal),
                    roi: Math.round(roi * 100) / 100,
                    costPerAcquisition: Math.round(costPerAcquisition),
                    daysWithVoucher: daysWithVoucher.length,
                    avgRevenueWithVoucher: Math.round(avgRevenueWithVoucher),
                    avgRevenueWithoutVoucher: Math.round(avgRevenueWithoutVoucher)
                },
                orders: voucherOrders.map(order => ({
                    id: order.id,
                    date: order.createdAt || order.paidAt,
                    amount: toNumber(order.totalAmount),
                    discount: toNumber(order.discountAmount || 0),
                    customerId: order.customerId
                }))
            }
        })

        const summary = {
            totalVouchers: vouchersList.length,
            activeVouchers: vouchersList.filter(v => v.active).length,
            totalUsage: voucherAnalytics.reduce((sum, v) => sum + v.metrics.totalUsage, 0),
            totalDiscount: voucherAnalytics.reduce((sum, v) => sum + v.metrics.totalDiscount, 0),
            totalRevenue: voucherAnalytics.reduce((sum, v) => sum + v.metrics.totalRevenue, 0),
            totalIncrementalRevenue: voucherAnalytics.reduce((sum, v) => sum + v.metrics.incrementalRevenueTotal, 0),
            avgROI: voucherAnalytics.length > 0
                ? voucherAnalytics.reduce((sum, v) => sum + v.metrics.roi, 0) / voucherAnalytics.length
                : 0,
            totalNewCustomers: new Set(
                voucherAnalytics.flatMap(v => 
                    v.orders.filter(o => o.customerId).map(o => o.customerId)
                )
            ).size
        }

        return {
            summary,
            vouchers: voucherAnalytics.sort((a, b) => b.metrics.totalUsage - a.metrics.totalUsage),
            meta: {
                startDate,
                endDate,
                generatedAt: new Date().toISOString(),
                totalOrders: ordersList.length,
                voucherUsageCount: metrics?.voucherUsageCount || 0
            }
        }
    } catch (error) {
        throw buildApiError(error)
    }
}

export const getVoucherUsageOverTime = async ({ startDate, endDate, voucherId = null }) => {
    try {
        const orders = await orderService.getOrdersByDateRange(startDate, endDate, 0, 1000)
        const ordersList = Array.isArray(orders) ? orders : (orders?.content || [])

        const voucherOrders = voucherId
            ? ordersList.filter(order => order.voucherId === voucherId || order.voucherCode)
            : ordersList.filter(order => order.voucherCode || order.voucherId)

        const usageByDate = {}
        voucherOrders.forEach(order => {
            const date = new Date(order.createdAt || order.paidAt).toISOString().split('T')[0]
            if (!usageByDate[date]) {
                usageByDate[date] = {
                    date,
                    usageCount: 0,
                    totalDiscount: 0,
                    totalRevenue: 0
                }
            }
            usageByDate[date].usageCount += 1
            usageByDate[date].totalDiscount += toNumber(order.discountAmount || 0)
            usageByDate[date].totalRevenue += toNumber(order.totalAmount || 0)
        })

        return Object.values(usageByDate).sort((a, b) => a.date.localeCompare(b.date))
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

export const exportVoucherAnalytics = async (analyticsData) => {
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

