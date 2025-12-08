<template>
    <div class="cost-trend-chart">
        <apexchart
            v-if="isMounted && dailyCosts.length > 0"
            type="line"
            height="300"
            :options="chartOptions"
            :series="chartSeries"
        />
        <EmptyState
            v-else
            title="Chưa có dữ liệu"
            message="Không có dữ liệu xu hướng chi phí"
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
    dailyCosts: {
        type: Array,
        required: true,
        default: () => []
    }
})

const chartSeries = computed(() => {
    return [
        {
            name: 'Chi phí',
            data: props.dailyCosts.map(day => day.cost)
        },
        {
            name: 'Doanh thu',
            data: props.dailyCosts.map(day => day.revenue)
        }
    ]
})

const chartOptions = computed(() => ({
    chart: {
        type: 'line',
        height: 300,
        toolbar: {
            show: true
        },
        zoom: {
            enabled: true
        }
    },
    stroke: {
        curve: 'smooth',
        width: 2
    },
    xaxis: {
        categories: props.dailyCosts.map(day => {
            const date = new Date(day.date)
            return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
        }),
        labels: {
            style: {
                colors: 'var(--color-text)',
                fontFamily: 'var(--font-family-sans)',
                fontSize: '11px'
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
        },
        axisBorder: {
            color: 'var(--color-border)'
        },
        axisTicks: {
            color: 'var(--color-border)'
        }
    },
    tooltip: {
        shared: true,
        intersect: false,
        y: {
            formatter: (value) => {
                return new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                }).format(value)
            }
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
    colors: ['var(--color-danger)', 'var(--color-success)'],
    fill: {
        type: 'gradient',
        gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.3,
            opacityTo: 0.1,
            stops: [0, 100]
        }
    },
    markers: {
        size: 4,
        hover: {
            size: 6
        }
    }
}))
</script>

<style scoped>
.cost-trend-chart {
    font-family: var(--font-family-sans);
}
</style>

