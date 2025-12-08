<template>
    <div class="trends-chart">
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

const apexchart = VueApexCharts
const isMounted = ref(false)

onMounted(async () => {
    await nextTick()
    isMounted.value = true
})

const props = defineProps({
    trendsData: {
        type: Array,
        required: true,
        default: () => []
    }
})

const chartSeries = computed(() => {
    return [
        {
            name: 'Điểm hiệu suất',
            data: props.trendsData.map(t => ({
                x: t.period,
                y: t.performanceScore
            }))
        },
        {
            name: 'Doanh thu',
            data: props.trendsData.map(t => ({
                x: t.period,
                y: t.revenue
            }))
        },
        {
            name: 'Số đơn',
            data: props.trendsData.map(t => ({
                x: t.period,
                y: t.ordersCount
            }))
        },
        {
            name: 'Tỷ lệ chuyên cần',
            data: props.trendsData.map(t => ({
                x: t.period,
                y: t.attendanceRate * 100
            }))
        }
    ]
})

const chartOptions = computed(() => ({
    chart: {
        type: 'line',
        height: 400,
        toolbar: {
            show: true
        },
        zoom: {
            enabled: true,
            type: 'x'
        }
    },
    dataLabels: {
        enabled: false
    },
    stroke: {
        curve: 'smooth',
        width: 2
    },
    markers: {
        size: 4,
        hover: {
            size: 6
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
    yaxis: [
        {
            title: {
                text: 'Điểm / Doanh thu / Số đơn',
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
        {
            opposite: true,
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
        }
    ],
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
    colors: ['var(--color-primary)', 'var(--color-success)', 'var(--color-info)', 'var(--color-warning)']
}))
</script>

<style scoped>
.trends-chart {
    font-family: var(--font-family-sans);
}
</style>

