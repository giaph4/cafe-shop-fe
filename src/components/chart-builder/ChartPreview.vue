<template>
  <div class="chart-preview">
    <div
      v-if="loading"
      class="chart-preview__loading"
    >
      <div class="spinner-border" />
      <p class="mt-2 text-muted">
        Đang tải dữ liệu...
      </p>
    </div>
    <div
      v-else-if="error"
      class="chart-preview__error"
    >
      <i class="bi bi-exclamation-triangle" />
      <p>{{ error }}</p>
    </div>
    <div
      v-else-if="!data || !hasValidData"
      class="chart-preview__empty"
    >
      <i class="bi bi-bar-chart" />
      <p>Chọn nguồn dữ liệu để bắt đầu</p>
    </div>
    <div
      v-else
      class="chart-preview__chart"
    >
      <apexchart
        :type="config.chartType"
        :options="chartOptions"
        :series="chartSeries"
        :height="config.height"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { useChartOptions } from '@/composables/useChartOptions'

const apexchart = VueApexCharts

const props = defineProps({
    config: {
        type: Object,
        required: true
    },
    data: {
        type: Object,
        default: null
    },
    loading: {
        type: Boolean,
        default: false
    },
    error: {
        type: String,
        default: null
    }
})

const emit = defineEmits(['data-update'])

const { createChartOptions } = useChartOptions()

const hasValidData = computed(() => props.data && props.data.labels && props.data.labels.length > 0)

const chartSeries = computed(() => {
    if (!props.data || !hasValidData.value) return []

    const { labels, values } = props.data
    const chartType = props.config.chartType

    // Ensure labels and values are arrays
    const safeLabels = Array.isArray(labels) ? labels : []
    const safeValues = Array.isArray(values) ? values : []

    if (['pie', 'donut'].includes(chartType)) {
        // For pie/donut, return array of values
        return safeValues.length > 0 ? safeValues : []
    }

    if (chartType === 'scatter') {
        // For scatter, values should be array of {x, y} objects
        // Ensure both x and y are defined
        const scatterData = safeValues
            .map((y, index) => {
                const x = safeLabels[index]
                // Only include if both x and y are valid
                if (x !== undefined && x !== null && y !== undefined && y !== null) {
                    return { x, y: Number(y) || 0 }
                }
                return null
            })
            .filter(item => item !== null)
        
        if (scatterData.length === 0) return []
        
        return [{
            name: props.config.yAxis?.label || 'Giá trị',
            data: scatterData
        }]
    }

    // For other chart types, return simple array of values
    return [{
        name: props.config.yAxis?.label || 'Giá trị',
        data: safeValues.map(v => Number(v) || 0)
    }]
})

const chartOptions = computed(() => {
    const config = props.config
    const data = props.data

    // Ensure colors are valid hex colors (not CSS variables)
    const colors = (config.colors || ['#2563eb']).map(color => {
        if (typeof color === 'string' && color.startsWith('var(--')) {
            return '#2563eb' // Fallback to default blue
        }
        return color || '#2563eb'
    })

    // Ensure labels is an array
    const categories = Array.isArray(data?.labels) ? data.labels : []

    const options = createChartOptions({
        type: config.chartType,
        colors: colors,
        hasLegend: config.legend?.show !== false,
        height: config.height || 400,
        xaxis: {
            categories: ['pie', 'donut', 'scatter'].includes(config.chartType) ? undefined : categories,
            title: {
                text: config.xAxis?.label || 'X Axis'
            }
        },
        yaxis: {
            title: {
                text: config.yAxis?.label || 'Y Axis'
            }
        },
        legend: {
            position: config.legend?.position || 'top',
            show: config.legend?.show !== false
        },
        title: config.title ? {
            text: config.title,
            align: 'left',
            style: {
                fontSize: '16px',
                fontWeight: 600
            }
        } : undefined,
        chart: {
            animations: {
                enabled: config.animation?.enabled !== false,
                speed: config.animation?.speed || 800
            },
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: true,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true
                }
            }
        }
    })

    // Update data when options change
    if (data) {
        emit('data-update', data)
    }

    return options
})
</script>

<style scoped>
.chart-preview {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.chart-preview__loading,
.chart-preview__error,
.chart-preview__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-8);
    color: var(--color-text-muted);
}

.chart-preview__loading i,
.chart-preview__error i,
.chart-preview__empty i {
    font-size: 3rem;
    margin-bottom: var(--spacing-2);
    opacity: 0.5;
}

.chart-preview__error i {
    color: var(--color-danger);
}

.chart-preview__chart {
    width: 100%;
    height: 100%;
}
</style>

