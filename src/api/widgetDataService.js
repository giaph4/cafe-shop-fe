import { getDashboardStats } from './reportService'
import { getRevenueByDate, getProfitReport, getCategorySales, getHourlySales, getTopCustomers, getStaffPerformance, getProductSalesSummary, getTotalExpenses, getPaymentMethodStats } from './reportService'
import { getAdminDashboard } from './adminDashboardService'
import { getManagerDashboard } from './managerDashboardService'
import { getDefaultColors } from '@/constants/chartColors'
import logger from '@/utils/logger'

/**
 * Service để lấy và chuyển đổi dữ liệu cho widgets
 */

/**
 * Định dạng ngày thành yyyy-MM-dd cho API
 */
const formatDateForAPI = (date) => {
    if (!date) return null
    const d = date instanceof Date ? date : new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * Tính toán khoảng thời gian từ config
 */
const getDateRange = (config) => {
    const today = new Date()
    const endDate = config?.dateTo || formatDateForAPI(today)

    let startDate = config?.dateFrom
    if (!startDate) {
        // Mặc định: 7 ngày gần nhất
        const daysAgo = new Date(today)
        daysAgo.setDate(daysAgo.getDate() - 7)
        startDate = formatDateForAPI(daysAgo)
    }

    return { startDate, endDate }
}

/**
 * Lấy dữ liệu cho widget KPI
 */
export const fetchKPIData = async (config) => {
    const { dataSource } = config || {}
    const { startDate, endDate } = getDateRange(config)

    try {
        switch (dataSource) {
            case 'revenue':
            case 'todayRevenue': {
                const stats = await getDashboardStats()
                return {
                    value: stats?.todayRevenue || 0,
                    subtitle: 'Doanh thu hôm nay',
                    change: undefined // Có thể tính từ so sánh với hôm qua
                }
            }

            case 'monthRevenue': {
                const stats = await getDashboardStats()
                return {
                    value: stats?.monthRevenue || 0,
                    subtitle: 'Doanh thu tháng này',
                    change: undefined
                }
            }

            case 'orders':
            case 'todayOrders': {
                const stats = await getDashboardStats()
                return {
                    value: stats?.todayOrders || 0,
                    subtitle: 'Đơn hàng hôm nay',
                    change: undefined
                }
            }

            case 'monthOrders': {
                const stats = await getDashboardStats()
                return {
                    value: stats?.monthOrders || 0,
                    subtitle: 'Đơn hàng tháng này',
                    change: undefined
                }
            }

            case 'customers': {
                const stats = await getDashboardStats()
                return {
                    value: stats?.totalCustomers || 0,
                    subtitle: 'Tổng khách hàng',
                    change: undefined
                }
            }

            case 'profit': {
                const profitData = await getProfitReport(startDate, endDate)
                return {
                    value: profitData?.totalProfit || 0,
                    subtitle: `Lợi nhuận (${startDate} - ${endDate})`,
                    change: undefined
                }
            }

            case 'expenses': {
                const expensesData = await getTotalExpenses(startDate, endDate)
                return {
                    value: expensesData?.totalExpenses || 0,
                    subtitle: `Chi phí (${startDate} - ${endDate})`,
                    change: undefined
                }
            }

            case 'lowStock': {
                const adminData = await getAdminDashboard()
                return {
                    value: adminData?.inventory?.lowStockItems || 0,
                    subtitle: 'Nguyên liệu sắp hết',
                    change: undefined
                }
            }

            case 'pendingOrders': {
                const adminData = await getAdminDashboard()
                return {
                    value: adminData?.inventory?.pendingPurchaseOrders || 0,
                    subtitle: 'Đơn nhập chờ',
                    change: undefined
                }
            }

            default:
                return {
                    value: 0,
                    subtitle: 'N/A',
                    change: undefined
                }
        }
    } catch (error) {
        logger.error('Lỗi khi lấy dữ liệu KPI:', error)
        return {
            value: 0,
            subtitle: 'Lỗi tải dữ liệu',
            change: undefined
        }
    }
}

/**
 * Lấy dữ liệu cho widget biểu đồ
 */
export const fetchChartData = async (config) => {
    const { dataSource, chartType } = config || {}
    const { startDate, endDate } = getDateRange(config)

    try {
        switch (dataSource) {
            case 'revenue': {
                const revenueData = await getRevenueByDate(startDate, endDate)
                return {
                    series: [{
                        name: 'Doanh thu',
                        data: revenueData?.values || []
                    }],
                    categories: revenueData?.labels || [],
                    colors: getDefaultColors(chartType, 'revenue')
                }
            }

            case 'orders': {
                // Có thể dùng dữ liệu doanh thu làm proxy hoặc tạo API riêng
                const revenueData = await getRevenueByDate(startDate, endDate)
                return {
                    series: [{
                        name: 'Đơn hàng',
                        data: revenueData?.values || []
                    }],
                    categories: revenueData?.labels || [],
                    colors: getDefaultColors(chartType, 'orders')
                }
            }

            case 'categoryRevenue': {
                const categoryData = await getCategorySales(startDate, endDate)
                const items = categoryData?.items || []
                const colors = getDefaultColors(chartType, 'categoryRevenue')

                if (chartType === 'pie' || chartType === 'donut') {
                    // Pie/Donut cần array of numbers cho series
                    return {
                        series: items.map(item => item.totalRevenue || 0),
                        categories: items.map(item => item.categoryName || 'N/A'),
                        colors: colors.slice(0, items.length)
                    }
                }
                return {
                    series: [{
                        name: 'Doanh thu theo danh mục',
                        data: items.map(item => item.totalRevenue || 0)
                    }],
                    categories: items.map(item => item.categoryName || 'N/A'),
                    colors
                }
            }

            case 'hourlySales': {
                const hourlyData = await getHourlySales(endDate)
                return {
                    series: [{
                        name: 'Doanh thu theo giờ',
                        data: hourlyData?.items?.map(item => item.totalRevenue) || []
                    }],
                    categories: hourlyData?.items?.map(item => `${item.hour}:00`) || [],
                    colors: getDefaultColors(chartType, 'revenue')
                }
            }

            case 'products': {
                const productData = await getProductSalesSummary(startDate, endDate)
                return {
                    series: [{
                        name: 'Sản phẩm',
                        data: productData?.items?.slice(0, 10).map(item => item.totalQuantitySold) || []
                    }],
                    categories: productData?.items?.slice(0, 10).map(item => item.productName) || [],
                    colors: getDefaultColors(chartType, 'products')
                }
            }

            case 'paymentMethods': {
                const paymentData = await getPaymentMethodStats(startDate, endDate)
                const items = paymentData?.items || []
                const colors = getDefaultColors(chartType, 'paymentMethods')

                if (chartType === 'pie' || chartType === 'donut') {
                    // Pie/Donut cần mảng số cho series
                    return {
                        series: items.map(item => item.totalAmount || 0),
                        categories: items.map(item => item.paymentMethod || 'N/A'),
                        colors: colors.slice(0, items.length)
                    }
                }
                return {
                    series: [{
                        name: 'Phương thức thanh toán',
                        data: items.map(item => item.totalAmount || 0)
                    }],
                    categories: items.map(item => item.paymentMethod || 'N/A'),
                    colors
                }
            }

            default:
                return {
                    series: [],
                    categories: []
                }
        }
    } catch (error) {
        logger.error('Lỗi khi lấy dữ liệu biểu đồ:', error)
        return {
            series: [],
            categories: []
        }
    }
}

/**
 * Lấy dữ liệu cho widget bảng
 */
export const fetchTableData = async (config) => {
    const { dataSource, pageSize = 10 } = config || {}
    const { startDate, endDate } = getDateRange(config)

    try {
        switch (dataSource) {
            case 'topProducts': {
                const adminData = await getAdminDashboard()
                const products = adminData?.topProducts || []
                return products.map((item, index) => ({
                    rank: index + 1,
                    name: item.productName || 'N/A',
                    quantity: item.quantity || 0,
                    revenue: item.revenue || 0
                }))
            }

            case 'topCustomers': {
                const customersData = await getTopCustomers(startDate, endDate, pageSize)
                return customersData?.items?.map((item, index) => ({
                    rank: index + 1,
                    name: item.customerName || 'N/A',
                    phone: item.phone || 'N/A',
                    orders: item.orders || 0,
                    spend: item.spend || 0
                })) || []
            }

            case 'topStaff': {
                const staffData = await getStaffPerformance(startDate, endDate, pageSize)
                return staffData?.items?.map((item, index) => ({
                    rank: index + 1,
                    name: item.staffName || 'N/A',
                    orders: item.orders || 0,
                    revenue: item.revenue || 0
                })) || []
            }

            case 'products': {
                const productData = await getProductSalesSummary(startDate, endDate)
                return productData?.items?.slice(0, pageSize).map((item, index) => ({
                    rank: index + 1,
                    name: item.productName || 'N/A',
                    quantity: item.totalQuantitySold || 0,
                    revenue: item.totalRevenueGenerated || 0
                })) || []
            }

            default:
                return []
        }
    } catch (error) {
        logger.error('Lỗi khi lấy dữ liệu bảng:', error)
        return []
    }
}

/**
 * Lấy dữ liệu cho widget cảnh báo
 */
export const fetchAlertData = async (_config) => {
    try {
        const adminData = await getAdminDashboard()
        const managerData = await getManagerDashboard()

        const alerts = []

        // Cảnh báo hệ thống từ admin dashboard
        if (adminData?.alerts) {
            adminData.alerts.forEach(alert => {
                alerts.push({
                    id: `alert_${Date.now()}_${Math.random()}`,
                    type: alert.type || 'System',
                    title: alert.type || 'Cảnh báo',
                    message: alert.message || '',
                    severity: alert.severity || 'warning',
                    timestamp: new Date().toISOString()
                })
            })
        }

        // Cảnh báo kho từ manager dashboard
        if (managerData?.inventory?.alerts) {
            managerData.inventory.alerts.forEach(alert => {
                alerts.push({
                    id: `alert_inv_${alert.ingredientId || Date.now()}`,
                    type: 'Inventory',
                    title: 'Cảnh báo kho',
                    message: `${alert.ingredientName} sắp hết (còn ${alert.quantityOnHand})`,
                    severity: 'warning',
                    timestamp: new Date().toISOString()
                })
            })
        }

        // Attendance alerts
        if (managerData?.attendanceAlerts) {
            managerData.attendanceAlerts.forEach(alert => {
                alerts.push({
                    id: `alert_att_${alert.assignmentId || Date.now()}`,
                    type: 'Attendance',
                    title: 'Cảnh báo chấm công',
                    message: `${alert.staffName}: ${alert.issueType}`,
                    severity: 'info',
                    timestamp: new Date().toISOString()
                })
            })
        }

        // Service issues
        if (managerData?.serviceIssues) {
            managerData.serviceIssues.forEach(issue => {
                alerts.push({
                    id: `alert_svc_${issue.orderId || Date.now()}`,
                    type: 'Service',
                    title: 'Vấn đề dịch vụ',
                    message: `${issue.tableName}: ${issue.issue}`,
                    severity: issue.severity || 'warning',
                    timestamp: issue.createdDate || new Date().toISOString()
                })
            })
        }

        return alerts
    } catch (error) {
        logger.error('Lỗi khi lấy dữ liệu cảnh báo:', error)
        return []
    }
}

/**
 * Lấy dữ liệu tổng hợp cho widget dựa trên type và config
 */
export const fetchWidgetData = async (widget) => {
    const { type, config } = widget || {}

    if (!type || !config) {
        return null
    }

    try {
        switch (type) {
            case 'kpi':
                return await fetchKPIData(config)

            case 'chart':
                return await fetchChartData(config)

            case 'table':
                return await fetchTableData(config)

            case 'alert':
                return await fetchAlertData(config)

            default:
                return null
        }
    } catch (error) {
        logger.error(`Lỗi khi lấy dữ liệu cho widget ${widget.id}:`, error)
        return null
    }
}

