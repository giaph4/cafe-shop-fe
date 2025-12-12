<template>
  <div class="revenue-chart">
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
    staffList: {
        type: Array,
        required: true,
        default: () => []
    }
})

const chartSeries = computed(() => {
    const top10 = props.staffList.slice(0, 10)
    return [{
        name: 'Doanh thu',
        data: top10.map(s => s.metrics.revenue)
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
            horizontal: false,
            columnWidth: '60%',
            borderRadius: 4
        }
    },
    dataLabels: {
        enabled: true,
        formatter: (val) => {
            if (val >= 1000000) return `${(val / 1000000).toFixed(1)  }M`
            if (val >= 1000) return `${(val / 1000).toFixed(1)  }K`
            return val.toFixed(0)
        }
    },
    xaxis: {
        categories: props.staffList.slice(0, 10).map(s => s.fullName),
        labels: {
            style: {
                colors: 'var(--color-text)',
                fontFamily: 'var(--font-family-sans)',
                fontSize: '12px'
            },
            rotate: -45,
            rotateAlways: true,
            maxHeight: 60,
            offsetY: 5
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
            text: 'Doanh thu (VNĐ)',
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
            formatter: (val) => {
                if (val >= 1000000) return `${(val / 1000000).toFixed(1)  }M`
                if (val >= 1000) return `${(val / 1000).toFixed(1)  }K`
                return val.toFixed(0)
            }
        }
    },
    tooltip: {
        shared: true,
        intersect: false,
        y: {
            formatter: (val) => new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(val)
        }
    },
    legend: {
        show: false
    },
    grid: {
        borderColor: 'var(--color-border)',
        strokeDashArray: 4,
        padding: {
            top: 8,
            bottom: 40,
            left: 12,
            right: 12
        }
    },
    colors: ['var(--color-success)'],
    fill: {
        opacity: 0.8
    }
}))
</script>

<style scoped>
.revenue-chart {
    font-family: var(--font-family-sans);
}
</style>

