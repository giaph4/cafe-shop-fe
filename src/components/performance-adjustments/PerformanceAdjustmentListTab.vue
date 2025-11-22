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
                <div v-if="loading" class="text-center py-5">
                    <div class="spinner-border text-primary"></div>
                </div>
                <div v-else-if="error" class="alert alert-warning d-flex align-items-center gap-2">
                    <i class="bi bi-exclamation-triangle"></i>
                    <span>{{ error }}</span>
                </div>
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
                                    {{ adjustment.type === 'BONUS' ? '+' : '-' }}{{ formatCurrency(adjustment.amount) }}
                                </div>
                            </td>
                            <td>
                                <div>{{ adjustment.reason || '—' }}</div>
                            </td>
                            <td>
                                <div>{{ formatDateTime(adjustment.effectiveAt || adjustment.createdAt) }}</div>
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
    const map = {
        BONUS: 'Thưởng',
        PENALTY: 'Phạt'
    }
    return map[type] || type
}

const typeClass = (type) => {
    return type === 'BONUS' ? 'bg-success' : 'bg-danger'
}

const handleResetFilters = () => emit('reset-filters')
const handleRevoke = (adjustment) => emit('revoke', adjustment)
const handleRemove = (adjustment) => emit('remove', adjustment)
</script>

<style scoped>
.filter-card,
.table-card {
    border-radius: 18px;
    border: 1px solid var(--color-border);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
}
</style>

