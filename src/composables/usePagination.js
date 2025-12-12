import { computed, ref, watch } from 'vue'

export const PaginationMode = Object.freeze({
    ZERO_BASED: 'zero-based',
    ONE_BASED: 'one-based'
})

const hasSessionStorage = () => typeof window !== 'undefined' && window.sessionStorage

export function usePagination (options = {}) {
    const mode = options.mode ?? PaginationMode.ZERO_BASED
    const initialPage = options.initialPage ?? (mode === PaginationMode.ONE_BASED ? 1 : 0)
    const initialPageSize = options.pageSize ?? 10
    const persistKey = options.persistKey || ''

    const currentPage = ref(initialPage)
    const currentPageBeforeAction = ref(initialPage)
    const previousPage = ref(initialPage)
    const pageSize = ref(initialPageSize)
    const totalPages = ref(Math.max(1, Number.isFinite(options.totalPages) ? Math.floor(options.totalPages) : 1))
    const totalElements = ref(Number.isFinite(options.totalElements) ? Math.max(0, Math.floor(options.totalElements)) : 0)

    const normalizeToZero = (value) => (mode === PaginationMode.ONE_BASED ? Number(value) - 1 : Number(value))
    const denormalizeFromZero = (value) => (mode === PaginationMode.ONE_BASED ? value + 1 : value)

    const zeroBasedPage = computed(() => clampZeroIndex(normalizeToZero(currentPage.value)))
    const oneBasedPage = computed(() => zeroBasedPage.value + 1)

    const maxZeroIndex = computed(() => Math.max(totalPages.value - 1, 0))

    function clampZeroIndex (value) {
        const numeric = Number(value)
        if (!Number.isFinite(numeric)) return 0
        return Math.min(Math.max(Math.floor(numeric), 0), maxZeroIndex.value)
    }

    function clampPage (value) {
        return denormalizeFromZero(clampZeroIndex(normalizeToZero(value)))
    }

    const canGoPrevious = computed(() => zeroBasedPage.value > 0)
    const canGoNext = computed(() => zeroBasedPage.value < maxZeroIndex.value)

    const setPage = (page, opts = {}) => {
        const target = clampPage(page)
        if (target === currentPage.value) return target

        if (opts.remember !== false) {
            currentPageBeforeAction.value = currentPage.value
        }

        previousPage.value = currentPage.value
        currentPage.value = target
        return target
    }

    const setPageFromZero = (page, opts = {}) => setPage(denormalizeFromZero(page), opts)
    const setPageFromOne = (page, opts = {}) => setPage(page, opts)

    const goToFirst = () => setPage(mode === PaginationMode.ONE_BASED ? 1 : 0)
    const goToPrevious = () => canGoPrevious.value && setPageFromZero(zeroBasedPage.value - 1)
    const goToNext = () => canGoNext.value && setPageFromZero(zeroBasedPage.value + 1)
    const goToLast = () => setPageFromZero(maxZeroIndex.value)

    const restorePreviousPage = () => setPage(previousPage.value, { remember: false })

    const resetPage = () => setPage(mode === PaginationMode.ONE_BASED ? 1 : 0, { remember: false })

    const updatePageSize = (size, opts = {}) => {
        const numericSize = Number(size)
        if (!Number.isFinite(numericSize) || numericSize <= 0) return
        pageSize.value = Math.floor(numericSize)
        if (opts.reset === false) {
            return
        }
        resetPage()
    }

    const updateFromResponse = ({ page, totalPages: total, totalElements: totalItems }) => {
        let adjusted = false

        if (Number.isFinite(total)) {
            const normalizedTotal = Math.max(1, Math.floor(total))
            if (normalizedTotal !== totalPages.value) {
                totalPages.value = normalizedTotal
                adjusted = true
            }
        }

        if (Number.isFinite(totalItems)) {
            const normalizedElements = Math.max(0, Math.floor(totalItems))
            if (normalizedElements !== totalElements.value) {
                totalElements.value = normalizedElements
            }
        }

        const desiredPage = Number.isFinite(page)
            ? denormalizeFromZero(mode === PaginationMode.ONE_BASED ? page : normalizeToZero(page))
            : currentPage.value

        const clamped = clampPage(desiredPage)

        if (clamped !== currentPage.value) {
            previousPage.value = currentPage.value
            currentPage.value = clamped
            adjusted = true
        }

        return {
            adjusted,
            currentPage: currentPage.value,
            zeroBasedPage: zeroBasedPage.value,
            totalPages: totalPages.value
        }
    }

    const rememberCurrent = () => {
        currentPageBeforeAction.value = currentPage.value
        if (persistKey && hasSessionStorage()) {
            window.sessionStorage.setItem(`${persistKey}::remembered`, String(currentPage.value))
        }
    }

    const restoreRemembered = () => {
        if (persistKey && hasSessionStorage()) {
            const stored = window.sessionStorage.getItem(`${persistKey}::remembered`)
            if (stored !== null) {
                setPage(Number(stored), { remember: false })
                return
            }
        }
        setPage(currentPageBeforeAction.value, { remember: false })
    }

    const syncQuery = (route, router, options = {}) => {
        if (!route || !router) return

        const pageParam = options.pageParam ?? 'page'
        const sizeParam = options.sizeParam ?? 'size'
        const queryMode = options.queryMode ?? PaginationMode.ONE_BASED
        let updatingQuery = false
        let updatingState = false

        const decodePage = (value) => {
            const numeric = Number(value)
            if (!Number.isFinite(numeric)) return undefined
            const zeroIndex = queryMode === PaginationMode.ZERO_BASED ? numeric : numeric - 1
            return denormalizeFromZero(zeroIndex)
        }

        const encodePage = (value) => {
            const zeroIndex = normalizeToZero(value)
            return queryMode === PaginationMode.ZERO_BASED ? zeroIndex : zeroIndex + 1
        }

        const applyQuery = (query) => {
            updatingState = true
            if (query[pageParam] !== undefined) {
                const decoded = decodePage(query[pageParam])
                if (decoded !== undefined) {
                    setPage(decoded, { remember: false })
                }
            }
            if (query[sizeParam] !== undefined) {
                updatePageSize(query[sizeParam], { reset: false })
            }
            updatingState = false
        }

        applyQuery(route.query)

        watch(
            () => route.query,
            (nextQuery) => {
                if (updatingQuery) return
                applyQuery(nextQuery)
            },
            { deep: true }
        )

        watch([currentPage, pageSize], ([page, size]) => {
            if (updatingState) return
            const nextQuery = {
                ...route.query,
                [pageParam]: encodePage(page).toString(),
                [sizeParam]: size.toString()
            }
            updatingQuery = true
            router.replace({ query: nextQuery }).finally(() => {
                updatingQuery = false
            })
        })
    }

    if (persistKey && hasSessionStorage()) {
        const stored = window.sessionStorage.getItem(persistKey)
        if (stored !== null) {
            currentPage.value = clampPage(Number(stored))
        }

        watch(currentPage, (value) => {
            window.sessionStorage.setItem(persistKey, String(value))
        })
    }

    return {
        mode,
        currentPage,
        currentPageBeforeAction,
        previousPage,
        pageSize,
        totalPages,
        totalElements,
        zeroBasedPage,
        oneBasedPage,
        canGoPrevious,
        canGoNext,
        setPage,
        setPageFromZero,
        setPageFromOne,
        goToFirst,
        goToPrevious,
        goToNext,
        goToLast,
        restorePreviousPage,
        resetPage,
        updatePageSize,
        updateFromResponse,
        rememberCurrent,
        restoreRemembered,
        syncQuery
    }
}
