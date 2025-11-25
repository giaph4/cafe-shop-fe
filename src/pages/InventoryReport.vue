<template>
    <div class="page-container container-fluid" data-aos="fade-up">
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
                <div class="stat-card">
                    <div class="stat-icon" :class="stat.variant">
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
                <div class="card-header border-0">
                    <h5 class="card-title mb-0">Tình trạng tồn kho</h5>
                </div>
                <div class="card-body">
                    <ApexChart type="donut" :options="statusChartOptions" :series="statusChartSeries" height="280" />
                </div>
            </div>
            <div class="card chart-card">
                <div class="card-header border-0 d-flex justify-content-between align-items-center">
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
                <div v-if="isLoading" class="state-block py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                </div>
                <div v-else-if="isError" class="state-block py-5">
                    <div class="alert alert-danger mb-0">{{ errorMessage }}</div>
                </div>
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
                            <tr v-if="!tableData.length">
                                <td colspan="5" class="text-center text-muted py-5">Không có nguyên liệu phù hợp.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
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


.search-group .input-group-text {
    background: transparent;
    border-right: none;
}

.search-group .form-control {
    border-left: none;
}

.stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 1.25rem;
    background: #ffffff;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
    transition: transform 0.2s, box-shadow 0.2s;
    height: 100%;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
}

.stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 1.5rem;
    flex-shrink: 0;
    border: 2px solid;
}

.variant-primary {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    border-color: #3b82f6;
}

.variant-warning {
    background: linear-gradient(135deg, #f97316, #ea580c);
    border-color: #f97316;
}

.variant-success {
    background: linear-gradient(135deg, #10b981, #059669);
    border-color: #10b981;
}

.stat-label {
    font-size: 0.875rem;
    color: #64748b;
    margin-bottom: 0.25rem;
    font-weight: 500;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.2;
}

.analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
}

.chart-card {
    border: 1px solid var(--color-border);
    border-radius: 18px;
    background: linear-gradient(180deg, var(--color-card), var(--color-card-accent));
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}


.status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    font-weight: 600;
    font-size: 0.85rem;
}

.status-success {
    background: rgba(34, 197, 94, 0.15);
    color: #16a34a;
}

.status-danger {
    background: rgba(239, 68, 68, 0.15);
    color: #dc2626;
}

.table td,
.table th {
    vertical-align: middle;
}

.inventory-report-header {
    padding: 1.5rem;
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    background: linear-gradient(165deg, #ffffff, rgba(255, 255, 255, 0.95));
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04);
    margin-bottom: 1.5rem;
}

.inventory-report-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
}

.inventory-report-header__title-section {
    flex: 1;
    min-width: 0;
}

.inventory-report-header__title {
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.25rem;
    font-size: 1.5rem;
    line-height: 1.3;
}

.inventory-report-header__subtitle {
    margin-bottom: 0;
    color: #64748b;
    font-size: 0.9rem;
    line-height: 1.5;
}

.inventory-report-header__actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.inventory-report-header__actions .form-check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0;
}

.inventory-report-header__actions .form-check-label {
    margin-bottom: 0;
    color: #64748b;
    font-size: 0.9rem;
    white-space: nowrap;
}

@media (max-width: 768px) {
    .inventory-report-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .inventory-report-header__actions {
        width: 100%;
        justify-content: flex-start;
    }

    .stats-row {
        justify-content: flex-start;
    }
}
</style>
