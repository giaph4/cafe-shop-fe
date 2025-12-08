<template>
    <div class="cancelled-orders-list">
        <div v-if="orders.length === 0" class="empty-list">
            <EmptyState
                title="Không có dữ liệu"
                message="Không tìm thấy đơn hủy nào"
            />
        </div>
        <div v-else class="table-responsive">
            <table class="table table-minimal">
                <thead>
                    <tr>
                        <th>Mã đơn</th>
                        <th>Thời gian</th>
                        <th>Tổng tiền</th>
                        <th>Lý do hủy</th>
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
                            <div>{{ formatDateTime(order.createdAt) }}</div>
                            <small class="text-muted">{{ formatTime(order.createdAt) }}</small>
                        </td>
                        <td class="revenue-lost">{{ formatCurrency(order.totalAmount || 0) }}</td>
                        <td>
                            <span class="reason-badge">{{ order.cancellationReason || order.reason || 'Không rõ' }}</span>
                        </td>
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
import { formatCurrency, formatDateTime, formatTime } from '@/utils/formatters'
import EmptyState from '@/components/common/EmptyState.vue'

defineProps({
    orders: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
})

defineEmits(['view'])
</script>

<style scoped>
.cancelled-orders-list {
    font-family: var(--font-family-sans);
}

.empty-list {
    padding: var(--spacing-8) 0;
}

.order-id {
    font-family: var(--font-family-sans);
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
}

.revenue-lost {
    color: var(--color-danger);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
}

.reason-badge {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    background: var(--color-soft-rose);
    color: var(--color-danger);
    display: inline-block;
}
</style>

