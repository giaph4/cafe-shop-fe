<template>
    <div class="attendance-chart">
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
        name: 'Tỷ lệ chuyên cần',
        data: top10.map(s => s.metrics.attendanceRate * 100)
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
        formatter: (val) => val.toFixed(1) + '%'
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
            text: 'Tỷ lệ (%)',
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
            },
            formatter: (val) => val.toFixed(0) + '%'
        },
        max: 100
    },
    tooltip: {
        shared: true,
        intersect: false,
        y: {
            formatter: (val) => val.toFixed(1) + '%'
        }
    },
    legend: {
        show: false
    },
    grid: {
        borderColor: 'var(--color-border)',
        strokeDashArray: 4
    },
    colors: ['var(--color-info)'],
    fill: {
        opacity: 0.8
    }
}))
</script>

<style scoped>
.attendance-chart {
    font-family: var(--font-family-sans);
}
</style>

