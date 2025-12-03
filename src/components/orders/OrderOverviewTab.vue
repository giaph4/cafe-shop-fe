<template>
    <div class="order-overview-tab">
        <div class="row g-4 mb-4">
            <div class="col-md-3 col-sm-6">
                <div class="kpi-card kpi-card--revenue">
                    <div class="kpi-card__icon">
                        <i class="bi bi-cash-stack"></i>
                    </div>
                    <div class="kpi-card__content">
                        <div class="kpi-card__label">Doanh thu hôm nay:</div>
                        <div class="kpi-card__value">{{ formatCurrency(todayRevenue) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6">
                <div class="kpi-card kpi-card--month">
                    <div class="kpi-card__icon">
                        <i class="bi bi-calendar-check"></i>
                    </div>
                    <div class="kpi-card__content">
                        <div class="kpi-card__label">Doanh thu tháng:</div>
                        <div class="kpi-card__value">{{ formatCurrency(monthlyRevenue) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6">
                <div class="kpi-card kpi-card--orders">
                    <div class="kpi-card__icon">
                        <i class="bi bi-clipboard-check"></i>
                    </div>
                    <div class="kpi-card__content">
                        <div class="kpi-card__label">Đơn hàng hôm nay:</div>
                        <div class="kpi-card__value">{{ formatNumber(todayOrders) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6">
                <div class="kpi-card kpi-card--pending">
                    <div class="kpi-card__icon">
                        <i class="bi bi-exclamation-triangle"></i>
                    </div>
                    <div class="kpi-card__content">
                        <div class="kpi-card__label">Đơn đang chờ:</div>
                        <div class="kpi-card__value">{{ formatNumber(pendingOrders) }}</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-4 mb-4">
            <div class="col-md-3 col-sm-6">
                <div class="kpi-card kpi-card--average">
                    <div class="kpi-card__icon">
                        <i class="bi bi-receipt"></i>
                    </div>
                    <div class="kpi-card__content">
                        <div class="kpi-card__label">Giá trị đơn trung bình:</div>
                        <div class="kpi-card__value">{{ formatCurrency(averageOrderValue) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6">
                <div class="kpi-card kpi-card--profit">
                    <div class="kpi-card__icon">
                        <i class="bi bi-graph-up"></i>
                    </div>
                    <div class="kpi-card__content">
                        <div class="kpi-card__label">Lợi nhuận hôm nay:</div>
                        <div class="kpi-card__value">{{ formatCurrency(todayProfit) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6">
                <div class="kpi-card kpi-card--paid">
                    <div class="kpi-card__icon">
                        <i class="bi bi-people"></i>
                    </div>
                    <div class="kpi-card__content">
                        <div class="kpi-card__label">Đã thanh toán:</div>
                        <div class="kpi-card__value">{{ formatNumber(paidOrders) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6">
                <div class="kpi-card kpi-card--total">
                    <div class="kpi-card__icon">
                        <i class="bi bi-bag-check"></i>
                    </div>
                    <div class="kpi-card__content">
                        <div class="kpi-card__label">Tổng đơn hàng:</div>
                        <div class="kpi-card__value">{{ formatNumber(totalOrders) }}</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-3 mb-4">
            <div class="col-lg-6">
                <div class="card card-shadow">
                    <div class="card-header bg-white">
                        <h5 class="mb-0">Đơn hàng gần đây</h5>
                    </div>
                    <div class="card-body">
                        <EmptyState
                            v-if="recentOrders.length === 0"
                            title="Chưa có đơn hàng"
                            message="Chưa có đơn hàng nào được tạo."
                        >
                            <template #icon>
                                <i class="bi bi-receipt-cutoff"></i>
                            </template>
                        </EmptyState>
                        <div v-else class="list-group list-group-flush">
                            <div
                                v-for="order in recentOrders"
                                :key="order.id"
                                class="list-group-item px-0 border-bottom"
                            >
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <div class="fw-semibold">Đơn #{{ order.id }}</div>
                                        <small class="text-muted">
                                            {{ order.tableName || 'Mang về' }} • {{ formatDateTime(order.createdAt) }}
                                        </small>
                                    </div>
                                    <div class="text-end">
                                        <div class="fw-semibold text-primary">{{ formatCurrency(order.totalAmount) }}</div>
                                        <span :class="['badge', getStatusBadgeClass(order.status)]">
                                            {{ getStatusLabel(order.status) }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="card card-shadow">
                    <div class="card-header bg-white">
                        <h5 class="mb-0">Phân bổ theo trạng thái</h5>
                    </div>
                    <div class="card-body">
                        <EmptyState
                            v-if="statusDistribution.length === 0"
                            title="Chưa có dữ liệu"
                            message="Chưa có dữ liệu phân bổ trạng thái."
                        >
                            <template #icon>
                                <i class="bi bi-pie-chart"></i>
                            </template>
                        </EmptyState>
                        <div v-else>
                            <div
                                v-for="item in statusDistribution"
                                :key="item.status"
                                class="mb-3"
                            >
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="small fw-semibold">{{ item.label }}</span>
                                    <span class="small text-muted">{{ item.count }} ({{ formatPercent(item.percentage) }})</span>
                                </div>
                                <div class="progress" style="height: 8px;">
                                    <div
                                        class="progress-bar"
                                        :class="getStatusProgressClass(item.status)"
                                        :style="{ width: `${item.percentage}%` }"
                                    ></div>
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
import { computed } from 'vue'
import { formatCurrency, formatDateTime, formatNumber, formatPercent } from '@/utils/formatters'
import EmptyState from '@/components/common/EmptyState.vue'

const props = defineProps({
    orders: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
})

const STATUS_METADATA = {
    PENDING: { label: 'Đang chờ', badgeClass: 'bg-warning-subtle text-warning', progressClass: 'bg-warning' },
    PAID: { label: 'Đã thanh toán', badgeClass: 'bg-success-subtle text-success', progressClass: 'bg-success' },
    CANCELLED: { label: 'Đã hủy', badgeClass: 'bg-danger-subtle text-danger', progressClass: 'bg-danger' },
    TRANSFERRED: { label: 'Đã chuyển ca', badgeClass: 'bg-info-subtle text-info', progressClass: 'bg-info' }
}

const totalOrders = computed(() => props.orders.length)

const pendingOrders = computed(() => {
    return props.orders.filter(o => o.status === 'PENDING').length
})

const paidOrders = computed(() => {
    return props.orders.filter(o => o.status === 'PAID').length
})

const paidRate = computed(() => {
    if (totalOrders.value === 0) return 0
    return (paidOrders.value / totalOrders.value) * 100
})

const totalRevenue = computed(() => {
    return props.orders
        .filter(o => o.status === 'PAID')
        .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
})

// Today's data
const today = new Date()
today.setHours(0, 0, 0, 0)

const todayOrders = computed(() => {
    return props.orders.filter(o => {
        const orderDate = new Date(o.createdAt)
        orderDate.setHours(0, 0, 0, 0)
        return orderDate.getTime() === today.getTime()
    }).length
})

const todayRevenue = computed(() => {
    return props.orders
        .filter(o => {
            const orderDate = new Date(o.createdAt)
            orderDate.setHours(0, 0, 0, 0)
            return orderDate.getTime() === today.getTime() && o.status === 'PAID'
        })
        .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
})

const todayProfit = computed(() => {
    // Simplified: profit = revenue * 0.3 (30% margin)
    return todayRevenue.value * 0.3
})

// Monthly data
const monthlyRevenue = computed(() => {
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    return props.orders
        .filter(o => {
            const orderDate = new Date(o.createdAt)
            return orderDate.getMonth() === currentMonth && 
                   orderDate.getFullYear() === currentYear && 
                   o.status === 'PAID'
        })
        .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
})

const averageOrderValue = computed(() => {
    const paidOrdersList = props.orders.filter(o => o.status === 'PAID')
    if (paidOrdersList.length === 0) return 0
    const sum = paidOrdersList.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0)
    return sum / paidOrdersList.length
})

const recentOrders = computed(() => {
    return [...props.orders]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
})

const statusDistribution = computed(() => {
    const distribution = {}
    props.orders.forEach(order => {
        distribution[order.status] = (distribution[order.status] || 0) + 1
    })

    return Object.entries(distribution).map(([status, count]) => {
        const meta = STATUS_METADATA[status] || { label: status, badgeClass: '', progressClass: 'bg-secondary' }
        return {
            status,
            label: meta.label,
            count,
            percentage: totalOrders.value > 0 ? (count / totalOrders.value) * 100 : 0
        }
    }).sort((a, b) => b.count - a.count)
})

const getStatusLabel = (status) => {
    return STATUS_METADATA[status]?.label || status
}

const getStatusBadgeClass = (status) => {
    return STATUS_METADATA[status]?.badgeClass || 'bg-secondary-subtle text-secondary'
}

const getStatusProgressClass = (status) => {
    return STATUS_METADATA[status]?.progressClass || 'bg-secondary'
}
</script>

<style scoped>
/* KPI Cards - Chuẩn hóa theo base.css */
.kpi-card {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    padding: var(--spacing-4);
    box-shadow: var(--shadow-base);
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    transition: all var(--transition-base);
    min-height: 120px;
    height: 100%;
}

.kpi-card:hover {
    box-shadow: var(--shadow-hover);
}

.kpi-card__icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-base);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
    color: var(--color-primary);
    background: var(--color-bg-muted);
}

/* Màu icon - không dùng gradient, dùng màu nhạt */
.kpi-card--revenue .kpi-card__icon {
    background: var(--color-bg-muted);
    color: var(--color-primary);
}

.kpi-card--month .kpi-card__icon {
    background: var(--color-bg-muted);
    color: var(--color-secondary);
}

.kpi-card--orders .kpi-card__icon {
    background: var(--color-bg-muted);
    color: var(--color-accent);
}

.kpi-card--pending .kpi-card__icon {
    background: var(--color-bg-muted);
    color: var(--color-warning);
}

.kpi-card--average .kpi-card__icon {
    background: var(--color-bg-muted);
    color: var(--color-info);
}

.kpi-card--profit .kpi-card__icon {
    background: var(--color-bg-muted);
    color: var(--color-success);
}

.kpi-card--paid .kpi-card__icon {
    background: var(--color-bg-muted);
    color: var(--color-info);
}

.kpi-card--total .kpi-card__icon {
    background: var(--color-bg-muted);
    color: var(--color-primary);
}

.kpi-card__content {
    flex: 1;
    min-width: 0;
}

.kpi-card__label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-2);
    line-height: var(--line-height-base);
}

.kpi-card__value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    line-height: var(--line-height-tight);
}

/* Card và list - Chuẩn hóa */
.order-overview-tab :global(.card) {
    margin-bottom: 0;
}

.order-overview-tab :global(.card-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg);
}

.order-overview-tab :global(.card-body) {
    padding: var(--spacing-4);
}

.order-overview-tab :global(.list-group-item) {
    padding: var(--spacing-3) 0;
    border-bottom: 1px solid var(--color-border);
    transition: background-color var(--transition-base);
}

.order-overview-tab :global(.list-group-item:hover) {
    background-color: var(--color-bg-muted);
}

.order-overview-tab :global(.list-group-item:last-child) {
    border-bottom: none;
}

/* Progress bar - Chuẩn hóa */
.order-overview-tab :global(.progress) {
    height: 8px;
    background: var(--color-bg-muted);
    border-radius: var(--radius-base);
    overflow: hidden;
}

.order-overview-tab :global(.progress-bar) {
    border-radius: var(--radius-base);
}

/* Badge - Chuẩn hóa */
.order-overview-tab :global(.badge) {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-base);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
}

@media (max-width: 768px) {
    .kpi-card {
        flex-direction: column;
        text-align: center;
        min-height: auto;
    }
    
    .kpi-card__icon {
        width: 48px;
        height: 48px;
        font-size: 20px;
    }
}
</style>

