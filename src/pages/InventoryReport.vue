<template>
    <div class="page-container container-fluid">
        <div class="inventory-report-header">
            <div class="inventory-report-header__content">
                <div class="inventory-report-header__title-section">
                    <h2 class="inventory-report-header__title">Báo cáo tồn kho</h2>
                    <p class="inventory-report-header__subtitle">Theo dõi tồn kho hiện tại, điểm đặt lại và xu hướng thiếu hụt.</p>
                </div>
                <div class="inventory-report-header__actions">
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" role="switch" id="lowStockSwitch" v-model="filters.lowStockOnly">
                        <label class="form-check-label" for="lowStockSwitch">Chỉ hiển thị nguyên liệu thiếu hụt</label>
                    </div>
                    <button class="btn btn-outline-secondary btn-sm" type="button" @click="refetch" :disabled="isFetching">
                        <span v-if="isFetching" class="spinner-border spinner-border-sm me-2"></span>
                        Làm mới
                    </button>
                    <button class="btn btn-primary btn-sm" type="button" @click="handleExport" :disabled="isExporting">
                        <span v-if="isExporting" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="bi bi-download me-2"></i>
                        Xuất Excel
                    </button>
                </div>
            </div>
        </div>

        <div class="row g-3 mb-4">
            <div class="col-lg-4 col-md-4 col-sm-6" v-for="stat in stats" :key="stat.label">
                <div class="stat-card" :class="stat.variant">
                    <div class="stat-icon">
                        <i :class="stat.icon"></i>
                    </div>
                    <div>
                        <p class="stat-label mb-1">{{ stat.label }}</p>
                        <h4 class="stat-value mb-0">{{ stat.value }}</h4>
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
                            <span class="input-group-text"><i class="bi bi-search"></i></span>
                            <input type="text" class="form-control" placeholder="Tên nguyên liệu hoặc đơn vị"
                                v-model="searchQuery" />
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-3">
                        <label class="form-label">Số dòng / trang</label>
                        <select class="form-select" :value="pageSize" @change="updatePageSize($event.target.value)">
                            <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <div class="analytics-grid mb-4">
            <div class="card chart-card">
                <div class="card-header">
                    <h5 class="card-title mb-0">Tình trạng tồn kho</h5>
                </div>
                <div class="card-body">
                    <ApexChart type="donut" :options="statusChartOptions" :series="statusChartSeries" height="280" />
                </div>
            </div>
            <div class="card chart-card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0">Top nguyên liệu thiếu hụt</h5>
                    <small class="text-muted">{{ lowStockItems.length }} mục</small>
                </div>
                <div class="card-body">
                    <ApexChart type="bar" :options="lowStockChartOptions" :series="lowStockChartSeries" height="280" />
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
                    <div v-else class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th scope="col">Tên nguyên liệu</th>
                                    <th scope="col">Đơn vị</th>
                                    <th scope="col" class="text-end">Tồn kho</th>
                                    <th scope="col" class="text-end">Mức đặt lại</th>
                                    <th scope="col" class="text-center">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in tableData" :key="item.id">
                                    <td class="fw-semibold">{{ item.name }}</td>
                                    <td>{{ item.unit || '—' }}</td>
                                    <td class="text-end">{{ formatNumber(item.quantityOnHand, { maximumFractionDigits: 2 }) }}</td>
                                    <td class="text-end">{{ item.reorderLevel != null ? formatNumber(item.reorderLevel, { maximumFractionDigits: 2 }) : '—' }}</td>
                                    <td class="text-center">
                                        <span class="status-badge" :class="statusBadgeClass(item.status)">
                                            {{ statusLabel(item.status) }}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </template>
            </div>
            <div class="card-footer bg-transparent" v-if="pagination.totalPages > 1">
                <Pagination mode="zero-based" :current-page="zeroBasedPage" :total-pages="pagination.totalPages"
                    @page-change="handlePageChange" />
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

<style scoped lang="scss">
.search-group .input-group-text {
    background: var(--color-card-muted);
    border-right: none;
    border-color: var(--color-border);
    color: var(--color-text-muted);
}

.search-group .form-control {
    border-left: none;
    border-color: var(--color-border);
    background: var(--color-card);
}

.search-group .form-control:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 0.2rem rgba(99, 102, 241, 0.1);
}

.stat-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    border-radius: 24px;
    padding: var(--spacing-4) var(--spacing-5);
    background: var(--color-card);
    border: 1px solid var(--color-border-soft);
    box-shadow: var(--shadow-soft);
    height: 100%;
    min-height: 120px;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast);
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    background: var(--color-card-muted);
}

.stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    flex-shrink: 0;
    color: #6366f1;
}

.variant-primary .stat-icon {
    background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
}

.variant-warning .stat-icon {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
}

.variant-success .stat-icon {
    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.15);
}

.stat-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--spacing-1);
}

.stat-value {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
}

.analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: var(--spacing-6);
}

.chart-card {
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-soft);
    background: var(--color-card);
}

.chart-card .card-header {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-5) var(--spacing-6);
    background: var(--color-card-muted);
}

.chart-card .card-title {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
}

.filter-card,
.table-card {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border-soft);
    box-shadow: var(--shadow-soft);
    background: var(--color-card);
}

.status-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-full);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-sm);
}

.status-success {
    background: var(--color-success-soft);
    color: var(--color-success);
}

.status-danger {
    background: var(--color-danger-soft);
    color: var(--color-danger);
}

.table td,
.table th {
    vertical-align: middle;
}

.inventory-report-header {
    padding: var(--spacing-6);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border-soft);
    background: var(--color-card);
    box-shadow: var(--shadow-soft);
    margin-bottom: var(--spacing-6);
}

.inventory-report-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-6);
    flex-wrap: wrap;
}

.inventory-report-header__title-section {
    flex: 1;
    min-width: 0;
}

.inventory-report-header__title {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
}

.inventory-report-header__subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
}

.inventory-report-header__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
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
    font-size: var(--font-size-sm);
    white-space: nowrap;
}

@media (max-width: 768px) {
    .inventory-report-header {
        padding: var(--spacing-4);
    }

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

    .stat-card {
        flex-direction: row;
    }

    .analytics-grid {
        grid-template-columns: 1fr;
    }
}
</style>
