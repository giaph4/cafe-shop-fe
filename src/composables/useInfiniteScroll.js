import { ref, onMounted, onUnmounted, computed } from 'vue'
import logger from '@/utils/logger'

/**
 * Composable cho infinite scroll - tự động load thêm khi scroll đến cuối
 * @param {Function} loadMore - Function để load thêm dữ liệu (trả về Promise)
 * @param {Object} options - Options
 * @param {Number} options.threshold - Khoảng cách từ cuối để trigger load (px), mặc định 200
 * @param {Boolean} options.enabled - Bật/tắt infinite scroll, mặc định true
 * @param {Number} options.pageSize - Số lượng items mỗi lần load, mặc định 20
 */
export function useInfiniteScroll(loadMore, options = {}) {
    const {
        threshold = 200,
        enabled = true,
        pageSize = 20
    } = options

    // pageSize có thể là number hoặc computed/ref
    const getPageSize = () => {
        if (typeof pageSize === 'function') return pageSize()
        if (typeof pageSize === 'object' && 'value' in pageSize) return pageSize.value
        return pageSize
    }

    const loading = ref(false)
    const hasMore = ref(true)
    const error = ref(null)
    const page = ref(0)
    const items = ref([])
    const observer = ref(null)
    const sentinelRef = ref(null)

    const isLoading = computed(() => loading.value)
    const canLoadMore = computed(() => hasMore.value && !loading.value && enabled)

    const loadNextPage = async () => {
        if (!canLoadMore.value) return

        loading.value = true
        error.value = null

        try {
            const size = getPageSize()
            const response = await loadMore(page.value, size)
            
            // Xử lý response - có thể là array hoặc object có content
            let newItems = []
            let isLast = false

            if (Array.isArray(response)) {
                newItems = response
                isLast = newItems.length < pageSize
            } else if (response?.content && Array.isArray(response.content)) {
                newItems = response.content
                isLast = response.last !== undefined ? response.last : newItems.length < pageSize
            } else if (response?.data && Array.isArray(response.data)) {
                newItems = response.data
                isLast = newItems.length < pageSize
            } else {
                newItems = []
                isLast = true
            }

            if (newItems.length > 0) {
                items.value = [...items.value, ...newItems]
                page.value++
            }

            const currentPageSize = getPageSize()
            hasMore.value = !isLast && newItems.length === currentPageSize
        } catch (err) {
            error.value = err
            logger.error('Error loading more items:', err)
        } finally {
            loading.value = false
        }
    }

    const reset = () => {
        items.value = []
        page.value = 0
        hasMore.value = true
        error.value = null
        loading.value = false
    }

    const refresh = async () => {
        reset()
        await loadNextPage()
    }

    // Intersection Observer để detect khi scroll đến sentinel element
    const setupObserver = () => {
        if (!enabled || !sentinelRef.value) return

        observer.value = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (entry.isIntersecting && canLoadMore.value) {
                    loadNextPage()
                }
            },
            {
                root: null,
                rootMargin: `${threshold}px`,
                threshold: 0.1
            }
        )

        observer.value.observe(sentinelRef.value)
    }

    onMounted(() => {
        if (enabled) {
            setupObserver()
        }
    })

    onUnmounted(() => {
        if (observer.value) {
            observer.value.disconnect()
        }
    })

    return {
        items,
        loading: isLoading,
        hasMore,
        error,
        page,
        sentinelRef,
        loadNextPage,
        reset,
        refresh,
        canLoadMore
    }
}

