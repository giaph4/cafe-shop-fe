import { buildApiError } from '@/utils/errorHandler'
import api from './axios'

const toNumber = (value) => {
    if (value === null || value === undefined) return 0
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
}

const calculateProductCost = async (product, recipe) => {
    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
        return toNumber(product.cost) || 0
    }

    let totalCost = 0
    try {
        const allIngredients = await ingredientService.getAllIngredients()
        const ingredientsMap = new Map(
            (Array.isArray(allIngredients) ? allIngredients : []).map(ing => [ing.id, ing])
        )

        for (const ingredient of recipe.ingredients) {
            const ingredientData = ingredientsMap.get(ingredient.ingredientId)
            if (ingredientData) {
                const unitPrice = toNumber(ingredientData.unitPrice) || 0
                const amount = toNumber(ingredient.amount) || 0
                totalCost += unitPrice * amount
            }
        }
    } catch {
        // Fallback to product cost if recipe calculation fails
    }

    return totalCost > 0 ? totalCost : (toNumber(product.cost) || 0)
}

const classifyProduct = (margin, volume, avgMargin, avgVolume) => {
    const isHighMargin = margin >= avgMargin
    const isHighVolume = volume >= avgVolume

    if (isHighMargin && isHighVolume) return 'Star'
    if (isHighMargin && !isHighVolume) return 'Cash Cow'
    if (!isHighMargin && isHighVolume) return 'Question Mark'
    return 'Dog'
}

export const analyzeProductProfitability = async ({ startDate, endDate } = {}) => {
    try {
        // Gọi backend API để lấy dữ liệu phân tích lợi nhuận sản phẩm
        const { data } = await api.get('/api/v1/reports/product-profitability', {
            params: { startDate, endDate }
        })

        if (!data) {
            throw new Error('Không nhận được dữ liệu từ server')
        }

        // Chuẩn hóa response cho frontend
        return {
            products: (data.products || []).map(p => ({
                productId: p.productId,
                name: p.name,
                categoryId: p.categoryId,
                categoryName: p.categoryName,
                price: toNumber(p.price),
                costPerUnit: toNumber(p.costPerUnit),
                totalRevenue: toNumber(p.totalRevenue),
                totalCost: toNumber(p.totalCost),
                profit: toNumber(p.profit),
                margin: toNumber(p.margin),
                totalQuantity: p.totalQuantity || 0,
                volumeRank: p.volumeRank,
                status: p.status,
                classification: p.classification
            })),
            categoryAnalysis: (data.categoryAnalysis || []).map(cat => ({
                categoryId: cat.categoryId,
                categoryName: cat.categoryName,
                totalRevenue: toNumber(cat.totalRevenue),
                totalCost: toNumber(cat.totalCost),
                totalProfit: toNumber(cat.totalProfit),
                totalQuantity: cat.totalQuantity || 0,
                productCount: cat.productCount || 0,
                avgMargin: toNumber(cat.avgMargin)
            })),
            topProfitable: (data.topProfitable || []).map(p => ({
                productId: p.productId,
                name: p.name,
                profit: toNumber(p.profit),
                margin: toNumber(p.margin),
                totalRevenue: toNumber(p.totalRevenue)
            })),
            lowMargin: (data.lowMargin || []).map(p => ({
                productId: p.productId,
                name: p.name,
                profit: toNumber(p.profit),
                margin: toNumber(p.margin),
                totalRevenue: toNumber(p.totalRevenue)
            })),
            summary: {
                totalRevenue: toNumber(data.summary?.totalRevenue),
                totalCost: toNumber(data.summary?.totalCost),
                totalProfit: toNumber(data.summary?.totalProfit),
                avgMargin: toNumber(data.summary?.avgMargin),
                avgVolume: toNumber(data.summary?.avgVolume)
            },
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

/**
 * Xuất báo cáo phân tích lợi nhuận sản phẩm
 * @param {Object} analyticsData - Dữ liệu phân tích
 * @returns {Object} Dữ liệu xuất báo cáo
 */
export const exportProfitabilityReport = (analyticsData) => {
    const data = [
        ['BÁO CÁO PHÂN TÍCH LỢI NHUẬN SẢN PHẨM'],
        ['Thời gian:', `${analyticsData.period.startDate} - ${analyticsData.period.endDate}`],
        ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
        [],
        ['Tên sản phẩm', 'Danh mục', 'Giá', 'Chi phí', 'Doanh thu', 'Chi phí tổng', 'Lợi nhuận', 'Margin %', 'Số lượng', 'Phân loại']
    ]

    analyticsData.products.forEach(product => {
        data.push([
            product.name,
            product.categoryName,
            product.price.toLocaleString('vi-VN'),
            product.costPerUnit.toLocaleString('vi-VN'),
            product.totalRevenue.toLocaleString('vi-VN'),
            product.totalCost.toLocaleString('vi-VN'),
            product.profit.toLocaleString('vi-VN'),
            `${product.margin.toFixed(2)}%`,
            product.totalQuantity,
            product.classification
        ])
    })

    return {
        data,
        sheetName: 'Phân tích lợi nhuận',
        filename: `phan-tich-loi-nhuan-${analyticsData.period.startDate}-${analyticsData.period.endDate}.xlsx`
    }
}
