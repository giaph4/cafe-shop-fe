<template>
    <Teleport to="body">
        <div class="modal fade" ref="modalElement" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title">{{ isEditing ? 'Cập nhật bàn' : 'Thêm bàn mới' }}</h5>
                            <p class="mb-0 text-muted small">Điền đầy đủ thông tin theo quy định backend.</p>
                        </div>
                        <button
                            type="button"
                            class="btn-close"
                            @click="closeModal"
                            :disabled="createMutation.isPending.value || updateMutation.isPending.value"
                            aria-label="Close"
                        ></button>
                    </div>

                    <Form @submit="handleSubmit" :validation-schema="tableSchema" v-slot="{ errors, isSubmitting }">
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label fw-semibold">Tên bàn <span class="text-danger">*</span></label>
                                <Field
                                    name="name"
                                    type="text"
                                    v-model="formData.name"
                                    class="form-control"
                                    :class="{'is-invalid': errors.name}"
                                    autocomplete="off"
                                    maxlength="60"
                                    :disabled="createMutation.isPending.value || updateMutation.isPending.value"
                                />
                                <ErrorMessage name="name" class="invalid-feedback"/>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-semibold">Sức chứa (số chỗ) <span class="text-danger">*</span></label>
                                <Field
                                    name="capacity"
                                    type="number"
                                    v-model="formData.capacity"
                                    class="form-control"
                                    :class="{'is-invalid': errors.capacity}"
                                    min="1"
                                    max="50"
                                    step="1"
                                    :disabled="createMutation.isPending.value || updateMutation.isPending.value"
                                />
                                <ErrorMessage name="capacity" class="invalid-feedback"/>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button
                                type="button"
                                class="btn btn-outline-secondary"
                                @click="closeModal"
                                :disabled="isSubmitting || createMutation.isPending.value || updateMutation.isPending.value"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                class="btn btn-primary"
                                :disabled="isSubmitting || createMutation.isPending.value || updateMutation.isPending.value"
                            >
                                <span v-if="isSubmitting || createMutation.isPending.value || updateMutation.isPending.value" class="spinner-border spinner-border-sm me-2"></span>
                                {{ isEditing ? 'Cập nhật' : 'Tạo mới' }}
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>

        <div class="modal fade" id="deleteTableModal" tabindex="-1" ref="deleteModalElement">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title">Xóa bàn</h5>
                            <p class="mb-0 text-muted small">Hành động này không thể hoàn tác.</p>
                        </div>
                        <button type="button" class="btn-close" @click="closeDeleteModal" :disabled="deleteMutation.isPending.value" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p class="mb-3">Bạn có chắc chắn muốn xóa bàn này không?</p>
                        <div class="card bg-light">
                            <div class="card-body">
                                <div class="mb-2">
                                    <strong class="text-muted d-block mb-1">Tên bàn:</strong>
                                    <span>{{ deleteTarget?.name || '—' }}</span>
                                </div>
                                <div class="mb-0">
                                    <strong class="text-muted d-block mb-1">Sức chứa:</strong>
                                    <span>{{ deleteTarget?.capacity || '—' }} chỗ</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button
                            type="button"
                            class="btn btn-outline-secondary"
                            @click="closeDeleteModal"
                            :disabled="deleteMutation.isPending.value"
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            class="btn btn-danger"
                            @click="handleDeleteConfirm"
                            :disabled="deleteMutation.isPending.value"
                        >
                            <span v-if="deleteMutation.isPending.value" class="spinner-border spinner-border-sm me-2"></span>
                            Xóa bàn
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>

    <section class="tables-page" data-aos="fade-up">
        <header class="tables-header">
            <div>
                <h2>Quản lý bàn</h2>
                <p class="text-muted mb-0">Xem trạng thái bàn, chỉnh sửa thông tin và quản lý bàn theo thời gian thực.</p>
            </div>
            <button v-if="canManage" class="btn btn-primary" type="button" @click="openModal()">
                <i class="bi bi-plus-lg me-2"></i>Thêm bàn mới
            </button>
        </header>

        <div class="filter-card">
            <div class="filter-grid">
                <div class="filter-item">
                    <label class="form-label">Tìm theo tên</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-search"></i></span>
                        <input type="text" class="form-control" placeholder="Nhập tên bàn" v-model.trim="filterState.name"/>
                    </div>
                </div>
                <div class="filter-item">
                    <label class="form-label">Trạng thái</label>
                    <select class="form-select" v-model="filterState.status">
                        <option value="">Tất cả trạng thái</option>
                        <option v-for="status in TABLE_STATUS_OPTIONS" :key="status.value" :value="status.value">{{ status.label }}</option>
                    </select>
                </div>
                <div class="filter-item">
                    <label class="form-label">Sức chứa</label>
                    <select class="form-select" v-model="filterState.capacity">
                        <option value="">Tất cả</option>
                        <option value="1-2">1 - 2 chỗ</option>
                        <option value="3-4">3 - 4 chỗ</option>
                        <option value="5-8">5 - 8 chỗ</option>
                        <option value="9+">9+ chỗ</option>
                    </select>
                </div>
                <div class="filter-item">
                    <label class="form-label">Sắp xếp</label>
                    <select class="form-select" v-model="sortState">
                        <option value="name-asc">Tên A → Z</option>
                        <option value="name-desc">Tên Z → A</option>
                        <option value="capacity-asc">Sức chứa tăng dần</option>
                        <option value="capacity-desc">Sức chứa giảm dần</option>
                    </select>
                </div>
                <div class="filter-actions">
                    <button class="btn btn-outline-secondary" type="button" @click="resetFilters">Đặt lại</button>
                </div>
            </div>
        </div>

        <LoadingState v-if="isLoading" text="Đang tải danh sách bàn..." />
        <ErrorState
            v-else-if="isError"
            :message="error?.message || 'Không thể tải dữ liệu bàn. Vui lòng thử lại sau.'"
            :show-retry="true"
            :retry-handler="() => queryClient.invalidateQueries(['tables'])"
        />
        <template v-else>
            <EmptyState
                v-if="sortedTables.length === 0"
                title="Không tìm thấy bàn"
                :message="hasActiveFilters ? 'Không tìm thấy bàn nào phù hợp với bộ lọc hiện tại.' : 'Chưa có bàn nào. Hãy tạo bàn đầu tiên.'"
            >
                <template #icon>
                    <i class="bi bi-table"></i>
                </template>
                <template v-if="!hasActiveFilters && canManage" #action>
                    <button class="btn btn-primary" @click="openModal()">
                        <i class="bi bi-plus-lg me-2"></i>
                        Tạo bàn đầu tiên
                    </button>
                </template>
            </EmptyState>
            <div v-else class="tables-grid">
                <article v-for="table in sortedTables" :key="table.id" class="table-card" :class="getStatusVariant(table.status)">
                    <header class="table-card__header">
                        <div>
                            <h3>{{ table.name }}</h3>
                            <p class="caption">ID: {{ table.id }}</p>
                        </div>
                        <div class="actions" v-if="canManage">
                            <button class="btn btn-icon" type="button" @click="openModal(table)" title="Chỉnh sửa">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-icon btn-icon--danger" type="button" @click="confirmDelete(table)" title="Xóa">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </header>

                    <div class="table-card__body">
                        <div class="table-status-chip">
                            <i class="bi" :class="getStatusMeta(table.status).icon"></i>
                            <span>{{ getStatusMeta(table.status).label }}</span>
                        </div>
                        <div class="table-capacity">
                            <i class="bi bi-people-fill"></i>
                            <strong>{{ table.capacity }}</strong>
                            <span>chỗ</span>
                        </div>
                    </div>

                    <footer class="table-card__footer">
                        <label class="form-label">Cập nhật trạng thái</label>
                        <select class="form-select form-select-sm" :value="table.status"
                                @change="handleStatusChange(table, $event.target.value)"
                                :disabled="statusMutation.isPending.value">
                            <option v-for="status in TABLE_STATUS_OPTIONS" :key="status.value" :value="status.value">{{ status.label }}</option>
                        </select>
                    </footer>
                </article>
            </div>
        </template>
    </section>
</template>

<script setup>
import {computed, onMounted, onUnmounted, reactive, ref, nextTick} from 'vue'
import {useQuery, useMutation, useQueryClient} from '@tanstack/vue-query'
import {Modal} from 'bootstrap'
import {Form, Field, ErrorMessage} from 'vee-validate'
import {toast} from 'vue3-toastify'
import * as yup from 'yup'
import {storeToRefs} from 'pinia'
import {useAuthStore} from '@/store/auth'
import {
    getTables,
    createTable,
    updateTable,
    updateTableStatus,
    deleteTable,
    TABLE_STATUS_OPTIONS,
    buildTablePayload
} from '@/api/tableService'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const authStore = useAuthStore()
const {userRoles} = storeToRefs(authStore)
const canManage = computed(() => userRoles.value.includes('ROLE_ADMIN') || userRoles.value.includes('ROLE_MANAGER'))

const queryClient = useQueryClient()
const modalElement = ref(null)
const bsModal = ref(null)
const isEditing = ref(false)
const sortState = ref('name-asc')

const formData = reactive({
    id: null,
    name: '',
    capacity: 1
})

const filterState = reactive({
    name: '',
    status: '',
    capacity: ''
})

const tableSchema = yup.object({
    name: yup.string().trim().required('Tên bàn là bắt buộc'),
    capacity: yup.number()
        .transform((value, originalValue) => {
            const parsed = Number(originalValue)
            return Number.isFinite(parsed) ? parsed : NaN
        })
        .required('Sức chứa là bắt buộc')
        .min(1, 'Sức chứa phải lớn hơn hoặc bằng 1')
        .integer('Sức chứa phải là số nguyên')
})

const {data: tables, isLoading, isError, error} = useQuery({
    queryKey: ['tables'],
    queryFn: getTables,
    select: (data) => Array.isArray(data) ? data : []
})

const createMutation = useMutation({
    mutationFn: createTable,
    onSuccess: () => {
        toast.success('Đã tạo bàn mới.')
        queryClient.invalidateQueries(['tables'])
        closeModal()
    },
    onError: handleApiError
})

const updateMutation = useMutation({
    mutationFn: updateTable,
    onSuccess: () => {
        toast.success('Đã cập nhật thông tin bàn.')
        queryClient.invalidateQueries(['tables'])
        closeModal()
    },
    onError: handleApiError
})

const deleteMutation = useMutation({
    mutationFn: deleteTable,
    onSuccess: () => {
        toast.success('Đã xoá bàn.')
        queryClient.invalidateQueries(['tables'])
    },
    onError: handleApiError
})

const statusMutation = useMutation({
    mutationFn: updateTableStatus,
    onSuccess: (updatedTable) => {
        toast.success(`Đã cập nhật trạng thái bàn "${updatedTable.name}".`)
        queryClient.setQueryData(['tables'], (oldData) => {
            if (!Array.isArray(oldData)) return []
            return oldData.map((item) => item.id === updatedTable.id ? updatedTable : item)
        })
    },
    onError: handleApiError
})

const normalizedTables = computed(() => Array.isArray(tables.value) ? tables.value : [])

const filteredTables = computed(() => {
    const keyword = filterState.name.trim().toLowerCase()
    return normalizedTables.value.filter((table) => {
        if (!table) return false
        const matchesName = !keyword || table.name.toLowerCase().includes(keyword)
        const matchesStatus = !filterState.status || table.status === filterState.status
        const matchesCapacity = (() => {
            if (!filterState.capacity) return true
            switch (filterState.capacity) {
                case '1-2':
                    return table.capacity >= 1 && table.capacity <= 2
                case '3-4':
                    return table.capacity >= 3 && table.capacity <= 4
                case '5-8':
                    return table.capacity >= 5 && table.capacity <= 8
                case '9+':
                    return table.capacity >= 9
                default:
                    return true
            }
        })()
        return matchesName && matchesStatus && matchesCapacity
    })
})

const sortedTables = computed(() => {
    const list = [...filteredTables.value]
    switch (sortState.value) {
        case 'name-desc':
            return list.sort((a, b) => b.name.localeCompare(a.name))
        case 'capacity-asc':
            return list.sort((a, b) => a.capacity - b.capacity)
        case 'capacity-desc':
            return list.sort((a, b) => b.capacity - a.capacity)
        case 'name-asc':
        default:
            return list.sort((a, b) => a.name.localeCompare(b.name))
    }
})

const openModal = (table = null) => {
    if (!canManage.value) return
    if (table) {
        isEditing.value = true
        formData.id = table.id
        formData.name = table.name
        formData.capacity = table.capacity
    } else {
        isEditing.value = false
        resetForm()
    }
    bsModal.value?.show()
}

const closeModal = () => {
    bsModal.value?.hide()
}

const resetForm = () => {
    formData.id = null
    formData.name = ''
    formData.capacity = 1
}

const resetFilters = () => {
    filterState.name = ''
    filterState.status = ''
    filterState.capacity = ''
    sortState.value = 'name-asc'
}

const handleSubmit = () => {
    const payload = buildTablePayload(formData)
    if (isEditing.value) {
        updateMutation.mutate({id: formData.id, data: payload})
    } else {
        createMutation.mutate(payload)
    }
}

const handleStatusChange = (table, newStatus) => {
    if (table.status === newStatus) return
    statusMutation.mutate({id: table.id, status: newStatus})
}

const deleteTarget = ref(null)
const deleteModalElement = ref(null)
let deleteModalInstance = null

const hasActiveFilters = computed(() => {
    return Boolean(filterState.name || filterState.status || filterState.capacity)
})

const confirmDelete = (table) => {
    if (!canManage.value) return
    deleteTarget.value = table
    nextTick(() => {
        deleteModalInstance?.show()
    })
}

const handleDeleteConfirm = () => {
    if (deleteTarget.value) {
        deleteMutation.mutate(deleteTarget.value.id)
        deleteModalInstance?.hide()
    }
}

const closeDeleteModal = () => {
    deleteModalInstance?.hide()
    deleteTarget.value = null
}

const getStatusMeta = (status) => {
    switch (status) {
        case 'EMPTY':
            return {label: 'Còn trống', icon: 'bi-check-circle', tone: 'success'}
        case 'AVAILABLE':
            return {label: 'Sẵn sàng', icon: 'bi-arrow-repeat', tone: 'info'}
        case 'SERVING':
            return {label: 'Đang phục vụ', icon: 'bi-cup-hot', tone: 'warning'}
        case 'RESERVED':
            return {label: 'Đã đặt trước', icon: 'bi-bookmark-check', tone: 'danger'}
        case 'PENDING':
            return {label: 'Đang chờ', icon: 'bi-hourglass-split', tone: 'neutral'}
        default:
            return {label: status || 'Không xác định', icon: 'bi-question-circle', tone: 'neutral'}
    }
}

const getStatusVariant = (status) => `status-${getStatusMeta(status).tone}`

function handleApiError(err) {
    const message = err?.response?.data?.message || err?.message
    if (!message) {
        toast.error('Đã xảy ra lỗi. Vui lòng thử lại.')
        return
    }
    if (message.includes('already exists')) {
        toast.error('Tên bàn đã tồn tại. Vui lòng chọn tên khác.')
        return
    }
    if (message.includes('Cannot delete table')) {
        toast.error('Không thể xoá bàn vì đang gắn với hoá đơn. Hãy xử lý hoá đơn trước.')
        return
    }
    if (message.includes('Invalid status')) {
        toast.error('Trạng thái không hợp lệ. Vui lòng chọn trong danh sách được phép.')
        return
    }
    if (message.includes('Table not found')) {
        toast.error('Không tìm thấy bàn. Có thể dữ liệu đã bị xoá hoặc thay đổi.')
        queryClient.invalidateQueries(['tables'])
        return
    }
    toast.error(message)
}

onMounted(() => {
    if (modalElement.value) {
        bsModal.value = new Modal(modalElement.value, {backdrop: 'static'})
    }
    if (deleteModalElement.value) {
        deleteModalInstance = new Modal(deleteModalElement.value, {backdrop: 'static'})
    }
})

onUnmounted(() => {
    bsModal.value?.dispose()
    deleteModalInstance?.dispose()
})

const getStatusMetaRef = getStatusMeta

</script>

<style scoped>
.tables-page {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
    padding-bottom: var(--spacing-12);
}

.tables-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    padding: var(--spacing-6);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-md);
}

.tables-header h2 {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-tight);
}


.filter-grid {
    display: grid;
    gap: var(--spacing-4);
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.filter-item .form-label {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
}

.filter-actions {
    display: flex;
    align-items: flex-end;
}

.tables-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: var(--spacing-5);
}

.table-card {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-sm);
    padding: var(--spacing-5);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-5);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.table-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
}

.table-card__header {
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-4);
    border-bottom: 1px solid var(--color-border-soft);
    padding-bottom: var(--spacing-3);
}

.table-card__header h3 {
    margin-bottom: var(--spacing-0);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
}

.table-card__header .caption {
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
}

.table-card__body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
}

.table-status-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-1) var(--spacing-3);
    border-radius: var(--radius-full);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
}

.table-capacity {
    display: inline-flex;
    align-items: baseline;
    gap: var(--spacing-1);
    font-size: var(--font-size-lg);
    color: var(--color-heading);
}

.table-card__footer {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.table-card__footer .form-label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    color: var(--color-text-muted);
}

.actions {
    display: inline-flex;
    gap: var(--spacing-1);
}

.btn-icon {
    width: 34px;
    height: 34px;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    background: var(--color-card-muted);
    color: var(--color-text);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast);
    cursor: pointer;
}

.btn-icon:hover {
    background: var(--color-primary-soft);
    border-color: var(--color-primary-border-soft);
    color: var(--color-primary);
}

.btn-icon--danger {
    color: var(--color-danger);
}

.btn-icon--danger:hover {
    background: var(--color-danger-soft);
    border-color: var(--color-danger-border-soft);
    color: var(--color-danger);
}

.status-success {
    border-color: rgba(34, 197, 94, 0.4);
    background: linear-gradient(170deg, rgba(34, 197, 94, 0.12), transparent);
}

.status-success .table-status-chip {
    background: rgba(34, 197, 94, 0.18);
    color: var(--color-success);
}

.status-warning {
    border-color: rgba(234, 179, 8, 0.44);
    background: linear-gradient(170deg, rgba(234, 179, 8, 0.15), transparent);
}

.status-warning .table-status-chip {
    background: rgba(234, 179, 8, 0.18);
    color: var(--color-warning);
}

.status-danger {
    border-color: rgba(239, 68, 68, 0.45);
    background: linear-gradient(170deg, rgba(239, 68, 68, 0.12), transparent);
}

.status-danger .table-status-chip {
    background: rgba(248, 113, 113, 0.22);
    color: var(--color-danger);
}

.status-info {
    border-color: rgba(59, 130, 246, 0.38);
    background: linear-gradient(170deg, rgba(59, 130, 246, 0.12), transparent);
}

.status-info .table-status-chip {
    background: rgba(59, 130, 246, 0.18);
    color: #1d4ed8;
}

.status-neutral {
    border-color: var(--color-border-soft);
    background: linear-gradient(170deg, var(--color-card-muted), transparent);
}

.status-neutral .table-status-chip {
    background: var(--color-card-muted);
    color: var(--color-text-muted);
}

.dark-theme .tables-header,
.dark-theme .filter-card,
.dark-theme .table-card {
    border-color: rgba(129, 140, 248, 0.28);
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(17, 24, 39, 0.92));
    box-shadow: 0 24px 46px rgba(2, 6, 23, 0.55);
}

.dark-theme .table-status-chip {
    background: rgba(148, 163, 184, 0.18);
    color: #e2e8f0;
}

.comfort-theme .tables-header,
.comfort-theme .filter-card,
.comfort-theme .table-card {
    border-color: rgba(95, 111, 148, 0.25);
    background: linear-gradient(170deg, rgba(245, 241, 235, 0.98), rgba(236, 232, 226, 0.92));
}

.comfort-theme .table-status-chip {
    background: rgba(95, 111, 148, 0.16);
    color: #374151;
}

:deep(.modal-content) {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-2xl);
}

:deep(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-6);
    background: var(--color-card);
}

:deep(.modal-header .modal-title) {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-1);
}

:deep(.modal-header .text-muted.small) {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
}

:deep(.modal-body) {
    padding: var(--spacing-6);
}

:deep(.modal-footer) {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-4) var(--spacing-6);
    background: var(--color-card);
}

@media (max-width: 768px) {
    .tables-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .tables-grid {
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    }
}

</style>
