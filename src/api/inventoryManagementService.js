import { buildApiError } from '@/utils/errorHandler'
import logger from '@/utils/logger'
import * as ingredientService from './ingredientService'
import * as reportService from './reportService'
import * as productService from './productService'
import * as orderService from './orderService'
import * as purchaseOrderService from './purchaseOrderService'

const toNumber = (value) => {
    if (value === null || value === undefined) return 0
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
}

const calculateConsumptionRate = async (ingredientId, days = 30) => {
    try {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const orders = await orderService.getOrdersByDateRange(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            0,
            1000
        )

        const ordersList = Array.isArray(orders) ? orders : (orders?.content || [])

        let totalConsumed = 0
        const productRecipes = new Map()

        for (const order of ordersList) {
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

                const ingredientInRecipe = recipe.ingredients.find(
                    ing => ing.ingredientId === ingredientId
                )

                if (ingredientInRecipe) {
                    const quantity = toNumber(detail.quantity)
                    const amount = toNumber(ingredientInRecipe.amount)
                    totalConsumed += quantity * amount
                }
            }
        }

        return totalConsumed / days
    } catch {
        return 0
    }
}

const getAlertStatus = (daysRemaining, reorderLevel, currentStock) => {
    if (daysRemaining <= 0 || currentStock <= 0) {
        return { status: 'CRITICAL', priority: 1, label: 'Hết hàng', color: 'danger' }
    }
    if (daysRemaining <= 2) {
        return { status: 'CRITICAL', priority: 1, label: 'Nguy cấp', color: 'danger' }
    }
    if (daysRemaining <= 5) {
        return { status: 'WARNING', priority: 2, label: 'Cảnh báo', color: 'warning' }
    }
    if (daysRemaining <= 10 || (reorderLevel && currentStock <= reorderLevel)) {
        return { status: 'INFO', priority: 3, label: 'Chú ý', color: 'info' }
    }
    return { status: 'STABLE', priority: 4, label: 'Ổn định', color: 'success' }
}

const calculateSuggestedQuantity = (consumptionRate, daysRemaining, leadTime = 7, safetyStock = 0) => {
    // Xử lý trường hợp daysRemaining là Infinity hoặc null
    if (!isFinite(daysRemaining) || daysRemaining === null) {
        return Math.max(safetyStock, 10) // Tối thiểu 10 đơn vị
    }

    const daysToOrder = Math.max(leadTime, daysRemaining - 2)
    const suggestedQuantity = (consumptionRate * daysToOrder) + safetyStock
    return Math.ceil(Math.max(suggestedQuantity, 1)) // Tối thiểu 1 đơn vị
}

export const analyzeInventory = async ({ includeStable = false } = {}) => {
    try {
        const [inventoryReport, ingredients] = await Promise.all([
            reportService.getInventoryReport(true),
            ingredientService.getAllIngredients()
        ])

        const ingredientsList = Array.isArray(ingredients)
            ? ingredients
            : (ingredients?.content || [])

        const inventoryItems = inventoryReport?.items || []
        const ingredientsMap = new Map(ingredientsList.map(ing => [ing.id, ing]))

        const analysis = await Promise.all(
            inventoryItems.map(async (item) => {
                const ingredient = ingredientsMap.get(item.id) || item
                const currentStock = toNumber(item.quantityOnHand)
                const reorderLevel = toNumber(item.reorderLevel) || 0

                const consumptionRate = await calculateConsumptionRate(item.id, 30)
                const hasConsumption = consumptionRate > 0
                const daysRemaining = hasConsumption
                    ? currentStock / consumptionRate
                    : null // null thay vì Infinity để dễ xử lý

                const alert = getAlertStatus(daysRemaining ?? Infinity, reorderLevel, currentStock)

                if (!includeStable && alert.status === 'STABLE') {
                    return null
                }

                const leadTime = 7
                const safetyStock = reorderLevel * 0.5

                // Nếu không có consumption rate, đề xuất dựa trên reorderLevel hoặc currentStock
                let suggestedQuantity
                let reason

                if (hasConsumption && daysRemaining !== null && isFinite(daysRemaining)) {
                    suggestedQuantity = calculateSuggestedQuantity(
                        consumptionRate,
                        daysRemaining,
                        leadTime,
                        safetyStock
                    )
                    reason = `Dự báo hết trong ${Math.round(daysRemaining)} ngày`
                } else {
                    // Không có dữ liệu tiêu thụ, đề xuất dựa trên reorderLevel hoặc currentStock
                    if (reorderLevel > 0) {
                        suggestedQuantity = Math.max(reorderLevel * 2, currentStock * 0.5)
                        reason = 'Không có dữ liệu tiêu thụ. Đề xuất dựa trên mức đặt lại hàng'
                    } else {
                        suggestedQuantity = Math.max(currentStock, 10) // Tối thiểu 10 đơn vị
                        reason = 'Không có dữ liệu tiêu thụ. Đề xuất dựa trên tồn kho hiện tại'
                    }
                }

                const lastPurchaseOrder = await getLastPurchaseOrderForIngredient(item.id)
                const suggestedSupplier = lastPurchaseOrder?.supplierId || null
                const estimatedCost = lastPurchaseOrder?.unitPrice && suggestedQuantity > 0
                    ? lastPurchaseOrder.unitPrice * suggestedQuantity
                    : null

                return {
                    ingredientId: item.id,
                    name: item.name || ingredient.name,
                    unit: item.unit || ingredient.unit,
                    currentStock,
                    reorderLevel,
                    consumptionRate: Math.round(consumptionRate * 100) / 100,
                    daysRemaining: daysRemaining !== null && isFinite(daysRemaining)
                        ? Math.round(daysRemaining * 10) / 10
                        : null,
                    alert,
                    suggestion: {
                        quantity: Math.ceil(suggestedQuantity),
                        supplierId: suggestedSupplier,
                        estimatedCost,
                        leadTime,
                        reason
                    },
                    lastPurchaseOrder: lastPurchaseOrder ? {
                        date: lastPurchaseOrder.date,
                        quantity: lastPurchaseOrder.quantity,
                        unitPrice: lastPurchaseOrder.unitPrice,
                        supplierId: lastPurchaseOrder.supplierId
                    } : null
                }
            })
        )

        const filtered = analysis.filter(Boolean)
        const critical = filtered.filter(item => item.alert.status === 'CRITICAL')
        const warning = filtered.filter(item => item.alert.status === 'WARNING')
        const info = filtered.filter(item => item.alert.status === 'INFO')
        const stable = filtered.filter(item => item.alert.status === 'STABLE')

        return {
            items: filtered.sort((a, b) => a.alert.priority - b.alert.priority),
            summary: {
                total: filtered.length,
                critical: critical.length,
                warning: warning.length,
                info: info.length,
                stable: stable.length
            },
            alerts: {
                critical,
                warning,
                info,
                stable
            },
            meta: {
                analyzedAt: new Date().toISOString(),
                totalIngredients: ingredientsList.length
            }
        }
    } catch (error) {
        throw buildApiError(error)
    }
}

const getLastPurchaseOrderForIngredient = async (ingredientId) => {
    try {
        const purchaseOrders = await purchaseOrderService.getPurchaseOrders({
            page: 0,
            size: 100,
            status: 'COMPLETED'
        })

        const ordersList = Array.isArray(purchaseOrders)
            ? purchaseOrders
            : (purchaseOrders?.content || [])

        for (const order of ordersList) {
            // Backend trả về Set<PurchaseOrderDetailResponseDTO> nên cần convert sang Array
            let details = order.purchaseOrderDetails || order.items || order.details || []

            // Nếu là Set, convert sang Array
            if (details instanceof Set) {
                details = Array.from(details)
            } else if (!Array.isArray(details)) {
                details = []
            }

            if (details.length === 0) continue

            const detail = details.find(
                d => d.ingredientId === ingredientId || d.ingredient?.id === ingredientId
            )

            if (detail) {
                return {
                    date: order.orderDate || order.createdAt,
                    quantity: toNumber(detail.quantity),
                    unitPrice: toNumber(detail.unitPrice),
                    supplierId: order.supplierId
                }
            }
        }

        return null
    } catch {
        return null
    }
}

export const getStockLevelHistory = async (ingredientId, days = 30, fallbackData = null) => {
    try {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const purchaseOrders = await purchaseOrderService.getPurchaseOrders({
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            page: 0,
            size: 1000
        })

        const ordersList = Array.isArray(purchaseOrders)
            ? purchaseOrders
            : (purchaseOrders?.content || [])

        const consumptionRate = await calculateConsumptionRate(ingredientId, days)

        // Try to get ingredient from API, fallback to provided data if available
        let ingredient = null
        let currentStock = 0
        let reorderLevel = 0

        try {
            ingredient = await ingredientService.getIngredientById(ingredientId)
            currentStock = toNumber(ingredient.quantityOnHand)
            reorderLevel = toNumber(ingredient.reorderLevel)
        } catch (ingredientError) {
            // If API call fails, try to use fallback data from analysisData
            if (fallbackData) {
                currentStock = toNumber(fallbackData.currentStock)
                reorderLevel = toNumber(fallbackData.reorderLevel || 0)
                // Ghi log cảnh báo nhưng tiếp tục với dữ liệu dự phòng
                logger.warn('[InventoryManagement] Sử dụng dữ liệu dự phòng cho nguyên liệu:', ingredientId, ingredientError)
            } else {
                // If no fallback data, throw the error
                throw ingredientError
            }
        }

        const history = []
        let stock = currentStock

        for (let i = days; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]

            const orderOnDate = ordersList.find(order => {
                const orderDate = new Date(order.orderDate || order.createdAt)
                    .toISOString()
                    .split('T')[0]
                return orderDate === dateStr
            })

            if (orderOnDate) {
                // Backend trả về Set<PurchaseOrderDetailResponseDTO> nên cần convert sang Array
                let details = orderOnDate.purchaseOrderDetails || orderOnDate.items || orderOnDate.details || []

                // Nếu là Set, convert sang Array
                if (details instanceof Set) {
                    details = Array.from(details)
                } else if (!Array.isArray(details)) {
                    details = []
                }

                const detail = details.find(
                    d => d.ingredientId === ingredientId || d.ingredient?.id === ingredientId
                )
                if (detail) {
                    stock += toNumber(detail.quantity)
                }
            }

            if (i < days) {
                stock -= consumptionRate
            }

            history.push({
                date: dateStr,
                stock: Math.max(0, Math.round(stock * 100) / 100),
                reorderLevel
            })
        }

        return history
    } catch (error) {
        throw buildApiError(error)
    }
}

export const createPurchaseOrderFromSuggestion = async (suggestion) => {
    try {
        const orderData = {
            supplierId: suggestion.supplierId,
            note: `Tự động tạo từ đề xuất: ${suggestion.reason}`,
            items: [{
                ingredientId: suggestion.ingredientId,
                quantity: suggestion.quantity,
                unitPrice: suggestion.estimatedCost / suggestion.quantity
            }]
        }

        return await purchaseOrderService.createPurchaseOrder(orderData)
    } catch (error) {
        throw buildApiError(error)
    }
}

export const getSuppliersForIngredient = async (ingredientId) => {
    try {
        const purchaseOrders = await purchaseOrderService.getPurchaseOrders({
            page: 0,
            size: 100,
            status: 'COMPLETED'
        })

        const ordersList = Array.isArray(purchaseOrders)
            ? purchaseOrders
            : (purchaseOrders?.content || [])

        const supplierMap = new Map()

        for (const order of ordersList) {
            // Backend trả về Set<PurchaseOrderDetailResponseDTO> nên cần convert sang Array
            let details = order.purchaseOrderDetails || order.items || order.details || []

            // Nếu là Set, convert sang Array
            if (details instanceof Set) {
                details = Array.from(details)
            } else if (!Array.isArray(details)) {
                details = []
            }

            if (details.length === 0) continue

            const detail = details.find(
                d => d.ingredientId === ingredientId || d.ingredient?.id === ingredientId
            )

            if (detail && order.supplierId) {
                const supplierId = order.supplierId

                if (!supplierMap.has(supplierId)) {
                    supplierMap.set(supplierId, {
                        supplierId,
                        supplierName: order.supplier?.name || order.supplierName || 'N/A',
                        lastOrderDate: order.orderDate || order.createdAt,
                        lastQuantity: toNumber(detail.quantity),
                        lastUnitPrice: toNumber(detail.unitPrice),
                        orderCount: 0
                    })
                }

                const supplier = supplierMap.get(supplierId)
                supplier.orderCount += 1
            }
        }

        return Array.from(supplierMap.values())
            .sort((a, b) => new Date(b.lastOrderDate) - new Date(a.lastOrderDate))
    } catch {
        return []
    }
}

