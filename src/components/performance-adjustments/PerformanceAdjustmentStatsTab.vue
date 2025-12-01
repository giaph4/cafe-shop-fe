<template>
    <div class="performance-adjustment-stats-tab">
        <div class="row g-4 mb-4">
            <div class="col-md-3 col-sm-6 d-flex">
                <div class="metric-card metric-card--primary w-100">
                    <div class="metric-card__icon">
                        <i class="bi bi-list-check"></i>
                    </div>
                    <div class="metric-card__content">
                        <div class="metric-label">Tổng điều chỉnh</div>
                        <div class="metric-value">{{ totalAdjustments }}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 d-flex">
                <div class="metric-card metric-card--success w-100">
                    <div class="metric-card__icon">
                        <i class="bi bi-gift-fill"></i>
                    </div>
                    <div class="metric-card__content">
                        <div class="metric-label">Tổng thưởng</div>
                        <div class="metric-value">{{ formatCurrency(totalBonus) }}</div>
                        <div class="metric-detail">{{ bonusCount }} điều chỉnh</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 d-flex">
                <div class="metric-card metric-card--danger w-100">
                    <div class="metric-card__icon">
                        <i class="bi bi-exclamation-triangle-fill"></i>
                    </div>
                    <div class="metric-card__content">
                        <div class="metric-label">Tổng phạt</div>
                        <div class="metric-value">{{ formatCurrency(totalPenalty) }}</div>
                        <div class="metric-detail">{{ penaltyCount }} điều chỉnh</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 d-flex">
                <div class="metric-card metric-card--warning w-100">
                    <div class="metric-card__icon">
                        <i class="bi bi-arrow-counterclockwise"></i>
                    </div>
                    <div class="metric-card__content">
                        <div class="metric-label">Đã thu hồi</div>
                        <div class="metric-value">{{ revokedCount }}</div>
                        <div class="metric-detail">{{ revokedPercentage }}%</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card table-card">
            <div class="card-body">
                <h5 class="card-title mb-3">Tổng hợp theo phân công</h5>
                <LoadingState v-if="loading" />
                <EmptyState
                    v-else-if="!groupedByAssignment.length"
                    title="Chưa có dữ liệu"
                    message="Chưa có dữ liệu để thống kê."
                />
                <div v-else class="table-responsive">
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
                        <tr v-for="group in groupedByAssignment" :key="group.assignmentId">
                            <td>
                                <div class="fw-semibold">Assignment #{{ group.assignmentId }}</div>
                            </td>
                            <td>{{ group.count }}</td>
                            <td class="text-success">{{ formatCurrency(group.totalBonus) }}</td>
                            <td class="text-danger">{{ formatCurrency(group.totalPenalty) }}</td>
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
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-sm);
    padding: var(--spacing-6);
    display: flex;
    align-items: center;
    gap: var(--spacing-5);
    transition: all var(--transition-base);
    overflow: hidden;
    height: 100%;
    min-height: 140px;
}

.metric-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, transparent, currentColor, transparent);
    opacity: 0.3;
}

.metric-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.metric-card__icon {
    width: 64px;
    height: 64px;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-2xl);
    flex-shrink: 0;
    background: var(--color-card-muted);
    box-shadow: var(--shadow-sm);
}

.metric-card--primary {
    background: var(--color-primary-soft);
    border-color: var(--color-primary-soft);
}

.metric-card--primary .metric-card__icon {
    background: var(--color-primary);
    color: var(--color-white);
}

.metric-card--primary .metric-value {
    color: var(--color-primary);
}

.metric-card--success {
    background: var(--color-success-soft);
    border-color: var(--color-success-soft);
}

.metric-card--success .metric-card__icon {
    background: var(--color-success);
    color: var(--color-white);
}

.metric-card--success .metric-value {
    color: var(--color-success);
}

.metric-card--danger {
    background: var(--color-danger-soft);
    border-color: var(--color-danger-soft);
}

.metric-card--danger .metric-card__icon {
    background: var(--color-danger);
    color: var(--color-white);
}

.metric-card--danger .metric-value {
    color: var(--color-danger);
}

.metric-card--warning {
    background: var(--color-warning-soft);
    border-color: var(--color-warning-soft);
}

.metric-card--warning .metric-card__icon {
    background: var(--color-warning);
    color: var(--color-white);
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
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
    font-weight: var(--font-weight-semibold);
}

.metric-value {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);
}

.metric-detail {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
}

.table-card {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);
    background: var(--color-card);
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

