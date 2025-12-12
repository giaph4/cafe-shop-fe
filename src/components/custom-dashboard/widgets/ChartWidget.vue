<template>
  <WidgetBase
    :widget="widget"
    :is-editing="isEditing"
    :is-dragging="isDragging"
  >
    <div class="chart-widget">
      <div
        v-if="loading"
        class="chart-widget__loading"
      >
        <div class="spinner-border" />
        <p class="mt-2 text-muted">
          Đang tải dữ liệu...
        </p>
      </div>
      <div
        v-else-if="error"
        class="chart-widget__error"
      >
        <i class="bi bi-exclamation-triangle" />
        <p>{{ error }}</p>
      </div>
      <div
        v-else-if="chartData && hasValidData"
        class="chart-widget__chart"
      >
        <apexchart
          :type="chartType"
          :options="chartOptions"
          :series="chartSeries"
          :height="chartHeight"
        />
      </div>
      <div
        v-else
        class="chart-widget__empty"
      >
        <i class="bi bi-bar-chart" />
        <p>Không có dữ liệu</p>
      </div>
    </div>
  </WidgetBase>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import WidgetBase from '../WidgetBase.vue'
import { useChartOptions } from '@/composables/useChartOptions'
import { fetchChartData } from '@/api/widgetDataService'
import logger from '@/utils/logger'

const apexchart = VueApexCharts

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
    data: {
        type: Object,
        default: null
    }
})

const loading = ref(false)
const error = ref(null)
const chartData = ref(null)
let refreshInterval = null

const { createChartOptions } = useChartOptions()

// Validate và format series data
const chartSeries = computed(() => {
    if (!chartData.value) return []

    const isCircular = ['pie', 'donut', 'radialBar'].includes(chartType.value)

    try {
        if (isCircular) {
            // Pie/Donut charts cần array of numbers
            if (Array.isArray(chartData.value.series)) {
                // Nếu series là array of objects, lấy data
                if (chartData.value.series.length > 0 && typeof chartData.value.series[0] === 'object') {
                    return chartData.value.series.map(s => {
                        const val = s.data || s.value || s
                        return typeof val === 'number' ? val : 0
                    })
                }
                // Nếu series là array of numbers
                return chartData.value.series.map(v => typeof v === 'number' ? v : 0)
            }
            // Fallback: empty array
            return []
        }
        // Line/Bar/Area charts cần array of series objects
        if (Array.isArray(chartData.value.series)) {
            return chartData.value.series.map(s => {
                if (typeof s === 'object' && s !== null) {
                    return {
                        name: s.name || 'Series',
                        data: Array.isArray(s.data) ? s.data.map(v => typeof v === 'number' ? v : 0) : []
                    }
                }
                return { name: 'Series', data: [] }
            }).filter(s => s.data.length > 0)
        }
        return []
    } catch (err) {
        logger.error('[ChartWidget] Lỗi khi định dạng dữ liệu biểu đồ:', err)
        return []
    }
})

// Check if has valid data
const hasValidData = computed(() => {
    if (!chartData.value) return false

    const isCircular = ['pie', 'donut', 'radialBar'].includes(chartType.value)

    if (isCircular) {
        const series = chartSeries.value
        return Array.isArray(series) && series.length > 0 && series.some(v => v > 0)
    }
    return Array.isArray(chartData.value.series) &&
               chartData.value.series.length > 0 &&
               chartData.value.series.some(s => {
                   const data = s.data || s
                   return Array.isArray(data) && data.length > 0
               })
})

// Fetch data từ API
const fetchData = async () => {
    if (!props.widget.config?.dataSource) {
        // Nếu có data từ props, dùng data đó
        if (props.data) {
            chartData.value = props.data
        } else {
            chartData.value = null
        }
        return
    }

    loading.value = true
    error.value = null

    try {
        const data = await fetchChartData(props.widget.config)
        // Validate data trước khi set
        if (data && (data.series || Array.isArray(data))) {
            chartData.value = data
        } else {
            chartData.value = null
            error.value = 'Dữ liệu không hợp lệ'
        }
    } catch (err) {
        error.value = err.message || 'Không thể tải dữ liệu'
        logger.error('[ChartWidget] Lỗi khi tải dữ liệu biểu đồ:', err)
        chartData.value = null
    } finally {
        loading.value = false
    }
}

const chartType = computed(() => props.widget.config?.chartType || 'line')

const chartHeight = computed(() => props.widget.config?.height || 300)

const chartOptions = computed(() => {
    try {
        const config = props.widget.config || {}
        const isCircular = ['pie', 'donut', 'radialBar'].includes(chartType.value)

        // Lấy colors từ chartData hoặc config hoặc default
        const colors = chartData.value?.colors ||
                      (Array.isArray(config.colors) ? config.colors : null) ||
                      ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

        // Base options
        const baseOptions = createChartOptions({
            type: chartType.value,
            colors,
            hasRotatedLabels: Boolean(config.hasRotatedLabels),
            hasLegend: config.showLegend !== false,
            height: Number(chartHeight.value) || 300,
            ...(config.chartOptions || {})
        })

        // Thêm xaxis cho non-circular charts
        if (!isCircular) {
            const categories = chartData.value?.categories || []
            baseOptions.xaxis = {
                ...(baseOptions.xaxis || {}),
                categories: Array.isArray(categories) ? categories : [],
                ...(config.xaxis || {})
            }
        }

        // Thêm yaxis nếu không phải circular
        if (!isCircular && config.yaxis) {
            baseOptions.yaxis = {
                ...(baseOptions.yaxis || {}),
                ...config.yaxis
            }
        }

        // Thêm labels cho pie/donut charts
        if (isCircular && chartData.value?.categories) {
            const labels = chartData.value.categories
            if (Array.isArray(labels) && labels.length > 0) {
                baseOptions.labels = labels
            }
        }

        // Thêm title nếu có
        if (config.title) {
            baseOptions.title = {
                text: String(config.title),
                align: 'left',
                style: {
                    fontSize: '14px',
                    fontWeight: 600
                }
            }
        }

        // Đảm bảo không có undefined/null values
        return JSON.parse(JSON.stringify(baseOptions))
    } catch (err) {
        logger.error('[ChartWidget] Lỗi khi tạo tùy chọn biểu đồ:', err)
        // Trả về tùy chọn mặc định an toàn
        return {
            chart: {
                type: chartType.value,
                height: chartHeight.value
            },
            series: [],
            xaxis: { categories: [] }
        }
    }
})

watch(() => props.data, (newData) => {
    if (newData) {
        chartData.value = newData
    }
}, { immediate: true })

watch(() => props.widget.config, () => {
    fetchData()
}, { deep: true })

onMounted(() => {
    // Initialize với data từ widget config nếu có
    if (props.widget.config?.data) {
        chartData.value = props.widget.config.data
    } else {
        fetchData()
    }

    // Auto refresh nếu có refreshInterval
    if (props.widget.config?.refreshInterval && props.widget.config.refreshInterval > 0) {
        refreshInterval = setInterval(() => {
            if (!props.isEditing) {
                fetchData()
            }
        }, props.widget.config.refreshInterval * 1000)
    }
})

onBeforeUnmount(() => {
    if (refreshInterval) {
        clearInterval(refreshInterval)
    }
})
</script>

<style scoped>
.chart-widget {
    width: 100%;
    min-height: 200px;
}

.chart-widget__loading,
.chart-widget__error,
.chart-widget__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    min-height: 200px;
    color: var(--color-text-muted);
}

.chart-widget__chart {
    width: 100%;
}
</style>

