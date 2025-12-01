<template>
    <div class="customer-statistics-tab">
        <div class="row g-3 mb-4">
            <div class="col-lg-4 col-md-6" v-for="(stat, index) in stats" :key="stat.label">
                <div class="stat-card" :class="getCardClass(index)">
                    <div class="stat-icon" :class="getIconClass(index)">
                        <i :class="stat.icon"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">{{ stat.label }}</div>
                        <div class="stat-value">{{ stat.value }}</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-4">
            <div class="col-lg-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-graph-up me-2"></i>
                            Phân bố điểm thưởng
                        </h5>
                    </div>
                    <div class="card-body">
                        <EmptyState
                            v-if="loyaltyDistribution.length === 0"
                            title="Chưa có dữ liệu"
                            message="Chưa có dữ liệu phân bố điểm thưởng."
                        >
                            <template #icon>
                                <i class="bi bi-graph-up"></i>
                            </template>
                        </EmptyState>
                        <div v-else class="loyalty-distribution">
                            <div
                                v-for="item in loyaltyDistribution"
                                :key="item.range"
                                class="distribution-item mb-3"
                            >
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="fw-semibold">{{ item.range }}</span>
                                    <span class="badge bg-primary">{{ item.count }} khách hàng</span>
                                </div>
                                <div class="progress" style="height: 8px;">
                                    <div
                                        class="progress-bar"
                                        :style="{ width: item.percentage + '%' }"
                                    ></div>
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
                            <i class="bi bi-calendar me-2"></i>
                            Khách hàng mới theo tháng
                        </h5>
                    </div>
                    <div class="card-body">
                        <EmptyState
                            v-if="monthlyNewCustomers.length === 0"
                            title="Chưa có dữ liệu"
                            message="Chưa có dữ liệu khách hàng mới."
                        >
                            <template #icon>
                                <i class="bi bi-calendar"></i>
                            </template>
                        </EmptyState>
                        <div v-else class="monthly-stats">
                            <div
                                v-for="item in monthlyNewCustomers"
                                :key="item.month"
                                class="monthly-item d-flex justify-content-between align-items-center py-2 border-bottom"
                            >
                                <div>
                                    <div class="fw-semibold">{{ item.month }}</div>
                                    <small class="text-muted">{{ item.year }}</small>
                                </div>
                                <div class="text-end">
                                    <div class="fs-5 fw-bold text-primary">{{ item.count }}</div>
                                    <small class="text-muted">khách hàng</small>
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
import { formatNumber } from '@/utils/formatters'
import EmptyState from '@/components/common/EmptyState.vue'

const props = defineProps({
    stats: {
        type: Array,
        default: () => []
    },
    loyaltyDistribution: {
        type: Array,
        default: () => []
    },
    monthlyNewCustomers: {
        type: Array,
        default: () => []
    }
})

const getCardClass = (index) => {
    const classes = ['stat-card--purple', 'stat-card--green', 'stat-card--yellow']
    return classes[index % classes.length]
}

const getIconClass = (index) => {
    const classes = ['stat-icon--purple', 'stat-icon--green', 'stat-icon--yellow']
    return classes[index % classes.length]
}
</script>

<style scoped>
/* KPI cards giống Dashboard */
.stat-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    padding: var(--spacing-5);
    border-radius: 24px;
    background: #f8fafc;
    border: 1px solid rgba(226, 232, 240, 0.5);
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.06);
}

.stat-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 1.75rem;
    color: #6366f1;
}

.stat-icon--purple {
    background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
}

.stat-icon--green {
    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
}

.stat-icon--yellow {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
}

.stat-content {
    flex: 1;
    min-width: 0;
}

.stat-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-1);
    font-weight: var(--font-weight-medium);
}

.stat-value {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
}

.distribution-item:last-child {
    margin-bottom: 0 !important;
}

.monthly-item:last-child {
    border-bottom: none !important;
}

.progress {
    border-radius: var(--radius-full);
    background-color: var(--color-primary-soft);
}

.progress-bar {
    background: var(--color-primary);
    border-radius: var(--radius-full);
}
</style>

