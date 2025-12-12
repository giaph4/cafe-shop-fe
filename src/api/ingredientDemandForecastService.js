import { buildApiError } from '@/utils/errorHandler'
import * as orderService from './orderService'
import * as productService from './productService'
import * as ingredientService from './ingredientService'
import * as reportService from './reportService'

const toNumber = (value) => {
    if (value === null || value === undefined) return 0
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
}

const calculateConsumption = async (orders, days) => {
    const consumptionMap = new Map()
    const productRecipes = new Map()

    for (const order of orders) {
        if (!order.orderDetails || order.orderDetails.length === 0) continue

        for (const detail of order.orderDetails) {
            if (!detail.productId) continue

            let recipe = productRecipes.get(detail.productId)
            if (!recipe) {
                try {
                    recipe = await productService.getProductRecipe(detail.productId)
                    productRecipes.set(detail.productId, recipe)
                } catch {
                    continue
                }
            }

            if (!recipe || !recipe.ingredients) continue

            const quantity = toNumber(detail.quantity)

            recipe.ingredients.forEach(ing => {
                const ingredientId = ing.ingredientId
                const amount = toNumber(ing.amount)
                const consumed = quantity * amount

                if (!consumptionMap.has(ingredientId)) {
                    consumptionMap.set(ingredientId, {
                        totalConsumed: 0,
                        dailyConsumption: [],
                        productUsage: new Map()
                    })
                }

                const data = consumptionMap.get(ingredientId)
                data.totalConsumed += consumed

                const orderDate = new Date(order.createdAt || order.orderDate)
                const dateKey = orderDate.toISOString().split('T')[0]

                if (!data.dailyConsumption.find(d => d.date === dateKey)) {
                    data.dailyConsumption.push({ date: dateKey, consumed: 0 })
                }
                const dailyData = data.dailyConsumption.find(d => d.date === dateKey)
                dailyData.consumed += consumed

                const productUsage = data.productUsage.get(detail.productId) || 0
                data.productUsage.set(detail.productId, productUsage + consumed)
            })
        }
    }

    const result = []
    for (const [ingredientId, data] of consumptionMap.entries()) {
        const avgDailyConsumption = days > 0 ? data.totalConsumed / days : 0
        result.push({
            ingredientId,
            totalConsumed: data.totalConsumed,
            avgDailyConsumption,
            dailyConsumption: data.dailyConsumption.sort((a, b) => a.date.localeCompare(b.date)),
            productUsage: Array.from(data.productUsage.entries()).map(([productId, amount]) => ({
                productId,
                amount
            }))
        })
    }

    return result
}

const forecastDemand = (consumptionData, _forecastDays) => {
    const forecasts = []

    consumptionData.forEach(data => {
        const dailyData = data.dailyConsumption
        if (dailyData.length === 0) {
            forecasts.push({
                ingredientId: data.ingredientId,
                forecast7d: data.avgDailyConsumption * 7,
                forecast30d: data.avgDailyConsumption * 30,
                confidence: 0.5
            })
            return
        }

        const recentDays = dailyData.slice(-7)
        const recentAvg = recentDays.reduce((sum, d) => sum + d.consumed, 0) / recentDays.length

        const trend = dailyData.length >= 2
            ? (dailyData[dailyData.length - 1].consumed - dailyData[0].consumed) / dailyData.length
            : 0

        const forecast7d = recentAvg * 7 + (trend * 7)
        const forecast30d = recentAvg * 30 + (trend * 30)

        const variance = dailyData.length > 1
            ? dailyData.reduce((sum, d) => {
                const diff = d.consumed - recentAvg
                return sum + (diff * diff)
            }, 0) / dailyData.length
            : 0

        const confidence = variance > 0 ? Math.max(0.5, 1 - (variance / (recentAvg * recentAvg + 1))) : 0.7

        forecasts.push({
            ingredientId: data.ingredientId,
            forecast7d: Math.max(0, forecast7d),
            forecast30d: Math.max(0, forecast30d),
            confidence: Math.min(1, confidence),
            trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable'
        })
    })

    return forecasts
}

export const analyzeIngredientDemand = async ({ startDate, endDate, forecastDays = 30 } = {}) => {
    try {
        const [orders, ingredients, inventoryReport] = await Promise.all([
            orderService.getOrdersByDateRange(startDate, endDate, 0, 1000),
            ingredientService.getAllIngredients(),
            reportService.getInventoryReport(true)
        ])

        const ordersList = Array.isArray(orders) ? orders : (orders?.content || [])
        const ingredientsList = Array.isArray(ingredients) ? ingredients : (ingredients?.content || [])
        const inventoryItems = inventoryReport?.items || []

        const start = new Date(startDate)
        const end = new Date(endDate)
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1

        const consumptionData = await calculateConsumption(ordersList, days)
        const forecasts = forecastDemand(consumptionData, forecastDays)

        // ingredientsMap reserved for future cross-reference (not used currently)
        // const ingredientsMap = new Map(ingredientsList.map(ing => [ing.id, ing]))
        const inventoryMap = new Map(inventoryItems.map(item => [item.id, item]))

        const analysis = ingredientsList.map(ingredient => {
            const consumption = consumptionData.find(c => c.ingredientId === ingredient.id)
            const forecast = forecasts.find(f => f.ingredientId === ingredient.id)
            const inventory = inventoryMap.get(ingredient.id)

            const currentStock = toNumber(inventory?.quantityOnHand) || 0
            const reorderLevel = toNumber(ingredient.reorderLevel) || 0
            const avgDailyConsumption = consumption?.avgDailyConsumption || 0
            const forecast7d = forecast?.forecast7d || 0
            const forecast30d = forecast?.forecast30d || 0

            const daysRemaining = avgDailyConsumption > 0
                ? currentStock / avgDailyConsumption
                : Infinity

            const daysRemaining7d = forecast7d > 0
                ? currentStock / (forecast7d / 7)
                : Infinity

            let status = 'stable'
            let alertLevel = 'info'

            if (currentStock <= reorderLevel) {
                status = 'critical'
                alertLevel = 'danger'
            } else if (daysRemaining7d <= 7) {
                status = 'warning'
                alertLevel = 'warning'
            } else if (daysRemaining7d <= 14) {
                status = 'attention'
                alertLevel = 'info'
            }

            const suggestedOrder = Math.max(0, forecast30d - currentStock + (reorderLevel * 2))

            return {
                ingredientId: ingredient.id,
                name: ingredient.name,
                unit: ingredient.unit,
                currentStock,
                reorderLevel,
                avgDailyConsumption,
                forecast7d,
                forecast30d,
                daysRemaining: daysRemaining === Infinity ? null : Math.floor(daysRemaining),
                daysRemaining7d: daysRemaining7d === Infinity ? null : Math.floor(daysRemaining7d),
                status,
                alertLevel,
                suggestedOrder: Math.ceil(suggestedOrder),
                confidence: forecast?.confidence || 0.5,
                trend: forecast?.trend || 'stable',
                consumptionHistory: consumption?.dailyConsumption || [],
                productUsage: consumption?.productUsage || []
            }
        })

        const critical = analysis.filter(a => a.status === 'critical')
        const warning = analysis.filter(a => a.status === 'warning')
        const attention = analysis.filter(a => a.status === 'attention')

        return {
            ingredients: analysis.sort((a, b) => {
                const priority = { critical: 3, warning: 2, attention: 1, stable: 0 }
                return priority[b.status] - priority[a.status]
            }),
            critical,
            warning,
            attention,
            summary: {
                totalIngredients: analysis.length,
                criticalCount: critical.length,
                warningCount: warning.length,
                attentionCount: attention.count
            },
            period: { startDate, endDate, forecastDays },
            generatedAt: new Date().toISOString()
        }
    } catch (error) {
        throw buildApiError(error)
    }
}

export const exportForecastReport = (forecastData) => {
    const data = [
        ['BÁO CÁO DỰ BÁO NHU CẦU NGUYÊN LIỆU'],
        ['Thời gian phân tích:', `${forecastData.period.startDate} - ${forecastData.period.endDate}`],
        ['Dự báo:', `${forecastData.period.forecastDays} ngày`],
        ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
        [],
        ['Tên nguyên liệu', 'Đơn vị', 'Tồn kho', 'Mức đặt lại', 'Tiêu thụ TB/ngày', 'Dự báo 7 ngày', 'Dự báo 30 ngày', 'Số ngày còn lại', 'Trạng thái', 'Đề xuất đặt hàng']
    ]

    forecastData.ingredients.forEach(ing => {
        data.push([
            ing.name,
            ing.unit,
            ing.currentStock,
            ing.reorderLevel,
            ing.avgDailyConsumption.toFixed(2),
            ing.forecast7d.toFixed(2),
            ing.forecast30d.toFixed(2),
            ing.daysRemaining || 'N/A',
            ing.status,
            ing.suggestedOrder
        ])
    })

    return {
        data,
        sheetName: 'Dự báo nhu cầu',
        filename: `du-bao-nguyen-lieu-${forecastData.period.startDate}-${forecastData.period.endDate}.xlsx`
    }
}

