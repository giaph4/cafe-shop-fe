<template>
  <Teleport to="body">
    <div
      class="voucher-detail-modal modal fade show"
      tabindex="-1"
      @click.self="handleClose"
    >
      <div
        class="modal-backdrop fade show"
        @click="handleClose"
      />
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div
          class="modal-content"
          @click.stop
        >
          <div class="modal-header">
            <div class="modal-header__content">
              <h5 class="modal-title">
                Chi tiết Voucher: <strong>{{ voucher.code }}</strong>
              </h5>
              <p class="modal-subtitle mb-0">
                Xem thông tin chi tiết và phân tích hiệu quả của voucher
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
            <div class="row mb-4">
              <div class="row g-4 mb-4">
                <div class="col-md-6">
                  <div class="info-section">
                    <h6 class="section-title mb-3">
                      <i class="bi bi-ticket-perforated me-2" />
                      Thông tin voucher
                    </h6>
                    <div class="info-grid">
                      <div class="info-item">
                        <span class="info-label">Mã:</span>
                        <span class="info-value fw-semibold">{{ voucher.code }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Loại:</span>
                        <span class="info-value">
                          <span
                            class="badge badge-soft"
                            :class="voucher.type === 'FIXED_AMOUNT' ? 'badge-primary' : 'badge-info'"
                          >
                            {{ voucher.type === 'FIXED_AMOUNT' ? 'Giảm cố định' : 'Giảm phần trăm' }}
                          </span>
                        </span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Giá trị:</span>
                        <span class="info-value">
                          {{ voucher.type === 'FIXED_AMOUNT'
                            ? formatCurrency(voucher.discountValue)
                            : voucher.discountValue + '%' }}
                        </span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Mô tả:</span>
                        <span class="info-value">{{ voucher.description || 'Không có mô tả' }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Hiệu lực:</span>
                        <span class="info-value">
                          {{ formatDate(voucher.validFrom) }} - {{ formatDate(voucher.validTo) }}
                        </span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Trạng thái:</span>
                        <span class="info-value">
                          <span
                            class="badge badge-soft"
                            :class="voucher.active ? 'badge-success' : 'badge-neutral'"
                          >
                            {{ voucher.active ? 'Hoạt động' : 'Tạm dừng' }}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="info-section">
                    <h6 class="section-title mb-3">
                      <i class="bi bi-graph-up me-2" />
                      Chỉ số hiệu quả
                    </h6>
                    <div class="row g-3">
                      <div class="col-6">
                        <div class="stat-box">
                          <div class="stat-icon stat-icon--primary">
                            <i class="bi bi-check-circle" />
                          </div>
                          <div class="stat-content">
                            <div class="stat-label">
                              Sử dụng
                            </div>
                            <div class="stat-value">
                              {{ formatNumber(voucher.metrics.totalUsage) }}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="stat-box">
                          <div class="stat-icon stat-icon--warning">
                            <i class="bi bi-tag" />
                          </div>
                          <div class="stat-content">
                            <div class="stat-label">
                              Giảm giá
                            </div>
                            <div class="stat-value">
                              {{ formatCurrency(voucher.metrics.totalDiscount) }}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="stat-box">
                          <div class="stat-icon stat-icon--success">
                            <i class="bi bi-cash-stack" />
                          </div>
                          <div class="stat-content">
                            <div class="stat-label">
                              Doanh thu
                            </div>
                            <div class="stat-value">
                              {{ formatCurrency(voucher.metrics.totalRevenue) }}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="stat-box">
                          <div
                            class="stat-icon"
                            :class="voucher.metrics.roi >= 0 ? 'stat-icon--success' : 'stat-icon--danger'"
                          >
                            <i class="bi bi-graph-up-arrow" />
                          </div>
                          <div class="stat-content">
                            <div class="stat-label">
                              ROI
                            </div>
                            <div class="stat-value">
                              {{ voucher.metrics.roi.toFixed(2) }}%
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="stat-box">
                          <div class="stat-icon stat-icon--info">
                            <i class="bi bi-people" />
                          </div>
                          <div class="stat-content">
                            <div class="stat-label">
                              Khách hàng
                            </div>
                            <div class="stat-value">
                              {{ formatNumber(voucher.metrics.uniqueCustomers) }}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="stat-box">
                          <div class="stat-icon stat-icon--primary">
                            <i class="bi bi-cart" />
                          </div>
                          <div class="stat-content">
                            <div class="stat-label">
                              Giá trị TB/đơn
                            </div>
                            <div class="stat-value">
                              {{ formatCurrency(voucher.metrics.avgOrderValue) }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="info-section mb-4">
              <h6 class="section-title mb-3">
                <i class="bi bi-bar-chart me-2" />
                Phân tích tác động
              </h6>
              <div class="row g-3">
                <div class="col-md-4">
                  <div class="info-card">
                    <p class="label">
                      Doanh thu tăng thêm
                    </p>
                    <p class="value text-success fw-semibold">
                      {{ formatCurrency(voucher.metrics.incrementalRevenueTotal) }}
                    </p>
                    <p class="subtitle text-muted small mb-0">
                      Trung bình: {{ formatCurrency(voucher.metrics.incrementalRevenue) }}/ngày
                    </p>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="info-card">
                    <p class="label">
                      Chi phí mỗi khách hàng
                    </p>
                    <p class="value text-warning fw-semibold">
                      {{ formatCurrency(voucher.metrics.costPerAcquisition) }}
                    </p>
                    <p class="subtitle text-muted small mb-0">
                      Tổng chiết khấu / Số khách hàng
                    </p>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="info-card">
                    <p class="label">
                      So sánh doanh thu
                    </p>
                    <div class="value">
                      <div class="mb-1">
                        <span class="text-success fw-semibold">Có voucher:</span>
                        <span class="ms-2">{{ formatCurrency(voucher.metrics.avgRevenueWithVoucher) }}</span>
                      </div>
                      <div>
                        <span class="text-muted">Không voucher:</span>
                        <span class="ms-2">{{ formatCurrency(voucher.metrics.avgRevenueWithoutVoucher) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="voucher.orders && voucher.orders.length > 0"
              class="info-section"
            >
              <h6 class="section-title mb-3">
                <i class="bi bi-clock-history me-2" />
                Lịch sử sử dụng ({{ voucher.orders.length }} đơn hàng)
              </h6>
              <div class="table-wrapper">
                <div
                  class="table-responsive"
                  style="max-height: 300px;"
                >
                  <table class="table table-minimal">
                    <thead>
                      <tr>
                        <th>Ngày</th>
                        <th class="text-end">
                          Giá trị đơn
                        </th>
                        <th class="text-end">
                          Giảm giá
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="order in voucher.orders.slice(0, 20)"
                        :key="order.id"
                      >
                        <td>{{ formatDateTime(order.date) }}</td>
                        <td class="text-end">
                          {{ formatCurrency(order.amount) }}
                        </td>
                        <td class="text-end fw-semibold discount-cell">
                          {{ formatCurrency(order.discount) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div
                  v-if="voucher.orders.length > 20"
                  class="text-center text-muted p-2"
                >
                  Hiển thị 20 đơn hàng đầu tiên trong tổng số {{ voucher.orders.length }} đơn
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
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '@/utils/formatters'

defineProps({
    voucher: {
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
/* Modal Container - Fixed positioning */
.voucher-detail-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: block;
    overflow-x: hidden;
    overflow-y: auto;
}

/* Modal Backdrop - Behind modal content */
.voucher-detail-modal :global(.modal-backdrop) {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: var(--color-backdrop);
    opacity: 1;
}

/* Modal Dialog - Above backdrop */
.voucher-detail-modal :global(.modal-dialog) {
    position: relative;
    margin: var(--spacing-4) auto;
    pointer-events: none;
}

.voucher-detail-modal :global(.modal-content) {
    pointer-events: auto;
    border-radius: var(--component-radius-lg);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-modal);
    background: var(--color-card);
}

.voucher-detail-modal :global(.modal-header) {
    padding: var(--spacing-6);
    border-bottom: 1px solid var(--color-border);
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

.voucher-detail-modal :global(.modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
    line-height: var(--line-height-tight);
}

.voucher-detail-modal :global(.modal-title strong) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
}

.modal-subtitle {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    margin: 0;
    font-family: var(--font-family-sans);
    line-height: var(--line-height-normal);
}

.voucher-detail-modal :global(.modal-body) {
    padding: var(--spacing-6);
    color: var(--color-text);
    font-size: var(--font-size-base);
    line-height: var(--line-height-relaxed);
    background: var(--color-card);
}

.voucher-detail-modal :global(.modal-footer) {
    padding: var(--spacing-4) var(--spacing-6);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--spacing-2);
}

.info-section {
    margin-bottom: var(--spacing-6);
}

.section-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-3);
    display: flex;
    align-items: center;
    font-family: var(--font-family-sans);
}

.info-grid {
    display: flex;
    flex-direction: column;
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
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.info-value {
    font-size: var(--font-size-base);
    color: var(--color-text);
    text-align: right;
    font-family: var(--font-family-sans);
}

.info-card {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-4);
    height: 100%;
}

.info-card .label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-2);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.info-card .value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.info-card .subtitle {
    font-size: var(--font-size-xs);
    font-family: var(--font-family-sans);
}

.stat-box {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-3);
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    flex-shrink: 0;
}

.stat-icon--primary {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.stat-icon--success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.stat-icon--warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.stat-icon--danger {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.stat-icon--info {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.stat-content {
    flex: 1;
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
}

.table-wrapper {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
}

/* Badge Styles */
.badge-soft {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    border: 1px solid transparent;
    display: inline-block;
}

.badge-primary {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.badge-info {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.badge-success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.badge-neutral {
    background: var(--color-soft-neutral);
    color: var(--color-text-muted);
}

/* Table Cell Styles */
.discount-cell {
    color: var(--color-warning);
    font-family: var(--font-family-sans);
}
</style>

