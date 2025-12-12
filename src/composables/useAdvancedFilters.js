import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSearchStore } from '@/store/search'
import { cleanParams } from '@/api/utils'

/**
 * Composable for advanced filters with preset management
 * @param {Object} options - Options
 * @param {string} options.pageName - Page name for presets
 * @param {Object} options.defaultFilters - Default filter values
 * @param {Function} options.onFilterChange - Callback when filters change
 */
export function useAdvancedFilters (options = {}) {
    const { pageName, defaultFilters = {}, onFilterChange } = options
    const route = useRoute()
    const router = useRouter()
    const searchStore = useSearchStore()

    const filters = ref({ ...defaultFilters })
    const activePresetId = ref(null)
    const showFilterPanel = ref(false)

    // Load saved filters from localStorage
    const loadSavedFilters = () => {
        try {
            const saved = localStorage.getItem(`filters:${pageName}`)
            if (saved) {
                const parsed = JSON.parse(saved)
                filters.value = { ...defaultFilters, ...parsed }
            }
        } catch (err) {
            console.warn('[useAdvancedFilters] Failed to load saved filters', err)
        }
    }

    // Save filters to localStorage
    const saveFilters = () => {
        try {
            localStorage.setItem(`filters:${pageName}`, JSON.stringify(filters.value))
        } catch (err) {
            console.warn('[useAdvancedFilters] Failed to save filters', err)
        }
    }

    // Sync filters with URL query params
    const syncWithQuery = () => {
        const query = route.query
        Object.keys(defaultFilters).forEach(key => {
            if (query[key] !== undefined) {
                const value = query[key]
                // Try to parse as number or boolean
                if (value === 'true') {
                    filters.value[key] = true
                } else if (value === 'false') {
                    filters.value[key] = false
                } else if (!isNaN(value) && value !== '') {
                    filters.value[key] = Number(value)
                } else {
                    filters.value[key] = value
                }
            }
        })
    }

    // Update URL with current filters
    const updateQuery = () => {
        const query = { ...route.query }
        const clean = cleanParams(filters.value)

        Object.keys(defaultFilters).forEach(key => {
            if (clean[key] !== undefined && clean[key] !== null && clean[key] !== '') {
                query[key] = String(clean[key])
            } else {
                delete query[key]
            }
        })

        router.replace({ query })
    }

    // Apply filters
    const applyFilters = () => {
        saveFilters()
        updateQuery()
        if (onFilterChange) {
            onFilterChange(filters.value)
        }
        showFilterPanel.value = false
    }

    // Clear all filters
    const clearFilters = () => {
        filters.value = { ...defaultFilters }
        saveFilters()
        updateQuery()
        activePresetId.value = null
        if (onFilterChange) {
            onFilterChange(filters.value)
        }
    }

    // Save current filters as preset
    const savePreset = (presetName) => {
        const preset = searchStore.saveFilterPreset(pageName, presetName, filters.value)
        activePresetId.value = preset.id
        return preset
    }

    // Load preset
    const loadPreset = (preset) => {
        filters.value = { ...defaultFilters, ...preset.filters }
        activePresetId.value = preset.id
        applyFilters()
    }

    // Delete preset
    const deletePreset = (presetId) => {
        searchStore.deleteFilterPreset(pageName, presetId)
        if (activePresetId.value === presetId) {
            activePresetId.value = null
        }
    }

    // Get filter presets
    const filterPresets = computed(() => searchStore.getFilterPresets(pageName))

    // Sanitized filters (remove empty values)
    const sanitizedFilters = computed(() => cleanParams(filters.value))

    // Check if filters are active
    const hasActiveFilters = computed(() => Object.keys(defaultFilters).some(key => {
        const defaultValue = defaultFilters[key]
        const currentValue = filters.value[key]
        return currentValue !== defaultValue &&
                   currentValue !== null &&
                   currentValue !== undefined &&
                   currentValue !== ''
    }))

    // Watch filters and update query (debounced)
    let updateTimeout = null
    watch(filters, () => {
        clearTimeout(updateTimeout)
        updateTimeout = setTimeout(() => {
            updateQuery()
        }, 500)
    }, { deep: true })

    // Initialize
    onMounted(() => {
        syncWithQuery()
        loadSavedFilters()
    })

    return {
        // State
        filters,
        activePresetId,
        showFilterPanel,
        filterPresets,
        sanitizedFilters,
        hasActiveFilters,

        // Actions
        applyFilters,
        clearFilters,
        savePreset,
        loadPreset,
        deletePreset,
        updateQuery
    }
}

