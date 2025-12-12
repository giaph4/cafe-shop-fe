<template>
  <div class="order-statistics-tab">
    <div class="row g-4 mb-4">
      <div class="col-md-3 col-sm-6">
        <div class="kpi-card kpi-card--total">
          <div class="kpi-card__icon">
            <i class="bi bi-receipt" />
          </div>
          <div class="kpi-card__content">
            <div class="kpi-card__label">
              Tổng đơn hàng:
            </div>
            <div class="kpi-card__value">
              {{ formatNumber(totalOrders) }}
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-sm-6">
        <div class="kpi-card kpi-card--revenue">
          <div class="kpi-card__icon">
            <i class="bi bi-cash-stack" />
          </div>
          <div class="kpi-card__content">
            <div class="kpi-card__label">
              Tổng doanh thu:
            </div>
            <div class="kpi-card__value">
              {{ formatCurrency(totalRevenue) }}
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-sm-6">
        <div class="kpi-card kpi-card--average">
          <div class="kpi-card__icon">
            <i class="bi bi-graph-up" />
          </div>
          <div class="kpi-card__content">
            <div class="kpi-card__label">
              Giá trị đơn trung bình:
            </div>
            <div class="kpi-card__value">
              {{ formatCurrency(averageOrderValue) }}
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-sm-6">
        <div class="kpi-card kpi-card--rate">
          <div class="kpi-card__icon">
            <i class="bi bi-percent" />
          </div>
          <div class="kpi-card__content">
            <div class="kpi-card__label">
              Tỷ lệ thanh toán:
            </div>
            <div class="kpi-card__value">
              {{ formatPercent(paidRate) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3">
      <div class="col-lg-12">
        <div class="card card-shadow">
          <div class="card-header">
            <h5 class="mb-0">
              Phân bổ theo trạng thái
            </h5>
          </div>
          <div class="card-body">
            <EmptyState
              v-if="statusDistribution.length === 0"
              title="Chưa có dữ liệu"
              message="Chưa có dữ liệu phân bổ trạng thái."
            >
              <template #icon>
                <i class="bi bi-pie-chart" />
              </template>
            </EmptyState>
            <div v-else>
              <div
                v-for="item in statusDistribution"
                :key="item.status"
                class="mb-3"
              >
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <span class="small fw-semibold">{{ item.label }}</span>
                  <span class="small text-muted">{{ item.count }} ({{ formatPercent(item.percentage) }})</span>
                </div>
                <div
                  class="progress"
                  style="height: 8px;"
                >
                  <div
                    class="progress-bar"
                    :class="getStatusProgressClass(item.status)"
                    :style="{ width: `${item.percentage}%` }"
                  />
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
import { computed } from 'vue'
import { formatCurrency, formatNumber, formatPercent } from '@/utils/formatters'
import EmptyState from '@/components/common/EmptyState.vue'

const props = defineProps({
    orders: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
})

const STATUS_METADATA = {
    PENDING: { label: 'Đang chờ', progressClass: 'bg-warning' },
    PAID: { label: 'Đã thanh toán', progressClass: 'bg-success' },
    CANCELLED: { label: 'Đã hủy', progressClass: 'bg-danger' },
    TRANSFERRED: { label: 'Đã chuyển ca', progressClass: 'bg-info' }
}

const totalOrders = computed(() => props.orders.length)

const paidOrders = computed(() => props.orders.filter(o => o.status === 'PAID').length)

const paidRate = computed(() => {
    if (totalOrders.value === 0) return 0
    return (paidOrders.value / totalOrders.value) * 100
})

const totalRevenue = computed(() => props.orders
    .filter(o => o.status === 'PAID')
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0))

const averageOrderValue = computed(() => {
    if (paidOrders.value === 0) return 0
    return totalRevenue.value / paidOrders.value
})

const statusDistribution = computed(() => {
    const distribution = {}
    props.orders.forEach(order => {
        distribution[order.status] = (distribution[order.status] || 0) + 1
    })

    return Object.entries(distribution).map(([status, count]) => {
        const meta = STATUS_METADATA[status] || { label: status, progressClass: 'bg-secondary' }
        return {
            status,
            label: meta.label,
            count,
            percentage: totalOrders.value > 0 ? (count / totalOrders.value) * 100 : 0
        }
    }).sort((a, b) => b.count - a.count)
})

const getStatusProgressClass = (status) => STATUS_METADATA[status]?.progressClass || 'bg-secondary'
</script>

<style scoped>
/* KPI Cards - Chuẩn hóa theo base.css */
.kpi-card {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-4);
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    transition: all var(--transition-base);
    min-height: 120px;
    height: 100%;
}

.kpi-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

.kpi-card__icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
    color: var(--color-primary);
    background: var(--color-card-muted);
}

/* Màu icon - không dùng gradient, dùng màu nhạt */
.kpi-card--total .kpi-card__icon {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.kpi-card--revenue .kpi-card__icon {
    background: var(--color-soft-primary);
    color: var(--color-secondary);
}

.kpi-card--average .kpi-card__icon {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.kpi-card--rate .kpi-card__icon {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.kpi-card__content {
    flex: 1;
    min-width: 0;
}

.kpi-card__label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-2);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.kpi-card__value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

/* Card và progress - Chuẩn hóa */
.order-statistics-tab :global(.card) {
    margin-bottom: 0;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.order-statistics-tab :global(.card-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card-muted);
}

.order-statistics-tab :global(.card-header h5) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.order-statistics-tab :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.order-statistics-tab :global(.progress) {
    height: 8px;
    background: var(--color-card-muted);
    border-radius: var(--radius-sm);
    overflow: hidden;
}

.order-statistics-tab :global(.progress-bar) {
    border-radius: var(--radius-sm);
}

@media (max-width: 768px) {
    .kpi-card {
        flex-direction: column;
        text-align: center;
        min-height: auto;
    }

    .kpi-card__icon {
        width: 48px;
        height: 48px;
        font-size: 20px;
    }
}
</style>

