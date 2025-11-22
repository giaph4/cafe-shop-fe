<template>
    <div class="dashboard" data-aos="fade-up">
        <section class="dashboard__header">
            <div class="filter-bar">
                <div class="filter-group">
                    <label>Khoảng thời gian</label>
                    <div class="btn-group">
                        <button
                            v-for="preset in presets"
                            :key="preset.value"
                            class="btn btn-outline-primary"
                            :class="{ active: rangePreset === preset.value }"
                            @click="applyPreset(preset.value)"
                        >
                            {{ preset.label }}
                        </button>
                    </div>
                </div>

                <div class="filter-dates">
                    <div>
                        <label>Từ ngày</label>
                        <input type="date" class="form-control" v-model="filters.startDate" @change="fetchData"/>
                    </div>
                    <div>
                        <label>Đến ngày</label>
                        <input type="date" class="form-control" v-model="filters.endDate" @change="fetchData"/>
                    </div>
                </div>

                <div class="filter-actions">
                    <button class="btn btn-primary" @click="fetchData">Cập nhật</button>
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
            <div v-if="loading" class="dashboard__loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Đang tải...</span>
                </div>
            </div>

            <div v-else-if="error" class="alert alert-danger">
                {{ error }}
            </div>

            <template v-else>
                <Transition name="fade" mode="out-in">
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
            </template>
        </section>
    </div>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue'
import OverviewTab from '@/components/dashboard/OverviewTab.vue'
import RevenueTab from '@/components/dashboard/RevenueTab.vue'
import CustomersTab from '@/components/dashboard/CustomersTab.vue'
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
import {formatCurrency} from '@/utils/formatters'

const today = () => new Date().toISOString().split('T')[0]
const shiftDateFrom = (baseDate, daysDiff) => {
    const date = new Date(baseDate)
    date.setDate(date.getDate() + daysDiff)
    return date
}
const formatDate = (date) => date.toISOString().split('T')[0]
const shiftDate = (days) => formatDate(shiftDateFrom(new Date(), days))

const computePreviousRange = () => {
    const start = new Date(`${filters.value.startDate}T00:00:00`)
    const end = new Date(`${filters.value.endDate}T00:00:00`)
    const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)))
    const previousEnd = shiftDateFrom(start, -1)
    const previousStart = shiftDateFrom(previousEnd, -diffDays)
    return {
        previousStart: formatDate(previousStart),
        previousEnd: formatDate(previousEnd)
    }
}

const presets = [
    {value: '7', label: '7 ngày'},
    {value: '30', label: '30 ngày'},
    {value: '90', label: '90 ngày'}
]

const filters = ref({
    startDate: shiftDate(-7),
    endDate: today()
})

const rangePreset = ref('7')
const activeTab = ref('overview')

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

const loading = ref(true)
const error = ref(null)

const applyPreset = (preset) => {
    rangePreset.value = preset
    filters.value = {
        startDate: shiftDate(-Number(preset)),
        endDate: today()
    }
    fetchData()
}

const fetchData = async () => {
    if (filters.value.startDate > filters.value.endDate) {
        error.value = 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'
        return
    }
    loading.value = true
    error.value = null
    try {
        const {previousStart, previousEnd} = computePreviousRange()
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

        revenueSeries.value = [{name: 'Doanh thu', data: revenueValues}]
        revenueOptions.value = buildRevenueOptions(revenueDates)

        const profitRevenue = profitData?.totalRevenue || 0
        const profitTotal = profitData?.totalProfit || 0

        profitSeries.value = [
            {name: 'Doanh thu', data: [profitRevenue]},
            {name: 'Lợi nhuận', data: [profitTotal]}
        ]
        profitOptions.value = buildProfitOptions()

    } catch (err) {
        error.value = 'Không thể tải dữ liệu báo cáo. Vui lòng thử lại.'
    } finally {
        loading.value = false
    }
}

const buildRevenueOptions = (categories) => ({
    chart: {type: 'area', toolbar: {show: false}},
    xaxis: {
        categories,
        labels: {style: {colors: '#7a706a', fontSize: '12px'}}
    },
    yaxis: {
        labels: {formatter: (val) => formatCurrency(val), style: {colors: '#7a706a'}}
    },
    dataLabels: {enabled: false},
    stroke: {curve: 'smooth', width: 3},
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
    chart: {type: 'bar', toolbar: {show: false}},
    plotOptions: {bar: {columnWidth: '45%', borderRadius: 10}},
    dataLabels: {enabled: false},
    xaxis: {categories: ['Kỳ hiện tại']},
    yaxis: {labels: {formatter: (val) => formatCurrency(val)}},
    colors: ['#4f46e5', '#22c55e']
})

onMounted(fetchData)
</script>

<style scoped>
.dashboard {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
}

.dashboard__header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.filter-bar {
    width: 100%;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
}

.filter-group label {
    font-weight: 600;
    font-size: 0.85rem;
}

.btn-group {
    display: flex;
    gap: 0.6rem;
}

.btn-group .btn {
    border-radius: 12px;
    padding-inline: 1.25rem;
}

.btn-group .btn.active {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
    color: var(--color-primary-contrast);
}

.filter-dates {
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    flex-wrap: wrap;
}

.filter-dates label {
    font-size: 0.85rem;
    font-weight: 600;
    display: block;
    margin-bottom: 0.35rem;
}

.filter-actions {
    display: flex;
    align-items: flex-end;
}

.dashboard__tabs .tabs {
    display: flex;
    gap: 0.75rem;
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    padding: 0.6rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-soft);
    overflow-x: auto;
}

.tab {
    border: none;
    background: transparent;
    padding: 0.75rem 1.35rem;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    font-weight: 600;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: background 0.2s ease;
}

.tab i {
    font-size: 1.15rem;
}

.tab.active {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.dashboard__content {
    min-height: 300px;
}

.dashboard__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 240px;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

@media (max-width: 992px) {
    .filter-dates {
        width: 100%;
    }

    .btn-group {
        flex-wrap: wrap;
    }
}
</style>
