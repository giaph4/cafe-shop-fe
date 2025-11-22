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

        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
        </div>
        <div v-else-if="error" class="alert alert-warning mb-0">
            {{ error }}
        </div>
        <template v-else>
            <div v-if="!customers.length" class="text-center py-5 text-muted">
                <i class="bi bi-people fs-1 d-block mb-3"></i>
                <p class="mb-0">Không có khách hàng nào phù hợp bộ lọc hiện tại.</p>
            </div>
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
    text-decoration: none;
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

.bg-soft-primary {
    background: rgba(99, 102, 241, 0.12);
    color: var(--color-primary, #4f46e5);
    font-weight: 600;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
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

