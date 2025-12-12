<template>
  <div class="comparison-chart">
    <apexchart
      v-if="isMounted"
      type="bar"
      height="400"
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
    staffList: {
        type: Array,
        required: true,
        default: () => []
    }
})

const chartSeries = computed(() => [
    {
        name: 'Điểm hiệu suất',
        data: props.staffList.map(s => s.metrics.performanceScore)
    },
    {
        name: 'Doanh thu (x1000)',
        data: props.staffList.map(s => s.metrics.revenue / 1000)
    },
    {
        name: 'Số đơn',
        data: props.staffList.map(s => s.metrics.ordersCount)
    }
])

const chartOptions = computed(() => ({
    chart: {
        type: 'bar',
        height: 400,
        toolbar: {
            show: true
        }
    },
    plotOptions: {
        bar: {
            horizontal: false,
            columnWidth: '55%',
            borderRadius: 4
        }
    },
    dataLabels: {
        enabled: true
    },
    xaxis: {
        categories: props.staffList.map(s => s.fullName),
        labels: {
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
        labels: {
            style: {
                colors: 'var(--color-text)',
                fontFamily: 'var(--font-family-sans)',
                fontSize: '12px'
            }
        }
    },
    tooltip: {
        shared: true,
        intersect: false
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
    colors: ['var(--color-primary)', 'var(--color-success)', 'var(--color-info)'],
    fill: {
        opacity: 0.8
    }
}))
</script>

<style scoped>
.comparison-chart {
    font-family: var(--font-family-sans);
}
</style>

