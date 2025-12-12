<template>
  <div class="voucher-usage-chart">
    <apexchart
      v-if="isMounted"
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
    usageData: {
        type: Array,
        required: true,
        default: () => []
    }
})

const chartSeries = computed(() => {
    const usageCount = props.usageData.map(item => ({
        x: item.date,
        y: item.usageCount
    }))

    const totalDiscount = props.usageData.map(item => ({
        x: item.date,
        y: item.totalDiscount
    }))

    const totalRevenue = props.usageData.map(item => ({
        x: item.date,
        y: item.totalRevenue
    }))

    return [
        {
            name: 'Số lần sử dụng',
            data: usageCount,
            type: 'column',
            color: 'var(--color-primary)'
        },
        {
            name: 'Tổng giảm giá',
            data: totalDiscount,
            type: 'line',
            color: 'var(--color-warning)'
        },
        {
            name: 'Doanh thu',
            data: totalRevenue,
            type: 'line',
            color: 'var(--color-success)'
        }
    ]
})

const chartOptions = computed(() => ({
    chart: {
        type: 'line',
        height: 350,
        toolbar: {
            show: true,
            tools: {
                download: true,
                selection: true,
                zoom: true,
                zoomin: true,
                zoomout: true,
                pan: true,
                reset: true
            }
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
        width: [0, 2, 2]
    },
    fill: {
        type: 'solid',
        opacity: [0.3, 1, 1]
    },
    markers: {
        size: [0, 4, 4],
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
    yaxis: [
        {
            title: {
                text: 'Số lần sử dụng',
                style: {
                    color: 'var(--color-heading)',
                    fontFamily: 'var(--font-family-sans)',
                    fontSize: '12px',
                    fontWeight: 600
                }
            },
            labels: {
                formatter: (value) => Math.round(value),
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
                text: 'Số tiền (VNĐ)',
                style: {
                    color: 'var(--color-heading)',
                    fontFamily: 'var(--font-family-sans)',
                    fontSize: '12px',
                    fontWeight: 600
                }
            },
            labels: {
                formatter: (value) => {
                    if (value >= 1000000) {
                        return `${(value / 1000000).toFixed(1)  }M`
                    }
                    if (value >= 1000) {
                        return `${(value / 1000).toFixed(1)  }K`
                    }
                    return value.toFixed(0)
                },
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
        intersect: false,
        y: {
            formatter: (value, { seriesIndex }) => {
                if (seriesIndex === 0) {
                    return `${value  } lần`
                }
                return new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                }).format(value)
            }
        },
        x: {
            format: 'dd/MM/yyyy'
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
        strokeDashArray: 4,
        padding: {
            top: 8,
            bottom: 20,
            left: 12,
            right: 12
        }
    },
    colors: ['var(--color-primary)', 'var(--color-warning)', 'var(--color-success)'],
    theme: {
        mode: 'light'
    }
}))
</script>

<style scoped>
.voucher-usage-chart {
    width: 100%;
}
</style>

