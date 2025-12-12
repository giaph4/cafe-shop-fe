import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as productProfitabilityService from '@/api/productProfitabilityService'
import logger from '@/utils/logger'

export const useProductProfitabilityStore = defineStore('productProfitability', () => {
    const loading = ref(false)
    const error = ref(null)
    const analyticsData = ref(null)
    const pricingSuggestion = ref(null)

    const hasData = computed(() => Boolean(analyticsData.value))

    const products = computed(() => {
        if (!analyticsData.value) return []
        return analyticsData.value.products || []
    })

    const categoryAnalysis = computed(() => {
        if (!analyticsData.value) return []
        return analyticsData.value.categoryAnalysis || []
    })

    const topProfitable = computed(() => {
        if (!analyticsData.value) return []
        return analyticsData.value.topProfitable || []
    })

    const lowMargin = computed(() => {
        if (!analyticsData.value) return []
        return analyticsData.value.lowMargin || []
    })

    const summary = computed(() => {
        if (!analyticsData.value) return null
        return analyticsData.value.summary || null
    })

    const analyzeProfitability = async ({ startDate, endDate } = {}) => {
        loading.value = true
        error.value = null

        try {
            const data = await productProfitabilityService.analyzeProductProfitability({
                startDate,
                endDate
            })

            analyticsData.value = data
            logger.log('[ProductProfitability] Analysis completed', {
                productCount: data.products.length,
                period: data.period
            })
            return data
        } catch (err) {
            error.value = err.message || 'Không thể phân tích lợi nhuận'
            logger.error('[ProductProfitability] Failed to analyze', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    const getPricingSuggestion = async ({ productId, currentPrice, currentMargin, targetMargin = 30 } = {}) => {
        loading.value = true
        error.value = null

        try {
            const data = await productProfitabilityService.getPricingSuggestions(
                productId,
                currentPrice,
                currentMargin,
                targetMargin
            )

            pricingSuggestion.value = data
            logger.log('[ProductProfitability] Pricing suggestion generated', { productId })
            return data
        } catch (err) {
            error.value = err.message || 'Không thể tạo đề xuất giá'
            logger.error('[ProductProfitability] Failed to get pricing suggestion', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    const exportReport = async () => {
        if (!analyticsData.value) {
            throw new Error('Chưa có dữ liệu để xuất')
        }

        try {
            const exportData = await productProfitabilityService.exportProfitabilityReport(analyticsData.value)
            return exportData
        } catch (err) {
            logger.error('[ProductProfitability] Failed to export', err)
            throw err
        }
    }

    const reset = () => {
        analyticsData.value = null
        pricingSuggestion.value = null
        error.value = null
    }

    return {
        loading,
        error,
        analyticsData,
        pricingSuggestion,
        hasData,
        products,
        categoryAnalysis,
        topProfitable,
        lowMargin,
        summary,
        analyzeProfitability,
        getPricingSuggestion,
        exportReport,
        reset
    }
})

