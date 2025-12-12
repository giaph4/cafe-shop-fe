import { buildApiError } from '@/utils/errorHandler'
import api from './axios'

const toNumber = (value) => {
    if (value === null || value === undefined) return 0
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
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
        // Call backend API instead of calculating locally
        const { data } = await api.get('/api/v1/reports/revenue-forecast', {
            params: { startDate, endDate, forecastDays }
        })

        if (!data) {
            throw new Error('Không nhận được dữ liệu từ server')
        }

        // Normalize response to match frontend expectations
        return {
            historical: (data.historical || []).map(entry => ({
                date: entry.date,
                value: toNumber(entry.value)
            })),
            forecasts: (data.forecasts || []).map(forecast => ({
                date: forecast.date,
                forecast: toNumber(forecast.forecast),
                confidenceLower: toNumber(forecast.confidenceLower),
                confidenceUpper: toNumber(forecast.confidenceUpper),
                dayOfWeek: forecast.dayOfWeek
            })),
            metrics: {
                growthRate: toNumber(data.metrics?.growthRate),
                last7DaysAvg: toNumber(data.metrics?.last7DaysAvg),
                totalForecast: toNumber(data.metrics?.totalForecast),
                avgForecast: toNumber(data.metrics?.avgForecast),
                confidenceLevel: data.metrics?.confidenceLevel || 95
            },
            weeklyPattern: data.weeklyPattern || {},
            meta: {
                generatedAt: data.meta?.generatedAt || new Date().toISOString(),
                forecastDays: data.meta?.forecastDays || forecastDays,
                historicalDays: data.meta?.historicalDays || 0
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

        const comparison = forecastData.forecasts.map((forecast) => {
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

export const exportForecastToExcel = (forecastData) => {
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

