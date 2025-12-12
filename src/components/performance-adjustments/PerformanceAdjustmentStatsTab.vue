<template>
  <div class="performance-adjustment-stats-tab">
    <div class="row g-4 mb-4">
      <div class="col-md-3 col-sm-6 d-flex">
        <div class="metric-card metric-card--primary w-100">
          <div class="metric-card__icon">
            <i class="bi bi-list-check" />
          </div>
          <div class="metric-card__content">
            <div class="metric-label">
              Tổng điều chỉnh
            </div>
            <div class="metric-value">
              {{ totalAdjustments }}
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-sm-6 d-flex">
        <div class="metric-card metric-card--success w-100">
          <div class="metric-card__icon">
            <i class="bi bi-gift-fill" />
          </div>
          <div class="metric-card__content">
            <div class="metric-label">
              Tổng thưởng
            </div>
            <div class="metric-value">
              {{ formatCurrency(totalBonus) }}
            </div>
            <div class="metric-detail">
              {{ bonusCount }} điều chỉnh
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-sm-6 d-flex">
        <div class="metric-card metric-card--danger w-100">
          <div class="metric-card__icon">
            <i class="bi bi-exclamation-triangle-fill" />
          </div>
          <div class="metric-card__content">
            <div class="metric-label">
              Tổng phạt
            </div>
            <div class="metric-value">
              {{ formatCurrency(totalPenalty) }}
            </div>
            <div class="metric-detail">
              {{ penaltyCount }} điều chỉnh
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-sm-6 d-flex">
        <div class="metric-card metric-card--warning w-100">
          <div class="metric-card__icon">
            <i class="bi bi-arrow-counterclockwise" />
          </div>
          <div class="metric-card__content">
            <div class="metric-label">
              Đã thu hồi
            </div>
            <div class="metric-value">
              {{ revokedCount }}
            </div>
            <div class="metric-detail">
              {{ revokedPercentage }}%
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card table-card">
      <div class="card-body">
        <h5 class="card-title mb-3">
          Tổng hợp theo phân công
        </h5>
        <LoadingState v-if="loading" />
        <EmptyState
          v-else-if="!groupedByAssignment.length"
          title="Chưa có dữ liệu"
          message="Chưa có dữ liệu để thống kê."
        />
        <div
          v-else
          class="table-responsive"
        >
          <table class="table align-middle">
            <thead class="table-light">
              <tr>
                <th>Phân công</th>
                <th>Số điều chỉnh</th>
                <th>Tổng thưởng</th>
                <th>Tổng phạt</th>
                <th>Chênh lệch</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="group in groupedByAssignment"
                :key="group.assignmentId"
              >
                <td>
                  <div class="fw-semibold">
                    Assignment #{{ group.assignmentId }}
                  </div>
                </td>
                <td>{{ group.count }}</td>
                <td class="text-success">
                  {{ formatCurrency(group.totalBonus) }}
                </td>
                <td class="text-danger">
                  {{ formatCurrency(group.totalPenalty) }}
                </td>
                <td :class="group.net >= 0 ? 'text-success' : 'text-danger'">
                  {{ group.net >= 0 ? '+' : '' }}{{ formatCurrency(group.net) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { formatCurrency } from '@/utils/formatters'

const props = defineProps({
    adjustments: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false }
})

const totalAdjustments = computed(() => props.adjustments.length)

const bonusAdjustments = computed(() => props.adjustments.filter(a => a.type === 'BONUS' && !a.revoked))
const penaltyAdjustments = computed(() => props.adjustments.filter(a => a.type === 'PENALTY' && !a.revoked))

const totalBonus = computed(() => bonusAdjustments.value.reduce((sum, a) => sum + (Number(a.amount) || 0), 0))
const totalPenalty = computed(() => penaltyAdjustments.value.reduce((sum, a) => sum + (Number(a.amount) || 0), 0))

const bonusCount = computed(() => bonusAdjustments.value.length)
const penaltyCount = computed(() => penaltyAdjustments.value.length)

const revokedCount = computed(() => props.adjustments.filter(a => a.revoked).length)
const revokedPercentage = computed(() => {
    if (totalAdjustments.value === 0) return 0
    return Math.round((revokedCount.value / totalAdjustments.value) * 100)
})

const groupedByAssignment = computed(() => {
    const groups = {}
    props.adjustments.forEach(adj => {
        if (adj.revoked) return
        const assignmentId = adj.assignmentId
        if (!groups[assignmentId]) {
            groups[assignmentId] = {
                assignmentId,
                count: 0,
                totalBonus: 0,
                totalPenalty: 0,
                net: 0
            }
        }
        groups[assignmentId].count++
        const amount = Number(adj.amount) || 0
        if (adj.type === 'BONUS') {
            groups[assignmentId].totalBonus += amount
            groups[assignmentId].net += amount
        } else {
            groups[assignmentId].totalPenalty += amount
            groups[assignmentId].net -= amount
        }
    })
    return Object.values(groups).sort((a, b) => b.count - a.count)
})
</script>

<style scoped lang="scss">
.metric-card {
    position: relative;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    padding: var(--spacing-4);
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    transition: all var(--transition-base);
    height: 100%;
    min-height: 140px;
}

.metric-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

.metric-card__icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-xl);
    flex-shrink: 0;
    background: var(--color-card-muted);
}

.metric-card--primary .metric-card__icon {
    background: var(--color-soft-indigo);
    color: var(--color-primary);
}

.metric-card--primary .metric-value {
    color: var(--color-primary);
}

.metric-card--success .metric-card__icon {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.metric-card--success .metric-value {
    color: var(--color-success);
}

.metric-card--danger .metric-card__icon {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.metric-card--danger .metric-value {
    color: var(--color-danger);
}

.metric-card--warning .metric-card__icon {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.metric-card--warning .metric-value {
    color: var(--color-warning);
}

.metric-card__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.metric-label {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.metric-value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.metric-detail {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.table-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.table-card :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.table-card :global(.card-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-3);
    font-family: var(--font-family-sans);
}

.table-card :global(.table) {
    margin-bottom: 0;
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
    font-family: var(--font-family-sans);
}

.table-card :global(.table tbody td) {
    padding: var(--spacing-3);
    vertical-align: middle;
    border-bottom: 1px solid var(--color-border);
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

.table-card :global(.text-success) {
    color: var(--color-success);
}

.table-card :global(.text-danger) {
    color: var(--color-danger);
}

@media (max-width: 768px) {
    .metric-card {
        padding: 1.25rem;
        gap: 1rem;
    }

    .metric-card__icon {
        width: 56px;
        height: 56px;
        font-size: 1.5rem;
    }

    .metric-value {
        font-size: 1.5rem;
    }
}
</style>

