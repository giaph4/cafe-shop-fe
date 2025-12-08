import api from './axios'
import { buildApiError } from '@/utils/errorHandler'
import { cleanParams } from './utils'
import * as reportService from './reportService'
import * as orderService from './orderService'

const toNumber = (value) => {
    if (value === null || value === undefined) return 0
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
}

const calculateMovingAverage = (data, period = 7) => {
    if (!Array.isArray(data) || data.length < period) return []
    
    const result = []
    for (let i = period - 1; i < data.length; i++) {
        const slice = data.slice(i - period + 1, i + 1)
        const avg = slice.reduce((sum, item) => sum + toNumber(item.value), 0) / period
        result.push({
            date: data[i].date,
            value: Math.round(avg * 100) / 100
        })
    }
    return result
}

const calculateGrowthRate = (data) => {
    if (!Array.isArray(data) || data.length < 2) return 0
    
    const recent = data.slice(-7)
    const previous = data.slice(-14, -7)
    
    if (previous.length === 0) return 0
    
    const recentAvg = recent.reduce((sum, item) => sum + toNumber(item.value), 0) / recent.length
    const previousAvg = previous.reduce((sum, item) => sum + toNumber(item.value), 0) / previous.length
    
    if (previousAvg === 0) return 0
    return ((recentAvg - previousAvg) / previousAvg) * 100
}

const detectWeeklyPattern = (data) => {
    if (!Array.isArray(data) || data.length < 7) return {}
    
    const dayOfWeek = {}
    data.forEach(item => {
        const date = new Date(item.date)
        const day = date.getDay()
        if (!dayOfWeek[day]) {
            dayOfWeek[day] = { sum: 0, count: 0 }
        }
        dayOfWeek[day].sum += toNumber(item.value)
        dayOfWeek[day].count += 1
    })
    
    const pattern = {}
    Object.keys(dayOfWeek).forEach(day => {
        pattern[day] = dayOfWeek[day].sum / dayOfWeek[day].count
    })
    
    return pattern
}

const calculateConfidenceInterval = (data, forecastValue) => {
    if (!Array.isArray(data) || data.length < 7) return { lower: forecastValue * 0.8, upper: forecastValue * 1.2 }
    
    const values = data.map(item => toNumber(item.value))
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)
    
    const confidence = 1.96
    const margin = stdDev * confidence
    
    return {
        lower: Math.max(0, forecastValue - margin),
        upper: forecastValue + margin
    }
}

export const generateRevenueForecast = async ({ startDate, endDate, forecastDays = 7 }) => {
    try {
        const end = new Date(endDate)
        const start = new Date(startDate)
        const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
        
        if (daysDiff < 7) {
            throw new Error('Cần ít nhất 7 ngày dữ liệu lịch sử để tạo dự báo')
        }
        
        const historicalData = await reportService.getRevenueByDate(startDate, endDate)
        
        if (!historicalData || !historicalData.entries || historicalData.entries.length === 0) {
            throw new Error('Không có dữ liệu lịch sử')
        }
        
        const entries = historicalData.entries.map(entry => ({
            date: entry.date,
            value: toNumber(entry.value)
        })).sort((a, b) => a.date.localeCompare(b.date))
        
        const movingAvg = calculateMovingAverage(entries, 7)
        const growthRate = calculateGrowthRate(entries)
        const weeklyPattern = detectWeeklyPattern(entries)
        
        const lastValue = entries[entries.length - 1].value
        const last7Avg = entries.slice(-7).reduce((sum, item) => sum + item.value, 0) / 7
        
        const forecasts = []
        const lastDate = new Date(entries[entries.length - 1].date)
        
        for (let i = 1; i <= forecastDays; i++) {
            const forecastDate = new Date(lastDate)
            forecastDate.setDate(forecastDate.getDate() + i)
            
            const dayOfWeek = forecastDate.getDay()
            const patternMultiplier = weeklyPattern[dayOfWeek] 
                ? weeklyPattern[dayOfWeek] / last7Avg 
                : 1
            
            const baseForecast = last7Avg * (1 + growthRate / 100)
            const adjustedForecast = baseForecast * patternMultiplier
            
            const confidence = calculateConfidenceInterval(entries, adjustedForecast)
            
            forecasts.push({
                date: forecastDate.toISOString().split('T')[0],
                forecast: Math.round(adjustedForecast),
                confidenceLower: Math.round(confidence.lower),
                confidenceUpper: Math.round(confidence.upper),
                dayOfWeek: ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][dayOfWeek]
            })
        }
        
        const totalForecast = forecasts.reduce((sum, item) => sum + item.forecast, 0)
        const avgForecast = totalForecast / forecastDays
        
        return {
            historical: entries,
            forecasts,
            metrics: {
                growthRate: Math.round(growthRate * 100) / 100,
                last7DaysAvg: Math.round(last7Avg),
                totalForecast,
                avgForecast: Math.round(avgForecast),
                confidenceLevel: 95
            },
            weeklyPattern,
            meta: {
                generatedAt: new Date().toISOString(),
                forecastDays,
                historicalDays: daysDiff
            }
        }
    } catch (error) {
        throw buildApiError(error)
    }
}

export const getForecastComparison = async ({ startDate, endDate, actualStartDate, actualEndDate }) => {
    try {
        const [forecastData, actualData] = await Promise.all([
            generateRevenueForecast({ startDate, endDate, forecastDays: 7 }),
            reportService.getRevenueByDate(actualStartDate, actualEndDate)
        ])
        
        if (!actualData || !actualData.entries) {
            return { forecast: forecastData, actual: null, comparison: null }
        }
        
        const comparison = forecastData.forecasts.map((forecast, index) => {
            const actual = actualData.entries.find(e => e.date === forecast.date)
            if (!actual) return null
            
            const actualValue = toNumber(actual.value)
            const error = actualValue - forecast.forecast
            const errorPercent = forecast.forecast > 0 
                ? (error / forecast.forecast) * 100 
                : 0
            
            return {
                date: forecast.date,
                forecast: forecast.forecast,
                actual: actualValue,
                error,
                errorPercent: Math.round(errorPercent * 100) / 100,
                accuracy: Math.max(0, 100 - Math.abs(errorPercent))
            }
        }).filter(Boolean)
        
        const avgAccuracy = comparison.length > 0
            ? comparison.reduce((sum, item) => sum + item.accuracy, 0) / comparison.length
            : 0
        
        return {
            forecast: forecastData,
            actual: actualData,
            comparison,
            accuracy: Math.round(avgAccuracy * 100) / 100
        }
    } catch (error) {
        throw buildApiError(error)
    }
}

export const exportForecastToExcel = async (forecastData) => {
    try {
        const data = [
            ['Ngày', 'Dự báo', 'Giới hạn dưới', 'Giới hạn trên', 'Thứ trong tuần'],
            ...forecastData.forecasts.map(item => [
                item.date,
                item.forecast,
                item.confidenceLower,
                item.confidenceUpper,
                item.dayOfWeek
            ])
        ]
        
        return {
            filename: `du-bao-doanh-thu-${new Date().toISOString().split('T')[0]}.xlsx`,
            data,
            sheetName: 'Dự báo doanh thu'
        }
    } catch (error) {
        throw buildApiError(error)
    }
}

