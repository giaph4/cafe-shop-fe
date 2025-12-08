<template>
    <div class="cancellation-by-hour-chart">
        <apexchart
            v-if="isMounted && hourlyAnalysis.length > 0"
            type="bar"
            height="300"
            :options="chartOptions"
            :series="chartSeries"
        />
        <EmptyState
            v-else
            title="Chưa có dữ liệu"
            message="Không có dữ liệu hủy đơn theo giờ"
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
    hourlyAnalysis: {
        type: Array,
        required: true,
        default: () => []
    }
})

const chartSeries = computed(() => {
    return [
        {
            name: 'Số đơn hủy',
            data: props.hourlyAnalysis.map(h => h.count)
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
        enabled: true
    },
    xaxis: {
        categories: props.hourlyAnalysis.map(h => `${h.hour}:00`),
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
    colors: ['var(--color-danger)'],
    fill: {
        opacity: 0.8
    }
}))
</script>

<style scoped>
.cancellation-by-hour-chart {
    font-family: var(--font-family-sans);
}
</style>

