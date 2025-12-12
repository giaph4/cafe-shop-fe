<template>
  <div class="hourly-demand-chart">
    <apexchart
      v-if="isMounted && hourlyAnalysis.length > 0"
      type="bar"
      height="350"
      :options="chartOptions"
      :series="chartSeries"
    />
    <EmptyState
      v-else
      title="Chưa có dữ liệu"
      message="Không có dữ liệu phân tích theo giờ"
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
    hourlyAnalysis: {
        type: Array,
        required: true,
        default: () => []
    }
})

const chartSeries = computed(() => [
    {
        name: 'Doanh thu',
        data: props.hourlyAnalysis.map(h => h.totalRevenue)
    },
    {
        name: 'Số nhân viên',
        data: props.hourlyAnalysis.map(h => h.totalStaff)
    }
])

const chartOptions = computed(() => ({
    chart: {
        type: 'bar',
        height: 350,
        toolbar: {
            show: true
        }
    },
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
    xaxis: {
        categories: props.hourlyAnalysis.map(h => `${h.hour}:00`),
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
    yaxis: [
        {
            title: {
                text: 'Doanh thu',
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
        {
            opposite: true,
            title: {
                text: 'Số nhân viên',
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
        }
    ],
    tooltip: {
        shared: true,
        intersect: false
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
    colors: ['var(--color-success)', 'var(--color-primary)'],
    fill: {
        opacity: 0.8
    }
}))
</script>

<style scoped>
.hourly-demand-chart {
    font-family: var(--font-family-sans);
}
</style>

