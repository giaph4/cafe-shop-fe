<template>
  <Teleport to="body">
    <div
      class="shift-detail-modal modal fade show"
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
                Chi tiết ca: <strong>{{ shift.shiftName }}</strong>
              </h5>
              <p class="modal-subtitle mb-0">
                Xem thông tin chi tiết về hiệu quả ca làm việc
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
                    <i class="bi bi-calendar me-2" />
                    Thông tin ca
                  </h6>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">Tên ca:</span>
                      <span class="info-value fw-semibold">{{ shift.shiftName }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Ngày:</span>
                      <span class="info-value">{{ formatDate(shift.date) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Thời gian:</span>
                      <span class="info-value">{{ formatTime(shift.startTime) }} - {{ formatTime(shift.endTime) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Thời lượng:</span>
                      <span class="info-value">{{ formatNumber(shift.duration, 1) }} giờ</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Số nhân viên:</span>
                      <span class="info-value">{{ formatNumber(shift.staffCount) }}</span>
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
                        <div class="stat-icon stat-icon--success">
                          <i class="bi bi-cash-stack" />
                        </div>
                        <div class="stat-content">
                          <div class="stat-label">
                            Doanh thu
                          </div>
                          <div class="stat-value">
                            {{ formatCurrency(shift.revenue) }}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="stat-box">
                        <div class="stat-icon stat-icon--info">
                          <i class="bi bi-cart" />
                        </div>
                        <div class="stat-content">
                          <div class="stat-label">
                            Số đơn
                          </div>
                          <div class="stat-value">
                            {{ formatNumber(shift.ordersCount) }}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="stat-box">
                        <div class="stat-icon stat-icon--primary">
                          <i class="bi bi-percent" />
                        </div>
                        <div class="stat-content">
                          <div class="stat-label">
                            Đơn TB
                          </div>
                          <div class="stat-value">
                            {{ formatCurrency(shift.avgOrderValue) }}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="stat-box">
                        <div class="stat-icon stat-icon--warning">
                          <i class="bi bi-star" />
                        </div>
                        <div class="stat-content">
                          <div class="stat-label">
                            Điểm hiệu quả
                          </div>
                          <div class="stat-value">
                            {{ shift.efficiencyScore.toFixed(1) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="row g-4">
              <div class="col-12">
                <div class="info-section">
                  <h6 class="section-title mb-3">
                    <i class="bi bi-list-check me-2" />
                    Chi tiết metrics
                  </h6>
                  <div class="table-responsive">
                    <table class="table table-minimal">
                      <thead>
                        <tr>
                          <th>Chỉ số</th>
                          <th>Giá trị</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Doanh thu/Nhân viên</td>
                          <td class="revenue-cell">
                            {{ formatCurrency(shift.revenuePerStaff) }}
                          </td>
                        </tr>
                        <tr>
                          <td>Đơn hàng/Nhân viên</td>
                          <td>{{ formatNumber(shift.ordersPerStaff, 1) }}</td>
                        </tr>
                        <tr>
                          <td>Trạng thái</td>
                          <td>
                            <span
                              class="badge badge-soft"
                              :class="getStatusClass(shift.status)"
                            >
                              {{ getStatusLabel(shift.status) }}
                            </span>
                          </td>
                        </tr>
                      </tbody>
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
import { formatCurrency, formatNumber, formatDate, formatTime } from '@/utils/formatters'

defineProps({
    shift: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['close'])

const handleClose = () => {
    emit('close')
}

const getStatusClass = (status) => {
    const classes = {
        'PLANNED': 'badge-info',
        'LOCKED': 'badge-warning',
        'IN_PROGRESS': 'badge-primary',
        'DONE': 'badge-success',
        'CANCELLED': 'badge-danger'
    }
    return classes[status] || 'badge-neutral'
}

const getStatusLabel = (status) => {
    const labels = {
        'PLANNED': 'Lên kế hoạch',
        'LOCKED': 'Đã khóa',
        'IN_PROGRESS': 'Đang diễn ra',
        'DONE': 'Hoàn thành',
        'CANCELLED': 'Đã hủy'
    }
    return labels[status] || status
}
</script>

<style scoped>
.shift-detail-modal {
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
    padding: var(--spacing-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
}

.stat-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125rem;
    flex-shrink: 0;
}

.stat-icon--success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.stat-icon--info {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.stat-icon--primary {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.stat-icon--warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
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
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.revenue-cell {
    color: var(--color-success);
    font-weight: var(--font-weight-semibold);
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

.badge-success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.badge-info {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.badge-warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.badge-danger {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.badge-primary {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.badge-neutral {
    background: var(--color-card-muted);
    color: var(--color-text-muted);
}
</style>

