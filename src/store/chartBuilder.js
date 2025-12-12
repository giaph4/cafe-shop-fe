import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as reportService from '@/api/reportService'
import { formatDate } from '@/utils/formatters'

/**
 * Convert date to ISO format (yyyy-MM-dd) for API calls
 */
const toISODate = (date) => {
    if (!date) return null
    try {
        // If already in ISO format, return as is
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date
        }
        // If in dd/MM/yyyy format, convert
        if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
            const [day, month, year] = date.split('/')
            return `${year}-${month}-${day}`
        }
        // If Date object, convert to ISO
        const d = new Date(date)
        if (isNaN(d.getTime())) return null
        return d.toISOString().split('T')[0]
    } catch {
        return null
    }
}

/**
 * Store quản lý Chart Builder
 */
export const useChartBuilderStore = defineStore('chartBuilder', () => {
    const savedCharts = ref([])
    const loading = ref(false)
    const error = ref(null)

    /**
     * Fetch data from data source
     */
    const fetchDataSourceData = async (dataSource, config = {}) => {
        loading.value = true
        error.value = null

        try {
            const today = formatDate(new Date())
            const defaultStartDate = formatDate(new Date(new Date().setDate(new Date().getDate() - 30)))
            const defaultEndDate = today

            const startDate = config.dateFrom || defaultStartDate
            const endDate = config.dateTo || defaultEndDate

            // Convert dates to ISO format for API calls
            const isoStartDate = toISODate(startDate)
            const isoEndDate = toISODate(endDate)

            switch (dataSource) {
                case 'revenue': {
                    const data = await reportService.getRevenueByDate(isoStartDate, isoEndDate)
                    // Normalize response: entries is array of {date, value}
                    const entries = data?.entries || []
                    return {
                        labels: entries.map(e => e.date || e.label),
                        values: entries.map(e => e.value || 0),
                        type: 'time-series'
                    }
                }

                case 'profit': {
                    const data = await reportService.getProfitReport(isoStartDate, isoEndDate)
                    // Profit report returns {totalRevenue, totalCostOfGoodsSold, totalProfit}
                    // For time series, we need to get daily profit data
                    // For now, return summary as single data point
                    return {
                        labels: ['Tổng doanh thu', 'Tổng chi phí', 'Tổng lợi nhuận'],
                        values: [
                            data?.totalRevenue || 0,
                            data?.totalCostOfGoodsSold || 0,
                            data?.totalProfit || 0
                        ],
                        type: 'categorical'
                    }
                }

                case 'categoryRevenue': {
                    const data = await reportService.getCategorySales(isoStartDate, isoEndDate)
                    return {
                        labels: data?.items?.map(item => item.categoryName) || [],
                        values: data?.items?.map(item => item.totalRevenue) || [],
                        type: 'categorical'
                    }
                }

                case 'hourlySales': {
                    // hourlySales uses single date, convert to ISO format
                    const isoDate = toISODate(today)
                    const data = await reportService.getHourlySales(isoDate)
                    return {
                        labels: data?.items?.map(item => `${item.hour}:00`) || [],
                        values: data?.items?.map(item => item.totalRevenue) || [],
                        type: 'time-series'
                    }
                }

                case 'paymentMethods': {
                    const data = await reportService.getPaymentMethodStats(isoStartDate, isoEndDate)
                    return {
                        labels: data?.items?.map(item => item.paymentMethod) || [],
                        values: data?.items?.map(item => item.totalAmount) || [],
                        type: 'categorical'
                    }
                }

                case 'topProducts': {
                    const data = await reportService.getBestSellers(isoStartDate, isoEndDate)
                    return {
                        labels: data?.items?.map(item => item.productName) || [],
                        values: data?.items?.map(item => item.totalQuantitySold) || [],
                        type: 'categorical'
                    }
                }

                case 'topCustomers': {
                    const data = await reportService.getTopCustomers(isoStartDate, isoEndDate, 10)
                    // Normalize: data is array or has items property
                    const items = Array.isArray(data) ? data : (data?.items || [])
                    return {
                        labels: items.map(item => item.customerName || item.fullName || 'N/A'),
                        values: items.map(item => item.totalSpent || item.totalAmount || 0),
                        type: 'categorical'
                    }
                }

                case 'topStaff': {
                    const data = await reportService.getStaffPerformance(isoStartDate, isoEndDate, 10)
                    // Normalize: data is array or has items property
                    const items = Array.isArray(data) ? data : (data?.items || [])
                    return {
                        labels: items.map(item => item.staffName || item.username || 'N/A'),
                        values: items.map(item => item.totalSales || item.totalRevenue || 0),
                        type: 'categorical'
                    }
                }

                case 'expenses': {
                    const data = await reportService.getExpensesByDate(isoStartDate, isoEndDate)
                    const entries = data?.entries || []
                    return {
                        labels: entries.map(e => e.date || e.label),
                        values: entries.map(e => e.total || e.value || 0),
                        type: 'time-series'
                    }
                }

                case 'inventory': {
                    const data = await reportService.getInventoryReport(false)
                    const items = Array.isArray(data) ? data : []
                    return {
                        labels: items.map(item => item.name || 'N/A'),
                        values: items.map(item => item.quantityOnHand || 0),
                        type: 'categorical'
                    }
                }

                case 'trends': {
                    // Use trend analysis API
                    const { default: trendService } = await import('@/api/trendAnalysisService')
                    const data = await trendService.analyzeTrends({ startDate: isoStartDate, endDate: isoEndDate })
                    const dailyData = data?.dailyData || []
                    return {
                        labels: dailyData.map(d => d.date),
                        values: dailyData.map(d => d.value || 0),
                        type: 'time-series'
                    }
                }

                case 'forecast': {
                    // Use revenue forecast API
                    const { default: forecastService } = await import('@/api/revenueForecastService')
                    const data = await forecastService.generateRevenueForecast({ startDate: isoStartDate, endDate: isoEndDate, forecastDays: 7 })
                    const forecasts = data?.forecasts || []
                    return {
                        labels: forecasts.map(f => f.date),
                        values: forecasts.map(f => f.forecastedRevenue || 0),
                        type: 'time-series'
                    }
                }

                case 'customerSegments': {
                    // Use top customers as proxy for segments
                    const data = await reportService.getTopCustomers(isoStartDate, isoEndDate, 20)
                    const items = Array.isArray(data) ? data : (data?.items || [])
                    return {
                        labels: items.map(item => item.customerName || item.fullName || 'N/A'),
                        values: items.map(item => item.totalSpent || item.totalAmount || 0),
                        type: 'categorical'
                    }
                }

                case 'productPerformance': {
                    // Use best sellers as product performance
                    const data = await reportService.getBestSellers(startDate, endDate, 20, 'revenue')
                    const items = data?.items || []
                    return {
                        labels: items.map(item => item.productName || 'N/A'),
                        values: items.map(item => item.totalRevenueGenerated || 0),
                        type: 'categorical'
                    }
                }

                default:
                    return { labels: [], values: [], type: 'categorical' }
            }
        } catch (err) {
            error.value = err.message || 'Không thể tải dữ liệu'
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Save chart
     */
    const saveChart = async (chart) => {
        try {
            savedCharts.value.push({
                ...chart,
                id: Date.now().toString()
            })
            saveToLocalStorage()
            return chart
        } catch (err) {
            error.value = err.message || 'Không thể lưu biểu đồ'
            throw err
        }
    }

    /**
     * Load saved charts
     */
    const loadSavedCharts = () => {
        try {
            const data = localStorage.getItem('saved_charts')
            if (data) {
                savedCharts.value = JSON.parse(data)
            }
        } catch (err) {
            console.error('Error loading saved charts:', err)
            savedCharts.value = []
        }
    }

    /**
     * Delete chart
     */
    const deleteChart = (chartId) => {
        savedCharts.value = savedCharts.value.filter(chart => chart.id !== chartId)
        saveToLocalStorage()
    }

    /**
     * Get chart by ID
     */
    const getChart = (chartId) => savedCharts.value.find(chart => chart.id === chartId)

    /**
     * Save to localStorage
     */
    const saveToLocalStorage = () => {
        try {
            localStorage.setItem('saved_charts', JSON.stringify(savedCharts.value))
        } catch (err) {
            console.error('Error saving charts to localStorage:', err)
        }
    }

    /**
     * Export charts config
     */
    const exportCharts = () => JSON.stringify(savedCharts.value, null, 2)

    /**
     * Import charts config
     */
    const importCharts = (configJson) => {
        try {
            const charts = typeof configJson === 'string' ? JSON.parse(configJson) : configJson
            savedCharts.value = [...savedCharts.value, ...charts]
            saveToLocalStorage()
            return true
        } catch (err) {
            console.error('Error importing charts:', err)
            return false
        }
    }

    // Initialize
    loadSavedCharts()

    return {
        savedCharts,
        loading,
        error,
        fetchDataSourceData,
        saveChart,
        loadSavedCharts,
        deleteChart,
        getChart,
        exportCharts,
        importCharts
    }
})

