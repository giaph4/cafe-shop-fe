<template>
  <div class="category-comparison">
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
    categories: {
        type: Array,
        required: true,
        default: () => []
    }
})

const chartSeries = computed(() => [{
    name: 'Margin (%)',
    data: props.categories.map(c => c.avgMargin)
}])

const chartOptions = createComputedChartOptions({
    type: 'bar',
    height: 300,
    colors: props.categories.map((_, index) => {
        const colorPalette = [
            'var(--color-primary)',
            'var(--color-success)',
            'var(--color-info)',
            'var(--color-warning)',
            'var(--color-danger)',
            '#8b5cf6',
            '#ec4899',
            '#14b8a6'
        ]
        return colorPalette[index % colorPalette.length]
    }),
    hasLegend: false,
    hasRotatedLabels: false,
    xaxis: {
        categories: props.categories.map(c => c.categoryName)
    },
    yaxis: {
        title: {
            text: 'Margin (%)',
            style: {
                color: 'var(--color-heading)',
                fontFamily: 'var(--font-family-sans)',
                fontSize: '12px',
                fontWeight: 600
            }
        },
        labels: {
            formatter: (val) => `${val.toFixed(0)}%`
        }
    },
    tooltip: {
        y: {
            formatter: (val) => `${val.toFixed(1)}%`
        }
    },
    plotOptions: {
        bar: {
            horizontal: true,
            borderRadius: 4,
            distributed: true
        }
    },
    dataLabels: {
        enabled: true,
        formatter: (val) => `${val.toFixed(1)}%`
    },
    fill: {
        opacity: 0.8
    }
})
</script>

<style scoped>
.category-comparison {
    font-family: var(--font-family-sans);
}
</style>

