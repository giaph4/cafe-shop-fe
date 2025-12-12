import { ref } from 'vue'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'

/**
 * Composable để xử lý keyboard navigation trong tables
 * @param {Object} options - Options
 * @param {Ref} options.rows - Reactive array of table rows
 * @param {Ref} options.selectedRows - Reactive array of selected row indices
 * @param {Function} options.onRowSelect - Callback khi select row
 * @param {Function} options.onRowEdit - Callback khi edit row
 * @param {Function} options.onRowDelete - Callback khi delete row
 * @param {Function} options.onCellNavigate - Callback khi navigate cell
 * @param {boolean} options.enabled - Enable/disable navigation
 */
export const useTableNavigation = (options = {}) => {
    const {
        rows = ref([]),
        selectedRows = ref([]),
        onRowSelect = () => {},
        onRowEdit = () => {},
        onRowDelete = () => {},
        onCellNavigate = () => {},
        enabled = true
    } = options

    const currentRowIndex = ref(-1)
    const currentCellIndex = ref(-1)
    const isEnabled = ref(enabled)

    /**
     * Select row
     */
    const selectRow = (index) => {
        if (index < 0 || index >= rows.value.length) return

        currentRowIndex.value = index

        if (selectedRows.value.includes(index)) {
            selectedRows.value = selectedRows.value.filter(i => i !== index)
        } else {
            selectedRows.value = [...selectedRows.value, index]
        }

        onRowSelect(rows.value[index], index)
    }

    /**
     * Select all rows
     */
    const selectAll = () => {
        if (selectedRows.value.length === rows.value.length) {
            selectedRows.value = []
        } else {
            selectedRows.value = rows.value.map((_, index) => index)
        }
    }

    /**
     * Navigate to cell
     */
    const navigateToCell = (rowIndex, cellIndex) => {
        if (rowIndex < 0 || rowIndex >= rows.value.length) return
        if (cellIndex < 0) cellIndex = 0

        currentRowIndex.value = rowIndex
        currentCellIndex.value = cellIndex

        onCellNavigate(rowIndex, cellIndex)
    }

    /**
     * Handle keyboard shortcuts
     */
    const shortcuts = {
        'arrow-up': {
            key: 'ArrowUp',
            modifiers: [],
            handler: (event) => {
                if (!isEnabled.value) return
                event.preventDefault()

                if (currentRowIndex.value > 0) {
                    navigateToCell(currentRowIndex.value - 1, currentCellIndex.value)
                }
            }
        },
        'arrow-down': {
            key: 'ArrowDown',
            modifiers: [],
            handler: (event) => {
                if (!isEnabled.value) return
                event.preventDefault()

                if (currentRowIndex.value < rows.value.length - 1) {
                    navigateToCell(currentRowIndex.value + 1, currentCellIndex.value)
                }
            }
        },
        'arrow-left': {
            key: 'ArrowLeft',
            modifiers: [],
            handler: (event) => {
                if (!isEnabled.value) return
                event.preventDefault()

                if (currentCellIndex.value > 0) {
                    navigateToCell(currentRowIndex.value, currentCellIndex.value - 1)
                }
            }
        },
        'arrow-right': {
            key: 'ArrowRight',
            modifiers: [],
            handler: (event) => {
                if (!isEnabled.value) return
                event.preventDefault()

                navigateToCell(currentRowIndex.value, currentCellIndex.value + 1)
            }
        },
        'enter': {
            key: 'Enter',
            modifiers: [],
            handler: (event) => {
                if (!isEnabled.value) return
                event.preventDefault()

                if (currentRowIndex.value >= 0 && currentRowIndex.value < rows.value.length) {
                    onRowEdit(rows.value[currentRowIndex.value], currentRowIndex.value)
                }
            }
        },
        'space': {
            key: ' ',
            modifiers: [],
            handler: (event) => {
                if (!isEnabled.value) return
                event.preventDefault()

                if (currentRowIndex.value >= 0) {
                    selectRow(currentRowIndex.value)
                }
            }
        },
        'select-all': {
            key: 'a',
            modifiers: ['ctrl', 'meta'],
            handler: (event) => {
                if (!isEnabled.value) return
                event.preventDefault()
                selectAll()
            }
        },
        'delete': {
            key: 'Delete',
            modifiers: [],
            handler: (event) => {
                if (!isEnabled.value) return
                event.preventDefault()

                if (selectedRows.value.length > 0) {
                    const rowsToDelete = selectedRows.value.map(index => rows.value[index])
                    onRowDelete(rowsToDelete, selectedRows.value)
                }
            }
        }
    }

    // Setup keyboard shortcuts
    useKeyboardShortcuts({
        shortcuts,
        enabled: isEnabled.value
    })

    /**
     * Enable navigation
     */
    const enable = () => {
        isEnabled.value = true
    }

    /**
     * Disable navigation
     */
    const disable = () => {
        isEnabled.value = false
    }

    /**
     * Reset navigation state
     */
    const reset = () => {
        currentRowIndex.value = -1
        currentCellIndex.value = 0
    }

    /**
     * Focus on row
     */
    const focusRow = (index) => {
        if (index >= 0 && index < rows.value.length) {
            currentRowIndex.value = index
            // Scroll to row if needed
            const rowElement = document.querySelector(`[data-row-index="${index}"]`)
            if (rowElement) {
                rowElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }
        }
    }

    return {
        currentRowIndex,
        currentCellIndex,
        selectedRows,
        isEnabled,
        selectRow,
        selectAll,
        navigateToCell,
        enable,
        disable,
        reset,
        focusRow
    }
}

