<template>
    <div class="shift-instances-tab">
        <div class="card filter-card mb-4">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-lg-3 col-md-4">
                        <label class="form-label">Từ ngày</label>
                        <input type="date" class="form-control" v-model="filters.from" />
                    </div>
                    <div class="col-lg-3 col-md-4">
                        <label class="form-label">Đến ngày</label>
                        <input type="date" class="form-control" v-model="filters.to" />
                    </div>
                    <div class="col-lg-3 col-md-4">
                        <label class="form-label">Trạng thái</label>
                        <select class="form-select" v-model="filters.status">
                            <option value="">Tất cả</option>
                            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                    <div class="col-lg-3 col-md-4 text-lg-end text-md-start">
                        <button class="btn btn-primary me-2" type="button" @click="handleFilter">
                            <i class="bi bi-funnel me-1"></i>Lọc
                        </button>
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
                    v-else-if="!instances.length"
                    title="Chưa có ca làm nào"
                    message="Tạo ca mới bằng nút ở góc trên bên phải."
                />
                <div v-else class="table-responsive">
                    <table class="table align-middle">
                        <thead class="table-light">
                        <tr>
                            <th>Ngày</th>
                            <th>Giờ</th>
                            <th>Template</th>
                            <th>Trạng thái</th>
                            <th>Phân công</th>
                            <th class="text-end">Hành động</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="instance in instances" :key="instance.id">
                            <td>
                                <div class="fw-semibold">{{ formatDate(instance.shiftDate) }}</div>
                                <div class="text-muted small">Tạo bởi {{ instance.createdBy || 'Hệ thống' }}</div>
                            </td>
                            <td>
                                {{ formatTime(instance.startTime) }} - {{ formatTime(instance.endTime) }}
                                <div class="text-muted small" v-if="instance.notes">{{ instance.notes }}</div>
                            </td>
                            <td>
                                <div class="fw-semibold">{{ instance.templateName }}</div>
                                <div class="text-muted small">ID: {{ instance.templateId }}</div>
                            </td>
                            <td>
                                <span class="badge" :class="statusClass(instance.status)">
                                    {{ translateStatus(instance.status) }}
                                </span>
                            </td>
                            <td>
                                <div class="fw-semibold">{{ instance.assignments?.length || 0 }} nhân viên</div>
                                <div class="text-muted small">
                                    {{ summarizeAssignments(instance.assignments) }}
                                </div>
                            </td>
                            <td class="text-end">
                                <div class="action-buttons">
                                    <button class="action-button action-button--primary" @click="handleViewDetail(instance)" title="Xem chi tiết">
                                        <i class="bi bi-eye"></i>
                                        <span>Chi tiết</span>
                                    </button>
                                    <button class="action-button action-button--primary" @click="handleEdit(instance)" title="Chỉnh sửa">
                                        <i class="bi bi-pencil"></i>
                                        <span>Chỉnh sửa</span>
                                    </button>
                                    <button class="action-button action-button--info" @click="handleUpdateStatus(instance)" title="Cập nhật trạng thái">
                                        <i class="bi bi-arrow-repeat"></i>
                                        <span>Trạng thái</span>
                                    </button>
                                    <button class="action-button action-button--danger" @click="handleRemove(instance)" title="Xóa">
                                        <i class="bi bi-trash"></i>
                                        <span>Xóa</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="card-footer d-flex justify-content-end" v-if="pagination.totalPages > 1">
                <Pagination
                    mode="zero-based"
                    :current-page="pagination.number"
                    :total-pages="pagination.totalPages"
                    @page-change="handlePageChange"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import EmptyState from '@/components/common/EmptyState.vue'
import Pagination from '@/components/common/Pagination.vue'
import { formatDate } from '@/utils/formatters'

const props = defineProps({
    instances: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    error: { type: String, default: null },
    filters: { type: Object, required: true },
    statusOptions: { type: Array, default: () => [] },
    pagination: { type: Object, required: true }
})

const emit = defineEmits([
    'filter',
    'reset-filters',
    'view-detail',
    'edit',
    'update-status',
    'remove',
    'page-change'
])

const formatTime = (time) => {
    if (!time) return '--:--'
    return time.length === 5 ? time : time.slice(0, 5)
}

const translateStatus = (status) => {
    const map = {
        PLANNED: 'Lên kế hoạch',
        LOCKED: 'Đã khóa',
        IN_PROGRESS: 'Đang diễn ra',
        DONE: 'Hoàn thành',
        CANCELLED: 'Đã hủy'
    }
    return map[status] || status
}

const statusClass = (status) => {
    switch (status) {
        case 'DONE':
            return 'bg-success'
        case 'LOCKED':
            return 'bg-info text-dark'
        case 'CANCELLED':
            return 'bg-danger'
        case 'IN_PROGRESS':
            return 'bg-warning text-dark'
        default:
            return 'bg-secondary'
    }
}

const summarizeAssignments = (assignmentList) => {
    if (!assignmentList?.length) return 'Chưa phân công'
    const completed = assignmentList.filter((item) => item.status === 'COMPLETED').length
    const inProgress = assignmentList.filter((item) => item.status === 'IN_PROGRESS').length
    if (!completed && !inProgress) {
        return 'Chưa có dữ liệu thực thi'
    }
    return `${completed} hoàn thành • ${inProgress} đang làm`
}

const handleFilter = () => emit('filter')
const handleResetFilters = () => emit('reset-filters')
const handleViewDetail = (instance) => emit('view-detail', instance)
const handleEdit = (instance) => emit('edit', instance)
const handleUpdateStatus = (instance) => emit('update-status', instance)
const handleRemove = (instance) => emit('remove', instance)
const handlePageChange = (page) => emit('page-change', page)
</script>

<style scoped>
.filter-card,
.table-card {
    border-radius: 18px;
    border: 1px solid var(--color-border);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
}

.action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: flex-end;
    align-items: center;
}

.action-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: 1px solid;
    background: #ffffff;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
    white-space: nowrap;
}

.action-button--primary {
    border-color: #a855f7;
    color: #a855f7;
    background: #ffffff;
}

.action-button--primary:hover {
    background: #faf5ff;
    border-color: #9333ea;
    color: #9333ea;
}

.action-button--info {
    border-color: #06b6d4;
    color: #06b6d4;
    background: #ffffff;
}

.action-button--info:hover {
    background: #ecfeff;
    border-color: #0891b2;
    color: #0891b2;
}

.action-button--danger {
    border-color: #ef4444;
    color: #ef4444;
    background: #ffffff;
}

.action-button--danger:hover {
    background: #fef2f2;
    border-color: #dc2626;
    color: #dc2626;
}

@media (max-width: 768px) {
    .action-buttons {
        flex-direction: column;
        width: 100%;
    }

    .action-button {
        width: 100%;
        justify-content: center;
    }
}
</style>

