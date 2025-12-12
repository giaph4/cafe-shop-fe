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
import { useChartOptions } from '@/composables/useChartOptions'

const apexchart = VueApexCharts
const isMounted = ref(false)
const { createComputedChartOptions } = useChartOptions()

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

const chartSeries = computed(() => [
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
])

const baseChartOptions = createComputedChartOptions({
    type: 'line',
    height: 300,
    colors: ['var(--color-danger)', 'var(--color-warning)'],
    hasLegend: true,
    stroke: {
        curve: 'smooth',
        width: [2, 3]
    },
    xaxis: {
        type: 'datetime',
        labels: {
            format: 'dd/MM'
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
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
                    return value.toFixed(0)
                }
            }
        }
    ],
    tooltip: {
        y: {
            formatter: (value, { seriesIndex }) => {
                if (seriesIndex === 0) return `${value} đơn`
                return new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                }).format(value)
            }
        },
        x: {
            format: 'dd/MM/yyyy'
        }
    }
})

const chartOptions = computed(() => baseChartOptions.value)
</script>

<style scoped>
.cancellation-trend-chart {
    font-family: var(--font-family-sans);
}
</style>

