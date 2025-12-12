import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as customerAnalyticsService from '@/api/customerAnalyticsService'
import logger from '@/utils/logger'

export const useCustomerAnalyticsStore = defineStore('customerAnalytics', () => {
    const loading = ref(false)
    const error = ref(null)
    const analyticsData = ref(null)
    const customerInsights = ref(null)
    const selectedCustomerId = ref(null)

    const hasData = computed(() => Boolean(analyticsData.value))
    const hasInsights = computed(() => Boolean(customerInsights.value))

    const customers = computed(() => {
        if (!analyticsData.value) return []
        return analyticsData.value.customers || []
    })

    const segments = computed(() => {
        if (!analyticsData.value) return {}
        return analyticsData.value.segments || {}
    })

    const topCustomers = computed(() => {
        if (!analyticsData.value) return []
        return analyticsData.value.topCustomers || []
    })

    const selectedCustomer = computed(() => {
        if (!selectedCustomerId.value || !analyticsData.value) return null
        return analyticsData.value.customers.find(c => c.customerId === selectedCustomerId.value)
    })

    const analyzeCustomers = async ({ startDate, endDate } = {}) => {
        loading.value = true
        error.value = null

        try {
            const data = await customerAnalyticsService.analyzeCustomers({
                startDate,
                endDate
            })

            analyticsData.value = data
            logger.log('[CustomerAnalytics] Analysis completed', {
                customerCount: data.customers.length,
                period: data.period
            })
            return data
        } catch (err) {
            error.value = err.message || 'Không thể phân tích khách hàng'
            logger.error('[CustomerAnalytics] Failed to analyze', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    const getInsights = async ({ customerId, startDate, endDate } = {}) => {
        loading.value = true
        error.value = null

        try {
            const data = await customerAnalyticsService.getCustomerInsights({
                customerId,
                startDate,
                endDate
            })

            customerInsights.value = data
            selectedCustomerId.value = customerId
            logger.log('[CustomerAnalytics] Insights loaded', { customerId })
            return data
        } catch (err) {
            error.value = err.message || 'Không thể lấy insights'
            logger.error('[CustomerAnalytics] Failed to get insights', err)
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
            const exportData = await customerAnalyticsService.exportCustomerList(analyticsData.value)
            return exportData
        } catch (err) {
            logger.error('[CustomerAnalytics] Failed to export', err)
            throw err
        }
    }

    const setSelectedCustomer = (customerId) => {
        selectedCustomerId.value = customerId
    }

    const reset = () => {
        analyticsData.value = null
        customerInsights.value = null
        selectedCustomerId.value = null
        error.value = null
    }

    return {
        loading,
        error,
        analyticsData,
        customerInsights,
        selectedCustomerId,
        hasData,
        hasInsights,
        customers,
        segments,
        topCustomers,
        selectedCustomer,
        analyzeCustomers,
        getInsights,
        exportReport,
        setSelectedCustomer,
        reset
    }
})

