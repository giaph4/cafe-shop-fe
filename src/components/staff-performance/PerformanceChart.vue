<template>
    <div class="performance-chart">
        <apexchart
            v-if="isMounted"
            type="bar"
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
    staffList: {
        type: Array,
        required: true,
        default: () => []
    }
})

const chartSeries = computed(() => {
    const top10 = props.staffList.slice(0, 10)
    return [{
        name: 'Điểm hiệu suất',
        data: top10.map(s => s.metrics.performanceScore)
    }]
})

const chartOptions = computed(() => ({
    chart: {
        type: 'bar',
        height: 300,
        toolbar: {
            show: true
        }
    },
    plotOptions: {
        bar: {
            horizontal: false,
            columnWidth: '60%',
            borderRadius: 4
        }
    },
    dataLabels: {
        enabled: true,
        formatter: (val) => val.toFixed(1)
    },
    xaxis: {
        categories: props.staffList.slice(0, 10).map(s => s.fullName),
        labels: {
            style: {
                colors: 'var(--color-text)',
                fontFamily: 'var(--font-family-sans)',
                fontSize: '12px'
            },
            rotate: -45,
            rotateAlways: false
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
            text: 'Điểm',
            style: {
                color: 'var(--color-heading)',
                fontFamily: 'var(--font-family-sans)',
                fontSize: '12px',
                fontWeight: 600
            }
        },
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
        show: false
    },
    grid: {
        borderColor: 'var(--color-border)',
        strokeDashArray: 4
    },
    colors: ['var(--color-primary)'],
    fill: {
        opacity: 0.8
    }
}))
</script>

<style scoped>
.performance-chart {
    font-family: var(--font-family-sans);
}
</style>

