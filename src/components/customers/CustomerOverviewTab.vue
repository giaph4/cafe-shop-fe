<template>
  <div class="customer-overview-tab">
    <div class="row g-3 mb-4">
      <div
        v-for="(stat, index) in stats"
        :key="stat.label"
        class="col-lg-3 col-md-6"
      >
        <div
          class="stat-card"
          :class="getCardClass(index)"
        >
          <div
            class="stat-icon"
            :class="getIconClass(index)"
          >
            <i :class="stat.icon" />
          </div>
          <div class="stat-content">
            <div class="stat-label">
              {{ stat.label }}
            </div>
            <div class="stat-value">
              {{ stat.value }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-lg-6">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="bi bi-people me-2" />
              Khách hàng mới gần đây
            </h5>
          </div>
          <div class="card-body">
            <EmptyState
              v-if="recentCustomers.length === 0"
              title="Chưa có khách hàng mới"
              message="Chưa có khách hàng mới được tạo."
            >
              <template #icon>
                <i class="bi bi-inbox" />
              </template>
            </EmptyState>
            <div
              v-else
              class="list-group list-group-flush"
            >
              <div
                v-for="customer in recentCustomers"
                :key="customer.id"
                class="list-group-item d-flex justify-content-between align-items-center"
              >
                <div>
                  <div class="fw-semibold">
                    {{ customer.fullName }}
                  </div>
                  <small class="text-muted">{{ customer.phone }}</small>
                </div>
                <div class="text-end">
                  <div
                    class="badge"
                    style="background: var(--color-soft-primary); border: 1px solid var(--color-primary); color: var(--color-primary);"
                  >
                    {{ formatLoyaltyPoints(customer.loyaltyPoints) }} điểm
                  </div>
                  <div
                    class="small text-muted mt-1"
                    style="font-family: var(--font-family-sans);"
                  >
                    {{ formatDate(customer.createdAt) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-6">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="bi bi-star me-2" />
              Khách hàng VIP (Điểm cao nhất)
            </h5>
          </div>
          <div class="card-body">
            <EmptyState
              v-if="topCustomers.length === 0"
              title="Chưa có khách hàng VIP"
              message="Chưa có khách hàng VIP nào."
            >
              <template #icon>
                <i class="bi bi-trophy" />
              </template>
            </EmptyState>
            <div
              v-else
              class="list-group list-group-flush"
            >
              <div
                v-for="(customer, index) in topCustomers"
                :key="customer.id"
                class="list-group-item d-flex justify-content-between align-items-center"
              >
                <div class="d-flex align-items-center">
                  <div class="rank-badge me-3">
                    {{ index + 1 }}
                  </div>
                  <div>
                    <div class="fw-semibold">
                      {{ customer.fullName }}
                    </div>
                    <small class="text-muted">{{ customer.phone }}</small>
                  </div>
                </div>
                <div class="text-end">
                  <div
                    class="badge fw-semibold"
                    style="background: var(--color-soft-amber); border: 1px solid var(--color-warning); color: var(--color-warning);"
                  >
                    {{ formatLoyaltyPoints(customer.loyaltyPoints) }} điểm
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDateTime, formatNumber } from '@/utils/formatters'
import EmptyState from '@/components/common/EmptyState.vue'

defineProps({
    stats: {
        type: Array,
        default: () => []
    },
    recentCustomers: {
        type: Array,
        default: () => []
    },
    topCustomers: {
        type: Array,
        default: () => []
    }
})

const formatDate = (value) => {
    if (!value) return '—'
    return formatDateTime(value)
}

const formatLoyaltyPoints = (points) => {
    const numeric = Number(points)
    if (!Number.isFinite(numeric)) return '0'
    return formatNumber(numeric, { maximumFractionDigits: 0 })
}

const getCardClass = (index) => {
    const classes = ['stat-card--purple', 'stat-card--green', 'stat-card--yellow', 'stat-card--blue']
    return classes[index % classes.length]
}

const getIconClass = (index) => {
    const classes = ['stat-icon--purple', 'stat-icon--green', 'stat-icon--yellow', 'stat-icon--blue']
    return classes[index % classes.length]
}
</script>

<style scoped>
/* KPI Cards - Chuẩn hóa theo base.css */
.stat-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    transition: all var(--transition-base);
    min-height: 120px;
    height: 100%;
}

.stat-card:hover {
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

.stat-icon--yellow {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.stat-icon--blue {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.stat-content {
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
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

/* Rank Badge - Chuẩn hóa */
.rank-badge {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    background: var(--color-primary);
    color: var(--color-text-inverse);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

/* List Group - Chuẩn hóa */
.customer-overview-tab :global(.list-group-item) {
    border-color: var(--color-border);
    padding: var(--spacing-4) 0;
    background: transparent;
}

.customer-overview-tab :global(.list-group-item:first-child) {
    padding-top: 0;
}

.customer-overview-tab :global(.list-group-item:last-child) {
    padding-bottom: 0;
}

/* Card - Chuẩn hóa */
.customer-overview-tab :global(.card) {
    margin-bottom: 0;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.customer-overview-tab :global(.card-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card-muted);
}

.customer-overview-tab :global(.card-header h5) {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-family-sans);
}

.customer-overview-tab :global(.card-header h5 i) {
    font-size: 18px;
    line-height: 1;
}

.customer-overview-tab :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

/* Badge - Chuẩn hóa */
.customer-overview-tab :global(.badge) {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

@media (max-width: 768px) {
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
}
</style>

