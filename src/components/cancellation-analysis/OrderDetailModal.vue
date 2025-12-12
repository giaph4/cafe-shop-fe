<template>
  <Teleport to="body">
    <div
      class="order-detail-modal modal fade show"
      tabindex="-1"
      style="display: block; z-index: 1055;"
      @click.self="handleClose"
    >
      <div
        class="modal-backdrop fade show"
        style="z-index: 1050;"
        @click="handleClose"
      />
      <div
        class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
        style="z-index: 1056;"
      >
        <div
          class="modal-content"
          @click.stop
        >
          <div class="modal-header">
            <div class="modal-header__content">
              <h5 class="modal-title">
                Chi tiết đơn hủy: <strong>#{{ order.id || order.orderId || 'N/A' }}</strong>
              </h5>
              <p class="modal-subtitle mb-0">
                Thông tin chi tiết về đơn hàng đã hủy
              </p>
            </div>
            <button
              type="button"
              class="btn-close"
              aria-label="Đóng"
              @click="handleClose"
            />
          </div>
          <div class="modal-body">
            <div class="row g-4 mb-4">
              <div class="col-md-6">
                <div class="info-section">
                  <h6 class="section-title mb-3">
                    <i class="bi bi-info-circle me-2" />
                    Thông tin đơn hàng
                  </h6>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">Mã đơn:</span>
                      <span class="info-value fw-semibold">#{{ order.id || order.orderId || 'N/A' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Thời gian tạo:</span>
                      <span class="info-value">{{ formatDateTime(order.createdAt) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Thời gian hủy:</span>
                      <span class="info-value">{{ formatDateTime(order.cancelledAt || order.updatedAt || order.createdAt) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Trạng thái:</span>
                      <span class="info-value">
                        <span class="badge badge-soft badge-danger">Đã hủy</span>
                      </span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Bàn:</span>
                      <span class="info-value">{{ order.tableName || order.table?.name || 'Takeaway' }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="info-section">
                  <h6 class="section-title mb-3">
                    <i class="bi bi-cash-stack me-2" />
                    Thông tin thanh toán
                  </h6>
                  <div class="stat-box stat-box--danger">
                    <div class="stat-icon stat-icon--danger">
                      <i class="bi bi-x-circle" />
                    </div>
                    <div class="stat-content">
                      <div class="stat-label">
                        Tổng tiền
                      </div>
                      <div class="stat-value">
                        {{ formatCurrency(order.totalAmount || 0) }}
                      </div>
                      <div class="stat-subtitle">
                        Doanh thu mất
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="order.cancellationReason || order.reason"
              class="row g-4 mb-4"
            >
              <div class="col-12">
                <div class="info-section">
                  <h6 class="section-title mb-3">
                    <i class="bi bi-exclamation-triangle me-2" />
                    Lý do hủy
                  </h6>
                  <div class="reason-box">
                    {{ order.cancellationReason || order.reason || 'Không rõ' }}
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="order.items && order.items.length > 0"
              class="row g-4"
            >
              <div class="col-12">
                <div class="info-section">
                  <h6 class="section-title mb-3">
                    <i class="bi bi-list-ul me-2" />
                    Sản phẩm trong đơn
                  </h6>
                  <div class="table-responsive">
                    <table class="table table-minimal">
                      <thead>
                        <tr>
                          <th>Sản phẩm</th>
                          <th>Số lượng</th>
                          <th>Đơn giá</th>
                          <th>Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(item, index) in order.items"
                          :key="index"
                        >
                          <td>{{ item.productName || item.product?.name || 'Unknown' }}</td>
                          <td>{{ formatNumber(item.quantity || 0) }}</td>
                          <td>{{ formatCurrency(item.unitPrice || item.price || 0) }}</td>
                          <td class="revenue-lost">
                            {{ formatCurrency(item.totalPrice || (item.quantity * (item.unitPrice || item.price || 0))) }}
                          </td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr>
                          <td
                            colspan="3"
                            class="text-end fw-semibold"
                          >
                            Tổng cộng:
                          </td>
                          <td class="revenue-lost fw-semibold">
                            {{ formatCurrency(order.totalAmount || 0) }}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-flat btn-flat--outline"
              @click="handleClose"
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
import { formatCurrency, formatNumber, formatDateTime } from '@/utils/formatters'

defineProps({
    order: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['close'])

const handleClose = () => {
    emit('close')
}
</script>

<style scoped>
.order-detail-modal {
    font-family: var(--font-family-sans);
}

.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    pointer-events: auto;
}

:global(.modal-content) {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-card);
    box-shadow: var(--shadow-lg);
}

:global(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4) var(--spacing-5);
    background: var(--color-card);
}

.modal-header__content {
    flex: 1;
}

:global(.modal-title) {
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    margin: 0;
}

.modal-subtitle {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
}

:global(.modal-body) {
    padding: var(--spacing-5);
    font-family: var(--font-family-sans);
}

:global(.modal-footer) {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-4) var(--spacing-5);
    background: var(--color-card);
}

.info-section {
    padding: var(--spacing-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
}

.section-title {
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-base);
}

.info-grid {
    display: grid;
    gap: var(--spacing-3);
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-2) 0;
    border-bottom: 1px solid var(--color-border);
}

.info-item:last-child {
    border-bottom: none;
}

.info-label {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
}

.info-value {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    color: var(--color-text);
    text-align: right;
}

.stat-box {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    padding: var(--spacing-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
}

.stat-box--danger {
    border-color: var(--color-danger);
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    flex-shrink: 0;
}

.stat-icon--danger {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.stat-content {
    flex: 1;
    min-width: 0;
}

.stat-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.stat-value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    margin-bottom: var(--spacing-1);
}

.stat-subtitle {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.reason-box {
    padding: var(--spacing-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-soft-rose);
    color: var(--color-text);
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
}

.revenue-lost {
    color: var(--color-danger);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
}

.badge-soft {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    border: 1px solid transparent;
    display: inline-block;
}

.badge-danger {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}
</style>

