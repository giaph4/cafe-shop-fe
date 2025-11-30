<template>
    <div class="customer-list-tab">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
                <h5 class="mb-0">Danh sách khách hàng</h5>
                <small class="text-muted">Tổng: {{ totalElements.toLocaleString('vi-VN') }} khách hàng</small>
            </div>
            <div class="d-flex gap-2">
                <button
                    v-if="canExport"
                    class="btn btn-sm btn-outline-primary"
                    type="button"
                    @click="handleExport"
                    :disabled="loading || customers.length === 0"
                >
                    <i class="bi bi-download me-1"></i>
                    Xuất Excel
                </button>
                <button
                    v-if="canManage"
                    class="btn btn-sm btn-primary"
                    type="button"
                    @click="$emit('create')"
                >
                    <i class="bi bi-plus-lg me-1"></i>
                    Thêm khách hàng
                </button>
            </div>
        </div>

        <LoadingState v-if="loading" />
        <ErrorState v-else-if="error" :message="error" :show-retry="false" />
        <template v-else>
            <EmptyState
                v-if="!customers.length"
                title="Không có khách hàng"
                message="Không có khách hàng nào phù hợp bộ lọc hiện tại."
            >
                <template #icon>
                    <i class="bi bi-people"></i>
                </template>
            </EmptyState>
            <div v-else class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th scope="col">Khách hàng</th>
                            <th scope="col">Liên hệ</th>
                            <th scope="col" class="text-center">Điểm thưởng</th>
                            <th scope="col">Ngày tạo</th>
                            <th scope="col">Cập nhật</th>
                            <th scope="col" class="text-end">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="customer in customers" :key="customer.id">
                            <td>
                                <div class="d-flex flex-column">
                                    <button class="btn btn-link p-0 text-start fw-semibold" type="button" @click="$emit('view-detail', customer.id)">
                                        {{ customer.fullName || '—' }}
                                    </button>
                                    <small class="text-muted">Mã KH: {{ customer.id }}</small>
                                </div>
                            </td>
                            <td>
                                <div class="d-flex flex-column">
                                    <span><i class="bi bi-telephone me-1"></i>{{ customer.phone || '—' }}</span>
                                    <span class="text-muted small"><i class="bi bi-envelope me-1"></i>{{ customer.email || '—' }}</span>
                                </div>
                            </td>
                            <td class="text-center">
                                <span class="badge bg-soft-primary">
                                    {{ formatLoyaltyPoints(customer.loyaltyPoints) }}
                                </span>
                            </td>
                            <td>
                                <div class="text-muted small">{{ formatDate(customer.createdAt) }}</div>
                            </td>
                            <td>
                                <div class="text-muted small">{{ formatDate(customer.updatedAt) }}</div>
                            </td>
                            <td class="text-end">
                                <div class="action-grid">
                                    <button class="action-button" type="button" title="Xem chi tiết" @click="$emit('view-detail', customer.id)">
                                        <i class="bi bi-eye"></i>
                                        <span>Chi tiết</span>
                                    </button>
                                    <router-link
                                        :to="{ name: 'Chi tiết Khách hàng', params: { id: customer.id } }"
                                        class="action-button"
                                        title="Lịch sử mua hàng"
                                    >
                                        <i class="bi bi-receipt"></i>
                                        <span>Lịch sử</span>
                                    </router-link>
                                    <button
                                        v-if="canManage"
                                        class="action-button"
                                        type="button"
                                        title="Chỉnh sửa"
                                        @click="$emit('edit', customer)"
                                    >
                                        <i class="bi bi-pencil"></i>
                                        <span>Chỉnh sửa</span>
                                    </button>
                                    <button
                                        v-if="canDelete"
                                        class="action-button action-button--danger"
                                        type="button"
                                        title="Xóa khách hàng"
                                        @click="$emit('delete', customer)"
                                        :disabled="deleting"
                                    >
                                        <i class="bi bi-trash"></i>
                                        <span>Xóa</span>
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
import { formatDateTime, formatNumber } from '@/utils/formatters'
import Pagination from '@/components/common/Pagination.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const props = defineProps({
    customers: {
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
    canManage: {
        type: Boolean,
        default: false
    },
    canDelete: {
        type: Boolean,
        default: false
    },
    canExport: {
        type: Boolean,
        default: false
    },
    deleting: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['create', 'view-detail', 'edit', 'delete', 'page-change', 'export'])

const formatDate = (value) => {
    if (!value) return '—'
    return formatDateTime(value)
}

const formatLoyaltyPoints = (points) => {
    const numeric = Number(points)
    if (!Number.isFinite(numeric)) return '0'
    return formatNumber(numeric, { maximumFractionDigits: 0 })
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
    text-decoration: none;
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

.bg-soft-primary {
    background: var(--color-primary-soft);
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
    padding: var(--spacing-1) var(--spacing-3);
    border-radius: var(--radius-full);
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

