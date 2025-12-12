import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as revenueForecastService from '@/api/revenueForecastService'
import logger from '@/utils/logger'

export const useRevenueForecastStore = defineStore('revenueForecast', () => {
    const loading = ref(false)
    const error = ref(null)
    const forecastData = ref(null)
    const comparisonData = ref(null)

    const hasForecast = computed(() => Boolean(forecastData.value))
    const hasComparison = computed(() => Boolean(comparisonData.value))

    const totalForecast = computed(() => {
        if (!forecastData.value) return 0
        return forecastData.value.metrics?.totalForecast || 0
    })

    const avgForecast = computed(() => {
        if (!forecastData.value) return 0
        return forecastData.value.metrics?.avgForecast || 0
    })

    const growthRate = computed(() => {
        if (!forecastData.value) return 0
        return forecastData.value.metrics?.growthRate || 0
    })

    const forecastAccuracy = computed(() => {
        if (!comparisonData.value) return null
        return comparisonData.value.accuracy || null
    })

    const generateForecast = async ({ startDate, endDate, forecastDays = 7 }) => {
        loading.value = true
        error.value = null

        try {
            const data = await revenueForecastService.generateRevenueForecast({
                startDate,
                endDate,
                forecastDays
            })

            forecastData.value = data
            logger.log('[RevenueForecast] Forecast generated successfully', data.meta)
            return data
        } catch (err) {
            error.value = err.message || 'Không thể tạo dự báo'
            logger.error('[RevenueForecast] Failed to generate forecast', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    const getComparison = async ({ startDate, endDate, actualStartDate, actualEndDate }) => {
        loading.value = true
        error.value = null

        try {
            const data = await revenueForecastService.getForecastComparison({
                startDate,
                endDate,
                actualStartDate,
                actualEndDate
            })

            comparisonData.value = data
            logger.log('[RevenueForecast] Comparison generated successfully', { accuracy: data.accuracy })
            return data
        } catch (err) {
            error.value = err.message || 'Không thể tạo so sánh'
            logger.error('[RevenueForecast] Failed to generate comparison', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    const exportForecast = async () => {
        if (!forecastData.value) {
            throw new Error('Chưa có dữ liệu dự báo để xuất')
        }

        try {
            const exportData = await revenueForecastService.exportForecastToExcel(forecastData.value)
            return exportData
        } catch (err) {
            logger.error('[RevenueForecast] Failed to export forecast', err)
            throw err
        }
    }

    const reset = () => {
        forecastData.value = null
        comparisonData.value = null
        error.value = null
    }

    return {
        loading,
        error,
        forecastData,
        comparisonData,
        hasForecast,
        hasComparison,
        totalForecast,
        avgForecast,
        growthRate,
        forecastAccuracy,
        generateForecast,
        getComparison,
        exportForecast,
        reset
    }
})

