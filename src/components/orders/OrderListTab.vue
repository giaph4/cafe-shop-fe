<template>
    <div class="order-list-tab">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
                <h5 class="mb-0">Danh sách đơn hàng</h5>
                <small class="text-muted">Tổng: {{ totalElements.toLocaleString('vi-VN') }} đơn hàng</small>
            </div>
            <div class="d-flex gap-2">
                <button
                    v-if="canExport"
                    class="btn btn-sm btn-outline-primary"
                    type="button"
                    @click="handleExport"
                    :disabled="loading || orders.length === 0"
                >
                    <i class="bi bi-download me-1"></i>
                    Xuất Excel
                </button>
            </div>
        </div>

        <LoadingState v-if="loading" />
        <ErrorState v-else-if="error" :message="error" :show-retry="false" />
        <template v-else>
            <EmptyState
                v-if="!orders.length"
                title="Không có đơn hàng"
                message="Không có đơn hàng nào phù hợp bộ lọc hiện tại."
            >
                <template #icon>
                    <i class="bi bi-receipt-cutoff"></i>
                </template>
            </EmptyState>
            <div v-else class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th scope="col">ID</th>
                            <th scope="col">Bàn</th>
                            <th scope="col">Nhân viên</th>
                            <th scope="col" class="d-none d-md-table-cell">Khách hàng</th>
                            <th scope="col" class="text-end">Tổng tiền</th>
                            <th scope="col">Trạng thái</th>
                            <th scope="col" class="d-none d-lg-table-cell">Ngày tạo</th>
                            <th scope="col" class="text-end">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="order in orders" :key="order.id">
                            <td class="fw-semibold">#{{ order.id }}</td>
                            <td>{{ order.tableName || 'Mang về' }}</td>
                            <td>{{ order.staffUsername || '—' }}</td>
                            <td class="d-none d-md-table-cell">{{ order.customerName || 'Khách lẻ' }}</td>
                            <td class="text-end fw-semibold">{{ formatCurrency(order.totalAmount) }}</td>
                            <td>
                                <span :class="getStatusBadgeClass(order.status)">
                                    {{ getStatusLabel(order.status) }}
                                </span>
                            </td>
                            <td class="d-none d-lg-table-cell">
                                <div class="text-muted small">{{ formatDateTime(order.createdAt) }}</div>
                            </td>
                            <td class="text-end">
                                <div class="action-grid">
                                    <button
                                        class="action-button"
                                        type="button"
                                        title="Xem chi tiết"
                                        @click="$emit('view-detail', order.id)"
                                    >
                                        <i class="bi bi-eye"></i>
                                        <span>Chi tiết</span>
                                    </button>
                                    <button
                                        v-if="canCancel"
                                        class="action-button action-button--primary"
                                        type="button"
                                        title="Cập nhật đơn hàng"
                                        @click="$emit('update', order)"
                                    >
                                        <i class="bi bi-pencil"></i>
                                        <span>Cập nhật</span>
                                    </button>
                                    <button
                                        v-if="canCancel && order.status === 'PENDING'"
                                        class="action-button action-button--danger"
                                        type="button"
                                        title="Hủy đơn"
                                        @click="$emit('cancel', order)"
                                        :disabled="cancelling"
                                    >
                                        <i class="bi bi-x-circle"></i>
                                        <span>Hủy</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="d-flex justify-content-end mt-3" v-if="totalPages > 1">
                <Pagination
                    mode="zero-based"
                    :current-page="zeroBasedPage"
                    :total-pages="totalPages"
                    @page-change="$emit('page-change', $event)"
                />
            </div>
        </template>
    </div>
</template>

<script setup>
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import Pagination from '@/components/common/Pagination.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const props = defineProps({
    orders: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    },
    error: {
        type: String,
        default: ''
    },
    zeroBasedPage: {
        type: Number,
        default: 0
    },
    totalPages: {
        type: Number,
        default: 0
    },
    totalElements: {
        type: Number,
        default: 0
    },
    canExport: {
        type: Boolean,
        default: false
    },
    canCancel: {
        type: Boolean,
        default: false
    },
    cancelling: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['view-detail', 'cancel', 'page-change', 'export'])

const STATUS_METADATA = {
    PENDING: { label: 'Đang chờ', badgeClass: 'badge bg-warning-subtle text-warning' },
    PAID: { label: 'Đã thanh toán', badgeClass: 'badge bg-success-subtle text-success' },
    CANCELLED: { label: 'Đã hủy', badgeClass: 'badge bg-danger-subtle text-danger' },
    TRANSFERRED: { label: 'Đã chuyển ca', badgeClass: 'badge bg-info-subtle text-info' }
}

const getStatusLabel = (status) => {
    return STATUS_METADATA[status]?.label || status
}

const getStatusBadgeClass = (status) => {
    return STATUS_METADATA[status]?.badgeClass || 'badge bg-secondary-subtle text-secondary'
}

const handleExport = () => {
    emit('export')
}
</script>

<style scoped>
.action-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    justify-content: flex-end;
}

.action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-1);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-primary-border-soft);
    background: var(--color-card);
    color: var(--color-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    transition: all var(--transition-fast);
    cursor: pointer;
    min-width: auto;
}

.action-button:hover:not(:disabled) {
    background: var(--color-primary-soft);
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
    border-color: var(--color-primary-border);
}

.action-button:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    pointer-events: none;
}

.action-button i {
    font-size: var(--font-size-base);
}

.action-button--primary {
    border-color: var(--color-primary-border);
    background: var(--color-primary-soft);
    color: var(--color-primary);
}

.action-button--primary:hover:not(:disabled) {
    background: var(--color-primary);
    color: var(--color-white);
    border-color: var(--color-primary);
}

.action-button--danger {
    border-color: var(--color-danger-border);
    background: var(--color-danger-soft);
    color: var(--color-danger);
}

.action-button--danger:hover:not(:disabled) {
    background: var(--color-danger);
    color: var(--color-white);
    border-color: var(--color-danger);
    box-shadow: var(--shadow-md);
}

@media (max-width: 768px) {
    .action-grid {
        flex-direction: column;
        gap: var(--spacing-1);
    }
    
    .action-button {
        width: 100%;
        justify-content: center;
    }
    
    .action-button span {
        display: none;
    }
}
</style>

