<template>
  <div class="reports-summary">
    <div class="summary-cards">
      <div
        v-for="card in summaryCards"
        :key="card.key"
        class="summary-card"
        :class="{ 'summary-card--warning': card.key === 'lowStockItems' && (card.value ?? 0) > 0 }"
      >
        <div
          class="summary-card__icon"
          :class="card.variant"
        >
          <i :class="card.icon" />
        </div>
        <div class="summary-card__meta">
          <span class="summary-card__label">{{ card.label }}</span>
          <div class="summary-card__value-wrapper">
            <strong class="summary-card__value">{{ card.displayValue }}</strong>
            <small
              v-if="card.subtitle"
              class="summary-card__subtitle"
              :class="card.subtitleClass"
            >{{ card.subtitle }}</small>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="insightItems.length"
      class="summary-insights card"
    >
      <div class="summary-insights__header">
        <div>
          <h5 class="mb-1">
            Điểm nổi bật
          </h5>
          <p class="text-muted mb-0">
            Insights tổng hợp từ dữ liệu báo cáo.
          </p>
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
            <i :class="item.icon" />
          </div>
          <div class="summary-insight__content">
            <span class="summary-insight__title">{{ item.title }}</span>
            <strong class="summary-insight__value">{{ item.value }}</strong>
            <small
              v-if="item.detail"
              class="summary-insight__detail"
            >{{ item.detail }}</small>
          </div>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="card chart-card">
        <div class="card-header border-0 d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <div>
            <h5 class="mb-1">
              Xu hướng doanh thu
            </h5>
            <p class="text-muted mb-0">
              Tổng: {{ formatCurrency(revenueSummary.total) }} · TB/ngày: {{ formatCurrency(revenueSummary.average) }}
            </p>
          </div>
          <div class="chart-controls">
            <!-- Chart type selector đã được ẩn - sử dụng mặc định area chart -->
          </div>
        </div>
        <div class="card-body">
          <ApexChart
            v-if="chartsReady && isValidSeries(revenueSeries) && computedRevenueOptions"
            :type="revenueChartType"
            height="280"
            :series="revenueSeries"
            :options="computedRevenueOptions"
          />
          <div
            v-else-if="!chartsReady"
            class="text-center text-muted py-4"
          >
            <i class="bi bi-hourglass-split" />
            <p class="mb-0 mt-2">
              Đang tải dữ liệu...
            </p>
          </div>
          <div
            v-else
            class="text-center text-muted py-4"
          >
            <i class="bi bi-graph-up" />
            <p class="mb-0 mt-2">
              Chưa có dữ liệu để hiển thị
            </p>
          </div>
        </div>
      </div>
      <div class="card chart-card">
        <div class="card-header border-0 d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <div>
            <h5 class="mb-1">
              Phân bổ phương thức thanh toán
            </h5>
            <p class="text-muted mb-0">
              {{ paymentMetricLabel }}
            </p>
          </div>
          <div class="chart-controls d-flex gap-2">
            <!-- Chart type selector đã được ẩn - sử dụng mặc định donut chart -->
            <select
              v-model="paymentMetric"
              class="form-select form-select-sm"
            >
              <option value="orders">
                Theo số lượng đơn
              </option>
              <option value="amount">
                Theo doanh thu
              </option>
            </select>
          </div>
        </div>
        <div class="card-body">
          <div
            v-if="paymentItems.length"
            class="payment-chart-wrapper"
          >
            <ApexChart
              v-if="isValidSeries(paymentChartSeries) && paymentChartOptions"
              :type="resolvedPaymentChartType"
              height="280"
              :series="paymentChartSeries"
              :options="paymentChartOptions"
            />
            <div
              v-else
              class="text-center text-muted py-4"
            >
              <i class="bi bi-pie-chart" />
              <p class="mb-0 mt-2">
                Chưa có dữ liệu để hiển thị
              </p>
            </div>
          </div>
          <p
            v-else
            class="text-muted mb-0"
          >
            Chưa có dữ liệu thanh toán trong khoảng thời gian đã chọn.
          </p>
        </div>
      </div>
    </div>

    <div class="analytics-grid">
      <div class="card analytics-card">
        <div class="card-header border-0">
          <h5 class="mb-1">
            Điểm nhấn lợi nhuận
          </h5>
          <p class="text-muted mb-0">
            Các chỉ số hiệu quả hoạt động chính
          </p>
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

      <div
        v-if="inventoryHighlights.length"
        class="card analytics-card"
      >
        <div class="card-header border-0">
          <h5 class="mb-1">
            Tổng quan tồn kho
          </h5>
          <p class="text-muted mb-0">
            Theo dõi nhanh trạng thái nguyên liệu
          </p>
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
              <span
                v-if="item.badge"
                class="badge"
                :class="item.badge.variant"
              >{{ item.badge.text }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="card chart-card">
        <div class="card-header border-0 d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <div>
            <h5 class="mb-1">
              Top danh mục
            </h5>
            <p class="text-muted mb-0">
              Dựa trên {{ productMetric === 'revenue' ? 'doanh thu' : 'số lượng' }}
            </p>
          </div>
          <div class="chart-controls d-flex gap-2">
            <select
              v-model="productMetric"
              class="form-select form-select-sm"
            >
              <option value="revenue">
                Doanh thu
              </option>
              <option value="quantity">
                Số lượng
              </option>
            </select>
            <!-- Chart type selector đã được ẩn - sử dụng mặc định horizontalBar -->
          </div>
        </div>
        <div class="card-body">
          <ApexChart
            v-if="topCategoryItems.length && isValidSeries(productChartSeries) && productChartOptions"
            :type="resolvedProductChartType"
            height="280"
            :series="productChartSeries"
            :options="productChartOptions"
          />
          <p
            v-else
            class="text-muted mb-0"
          >
            Chưa có dữ liệu danh mục.
          </p>
        </div>
      </div>
      <div class="card chart-card">
        <div class="card-header border-0 d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <div>
            <h5 class="mb-1">
              Top khách hàng
            </h5>
            <p class="text-muted mb-0">
              Theo tổng chi tiêu
            </p>
          </div>
          <div class="chart-controls d-flex gap-2">
            <!-- Chart type selector đã được ẩn - sử dụng mặc định horizontalBar -->
            <select
              v-model="customerTopLimit"
              class="form-select form-select-sm"
            >
              <option value="5">
                Top 5
              </option>
              <option value="10">
                Top 10
              </option>
              <option value="all">
                Tất cả
              </option>
            </select>
          </div>
        </div>
        <div class="card-body">
          <ApexChart
            v-if="topCustomerItems.length && isValidSeries(customerChartSeries) && customerChartOptions"
            :type="resolvedCustomerChartType"
            height="280"
            :series="customerChartSeries"
            :options="customerChartOptions"
          />
          <p
            v-else
            class="text-muted mb-0"
          >
            Chưa có dữ liệu khách hàng.
          </p>
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

// Helper function to validate series data
const isValidSeries = (series) => {
    if (!series || !Array.isArray(series) || series.length === 0) return false
    const firstItem = series[0]
    if (!firstItem && firstItem !== 0) return false
    // Check if it's object format with data array (for bar/line/area charts)
    if (firstItem && typeof firstItem === 'object' && firstItem.data !== undefined) {
        return Array.isArray(firstItem.data) && firstItem.data.length > 0
    }
    // Check if it's array of numbers (for pie/donut charts)
    if (typeof firstItem === 'number') {
        return true
    }
    return false
}

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
    categorySales: { type: Array, default: () => [] },
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
const productChartType = ref('horizontalBar')
const productMetric = ref('revenue')
const customerChartType = ref('horizontalBar')
const customerTopLimit = ref('5')

const { isDark } = useThemePreference()

const baseLabelStyle = computed(() => ({
    colors: isDark.value ? '#EFF2F6' : '#64748b',
    fontSize: '12px',
    fontWeight: isDark.value ? 500 : 400
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
            foreColor: dark ? '#EFF2F6' : '#475569',
            background: 'transparent'
        },
        stroke: isCircular
            ? { colors: ['#ffffff'], width: 2 }
            : { curve: 'straight', width: isBar ? 0 : 3 },
        dataLabels: { enabled: false },
        colors,
        grid: {
            strokeDashArray: 4,
            borderColor: dark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(148, 163, 184, 0.35)',
            padding: { top: 8, bottom: 8, left: 12, right: 12 }
        },
        xaxis: {
            categories: [],
            labels: { style: { ...labelStyle } },
            axisBorder: {
                color: dark ? 'rgba(148, 163, 184, 0.5)' : 'rgba(203, 213, 225, 0.6)',
                strokeWidth: dark ? 1.5 : 1
            },
            axisTicks: {
                color: dark ? 'rgba(148, 163, 184, 0.5)' : 'rgba(203, 213, 225, 0.6)',
                strokeWidth: dark ? 1.5 : 1
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
        legend: { position: 'bottom', labels: { colors: dark ? '#EFF2F6' : '#475569', fontWeight: dark ? 500 : 400 } },
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
    const comparison = props.salesComparison
    const todayGrowth = comparison?.growthPercentage ?? 0
    const revenueValue = s.todayRevenue ?? 0

    return [
        {
            key: 'todayRevenue',
            label: 'Tổng doanh thu: ',
            value: revenueValue,
            icon: 'bi bi-cash-stack',
            variant: 'variant-primary',
            subtitle: comparison && revenueValue > 0 ? ` ${todayGrowth >= 0 ? '+' : ''}${todayGrowth.toFixed(2)}% so với kỳ trước` : null,
            subtitleClass: todayGrowth >= 0 ? 'text-success' : 'text-danger'
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
            label: 'Tổng đơn hàng: ',
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
            label: 'Tổng lợi nhuận: ',
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
        subtitle: card.subtitle || (card.key === 'todayRevenue' && props.dailyRevenue && !card.subtitle && revenueValue > 0
            ? `Ngày ${props.dailyRevenue.date}: ${formatCurrency(props.dailyRevenue.totalRevenue)}`
            : null),
        subtitleClass: card.subtitleClass || null
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
const paymentMetricLabel = computed(() => paymentMetric.value === 'orders' ? 'Tỷ trọng theo số lượng đơn' : 'Tỷ trọng theo doanh thu')

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
            ? { curve: 'straight', width: 0 }
            : { curve: 'straight', width: chartType === 'line' ? 3 : 2 },
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
    const items = Array.isArray(paymentItems.value) ? paymentItems.value : []
    if (items.length === 0) {
        // Return empty array for pie/donut, empty object array for bar
        if (paymentChartType.value === 'pie' || paymentChartType.value === 'donut') {
            return []
        }
        return [{ name: paymentMetric.value === 'orders' ? 'Số đơn' : 'Doanh thu', data: [] }]
    }
    const data = items.map((item) => paymentMetric.value === 'orders' ? (Number(item?.orderCount) || 0) : (Number(item?.totalAmount) || 0))
    // Với pie/donut charts, ApexCharts yêu cầu mảng số trực tiếp
    if (paymentChartType.value === 'pie' || paymentChartType.value === 'donut') {
        return data
    }
    // Với bar charts, trả về dạng object
    return [
        {
            name: paymentMetric.value === 'orders' ? 'Số đơn' : 'Doanh thu',
            data
        }
    ]
})

const paymentChartOptions = computed(() => {
    const items = Array.isArray(paymentItems.value) ? paymentItems.value : []
    const labels = items.length > 0
        ? items.map((item, index) => item?.label ?? `PTTT #${index + 1}`)
        : []
    const base = createBaseOptions(resolvedPaymentChartType.value, VIBRANT_PALETTE)
    const isBar = resolvedPaymentChartType.value === 'bar'
    const isCircular = ['pie', 'donut'].includes(resolvedPaymentChartType.value)

    return mergeOptions(base, {
        labels: labels.length > 0 ? labels : undefined,
        dataLabels: {
            enabled: !isBar,
            formatter: (val) => `${Number(val).toFixed(1)}%`
        },
        chart: {
            ...base.chart,
            width: isCircular ? '70%' : '100%'
        },
        legend: {
            position: isCircular ? 'right' : 'bottom',
            horizontalAlign: isCircular ? 'center' : 'center',
            labels: { colors: isDark.value ? '#cbd5f5' : '#475569' }
        },
        plotOptions: {
            pie: {
                donut: {
                    size: isCircular ? '60%' : '70%'
                }
            },
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

// Đổi từ Top sản phẩm sang Top danh mục
const topCategoryItems = computed(() => {
    if (!props.categorySales?.length) return []
    const limit = 8
    // Sắp xếp theo doanh thu hoặc số lượng tùy theo productMetric
    const sorted = [...props.categorySales].sort((a, b) => {
        const valA = productMetric.value === 'revenue'
            ? (Number(a?.totalRevenue) || 0)
            : (Number(a?.totalQuantitySold) || 0)
        const valB = productMetric.value === 'revenue'
            ? (Number(b?.totalRevenue) || 0)
            : (Number(b?.totalQuantitySold) || 0)
        return valB - valA
    })
    return sorted.slice(0, limit)
})

const resolvedProductChartType = computed(() => productChartType.value === 'horizontalBar' ? 'bar' : productChartType.value)

const productChartSeries = computed(() => {
    const items = Array.isArray(topCategoryItems.value) ? topCategoryItems.value : []
    if (!items.length) {
        // Return empty array for pie, empty object array for bar
        if (productChartType.value === 'pie') {
            return []
        }
        return [{ name: productMetric.value === 'revenue' ? 'Doanh thu' : 'Số lượng', data: [] }]
    }
    const values = items.map((item) => {
        const val = productMetric.value === 'revenue'
            ? (Number(item?.totalRevenue) || 0)
            : (Number(item?.totalQuantitySold) || 0)
        return val
    }).filter(v => typeof v === 'number' && !isNaN(v)) // Đảm bảo tất cả giá trị đều là số hợp lệ

    // Với pie charts, ApexCharts yêu cầu mảng số trực tiếp
    if (productChartType.value === 'pie') {
        return values.length > 0 ? values : []
    }
    // For bar charts, return object format
    return [
        {
            name: productMetric.value === 'revenue' ? 'Doanh thu' : 'Số lượng',
            data: values.length > 0 ? values : []
        }
    ]
})

const productChartOptions = computed(() => {
    const items = Array.isArray(topCategoryItems.value) ? topCategoryItems.value : []
    const labels = items.length > 0
        ? items.map((item, index) => item?.categoryName || `Danh mục #${index + 1}`)
        : []
    const base = createBaseOptions(resolvedProductChartType.value, VIBRANT_PALETTE)

    const isHorizontal = productChartType.value === 'horizontalBar'
    const isBar = resolvedProductChartType.value === 'bar'

    // Đảm bảo categories luôn là array, không phải undefined
    const safeCategories = Array.isArray(labels) && labels.length > 0 ? labels : []

    return mergeOptions(base, {
        labels: safeCategories.length > 0 ? safeCategories : undefined,
        dataLabels: { enabled: productChartType.value === 'pie' },
        plotOptions: {
            bar: {
                borderRadius: 8,
                horizontal: isHorizontal,
                columnWidth: isHorizontal ? '75%' : '65%', /* Tăng độ dày bar từ mặc định */
                barHeight: isHorizontal ? '70%' : undefined /* Tăng chiều cao bar ngang */
            }
        },
        // Với ApexCharts, categories luôn ở xaxis, dù horizontal hay vertical
        xaxis: isBar
            ? {
                ...base.xaxis,
                categories: safeCategories, // Luôn là array, không phải undefined
                labels: {
                    ...base.xaxis.labels,
                    style: {
                        ...base.xaxis.labels.style,
                        fontSize: '13px' /* Tăng font size trục hoành */
                    },
                    formatter: isHorizontal ? (value) => productMetric.value === 'revenue' ? formatCurrency(value) : formatNumber(value) : undefined
                }
            }
            : base.xaxis,
        yaxis: isBar
            ? {
                ...base.yaxis,
                labels: {
                    ...base.yaxis.labels,
                    style: {
                        ...base.yaxis.labels.style,
                        fontSize: isHorizontal ? '13px' : '12px' /* Tăng font size cho bar ngang */
                    }
                }
            }
            : base.yaxis,
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
    const items = Array.isArray(topCustomerItems.value) ? topCustomerItems.value : []
    if (!items.length) {
        // Return empty array for pie, empty object array for bar
        if (customerChartType.value === 'pie') {
            return []
        }
        return [{ name: 'Chi tiêu', data: [] }]
    }
    const values = items.map((item) => Number(item?.totalSpent) || 0)
        .filter(v => typeof v === 'number' && !isNaN(v)) // Đảm bảo tất cả giá trị đều là số hợp lệ

    // Với pie charts, ApexCharts yêu cầu mảng số trực tiếp
    if (customerChartType.value === 'pie') {
        return values.length > 0 ? values : []
    }
    // For bar charts, return object format
    return [
        {
            name: 'Chi tiêu',
            data: values.length > 0 ? values : []
        }
    ]
})

const customerChartOptions = computed(() => {
    const items = Array.isArray(topCustomerItems.value) ? topCustomerItems.value : []
    const labels = items.length > 0
        ? items.map((item, index) => item?.customerName ?? `Khách #${item?.customerId ?? index + 1}`)
        : []
    const base = createBaseOptions(resolvedCustomerChartType.value, VIBRANT_PALETTE)

    const isHorizontal = customerChartType.value === 'horizontalBar'
    const isBar = resolvedCustomerChartType.value === 'bar'

    // Đảm bảo categories luôn là array, không phải undefined
    const safeCategories = Array.isArray(labels) && labels.length > 0 ? labels : []

    return mergeOptions(base, {
        labels: safeCategories.length > 0 ? safeCategories : undefined,
        plotOptions: {
            bar: {
                borderRadius: 8,
                horizontal: isHorizontal,
                columnWidth: isHorizontal ? '75%' : '65%', /* Tăng độ dày bar */
                barHeight: isHorizontal ? '70%' : undefined /* Tăng chiều cao bar ngang */
            }
        },
        // Với ApexCharts, categories luôn ở xaxis, dù horizontal hay vertical
        xaxis: isBar
            ? {
                ...base.xaxis,
                categories: safeCategories, // Luôn là array, không phải undefined
                labels: {
                    ...base.xaxis.labels,
                    style: {
                        ...base.xaxis.labels.style,
                        fontSize: '13px' /* Tăng font size trục hoành */
                    },
                    formatter: isHorizontal ? (value) => formatCurrency(value) : undefined
                }
            }
            : base.xaxis,
        yaxis: isBar
            ? {
                ...base.yaxis,
                labels: {
                    ...base.yaxis.labels,
                    style: {
                        ...base.yaxis.labels.style,
                        fontSize: isHorizontal ? '13px' : '12px' /* Tăng font size cho bar ngang */
                    }
                }
            }
            : base.yaxis,
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
    gap: 1.75rem; /* Tăng khoảng cách giữa các section */
}

/* Tăng khoảng cách đặc biệt giữa Điểm nổi bật và biểu đồ */
.summary-insights {
    margin-bottom: 0.75rem; /* Tăng margin-bottom để tách biệt rõ ràng hơn */
}

.summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem; /* Tăng khoảng cách giữa các card */
}

.summary-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    transition: all var(--transition-base);
    position: relative;
    overflow: hidden;
}

.summary-card::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: currentColor;
    opacity: 0;
    transition: opacity var(--transition-base);
}

.summary-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
}

.summary-card:hover::before {
    opacity: 0.7;
}

.summary-card__icon {
    width: 52px;
    height: 52px;
    border-radius: var(--radius-md);
    display: grid;
    place-items: center;
    font-size: 1.375rem;
    flex-shrink: 0;
    transition: transform var(--transition-base);
}

.summary-card:hover .summary-card__icon {
    transform: scale(1.05);
}

.variant-primary { background: var(--color-soft-primary); color: var(--color-primary); }
.variant-indigo { background: var(--color-soft-sky); color: var(--color-info); }
.variant-amber { background: var(--color-soft-amber); color: var(--color-warning); }
.variant-sky { background: var(--color-soft-sky); color: var(--color-info); }
.variant-emerald { background: var(--color-soft-emerald); color: var(--color-success); }
.variant-rose { background: var(--color-soft-rose); color: var(--color-danger); }

.summary-card__label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    letter-spacing: 0.01em;
    line-height: 1.4;
}

.summary-card__value-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.summary-card__value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    line-height: 1.3;
    letter-spacing: -0.01em;
}

.summary-card__subtitle {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
    line-height: 1.4;
    font-weight: var(--font-weight-medium);
    margin-top: var(--spacing-1);
}

.summary-card--warning {
    background: rgba(239, 68, 68, 0.08);
    border-color: rgba(239, 68, 68, 0.3);
}

.summary-card--warning:hover {
    background: rgba(239, 68, 68, 0.12);
    border-color: rgba(239, 68, 68, 0.4);
}

.summary-insights {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    padding: var(--spacing-4);
}

.summary-insights__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-4);
}

.summary-insights__header h5 {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.summary-insights__header .text-muted {
    font-family: var(--font-family-sans);
}

.summary-insights__grid {
    display: grid;
    gap: var(--spacing-4); /* Tăng từ spacing-3 lên spacing-4 */
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

@media (max-width: 1200px) {
    .summary-insights__grid {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }
}

@media (max-width: 768px) {
    .summary-insights__grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

.summary-insight {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-3);
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    transition: all var(--transition-base);
}

.summary-insight:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

.summary-insight__icon {
    width: 56px; /* Tăng từ 48px lên 56px */
    height: 56px; /* Tăng từ 48px lên 56px */
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px; /* Tăng từ 20px lên 24px */
    flex-shrink: 0; /* Đảm bảo icon không bị co lại */
}

.summary-insight__content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    color: var(--color-heading);
}

.summary-insight__title {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.summary-insight__value {
    font-size: 1.125rem; /* Tăng từ var(--font-size-lg) lên 18px */
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    line-height: 1.4;
}

.summary-insight__detail {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.summary-insight__detail::before {
    content: '• ';
    color: inherit;
}

.summary-insight.accent-primary {
    background: var(--color-card);
}

.summary-insight.accent-success {
    background: var(--color-card);
}

.summary-insight.accent-info {
    background: var(--color-card);
}

.summary-insight.accent-warning {
    background: var(--color-card);
}

.summary-insight.accent-purple {
    background: var(--color-card);
}

.summary-insight.accent-danger {
    background: var(--color-card);
}

.summary-insight.accent-primary .summary-insight__icon { background: var(--color-soft-primary); color: var(--color-primary); }
.summary-insight.accent-success .summary-insight__icon { background: var(--color-soft-primary); color: var(--color-primary); }
.summary-insight.accent-info .summary-insight__icon { background: var(--color-soft-primary); color: var(--color-primary); }
.summary-insight.accent-warning .summary-insight__icon { background: var(--color-soft-primary); color: var(--color-primary); }
.summary-insight.accent-purple .summary-insight__icon { background: var(--color-soft-primary); color: var(--color-primary); }
.summary-insight.accent-danger .summary-insight__icon { background: var(--color-soft-emerald); color: var(--color-success); }

/* Dark theme styles removed - using CSS variables for theme compatibility */

.inventory-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
}

.inventory-overview__item {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-3);
}

.inventory-overview__label {
    display: block;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.inventory-overview__value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

@media (max-width: 992px) {
    .summary-insights__grid {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }
}

/* Dark theme styles removed - using CSS variables for theme compatibility */

.charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem; /* Tăng từ 1rem lên 1.5rem */
    margin-top: 0.5rem; /* Thêm margin-top để tách biệt với phần trên */
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

.payment-chart-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
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
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.payment-item__orders {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.payment-item__metrics {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
}

.analytics-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
}

.analytics-card :global(.card-header) {
    background: var(--color-card);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4);
}

.analytics-card :global(.card-header h5) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.analytics-card :global(.card-header .text-muted) {
    font-family: var(--font-family-sans);
}

.analytics-card :global(.card-body) {
    padding: var(--spacing-4);
}

.comparison-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
}

.comparison-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    padding: var(--spacing-3);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
}

.comparison-item strong {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.comparison-item__label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.insight-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.insight-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
    padding-bottom: var(--spacing-3);
    border-bottom: 1px solid var(--color-border);
}

.insight-list li:last-child {
    border-bottom: none;
    padding-bottom: 0;
}

.insight-list span {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.insight-list strong {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
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
