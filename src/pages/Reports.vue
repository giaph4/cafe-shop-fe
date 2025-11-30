<template>
    <div class="page-container container-fluid" data-aos="fade-up">
        <div class="page-header card-shadow">
            <div>
                <h2 class="page-title">Báo cáo tổng hợp</h2>
                <p class="page-subtitle">Theo dõi hiệu quả kinh doanh, khách hàng, nhân sự và vận hành trong một nơi duy nhất.</p>
            </div>
            <div class="d-flex flex-wrap gap-2 align-items-center">
                <div class="form-check form-switch align-self-center">
                    <input
                        class="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="autoRefreshSwitch"
                        v-model="autoRefresh"
                    >
                    <label class="form-check-label" for="autoRefreshSwitch">Tự động làm mới</label>
                </div>
                <button class="btn btn-outline-secondary" type="button" @click="fetchReports" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    Làm mới
                </button>
                <button 
                    class="btn btn-primary" 
                    type="button" 
                    @click="handleExportAll" 
                    :disabled="loading || exportingAll"
                >
                    <span v-if="exportingAll" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-download me-2"></i>
                    Xuất tất cả báo cáo
                </button>
            </div>
        </div>

        <div class="card filter-card mb-4 mt-4">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-lg-3 col-md-4">
                        <label class="form-label">Từ ngày</label>
                        <input type="date" class="form-control" v-model="filters.startDate" />
                    </div>
                    <div class="col-lg-3 col-md-4">
                        <label class="form-label">Đến ngày</label>
                        <input type="date" class="form-control" v-model="filters.endDate" />
                    </div>
                    <div class="col-lg-4 col-md-6">
                        <label class="form-label">Khoảng thời gian</label>
                        <div class="btn-group w-100" role="group">
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
                        <label class="form-label">Top sản phẩm</label>
                        <select class="form-select" v-model="topLimit">
                            <option
                                v-for="size in topOptions"
                                :key="size"
                                :value="size"
                            >
                                {{ size === 'all' ? 'Tất cả sản phẩm' : `Top ${size}` }}
                            </option>
                        </select>
                    </div>
                    <div class="col-lg-12">
                        <div v-if="validationError" class="alert alert-warning mb-0">
                            {{ validationError }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card tabs-card mb-4">
            <div class="card-body">
                <ul class="nav nav-pills reports-tabs mb-3" role="tablist">
                    <li class="nav-item" v-for="tab in tabs" :key="tab.key" role="presentation">
                        <button
                            type="button"
                            class="nav-link"
                            :class="{ active: activeTab === tab.key }"
                            @click="activeTab = tab.key"
                        >
                            <i :class="[tab.icon, 'me-2']"></i>{{ tab.label }}
                        </button>
                    </li>
                </ul>
                <LoadingState v-if="loading" text="Đang tải dữ liệu báo cáo..." />
                <ErrorState
                    v-else-if="error"
                    :message="error"
                    :show-retry="true"
                    :retry-handler="fetchReports"
                />
                <div v-else class="tab-content">
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
import { onBeforeUnmount, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
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
            variant: 'accent-success'
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
            variant: 'accent-info'
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
                variant: 'accent-warning'
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
                variant: 'accent-purple'
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
    stroke: { curve: 'smooth', width: 3 },
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
        revenueSeries.value = [{ name: 'Doanh thu', data: safeRevenue.values ?? [] }]
        revenueOptions.value = buildRevenueOptions(safeRevenue.labels ?? [])
        revenueSummary.value = safeRevenue.summary ?? { total: 0, average: 0, max: 0 }
        profitSeries.value = [
            { name: 'Doanh thu', data: [profitData?.totalRevenue ?? 0] },
            { name: 'Lợi nhuận', data: [profitData?.totalProfit ?? 0] }
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
        if (!isActive) {
            return
        }
        loading.value = false
        if (!initialized.value) {
            initialized.value = true
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
        if (!isActive) {
            return
        }
        inventoryLoading.value = false
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

const handleExportAll = () => {
    if (exportingAll.value) return
    try {
        exportingAll.value = true
        const payload = {
            generatedAt: new Date().toISOString(),
            filters: { ...filters },
            insights: insights.value,
            summary: {
                revenue: revenueSummary.value,
                profit: profitReport.value,
                comparison: salesComparison.value
            },
            data: {
                dashboardStats: dashboardStats.value,
                revenueEntries: revenueEntries.value,
                paymentStats: paymentStats.value,
                bestSellers: bestSellersRaw.value,
                topCustomers: topCustomers.value,
                staffPerformance: staffPerformance.value,
                hourlySales: hourlySales.value,
                categorySales: categorySales.value,
                expensesEntries: expensesEntries.value,
                totalExpenses: totalExpenses.value,
                totalImportedCost: totalImportedCost.value,
                inventory: {
                    lowStockOnly: inventoryLowStockOnly.value,
                    summary: inventorySummary.value,
                    items: inventoryItems.value
                }
            }
        }

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `cafe-dashboard-report-${filters.startDate}_to_${filters.endDate}.json`
        link.click()
        URL.revokeObjectURL(url)
        showSuccess('Đã tải dữ liệu báo cáo tổng hợp!')
    } catch (err) {
        showError(err?.message || 'Không thể tải dữ liệu báo cáo.')
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
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: var(--spacing-6) var(--spacing-8);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-6);
    box-shadow: var(--shadow-md);
}

.page-title {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-tight);
}

.page-subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
}

.filter-card,
.tabs-card {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-md);
    background: linear-gradient(180deg, var(--color-card), var(--color-card-accent));
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
    gap: var(--spacing-3);
}

.reports-tabs .nav-link {
    border-radius: var(--radius-full);
    padding: var(--spacing-2) var(--spacing-5);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
    background: var(--color-card-muted);
    transition: all var(--transition-fast);
}

.reports-tabs .nav-link:hover {
    background: var(--color-primary-soft);
    color: var(--color-primary);
}

.reports-tabs .nav-link.active {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
    color: var(--color-primary-contrast);
    box-shadow: var(--shadow-sm);
}

@media (max-width: 768px) {
    .card-shadow {
        padding: var(--spacing-5);
        flex-direction: column;
        align-items: flex-start;
    }

    .insights-grid {
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    }
}
</style>
