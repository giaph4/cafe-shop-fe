<template>
  <div class="cost-breakdown-chart">
    <apexchart
      v-if="isMounted && categoryBreakdown.length > 0"
      type="donut"
      height="300"
      :options="chartOptions"
      :series="chartSeries"
    />
    <EmptyState
      v-else
      title="Chưa có dữ liệu"
      message="Không có dữ liệu phân loại chi phí"
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
    categoryBreakdown: {
        type: Array,
        required: true,
        default: () => []
    }
})

const chartSeries = computed(() => props.categoryBreakdown.map(cat => cat.amount))

const chartOptions = computed(() => ({
    chart: {
        type: 'donut',
        height: 300,
        toolbar: {
            show: true
        }
    },
    labels: props.categoryBreakdown.map(cat => cat.categoryLabel),
    colors: [
        'var(--color-primary)',
        'var(--color-success)',
        'var(--color-info)',
        'var(--color-warning)',
        'var(--color-danger)',
        'var(--color-text-muted)'
    ],
    legend: {
        position: 'bottom',
        fontFamily: 'var(--font-family-sans)',
        fontSize: '12px',
        labels: {
            colors: 'var(--color-text)'
        }
    },
    dataLabels: {
        enabled: true,
        formatter: (val) => `${val.toFixed(1)  }%`,
        style: {
            fontFamily: 'var(--font-family-sans)',
            fontSize: '12px',
            fontWeight: 600
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
    plotOptions: {
        pie: {
            donut: {
                size: '60%',
                labels: {
                    show: true,
                    name: {
                        show: true,
                        fontFamily: 'var(--font-family-sans)',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--color-heading)'
                    },
                    value: {
                        show: true,
                        fontFamily: 'var(--font-family-sans)',
                        fontSize: '18px',
                        fontWeight: 700,
                        color: 'var(--color-heading)',
                        formatter: (val) => new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                            notation: 'compact',
                            maximumFractionDigits: 1
                        }).format(val)
                    },
                    total: {
                        show: true,
                        label: 'Tổng chi phí',
                        fontFamily: 'var(--font-family-sans)',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--color-text-muted)',
                        formatter: () => {
                            const total = props.categoryBreakdown.reduce((sum, cat) => sum + cat.amount, 0)
                            return new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                                notation: 'compact',
                                maximumFractionDigits: 1
                            }).format(total)
                        }
                    }
                }
            }
        }
    }
}))
</script>

<style scoped>
.cost-breakdown-chart {
    font-family: var(--font-family-sans);
}
</style>

