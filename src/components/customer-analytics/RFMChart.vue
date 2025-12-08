<template>
    <div class="rfm-chart">
        <apexchart
            v-if="isMounted"
            type="scatter"
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
    customers: {
        type: Array,
        required: true,
        default: () => []
    }
})

const chartSeries = computed(() => {
    const data = props.customers.map(c => ({
        x: c.metrics.recency,
        y: c.metrics.frequency,
        z: c.metrics.monetary,
        customer: c.fullName,
        segment: c.segment
    }))
    
    return [{
        name: 'Khách hàng',
        data: data
    }]
})

const chartOptions = computed(() => ({
    chart: {
        type: 'scatter',
        height: 350,
        toolbar: {
            show: true
        },
        zoom: {
            enabled: true
        }
    },
    xaxis: {
        title: {
            text: 'Recency (ngày)',
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
            text: 'Frequency (số đơn)',
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
        custom: ({ seriesIndex, dataPointIndex, w }) => {
            const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex]
            return `
                <div style="padding: 8px; font-family: var(--font-family-sans);">
                    <div style="font-weight: 600; margin-bottom: 4px;">${data.customer}</div>
                    <div>Phân loại: ${data.segment}</div>
                    <div>Recency: ${data.x} ngày</div>
                    <div>Frequency: ${data.y} đơn</div>
                    <div>Monetary: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.z)}</div>
                </div>
            `
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
    markers: {
        size: 6,
        hover: {
            size: 8
        }
    }
}))
</script>

<style scoped>
.rfm-chart {
    font-family: var(--font-family-sans);
}
</style>

