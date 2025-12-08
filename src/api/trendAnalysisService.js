import { buildApiError } from '@/utils/errorHandler'
import * as reportService from './reportService'
import * as orderService from './orderService'

const toNumber = (value) => {
    if (value === null || value === undefined) return 0
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
}

const calculateGrowthRate = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
}

const detectAnomalies = (data, threshold = 2) => {
    if (data.length < 3) return []
    
    const values = data.map(d => d.value)
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)
    
    return data
        .map((item, index) => ({
            ...item,
            index,
            zScore: stdDev > 0 ? Math.abs((item.value - mean) / stdDev) : 0
        }))
        .filter(item => item.zScore > threshold)
        .sort((a, b) => b.zScore - a.zScore)
}

const analyzeWeeklyPattern = (data) => {
    const weeklyData = {}
    
    data.forEach(item => {
        const date = new Date(item.date)
        const dayOfWeek = date.getDay()
        const dayName = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][dayOfWeek]
        
        if (!weeklyData[dayOfWeek]) {
            weeklyData[dayOfWeek] = {
                day: dayOfWeek,
                dayName,
                values: [],
                total: 0,
                count: 0,
                avg: 0
            }
        }
        
        weeklyData[dayOfWeek].values.push(item.value)
        weeklyData[dayOfWeek].total += item.value
        weeklyData[dayOfWeek].count++
    })
    
    Object.keys(weeklyData).forEach(day => {
        const dayData = weeklyData[day]
        dayData.avg = dayData.count > 0 ? dayData.total / dayData.count : 0
    })
    
    return Object.values(weeklyData).sort((a, b) => a.day - b.day)
}

const analyzeMonthlyPattern = (data) => {
    const monthlyData = {}
    
    data.forEach(item => {
        const date = new Date(item.date)
        const month = date.getMonth()
        const monthName = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                          'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'][month]
        
        if (!monthlyData[month]) {
            monthlyData[month] = {
                month,
                monthName,
                values: [],
                total: 0,
                count: 0,
                avg: 0
            }
        }
        
        monthlyData[month].values.push(item.value)
        monthlyData[month].total += item.value
        monthlyData[month].count++
    })
    
    Object.keys(monthlyData).forEach(month => {
        const monthData = monthlyData[month]
        monthData.avg = monthData.count > 0 ? monthData.total / monthData.count : 0
    })
    
    return Object.values(monthlyData).sort((a, b) => a.month - b.month)
}

const analyzeHourlyPattern = (hourlyData) => {
    const hourlyPattern = {}
    
    hourlyData.forEach(item => {
        const hour = item.hour
        if (!hourlyPattern[hour]) {
            hourlyPattern[hour] = {
                hour,
                values: [],
                total: 0,
                count: 0,
                avg: 0
            }
        }
        
        hourlyPattern[hour].values.push(item.revenue || item.value || 0)
        hourlyPattern[hour].total += (item.revenue || item.value || 0)
        hourlyPattern[hour].count++
    })
    
    Object.keys(hourlyPattern).forEach(hour => {
        const hourData = hourlyPattern[hour]
        hourData.avg = hourData.count > 0 ? hourData.total / hourData.count : 0
    })
    
    return Object.values(hourlyPattern).sort((a, b) => a.hour - b.hour)
}

export const analyzeTrends = async ({ startDate, endDate, metric = 'revenue' } = {}) => {
    try {
        const end = new Date(endDate)
        const start = new Date(startDate)
        const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
        
        const [revenueData, ordersData, categoryData] = await Promise.all([
            reportService.getRevenueByDate(startDate, endDate).catch(() => ({ entries: [] })),
            orderService.getOrdersByDateRange(startDate, endDate, 0, 10000).catch(() => []),
            reportService.getCategorySales(startDate, endDate).catch(() => [])
        ])
        
        const revenueEntries = revenueData.entries || []
        const ordersList = Array.isArray(ordersData) ? ordersData : (ordersData?.content || [])
        const categoryList = Array.isArray(categoryData) ? categoryData : (categoryData?.items || [])
        
        const dailyData = revenueEntries.map(entry => ({
            date: entry.date,
            value: entry.value,
            orders: 0
        }))
        
        const ordersByDate = {}
        ordersList.forEach(order => {
            if (!order.createdAt) return
            const orderDate = new Date(order.createdAt).toISOString().split('T')[0]
            if (!ordersByDate[orderDate]) {
                ordersByDate[orderDate] = 0
            }
            ordersByDate[orderDate] += toNumber(order.totalAmount || 0)
        })
        
        dailyData.forEach(day => {
            day.orders = ordersByDate[day.date] || 0
        })
        
        const weeklyPattern = analyzeWeeklyPattern(dailyData)
        const monthlyPattern = analyzeMonthlyPattern(dailyData)
        
        const anomalies = detectAnomalies(dailyData)
        
        const currentWeek = dailyData.slice(-7)
        const previousWeek = dailyData.slice(-14, -7)
        const currentMonth = dailyData.slice(-30)
        const previousMonth = dailyData.slice(-60, -30)
        const currentYear = dailyData
        const previousYear = []
        
        const wowGrowth = calculateGrowthRate(
            currentWeek.reduce((sum, d) => sum + d.value, 0),
            previousWeek.reduce((sum, d) => sum + d.value, 0)
        )
        
        const momGrowth = calculateGrowthRate(
            currentMonth.reduce((sum, d) => sum + d.value, 0),
            previousMonth.reduce((sum, d) => sum + d.value, 0)
        )
        
        const yoyGrowth = previousYear.length > 0
            ? calculateGrowthRate(
                currentYear.reduce((sum, d) => sum + d.value, 0),
                previousYear.reduce((sum, d) => sum + d.value, 0)
            )
            : 0
        
        const categoryTrends = categoryList.map(cat => ({
            categoryId: cat.categoryId || cat.id,
            categoryName: cat.categoryName || cat.name,
            totalRevenue: toNumber(cat.totalRevenue || cat.revenue || 0),
            totalQuantity: toNumber(cat.totalQuantity || cat.quantity || 0),
            avgOrderValue: toNumber(cat.avgOrderValue || 0)
        })).sort((a, b) => b.totalRevenue - a.totalRevenue)
        
        return {
            dailyData: dailyData.sort((a, b) => a.date.localeCompare(b.date)),
            weeklyPattern,
            monthlyPattern,
            categoryTrends,
            anomalies,
            growthMetrics: {
                wow: wowGrowth,
                mom: momGrowth,
                yoy: yoyGrowth
            },
            summary: {
                totalDays: daysDiff,
                totalRevenue: dailyData.reduce((sum, d) => sum + d.value, 0),
                totalOrders: dailyData.reduce((sum, d) => sum + d.orders, 0),
                avgDailyRevenue: dailyData.length > 0 
                    ? dailyData.reduce((sum, d) => sum + d.value, 0) / dailyData.length 
                    : 0,
                peakDay: dailyData.length > 0 
                    ? dailyData.reduce((max, d) => d.value > max.value ? d : max, dailyData[0])
                    : null,
                lowDay: dailyData.length > 0
                    ? dailyData.reduce((min, d) => d.value < min.value ? d : min, dailyData[0])
                    : null
            },
            period: { startDate, endDate },
            generatedAt: new Date().toISOString()
        }
    } catch (error) {
        throw buildApiError(error)
    }
}

export const analyzeHourlyTrends = async (dates) => {
    try {
        const hourlyDataPromises = dates.map(date => 
            reportService.getHourlySales(date).catch(() => [])
        )
        
        const hourlyDataResults = await Promise.all(hourlyDataPromises)
        const allHourlyData = []
        
        hourlyDataResults.forEach((data, index) => {
            const date = dates[index]
            const hourlyList = Array.isArray(data) ? data : (data?.items || [])
            hourlyList.forEach(item => {
                allHourlyData.push({
                    date,
                    hour: item.hour || 0,
                    revenue: toNumber(item.revenue || item.value || 0),
                    orders: toNumber(item.orders || item.count || 0)
                })
            })
        })
        
        const hourlyPattern = analyzeHourlyPattern(allHourlyData)
        
        return {
            hourlyData: allHourlyData,
            hourlyPattern,
            peakHour: hourlyPattern.length > 0
                ? hourlyPattern.reduce((max, h) => h.avg > max.avg ? h : max, hourlyPattern[0])
                : null,
            lowHour: hourlyPattern.length > 0
                ? hourlyPattern.reduce((min, h) => h.avg < min.avg ? h : min, hourlyPattern[0])
                : null
        }
    } catch (error) {
        throw buildApiError(error)
    }
}

export const exportTrendReport = async (trendData) => {
    const data = [
        ['BÁO CÁO PHÂN TÍCH XU HƯỚNG'],
        ['Thời gian:', `${trendData.period.startDate} - ${trendData.period.endDate}`],
        ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
        [],
        ['TỔNG QUAN'],
        ['Tổng số ngày:', trendData.summary.totalDays],
        ['Tổng doanh thu:', `${trendData.summary.totalRevenue.toLocaleString('vi-VN')} VNĐ`],
        ['Tổng đơn hàng:', trendData.summary.totalOrders],
        ['Doanh thu TB/ngày:', `${trendData.summary.avgDailyRevenue.toLocaleString('vi-VN')} VNĐ`],
        [],
        ['TĂNG TRƯỞNG'],
        ['Tuần này vs Tuần trước:', `${trendData.growthMetrics.wow.toFixed(2)}%`],
        ['Tháng này vs Tháng trước:', `${trendData.growthMetrics.mom.toFixed(2)}%`],
        ['Năm này vs Năm trước:', `${trendData.growthMetrics.yoy.toFixed(2)}%`],
        [],
        ['CHI TIẾT THEO NGÀY'],
        ['Ngày', 'Doanh thu', 'Số đơn']
    ]
    
    trendData.dailyData.slice(0, 100).forEach(day => {
        data.push([
            day.date,
            day.value.toLocaleString('vi-VN'),
            day.orders
        ])
    })
    
    return {
        data,
        sheetName: 'Phân tích xu hướng',
        filename: `phan-tich-xu-huong-${trendData.period.startDate}-${trendData.period.endDate}.xlsx`
    }
}

