<template>
    <div class="order-statistics-tab">
        <div class="row g-3 mb-4">
            <div class="col-lg-3 col-md-6">
                <div class="stat-card stat-card--orange">
                    <div class="stat-icon stat-icon--orange">
                        <i class="bi bi-receipt"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Tổng đơn hàng</div>
                        <div class="stat-value">{{ formatNumber(totalOrders) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="stat-card stat-card--green">
                    <div class="stat-icon stat-icon--green">
                        <i class="bi bi-cash-stack"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Tổng doanh thu</div>
                        <div class="stat-value">{{ formatCurrency(totalRevenue) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="stat-card stat-card--light-blue">
                    <div class="stat-icon stat-icon--light-blue">
                        <i class="bi bi-graph-up"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Giá trị đơn trung bình</div>
                        <div class="stat-value">{{ formatCurrency(averageOrderValue) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="stat-card stat-card--purple">
                    <div class="stat-icon stat-icon--purple">
                        <i class="bi bi-percent"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Tỷ lệ thanh toán</div>
                        <div class="stat-value">{{ formatPercent(paidRate) }}</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-3">
            <div class="col-lg-12">
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

    return Object.entries(distribution).map(([status, count]) => {
        const meta = STATUS_METADATA[status] || { label: status, progressClass: 'bg-secondary' }
        return {
            status,
            label: meta.label,
            count,
            percentage: totalOrders.value > 0 ? (count / totalOrders.value) * 100 : 0
        }
    }).sort((a, b) => b.count - a.count)
})

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

.stat-icon--orange {
    background: linear-gradient(135deg, #f97316, #ea580c);
    border-color: #f97316;
}

.stat-icon--green {
    background: linear-gradient(135deg, #10b981, #059669);
    border-color: #10b981;
}

.stat-icon--light-blue {
    background: linear-gradient(135deg, #06b6d4, #0891b2);
    border-color: #06b6d4;
}

.stat-icon--purple {
    background: linear-gradient(135deg, #a855f7, #9333ea);
    border-color: #a855f7;
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

.card-shadow {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: none;
}
</style>

