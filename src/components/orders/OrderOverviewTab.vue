<template>
    <div class="order-overview-tab">
        <div class="row g-3 mb-4">
            <div class="col-lg-3 col-md-6">
                <div class="card card-shadow h-100">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex align-items-center justify-content-between mb-2">
                            <span class="text-muted small">Tổng đơn hàng</span>
                            <i class="bi bi-receipt text-primary fs-4"></i>
                        </div>
                        <h3 class="mb-0">{{ formatNumber(totalOrders) }}</h3>
                        <small class="text-muted">Tất cả thời gian</small>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="card card-shadow h-100">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex align-items-center justify-content-between mb-2">
                            <span class="text-muted small">Đơn đang chờ</span>
                            <i class="bi bi-clock-history text-warning fs-4"></i>
                        </div>
                        <h3 class="mb-0">{{ formatNumber(pendingOrders) }}</h3>
                        <small class="text-muted">Chưa thanh toán</small>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="card card-shadow h-100">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex align-items-center justify-content-between mb-2">
                            <span class="text-muted small">Đã thanh toán</span>
                            <i class="bi bi-check-circle text-success fs-4"></i>
                        </div>
                        <h3 class="mb-0">{{ formatNumber(paidOrders) }}</h3>
                        <small class="text-muted">{{ formatPercent(paidRate) }} tổng đơn</small>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="card card-shadow h-100">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex align-items-center justify-content-between mb-2">
                            <span class="text-muted small">Tổng doanh thu</span>
                            <i class="bi bi-cash-stack text-primary fs-4"></i>
                        </div>
                        <h3 class="mb-0">{{ formatCurrency(totalRevenue) }}</h3>
                        <small class="text-muted">Từ đơn đã thanh toán</small>
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
.card-shadow {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: none;
}

.list-group-item {
    transition: background-color 0.2s;
}

.list-group-item:hover {
    background-color: rgba(0, 0, 0, 0.02);
}
</style>

