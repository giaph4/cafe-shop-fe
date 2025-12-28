<template>
  <Teleport to="body">
    <div
      class="customer-detail-modal modal fade show"
      tabindex="-1"
      style="display: block;"
      @click.self="handleClose"
    >
      <div
        class="modal-backdrop fade show"
        @click="handleClose"
      />
      <div
        class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
      >
        <div
          class="modal-content"
          @click.stop
        >
          <div class="modal-header">
            <div class="modal-header__content">
              <h5 class="modal-title">
                Chi tiết khách hàng: <strong>{{ customer.fullName }}</strong>
              </h5>
              <p class="modal-subtitle mb-0">
                Xem thông tin chi tiết và phân tích hành vi
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
            <LoadingState
              v-if="loadingInsights"
              text="Đang tải insights..."
            />
            <div v-else-if="insights">
              <div class="row g-4 mb-4">
                <div class="col-md-6">
                  <div class="info-section">
                    <h6 class="section-title mb-3">
                      <i class="bi bi-person me-2" />
                      Thông tin khách hàng
                    </h6>
                    <div class="info-grid">
                      <div class="info-item">
                        <span class="info-label">Họ tên:</span>
                        <span class="info-value fw-semibold">{{ customer.fullName }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">SĐT:</span>
                        <span class="info-value">{{ customer.phone || 'N/A' }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Email:</span>
                        <span class="info-value">{{ customer.email || 'N/A' }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Phân loại:</span>
                        <span class="info-value">
                          <span
                            class="badge badge-soft"
                            :class="getSegmentClass(customer.segment)"
                          >
                            {{ customer.segment }}
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
                      Chỉ số RFM
                    </h6>
                    <div class="row g-3">
                      <div class="col-6">
                        <div class="stat-box">
                          <div class="stat-icon stat-icon--primary">
                            <i class="bi bi-clock-history" />
                          </div>
                          <div class="stat-content">
                            <div class="stat-label">
                              Recency
                            </div>
                            <div class="stat-value">
                              {{ customer.metrics.recency }} ngày
                            </div>
                            <div class="stat-subtitle">
                              Score: {{ customer.metrics.rScore }}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="stat-box">
                          <div class="stat-icon stat-icon--success">
                            <i class="bi bi-repeat" />
                          </div>
                          <div class="stat-content">
                            <div class="stat-label">
                              Frequency
                            </div>
                            <div class="stat-value">
                              {{ customer.metrics.frequency }}
                            </div>
                            <div class="stat-subtitle">
                              Score: {{ customer.metrics.fScore }}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="stat-box">
                          <div class="stat-icon stat-icon--warning">
                            <i class="bi bi-cash-stack" />
                          </div>
                          <div class="stat-content">
                            <div class="stat-label">
                              Monetary
                            </div>
                            <div class="stat-value">
                              {{ formatCurrency(customer.metrics.monetary) }}
                            </div>
                            <div class="stat-subtitle">
                              Score: {{ customer.metrics.mScore }}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="stat-box">
                          <div class="stat-icon stat-icon--info">
                            <i class="bi bi-star" />
                          </div>
                          <div class="stat-content">
                            <div class="stat-label">
                              RFM Score
                            </div>
                            <div class="stat-value">
                              {{ customer.metrics.rfmScore }}
                            </div>
                            <div class="stat-subtitle">
                              Tổng điểm
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="row g-4 mb-4">
                <div class="col-12">
                  <div class="info-section">
                    <h6 class="section-title mb-3">
                      <i class="bi bi-lightbulb me-2" />
                      Đề xuất
                    </h6>
                    <div
                      v-if="insights.recommendations && insights.recommendations.length > 0"
                      class="recommendations-list"
                    >
                      <div
                        v-for="(rec, index) in insights.recommendations"
                        :key="index"
                        class="recommendation-item"
                        :class="getRecommendationClass(rec.type)"
                      >
                        <i
                          :class="getRecommendationIcon(rec.type)"
                          class="me-2"
                        />
                        <span>{{ rec.message }}</span>
                      </div>
                    </div>
                    <div
                      v-else
                      class="text-muted"
                    >
                      Không có đề xuất nào tại thời điểm này
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
                            <td>Tổng chi tiêu</td>
                            <td class="revenue-cell">
                              {{ formatCurrency(customer.metrics.totalSpend) }}
                            </td>
                          </tr>
                          <tr>
                            <td>Số đơn hàng</td>
                            <td>{{ formatNumber(customer.metrics.orderCount) }}</td>
                          </tr>
                          <tr>
                            <td>Đơn hàng trung bình</td>
                            <td>{{ formatCurrency(customer.metrics.avgOrderValue) }}</td>
                          </tr>
                          <tr>
                            <td>Lần mua cuối</td>
                            <td>{{ customer.metrics.lastVisit ? `${customer.metrics.lastVisit} ngày trước` : 'N/A' }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
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
import { ref, onMounted } from 'vue'
import { useCustomerAnalyticsStore } from '@/store/customerAnalytics'
import LoadingState from '@/components/common/LoadingState.vue'
import { formatCurrency, formatNumber } from '@/utils/formatters'

const props = defineProps({
    customer: {
        type: Object,
        required: true
    },
    startDate: {
        type: String,
        required: true
    },
    endDate: {
        type: String,
        required: true
    }
})

const emit = defineEmits(['close'])

const store = useCustomerAnalyticsStore()
const loadingInsights = ref(false)
const insights = ref(null)

const loadInsights = async () => {
    loadingInsights.value = true
    try {
        const data = await store.getInsights({
            customerId: props.customer.customerId,
            startDate: props.startDate,
            endDate: props.endDate
        })
        insights.value = data
    } catch (err) {
        console.error('Failed to load insights', err)
    } finally {
        loadingInsights.value = false
    }
}

const handleClose = () => {
    emit('close')
}

const getSegmentClass = (segment) => {
    const classes = {
        'VIP': 'badge-primary',
        'Regular': 'badge-info',
        'Occasional': 'badge-warning',
        'At-risk': 'badge-danger',
        'New': 'badge-neutral'
    }
    return classes[segment] || 'badge-neutral'
}

const getRecommendationClass = (type) => {
    const classes = {
        'welcome': 'rec-welcome',
        're-engagement': 'rec-reengagement',
        'loyalty': 'rec-loyalty'
    }
    return classes[type] || ''
}

const getRecommendationIcon = (type) => {
    const icons = {
        'welcome': 'bi bi-gift',
        're-engagement': 'bi bi-arrow-repeat',
        'loyalty': 'bi bi-star'
    }
    return icons[type] || 'bi bi-info-circle'
}

onMounted(() => {
    loadInsights()
})
</script>

<style scoped>
.customer-detail-modal {
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

.stat-icon--success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
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
    margin-bottom: var(--spacing-1);
}

.stat-subtitle {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.recommendations-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.recommendation-item {
    padding: var(--spacing-3);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    display: flex;
    align-items: center;
}

.rec-welcome {
    background: var(--color-soft-primary);
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
}

.rec-reengagement {
    background: var(--color-soft-rose);
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
}

.rec-loyalty {
    background: var(--color-soft-amber);
    color: var(--color-warning);
    border: 1px solid var(--color-warning);
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

.badge-primary {
    background: var(--color-soft-primary);
    color: var(--color-primary);
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

.badge-neutral {
    background: var(--color-card-muted);
    color: var(--color-text-muted);
}

.revenue-cell {
    color: var(--color-success);
    font-weight: var(--font-weight-semibold);
}
</style>

