<template>
    <div class="weekly-pattern-chart">
        <apexchart
            v-if="isMounted && weeklyPattern.length > 0"
            type="bar"
            height="300"
            :options="chartOptions"
            :series="chartSeries"
        />
        <EmptyState
            v-else
            title="Chưa có dữ liệu"
            message="Không có dữ liệu pattern theo tuần"
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
    weeklyPattern: {
        type: Array,
        required: true,
        default: () => []
    }
})

const chartSeries = computed(() => {
    return [
        {
            name: 'Doanh thu TB',
            data: props.weeklyPattern.map(d => d.avg)
        }
    ]
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
            columnWidth: '55%',
            borderRadius: 4
        }
    },
    dataLabels: {
        enabled: true,
        formatter: (value) => {
            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M'
            if (value >= 1000) return (value / 1000).toFixed(1) + 'K'
            return value.toFixed(0)
        }
    },
    xaxis: {
        categories: props.weeklyPattern.map(d => d.dayName),
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
        title: {
            text: 'Doanh thu TB (VNĐ)',
            style: {
                color: 'var(--color-heading)',
                fontFamily: 'var(--font-family-sans)',
                fontSize: '12px',
                fontWeight: 600
            }
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
.weekly-pattern-chart {
    font-family: var(--font-family-sans);
}
</style>

