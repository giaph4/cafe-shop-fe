import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDateRangeFilter } from './useDateRangeFilter'

/**
 * Composable for reporting logic
 * Handles date filtering, data fetching, and common reporting operations
 */
export function useReporting (options = {}) {
    const { t } = useI18n()
    const {
        filters,
        presets,
        selectedPreset,
        validationError,
        applyPreset,
        validateDates,
        canAnalyze
    } = useDateRangeFilter(options.defaultPreset || '90d')

    const loading = ref(false)
    const error = ref(null)
    const hasData = ref(false)

    const handleAnalyze = async (analyzeFn) => {
        if (!canAnalyze.value || validationError.value) return

        loading.value = true
        error.value = null

        try {
            const result = await analyzeFn({
                startDate: filters.value.startDate,
                endDate: filters.value.endDate
            })
            hasData.value = Boolean(result)
            return result
        } catch (err) {
            error.value = err.message || t('common.status.error')
            throw err
        } finally {
            loading.value = false
        }
    }

    const handleRefresh = (analyzeFn) => handleAnalyze(analyzeFn)

    const reset = () => {
        hasData.value = false
        error.value = null
    }

    return {
        filters,
        presets,
        selectedPreset,
        validationError,
        loading,
        error,
        hasData,
        applyPreset,
        validateDates,
        canAnalyze,
        handleAnalyze,
        handleRefresh,
        reset
    }
}

