import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as staffPerformanceService from '@/api/staffPerformanceService'
import logger from '@/utils/logger'

export const useStaffPerformanceStore = defineStore('staffPerformance', () => {
    const loading = ref(false)
    const error = ref(null)
    const performanceData = ref(null)
    const trendsData = ref(null)
    const comparisonData = ref(null)
    const selectedStaffId = ref(null)
    
    const hasData = computed(() => !!performanceData.value)
    const hasTrends = computed(() => !!trendsData.value)
    const hasComparison = computed(() => !!comparisonData.value)
    
    const staffList = computed(() => {
        if (!performanceData.value) return []
        return performanceData.value.staff || []
    })
    
    const teamMetrics = computed(() => {
        if (!performanceData.value) return null
        return performanceData.value.teamMetrics || null
    })
    
    const topPerformers = computed(() => {
        if (!performanceData.value) return []
        return performanceData.value.staff.slice(0, 5)
    })
    
    const selectedStaff = computed(() => {
        if (!selectedStaffId.value || !performanceData.value) return null
        return performanceData.value.staff.find(s => s.userId === selectedStaffId.value)
    })
    
    const analyzePerformance = async ({ startDate, endDate, userId = null } = {}) => {
        loading.value = true
        error.value = null
        
        try {
            const data = await staffPerformanceService.getStaffPerformance({
                startDate,
                endDate,
                userId
            })
            
            performanceData.value = data
            selectedStaffId.value = userId
            logger.log('[StaffPerformance] Analysis completed', { 
                staffCount: data.staff.length,
                period: data.period 
            })
            return data
        } catch (err) {
            error.value = err.message || 'Không thể phân tích hiệu suất'
            logger.error('[StaffPerformance] Failed to analyze', err)
            throw err
        } finally {
            loading.value = false
        }
    }
    
    const getTrends = async ({ userId, startDate, endDate, period = 'week' } = {}) => {
        loading.value = true
        error.value = null
        
        try {
            const data = await staffPerformanceService.getPerformanceTrends({
                userId,
                startDate,
                endDate,
                period
            })
            
            trendsData.value = data
            logger.log('[StaffPerformance] Trends loaded', { 
                userId, 
                dataPoints: data.length 
            })
            return data
        } catch (err) {
            error.value = err.message || 'Không thể lấy xu hướng'
            logger.error('[StaffPerformance] Failed to get trends', err)
            throw err
        } finally {
            loading.value = false
        }
    }
    
    const compareStaff = async ({ userIds, startDate, endDate } = {}) => {
        loading.value = true
        error.value = null
        
        try {
            const data = await staffPerformanceService.getStaffComparison({
                userIds,
                startDate,
                endDate
            })
            
            comparisonData.value = data
            logger.log('[StaffPerformance] Comparison completed', { 
                staffCount: data.staff.length 
            })
            return data
        } catch (err) {
            error.value = err.message || 'Không thể so sánh nhân viên'
            logger.error('[StaffPerformance] Failed to compare', err)
            throw err
        } finally {
            loading.value = false
        }
    }
    
    const exportReport = async () => {
        if (!performanceData.value) {
            throw new Error('Chưa có dữ liệu để xuất')
        }
        
        try {
            const exportData = await staffPerformanceService.exportPerformanceReport(performanceData.value)
            return exportData
        } catch (err) {
            logger.error('[StaffPerformance] Failed to export', err)
            throw err
        }
    }
    
    const setSelectedStaff = (userId) => {
        selectedStaffId.value = userId
    }
    
    const reset = () => {
        performanceData.value = null
        trendsData.value = null
        comparisonData.value = null
        selectedStaffId.value = null
        error.value = null
    }
    
    return {
        loading,
        error,
        performanceData,
        trendsData,
        comparisonData,
        selectedStaffId,
        hasData,
        hasTrends,
        hasComparison,
        staffList,
        teamMetrics,
        topPerformers,
        selectedStaff,
        analyzePerformance,
        getTrends,
        compareStaff,
        exportReport,
        setSelectedStaff,
        reset
    }
})

