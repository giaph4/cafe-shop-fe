import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as menuOptimizationService from '@/api/menuOptimizationService'
import logger from '@/utils/logger'

export const useMenuOptimizationStore = defineStore('menuOptimization', () => {
    const loading = ref(false)
    const error = ref(null)
    const optimizationData = ref(null)
    
    const hasData = computed(() => !!optimizationData.value)
    
    const products = computed(() => {
        if (!optimizationData.value) return []
        return optimizationData.value.products || []
    })
    
    const categoryPerformance = computed(() => {
        if (!optimizationData.value) return []
        return optimizationData.value.categoryPerformance || []
    })
    
    const classifications = computed(() => {
        if (!optimizationData.value) return null
        return optimizationData.value.classifications || null
    })
    
    const recommendations = computed(() => {
        if (!optimizationData.value) return []
        return optimizationData.value.recommendations || []
    })
    
    const summary = computed(() => {
        if (!optimizationData.value) return null
        return optimizationData.value.summary || null
    })
    
    const analyzeOptimization = async ({ startDate, endDate } = {}) => {
        loading.value = true
        error.value = null
        
        try {
            const data = await menuOptimizationService.analyzeMenuOptimization({
                startDate,
                endDate
            })
            
            optimizationData.value = data
            logger.log('[MenuOptimization] Analysis completed', { 
                productCount: data.products.length,
                period: data.period 
            })
            return data
        } catch (err) {
            error.value = err.message || 'Không thể phân tích tối ưu menu'
            logger.error('[MenuOptimization] Failed to analyze', err)
            throw err
        } finally {
            loading.value = false
        }
    }
    
    const exportReport = async () => {
        if (!optimizationData.value) {
            throw new Error('Chưa có dữ liệu để xuất')
        }
        
        try {
            const exportData = await menuOptimizationService.exportOptimizationReport(optimizationData.value)
            return exportData
        } catch (err) {
            logger.error('[MenuOptimization] Failed to export', err)
            throw err
        }
    }
    
    const reset = () => {
        optimizationData.value = null
        error.value = null
    }
    
    return {
        loading,
        error,
        optimizationData,
        hasData,
        products,
        categoryPerformance,
        classifications,
        recommendations,
        summary,
        analyzeOptimization,
        exportReport,
        reset
    }
})

