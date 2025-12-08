import { buildApiError } from '@/utils/errorHandler'
import * as orderService from './orderService'

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
        const [allOrders, cancelledOrders] = await Promise.all([
            orderService.getOrdersByDateRange(startDate, endDate, 0, 10000),
            orderService.getOrdersByStatus('CANCELLED', { startDate, endDate })
        ])
        
        const ordersList = Array.isArray(allOrders) ? allOrders : (allOrders?.content || [])
        const cancelledList = Array.isArray(cancelledOrders) ? cancelledOrders : (cancelledOrders?.content || [])
        
        const totalOrders = ordersList.length
        const totalCancelled = cancelledList.length
        const cancellationRate = calculateCancellationRate(totalCancelled, totalOrders)
        
        const revenueLost = cancelledList.reduce((sum, order) => sum + toNumber(order.totalAmount), 0)
        
        const hourlyAnalysis = {}
        const productAnalysis = {}
        const tableAnalysis = {}
        const reasonAnalysis = {}
        
        cancelledList.forEach(order => {
            const orderDate = order.createdAt ? new Date(order.createdAt) : new Date()
            if (!isNaN(orderDate.getTime())) {
                const hour = orderDate.getHours()
                if (!hourlyAnalysis[hour]) {
                    hourlyAnalysis[hour] = {
                        hour,
                        count: 0,
                        revenue: 0
                    }
                }
                hourlyAnalysis[hour].count++
                hourlyAnalysis[hour].revenue += toNumber(order.totalAmount)
            }
            
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const productId = item.productId || item.product?.id
                    const productName = item.productName || item.product?.name || 'Unknown'
                    
                    if (!productAnalysis[productId]) {
                        productAnalysis[productId] = {
                            productId,
                            productName,
                            count: 0,
                            revenue: 0
                        }
                    }
                    productAnalysis[productId].count++
                    productAnalysis[productId].revenue += toNumber(item.totalPrice)
                })
            }
            
            const tableId = order.tableId || order.table?.id
            const tableName = order.tableName || order.table?.name || 'Takeaway'
            if (tableId) {
                if (!tableAnalysis[tableId]) {
                    tableAnalysis[tableId] = {
                        tableId,
                        tableName,
                        count: 0,
                        revenue: 0
                    }
                }
                tableAnalysis[tableId].count++
                tableAnalysis[tableId].revenue += toNumber(order.totalAmount)
            }
            
            const reason = order.cancellationReason || order.reason || 'Không rõ'
            if (!reasonAnalysis[reason]) {
                reasonAnalysis[reason] = {
                    reason,
                    count: 0,
                    revenue: 0
                }
            }
            reasonAnalysis[reason].count++
            reasonAnalysis[reason].revenue += toNumber(order.totalAmount)
        })
        
        const topCancelledHours = Object.values(hourlyAnalysis)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        
        const topCancelledProducts = Object.values(productAnalysis)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
        
        const topCancelledTables = Object.values(tableAnalysis)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
        
        const topReasons = Object.values(reasonAnalysis)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        
        const dailyTrend = {}
        cancelledList.forEach(order => {
            const orderDate = order.createdAt ? new Date(order.createdAt) : new Date()
            if (!isNaN(orderDate.getTime())) {
                const dateKey = orderDate.toISOString().split('T')[0]
                if (!dailyTrend[dateKey]) {
                    dailyTrend[dateKey] = {
                        date: dateKey,
                        count: 0,
                        revenue: 0
                    }
                }
                dailyTrend[dateKey].count++
                dailyTrend[dateKey].revenue += toNumber(order.totalAmount)
            }
        })
        
        const recommendations = generateRecommendations({
            cancellationRate,
            topCancelledHours,
            topCancelledProducts,
            topCancelledTables,
            topReasons,
            revenueLost
        })
        
        return {
            summary: {
                totalOrders,
                totalCancelled,
                cancellationRate,
                revenueLost,
                avgOrderValue: totalCancelled > 0 ? revenueLost / totalCancelled : 0
            },
            hourlyAnalysis: Object.values(hourlyAnalysis).sort((a, b) => a.hour - b.hour),
            topCancelledHours,
            productAnalysis: Object.values(productAnalysis),
            topCancelledProducts,
            tableAnalysis: Object.values(tableAnalysis),
            topCancelledTables,
            reasonAnalysis: Object.values(reasonAnalysis),
            topReasons,
            dailyTrend: Object.values(dailyTrend).sort((a, b) => a.date.localeCompare(b.date)),
            cancelledOrders: cancelledList.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0)
                const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0)
                return dateB - dateA
            }),
            recommendations,
            period: { startDate, endDate },
            generatedAt: new Date().toISOString()
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

export const exportCancellationReport = async (analysisData) => {
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

