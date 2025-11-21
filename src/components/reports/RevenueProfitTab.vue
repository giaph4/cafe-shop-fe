<template>
    <div class="revenue-profit">
        <div class="chart-grid">
            <div class="card chart-card">
                <div class="card-header border-0 d-flex flex-wrap gap-2 justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-1">Doanh thu theo ngày</h5>
                        <p class="text-muted mb-0">Tổng: {{ formatCurrency(revenueSummary.total) }} · TB/ngày: {{ formatCurrency(revenueSummary.average) }}</p>
                    </div>
                    <div class="d-flex gap-2 align-items-center">
                        <select class="form-select form-select-sm" v-model="revenueChartType">
                            <option value="area">Area</option>
                            <option value="line">Line</option>
                            <option value="bar">Column</option>
                        </select>
                        <button
                            class="btn btn-outline-primary btn-sm"
                            type="button"
                            @click="handleExportOrders"
                            :disabled="ordersExporting"
                        >
                            <span v-if="ordersExporting" class="spinner-border spinner-border-sm me-2"></span>
                            Xuất đơn hàng
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <ApexChart :type="revenueChartType" height="320" :series="revenueSeries" :options="computedRevenueOptions" />
                </div>
            </div>

            <div class="card chart-card">
                <div class="card-header border-0 d-flex flex-wrap gap-2 justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-1">Lợi nhuận gộp</h5>
                        <p class="text-muted mb-0">So sánh doanh thu và lợi nhuận trong kỳ</p>
                    </div>
                    <div class="chart-controls">
                        <select class="form-select form-select-sm" v-model="profitChartType">
                            <option value="bar">Column</option>
                            <option value="line">Line</option>
                            <option value="radar">Radar</option>
                        </select>
                    </div>
                </div>
                <div class="card-body">
                    <ApexChart :type="resolvedProfitChartType" height="320" :series="profitSeries" :options="computedProfitOptions" />
                    <ul class="insight-list">
                        <li>
                            <span>Tổng doanh thu</span>
                            <strong>{{ formatCurrency(profit?.totalRevenue ?? 0) }}</strong>
                        </li>
                        <li>
                            <span>Giá vốn</span>
                            <strong>{{ formatCurrency(profit?.totalCostOfGoodsSold ?? 0) }}</strong>
                        </li>
                        <li>
                            <span>Lợi nhuận</span>
                            <strong>{{ formatCurrency(profit?.totalProfit ?? 0) }}</strong>
                        </li>
                        <li>
                            <span>Biên lợi nhuận gộp</span>
                            <strong>{{ ((profit?.grossMargin ?? 0) * 100).toFixed(2) }}%</strong>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="analytics-grid">
            <div class="card analytic-card">
                <div class="card-header border-0 d-flex flex-wrap gap-2 justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-1">Phân bổ phương thức thanh toán</h5>
                        <p class="text-muted mb-0">Theo số đơn hoặc doanh thu</p>
                    </div>
                    <div class="chart-controls d-flex gap-2">
                        <select class="form-select form-select-sm" v-model="paymentChartType">
                            <option value="donut">Donut</option>
                            <option value="pie">Pie</option>
                            <option value="bar">Bar</option>
                        </select>
                        <select class="form-select form-select-sm" v-model="paymentMetric">
                            <option value="orders">Số đơn</option>
                            <option value="amount">Doanh thu</option>
                        </select>
                    </div>
                </div>
                <div class="card-body" v-if="paymentStats?.length">
                    <ApexChart :type="resolvedPaymentChartType" height="280" :series="paymentChartSeries" :options="paymentChartOptions" />
                    <div class="payment-list">
                        <div v-for="item in paymentStats" :key="item.paymentMethod" class="payment-item">
                            <div class="payment-item__meta">
                                <span class="payment-item__label">{{ item.label || item.paymentMethod }}</span>
                                <span class="payment-item__orders">{{ formatNumber(item.orderCount) }} đơn</span>
                            </div>
                            <div class="payment-item__metrics">
                                <strong>{{ formatCurrency(item.totalAmount) }}</strong>
                                <span class="badge bg-primary-subtle text-primary">{{ item.percentageByOrders.toFixed(1) }}% đơn</span>
                                <span class="badge bg-success-subtle text-success">{{ item.percentageByAmount.toFixed(1) }}% doanh thu</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body" v-else>
                    <p class="text-muted mb-0">Chưa có dữ liệu thanh toán cho giai đoạn này.</p>
                </div>
            </div>

            <div class="card analytic-card">
                <div class="card-header border-0 d-flex flex-wrap gap-2 justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-1">Phân tích theo khung giờ</h5>
                        <p class="text-muted mb-0">Chọn dạng biểu đồ bạn muốn xem</p>
                    </div>
                    <div class="chart-controls">
                        <select class="form-select form-select-sm" v-model="hourlyChartType">
                            <option value="area">Area</option>
                            <option value="line">Line</option>
                            <option value="bar">Column</option>
                        </select>
                    </div>
                </div>
                <div class="card-body">
                    <div v-if="hourlySales?.length">
                        <ApexChart :type="hourlyChartType" height="280" :series="hourlyChartSeries" :options="hourlyChartOptions" />
                        <div class="hourly-grid">
                            <div
                                v-for="bucket in hourlyHighlights"
                                :key="bucket.hour"
                                class="hourly-card"
                            >
                                <span class="hourly-card__hour">{{ bucket.hour }}h</span>
                                <strong>{{ formatCurrency(bucket.revenue) }}</strong>
                                <span class="hourly-card__orders">{{ formatNumber(bucket.orderCount) }} đơn</span>
                            </div>
                        </div>
                    </div>
                    <p v-else class="text-muted mb-0">Chưa có thống kê theo giờ.</p>
                </div>
            </div>
        </div>

        <div class="card table-card">
            <div class="card-header border-0 d-flex justify-content-between align-items-center">
                <div>
                    <h5 class="mb-1">Doanh thu theo danh mục</h5>
                    <p class="text-muted mb-0">Phân bổ doanh thu theo nhóm sản phẩm</p>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead>
                        <tr>
                            <th>Danh mục</th>
                            <th class="text-end">Số lượng</th>
                            <th class="text-end">Doanh thu</th>
                            <th class="text-end">Tỷ trọng</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in categorySales" :key="item.categoryId || item.categoryName">
                            <td>{{ item.categoryName }}</td>
                            <td class="text-end">{{ formatNumber(item.totalQuantitySold) }}</td>
                            <td class="text-end">{{ formatCurrency(item.totalRevenue) }}</td>
                            <td class="text-end">
                                <span class="badge bg-light text-dark">{{ (item.revenuePercentage ?? 0).toFixed(2) }}%</span>
                            </td>
                        </tr>
                        <tr v-if="!categorySales?.length">
                            <td colspan="4" class="text-center text-muted py-4">Chưa có dữ liệu doanh thu theo danh mục.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import { useThemePreference } from '@/composables/useThemePreference'

const props = defineProps({
    revenueSeries: { type: Array, default: () => [] },
    revenueOptions: { type: Object, default: () => ({}) },
    profitSeries: { type: Array, default: () => [] },
    profitOptions: { type: Object, default: () => ({}) },
    profit: { type: Object, default: null },
    categorySales: { type: Array, default: () => [] },
    paymentStats: { type: Array, default: () => [] },
    hourlySales: { type: Array, default: () => [] },
    revenueSummary: {
        type: Object,
        default: () => ({ total: 0, average: 0, max: 0 })
    },
    ordersExporting: { type: Boolean, default: false },
    onExportOrders: { type: Function, default: null }
})

const ApexChart = VueApexCharts

const { isDark } = useThemePreference()

const baseLabelStyle = computed(() => ({
    colors: isDark.value ? '#cbd5f5' : '#64748b',
    fontSize: '12px'
}))
const VIBRANT_PALETTE = Object.freeze([
    '#2563eb',
    '#f97316',
    '#22c55e',
    '#facc15',
    '#ec4899',
    '#9333ea',
    '#0ea5e9',
    '#ef4444',
    '#14b8a6',
    '#8b5cf6'
])

const createBaseOptions = (type, colors = VIBRANT_PALETTE) => {
    const isBar = type === 'bar'
    const isCircular = ['pie', 'donut', 'radialBar'].includes(type)
    const dark = isDark.value
    const labelStyle = baseLabelStyle.value
    return {
        chart: {
            type,
            toolbar: { show: true },
            foreColor: dark ? '#e2e8f0' : '#475569',
            background: 'transparent'
        },
        stroke: isCircular
            ? { colors: ['#ffffff'], width: 2 }
            : { curve: 'smooth', width: isBar ? 0 : 3 },
        dataLabels: { enabled: false },
        colors,
        grid: {
            strokeDashArray: 4,
            borderColor: dark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.35)',
            padding: { top: 8, bottom: 8, left: 12, right: 12 }
        },
        xaxis: {
            categories: [],
            labels: {
                style: { ...labelStyle }
            },
            axisBorder: {
                color: dark ? 'rgba(148, 163, 184, 0.28)' : 'rgba(203, 213, 225, 0.6)'
            },
            axisTicks: {
                color: dark ? 'rgba(148, 163, 184, 0.28)' : 'rgba(203, 213, 225, 0.6)'
            },
            crosshairs: {
                stroke: {
                    color: dark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.35)',
                    dashArray: 4
                }
            }
        },
        yaxis: {
            labels: {
                style: { ...labelStyle },
                formatter: (value) => value ?? 0
            }
        },
        legend: { position: 'bottom', labels: { colors: dark ? '#cbd5f5' : '#475569' } },
        tooltip: {
            theme: dark ? 'dark' : 'light',
            y: {
                formatter: (value) => value ?? 0
            }
        },
        fill: isBar
            ? { type: 'solid', opacity: dark ? 0.85 : 0.95 }
            : isCircular
                ? { type: 'solid', opacity: 1, colors }
                : {
                    type: 'gradient',
                    gradient: {
                        shadeIntensity: 1,
                        opacityFrom: dark ? 0.45 : 0.55,
                        opacityTo: dark ? 0.1 : 0.15,
                        stops: [0, 90, 100]
                    }
                },
        plotOptions: {
            bar: {
                horizontal: false,
                borderRadius: 6,
                columnWidth: '55%'
            }
        }
    }
}

const mergeOptions = (base, overrides = {}) => ({
    ...base,
    ...overrides,
    chart: { ...base.chart, ...overrides.chart },
    stroke: { ...base.stroke, ...overrides.stroke },
    dataLabels: { ...base.dataLabels, ...overrides.dataLabels },
    colors: overrides.colors ?? base.colors,
    grid: { ...base.grid, ...overrides.grid },
    xaxis: {
        ...base.xaxis,
        ...(overrides.xaxis || {}),
        labels: {
            ...base.xaxis.labels,
            ...overrides.xaxis?.labels
        }
    },
    yaxis: {
        ...base.yaxis,
        ...(overrides.yaxis || {}),
        labels: {
            ...base.yaxis.labels,
            ...overrides.yaxis?.labels
        }
    },
    fill: {
        ...base.fill,
        ...overrides.fill,
        gradient: {
            ...(base.fill?.gradient || {}),
            ...(overrides.fill?.gradient || {})
        }
    },
    tooltip: {
        ...base.tooltip,
        ...overrides.tooltip,
        theme: overrides.tooltip?.theme ?? base.tooltip?.theme,
        y: {
            ...(base.tooltip?.y || {}),
            ...(overrides.tooltip?.y || {})
        }
    },
    legend: {
        ...base.legend,
        ...overrides.legend,
        labels: {
            ...(base.legend?.labels || {}),
            ...(overrides.legend?.labels || {})
        }
    },
    plotOptions: {
        ...(base.plotOptions || {}),
        ...(overrides.plotOptions || {}),
        bar: {
            ...(base.plotOptions?.bar || {}),
            ...(overrides.plotOptions?.bar || {})
        }
    }
})

const revenueChartType = ref('area')
const profitChartType = ref('bar')
const paymentChartType = ref('donut')
const paymentMetric = ref('orders')
const hourlyChartType = ref('area')

const hourlyHighlights = computed(() => {
    if (!props.hourlySales?.length) return []
    const sorted = [...props.hourlySales].sort((a, b) => b.revenue - a.revenue)
    return sorted.slice(0, 6)
})

const computedRevenueOptions = computed(() => {
    const colorSource = Array.isArray(props.revenueOptions?.colors) && props.revenueOptions.colors.length
        ? props.revenueOptions.colors
        : ['#2563eb']
    const base = createBaseOptions(revenueChartType.value, colorSource)
    const categories = props.revenueOptions?.xaxis?.categories ?? []

    return mergeOptions(base, {
        ...props.revenueOptions,
        xaxis: {
            categories,
            ...(props.revenueOptions?.xaxis || {})
        },
        stroke: {
            curve: 'smooth',
            width: revenueChartType.value === 'line' ? 3.5 : revenueChartType.value === 'bar' ? 0 : 2.5,
            dashArray: revenueChartType.value === 'line' ? 0 : 0
        },
        markers: revenueChartType.value === 'line'
            ? {
                size: 5,
                strokeWidth: 3,
                strokeOpacity: isDark.value ? 0.8 : 0.6,
                colors: ['#ffffff'],
                strokeColors: colorSource
            }
            : { size: 0 },
        yaxis: {
            labels: {
                formatter: (value) => formatCurrency(value)
            }
        },
        tooltip: {
            theme: isDark.value ? 'dark' : 'light',
            y: {
                formatter: (value) => formatCurrency(value)
            }
        },
        fill: revenueChartType.value === 'line'
            ? {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: isDark.value ? 0.35 : 0.45,
                    opacityTo: isDark.value ? 0.05 : 0.15,
                    stops: [0, 90, 100]
                }
            }
            : base.fill
    })
})

const resolvedProfitChartType = computed(() => profitChartType.value)

const computedProfitOptions = computed(() => {
    const base = createBaseOptions(resolvedProfitChartType.value, ['#6366f1', '#f97316', '#22c55e'])
    const categories = ['Doanh thu', 'Giá vốn', 'Lợi nhuận']

    return mergeOptions(base, {
        chart: { type: resolvedProfitChartType.value },
        xaxis: { categories },
        dataLabels: { enabled: false },
        stroke: resolvedProfitChartType.value === 'radar'
            ? { width: 2.5 }
            : { curve: 'smooth', width: resolvedProfitChartType.value === 'line' ? 3.5 : 0 },
        fill: resolvedProfitChartType.value === 'radar'
            ? { opacity: 0.3 }
            : base.fill,
        markers: resolvedProfitChartType.value !== 'bar'
            ? {
                size: 5,
                strokeWidth: 3,
                strokeOpacity: isDark.value ? 0.8 : 0.6,
                colors: ['#0f172a'],
                strokeColors: resolvedProfitChartType.value === 'line' ? ['#6366f1', '#22c55e'] : undefined
            }
            : { size: 0 },
        plotOptions: {
            bar: {
                columnWidth: '48%',
                borderRadius: 10,
                horizontal: false
            }
        },
        yaxis: {
            labels: {
                formatter: (val) => formatCurrency(val)
            }
        }
    })
})

const paymentItems = computed(() => props.paymentStats ?? [])
const resolvedPaymentChartType = computed(() => paymentChartType.value === 'bar' ? 'bar' : paymentChartType.value)

const paymentChartSeries = computed(() => {
    if (!paymentItems.value.length) return []
    if (paymentChartType.value === 'bar') {
        return [
            {
                name: paymentMetric.value === 'orders' ? 'Số đơn' : 'Doanh thu',
                data: paymentItems.value.map((item) => paymentMetric.value === 'orders' ? item.orderCount : item.totalAmount)
            }
        ]
    }
    return paymentItems.value.map((item) => paymentMetric.value === 'orders' ? item.orderCount : item.totalAmount)
})

const paymentChartOptions = computed(() => {
    const labels = paymentItems.value.map((item, index) => item.label ?? item.paymentMethod ?? `PTTT #${index + 1}`)
    const base = createBaseOptions(resolvedPaymentChartType.value, VIBRANT_PALETTE)
    const isBar = resolvedPaymentChartType.value === 'bar'

    return mergeOptions(base, {
        labels,
        dataLabels: {
            enabled: !isBar,
            formatter: (val) => `${Number(val).toFixed(1)}%`
        },
        plotOptions: {
            bar: {
                borderRadius: 8,
                horizontal: false,
                columnWidth: '45%'
            }
        },
        xaxis: isBar ? { categories: labels } : base.xaxis,
        tooltip: {
            y: {
                formatter: (value) => paymentMetric.value === 'orders' ? formatNumber(value) : formatCurrency(value)
            }
        }
    })
})

const buildFullHours = () => Array.from({ length: 24 }, (_, index) => index)

const hourlyChartSeries = computed(() => {
    if (!props.hourlySales?.length) return []
    const hours = buildFullHours()
    const map = new Map(hours.map((hour) => [hour, 0]))
    props.hourlySales.forEach((bucket) => {
        const hour = Number(bucket.hour)
        if (!Number.isNaN(hour) && map.has(hour)) {
            map.set(hour, (map.get(hour) ?? 0) + (bucket.revenue ?? 0))
        }
    })
    return [
        {
            name: 'Doanh thu',
            data: hours.map((hour) => map.get(hour) ?? 0)
        }
    ]
})

const hourlyChartOptions = computed(() => {
    const base = createBaseOptions(hourlyChartType.value, ['#2563eb'])
    const categories = buildFullHours().map((hour) => `${hour.toString().padStart(2, '0')}:00`)

    return mergeOptions(base, {
        xaxis: {
            categories,
            tickAmount: 12
        },
        stroke: hourlyChartType.value === 'bar'
            ? { curve: 'smooth', width: 0 }
            : { curve: 'smooth', width: 3 },
        plotOptions: hourlyChartType.value === 'bar'
            ? {
                bar: {
                    columnWidth: '50%',
                    borderRadius: 6,
                    horizontal: false
                }
            }
            : base.plotOptions,
        fill: hourlyChartType.value === 'bar'
            ? { type: 'solid', opacity: 0.95 }
            : base.fill,
        tooltip: {
            y: {
                formatter: (value) => formatCurrency(value)
            }
        }
    })
})

const handleExportOrders = () => {
    if (typeof props.onExportOrders === 'function') {
        props.onExportOrders()
    }
}
</script>

<style scoped>
.revenue-profit {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.chart-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
}

.chart-card {
    border: 1px solid var(--color-border);
    border-radius: 18px;
    background: linear-gradient(180deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-soft);
}

.insight-list {
    list-style: none;
    margin: 1.25rem 0 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 0.85rem;
}

.insight-list li {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.85rem;
    border-radius: 14px;
    border: 1px solid rgba(148, 163, 184, 0.28);
    background: var(--color-card-muted);
}

.analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
}

.analytic-card {
    border: 1px solid var(--color-border);
    border-radius: 18px;
    background: linear-gradient(180deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-soft);
}

.payment-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.payment-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 0.9rem;
}

.payment-item:last-of-type {
    border-bottom: none;
    padding-bottom: 0;
}

.payment-item__meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.payment-item__label {
    font-weight: 600;
}

.payment-item__orders {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.payment-item__metrics {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.hourly-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
}

.hourly-card {
    border-radius: 16px;
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
    padding: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.hourly-card__hour {
    font-weight: 600;
}

.hourly-card__orders {
    font-size: 0.8rem;
    color: var(--color-text-muted);
}

.table-card {
    border: 1px solid var(--color-border);
    border-radius: 18px;
    background: linear-gradient(180deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-soft);
}

@media (max-width: 768px) {
    .payment-item,
    .payment-item__metrics {
        flex-direction: column;
        align-items: flex-start;
    }

    .payment-item__metrics {
        gap: 0.4rem;
    }
}
</style>
