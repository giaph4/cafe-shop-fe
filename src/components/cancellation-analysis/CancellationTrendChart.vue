<template>
    <div class="cancellation-trend-chart">
        <apexchart
            v-if="isMounted && dailyTrend.length > 0"
            type="line"
            height="300"
            :options="chartOptions"
            :series="chartSeries"
        />
        <EmptyState
            v-else
            title="Chưa có dữ liệu"
            message="Không có dữ liệu xu hướng hủy đơn"
        />
    </div>
</template>

<script setup>
import { computed, ref, onMounted, nextTick } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import EmptyState from '@/components/common/EmptyState.vue'

const apexchart = VueApexCharts
const isMounted = ref(false)

onMounted(async () => {
    await nextTick()
    isMounted.value = true
})

const props = defineProps({
    dailyTrend: {
        type: Array,
        required: true,
        default: () => []
    }
})

const chartSeries = computed(() => {
    return [
        {
            name: 'Số đơn hủy',
            data: props.dailyTrend.map(d => ({
                x: d.date,
                y: d.count
            }))
        },
        {
            name: 'Doanh thu mất',
            data: props.dailyTrend.map(d => ({
                x: d.date,
                y: d.revenue
            }))
        }
    ]
})

const chartOptions = computed(() => ({
    chart: {
        type: 'line',
        height: 300,
        toolbar: {
            show: true
        }
    },
    stroke: {
        curve: 'smooth',
        width: [2, 3]
    },
    dataLabels: {
        enabled: false
    },
    xaxis: {
        type: 'datetime',
        labels: {
            format: 'dd/MM',
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
                text: 'Số đơn hủy',
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
                text: 'Doanh thu mất (VNĐ)',
                style: {
                    color: 'var(--color-heading)',
                    fontFamily: 'var(--font-family-sans)',
                    fontSize: '12px',
                    fontWeight: 600
                }
            },
            labels: {
                formatter: (value) => {
                    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M'
                    if (value >= 1000) return (value / 1000).toFixed(1) + 'K'
                    return value.toFixed(0)
                },
                style: {
                    colors: 'var(--color-text)',
                    fontFamily: 'var(--font-family-sans)',
                    fontSize: '12px'
                }
            }
        }
    ],
    tooltip: {
        shared: true,
        intersect: false,
        y: {
            formatter: (value, { seriesIndex }) => {
                if (seriesIndex === 0) return value + ' đơn'
                return new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                }).format(value)
            }
        },
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
    colors: ['var(--color-danger)', 'var(--color-warning)']
}))
</script>

<style scoped>
.cancellation-trend-chart {
    font-family: var(--font-family-sans);
}
</style>

