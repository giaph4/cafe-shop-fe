<template>
    <div class="category-performance-chart">
        <apexchart
            v-if="isMounted && categoryPerformance.length > 0"
            type="bar"
            height="300"
            :options="chartOptions"
            :series="chartSeries"
        />
        <EmptyState
            v-else
            title="Chưa có dữ liệu"
            message="Không có dữ liệu hiệu suất danh mục"
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
    categoryPerformance: {
        type: Array,
        required: true,
        default: () => []
    }
})

const chartSeries = computed(() => {
    return [
        {
            name: 'Doanh thu',
            data: props.categoryPerformance.slice(0, 10).map(cat => cat.totalRevenue)
        },
        {
            name: 'Lợi nhuận',
            data: props.categoryPerformance.slice(0, 10).map(cat => cat.totalProfit)
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
            horizontal: true,
            barHeight: '60%',
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
        },
        title: {
            text: 'Giá trị (VNĐ)',
            style: {
                color: 'var(--color-heading)',
                fontFamily: 'var(--font-family-sans)',
                fontSize: '12px',
                fontWeight: 600
            }
        }
    },
    yaxis: {
        categories: props.categoryPerformance.slice(0, 10).map(cat => cat.categoryName),
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
    colors: ['var(--color-primary)', 'var(--color-success)'],
    fill: {
        opacity: 0.8
    }
}))
</script>

<style scoped>
.category-performance-chart {
    font-family: var(--font-family-sans);
}
</style>

