<template>
    <div class="pending-orders-list">
        <div v-if="orders.length === 0" class="text-muted text-center">
            Không có đơn hàng đang chờ
        </div>
        <div v-else class="table-responsive">
            <table class="table table-minimal">
                <thead>
                    <tr>
                        <th>Mã đơn</th>
                        <th>Thời gian</th>
                        <th>Tổng tiền</th>
                        <th>Bàn</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="order in orders"
                        :key="order.id || order.orderId"
                    >
                        <td>
                            <div class="fw-semibold order-id">#{{ order.id || order.orderId || 'N/A' }}</div>
                        </td>
                        <td>
                            <div>{{ formatTime(order.createdAt) }}</div>
                            <small class="text-muted">{{ formatRelativeTime(order.createdAt) }}</small>
                        </td>
                        <td class="revenue-cell">{{ formatCurrency(order.totalAmount || 0) }}</td>
                        <td>{{ order.tableName || order.table?.name || 'Takeaway' }}</td>
                        <td>
                            <button
                                class="btn btn-flat btn-flat--outline btn-sm"
                                @click="$emit('view', order)"
                                title="Xem chi tiết"
                            >
                                <i class="bi bi-eye"></i>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { formatCurrency, formatTime } from '@/utils/formatters'

const props = defineProps({
    orders: {
        type: Array,
        default: () => []
    }
})

defineEmits(['view'])

const formatRelativeTime = (dateTime) => {
    if (!dateTime) return ''
    const date = new Date(dateTime)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} giờ trước`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} ngày trước`
}
</script>

<style scoped>
.pending-orders-list {
    font-family: var(--font-family-sans);
}

.order-id {
    font-family: var(--font-family-sans);
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
}

.revenue-cell {
    color: var(--color-success);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
}
</style>

