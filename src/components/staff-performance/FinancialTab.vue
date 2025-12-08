<template>
    <div class="financial-tab">
        <div class="row g-4 mb-4">
            <div class="col-lg-4">
                <div class="stat-card stat-card--revenue">
                    <div class="stat-card__icon">
                        <i class="bi bi-cash-stack"></i>
                    </div>
                    <div class="stat-card__content">
                        <div class="stat-card__label">Tổng doanh thu</div>
                        <div class="stat-card__value">{{ formatCurrency(totalRevenue) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-lg-4">
                <div class="stat-card stat-card--tips">
                    <div class="stat-card__icon">
                        <i class="bi bi-gift"></i>
                    </div>
                    <div class="stat-card__content">
                        <div class="stat-card__label">Tổng tips</div>
                        <div class="stat-card__value">{{ formatCurrency(totalTips) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-lg-4">
                <div class="stat-card stat-card--adjustments">
                    <div class="stat-card__icon">
                        <i class="bi bi-piggy-bank"></i>
                    </div>
                    <div class="stat-card__content">
                        <div class="stat-card__label">Thưởng - Phạt</div>
                        <div class="stat-card__value">{{ formatCurrency(netAdjustments) }}</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="card standard-card">
            <div class="card-header standard-card-header">
                <h6 class="card-title mb-0">Chi tiết tài chính</h6>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-minimal">
                        <thead>
                            <tr>
                                <th>Nhân viên</th>
                                <th>Doanh thu</th>
                                <th>Đơn TB</th>
                                <th>Tips</th>
                                <th>Thưởng</th>
                                <th>Phạt</th>
                                <th>Tổng thu nhập</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="staff in staffList" :key="staff.userId">
                                <td>
                                    <div class="fw-semibold staff-name">{{ staff.fullName }}</div>
                                </td>
                                <td class="revenue-cell">{{ formatCurrency(staff.metrics.revenue) }}</td>
                                <td>{{ formatCurrency(staff.metrics.avgOrderValue) }}</td>
                                <td class="tips-cell">{{ formatCurrency(staff.metrics.tipsEarned) }}</td>
                                <td class="bonus-cell">{{ formatCurrency(staff.metrics.bonuses) }}</td>
                                <td class="penalty-cell">{{ formatCurrency(staff.metrics.penalties) }}</td>
                                <td class="total-income-cell fw-semibold">
                                    {{ formatCurrency(staff.metrics.revenue + staff.metrics.tipsEarned + staff.metrics.bonuses - staff.metrics.penalties) }}
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
    staffList: {
        type: Array,
        default: () => []
    }
})

const totalRevenue = computed(() => {
    return props.staffList.reduce((sum, s) => sum + (s.metrics?.revenue || 0), 0)
})

const totalTips = computed(() => {
    return props.staffList.reduce((sum, s) => sum + (s.metrics?.tipsEarned || 0), 0)
})

const netAdjustments = computed(() => {
    return props.staffList.reduce((sum, s) => {
        return sum + (s.metrics?.bonuses || 0) - (s.metrics?.penalties || 0)
    }, 0)
})
</script>

<style scoped>
.financial-tab {
    font-family: var(--font-family-sans);
}

.stat-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    transition: all var(--transition-base);
}

.stat-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
}

.stat-card__icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
}

.stat-card--revenue .stat-card__icon {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.stat-card--tips .stat-card__icon {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.stat-card--adjustments .stat-card__icon {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.stat-card__content {
    flex: 1;
    min-width: 0;
}

.stat-card__label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.stat-card__value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.staff-name {
    font-family: var(--font-family-sans);
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
}

.revenue-cell {
    font-family: var(--font-family-sans);
    color: var(--color-success);
    font-weight: var(--font-weight-semibold);
}

.tips-cell {
    font-family: var(--font-family-sans);
    color: var(--color-warning);
}

.bonus-cell {
    font-family: var(--font-family-sans);
    color: var(--color-success);
}

.penalty-cell {
    font-family: var(--font-family-sans);
    color: var(--color-danger);
}

.total-income-cell {
    font-family: var(--font-family-sans);
    color: var(--color-primary);
}
</style>

