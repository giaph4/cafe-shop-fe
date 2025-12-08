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

const apexchart = VueApexCharts
const isMounted = ref(false)

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

const chartOptions = computed(() => ({
    chart: {
        type: 'line',
        height: 350,
        toolbar: {
            show: true
        },
        zoom: {
            enabled: true,
            type: 'x'
        }
    },
    dataLabels: {
        enabled: false
    },
    stroke: {
        curve: 'smooth',
        width: 2
    },
    markers: {
        size: 4,
        hover: {
            size: 6
        }
    },
    xaxis: {
        type: 'datetime',
        labels: {
            format: 'dd/MM/yyyy',
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
            text: 'Tiêu thụ',
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
        intersect: false,
        x: {
            format: 'dd/MM/yyyy'
        },
        y: {
            formatter: (val) => val.toFixed(2)
        }
    },
    legend: {
        show: false
    },
    grid: {
        borderColor: 'var(--color-border)',
        strokeDashArray: 4
    },
    colors: ['var(--color-primary)']
}))
</script>

<style scoped>
.consumption-chart {
    font-family: var(--font-family-sans);
}
</style>

