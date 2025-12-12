import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as cancellationAnalysisService from '@/api/cancellationAnalysisService'
import logger from '@/utils/logger'

export const useCancellationAnalysisStore = defineStore('cancellationAnalysis', () => {
    const loading = ref(false)
    const error = ref(null)
    const analysisData = ref(null)

    const hasData = computed(() => Boolean(analysisData.value))

    const summary = computed(() => {
        if (!analysisData.value) return null
        return analysisData.value.summary || null
    })

    const hourlyAnalysis = computed(() => {
        if (!analysisData.value) return []
        return analysisData.value.hourlyAnalysis || []
    })

    const topCancelledHours = computed(() => {
        if (!analysisData.value) return []
        return analysisData.value.topCancelledHours || []
    })

    const topCancelledProducts = computed(() => {
        if (!analysisData.value) return []
        return analysisData.value.topCancelledProducts || []
    })

    const topCancelledTables = computed(() => {
        if (!analysisData.value) return []
        return analysisData.value.topCancelledTables || []
    })

    const topReasons = computed(() => {
        if (!analysisData.value) return []
        return analysisData.value.topReasons || []
    })

    const dailyTrend = computed(() => {
        if (!analysisData.value) return []
        return analysisData.value.dailyTrend || []
    })

    const cancelledOrders = computed(() => {
        if (!analysisData.value) return []
        return analysisData.value.cancelledOrders || []
    })

    const recommendations = computed(() => {
        if (!analysisData.value) return []
        return analysisData.value.recommendations || []
    })

    const analyzeCancellations = async ({ startDate, endDate } = {}) => {
        loading.value = true
        error.value = null

        try {
            const data = await cancellationAnalysisService.analyzeCancellations({
                startDate,
                endDate
            })

            analysisData.value = data
            logger.log('[CancellationAnalysis] Analysis completed', {
                cancelledCount: data.summary.totalCancelled,
                rate: data.summary.cancellationRate,
                period: data.period
            })
            return data
        } catch (err) {
            error.value = err.message || 'Không thể phân tích tỷ lệ hủy đơn'
            logger.error('[CancellationAnalysis] Failed to analyze', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    const exportReport = async () => {
        if (!analysisData.value) {
            throw new Error('Chưa có dữ liệu để xuất')
        }

        try {
            const exportData = await cancellationAnalysisService.exportCancellationReport(analysisData.value)
            return exportData
        } catch (err) {
            logger.error('[CancellationAnalysis] Failed to export', err)
            throw err
        }
    }

    const reset = () => {
        analysisData.value = null
        error.value = null
    }

    return {
        loading,
        error,
        analysisData,
        hasData,
        summary,
        hourlyAnalysis,
        topCancelledHours,
        topCancelledProducts,
        topCancelledTables,
        topReasons,
        dailyTrend,
        cancelledOrders,
        recommendations,
        analyzeCancellations,
        exportReport,
        reset
    }
})

