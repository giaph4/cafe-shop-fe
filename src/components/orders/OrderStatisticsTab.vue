<template>
    <div class="order-statistics-tab">
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
                            <span class="text-muted small">Tổng doanh thu</span>
                            <i class="bi bi-cash-stack text-success fs-4"></i>
                        </div>
                        <h3 class="mb-0">{{ formatCurrency(totalRevenue) }}</h3>
                        <small class="text-muted">Từ đơn đã thanh toán</small>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="card card-shadow h-100">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex align-items-center justify-content-between mb-2">
                            <span class="text-muted small">Đơn trung bình</span>
                            <i class="bi bi-graph-up text-info fs-4"></i>
                        </div>
                        <h3 class="mb-0">{{ formatCurrency(averageOrderValue) }}</h3>
                        <small class="text-muted">Giá trị trung bình</small>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="card card-shadow h-100">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex align-items-center justify-content-between mb-2">
                            <span class="text-muted small">Tỷ lệ thanh toán</span>
                            <i class="bi bi-percent text-primary fs-4"></i>
                        </div>
                        <h3 class="mb-0">{{ formatPercent(paidRate) }}</h3>
                        <small class="text-muted">{{ paidOrders }}/{{ totalOrders }} đơn</small>
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-3">
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
            <div class="col-lg-6">
                <div class="card card-shadow">
                    <div class="card-header bg-white">
                        <h5 class="mb-0">Đơn hàng theo tháng</h5>
                    </div>
                    <div class="card-body">
                        <div v-if="monthlyOrders.length === 0" class="text-center text-muted py-4">
                            <i class="bi bi-bar-chart fs-3 d-block mb-2"></i>
                            <p class="mb-0">Chưa có dữ liệu</p>
                        </div>
                        <div v-else>
                            <div
                                v-for="item in monthlyOrders"
                                :key="item.month"
                                class="mb-3"
                            >
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="small fw-semibold">{{ item.monthLabel }}</span>
                                    <span class="small text-muted">{{ item.count }} đơn • {{ formatCurrency(item.revenue) }}</span>
                                </div>
                                <div class="progress" style="height: 8px;">
                                    <div
                                        class="progress-bar bg-primary"
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
import { formatCurrency, formatNumber, formatPercent } from '@/utils/formatters'

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
    PENDING: { label: 'Đang chờ', progressClass: 'bg-warning' },
    PAID: { label: 'Đã thanh toán', progressClass: 'bg-success' },
    CANCELLED: { label: 'Đã hủy', progressClass: 'bg-danger' },
    TRANSFERRED: { label: 'Đã chuyển ca', progressClass: 'bg-info' }
}

const totalOrders = computed(() => props.orders.length)

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

const averageOrderValue = computed(() => {
    if (paidOrders.value === 0) return 0
    return totalRevenue.value / paidOrders.value
})

const statusDistribution = computed(() => {
    const distribution = {}
    props.orders.forEach(order => {
        distribution[order.status] = (distribution[order.status] || 0) + 1
    })

    const maxCount = Math.max(...Object.values(distribution), 1)

    return Object.entries(distribution).map(([status, count]) => {
        const meta = STATUS_METADATA[status] || { label: status, progressClass: 'bg-secondary' }
        return {
            status,
            label: meta.label,
            count,
            percentage: (count / maxCount) * 100
        }
    }).sort((a, b) => b.count - a.count)
})

const monthlyOrders = computed(() => {
    const monthly = {}
    props.orders.forEach(order => {
        const date = new Date(order.createdAt)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!monthly[monthKey]) {
            monthly[monthKey] = { count: 0, revenue: 0 }
        }
        monthly[monthKey].count++
        if (order.status === 'PAID') {
            monthly[monthKey].revenue += Number(order.totalAmount) || 0
        }
    })

    const maxCount = Math.max(...Object.values(monthly).map(m => m.count), 1)

    return Object.entries(monthly)
        .map(([month, data]) => {
            const [year, monthNum] = month.split('-')
            const date = new Date(parseInt(year), parseInt(monthNum) - 1)
            return {
                month,
                monthLabel: date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
                count: data.count,
                revenue: data.revenue,
                percentage: (data.count / maxCount) * 100
            }
        })
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6) // Last 6 months
})

const getStatusProgressClass = (status) => {
    return STATUS_METADATA[status]?.progressClass || 'bg-secondary'
}
</script>

<style scoped>
.card-shadow {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: none;
}
</style>

