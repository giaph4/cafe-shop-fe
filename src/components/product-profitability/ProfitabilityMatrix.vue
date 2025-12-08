<template>
    <div class="profitability-matrix">
        <apexchart
            v-if="isMounted"
            type="scatter"
            height="400"
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
    products: {
        type: Array,
        required: true,
        default: () => []
    }
})

const chartSeries = computed(() => {
    const stars = []
    const cashCows = []
    const questionMarks = []
    const dogs = []
    
    props.products.forEach(product => {
        const dataPoint = {
            x: product.totalQuantity,
            y: product.margin,
            z: product.profit,
            product: product.name,
            classification: product.classification
        }
        
        switch (product.classification) {
            case 'Star':
                stars.push(dataPoint)
                break
            case 'Cash Cow':
                cashCows.push(dataPoint)
                break
            case 'Question Mark':
                questionMarks.push(dataPoint)
                break
            case 'Dog':
                dogs.push(dataPoint)
                break
        }
    })
    
    return [
        {
            name: 'Star',
            data: stars,
            color: '#10b981'
        },
        {
            name: 'Cash Cow',
            data: cashCows,
            color: '#3b82f6'
        },
        {
            name: 'Question Mark',
            data: questionMarks,
            color: '#f59e0b'
        },
        {
            name: 'Dog',
            data: dogs,
            color: '#ef4444'
        }
    ]
})

const chartOptions = computed(() => ({
    chart: {
        type: 'scatter',
        height: 400,
        toolbar: {
            show: true
        },
        zoom: {
            enabled: true
        }
    },
    xaxis: {
        title: {
            text: 'Volume (Số lượng)',
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
        custom: ({ seriesIndex, dataPointIndex, w }) => {
            const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex]
            return `
                <div style="padding: 8px; font-family: var(--font-family-sans);">
                    <div style="font-weight: 600; margin-bottom: 4px;">${data.product}</div>
                    <div>Phân loại: ${data.classification}</div>
                    <div>Volume: ${data.x}</div>
                    <div>Margin: ${data.y.toFixed(1)}%</div>
                    <div>Profit: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.z)}</div>
                </div>
            `
        }
    },
    legend: {
        position: 'top',
        horizontalAlign: 'right',
        fontFamily: 'var(--font-family-sans)',
        fontSize: '12px',
        labels: {
            colors: 'var(--color-text)'
        }
    },
    grid: {
        borderColor: 'var(--color-border)',
        strokeDashArray: 4
    },
    markers: {
        size: 6,
        hover: {
            size: 8
        }
    }
}))
</script>

<style scoped>
.profitability-matrix {
    font-family: var(--font-family-sans);
}
</style>

