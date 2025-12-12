<template>
  <div class="performance-chart">
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
import { useChartOptions } from '@/composables/useChartOptions'

const apexchart = VueApexCharts
const isMounted = ref(false)
const { createComputedChartOptions } = useChartOptions()

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
        name: 'Điểm hiệu suất',
        data: top10.map(s => s.metrics.performanceScore)
    }]
})

const chartOptions = createComputedChartOptions({
    type: 'bar',
    height: 300,
    colors: ['var(--color-primary)'],
    hasRotatedLabels: true,
    hasLegend: false,
    plotOptions: {
        bar: {
            horizontal: false,
            columnWidth: '60%',
            borderRadius: 4
        }
    },
    dataLabels: {
        enabled: true,
        formatter: (val) => val.toFixed(1)
    },
    xaxis: {
        categories: props.staffList.slice(0, 10).map(s => s.fullName)
    },
    yaxis: {
        title: {
            text: 'Điểm',
            style: {
                color: 'var(--color-heading)',
                fontFamily: 'var(--font-family-sans)',
                fontSize: '12px',
                fontWeight: 600
            }
        }
    }
})
</script>

<style scoped>
.performance-chart {
    font-family: var(--font-family-sans);
}
</style>

