import { buildApiError } from '@/utils/errorHandler'
import * as reportService from './reportService'
import * as shiftService from './shiftService'

const toNumber = (value) => {
    if (value === null || value === undefined) return 0
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
}

const categorizeExpense = (expense) => {
    const category = expense.category || expense.categoryName || 'OTHER'
    const categoryUpper = category.toUpperCase()
    
    if (categoryUpper.includes('INGREDIENT') || categoryUpper.includes('NGUYEN LIEU') || categoryUpper.includes('MATERIAL')) {
        return 'INGREDIENTS'
    } else if (categoryUpper.includes('LABOR') || categoryUpper.includes('LUONG') || categoryUpper.includes('SALARY') || categoryUpper.includes('WAGE')) {
        return 'LABOR'
    } else if (categoryUpper.includes('RENT') || categoryUpper.includes('THUE')) {
        return 'RENT'
    } else if (categoryUpper.includes('UTILITY') || categoryUpper.includes('DIEN') || categoryUpper.includes('NUOC')) {
        return 'UTILITIES'
    } else if (categoryUpper.includes('MARKETING') || categoryUpper.includes('QUANG CAO')) {
        return 'MARKETING'
    } else {
        return 'OTHER'
    }
}

const getCategoryLabel = (category) => {
    const labels = {
        'INGREDIENTS': 'Nguyên liệu',
        'LABOR': 'Nhân công',
        'RENT': 'Thuê mặt bằng',
        'UTILITIES': 'Tiện ích',
        'MARKETING': 'Marketing',
        'OTHER': 'Khác'
    }
    return labels[category] || category
}

export const analyzeCosts = async ({ startDate, endDate } = {}) => {
    try {
        const [expensesByDate, totalExpenses, ingredientCost, profitReport, revenueData, payrollSummaries] = await Promise.all([
            reportService.getExpensesByDate(startDate, endDate).catch(() => ({ entries: [] })),
            reportService.getTotalExpenses(startDate, endDate).catch(() => ({ totalExpenses: 0 })),
            reportService.getTotalImportedIngredientCost(startDate, endDate).catch(() => ({ totalImportedIngredientCost: 0 })),
            reportService.getProfitReport(startDate, endDate).catch(() => ({ totalRevenue: 0, totalCostOfGoodsSold: 0, totalProfit: 0 })),
            reportService.getRevenueByDate(startDate, endDate).catch(() => ({ entries: [] })),
            shiftService.listPayrollSummaries({ startDate, endDate }).catch(() => [])
        ])
        
        const expensesEntries = expensesByDate.entries || []
        const revenueEntries = revenueData.entries || []
        const payrollList = Array.isArray(payrollSummaries) ? payrollSummaries : (payrollSummaries?.content || [])
        
        const totalCost = toNumber(totalExpenses.totalExpenses || 0)
        const ingredientCostValue = toNumber(ingredientCost.totalImportedIngredientCost || 0)
        const laborCost = payrollList.reduce((sum, p) => sum + toNumber(p.totalAmount || p.totalSalary || 0), 0)
        const revenueFromEntries = revenueEntries.reduce((sum, e) => sum + toNumber(e.value || 0), 0)
        const totalRevenue = toNumber(profitReport.totalRevenue || revenueData.summary?.total || revenueFromEntries || 0)
        const totalProfit = toNumber(profitReport.totalProfit || 0)
        
        const categoryBreakdown = {}
        expensesEntries.forEach(entry => {
            entry.categories?.forEach(cat => {
                const category = categorizeExpense(cat)
                if (!categoryBreakdown[category]) {
                    categoryBreakdown[category] = {
                        category,
                        categoryLabel: getCategoryLabel(category),
                        amount: 0,
                        count: 0
                    }
                }
                categoryBreakdown[category].amount += toNumber(cat.amount || 0)
                categoryBreakdown[category].count++
            })
        })
        
        categoryBreakdown['INGREDIENTS'] = categoryBreakdown['INGREDIENTS'] || { category: 'INGREDIENTS', categoryLabel: 'Nguyên liệu', amount: 0, count: 0 }
        categoryBreakdown['INGREDIENTS'].amount += ingredientCostValue
        
        categoryBreakdown['LABOR'] = categoryBreakdown['LABOR'] || { category: 'LABOR', categoryLabel: 'Nhân công', amount: 0, count: 0 }
        categoryBreakdown['LABOR'].amount += laborCost
        
        const dailyCosts = {}
        expensesEntries.forEach(entry => {
            const date = entry.date
            if (!dailyCosts[date]) {
                dailyCosts[date] = {
                    date,
                    cost: 0,
                    revenue: 0
                }
            }
            dailyCosts[date].cost += entry.total || 0
        })
        
        revenueEntries.forEach(entry => {
            if (!dailyCosts[entry.date]) {
                dailyCosts[entry.date] = {
                    date: entry.date,
                    cost: 0,
                    revenue: 0
                }
            }
            dailyCosts[entry.date].revenue = entry.value
        })
        
        const totalOrders = toNumber(profitReport.totalOrders || 0)
        const costPerOrder = totalOrders > 0 
            ? totalCost / totalOrders 
            : 0
        
        const costRevenueRatio = totalRevenue > 0 
            ? (totalCost / totalRevenue) * 100 
            : 0
        
        const topCategories = Object.values(categoryBreakdown)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5)
        
        const recommendations = generateRecommendations({
            categoryBreakdown: Object.values(categoryBreakdown),
            topCategories,
            totalCost,
            totalRevenue,
            costRevenueRatio,
            costPerOrder
        })
        
        return {
            summary: {
                totalCost,
                totalRevenue,
                totalProfit,
                costRevenueRatio,
                costPerOrder,
                profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
            },
            categoryBreakdown: Object.values(categoryBreakdown).sort((a, b) => b.amount - a.amount),
            dailyCosts: Object.values(dailyCosts).sort((a, b) => a.date.localeCompare(b.date)),
            topCategories,
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
    
    if (data.costRevenueRatio > 80) {
        recommendations.push({
            type: 'high_cost_ratio',
            priority: 'high',
            message: `Tỷ lệ chi phí/doanh thu quá cao (${data.costRevenueRatio.toFixed(1)}%). Cần giảm chi phí ngay.`,
            impact: 'Ảnh hưởng nghiêm trọng đến lợi nhuận',
            action: 'Xem xét cắt giảm chi phí không cần thiết'
        })
    }
    
    if (data.topCategories && data.topCategories.length > 0) {
        const topCategory = data.topCategories[0]
        if (topCategory && data.totalCost > 0 && topCategory.amount > data.totalCost * 0.4) {
            recommendations.push({
                type: 'category_optimization',
                priority: 'medium',
                message: `${topCategory.categoryLabel} chiếm ${((topCategory.amount / data.totalCost) * 100).toFixed(1)}% tổng chi phí.`,
                impact: 'Cần tối ưu chi phí cho danh mục này',
                action: `Xem xét tối ưu ${topCategory.categoryLabel}`
            })
        }
    }
    
    if (data.costPerOrder > 100000) {
        recommendations.push({
            type: 'high_cost_per_order',
            priority: 'medium',
            message: `Chi phí trung bình mỗi đơn: ${data.costPerOrder.toLocaleString('vi-VN')} VNĐ.`,
            impact: 'Chi phí trên mỗi đơn hàng cao',
            action: 'Tối ưu quy trình để giảm chi phí'
        })
    }
    
    return recommendations
}

export const exportCostReport = async (costData) => {
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

