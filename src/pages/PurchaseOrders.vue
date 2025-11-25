<template>
    <PurchaseOrderDetailModal :order-id="selectedOrderId" @close="selectedOrderId = null"/>
    <PurchaseOrderUpdateModal 
        ref="updateModal"
        :purchase-order-id="selectedOrderId"
        :purchase-order="selectedOrder"
        @updated="handleOrderUpdated"
    />

    <div class="page-container container-fluid" data-aos="fade-up">
        <div class="purchase-orders-header">
            <div class="purchase-orders-header__content">
                <div class="purchase-orders-header__title-section">
                    <h2 class="purchase-orders-header__title">Quản lý Nhập hàng</h2>
                    <p class="purchase-orders-header__subtitle">Theo dõi tiến độ xử lý, trạng thái và chi phí nhập kho.</p>
                </div>
                <div class="purchase-orders-header__actions">
                    <button class="btn btn-outline-secondary btn-sm" type="button" @click="refetch" :disabled="isFetching">
                        <span v-if="isFetching" class="spinner-border spinner-border-sm me-2"></span>
                        Làm mới
                    </button>
                    <router-link to="/purchase-orders/new" class="btn btn-primary btn-sm">
                        <i class="bi bi-plus-lg me-2"></i>Tạo đơn nhập hàng
                    </router-link>
                </div>
            </div>
        </div>

        <div class="row g-4 mb-4 mt-1">
            <div class="col-sm-6 col-lg-3 d-flex" v-for="stat in stats" :key="stat.label">
                <div class="stat-card w-100">
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
                    <div class="col-12 col-lg-3 col-md-6">
                        <label class="form-label">Nhà cung cấp</label>
                        <select class="form-select" v-model="filters.supplierId">
                            <option value="">Tất cả</option>
                            <option v-for="supplier in supplierOptions" :key="supplier.id" :value="supplier.id">
                                {{ supplier.name }}
                            </option>
                        </select>
                    </div>
                    <div class="col-12 col-lg-3 col-md-6">
                        <label class="form-label">Trạng thái</label>
                        <select class="form-select" v-model="filters.status">
                            <option value="">Tất cả</option>
                            <option value="PENDING">Đang chờ xử lý</option>
                            <option value="COMPLETED">Đã hoàn thành</option>
                            <option value="CANCELLED">Đã huỷ</option>
                        </select>
                    </div>
                    <div class="col-12 col-lg-2 col-md-4">
                        <label class="form-label">Từ ngày</label>
                        <input type="date" class="form-control" v-model="filters.startDate"/>
                    </div>
                    <div class="col-12 col-lg-2 col-md-4">
                        <label class="form-label">Đến ngày</label>
                        <input type="date" class="form-control" v-model="filters.endDate"/>
                    </div>
                    <div class="col-12 col-lg-2 col-md-4">
                        <label class="form-label">Số dòng / trang</label>
                        <select class="form-select" :value="pageSize" @change="updatePageSize($event.target.value)">
                            <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
                        </select>
                    </div>
                    <div class="col-12 d-flex justify-content-end">
                        <button class="btn btn-outline-secondary btn-sm" type="button" @click="resetFilters"
                                :disabled="isResetDisabled">
                            <i class="bi bi-arrow-counterclockwise me-1"></i>Đặt lại lọc
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card table-card">
            <div class="card-body p-0">
                <div v-if="isLoading || isSuppliersLoading" class="state-block py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                </div>
                <div v-else-if="isError" class="state-block py-5">
                    <div class="alert alert-danger mb-0">{{ errorMessage }}</div>
                </div>
                <div v-else class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                        <tr>
                            <th scope="col">Mã đơn</th>
                            <th scope="col">Nhà cung cấp</th>
                            <th scope="col">Người tạo</th>
                            <th scope="col">Ngày đặt</th>
                            <th scope="col" class="text-center">Trạng thái</th>
                            <th scope="col" class="text-end">Tổng tiền</th>
                            <th scope="col" class="text-end">Hành động</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="order in tableData" :key="order.id">
                            <td class="fw-semibold">#{{ order.id }}</td>
                            <td>{{ order.supplierName }}</td>
                            <td>{{ order.staffUsername }}</td>
                            <td>{{ formatDateTime(order.orderDate) || '—' }}</td>
                            <td class="text-center">
                            <span class="status-badge" :class="statusBadgeClass(order.status)">
                                {{ statusLabel(order.status) }}
                            </span>
                            </td>
                            <td class="text-end fw-semibold">{{ formatCurrency(order.totalAmount) }}</td>
                            <td class="text-end">
                                <div class="action-buttons">
                                    <button class="action-button" type="button"
                                            @click="selectedOrderId = order.id">
                                        <i class="bi bi-eye"></i>
                                        <span>Chi tiết</span>
                                    </button>
                                    <button class="action-button" type="button"
                                            v-if="order.status === 'PENDING'"
                                            @click="handleUpdate(order)">
                                        <i class="bi bi-pencil"></i>
                                        <span>Chỉnh sửa</span>
                                    </button>
                                    <button class="action-button action-button--success" type="button"
                                            v-if="order.status === 'PENDING'"
                                            :disabled="completeMutation.isPending.value" @click="handleComplete(order)">
                                        <i class="bi bi-check2"></i>
                                        <span>Hoàn thành</span>
                                    </button>
                                    <button class="action-button action-button--danger" type="button"
                                            v-if="order.status === 'PENDING'"
                                            :disabled="cancelMutation.isPending.value" @click="handleCancel(order)">
                                        <i class="bi bi-x"></i>
                                        <span>Hủy</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="!tableData.length">
                            <td colspan="7" class="text-center text-muted py-5">Không tìm thấy phiếu nhập phù hợp.</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <div class="card-footer bg-transparent" v-if="supportsPagination && totalPages > 1">
                    <Pagination mode="zero-based" :current-page="zeroBasedPage" :total-pages="totalPages"
                                @page-change="handlePageChange"/>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import {computed, reactive, ref} from 'vue'
import {useMutation, useQuery, useQueryClient} from '@tanstack/vue-query'

import PurchaseOrderDetailModal from '@/components/purchase-orders/PurchaseOrderDetailModal.vue'
import PurchaseOrderUpdateModal from '@/components/purchase-orders/PurchaseOrderUpdateModal.vue'
import Pagination from '@/components/common/Pagination.vue'
import {usePagination, PaginationMode} from '@/composables/usePagination'
import {showSuccess, showError} from '@/utils/toast'
import {useErrorHandler} from '@/composables/useErrorHandler'

const {handleError, extractErrorMessage} = useErrorHandler({context: 'PurchaseOrders'})
import {formatCurrency, formatDateTime, formatNumber} from '@/utils/formatters'
import {getSuppliers} from '@/api/supplierService'
import {getPurchaseOrders, markOrderAsCompleted, cancelPurchaseOrder} from '@/api/purchaseOrderService'

const queryClient = useQueryClient()

const selectedOrderId = ref(null)
const selectedOrder = ref(null)
const updateModal = ref(null)

const DEFAULT_FILTERS = Object.freeze({
    supplierId: '',
    status: '',
    startDate: '',
    endDate: ''
})

const filters = reactive({...DEFAULT_FILTERS})

const pageSizeOptions = [10, 25, 50]
const pagination = usePagination({mode: PaginationMode.ZERO_BASED, pageSize: pageSizeOptions[0]})
const {currentPage, pageSize, zeroBasedPage, setPage, updatePageSize, resetPage} = pagination

const sanitizedFilters = computed(() => ({
    supplierId: filters.supplierId ? Number(filters.supplierId) : undefined,
    status: filters.status || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined
}))

const suppliersQuery = useQuery({
    queryKey: ['suppliers', {page: 0, size: 100}],
    queryFn: ({queryKey}) => {
        const [, params] = queryKey
        return getSuppliers(params)
    }
})

const supplierOptions = computed(() => {
    const value = suppliersQuery.data.value
    if (Array.isArray(value?.content)) return value.content
    if (Array.isArray(value)) return value
    if (Array.isArray(value?.data)) return value.data
    return []
})

const query = useQuery({
    queryKey: computed(() => ['purchaseOrders', {
        page: zeroBasedPage.value,
        size: pageSize.value,
        ...sanitizedFilters.value
    }]),
    queryFn: ({queryKey}) => {
        const [, params] = queryKey
        return getPurchaseOrders(params)
    },
    keepPreviousData: true,
})

const {data, isLoading, isError, error, isFetching, refetch} = query
const isSuppliersLoading = computed(() => suppliersQuery.isLoading.value || suppliersQuery.isFetching.value)

const rawOrders = computed(() => data.value ?? null)
const paginatedContent = computed(() => Array.isArray(rawOrders.value?.content) ? rawOrders.value.content : null)
const supportsPagination = computed(() => Array.isArray(paginatedContent.value))

const tableData = computed(() => {
    if (supportsPagination.value) return paginatedContent.value ?? []
    if (Array.isArray(rawOrders.value)) return rawOrders.value
    if (Array.isArray(rawOrders.value?.data)) return rawOrders.value.data
    return []
})

const totalElements = computed(() => {
    if (supportsPagination.value) {
        const total = rawOrders.value?.totalElements ?? rawOrders.value?.total
        return typeof total === 'number' ? total : tableData.value.length
    }
    return tableData.value.length
})

const totalPages = computed(() => {
    if (supportsPagination.value) {
        const total = rawOrders.value?.totalPages ?? rawOrders.value?.totalPage ?? rawOrders.value?.pageInfo?.totalPages
        return typeof total === 'number' ? total : 0
    }
    return tableData.value.length > 0 ? 1 : 0
})

const stats = computed(() => {
    const pendingCount = tableData.value.filter((order) => order.status === 'PENDING').length
    const completedCount = tableData.value.filter((order) => order.status === 'COMPLETED').length
    const cancelledCount = tableData.value.filter((order) => order.status === 'CANCELLED').length
    const totalAmount = tableData.value.reduce((sum, order) => sum + Number(order.totalAmount ?? 0), 0)

    return [
        {
            label: 'Tổng phiếu nhập',
            value: formatNumber(totalElements.value, {maximumFractionDigits: 0}),
            icon: 'bi bi-box-seam',
            variant: 'variant-primary'
        },
        {
            label: 'Đang chờ xử lý',
            value: formatNumber(pendingCount, {maximumFractionDigits: 0}),
            icon: 'bi bi-hourglass-split',
            variant: 'variant-warning'
        },
        {
            label: 'Đã hoàn thành',
            value: formatNumber(completedCount, {maximumFractionDigits: 0}),
            icon: 'bi bi-check-circle',
            variant: 'variant-success'
        },
        {
            label: 'Tổng giá trị trang',
            value: formatCurrency(totalAmount),
            icon: 'bi bi-cash-stack',
            variant: 'variant-info'
        }
    ]
})

const errorMessage = computed(() => {
    if (!error.value) return ''
    return extractErrorMessage(error.value) || 'Không thể tải dữ liệu phiếu nhập.'
})

const isResetDisabled = computed(() =>
    !filters.supplierId && !filters.status && !filters.startDate && !filters.endDate && pageSize.value === pageSizeOptions[0]
)

const resetFilters = () => {
    filters.supplierId = DEFAULT_FILTERS.supplierId
    filters.status = DEFAULT_FILTERS.status
    filters.startDate = DEFAULT_FILTERS.startDate
    filters.endDate = DEFAULT_FILTERS.endDate
    updatePageSize(pageSizeOptions[0])
}

const completeMutation = useMutation({
    mutationFn: markOrderAsCompleted,
    onSuccess: (data) => {
        showSuccess(`Đơn nhập #${data.id} đã hoàn thành.`)
        queryClient.invalidateQueries({queryKey: ['purchaseOrders']})
    },
    onError: (err) => handleError(err, 'Không thể hoàn thành phiếu nhập.')
})

const cancelMutation = useMutation({
    mutationFn: cancelPurchaseOrder,
    onSuccess: (data) => {
        showSuccess(`Đơn nhập #${data.id} đã được huỷ.`)
        queryClient.invalidateQueries({queryKey: ['purchaseOrders']})
    },
    onError: (err) => handleError(err, 'Không thể huỷ phiếu nhập.')
})

const handleComplete = (order) => {
    if (confirm(`Xác nhận hoàn thành phiếu nhập #${order.id}?`)) {
        completeMutation.mutate(order.id)
    }
}

const handleCancel = (order) => {
    if (confirm(`Bạn có chắc chắn muốn huỷ phiếu nhập #${order.id}?`)) {
        cancelMutation.mutate(order.id)
    }
}

const handleUpdate = (order) => {
    if (!order || order.status !== 'PENDING') return
    selectedOrderId.value = order.id
    selectedOrder.value = order
    updateModal.value?.show()
}

const handleOrderUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] })
    selectedOrderId.value = null
    selectedOrder.value = null
}

const handlePageChange = (page) => {
    setPage(page)
}

const statusBadgeClass = (status) => {
    if (status === 'COMPLETED') return 'status-success'
    if (status === 'CANCELLED') return 'status-danger'
    return 'status-warning'
}

const statusLabel = (status) => {
    if (status === 'COMPLETED') return 'Hoàn thành'
    if (status === 'CANCELLED') return 'Đã huỷ'
    return 'Đang chờ'
}
</script>

<style scoped>
.purchase-orders-header {
    padding: 1.5rem;
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    background: linear-gradient(165deg, #ffffff, rgba(255, 255, 255, 0.95));
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04);
    margin-bottom: 1.5rem;
}

.purchase-orders-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
}

.purchase-orders-header__title-section {
    flex: 1;
    min-width: 0;
}

.purchase-orders-header__title {
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.25rem;
    font-size: 1.5rem;
    line-height: 1.3;
}

.purchase-orders-header__subtitle {
    margin-bottom: 0;
    color: #64748b;
    font-size: 0.9rem;
    line-height: 1.5;
}

.purchase-orders-header__actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: flex-end;
}

.action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: 1px solid rgba(168, 85, 247, 0.3);
    background: #ffffff;
    color: #a855f7;
    font-size: 0.875rem;
    font-weight: 600;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.action-button:hover:not(:disabled) {
    background: rgba(168, 85, 247, 0.05);
    border-color: rgba(168, 85, 247, 0.5);
    transform: translateY(-1px);
}

.action-button:disabled {
    opacity: 0.65;
    pointer-events: none;
}

.action-button--success {
    border-color: rgba(16, 185, 129, 0.3);
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
}

.action-button--success:hover:not(:disabled) {
    background: rgba(16, 185, 129, 0.15);
    border-color: rgba(16, 185, 129, 0.5);
}

.action-button--danger {
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
}

.action-button--danger:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.5);
}

/* Page-specific styles only - Global styles (.page-header.card-shadow, .page-title, .page-subtitle, .filter-card, .state-block) are in components.scss */

.stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    border: 1px solid var(--color-border);
    border-radius: 18px;
    padding: 1rem 1.25rem;
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
    height: 100%;
    min-height: 140px;
}

.stat-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: #fff;
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

.variant-info {
    background: linear-gradient(140deg, #0ea5e9, #38bdf8);
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

.table-card {
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.28);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
    background: linear-gradient(180deg, var(--color-card), var(--color-card-accent));
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

.status-warning {
    background: rgba(234, 179, 8, 0.15);
    color: #ca8a04;
}

@media (max-width: 768px) {
    .purchase-orders-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .purchase-orders-header__actions {
        width: 100%;
        justify-content: flex-start;
    }

    .action-buttons {
        flex-direction: column;
        width: 100%;
    }

    .action-button {
        width: 100%;
    }
}
</style>