<template>
    <div class="inventory-report-page container-fluid" data-aos="fade-up">
        <div class="page-header card-shadow">
            <div>
                <h2 class="page-title">Báo cáo tồn kho</h2>
                <p class="page-subtitle">Theo dõi tồn kho hiện tại, điểm đặt lại và xu hướng thiếu hụt.</p>
            </div>
            <div class="d-flex flex-wrap gap-2">
                <div class="form-check form-switch align-self-center">
                    <input class="form-check-input" type="checkbox" role="switch" id="lowStockSwitch" v-model="filters.lowStockOnly">
                    <label class="form-check-label" for="lowStockSwitch">Chỉ hiển thị nguyên liệu thiếu hụt</label>
                </div>
                <button class="btn btn-outline-secondary" type="button" @click="refetch" :disabled="isFetching">
                    <span v-if="isFetching" class="spinner-border spinner-border-sm me-2"></span>
                    Làm mới
                </button>
                <button class="btn btn-primary" type="button" @click="handleExport" :disabled="isExporting">
                    <span v-if="isExporting" class="spinner-border spinner-border-sm me-2"></span>
                    Xuất Excel
                </button>
            </div>
        </div>

        <div class="card filter-card mb-4">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-lg-4 col-md-6">
                        <label class="form-label">Tìm kiếm</label>
                        <div class="input-group search-group">
                            <span class="input-group-text"><i class="bi bi-search"></i></span>
                            <input type="text" class="form-control" placeholder="Tên nguyên liệu hoặc đơn vị"
                                v-model="searchQuery" />
                        </div>
                    </div>
                    <div class="col-lg-2 col-md-3">
                        <label class="form-label">Số dòng / trang</label>
                        <select class="form-select" :value="pageSize" @change="updatePageSize($event.target.value)">
                            <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
                        </select>
                    </div>
                    <div class="col-lg-6">
                        <div class="stats-row">
                            <div class="stat-card" v-for="stat in stats" :key="stat.label">
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
            <div class="card-footer bg-transparent" v-if="totalPages > 1">
                <Pagination mode="zero-based" :current-page="zeroBasedPage" :total-pages="totalPages"
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
const { pageSize, zeroBasedPage, setPage, updatePageSize, resetPage } = pagination

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

const totalPages = computed(() => {
    if (!baseItems.value.length) return 0
    return Math.ceil(baseItems.value.length / pageSize.value)
})

const tableData = computed(() => {
    const start = zeroBasedPage.value * pageSize.value
    return baseItems.value.slice(start, start + pageSize.value)
})

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
.inventory-report-page {
    padding-bottom: 2rem;
}

.card-shadow {
    background: linear-gradient(120deg, rgba(99, 102, 241, 0.12), rgba(129, 140, 248, 0.08));
    border: 1px solid var(--color-border);
    border-radius: 20px;
    padding: 1.5rem 2rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
}

.page-title {
    font-weight: 700;
    color: var(--color-heading);
    margin-bottom: 0.25rem;
}

.page-subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
}

.filter-card,
.table-card {
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.28);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
    background: linear-gradient(180deg, var(--color-card), var(--color-card-accent));
}

.search-group .input-group-text {
    background: transparent;
    border-right: none;
}

.search-group .form-control {
    border-left: none;
}

.stats-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: flex-end;
}

.stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    border: 1px solid var(--color-border);
    border-radius: 18px;
    padding: 1rem 1.25rem;
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
    min-width: 190px;
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 1.35rem;
}

.variant-primary {
    background: linear-gradient(140deg, #6366f1, #8b5cf6);
}

.variant-warning {
    background: linear-gradient(140deg, #f97316, #fb923c);
}

.variant-success {
    background: linear-gradient(140deg, #22c55e, #4ade80);
}

.stat-label {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

.stat-value {
    font-weight: 700;
    color: var(--color-heading);
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

.state-block {
    display: flex;
    align-items: center;
    justify-content: center;
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

@media (max-width: 768px) {
    .card-shadow {
        padding: 1.25rem;
    }

    .stats-row {
        justify-content: flex-start;
    }
}
</style>
