<template>
    <div class="dashboard" data-aos="fade-up">
        <section class="dashboard__header">
            <div class="filter-card">
                <div class="filter-card__body">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label class="filter-label">Khoảng thời gian</label>
                            <div class="preset-buttons">
                                <button
                                    v-for="preset in presets"
                                    :key="preset.value"
                                    class="preset-btn"
                                    :class="{ 'is-active': rangePreset === preset.value }"
                                    @click="handlePresetClick(preset.value)"
                                >
                                    {{ preset.label }}
                                </button>
                            </div>
                        </div>

                        <div class="filter-group">
                            <label class="filter-label">Từ ngày</label>
                            <input 
                                type="date" 
                                class="filter-input" 
                                v-model="filters.startDate" 
                                @change="fetchData"
                            />
                        </div>

                        <div class="filter-group">
                            <label class="filter-label">Đến ngày</label>
                            <input 
                                type="date" 
                                class="filter-input" 
                                v-model="filters.endDate" 
                                @change="fetchData"
                            />
                        </div>

                        <div class="filter-group">
                            <button class="filter-btn" @click="fetchData">
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
                <router-link to="/realtime-dashboard" class="tab tab-realtime">
                    <i class="bi bi-activity"></i>
                    <span>Thời gian Thực</span>
                </router-link>
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
import { useDashboardEvents } from '@/composables/useWebSocketEvents'
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

const buildRevenueOptions = (categories) => {
    // Sử dụng CSS variables thông qua computed style
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#2C3E50'
    const textMuted = getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim() || '#6b7280'
    
    return {
        chart: { type: 'area', toolbar: { show: false } },
        xaxis: {
            categories,
            labels: { style: { colors: textMuted, fontSize: '12px' } }
        },
        yaxis: {
            labels: { formatter: (val) => formatCurrency(val), style: { colors: textMuted } }
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3 },
        colors: [primaryColor],
        fill: {
            type: 'solid',
            opacity: 0.15,
        }
    }
}

const buildProfitOptions = () => {
    // Sử dụng CSS variables thông qua computed style
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#2C3E50'
    const successColor = getComputedStyle(document.documentElement).getPropertyValue('--color-success').trim() || '#27ae60'
    
    return {
        chart: {type: 'bar', toolbar: {show: false}},
        plotOptions: {bar: {columnWidth: '45%', borderRadius: 6}},
        dataLabels: {enabled: false},
        xaxis: {categories: ['Kỳ hiện tại']},
        yaxis: {labels: {formatter: (val) => formatCurrency(val)}},
        colors: [primaryColor, successColor]
    }
}

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
    gap: var(--spacing-6);
    padding: var(--spacing-4);
    background: var(--color-body-bg);
}

.dashboard__header {
    margin-bottom: var(--spacing-4);
}

.filter-card {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-4);
}

.filter-card__body {
    width: 100%;
}

.filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-4);
    align-items: flex-end;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    min-width: 0;
}

.filter-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    margin-bottom: 0;
}

.preset-buttons {
    display: flex;
    gap: var(--spacing-2);
    flex-wrap: wrap;
}

.preset-btn {
    padding: var(--spacing-2) var(--spacing-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.preset-btn:hover:not(.is-active) {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.preset-btn.is-active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
    font-weight: var(--font-weight-semibold);
}

.filter-input {
    padding: var(--spacing-2) var(--spacing-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
    min-width: 160px;
    transition: all 0.2s ease;
}

.filter-input:focus {
    outline: none;
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.filter-btn {
    padding: var(--spacing-2) var(--spacing-4);
    border: 1px solid var(--color-primary);
    border-radius: var(--radius-sm);
    background: var(--color-primary);
    color: var(--color-text-inverse);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
}

.filter-btn:hover {
    background: var(--color-primary-dark);
    border-color: var(--color-primary-dark);
}

/* Tabs - Chuẩn theo base.css, flat design, không gradient */
.dashboard__tabs {
    margin-bottom: var(--spacing-4);
}

.dashboard__tabs .tabs {
    display: flex;
    gap: var(--spacing-2);
    background: var(--color-card);
    padding: var(--spacing-2);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    overflow-x: auto;
}

.tab {
    border: none;
    background: transparent;
    padding: var(--spacing-3) var(--spacing-5);
    border-radius: var(--radius-sm);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: background-color var(--transition-base), color var(--transition-base);
    white-space: nowrap;
}

.tab i {
    font-size: 18px;
    line-height: 1;
}

.tab:hover:not(.active) {
    background: var(--color-card-muted);
    color: var(--color-heading);
}

.tab.active {
    background: var(--color-primary);
    color: var(--color-text-inverse);
    font-weight: var(--font-weight-semibold);
}

.tab-realtime {
    margin-left: auto;
    background: var(--color-soft-primary);
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
    font-weight: var(--font-weight-semibold);
}

.tab-realtime:hover {
    background: var(--color-primary);
    color: var(--color-text-inverse);
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
    .dashboard {
        padding: var(--spacing-3);
        gap: var(--spacing-4);
    }

    .dashboard__header {
        margin-bottom: var(--spacing-3);
    }

    .dashboard__tabs {
        margin-bottom: var(--spacing-3);
    }

    .filter-row {
        flex-direction: column;
        align-items: stretch;
    }

    .filter-group {
        width: 100%;
    }

    .preset-buttons {
        width: 100%;
    }

    .preset-btn {
        flex: 1;
        min-width: 0;
    }

    .filter-input {
        width: 100%;
    }

    .filter-btn {
        width: 100%;
        justify-content: center;
    }
}
</style>
