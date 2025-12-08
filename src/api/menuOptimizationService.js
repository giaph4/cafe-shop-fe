import { buildApiError } from '@/utils/errorHandler'
import * as productService from './productService'
import * as reportService from './reportService'

const toNumber = (value) => {
    if (value === null || value === undefined) return 0
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
}

const calculateProfitMargin = (revenue, cost) => {
    if (revenue === 0) return 0
    return ((revenue - cost) / revenue) * 100
}

const classifyProduct = (volume, margin) => {
    const volumeThreshold = 50
    const marginThreshold = 30
    
    if (volume >= volumeThreshold && margin >= marginThreshold) {
        return 'STAR'
    } else if (volume < volumeThreshold && margin >= marginThreshold) {
        return 'CASH_COW'
    } else if (volume >= volumeThreshold && margin < marginThreshold) {
        return 'QUESTION_MARK'
    } else {
        return 'DOG'
    }
}

const getClassificationLabel = (classification) => {
    const labels = {
        'STAR': 'Ngôi sao',
        'CASH_COW': 'Bò sữa',
        'QUESTION_MARK': 'Dấu hỏi',
        'DOG': 'Chó'
    }
    return labels[classification] || classification
}

const getClassificationColor = (classification) => {
    const colors = {
        'STAR': 'success',
        'CASH_COW': 'info',
        'QUESTION_MARK': 'warning',
        'DOG': 'danger'
    }
    return colors[classification] || 'neutral'
}

export const analyzeMenuOptimization = async ({ startDate, endDate } = {}) => {
    try {
        const [products, bestSellers, categorySales, productSummary, profitReport] = await Promise.all([
            productService.getProducts({ page: 0, size: 1000 }).catch(() => ({ content: [] })),
            reportService.getBestSellers(startDate, endDate, 100).catch(() => ({ items: [] })),
            reportService.getCategorySales(startDate, endDate).catch(() => []),
            reportService.getProductSalesSummary(startDate, endDate).catch(() => ({ items: [] })),
            reportService.getProfitReport(startDate, endDate).catch(() => ({ totalProfit: 0, totalRevenue: 0, totalCostOfGoodsSold: 0 }))
        ])
        
        const productsList = Array.isArray(products) ? products : (products?.content || [])
        const bestSellersList = Array.isArray(bestSellers) ? bestSellers : (bestSellers?.items || [])
        const categoryList = Array.isArray(categorySales) ? categorySales : (categorySales?.items || [])
        const summaryList = Array.isArray(productSummary) ? productSummary : (productSummary?.items || [])
        
        const productMetrics = await Promise.all(
            productsList.map(async (product) => {
                const bestSeller = bestSellersList.find(bs => bs.productId === product.id || bs.id === product.id)
                const summary = summaryList.find(s => s.productId === product.id || s.id === product.id)
                
                let cost = 0
                try {
                    const recipe = await productService.getProductRecipe(product.id).catch(() => null)
                    if (recipe && recipe.ingredients) {
                        cost = recipe.ingredients.reduce((sum, ing) => {
                            return sum + (toNumber(ing.amount) * toNumber(ing.unitPrice || 0))
                        }, 0)
                    }
                } catch {
                    cost = toNumber(product.cost || product.unitCost || 0)
                }
                
                const revenue = toNumber(bestSeller?.totalRevenueGenerated || summary?.totalRevenue || 0)
                const quantity = toNumber(bestSeller?.totalQuantitySold || summary?.totalQuantity || 0)
                const avgPrice = toNumber(product.price || product.unitPrice || 0)
                const totalCost = cost * quantity
                const profit = revenue - totalCost
                const margin = calculateProfitMargin(revenue, totalCost)
                
                const volumeScore = quantity
                const marginScore = margin
                
                const classification = classifyProduct(volumeScore, marginScore)
                
                return {
                    productId: product.id,
                    productName: product.name,
                    categoryId: product.categoryId || product.category?.id,
                    categoryName: product.categoryName || product.category?.name || 'Khác',
                    price: avgPrice,
                    cost,
                    revenue,
                    quantity,
                    profit,
                    margin,
                    volumeScore,
                    marginScore,
                    classification,
                    classificationLabel: getClassificationLabel(classification),
                    classificationColor: getClassificationColor(classification),
                    isAvailable: product.isAvailable !== false,
                    imageUrl: product.imageUrl || product.image
                }
            })
        )
        
        const categoryPerformance = {}
        productMetrics.forEach(product => {
            const catId = product.categoryId || 'other'
            const catName = product.categoryName || 'Khác'
            
            if (!categoryPerformance[catId]) {
                categoryPerformance[catId] = {
                    categoryId: catId,
                    categoryName: catName,
                    products: [],
                    totalRevenue: 0,
                    totalProfit: 0,
                    totalQuantity: 0,
                    avgMargin: 0
                }
            }
            
            categoryPerformance[catId].products.push(product)
            categoryPerformance[catId].totalRevenue += product.revenue
            categoryPerformance[catId].totalProfit += product.profit
            categoryPerformance[catId].totalQuantity += product.quantity
        })
        
        Object.keys(categoryPerformance).forEach(catId => {
            const cat = categoryPerformance[catId]
            const totalCost = cat.products.reduce((sum, p) => sum + (p.cost * p.quantity), 0)
            cat.avgMargin = calculateProfitMargin(cat.totalRevenue, totalCost)
        })
        
        const recommendations = generateRecommendations(productMetrics, categoryPerformance)
        
        const stars = productMetrics.filter(p => p.classification === 'STAR')
        const cashCows = productMetrics.filter(p => p.classification === 'CASH_COW')
        const questionMarks = productMetrics.filter(p => p.classification === 'QUESTION_MARK')
        const dogs = productMetrics.filter(p => p.classification === 'DOG')
        
        return {
            products: productMetrics.sort((a, b) => b.revenue - a.revenue),
            categoryPerformance: Object.values(categoryPerformance).sort((a, b) => b.totalRevenue - a.totalRevenue),
            classifications: {
                stars,
                cashCows,
                questionMarks,
                dogs
            },
            recommendations,
            summary: {
                totalProducts: productMetrics.length,
                totalRevenue: productMetrics.reduce((sum, p) => sum + p.revenue, 0),
                totalProfit: productMetrics.reduce((sum, p) => sum + p.profit, 0),
                avgMargin: productMetrics.length > 0
                    ? productMetrics.reduce((sum, p) => sum + p.margin, 0) / productMetrics.length
                    : 0
            },
            period: { startDate, endDate },
            generatedAt: new Date().toISOString()
        }
    } catch (error) {
        throw buildApiError(error)
    }
}

const generateRecommendations = (products, categoryPerformance) => {
    const recommendations = []
    
    const stars = products.filter(p => p.classification === 'STAR')
    if (stars.length > 0) {
        recommendations.push({
            type: 'promote',
            priority: 'high',
            message: `${stars.length} sản phẩm "Ngôi sao" nên được quảng bá và tăng inventory`,
            products: stars.slice(0, 5).map(p => p.productId),
            impact: 'Tăng doanh thu và lợi nhuận'
        })
    }
    
    const dogs = products.filter(p => p.classification === 'DOG')
    if (dogs.length > 0) {
        recommendations.push({
            type: 'discontinue',
            priority: 'medium',
            message: `${dogs.length} sản phẩm "Chó" nên được xem xét ngừng bán hoặc tối ưu`,
            products: dogs.slice(0, 5).map(p => p.productId),
            impact: 'Giảm waste và tập trung vào sản phẩm profitable'
        })
    }
    
    const questionMarks = products.filter(p => p.classification === 'QUESTION_MARK')
    if (questionMarks.length > 0) {
        recommendations.push({
            type: 'optimize',
            priority: 'high',
            message: `${questionMarks.length} sản phẩm "Dấu hỏi" cần tối ưu giá hoặc chi phí`,
            products: questionMarks.slice(0, 5).map(p => p.productId),
            impact: 'Cải thiện profit margin'
        })
    }
    
    const lowMarginCategories = Object.values(categoryPerformance)
        .filter(cat => cat.avgMargin < 20)
        .sort((a, b) => a.avgMargin - b.avgMargin)
    
    if (lowMarginCategories.length > 0) {
        recommendations.push({
            type: 'category_review',
            priority: 'medium',
            message: `${lowMarginCategories.length} danh mục có margin thấp cần được xem xét`,
            categories: lowMarginCategories.slice(0, 3).map(cat => cat.categoryId),
            impact: 'Tối ưu product mix theo danh mục'
        })
    }
    
    return recommendations
}

export const exportOptimizationReport = async (optimizationData) => {
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

