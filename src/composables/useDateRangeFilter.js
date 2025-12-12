/**
 * Composable for Date Range Filter
 * Chuẩn hóa date range filter pattern cho các pages
 */

import { ref, computed } from 'vue'

/**
 * Composable for managing date range filters
 * @param {Object} options - Options
 * @param {number} options.defaultDays - Default number of days (default: 7)
 * @param {string} options.startDate - Initial start date (optional)
 * @param {string} options.endDate - Initial end date (optional)
 * @returns {Object} Date range filter utilities
 */
export const useDateRangeFilter = (defaultPreset = '90d') => {
    // Support both old and new API
    let defaultDays = 90
    let initialStartDate = null
    let initialEndDate = null

    if (typeof defaultPreset === 'object') {
        defaultDays = defaultPreset.defaultDays || 90
        initialStartDate = defaultPreset.startDate
        initialEndDate = defaultPreset.endDate
    } else if (typeof defaultPreset === 'string') {
        // Handle preset strings like '90d', '30d'
        const match = defaultPreset.match(/(\d+)d/)
        if (match) {
            defaultDays = parseInt(match[1], 10)
        }
    }

    /**
     * Get today's date in YYYY-MM-DD format
     */
    const today = () => new Date().toISOString().split('T')[0]

    /**
     * Shift date by number of days
     * @param {Date|string} baseDate - Base date
     * @param {number} daysDiff - Number of days to shift (negative for past)
     * @returns {string} Date in YYYY-MM-DD format
     */
    const shiftDateFrom = (baseDate, daysDiff) => {
        const date = baseDate instanceof Date ? baseDate : new Date(baseDate)
        date.setDate(date.getDate() + daysDiff)
        return date.toISOString().split('T')[0]
    }

    /**
     * Format date to YYYY-MM-DD
     * @param {Date} date - Date object
     * @returns {string} Formatted date
     */
    const formatDate = (date) => date.toISOString().split('T')[0]

    /**
     * Shift date from today by number of days
     * @param {number} days - Number of days to shift
     * @returns {string} Date in YYYY-MM-DD format
     */
    const shiftDate = (days) => shiftDateFrom(new Date(), days)

    /**
     * Initialize filters
     */
    const filters = ref({
        startDate: initialStartDate || shiftDate(-defaultDays),
        endDate: initialEndDate || today()
    })

    /**
     * Date range presets
     */
    const presets = [
        { value: '30d', label: '30 ngày', days: 30 },
        { value: '90d', label: '90 ngày', days: 90 },
        { value: '180d', label: '180 ngày', days: 180 },
        { value: '365d', label: '1 năm', days: 365 }
    ]

    const selectedPreset = ref(defaultPreset)
    const validationError = ref('')

    /**
     * Apply preset
     * @param {string} presetValue - Preset value ('30d', '90d', etc)
     */
    const applyPreset = (presetValue) => {
        selectedPreset.value = presetValue
        const preset = presets.find(p => p.value === presetValue)
        if (preset) {
            filters.value = {
                startDate: shiftDate(-preset.days),
                endDate: today()
            }
            validateDates()
        }
    }

    /**
     * Validate dates
     */
    const validateDates = () => {
        validationError.value = ''

        if (!filters.value.startDate || !filters.value.endDate) {
            return
        }

        const start = new Date(filters.value.startDate)
        const end = new Date(filters.value.endDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (start > end) {
            validationError.value = 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc'
            return
        }

        if (end > today) {
            validationError.value = 'Ngày kết thúc không được vượt quá hôm nay'
        }
    }

    const canAnalyze = computed(() => filters.value.startDate && filters.value.endDate && !validationError.value)

    /**
     * Reset filters to default
     */
    const resetFilters = () => {
        filters.value = {
            startDate: shiftDate(-defaultDays),
            endDate: today()
        }
    }

    /**
     * Validate date range
     * @returns {Object} Validation result
     */
    const validate = computed(() => {
        const { startDate, endDate } = filters.value

        if (!startDate || !endDate) {
            return {
                valid: false,
                error: 'Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.'
            }
        }

        const start = new Date(startDate)
        const end = new Date(endDate)

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return {
                valid: false,
                error: 'Ngày không hợp lệ.'
            }
        }

        if (start > end) {
            return {
                valid: false,
                error: 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'
            }
        }

        return {
            valid: true,
            error: null
        }
    })

    /**
     * Compute previous range for comparison
     * @returns {Object} Previous date range
     */
    const computePreviousRange = () => {
        const start = new Date(`${filters.value.startDate}T00:00:00`)
        const end = new Date(`${filters.value.endDate}T00:00:00`)
        const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)))
        const previousEnd = shiftDateFrom(start, -1)
        const previousStart = shiftDateFrom(previousEnd, -diffDays)

        return {
            previousStart,
            previousEnd
        }
    }

    /**
     * Get date range in days
     * @returns {number} Number of days in range
     */
    const rangeDays = computed(() => {
        const start = new Date(filters.value.startDate)
        const end = new Date(filters.value.endDate)
        const diffTime = Math.abs(end - start)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    })

    return {
        filters,
        presets,
        selectedPreset,
        validationError,
        today,
        shiftDate,
        shiftDateFrom,
        formatDate,
        applyPreset,
        resetFilters,
        validate,
        validateDates,
        canAnalyze,
        computePreviousRange,
        rangeDays
    }
}

