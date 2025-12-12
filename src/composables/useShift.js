import { ref, computed } from 'vue'
import { SHIFT_STATUS, SHIFT_STATUS_LABELS } from '@/constants/status'

/**
 * Composable for shift logic
 * Handles shift operations, calculations, and state management
 */
export function useShift () {
    const currentShift = ref(null)
    const shifts = ref([])
    const loading = ref(false)
    const error = ref(null)

    // Computed
    const hasActiveShift = computed(() => currentShift.value?.status === SHIFT_STATUS.IN_PROGRESS)

    const todayShifts = computed(() => {
        const today = new Date().toISOString().split('T')[0]
        return shifts.value.filter(shift => {
            const shiftDate = new Date(shift.startTime).toISOString().split('T')[0]
            return shiftDate === today
        })
    })

    const upcomingShifts = computed(() => {
        const now = new Date()
        return shifts.value.filter(shift => {
            const startTime = new Date(shift.startTime)
            return startTime > now && shift.status === SHIFT_STATUS.SCHEDULED
        }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    })

    // Methods
    const getShiftStatusLabel = (status) => SHIFT_STATUS_LABELS[status] || status

    const canStartShift = (shift) => {
        if (!shift) return false
        const now = new Date()
        const startTime = new Date(shift.startTime)
        const timeDiff = startTime - now
        // Có thể bắt đầu 15 phút trước giờ bắt đầu
        return timeDiff <= 15 * 60 * 1000 && timeDiff >= -30 * 60 * 1000
    }

    const canEndShift = (shift) => {
        if (!shift) return false
        return shift.status === SHIFT_STATUS.IN_PROGRESS
    }

    const calculateShiftDuration = (startTime, endTime) => {
        if (!startTime || !endTime) return 0
        const start = new Date(startTime)
        const end = new Date(endTime)
        return Math.max(0, end - start) / (1000 * 60) // minutes
    }

    const formatShiftDuration = (minutes) => {
        if (minutes < 60) {
            return `${Math.round(minutes)} phút`
        }
        const hours = Math.floor(minutes / 60)
        const mins = Math.round(minutes % 60)
        return mins > 0 ? `${hours}h ${mins}p` : `${hours}h`
    }

    const getShiftTimeRange = (shift) => {
        if (!shift) return ''
        const start = new Date(shift.startTime)
        const end = shift.endTime ? new Date(shift.endTime) : null

        const startStr = start.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        })

        if (end) {
            const endStr = end.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            })
            return `${startStr} - ${endStr}`
        }

        return startStr
    }

    const setCurrentShift = (shift) => {
        currentShift.value = shift
    }

    const setShifts = (shiftsData) => {
        shifts.value = Array.isArray(shiftsData) ? shiftsData : []
    }

    const reset = () => {
        currentShift.value = null
        shifts.value = []
        error.value = null
    }

    return {
        // State
        currentShift,
        shifts,
        loading,
        error,

        // Computed
        hasActiveShift,
        todayShifts,
        upcomingShifts,

        // Methods
        getShiftStatusLabel,
        canStartShift,
        canEndShift,
        calculateShiftDuration,
        formatShiftDuration,
        getShiftTimeRange,
        setCurrentShift,
        setShifts,
        reset
    }
}

