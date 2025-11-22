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
                <div v-if="loading" class="text-center py-5">
                    <div class="spinner-border text-primary"></div>
                </div>
                <div v-else-if="!groupedByAssignment.length" class="text-center text-muted py-5">
                    Chưa có dữ liệu để thống kê.
                </div>
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

<style scoped>
.metric-card {
    position: relative;
    border-radius: 20px;
    border: 1px solid rgba(148, 163, 184, 0.24);
    background: linear-gradient(160deg, rgba(248, 250, 252, 0.92), rgba(226, 232, 240, 0.6));
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1.25rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
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
    box-shadow: 0 18px 36px rgba(15, 23, 42, 0.12);
}

.metric-card__icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.8);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.metric-card--primary {
    background: linear-gradient(160deg, rgba(99, 102, 241, 0.12), rgba(129, 140, 248, 0.08));
    border-color: rgba(99, 102, 241, 0.2);
}

.metric-card--primary .metric-card__icon {
    background: rgba(99, 102, 241, 0.15);
    color: #4f46e5;
}

.metric-card--primary .metric-value {
    color: #4f46e5;
}

.metric-card--success {
    background: linear-gradient(160deg, rgba(34, 197, 94, 0.12), rgba(74, 222, 128, 0.08));
    border-color: rgba(34, 197, 94, 0.2);
}

.metric-card--success .metric-card__icon {
    background: rgba(34, 197, 94, 0.15);
    color: #15803d;
}

.metric-card--success .metric-value {
    color: #047857;
}

.metric-card--danger {
    background: linear-gradient(160deg, rgba(239, 68, 68, 0.12), rgba(248, 113, 113, 0.08));
    border-color: rgba(239, 68, 68, 0.2);
}

.metric-card--danger .metric-card__icon {
    background: rgba(239, 68, 68, 0.15);
    color: #dc2626;
}

.metric-card--danger .metric-value {
    color: #b91c1c;
}

.metric-card--warning {
    background: linear-gradient(160deg, rgba(251, 191, 36, 0.12), rgba(253, 224, 71, 0.08));
    border-color: rgba(251, 191, 36, 0.2);
}

.metric-card--warning .metric-card__icon {
    background: rgba(251, 191, 36, 0.18);
    color: #b45309;
}

.metric-card--warning .metric-value {
    color: #b45309;
}

.metric-card__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.metric-label {
    font-size: 0.85rem;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 600;
}

.metric-value {
    font-size: 1.8rem;
    font-weight: 700;
    line-height: 1.2;
}

.metric-detail {
    font-size: 0.875rem;
    color: #64748b;
    margin-top: 0.125rem;
}

.table-card {
    border-radius: 18px;
    border: 1px solid var(--color-border);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
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

