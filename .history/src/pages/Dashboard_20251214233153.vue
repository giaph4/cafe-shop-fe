<template>
  <div
    class="dashboard"
      
  >
    <section class="dashboard__header">
      <div class="filter-card">
        <div class="filter-card__body">
          <div class="filter-row">
            <div class="filter-group filter-group--presets">
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

            <div class="filter-group filter-group--dates">
              <label class="filter-label">Từ ngày</label>
              <input
                v-model="filters.startDate"
                type="date"
                class="filter-input"
                @change="fetchData"
              >
            </div>

            <div class="filter-group filter-group--dates">
              <label class="filter-label">Đến ngày</label>
              <input
                v-model="filters.endDate"
                type="date"
                class="filter-input"
                @change="fetchData"
              >
            </div>

            <div class="filter-group filter-group--action">
              <button
                class="filter-btn"
                @click="fetchData"
              >
                <i class="bi bi-arrow-clockwise me-2" />
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
          <i :class="tab.icon" />
          <span>{{ tab.label }}</span>
        </button>
        <router-link
          to="/realtime-dashboard"
          class="tab tab-realtime"
        >
          <i class="bi bi-activity" />
          <span>Thời gian Thực</span>
        </router-link>
        <router-link
          to="/custom-dashboard"
          class="tab tab-custom"
        >
          <i class="bi bi-grid-3x3-gap" />
          <span>Dashboard Tùy chỉnh</span>
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

      <Transition
        v-else
        name="fade"
        mode="out-in"
      >
        <div :key="activeTab">
          <OverviewTab
            v-if="activeTab === 'overview'"
            :stats="stats"
            :revenue-series="revenueSeries"
            :revenue-options="revenueOptions"
            :payment-stats="paymentStats"
            :sales-comparison="salesComparison"
            :chart-group-type="revenueGroupType"
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
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'

const { filters, presets, applyPreset, computePreviousRange } = useDateRangeFilter(7)

const rangePreset = ref('7')
const activeTab = ref('overview')

// Apply preset handler
const handlePresetClick = (presetValue) => {
    rangePreset.value = presetValue
    applyPreset(presetValue)
    fetchData()
}

const tabs = [
    { key: 'overview', label: 'Tổng quan', icon: 'bi bi-speedometer2' },
    { key: 'revenue', label: 'Doanh thu', icon: 'bi bi-cash-coin' },
    { key: 'customers', label: 'Khách hàng & Nhân sự', icon: 'bi bi-people' }
]

const stats = ref(null)
const revenueSeries = ref([{ name: 'Doanh thu', data: [] }])
const revenueOptions = ref({})
const revenueGroupType = ref('day')
const profitSeries = ref([{ name: 'Doanh thu', data: [] }, { name: 'Lợi nhuận', data: [] }])
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

        // Tính số ngày trong khoảng để quyết định smart grouping
        const startDate = new Date(filters.value.startDate)
        const endDate = new Date(filters.value.endDate)
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1

        // Smart grouping: gộp dữ liệu nếu > 60 ngày
        const { groupedDates, groupedValues, groupType } = groupRevenueData(revenueDates, revenueValues, daysDiff)

        revenueGroupType.value = groupType
        revenueSeries.value = [{ name: 'Doanh thu', data: groupedValues }]
        revenueOptions.value = buildRevenueOptions(groupedDates, daysDiff, groupType)

        const profitRevenue = profitData?.totalRevenue || 0
        const profitTotal = profitData?.totalProfit || 0

        profitSeries.value = [
            { name: 'Doanh thu', data: [profitRevenue] },
            { name: 'Lợi nhuận', data: [profitTotal] }
        ]
        profitOptions.value = buildProfitOptions()
    }, 'Không thể tải dữ liệu báo cáo. Vui lòng thử lại.')
}

/**
 * Smart grouping: Gộp dữ liệu theo tuần hoặc tháng nếu khoảng thời gian quá dài
 */
const groupRevenueData = (dates, values, daysDiff) => {
    if (daysDiff <= 60) {
        // ≤ 60 ngày: hiển thị theo ngày
        return { groupedDates: dates, groupedValues: values, groupType: 'day' }
    } else if (daysDiff <= 180) {
        // 61-180 ngày: gộp theo tuần
        const weeklyData = {}
        dates.forEach((date, index) => {
            // Parse date - hỗ trợ nhiều format
            let dateObj
            if (typeof date === 'string') {
                // Thử parse các format phổ biến: "DD/MM/YYYY", "YYYY-MM-DD", "DD-MM-YYYY"
                if (date.includes('/')) {
                    const parts = date.split('/')
                    if (parts.length === 3) {
                        // DD/MM/YYYY hoặc MM/DD/YYYY
                        if (parts[0].length === 4) {
                            dateObj = new Date(date) // YYYY/MM/DD
                        } else {
                            dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`) // DD/MM/YYYY
                        }
                    }
                } else {
                    dateObj = new Date(date)
                }
            } else {
                dateObj = date instanceof Date ? date : new Date(date)
            }

            if (isNaN(dateObj.getTime())) {
                console.warn('Invalid date:', date)
                return
            }

            const weekKey = `${dateObj.getFullYear()}-W${getWeekNumber(dateObj)}`
            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = { total: 0, label: formatWeekLabel(dateObj), order: dateObj.getTime() }
            }
            weeklyData[weekKey].total += values[index] || 0
        })
        // Sắp xếp theo thứ tự thời gian
        const sortedKeys = Object.keys(weeklyData).sort((a, b) => weeklyData[a].order - weeklyData[b].order)
        const groupedDates = sortedKeys.map(key => weeklyData[key].label)
        const groupedValues = sortedKeys.map(key => weeklyData[key].total)
        return { groupedDates, groupedValues, groupType: 'week' }
    }
    // > 180 ngày: gộp theo tháng
    const monthlyData = {}
    dates.forEach((date, index) => {
        // Parse date - hỗ trợ nhiều format
        let dateObj
        if (typeof date === 'string') {
            if (date.includes('/')) {
                const parts = date.split('/')
                if (parts.length === 3) {
                    if (parts[0].length === 4) {
                        dateObj = new Date(date)
                    } else {
                        dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
                    }
                }
            } else {
                dateObj = new Date(date)
            }
        } else {
            dateObj = date instanceof Date ? date : new Date(date)
        }

        if (isNaN(dateObj.getTime())) {
            console.warn('Invalid date:', date)
            return
        }

        const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { total: 0, label: formatMonthLabel(dateObj), order: dateObj.getTime() }
        }
        monthlyData[monthKey].total += values[index] || 0
    })
    // Sắp xếp theo thứ tự thời gian
    const sortedKeys = Object.keys(monthlyData).sort((a, b) => monthlyData[a].order - monthlyData[b].order)
    const groupedDates = sortedKeys.map(key => monthlyData[key].label)
    const groupedValues = sortedKeys.map(key => monthlyData[key].total)
    return { groupedDates, groupedValues, groupType: 'month' }
}

/**
 * Lấy số tuần trong năm
 */
const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

/**
 * Format label cho tuần: "DD/MM" (ngày đầu tuần)
 */
const formatWeekLabel = (date) => {
    // Lấy ngày đầu tuần (Thứ 2)
    const day = date.getDate()
    const month = date.getMonth() + 1
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`
}

/**
 * Format label cho tháng: "Tháng X/YYYY"
 */
const formatMonthLabel = (date) => {
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    return `T${month}/${year}`
}

const buildRevenueOptions = (categories, daysDiff, _groupType = 'day') => {
    // Sử dụng CSS variables thông qua computed style
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#2C3E50'
    const textMuted = getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim() || '#6b7280'

    // Tính toán column width dựa trên số lượng data points
    const columnWidth = categories.length > 30 ? '70%' : categories.length > 15 ? '60%' : '50%'

    // Xử lý trục X: chỉ hiện đầu, cuối và một số điểm giữa
    const getLabelStep = () => {
        if (categories.length <= 7) return 1 // Hiện tất cả nếu ≤ 7
        if (categories.length <= 14) return 2 // Cứ 2 điểm hiện 1
        return Math.ceil(categories.length / 7) // Tối đa 7 labels
    }
    const labelStep = getLabelStep()

    return {
        chart: { type: 'bar', toolbar: { show: false } },
        plotOptions: {
            bar: {
                columnWidth,
                borderRadius: 6,
                dataLabels: { position: 'top' }
            }
        },
        xaxis: {
            categories,
            labels: {
                style: { colors: textMuted, fontSize: '12px', fontFamily: 'var(--font-family-sans)' },
                rotate: 0,
                rotateAlways: false,
                hideOverlappingLabels: false, // Đảm bảo không bị ẩn labels
                show: true,
                // Chỉ hiển thị đầu, cuối và các điểm cách đều
                formatter: (value, opts) => {
                    // Kiểm tra an toàn: opts có thể undefined hoặc không có dataPointIndex
                    if (!opts || typeof opts.dataPointIndex === 'undefined') {
                        // Nếu không có index, format và trả về value
                        if (value && typeof value === 'string') {
                            if (value.includes('/')) {
                                const parts = value.split('/')
                                if (parts.length >= 2) {
                                    return `${parts[0]}/${parts[1]}`
                                }
                            }
                            return value
                        }
                        return value || ''
                    }

                    const index = opts.dataPointIndex
                    // Đảm bảo index hợp lệ
                    if (typeof index !== 'number' || index < 0 || index >= categories.length) {
                        return value || ''
                    }

                    const isFirst = index === 0
                    const isLast = index === categories.length - 1
                    const isStepPoint = index % labelStep === 0

                    if (isFirst || isLast || isStepPoint) {
                        // Format ngày tháng cho dễ đọc
                        if (value && typeof value === 'string') {
                            // Nếu là format DD/MM/YYYY hoặc DD/MM
                            if (value.includes('/')) {
                                const parts = value.split('/')
                                if (parts.length >= 2) {
                                    // Chỉ lấy ngày/tháng: 14/09
                                    return `${parts[0]}/${parts[1]}`
                                }
                            }
                            // Nếu là format khác, giữ nguyên
                            return value
                        }
                        return value || ''
                    }
                    return '' // Ẩn các labels không quan trọng
                },
                // Thêm khoảng cách và padding
                maxHeight: 80,
                offsetY: 5
            },
            axisBorder: {
                show: true,
                color: textMuted,
                height: 1
            },
            axisTicks: {
                show: true,
                color: textMuted
            }
        },
        yaxis: {
            labels: { formatter: (val) => formatCurrency(val), style: { colors: textMuted } }
        },
        dataLabels: { enabled: false },
        colors: [primaryColor],
        fill: {
            type: 'solid',
            opacity: 1
        },
        tooltip: {
            y: {
                formatter: (val) => formatCurrency(val)
            }
        }
    }
}

const buildProfitOptions = () => {
    // Sử dụng CSS variables thông qua computed style
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#2C3E50'
    const successColor = getComputedStyle(document.documentElement).getPropertyValue('--color-success').trim() || '#27ae60'

    return {
        chart: { type: 'bar', toolbar: { show: false } },
        plotOptions: { bar: { columnWidth: '40%', borderRadius: 6 } }, // Giảm từ 45% xuống 40% để cột nhỏ gọn hơn
        dataLabels: { enabled: false },
        xaxis: { categories: ['Kỳ hiện tại'] },
        yaxis: { labels: { formatter: (val) => formatCurrency(val) } },
        colors: [primaryColor, successColor]
    }
}

// Thiết lập phím tắt
useKeyboardShortcuts({
    page: 'dashboard',
    shortcuts: {
        'refresh': {
            handler: () => {
                fetchData()
            }
        },
        'fullscreen': {
            handler: () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen()
                } else {
                    document.exitFullscreen()
                }
            }
        }
    }
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
    padding: var(--spacing-3) var(--spacing-4);
}

.filter-card__body {
    width: 100%;
}

.filter-row {
    display: flex;
    flex-wrap: nowrap;
    gap: var(--spacing-4);
    align-items: flex-end;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    min-width: 0;
}

.filter-group--presets {
    flex: 1;
    min-width: 280px;
}

.filter-group--dates {
    flex: 0 0 auto;
    width: 160px;
}

.filter-group--action {
    flex: 0 0 auto;
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
    width: 100%;
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

.tab-custom {
    background: var(--color-soft-secondary);
    color: var(--color-secondary);
    border: 1px solid var(--color-secondary);
    font-weight: var(--font-weight-semibold);
}

.tab-custom:hover {
    background: var(--color-secondary);
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
        flex-wrap: wrap;
    }

    .filter-group--presets {
        flex: 1 1 100%;
        min-width: 100%;
    }

    .filter-group--dates {
        flex: 1 1 calc(50% - var(--spacing-2));
        width: auto;
    }

    .filter-group--action {
        flex: 1 1 100%;
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
