import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as costAnalysisService from '@/api/costAnalysisService'
import logger from '@/utils/logger'

export const useCostAnalysisStore = defineStore('costAnalysis', () => {
    const loading = ref(false)
    const error = ref(null)
    const costData = ref(null)
    
    const hasData = computed(() => !!costData.value)
    
    const summary = computed(() => {
        if (!costData.value) return null
        return costData.value.summary || null
    })
    
    const categoryBreakdown = computed(() => {
        if (!costData.value) return []
        return costData.value.categoryBreakdown || []
    })
    
    const dailyCosts = computed(() => {
        if (!costData.value) return []
        return costData.value.dailyCosts || []
    })
    
    const topCategories = computed(() => {
        if (!costData.value) return []
        return costData.value.topCategories || []
    })
    
    const recommendations = computed(() => {
        if (!costData.value) return []
        return costData.value.recommendations || []
    })
    
    const analyzeCosts = async ({ startDate, endDate } = {}) => {
        loading.value = true
        error.value = null
        
        try {
            const data = await costAnalysisService.analyzeCosts({
                startDate,
                endDate
            })
            
            costData.value = data
            logger.log('[CostAnalysis] Analysis completed', { 
                totalCost: data.summary.totalCost,
                period: data.period 
            })
            return data
        } catch (err) {
            error.value = err.message || 'Không thể phân tích chi phí'
            logger.error('[CostAnalysis] Failed to analyze', err)
            throw err
        } finally {
            loading.value = false
        }
    }
    
    const exportReport = async () => {
        if (!costData.value) {
            throw new Error('Chưa có dữ liệu để xuất')
        }
        
        try {
            const exportData = await costAnalysisService.exportCostReport(costData.value)
            return exportData
        } catch (err) {
            logger.error('[CostAnalysis] Failed to export', err)
            throw err
        }
    }
    
    const reset = () => {
        costData.value = null
        error.value = null
    }
    
    return {
        loading,
        error,
        costData,
        hasData,
        summary,
        categoryBreakdown,
        dailyCosts,
        topCategories,
        recommendations,
        analyzeCosts,
        exportReport,
        reset
    }
})

