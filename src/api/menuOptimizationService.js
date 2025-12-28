import { buildApiError } from '@/utils/errorHandler'
import api from './axios'

const toNumber = (value) => {
    if (value === null || value === undefined) return 0
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
}

export const analyzeMenuOptimization = async ({ startDate, endDate } = {}) => {
    try {
        // Gọi backend API để lấy dữ liệu tối ưu menu
        const { data } = await api.get('/api/v1/reports/menu-optimization', {
            params: { startDate, endDate }
        })

        if (!data) {
            throw new Error('Không nhận được dữ liệu từ server')
        }

        // Chuẩn hóa response cho frontend
        return {
            products: (data.products || []).map(p => ({
                productId: p.productId,
                productName: p.productName,
                categoryId: p.categoryId,
                categoryName: p.categoryName,
                price: toNumber(p.price),
                cost: toNumber(p.cost),
                revenue: toNumber(p.revenue),
                quantity: p.quantity || 0,
                profit: toNumber(p.profit),
                margin: toNumber(p.margin),
                volumeScore: p.volumeScore || 0,
                marginScore: toNumber(p.marginScore),
                classification: p.classification,
                classificationLabel: p.classificationLabel,
                classificationColor: p.classificationColor,
                isAvailable: p.isAvailable !== false,
                imageUrl: p.imageUrl
            })),
            categoryPerformance: (data.categoryPerformance || []).map(cat => ({
                categoryId: cat.categoryId,
                categoryName: cat.categoryName,
                products: cat.products || [],
                totalRevenue: toNumber(cat.totalRevenue),
                totalProfit: toNumber(cat.totalProfit),
                totalQuantity: cat.totalQuantity || 0,
                avgMargin: toNumber(cat.avgMargin)
            })),
            classifications: {
                stars: (data.classifications?.stars || []).map(p => ({
                    productId: p.productId,
                    productName: p.productName,
                    classification: p.classification,
                    classificationLabel: p.classificationLabel,
                    classificationColor: p.classificationColor,
                    revenue: toNumber(p.revenue),
                    profit: toNumber(p.profit),
                    margin: toNumber(p.margin)
                })),
                cashCows: (data.classifications?.cashCows || []).map(p => ({
                    productId: p.productId,
                    productName: p.productName,
                    classification: p.classification,
                    classificationLabel: p.classificationLabel,
                    classificationColor: p.classificationColor,
                    revenue: toNumber(p.revenue),
                    profit: toNumber(p.profit),
                    margin: toNumber(p.margin)
                })),
                questionMarks: (data.classifications?.questionMarks || []).map(p => ({
                    productId: p.productId,
                    productName: p.productName,
                    classification: p.classification,
                    classificationLabel: p.classificationLabel,
                    classificationColor: p.classificationColor,
                    revenue: toNumber(p.revenue),
                    profit: toNumber(p.profit),
                    margin: toNumber(p.margin)
                })),
                dogs: (data.classifications?.dogs || []).map(p => ({
                    productId: p.productId,
                    productName: p.productName,
                    classification: p.classification,
                    classificationLabel: p.classificationLabel,
                    classificationColor: p.classificationColor,
                    revenue: toNumber(p.revenue),
                    profit: toNumber(p.profit),
                    margin: toNumber(p.margin)
                }))
            },
            recommendations: (data.recommendations || []).map(r => ({
                type: r.type,
                priority: r.priority,
                message: r.message,
                products: r.products || [],
                categories: r.categories || [],
                impact: r.impact
            })),
            summary: {
                totalProducts: data.summary?.totalProducts || 0,
                totalRevenue: toNumber(data.summary?.totalRevenue),
                totalProfit: toNumber(data.summary?.totalProfit),
                avgMargin: toNumber(data.summary?.avgMargin)
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

export const exportOptimizationReport = (optimizationData) => {
    const data = [
        ['BÁO CÁO TỐI ƯU MENU'],
        ['Thời gian:', `${optimizationData.period.startDate} - ${optimizationData.period.endDate}`],
        ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
        [],
        ['TỔNG QUAN'],
        ['Tổng số sản phẩm:', optimizationData.summary.totalProducts],
        ['Tổng doanh thu:', `${optimizationData.summary.totalRevenue.toLocaleString('vi-VN')} VNĐ`],
        ['Tổng lợi nhuận:', `${optimizationData.summary.totalProfit.toLocaleString('vi-VN')} VNĐ`],
        ['Margin trung bình:', `${optimizationData.summary.avgMargin.toFixed(2)}%`],
        [],
        ['PHÂN LOẠI SẢN PHẨM'],
        ['Loại', 'Số lượng', 'Tổng doanh thu', 'Tổng lợi nhuận']
    ]

    const classifications = [
        { name: 'Ngôi sao', products: optimizationData.classifications.stars },
        { name: 'Bò sữa', products: optimizationData.classifications.cashCows },
        { name: 'Dấu hỏi', products: optimizationData.classifications.questionMarks },
        { name: 'Chó', products: optimizationData.classifications.dogs }
    ]

    classifications.forEach(cls => {
        const revenue = cls.products.reduce((sum, p) => sum + p.revenue, 0)
        const profit = cls.products.reduce((sum, p) => sum + p.profit, 0)
        data.push([
            cls.name,
            cls.products.length,
            revenue.toLocaleString('vi-VN'),
            profit.toLocaleString('vi-VN')
        ])
    })

    data.push([])
    data.push(['CHI TIẾT SẢN PHẨM'])
    data.push(['Tên sản phẩm', 'Danh mục', 'Giá', 'Doanh thu', 'Số lượng', 'Lợi nhuận', 'Margin', 'Phân loại'])

    optimizationData.products.slice(0, 100).forEach(product => {
        data.push([
            product.productName,
            product.categoryName,
            product.price.toLocaleString('vi-VN'),
            product.revenue.toLocaleString('vi-VN'),
            product.quantity,
            product.profit.toLocaleString('vi-VN'),
            `${product.margin.toFixed(2)}%`,
            product.classificationLabel
        ])
    })

    return {
        data,
        sheetName: 'Tối ưu Menu',
        filename: `toi-uu-menu-${optimizationData.period.startDate}-${optimizationData.period.endDate}.xlsx`
    }
}
