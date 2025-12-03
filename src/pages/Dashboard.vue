<template>
    <div class="dashboard" data-aos="fade-up">
        <section class="dashboard__header">
            <div class="filter-card card">
                <div class="card-body">
                    <div class="row g-3 align-items-end">
                        <div class="col-md-auto">
                            <label class="form-label">Khoảng thời gian</label>
                            <div class="btn-group">
                                <button
                                    v-for="preset in presets"
                                    :key="preset.value"
                                    class="btn btn-outline-primary"
                                    :class="{ active: rangePreset === preset.value }"
                                    @click="handlePresetClick(preset.value)"
                                >
                                    {{ preset.label }}
                                </button>
                            </div>
                        </div>

                        <div class="col-md-auto">
                            <label class="form-label">Từ ngày</label>
                            <input type="date" class="form-control" v-model="filters.startDate" @change="fetchData"/>
                        </div>

                        <div class="col-md-auto">
                            <label class="form-label">Đến ngày</label>
                            <input type="date" class="form-control" v-model="filters.endDate" @change="fetchData"/>
                        </div>

                        <div class="col-md-auto">
                            <button class="btn btn-primary" @click="fetchData">
                                <i class="bi bi-arrow-clockwise me-2"></i>
                                Cập nhật
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="dashboard__tabs">
            <div class="tabs">
                <button
                    v-for="tab in tabs"
                    :key="tab.key"
                    class="tab"
                    :class="{ active: activeTab === tab.key }"
                    @click="activeTab = tab.key"
                >
                    <i :class="tab.icon"></i>
                    <span>{{ tab.label }}</span>
                </button>
            </div>
        </section>

        <section class="dashboard__content">
            <LoadingState v-if="loading" />
            <ErrorState 
                v-else-if="error" 
                :message="typeof error === 'string' ? error : 'Đã xảy ra lỗi khi tải dữ liệu'" 
                @retry="fetchData"
            />

            <Transition v-else name="fade" mode="out-in">
                <div :key="activeTab">
                    <OverviewTab
                        v-if="activeTab === 'overview'"
                        :stats="stats"
                        :revenue-series="revenueSeries"
                        :revenue-options="revenueOptions"
                        :payment-stats="paymentStats"
                        :sales-comparison="salesComparison"
                    />

                    <RevenueTab
                        v-else-if="activeTab === 'revenue'"
                        :revenue-series="revenueSeries"
                        :revenue-options="revenueOptions"
                        :profit-series="profitSeries"
                        :profit-options="profitOptions"
                        :category-sales="categorySales"
                        :hourly-sales="hourlySales"
                        :product-summary="productSummary"
                    />

                    <CustomersTab
                        v-else-if="activeTab === 'customers'"
                        :top-customers="topCustomers"
                        :staff-performance="staffPerformance"
                        :total-expenses="totalExpenses"
                        :total-imported-cost="totalImportedCost"
                    />
                </div>
            </Transition>
        </section>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import OverviewTab from '@/components/dashboard/OverviewTab.vue'
import RevenueTab from '@/components/dashboard/RevenueTab.vue'
import CustomersTab from '@/components/dashboard/CustomersTab.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import {
    getDashboardStats,
    getRevenueByDate,
    getProfitReport,
    getCategorySales,
    getHourlySales,
    getPaymentMethodStats,
    getTopCustomers,
    getStaffPerformance,
    getSalesComparison,
    getProductSalesSummary,
    getTotalExpenses,
    getTotalImportedIngredientCost
} from '@/api/reportService'
import { formatCurrency } from '@/utils/formatters'
import { useDashboardEvents } from '@/composables/useDashboardEvents'
import { useAsyncOperation } from '@/composables/useAsyncOperation'
import { useDateRangeFilter } from '@/composables/useDateRangeFilter'

const { filters, presets, applyPreset, computePreviousRange, validate } = useDateRangeFilter(7)

const rangePreset = ref('7')
const activeTab = ref('overview')

// Apply preset handler
const handlePresetClick = (presetValue) => {
    rangePreset.value = presetValue
    applyPreset(presetValue)
    fetchData()
}

const tabs = [
    {key: 'overview', label: 'Tổng quan', icon: 'bi bi-speedometer2'},
    {key: 'revenue', label: 'Doanh thu', icon: 'bi bi-cash-coin'},
    {key: 'customers', label: 'Khách hàng & Nhân sự', icon: 'bi bi-people'}
]

const stats = ref(null)
const revenueSeries = ref([{name: 'Doanh thu', data: []}])
const revenueOptions = ref({})
const profitSeries = ref([{name: 'Doanh thu', data: []}, {name: 'Lợi nhuận', data: []}])
const profitOptions = ref({})
const categorySales = ref([])
const hourlySales = ref([])
const paymentStats = ref([])
const topCustomers = ref([])
const staffPerformance = ref([])
const salesComparison = ref(null)
const productSummary = ref(null)
const totalExpenses = ref(null)
const totalImportedCost = ref(null)

const { loading, error, execute } = useAsyncOperation({ context: 'Dashboard' })

// Real-time updates với WebSocket
const handleDashboardEvent = (payload) => {
    // Xử lý các loại events từ backend
    // Ví dụ: ORDER_CREATED, ORDER_PAID, EXPENSE_ADDED, etc.
    const eventType = payload?.eventType || payload?.type
    
    if (!eventType) return
    
    // Nếu có event mới, refresh data (có thể chỉ refresh một phần để tối ưu)
    // Hoặc update trực tiếp data dựa trên event type
    switch (eventType) {
        case 'ORDER_CREATED':
        case 'ORDER_PAID':
        case 'ORDER_CANCELLED':
            // Refresh stats và revenue data
            fetchData()
            break
        case 'EXPENSE_ADDED':
        case 'EXPENSE_UPDATED':
            // Refresh expenses data
            fetchData()
            break
        case 'DASHBOARD_STATS_UPDATED':
            // Update stats trực tiếp từ payload
            if (payload.stats) {
                stats.value = payload.stats
            }
            break
        default:
            // Refresh toàn bộ data cho các event khác
            fetchData()
    }
}

const {
    connected: realtimeConnected,
    connecting: realtimeConnecting,
    lastError: realtimeError,
    connect: connectRealtime,
    disconnect: disconnectRealtime,
    ensureConnected: ensureRealtime
} = useDashboardEvents(handleDashboardEvent)

// applyPreset đã được thay thế bởi handlePresetClick sử dụng useDateRangeFilter

const fetchData = async () => {
    if (filters.value.startDate > filters.value.endDate) {
        error.value = 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'
        return
    }

    await execute(async () => {
        const { previousStart, previousEnd } = computePreviousRange()
        const [
            dashboardData,
            revenueData,
            profitData,
            categoryData,
            hourlyData,
            paymentData,
            customersData,
            staffData,
            comparisonData,
            productData,
            expensesData,
            importedCostData
        ] = await Promise.all([
            getDashboardStats(),
            getRevenueByDate(filters.value.startDate, filters.value.endDate),
            getProfitReport(filters.value.startDate, filters.value.endDate),
            getCategorySales(filters.value.startDate, filters.value.endDate),
            getHourlySales(filters.value.endDate),
            getPaymentMethodStats(filters.value.startDate, filters.value.endDate),
            getTopCustomers(filters.value.startDate, filters.value.endDate, 10),
            getStaffPerformance(filters.value.startDate, filters.value.endDate, 10),
            getSalesComparison(filters.value.startDate, filters.value.endDate, previousStart, previousEnd),
            getProductSalesSummary(filters.value.startDate, filters.value.endDate),
            getTotalExpenses(filters.value.startDate, filters.value.endDate),
            getTotalImportedIngredientCost(filters.value.startDate, filters.value.endDate)
        ])

        stats.value = dashboardData
        categorySales.value = categoryData?.items ?? []
        hourlySales.value = hourlyData?.items ?? []
        paymentStats.value = paymentData?.items ?? []
        topCustomers.value = customersData?.items ?? []
        staffPerformance.value = staffData?.items ?? []
        salesComparison.value = comparisonData
        productSummary.value = productData
        totalExpenses.value = expensesData
        totalImportedCost.value = importedCostData

        const revenueDates = revenueData?.labels ?? []
        const revenueValues = revenueData?.values ?? []

        revenueSeries.value = [{ name: 'Doanh thu', data: revenueValues }]
        revenueOptions.value = buildRevenueOptions(revenueDates)

        const profitRevenue = profitData?.totalRevenue || 0
        const profitTotal = profitData?.totalProfit || 0

        profitSeries.value = [
            { name: 'Doanh thu', data: [profitRevenue] },
            { name: 'Lợi nhuận', data: [profitTotal] }
        ]
        profitOptions.value = buildProfitOptions()
    }, 'Không thể tải dữ liệu báo cáo. Vui lòng thử lại.')
}

const buildRevenueOptions = (categories) => ({
    chart: { type: 'area', toolbar: { show: false } },
    xaxis: {
        categories,
        labels: { style: { colors: '#64748b', fontSize: '12px' } }
    },
    yaxis: {
        labels: { formatter: (val) => formatCurrency(val), style: { colors: '#64748b' } }
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    colors: ['#4f46e5'],
    fill: {
        type: 'solid',
        opacity: 0.15,
    }
})

const buildProfitOptions = () => ({
    chart: {type: 'bar', toolbar: {show: false}},
    plotOptions: {bar: {columnWidth: '45%', borderRadius: 10}},
    dataLabels: {enabled: false},
    xaxis: {categories: ['Kỳ hiện tại']},
    yaxis: {labels: {formatter: (val) => formatCurrency(val)}},
    colors: ['#4f46e5', '#22c55e']
})

onMounted(() => {
    fetchData()
    // Kết nối WebSocket để nhận real-time updates
    ensureRealtime()
})

onBeforeUnmount(() => {
    // Disconnect WebSocket khi component unmount
    disconnectRealtime()
})
</script>

<style scoped>
.dashboard {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
}

.dashboard__header {
    margin-bottom: var(--spacing-4);
}

/* Tabs - Chuẩn theo base.css, tối giản, không gradient mạnh */
.dashboard__tabs {
    margin-bottom: var(--spacing-4);
}

.dashboard__tabs .tabs {
    display: flex;
    gap: var(--spacing-2);
    background: var(--color-bg-muted);
    padding: var(--spacing-2);
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    overflow-x: auto;
}

.tab {
    border: none;
    background: transparent;
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-base);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-base);
    white-space: nowrap;
}

.tab i {
    font-size: 18px;
    line-height: 1;
}

.tab:hover:not(.active) {
    background: var(--color-bg);
    color: var(--color-text);
}

.tab.active {
    background: var(--color-primary);
    color: #ffffff;
}

.dashboard__content {
    min-height: 300px;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity var(--transition-base);
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

@media (max-width: 992px) {
    .dashboard__header {
        margin-bottom: var(--spacing-3);
    }

    .dashboard__tabs {
        margin-bottom: var(--spacing-3);
    }

    .btn-group {
        flex-wrap: wrap;
    }
}
</style>
