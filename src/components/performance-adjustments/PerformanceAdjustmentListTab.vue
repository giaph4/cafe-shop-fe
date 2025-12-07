<template>
    <div class="performance-adjustment-list-tab">
        <div class="card filter-card mb-4">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-lg-4 col-md-6">
                        <label class="form-label">Phân công <span class="text-danger">*</span></label>
                        <select class="form-select" v-model.number="filters.assignmentId" required>
                            <option :value="null">Chọn phân công</option>
                            <option v-for="opt in assignmentOptions" :key="opt.value" :value="opt.value">
                                {{ opt.label }}
                            </option>
                        </select>
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label">Loại</label>
                        <select class="form-select" v-model="filters.type">
                            <option value="">Tất cả</option>
                            <option v-for="option in typeOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label">Trạng thái</label>
                        <select class="form-select" v-model="filters.revoked">
                            <option :value="null">Tất cả</option>
                            <option :value="false">Đang hiệu lực</option>
                            <option :value="true">Đã thu hồi</option>
                        </select>
                    </div>
                    <div class="col-lg-2 col-md-6 text-lg-end text-md-start">
                        <button class="btn btn-outline-secondary" type="button" @click="handleResetFilters">Xóa bộ lọc</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card table-card">
            <div class="card-body">
                <LoadingState v-if="loading" />
                <ErrorState 
                    v-else-if="error" 
                    :message="error"
                />
                <EmptyState
                    v-else-if="!adjustments.length"
                    title="Chưa có điều chỉnh nào"
                    message="Tạo điều chỉnh mới bằng nút ở góc trên bên phải."
                />
                <div v-else class="table-responsive">
                    <table class="table align-middle">
                        <thead class="table-light">
                        <tr>
                            <th>Loại</th>
                            <th>Số tiền</th>
                            <th>Lý do</th>
                            <th>Hiệu lực từ</th>
                            <th>Trạng thái</th>
                            <th>Người tạo</th>
                            <th class="text-end">Hành động</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="adjustment in adjustments" :key="adjustment.id">
                            <td>
                                <span class="badge" :class="typeClass(adjustment.type)">
                                    {{ translateType(adjustment.type) }}
                                </span>
                            </td>
                            <td>
                                <div class="fw-semibold" :class="adjustment.type === 'BONUS' ? 'text-success' : 'text-danger'">
                                    {{ adjustment.type === 'BONUS' ? '+' : '-' }}{{ formatCurrency(adjustment.amount || 0) }}
                                </div>
                            </td>
                            <td>
                                <div>{{ adjustment.reason || '—' }}</div>
                            </td>
                            <td>
                                <div>{{ formatDateTime(adjustment.effectiveAt || adjustment.createdAt || null) }}</div>
                            </td>
                            <td>
                                <span class="badge" :class="adjustment.revoked ? 'bg-secondary' : 'bg-success'">
                                    {{ adjustment.revoked ? 'Đã thu hồi' : 'Đang hiệu lực' }}
                                </span>
                                <div class="text-muted small" v-if="adjustment.revoked && adjustment.revokedAt">
                                    {{ formatDateTime(adjustment.revokedAt) }}
                                </div>
                            </td>
                            <td>
                                <div class="text-muted small">{{ adjustment.createdBy || 'Hệ thống' }}</div>
                            </td>
                            <td class="text-end">
                                <div class="btn-group">
                                    <button
                                        v-if="!adjustment.revoked"
                                        class="btn btn-sm btn-outline-warning"
                                        @click="handleRevoke(adjustment)"
                                    >
                                        <i class="bi bi-x-circle"></i> Thu hồi
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" @click="handleRemove(adjustment)">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { formatCurrency, formatDateTime } from '@/utils/formatters'

const props = defineProps({
    adjustments: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    error: { type: String, default: null },
    filters: { type: Object, required: true },
    typeOptions: { type: Array, default: () => [] },
    assignmentOptions: { type: Array, default: () => [] }
})

const emit = defineEmits([
    'filter',
    'reset-filters',
    'edit',
    'revoke',
    'remove'
])

const translateType = (type) => {
    if (!type || typeof type !== 'string') return type || '—'
    const map = {
        BONUS: 'Thưởng',
        PENALTY: 'Phạt'
    }
    return map[type] || type
}

const typeClass = (type) => {
    if (!type || typeof type !== 'string') return 'bg-secondary'
    return type === 'BONUS' ? 'bg-success' : 'bg-danger'
}

const handleResetFilters = () => emit('reset-filters')
const handleRevoke = (adjustment) => emit('revoke', adjustment)
const handleRemove = (adjustment) => emit('remove', adjustment)
</script>

<style scoped lang="scss">
.filter-card,
.table-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.filter-card :global(.card-body),
.table-card :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.filter-card :global(.form-label) {
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-select) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.filter-card :global(.btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    padding: var(--spacing-2) var(--spacing-4);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.filter-card :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.table-card :global(.table) {
    margin-bottom: 0;
}

.table-card :global(.table thead),
.table-card :global(.table thead.table-light) {
    background: var(--color-card-muted);
}

.table-card :global(.table thead th) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    background: var(--color-card-muted);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-3);
    font-family: var(--font-family-sans);
}

.table-card :global(.table tbody td) {
    padding: var(--spacing-3);
    vertical-align: middle;
    border-bottom: 1px solid var(--color-border);
    font-family: var(--font-family-sans);
}

.table-card :global(.table tbody tr:last-child td) {
    border-bottom: none;
}

.table-card :global(.table tbody tr:hover) {
    background: var(--color-card-muted);
}

.table-card :global(.fw-semibold) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.table-card :global(.badge) {
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    display: inline-block;
    min-width: 100px;
    text-align: center;
    border: 2px solid;
    letter-spacing: 0.02em;
}

.table-card :global(.badge.bg-success) {
    background: var(--color-success);
    color: var(--color-text-inverse);
    border-color: var(--color-success);
}

.table-card :global(.badge.bg-danger) {
    background: var(--color-danger);
    color: var(--color-text-inverse);
    border-color: var(--color-danger);
}

.table-card :global(.badge.bg-secondary) {
    background: var(--color-heading);
    color: var(--color-text-inverse);
    border-color: var(--color-heading);
}

.table-card :global(.text-success) {
    color: var(--color-success);
}

.table-card :global(.text-danger) {
    color: var(--color-danger);
}

.table-card :global(.text-muted) {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.table-card :global(.btn-group) {
    display: flex;
    gap: var(--spacing-1);
}

.table-card :global(.btn-group .btn-sm) {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.table-card :global(.btn-group .btn-outline-warning) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.table-card :global(.btn-group .btn-outline-warning:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.table-card :global(.btn-group .btn-outline-danger) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.table-card :global(.btn-group .btn-outline-danger:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}
</style>

