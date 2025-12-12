import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as realTimeDashboardService from '@/api/realTimeDashboardService'
import logger from '@/utils/logger'
import { useAuthStore } from './auth'

export const useRealTimeDashboardStore = defineStore('realTimeDashboard', () => {
    const loading = ref(false)
    const error = ref(null)
    const dashboardData = ref(null)
    const autoRefreshEnabled = ref(true)
    const refreshInterval = ref(30000)
    const lastRefreshTime = ref(null)

    const authStore = useAuthStore()

    const hasData = computed(() => Boolean(dashboardData.value))

    const kpis = computed(() => {
        if (!dashboardData.value) return null
        return dashboardData.value.kpis || null
    })

    const alerts = computed(() => {
        if (!dashboardData.value) return []
        return dashboardData.value.alerts || []
    })

    const criticalAlerts = computed(() => alerts.value.filter(a => a.type === 'critical'))

    const warningAlerts = computed(() => alerts.value.filter(a => a.type === 'warning'))

    const pendingOrders = computed(() => {
        if (!dashboardData.value) return []
        return dashboardData.value.pendingOrders || []
    })

    const lowStockItems = computed(() => {
        if (!dashboardData.value) return []
        return dashboardData.value.lowStockItems || []
    })

    const tables = computed(() => {
        if (!dashboardData.value) return []
        return dashboardData.value.tables || []
    })

    const currentShift = computed(() => {
        if (!dashboardData.value) return null
        return dashboardData.value.currentShift || null
    })

    const hourlyRevenue = computed(() => {
        if (!dashboardData.value) return []
        return dashboardData.value.hourlyRevenue || []
    })

    const lastUpdated = computed(() => {
        if (!dashboardData.value) return null
        return dashboardData.value.lastUpdated || null
    })

    const refreshDashboard = async () => {
        if (loading.value) return

        loading.value = true
        error.value = null

        try {
            const userRole = authStore.user?.role || 'ROLE_STAFF'
            const userId = authStore.user?.id || null

            const data = await realTimeDashboardService.getRealTimeDashboard(userRole, userId)

            dashboardData.value = data
            lastRefreshTime.value = new Date()

            logger.log('[RealTimeDashboard] Data refreshed', {
                kpis: data.kpis,
                alertsCount: data.alerts.length,
                timestamp: data.lastUpdated
            })

            return data
        } catch (err) {
            error.value = err.message || 'Không thể tải dữ liệu dashboard'
            logger.error('[RealTimeDashboard] Failed to refresh', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    const getHistoricalComparison = async (compareType = 'yesterday') => {
        try {
            const data = await realTimeDashboardService.getHistoricalComparison(compareType)
            return data
        } catch (err) {
            logger.error('[RealTimeDashboard] Failed to get comparison', err)
            throw err
        }
    }

    const setAutoRefresh = (enabled) => {
        autoRefreshEnabled.value = enabled
    }

    const setRefreshInterval = (interval) => {
        refreshInterval.value = interval
    }

    const reset = () => {
        dashboardData.value = null
        error.value = null
        lastRefreshTime.value = null
    }

    return {
        loading,
        error,
        dashboardData,
        autoRefreshEnabled,
        refreshInterval,
        lastRefreshTime,
        hasData,
        kpis,
        alerts,
        criticalAlerts,
        warningAlerts,
        pendingOrders,
        lowStockItems,
        tables,
        currentShift,
        hourlyRevenue,
        lastUpdated,
        refreshDashboard,
        getHistoricalComparison,
        setAutoRefresh,
        setRefreshInterval,
        reset
    }
})

