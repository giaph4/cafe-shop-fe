<template>
    <div class="customer-list">
        <div v-if="customers.length === 0" class="empty-list">
            <EmptyState
                title="Không có dữ liệu"
                message="Không tìm thấy khách hàng nào phù hợp với bộ lọc"
            />
        </div>
        <div v-else class="table-responsive">
            <table class="table table-minimal">
                <thead>
                    <tr>
                        <th>Khách hàng</th>
                        <th>Phân loại</th>
                        <th>Tổng chi tiêu</th>
                        <th>Số đơn</th>
                        <th>Đơn TB</th>
                        <th>Lần cuối</th>
                        <th>RFM Score</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="customer in customers" :key="customer.customerId">
                        <td>
                            <div>
                                <div class="fw-semibold customer-name">{{ customer.fullName }}</div>
                                <small class="text-muted">{{ customer.phone }}</small>
                            </div>
                        </td>
                        <td>
                            <span class="badge badge-soft" :class="getSegmentClass(customer.segment)">
                                {{ customer.segment }}
                            </span>
                        </td>
                        <td class="revenue-cell">{{ formatCurrency(customer.metrics.totalSpend) }}</td>
                        <td>{{ formatNumber(customer.metrics.orderCount) }}</td>
                        <td>{{ formatCurrency(customer.metrics.avgOrderValue) }}</td>
                        <td>
                            <span v-if="customer.metrics.lastVisit !== null" class="last-visit">
                                {{ customer.metrics.lastVisit }} ngày
                            </span>
                            <span v-else class="text-muted">N/A</span>
                        </td>
                        <td>
                            <span class="score-badge" :class="getScoreClass(customer.metrics.rfmScore)">
                                {{ customer.metrics.rfmScore }}
                            </span>
                        </td>
                        <td>
                            <div class="d-flex gap-2">
                                <button
                                    class="btn btn-flat btn-flat--outline btn-sm"
                                    @click="$emit('view', customer)"
                                    title="Xem chi tiết"
                                >
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button
                                    v-if="customer.segment === 'At-risk'"
                                    class="btn btn-flat btn-flat--primary btn-sm"
                                    @click="$emit('create-campaign', customer.segment)"
                                    title="Tạo campaign"
                                >
                                    <i class="bi bi-megaphone"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { formatCurrency, formatNumber } from '@/utils/formatters'
import EmptyState from '@/components/common/EmptyState.vue'

defineProps({
    customers: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
})

defineEmits(['view', 'create-campaign'])

const getSegmentClass = (segment) => {
    const classes = {
        'VIP': 'badge-primary',
        'Regular': 'badge-info',
        'Occasional': 'badge-warning',
        'At-risk': 'badge-danger',
        'New': 'badge-neutral'
    }
    return classes[segment] || 'badge-neutral'
}

const getScoreClass = (score) => {
    if (score >= 13) return 'score-excellent'
    if (score >= 10) return 'score-good'
    if (score >= 7) return 'score-average'
    return 'score-poor'
}
</script>

<style scoped>
.customer-list {
    font-family: var(--font-family-sans);
}

.empty-list {
    padding: var(--spacing-8) 0;
}

.customer-name {
    font-family: var(--font-family-sans);
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
}

.badge-soft {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    border: 1px solid transparent;
    display: inline-block;
}

.badge-primary {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.badge-info {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.badge-warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.badge-danger {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.badge-neutral {
    background: var(--color-card-muted);
    color: var(--color-text-muted);
}

.revenue-cell {
    font-family: var(--font-family-sans);
    color: var(--color-success);
    font-weight: var(--font-weight-semibold);
}

.last-visit {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    color: var(--color-text);
}

.score-badge {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
}

.score-excellent {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.score-good {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.score-average {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.score-poor {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}
</style>

