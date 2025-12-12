import { ref } from 'vue'

/**
 * Composable cho drag-and-drop functionality
 * Sử dụng HTML5 Drag and Drop API
 */
export const useDragAndDrop = (options = {}) => {
    const {
        onDragStart = null,
        onDragEnd = null,
        onDragOver = null,
        onDrop = null,
        onDragEnter = null,
        onDragLeave = null
    } = options

    const draggedItem = ref(null)
    const dragOverItem = ref(null)
    const isDragging = ref(false)

    /**
     * Handle drag start
     */
    const handleDragStart = (event, item) => {
        draggedItem.value = item
        isDragging.value = true

        // Set drag data
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', JSON.stringify(item))
        }

        // Add dragging class to element
        if (event.target) {
            event.target.classList.add('dragging')
        }

        if (onDragStart) {
            onDragStart(event, item)
        }
    }

    /**
     * Handle drag end
     */
    const handleDragEnd = (event) => {
        // Remove dragging class
        if (event.target) {
            event.target.classList.remove('dragging')
        }

        if (onDragEnd) {
            onDragEnd(event, draggedItem.value)
        }

        draggedItem.value = null
        dragOverItem.value = null
        isDragging.value = false
    }

    /**
     * Handle drag over
     */
    const handleDragOver = (event, item = null) => {
        event.preventDefault()
        event.stopPropagation()

        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move'
        }

        dragOverItem.value = item

        if (onDragOver) {
            onDragOver(event, item)
        }
    }

    /**
     * Handle drag enter
     */
    const handleDragEnter = (event, item = null) => {
        event.preventDefault()
        event.stopPropagation()

        if (event.target) {
            event.target.classList.add('drag-over')
        }

        if (onDragEnter) {
            onDragEnter(event, item)
        }
    }

    /**
     * Handle drag leave
     */
    const handleDragLeave = (event) => {
        event.preventDefault()
        event.stopPropagation()

        if (event.target) {
            event.target.classList.remove('drag-over')
        }

        if (onDragLeave) {
            onDragLeave(event)
        }
    }

    /**
     * Handle drop
     */
    const handleDrop = (event, targetItem = null) => {
        event.preventDefault()
        event.stopPropagation()

        // Remove drag-over class
        if (event.target) {
            event.target.classList.remove('drag-over')
        }

        let droppedData = draggedItem.value

        // Try to get data from dataTransfer
        if (event.dataTransfer) {
            try {
                const data = event.dataTransfer.getData('text/plain')
                if (data) {
                    droppedData = JSON.parse(data)
                }
            } catch (e) {
                console.warn('Failed to parse drag data:', e)
            }
        }

        if (onDrop && droppedData) {
            onDrop(event, droppedData, targetItem)
        }

        draggedItem.value = null
        dragOverItem.value = null
        isDragging.value = false
    }

    /**
     * Make element draggable
     */
    const makeDraggable = (element, item) => {
        if (!element) return

        element.setAttribute('draggable', 'true')
        element.addEventListener('dragstart', (e) => handleDragStart(e, item))
        element.addEventListener('dragend', handleDragEnd)
    }

    /**
     * Make element a drop zone
     */
    const makeDropZone = (element, item = null) => {
        if (!element) return

        element.addEventListener('dragover', (e) => handleDragOver(e, item))
        element.addEventListener('dragenter', (e) => handleDragEnter(e, item))
        element.addEventListener('dragleave', handleDragLeave)
        element.addEventListener('drop', (e) => handleDrop(e, item))
    }

    /**
     * Remove drag and drop handlers
     */
    const removeDragAndDrop = (element) => {
        if (!element) return

        element.removeAttribute('draggable')
        element.removeEventListener('dragstart', handleDragStart)
        element.removeEventListener('dragend', handleDragEnd)
        element.removeEventListener('dragover', handleDragOver)
        element.removeEventListener('dragenter', handleDragEnter)
        element.removeEventListener('dragleave', handleDragLeave)
        element.removeEventListener('drop', handleDrop)
    }

    return {
        draggedItem,
        dragOverItem,
        isDragging,
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDragEnter,
        handleDragLeave,
        handleDrop,
        makeDraggable,
        makeDropZone,
        removeDragAndDrop
    }
}

