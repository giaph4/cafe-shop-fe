import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSearchStore } from '@/store/search'
import { cleanParams } from '@/api/helpers'
import logger from '@/utils/logger'

/**
 * Composable quản lý bộ lọc nâng cao với preset
 * @param {Object} options - Tùy chọn cấu hình
 * @param {string} options.pageName - Tên trang để lưu presets
 * @param {Object} options.defaultFilters - Giá trị bộ lọc mặc định
 * @param {Function} options.onFilterChange - Callback khi bộ lọc thay đổi
 */
export function useAdvancedFilters (options = {}) {
    const { pageName, defaultFilters = {}, onFilterChange } = options
    const route = useRoute()
    const router = useRouter()
    const searchStore = useSearchStore()

    const filters = ref({ ...defaultFilters })
    const activePresetId = ref(null)
    const showFilterPanel = ref(false)

    // Tải bộ lọc đã lưu từ localStorage
    const loadSavedFilters = () => {
        try {
            const saved = localStorage.getItem(`filters:${pageName}`)
            if (saved) {
                const parsed = JSON.parse(saved)
                filters.value = { ...defaultFilters, ...parsed }
            }
        } catch (err) {
            logger.warn('[useAdvancedFilters] Không thể tải bộ lọc đã lưu', err)
        }
    }

    // Lưu bộ lọc vào localStorage
    const saveFilters = () => {
        try {
            localStorage.setItem(`filters:${pageName}`, JSON.stringify(filters.value))
        } catch (err) {
            logger.warn('[useAdvancedFilters] Không thể lưu bộ lọc', err)
        }
    }

    // Đồng bộ bộ lọc với URL query params
    const syncWithQuery = () => {
        const query = route.query
        Object.keys(defaultFilters).forEach(key => {
            if (query[key] !== undefined) {
                const value = query[key]
                // Thử parse thành number hoặc boolean
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

    // Cập nhật URL với bộ lọc hiện tại
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

    // Áp dụng bộ lọc
    const applyFilters = () => {
        saveFilters()
        updateQuery()
        if (onFilterChange) {
            onFilterChange(filters.value)
        }
        showFilterPanel.value = false
    }

    // Xóa tất cả bộ lọc
    const clearFilters = () => {
        filters.value = { ...defaultFilters }
        saveFilters()
        updateQuery()
        activePresetId.value = null
        if (onFilterChange) {
            onFilterChange(filters.value)
        }
    }

    // Lưu bộ lọc hiện tại thành preset
    const savePreset = (presetName) => {
        const preset = searchStore.saveFilterPreset(pageName, presetName, filters.value)
        activePresetId.value = preset.id
        return preset
    }

    // Tải preset
    const loadPreset = (preset) => {
        filters.value = { ...defaultFilters, ...preset.filters }
        activePresetId.value = preset.id
        applyFilters()
    }

    // Xóa preset
    const deletePreset = (presetId) => {
        searchStore.deleteFilterPreset(pageName, presetId)
        if (activePresetId.value === presetId) {
            activePresetId.value = null
        }
    }

    // Lấy danh sách presets bộ lọc
    const filterPresets = computed(() => searchStore.getFilterPresets(pageName))

    // Bộ lọc đã được sanitize (loại bỏ giá trị rỗng)
    const sanitizedFilters = computed(() => cleanParams(filters.value))

    // Kiểm tra có bộ lọc nào đang active không
    const hasActiveFilters = computed(() => Object.keys(defaultFilters).some(key => {
        const defaultValue = defaultFilters[key]
        const currentValue = filters.value[key]
        return currentValue !== defaultValue &&
            currentValue !== null &&
            currentValue !== undefined &&
            currentValue !== ''
    }))

    // Theo dõi bộ lọc và cập nhật query (debounced)
    let updateTimeout = null
    watch(filters, () => {
        clearTimeout(updateTimeout)
        updateTimeout = setTimeout(() => {
            updateQuery()
        }, 500)
    }, { deep: true })

    onBeforeUnmount(() => {
        clearTimeout(updateTimeout)
    })

    // Khởi tạo
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
