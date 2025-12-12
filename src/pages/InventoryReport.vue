<template>
  <div
    class="inventory-report-page container-fluid"
    data-aos="fade-up"
    style="background: var(--color-body-bg); padding: var(--spacing-4);"
  >
    <div class="inventory-report-header">
      <div class="inventory-report-header__content">
        <div class="inventory-report-header__title-section">
          <h2 class="inventory-report-header__title">
            Báo cáo tồn kho
          </h2>
          <p class="inventory-report-header__subtitle">
            Theo dõi tồn kho hiện tại, điểm đặt lại và xu hướng thiếu hụt.
          </p>
        </div>
        <div class="inventory-report-header__actions">
          <div class="form-check form-switch">
            <input
              id="lowStockSwitch"
              v-model="filters.lowStockOnly"
              class="form-check-input"
              type="checkbox"
              role="switch"
            >
            <label
              class="form-check-label"
              for="lowStockSwitch"
            >Chỉ hiển thị nguyên liệu thiếu hụt</label>
          </div>
          <button
            class="btn btn-outline-secondary btn-sm"
            type="button"
            :disabled="isFetching"
            @click="refetch"
          >
            <span
              v-if="isFetching"
              class="spinner-border spinner-border-sm me-2"
            />
            Làm mới
          </button>
          <button
            class="btn btn-primary btn-sm"
            type="button"
            :disabled="isExporting"
            @click="handleExport"
          >
            <span
              v-if="isExporting"
              class="spinner-border spinner-border-sm me-2"
            />
            <i
              v-else
              class="bi bi-download me-2"
            />
            Xuất Excel
          </button>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="col-lg-4 col-md-4 col-sm-6"
      >
        <div
          class="stat-card"
          :class="stat.variant"
        >
          <div class="stat-icon">
            <i :class="stat.icon" />
          </div>
          <div>
            <p class="stat-label mb-1">
              {{ stat.label }}
            </p>
            <h4 class="stat-value mb-0">
              {{ stat.value }}
            </h4>
          </div>
        </div>
      </div>
    </div>

    <div class="card filter-card mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-lg-6 col-md-6">
            <label class="form-label">Tìm kiếm</label>
            <div class="input-group search-group">
              <span class="input-group-text"><i class="bi bi-search" /></span>
              <input
                v-model="searchQuery"
                type="text"
                class="form-control"
                placeholder="Tên nguyên liệu hoặc đơn vị"
              >
            </div>
          </div>
          <div class="col-lg-3 col-md-3">
            <label class="form-label">Số dòng / trang</label>
            <select
              class="form-select"
              :value="pageSize"
              @change="updatePageSize($event.target.value)"
            >
              <option
                v-for="size in pageSizeOptions"
                :key="size"
                :value="size"
              >
                {{ size }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="analytics-grid mb-4">
      <div class="card chart-card">
        <div class="card-header">
          <h5 class="card-title mb-0">
            Tình trạng tồn kho
          </h5>
        </div>
        <div class="card-body">
          <ApexChart
            type="donut"
            :options="statusChartOptions"
            :series="statusChartSeries"
            height="280"
          />
        </div>
      </div>
      <div class="card chart-card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0">
            Top nguyên liệu thiếu hụt
          </h5>
          <small class="text-muted">{{ lowStockItems.length }} mục</small>
        </div>
        <div class="card-body">
          <ApexChart
            type="bar"
            :options="lowStockChartOptions"
            :series="lowStockChartSeries"
            height="280"
          />
        </div>
      </div>
    </div>

    <div class="card table-card">
      <div class="card-body p-0">
        <LoadingState v-if="isLoading" />
        <ErrorState
          v-else-if="isError"
          :message="errorMessage"
          @retry="refetch"
        />
        <template v-else>
          <EmptyState
            v-if="!tableData.length"
            title="Không có nguyên liệu phù hợp"
            message="Không tìm thấy nguyên liệu nào phù hợp với bộ lọc hiện tại."
          />
          <div
            v-else
            class="table-responsive"
          >
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th scope="col">
                    Tên nguyên liệu
                  </th>
                  <th scope="col">
                    Đơn vị
                  </th>
                  <th
                    scope="col"
                    class="text-end"
                  >
                    Tồn kho
                  </th>
                  <th
                    scope="col"
                    class="text-end"
                  >
                    Mức đặt lại
                  </th>
                  <th
                    scope="col"
                    class="text-center"
                  >
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in tableData"
                  :key="item.id"
                >
                  <td class="fw-semibold">
                    {{ item.name }}
                  </td>
                  <td>{{ item.unit || '—' }}</td>
                  <td class="text-end">
                    {{ formatNumber(item.quantityOnHand, { maximumFractionDigits: 2 }) }}
                  </td>
                  <td class="text-end">
                    {{ item.reorderLevel !== null ? formatNumber(item.reorderLevel, { maximumFractionDigits: 2 }) : '—' }}
                  </td>
                  <td class="text-center">
                    <span
                      class="status-badge"
                      :class="statusBadgeClass(item.status)"
                    >
                      {{ statusLabel(item.status) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
      <div
        v-if="pagination.totalPages > 1"
        class="card-footer bg-transparent"
      >
        <Pagination
          mode="zero-based"
          :current-page="zeroBasedPage"
          :total-pages="pagination.totalPages"
          @page-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import VueApexCharts from 'vue3-apexcharts'

import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Pagination from '@/components/common/Pagination.vue'
import { usePagination, PaginationMode } from '@/composables/usePagination'
import { showError, showSuccess } from '@/utils/toast'
import { formatNumber } from '@/utils/formatters'
import { getInventoryReport, exportInventoryToExcel } from '@/api/reportService'

const ApexChart = VueApexCharts

const filters = reactive({
    lowStockOnly: false
})

const searchQuery = ref('')
const debouncedSearch = ref('')
const isExporting = ref(false)
const pageSizeOptions = [10, 25, 50]

const pagination = usePagination({ mode: PaginationMode.ZERO_BASED, pageSize: pageSizeOptions[0] })
const { pageSize, zeroBasedPage, setPage, updatePageSize, resetPage, updateFromResponse } = pagination

let searchTimeoutId
watch(searchQuery, (value) => {
    clearTimeout(searchTimeoutId)
    searchTimeoutId = setTimeout(() => {
        debouncedSearch.value = value.trim()
        resetPage()
    }, 300)
})

watch(() => filters.lowStockOnly, () => {
    resetPage()
})

const query = useQuery({
    queryKey: computed(() => ['inventoryReport', { lowStockOnly: filters.lowStockOnly }]),
    queryFn: ({ queryKey }) => {
        const [, params] = queryKey
        return getInventoryReport(params.lowStockOnly)
    },
    keepPreviousData: true
})

const { data, isLoading, isError, error, isFetching, refetch } = query

const inventoryItems = computed(() => data.value?.items ?? [])

const baseItems = computed(() => {
    if (!debouncedSearch.value) return inventoryItems.value
    const keyword = debouncedSearch.value.toLowerCase()
    return inventoryItems.value.filter((item) => {
        const haystack = [item.name, item.unit]
            .filter(Boolean)
            .map((value) => value.toString().toLowerCase())
        return haystack.some((value) => value.includes(keyword))
    })
})

const totalElements = computed(() => baseItems.value.length)

const totalPages = computed(() => {
    if (!baseItems.value.length) return 0
    return Math.ceil(baseItems.value.length / pageSize.value)
})

const tableData = computed(() => {
    const start = zeroBasedPage.value * pageSize.value
    return baseItems.value.slice(start, start + pageSize.value)
})

// Cập nhật pagination từ computed values
watch([totalElements, totalPages], ([elements, pages]) => {
    pagination.updateFromResponse({
        page: zeroBasedPage.value,
        totalPages: pages,
        totalElements: elements
    })
}, { immediate: true })

const summary = computed(() => data.value?.summary ?? {
    totalItems: 0,
    lowStockCount: 0,
    totalQuantity: 0
})

const lowStockItems = computed(() =>
    inventoryItems.value
        .filter((item) => item.status === 'LOW_STOCK')
        .sort((a, b) => Number(b.reorderLevel ?? 0) - Number(a.reorderLevel ?? 0))
        .slice(0, 8)
)

const statusChartSeries = computed(() => {
    const good = Math.max(summary.value.totalItems - summary.value.lowStockCount, 0)
    return [good, summary.value.lowStockCount]
})

const statusChartOptions = computed(() => ({
    labels: ['Đủ hàng', 'Thiếu hụt'],
    colors: ['#22c55e', '#ef4444'],
    legend: { position: 'bottom' },
    dataLabels: {
        formatter: (val) => `${val.toFixed(1)}%`
    }
}))

const lowStockChartSeries = computed(() => [{
    name: 'Tồn kho',
    data: lowStockItems.value.map((item) => Number(item.quantityOnHand ?? 0))
}])

const lowStockChartOptions = computed(() => ({
    chart: { toolbar: { show: false } },
    plotOptions: {
        bar: { horizontal: true, borderRadius: 6 }
    },
    xaxis: { categories: lowStockItems.value.map((item) => item.name) },
    colors: ['#f97316']
}))

const stats = computed(() => [
    {
        label: 'Tổng nguyên liệu',
        value: formatNumber(summary.value.totalItems, { maximumFractionDigits: 0 }),
        icon: 'bi bi-box-seam',
        variant: 'variant-primary'
    },
    {
        label: 'Đang thiếu hụt',
        value: formatNumber(summary.value.lowStockCount, { maximumFractionDigits: 0 }),
        icon: 'bi bi-exclamation-triangle',
        variant: 'variant-warning'
    },
    {
        label: 'Tổng lượng tồn',
        value: formatNumber(summary.value.totalQuantity, { maximumFractionDigits: 2 }),
        icon: 'bi bi-graph-up',
        variant: 'variant-success'
    }
])

const errorMessage = computed(() => error.value?.response?.data?.message || error.value?.message || 'Không thể tải dữ liệu tồn kho.')

const handleExport = async () => {
    if (isExporting.value) return

    try {
        isExporting.value = true
        const blobData = await exportInventoryToExcel()
        const blob = new Blob([blobData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `Inventory_${new Date().toISOString().slice(0, 10)}.xlsx`
        link.click()
        URL.revokeObjectURL(url)
        showSuccess('Xuất báo cáo tồn kho thành công!')
    } catch (err) {
        showError(err.response?.data?.message || 'Xuất báo cáo thất bại.')
    } finally {
        isExporting.value = false
    }
}

const handlePageChange = (page) => {
    setPage(page)
}

const statusBadgeClass = (status) => {
    if (status === 'LOW_STOCK') return 'status-danger'
    return 'status-success'
}

const statusLabel = (status) => {
    if (status === 'LOW_STOCK') return 'Thiếu hụt'
    return 'Đủ hàng'
}
</script>

<style scoped>
/* Header - Chuẩn hóa theo base.css */
.inventory-report-header {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    margin-bottom: var(--spacing-4);
}

.inventory-report-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    flex-wrap: wrap;
}

.inventory-report-header__title-section {
    flex: 1;
    min-width: 0;
}

.inventory-report-header__title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.inventory-report-header__subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.inventory-report-header__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    flex-wrap: wrap;
    justify-content: flex-end;
}

.inventory-report-header__actions .form-check {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    margin-bottom: 0;
}

.inventory-report-header__actions .form-check-label {
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    white-space: nowrap;
    font-family: var(--font-family-sans);
}

.inventory-report-header__actions .form-check-input {
    border-color: var(--color-border);
}

.inventory-report-header__actions .form-check-input:checked {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
}

.inventory-report-header__actions .btn {
    font-size: var(--font-size-base);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.inventory-report-header__actions .btn-primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.inventory-report-header__actions .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-dark);
}

.inventory-report-header__actions .btn-outline-secondary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.inventory-report-header__actions .btn-outline-secondary:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.inventory-report-header__actions .btn i {
    font-size: 18px;
    line-height: 1;
}

/* Stat Cards (KPI) - Flat Design */
.stat-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    height: 100%;
    min-height: 120px;
    transition: all var(--transition-base);
}

.stat-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

.stat-icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-sm);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
}

/* Màu icon - dùng var(--color-soft-*) */
.stat-card.variant-primary .stat-icon {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.stat-card.variant-warning .stat-icon {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.stat-card.variant-success .stat-icon {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.stat-label {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.stat-value {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

/* Filter Card - Chuẩn hóa */
.filter-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.filter-card :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.filter-card :global(.form-label) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-control),
.filter-card :global(.form-select) {
    height: 40px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    background: var(--color-card);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-control:focus),
.filter-card :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.search-group :global(.input-group-text) {
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
    border-right: none;
    color: var(--color-text-muted);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm) 0 0 var(--radius-sm);
}

.search-group :global(.form-control) {
    border-left: none;
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

/* Analytics cards / charts */
.analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: var(--spacing-4);
    margin-bottom: var(--spacing-4);
}

.chart-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.chart-card :global(.card-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
}

.chart-card :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.chart-card :global(.card-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    font-family: var(--font-family-sans);
}

.chart-card :global(.text-muted) {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

/* Table card - Minimal Table Styling */
.table-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.table-card :global(.card-body) {
    padding: 0;
    background: var(--color-card);
}

.table-card :global(.card-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
}

.table-card :global(.table) {
    margin-bottom: 0;
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
}

.table-card :global(.table thead),
.table-card :global(.table thead.table-light) {
    background: var(--color-card-muted);
}

.table-card :global(.table thead th) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    background: var(--color-card-muted);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-3);
    vertical-align: middle;
    font-family: var(--font-family-sans);
}

.table-card :global(.table tbody td) {
    font-size: var(--font-size-base);
    padding: var(--spacing-3);
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
    font-family: var(--font-family-sans);
}

.table-card :global(.table tbody tr:last-child td) {
    border-bottom: none;
}

.table-card :global(.table tbody tr:hover) {
    background: var(--color-card-muted);
}

.table-card :global(.fw-semibold) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

/* Status badge - Flat Design */
.status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    border: 1px solid transparent;
    font-family: var(--font-family-sans);
}

.status-success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
    border-color: var(--color-success);
}

.status-danger {
    background: var(--color-soft-rose);
    color: var(--color-danger);
    border-color: var(--color-danger);
}

/* Global Button Styles - Đồng bộ với các trang trước */
.inventory-report-page :global(.btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.inventory-report-page :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.inventory-report-page :global(.btn-primary:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

.inventory-report-page :global(.btn-primary i) {
    font-size: 18px;
    line-height: 1;
}

.inventory-report-page :global(.btn-outline-primary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.inventory-report-page :global(.btn-outline-primary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.inventory-report-page :global(.btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.inventory-report-page :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.inventory-report-page :global(.btn-sm) {
    padding: var(--spacing-1) var(--spacing-3);
    font-size: var(--font-size-sm);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

@media (max-width: 992px) {
    .inventory-report-header {
        padding: var(--spacing-3);
    }

    .analytics-grid {
        gap: var(--spacing-3);
    }
}

@media (max-width: 768px) {
    .inventory-report-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .inventory-report-header__actions {
        width: 100%;
        justify-content: flex-start;
        flex-direction: column;
        gap: var(--spacing-2);
    }

    .inventory-report-header__actions .form-check {
        width: 100%;
    }

    .inventory-report-header__actions .btn {
        width: 100%;
    }

    .analytics-grid {
        grid-template-columns: 1fr;
    }
}
</style>
