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
import { useChartOptions } from '@/composables/useChartOptions'

const apexchart = VueApexCharts
const isMounted = ref(false)
const { createComputedChartOptions } = useChartOptions()

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

const chartSeries = computed(() => [
    {
        name: 'Chi phí',
        data: props.dailyCosts.map(day => day.cost)
    },
    {
        name: 'Doanh thu',
        data: props.dailyCosts.map(day => day.revenue)
    }
])

const chartOptions = createComputedChartOptions({
    type: 'line',
    height: 300,
    colors: ['var(--color-danger)', 'var(--color-success)'],
    hasLegend: true,
    hasRotatedLabels: false,
    xaxis: {
        categories: props.dailyCosts.map(day => {
            const date = new Date(day.date)
            return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
        })
    },
    yaxis: {
        labels: {
            formatter: (value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
                return value.toFixed(0)
            }
        }
    },
    tooltip: {
        y: {
            formatter: (value) => new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(value)
        }
    },
    chart: {
        zoom: {
            enabled: true
        }
    },
    markers: {
        size: 4,
        hover: {
            size: 6
        }
    }
})
</script>

<style scoped>
.cost-trend-chart {
    font-family: var(--font-family-sans);
}
</style>

