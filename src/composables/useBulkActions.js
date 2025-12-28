import { computed, ref } from 'vue'
import logger from '@/utils/logger'

/**
 * Composable quản lý bulk actions và batch operations
 * @param {Object} options - Tùy chọn cấu hình
 * @param {Function} options.onBulkAction - Callback khi bulk action được thực thi
 * @param {Number} options.maxBatchSize - Số lượng items tối đa mỗi batch
 */
export function useBulkActions (options = {}) {
    const { onBulkAction, maxBatchSize = 100 } = options

    const selectedItems = ref(new Set())
    const isSelectAll = ref(false)
    const isProcessing = ref(false)
    const operationHistory = ref([])

    // Computed properties
    const selectedCount = computed(() => selectedItems.value.size)
    const hasSelection = computed(() => selectedCount.value > 0)
    const canSelectAll = computed(() => maxBatchSize === -1 || selectedCount.value < maxBatchSize)

    // Các phương thức chọn items

    /**
     * Toggle trạng thái chọn của item
     */
    const toggleSelection = (itemId) => {
        if (selectedItems.value.has(itemId)) {
            selectedItems.value.delete(itemId)
        } else {
            if (maxBatchSize > 0 && selectedItems.value.size >= maxBatchSize) {
                logger.warn(`[useBulkActions] Đã đạt giới hạn chọn tối đa: ${maxBatchSize}`)
                return false
            }
            selectedItems.value.add(itemId)
        }
        isSelectAll.value = false
        return true
    }

    /**
     * Chọn một item
     */
    const selectItem = (itemId) => {
        if (maxBatchSize > 0 && selectedItems.value.size >= maxBatchSize) {
            return false
        }
        selectedItems.value.add(itemId)
        isSelectAll.value = false
        return true
    }

    /**
     * Bỏ chọn một item
     */
    const deselectItem = (itemId) => {
        selectedItems.value.delete(itemId)
        isSelectAll.value = false
    }

    /**
     * Chọn tất cả items
     */
    const selectAll = (allItems) => {
        if (!allItems || allItems.length === 0) return

        const limit = maxBatchSize > 0 ? Math.min(maxBatchSize, allItems.length) : allItems.length
        selectedItems.value.clear()

        for (let i = 0; i < limit; i++) {
            if (allItems[i]?.id) {
                selectedItems.value.add(allItems[i].id)
            }
        }

        isSelectAll.value = selectedItems.value.size === allItems.length
    }

    /**
     * Chọn items theo điều kiện filter
     */
    const selectByFilter = (items, filterFn) => {
        if (!items || !filterFn) return

        const filtered = items.filter(filterFn)
        const limit = maxBatchSize > 0 ? Math.min(maxBatchSize, filtered.length) : filtered.length

        for (let i = 0; i < limit; i++) {
            if (filtered[i]?.id && !selectedItems.value.has(filtered[i].id)) {
                if (maxBatchSize > 0 && selectedItems.value.size >= maxBatchSize) {
                    break
                }
                selectedItems.value.add(filtered[i].id)
            }
        }

        isSelectAll.value = false
    }

    /**
     * Chọn items trong khoảng index
     */
    const selectRange = (items, startIndex, endIndex) => {
        if (!items || startIndex < 0 || endIndex >= items.length) return

        const start = Math.min(startIndex, endIndex)
        const end = Math.max(startIndex, endIndex)

        for (let i = start; i <= end; i++) {
            if (items[i]?.id) {
                if (maxBatchSize > 0 && selectedItems.value.size >= maxBatchSize) {
                    break
                }
                selectedItems.value.add(items[i].id)
            }
        }

        isSelectAll.value = false
    }

    /**
     * Xóa tất cả selection
     */
    const clearSelection = () => {
        selectedItems.value.clear()
        isSelectAll.value = false
    }

    /**
     * Kiểm tra item có được chọn không
     */
    const isSelected = (itemId) => selectedItems.value.has(itemId)

    /**
     * Thực thi bulk action
     */
    const executeBulkAction = async (action, actionFn, options = {}) => {
        if (selectedItems.value.size === 0) {
            logger.warn('[useBulkActions] Không có item nào được chọn')
            return { success: false, message: 'Không có item nào được chọn' }
        }

        const { confirm = true, onProgress, onComplete } = options

        if (confirm && !options.skipConfirm) {
            // Xác nhận sẽ được xử lý bởi component
            return { needsConfirm: true, selectedIds: Array.from(selectedItems.value) }
        }

        isProcessing.value = true
        const selectedIds = Array.from(selectedItems.value)
        const batchSize = options.batchSize || 10
        const results = {
            success: 0,
            failed: 0,
            errors: []
        }

        try {
            // Xử lý theo từng batch
            for (let i = 0; i < selectedIds.length; i += batchSize) {
                const batch = selectedIds.slice(i, i + batchSize)

                if (onProgress) {
                    onProgress({
                        current: i + batch.length,
                        total: selectedIds.length,
                        percentage: Math.round(((i + batch.length) / selectedIds.length) * 100)
                    })
                }

                const batchResults = await Promise.allSettled(
                    batch.map(id => actionFn(id))
                )

                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        results.success++
                    } else {
                        results.failed++
                        results.errors.push({
                            id: batch[index],
                            error: result.reason?.message || 'Lỗi không xác định'
                        })
                    }
                })
            }

            // Ghi lại lịch sử thao tác
            const operation = {
                id: Date.now().toString(),
                action,
                timestamp: new Date().toISOString(),
                selectedCount: selectedIds.length,
                successCount: results.success,
                failedCount: results.failed,
                errors: results.errors
            }

            operationHistory.value.unshift(operation)
            if (operationHistory.value.length > 50) {
                operationHistory.value = operationHistory.value.slice(0, 50)
            }

            // Gọi callback
            if (onBulkAction) {
                onBulkAction(action, selectedIds, results)
            }

            if (onComplete) {
                onComplete(results)
            }

            // Xóa selection nếu tất cả thành công
            if (options.clearOnSuccess && results.failed === 0) {
                clearSelection()
            }

            return {
                success: true,
                results,
                operation
            }
        } catch (err) {
            logger.error('[useBulkActions] Bulk action thất bại', err)
            return {
                success: false,
                message: err.message || 'Bulk action thất bại',
                results
            }
        } finally {
            isProcessing.value = false
        }
    }

    /**
     * Hoàn tác thao tác
     */
    const undoOperation = async (operationId, undoFn) => {
        const operation = operationHistory.value.find(op => op.id === operationId)
        if (!operation) {
            return { success: false, message: 'Không tìm thấy thao tác' }
        }

        try {
            if (undoFn) {
                await undoFn(operation)
            }

            // Đánh dấu đã hoàn tác
            operation.undone = true
            operation.undoneAt = new Date().toISOString()

            return { success: true, operation }
        } catch (err) {
            logger.error('[useBulkActions] Hoàn tác thất bại', err)
            return { success: false, message: err.message || 'Hoàn tác thất bại' }
        }
    }

    /**
     * Lấy lịch sử thao tác
     */
    const getOperationHistory = (limit = 10) => operationHistory.value.slice(0, limit)

    return {
        // State
        selectedItems,
        isSelectAll,
        isProcessing,
        operationHistory,
        selectedCount,
        hasSelection,
        canSelectAll,

        // Các phương thức chọn
        toggleSelection,
        selectItem,
        deselectItem,
        selectAll,
        selectByFilter,
        selectRange,
        clearSelection,
        isSelected,

        // Bulk actions
        executeBulkAction,
        undoOperation,
        getOperationHistory
    }
}
