<template>
  <div class="forecast-chart">
    <apexchart
      v-if="isMounted"
      type="line"
      height="400"
      :options="chartOptions"
      :series="chartSeries"
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, nextTick } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { useChartOptions } from '@/composables/useChartOptions'

const apexchart = VueApexCharts
const isMounted = ref(false)
const { createComputedChartOptions } = useChartOptions()

onMounted(async () => {
    await nextTick()
    isMounted.value = true
})

const props = defineProps({
    historical: {
        type: Array,
        required: true,
        default: () => []
    },
    forecasts: {
        type: Array,
        required: true,
        default: () => []
    }
})

const chartSeries = computed(() => {
    const historicalData = props.historical.map(item => ({
        x: item.date,
        y: item.value
    }))

    const forecastData = props.forecasts.map(item => ({
        x: item.date,
        y: item.forecast
    }))

    const confidenceUpper = props.forecasts.map(item => ({
        x: item.date,
        y: item.confidenceUpper
    }))

    const confidenceLower = props.forecasts.map(item => ({
        x: item.date,
        y: item.confidenceLower
    }))

    return [
        {
            name: 'Lịch sử',
            data: historicalData,
            color: 'var(--color-text-muted)'
        },
        {
            name: 'Dự báo',
            data: forecastData,
            color: 'var(--color-primary)'
        },
        {
            name: 'Giới hạn trên',
            data: confidenceUpper,
            color: 'var(--color-info)',
            type: 'area',
            fillOpacity: 0.1
        },
        {
            name: 'Giới hạn dưới',
            data: confidenceLower,
            color: 'var(--color-info)',
            type: 'area',
            fillOpacity: 0.1
        }
    ]
})

const baseChartOptions = createComputedChartOptions({
    type: 'line',
    height: 400,
    colors: ['var(--color-text-muted)', 'var(--color-primary)', 'var(--color-info)', 'var(--color-info)'],
    hasLegend: true,
    chart: {
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
        },
        zoom: {
            enabled: true,
            type: 'x'
        }
    },
    stroke: {
        curve: 'smooth',
        width: [2, 3, 1, 1]
    },
    fill: {
        type: 'gradient',
        gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.3,
            opacityTo: 0.1,
            stops: [0, 90, 100]
        }
    },
    markers: {
        size: [4, 5, 0, 0],
        hover: {
            size: 6
        }
    },
    xaxis: {
        type: 'datetime',
        labels: {
            format: 'dd/MM/yyyy'
        }
    },
    yaxis: {
        labels: {
            formatter: (value) => {
                if (value >= 1000000) {
                    return `${(value / 1000000).toFixed(1)}M`
                }
                if (value >= 1000) {
                    return `${(value / 1000).toFixed(1)}K`
                }
                return value.toFixed(0)
            }
        },
        title: {
            text: 'Doanh thu (VNĐ)',
            style: {
                color: 'var(--color-heading)',
                fontFamily: 'var(--font-family-sans)',
                fontSize: '12px',
                fontWeight: 600
            }
        }
    },
    tooltip: {
        y: {
            formatter: (value) => new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(value)
        },
        x: {
            format: 'dd/MM/yyyy'
        }
    }
})

const chartOptions = computed(() => ({
    ...baseChartOptions.value,
    annotations: {
        xaxis: props.historical.length > 0 ? [{
            x: new Date(props.historical[props.historical.length - 1].date).getTime(),
            borderColor: 'var(--color-danger)',
            strokeDashArray: 4,
            label: {
                text: 'Bắt đầu dự báo',
                style: {
                    color: 'var(--color-danger)',
                    fontSize: '12px',
                    fontFamily: 'var(--font-family-sans)',
                    fontWeight: 600
                }
            }
        }] : []
    }
}))
</script>

<style scoped>
.forecast-chart {
    width: 100%;
}
</style>

