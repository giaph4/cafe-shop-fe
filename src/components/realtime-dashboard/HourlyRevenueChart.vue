<template>
  <div class="hourly-revenue-chart">
    <apexchart
      v-if="isMounted && hourlyRevenue.length > 0"
      type="area"
      height="300"
      :options="chartOptions"
      :series="chartSeries"
    />
    <EmptyState
      v-else
      title="Chưa có dữ liệu"
      message="Không có dữ liệu doanh thu theo giờ"
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, nextTick } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import EmptyState from '@/components/common/EmptyState.vue'

const apexchart = VueApexCharts
const isMounted = ref(false)

onMounted(async () => {
    await nextTick()
    isMounted.value = true
})

const props = defineProps({
    hourlyRevenue: {
        type: Array,
        required: true,
        default: () => []
    }
})

const chartSeries = computed(() => [
    {
        name: 'Doanh thu',
        data: props.hourlyRevenue.map(h => h.revenue)
    }
])

const chartOptions = computed(() => ({
    chart: {
        type: 'area',
        height: 300,
        toolbar: {
            show: true
        },
        animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800
        }
    },
    stroke: {
        curve: 'smooth',
        width: 3
    },
    fill: {
        type: 'gradient',
        gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.7,
            opacityTo: 0.3,
            stops: [0, 90, 100]
        }
    },
    dataLabels: {
        enabled: false
    },
    xaxis: {
        categories: props.hourlyRevenue.map(h => `${h.hour}:00`),
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
        labels: {
            formatter: (value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)  }M`
                if (value >= 1000) return `${(value / 1000).toFixed(1)  }K`
                return value.toFixed(0)
            },
            style: {
                colors: 'var(--color-text)',
                fontFamily: 'var(--font-family-sans)',
                fontSize: '12px'
            }
        },
        title: {
            text: 'Doanh thu (VNĐ)',
            style: {
                color: 'var(--color-heading)',
                fontFamily: 'var(--font-family-sans)',
                fontSize: '12px',
                fontWeight: 600
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
    legend: {
        show: false
    },
    grid: {
        borderColor: 'var(--color-border)',
        strokeDashArray: 4,
        padding: {
            top: 8,
            bottom: 20,
            left: 12,
            right: 12
        }
    },
    colors: ['var(--color-success)'],
    markers: {
        size: 4,
        hover: {
            size: 6
        }
    }
}))
</script>

<style scoped>
.hourly-revenue-chart {
    font-family: var(--font-family-sans);
}
</style>

