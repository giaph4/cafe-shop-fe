import { buildApiError } from '@/utils/errorHandler'
import api from './axios'

const toNumber = (value) => {
    if (value === null || value === undefined) return 0
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
}

export const analyzeCosts = async ({ startDate, endDate } = {}) => {
    try {
        // Gọi backend API để lấy dữ liệu phân tích chi phí
        const { data } = await api.get('/api/v1/reports/cost-analysis', {
            params: { startDate, endDate }
        })

        if (!data) {
            throw new Error('Không nhận được dữ liệu từ server')
        }

        // Chuẩn hóa response cho frontend
        return {
            summary: {
                totalCost: toNumber(data.summary?.totalCost),
                totalRevenue: toNumber(data.summary?.totalRevenue),
                totalProfit: toNumber(data.summary?.totalProfit),
                costRevenueRatio: toNumber(data.summary?.costRevenueRatio),
                costPerOrder: toNumber(data.summary?.costPerOrder),
                profitMargin: toNumber(data.summary?.profitMargin)
            },
            categoryBreakdown: (data.categoryBreakdown || []).map(cat => ({
                category: cat.category,
                categoryLabel: cat.categoryLabel,
                amount: toNumber(cat.amount),
                count: cat.count || 0
            })),
            dailyCosts: (data.dailyCosts || []).map(day => ({
                date: day.date,
                cost: toNumber(day.cost),
                revenue: toNumber(day.revenue)
            })),
            topCategories: (data.topCategories || []).map(cat => ({
                category: cat.category,
                categoryLabel: cat.categoryLabel,
                amount: toNumber(cat.amount),
                count: cat.count || 0
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

export const exportCostReport = (costData) => {
    const data = [
        ['BÁO CÁO PHÂN TÍCH CHI PHÍ'],
        ['Thời gian:', `${costData.period.startDate} - ${costData.period.endDate}`],
        ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
        [],
        ['TỔNG QUAN'],
        ['Tổng chi phí:', `${costData.summary.totalCost.toLocaleString('vi-VN')} VNĐ`],
        ['Tổng doanh thu:', `${costData.summary.totalRevenue.toLocaleString('vi-VN')} VNĐ`],
        ['Tổng lợi nhuận:', `${costData.summary.totalProfit.toLocaleString('vi-VN')} VNĐ`],
        ['Tỷ lệ chi phí/doanh thu:', `${costData.summary.costRevenueRatio.toFixed(2)}%`],
        ['Chi phí/đơn hàng:', `${costData.summary.costPerOrder.toLocaleString('vi-VN')} VNĐ`],
        [],
        ['PHÂN LOẠI CHI PHÍ'],
        ['Danh mục', 'Số lượng', 'Tổng chi phí', 'Tỷ lệ']
    ]

    costData.categoryBreakdown.forEach(cat => {
        const ratio = costData.summary.totalCost > 0
            ? (cat.amount / costData.summary.totalCost) * 100
            : 0
        data.push([
            cat.categoryLabel,
            cat.count,
            cat.amount.toLocaleString('vi-VN'),
            `${ratio.toFixed(2)}%`
        ])
    })

    data.push([])
    data.push(['CHI TIẾT THEO NGÀY'])
    data.push(['Ngày', 'Chi phí', 'Doanh thu', 'Lợi nhuận'])

    costData.dailyCosts.slice(0, 100).forEach(day => {
        const profit = day.revenue - day.cost
        data.push([
            day.date,
            day.cost.toLocaleString('vi-VN'),
            day.revenue.toLocaleString('vi-VN'),
            profit.toLocaleString('vi-VN')
        ])
    })

    return {
        data,
        sheetName: 'Phân tích chi phí',
        filename: `phan-tich-chi-phi-${costData.period.startDate}-${costData.period.endDate}.xlsx`
    }
}
