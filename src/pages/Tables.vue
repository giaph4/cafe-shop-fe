<template>
  <div data-aos="fade-up">
    <Teleport to="body">
        <div class="modal fade table-edit-modal" ref="modalElement" tabindex="-1" aria-hidden="true">
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

        <div class="modal fade table-delete-modal" id="deleteTableModal" tabindex="-1" ref="deleteModalElement">
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
                        <div class="card" style="background: var(--color-card-muted); border: 1px solid var(--color-border); border-radius: var(--radius-sm);">
                            <div class="card-body">
                                <div class="mb-2">
                                    <strong class="d-block mb-1" style="color: var(--color-text-muted); font-family: var(--font-family-sans);">Tên bàn:</strong>
                                    <span style="font-family: var(--font-family-sans); color: var(--color-heading);">{{ deleteTarget?.name || '—' }}</span>
                                </div>
                                <div class="mb-0">
                                    <strong class="d-block mb-1" style="color: var(--color-text-muted); font-family: var(--font-family-sans);">Sức chứa:</strong>
                                    <span style="font-family: var(--font-family-sans); color: var(--color-heading);">{{ deleteTarget?.capacity || '—' }} chỗ</span>
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

    <div class="page-container container-fluid" data-aos="fade-up" style="background: var(--color-body-bg); padding: var(--spacing-4);">
        <header class="tables-header">
            <div>
                <h2>Quản lý bàn</h2>
                <p class="text-muted mb-0">Xem trạng thái bàn, chỉnh sửa thông tin và quản lý bàn theo thời gian thực.</p>
            </div>
            <div class="tables-header__actions">
                <div class="btn-group layout-toggle" role="group" aria-label="Chọn bố cục hiển thị">
                    <button
                        type="button"
                        class="btn btn-sm"
                        :class="layoutMode === 'table' ? 'btn-primary' : 'btn-outline-primary'"
                        @click="layoutMode = 'table'"
                    >
                        <i class="bi bi-table me-2"></i>Bảng
                    </button>
                    <button
                        type="button"
                        class="btn btn-sm"
                        :class="layoutMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'"
                        @click="layoutMode = 'grid'"
                    >
                        <i class="bi bi-grid-3x3-gap me-2"></i>Thẻ
                    </button>
                </div>
                <button v-if="canManage" class="btn btn-primary btn-sm" type="button" @click="openModal()">
                    <i class="bi bi-plus-lg me-2"></i>Thêm bàn mới
                </button>
            </div>
        </header>

        <div class="card filter-card mb-4">
            <div class="card-body">
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
        </div>

        <div class="card tabs-card">
            <div class="card-body">
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
                    <div v-else>
                        <!-- Table View -->
                        <div v-if="layoutMode === 'table'" class="table-responsive">
                            <table class="table align-middle table-hover">
                                <thead>
                                    <tr>
                                        <th>Chỗ</th>
                                        <th>Tên bàn</th>
                                        <th>ID</th>
                                        <th>Sức chứa</th>
                                        <th>Trạng thái</th>
                                        <th class="text-center">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="table in sortedTables" :key="table.id">
                                        <td>
                                            <div class="table-capacity-badge">
                                                <i class="bi bi-people-fill"></i>
                                                <strong>{{ table.capacity }}</strong>
                                            </div>
                                        </td>
                                        <td class="fw-semibold">{{ table.name }}</td>
                                        <td>
                                            <span class="text-muted small">#{{ table.id }}</span>
                                        </td>
                                        <td>
                                            <div class="d-flex align-items-center gap-2">
                                                <i class="bi bi-people-fill text-muted"></i>
                                                <span>{{ table.capacity }} chỗ</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="d-flex align-items-center gap-2">
                                                <select 
                                                    class="form-select form-select-sm" 
                                                    :value="table.status"
                                                    @change="handleStatusChange(table, $event.target.value)"
                                                    :disabled="statusMutation.isPending.value"
                                                    style="min-width: 150px; border-radius: var(--radius-sm); border: 1px solid var(--color-border); background: var(--color-card); color: var(--color-heading); font-family: var(--font-family-sans);"
                                                >
                                                    <option v-for="status in TABLE_STATUS_OPTIONS" :key="status.value" :value="status.value">{{ status.label }}</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="action-grid" v-if="canManage">
                                                <button class="action-button" type="button" @click="openModal(table)" title="Chỉnh sửa">
                                                    <i class="bi bi-pencil"></i>
                                                    <span>Chỉnh sửa</span>
                                                </button>
                                                <button class="action-button action-button--danger" type="button" @click="confirmDelete(table)" title="Xóa">
                                                    <i class="bi bi-trash"></i>
                                                    <span>Xóa</span>
                                                </button>
                                            </div>
                                            <span v-else class="text-muted small">—</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <!-- Grid View -->
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
                                :disabled="statusMutation.isPending.value"
                                style="border-radius: var(--radius-sm); border: 1px solid var(--color-border); background: var(--color-card); color: var(--color-heading); font-family: var(--font-family-sans);">
                            <option v-for="status in TABLE_STATUS_OPTIONS" :key="status.value" :value="status.value">{{ status.label }}</option>
                        </select>
                    </footer>
                </article>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>
  </div>
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
const layoutMode = ref('grid')

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
/* Page Container - Chuẩn hóa theo base.css */
.tables-page {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    padding-bottom: var(--spacing-6);
}

/* Header - Chuẩn hóa theo base.css */
.tables-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    margin-bottom: var(--spacing-4);
}

.tables-header h2 {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.tables-header p {
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

.tables-header__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    flex-wrap: wrap;
}

/* Layout Toggle - Exact match with image */
.layout-toggle {
    display: inline-flex;
    gap: var(--spacing-3);
    background: transparent;
    padding: 0;
    border: none;
}

.layout-toggle .btn {
    padding: 0.65rem 1.25rem;
    border-radius: 9999px;
    font-size: 0.9rem;
    font-weight: var(--font-weight-semibold);
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--font-family-sans);
    transition: all 0.2s ease;
}

.layout-toggle .btn-primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: #ffffff;
}

.layout-toggle .btn-outline-primary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.layout-toggle .btn-outline-primary:hover {
    background: var(--color-card);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.layout-toggle .btn i {
    font-size: 1rem;
    line-height: 1;
    color: inherit;
}

.layout-toggle .btn-primary i {
    color: #ffffff;
}

.layout-toggle .btn-outline-primary i {
    color: var(--color-primary);
}


/* Filter Card - Chuẩn hóa theo base.css */
.filter-card {
    margin-bottom: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.filter-card :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

/* Tabs Card - Chuẩn hóa */
.tabs-card {
    margin-bottom: 0;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.tabs-card :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.filter-grid {
    display: grid;
    gap: var(--spacing-4);
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    align-items: end;
}

.filter-item {
    display: flex;
    flex-direction: column;
}

.filter-item .form-label {
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

/* Input Group - Chuẩn hóa height */
.filter-item :global(.input-group) {
    display: flex;
}

.filter-item :global(.input-group-text) {
    height: 40px;
    border: 1px solid var(--color-border);
    border-right: none;
    border-radius: var(--radius-sm) 0 0 var(--radius-sm);
    background: var(--color-card-muted);
    color: var(--color-text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 var(--spacing-3);
}

.filter-item :global(.input-group-text i) {
    font-size: 18px;
    line-height: 1;
}

.filter-item :global(.input-group .form-control) {
    height: 40px;
    border-left: none;
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.filter-item :global(.input-group .form-control:focus) {
    border-left: none;
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

/* Form Select - Chuẩn hóa height */
.filter-item :global(.form-select) {
    height: 40px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    background: var(--color-card);
    color: var(--color-heading);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.filter-item :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.filter-actions {
    display: flex;
    align-items: flex-end;
}

.filter-actions :global(.btn) {
    height: 40px;
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    font-family: var(--font-family-sans);
}

/* Table View - Chuẩn hóa theo base.css */
.tables-page :global(.table) {
    margin-bottom: 0;
    border-collapse: separate;
    border-spacing: 0;
}

.tables-page :global(.table thead th) {
    background: var(--color-card-muted);
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    padding: var(--spacing-3) var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    border-top: none;
    border-left: none;
    border-right: none;
    font-family: var(--font-family-sans);
}

.tables-page :global(.table tbody td) {
    padding: var(--spacing-3) var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    border-top: none;
    border-left: none;
    border-right: none;
    vertical-align: middle;
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.tables-page :global(.table tbody tr:hover) {
    background: var(--color-card-muted);
}

/* Grid View - Chuẩn hóa */
.tables-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: var(--spacing-4);
}

.table-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    padding: var(--spacing-4);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    transition: all var(--transition-base);
}

.table-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

.table-card__header {
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: var(--spacing-3);
}

.table-card__header h3 {
    margin-bottom: var(--spacing-0);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.table-card__header .caption {
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
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
    gap: 6px;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.table-status-chip i {
    font-size: 18px;
    line-height: 1;
}

.table-capacity {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    font-size: var(--font-size-lg);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.table-capacity i {
    font-size: 18px;
    line-height: 1;
    color: var(--color-primary);
}

.table-card__footer {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.table-card__footer .form-label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.actions {
    display: inline-flex;
    gap: var(--spacing-2);
}

.btn-icon {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
    color: var(--color-heading);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-base);
    cursor: pointer;
    padding: 0;
}

.btn-icon:hover {
    background: var(--color-card);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.btn-icon i {
    font-size: 18px;
    line-height: 1;
}

.btn-icon--danger {
    color: var(--color-danger);
}

.btn-icon--danger:hover {
    background: var(--color-card);
    border-color: var(--color-danger);
    color: var(--color-danger);
}

/* Status Colors - Chuẩn hóa, bỏ gradient, chỉ dùng border và chip màu nhạt */
.status-success {
    border-color: var(--color-success);
}

.status-success .table-status-chip {
    background: var(--color-soft-emerald);
    border: 1px solid var(--color-success);
    color: var(--color-success);
}

.status-warning {
    border-color: var(--color-warning);
}

.status-warning .table-status-chip {
    background: var(--color-soft-amber);
    border: 1px solid var(--color-warning);
    color: var(--color-warning);
}

.status-danger {
    border-color: var(--color-danger);
}

.status-danger .table-status-chip {
    background: var(--color-soft-rose);
    border: 1px solid var(--color-danger);
    color: var(--color-danger);
}

.status-info {
    border-color: var(--color-info);
}

.status-info .table-status-chip {
    background: var(--color-soft-sky);
    border: 1px solid var(--color-info);
    color: var(--color-info);
}

.status-neutral {
    border-color: var(--color-border);
}

.status-neutral .table-status-chip {
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
}

/* Modal - Chuẩn hóa theo base.css */
.table-edit-modal :global(.modal-content),
.table-delete-modal :global(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-modal);
}

.table-edit-modal :global(.modal-header),
.table-delete-modal :global(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4);
    background: var(--color-card);
}

.table-edit-modal :global(.modal-header .modal-title),
.table-delete-modal :global(.modal-header .modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.table-edit-modal :global(.modal-header .text-muted.small),
.table-delete-modal :global(.modal-header .text-muted.small) {
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.table-edit-modal :global(.modal-body),
.table-delete-modal :global(.modal-body) {
    padding: var(--spacing-5);
    background: var(--color-card);
}

/* Form Controls trong Modal - Chuẩn hóa */
.table-edit-modal :global(.form-label) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.table-edit-modal :global(.form-control),
.table-edit-modal :global(.form-select) {
    height: 40px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    background: var(--color-card);
    color: var(--color-heading);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.table-edit-modal :global(.form-control:focus),
.table-edit-modal :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.table-delete-modal :global(.modal-body .card) {
    border-radius: var(--radius-sm);
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
}

.table-edit-modal :global(.modal-footer),
.table-delete-modal :global(.modal-footer) {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-4);
    background: var(--color-card);
    gap: var(--spacing-2);
    justify-content: flex-end;
}

.table-edit-modal :global(.btn-primary),
.table-delete-modal :global(.btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.table-edit-modal :global(.btn-primary:hover:not(:disabled)),
.table-delete-modal :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.table-edit-modal :global(.btn-outline-secondary) {
    border-color: var(--color-border);
    color: var(--color-heading);
    background: transparent;
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.table-edit-modal :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.table-delete-modal :global(.btn-danger) {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-text-inverse);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.table-delete-modal :global(.btn-danger:hover:not(:disabled)) {
    background: var(--color-danger-dark);
}

/* Action Buttons - Chuẩn hóa theo OrderListTab */
.action-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    justify-content: center;
}

.action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-primary);
    background: var(--color-card);
    color: var(--color-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
    cursor: pointer;
    white-space: nowrap;
    font-family: var(--font-family-sans);
}

.action-button:hover:not(:disabled) {
    background: var(--color-soft-primary);
    color: var(--color-primary-dark);
    border-color: var(--color-primary-dark);
}

.action-button:active:not(:disabled) {
    background: var(--color-primary-dark);
}

.action-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
}

.action-button i {
    font-size: 18px;
    line-height: 1;
}

.action-button--primary {
    border-color: var(--color-primary);
    background: var(--color-primary);
    color: var(--color-text-inverse);
}

.action-button--primary:hover:not(:disabled) {
    background: var(--color-primary-dark);
}

.action-button--danger {
    border-color: var(--color-danger);
    background: var(--color-card);
    color: var(--color-danger);
}

.action-button--danger:hover:not(:disabled) {
    background: var(--color-danger);
    color: var(--color-text-inverse);
    border-color: var(--color-danger);
}

/* Table Capacity Badge - Giống cột Ảnh trong Products */
.table-capacity-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-md);
    background: var(--color-soft-primary);
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    min-width: 60px;
}

.table-capacity-badge i {
    font-size: 16px;
    color: var(--color-primary);
}

.table-capacity-badge strong {
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
}

/* Form Select Small - Chuẩn hóa */
:global(.form-select-sm) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

:global(.form-select-sm:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

/* Button Small - Chuẩn hóa */
:global(.btn-sm) {
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

/* Responsive - Chuẩn hóa */
@media (max-width: 768px) {
    .tables-page {
        padding: var(--spacing-2);
        gap: var(--spacing-3);
    }

    .tables-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-3);
    }

    .tables-header__actions {
        width: 100%;
        justify-content: flex-start;
    }

    .layout-toggle {
        width: 100%;
    }

    .layout-toggle .btn {
        flex: 1;
    }

    .tables-grid {
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: var(--spacing-3);
    }

    .action-grid {
        flex-direction: column;
        width: 100%;
    }

    .action-button {
        width: 100%;
        justify-content: center;
    }

    .table-edit-modal :global(.modal-dialog),
    .table-delete-modal :global(.modal-dialog) {
        max-width: 90%;
        margin: var(--spacing-4) auto;
    }

    .table-edit-modal :global(.modal-body),
    .table-delete-modal :global(.modal-body) {
        padding: var(--spacing-4);
    }
}

</style>
