<template>
  <div   >
    <Teleport to="body">
      <div
        id="completeOrderModal"
        ref="completeOrderModalElement"
        class="modal fade"
          
        tabindex="-1"
        aria-labelledby="completeOrderModalLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <div>
                <h5
                  id="completeOrderModalLabel"
                  class="modal-title"
                >
                  Hoàn thành phiếu nhập
                </h5>
                <p class="modal-subtitle mb-0">
                  Xác nhận hoàn thành phiếu nhập hàng này.
                </p>
              </div>
              <button
                type="button"
                class="btn-close"
                :disabled="completeMutation.isPending.value"
                aria-label="Close"
                @click="completeOrderBsModal?.hide()"
              />
            </div>
            <div class="modal-body">
              <p class="mb-3">
                Bạn có chắc chắn muốn hoàn thành phiếu nhập này không?
              </p>
              <div
                v-if="orderToComplete"
                class="delete-info-card"
              >
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
                  <span class="delete-info-value">{{ formatCurrency(orderToComplete.totalAmount)
                  }}</span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-secondary"
                :disabled="completeMutation.isPending.value"
                @click="completeOrderBsModal?.hide()"
              >
                Hủy
              </button>
              <button
                type="button"
                class="btn btn-success"
                :disabled="completeMutation.isPending.value"
                @click="confirmCompleteOrder"
              >
                <span
                  v-if="completeMutation.isPending.value"
                  class="spinner-border spinner-border-sm me-2"
                />
                Hoàn thành
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Cancel Order Confirmation Modal -->
      <div
        id="cancelOrderModal"
        ref="cancelOrderModalElement"
        class="modal fade"
        tabindex="-1"
        aria-labelledby="cancelOrderModalLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <div>
                <h5
                  id="cancelOrderModalLabel"
                  class="modal-title"
                >
                  Hủy phiếu nhập
                </h5>
                <p class="modal-subtitle mb-0">
                  Hành động này không thể hoàn tác.
                </p>
              </div>
              <button
                type="button"
                class="btn-close"
                :disabled="cancelMutation.isPending.value"
                aria-label="Close"
                @click="cancelOrderBsModal?.hide()"
              />
            </div>
            <div class="modal-body">
              <p class="mb-3">
                Bạn có chắc chắn muốn hủy phiếu nhập này không?
              </p>
              <div
                v-if="orderToCancel"
                class="delete-info-card"
              >
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
                  <span class="delete-info-value">{{ formatCurrency(orderToCancel.totalAmount)
                  }}</span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-secondary"
                :disabled="cancelMutation.isPending.value"
                @click="cancelOrderBsModal?.hide()"
              >
                Hủy
              </button>
              <button
                type="button"
                class="btn btn-danger"
                :disabled="cancelMutation.isPending.value"
                @click="confirmCancelOrder"
              >
                <span
                  v-if="cancelMutation.isPending.value"
                  class="spinner-border spinner-border-sm me-2"
                />
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <div
      class="page-container container-fluid"
    >
      <div class="purchase-orders-header">
        <div class="purchase-orders-header__content">
          <div class="purchase-orders-header__title-section">
            <h2 class="purchase-orders-header__title">
              Quản lý Nhập hàng
            </h2>
            <p class="purchase-orders-header__subtitle">
              Theo dõi tiến độ xử lý, trạng thái và chi phí nhập
              kho.
            </p>
          </div>
          <div class="purchase-orders-header__actions">
            <button
              class="btn btn-outline-secondary btn-sm"
              type="button"
              :disabled="tableData.loading.value"
              @click="tableData.fetchData"
            >
              <span
                v-if="tableData.loading.value"
                class="spinner-border spinner-border-sm me-2"
              />
              Làm mới
            </button>
            <router-link
              to="/purchase-orders/new"
              class="btn btn-primary btn-sm"
            >
              <i class="bi bi-plus-lg me-2" />Tạo đơn nhập hàng
            </router-link>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-4 mt-1">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="col-sm-6 col-lg-3 d-flex"
        >
          <div
            class="stat-card w-100"
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
            <div class="col-12 col-lg-3 col-md-6">
              <label class="form-label">Nhà cung cấp</label>
              <select
                v-model="filters.supplierId"
                class="form-select"
              >
                <option value="">
                  Tất cả
                </option>
                <option
                  v-for="supplier in supplierOptions"
                  :key="supplier.id"
                  :value="supplier.id"
                >
                  {{ supplier.name }}
                </option>
              </select>
            </div>
            <div class="col-12 col-lg-3 col-md-6">
              <label class="form-label">Trạng thái</label>
              <select
                v-model="filters.status"
                class="form-select"
              >
                <option value="">
                  Tất cả
                </option>
                <option value="PENDING">
                  Đang chờ xử lý
                </option>
                <option value="COMPLETED">
                  Đã hoàn thành
                </option>
                <option value="CANCELLED">
                  Đã huỷ
                </option>
              </select>
            </div>
            <div class="col-12 col-lg-2 col-md-4">
              <label class="form-label">Từ ngày</label>
              <input
                v-model="filters.startDate"
                type="date"
                class="form-control"
              >
            </div>
            <div class="col-12 col-lg-2 col-md-4">
              <label class="form-label">Đến ngày</label>
              <input
                v-model="filters.endDate"
                type="date"
                class="form-control"
              >
            </div>
            <div class="col-12 col-lg-2 col-md-4">
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
            <div class="col-12 d-flex justify-content-end">
              <button
                class="btn btn-outline-secondary btn-sm"
                type="button"
                :disabled="isResetDisabled"
                @click="resetFilters"
              >
                <i class="bi bi-arrow-counterclockwise me-1" />Đặt lại lọc
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="card table-card">
        <div class="card-body p-0">
          <LoadingState v-if="tableData.loading.value || isSuppliersLoading" />
          <ErrorState
            v-else-if="tableData.error.value"
            :message="errorMessage"
            @retry="tableData.fetchData"
          />
          <EmptyState
            v-else-if="!orders.length"
            title="Chưa có phiếu nhập"
            message="Tạo phiếu nhập mới bằng nút ở góc trên bên phải."
          />
          <div
            v-else
            class="table-responsive"
          >
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th scope="col">
                    Mã đơn
                  </th>
                  <th scope="col">
                    Nhà cung cấp
                  </th>
                  <th scope="col">
                    Người tạo
                  </th>
                  <th scope="col">
                    Ngày đặt
                  </th>
                  <th
                    scope="col"
                    class="text-center"
                  >
                    Trạng thái
                  </th>
                  <th
                    scope="col"
                    class="text-end"
                  >
                    Tổng tiền
                  </th>
                  <th
                    scope="col"
                    class="text-end"
                  >
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="order in orders"
                  :key="order.id"
                >
                  <td class="fw-semibold">
                    #{{ order.id }}
                  </td>
                  <td>{{ order.supplierName }}</td>
                  <td>{{ order.staffUsername }}</td>
                  <td>{{ formatDateTime(order.orderDate) || '—' }}</td>
                  <td class="text-center">
                    <span
                      class="status-badge"
                      :class="statusBadgeClass(order.status)"
                    >
                      {{ statusLabel(order.status) }}
                    </span>
                  </td>
                  <td class="text-end fw-semibold">
                    {{ formatCurrency(order.totalAmount) }}
                  </td>
                  <td class="text-end">
                    <div class="action-buttons">
                      <button
                        class="action-button action-button--primary"
                        type="button"
                        @click="selectedOrderId = order.id"
                      >
                        <i class="bi bi-eye" />
                        <span>Chi tiết</span>
                      </button>
                      <button
                        v-if="order.status === 'PENDING'"
                        class="action-button action-button--primary"
                        type="button"
                        @click="handleUpdate(order)"
                      >
                        <i class="bi bi-pencil" />
                        <span>Chỉnh sửa</span>
                      </button>
                      <button
                        v-if="order.status === 'PENDING'"
                        class="action-button action-button--success"
                        type="button"
                        :disabled="completeMutation.isPending.value"
                        @click="handleComplete(order)"
                      >
                        <i class="bi bi-check2" />
                        <span>Hoàn thành</span>
                      </button>
                      <button
                        v-if="order.status === 'PENDING'"
                        class="action-button action-button--danger"
                        type="button"
                        :disabled="cancelMutation.isPending.value"
                        @click="handleCancel(order)"
                      >
                        <i class="bi bi-x" />
                        <span>Hủy</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div
          v-if="supportsPagination && totalPages > 1"
          class="card-footer bg-transparent d-flex justify-content-end"
        >
          <Pagination
            mode="zero-based"
            :current-page="zeroBasedPage"
            :total-pages="totalPages"
            @page-change="handlePageChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, Teleport } from 'vue'
import { Modal } from 'bootstrap'
import { useMutation, useQuery } from '@tanstack/vue-query'

import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Pagination from '@/components/common/Pagination.vue'
import { useTableData } from '@/composables/useTableData'
import { showSuccess } from '@/utils/toast'
import { useErrorHandler } from '@/composables/useErrorHandler'

const { handleError, extractErrorMessage } = useErrorHandler({ context: 'PurchaseOrders' })
import { formatCurrency, formatDateTime, formatNumber } from '@/utils/formatters'
import { getSuppliers } from '@/api/supplierService'
import { getPurchaseOrders, markOrderAsCompleted, cancelPurchaseOrder } from '@/api/purchaseOrderService'

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

const filters = reactive({ ...DEFAULT_FILTERS })

const pageSizeOptions = [10, 25, 50]

// Sử dụng useTableData cho phân trang và tìm kiếm
const tableData = useTableData({
    fetchFn: async (params) => {
        const sanitizedFilters = {
            supplierId: filters.supplierId ? Number(filters.supplierId) : undefined,
            status: filters.status || undefined,
            startDate: filters.startDate || undefined,
            endDate: filters.endDate || undefined
        }
        return await getPurchaseOrders({
            page: params.page,
            size: params.size,
            ...sanitizedFilters
        })
    },
    initialPageSize: pageSizeOptions[0],
    debounceMs: 300,
    syncUrl: true,
    pageParam: 'page',
    sizeParam: 'size',
    zeroBasedPage: true
})

// Expose pagination properties
const zeroBasedPage = computed(() => tableData.zeroBasedPage.value)
const pageSize = computed(() => tableData.pageSize.value)
const totalPages = computed(() => tableData.totalPages.value)
const totalElements = computed(() => tableData.totalElements.value)
const supportsPagination = computed(() => tableData.supportsPagination.value)
const setPage = (page) => tableData.setPage(page)
const updatePageSize = (size) => tableData.setPageSize(size)

// Suppliers query (giữ nguyên vì không liên quan đến pagination)
const suppliersQuery = useQuery({
    queryKey: ['suppliers', { page: 0, size: 100 }],
    queryFn: ({ queryKey }) => {
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

const isSuppliersLoading = computed(() => suppliersQuery.isLoading.value || suppliersQuery.isFetching.value)

// Lấy dữ liệu từ useTableData
const orders = computed(() => tableData.data.value || [])

const stats = computed(() => {
    const pendingCount = orders.value.filter((order) => order.status === 'PENDING').length
    const completedCount = orders.value.filter((order) => order.status === 'COMPLETED').length
    const totalAmount = orders.value.reduce((sum, order) => sum + Number(order.totalAmount ?? 0), 0)

    return [
        {
            label: 'Tổng phiếu nhập',
            value: formatNumber(totalElements.value, { maximumFractionDigits: 0 }),
            icon: 'bi bi-box-seam',
            variant: 'variant-primary'
        },
        {
            label: 'Đang chờ xử lý',
            value: formatNumber(pendingCount, { maximumFractionDigits: 0 }),
            icon: 'bi bi-hourglass-split',
            variant: 'variant-warning'
        },
        {
            label: 'Đã hoàn thành',
            value: formatNumber(completedCount, { maximumFractionDigits: 0 }),
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
    const err = tableData.error.value
    if (!err) return ''
    return extractErrorMessage(err) || 'Không thể tải dữ liệu phiếu nhập.'
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
        tableData.fetchData() // Refresh data
    },
    onError: (err) => handleError(err, 'Không thể hoàn thành phiếu nhập.')
})

const cancelMutation = useMutation({
    mutationFn: cancelPurchaseOrder,
    onSuccess: (data) => {
        showSuccess(`Đơn nhập #${data.id} đã được huỷ.`)
        tableData.fetchData() // Refresh data
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


const handlePageChange = (page) => {
    setPage(page)
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
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    margin-bottom: var(--spacing-4);
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
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.purchase-orders-header__subtitle {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
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
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.purchase-orders-header__actions .btn-primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.purchase-orders-header__actions .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-dark);
}

.purchase-orders-header__actions .btn-outline-secondary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.purchase-orders-header__actions .btn-outline-secondary:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.purchase-orders-header__actions .btn i {
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
.variant-primary .stat-icon {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.variant-warning .stat-icon {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.variant-success .stat-icon {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.variant-info .stat-icon {
    background: var(--color-soft-blue);
    color: var(--color-info);
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

.filter-card :global(.btn) {
    font-size: var(--font-size-base);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.filter-card :global(.btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.filter-card :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.filter-card :global(.btn i) {
    font-size: 18px;
    line-height: 1;
}

/* Table Card - Minimal Table Styling */
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

/* Status Badge - Flat Design */
.status-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-1);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-sm);
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

.status-warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
    border-color: var(--color-warning);
}

/* Action Buttons - Flat Design */
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
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
    white-space: nowrap;
    cursor: pointer;
    font-family: var(--font-family-sans);
}

.action-button i {
    font-size: 16px;
    line-height: 1;
}

.action-button--primary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.action-button--primary:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.action-button--primary:active:not(:disabled) {
    background: var(--color-card-muted);
}

.action-button--success {
    border-color: var(--color-border);
    color: var(--color-success);
    background: var(--color-card);
}

.action-button--success:hover:not(:disabled) {
    background: var(--color-soft-emerald);
    border-color: var(--color-success);
    color: var(--color-success);
}

.action-button--success:active:not(:disabled) {
    background: var(--color-soft-emerald);
}

.action-button--danger {
    border-color: var(--color-border);
    color: var(--color-danger);
    background: var(--color-card);
}

.action-button--danger:hover:not(:disabled) {
    background: var(--color-soft-rose);
    border-color: var(--color-danger);
    color: var(--color-danger);
}

.action-button--danger:active:not(:disabled) {
    background: var(--color-soft-rose);
}

.action-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
}

/* Modal - Chuẩn hóa theo base.css */
.purchase-orders-page :global(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.purchase-orders-page :global(.modal-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
}

.purchase-orders-page :global(.modal-header .modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

.purchase-orders-page :global(.modal-header .modal-subtitle) {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    margin-top: var(--spacing-1);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

.purchase-orders-page :global(.modal-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.purchase-orders-page :global(.modal-body p) {
    font-family: var(--font-family-sans);
}

.purchase-orders-page :global(.modal-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
}

.purchase-orders-page :global(.modal-footer .btn) {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.purchase-orders-page :global(.modal-footer .btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.purchase-orders-page :global(.modal-footer .btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.purchase-orders-page :global(.modal-footer .btn-success) {
    background: var(--color-success);
    border-color: var(--color-success);
    color: var(--color-text-inverse);
}

.purchase-orders-page :global(.modal-footer .btn-success:hover:not(:disabled)) {
    background: var(--color-success-dark);
}

.purchase-orders-page :global(.modal-footer .btn-primary:disabled),
.purchase-orders-page :global(.modal-footer .btn-success:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

.purchase-orders-page :global(.modal-footer .btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.purchase-orders-page :global(.modal-footer .btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.purchase-orders-page :global(.modal-footer .btn-danger) {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-text-inverse);
}

.purchase-orders-page :global(.modal-footer .btn-danger:hover:not(:disabled)) {
    background: var(--color-danger-dark);
}

.purchase-orders-page :global(.modal-footer .btn-danger:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Delete Info Card - Chuẩn hóa */
.delete-info-card {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
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
    font-family: var(--font-family-sans);
}

.delete-info-value {
    font-size: var(--font-size-base);
    color: var(--color-heading);
    text-align: right;
    word-break: break-word;
    font-family: var(--font-family-sans);
}

/* Global Button Styles - Đồng bộ với các trang trước */
.purchase-orders-page :global(.btn-primary) {
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

.purchase-orders-page :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.purchase-orders-page :global(.btn-primary:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

.purchase-orders-page :global(.btn-primary i) {
    font-size: 18px;
    line-height: 1;
}

.purchase-orders-page :global(.btn-outline-primary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.purchase-orders-page :global(.btn-outline-primary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.purchase-orders-page :global(.btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.purchase-orders-page :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.purchase-orders-page :global(.btn-danger) {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-text-inverse);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.purchase-orders-page :global(.btn-danger:hover:not(:disabled)) {
    background: var(--color-danger-dark);
}

.purchase-orders-page :global(.btn-success) {
    background: var(--color-success);
    border-color: var(--color-success);
    color: var(--color-text-inverse);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.purchase-orders-page :global(.btn-success:hover:not(:disabled)) {
    background: var(--color-success-dark);
}

.purchase-orders-page :global(.btn-sm) {
    padding: var(--spacing-1) var(--spacing-3);
    font-size: var(--font-size-sm);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
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
