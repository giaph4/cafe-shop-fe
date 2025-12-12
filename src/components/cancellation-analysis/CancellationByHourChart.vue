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
import { useChartOptions } from '@/composables/useChartOptions'

const apexchart = VueApexCharts
const isMounted = ref(false)
const { createComputedChartOptions } = useChartOptions()

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

const chartSeries = computed(() => [
    {
        name: 'Số đơn hủy',
        data: props.hourlyAnalysis.map(h => h.count)
    }
])

const baseChartOptions = createComputedChartOptions({
    type: 'bar',
    height: 300,
    colors: ['var(--color-danger)'],
    hasLegend: false,
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
    yaxis: {
        title: {
            text: 'Số đơn hủy',
            style: {
                color: 'var(--color-heading)',
                fontFamily: 'var(--font-family-sans)',
                fontSize: '12px',
                fontWeight: 600
            }
        }
    }
})

const chartOptions = computed(() => ({
    ...baseChartOptions.value,
    xaxis: {
        ...baseChartOptions.value.xaxis,
        categories: props.hourlyAnalysis.map(h => `${h.hour}:00`)
    }
}))
</script>

<style scoped>
.cancellation-by-hour-chart {
    font-family: var(--font-family-sans);
}
</style>

