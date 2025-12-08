import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as ingredientDemandForecastService from '@/api/ingredientDemandForecastService'
import logger from '@/utils/logger'

export const useIngredientDemandForecastStore = defineStore('ingredientDemandForecast', () => {
    const loading = ref(false)
    const error = ref(null)
    const forecastData = ref(null)
    
    const hasData = computed(() => !!forecastData.value)
    
    const ingredients = computed(() => {
        if (!forecastData.value) return []
        return forecastData.value.ingredients || []
    })
    
    const critical = computed(() => {
        if (!forecastData.value) return []
        return forecastData.value.critical || []
    })
    
    const warning = computed(() => {
        if (!forecastData.value) return []
        return forecastData.value.warning || []
    })
    
    const attention = computed(() => {
        if (!forecastData.value) return []
        return forecastData.value.attention || []
    })
    
    const summary = computed(() => {
        if (!forecastData.value) return null
        return forecastData.value.summary || null
    })
    
    const analyzeDemand = async ({ startDate, endDate, forecastDays = 30 } = {}) => {
        loading.value = true
        error.value = null
        
        try {
            const data = await ingredientDemandForecastService.analyzeIngredientDemand({
                startDate,
                endDate,
                forecastDays
            })
            
            forecastData.value = data
            logger.log('[IngredientDemandForecast] Analysis completed', { 
                ingredientCount: data.ingredients.length,
                period: data.period 
            })
            return data
        } catch (err) {
            error.value = err.message || 'Không thể phân tích nhu cầu'
            logger.error('[IngredientDemandForecast] Failed to analyze', err)
            throw err
        } finally {
            loading.value = false
        }
    }
    
    const exportReport = async () => {
        if (!forecastData.value) {
            throw new Error('Chưa có dữ liệu để xuất')
        }
        
        try {
            const exportData = await ingredientDemandForecastService.exportForecastReport(forecastData.value)
            return exportData
        } catch (err) {
            logger.error('[IngredientDemandForecast] Failed to export', err)
            throw err
        }
    }
    
    const reset = () => {
        forecastData.value = null
        error.value = null
    }
    
    return {
        loading,
        error,
        forecastData,
        hasData,
        ingredients,
        critical,
        warning,
        attention,
        summary,
        analyzeDemand,
        exportReport,
        reset
    }
})

