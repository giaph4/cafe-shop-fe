<template>
    <div class="shift-templates-tab">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h5 class="mb-1">Quản lý Ca mẫu</h5>
                <p class="text-muted mb-0">Tạo và quản lý các ca mẫu để tái sử dụng khi lên lịch.</p>
            </div>
            <button class="btn btn-primary" type="button" @click="handleCreate">
                <i class="bi bi-plus-lg me-2"></i>Tạo ca mẫu mới
            </button>
        </div>

        <div class="card table-card">
            <div class="card-body">
                <LoadingState v-if="loading" />
                <ErrorState 
                    v-else-if="error" 
                    :message="error"
                />
                <EmptyState
                    v-else-if="!templates.length"
                    title="Chưa có ca mẫu nào"
                    message="Tạo ca mẫu đầu tiên để bắt đầu quản lý ca làm."
                />
                <div v-else class="table-responsive">
                    <table class="table align-middle">
                        <thead class="table-light">
                        <tr>
                            <th>Tên ca</th>
                            <th>Giờ làm việc</th>
                            <th>Vai trò yêu cầu</th>
                            <th>Cập nhật</th>
                            <th class="text-end">Hành động</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="template in templates" :key="template.id">
                            <td>
                                <div class="fw-semibold">{{ template.name }}</div>
                                <div class="text-muted small">ID: {{ template.id }}</div>
                            </td>
                            <td>
                                <div class="fw-semibold">{{ formatTime(template.startTime) }} - {{ formatTime(template.endTime) }}</div>
                                <div class="text-muted small" v-if="template.description">{{ template.description }}</div>
                            </td>
                            <td>
                                <div v-if="template.requiredRoles?.length" class="d-flex flex-wrap gap-1">
                                    <span class="badge bg-primary-subtle text-primary" v-for="role in template.requiredRoles" :key="role">
                                        {{ role }}
                                    </span>
                                </div>
                                <span v-else class="text-muted small">Không yêu cầu</span>
                            </td>
                            <td>
                                <div class="text-muted small">{{ formatDateTime(template.updatedAt) }}</div>
                            </td>
                            <td class="text-end">
                        <div class="action-buttons">
                            <button
                                class="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
                                @click="handleEdit(template)"
                                title="Chỉnh sửa"
                            >
                                        <i class="bi bi-pencil"></i>
                                        <span>Chỉnh sửa</span>
                            </button>
                            <button
                                class="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-2"
                                @click="handleRemove(template)"
                                title="Xóa"
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
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Pagination from '@/components/common/Pagination.vue'
import { formatDateTime } from '@/utils/formatters'

const props = defineProps({
    templates: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    error: { type: String, default: null },
    pagination: { type: Object, required: true }
})

const emit = defineEmits([
    'create',
    'edit',
    'remove',
    'page-change'
])

const formatTime = (time) => {
    if (!time) return '--:--'
    return time.length === 5 ? time : time.slice(0, 5)
}

const handleCreate = () => emit('create')
const handleEdit = (template) => emit('edit', template)
const handleRemove = (template) => emit('remove', template)
const handlePageChange = (page) => emit('page-change', page)
</script>

<style scoped>
.shift-templates-tab > div:first-child {
    margin-bottom: var(--spacing-4);
}

.shift-templates-tab > div:first-child :global(h5) {
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-1);
}

.table-card {
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-base);
    background: var(--color-bg);
}

.table-card :global(.card-body) {
    padding: var(--spacing-4);
}

.table-card :global(.table thead th) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
    background: var(--color-bg-muted);
    border-bottom: 1px solid var(--color-border);
}

.table-card :global(.table tbody td) {
    vertical-align: middle;
}

.action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    justify-content: flex-end;
    align-items: center;
}

.action-buttons :global(.btn) {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-base);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
}

.action-buttons :global(.btn i) {
    font-size: 16px;
    line-height: 1;
}

@media (max-width: 992px) {
    .table-card :global(.card-body) {
        padding: var(--spacing-3);
    }
}

@media (max-width: 768px) {
    .action-buttons {
        flex-direction: column;
        width: 100%;
    }

    .action-buttons :global(.btn) {
        width: 100%;
        justify-content: center;
    }

    .shift-templates-tab > div:first-child {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-3);
    }
}

@media (max-width: 576px) {
    .table-card :global(.table-responsive) {
        font-size: var(--font-size-sm);
    }
}
</style>

