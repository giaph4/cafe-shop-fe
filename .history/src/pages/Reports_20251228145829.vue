<template>
  <div
    class="page-container container-fluid"
      
  >
    <div class="page-header card-shadow">
      <div>
        <h2 class="page-title">
          Báo cáo tổng hợp
        </h2>
      </div>
      <div class="d-flex flex-wrap gap-2 align-items-center">
        <div class="form-check form-switch align-self-center">
          <input
            id="autoRefreshSwitch"
            v-model="autoRefresh"
            class="form-check-input"
            type="checkbox"
            role="switch"
          >
          <label
            class="form-check-label"
            for="autoRefreshSwitch"
          > </label>
        </div>
        <button
          class="btn btn-outline-secondary"
          type="button"
          :disabled="loading"
          @click="fetchReports"
        >
          <span
            v-if="loading"
            class="spinner-border spinner-border-sm me-2"
          />
          Làm mới
        </button>
        <button
          class="btn btn-outline-secondary"
          type="button"
          :disabled="loading || exportingAll"
          @click="handleExportAll"
        >
          <span
            v-if="exportingAll"
            class="spinner-border spinner-border-sm me-2"
          />
          <i
            v-else
            class="bi bi-download me-2"
          />
          Xuất tất cả báo cáo
        </button>
      </div>
    </div>

    <div class="card filter-card mb-3">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-lg-3 col-md-4">
            <label class="form-label">Từ ngày</label>
            <input
              v-model="filters.startDate"
              type="date"
              class="form-control"
            >
          </div>
          <div class="col-lg-3 col-md-4">
            <label class="form-label">Đến ngày</label>
            <input
              v-model="filters.endDate"
              type="date"
              class="form-control"
            >
          </div>
          <div class="col-lg-4 col-md-6">
            <label class="form-label">Khoảng thời gian</label>
            <div
              class="btn-group w-100"
              role="group"
            >
              <button
                v-for="preset in presets"
                :key="preset.value"
                type="button"
                class="btn"
                :class="preset.value === selectedPreset ? 'btn-primary' : 'btn-outline-primary'"
                @click="applyPreset(preset.value)"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>
          <div class="col-lg-2 col-md-4">
            <label class="form-label">
              <i class="bi bi-funnel me-1" />
              Top sản phẩm
            </label>
            <select
              v-model="topLimit"
              class="form-select"
              title="Chọn số lượng sản phẩm hiển thị trong báo cáo"
            >
              <option
                v-for="size in topOptions"
                :key="size"
                :value="size"
              >
                {{ size === 'all' ? 'Tất cả sản phẩm' : `Top ${size}` }}
              </option>
            </select>
            <small class="form-text text-muted">
              Áp dụng cho biểu đồ Top sản phẩm
            </small>
          </div>
          <div class="col-lg-12">
            <div
              v-if="validationError"
              class="alert alert-warning mb-0"
            >
              {{ validationError }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Menu for Report Pages -->
    <div
      v-if="filteredReportMenuItems.length > 0"
      class="card navigation-menu-card mb-4"
    >
      <div class="card-body">
        <h3 class="navigation-menu-title mb-4">
          <i class="bi bi-graph-up-arrow me-2" />
          Báo cáo & Phân tích
          <span
            v-if="showDevDemoFeatures"
            class="demo-badge ms-2"
          >DEMO</span>
        </h3>
        <div class="report-navigation-grid">
          <button
            v-for="item in filteredReportMenuItems"
            :key="item.id"
            type="button"
            class="report-nav-card"
            @click="navigateToReport(item.route)"
          >
            <div class="report-nav-card__icon">
              <i :class="item.icon" />
            </div>
            <div class="report-nav-card__label">
              {{ item.label }}
            </div>
            <div
              v-if="showDevDemoFeatures"
              class="report-nav-card__badge"
            >
              DEMO
            </div>
          </button>
        </div>
      </div>
    </div>

    <div class="card tabs-card mb-0">
      <div class="card-body">
        <ul
          class="nav nav-pills reports-tabs mb-3"
          role="tablist"
        >
          <li
            v-for="tab in tabs"
            :key="tab.key"
            class="nav-item"
            role="presentation"
          >
            <button
              type="button"
              class="nav-link"
              :class="{ active: activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              <i :class="[tab.icon, 'me-2']" />{{ tab.label }}
            </button>
          </li>
        </ul>
        <LoadingState
          v-if="loading"
          text="Đang tải dữ liệu báo cáo..."
        />
        <ErrorState
          v-else-if="error"
          :message="error"
          :show-retry="true"
          :retry-handler="fetchReports"
        />
        <div
          v-else
          class="tab-content"
        >
          <SummaryTab
            v-if="activeTab === 'summary'"
            :stats="dashboardStats"
            :revenue-series="revenueSeries"
            :revenue-options="revenueOptions"
            :revenue-summary="revenueSummary"
            :payment-stats="paymentStats"
            :payment-totals="paymentTotals"
            :sales-comparison="salesComparison"
            :profit="profitReport"
            :daily-revenue="dailyRevenue"
            :best-sellers="bestSellers"
            :category-sales="categorySales"
            :top-customers="topCustomers"
            :product-summary="productSummary"
            :insights="insights"
            :inventory-summary="inventorySummary"
          />
          <RevenueProfitTab
            v-else-if="activeTab === 'revenue'"
            :revenue-series="revenueSeries"
            :revenue-options="revenueOptions"
            :revenue-summary="revenueSummary"
            :profit-series="profitSeries"
            :profit-options="profitOptions"
            :profit="profitReport"
            :payment-stats="paymentStats"
            :payment-totals="paymentTotals"
            :hourly-sales="hourlySales"
            :sales-comparison="salesComparison"
            :category-sales="categorySales"
            :orders-exporting="exporting.orders"
            :on-export-orders="handleExportOrders"
          />
          <SalesAnalysisTab
            v-else-if="activeTab === 'sales-analysis'"
            :best-sellers="bestSellers"
            :product-summary="productSummary"
            :category-sales="categorySales"
            :sort-by="bestSellerSort"
            :top-limit="topLimit"
            :table-sort="bestSellerTableSort"
            :product-chart-type="productChartType"
            :category-chart-type="categoryChartType"
            :hourly-sales="hourlySales"
            @update:sortBy="handleBestSellerSortChange"
            @update:topLimit="handleBestSellerTopChange"
            @update:tableSort="bestSellerTableSort = $event"
            @update:productChartType="productChartType = $event"
            @update:categoryChartType="categoryChartType = $event"
          />
          <CustomersStaffTab
            v-else-if="activeTab === 'customers-staff'"
            :top-customers="topCustomers"
            :staff-performance="staffPerformance"
            :total-expenses="totalExpenses"
            :total-imported-cost="totalImportedCost"
            :revenue-summary="revenueSummary"
          />
          <ExpensesInventoryTab
            v-else
            :expenses-entries="expensesEntries"
            :total-expenses="totalExpenses"
            :total-imported-cost="totalImportedCost"
            :inventory-items="inventoryItems"
            :inventory-summary="inventorySummary"
            :low-stock-only="inventoryLowStockOnly"
            :expenses-exporting="exporting.expenses"
            :inventory-exporting="exporting.inventory"
            :inventory-loading="inventoryLoading"
            :revenue-summary="revenueSummary"
            @export:expenses="handleExportExpenses"
            @export:inventory="handleExportInventory"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/store/settings'
import SummaryTab from '@/components/reports/SummaryTab.vue'
import RevenueProfitTab from '@/components/reports/RevenueProfitTab.vue'
import SalesAnalysisTab from '@/components/reports/SalesAnalysisTab.vue'
import CustomersStaffTab from '@/components/reports/CustomersStaffTab.vue'
import ExpensesInventoryTab from '@/components/reports/ExpensesInventoryTab.vue'
import {
    exportExpensesToExcel,
    exportInventoryToExcel,
    exportOrdersToExcel,
    getBestSellers,
    getCategorySales,
    getDailyRevenue,
    getDashboardStats,
    getExpensesByDate,
    getHourlySales,
    getInventoryReport,
    getPaymentMethodStats,
    getProductSalesSummary,
    getProfitReport,
    getSalesComparison,
    getStaffPerformance,
    getRevenueByDate,
    getTopCustomers,
    getTotalExpenses,
    getTotalImportedIngredientCost
} from '@/api/reportService'
import { showError, showSuccess } from '@/utils/toast'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import * as XLSX from 'xlsx'

const today = () => new Date().toISOString().split('T')[0]
const formatDate = (date) => date.toISOString().split('T')[0]
const shiftDateFrom = (baseDate, diff) => {
    const date = new Date(baseDate)
    date.setDate(date.getDate() + diff)
    return date
}
const shiftDate = (diff) => formatDate(shiftDateFrom(new Date(), diff))

const presets = [
    { value: '7', label: '7 ngày' },
    { value: '30', label: '30 ngày' },
    { value: '90', label: '90 ngày' }
]

const router = useRouter()
const settingsStore = useSettingsStore()

const reportMenuItems = [
    {
        id: 'revenue-forecast',
        label: 'Dự báo Doanh thu',
        icon: 'bi bi-graph-up-arrow',
        route: '/revenue-forecast',
        status: 'demo'
    },
    {
        id: 'stakeholder-report',
        label: 'Báo cáo Stakeholders',
        icon: 'bi bi-file-earmark-text',
        route: '/stakeholder-report',
        status: 'demo'
    },
    {
        id: 'voucher-analytics',
        label: 'Phân tích Voucher',
        icon: 'bi bi-ticket-perforated',
        route: '/voucher-analytics',
        status: 'demo'
    },
    {
        id: 'cancellation-analysis',
        label: 'Phân tích Hủy Đơn',
        icon: 'bi bi-x-circle-fill',
        route: '/cancellation-analysis',
        status: 'demo'
    },
    {
        id: 'trend-analysis',
        label: 'Phân tích Xu hướng',
        icon: 'bi bi-graph-up-arrow',
        route: '/trend-analysis',
        status: 'demo'
    },
    {
        id: 'menu-optimization',
        label: 'Tối ưu Menu',
        icon: 'bi bi-box-seam',
        route: '/menu-optimization',
        status: 'demo'
    },
    {
        id: 'cost-analysis',
        label: 'Phân tích Chi phí',
        icon: 'bi bi-cash-stack',
        route: '/cost-analysis',
        status: 'demo'
    },
    {
        id: 'customer-analytics',
        label: 'Phân tích Khách hàng',
        icon: 'bi bi-people-fill',
        route: '/customer-analytics',
        status: 'demo'
    },
    {
        id: 'product-profitability',
        label: 'Phân tích Lợi nhuận',
        icon: 'bi bi-cash-coin',
        route: '/product-profitability',
        status: 'demo'
    },
    {
        id: 'chart-builder',
        label: 'Chart Builder',
        icon: 'bi bi-graph-up-arrow',
        route: '/chart-builder',
        status: 'demo'
    }
]

const showDevDemoFeatures = computed(() => settingsStore.showDevDemoFeatures)

const filteredReportMenuItems = computed(() => {
    if (showDevDemoFeatures.value) {
        return reportMenuItems
    }
    return reportMenuItems.filter(item => item.status !== 'demo' && item.status !== 'development')
})

const navigateToReport = (route) => {
    router.push(route)
}

const tabs = [
    { key: 'summary', label: 'Tổng quan', icon: 'bi bi-speedometer2' },
    { key: 'revenue', label: 'Doanh thu & lợi nhuận', icon: 'bi bi-cash-coin' },
    { key: 'sales-analysis', label: 'Phân tích bán hàng', icon: 'bi bi-graph-up-arrow' },
    { key: 'customers-staff', label: 'Khách hàng & nhân sự', icon: 'bi bi-people' },
    { key: 'expenses-inventory', label: 'Chi phí & tồn kho', icon: 'bi bi-box-seam' }
]

const filters = reactive({
    startDate: shiftDate(-7),
    endDate: today()
})

const selectedPreset = ref('7')
const validationError = ref('')
const loading = ref(false)
const error = ref('')
const autoRefresh = ref(false)
const revenueSeries = ref([{ name: 'Doanh thu', data: [] }])
const revenueOptions = ref({})
const revenueSummary = ref({ total: 0, average: 0, max: 0 })
const profitSeries = ref([{ name: 'Doanh thu', data: [] }, { name: 'Lợi nhuận', data: [] }])
const profitOptions = ref({})
const dashboardStats = ref(null)
const paymentStats = ref([])
const paymentTotals = ref({ totalOrders: 0, totalAmount: 0 })
const profitReport = ref(null)
const salesComparison = ref(null)
const hourlySales = ref([])
const categorySales = ref([])
const bestSellers = ref([])
const bestSellersRaw = ref([])
const productSummary = ref(null)
const topCustomers = ref([])
const staffPerformance = ref([])
const expensesEntries = ref([])
const totalExpenses = ref(null)
const totalImportedCost = ref(null)
const dailyRevenue = ref(null)
const inventoryItems = ref([])
const inventorySummary = ref({ totalItems: 0, lowStockCount: 0, totalQuantity: 0 })
const inventoryLowStockOnly = ref(false)
const inventoryLoading = ref(false)
const exporting = reactive({ orders: false, expenses: false, inventory: false })
const exportingAll = ref(false)
const bestSellerSort = ref('quantity')
const topLimit = ref(10)
const topOptions = [5, 10, 15, 20, 'all']
const bestSellerTableSort = ref('quantity-desc')
const productChartType = ref('bar')
const categoryChartType = ref('donut')
const activeTab = ref('summary')
const initialized = ref(false)
const skipNextFilterWatch = ref(false)
const insights = ref([])
const revenueEntries = ref([])

const resolveBestSellerTop = () => (topLimit.value === 'all' ? 100 : Number(topLimit.value) || 10)

const applyBestSellerView = () => {
    if (topLimit.value === 'all') {
        bestSellers.value = [...bestSellersRaw.value]
        return
    }
    const numericLimit = Number(topLimit.value)
    const limit = Number.isNaN(numericLimit) || numericLimit <= 0 ? 10 : numericLimit
    bestSellers.value = bestSellersRaw.value.slice(0, limit)
}

const fmtCurrency = (value) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
}).format(Number.isFinite(value) ? value : 0)

const fmtNumber = (value) => new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0
}).format(Number.isFinite(value) ? value : 0)

const computeInsights = () => {
    const items = []

    if (revenueEntries.value.length) {
        const topDay = revenueEntries.value.reduce((best, entry) => {
            const total = Number(entry.total ?? entry.value ?? 0)
            if (!best || total > best.total) {
                return { date: entry.date, total }
            }
            return best
        }, null)
        if (topDay && topDay.total > 0) {
            items.push({
                key: 'top-revenue-day',
                title: 'Ngày doanh thu cao nhất',
                value: fmtCurrency(topDay.total),
                detail: `Ngày ${topDay.date}`,
                icon: 'bi bi-calendar2-week',
                variant: 'accent-primary'
            })
        }
    }

    if (bestSellersRaw.value.length) {
        const topProduct = bestSellersRaw.value[0]
        items.push({
            key: 'top-product',
            title: 'Sản phẩm bán chạy',
            value: topProduct?.productName || topProduct?.name || '—',
            detail: `${fmtNumber(topProduct?.totalQuantitySold ?? 0)} sản phẩm · ${fmtCurrency(topProduct?.totalRevenueGenerated ?? 0)}`,
            icon: 'bi bi-cup-hot',
            variant: 'accent-primary'
        })
    }

    if (staffPerformance.value.length) {
        const topStaff = staffPerformance.value[0]
        items.push({
            key: 'top-staff',
            title: 'Nhân viên xuất sắc',
            value: topStaff?.fullName || topStaff?.username || '—',
            detail: `${fmtNumber(topStaff?.totalOrders ?? 0)} đơn · ${fmtCurrency(topStaff?.totalRevenue ?? 0)}`,
            icon: 'bi bi-person-check',
            variant: 'accent-primary'
        })
    }

    if (hourlySales.value.length) {
        const peakHour = hourlySales.value.reduce((best, bucket) => {
            const revenue = Number(bucket?.revenue ?? 0)
            if (!best || revenue > best.revenue) {
                return { hour: bucket?.hour ?? '--', revenue, orders: Number(bucket?.orderCount ?? 0) }
            }
            return best
        }, null)
        if (peakHour && peakHour.revenue > 0) {
            items.push({
                key: 'peak-hour',
                title: 'Khung giờ cao điểm',
                value: `${String(peakHour.hour).padStart(2, '0')}h`,
                detail: `${fmtCurrency(peakHour.revenue)} · ${fmtNumber(peakHour.orders)} đơn`,
                icon: 'bi bi-clock-history',
                variant: 'accent-primary'
            })
        }
    }

    if (paymentStats.value.length) {
        const topPayment = paymentStats.value.reduce((best, method) => {
            const amount = Number(method?.totalAmount ?? 0)
            if (!best || amount > best.amount) {
                return {
                    label: method?.label || method?.paymentMethod || '—',
                    amount,
                    orders: Number(method?.orderCount ?? 0)
                }
            }
            return best
        }, null)
        if (topPayment && topPayment.amount > 0) {
            items.push({
                key: 'top-payment',
                title: 'Phương thức phổ biến',
                value: topPayment.label,
                detail: `${fmtCurrency(topPayment.amount)} · ${fmtNumber(topPayment.orders)} đơn`,
                icon: 'bi bi-wallet2',
                variant: 'accent-primary'
            })
        }
    }

    if (expensesEntries.value.length) {
        const peakExpense = expensesEntries.value.reduce((best, entry) => {
            const total = Number(entry?.total ?? 0)
            if (!best || total > best.total) {
                return { date: entry?.date, total }
            }
            return best
        }, null)
        if (peakExpense && peakExpense.total > 0) {
            items.push({
                key: 'peak-expense',
                title: 'Ngày chi phí cao nhất',
                value: fmtCurrency(peakExpense.total),
                detail: `Ngày ${peakExpense.date}`,
                icon: 'bi bi-piggy-bank',
                variant: 'accent-danger'
            })
        }
    }

    if (salesComparison.value) {
        const diff = Number(salesComparison.value.growthPercentage ?? 0)
        items.push({
            key: 'revenue-growth',
            title: 'Tăng trưởng doanh thu',
            value: `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}%`,
            detail: `${fmtCurrency(salesComparison.value.growthAmount ?? 0)} so với kỳ trước`,
            icon: diff >= 0 ? 'bi bi-graph-up-arrow' : 'bi bi-graph-down-arrow',
            variant: diff >= 0 ? 'accent-success' : 'accent-danger'
        })
    }

    insights.value = items
}

const handleBestSellerSortChange = (value) => {
    bestSellerSort.value = value
}

const handleBestSellerTopChange = (value) => {
    topLimit.value = value
}

const applyPreset = (value) => {
    selectedPreset.value = value
    skipNextFilterWatch.value = true
    const days = Number(value)
    filters.startDate = shiftDate(-days)
    filters.endDate = today()
    fetchReports()
}

const computePreviousRange = () => {
    const start = new Date(`${filters.startDate}T00:00:00`)
    const end = new Date(`${filters.endDate}T00:00:00`)
    const diff = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)))
    const previousEnd = shiftDateFrom(start, -1)
    const previousStart = shiftDateFrom(previousEnd, -diff)
    return {
        previousStart: formatDate(previousStart),
        previousEnd: formatDate(previousEnd)
    }
}

const validateRange = () => {
    if (!filters.startDate || !filters.endDate) {
        validationError.value = 'Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc.'
        return false
    }
    if (filters.startDate > filters.endDate) {
        validationError.value = 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'
        return false
    }
    validationError.value = ''
    return true
}

const buildRevenueOptions = (categories) => ({
    chart: { type: 'area', toolbar: { show: false } },
    xaxis: {
        categories,
        labels: { style: { colors: '#7a706a', fontSize: '12px' } }
    },
    yaxis: {
        labels: {
            formatter: (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val)
        }
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'straight', width: 3 },
    colors: ['#4f46e5'],
    fill: {
        type: 'gradient',
        gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.45,
            opacityTo: 0.05,
            stops: [0, 90, 100]
        }
    }
})

const buildProfitOptions = () => ({
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { columnWidth: '45%', borderRadius: 10 } },
    dataLabels: { enabled: false },
    xaxis: { categories: ['Kỳ hiện tại'] },
    yaxis: {
        labels: {
            formatter: (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val)
        }
    },
    colors: ['#4f46e5', '#22c55e']
})

let isActive = true

const isMessageChannelError = (err) => typeof err?.message === 'string' && err.message.includes('message channel closed')

const fetchReports = async () => {
    if (!validateRange()) return
    loading.value = true
    error.value = ''
    try {
        const { previousStart, previousEnd } = computePreviousRange()
        const [
            dashboardData,
            revenueData,
            profitData,
            paymentData,
            comparisonData,
            hourlyData,
            categoryData,
            productData,
            bestSellerData,
            customersData,
            staffData,
            expensesData,
            totalExpensesData,
            importedCostData,
            latestDailyRevenue
        ] = await Promise.all([
            getDashboardStats(),
            getRevenueByDate(filters.startDate, filters.endDate),
            getProfitReport(filters.startDate, filters.endDate),
            getPaymentMethodStats(filters.startDate, filters.endDate),
            getSalesComparison(filters.startDate, filters.endDate, previousStart, previousEnd),
            getHourlySales(filters.endDate),
            getCategorySales(filters.startDate, filters.endDate),
            getProductSalesSummary(filters.startDate, filters.endDate),
            getBestSellers(filters.startDate, filters.endDate, resolveBestSellerTop(), bestSellerSort.value),
            getTopCustomers(filters.startDate, filters.endDate, 10),
            getStaffPerformance(filters.startDate, filters.endDate, 10),
            getExpensesByDate(filters.startDate, filters.endDate),
            getTotalExpenses(filters.startDate, filters.endDate),
            getTotalImportedIngredientCost(filters.startDate, filters.endDate),
            getDailyRevenue(filters.endDate)
        ])

        if (!isActive) {
            return
        }

        const safeRevenue = revenueData ?? { values: [], labels: [], summary: { total: 0, average: 0, max: 0 } }
        dashboardStats.value = dashboardData ?? null
        revenueEntries.value = safeRevenue.entries ?? []
        const revenueValues = Array.isArray(safeRevenue.values) ? safeRevenue.values.map(v => Number(v) || 0) : []
        revenueSeries.value = [{ name: 'Doanh thu', data: revenueValues }]
        revenueOptions.value = buildRevenueOptions(Array.isArray(safeRevenue.labels) ? safeRevenue.labels : [])
        revenueSummary.value = safeRevenue.summary ?? { total: 0, average: 0, max: 0 }
        const profitRevenue = Number(profitData?.totalRevenue) || 0
        const profitTotal = Number(profitData?.totalProfit) || 0
        profitSeries.value = [
            { name: 'Doanh thu', data: [profitRevenue] },
            { name: 'Lợi nhuận', data: [profitTotal] }
        ]
        profitOptions.value = buildProfitOptions()
        paymentStats.value = paymentData?.items ?? []
        paymentTotals.value = paymentData?.totals ?? { totalOrders: 0, totalAmount: 0 }
        profitReport.value = profitData ?? null
        salesComparison.value = comparisonData ?? null
        hourlySales.value = hourlyData?.items ?? []
        categorySales.value = categoryData?.items ?? []
        bestSellersRaw.value = bestSellerData?.items ?? []
        applyBestSellerView()
        productSummary.value = productData ?? null
        topCustomers.value = customersData?.items ?? []
        staffPerformance.value = staffData?.items ?? []
        expensesEntries.value = expensesData?.entries ?? []
        totalExpenses.value = totalExpensesData ?? null
        totalImportedCost.value = importedCostData ?? null
        dailyRevenue.value = latestDailyRevenue ?? null

        await fetchInventory()
        computeInsights()
    } catch (err) {
        if (isMessageChannelError(err)) {
            // Bỏ qua lỗi message channel đóng sớm (không ảnh hưởng đến chức năng)
            return
        }
        if (!isActive) {
            return
        }
        error.value = err.response?.data?.message || err.message || 'Không thể tải dữ liệu báo cáo.'
    } finally {
        if (isActive) {
            loading.value = false
            if (!initialized.value) {
                initialized.value = true
            }
        }
    }
}

const fetchInventory = async () => {
    inventoryLoading.value = true
    try {
        const inventoryData = await getInventoryReport(inventoryLowStockOnly.value)
        if (!isActive) {
            return
        }
        inventoryItems.value = inventoryData?.items ?? []
        inventorySummary.value = inventoryData?.summary ?? { totalItems: 0, lowStockCount: 0, totalQuantity: 0 }
    } catch (err) {
        showError(err.response?.data?.message || 'Không thể tải dữ liệu tồn kho.')
    } finally {
        if (isActive) {
            inventoryLoading.value = false
        }
    }
}

const fetchBestSellers = async () => {
    try {
        const [bestSellerData, productData] = await Promise.all([
            getBestSellers(filters.startDate, filters.endDate, resolveBestSellerTop(), bestSellerSort.value),
            getProductSalesSummary(filters.startDate, filters.endDate)
        ])
        bestSellersRaw.value = bestSellerData?.items ?? []
        applyBestSellerView()
        productSummary.value = productData ?? null
        computeInsights()
    } catch (err) {
        showError(err.response?.data?.message || 'Không thể tải top sản phẩm.')
    }
}

const handleExportAll = async () => {
    if (exportingAll.value) return
    try {
        exportingAll.value = true

        // Tạo workbook mới
        const workbook = XLSX.utils.book_new()

        // Sheet 1: Tổng quan
        const summaryData = [
            ['BÁO CÁO TỔNG HỢP', ''],
            ['Từ ngày', filters.startDate],
            ['Đến ngày', filters.endDate],
            ['Ngày tạo', new Date().toLocaleString('vi-VN')],
            [''],
            ['TỔNG QUAN DOANH THU', ''],
            ['Tổng doanh thu', fmtCurrency(revenueSummary.value?.total || 0)],
            ['Doanh thu trung bình', fmtCurrency(revenueSummary.value?.average || 0)],
            ['Doanh thu cao nhất', fmtCurrency(revenueSummary.value?.max || 0)],
            [''],
            ['LỢI NHUẬN', ''],
            ['Tổng doanh thu', fmtCurrency(profitReport.value?.totalRevenue || 0)],
            ['Tổng chi phí', fmtCurrency(profitReport.value?.totalCostOfGoodsSold || 0)],
            ['Tổng lợi nhuận', fmtCurrency(profitReport.value?.totalProfit || 0)],
            ['Tỷ suất lợi nhuận', `${((profitReport.value?.grossMargin || 0) * 100).toFixed(2)}%`],
            [''],
            ['SO SÁNH KỲ TRƯỚC', ''],
            ['Doanh thu kỳ hiện tại', fmtCurrency(salesComparison.value?.currentRevenue || 0)],
            ['Doanh thu kỳ trước', fmtCurrency(salesComparison.value?.previousRevenue || 0)],
            ['Tăng trưởng', fmtCurrency(salesComparison.value?.growthAmount || 0)],
            ['% Tăng trưởng', `${(salesComparison.value?.growthPercentage || 0).toFixed(2)}%`],
            [''],
            ['CHI PHÍ', ''],
            ['Tổng chi phí', fmtCurrency(totalExpenses.value?.totalExpenses || 0)],
            ['Chi phí nhập nguyên liệu', fmtCurrency(totalImportedCost.value?.totalImportedIngredientCost || 0)]
        ]
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng quan')

        // Sheet 2: Doanh thu theo ngày
        if (revenueEntries.value.length > 0) {
            const revenueData = [
                ['Ngày', 'Doanh thu']
            ]
            revenueEntries.value.forEach(entry => {
                revenueData.push([
                    entry.date,
                    Number(entry.value || entry.total || 0)
                ])
            })
            const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData)
            XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Doanh thu')
        }

        // Sheet 3: Sản phẩm bán chạy
        if (bestSellersRaw.value.length > 0) {
            const bestSellersData = [
                ['STT', 'Tên sản phẩm', 'Số lượng bán', 'Doanh thu']
            ]
            bestSellersRaw.value.forEach((item, index) => {
                bestSellersData.push([
                    index + 1,
                    item.productName || item.name || '—',
                    Number(item.totalQuantitySold || 0),
                    Number(item.totalRevenueGenerated || 0)
                ])
            })
            const bestSellersSheet = XLSX.utils.aoa_to_sheet(bestSellersData)
            XLSX.utils.book_append_sheet(workbook, bestSellersSheet, 'Sản phẩm bán chạy')
        }

        // Sheet 4: Top khách hàng
        if (topCustomers.value.length > 0) {
            const customersData = [
                ['STT', 'Tên khách hàng', 'Số đơn', 'Tổng chi tiêu', 'Giá trị đơn TB']
            ]
            topCustomers.value.forEach((item, index) => {
                customersData.push([
                    index + 1,
                    item.customerName || '—',
                    Number(item.totalOrders || 0),
                    Number(item.totalSpent || 0),
                    Number(item.averageOrderValue || 0)
                ])
            })
            const customersSheet = XLSX.utils.aoa_to_sheet(customersData)
            XLSX.utils.book_append_sheet(workbook, customersSheet, 'Top khách hàng')
        }

        // Sheet 5: Hiệu suất nhân viên
        if (staffPerformance.value.length > 0) {
            const staffData = [
                ['STT', 'Nhân viên', 'Số đơn', 'Tổng doanh thu', 'Giá trị đơn TB']
            ]
            staffPerformance.value.forEach((item, index) => {
                staffData.push([
                    index + 1,
                    item.fullName || item.username || '—',
                    Number(item.totalOrders || 0),
                    Number(item.totalRevenue || 0),
                    Number(item.averageOrderValue || 0)
                ])
            })
            const staffSheet = XLSX.utils.aoa_to_sheet(staffData)
            XLSX.utils.book_append_sheet(workbook, staffSheet, 'Hiệu suất nhân viên')
        }

        // Sheet 6: Chi phí theo ngày
        if (expensesEntries.value.length > 0) {
            const expensesData = [
                ['Ngày', 'Tổng chi phí']
            ]
            expensesEntries.value.forEach(entry => {
                expensesData.push([
                    entry.date,
                    Number(entry.total || 0)
                ])
            })
            const expensesSheet = XLSX.utils.aoa_to_sheet(expensesData)
            XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Chi phí')
        }

        // Sheet 7: Tồn kho
        if (inventoryItems.value.length > 0) {
            const inventoryData = [
                ['Tên nguyên liệu', 'Đơn vị', 'Tồn kho', 'Mức đặt lại', 'Trạng thái']
            ]
            inventoryItems.value.forEach(item => {
                inventoryData.push([
                    item.name || '—',
                    item.unit || '—',
                    Number(item.quantityOnHand || 0),
                    item.reorderLevel ? Number(item.reorderLevel) : '—',
                    item.status === 'LOW_STOCK' ? 'Thiếu hụt' : 'Ổn định'
                ])
            })
            const inventorySheet = XLSX.utils.aoa_to_sheet(inventoryData)
            XLSX.utils.book_append_sheet(workbook, inventorySheet, 'Tồn kho')
        }

        // Sheet 8: Phương thức thanh toán
        if (paymentStats.value.length > 0) {
            const paymentData = [
                ['Phương thức', 'Số đơn', 'Tổng tiền', '% theo đơn', '% theo tiền']
            ]
            paymentStats.value.forEach(item => {
                paymentData.push([
                    item.label || item.paymentMethod || '—',
                    Number(item.orderCount || 0),
                    Number(item.totalAmount || 0),
                    `${(item.percentageByOrders || 0).toFixed(2)}%`,
                    `${(item.percentageByAmount || 0).toFixed(2)}%`
                ])
            })
            const paymentSheet = XLSX.utils.aoa_to_sheet(paymentData)
            XLSX.utils.book_append_sheet(workbook, paymentSheet, 'Phương thức thanh toán')
        }

        // Sheet 9: Doanh số theo giờ
        if (hourlySales.value.length > 0) {
            const hourlyData = [
                ['Giờ', 'Số đơn', 'Doanh thu', 'Giá trị đơn TB']
            ]
            hourlySales.value.forEach(item => {
                hourlyData.push([
                    `${item.hour || 0}h`,
                    Number(item.orderCount || 0),
                    Number(item.revenue || 0),
                    Number(item.averageOrderValue || 0)
                ])
            })
            const hourlySheet = XLSX.utils.aoa_to_sheet(hourlyData)
            XLSX.utils.book_append_sheet(workbook, hourlySheet, 'Doanh số theo giờ')
        }

        // Sheet 10: Doanh số theo danh mục
        if (categorySales.value.length > 0) {
            const categoryData = [
                ['Danh mục', 'Số lượng bán', 'Doanh thu']
            ]
            categorySales.value.forEach(item => {
                categoryData.push([
                    item.categoryName || '—',
                    Number(item.totalQuantitySold || 0),
                    Number(item.totalRevenue || 0)
                ])
            })
            const categorySheet = XLSX.utils.aoa_to_sheet(categoryData)
            XLSX.utils.book_append_sheet(workbook, categorySheet, 'Doanh số theo danh mục')
        }

        // Xuất file Excel
        XLSX.writeFile(workbook, `BaoCaoTongHop_${filters.startDate}_${filters.endDate}.xlsx`)
        showSuccess('Đã xuất báo cáo tổng hợp ra Excel thành công!')
    } catch (err) {
        console.error('Export error:', err)
        showError(err?.message || 'Không thể xuất báo cáo ra Excel.')
    } finally {
        exportingAll.value = false
    }
}

const handleExportOrders = async () => {
    if (exporting.orders) return
    try {
        exporting.orders = true
        const blob = await exportOrdersToExcel(filters.startDate, filters.endDate)
        const url = URL.createObjectURL(new Blob([blob]))
        const link = document.createElement('a')
        link.href = url
        link.download = `Orders_${filters.startDate}_to_${filters.endDate}.xlsx`
        link.click()
        URL.revokeObjectURL(url)
        showSuccess('Xuất đơn hàng thành công!')
    } catch (err) {
        showError(err.response?.data?.message || 'Xuất đơn hàng thất bại.')
    } finally {
        exporting.orders = false
    }
}

const handleExportExpenses = async () => {
    if (exporting.expenses) return
    try {
        exporting.expenses = true
        const blob = await exportExpensesToExcel(filters.startDate, filters.endDate)
        const url = URL.createObjectURL(new Blob([blob]))
        const link = document.createElement('a')
        link.href = url
        link.download = `Expenses_${filters.startDate}_to_${filters.endDate}.xlsx`
        link.click()
        URL.revokeObjectURL(url)
        showSuccess('Xuất báo cáo chi phí thành công!')
    } catch (err) {
        showError(err.response?.data?.message || 'Xuất báo cáo chi phí thất bại.')
    } finally {
        exporting.expenses = false
    }
}

const handleExportInventory = async () => {
    if (exporting.inventory) return
    try {
        exporting.inventory = true
        const blob = await exportInventoryToExcel()
        const url = URL.createObjectURL(new Blob([blob]))
        const link = document.createElement('a')
        link.href = url
        link.download = `Inventory_${today()}.xlsx`
        link.click()
        URL.revokeObjectURL(url)
        showSuccess('Xuất báo cáo tồn kho thành công!')
    } catch (err) {
        showError(err.response?.data?.message || 'Xuất báo cáo tồn kho thất bại.')
    } finally {
        exporting.inventory = false
    }
}

watch(() => [filters.startDate, filters.endDate], () => {
    if (skipNextFilterWatch.value) {
        skipNextFilterWatch.value = false
        return
    }
    selectedPreset.value = ''
    if (!initialized.value) return
    fetchReports()
})

watch(bestSellerSort, () => {
    if (!initialized.value) return
    fetchBestSellers()
})

watch(topLimit, (value, oldValue) => {
    if (!initialized.value) {
        applyBestSellerView()
        return
    }
    // refresh from API when changing between top sizes to ensure dataset accuracy
    const changedToAll = value === 'all' && oldValue !== 'all'
    if (changedToAll || value !== oldValue) {
        fetchBestSellers()
    }
})

watch(bestSellersRaw, () => {
    applyBestSellerView()
    computeInsights()
})

watch(inventoryLowStockOnly, () => {
    if (!initialized.value) return
    fetchInventory()
})

watch(
    () => [
        revenueEntries.value,
        bestSellersRaw.value,
        staffPerformance.value,
        hourlySales.value,
        paymentStats.value,
        expensesEntries.value,
        salesComparison.value
    ],
    () => {
        if (!initialized.value) return
        computeInsights()
    },
    { deep: true }
)

let autoRefreshInterval = null
watch(autoRefresh, (enabled) => {
    if (enabled) {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval)
        }
        autoRefreshInterval = setInterval(fetchReports, 60_000)
        fetchReports()
    } else if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval)
        autoRefreshInterval = null
    }
})

onMounted(() => {
    fetchReports()
})

onBeforeUnmount(() => {
    isActive = false
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval)
        autoRefreshInterval = null
    }
})
</script>

<style scoped>
/* Page-specific styles only - Global styles (.page-container) are in components.scss */

.card-shadow {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-4);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
}

.page-title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.page-subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.filter-card,
.tabs-card,
.navigation-menu-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.filter-card .card-body {
    background: var(--color-card);
}

.tabs-card .card-body {
    background: var(--color-card);
}

.navigation-menu-card .card-body {
    background: var(--color-card);
    padding: var(--spacing-4);
}

.navigation-menu-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-4);
    font-family: var(--font-family-sans);
    display: flex;
    align-items: center;
}

.report-navigation-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--spacing-3);
}

.report-nav-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    padding: var(--spacing-4);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    transition: all var(--transition-base);
    cursor: pointer;
    min-height: 120px;
    font-family: var(--font-family-sans);
}

.report-nav-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
    border-color: var(--color-primary);
    background: var(--color-card-accent);
}

.report-nav-card:active {
    transform: translateY(-2px);
}

.report-nav-card__icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-2xl);
    color: var(--color-primary);
    background: rgba(79, 70, 229, 0.1);
    transition: all var(--transition-base);
}

.report-nav-card:hover .report-nav-card__icon {
    background: var(--color-primary);
    color: var(--color-text-inverse);
    transform: scale(1.1);
}

.report-nav-card__label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    text-align: center;
    line-height: var(--line-height-tight);
}

.report-nav-card__badge {
    position: absolute;
    top: var(--spacing-2);
    right: var(--spacing-2);
    background: var(--color-warning);
    color: var(--color-text-inverse);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-family: var(--font-family-sans);
    box-shadow: var(--shadow-sm);
}

.demo-badge {
    display: inline-block;
    background: var(--color-warning);
    color: var(--color-text-inverse);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-family: var(--font-family-sans);
    box-shadow: var(--shadow-sm);
}

@media (max-width: 992px) {
    .report-navigation-grid {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: var(--spacing-2);
    }

    .report-nav-card {
        min-height: 100px;
        padding: var(--spacing-3);
    }

    .report-nav-card__icon {
        width: 48px;
        height: 48px;
        font-size: var(--font-size-xl);
    }

    .report-nav-card__label {
        font-size: var(--font-size-xs);
    }
}

@media (max-width: 768px) {
    .report-navigation-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

.insights-card {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    background: linear-gradient(160deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-md);
}

.insights-grid {
    display: grid;
    gap: var(--spacing-4);
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}

.insight-card {
    display: flex;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    border-radius: var(--radius-lg);
    background: var(--color-card);
    border: 1px solid var(--color-border-soft);
    box-shadow: var(--shadow-sm);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.insight-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.insight-card__icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-xl);
    color: var(--color-heading);
    background: var(--color-card-muted);
}

.insight-card__meta {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-0);
}

.insight-card__title {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
    font-weight: var(--font-weight-semibold);
}

.insight-card__value {
    font-size: var(--font-size-lg);
    color: var(--color-heading);
    font-weight: var(--font-weight-bold);
}

.insight-card__detail {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
}

.insight-card.accent-primary .insight-card__icon {
    background: rgba(59, 130, 246, 0.15);
    color: #1d4ed8;
}

.insight-card.accent-success .insight-card__icon {
    background: rgba(34, 197, 94, 0.15);
    color: #15803d;
}

.insight-card.accent-info .insight-card__icon {
    background: rgba(14, 165, 233, 0.15);
    color: #0369a1;
}

.insight-card.accent-warning .insight-card__icon {
    background: rgba(251, 191, 36, 0.18);
    color: #b45309;
}

.insight-card.accent-purple .insight-card__icon {
    background: rgba(139, 92, 246, 0.18);
    color: #6d28d9;
}

.insight-card.accent-danger .insight-card__icon {
    background: rgba(248, 113, 113, 0.18);
    color: #b91c1c;
}

@media (max-width: 992px) {
    .insights-grid {
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    }
}

.reports-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    background: var(--color-card-muted);
    padding: var(--spacing-2);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
}

.reports-tabs .nav-link {
    border-radius: var(--radius-sm);
    padding: var(--spacing-2) var(--spacing-4);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    background: transparent;
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.reports-tabs .nav-link:hover:not(.active) {
    background: var(--color-card);
    color: var(--color-heading);
}

.reports-tabs .nav-link.active {
    background: var(--color-card); /* Thay đổi từ primary sang card background */
    color: var(--color-heading); /* Thay đổi từ text-inverse sang heading */
    border: 1px solid var(--color-primary); /* Thêm border để vẫn nhận biết được active */
    font-weight: var(--font-weight-semibold); /* Tăng font-weight để phân biệt */
}

/* Form Controls - Chuẩn hóa */
.filter-card :global(.form-label) {
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-control),
.filter-card :global(.form-select) {
    height: 40px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    background: var(--color-card);
    color: var(--color-heading);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-control:focus),
.filter-card :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

/* Button Group - Chuẩn hóa */
.filter-card :global(.btn-group .btn) {
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.filter-card :global(.btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.filter-card :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.filter-card :global(.btn-outline-primary) {
    border-color: var(--color-border);
    color: var(--color-heading);
    background: transparent;
}

.filter-card :global(.btn-outline-primary:hover:not(:disabled)) {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

/* Header Buttons - Chuẩn hóa */
.card-shadow :global(.btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.card-shadow :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.card-shadow :global(.btn-outline-secondary) {
    border-color: var(--color-border);
    color: var(--color-heading);
    background: transparent;
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.card-shadow :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

@media (max-width: 768px) {
    .card-shadow {
        padding: var(--spacing-4);
        flex-direction: column;
        align-items: flex-start;
    }

    .insights-grid {
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    }
}
</style>
