<template>
    <div class="customer-statistics-tab">
        <div class="row g-4 mb-4">
            <div class="col-lg-4 col-md-6" v-for="stat in stats" :key="stat.label">
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
                            <i class="bi bi-graph-up me-2"></i>
                            Phân bố điểm thưởng
                        </h5>
                    </div>
                    <div class="card-body">
                        <div v-if="loyaltyDistribution.length === 0" class="text-center text-muted py-4">
                            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                            <p class="mb-0">Chưa có dữ liệu phân bố điểm thưởng.</p>
                        </div>
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
                        <div v-if="monthlyNewCustomers.length === 0" class="text-center text-muted py-4">
                            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                            <p class="mb-0">Chưa có dữ liệu khách hàng mới.</p>
                        </div>
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

.distribution-item:last-child {
    margin-bottom: 0 !important;
}

.monthly-item:last-child {
    border-bottom: none !important;
}

.progress {
    border-radius: 999px;
    background-color: rgba(99, 102, 241, 0.1);
}

.progress-bar {
    background: linear-gradient(122deg, rgba(99, 102, 241, 0.92) 0%, rgba(129, 140, 248, 0.88) 100%);
    border-radius: 999px;
}
</style>

