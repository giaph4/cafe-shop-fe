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
/* KPI Cards - đồng bộ với Dashboard */
.kpi-card {
    background: #f8fafc;
    border: 1px solid rgba(226, 232, 240, 0.5);
    border-radius: 24px;
    padding: var(--spacing-6);
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04);
    display: flex;
    align-items: center;
    gap: var(--spacing-5);
    transition: all var(--transition-base);
    min-height: 140px;
    height: 100%;
}

.kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.06);
}

.kpi-card__icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    flex-shrink: 0;
    color: #6366f1;
    position: relative;
}

.kpi-card__icon i {
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* Màu icon giống Dashboard */
.kpi-card--revenue .kpi-card__icon {
    background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
}

.kpi-card--month .kpi-card__icon {
    background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
    box-shadow: 0 2px 8px rgba(124, 58, 237, 0.15);
}

.kpi-card--orders .kpi-card__icon {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
}

.kpi-card--pending .kpi-card__icon {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
}

.kpi-card--average .kpi-card__icon {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.kpi-card--profit .kpi-card__icon {
    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
}

.kpi-card--paid .kpi-card__icon {
    background: linear-gradient(135deg, #e0f2fe, #bae6fd);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.18);
}

.kpi-card--total .kpi-card__icon {
    background: linear-gradient(135deg, #ede9fe, #ddd6fe);
    box-shadow: 0 2px 8px rgba(129, 140, 248, 0.18);
}

.kpi-card__content {
    flex: 1;
    min-width: 0;
}

.kpi-card__label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
    margin-bottom: var(--spacing-2);
    line-height: var(--line-height-normal);
}

.kpi-card__value {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
    margin-bottom: var(--spacing-1);
}

.list-group-item {
    transition: background-color var(--transition-fast);
}

.list-group-item:hover {
    background-color: var(--color-card-muted);
}
</style>

