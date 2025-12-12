<template>
  <Teleport to="body">
    <div
      class="ingredient-detail-modal modal fade show"
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
        class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
        style="z-index: 1056;"
      >
        <div
          class="modal-content"
          @click.stop
        >
          <div class="modal-header">
            <div class="modal-header__content">
              <h5 class="modal-title">
                Chi tiết: <strong>{{ ingredient.name }}</strong>
              </h5>
              <p class="modal-subtitle mb-0">
                Xem thông tin chi tiết về dự báo và tiêu thụ
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
                    <i class="bi bi-box me-2" />
                    Thông tin nguyên liệu
                  </h6>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">Tên:</span>
                      <span class="info-value fw-semibold">{{ ingredient.name }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Đơn vị:</span>
                      <span class="info-value">{{ ingredient.unit }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Tồn kho hiện tại:</span>
                      <span class="info-value">{{ formatNumber(ingredient.currentStock) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Mức đặt lại:</span>
                      <span class="info-value">{{ formatNumber(ingredient.reorderLevel) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="info-section">
                  <h6 class="section-title mb-3">
                    <i class="bi bi-graph-up me-2" />
                    Dự báo & Tiêu thụ
                  </h6>
                  <div class="row g-3">
                    <div class="col-6">
                      <div class="stat-box">
                        <div class="stat-icon stat-icon--primary">
                          <i class="bi bi-speedometer2" />
                        </div>
                        <div class="stat-content">
                          <div class="stat-label">
                            Tiêu thụ TB/ngày
                          </div>
                          <div class="stat-value">
                            {{ formatNumber(ingredient.avgDailyConsumption, 2) }}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="stat-box">
                        <div class="stat-icon stat-icon--info">
                          <i class="bi bi-calendar-week" />
                        </div>
                        <div class="stat-content">
                          <div class="stat-label">
                            Dự báo 7 ngày
                          </div>
                          <div class="stat-value">
                            {{ formatNumber(ingredient.forecast7d, 2) }}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="stat-box">
                        <div class="stat-icon stat-icon--warning">
                          <i class="bi bi-calendar-month" />
                        </div>
                        <div class="stat-content">
                          <div class="stat-label">
                            Dự báo 30 ngày
                          </div>
                          <div class="stat-value">
                            {{ formatNumber(ingredient.forecast30d, 2) }}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="stat-box">
                        <div class="stat-icon stat-icon--danger">
                          <i class="bi bi-clock" />
                        </div>
                        <div class="stat-content">
                          <div class="stat-label">
                            Số ngày còn lại
                          </div>
                          <div class="stat-value">
                            {{ ingredient.daysRemaining || 'N/A' }}
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
                          <td>Trạng thái</td>
                          <td>
                            <span
                              class="badge badge-soft"
                              :class="getStatusClass(ingredient.status)"
                            >
                              {{ getStatusLabel(ingredient.status) }}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td>Độ tin cậy dự báo</td>
                          <td>{{ (ingredient.confidence * 100).toFixed(1) }}%</td>
                        </tr>
                        <tr>
                          <td>Xu hướng</td>
                          <td>
                            <span
                              class="trend-badge"
                              :class="getTrendClass(ingredient.trend)"
                            >
                              {{ getTrendLabel(ingredient.trend) }}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td>Đề xuất đặt hàng</td>
                          <td class="suggested-order-cell">
                            {{ formatNumber(ingredient.suggestedOrder) }}
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
            <button
              v-if="ingredient.suggestedOrder > 0"
              type="button"
              class="btn btn-flat btn-flat--primary"
              @click="handleCreatePO"
            >
              <i class="bi bi-cart-plus me-2" />
              Tạo đơn đặt hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { formatNumber } from '@/utils/formatters'

const props = defineProps({
    ingredient: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['close', 'select', 'create-po'])

const handleClose = () => {
    emit('close')
}

const handleCreatePO = () => {
    emit('create-po', props.ingredient)
    handleClose()
}

const getStatusClass = (status) => {
    const classes = {
        'critical': 'badge-danger',
        'warning': 'badge-warning',
        'attention': 'badge-info',
        'stable': 'badge-success'
    }
    return classes[status] || 'badge-neutral'
}

const getStatusLabel = (status) => {
    const labels = {
        'critical': 'Critical',
        'warning': 'Warning',
        'attention': 'Attention',
        'stable': 'Ổn định'
    }
    return labels[status] || status
}

const getTrendClass = (trend) => {
    const classes = {
        'increasing': 'trend-up',
        'decreasing': 'trend-down',
        'stable': 'trend-stable'
    }
    return classes[trend] || 'trend-stable'
}

const getTrendLabel = (trend) => {
    const labels = {
        'increasing': 'Tăng',
        'decreasing': 'Giảm',
        'stable': 'Ổn định'
    }
    return labels[trend] || 'N/A'
}
</script>

<style scoped>
.ingredient-detail-modal {
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

.stat-icon--primary {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.stat-icon--danger {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.stat-icon--warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.stat-icon--info {
    background: var(--color-soft-sky);
    color: var(--color-info);
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

.badge-warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
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
    background: var(--color-card-muted);
    color: var(--color-text-muted);
}

.trend-badge {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    display: inline-block;
}

.trend-up {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.trend-down {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.trend-stable {
    background: var(--color-card-muted);
    color: var(--color-text-muted);
}

.suggested-order-cell {
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
}
</style>

