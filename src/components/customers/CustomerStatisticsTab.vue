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
                                    <span class="badge" style="background: var(--color-primary); color: var(--color-text-inverse);">{{ item.count }} khách hàng</span>
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
                                    <div class="fs-5 fw-bold" style="color: var(--color-primary); font-family: var(--font-family-sans);">{{ item.count }}</div>
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

/* Card và progress - Chuẩn hóa */
.customer-statistics-tab :global(.card) {
    margin-bottom: 0;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.customer-statistics-tab :global(.card-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card-muted);
}

.customer-statistics-tab :global(.card-header h5) {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-family-sans);
}

.customer-statistics-tab :global(.card-header h5 i) {
    font-size: 18px;
    line-height: 1;
}

.customer-statistics-tab :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

/* Progress - Chuẩn hóa */
.customer-statistics-tab :global(.progress) {
    height: 8px;
    background: var(--color-card-muted);
    border-radius: var(--radius-sm);
    overflow: hidden;
}

.customer-statistics-tab :global(.progress-bar) {
    background: var(--color-primary);
    border-radius: var(--radius-sm);
}

/* Badge - Chuẩn hóa */
.customer-statistics-tab :global(.badge) {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.distribution-item:last-child {
    margin-bottom: 0 !important;
}

.monthly-item:last-child {
    border-bottom: none !important;
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

