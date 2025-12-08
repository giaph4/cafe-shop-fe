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

const apexchart = VueApexCharts
const isMounted = ref(false)

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

const chartSeries = computed(() => {
    return [{
        name: 'Margin (%)',
        data: props.categories.map(c => c.avgMargin)
    }]
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
            borderRadius: 4
        }
    },
    dataLabels: {
        enabled: true,
        formatter: (val) => val.toFixed(1) + '%'
    },
    xaxis: {
        categories: props.categories.map(c => c.categoryName),
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
            text: 'Margin (%)',
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
            },
            formatter: (val) => val.toFixed(0) + '%'
        }
    },
    tooltip: {
        shared: true,
        intersect: false,
        y: {
            formatter: (val) => val.toFixed(1) + '%'
        }
    },
    legend: {
        show: false
    },
    grid: {
        borderColor: 'var(--color-border)',
        strokeDashArray: 4
    },
    colors: ['var(--color-primary)'],
    fill: {
        opacity: 0.8
    }
}))
</script>

<style scoped>
.category-comparison {
    font-family: var(--font-family-sans);
}
</style>

