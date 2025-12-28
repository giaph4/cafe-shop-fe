/**
 * Composable quản lý bộ lọc khoảng thời gian
 * Chuẩn hóa date range filter pattern cho các pages
 */

import { ref, computed } from 'vue'

/**
 * Composable quản lý bộ lọc khoảng thời gian
 * @param {Object} options - Tùy chọn cấu hình
 * @param {number} options.defaultDays - Số ngày mặc định (default: 90)
 * @param {string} options.startDate - Ngày bắt đầu ban đầu (tùy chọn)
 * @param {string} options.endDate - Ngày kết thúc ban đầu (tùy chọn)
 * @returns {Object} Các tiện ích bộ lọc khoảng thời gian
 */
export const useDateRangeFilter = (defaultPreset = '90d') => {
    // Hỗ trợ cả API cũ và mới
    let defaultDays = 90
    let initialStartDate = null
    let initialEndDate = null

    if (typeof defaultPreset === 'object') {
        defaultDays = defaultPreset.defaultDays || 90
        initialStartDate = defaultPreset.startDate
        initialEndDate = defaultPreset.endDate
    } else if (typeof defaultPreset === 'string') {
        // Xử lý chuỗi preset như '90d', '30d'
        const match = defaultPreset.match(/(\d+)d/)
        if (match) {
            defaultDays = parseInt(match[1], 10)
        }
    }

    /**
     * Lấy ngày hôm nay theo format YYYY-MM-DD
     */
    const today = () => new Date().toISOString().split('T')[0]

    /**
     * Dịch chuyển ngày theo số ngày
     * @param {Date|string} baseDate - Ngày gốc
     * @param {number} daysDiff - Số ngày dịch chuyển (âm cho quá khứ)
     * @returns {string} Ngày theo format YYYY-MM-DD
     */
    const shiftDateFrom = (baseDate, daysDiff) => {
        const date = baseDate instanceof Date ? baseDate : new Date(baseDate)
        date.setDate(date.getDate() + daysDiff)
        return date.toISOString().split('T')[0]
    }

    /**
     * Format date thành YYYY-MM-DD
     * @param {Date} date - Date object
     * @returns {string} Ngày đã format
     */
    const formatDate = (date) => date.toISOString().split('T')[0]

    /**
     * Dịch chuyển từ ngày hôm nay theo số ngày
     * @param {number} days - Số ngày dịch chuyển
     * @returns {string} Ngày theo format YYYY-MM-DD
     */
    const shiftDate = (days) => shiftDateFrom(new Date(), days)

    /**
     * Khởi tạo bộ lọc
     */
    const filters = ref({
        startDate: initialStartDate || shiftDate(-defaultDays),
        endDate: initialEndDate || today()
    })

    /**
     * Các preset khoảng thời gian
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
     * Áp dụng preset
     * @param {string} presetValue - Giá trị preset ('30d', '90d', etc)
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
     * Kiểm tra tính hợp lệ của ngày
     */
    const validateDates = () => {
        validationError.value = ''

        if (!filters.value.startDate || !filters.value.endDate) {
            return
        }

        const start = new Date(filters.value.startDate)
        const end = new Date(filters.value.endDate)
        const todayDate = new Date()
        todayDate.setHours(0, 0, 0, 0)

        if (start > end) {
            validationError.value = 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc'
            return
        }

        if (end > todayDate) {
            validationError.value = 'Ngày kết thúc không được vượt quá hôm nay'
        }
    }

    const canAnalyze = computed(() => filters.value.startDate && filters.value.endDate && !validationError.value)

    /**
     * Reset bộ lọc về mặc định
     */
    const resetFilters = () => {
        filters.value = {
            startDate: shiftDate(-defaultDays),
            endDate: today()
        }
    }

    /**
     * Kiểm tra tính hợp lệ của khoảng thời gian
     * @returns {Object} Kết quả kiểm tra
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
     * Tính khoảng thời gian trước đó để so sánh
     * @returns {Object} Khoảng thời gian trước
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
     * Lấy số ngày trong khoảng thời gian
     * @returns {number} Số ngày trong khoảng
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
