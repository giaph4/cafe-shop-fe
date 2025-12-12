<template>
  <div class="widget-picker">
    <div class="widget-picker__header">
      <h5 class="widget-picker__title">
        <i class="bi bi-grid-3x3-gap" />
        Thư viện Widget
      </h5>
      <button
        class="btn btn-sm btn-link"
        @click="$emit('close')"
      >
        <i class="bi bi-x-lg" />
      </button>
    </div>

    <div class="widget-picker__search">
      <input
        v-model="searchQuery"
        type="text"
        class="form-control"
        placeholder="Tìm kiếm widget..."
      >
    </div>

    <div class="widget-picker__categories">
      <button
        v-for="category in categories"
        :key="category.key"
        class="btn btn-sm"
        :class="activeCategory === category.key ? 'btn-primary' : 'btn-outline-secondary'"
        @click="activeCategory = category.key"
      >
        {{ category.label }}
      </button>
    </div>

    <div class="widget-picker__list">
      <div
        v-for="widget in filteredWidgets"
        :key="widget.type"
        class="widget-picker__item"
        :draggable="true"
        @dragstart="handleDragStart($event, widget)"
        @click="handleWidgetClick(widget)"
      >
        <div class="widget-picker__item-icon">
          <i :class="widget.icon" />
        </div>
        <div class="widget-picker__item-content">
          <div class="widget-picker__item-name">
            {{ widget.name }}
          </div>
          <div class="widget-picker__item-description">
            {{ widget.description }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['select', 'close'])

const searchQuery = ref('')
const activeCategory = ref('all')

const categories = [
    { key: 'all', label: 'Tất cả' },
    { key: 'kpi', label: 'KPI' },
    { key: 'chart', label: 'Biểu đồ' },
    { key: 'table', label: 'Bảng' },
    { key: 'utility', label: 'Tiện ích' }
]

const widgetLibrary = [
    {
        type: 'kpi',
        name: 'KPI Card',
        description: 'Hiển thị chỉ số KPI với giá trị và thay đổi',
        icon: 'bi bi-speedometer2',
        category: 'kpi',
        defaultConfig: {
            title: 'KPI',
            format: 'number',
            dataSource: 'todayRevenue',
            showChange: true
        }
    },
    {
        type: 'chart',
        name: 'Biểu đồ',
        description: 'Biểu đồ đường, cột, tròn, vùng...',
        icon: 'bi bi-bar-chart',
        category: 'chart',
        defaultConfig: {
            title: 'Biểu đồ',
            chartType: 'line',
            dataSource: 'revenue',
            showLegend: true
        }
    },
    {
        type: 'table',
        name: 'Bảng dữ liệu',
        description: 'Hiển thị dữ liệu dạng bảng',
        icon: 'bi bi-table',
        category: 'table',
        defaultConfig: {
            title: 'Bảng dữ liệu',
            dataSource: 'topProducts',
            columns: [],
            pagination: true
        }
    },
    {
        type: 'alert',
        name: 'Cảnh báo',
        description: 'Hiển thị danh sách cảnh báo',
        icon: 'bi bi-bell',
        category: 'utility',
        defaultConfig: {
            title: 'Cảnh báo',
            maxItems: 10
        }
    },
    {
        type: 'calendar',
        name: 'Lịch',
        description: 'Lịch tháng với sự kiện',
        icon: 'bi bi-calendar',
        category: 'utility',
        defaultConfig: {
            title: 'Lịch',
            showEvents: true
        }
    },
    {
        type: 'clock',
        name: 'Đồng hồ',
        description: 'Đồng hồ hiện tại',
        icon: 'bi bi-clock',
        category: 'utility',
        defaultConfig: {
            title: 'Đồng hồ',
            showDate: true,
            showSeconds: true
        }
    }
]

const filteredWidgets = computed(() => {
    let widgets = widgetLibrary

    // Filter by category
    if (activeCategory.value !== 'all') {
        widgets = widgets.filter(w => w.category === activeCategory.value)
    }

    // Filter by search query
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        widgets = widgets.filter(w =>
            w.name.toLowerCase().includes(query) ||
            w.description.toLowerCase().includes(query)
        )
    }

    return widgets
})

const handleDragStart = (event, widget) => {
    const widgetData = {
        ...widget.defaultConfig,
        type: widget.type,
        id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        colSpan: 6,
        rowSpan: 1
    }

    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'copy'
        event.dataTransfer.setData('text/plain', JSON.stringify(widgetData))
    }
}

const handleWidgetClick = (widget) => {
    const widgetData = {
        ...widget.defaultConfig,
        type: widget.type,
        id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        colSpan: 6,
        rowSpan: 1
    }

    emit('select', widgetData)
}
</script>

<style scoped>
.widget-picker {
    width: 320px;
    height: 100%;
    background: var(--color-card);
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.widget-picker__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
}

.widget-picker__title {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
}

.widget-picker__search {
    padding: var(--spacing-3) var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
}

.widget-picker__categories {
    display: flex;
    gap: var(--spacing-2);
    padding: var(--spacing-3) var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
}

.widget-picker__list {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-2);
}

.widget-picker__item {
    display: flex;
    gap: var(--spacing-3);
    padding: var(--spacing-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    margin-bottom: var(--spacing-2);
    cursor: move;
    transition: all var(--transition-base);
    background: var(--color-bg);
}

.widget-picker__item:hover {
    border-color: var(--color-primary);
    background: var(--color-bg-muted);
    transform: translateX(4px);
}

.widget-picker__item-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary);
    color: white;
    border-radius: var(--radius-base);
    font-size: 20px;
    flex-shrink: 0;
}

.widget-picker__item-content {
    flex: 1;
    min-width: 0;
}

.widget-picker__item-name {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    color: var(--color-text);
    margin-bottom: var(--spacing-1);
}

.widget-picker__item-description {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    line-height: 1.4;
}
</style>

