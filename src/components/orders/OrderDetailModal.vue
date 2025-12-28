<template>
  <Teleport to="body">
    <div
      ref="modal"
      class="modal fade order-detail-modal"
      tabindex="-1"
      aria-labelledby="orderDetailModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered modal-fullscreen-lg-down modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-header__content">
              <h5
                id="orderDetailModalLabel"
                class="modal-title"
              >
                Chi tiết đơn hàng #{{ order?.id }}
              </h5>
              <p class="modal-subtitle">
                Xem thông tin chi tiết và in hóa đơn cho đơn hàng.
              </p>
            </div>
            <div class="modal-header__actions">
              <button
                v-if="order?.status === 'PAID'"
                class="btn btn-outline-primary btn-sm"
                type="button"
                :disabled="printing"
                @click="printInvoice"
              >
                <span
                  v-if="printing"
                  class="spinner-border spinner-border-sm me-2"
                />
                <i
                  v-else
                  class="bi bi-printer me-2"
                />
                In hóa đơn
              </button>
              <button
                type="button"
                class="btn-close"
                aria-label="Đóng"
                @click="hide"
              />
            </div>
          </div>
          <div class="modal-body">
            <LoadingState v-if="loading" />
            <ErrorState
              v-else-if="error"
              :message="error"
              :show-retry="false"
            />
            <template v-else-if="order">
              <div class="order-detail__layout">
                <!-- Left Column: Info Cards -->
                <div class="order-detail__left-column">
                  <div class="order-detail__info-card order-detail__info-card--highlight">
                    <div class="order-detail__info-header">
                      <h6 class="order-detail__info-title">
                        <i class="bi bi-receipt me-2" />
                        Đơn hàng #{{ order.id }}
                      </h6>
                      <span
                        class="badge badge-status badge-status--large"
                        :class="getStatusBadgeClass(order.status)"
                      >
                        {{ getStatusLabel(order.status) }}
                      </span>
                    </div>
                    <div class="order-detail__info-grid-compact">
                      <div class="order-detail__info-item-compact">
                        <span class="order-detail__info-label-compact">Loại đơn:</span>
                        <span
                          class="badge badge-type"
                          :class="order.type === 'TAKE_AWAY' ? 'badge-type--secondary' : 'badge-type--primary'"
                        >
                          {{ order.type === 'TAKE_AWAY' ? 'Mang đi' : 'Tại quán' }}
                        </span>
                      </div>
                      <div class="order-detail__info-item-compact">
                        <span class="order-detail__info-label-compact">Bàn:</span>
                        <span class="order-detail__info-value-compact">{{ order.tableName || (order.type === 'TAKE_AWAY' ? 'Mang về' : '—') }}</span>
                      </div>
                      <div class="order-detail__info-item-compact">
                        <span class="order-detail__info-label-compact">Nhân viên:</span>
                        <span class="order-detail__info-value-compact">{{ order.staffUsername || '—' }}</span>
                      </div>
                      <div class="order-detail__info-item-compact">
                        <span class="order-detail__info-label-compact">Khách hàng:</span>
                        <span class="order-detail__info-value-compact">{{ order.customerName || 'Khách lẻ' }}</span>
                      </div>
                      <div
                        v-if="order.customerPhone"
                        class="order-detail__info-item-compact"
                      >
                        <span class="order-detail__info-label-compact">Điện thoại:</span>
                        <span class="order-detail__info-value-compact">{{ order.customerPhone }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="order-detail__info-card">
                    <h6 class="order-detail__info-title">
                      <i class="bi bi-credit-card me-2" />
                      Thanh toán
                    </h6>
                    <div class="order-detail__info-grid-compact">
                      <div class="order-detail__info-item-compact">
                        <span class="order-detail__info-label-compact">Ngày tạo:</span>
                        <span class="order-detail__info-value-compact">{{ formatDateTime(order.createdAt) }}</span>
                      </div>
                      <div
                        v-if="order.paidAt"
                        class="order-detail__info-item-compact"
                      >
                        <span class="order-detail__info-label-compact">Ngày thanh toán:</span>
                        <span class="order-detail__info-value-compact">{{ formatDateTime(order.paidAt) }}</span>
                      </div>
                      <div class="order-detail__info-item-compact">
                        <span class="order-detail__info-label-compact">Phương thức:</span>
                        <span class="order-detail__info-value-compact">{{ order.paymentMethod || '—' }}</span>
                      </div>
                      <div
                        v-if="order.voucherCode"
                        class="order-detail__info-item-compact"
                      >
                        <span class="order-detail__info-label-compact">Voucher:</span>
                        <span class="order-detail__info-value-compact">{{ order.voucherCode }}</span>
                      </div>
                      <div
                        v-if="order.voucherId"
                        class="order-detail__info-item-compact"
                      >
                        <span class="order-detail__info-label-compact">ID Voucher:</span>
                        <span class="order-detail__info-value-compact">#{{ order.voucherId }}</span>
                      </div>
                      <div
                        v-if="order.updatedAt"
                        class="order-detail__info-item-compact"
                      >
                        <span class="order-detail__info-label-compact">Cập nhật:</span>
                        <span class="order-detail__info-value-compact">{{ formatDateTime(order.updatedAt) }}</span>
                      </div>
                      <div
                        v-if="order.cancellationReason"
                        class="order-detail__info-item-compact"
                      >
                        <span class="order-detail__info-label-compact">Lý do hủy:</span>
                        <span class="order-detail__info-value-compact text-danger">{{ order.cancellationReason }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Right Column: Products & Summary -->
                <div class="order-detail__right-column">
                  <div class="order-detail__products-section">
                    <h6 class="order-detail__section-title">
                      <i class="bi bi-basket me-2" />
                      Sản phẩm ({{ (order.orderDetails || []).length }})
                    </h6>
                    <EmptyState
                      v-if="!order.orderDetails || order.orderDetails.length === 0"
                      title="Không có sản phẩm"
                      message="Đơn hàng này không có sản phẩm nào."
                    >
                      <template #icon>
                        <i class="bi bi-basket" />
                      </template>
                    </EmptyState>
                    <div
                      v-else
                      class="order-detail__table-wrapper"
                    >
                      <table class="table order-detail__table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Sản phẩm</th>
                            <th class="text-center">
                              SL
                            </th>
                            <th class="text-end">
                              Đơn giá
                            </th>
                            <th class="text-end">
                              Thành tiền
                            </th>
                            <th>Ghi chú</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="item in (order.orderDetails || [])"
                            :key="item.id"
                          >
                            <td class="text-muted">
                              <small>#{{ item.id || item.orderDetailId || '—' }}</small>
                            </td>
                            <td>
                              <div class="order-detail__product-name">
                                {{ item.productName || item.name || '—' }}
                              </div>
                              <div
                                v-if="item.productId"
                                class="order-detail__product-id"
                              >
                                <small class="text-muted">ID: #{{ item.productId }}</small>
                              </div>
                            </td>
                            <td class="text-center">
                              {{ item.quantity || 0 }}
                            </td>
                            <td class="text-end">
                              {{ formatCurrency(item.priceAtOrder || item.price || item.unitPrice || 0) }}
                            </td>
                            <td class="text-end fw-semibold">
                              {{ formatCurrency((item.quantity || 0) * (item.priceAtOrder || item.price || item.unitPrice || 0)) }}
                            </td>
                            <td class="text-muted">
                              <small>{{ item.notes || '—' }}</small>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div class="order-detail__summary">
                    <div class="order-detail__summary-item">
                      <span class="order-detail__summary-label">Tổng phụ:</span>
                      <span class="order-detail__summary-value">{{ formatCurrency(order.subTotal || order.subtotal || 0) }}</span>
                    </div>
                    <div
                      v-if="order.discountAmount && order.discountAmount > 0"
                      class="order-detail__summary-item"
                    >
                      <span class="order-detail__summary-label">Giảm giá:</span>
                      <span class="order-detail__summary-value text-danger">-{{ formatCurrency(order.discountAmount || order.discount || 0) }}</span>
                    </div>
                    <div
                      v-if="order.tipAmount && order.tipAmount > 0"
                      class="order-detail__summary-item"
                    >
                      <span class="order-detail__summary-label">Tiền típ:</span>
                      <span class="order-detail__summary-value">{{ formatCurrency(order.tipAmount || order.tip || 0) }}</span>
                    </div>
                    <div
                      v-if="order.taxAmount && order.taxAmount > 0"
                      class="order-detail__summary-item"
                    >
                      <span class="order-detail__summary-label">Thuế VAT:</span>
                      <span class="order-detail__summary-value">{{ formatCurrency(order.taxAmount || order.tax || 0) }}</span>
                    </div>
                    <div
                      v-if="order.serviceCharge && order.serviceCharge > 0"
                      class="order-detail__summary-item"
                    >
                      <span class="order-detail__summary-label">Phí dịch vụ:</span>
                      <span class="order-detail__summary-value">{{ formatCurrency(order.serviceCharge || 0) }}</span>
                    </div>
                    <div class="order-detail__summary-divider" />
                    <div class="order-detail__summary-item order-detail__summary-item--total">
                      <span class="order-detail__summary-label">Tổng cộng:</span>
                      <span class="order-detail__summary-value order-detail__summary-value--total">{{ formatCurrency(order.totalAmount || order.total || 0) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <EmptyState
              v-else
              title="Không tìm thấy đơn hàng"
              message="Không tìm thấy thông tin đơn hàng."
            >
              <template #icon>
                <i class="bi bi-receipt-cutoff" />
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
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Modal } from 'bootstrap'
import * as orderService from '@/api/orderService'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { toast } from 'vue3-toastify'
import { downloadInvoiceAsTxt } from '@/utils/invoicePrinter'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const props = defineProps({
    orderId: Number
})

const modal = ref(null)
let modalInstance = null

const order = ref(null)
const loading = ref(false)
const error = ref(null)
const printing = ref(false)

watch(() => props.orderId, (newId) => {
    if (newId) {
        fetchOrderDetail(newId)
    }
})

const fetchOrderDetail = async (id) => {
    loading.value = true
    error.value = null
    try {
        order.value = await orderService.getOrderById(id)
    } catch (error) {
        error.value = 'Không thể tải chi tiết đơn hàng.'
    } finally {
        loading.value = false
    }
}

const STATUS_METADATA = {
    PENDING: { label: 'Đang chờ', badgeClass: 'badge-status--warning' },
    PAID: { label: 'Đã thanh toán', badgeClass: 'badge-status--success' },
    CANCELLED: { label: 'Đã hủy', badgeClass: 'badge-status--danger' },
    TRANSFERRED: { label: 'Đã chuyển ca', badgeClass: 'badge-status--info' }
}

const getStatusLabel = (status) => STATUS_METADATA[status]?.label || status

const getStatusBadgeClass = (status) => STATUS_METADATA[status]?.badgeClass || 'badge-status--default'

const show = () => {
    modalInstance.show()
}

const hide = () => {
    if (modalInstance) {
        modalInstance.hide()
        // Cleanup backdrop sau khi đóng
        setTimeout(() => {
            cleanupBackdrop()
        }, 350)
    }
}

// Cleanup backdrop còn sót lại
const cleanupBackdrop = () => {
    // Xóa tất cả backdrop còn sót lại
    const backdrops = document.querySelectorAll('.modal-backdrop')
    backdrops.forEach(backdrop => {
        // Chỉ xóa backdrop không thuộc về modal đang mở
        const modalElement = backdrop.closest('.modal.show')
        if (!modalElement) {
            backdrop.remove()
        }
    })

    // Xóa class modal-open khỏi body nếu không còn modal nào mở
    const openModals = document.querySelectorAll('.modal.show')
    if (openModals.length === 0) {
        document.body.classList.remove('modal-open')
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
    }
}

onMounted(() => {
    modalInstance = new Modal(modal.value)
})

const printInvoice = async () => {
    if (!order.value) {
        toast.warning('Không có dữ liệu đơn hàng để in.')
        return
    }
    try {
        printing.value = true
        
        // Đợi một chút để đảm bảo click event hoàn tất
        await new Promise(resolve => setTimeout(resolve, 50))
        
        downloadInvoiceAsTxt(order.value)
        toast.success('Đã tải xuống hóa đơn dạng TXT.')
    } catch (error) {
        console.error('Download error:', error)
        toast.error('Không thể tải xuống hóa đơn. Vui lòng thử lại.')
    } finally {
        // Đợi một chút trước khi reset printing state
        setTimeout(() => {
            printing.value = false
        }, 500)
    }
}

defineExpose({ show, hide })
</script>

<style scoped>
/* Modal - Chuẩn hóa theo base.css */
.order-detail-modal :global(.modal-dialog) {
    max-width: 95vw;
    width: 95vw;
    margin: var(--spacing-2) auto;
}

.order-detail-modal :global(.modal-dialog.modal-fullscreen-lg-down) {
    max-width: 95vw;
    width: 95vw;
}

@media (min-width: 992px) {
    .order-detail-modal :global(.modal-dialog) {
        max-width: 1600px;
        width: 95vw;
    }
}

.order-detail-modal :global(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-modal);
}

.order-detail-modal :global(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4);
    background: var(--color-card);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-4);
}

.modal-header__content {
    flex: 1;
    min-width: 0;
}

.order-detail-modal :global(.modal-header .modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-1);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.modal-subtitle {
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    margin-bottom: 0;
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.modal-header__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    flex-shrink: 0;
}

.order-detail-modal :global(.modal-body) {
    padding: var(--spacing-5);
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    background: var(--color-card);
}

.order-detail-modal :global(.modal-footer) {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-4);
    background: var(--color-card);
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-2);
}

/* Main Layout - 2 Column */
.order-detail__layout {
    display: grid;
    grid-template-columns: 400px 1fr;
    gap: var(--spacing-6);
    align-items: start;
}

.order-detail__left-column {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    position: sticky;
    top: 0;
}

.order-detail__right-column {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    min-width: 0;
}

/* Info Cards - Compact */
.order-detail__info-card {
    padding: var(--spacing-4);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
}

.order-detail__info-card--highlight {
    background: var(--color-card);
    border: 2px solid var(--color-primary);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.order-detail__info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-3);
    padding-bottom: var(--spacing-3);
    border-bottom: 2px solid var(--color-border);
}

.order-detail__info-title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin: 0;
    font-family: var(--font-family-sans);
    display: flex;
    align-items: center;
}

.order-detail__info-title i {
    font-size: 18px;
    color: var(--color-primary);
}

.order-detail__info-grid-compact {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-2);
}

.order-detail__info-item-compact {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-1) 0;
}

.order-detail__info-label-compact {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
    flex-shrink: 0;
}

.order-detail__info-value-compact {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    text-align: right;
    word-break: break-word;
    font-family: var(--font-family-sans);
}

/* Products Section - Compact */
.order-detail__products-section {
    flex: 1;
    min-height: 0;
}

.order-detail__section-title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-3);
    padding-bottom: var(--spacing-2);
    border-bottom: 1px solid var(--color-border);
    font-family: var(--font-family-sans);
    display: flex;
    align-items: center;
}

.order-detail__section-title i {
    font-size: 16px;
    color: var(--color-primary);
}

.order-detail__table-wrapper {
    max-height: 500px;
    overflow-y: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
}

.order-detail__table {
    margin-bottom: 0;
    border-collapse: separate;
    border-spacing: 0;
}

.order-detail__table {
    margin: 0;
    border: none;
    border-radius: 0;
}

.order-detail__table thead th {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    background: var(--color-card-muted);
    border-bottom: 1px solid var(--color-border);
    border-top: none;
    border-left: none;
    border-right: none;
    padding: var(--spacing-3) var(--spacing-4);
    font-family: var(--font-family-sans);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    position: sticky;
    top: 0;
    z-index: 1;
}

.order-detail__table tbody td {
    font-size: var(--font-size-base);
    padding: var(--spacing-3) var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    border-top: none;
    border-left: none;
    border-right: none;
    vertical-align: top;
    font-family: var(--font-family-sans);
    background: var(--color-card);
}

.order-detail__table tbody tr:last-child td {
    border-bottom: none;
}

.order-detail__table tbody tr:hover td {
    background: var(--color-card-muted);
}

.order-detail__product-name {
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-base);
    line-height: 1.5;
}

.order-detail__product-note {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-style: italic;
    margin-top: var(--spacing-1);
    line-height: 1.4;
}

.order-detail__product-id {
    margin-top: var(--spacing-1);
}

/* Summary - Highlight */
.order-detail__summary {
    padding: var(--spacing-4);
    border-radius: var(--radius-md);
    border: 2px solid var(--color-primary);
    background: linear-gradient(135deg, var(--color-card) 0%, rgba(59, 130, 246, 0.05) 100%);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    position: sticky;
    bottom: 0;
}

.order-detail__summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-4);
    padding: var(--spacing-2) 0;
}

.order-detail__summary-label {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-medium);
}

.order-detail__summary-value {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.order-detail__summary-divider {
    height: 2px;
    background: var(--color-border);
    margin: var(--spacing-3) 0;
}

.order-detail__summary-item--total {
    margin-top: var(--spacing-2);
    padding-top: var(--spacing-3);
    border-top: 2px solid var(--color-border);
}

.order-detail__summary-item--total .order-detail__summary-label {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.order-detail__summary-value--total {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
    font-family: var(--font-family-sans);
}

/* Base Badge - Tiêu chuẩn đồng bộ */
.order-detail-modal :global(.badge) {
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

.badge-status--large {
    font-size: var(--font-size-base);
    padding: var(--spacing-2) var(--spacing-3);
    font-weight: var(--font-weight-semibold);
}

/* Type Badges - Tiêu chuẩn đồng bộ */
.badge-type--primary {
    background: rgba(14, 165, 233, 0.18);
    border-color: #0ea5e9;
    color: #0ea5e9;
}

.badge-type--secondary {
    background: var(--color-card-muted);
    border-color: var(--color-border);
    color: var(--color-text-muted);
}

.badge-type--success {
    background: rgba(34, 197, 94, 0.18);
    border-color: #22c55e;
    color: #22c55e;
}

/* Responsive */
@media (max-width: 992px) {
    .order-detail__layout {
        grid-template-columns: 1fr;
    }

    .order-detail__left-column {
        position: static;
    }

    .order-detail__info-card--highlight {
        order: -1;
    }
}

@media (max-width: 768px) {
    .order-detail-modal :global(.modal-dialog) {
        max-width: 95%;
        margin: var(--spacing-2) auto;
    }

    .order-detail-modal :global(.modal-body) {
        padding: var(--spacing-4);
    }

    .order-detail__info-card {
        padding: var(--spacing-3);
    }

    .order-detail__table-wrapper {
        max-height: 350px;
    }

    .order-detail__table thead th,
    .order-detail__table tbody td {
        padding: var(--spacing-2) var(--spacing-3);
        font-size: var(--font-size-sm);
    }

    .order-detail__summary {
        padding: var(--spacing-3);
    }
}
</style>
