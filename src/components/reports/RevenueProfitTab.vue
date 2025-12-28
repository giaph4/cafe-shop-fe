<template>
  <div class="revenue-profit">
    <div class="chart-grid">
      <div class="card chart-card">
        <div class="card-header border-0 d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <div>
            <h5 class="mb-1">
              Doanh thu theo ngày
            </h5>
            <p class="text-muted mb-0">
              Tổng: {{ formatCurrency(revenueSummary.total) }} · TB/ngày: {{ formatCurrency(revenueSummary.average) }}
            </p>
          </div>
          <div class="d-flex gap-2 align-items-center">
            <button
              class="btn btn-outline-primary btn-sm"
              type="button"
              :disabled="ordersExporting"
              @click="handleExportOrders"
            >
              <span
                v-if="ordersExporting"
                class="spinner-border spinner-border-sm me-2"
              />
              Xuất đơn hàng
            </button>
          </div>
        </div>
        <div class="card-body">
          <ApexChart
            v-if="isValidSeries(normalizedRevenueSeries) && computedRevenueOptions"
            :type="revenueChartType"
            height="320"
            :series="normalizedRevenueSeries"
            :options="computedRevenueOptions"
          />
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
              Lợi nhuận gộp
            </h5>
            <p class="text-muted mb-0">
              So sánh doanh thu và lợi nhuận trong kỳ
            </p>
          </div>
          <div class="chart-controls">
            <!-- Chart type selector đã được ẩn - sử dụng mặc định bar chart -->
          </div>
        </div>
        <div class="card-body">
          <ApexChart
            v-if="isValidSeries(normalizedProfitSeries) && computedProfitOptions"
            :type="resolvedProfitChartType"
            height="320"
            :series="normalizedProfitSeries"
            :options="computedProfitOptions"
          />
          <div
            v-else
            class="text-center text-muted py-4"
          >
            <i class="bi bi-bar-chart" />
            <p class="mb-0 mt-2">
              Chưa có dữ liệu để hiển thị
            </p>
          </div>
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
            <h5 class="mb-1">
              Phân bổ phương thức thanh toán
            </h5>
            <p class="text-muted mb-0">
              Theo số đơn hoặc doanh thu
            </p>
          </div>
          <div class="chart-controls d-flex gap-2">
            <!-- Chart type selector đã được ẩn - sử dụng mặc định donut chart -->
            <select
              v-model="paymentMetric"
              class="form-select form-select-sm"
            >
              <option value="orders">
                Số đơn
              </option>
              <option value="amount">
                Doanh thu
              </option>
            </select>
          </div>
        </div>
        <div
          v-if="paymentStats?.length"
          class="card-body"
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
          <div class="payment-list">
            <div
              v-for="item in paymentStats"
              :key="item.paymentMethod"
              class="payment-item"
            >
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
        <div
          v-else
          class="card-body"
        >
          <p class="text-muted mb-0">
            Chưa có dữ liệu thanh toán cho giai đoạn này.
          </p>
        </div>
      </div>

      <div class="card analytic-card hourly-sales-card">
        <div class="card-header border-0 d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <div>
            <h5 class="mb-1">
              Phân tích theo khung giờ
            </h5>
            <p class="text-muted mb-0">
              Phân tích doanh thu và số đơn theo từng giờ trong ngày
            </p>
          </div>
          <div class="hourly-legend">
            <div class="legend-item">
              <span class="legend-color legend-color--low" />
              <span class="legend-label">Thấp</span>
            </div>
            <div class="legend-item">
              <span class="legend-color legend-color--medium-low" />
            </div>
            <div class="legend-item">
              <span class="legend-color legend-color--medium" />
            </div>
            <div class="legend-item">
              <span class="legend-color legend-color--medium-high" />
            </div>
            <div class="legend-item">
              <span class="legend-color legend-color--high" />
              <span class="legend-label">Cao</span>
            </div>
          </div>
        </div>
        <div class="card-body">
          <div
            v-if="fullHourlyData?.length"
            class="hourly-content"
          >
            <!-- Chart Section -->
            <div class="hourly-chart-section">
              <ApexChart
                v-if="isValidSeries(hourlyChartSeries) && hourlyChartOptions"
                type="bar"
                height="280"
                :series="hourlyChartSeries"
                :options="hourlyChartOptions"
              />
              <div
                v-else
                class="text-center text-muted py-4"
              >
                <i class="bi bi-clock-history" />
                <p class="mb-0 mt-2">
                  Chưa có dữ liệu để hiển thị
                </p>
              </div>
            </div>

            <!-- Heatmap Grid - Chỉ hiển thị giờ có giao dịch -->
            <div
              class="hourly-grid"
              :class="{ 'hourly-grid--compact': fullHourlyData.length < 6 }"
            >
              <div
                v-for="bucket in fullHourlyData"
                :key="bucket.hour"
                class="hourly-card"
                :class="getHeatmapClass(bucket)"
                :style="getHeatmapStyle(bucket)"
              >
                <span class="hourly-card__hour">{{ bucket.hour }}h</span>
                <strong class="hourly-card__revenue">{{ formatCurrencyShort(bucket.revenue) }}</strong>
                <span class="hourly-card__orders">{{ bucket.orderCount }} đơn</span>
              </div>
            </div>
          </div>
          <p
            v-else
            class="text-muted mb-0"
          >
            Chưa có thống kê theo giờ.
          </p>
        </div>
      </div>
    </div>

    <div class="card table-card">
      <div class="card-header border-0 d-flex justify-content-between align-items-center">
        <div>
          <h5 class="mb-1">
            Doanh thu theo danh mục
          </h5>
          <p class="text-muted mb-0">
            Phân bổ doanh thu theo nhóm sản phẩm
          </p>
        </div>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Danh mục</th>
              <th class="text-end">
                Số lượng
              </th>
              <th class="text-end">
                Doanh thu
              </th>
              <th class="text-end">
                Tỷ trọng
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in categorySales"
              :key="item.categoryId || item.categoryName"
            >
              <td>{{ item.categoryName }}</td>
              <td class="text-end">
                {{ formatNumber(item.totalQuantitySold) }}
              </td>
              <td class="text-end">
                {{ formatCurrency(item.totalRevenue) }}
              </td>
              <td class="text-end">
                <div class="category-percentage">
                  <div class="category-percentage__bar-wrapper">
                    <div
                      class="category-percentage__bar"
                      :style="{ width: `${item.revenuePercentage ?? 0}%` }"
                    />
                  </div>
                  <span class="badge bg-light text-dark ms-2">{{ (item.revenuePercentage ?? 0).toFixed(2) }}%</span>
                </div>
              </td>
            </tr>
            <tr v-if="!categorySales?.length">
              <td
                colspan="4"
                class="text-center text-muted py-4"
              >
                Chưa có dữ liệu doanh thu theo danh mục.
              </td>
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

// Format currency ngắn gọn (1M, 1tr)
const formatCurrencyShort = (value) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '0đ'
    const absValue = Math.abs(value)
    if (absValue >= 1000000000) {
        return `${(value / 1000000000).toFixed(1)}T`
    }
    if (absValue >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`
    }
    if (absValue >= 1000) {
        return `${(value / 1000).toFixed(0)}K`
    }
    return formatCurrency(value)
}

// Format ngày ngắn gọn (06/12 hoặc 06) - ưu tiên ngày/tháng để rõ ràng hơn
const formatDateShort = (dateString) => {
    if (!dateString) return ''
    try {
        const date = new Date(dateString)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        // Hiển thị ngày/tháng (06/12) để rõ ràng hơn
        return `${day}/${month}`
    } catch {
        // Nếu không parse được, thử lấy phần cuối (sau dấu -)
        if (typeof dateString === 'string' && dateString.includes('-')) {
            const parts = dateString.split('-')
            if (parts.length >= 3) {
                // Format: YYYY-MM-DD -> DD/MM
                return `${parts[2]}/${parts[1]}`
            }
            if (parts.length >= 2) {
                return parts[parts.length - 1] // Lấy ngày cuối cùng
            }
        }
        return dateString
    }
}

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
    revenueSeries: { type: Array, default: () => [{ name: 'Doanh thu', data: [] }] },
    revenueOptions: { type: Object, default: () => ({}) },
    profitSeries: { type: Array, default: () => [{ name: 'Doanh thu', data: [] }, { name: 'Lợi nhuận', data: [] }] },
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
// Color coding: Đồng nhất màu sắc
const REVENUE_COLOR = '#2563eb' // Xanh dương cho Doanh thu
const PROFIT_COLOR = '#22c55e' // Xanh lá cho Lợi nhuận
const COST_COLOR = '#f97316' // Cam cho Giá vốn

// Palette cho payment methods - KHÔNG dùng màu tài chính (revenue/profit/cost)
const PAYMENT_PALETTE = Object.freeze([
    '#3b82f6', // Xanh dương nhạt (không phải REVENUE_COLOR)
    '#8b5cf6', // Tím
    '#ec4899', // Hồng
    '#0ea5e9', // Xanh cyan
    '#14b8a6', // Xanh ngọc
    '#facc15', // Vàng
    '#ef4444', // Đỏ (không phải COST_COLOR)
    '#9333ea', // Tím đậm
    '#06b6d4', // Cyan
    '#84cc16'  // Xanh lá nhạt (không phải PROFIT_COLOR)
])

const VIBRANT_PALETTE = Object.freeze([
    REVENUE_COLOR,
    COST_COLOR,
    PROFIT_COLOR,
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
                        shadeIntensity: 0.5, // Giảm từ 1 xuống 0.5
                        opacityFrom: dark ? 0.3 : 0.35, // Giảm opacity
                        opacityTo: dark ? 0.05 : 0.08, // Giảm opacity
                        stops: [0, 100] // Đơn giản hóa
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
    // Ưu tiên colors từ overrides để có thể override màu từ props
    colors: overrides.colors !== undefined ? overrides.colors : base.colors,
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

// Chart types cố định - không cho phép người dùng thay đổi
const revenueChartType = ref('area') // Cố định Area chart cho doanh thu
const profitChartType = ref('bar') // Cố định Bar chart cho lợi nhuận
const paymentChartType = ref('donut') // Cố định Donut chart cho phương thức thanh toán
const paymentMetric = ref('orders')

// Normalize series props to ensure they're always valid arrays
const normalizedRevenueSeries = computed(() => {
    const series = Array.isArray(props.revenueSeries) ? props.revenueSeries : []
    if (series.length === 0) {
        return [{ name: 'Doanh thu', data: [] }]
    }
    return series.map(s => ({
        name: s?.name || 'Doanh thu',
        data: Array.isArray(s?.data) ? s.data.map(v => Number(v) || 0) : []
    }))
})

const normalizedProfitSeries = computed(() => {
    const series = Array.isArray(props.profitSeries) ? props.profitSeries : []
    if (series.length === 0) {
        return [
            { name: 'Doanh thu', data: [] },
            { name: 'Lợi nhuận', data: [] }
        ]
    }
    const mapped = series.map(s => ({
        name: s?.name || 'Doanh thu',
        data: Array.isArray(s?.data) ? s.data.map(v => Number(v) || 0) : []
    }))

    // Nếu dùng stacked, cần transform data: Doanh thu = Giá vốn + Lợi nhuận
    // Series sẽ là: [Giá vốn, Lợi nhuận] để stack lên nhau
    if (isStackedProfit.value && mapped.length >= 2) {
        // Tìm series theo tên
        const revenueSeries = mapped.find(s => s.name?.toLowerCase().includes('doanh thu') || s.name?.toLowerCase().includes('revenue'))
        const profitSeries = mapped.find(s => s.name?.toLowerCase().includes('lợi nhuận') || s.name?.toLowerCase().includes('profit'))
        const costSeries = mapped.find(s => s.name?.toLowerCase().includes('giá vốn') || s.name?.toLowerCase().includes('cost'))

        // Nếu có profit data, tính cost = revenue - profit
        if (revenueSeries && profitSeries && revenueSeries.data.length > 0 && profitSeries.data.length > 0) {
            const costData = revenueSeries.data.map((rev, idx) => {
                const profit = profitSeries.data[idx] || 0
                return Math.max(0, rev - profit) // Cost không thể âm
            })
            return [
                { name: 'Giá vốn', data: costData, color: COST_COLOR },
                { name: 'Lợi nhuận', data: profitSeries.data, color: PROFIT_COLOR }
            ]
        }
        // Fallback: dùng cost series nếu có
        if (costSeries && profitSeries) {
            return [
                { name: 'Giá vốn', data: costSeries.data, color: COST_COLOR },
                { name: 'Lợi nhuận', data: profitSeries.data, color: PROFIT_COLOR }
            ]
        }
    }

    return mapped
})

// Build hourly data - CHỈ hiển thị giờ có giao dịch (revenue > 0 hoặc orderCount > 0)
const fullHourlyData = computed(() => {
    const sales = Array.isArray(props.hourlySales) ? props.hourlySales : []
    const hoursMap = new Map()

    // CHỈ lấy giờ có giao dịch thực sự (revenue > 0 hoặc orderCount > 0)
    sales.forEach(item => {
        const hour = Number(item?.hour)
        if (!isNaN(hour) && hour >= 0 && hour < 24) {
            const revenue = Number(item?.revenue) || Number(item?.totalRevenue) || 0
            const orderCount = Number(item?.orderCount) || 0
            // CHỈ thêm giờ có giao dịch (bỏ điều kiện giờ hoạt động để tránh hiển thị 0đ)
            if (revenue > 0 || orderCount > 0) {
                hoursMap.set(hour, {
                    hour,
                    revenue,
                    orderCount
                })
            }
        }
    })

    // Sắp xếp theo giờ
    return Array.from(hoursMap.values()).sort((a, b) => a.hour - b.hour)
})

// Calculate max values for heatmap intensity
const maxRevenue = computed(() => Math.max(...fullHourlyData.value.map(b => b.revenue), 1))

const _maxOrders = computed(() => Math.max(...fullHourlyData.value.map(b => b.orderCount), 1))

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
    // Đồng nhất màu: Doanh thu = Xanh dương
    const colorSource = [REVENUE_COLOR]
    const base = createBaseOptions(revenueChartType.value, colorSource)
    const categories = props.revenueOptions?.xaxis?.categories ?? []

    // Format categories ngắn gọn
    const formattedCategories = categories.map(cat => formatDateShort(cat))

    return mergeOptions(base, {
        ...props.revenueOptions,
        // Override colors để đồng nhất màu xanh dương cho doanh thu
        colors: [REVENUE_COLOR],
        xaxis: {
            categories: formattedCategories, // Dùng formattedCategories để ApexCharts hiển thị đúng
            labels: {
                ...base.xaxis.labels,
                formatter: (value, opts) => {
                    // ApexCharts sẽ truyền index hoặc giá trị từ categories
                    // Nếu value là số (index), lấy từ formattedCategories
                    if (typeof value === 'number' && formattedCategories[value] !== undefined) {
                        return formattedCategories[value]
                    }
                    // Nếu value là string từ categories, đã được format rồi
                    if (typeof value === 'string' && formattedCategories.includes(value)) {
                        return value
                    }
                    // Nếu value là date string gốc, format lại
                    if (typeof value === 'string') {
                        return formatDateShort(value)
                    }
                    // Fallback: lấy từ formattedCategories theo index
                    const index = opts?.dataPointIndex ?? value
                    if (formattedCategories[index]) {
                        return formattedCategories[index]
                    }
                    return value
                }
            },
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
                formatter: (value) => formatCurrencyShort(value)
            }
        },
        tooltip: {
            theme: isDark.value ? 'dark' : 'light',
            y: {
                formatter: (value) => formatCurrency(value) // Tooltip vẫn hiện đầy đủ
            }
        },
        fill: revenueChartType.value === 'line'
            ? {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 0.5, // Giảm từ 1 xuống 0.5
                    opacityFrom: isDark.value ? 0.25 : 0.3, // Giảm opacity
                    opacityTo: isDark.value ? 0.02 : 0.08, // Giảm opacity
                    stops: [0, 100] // Đơn giản hóa stops
                }
            }
            : base.fill
    })
})

const resolvedProfitChartType = computed(() =>
    // Nếu chọn stacked, vẫn dùng type 'bar' nhưng với stacked option
    profitChartType.value === 'stacked' ? 'bar' : profitChartType.value
)

const isStackedProfit = computed(() => profitChartType.value === 'stacked')

const computedProfitOptions = computed(() => {
    // Đồng nhất màu: Doanh thu = Xanh dương, Giá vốn = Cam, Lợi nhuận = Xanh lá
    const base = createBaseOptions(resolvedProfitChartType.value, [REVENUE_COLOR, COST_COLOR, PROFIT_COLOR])
    const categories = ['Doanh thu', 'Giá vốn', 'Lợi nhuận']

    return mergeOptions(base, {
        chart: {
            type: resolvedProfitChartType.value,
            ...(isStackedProfit.value ? { stacked: true } : {})
        },
        xaxis: {
            ...base.xaxis,
            categories: isStackedProfit.value ? ['Tổng'] : (Array.isArray(categories) ? categories : [])
        },
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
                strokeColors: resolvedProfitChartType.value === 'line' ? [REVENUE_COLOR, PROFIT_COLOR] : undefined
            }
            : { size: 0 },
        plotOptions: {
            bar: {
                columnWidth: isStackedProfit.value ? '60%' : '48%',
                borderRadius: 10,
                horizontal: false,
                ...(isStackedProfit.value ? {
                    dataLabels: {
                        position: 'top',
                        hideOverflowingLabels: true
                    }
                } : {})
            }
        },
        yaxis: {
            labels: {
                formatter: (val) => formatCurrencyShort(val)
            }
        },
        tooltip: {
            ...base.tooltip,
            y: {
                formatter: (val) => formatCurrency(val) // Tooltip vẫn hiện đầy đủ
            }
        }
    })
})

const paymentItems = computed(() => props.paymentStats ?? [])
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
    const labels = paymentItems.value.map((item, index) => item.label ?? item.paymentMethod ?? `PTTT #${index + 1}`)
    // Dùng PAYMENT_PALETTE thay vì VIBRANT_PALETTE để tránh nhầm lẫn với màu tài chính
    const base = createBaseOptions(resolvedPaymentChartType.value, PAYMENT_PALETTE)
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

// Chart series for hourly sales - chỉ giờ có giao dịch
// Chuyển sang Bar chart dạng cột khít nhau
const hourlyChartSeries = computed(() => {
    const data = Array.isArray(fullHourlyData.value) ? fullHourlyData.value : []
    if (data.length === 0) {
        return [
            { name: 'Doanh thu', data: [] }
        ]
    }
    const revenues = data.map(b => Number(b?.revenue) || 0)

    return [
        {
            name: 'Doanh thu',
            data: revenues,
            color: REVENUE_COLOR // Đồng nhất màu xanh dương
        }
    ]
})

// Chart options for hourly sales
const hourlyChartOptions = computed(() => {
    const textMuted = getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim() || '#6b7280'
    const headingColor = getComputedStyle(document.documentElement).getPropertyValue('--color-heading').trim() || '#1f2937'

    const hours = fullHourlyData.value.map(b => `${b.hour.toString().padStart(2, '0')}h`)

    return {
        chart: {
            type: 'bar',
            toolbar: { show: false },
            stacked: false,
            zoom: { enabled: false },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '85%', // Cột khít nhau (tăng từ mặc định)
                borderRadius: 4,
                dataLabels: {
                    position: 'top'
                }
            }
        },
        colors: [REVENUE_COLOR], // Chỉ hiển thị doanh thu
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
        yaxis: {
            title: {
                text: 'Doanh thu',
                style: {
                    color: REVENUE_COLOR,
                    fontSize: '13px',
                    fontFamily: 'var(--font-family-sans)',
                    fontWeight: '600'
                }
            },
            labels: {
                formatter: (val) => formatCurrencyShort(val),
                style: {
                    colors: textMuted,
                    fontSize: '11px',
                    fontFamily: 'var(--font-family-sans)'
                }
            },
            axisBorder: {
                show: true,
                color: REVENUE_COLOR
            }
        },
        tooltip: {
            shared: true,
            intersect: false,
            theme: 'light',
            style: {
                fontSize: '13px',
                fontFamily: 'var(--font-family-sans)'
            },
            y: {
                formatter: (val) => formatCurrency(val) // Tooltip hiển thị doanh thu đầy đủ
            },
            marker: {
                show: true
            }
        },
        legend: {
            show: false // Ẩn legend vì chỉ có một series
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
        dataLabels: {
            enabled: false // Không hiển thị data labels trên cột để tránh rối
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
    padding: var(--spacing-5); /* Tăng từ spacing-4 lên spacing-5 (20px -> 24px) */
}

.chart-card :global(.card-header h5) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    font-size: 1.125rem; /* Tăng từ mặc định lên 18px (từ ~16px) */
    line-height: 1.5;
}

.chart-card :global(.card-header .text-muted) {
    font-family: var(--font-family-sans);
}

.chart-card :global(.card-body) {
    padding: var(--spacing-5); /* Tăng từ spacing-4 lên spacing-5 (20px -> 24px) */
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
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace; /* Monospaced font cho số tiền */
    font-variant-numeric: tabular-nums; /* Tabular numbers để thẳng hàng */
    letter-spacing: 0.02em;
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
    font-size: 1.125rem; /* Tăng từ mặc định lên 18px */
    line-height: 1.5;
}

.analytic-card :global(.card-header .text-muted) {
    font-family: var(--font-family-sans);
}

.analytic-card :global(.card-body) {
    padding: var(--spacing-5); /* Tăng từ spacing-4 lên spacing-5 (20px -> 24px) */
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
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace; /* Monospaced font cho số tiền */
    font-variant-numeric: tabular-nums; /* Tabular numbers để thẳng hàng */
    letter-spacing: 0.02em;
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
    gap: var(--spacing-4); /* Giảm từ spacing-5 xuống spacing-4 để các box số liệu không quá xa biểu đồ */
}

.hourly-chart-section {
    background: var(--color-card-muted);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    padding: var(--spacing-5); /* Tăng padding */
    margin-bottom: var(--spacing-3); /* Thêm margin-bottom để tách biệt với grid */
}

.hourly-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--spacing-2);
}

/* Layout compact khi có ít items (< 6) - xếp ngang */
.hourly-grid--compact {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    justify-content: center;
    max-width: 100%;
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
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace; /* Monospaced font cho số tiền */
    font-variant-numeric: tabular-nums; /* Tabular numbers */
    letter-spacing: 0.02em;
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
    font-size: 1.125rem; /* Tăng từ mặc định lên 18px */
    line-height: 1.5;
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

/* Progress bar cho tỷ trọng danh mục */
.category-percentage {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    min-width: 200px;
}

.category-percentage__bar-wrapper {
    flex: 1;
    height: 8px;
    background: var(--color-card-muted);
    border-radius: var(--radius-sm);
    overflow: hidden;
    position: relative;
}

.category-percentage__bar {
    height: 100%;
    background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
    border-radius: var(--radius-sm);
    transition: width 0.3s ease;
    min-width: 2px;
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

.legend-color--low {
    background: #f0f9ff;
    border-color: #e0f2fe;
}

.legend-color--medium-low {
    background: #bfdbfe;
    border-color: #7dd3fc;
}

.legend-color--medium {
    background: #60a5fa;
    border-color: #0ea5e9;
}

.legend-color--medium-high {
    background: #3b82f6;
    border-color: #0284c7;
}

.legend-color--high {
    background: #1e40af;
    border-color: #0c4a6e;
}
</style>
