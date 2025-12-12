<template>
  <div
    :class="['widget-base', { 'widget-base--editing': isEditing, 'widget-base--dragging': isDragging }]"
    :style="widgetStyle"
  >
    <!-- Widget Header -->
    <div
      v-if="showHeader"
      class="widget-base__header"
    >
      <div class="widget-base__header-content">
        <div class="widget-base__title">
          <i
            v-if="widget.icon"
            :class="widget.icon"
            class="widget-base__icon"
          />
          <span>{{ widget.title || 'Widget' }}</span>
        </div>
        <div class="widget-base__actions">
          <button
            v-if="isEditing"
            type="button"
            class="btn btn-sm btn-link widget-base__action-btn"
            title="Cấu hình"
            @click="handleConfigure"
          >
            <i class="bi bi-gear" />
          </button>
          <button
            v-if="isEditing"
            type="button"
            class="btn btn-sm btn-link widget-base__action-btn"
            title="Xóa"
            @click="handleRemove"
          >
            <i class="bi bi-trash" />
          </button>
        </div>
      </div>
    </div>

    <!-- Widget Content -->
    <div class="widget-base__content">
      <slot />
    </div>

    <!-- Resize Handle (chỉ khi editing) -->
    <div
      v-if="isEditing && resizable"
      class="widget-base__resize-handle"
      @mousedown="handleResizeStart"
    >
      <i class="bi bi-arrows-angle-expand" />
    </div>

    <!-- Drag Handle (chỉ khi editing) -->
    <div
      v-if="isEditing"
      class="widget-base__drag-handle"
    >
      <i class="bi bi-grip-vertical" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    widget: {
        type: Object,
        required: true
    },
    isEditing: {
        type: Boolean,
        default: false
    },
    isDragging: {
        type: Boolean,
        default: false
    },
    showHeader: {
        type: Boolean,
        default: true
    },
    resizable: {
        type: Boolean,
        default: true
    }
})

const emit = defineEmits(['configure', 'remove', 'resize'])

const widgetStyle = computed(() => {
    const style = {}
    if (props.widget.width) {
        style.width = typeof props.widget.width === 'number' ? `${props.widget.width}px` : props.widget.width
    }
    if (props.widget.height) {
        style.height = typeof props.widget.height === 'number' ? `${props.widget.height}px` : props.widget.height
    }
    if (props.widget.x !== undefined) {
        style.left = `${props.widget.x}px`
    }
    if (props.widget.y !== undefined) {
        style.top = `${props.widget.y}px`
    }
    return style
})

const handleConfigure = () => {
    emit('configure', props.widget)
}

const handleRemove = () => {
    emit('remove', props.widget.id)
}

const handleResizeStart = (event) => {
    emit('resize', { widget: props.widget, event })
}
</script>

<style scoped>
.widget-base {
    position: relative;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    overflow: hidden;
    transition: all var(--transition-base);
    min-height: 200px;
    display: flex;
    flex-direction: column;
}

.widget-base:hover {
    border-color: var(--color-border-strong);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.widget-base--editing {
    border-color: var(--color-primary);
    border-style: dashed;
}

.widget-base--dragging {
    opacity: 0.5;
    transform: rotate(2deg);
}

.widget-base__header {
    padding: var(--spacing-3) var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg-muted);
}

.widget-base__header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.widget-base__title {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    color: var(--color-text);
}

.widget-base__icon {
    font-size: 18px;
    color: var(--color-primary);
}

.widget-base__actions {
    display: flex;
    gap: var(--spacing-1);
}

.widget-base__action-btn {
    padding: var(--spacing-1);
    color: var(--color-text-muted);
    border: none;
    background: transparent;
    cursor: pointer;
    transition: color var(--transition-base);
}

.widget-base__action-btn:hover {
    color: var(--color-primary);
}

.widget-base__content {
    flex: 1;
    padding: var(--spacing-4);
    overflow: auto;
}

.widget-base__resize-handle {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20px;
    height: 20px;
    background: var(--color-primary);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: nwse-resize;
    border-radius: var(--radius-base) 0 0 0;
    font-size: 12px;
    z-index: 10;
}

.widget-base__resize-handle:hover {
    background: var(--color-primary-dark);
}

.widget-base__drag-handle {
    position: absolute;
    top: var(--spacing-2);
    left: var(--spacing-2);
    width: 24px;
    height: 24px;
    background: var(--color-primary);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: move;
    border-radius: var(--radius-base);
    font-size: 14px;
    z-index: 10;
    opacity: 0;
    transition: opacity var(--transition-base);
}

.widget-base--editing .widget-base__drag-handle {
    opacity: 1;
}

.widget-base__drag-handle:hover {
    background: var(--color-primary-dark);
}
</style>

