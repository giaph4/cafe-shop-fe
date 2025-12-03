<template>
    <Teleport to="body">
        <PurchaseOrderDetailModal :order-id="selectedOrderId" @close="selectedOrderId = null"/>
        <PurchaseOrderUpdateModal 
            ref="updateModal"
            :purchase-order-id="selectedOrderId"
            :purchase-order="selectedOrder"
            @updated="handleOrderUpdated"
        />

        <!-- Complete Order Confirmation Modal -->
        <div 
            class="modal fade" 
            id="completeOrderModal" 
            tabindex="-1" 
            ref="completeOrderModalElement" 
            aria-labelledby="completeOrderModalLabel"
            aria-hidden="true"
        >
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title" id="completeOrderModalLabel">Hoàn thành phiếu nhập</h5>
                            <p class="modal-subtitle mb-0">Xác nhận hoàn thành phiếu nhập hàng này.</p>
                        </div>
                        <button type="button" class="btn-close" @click="completeOrderBsModal?.hide()" :disabled="completeMutation.isPending.value" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p class="mb-3">Bạn có chắc chắn muốn hoàn thành phiếu nhập này không?</p>
                        <div v-if="orderToComplete" class="delete-info-card">
                            <div class="delete-info-item">
                                <span class="delete-info-label">Mã đơn:</span>
                                <span class="delete-info-value">#{{ orderToComplete.id }}</span>
                            </div>
                            <div class="delete-info-item">
                                <span class="delete-info-label">Nhà cung cấp:</span>
                                <span class="delete-info-value">{{ orderToComplete.supplierName || '—' }}</span>
                            </div>
                            <div class="delete-info-item">
                                <span class="delete-info-label">Tổng tiền:</span>
                                <span class="delete-info-value">{{ formatCurrency(orderToComplete.totalAmount) }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" @click="completeOrderBsModal?.hide()" :disabled="completeMutation.isPending.value">
                            Hủy
                        </button>
                        <button type="button" class="btn btn-success" @click="confirmCompleteOrder" :disabled="completeMutation.isPending.value">
                            <span v-if="completeMutation.isPending.value" class="spinner-border spinner-border-sm me-2"></span>
                            Hoàn thành
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Cancel Order Confirmation Modal -->
        <div 
            class="modal fade" 
            id="cancelOrderModal" 
            tabindex="-1" 
            ref="cancelOrderModalElement" 
            aria-labelledby="cancelOrderModalLabel"
            aria-hidden="true"
        >
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title" id="cancelOrderModalLabel">Hủy phiếu nhập</h5>
                            <p class="modal-subtitle mb-0">Hành động này không thể hoàn tác.</p>
                        </div>
                        <button type="button" class="btn-close" @click="cancelOrderBsModal?.hide()" :disabled="cancelMutation.isPending.value" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p class="mb-3">Bạn có chắc chắn muốn hủy phiếu nhập này không?</p>
                        <div v-if="orderToCancel" class="delete-info-card">
                            <div class="delete-info-item">
                                <span class="delete-info-label">Mã đơn:</span>
                                <span class="delete-info-value">#{{ orderToCancel.id }}</span>
                            </div>
                            <div class="delete-info-item">
                                <span class="delete-info-label">Nhà cung cấp:</span>
                                <span class="delete-info-value">{{ orderToCancel.supplierName || '—' }}</span>
                            </div>
                            <div class="delete-info-item">
                                <span class="delete-info-label">Tổng tiền:</span>
                                <span class="delete-info-value">{{ formatCurrency(orderToCancel.totalAmount) }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" @click="cancelOrderBsModal?.hide()" :disabled="cancelMutation.isPending.value">
                            Hủy
                        </button>
                        <button type="button" class="btn btn-danger" @click="confirmCancelOrder" :disabled="cancelMutation.isPending.value">
                            <span v-if="cancelMutation.isPending.value" class="spinner-border spinner-border-sm me-2"></span>
                            Xác nhận hủy
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>

    <div class="purchase-orders-page container-fluid">
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
                <div class="stat-card w-100" :class="stat.variant">
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
                <LoadingState v-if="isLoading || isSuppliersLoading" />
                <ErrorState 
                    v-else-if="isError" 
                    :message="errorMessage"
                    @retry="refetch"
                />
                <EmptyState
                    v-else-if="!tableData.length"
                    title="Chưa có phiếu nhập"
                    message="Tạo phiếu nhập mới bằng nút ở góc trên bên phải."
                />
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
                                    <button class="action-button action-button--primary" type="button"
                                            @click="selectedOrderId = order.id">
                                        <i class="bi bi-eye"></i>
                                        <span>Chi tiết</span>
                                    </button>
                                    <button class="action-button action-button--primary" type="button"
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
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="card-footer bg-transparent d-flex justify-content-end" v-if="supportsPagination && totalPages > 1">
                <Pagination mode="zero-based" :current-page="zeroBasedPage" :total-pages="totalPages"
                            @page-change="handlePageChange"/>
            </div>
        </div>
    </div>
</template>

<script setup>
import {computed, onMounted, reactive, ref} from 'vue'
import {Teleport} from 'vue'
import {Modal} from 'bootstrap'
import {useMutation, useQuery, useQueryClient} from '@tanstack/vue-query'

import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
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
const completeOrderModalElement = ref(null)
const completeOrderBsModal = ref(null)
const cancelOrderModalElement = ref(null)
const cancelOrderBsModal = ref(null)
const orderToComplete = ref(null)
const orderToCancel = ref(null)

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
    orderToComplete.value = order
    completeOrderBsModal.value?.show()
}

const confirmCompleteOrder = () => {
    if (!orderToComplete.value) return
    const order = orderToComplete.value
    completeOrderBsModal.value?.hide()
    completeMutation.mutate(order.id)
    orderToComplete.value = null
}

const handleCancel = (order) => {
    orderToCancel.value = order
    cancelOrderBsModal.value?.show()
}

const confirmCancelOrder = () => {
    if (!orderToCancel.value) return
    const order = orderToCancel.value
    cancelOrderBsModal.value?.hide()
    cancelMutation.mutate(order.id)
    orderToCancel.value = null
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

onMounted(() => {
    if (completeOrderModalElement.value) {
        completeOrderBsModal.value = new Modal(completeOrderModalElement.value)
    }
    if (cancelOrderModalElement.value) {
        cancelOrderBsModal.value = new Modal(cancelOrderModalElement.value)
    }
})
</script>

<style scoped>
/* Header - Chuẩn hóa theo base.css */
.purchase-orders-header {
    padding: var(--spacing-4);
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    box-shadow: var(--shadow-base);
    margin-bottom: var(--spacing-5);
}

.purchase-orders-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    flex-wrap: wrap;
}

.purchase-orders-header__title-section {
    flex: 1;
    min-width: 0;
}

.purchase-orders-header__title {
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    margin-bottom: var(--spacing-1);
}

.purchase-orders-header__subtitle {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
}

.purchase-orders-header__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    flex-wrap: wrap;
    justify-content: flex-end;
}

.purchase-orders-header__actions .btn {
    font-size: var(--font-size-base);
    padding: 8px 12px;
    border-radius: var(--radius-base);
    transition: all var(--transition-base);
}

.purchase-orders-header__actions .btn i {
    font-size: 18px;
    line-height: 1;
}

/* Stat Cards (KPI) - Chuẩn hóa theo base.css */
.stat-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    border-radius: var(--radius-base);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-base);
    height: 100%;
    min-height: 120px;
    transition: all var(--transition-base);
}

.stat-card:hover {
    box-shadow: var(--shadow-hover);
}

.stat-icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-base);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
    color: var(--color-primary);
    background: var(--color-bg-muted);
}

/* Màu icon - không dùng gradient, dùng màu nhạt */
.variant-primary .stat-icon {
    background: var(--color-bg-muted);
    color: var(--color-primary);
}

.variant-warning .stat-icon {
    background: var(--color-bg-muted);
    color: var(--color-warning);
}

.variant-success .stat-icon {
    background: var(--color-bg-muted);
    color: var(--color-success);
}

.variant-info .stat-icon {
    background: var(--color-bg-muted);
    color: var(--color-info);
}

.stat-label {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    margin-bottom: var(--spacing-2);
}

.stat-value {
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
}

/* Filter Card - Chuẩn hóa */
.filter-card {
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-base);
    background: var(--color-bg);
}

.filter-card :global(.card-body) {
    padding: var(--spacing-4);
}

.filter-card :global(.form-label) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text);
    margin-bottom: var(--spacing-2);
}

.filter-card :global(.form-control),
.filter-card :global(.form-select) {
    height: 40px;
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
}

.filter-card :global(.form-control:focus),
.filter-card :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
}

.filter-card :global(.btn) {
    font-size: var(--font-size-base);
    padding: 8px 12px;
    border-radius: var(--radius-base);
    transition: all var(--transition-base);
}

.filter-card :global(.btn i) {
    font-size: 18px;
    line-height: 1;
}

/* Table Card - Chuẩn hóa */
.table-card {
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-base);
    background: var(--color-bg);
}

.table-card :global(.card-body) {
    padding: 0;
}

.table-card :global(.card-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-bg);
}

.table-card :global(.table) {
    margin-bottom: 0;
}

.table-card :global(.table thead th) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
    background: var(--color-bg-muted);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-3) var(--spacing-4);
}

.table-card :global(.table tbody td) {
    font-size: var(--font-size-base);
    padding: var(--spacing-3) var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
}

.table-card :global(.table tbody tr:hover) {
    background: var(--color-bg-muted);
}

.table-card :global(.fw-semibold) {
    font-weight: var(--font-weight-semibold);
}

/* Status Badge - Chuẩn hóa */
.status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-base);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
}

.status-success {
    background: var(--color-bg-muted);
    color: var(--color-success);
    border: 1px solid var(--color-success);
}

.status-danger {
    background: var(--color-bg-muted);
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
}

.status-warning {
    background: var(--color-bg-muted);
    color: var(--color-warning);
    border: 1px solid var(--color-warning);
}

/* Action Buttons - Chuẩn hóa theo base.css */
.action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    justify-content: flex-end;
}

.action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-primary);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
    white-space: nowrap;
    cursor: pointer;
}

.action-button:hover:not(:disabled) {
    background: var(--color-primary);
    color: #ffffff;
    border-color: var(--color-primary);
}

.action-button:active:not(:disabled) {
    filter: brightness(0.95);
}

.action-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
}

.action-button i {
    font-size: 18px;
    line-height: 1;
}

.action-button--primary {
    border-color: var(--color-primary);
    background: var(--color-primary);
    color: #ffffff;
}

.action-button--primary:hover:not(:disabled) {
    filter: brightness(1.05);
}

.action-button--success {
    border-color: var(--color-success);
    background: var(--color-bg);
    color: var(--color-success);
}

.action-button--success:hover:not(:disabled) {
    background: var(--color-success);
    color: #ffffff;
    border-color: var(--color-success);
}

.action-button--danger {
    border-color: var(--color-danger);
    background: var(--color-bg);
    color: var(--color-danger);
}

.action-button--danger:hover:not(:disabled) {
    background: var(--color-danger);
    color: #ffffff;
    border-color: var(--color-danger);
}

/* Modal - Chuẩn hóa theo base.css */
.purchase-orders-page :global(.modal-content) {
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    box-shadow: var(--shadow-modal);
}

.purchase-orders-page :global(.modal-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg);
}

.purchase-orders-page :global(.modal-header .modal-title) {
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-1);
}

.purchase-orders-page :global(.modal-header .modal-subtitle) {
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
}

.purchase-orders-page :global(.modal-body) {
    padding: var(--spacing-5);
    background: var(--color-bg);
}

.purchase-orders-page :global(.modal-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-bg);
}

.purchase-orders-page :global(.modal-footer .btn) {
    padding: 8px 16px;
    border-radius: var(--radius-base);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
}

.purchase-orders-page :global(.modal-footer .btn-primary),
.purchase-orders-page :global(.modal-footer .btn-success) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: #ffffff;
}

.purchase-orders-page :global(.modal-footer .btn-success) {
    background: var(--color-success);
    border-color: var(--color-success);
}

.purchase-orders-page :global(.modal-footer .btn-primary:hover:not(:disabled)),
.purchase-orders-page :global(.modal-footer .btn-success:hover:not(:disabled)) {
    filter: brightness(1.05);
}

.purchase-orders-page :global(.modal-footer .btn-primary:disabled),
.purchase-orders-page :global(.modal-footer .btn-success:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

.purchase-orders-page :global(.modal-footer .btn-outline-secondary) {
    border-color: var(--color-border);
    color: var(--color-text);
    background: var(--color-bg);
}

.purchase-orders-page :global(.modal-footer .btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-bg-muted);
    border-color: var(--color-border-strong);
}

.purchase-orders-page :global(.modal-footer .btn-danger) {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: #ffffff;
}

.purchase-orders-page :global(.modal-footer .btn-danger:hover:not(:disabled)) {
    filter: brightness(1.05);
}

.purchase-orders-page :global(.modal-footer .btn-danger:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Delete Info Card - Chuẩn hóa */
.delete-info-card {
    padding: var(--spacing-4);
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    background: var(--color-bg-muted);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.delete-info-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-3);
}

.delete-info-label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    flex-shrink: 0;
    min-width: 120px;
}

.delete-info-value {
    font-size: var(--font-size-base);
    color: var(--color-text);
    text-align: right;
    word-break: break-word;
}

/* Responsive */
@media (max-width: 768px) {
    .purchase-orders-header__content {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-3);
    }

    .purchase-orders-header__actions {
        width: 100%;
        justify-content: flex-start;
    }

    .stat-card {
        flex-direction: column;
        text-align: center;
        min-height: auto;
    }

    .stat-icon {
        width: 48px;
        height: 48px;
        font-size: 20px;
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