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

/* Màu icon pastel, đồng bộ Dashboard */
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

.stat-icon--blue {
    background: linear-gradient(135deg, #e0f2fe, #bae6fd);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.18);
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

.rank-badge {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    background: var(--color-primary);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-sm);
}

.list-group-item {
    border-color: var(--color-border-soft);
    padding: var(--spacing-4) 0;
}

.list-group-item:first-child {
    padding-top: 0;
}

.list-group-item:last-child {
    padding-bottom: 0;
}
</style>

