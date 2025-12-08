import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as trendAnalysisService from '@/api/trendAnalysisService'
import logger from '@/utils/logger'

export const useTrendAnalysisStore = defineStore('trendAnalysis', () => {
    const loading = ref(false)
    const error = ref(null)
    const trendData = ref(null)
    const hourlyTrendData = ref(null)
    
    const hasData = computed(() => !!trendData.value)
    
    const dailyData = computed(() => {
        if (!trendData.value) return []
        return trendData.value.dailyData || []
    })
    
    const weeklyPattern = computed(() => {
        if (!trendData.value) return []
        return trendData.value.weeklyPattern || []
    })
    
    const monthlyPattern = computed(() => {
        if (!trendData.value) return []
        return trendData.value.monthlyPattern || []
    })
    
    const categoryTrends = computed(() => {
        if (!trendData.value) return []
        return trendData.value.categoryTrends || []
    })
    
    const anomalies = computed(() => {
        if (!trendData.value) return []
        return trendData.value.anomalies || []
    })
    
    const growthMetrics = computed(() => {
        if (!trendData.value) return null
        return trendData.value.growthMetrics || null
    })
    
    const summary = computed(() => {
        if (!trendData.value) return null
        return trendData.value.summary || null
    })
    
    const hourlyPattern = computed(() => {
        if (!hourlyTrendData.value) return []
        return hourlyTrendData.value.hourlyPattern || []
    })
    
    const analyzeTrends = async ({ startDate, endDate, metric = 'revenue' } = {}) => {
        loading.value = true
        error.value = null
        
        try {
            const data = await trendAnalysisService.analyzeTrends({
                startDate,
                endDate,
                metric
            })
            
            trendData.value = data
            logger.log('[TrendAnalysis] Analysis completed', { 
                days: data.summary.totalDays,
                period: data.period 
            })
            return data
        } catch (err) {
            error.value = err.message || 'Không thể phân tích xu hướng'
            logger.error('[TrendAnalysis] Failed to analyze', err)
            throw err
        } finally {
            loading.value = false
        }
    }
    
    const analyzeHourlyTrends = async (dates) => {
        try {
            const data = await trendAnalysisService.analyzeHourlyTrends(dates)
            hourlyTrendData.value = data
            return data
        } catch (err) {
            logger.error('[TrendAnalysis] Failed to analyze hourly trends', err)
            throw err
        }
    }
    
    const exportReport = async () => {
        if (!trendData.value) {
            throw new Error('Chưa có dữ liệu để xuất')
        }
        
        try {
            const exportData = await trendAnalysisService.exportTrendReport(trendData.value)
            return exportData
        } catch (err) {
            logger.error('[TrendAnalysis] Failed to export', err)
            throw err
        }
    }
    
    const reset = () => {
        trendData.value = null
        hourlyTrendData.value = null
        error.value = null
    }
    
    return {
        loading,
        error,
        trendData,
        hourlyTrendData,
        hasData,
        dailyData,
        weeklyPattern,
        monthlyPattern,
        categoryTrends,
        anomalies,
        growthMetrics,
        summary,
        hourlyPattern,
        analyzeTrends,
        analyzeHourlyTrends,
        exportReport,
        reset
    }
})

