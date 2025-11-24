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

        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
        </div>
        <div v-else-if="error" class="alert alert-warning mb-0">
            {{ error }}
        </div>
        <template v-else>
            <div v-if="!orders.length" class="text-center py-5 text-muted">
                <i class="bi bi-receipt-cutoff fs-1 d-block mb-3"></i>
                <p class="mb-0">Không có đơn hàng nào phù hợp bộ lọc hiện tại.</p>
            </div>
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
                                <span :class="['badge', getStatusBadgeClass(order.status)]">
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
    PENDING: { label: 'Đang chờ', badgeClass: 'bg-warning-subtle text-warning' },
    PAID: { label: 'Đã thanh toán', badgeClass: 'bg-success-subtle text-success' },
    CANCELLED: { label: 'Đã hủy', badgeClass: 'bg-danger-subtle text-danger' },
    TRANSFERRED: { label: 'Đã chuyển ca', badgeClass: 'bg-info-subtle text-info' }
}

const getStatusLabel = (status) => {
    return STATUS_METADATA[status]?.label || status
}

const getStatusBadgeClass = (status) => {
    return STATUS_METADATA[status]?.badgeClass || 'bg-secondary-subtle text-secondary'
}

const handleExport = () => {
    emit('export')
}
</script>

<style scoped>
.action-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: flex-end;
}

.action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.45rem 0.75rem;
    border-radius: 12px;
    border: 1px solid rgba(99, 102, 241, 0.28);
    background: var(--color-button-muted-bg, rgba(148, 163, 184, 0.08));
    color: var(--color-primary, #4f46e5);
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.2s ease;
    cursor: pointer;
    min-width: auto;
}

.action-button:hover:not(:disabled) {
    background: var(--color-button-muted-hover, rgba(99, 102, 241, 0.12));
    box-shadow: 0 6px 16px rgba(79, 70, 229, 0.18);
    transform: translateY(-1px);
    border-color: rgba(99, 102, 241, 0.4);
}

.action-button:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    pointer-events: none;
}

.action-button i {
    font-size: 0.95rem;
}

.action-button--danger {
    border-color: rgba(239, 68, 68, 0.32);
    color: var(--color-danger, #ef4444);
    background: rgba(239, 68, 68, 0.08);
}

.action-button--danger:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.12);
    border-color: rgba(239, 68, 68, 0.5);
    color: var(--color-danger, #ef4444);
    box-shadow: 0 6px 16px rgba(239, 68, 68, 0.18);
}

@media (max-width: 768px) {
    .action-grid {
        flex-direction: column;
        gap: 0.35rem;
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

