<template>
  <div class="chart-type-selector">
    <label class="form-label">
      <i class="bi bi-graph-up me-2" />
      Loại biểu đồ
    </label>
    <div class="chart-type-selector__grid">
      <button
        v-for="type in chartTypes"
        :key="type.value"
        class="chart-type-selector__item"
        :class="{ 'chart-type-selector__item--active': modelValue === type.value }"
        @click="handleSelect(type.value)"
      >
        <i :class="type.icon" />
        <span>{{ type.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
    modelValue: {
        type: String,
        default: 'line'
    }
})

const emit = defineEmits(['update:modelValue', 'change'])

const chartTypes = [
    // Basic
    { value: 'line', label: 'Đường', icon: 'bi bi-graph-up', category: 'basic' },
    { value: 'bar', label: 'Cột', icon: 'bi bi-bar-chart', category: 'basic' },
    { value: 'area', label: 'Vùng', icon: 'bi bi-graph-up-arrow', category: 'basic' },
    { value: 'pie', label: 'Tròn', icon: 'bi bi-pie-chart', category: 'basic' },
    { value: 'donut', label: 'Vòng tròn', icon: 'bi bi-circle', category: 'basic' },
    { value: 'scatter', label: 'Phân tán', icon: 'bi bi-scatter', category: 'basic' },

    // Advanced (using ApexCharts supported types)
    { value: 'heatmap', label: 'Heatmap', icon: 'bi bi-grid-3x3-gap', category: 'advanced' },
    { value: 'treemap', label: 'Treemap', icon: 'bi bi-diagram-3', category: 'advanced' },
    { value: 'radialBar', label: 'Radial Bar', icon: 'bi bi-speedometer2', category: 'advanced' },

    // Statistical (using scatter with different styling)
    { value: 'boxplot', label: 'Box Plot', icon: 'bi bi-bar-chart-steps', category: 'statistical' },
    { value: 'histogram', label: 'Histogram', icon: 'bi bi-bar-chart-line', category: 'statistical' }
]

const handleSelect = (value) => {
    emit('update:modelValue', value)
    emit('change', value)
}
</script>

<style scoped>
.chart-type-selector {
    margin-bottom: var(--spacing-4);
}

.chart-type-selector__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-2);
}

.chart-type-selector__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-1);
    padding: var(--spacing-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    transition: all var(--transition-base);
    font-size: var(--font-size-sm);
}

.chart-type-selector__item:hover {
    border-color: var(--color-primary);
    background: var(--color-bg-muted);
    transform: translateY(-2px);
}

.chart-type-selector__item--active {
    border-color: var(--color-primary);
    background: var(--color-primary);
    color: white;
}

.chart-type-selector__item i {
    font-size: 24px;
}

.chart-type-selector__item span {
    font-weight: var(--font-weight-medium);
    text-align: center;
}
</style>

