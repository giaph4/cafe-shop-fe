import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as voucherAnalyticsService from '@/api/voucherAnalyticsService'
import logger from '@/utils/logger'

export const useVoucherAnalyticsStore = defineStore('voucherAnalytics', () => {
    const loading = ref(false)
    const error = ref(null)
    const analyticsData = ref(null)
    const usageOverTime = ref(null)
    const comparisonData = ref(null)
    
    const hasData = computed(() => !!analyticsData.value)
    const hasUsageData = computed(() => !!usageOverTime.value)
    const hasComparison = computed(() => !!comparisonData.value)
    
    const summary = computed(() => {
        if (!analyticsData.value) return null
        return analyticsData.value.summary
    })
    
    const vouchers = computed(() => {
        if (!analyticsData.value) return []
        return analyticsData.value.vouchers || []
    })
    
    const topVouchers = computed(() => {
        return vouchers.value.slice(0, 5)
    })
    
    const analyzePerformance = async ({ startDate, endDate, voucherId = null }) => {
        loading.value = true
        error.value = null
        
        try {
            const data = await voucherAnalyticsService.analyzeVoucherPerformance({
                startDate,
                endDate,
                voucherId
            })
            
            analyticsData.value = data
            logger.log('[VoucherAnalytics] Analysis completed', data.meta)
            return data
        } catch (err) {
            error.value = err.message || 'Không thể phân tích hiệu quả voucher'
            logger.error('[VoucherAnalytics] Failed to analyze', err)
            throw err
        } finally {
            loading.value = false
        }
    }
    
    const getUsageOverTime = async ({ startDate, endDate, voucherId = null }) => {
        loading.value = true
        error.value = null
        
        try {
            const data = await voucherAnalyticsService.getVoucherUsageOverTime({
                startDate,
                endDate,
                voucherId
            })
            
            usageOverTime.value = data
            logger.log('[VoucherAnalytics] Usage over time loaded', { count: data.length })
            return data
        } catch (err) {
            error.value = err.message || 'Không thể lấy dữ liệu sử dụng'
            logger.error('[VoucherAnalytics] Failed to get usage over time', err)
            throw err
        } finally {
            loading.value = false
        }
    }
    
    const compareStrategies = async ({ startDate, endDate, voucherIds }) => {
        loading.value = true
        error.value = null
        
        try {
            const data = await voucherAnalyticsService.compareVoucherStrategies({
                startDate,
                endDate,
                voucherIds
            })
            
            comparisonData.value = data
            logger.log('[VoucherAnalytics] Comparison completed', { count: data.length })
            return data
        } catch (err) {
            error.value = err.message || 'Không thể so sánh voucher'
            logger.error('[VoucherAnalytics] Failed to compare', err)
            throw err
        } finally {
            loading.value = false
        }
    }
    
    const exportAnalytics = async () => {
        if (!analyticsData.value) {
            throw new Error('Chưa có dữ liệu phân tích để xuất')
        }
        
        try {
            const exportData = await voucherAnalyticsService.exportVoucherAnalytics(analyticsData.value)
            return exportData
        } catch (err) {
            logger.error('[VoucherAnalytics] Failed to export', err)
            throw err
        }
    }
    
    const reset = () => {
        analyticsData.value = null
        usageOverTime.value = null
        comparisonData.value = null
        error.value = null
    }
    
    return {
        loading,
        error,
        analyticsData,
        usageOverTime,
        comparisonData,
        hasData,
        hasUsageData,
        hasComparison,
        summary,
        vouchers,
        topVouchers,
        analyzePerformance,
        getUsageOverTime,
        compareStrategies,
        exportAnalytics,
        reset
    }
})

