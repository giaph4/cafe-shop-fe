import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as shiftEfficiencyService from '@/api/shiftEfficiencyService'
import logger from '@/utils/logger'

export const useShiftEfficiencyStore = defineStore('shiftEfficiency', () => {
    const loading = ref(false)
    const error = ref(null)
    const efficiencyData = ref(null)

    const hasData = computed(() => Boolean(efficiencyData.value))

    const shifts = computed(() => {
        if (!efficiencyData.value) return []
        return efficiencyData.value.shifts || []
    })

    const hourlyAnalysis = computed(() => {
        if (!efficiencyData.value) return []
        return efficiencyData.value.hourlyAnalysis || []
    })

    const topShifts = computed(() => {
        if (!efficiencyData.value) return []
        return efficiencyData.value.topShifts || []
    })

    const lowEfficiencyShifts = computed(() => {
        if (!efficiencyData.value) return []
        return efficiencyData.value.lowEfficiencyShifts || []
    })

    const recommendations = computed(() => {
        if (!efficiencyData.value) return []
        return efficiencyData.value.recommendations || []
    })

    const summary = computed(() => {
        if (!efficiencyData.value) return null
        return efficiencyData.value.summary || null
    })

    const analyzeEfficiency = async ({ startDate, endDate } = {}) => {
        loading.value = true
        error.value = null

        try {
            const data = await shiftEfficiencyService.analyzeShiftEfficiency({
                startDate,
                endDate
            })

            efficiencyData.value = data
            logger.log('[ShiftEfficiency] Analysis completed', {
                shiftCount: data.shifts.length,
                period: data.period
            })
            return data
        } catch (err) {
            error.value = err.message || 'Không thể phân tích hiệu quả ca làm việc'
            logger.error('[ShiftEfficiency] Failed to analyze', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    const exportReport = async () => {
        if (!efficiencyData.value) {
            throw new Error('Chưa có dữ liệu để xuất')
        }

        try {
            const exportData = await shiftEfficiencyService.exportEfficiencyReport(efficiencyData.value)
            return exportData
        } catch (err) {
            logger.error('[ShiftEfficiency] Failed to export', err)
            throw err
        }
    }

    const reset = () => {
        efficiencyData.value = null
        error.value = null
    }

    return {
        loading,
        error,
        efficiencyData,
        hasData,
        shifts,
        hourlyAnalysis,
        topShifts,
        lowEfficiencyShifts,
        recommendations,
        summary,
        analyzeEfficiency,
        exportReport,
        reset
    }
})

