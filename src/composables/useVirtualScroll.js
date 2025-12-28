import { ref, computed } from 'vue'

/**
 * Composable cho virtual scrolling với chiều cao item động
 * @param {Object} options - Tùy chọn cấu hình
 * @param {number} options.itemHeight - Chiều cao mặc định của item
 * @param {number} options.containerHeight - Chiều cao container
 * @param {number} options.overscan - Số item render thêm ngoài viewport
 * @param {Array} options.items - Mảng items cần render
 * @returns {Object} Các utility cho virtual scroll
 */
export function useVirtualScroll (options = {}) {
    const {
        itemHeight = 50,
        containerHeight = 400,
        overscan = 3,
        items = []
    } = options

    const containerRef = ref(null)
    const scrollTop = ref(0)
    // Lưu trữ chiều cao thực tế của từng item để hỗ trợ dynamic sizing
    const itemHeights = ref(new Map())

    const totalHeight = computed(() => {
        if (itemHeights.value.size > 0) {
            // Sử dụng chiều cao thực tế nếu có
            let total = 0
            items.forEach((item, index) => {
                total += itemHeights.value.get(index) || itemHeight
            })
            return total
        }
        return items.length * itemHeight
    })

    const startIndex = computed(() => {
        let accumulated = 0
        for (let i = 0; i < items.length; i++) {
            const height = itemHeights.value.get(i) || itemHeight
            if (accumulated + height > scrollTop.value) {
                return Math.max(0, i - overscan)
            }
            accumulated += height
        }
        return 0
    })

    const endIndex = computed(() => {
        let accumulated = 0
        const viewportEnd = scrollTop.value + containerHeight

        for (let i = 0; i < items.length; i++) {
            const height = itemHeights.value.get(i) || itemHeight
            accumulated += height
            if (accumulated > viewportEnd) {
                return Math.min(items.length, i + overscan + 1)
            }
        }
        return items.length
    })

    const visibleItems = computed(() => items.slice(startIndex.value, endIndex.value).map((item, i) => ({
        data: item,
        index: startIndex.value + i
    })))

    const topSpacerHeight = computed(() => {
        let height = 0
        for (let i = 0; i < startIndex.value; i++) {
            height += itemHeights.value.get(i) || itemHeight
        }
        return height
    })

    const bottomSpacerHeight = computed(() => {
        let height = 0
        for (let i = endIndex.value; i < items.length; i++) {
            height += itemHeights.value.get(i) || itemHeight
        }
        return height
    })

    const handleScroll = (event) => {
        scrollTop.value = event.target.scrollTop
    }

    const setItemHeight = (index, height) => {
        itemHeights.value.set(index, height)
    }

    const scrollToIndex = (index) => {
        if (!containerRef.value) return

        let accumulated = 0
        for (let i = 0; i < index && i < items.length; i++) {
            accumulated += itemHeights.value.get(i) || itemHeight
        }
        containerRef.value.scrollTop = accumulated
    }

    const scrollToItem = (item) => {
        const index = items.findIndex(i => i === item)
        if (index !== -1) {
            scrollToIndex(index)
        }
    }

    return {
        containerRef,
        scrollTop,
        visibleItems,
        topSpacerHeight,
        bottomSpacerHeight,
        totalHeight,
        startIndex,
        endIndex,
        handleScroll,
        setItemHeight,
        scrollToIndex,
        scrollToItem
    }
}

/**
 * Composable cho virtual scrolling với chiều cao cố định (đơn giản hơn, nhanh hơn)
 * @param {Object} options - Tùy chọn cấu hình
 * @param {number} options.itemHeight - Chiều cao cố định của item
 * @param {number} options.containerHeight - Chiều cao container
 * @param {number} options.overscan - Số item render thêm ngoài viewport
 * @param {Array} options.items - Mảng items cần render
 * @returns {Object} Các utility cho virtual scroll
 */
export function useFixedVirtualScroll (options = {}) {
    const {
        itemHeight = 50,
        containerHeight = 400,
        overscan = 3,
        items = []
    } = options

    const containerRef = ref(null)
    const scrollTop = ref(0)

    const totalHeight = computed(() => items.length * itemHeight)

    const startIndex = computed(() => {
        const index = Math.floor(scrollTop.value / itemHeight)
        return Math.max(0, index - overscan)
    })

    const endIndex = computed(() => {
        const visibleCount = Math.ceil(containerHeight / itemHeight)
        const index = startIndex.value + visibleCount + overscan * 2
        return Math.min(items.length, index)
    })

    const visibleItems = computed(() => items.slice(startIndex.value, endIndex.value).map((item, i) => ({
        data: item,
        index: startIndex.value + i
    })))

    const topSpacerHeight = computed(() => startIndex.value * itemHeight)

    const bottomSpacerHeight = computed(() => {
        const remaining = items.length - endIndex.value
        return remaining * itemHeight
    })

    const handleScroll = (event) => {
        scrollTop.value = event.target.scrollTop
    }

    const scrollToIndex = (index) => {
        if (!containerRef.value) return
        containerRef.value.scrollTop = index * itemHeight
    }

    const scrollToItem = (item) => {
        const index = items.findIndex(i => i === item)
        if (index !== -1) {
            scrollToIndex(index)
        }
    }

    return {
        containerRef,
        scrollTop,
        visibleItems,
        topSpacerHeight,
        bottomSpacerHeight,
        totalHeight,
        startIndex,
        endIndex,
        handleScroll,
        scrollToIndex,
        scrollToItem
    }
}

