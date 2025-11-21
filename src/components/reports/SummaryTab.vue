<template>
    <div class="reports-summary">
        <div class="summary-cards">
            <div
                v-for="card in summaryCards"
                :key="card.key"
                class="summary-card"
            >
                <div class="summary-card__icon" :class="card.variant">
                    <i :class="card.icon"></i>
                </div>
                <div class="summary-card__meta">
                    <span class="summary-card__label">{{ card.label }}</span>
                    <strong class="summary-card__value">{{ card.displayValue }}</strong>
                    <small v-if="card.subtitle" class="summary-card__subtitle">{{ card.subtitle }}</small>
                </div>
            </div>
        </div>

        <div class="summary-insights card" v-if="insightItems.length">
            <div class="summary-insights__header">
                <div>
                    <h5 class="mb-1">Điểm nổi bật</h5>
                    <p class="text-muted mb-0">Insights tổng hợp từ dữ liệu báo cáo.</p>
                </div>
            </div>
            <div class="summary-insights__grid">
                <div
                    v-for="item in insightItems"
                    :key="item.key"
                    class="summary-insight"
                    :class="item.variant"
                >
                    <div class="summary-insight__icon">
                        <i :class="item.icon"></i>
                    </div>
                    <div class="summary-insight__content">
                        <span class="summary-insight__title">{{ item.title }}</span>
                        <strong class="summary-insight__value">{{ item.value }}</strong>
                        <small v-if="item.detail" class="summary-insight__detail">{{ item.detail }}</small>
                    </div>
                </div>
            </div>
        </div>

        <div class="charts-grid">
            <div class="card chart-card">
                <div class="card-header border-0 d-flex flex-wrap gap-2 justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-1">Xu hướng doanh thu</h5>
                        <p class="text-muted mb-0">Tổng: {{ formatCurrency(revenueSummary.total) }} · TB/ngày: {{ formatCurrency(revenueSummary.average) }}</p>
                    </div>
                    <div class="chart-controls">
                        <select class="form-select form-select-sm" v-model="revenueChartType">
                            <option value="area">Area</option>
                            <option value="line">Line</option>
                            <option value="bar">Column</option>
                        </select>
                    </div>
                </div>
                <div class="card-body">
                    <ApexChart
                        v-if="chartsReady"
                        :type="revenueChartType"
                        height="320"
                        :series="revenueSeries"
                        :options="computedRevenueOptions"
                    />
                </div>
            </div>
            <div class="card chart-card">
                <div class="card-header border-0 d-flex flex-wrap gap-2 justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-1">Phân bổ phương thức thanh toán</h5>
                        <p class="text-muted mb-0">{{ paymentMetricLabel }}</p>
                    </div>
                    <div class="chart-controls d-flex gap-2">
                        <select class="form-select form-select-sm" v-model="paymentChartType">
                            <option value="donut">Donut</option>
                            <option value="pie">Pie</option>
                            <option value="bar">Bar</option>
                        </select>
                        <select class="form-select form-select-sm" v-model="paymentMetric">
                            <option value="orders">Theo số đơn</option>
                            <option value="amount">Theo doanh thu</option>
                        </select>
                    </div>
                </div>
                <div class="card-body">
                    <template v-if="paymentItems.length">
                        <ApexChart
                            :type="resolvedPaymentChartType"
                            height="320"
                            :series="paymentChartSeries"
                            :options="paymentChartOptions"
                        />
                    </template>
                    <p v-else class="text-muted mb-0">Chưa có dữ liệu thanh toán trong khoảng thời gian đã chọn.</p>
                </div>
            </div>
        </div>

        <div class="analytics-grid">
            <div class="card analytics-card">
                <div class="card-header border-0">
                    <h5 class="mb-1">So sánh với kỳ trước</h5>
                    <p class="text-muted mb-0">Theo doanh thu và số đơn</p>
                </div>
                <div class="card-body" v-if="salesComparison">
                    <div class="comparison-grid">
                        <div class="comparison-item">
                            <span class="comparison-item__label">Doanh thu hiện tại</span>
                            <strong>{{ formatCurrency(salesComparison.currentRevenue) }}</strong>
                        </div>
                        <div class="comparison-item">
                            <span class="comparison-item__label">Doanh thu kỳ trước</span>
                            <strong>{{ formatCurrency(salesComparison.previousRevenue) }}</strong>
                        </div>
                        <div class="comparison-item">
                            <span class="comparison-item__label">Tăng trưởng doanh thu</span>
                            <strong :class="salesComparison.growthAmount >= 0 ? 'text-success' : 'text-danger'">
                                {{ formatCurrency(salesComparison.growthAmount) }}
                            </strong>
                            <small :class="salesComparison.growthPercentage >= 0 ? 'text-success' : 'text-danger'">
                                {{ salesComparison.growthPercentage?.toFixed(2) ?? '0.00' }}%
                            </small>
                        </div>
                        <div class="comparison-item">
                            <span class="comparison-item__label">Số đơn</span>
                            <strong>{{ formatNumber(salesComparison.currentOrders) }}</strong>
                            <small>Trước: {{ formatNumber(salesComparison.previousOrders) }}</small>
                        </div>
                    </div>
                </div>
                <div class="card-body" v-else>
                    <p class="text-muted mb-0">Chưa có dữ liệu so sánh cho giai đoạn này.</p>
                </div>
            </div>

            <div class="card analytics-card">
                <div class="card-header border-0">
                    <h5 class="mb-1">Điểm nhấn lợi nhuận</h5>
                    <p class="text-muted mb-0">Các chỉ số hiệu quả hoạt động chính</p>
                </div>
                <div class="card-body">
                    <ul class="insight-list">
                        <li>
                            <span>Doanh thu giai đoạn</span>
                            <strong>{{ formatCurrency(profit?.totalRevenue ?? 0) }}</strong>
                        </li>
                        <li>
                            <span>Giá vốn hàng bán</span>
                            <strong>{{ formatCurrency(profit?.totalCostOfGoodsSold ?? 0) }}</strong>
                        </li>
                        <li>
                            <span>Lợi nhuận thuần</span>
                            <strong>{{ formatCurrency(profit?.totalProfit ?? 0) }}</strong>
                        </li>
                        <li>
                            <span>Biên lợi nhuận gộp</span>
                            <strong>{{ ((profit?.grossMargin ?? 0) * 100).toFixed(2) }}%</strong>
                        </li>
                        <li>
                            <span>Doanh thu ngày kết thúc</span>
                            <strong>{{ formatCurrency(dailyRevenue?.totalRevenue ?? 0) }}</strong>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="card analytics-card" v-if="inventoryHighlights.length">
                <div class="card-header border-0">
                    <h5 class="mb-1">Tổng quan tồn kho</h5>
                    <p class="text-muted mb-0">Theo dõi nhanh trạng thái nguyên liệu</p>
                </div>
                <div class="card-body">
                    <div class="inventory-overview">
                        <div
                            v-for="item in inventoryHighlights"
                            :key="item.key"
                            class="inventory-overview__item"
                        >
                            <div class="inventory-overview__meta">
                                <span class="inventory-overview__label">{{ item.label }}</span>
                                <strong class="inventory-overview__value">{{ item.display }}</strong>
                            </div>
                            <span v-if="item.badge" class="badge" :class="item.badge.variant">{{ item.badge.text }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="charts-grid">
            <div class="card chart-card">
                <div class="card-header border-0 d-flex flex-wrap gap-2 justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-1">Top sản phẩm</h5>
                        <p class="text-muted mb-0">Dựa trên {{ productMetric === 'revenue' ? 'doanh thu' : 'số lượng' }}</p>
                    </div>
                    <div class="chart-controls d-flex gap-2">
                        <select class="form-select form-select-sm" v-model="productMetric">
                            <option value="revenue">Doanh thu</option>
                            <option value="quantity">Số lượng</option>
                        </select>
                        <select class="form-select form-select-sm" v-model="productChartType">
                            <option value="bar">Bar</option>
                            <option value="horizontalBar">Bar ngang</option>
                            <option value="pie">Pie</option>
                        </select>
                    </div>
                </div>
                <div class="card-body">
                    <ApexChart
                        v-if="topProductItems.length"
                        :type="resolvedProductChartType"
                        height="320"
                        :series="productChartSeries"
                        :options="productChartOptions"
                    />
                    <p v-else class="text-muted mb-0">Chưa có dữ liệu sản phẩm.</p>
                </div>
            </div>
            <div class="card chart-card">
                <div class="card-header border-0 d-flex flex-wrap gap-2 justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-1">Top khách hàng</h5>
                        <p class="text-muted mb-0">Theo tổng chi tiêu</p>
                    </div>
                    <div class="chart-controls d-flex gap-2">
                        <select class="form-select form-select-sm" v-model="customerChartType">
                            <option value="bar">Bar</option>
                            <option value="horizontalBar">Bar ngang</option>
                            <option value="pie">Pie</option>
                        </select>
                        <select class="form-select form-select-sm" v-model="customerTopLimit">
                            <option value="5">Top 5</option>
                            <option value="10">Top 10</option>
                            <option value="all">Tất cả</option>
                        </select>
                    </div>
                </div>
                <div class="card-body">
                    <ApexChart
                        v-if="topCustomerItems.length"
                        :type="resolvedCustomerChartType"
                        height="320"
                        :series="customerChartSeries"
                        :options="customerChartOptions"
                    />
                    <p v-else class="text-muted mb-0">Chưa có dữ liệu khách hàng.</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import { useThemePreference } from '@/composables/useThemePreference'

const props = defineProps({
    stats: { type: Object, default: null },
    revenueSeries: { type: Array, default: () => [] },
    revenueOptions: { type: Object, default: () => ({}) },
    revenueSummary: {
        type: Object,
        default: () => ({ total: 0, average: 0, max: 0 })
    },
    paymentStats: { type: Array, default: () => [] },
    paymentTotals: { type: Object, default: () => ({ totalOrders: 0, totalAmount: 0 }) },
    salesComparison: { type: Object, default: null },
    profit: { type: Object, default: null },
    dailyRevenue: { type: Object, default: null },
    bestSellers: { type: Array, default: () => [] },
    topCustomers: { type: Array, default: () => [] },
    productSummary: { type: Object, default: null },
    insights: { type: Array, default: () => [] },
    inventorySummary: {
        type: Object,
        default: () => ({ totalItems: 0, lowStockCount: 0, totalQuantity: 0 })
    }
})

const ApexChart = VueApexCharts
const chartsReady = ref(false)
const revenueChartType = ref('area')
const paymentChartType = ref('donut')
const paymentMetric = ref('orders')
const productChartType = ref('bar')
const productMetric = ref('revenue')
const customerChartType = ref('bar')
const customerTopLimit = ref('5')

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
            labels: { style: { ...labelStyle } },
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
                columnWidth: '55%',
                borderRadius: 6,
                horizontal: false,
                distributed: false
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
    legend: { ...base.legend, ...overrides.legend },
    plotOptions: {
        ...(base.plotOptions || {}),
        ...(overrides.plotOptions || {}),
        bar: {
            ...(base.plotOptions?.bar || {}),
            ...(overrides.plotOptions?.bar || {})
        }
    }
})

onMounted(() => {
    nextTick(() => {
        chartsReady.value = true
    })
})

const summaryCards = computed(() => {
    const s = props.stats ?? {}
    return [
        {
            key: 'todayRevenue',
            label: 'Doanh thu hôm nay: ',
            value: s.todayRevenue ,
            icon: 'bi bi-cash-stack',
            variant: 'variant-primary'
        },
        {
            key: 'monthRevenue',
            label: 'Doanh thu tháng: ',
            value: s.monthRevenue,
            icon: 'bi bi-calendar-event',
            variant: 'variant-indigo'
        },
        {
            key: 'todayOrders',
            label: 'Đơn hàng hôm nay: ',
            value: s.todayOrders,
            icon: 'bi bi-bag-check',
            variant: 'variant-amber',
            formatter: (val) => formatNumber(val)
        },
        {
            key: 'averageOrderValue',
            label: 'Giá trị đơn trung bình: ',
            value: s.averageOrderValue,
            icon: 'bi bi-receipt',
            variant: 'variant-sky'
        },
        {
            key: 'todayProfit',
            label: 'Lợi nhuận hôm nay: ',
            value: s.todayProfit,
            icon: 'bi bi-graph-up',
            variant: 'variant-emerald'
        },
        {
            key: 'lowStockItems',
            label: 'Nguyên liệu sắp hết: ',
            value: s.lowStockItems,
            icon: 'bi bi-exclamation-triangle',
            variant: 'variant-rose',
            formatter: (val) => formatNumber(val)
        }
    ].map((card) => ({
        ...card,
        displayValue: typeof card.formatter === 'function' ? card.formatter(card.value ?? 0) : formatCurrency(card.value ?? 0),
        subtitle: card.key === 'todayRevenue' && props.dailyRevenue
            ? `Ngày ${props.dailyRevenue.date}: ${formatCurrency(props.dailyRevenue.totalRevenue)}`
            : null
    }))
})

const insightItems = computed(() => Array.isArray(props.insights) ? props.insights : [])

const inventoryHighlights = computed(() => {
    const summary = props.inventorySummary ?? {}
    const totalItems = Number(summary.totalItems ?? 0)
    const lowStock = Number(summary.lowStockCount ?? 0)
    const totalQty = Number(summary.totalQuantity ?? 0)
    const items = []

    if (totalItems > 0) {
        items.push({
            key: 'total-items',
            label: 'Tổng nguyên liệu',
            value: totalItems,
            display: formatNumber(totalItems)
        })
    }

    items.push({
        key: 'low-stock',
        label: 'Nguyên liệu thiếu hụt',
        value: lowStock,
        display: formatNumber(Math.max(lowStock, 0)),
        badge: totalItems > 0
            ? {
                text: `${((Math.max(lowStock, 0) / Math.max(totalItems, 1)) * 100).toFixed(1)}%`,
                variant: lowStock > 0 ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'
            }
            : null
    })

    if (totalQty > 0) {
        items.push({
            key: 'total-qty',
            label: 'Tổng số lượng tồn',
            value: totalQty,
            display: formatNumber(totalQty)
        })
    }

    return items
})

const paymentItems = computed(() => props.paymentStats ?? [])
const paymentMetricLabel = computed(() => paymentMetric.value === 'orders' ? 'Tỷ trọng theo số đơn' : 'Tỷ trọng theo doanh thu')

const computedRevenueOptions = computed(() => {
    const chartType = revenueChartType.value === 'bar' ? 'bar' : revenueChartType.value
    const baseColors = Array.isArray(props.revenueOptions?.colors) && props.revenueOptions.colors.length
        ? props.revenueOptions.colors
        : ['#2563eb']
    const base = createBaseOptions(chartType, baseColors)
    const categories = props.revenueOptions?.xaxis?.categories ?? []

    return mergeOptions(base, {
        ...props.revenueOptions,
        xaxis: {
            categories,
            ...(props.revenueOptions?.xaxis || {})
        },
        yaxis: {
            labels: {
                formatter: (value) => formatCurrency(value)
            }
        },
        stroke: chartType === 'bar'
            ? { curve: 'smooth', width: 0 }
            : { curve: 'smooth', width: chartType === 'line' ? 3 : 2 },
        fill: chartType === 'bar'
            ? { type: 'solid', opacity: 0.95, colors: baseColors }
            : base.fill,
        plotOptions: {
            bar: {
                horizontal: false,
                borderRadius: 8,
                columnWidth: '55%'
            }
        },
        tooltip: {
            y: {
                formatter: (value) => formatCurrency(value)
            }
        }
    })
})

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
    const labels = paymentItems.value.map((item, index) => item.label ?? `PTTT #${index + 1}`)
    const base = createBaseOptions(resolvedPaymentChartType.value, VIBRANT_PALETTE)
    const isBar = resolvedPaymentChartType.value === 'bar'

    return mergeOptions(base, {
        labels,
        dataLabels: {
            enabled: !isBar,
            formatter: (val) => `${Number(val).toFixed(1)}%`
        },
        xaxis: isBar ? { categories: labels } : base.xaxis,
        plotOptions: {
            bar: {
                borderRadius: 8,
                horizontal: false,
                columnWidth: '45%'
            }
        },
        tooltip: {
            y: {
                formatter: (value) => paymentMetric.value === 'orders'
                    ? formatNumber(value)
                    : formatCurrency(value)
            }
        }
    })
})

const topProductItems = computed(() => {
    if (!props.bestSellers?.length) return []
    const limit = productMetric.value === 'revenue' ? 8 : 8
    return props.bestSellers.slice(0, limit)
})

const resolvedProductChartType = computed(() => productChartType.value === 'horizontalBar' ? 'bar' : productChartType.value)

const productChartSeries = computed(() => {
    if (!topProductItems.value.length) return []
    const values = topProductItems.value.map((item) => productMetric.value === 'revenue'
        ? item.totalRevenueGenerated
        : item.totalQuantitySold)
    if (productChartType.value === 'pie') {
        return values
    }
    return [
        {
            name: productMetric.value === 'revenue' ? 'Doanh thu' : 'Số lượng',
            data: values
        }
    ]
})

const productChartOptions = computed(() => {
    const labels = topProductItems.value.map((item, index) => item.productName || `SP #${index + 1}`)
    const base = createBaseOptions(resolvedProductChartType.value, VIBRANT_PALETTE)

    return mergeOptions(base, {
        labels,
        dataLabels: { enabled: productChartType.value === 'pie' },
        xaxis: resolvedProductChartType.value === 'bar' ? { categories: labels } : base.xaxis,
        plotOptions: {
            bar: {
                borderRadius: 8,
                horizontal: productChartType.value === 'horizontalBar'
            }
        },
        tooltip: {
            y: {
                formatter: (value) => productMetric.value === 'revenue' ? formatCurrency(value) : formatNumber(value)
            }
        }
    })
})

const topCustomerItems = computed(() => {
    if (!props.topCustomers?.length) return []
    if (customerTopLimit.value === 'all') return props.topCustomers
    const limit = Number(customerTopLimit.value)
    return props.topCustomers.slice(0, Number.isNaN(limit) ? 5 : limit)
})

const resolvedCustomerChartType = computed(() => customerChartType.value === 'horizontalBar' ? 'bar' : customerChartType.value)

const customerChartSeries = computed(() => {
    if (!topCustomerItems.value.length) return []
    const values = topCustomerItems.value.map((item) => item.totalSpent ?? 0)
    if (customerChartType.value === 'pie') {
        return values
    }
    return [
        {
            name: 'Chi tiêu',
            data: values
        }
    ]
})

const customerChartOptions = computed(() => {
    const labels = topCustomerItems.value.map((item, index) => item.customerName ?? `Khách #${item.customerId ?? index + 1}`)
    const base = createBaseOptions(resolvedCustomerChartType.value, VIBRANT_PALETTE)

    return mergeOptions(base, {
        labels,
        xaxis: resolvedCustomerChartType.value === 'bar' ? { categories: labels } : base.xaxis,
        plotOptions: {
            bar: {
                borderRadius: 8,
                horizontal: customerChartType.value === 'horizontalBar'
            }
        },
        tooltip: {
            y: {
                formatter: (value) => formatCurrency(value)
            }
        }
    })
})
</script>

<style scoped>
.reports-summary {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
}

.summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1rem;
}

.summary-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.1rem 1.35rem;
    border-radius: 18px;
    border: 1px solid var(--color-border);
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-soft);
}

.summary-card__icon {
    width: 54px;
    height: 54px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    font-size: 1.6rem;
    color: #fff;
}

.variant-primary { background: linear-gradient(135deg, #4f46e5, #6366f1); }
.variant-indigo { background: linear-gradient(135deg, #4338ca, #6366f1); }
.variant-amber { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
.variant-sky { background: linear-gradient(135deg, #0ea5e9, #38bdf8); }
.variant-emerald { background: linear-gradient(135deg, #059669, #34d399); }
.variant-rose { background: linear-gradient(135deg, #f43f5e, #fb7185); }

.summary-card__label {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

.summary-card__value {
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--color-heading);
}

.summary-card__subtitle {
    font-size: 0.78rem;
    color: var(--color-text-muted);
}

.summary-insights {
    border: 1px solid var(--color-border);
    border-radius: 18px;
    background: linear-gradient(180deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-soft);
    padding: 1.5rem;
}

.summary-insights__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.1rem;
}

.summary-insights__grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.summary-insight {
    display: flex;
    align-items: flex-start;
    gap: 1.1rem;
    padding: 1.15rem 1.25rem;
    border-radius: 18px;
    background: linear-gradient(165deg, rgba(248, 250, 252, 0.92), rgba(241, 245, 249, 0.7));
    border: 1px solid rgba(148, 163, 184, 0.16);
    box-shadow: 0 18px 32px rgba(15, 23, 42, 0.08);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    backdrop-filter: blur(6px);
}

.summary-insight:hover {
    transform: translateY(-3px);
    box-shadow: 0 20px 38px rgba(15, 23, 42, 0.15);
}

.summary-insight__icon {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.35rem;
    color: #1e293b;
    background: rgba(226, 232, 240, 0.7);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.summary-insight__content {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    color: var(--color-heading);
}

.summary-insight__title {
    font-size: 0.82rem;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
}

.summary-insight__value {
    font-size: 1.25rem;
    color: var(--color-heading);
    font-weight: 700;
    letter-spacing: -0.01em;
}

.summary-insight__detail {
    font-size: 0.82rem;
    color: var(--color-text-muted);
}

.summary-insight__detail::before {
    content: '• ';
    color: inherit;
}

.summary-insight.accent-primary {
    background: linear-gradient(150deg, rgba(229, 237, 255, 0.95), rgba(219, 234, 254, 0.75));
}

.summary-insight.accent-success {
    background: linear-gradient(150deg, rgba(222, 247, 236, 0.95), rgba(187, 247, 208, 0.75));
}

.summary-insight.accent-info {
    background: linear-gradient(150deg, rgba(224, 243, 255, 0.95), rgba(191, 227, 255, 0.75));
}

.summary-insight.accent-warning {
    background: linear-gradient(150deg, rgba(254, 243, 199, 0.95), rgba(254, 228, 175, 0.75));
}

.summary-insight.accent-purple {
    background: linear-gradient(150deg, rgba(240, 236, 255, 0.95), rgba(221, 214, 254, 0.75));
}

.summary-insight.accent-danger {
    background: linear-gradient(150deg, rgba(255, 228, 230, 0.95), rgba(254, 205, 211, 0.75));
}

.summary-insight.accent-primary .summary-insight__icon { background: rgba(59, 130, 246, 0.18); color: #1d4ed8; }
.summary-insight.accent-success .summary-insight__icon { background: rgba(34, 197, 94, 0.18); color: #15803d; }
.summary-insight.accent-info .summary-insight__icon { background: rgba(14, 165, 233, 0.18); color: #0369a1; }
.summary-insight.accent-warning .summary-insight__icon { background: rgba(251, 191, 36, 0.24); color: #b45309; }
.summary-insight.accent-purple .summary-insight__icon { background: rgba(139, 92, 246, 0.24); color: #6d28d9; }
.summary-insight.accent-danger .summary-insight__icon { background: rgba(248, 113, 113, 0.24); color: #b91c1c; }

:global(.dark-theme) :deep(.summary-insights) {
    border-color: rgba(148, 163, 184, 0.2);
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.9));
    box-shadow: 0 20px 38px rgba(2, 6, 23, 0.5);
}

:global(.dark-theme) :deep(.summary-insight) {
    border-color: rgba(99, 102, 241, 0.18);
    background: linear-gradient(165deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.85));
    box-shadow: 0 22px 36px rgba(2, 6, 23, 0.45);
}

:global(.dark-theme) :deep(.summary-insight__icon) {
    background: rgba(71, 85, 105, 0.45);
    color: rgba(226, 232, 240, 0.95);
}

:global(.dark-theme) :deep(.summary-insight__title) {
    color: rgba(226, 232, 240, 0.75);
}

:global(.dark-theme) :deep(.summary-insight__value) {
    color: rgba(248, 250, 252, 0.95);
}

:global(.dark-theme) :deep(.summary-insight__detail) {
    color: rgba(203, 213, 225, 0.8);
}

:global(.dark-theme) :deep(.summary-insight.accent-primary) {
    background: linear-gradient(150deg, rgba(37, 99, 235, 0.35), rgba(59, 130, 246, 0.18));
}

:global(.dark-theme) :deep(.summary-insight.accent-success) {
    background: linear-gradient(150deg, rgba(22, 163, 74, 0.3), rgba(34, 197, 94, 0.16));
}

:global(.dark-theme) :deep(.summary-insight.accent-info) {
    background: linear-gradient(150deg, rgba(14, 165, 233, 0.32), rgba(56, 189, 248, 0.18));
}

:global(.dark-theme) :deep(.summary-insight.accent-warning) {
    background: linear-gradient(150deg, rgba(217, 119, 6, 0.32), rgba(251, 191, 36, 0.2));
}

:global(.dark-theme) :deep(.summary-insight.accent-purple) {
    background: linear-gradient(150deg, rgba(124, 58, 237, 0.4), rgba(168, 85, 247, 0.22));
}

:global(.dark-theme) :deep(.summary-insight.accent-danger) {
    background: linear-gradient(150deg, rgba(220, 38, 38, 0.35), rgba(248, 113, 113, 0.22));
}

:global(.dark-theme) :deep(.summary-insight.accent-primary .summary-insight__icon) { background: rgba(59, 130, 246, 0.28); color: rgba(219, 234, 254, 0.96); }
:global(.dark-theme) :deep(.summary-insight.accent-success .summary-insight__icon) { background: rgba(34, 197, 94, 0.28); color: rgba(220, 252, 231, 0.95); }
:global(.dark-theme) :deep(.summary-insight.accent-info .summary-insight__icon) { background: rgba(14, 165, 233, 0.28); color: rgba(224, 242, 254, 0.95); }
:global(.dark-theme) :deep(.summary-insight.accent-warning .summary-insight__icon) { background: rgba(251, 191, 36, 0.32); color: rgba(255, 247, 237, 0.95); }
:global(.dark-theme) :deep(.summary-insight.accent-purple .summary-insight__icon) { background: rgba(139, 92, 246, 0.32); color: rgba(237, 233, 254, 0.95); }
:global(.dark-theme) :deep(.summary-insight.accent-danger .summary-insight__icon) { background: rgba(248, 113, 113, 0.32); color: #b91c1c; }

.inventory-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
}

.inventory-overview__item {
    padding: 1rem;
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.24);
    background: rgba(248, 250, 252, 0.9);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
}

.inventory-overview__label {
    display: block;
    font-size: 0.82rem;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 0.2rem;
}

.inventory-overview__value {
    font-size: 1.1rem;
    font-weight: 700;
    color: #0f172a;
}

@media (max-width: 992px) {
    .summary-insights__grid {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }
}

:global([data-bs-theme='dark']) .reports-summary .summary-card__value {
    color: rgba(248, 250, 252, 0.95);
}

:global([data-bs-theme='dark']) .reports-summary .summary-insight__detail {
    color: rgba(203, 213, 225, 0.85);
}

:global([data-bs-theme='dark']) .reports-summary .summary-insight {
    border-color: rgba(99, 102, 241, 0.32);
    background-image: linear-gradient(160deg, rgba(30, 41, 59, 0.95), rgba(30, 64, 175, 0.4));
    box-shadow: 0 24px 48px rgba(2, 6, 23, 0.55);
}

:global([data-bs-theme='dark']) .reports-summary .inventory-overview__item {
    border-color: rgba(99, 102, 241, 0.35);
    background: rgba(15, 23, 42, 0.82);
    box-shadow: inset 0 1px 0 rgba(148, 163, 184, 0.25);
}

:global([data-bs-theme='dark']) .reports-summary .inventory-overview__value {
    color: rgba(241, 245, 249, 0.98);
}

:global([data-bs-theme='dark']) .reports-summary .badge.bg-danger-subtle {
    background-color: rgba(248, 113, 113, 0.35) !important;
    color: rgba(254, 226, 226, 0.96) !important;
}

:global([data-bs-theme='dark']) .reports-summary .badge.bg-success-subtle {
    background-color: rgba(34, 197, 94, 0.35) !important;
    color: rgba(220, 252, 231, 0.96) !important;
}

:global([data-bs-theme='dark']) .reports-summary .hourly-card,
:global([data-bs-theme='dark']) .reports-summary .payment-item {
    border-color: rgba(99, 102, 241, 0.3);
    background: rgba(15, 23, 42, 0.85);
}

:global([data-bs-theme='dark']) .reports-summary .payment-item__metrics .badge.bg-primary-subtle {
    background-color: rgba(59, 130, 246, 0.38) !important;
    color: rgba(219, 234, 254, 0.98) !important;
}

:global([data-bs-theme='dark']) .reports-summary .payment-item__metrics .badge.bg-success-subtle {
    background-color: rgba(34, 197, 94, 0.38) !important;
    color: rgba(220, 252, 231, 0.98) !important;
}

.charts-grid {
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
    padding-bottom: 0.85rem;
}

.payment-item:last-of-type {
    border-bottom: none;
    padding-bottom: 0;
}

.payment-item__main {
    display: flex;
    flex-direction: column;
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

.analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 1.5rem;
}

.analytics-card {
    border: 1px solid var(--color-border);
    border-radius: 18px;
    background: linear-gradient(180deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-soft);
}

.comparison-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
}

.comparison-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.85rem;
    border-radius: 16px;
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
}

.comparison-item__label {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.insight-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.insight-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.95rem;
}

.insight-list span {
    color: var(--color-text-muted);
}

@media (max-width: 768px) {
    .payment-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
    }

    .payment-item__metrics {
        flex-wrap: wrap;
        justify-content: flex-start;
    }
}
</style>
