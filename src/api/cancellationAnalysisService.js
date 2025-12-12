import { buildApiError } from '@/utils/errorHandler'
import api from './axios'

const toNumber = (value) => {
    if (value === null || value === undefined) return 0
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
}

const calculateCancellationRate = (cancelled, total) => {
    if (total === 0) return 0
    return (cancelled / total) * 100
}

export const analyzeCancellations = async ({ startDate, endDate } = {}) => {
    try {
        // Call backend API instead of calculating locally
        const { data } = await api.get('/api/v1/reports/cancellation-analysis', {
            params: { startDate, endDate }
        })

        if (!data) {
            throw new Error('Không nhận được dữ liệu từ server')
        }

        // Normalize response to match frontend expectations
        return {
            summary: {
                totalOrders: data.summary?.totalOrders || 0,
                totalCancelled: data.summary?.totalCancelled || 0,
                cancellationRate: toNumber(data.summary?.cancellationRate),
                revenueLost: toNumber(data.summary?.revenueLost),
                avgOrderValue: toNumber(data.summary?.avgOrderValue)
            },
            hourlyAnalysis: (data.hourlyAnalysis || []).map(h => ({
                hour: h.hour,
                count: h.count || 0,
                revenue: toNumber(h.revenue)
            })),
            topCancelledHours: (data.topCancelledHours || []).map(h => ({
                hour: parseInt(h.key || h.name?.replace(':00', '') || '0'),
                count: h.count || 0,
                revenue: toNumber(h.revenue)
            })),
            productAnalysis: (data.productAnalysis || []).map(p => ({
                productId: p.productId,
                productName: p.productName,
                count: p.count || 0,
                revenue: toNumber(p.revenue)
            })),
            topCancelledProducts: (data.topCancelledProducts || []).map(p => ({
                productId: parseInt(p.key || '0'),
                productName: p.name,
                count: p.count || 0,
                revenue: toNumber(p.revenue)
            })),
            tableAnalysis: (data.tableAnalysis || []).map(t => ({
                tableId: t.tableId,
                tableName: t.tableName,
                count: t.count || 0,
                revenue: toNumber(t.revenue)
            })),
            topCancelledTables: (data.topCancelledTables || []).map(t => ({
                tableId: parseInt(t.key || '0'),
                tableName: t.name,
                count: t.count || 0,
                revenue: toNumber(t.revenue)
            })),
            reasonAnalysis: (data.reasonAnalysis || []).map(r => ({
                reason: r.reason,
                count: r.count || 0,
                revenue: toNumber(r.revenue)
            })),
            topReasons: (data.topReasons || []).map(r => ({
                reason: r.name,
                count: r.count || 0,
                revenue: toNumber(r.revenue)
            })),
            dailyTrend: (data.dailyTrend || []).map(d => ({
                date: d.date,
                count: d.count || 0,
                revenue: toNumber(d.revenue)
            })),
            cancelledOrders: (data.cancelledOrders || []).map(o => ({
                id: o.id,
                orderId: o.id,
                createdAt: o.createdAt,
                totalAmount: toNumber(o.totalAmount),
                cancellationReason: o.cancellationReason || 'Không rõ',
                reason: o.cancellationReason || 'Không rõ',
                tableName: o.tableName,
                table: o.tableName ? { name: o.tableName } : null
            })),
            recommendations: (data.recommendations || []).map(r => ({
                type: r.type,
                priority: r.priority,
                message: r.message,
                impact: r.impact,
                action: r.action
            })),
            period: {
                startDate: data.period?.startDate || startDate,
                endDate: data.period?.endDate || endDate
            },
            generatedAt: data.generatedAt || new Date().toISOString()
        }
    } catch (error) {
        throw buildApiError(error)
    }
}

const generateRecommendations = (data) => {
    const recommendations = []

    if (data.cancellationRate > 10) {
        recommendations.push({
            type: 'high_rate',
            priority: 'high',
            message: `Tỷ lệ hủy đơn cao (${data.cancellationRate.toFixed(1)}%). Cần điều tra nguyên nhân ngay.`,
            impact: 'Giảm revenue và customer satisfaction',
            action: 'Phân tích chi tiết các đơn hủy và cải thiện service'
        })
    }

    if (data.topCancelledHours.length > 0) {
        const peakHour = data.topCancelledHours[0]
        recommendations.push({
            type: 'peak_hour',
            priority: 'medium',
            message: `Giờ ${peakHour.hour}:00 có nhiều đơn hủy nhất (${peakHour.count} đơn).`,
            impact: `Mất ${peakHour.revenue.toLocaleString('vi-VN')} VNĐ doanh thu`,
            action: 'Tăng nhân sự hoặc tối ưu quy trình trong giờ cao điểm'
        })
    }

    if (data.topCancelledProducts.length > 0) {
        const topProduct = data.topCancelledProducts[0]
        recommendations.push({
            type: 'product_issue',
            priority: 'medium',
            message: `Sản phẩm "${topProduct.productName}" có nhiều đơn hủy nhất (${topProduct.count} lần).`,
            impact: `Mất ${topProduct.revenue.toLocaleString('vi-VN')} VNĐ doanh thu`,
            action: 'Kiểm tra chất lượng, thời gian chế biến hoặc giá cả của sản phẩm'
        })
    }

    if (data.topReasons.length > 0) {
        const topReason = data.topReasons[0]
        recommendations.push({
            type: 'reason_analysis',
            priority: 'high',
            message: `Nguyên nhân chính: "${topReason.reason}" (${topReason.count} đơn).`,
            impact: `Mất ${topReason.revenue.toLocaleString('vi-VN')} VNĐ doanh thu`,
            action: `Tập trung giải quyết vấn đề: ${topReason.reason}`
        })
    }

    if (data.revenueLost > 10000000) {
        recommendations.push({
            type: 'revenue_impact',
            priority: 'high',
            message: `Tổng doanh thu mất do hủy đơn: ${data.revenueLost.toLocaleString('vi-VN')} VNĐ.`,
            impact: 'Ảnh hưởng đáng kể đến lợi nhuận',
            action: 'Ưu tiên cải thiện để giảm tỷ lệ hủy đơn'
        })
    }

    return recommendations
}

export const exportCancellationReport = (analysisData) => {
    const data = [
        ['BÁO CÁO PHÂN TÍCH TỶ LỆ HỦY ĐƠN'],
        ['Thời gian:', `${analysisData.period.startDate} - ${analysisData.period.endDate}`],
        ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
        [],
        ['TỔNG QUAN'],
        ['Tổng số đơn:', analysisData.summary.totalOrders],
        ['Số đơn hủy:', analysisData.summary.totalCancelled],
        ['Tỷ lệ hủy:', `${analysisData.summary.cancellationRate.toFixed(2)}%`],
        ['Doanh thu mất:', `${analysisData.summary.revenueLost.toLocaleString('vi-VN')} VNĐ`],
        [],
        ['CHI TIẾT ĐƠN HỦY'],
        ['Mã đơn', 'Thời gian', 'Tổng tiền', 'Lý do hủy', 'Bàn']
    ]

    analysisData.cancelledOrders.slice(0, 100).forEach(order => {
        const orderDate = order.createdAt ? new Date(order.createdAt) : new Date()
        data.push([
            order.id || order.orderId || 'N/A',
            orderDate.toLocaleString('vi-VN'),
            toNumber(order.totalAmount).toLocaleString('vi-VN'),
            order.cancellationReason || order.reason || 'Không rõ',
            order.tableName || order.table?.name || 'Takeaway'
        ])
    })

    return {
        data,
        sheetName: 'Phân tích hủy đơn',
        filename: `phan-tich-huy-don-${analysisData.period.startDate}-${analysisData.period.endDate}.xlsx`
    }
}

