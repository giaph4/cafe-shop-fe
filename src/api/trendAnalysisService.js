import { buildApiError } from '@/utils/errorHandler'
import api from './axios'

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

export const analyzeTrends = async ({ startDate, endDate, metric: _metric = 'revenue' } = {}) => {
    try {
        // Gọi backend API để lấy dữ liệu phân tích xu hướng
        const { data } = await api.get('/api/v1/reports/trend-analysis', {
            params: { startDate, endDate }
        })

        if (!data) {
            throw new Error('Không nhận được dữ liệu từ server')
        }

        // Chuẩn hóa response cho frontend
        return {
            dailyData: (data.dailyData || []).map(d => ({
                date: d.date,
                value: toNumber(d.value),
                orders: d.orders || 0
            })),
            weeklyPattern: (data.weeklyPattern || []).map(w => ({
                day: w.day,
                dayName: w.dayName,
                values: [],
                total: toNumber(w.avg) * (w.count || 1),
                count: w.count || 0,
                avg: toNumber(w.avg)
            })),
            monthlyPattern: (data.monthlyPattern || []).map(m => ({
                month: m.month,
                monthName: m.monthName,
                values: [],
                total: toNumber(m.avg) * (m.count || 1),
                count: m.count || 0,
                avg: toNumber(m.avg)
            })),
            categoryTrends: (data.categoryTrends || []).map(cat => ({
                categoryId: cat.categoryId,
                categoryName: cat.categoryName,
                totalRevenue: toNumber(cat.totalRevenue),
                totalQuantity: cat.totalQuantity || 0,
                avgOrderValue: toNumber(cat.avgOrderValue)
            })),
            anomalies: (data.anomalies || []).map(a => ({
                date: a.date,
                value: toNumber(a.value),
                zScore: a.zScore || 0
            })),
            growthMetrics: {
                wow: toNumber(data.growthMetrics?.wow),
                mom: toNumber(data.growthMetrics?.mom),
                yoy: toNumber(data.growthMetrics?.yoy)
            },
            summary: {
                totalDays: data.summary?.totalDays || 0,
                totalRevenue: toNumber(data.summary?.totalRevenue),
                totalOrders: data.summary?.totalOrders || 0,
                avgDailyRevenue: toNumber(data.summary?.avgDailyRevenue),
                peakDay: data.summary?.peakDay ? {
                    date: data.summary.peakDay.date,
                    value: toNumber(data.summary.peakDay.value),
                    orders: data.summary.peakDay.orders || 0
                } : null,
                lowDay: data.summary?.lowDay ? {
                    date: data.summary.lowDay.date,
                    value: toNumber(data.summary.lowDay.value),
                    orders: data.summary.lowDay.orders || 0
                } : null
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

export const exportTrendReport = (trendData) => {
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

