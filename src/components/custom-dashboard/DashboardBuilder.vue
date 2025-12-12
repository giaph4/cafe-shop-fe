<template>
  <div class="dashboard-builder">
    <!-- Grid Overlay khi edit mode -->
    <div
      v-if="isEditMode"
      class="dashboard-builder__grid-overlay"
    >
      <div
        v-for="col in 12"
        :key="col"
        class="dashboard-builder__grid-column"
      />
    </div>

    <!-- Widgets Container -->
    <div
      ref="widgetsContainer"
      class="dashboard-builder__widgets"
      :class="{ 'dashboard-builder__widgets--editing': isEditMode }"
    >
      <div
        v-for="widget in widgets"
        :key="widget.id"
        :ref="el => widgetRefs[widget.id] = el"
        class="dashboard-builder__widget-wrapper"
        :style="getWidgetStyle(widget)"
        :draggable="isEditMode"
        @dragstart="handleDragStart($event, widget)"
        @dragover="handleDragOver($event, widget)"
        @dragenter="handleDragEnter($event, widget)"
        @dragleave="handleDragLeave($event)"
        @drop="handleDrop($event, widget)"
        @dragend="handleDragEnd"
      >
        <component
          :is="getWidgetComponent(widget.type)"
          :widget="widget"
          :is-editing="isEditMode"
          :is-dragging="isDragging === widget.id"
          :data="widget.data"
        />
      </div>

      <!-- Drop Zone khi không có widgets -->
      <div
        v-if="widgets.length === 0 && isEditMode"
        class="dashboard-builder__empty-zone"
        @dragover.prevent
        @drop="handleDropOnEmpty"
      >
        <i class="bi bi-plus-circle" />
        <p>Kéo thả widget vào đây</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import logger from '@/utils/logger'
import KPIWidget from './widgets/KPIWidget.vue'
import ChartWidget from './widgets/ChartWidget.vue'
import TableWidget from './widgets/TableWidget.vue'
import AlertWidget from './widgets/AlertWidget.vue'
import CalendarWidget from './widgets/CalendarWidget.vue'
import ClockWidget from './widgets/ClockWidget.vue'

const props = defineProps({
    widgets: {
        type: Array,
        default: () => []
    },
    isEditMode: {
        type: Boolean,
        default: false
    },
    gridColumns: {
        type: Number,
        default: 12
    }
})

const emit = defineEmits(['widget-move', 'widget-resize', 'widget-remove', 'widget-add'])

const widgetsContainer = ref(null)
const widgetRefs = ref({})
const isDragging = ref(null)
const draggedWidget = ref(null)
const dragOverWidget = ref(null)

const widgetComponents = {
    kpi: KPIWidget,
    chart: ChartWidget,
    table: TableWidget,
    alert: AlertWidget,
    calendar: CalendarWidget,
    clock: ClockWidget
}

const getWidgetComponent = (type) => widgetComponents[type] || KPIWidget

const getWidgetStyle = (widget) => {
    const colSpan = widget.colSpan || 12
    const rowSpan = widget.rowSpan || 1

    return {
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`
    }
}

const handleDragStart = (event, widget) => {
    if (!props.isEditMode) return

    draggedWidget.value = widget
    isDragging.value = widget.id

    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', JSON.stringify(widget))
    }

    event.target.classList.add('dragging')
}

const handleDragOver = (event, widget) => {
    if (!props.isEditMode) return
    event.preventDefault()
    event.stopPropagation()

    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move'
    }

    dragOverWidget.value = widget
}

const handleDragEnter = (event, _widget) => {
    if (!props.isEditMode) return
    event.preventDefault()
    event.target.classList.add('drag-over')
}

const handleDragLeave = (event) => {
    if (!props.isEditMode) return
    event.target.classList.remove('drag-over')
}

const handleDrop = (event, targetWidget) => {
    if (!props.isEditMode || !draggedWidget.value) return

    event.preventDefault()
    event.stopPropagation()
    event.target.classList.remove('drag-over')

    if (draggedWidget.value.id !== targetWidget.id) {
        // Reorder widgets
        emit('widget-move', {
            widget: draggedWidget.value,
            target: targetWidget
        })
    }

    draggedWidget.value = null
    dragOverWidget.value = null
    isDragging.value = null
}

const handleDragEnd = (event) => {
    event.target.classList.remove('dragging')
    draggedWidget.value = null
    dragOverWidget.value = null
    isDragging.value = null
}

const handleDropOnEmpty = (event) => {
    if (!props.isEditMode) return

    event.preventDefault()

    try {
        const data = event.dataTransfer.getData('text/plain')
        if (data) {
            const widget = JSON.parse(data)
            emit('widget-add', widget)
        }
    } catch (e) {
        logger.warn('Không thể parse dữ liệu kéo-thả widget:', e)
    }
}
</script>

<style scoped>
.dashboard-builder {
    position: relative;
    width: 100%;
    min-height: 400px;
}

.dashboard-builder__grid-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: var(--spacing-3);
    pointer-events: none;
    z-index: 1;
    padding: var(--spacing-3);
}

.dashboard-builder__grid-column {
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-base);
    opacity: 0.3;
}

.dashboard-builder__widgets {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: var(--spacing-3);
    padding: var(--spacing-3);
    position: relative;
    z-index: 2;
}

.dashboard-builder__widgets--editing {
    min-height: 600px;
}

.dashboard-builder__widget-wrapper {
    position: relative;
    min-height: 200px;
    transition: all var(--transition-base);
}

.dashboard-builder__widget-wrapper.dragging {
    opacity: 0.5;
    transform: rotate(2deg);
}

.dashboard-builder__widget-wrapper.drag-over {
    border: 2px dashed var(--color-primary);
    border-radius: var(--radius-base);
}

.dashboard-builder__empty-zone {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-base);
    color: var(--color-text-muted);
    gap: var(--spacing-2);
    transition: all var(--transition-base);
}

.dashboard-builder__empty-zone:hover {
    border-color: var(--color-primary);
    background: var(--color-bg-muted);
}

.dashboard-builder__empty-zone i {
    font-size: 3rem;
    opacity: 0.5;
}
</style>

