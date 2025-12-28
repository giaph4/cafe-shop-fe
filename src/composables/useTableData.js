/**
 * Composable quản lý Server-side Pagination + Search + Filters
 * Hỗ trợ cả API có phân trang và không có phân trang
 *
 * @param {Object} options - Tùy chọn cấu hình
 * @param {Function} options.fetchFn - Hàm gọi API (async function)
 * @param {Object} options.initialFilters - Bộ lọc ban đầu
 * @param {number} options.initialPageSize - Số phần tử mỗi trang (default: 10)
 * @param {number} options.debounceMs - Thời gian debounce cho search (default: 500)
 * @param {boolean} options.syncUrl - Đồng bộ với URL (default: true)
 * @param {string} options.pageParam - Tên param page trong URL (default: 'page')
 * @param {string} options.sizeParam - Tên param size trong URL (default: 'size')
 * @param {string} options.searchParam - Tên param search trong URL (default: 'search')
 * @param {boolean} options.zeroBasedPage - Sử dụng zero-based page (default: true)
 * @param {boolean} options.enablePagination - Bật phân trang (default: true). Nếu false, sẽ fetch tất cả và làm client-side pagination
 * @returns {Object} Các utilities và state
 */

import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export function useTableData (options = {}) {
    const {
        fetchFn,
        initialFilters = {},
        initialPageSize = 10,
        debounceMs = 500,
        syncUrl = true,
        pageParam = 'page',
        sizeParam = 'size',
        searchParam = 'search',
        zeroBasedPage = true,
        enablePagination = true
    } = options

    if (typeof fetchFn !== 'function') {
        throw new Error('useTableData: fetchFn phải là một function')
    }

    const route = syncUrl ? useRoute() : null
    const router = syncUrl ? useRouter() : null

    // ========== REACTIVE STATE ==========
    const page = ref(0) // Luôn dùng zero-based internally
    const pageSize = ref(initialPageSize)
    const searchKeyword = ref('')
    const filters = ref({ ...initialFilters })

    // State cho API call
    const data = ref([])
    const loading = ref(false)
    const error = ref(null)
    const totalPages = ref(0)
    const totalElements = ref(0)

    // Phát hiện xem API có hỗ trợ phân trang không
    const supportsPagination = ref(true)

    // Debounce state
    const debouncedSearchKeyword = ref('')
    let searchDebounceTimer = null

    // URL sync flags (tránh infinite loop)
    let isUpdatingFromUrl = false
    let isUpdatingToUrl = false

    // ========== COMPUTED ==========
    /**
     * Query params để gọi API
     */
    const queryParams = computed(() => {
        const params = {}

        // Chỉ thêm page/size nếu enablePagination = true
        if (enablePagination) {
            params.page = page.value
            params.size = pageSize.value
        }

        // Thêm search keyword (đã debounce)
        if (debouncedSearchKeyword.value?.trim()) {
            params.keyword = debouncedSearchKeyword.value.trim()
            // Một số API dùng 'search' thay vì 'keyword'
            params.search = debouncedSearchKeyword.value.trim()
        }

        // Thêm filters (loại bỏ giá trị rỗng)
        Object.keys(filters.value).forEach(key => {
            const value = filters.value[key]
            if (value !== null && value !== undefined && value !== '') {
                params[key] = value
            }
        })

        return params
    })

    /**
     * Page hiển thị (one-based cho UI)
     */
    const displayPage = computed(() => page.value + 1)

    /**
     * Có thể đi tới trang trước
     */
    const canGoPrevious = computed(() => page.value > 0)

    /**
     * Có thể đi tới trang sau
     */
    const canGoNext = computed(() => page.value < totalPages.value - 1)

    // ========== DEBOUNCE SEARCH ==========
    /**
     * Debounce search keyword
     */
    const updateDebouncedSearch = () => {
        clearTimeout(searchDebounceTimer)
        searchDebounceTimer = setTimeout(() => {
            debouncedSearchKeyword.value = searchKeyword.value
        }, debounceMs)
    }

    // ========== URL SYNCHRONIZATION ==========
    /**
     * Đọc params từ URL và cập nhật state
     */
    const syncFromUrl = () => {
        if (!syncUrl || !route) return

        isUpdatingFromUrl = true

        try {
            const query = route.query

            // Đọc page
            if (query[pageParam] !== undefined) {
                const urlPage = parseInt(query[pageParam], 10)
                if (!isNaN(urlPage)) {
                    const zeroBased = zeroBasedPage ? urlPage : urlPage - 1
                    page.value = Math.max(0, zeroBased)
                }
            }

            // Đọc pageSize
            if (query[sizeParam] !== undefined) {
                const urlSize = parseInt(query[sizeParam], 10)
                if (!isNaN(urlSize) && urlSize > 0) {
                    pageSize.value = urlSize
                }
            }

            // Đọc search
            if (query[searchParam] !== undefined) {
                const searchValue = query[searchParam] || ''
                searchKeyword.value = searchValue
                debouncedSearchKeyword.value = searchValue
            }

            // Đọc filters từ URL
            Object.keys(initialFilters).forEach(key => {
                if (query[key] !== undefined) {
                    const value = query[key]
                    // Parse value
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
        } catch (err) {
            console.warn('[useTableData] Lỗi khi đọc URL:', err)
        } finally {
            isUpdatingFromUrl = false
        }
    }

    /**
     * Cập nhật URL từ state
     */
    const syncToUrl = () => {
        if (!syncUrl || !router || isUpdatingFromUrl) return

        isUpdatingToUrl = true

        try {
            const query = { ...route.query }

            // Cập nhật page (chỉ nếu enablePagination)
            if (enablePagination) {
                const pageValue = zeroBasedPage ? page.value : page.value + 1
                if (pageValue > 0 || query[pageParam]) {
                    query[pageParam] = String(pageValue)
                } else {
                    delete query[pageParam]
                }

                // Cập nhật pageSize
                if (pageSize.value !== initialPageSize || query[sizeParam]) {
                    query[sizeParam] = String(pageSize.value)
                } else {
                    delete query[sizeParam]
                }
            }

            // Cập nhật search
            if (debouncedSearchKeyword.value?.trim()) {
                query[searchParam] = debouncedSearchKeyword.value.trim()
            } else {
                delete query[searchParam]
            }

            // Cập nhật filters
            Object.keys(initialFilters).forEach(key => {
                const value = filters.value[key]
                const defaultValue = initialFilters[key]

                if (value !== null && value !== undefined && value !== '' && value !== defaultValue) {
                    query[key] = String(value)
                } else {
                    delete query[key]
                }
            })

            router.replace({ query }).finally(() => {
                isUpdatingToUrl = false
            })
        } catch (err) {
            console.warn('[useTableData] Lỗi khi cập nhật URL:', err)
            isUpdatingToUrl = false
        }
    }

    // ========== RESET PAGE LOGIC ==========
    /**
     * Reset page về 0 khi search hoặc filter thay đổi
     */
    const resetPageIfNeeded = () => {
        if (page.value > 0) {
            page.value = 0
        }
    }

    // ========== FETCH DATA ==========
    /**
     * Xử lý response từ API
     * Hỗ trợ nhiều format:
     * 1. Spring Boot Pageable: { content: [], totalPages, totalElements, ... }
     * 2. Array trực tiếp: []
     * 3. Object với data: { data: [] }
     */
    const processResponse = (response) => {
        if (!response) {
            return {
                data: [],
                totalPages: 0,
                totalElements: 0,
                supportsPagination: false
            }
        }

        // Format 1: Spring Boot Pageable
        if (response.content !== undefined) {
            return {
                data: Array.isArray(response.content) ? response.content : [],
                totalPages: response.totalPages || 0,
                totalElements: response.totalElements || 0,
                supportsPagination: true
            }
        }

        // Format 2: Array trực tiếp
        if (Array.isArray(response)) {
            // Nếu enablePagination = false, trả về toàn bộ array
            if (!enablePagination) {
                return {
                    data: response,
                    totalPages: 1,
                    totalElements: response.length,
                    supportsPagination: false
                }
            }

            // Nếu enablePagination = true, làm client-side pagination
            const startIndex = page.value * pageSize.value
            const endIndex = startIndex + pageSize.value
            const paginatedData = response.slice(startIndex, endIndex)

            return {
                data: paginatedData,
                totalPages: Math.ceil(response.length / pageSize.value) || 1,
                totalElements: response.length,
                supportsPagination: false
            }
        }

        // Format 3: Object với data property
        if (response.data !== undefined && Array.isArray(response.data)) {
            const allData = response.data

            if (!enablePagination) {
                return {
                    data: allData,
                    totalPages: 1,
                    totalElements: allData.length,
                    supportsPagination: false
                }
            }

            // Client-side pagination
            const startIndex = page.value * pageSize.value
            const endIndex = startIndex + pageSize.value
            const paginatedData = allData.slice(startIndex, endIndex)

            return {
                data: paginatedData,
                totalPages: Math.ceil(allData.length / pageSize.value) || 1,
                totalElements: allData.length,
                supportsPagination: false
            }
        }

        // Format không xác định - thử extract data
        const keys = Object.keys(response)
        const arrayKey = keys.find(key => Array.isArray(response[key]))

        if (arrayKey) {
            const allData = response[arrayKey]

            if (!enablePagination) {
                return {
                    data: allData,
                    totalPages: 1,
                    totalElements: allData.length,
                    supportsPagination: false
                }
            }

            const startIndex = page.value * pageSize.value
            const endIndex = startIndex + pageSize.value
            const paginatedData = allData.slice(startIndex, endIndex)

            return {
                data: paginatedData,
                totalPages: Math.ceil(allData.length / pageSize.value) || 1,
                totalElements: allData.length,
                supportsPagination: false
            }
        }

        // Fallback: trả về rỗng
        return {
            data: [],
            totalPages: 0,
            totalElements: 0,
            supportsPagination: false
        }
    }

    /**
     * Gọi API để lấy dữ liệu
     */
    const fetchData = async () => {
        if (!fetchFn) return

        loading.value = true
        error.value = null

        try {
            const params = queryParams.value
            if (import.meta.env.DEV) {
                console.log('[useTableData] Fetching data with params:', params)
            }
            const response = await fetchFn(params)

            if (import.meta.env.DEV) {
                console.log('[useTableData] Raw response:', {
                    type: typeof response,
                    isArray: Array.isArray(response),
                    hasContent: !!response?.content,
                    contentLength: response?.content?.length,
                    totalPages: response?.totalPages,
                    totalElements: response?.totalElements,
                    keys: response ? Object.keys(response) : []
                })
            }

            // Xử lý response
            const processed = processResponse(response)

            if (import.meta.env.DEV) {
                console.log('[useTableData] Processed response:', {
                    dataLength: processed.data?.length,
                    totalPages: processed.totalPages,
                    totalElements: processed.totalElements,
                    supportsPagination: processed.supportsPagination
                })
            }

            data.value = processed.data
            totalPages.value = processed.totalPages
            totalElements.value = processed.totalElements
            supportsPagination.value = processed.supportsPagination

            // Đảm bảo page không vượt quá totalPages
            if (page.value >= totalPages.value && totalPages.value > 0) {
                page.value = Math.max(0, totalPages.value - 1)
            }
        } catch (err) {
            console.error('[useTableData] Lỗi khi fetch data:', err)
            error.value = err
            data.value = []
            totalPages.value = 0
            totalElements.value = 0
            supportsPagination.value = true
        } finally {
            loading.value = false
        }
    }

    // ========== SMART WATCHERS ==========
    /**
     * Watch queryParams và tự động gọi API
     */
    let isInitialFetch = true
    watch(
        queryParams,
        () => {
            // Bỏ qua lần đầu vì onMounted đã gọi rồi
            if (isInitialFetch) {
                isInitialFetch = false
                return
            }
            fetchData()
        },
        { deep: true, immediate: false }
    )

    /**
     * Watch searchKeyword và debounce
     */
    watch(searchKeyword, () => {
        updateDebouncedSearch()
        resetPageIfNeeded()
    })

    /**
     * Watch debouncedSearchKeyword và sync URL
     */
    watch(debouncedSearchKeyword, () => {
        if (!isUpdatingFromUrl) {
            syncToUrl()
        }
    })

    /**
     * Watch filters và reset page
     */
    watch(
        filters,
        () => {
            resetPageIfNeeded()
            if (!isUpdatingFromUrl) {
                syncToUrl()
            }
        },
        { deep: true }
    )

    /**
     * Watch page và sync URL + fetch data
     */
    watch(page, () => {
        if (!isUpdatingFromUrl) {
            syncToUrl()
            // Gọi fetchData khi page thay đổi (trừ lần đầu)
            if (!isInitialFetch) {
                fetchData()
            }
        }
    })

    /**
     * Watch pageSize và reset page + sync URL + fetch data
     */
    watch(pageSize, () => {
        resetPageIfNeeded()
        if (!isUpdatingFromUrl) {
            syncToUrl()
            // Gọi fetchData khi pageSize thay đổi (trừ lần đầu)
            if (!isInitialFetch) {
                fetchData()
            }
        }
    })

    /**
     * Watch URL changes (khi user navigate hoặc F5)
     */
    if (syncUrl && route) {
        watch(
            () => route.query,
            () => {
                if (!isUpdatingToUrl) {
                    syncFromUrl()
                }
            },
            { deep: true }
        )
    }

    // ========== PUBLIC METHODS ==========
    /**
     * Thay đổi trang
     */
    const setPage = (newPage) => {
        const targetPage = zeroBasedPage ? newPage : newPage - 1
        page.value = Math.max(0, Math.min(targetPage, totalPages.value - 1))
    }

    /**
     * Đi tới trang trước
     */
    const goToPrevious = () => {
        if (canGoPrevious.value) {
            page.value--
        }
    }

    /**
     * Đi tới trang sau
     */
    const goToNext = () => {
        if (canGoNext.value) {
            page.value++
        }
    }

    /**
     * Đi tới trang đầu
     */
    const goToFirst = () => {
        page.value = 0
    }

    /**
     * Đi tới trang cuối
     */
    const goToLast = () => {
        page.value = Math.max(0, totalPages.value - 1)
    }

    /**
     * Thay đổi pageSize
     */
    const setPageSize = (newSize) => {
        const size = parseInt(newSize, 10)
        if (!isNaN(size) && size > 0) {
            pageSize.value = size
        }
    }

    /**
     * Cập nhật search keyword
     */
    const setSearchKeyword = (keyword) => {
        searchKeyword.value = keyword || ''
    }

    /**
     * Cập nhật filter
     */
    const setFilter = (key, value) => {
        filters.value[key] = value
    }

    /**
     * Cập nhật nhiều filters cùng lúc
     */
    const setFilters = (newFilters) => {
        filters.value = { ...filters.value, ...newFilters }
    }

    /**
     * Reset tất cả filters về giá trị ban đầu
     */
    const resetFilters = () => {
        filters.value = { ...initialFilters }
    }

    /**
     * Reset tất cả về trạng thái ban đầu
     */
    const reset = () => {
        page.value = 0
        pageSize.value = initialPageSize
        searchKeyword.value = ''
        debouncedSearchKeyword.value = ''
        filters.value = { ...initialFilters }
    }

    /**
     * Refresh dữ liệu (gọi lại API)
     */
    const refresh = () => {
        fetchData()
    }

    // ========== LIFECYCLE ==========
    onMounted(() => {
        // Đọc từ URL nếu có (phải gọi trước fetchData)
        if (syncUrl && route) {
            syncFromUrl()
        }

        // Gọi API lần đầu - đảm bảo luôn fetch data
        nextTick(() => {
            fetchData()
        })
    })

    onBeforeUnmount(() => {
        clearTimeout(searchDebounceTimer)
    })

    // ========== RETURN ==========
    return {
        // State
        data,
        loading,
        error,
        page: computed(() => page.value),
        displayPage,
        zeroBasedPage: computed(() => page.value), // Alias cho page (zero-based)
        currentPage: displayPage, // Alias cho displayPage (one-based)
        pageSize: computed(() => pageSize.value),
        searchKeyword: computed(() => searchKeyword.value),
        filters: computed(() => filters.value),
        queryParams,
        totalPages: computed(() => totalPages.value),
        totalElements: computed(() => totalElements.value),
        supportsPagination: computed(() => supportsPagination.value),
        canGoPrevious,
        canGoNext,

        // Methods
        setPage,
        goToPrevious,
        goToNext,
        goToFirst,
        goToLast,
        setPageSize,
        setSearchKeyword,
        setFilter,
        setFilters,
        resetFilters,
        reset,
        refresh,
        fetchData
    }
}
