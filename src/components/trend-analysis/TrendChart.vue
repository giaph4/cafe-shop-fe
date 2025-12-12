<template>
  <div class="trend-chart">
    <apexchart
      v-if="isMounted && dailyData.length > 0"
      type="line"
      height="400"
      :options="chartOptions"
      :series="chartSeries"
    />
    <EmptyState
      v-else
      title="Chưa có dữ liệu"
      message="Không có dữ liệu xu hướng"
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
    dailyData: {
        type: Array,
        required: true,
        default: () => []
    },
    anomalies: {
        type: Array,
        default: () => []
    }
})

const chartSeries = computed(() => [
    {
        name: 'Doanh thu',
        data: props.dailyData.map(d => ({
            x: d.date,
            y: d.value
        }))
    }
])

const chartOptions = computed(() => {
    const anomalyAnnotations = props.anomalies.slice(0, 10).map(anomaly => ({
        x: anomaly.date,
        borderColor: 'var(--color-danger)',
        strokeDashArray: 4,
        label: {
            text: 'Bất thường',
            style: {
                color: 'var(--color-danger)',
                fontSize: '12px',
                fontFamily: 'var(--font-family-sans)',
                fontWeight: 600
            }
        }
    }))

    return {
        chart: {
            type: 'line',
            height: 400,
            toolbar: {
                show: true
            },
            zoom: {
                enabled: true,
                type: 'x'
            }
        },
        stroke: {
            curve: 'smooth',
            width: 3
        },
        dataLabels: {
            enabled: false
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
            shared: true,
            intersect: false,
            y: {
                formatter: (value) => new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                }).format(value)
            },
            x: {
                format: 'dd/MM/yyyy'
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
        colors: ['var(--color-primary)'],
        annotations: {
            xaxis: anomalyAnnotations
        }
    }
})
</script>

<style scoped>
.trend-chart {
    font-family: var(--font-family-sans);
}
</style>

