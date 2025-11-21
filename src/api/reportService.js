import api from './axios'

const toNumber = (value) => {
    if (value === null || value === undefined) return 0
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
}

const buildMeta = (metadata = {}) => ({
    fetchedAt: new Date().toISOString(),
    ...metadata
})

const byDate = (a, b) => a.localeCompare(b)

const PAYMENT_METHOD_LABELS = Object.freeze({
    CASH: 'Tiền mặt',
    CREDIT_CARD: 'Thẻ tín dụng',
    DEBIT_CARD: 'Thẻ ghi nợ',
    BANK_TRANSFER: 'Chuyển khoản',
    E_WALLET: 'Ví điện tử',
    QRIS: 'Thanh toán QR',
    OTHER: 'Khác'
})

const ORDER_TYPE_LABELS = Object.freeze({
    POS: 'Tại quầy',
    DELIVERY: 'Giao hàng',
    TAKE_AWAY: 'Mang đi',
    ONLINE: 'Online'
})

export const REPORT_ENUMS = Object.freeze({
    paymentMethodLabels: PAYMENT_METHOD_LABELS,
    orderTypeLabels: ORDER_TYPE_LABELS
})

// 14.1. Dashboard Statistics
export const getDashboardStats = async () => {
    const {data} = await api.get('/api/v1/reports/dashboard')
    if (!data) return null

    const numericKeys = [
        'todayRevenue',
        'monthRevenue',
        'yearRevenue',
        'todayOrders',
        'monthOrders',
        'yearOrders',
        'totalCustomers',
        'totalProducts',
        'lowStockItems',
        'averageOrderValue',
        'todayProfit',
        'monthProfit'
    ]

    const normalized = numericKeys.reduce((acc, key) => {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            acc[key] = toNumber(data[key])
        }
        return acc
    }, {...data})

    return {
        ...normalized,
        meta: buildMeta({ source: 'ReportController#getDashboardStats' })
    }
}

// 14.2. Doanh thu theo ngày
export const getDailyRevenue = async (date) => {
    const {data} = await api.get('/api/v1/reports/daily-revenue', {
        params: {date}
    })
    return {
        date: data?.date ?? date,
        totalRevenue: toNumber(data?.totalRevenue),
        meta: buildMeta({ date })
    }
}

// 14.3. Báo cáo tồn kho
export const getInventoryReport = async (lowStock = false) => {
    const {data} = await api.get('/api/v1/reports/inventory', {
        params: {lowStock}
    })

    const items = (Array.isArray(data) ? data : []).map((item) => {
        const quantityOnHand = toNumber(item.quantityOnHand)
        const reorderLevel = item.reorderLevel !== null && item.reorderLevel !== undefined
            ? toNumber(item.reorderLevel)
            : null
        const status = reorderLevel !== null && quantityOnHand <= reorderLevel ? 'LOW_STOCK' : 'STABLE'
        return {
            ...item,
            quantityOnHand,
            reorderLevel,
            status
        }
    })

    const summary = {
        totalItems: items.length,
        lowStockCount: items.filter((item) => item.status === 'LOW_STOCK').length,
        totalQuantity: items.reduce((sum, item) => sum + toNumber(item.quantityOnHand), 0)
    }

    return {
        items,
        summary,
        meta: buildMeta({ lowStock, source: 'ReportController#getInventoryReport' })
    }
}

// 14.4. Xuất báo cáo orders ra Excel
export const exportOrdersToExcel = async (startDate, endDate) => {
    const response = await api.get('/api/v1/reports/orders/export', {
        params: {startDate, endDate},
        responseType: 'blob'
    })
    return response.data
}

// 14.5. Báo cáo lợi nhuận
export const getProfitReport = async (startDate, endDate) => {
    const {data} = await api.get('/api/v1/reports/profit', {
        params: {startDate, endDate}
    })

    const totalRevenue = toNumber(data?.totalRevenue)
    const totalCostOfGoodsSold = toNumber(data?.totalCostOfGoodsSold)
    const totalProfit = toNumber(data?.totalProfit)

    return {
        startDate,
        endDate,
        totalRevenue,
        totalCostOfGoodsSold,
        totalProfit,
        grossMargin: totalRevenue > 0 ? totalProfit / totalRevenue : 0,
        meta: buildMeta({ startDate, endDate, source: 'ReportController#getProfitReport' })
    }
}

// 14.6. Top sản phẩm bán chạy
export const getBestSellers = async (startDate, endDate, top = 10, sortBy = 'quantity') => {
    const {data} = await api.get('/api/v1/reports/best-sellers', {
        params: {startDate, endDate, top, sortBy}
    })

    const items = (Array.isArray(data) ? data : []).map((item, index) => {
        const totalQuantitySold = toNumber(item.totalQuantitySold)
        const totalRevenueGenerated = toNumber(item.totalRevenueGenerated)
        return {
            rank: index + 1,
            ...item,
            totalQuantitySold,
            totalRevenueGenerated
        }
    })

    const totals = {
        totalQuantity: items.reduce((sum, item) => sum + item.totalQuantitySold, 0),
        totalRevenue: items.reduce((sum, item) => sum + item.totalRevenueGenerated, 0)
    }

    return {
        items,
        totals,
        meta: buildMeta({ startDate, endDate, top, sortBy })
    }
}

// 14.7. Doanh thu theo khoảng thời gian
export const getRevenueByDate = async (startDate, endDate) => {
    const {data} = await api.get('/api/v1/reports/revenue-by-date', {
        params: {startDate, endDate}
    })

    const entries = Object.entries(data ?? {})
        .map(([dateKey, value]) => ({ date: dateKey, value: toNumber(value) }))
        .sort((a, b) => byDate(a.date, b.date))

    const labels = entries.map((entry) => entry.date)
    const values = entries.map((entry) => entry.value)
    const total = values.reduce((sum, value) => sum + value, 0)
    const max = values.length ? Math.max(...values) : 0
    const average = values.length ? total / values.length : 0

    return {
        entries,
        labels,
        values,
        summary: {
            total,
            average,
            max
        },
        meta: buildMeta({ startDate, endDate })
    }
}

// 14.8. Chi phí theo khoảng thời gian
export const getExpensesByDate = async (startDate, endDate) => {
    const {data} = await api.get('/api/v1/reports/expenses-by-date', {
        params: {startDate, endDate}
    })

    const entries = Object.entries(data ?? {})
        .map(([dateKey, categoryMap]) => {
            const categories = Object.entries(categoryMap ?? {})
                .map(([category, amount]) => ({
                    category,
                    amount: toNumber(amount)
                }))
                .sort((a, b) => b.amount - a.amount)
            const total = categories.reduce((sum, item) => sum + item.amount, 0)
            return {
                date: dateKey,
                categories,
                total
            }
        })
        .sort((a, b) => byDate(a.date, b.date))

    const totals = {
        overall: entries.reduce((sum, entry) => sum + entry.total, 0)
    }

    return {
        entries,
        totals,
        meta: buildMeta({ startDate, endDate })
    }
}

// 14.8b. Tổng chi phí
export const getTotalExpenses = async (startDate, endDate) => {
    const {data} = await api.get('/api/v1/reports/total-expenses', {
        params: {startDate, endDate}
    })

    return {
        startDate: data?.startDate ?? startDate ?? null,
        endDate: data?.endDate ?? endDate ?? null,
        totalExpenses: toNumber(data?.totalExpenses),
        meta: buildMeta({ startDate, endDate })
    }
}

// 14.8c. Chi phí nhập nguyên liệu
export const getTotalImportedIngredientCost = async (startDate, endDate) => {
    const {data} = await api.get('/api/v1/reports/total-imported-ingredients', {
        params: {startDate, endDate}
    })

    return {
        startDate: data?.startDate ?? startDate ?? null,
        endDate: data?.endDate ?? endDate ?? null,
        totalImportedIngredientCost: toNumber(data?.totalImportedIngredientCost),
        meta: buildMeta({ startDate, endDate })
    }
}

// 14.9. Top khách hàng
export const getTopCustomers = async (startDate, endDate, top = 10) => {
    const {data} = await api.get('/api/v1/reports/top-customers', {
        params: {startDate, endDate, top}
    })

    const items = (Array.isArray(data) ? data : []).map((item, index) => ({
        rank: index + 1,
        ...item,
        totalOrders: toNumber(item.totalOrders),
        totalSpent: toNumber(item.totalSpent),
        averageOrderValue: toNumber(item.averageOrderValue)
    }))

    return {
        items,
        meta: buildMeta({ startDate, endDate, top })
    }
}

// 14.10. Hiệu suất nhân viên
export const getStaffPerformance = async (startDate, endDate, top = 10) => {
    const {data} = await api.get('/api/v1/reports/staff-performance', {
        params: {startDate, endDate, top}
    })

    const items = (Array.isArray(data) ? data : []).map((item, index) => ({
        rank: index + 1,
        ...item,
        totalOrders: toNumber(item.totalOrders),
        totalRevenue: toNumber(item.totalRevenue),
        averageOrderValue: toNumber(item.averageOrderValue)
    }))

    return {
        items,
        meta: buildMeta({ startDate, endDate, top })
    }
}

// 14.11. Doanh số theo danh mục
export const getCategorySales = async (startDate, endDate) => {
    const {data} = await api.get('/api/v1/reports/category-sales', {
        params: {startDate, endDate}
    })

    const items = (Array.isArray(data) ? data : []).map((item) => {
        const totalQuantitySold = toNumber(item.totalQuantitySold)
        const totalRevenue = toNumber(item.totalRevenue)
        return {
            ...item,
            totalQuantitySold,
            totalRevenue,
            totalQuantity: totalQuantitySold // alias for backward compatibility
        }
    })

    const totals = {
        totalQuantity: items.reduce((sum, item) => sum + item.totalQuantitySold, 0),
        totalRevenue: items.reduce((sum, item) => sum + item.totalRevenue, 0)
    }

    return {
        items,
        totals,
        meta: buildMeta({ startDate, endDate })
    }
}

// 14.12. Phân tích bán hàng theo giờ
export const getHourlySales = async (date) => {
    const {data} = await api.get('/api/v1/reports/hourly-sales', {
        params: {date}
    })

    const items = (Array.isArray(data) ? data : []).map((item) => ({
        ...item,
        orderCount: toNumber(item.orderCount),
        revenue: toNumber(item.revenue),
        averageOrderValue: toNumber(item.averageOrderValue)
    }))

    return {
        items,
        meta: buildMeta({ date })
    }
}

// 14.12b. Tổng quan doanh số sản phẩm
export const getProductSalesSummary = async (startDate, endDate) => {
    const {data} = await api.get('/api/v1/reports/product-sales-summary', {
        params: {startDate, endDate}
    })

    if (!data) {
        return {
            products: [],
            totalQuantitySold: 0,
            totalRevenueGenerated: 0,
            meta: buildMeta({ startDate, endDate })
        }
    }

    const products = (Array.isArray(data.products) ? data.products : []).map((item, index) => ({
        rank: index + 1,
        ...item,
        totalQuantitySold: toNumber(item.totalQuantitySold),
        totalRevenueGenerated: toNumber(item.totalRevenueGenerated)
    }))

    return {
        products,
        totalQuantitySold: toNumber(data.totalQuantitySold),
        totalRevenueGenerated: toNumber(data.totalRevenueGenerated),
        meta: buildMeta({ startDate, endDate })
    }
}

// 14.13. Thống kê phương thức thanh toán
export const getPaymentMethodStats = async (startDate, endDate) => {
    const {data} = await api.get('/api/v1/reports/payment-method-stats', {
        params: {startDate, endDate}
    })

    const items = (Array.isArray(data) ? data : []).map((item) => ({
        ...item,
        paymentMethod: item.paymentMethod,
        orderCount: toNumber(item.orderCount),
        totalAmount: toNumber(item.totalAmount)
    }))

    const totalOrders = items.reduce((sum, item) => sum + item.orderCount, 0)
    const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0)

    const enriched = items.map((item) => ({
        ...item,
        label: PAYMENT_METHOD_LABELS[item.paymentMethod] ?? item.paymentMethod ?? PAYMENT_METHOD_LABELS.OTHER,
        percentageByOrders: totalOrders > 0 ? (item.orderCount / totalOrders) * 100 : 0,
        percentageByAmount: totalAmount > 0 ? (item.totalAmount / totalAmount) * 100 : 0
    }))

    return {
        items: enriched,
        totals: {
            totalOrders,
            totalAmount
        },
        meta: buildMeta({ startDate, endDate })
    }
}

// 14.14. So sánh doanh số giữa các kỳ
export const getSalesComparison = async (currentStart, currentEnd, previousStart, previousEnd) => {
    const {data} = await api.get('/api/v1/reports/sales-comparison', {
        params: {currentStart, currentEnd, previousStart, previousEnd}
    })

    if (!data) return null

    return {
        ...data,
        currentRevenue: toNumber(data.currentRevenue),
        previousRevenue: toNumber(data.previousRevenue),
        growthAmount: toNumber(data.growthAmount),
        growthPercentage: toNumber(data.growthPercentage),
        currentOrders: toNumber(data.currentOrders),
        previousOrders: toNumber(data.previousOrders),
        meta: buildMeta({ currentStart, currentEnd, previousStart, previousEnd })
    }
}

// 14.15. Xuất báo cáo tồn kho ra Excel
export const exportInventoryToExcel = async () => {
    const response = await api.get('/api/v1/reports/inventory/export', {
        responseType: 'blob'
    })
    return response.data
}

// 14.16. Xuất báo cáo chi phí ra Excel
export const exportExpensesToExcel = async (startDate, endDate) => {
    const response = await api.get('/api/v1/reports/expenses/export', {
        params: {startDate, endDate},
        responseType: 'blob'
    })
    return response.data
}

