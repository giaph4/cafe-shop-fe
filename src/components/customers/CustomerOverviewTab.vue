<template>
    <div class="customer-overview-tab">
        <div class="row g-4 mb-4">
            <div class="col-lg-3 col-md-6" v-for="stat in stats" :key="stat.label">
                <div class="stat-card card h-100">
                    <div class="card-body d-flex align-items-center">
                        <div class="stat-icon me-3" :class="stat.iconClass">
                            <i :class="stat.icon"></i>
                        </div>
                        <div class="flex-grow-1">
                            <div class="stat-label">{{ stat.label }}</div>
                            <div class="stat-value">{{ stat.value }}</div>
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
                            <i class="bi bi-people me-2"></i>
                            Khách hàng mới gần đây
                        </h5>
                    </div>
                    <div class="card-body">
                        <div v-if="recentCustomers.length === 0" class="text-center text-muted py-4">
                            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                            <p class="mb-0">Chưa có khách hàng mới.</p>
                        </div>
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
                        <div v-if="topCustomers.length === 0" class="text-center text-muted py-4">
                            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                            <p class="mb-0">Chưa có khách hàng VIP.</p>
                        </div>
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
</script>

<style scoped>
.stat-card {
    border: none;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
    border-radius: 18px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    min-height: 140px;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
}

.stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
}

.stat-icon.bg-primary-subtle {
    background: rgba(99, 102, 241, 0.12);
    color: #4f46e5;
}

.stat-icon.bg-success-subtle {
    background: rgba(34, 197, 94, 0.12);
    color: #15803d;
}

.stat-icon.bg-warning-subtle {
    background: rgba(250, 204, 21, 0.12);
    color: #b45309;
}

.stat-icon.bg-info-subtle {
    background: rgba(13, 202, 240, 0.12);
    color: #0ea5e9;
}

.stat-label {
    font-size: 0.875rem;
    color: var(--color-text-muted, #64748b);
    margin-bottom: 0.25rem;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-heading, #0f172a);
}

.rank-badge {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(122deg, rgba(99, 102, 241, 0.92) 0%, rgba(129, 140, 248, 0.88) 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.875rem;
}

.list-group-item {
    border-color: var(--color-border-soft, #e2e8f0);
    padding: 1rem 0;
}

.list-group-item:first-child {
    padding-top: 0;
}

.list-group-item:last-child {
    padding-bottom: 0;
}
</style>

