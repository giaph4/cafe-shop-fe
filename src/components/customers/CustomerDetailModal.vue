<template>
  <Teleport to="body">
    <div
      ref="modalElement"
      class="modal fade customer-detail-modal"
      tabindex="-1"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-header__content">
              <h5 class="modal-title">
                Chi tiết khách hàng #{{ customerId }}
              </h5>
              <p class="modal-subtitle">
                Xem thông tin chi tiết, lịch sử mua hàng và thống kê của khách hàng.
              </p>
            </div>
            <button
              type="button"
              class="btn-close"
              aria-label="Đóng"
              @click="hide"
            />
          </div>
          <div class="modal-body">
            <LoadingState v-if="loading" />
            <ErrorState
              v-else-if="error"
              :message="error"
              :show-retry="false"
            />
            <template v-else-if="customer">
              <!-- Thông tin cơ bản -->
              <div class="info-section mb-4">
                <h6 class="section-title mb-3">
                  <i class="bi bi-person-circle me-2" />
                  Thông tin cơ bản
                </h6>
                <div class="row g-3">
                  <div class="col-md-6">
                    <div class="info-item">
                      <span class="info-label">Mã khách hàng:</span>
                      <span class="info-value">{{ customer.id }}</span>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="info-item">
                      <span class="info-label">Họ và tên:</span>
                      <span class="info-value">{{ customer.fullName }}</span>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="info-item">
                      <span class="info-label">Số điện thoại:</span>
                      <span class="info-value">{{ customer.phone || '—' }}</span>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="info-item">
                      <span class="info-label">Email:</span>
                      <span class="info-value">{{ customer.email || '—' }}</span>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="info-item">
                      <span class="info-label">Điểm thưởng:</span>
                      <span
                        class="info-value fw-bold"
                        style="color: var(--color-primary); font-family: var(--font-family-sans);"
                      >{{ formatLoyaltyPoints(customer.loyaltyPoints) }} điểm</span>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="info-item">
                      <span class="info-label">Ngày tạo:</span>
                      <span class="info-value text-muted">{{ formatDate(customer.createdAt) }}</span>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="info-item">
                      <span class="info-label">Cập nhật lần cuối:</span>
                      <span class="info-value text-muted">{{ formatDate(customer.updatedAt) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Thống kê -->
              <div class="info-section mb-4">
                <h6 class="section-title mb-3">
                  <i class="bi bi-graph-up me-2" />
                  Thống kê
                </h6>
                <div class="row g-3">
                  <div class="col-md-6">
                    <div class="stat-box">
                      <div class="stat-icon stat-icon--purple">
                        <i class="bi bi-receipt" />
                      </div>
                      <div class="stat-info">
                        <div class="stat-label">
                          Tổng đơn hàng
                        </div>
                        <div class="stat-value">
                          {{ summary.totalOrders }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="stat-box">
                      <div class="stat-icon stat-icon--green">
                        <i class="bi bi-cash-stack" />
                      </div>
                      <div class="stat-info">
                        <div class="stat-label">
                          Tổng chi tiêu
                        </div>
                        <div class="stat-value">
                          {{ formatCurrency(summary.totalAmount) }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="stat-box">
                      <div class="stat-icon stat-icon--blue">
                        <i class="bi bi-graph-up-arrow" />
                      </div>
                      <div class="stat-info">
                        <div class="stat-label">
                          Giá trị TB/đơn
                        </div>
                        <div class="stat-value">
                          {{ formatCurrency(summary.averageOrderValue) }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="stat-box">
                      <div class="stat-icon stat-icon--yellow">
                        <i class="bi bi-calendar-check" />
                      </div>
                      <div class="stat-info">
                        <div class="stat-label">
                          Đơn gần nhất
                        </div>
                        <div class="stat-value small">
                          {{ formatDate(summary.lastPurchaseDate) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Lịch sử đơn hàng -->
              <div class="info-section">
                <h6 class="section-title mb-3">
                  <i class="bi bi-clock-history me-2" />
                  Lịch sử mua hàng
                </h6>
                <LoadingState v-if="ordersLoading" />
                <ErrorState
                  v-else-if="ordersError"
                  :message="ordersError"
                  :show-retry="false"
                />
                <template v-else>
                  <EmptyState
                    v-if="orders.length === 0"
                    title="Chưa có đơn hàng"
                    message="Khách hàng này chưa có đơn hàng nào."
                  >
                    <template #icon>
                      <i class="bi bi-receipt-cutoff" />
                    </template>
                  </EmptyState>
                  <div v-else>
                    <div class="orders-list">
                      <div
                        v-for="order in orders"
                        :key="order.id"
                        class="order-item"
                      >
                        <div class="d-flex justify-content-between align-items-start">
                          <div class="flex-grow-1">
                            <div class="fw-semibold">
                              Đơn #{{ order.id }}
                            </div>
                            <div class="small text-muted">
                              {{ order.tableName || 'Mang về' }} • {{ formatDateTime(order.createdAt) }}
                            </div>
                            <div class="mt-1">
                              <span
                                class="badge badge-status"
                                :class="getStatusBadgeClass(order.status)"
                              >
                                {{ getStatusLabel(order.status) }}
                              </span>
                            </div>
                          </div>
                          <div class="text-end">
                            <div
                              class="fw-semibold"
                              style="color: var(--color-primary); font-family: var(--font-family-sans);"
                            >
                              {{ formatCurrency(order.totalAmount) }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <!-- Pagination cho lịch sử đơn hàng -->
                    <div
                      v-if="ordersTableData.totalPages > 1 || ordersTableData.pageSize"
                      class="d-flex justify-content-between align-items-center mt-4"
                    >
                      <!-- Page Size Selector -->
                      <div
                        v-if="ordersTableData.pageSize"
                        class="d-flex align-items-center gap-2"
                      >
                        <label
                          class="mb-0 text-muted small"
                          style="font-family: var(--font-family-sans);"
                        >
                          Hiển thị:
                        </label>
                        <select
                          :value="ordersTableData.pageSize"
                          class="form-select form-select-sm"
                          style="width: auto; min-width: 80px; font-family: var(--font-family-sans);"
                          @change="handleOrdersPageSizeChange(parseInt($event.target.value, 10))"
                        >
                          <option :value="10">
                            10
                          </option>
                          <option :value="20">
                            20
                          </option>
                          <option :value="30">
                            30
                          </option>
                          <option :value="50">
                            50
                          </option>
                        </select>
                        <span
                          class="text-muted small"
                          style="font-family: var(--font-family-sans);"
                        >
                          / trang
                        </span>
                      </div>
                      <div v-else />
                      <!-- Pagination -->
                      <Pagination
                        v-if="ordersTableData.totalPages > 1"
                        mode="zero-based"
                        :current-page="ordersTableData.zeroBasedPage"
                        :total-pages="ordersTableData.totalPages"
                        @page-change="ordersTableData.setPage"
                      />
                    </div>
                  </div>
                </template>
              </div>
            </template>
            <EmptyState
              v-else
              title="Không tìm thấy khách hàng"
              message="Không tìm thấy thông tin khách hàng."
            >
              <template #icon>
                <i class="bi bi-person-x" />
              </template>
            </EmptyState>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="hide"
            >
              Đóng
            </button>
            <button
              v-if="customer"
              type="button"
              class="btn btn-primary"
              @click="handleEdit"
            >
              <i class="bi bi-pencil me-2" />
              Chỉnh sửa
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { Modal } from 'bootstrap'
import { getCustomerById, getCustomerPurchaseHistory } from '@/api/customerService'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import logger from '@/utils/logger'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useTableData } from '@/composables/useTableData'
import Pagination from '@/components/common/Pagination.vue'

const props = defineProps({
    customerId: {
        type: [Number, String],
        default: null
    }
})

const emit = defineEmits(['close', 'edit'])

const modalElement = ref(null)
let modalInstance = null

const customer = ref(null)
const summary = ref({
    totalOrders: 0,
    totalAmount: 0,
    averageOrderValue: 0,
    lastPurchaseDate: null
})
const loading = ref(false)
const error = ref(null)

// Sử dụng useTableData cho lịch sử đơn hàng
const ordersTableData = useTableData({
    fetchFn: async (params) => {
        if (!props.customerId) return { content: [], totalPages: 0, totalElements: 0 }
        return await getCustomerPurchaseHistory({
            id: props.customerId,
            page: params.page,
            size: params.size
        })
    },
    initialPageSize: 10,
    debounceMs: 300,
    syncUrl: false, // Không sync URL cho modal
    zeroBasedPage: true
})

// Computed để tính toán summary từ orders
const orders = computed(() => ordersTableData.data.value || [])
const ordersLoading = computed(() => ordersTableData.loading.value)
const ordersError = computed(() => {
    const err = ordersTableData.error.value
    return err && typeof err === 'object' ? err.message : err
})

const STATUS_METADATA = {
    PENDING: { label: 'Đang chờ', badgeClass: 'badge-status--warning' },
    PAID: { label: 'Đã thanh toán', badgeClass: 'badge-status--success' },
    CANCELLED: { label: 'Đã hủy', badgeClass: 'badge-status--danger' },
    TRANSFERRED: { label: 'Đã chuyển ca', badgeClass: 'badge-status--info' }
}

const fetchCustomerDetails = async () => {
    if (!props.customerId) {
        customer.value = null
        return
    }

    loading.value = true
    error.value = null
    try {
        const response = await getCustomerById(props.customerId)
        customer.value = response
        // Refresh orders khi customer được load
        ordersTableData.refresh()
    } catch (err) {
        logger.error('Failed to fetch customer details:', err)
        error.value = err?.response?.data?.message || 'Không thể tải thông tin chi tiết khách hàng.'
        customer.value = null
    } finally {
        loading.value = false
    }
}

// Watch orders để tính toán summary
watch(
    () => ordersTableData.data.value,
    (ordersList) => {
        if (!ordersList || !Array.isArray(ordersList)) {
            summary.value = {
                totalOrders: 0,
                totalAmount: 0,
                averageOrderValue: 0,
                lastPurchaseDate: null
            }
            return
        }

        // Tính toán thống kê từ tất cả orders (có thể cần fetch all nếu có nhiều trang)
        const paidOrders = ordersList.filter(o => o.status === 'PAID')
        summary.value.totalOrders = ordersList.length
        summary.value.totalAmount = paidOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
        summary.value.averageOrderValue = paidOrders.length > 0 ? summary.value.totalAmount / paidOrders.length : 0

        if (ordersList.length > 0) {
            const sortedByDate = [...ordersList].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            summary.value.lastPurchaseDate = sortedByDate[0].createdAt
        } else {
            summary.value.lastPurchaseDate = null
        }
    },
    { immediate: true, deep: true }
)

const formatDate = (value) => {
    if (!value) return '—'
    return formatDateTime(value)
}

const formatLoyaltyPoints = (points) => {
    const numeric = Number(points)
    if (!Number.isFinite(numeric)) return '0'
    return numeric.toLocaleString('vi-VN')
}

const getStatusLabel = (status) => STATUS_METADATA[status]?.label || status

const getStatusBadgeClass = (status) => STATUS_METADATA[status]?.badgeClass || 'badge-status--default'

const handleEdit = () => {
    if (customer.value) {
        emit('edit', customer.value)
        hide()
    }
}

const handleOrdersPageSizeChange = (size) => {
    ordersTableData.setPageSize(size)
    ordersTableData.setPage(0) // Reset về trang đầu khi đổi pageSize
}

const show = () => {
    if (modalInstance) {
        modalInstance.show()
        fetchCustomerDetails()
        // Refresh orders khi modal mở
        if (props.customerId) {
            ordersTableData.refresh()
        }
    }
}

const hide = () => {
    if (modalInstance) {
        modalInstance.hide()
    }
    emit('close')
}

watch(() => props.customerId, (newId) => {
    if (newId && modalInstance?._isShown) {
        fetchCustomerDetails()
        // Reset và refresh orders khi customerId thay đổi
        ordersTableData.goToFirst()
        ordersTableData.refresh()
    }
})

onMounted(() => {
    modalInstance = new Modal(modalElement.value, { backdrop: 'static' })
})

onBeforeUnmount(() => {
    if (modalInstance) {
        modalInstance.dispose()
        modalInstance = null
    }
})

defineExpose({ show, hide })
</script>

<style scoped>
/* Customer Detail Modal - Chuẩn hóa theo base.css */
.customer-detail-modal :global(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-modal);
}

.customer-detail-modal :global(.modal-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
}

.modal-header__content {
    flex: 1;
    min-width: 0;
}

.customer-detail-modal :global(.modal-header .modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.modal-subtitle {
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    margin-bottom: 0;
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.customer-detail-modal :global(.modal-body) {
    padding: var(--spacing-5);
    background: var(--color-card);
    max-height: 70vh;
    overflow-y: auto;
}

.customer-detail-modal :global(.modal-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
    gap: var(--spacing-2);
    justify-content: flex-end;
}

/* Info Section - Chuẩn hóa */
.info-section {
    padding-bottom: var(--spacing-5);
    border-bottom: 1px solid var(--color-border);
    margin-bottom: var(--spacing-5);
}

.info-section:last-of-type {
    border-bottom: none;
    padding-bottom: 0;
    margin-bottom: 0;
}

.section-title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: var(--spacing-3);
    font-family: var(--font-family-sans);
}

.section-title i {
    font-size: 18px;
    line-height: 1;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.info-label {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.info-value {
    font-size: var(--font-size-base);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-semibold);
}

/* Stat Box - Chuẩn hóa */
.stat-box {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    transition: all var(--transition-base);
}

.stat-box:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

.stat-icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 24px;
    color: var(--color-primary);
    background: var(--color-card-muted);
}

/* Màu icon - không dùng gradient, dùng màu nhạt */
.stat-icon--purple {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.stat-icon--green {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.stat-icon--blue {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.stat-icon--yellow {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.stat-info {
    flex: 1;
    min-width: 0;
}

.stat-label {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-2);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.stat-value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.stat-value.small {
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

/* Orders List - Chuẩn hóa */
.orders-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.order-item {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
    transition: all var(--transition-base);
}

.order-item:hover {
    background: var(--color-card);
    border-color: var(--color-primary);
}

/* Badge - Chuẩn hóa */
/* Base Badge - Tiêu chuẩn đồng bộ */
.customer-detail-modal :global(.badge) {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    border: 1px solid;
    white-space: nowrap;
    line-height: 1.4;
}

/* Status Badges - Tiêu chuẩn đồng bộ */
.badge-status--success {
    background: rgba(34, 197, 94, 0.18);
    border-color: #22c55e;
    color: #22c55e;
}

.badge-status--warning {
    background: rgba(251, 191, 36, 0.18);
    border-color: #f59e0b;
    color: #f59e0b;
}

.badge-status--danger {
    background: rgba(244, 63, 94, 0.18);
    border-color: #ef4444;
    color: #ef4444;
}

.badge-status--info {
    background: rgba(14, 165, 233, 0.18);
    border-color: #0ea5e9;
    color: #0ea5e9;
}

.badge-status--default {
    background: var(--color-card-muted);
    border-color: var(--color-border);
    color: var(--color-text-muted);
}

/* Error message - không dùng alert */
.error-message {
    padding: var(--spacing-3) var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-warning);
    background: var(--color-soft-amber);
    color: var(--color-warning);
    font-size: var(--font-size-base);
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.error-message i {
    font-size: 18px;
    line-height: 1;
}

/* Buttons - Chuẩn hóa */
.customer-detail-modal :global(.btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-family-sans);
}

.customer-detail-modal :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.customer-detail-modal :global(.btn-primary i) {
    font-size: 18px;
    line-height: 1;
}

.customer-detail-modal :global(.btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    border-radius: var(--radius-sm);
    padding: 8px 16px;
    color: var(--color-primary);
    background: var(--color-card);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.customer-detail-modal :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

/* Responsive */
@media (max-width: 768px) {
    .customer-detail-modal :global(.modal-dialog) {
        max-width: 90%;
        margin: var(--spacing-4) auto;
    }

    .customer-detail-modal :global(.modal-body) {
        padding: var(--spacing-4);
    }

    .stat-box {
        flex-direction: column;
        text-align: center;
    }

    .stat-icon {
        width: 48px;
        height: 48px;
        font-size: 20px;
    }
}
</style>
