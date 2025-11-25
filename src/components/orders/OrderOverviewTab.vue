<template>
    <div class="order-overview-tab">
        <div class="row g-3 mb-4">
            <div class="col-lg-3 col-md-6">
                <div class="stat-card stat-card--purple">
                    <div class="stat-icon stat-icon--purple">
                        <i class="bi bi-cash-stack"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Doanh thu hôm nay:</div>
                        <div class="stat-value">{{ formatCurrency(todayRevenue) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="stat-card stat-card--blue">
                    <div class="stat-icon stat-icon--blue">
                        <i class="bi bi-calendar-check"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Doanh thu tháng:</div>
                        <div class="stat-value">{{ formatCurrency(monthlyRevenue) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="stat-card stat-card--yellow">
                    <div class="stat-icon stat-icon--yellow">
                        <i class="bi bi-clipboard-check"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Đơn hàng hôm nay:</div>
                        <div class="stat-value">{{ formatNumber(todayOrders) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="stat-card stat-card--pink">
                    <div class="stat-icon stat-icon--pink">
                        <i class="bi bi-exclamation-triangle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Đơn đang chờ:</div>
                        <div class="stat-value">{{ formatNumber(pendingOrders) }}</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-3 mb-4">
            <div class="col-lg-3 col-md-6">
                <div class="stat-card stat-card--light-blue">
                    <div class="stat-icon stat-icon--light-blue">
                        <i class="bi bi-receipt"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Giá trị đơn trung bình:</div>
                        <div class="stat-value">{{ formatCurrency(averageOrderValue) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="stat-card stat-card--green">
                    <div class="stat-icon stat-icon--green">
                        <i class="bi bi-graph-up"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Lợi nhuận hôm nay</div>
                        <div class="stat-value">{{ formatCurrency(todayProfit) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="stat-card stat-card--pink-alt">
                    <div class="stat-icon stat-icon--pink-alt">
                        <i class="bi bi-people"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Đã thanh toán</div>
                        <div class="stat-value">{{ formatNumber(paidOrders) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="stat-card stat-card--orange">
                    <div class="stat-icon stat-icon--orange">
                        <i class="bi bi-bag-check"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Tổng đơn hàng</div>
                        <div class="stat-value">{{ formatNumber(totalOrders) }}</div>
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
                        <div v-if="recentOrders.length === 0" class="text-center text-muted py-4">
                            <i class="bi bi-receipt-cutoff fs-3 d-block mb-2"></i>
                            <p class="mb-0">Chưa có đơn hàng nào</p>
                        </div>
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
                        <div v-if="statusDistribution.length === 0" class="text-center text-muted py-4">
                            <i class="bi bi-pie-chart fs-3 d-block mb-2"></i>
                            <p class="mb-0">Chưa có dữ liệu</p>
                        </div>
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
.stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    border-radius: 16px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
    transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
}

.stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 1.5rem;
    color: #ffffff;
    border: 2px solid;
}

.stat-icon--purple {
    background: linear-gradient(135deg, #a855f7, #9333ea);
    border-color: #a855f7;
}

.stat-icon--blue {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    border-color: #3b82f6;
}

.stat-icon--yellow {
    background: linear-gradient(135deg, #eab308, #ca8a04);
    border-color: #eab308;
}

.stat-icon--pink {
    background: linear-gradient(135deg, #ec4899, #db2777);
    border-color: #ec4899;
}

.stat-icon--light-blue {
    background: linear-gradient(135deg, #06b6d4, #0891b2);
    border-color: #06b6d4;
}

.stat-icon--green {
    background: linear-gradient(135deg, #10b981, #059669);
    border-color: #10b981;
}

.stat-icon--pink-alt {
    background: linear-gradient(135deg, #f472b6, #ec4899);
    border-color: #f472b6;
}

.stat-icon--orange {
    background: linear-gradient(135deg, #f97316, #ea580c);
    border-color: #f97316;
}

.stat-content {
    flex: 1;
    min-width: 0;
}

.stat-label {
    font-size: 0.875rem;
    color: #64748b;
    margin-bottom: 0.25rem;
    font-weight: 500;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.2;
}

.list-group-item {
    transition: background-color 0.2s;
}

.list-group-item:hover {
    background-color: rgba(0, 0, 0, 0.02);
}
</style>

