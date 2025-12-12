import { computed, ref } from 'vue'
import logger from '@/utils/logger'

/**
 * Composable for bulk actions and batch operations
 * @param {Object} options - Options
 * @param {Function} options.onBulkAction - Callback when bulk action is executed
 * @param {Number} options.maxBatchSize - Maximum items per batch
 */
export function useBulkActions (options = {}) {
    const { onBulkAction, maxBatchSize = 100 } = options

    const selectedItems = ref(new Set())
    const isSelectAll = ref(false)
    const isProcessing = ref(false)
    const operationHistory = ref([])

    // Computed
    const selectedCount = computed(() => selectedItems.value.size)
    const hasSelection = computed(() => selectedCount.value > 0)
    const canSelectAll = computed(() => maxBatchSize === -1 || selectedCount.value < maxBatchSize)

    // Selection methods
    const toggleSelection = (itemId) => {
        if (selectedItems.value.has(itemId)) {
            selectedItems.value.delete(itemId)
        } else {
            if (maxBatchSize > 0 && selectedItems.value.size >= maxBatchSize) {
                logger.warn(`[useBulkActions] Maximum selection limit reached: ${maxBatchSize}`)
                return false
            }
            selectedItems.value.add(itemId)
        }
        isSelectAll.value = false
        return true
    }

    const selectItem = (itemId) => {
        if (maxBatchSize > 0 && selectedItems.value.size >= maxBatchSize) {
            return false
        }
        selectedItems.value.add(itemId)
        isSelectAll.value = false
        return true
    }

    const deselectItem = (itemId) => {
        selectedItems.value.delete(itemId)
        isSelectAll.value = false
    }

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

    const clearSelection = () => {
        selectedItems.value.clear()
        isSelectAll.value = false
    }

    const isSelected = (itemId) => selectedItems.value.has(itemId)

    // Bulk action execution
    const executeBulkAction = async (action, actionFn, options = {}) => {
        if (selectedItems.value.size === 0) {
            logger.warn('[useBulkActions] No items selected')
            return { success: false, message: 'Không có item nào được chọn' }
        }

        const { confirm = true, onProgress, onComplete } = options

        if (confirm && !options.skipConfirm) {
            // Confirmation will be handled by the component
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
            // Process in batches
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
                            error: result.reason?.message || 'Unknown error'
                        })
                    }
                })
            }

            // Log operation
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

            // Callback
            if (onBulkAction) {
                onBulkAction(action, selectedIds, results)
            }

            if (onComplete) {
                onComplete(results)
            }

            // Clear selection if all succeeded
            if (options.clearOnSuccess && results.failed === 0) {
                clearSelection()
            }

            return {
                success: true,
                results,
                operation
            }
        } catch (err) {
            logger.error('[useBulkActions] Bulk action failed', err)
            return {
                success: false,
                message: err.message || 'Bulk action failed',
                results
            }
        } finally {
            isProcessing.value = false
        }
    }

    // Undo operation
    const undoOperation = async (operationId, undoFn) => {
        const operation = operationHistory.value.find(op => op.id === operationId)
        if (!operation) {
            return { success: false, message: 'Operation not found' }
        }

        try {
            if (undoFn) {
                await undoFn(operation)
            }

            // Mark as undone
            operation.undone = true
            operation.undoneAt = new Date().toISOString()

            return { success: true, operation }
        } catch (err) {
            logger.error('[useBulkActions] Undo failed', err)
            return { success: false, message: err.message || 'Undo failed' }
        }
    }

    // Get operation history
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

        // Selection methods
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

