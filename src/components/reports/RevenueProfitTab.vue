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

            <div class="card analytic-card hourly-sales-card">
                <div class="card-header border-0 d-flex flex-wrap gap-2 justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-1">Phân tích theo khung giờ</h5>
                        <p class="text-muted mb-0">Phân tích doanh thu và số đơn theo từng giờ trong ngày</p>
                    </div>
                    <div class="hourly-legend">
                        <div class="legend-item">
                            <span class="legend-color" style="background: #f0f9ff; border-color: #e0f2fe"></span>
                            <span class="legend-label">Thấp</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #bfdbfe; border-color: #7dd3fc"></span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #60a5fa; border-color: #0ea5e9"></span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #3b82f6; border-color: #0284c7"></span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #1e40af; border-color: #0c4a6e"></span>
                            <span class="legend-label">Cao</span>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div v-if="fullHourlyData?.length" class="hourly-content">
                        <!-- Chart Section -->
                        <div class="hourly-chart-section">
                            <ApexChart 
                                type="line" 
                                height="280" 
                                :series="hourlyChartSeries"
                                :options="hourlyChartOptions" 
                            />
                        </div>

                        <!-- Heatmap Grid -->
                        <div class="hourly-grid">
                            <div 
                                v-for="bucket in fullHourlyData" 
                                :key="bucket.hour" 
                                class="hourly-card"
                                :class="getHeatmapClass(bucket)" 
                                :style="getHeatmapStyle(bucket)"
                            >
                                <span class="hourly-card__hour">{{ bucket.hour }}h</span>
                                <strong class="hourly-card__revenue">{{ formatCurrency(bucket.revenue) }}</strong>
                                <span class="hourly-card__orders">{{ bucket.orderCount }} đơn</span>
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
// Build full 24 hours data with missing hours filled with 0
const fullHourlyData = computed(() => {
    const hoursMap = new Map()
    // Initialize all 24 hours with 0
    for (let i = 0; i < 24; i++) {
        hoursMap.set(i, {
            hour: i,
            revenue: 0,
            orderCount: 0
        })
    }
    // Fill with actual data
    if (props.hourlySales?.length) {
        props.hourlySales.forEach(item => {
            const hour = Number(item.hour)
            if (!isNaN(hour) && hour >= 0 && hour < 24) {
                hoursMap.set(hour, {
                    hour,
                    revenue: item.revenue || item.totalRevenue || 0,
                    orderCount: item.orderCount || 0
                })
            }
        })
    }
    return Array.from(hoursMap.values())
})

// Calculate max values for heatmap intensity
const maxRevenue = computed(() => {
    return Math.max(...fullHourlyData.value.map(b => b.revenue), 1)
})

const maxOrders = computed(() => {
    return Math.max(...fullHourlyData.value.map(b => b.orderCount), 1)
})

// Get heatmap intensity level (0-8) based on revenue
const getHeatmapIntensity = (bucket) => {
    if (maxRevenue.value === 0) return 0
    const ratio = bucket.revenue / maxRevenue.value
    if (ratio === 0) return 0
    if (ratio < 0.1) return 1
    if (ratio < 0.25) return 2
    if (ratio < 0.4) return 3
    if (ratio < 0.55) return 4
    if (ratio < 0.7) return 5
    if (ratio < 0.85) return 6
    if (ratio < 0.95) return 7
    return 8
}

// Get heatmap class based on intensity
const getHeatmapClass = (bucket) => {
    const intensity = getHeatmapIntensity(bucket)
    return `heatmap-intensity-${intensity}`
}

// Get heatmap style with background color
const getHeatmapStyle = (bucket) => {
    const intensity = getHeatmapIntensity(bucket)
    const colors = [
        '#f8fafc', // 0 - very light gray
        '#e2e8f0', // 1 - light gray
        '#cbd5e1', // 2 - gray
        '#94a3b8', // 3 - medium gray
        '#60a5fa', // 4 - light blue
        '#3b82f6', // 5 - blue
        '#2563eb', // 6 - medium blue
        '#1d4ed8', // 7 - dark blue
        '#1e3a8a'  // 8 - very dark blue
    ]
    const borderColors = [
        '#cbd5e1', // 0
        '#94a3b8', // 1
        '#64748b', // 2
        '#475569', // 3
        '#3b82f6', // 4
        '#2563eb', // 5
        '#1d4ed8', // 6
        '#1e40af', // 7
        '#1e3a8a'  // 8
    ]
    
    return {
        backgroundColor: colors[intensity],
        borderColor: borderColors[intensity],
        borderWidth: intensity >= 4 ? '2px' : '1px'
    }
}

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

// Chart series for hourly sales
const hourlyChartSeries = computed(() => {
    const revenues = fullHourlyData.value.map(b => b.revenue)
    const orders = fullHourlyData.value.map(b => b.orderCount)
    
    return [
        {
            name: 'Doanh thu',
            type: 'area',
            data: revenues
        },
        {
            name: 'Số đơn',
            type: 'line',
            data: orders
        }
    ]
})

// Chart options for hourly sales
const hourlyChartOptions = computed(() => {
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#2563eb'
    const successColor = getComputedStyle(document.documentElement).getPropertyValue('--color-success').trim() || '#10b981'
    const textMuted = getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim() || '#6b7280'
    const headingColor = getComputedStyle(document.documentElement).getPropertyValue('--color-heading').trim() || '#1f2937'
    
    const hours = fullHourlyData.value.map(b => `${b.hour.toString().padStart(2, '0')}:00`)
    
    return {
        chart: {
            type: 'line',
            toolbar: { show: false },
            stacked: false,
            zoom: { enabled: false },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            }
        },
        stroke: {
            curve: 'smooth',
            width: [5, 4],
            dashArray: [0, 10]
        },
        markers: {
            size: [8, 7],
            hover: {
                size: 10
            },
            colors: [primaryColor, successColor],
            strokeWidth: 2,
            strokeColors: ['#ffffff', '#ffffff'],
            fillOpacity: 1
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.5,
                opacityTo: 0.2,
                stops: [0, 50, 100],
                colorStops: [
                    {
                        offset: 0,
                        color: primaryColor,
                        opacity: 0.5
                    },
                    {
                        offset: 100,
                        color: primaryColor,
                        opacity: 0.2
                    }
                ]
            }
        },
        colors: [primaryColor, successColor],
        xaxis: {
            categories: hours,
            labels: {
                style: {
                    colors: headingColor,
                    fontSize: '13px',
                    fontFamily: 'var(--font-family-sans)',
                    fontWeight: '500'
                },
                rotate: -45,
                rotateAlways: false
            },
            tickAmount: 12,
            axisBorder: {
                show: true,
                color: textMuted,
                width: 2
            },
            axisTicks: {
                show: true,
                color: textMuted,
                width: 2
            }
        },
        yaxis: [
            {
                title: {
                    text: 'Doanh thu (₫)',
                    style: { 
                        color: primaryColor,
                        fontSize: '13px',
                        fontFamily: 'var(--font-family-sans)',
                        fontWeight: '600'
                    }
                },
                labels: {
                    formatter: (val) => formatCurrency(val),
                    style: { 
                        colors: textMuted,
                        fontSize: '11px',
                        fontFamily: 'var(--font-family-sans)'
                    }
                },
                axisBorder: {
                    show: true,
                    color: primaryColor
                }
            },
            {
                opposite: true,
                title: {
                    text: 'Số đơn',
                    style: { 
                        color: successColor,
                        fontSize: '13px',
                        fontFamily: 'var(--font-family-sans)',
                        fontWeight: '600'
                    }
                },
                labels: {
                    style: { 
                        colors: textMuted,
                        fontSize: '11px',
                        fontFamily: 'var(--font-family-sans)'
                    }
                },
                axisBorder: {
                    show: true,
                    color: successColor
                }
            }
        ],
        tooltip: {
            shared: true,
            intersect: false,
            theme: 'light',
            style: {
                fontSize: '13px',
                fontFamily: 'var(--font-family-sans)'
            },
            y: {
                formatter: (val, { seriesIndex }) => {
                    if (seriesIndex === 0) {
                        return formatCurrency(val)
                    }
                    return `${val} đơn`
                }
            },
            marker: {
                show: true
            }
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'right',
            fontSize: '13px',
            fontFamily: 'var(--font-family-sans)',
            markers: {
                width: 12,
                height: 12,
                radius: 2
            }
        },
        dataLabels: {
            enabled: false
        },
        grid: {
            borderColor: textMuted,
            strokeDashArray: 3,
            xaxis: {
                lines: {
                    show: true,
                    strokeDashArray: 3
                }
            },
            yaxis: {
                lines: {
                    show: true,
                    strokeDashArray: 3
                }
            },
            padding: {
                top: 10,
                right: 10,
                bottom: 10,
                left: 10
            }
        },
        plotOptions: {
            area: {
                fillTo: 'origin'
            }
        }
    }
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
    border-radius: var(--radius-sm);
    background: var(--color-card);
}

.chart-card :global(.card-header) {
    background: var(--color-card);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4);
}

.chart-card :global(.card-header h5) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.chart-card :global(.card-header .text-muted) {
    font-family: var(--font-family-sans);
}

.chart-card :global(.card-body) {
    padding: var(--spacing-4);
}

.chart-card :global(.form-select) {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.chart-card :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.chart-card :global(.btn) {
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.chart-card :global(.btn-outline-primary) {
    border-color: var(--color-border);
    color: var(--color-heading);
    background: transparent;
}

.chart-card :global(.btn-outline-primary:hover:not(:disabled)) {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.insight-list {
    list-style: none;
    margin: var(--spacing-4) 0 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: var(--spacing-3);
}

.insight-list li {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    padding: var(--spacing-3);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
}

.insight-list li span {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.insight-list li strong {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
}

.analytic-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
}

.analytic-card :global(.card-header) {
    background: var(--color-card);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4);
}

.analytic-card :global(.card-header h5) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.analytic-card :global(.card-header .text-muted) {
    font-family: var(--font-family-sans);
}

.analytic-card :global(.card-body) {
    padding: var(--spacing-4);
}

.analytic-card :global(.form-select) {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.analytic-card :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
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
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.payment-item__orders {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.payment-item__metrics strong {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.payment-item__metrics {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.hourly-sales-card {
    margin-top: 0;
}

.hourly-legend {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-3);
    background: var(--color-card-muted);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    flex-wrap: wrap;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
}

.legend-color {
    width: 20px;
    height: 20px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
}

.legend-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-medium);
}

.hourly-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-5);
}

.hourly-chart-section {
    background: var(--color-card-muted);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    padding: var(--spacing-4);
}

.hourly-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--spacing-2);
}

/* Heatmap design */
.hourly-card {
    border-radius: var(--radius-sm);
    padding: var(--spacing-3);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    transition: all 0.2s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    min-height: 80px;
    justify-content: center;
    border: 1px solid;
}

.hourly-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    opacity: 0.8;
}

.hourly-card:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    z-index: 1;
}

.hourly-card__hour {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
    margin-bottom: var(--spacing-1);
}

.hourly-card__revenue {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    font-size: var(--font-size-sm);
    font-family: var(--font-family-sans);
    line-height: 1.4;
    margin-bottom: var(--spacing-1);
}

.hourly-card__orders {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-semibold);
}

/* Heatmap intensity classes */
.hourly-card.heatmap-intensity-0,
.hourly-card.heatmap-intensity-1 {
    color: var(--color-heading);
}

.hourly-card.heatmap-intensity-0::before {
    background: #cbd5e1;
}

.hourly-card.heatmap-intensity-1::before {
    background: #94a3b8;
}

.hourly-card.heatmap-intensity-2,
.hourly-card.heatmap-intensity-3 {
    color: var(--color-heading);
}

.hourly-card.heatmap-intensity-2::before {
    background: #64748b;
}

.hourly-card.heatmap-intensity-3::before {
    background: #475569;
}

.hourly-card.heatmap-intensity-4,
.hourly-card.heatmap-intensity-5 {
    color: var(--color-heading);
}

.hourly-card.heatmap-intensity-4::before {
    background: #3b82f6;
}

.hourly-card.heatmap-intensity-5::before {
    background: #2563eb;
}

.hourly-card.heatmap-intensity-6,
.hourly-card.heatmap-intensity-7,
.hourly-card.heatmap-intensity-8 {
    color: #ffffff;
}

.hourly-card.heatmap-intensity-6::before {
    background: #1d4ed8;
}

.hourly-card.heatmap-intensity-7::before {
    background: #1e40af;
}

.hourly-card.heatmap-intensity-8::before {
    background: #1e3a8a;
}

.hourly-card.heatmap-intensity-6 .hourly-card__revenue,
.hourly-card.heatmap-intensity-7 .hourly-card__revenue,
.hourly-card.heatmap-intensity-8 .hourly-card__revenue {
    color: #ffffff;
    font-weight: var(--font-weight-bold);
}

.hourly-card.heatmap-intensity-6 .hourly-card__hour,
.hourly-card.heatmap-intensity-7 .hourly-card__hour,
.hourly-card.heatmap-intensity-8 .hourly-card__hour {
    color: #ffffff;
    font-weight: var(--font-weight-bold);
}

.hourly-card.heatmap-intensity-6 .hourly-card__orders,
.hourly-card.heatmap-intensity-7 .hourly-card__orders,
.hourly-card.heatmap-intensity-8 .hourly-card__orders {
    color: rgba(255, 255, 255, 0.9);
    font-weight: var(--font-weight-semibold);
}

.table-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
}

.table-card :global(.card-header) {
    background: var(--color-card);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4);
}

.table-card :global(.card-header h5) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.table-card :global(.card-header .text-muted) {
    font-family: var(--font-family-sans);
}

.table-card :global(.card-body) {
    padding: var(--spacing-4);
}

/* Minimal Table Styling */
.table-card :global(table) {
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
}

.table-card :global(table thead th) {
    background: var(--color-card-muted);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-3);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    text-align: left;
}

.table-card :global(table tbody td) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-3);
    font-family: var(--font-family-sans);
}

.table-card :global(table tbody tr:last-child td) {
    border-bottom: none;
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

    .hourly-grid {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: var(--spacing-2);
    }

    .hourly-card {
        padding: var(--spacing-2);
    }

    .hourly-legend {
        flex-wrap: wrap;
        gap: var(--spacing-1);
    }

    .legend-item {
        font-size: var(--font-size-xs);
    }

    .legend-color {
        width: 16px;
        height: 16px;
    }
}
</style>
