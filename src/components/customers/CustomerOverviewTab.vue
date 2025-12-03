<template>
    <div class="customer-overview-tab">
        <div class="row g-3 mb-4">
            <div class="col-lg-3 col-md-6" v-for="(stat, index) in stats" :key="stat.label">
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
                            <i class="bi bi-people me-2"></i>
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
                                <i class="bi bi-inbox"></i>
                            </template>
                        </EmptyState>
                        <div v-else class="list-group list-group-flush">
                            <div
                                v-for="customer in recentCustomers"
                                :key="customer.id"
                                class="list-group-item d-flex justify-content-between align-items-center"
                            >
                                <div>
                                    <div class="fw-semibold">{{ customer.fullName }}</div>
                                    <small class="text-muted">{{ customer.phone }}</small>
                                </div>
                                <div class="text-end">
                                    <div class="badge bg-primary-subtle text-primary">
                                        {{ formatLoyaltyPoints(customer.loyaltyPoints) }} điểm
                                    </div>
                                    <div class="small text-muted mt-1">{{ formatDate(customer.createdAt) }}</div>
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
                            <i class="bi bi-star me-2"></i>
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
                                <i class="bi bi-trophy"></i>
                            </template>
                        </EmptyState>
                        <div v-else class="list-group list-group-flush">
                            <div
                                v-for="(customer, index) in topCustomers"
                                :key="customer.id"
                                class="list-group-item d-flex justify-content-between align-items-center"
                            >
                                <div class="d-flex align-items-center">
                                    <div class="rank-badge me-3">{{ index + 1 }}</div>
                                    <div>
                                        <div class="fw-semibold">{{ customer.fullName }}</div>
                                        <small class="text-muted">{{ customer.phone }}</small>
                                    </div>
                                </div>
                                <div class="text-end">
                                    <div class="badge bg-warning-subtle text-warning fw-semibold">
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

const props = defineProps({
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
    border-radius: var(--radius-base);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-base);
    transition: all var(--transition-base);
    min-height: 120px;
    height: 100%;
}

.stat-card:hover {
    box-shadow: var(--shadow-hover);
}

.stat-icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-base);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 24px;
    color: var(--color-primary);
    background: var(--color-bg-muted);
}

/* Màu icon - không dùng gradient, dùng màu nhạt */
.stat-icon--purple {
    background: var(--color-bg-muted);
    color: var(--color-primary);
}

.stat-icon--green {
    background: var(--color-bg-muted);
    color: var(--color-success);
}

.stat-icon--yellow {
    background: var(--color-bg-muted);
    color: var(--color-warning);
}

.stat-icon--blue {
    background: var(--color-bg-muted);
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
}

.stat-value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    line-height: var(--line-height-tight);
}

/* Rank Badge - Chuẩn hóa */
.rank-badge {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-base);
    background: var(--color-primary);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-base);
}

/* List Group - Chuẩn hóa */
.customer-overview-tab :global(.list-group-item) {
    border-color: var(--color-border);
    padding: var(--spacing-4) 0;
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
}

.customer-overview-tab :global(.card-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg);
}

.customer-overview-tab :global(.card-header h5) {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    display: flex;
    align-items: center;
    gap: 6px;
}

.customer-overview-tab :global(.card-header h5 i) {
    font-size: 18px;
    line-height: 1;
}

.customer-overview-tab :global(.card-body) {
    padding: var(--spacing-4);
}

/* Badge - Chuẩn hóa */
.customer-overview-tab :global(.badge) {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-base);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
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

