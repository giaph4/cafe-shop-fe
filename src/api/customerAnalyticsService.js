import { buildApiError } from '@/utils/errorHandler'
import * as customerService from './customerService'
import * as orderService from './orderService'

const toNumber = (value) => {
    if (value === null || value === undefined) return 0
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
}

const calculateRFM = (customer, orders) => {
    const now = new Date()
    const lastOrder = orders.length > 0 ? new Date(orders[0].createdAt || orders[0].orderDate) : null

    const recency = lastOrder
        ? Math.floor((now - lastOrder) / (1000 * 60 * 60 * 24))
        : 999

    const frequency = orders.length

    const monetary = orders.reduce((sum, o) => sum + toNumber(o.totalAmount), 0)

    const rfmScore = {
        recency,
        frequency,
        monetary,
        rScore: recency <= 30 ? 5 : recency <= 60 ? 4 : recency <= 90 ? 3 : recency <= 180 ? 2 : 1,
        fScore: frequency >= 20 ? 5 : frequency >= 10 ? 4 : frequency >= 5 ? 3 : frequency >= 2 ? 2 : 1,
        mScore: monetary >= 5000000 ? 5 : monetary >= 2000000 ? 4 : monetary >= 1000000 ? 3 : monetary >= 500000 ? 2 : 1
    }

    rfmScore.totalScore = rfmScore.rScore + rfmScore.fScore + rfmScore.mScore

    return rfmScore
}

const classifyCustomer = (rfmScore, _orders) => {
    if (rfmScore.totalScore >= 13) return 'VIP'
    if (rfmScore.totalScore >= 10) return 'Regular'
    if (rfmScore.totalScore >= 7) return 'Occasional'
    if (rfmScore.recency > 180) return 'At-risk'
    return 'New'
}

export const analyzeCustomers = async ({ startDate, endDate } = {}) => {
    try {
        const customers = await customerService.getCustomers({ page: 0, size: 1000 })
        const customersList = Array.isArray(customers) ? customers : (customers?.content || [])

        const orders = await orderService.getOrdersByDateRange(startDate, endDate, 0, 1000)
        const ordersList = Array.isArray(orders) ? orders : (orders?.content || [])

        const customerAnalytics = await Promise.all(
            customersList.map(async (customer) => {
                const customerOrders = ordersList.filter(o =>
                    o.customerId === customer.id || o.customer?.id === customer.id
                )

                const purchaseHistory = await customerService.getCustomerPurchaseHistory({
                    id: customer.id,
                    startDate,
                    endDate
                }).catch(() => ({ content: customerOrders }))

                const historyList = Array.isArray(purchaseHistory)
                    ? purchaseHistory
                    : (purchaseHistory?.content || customerOrders)

                const rfm = calculateRFM(customer, historyList)
                const segment = classifyCustomer(rfm, historyList)

                const totalSpend = historyList.reduce((sum, o) => sum + toNumber(o.totalAmount), 0)
                const orderCount = historyList.length
                const avgOrderValue = orderCount > 0 ? totalSpend / orderCount : 0

                const lastOrder = historyList.length > 0
                    ? new Date(historyList[0].createdAt || historyList[0].orderDate)
                    : null
                const lastVisit = lastOrder ? Math.floor((new Date() - lastOrder) / (1000 * 60 * 60 * 24)) : null

                const productCounts = new Map()
                const categoryCounts = new Map()

                historyList.forEach(order => {
                    if (order.orderDetails) {
                        order.orderDetails.forEach(detail => {
                            if (detail.productId) {
                                productCounts.set(
                                    detail.productId,
                                    (productCounts.get(detail.productId) || 0) + toNumber(detail.quantity)
                                )
                            }
                            if (detail.product?.categoryId) {
                                categoryCounts.set(
                                    detail.product.categoryId,
                                    (categoryCounts.get(detail.product.categoryId) || 0) + toNumber(detail.quantity)
                                )
                            }
                        })
                    }
                })

                const favoriteProduct = Array.from(productCounts.entries())
                    .sort((a, b) => b[1] - a[1])[0]?.[0] || null

                const favoriteCategory = Array.from(categoryCounts.entries())
                    .sort((a, b) => b[1] - a[1])[0]?.[0] || null

                return {
                    customerId: customer.id,
                    fullName: customer.fullName,
                    phone: customer.phone,
                    email: customer.email,
                    metrics: {
                        totalSpend,
                        orderCount,
                        avgOrderValue,
                        lastVisit,
                        frequency: rfm.frequency,
                        recency: rfm.recency,
                        monetary: rfm.monetary,
                        rfmScore: rfm.totalScore,
                        rScore: rfm.rScore,
                        fScore: rfm.fScore,
                        mScore: rfm.mScore
                    },
                    segment,
                    favoriteProduct,
                    favoriteCategory,
                    orders: historyList.slice(0, 10)
                }
            })
        )

        const segments = {
            VIP: customerAnalytics.filter(c => c.segment === 'VIP'),
            Regular: customerAnalytics.filter(c => c.segment === 'Regular'),
            Occasional: customerAnalytics.filter(c => c.segment === 'Occasional'),
            'At-risk': customerAnalytics.filter(c => c.segment === 'At-risk'),
            New: customerAnalytics.filter(c => c.segment === 'New')
        }

        const topCustomers = customerAnalytics
            .sort((a, b) => b.metrics.totalSpend - a.metrics.totalSpend)
            .slice(0, 10)

        return {
            customers: customerAnalytics.sort((a, b) => b.metrics.totalSpend - a.metrics.totalSpend),
            segments,
            topCustomers,
            period: { startDate, endDate },
            generatedAt: new Date().toISOString()
        }
    } catch (error) {
        throw buildApiError(error)
    }
}

export const getCustomerInsights = async ({ customerId, startDate, endDate } = {}) => {
    try {
        const customer = await customerService.getCustomerById(customerId)
        const purchaseHistory = await customerService.getCustomerPurchaseHistory({
            id: customerId,
            startDate,
            endDate
        })

        const historyList = Array.isArray(purchaseHistory)
            ? purchaseHistory
            : (purchaseHistory?.content || [])

        const timePatterns = {
            hour: new Array(24).fill(0),
            dayOfWeek: new Array(7).fill(0)
        }

        historyList.forEach(order => {
            const orderDate = new Date(order.createdAt || order.orderDate)
            timePatterns.hour[orderDate.getHours()]++
            timePatterns.dayOfWeek[orderDate.getDay()]++
        })

        const favoriteHour = timePatterns.hour.indexOf(Math.max(...timePatterns.hour))
        const favoriteDay = timePatterns.dayOfWeek.indexOf(Math.max(...timePatterns.dayOfWeek))

        const recommendations = []

        if (historyList.length === 0) {
            recommendations.push({
                type: 'welcome',
                message: 'Gửi voucher chào mừng để khuyến khích đặt hàng lần đầu',
                action: 'create_welcome_voucher'
            })
        } else {
            const lastOrder = new Date(historyList[0].createdAt || historyList[0].orderDate)
            const daysSinceLastOrder = Math.floor((new Date() - lastOrder) / (1000 * 60 * 60 * 24))

            if (daysSinceLastOrder > 90) {
                recommendations.push({
                    type: 're-engagement',
                    message: 'Khách hàng không mua hàng trong 90+ ngày. Gửi voucher giảm giá để thu hút lại',
                    action: 'create_reengagement_campaign'
                })
            }

            if (historyList.length >= 5 && daysSinceLastOrder < 30) {
                recommendations.push({
                    type: 'loyalty',
                    message: 'Khách hàng trung thành. Tạo chương trình loyalty points',
                    action: 'create_loyalty_program'
                })
            }
        }

        return {
            customer,
            timePatterns,
            favoriteHour,
            favoriteDay,
            recommendations,
            purchaseHistory: historyList
        }
    } catch (error) {
        throw buildApiError(error)
    }
}

export const exportCustomerList = (analyticsData) => {
    const data = [
        ['BÁO CÁO PHÂN TÍCH KHÁCH HÀNG'],
        ['Thời gian:', `${analyticsData.period.startDate} - ${analyticsData.period.endDate}`],
        ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
        [],
        ['Họ tên', 'SĐT', 'Email', 'Phân loại', 'Tổng chi tiêu', 'Số đơn', 'Đơn TB', 'Lần cuối', 'RFM Score']
    ]

    analyticsData.customers.forEach(customer => {
        data.push([
            customer.fullName,
            customer.phone || 'N/A',
            customer.email || 'N/A',
            customer.segment,
            customer.metrics.totalSpend.toLocaleString('vi-VN'),
            customer.metrics.orderCount,
            customer.metrics.avgOrderValue.toLocaleString('vi-VN'),
            customer.metrics.lastVisit ? `${customer.metrics.lastVisit} ngày` : 'N/A',
            customer.metrics.rfmScore
        ])
    })

    return {
        data,
        sheetName: 'Phân tích khách hàng',
        filename: `phan-tich-khach-hang-${analyticsData.period.startDate}-${analyticsData.period.endDate}.xlsx`
    }
}

