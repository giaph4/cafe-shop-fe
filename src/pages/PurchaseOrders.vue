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

<style scoped lang="scss">
.purchase-orders-page {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
    padding-bottom: var(--spacing-12);
}

.purchase-orders-header {
    padding: var(--spacing-6);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border-soft);
    background: var(--color-card);
    box-shadow: var(--shadow-soft);
}

.purchase-orders-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-6);
    flex-wrap: wrap;
}

.purchase-orders-header__title-section {
    flex: 1;
    min-width: 0;
}

.purchase-orders-header__title {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-tight);
    margin-bottom: var(--spacing-1);
}

.purchase-orders-header__subtitle {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
}

.purchase-orders-header__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    flex-wrap: wrap;
    justify-content: flex-end;
}

.action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    justify-content: flex-end;
}

.delete-info-card {
    border: 1px dashed var(--color-primary-border-soft);
    background: var(--color-primary-soft);
    border-radius: var(--radius-lg);
    padding: var(--spacing-3);
}

.delete-info-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-3);
    margin-bottom: var(--spacing-2);
}

.delete-info-item:last-child {
    margin-bottom: 0;
}

.delete-info-label {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
}

.delete-info-value {
    color: var(--color-heading);
    font-size: var(--font-size-sm);
    text-align: right;
    flex: 1;
}

:deep(.modal-content) {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-2xl);
}

:deep(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-6);
    background: var(--color-card);
}

:deep(.modal-header .modal-title) {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-1);
}

:deep(.modal-header .modal-subtitle) {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
}

:deep(.modal-body) {
    padding: var(--spacing-6);
}

:deep(.modal-footer) {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-4) var(--spacing-6);
    background: var(--color-card);
}

.action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-md);
    border: 1px solid;
    background: var(--color-card);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-fast);
    white-space: nowrap;
}

.action-button--primary {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.action-button--primary:hover:not(:disabled) {
    background: var(--color-primary-soft);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.action-button--success {
    border-color: var(--color-success);
    color: var(--color-success);
    background: var(--color-card);
}

.action-button--success:hover:not(:disabled) {
    background: var(--color-success-soft);
    border-color: var(--color-success);
    color: var(--color-success);
}

.action-button--danger {
    border-color: var(--color-danger);
    color: var(--color-danger);
    background: var(--color-card);
}

.action-button--danger:hover:not(:disabled) {
    background: var(--color-danger-soft);
    border-color: var(--color-danger);
    color: var(--color-danger);
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

.variant-info .stat-icon {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
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

.table-card {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border-soft);
    box-shadow: var(--shadow-soft);
    background: var(--color-card);
}

.filter-card {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border-soft);
    box-shadow: var(--shadow-soft);
    background: var(--color-card);
}

.status-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-1);
    padding: var(--spacing-1) var(--spacing-3);
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

.status-warning {
    background: var(--color-warning-soft);
    color: var(--color-warning);
}

@media (max-width: 768px) {
    .purchase-orders-header {
        padding: var(--spacing-4);
    }

    .purchase-orders-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .purchase-orders-header__actions {
        width: 100%;
        justify-content: stretch;
    }

    .purchase-orders-header__actions .btn {
        flex: 1;
    }

    .action-buttons {
        flex-direction: column;
        width: 100%;
    }

    .action-button {
        width: 100%;
    }

    .stat-card {
        flex-direction: row;
    }
}
</style>