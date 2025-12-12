<template>
  <div class="consumption-chart">
    <apexchart
      v-if="isMounted && ingredient"
      type="line"
      height="350"
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
    ingredient: {
        type: Object,
        required: true
    }
})

const chartSeries = computed(() => {
    if (!props.ingredient || !props.ingredient.consumptionHistory) {
        return []
    }

    const consumptionData = props.ingredient.consumptionHistory.map(item => ({
        x: item.date,
        y: item.consumed
    }))

    return [{
        name: 'Tiêu thụ',
        data: consumptionData
    }]
})

const chartOptions = createComputedChartOptions({
    type: 'line',
    height: 350,
    colors: ['var(--color-primary)'],
    hasLegend: false,
    hasRotatedLabels: false,
    xaxis: {
        type: 'datetime',
        labels: {
            format: 'dd/MM/yyyy'
        }
    },
    yaxis: {
        title: {
            text: 'Tiêu thụ',
            style: {
                color: 'var(--color-heading)',
                fontFamily: 'var(--font-family-sans)',
                fontSize: '12px',
                fontWeight: 600
            }
        }
    },
    tooltip: {
        x: {
            format: 'dd/MM/yyyy'
        },
        y: {
            formatter: (val) => val.toFixed(2)
        }
    },
    chart: {
        zoom: {
            enabled: true,
            type: 'x'
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
.consumption-chart {
    font-family: var(--font-family-sans);
}
</style>

