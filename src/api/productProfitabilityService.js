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
        // Call backend API instead of calculating locally
        const { data } = await api.get('/api/v1/reports/product-profitability', {
            params: { startDate, endDate }
        })

        if (!data) {
            throw new Error('Không nhận được dữ liệu từ server')
        }

        // Normalize response to match frontend expectations
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

// Keep the old implementation as fallback (commented out)
/*
export const analyzeProductProfitability_OLD = async ({ startDate, endDate } = {}) => {
    try {
        const [products, orders, bestSellers] = await Promise.all([
            productService.getProducts({ page: 0, size: 1000 }),
            orderService.getOrdersByDateRange(startDate, endDate, 0, 1000),
            reportService.getBestSellers(startDate, endDate, 1000)
        ])

        const productsList = Array.isArray(products) ? products : (products?.content || [])
        const ordersList = Array.isArray(orders) ? orders : (orders?.content || [])
        const bestSellersList = bestSellers?.items || []

        const productAnalytics = await Promise.all(
            productsList.map(async (product) => {
                const recipe = await productService.getProductRecipe(product.id).catch(() => null)
                const costPerUnit = await calculateProductCost(product, recipe)
                const price = toNumber(product.price) || 0

                const productOrders = ordersList.filter(order =>
                    order.orderDetails?.some(detail => detail.productId === product.id)
                )

                let totalRevenue = 0
                let totalCost = 0
                let totalQuantity = 0

                productOrders.forEach(order => {
                    order.orderDetails?.forEach(detail => {
                        if (detail.productId === product.id) {
                            const quantity = toNumber(detail.quantity) || 0
                            const detailPrice = toNumber(detail.price) || price
                            totalQuantity += quantity
                            totalRevenue += quantity * detailPrice
                            totalCost += quantity * costPerUnit
                        }
                    })
                })

                const profit = totalRevenue - totalCost
                const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

                const bestSellerData = bestSellersList.find(bs => bs.productId === product.id)
                const volumeRank = bestSellerData ? bestSellerData.rank : null

                return {
                    productId: product.id,
                    name: product.name,
                    categoryId: product.categoryId,
                    categoryName: product.category?.name || 'N/A',
                    price,
                    costPerUnit,
                    totalRevenue,
                    totalCost,
                    profit,
                    margin,
                    totalQuantity,
                    volumeRank,
                    status: product.available ? 'active' : 'inactive'
                }
            })
        )

        const avgMargin = productAnalytics.length > 0
            ? productAnalytics.reduce((sum, p) => sum + p.margin, 0) / productAnalytics.length
            : 0

        const avgVolume = productAnalytics.length > 0
            ? productAnalytics.reduce((sum, p) => sum + p.totalQuantity, 0) / productAnalytics.length
            : 0

        const classifiedProducts = productAnalytics.map(product => ({
            ...product,
            classification: classifyProduct(product.margin, product.totalQuantity, avgMargin, avgVolume)
        }))

        const categoryAnalysis = {}
        classifiedProducts.forEach(product => {
            const categoryId = product.categoryId || 'uncategorized'
            if (!categoryAnalysis[categoryId]) {
                categoryAnalysis[categoryId] = {
                    categoryId,
                    categoryName: product.categoryName,
                    totalRevenue: 0,
                    totalCost: 0,
                    totalProfit: 0,
                    totalQuantity: 0,
                    productCount: 0,
                    avgMargin: 0
                }
            }
            const cat = categoryAnalysis[categoryId]
            cat.totalRevenue += product.totalRevenue
            cat.totalCost += product.totalCost
            cat.totalProfit += product.profit
            cat.totalQuantity += product.totalQuantity
            cat.productCount += 1
        })

        Object.keys(categoryAnalysis).forEach(categoryId => {
            const cat = categoryAnalysis[categoryId]
            cat.avgMargin = cat.totalRevenue > 0 ? (cat.totalProfit / cat.totalRevenue) * 100 : 0
        })

        const topProfitable = classifiedProducts
            .sort((a, b) => b.profit - a.profit)
            .slice(0, 10)

        const lowMargin = classifiedProducts
            .filter(p => p.margin < 20 && p.totalQuantity > 0)
            .sort((a, b) => a.margin - b.margin)
            .slice(0, 10)

        return {
            products: classifiedProducts.sort((a, b) => b.profit - a.profit),
            categoryAnalysis: Object.values(categoryAnalysis),
            topProfitable,
            lowMargin,
            summary: {
                totalRevenue: classifiedProducts.reduce((sum, p) => sum + p.totalRevenue, 0),
                totalCost: classifiedProducts.reduce((sum, p) => sum + p.totalCost, 0),
                totalProfit: classifiedProducts.reduce((sum, p) => sum + p.profit, 0),
                avgMargin,
                avgVolume
            },
            period: { startDate, endDate },
            generatedAt: new Date().toISOString()
        }
    } catch (error) {
        throw buildApiError(error)
    }
}

export const getPricingSuggestions = async (productId, currentPrice, currentMargin, targetMargin = 30) => {
    try {
        const product = await productService.getProductById(productId)
        const recipe = await productService.getProductRecipe(productId).catch(() => null)
        const costPerUnit = await calculateProductCost(product, recipe)

        const suggestedPrice = costPerUnit > 0
            ? (costPerUnit / (1 - targetMargin / 100))
            : currentPrice * 1.1

        const currentProfit = currentPrice - costPerUnit
        const suggestedProfit = suggestedPrice - costPerUnit

        const impact = {
            priceChange: suggestedPrice - currentPrice,
            priceChangePercent: ((suggestedPrice - currentPrice) / currentPrice) * 100,
            marginChange: targetMargin - currentMargin,
            profitIncrease: suggestedProfit - currentProfit,
            profitIncreasePercent: currentProfit > 0 ? ((suggestedProfit - currentProfit) / currentProfit) * 100 : 0
        }

        return {
            productId,
            currentPrice,
            currentMargin,
            costPerUnit,
            suggestedPrice,
            targetMargin,
            impact
        }
    } catch (error) {
        throw buildApiError(error)
    }
}

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
            `${product.margin.toFixed(2)  }%`,
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

