<template>
    <div class="shift-assignment-list-tab">
        <div class="card filter-card mb-4">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-lg-4 col-md-6">
                        <label class="form-label">Ca làm <span class="text-danger">*</span></label>
                        <select class="form-select" v-model.number="filters.shiftId" required>
                            <option :value="null">Chọn ca làm</option>
                            <option v-for="opt in shiftOptions" :key="opt.value" :value="opt.value">
                                {{ opt.label }}
                            </option>
                        </select>
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label">Trạng thái</label>
                        <select class="form-select" v-model="filters.status">
                            <option value="">Tất cả</option>
                            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label">Nhân viên</label>
                        <select class="form-select" v-model.number="filters.userId">
                            <option :value="null">Tất cả</option>
                            <option v-for="opt in staffOptions" :key="opt.value" :value="opt.value">
                                {{ opt.label }}
                            </option>
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
                    v-else-if="!assignments.length"
                    title="Chưa có phân công nào"
                    message="Tạo phân công mới bằng nút ở góc trên bên phải."
                />
                <div v-else class="table-responsive">
                    <table class="table align-middle">
                        <thead class="table-light">
                        <tr>
                            <th>Nhân viên</th>
                            <th>Ca làm</th>
                            <th>Thời gian</th>
                            <th>Doanh thu</th>
                            <th>Lương</th>
                            <th>Trạng thái</th>
                            <th class="text-end">Hành động</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="assignment in assignments" :key="assignment.id">
                            <td>
                                <div class="fw-semibold">{{ assignment.fullName || assignment.username }}</div>
                                <div class="text-muted small">{{ assignment.username }}</div>
                                <div class="text-muted small" v-if="assignment.roleName">Vai trò: {{ assignment.roleName }}</div>
                            </td>
                            <td>
                                <div class="text-muted small">Shift #{{ assignment.shiftId }}</div>
                            </td>
                            <td>
                                <div>{{ formatTime(assignment.plannedStart) }} - {{ formatTime(assignment.plannedEnd) }}</div>
                                <div class="text-muted small">{{ assignment.plannedMinutes }} phút</div>
                                <div class="text-muted small" v-if="assignment.actualMinutes">
                                    Thực tế: {{ assignment.actualMinutes }} phút
                                </div>
                            </td>
                            <td>
                                <div class="fw-semibold">{{ formatCurrency(assignment.totalRevenue ?? 0) }}</div>
                                <div class="text-muted small" v-if="assignment.totalOrders">
                                    {{ assignment.totalOrders }} đơn
                                </div>
                            </td>
                            <td>
                                <div>{{ formatCurrency(assignment.hourlyRate ?? 0) }}/giờ</div>
                                <div class="text-muted small" v-if="assignment.fixedAllowance">
                                    Phụ cấp: {{ formatCurrency(assignment.fixedAllowance) }}
                                </div>
                            </td>
                            <td>
                                <span class="badge" :class="statusClass(assignment.status)">
                                    {{ translateStatus(assignment.status) }}
                                </span>
                            </td>
                            <td class="text-end">
                                <div class="btn-group">
                                    <button class="btn btn-sm btn-outline-primary" @click="handleViewDetail(assignment)">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-secondary" @click="handleEdit(assignment)">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-success" @click="handleUpdateStatus(assignment)">
                                        <i class="bi bi-arrow-repeat"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" @click="handleRemove(assignment)">
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
import { formatCurrency } from '@/utils/formatters'

const props = defineProps({
    assignments: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    error: { type: String, default: null },
    filters: { type: Object, required: true },
    statusOptions: { type: Array, default: () => [] },
    shiftOptions: { type: Array, default: () => [] },
    staffOptions: { type: Array, default: () => [] }
})

const emit = defineEmits([
    'filter',
    'reset-filters',
    'view-detail',
    'edit',
    'update-status',
    'remove'
])

const formatTime = (time) => {
    if (!time) return '--:--'
    return time.length === 5 ? time : time.slice(0, 5)
}

const translateStatus = (status) => {
    const map = {
        SCHEDULED: 'Đã xếp',
        CONFIRMED: 'Đã xác nhận',
        IN_PROGRESS: 'Đang làm',
        COMPLETED: 'Hoàn thành',
        CANCELLED: 'Đã hủy'
    }
    return map[status] || status
}

const statusClass = (status) => {
    switch (status) {
        case 'COMPLETED':
            return 'bg-success'
        case 'IN_PROGRESS':
            return 'bg-warning text-dark'
        case 'CONFIRMED':
            return 'bg-info text-dark'
        case 'CANCELLED':
            return 'bg-danger'
        default:
            return 'bg-secondary'
    }
}

const handleResetFilters = () => emit('reset-filters')
const handleViewDetail = (assignment) => emit('view-detail', assignment)
const handleEdit = (assignment) => emit('edit', assignment)
const handleUpdateStatus = (assignment) => emit('update-status', assignment)
const handleRemove = (assignment) => emit('remove', assignment)
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
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.table-card :global(.badge.bg-success) {
    background: var(--color-soft-emerald);
    color: var(--color-success);
    border: 1px solid var(--color-success);
}

.table-card :global(.badge.bg-warning) {
    background: var(--color-soft-amber);
    color: var(--color-warning);
    border: 1px solid var(--color-warning);
}

.table-card :global(.badge.bg-info) {
    background: var(--color-soft-indigo);
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
}

.table-card :global(.badge.bg-danger) {
    background: var(--color-soft-rose);
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
}

.table-card :global(.badge.bg-secondary) {
    background: var(--color-card-muted);
    color: var(--color-heading);
    border: 1px solid var(--color-border);
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

.table-card :global(.btn-group .btn-outline-primary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.table-card :global(.btn-group .btn-outline-primary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.table-card :global(.btn-group .btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.table-card :global(.btn-group .btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.table-card :global(.btn-group .btn-outline-success) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.table-card :global(.btn-group .btn-outline-success:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.table-card :global(.btn-group .btn-outline-danger) {
    border-color: var(--color-border);
    color: var(--color-danger);
    background: transparent;
}

.table-card :global(.btn-group .btn-outline-danger:hover:not(:disabled)) {
    background: var(--color-soft-rose);
    border-color: var(--color-danger);
    color: var(--color-danger);
}
</style>

