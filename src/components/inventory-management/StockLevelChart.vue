<template>
  <div class="stock-level-chart">
    <apexchart
      v-if="isMounted"
      type="area"
      height="300"
      :options="chartOptions"
      :series="chartSeries"
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, nextTick } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

const apexchart = VueApexCharts
const isMounted = ref(false)

onMounted(async () => {
    await nextTick()
    isMounted.value = true
})

const props = defineProps({
    history: {
        type: Array,
        required: true,
        default: () => []
    }
})

const chartSeries = computed(() => {
    const stockData = props.history.map(item => ({
        x: item.date,
        y: item.stock
    }))

    const reorderLevelData = props.history.map(item => ({
        x: item.date,
        y: item.reorderLevel
    }))

    return [
        {
            name: 'Tồn kho',
            data: stockData,
            color: 'var(--color-primary)'
        },
        {
            name: 'Mức đặt lại',
            data: reorderLevelData,
            color: 'var(--color-warning)'
        }
    ]
})

const chartOptions = computed(() => ({
    chart: {
        type: 'area',
        height: 300,
        toolbar: {
            show: true
        },
        zoom: {
            enabled: true
        }
    },
    dataLabels: {
        enabled: false
    },
    stroke: {
        curve: 'smooth',
        width: 2
    },
    fill: {
        type: 'gradient',
        gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.7,
            opacityTo: 0.3,
            stops: [0, 90, 100]
        }
    },
    xaxis: {
        type: 'datetime',
        labels: {
            format: 'dd/MM/yyyy',
            style: {
                colors: 'var(--color-text)',
                fontFamily: 'var(--font-family-sans)',
                fontSize: '12px'
            }
        },
        axisBorder: {
            color: 'var(--color-border)'
        },
        axisTicks: {
            color: 'var(--color-border)'
        }
    },
    yaxis: {
        title: {
            text: 'Số lượng',
            style: {
                color: 'var(--color-heading)',
                fontFamily: 'var(--font-family-sans)',
                fontSize: '12px',
                fontWeight: 600
            }
        },
        labels: {
            formatter: (value) => Math.round(value),
            style: {
                colors: 'var(--color-text)',
                fontFamily: 'var(--font-family-sans)',
                fontSize: '12px'
            }
        }
    },
    tooltip: {
        shared: true,
        intersect: false,
        x: {
            format: 'dd/MM/yyyy'
        }
    },
    legend: {
        position: 'top',
        horizontalAlign: 'right',
        fontFamily: 'var(--font-family-sans)',
        fontSize: '12px',
        labels: {
            colors: 'var(--color-text)'
        }
    },
    grid: {
        borderColor: 'var(--color-border)',
        strokeDashArray: 4
    },
    colors: ['var(--color-primary)', 'var(--color-warning)'],
    theme: {
        mode: 'light'
    }
}))
</script>

<style scoped>
.stock-level-chart {
    width: 100%;
}
</style>

