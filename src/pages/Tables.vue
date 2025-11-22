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
                        <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
                    </div>

                    <Form @submit="handleSubmit" :validation-schema="tableSchema" v-slot="{ errors, isSubmitting }">
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Tên bàn <span class="text-danger">*</span></label>
                                <Field name="name" type="text" v-model="formData.name" class="form-control"
                                       :class="{'is-invalid': errors.name}" autocomplete="off" maxlength="60"/>
                                <ErrorMessage name="name" class="invalid-feedback"/>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Sức chứa (số chỗ) <span class="text-danger">*</span></label>
                                <Field name="capacity" type="number" v-model="formData.capacity" class="form-control"
                                       :class="{'is-invalid': errors.capacity}" min="1" max="50" step="1"/>
                                <ErrorMessage name="capacity" class="invalid-feedback"/>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" @click="closeModal" :disabled="isSubmitting">Hủy</button>
                            <button type="submit" class="btn btn-primary" :disabled="isSubmitting || createMutation.isPending.value || updateMutation.isPending.value">
                                <span v-if="isSubmitting || createMutation.isPending.value || updateMutation.isPending.value" class="spinner-border spinner-border-sm me-2"></span>
                                Lưu thay đổi
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    </Teleport>

    <section class="tables-page" data-aos="fade-up">
        <header class="tables-header">
            <div>
                <h2>Quản lý bàn</h2>
                <p class="text-muted mb-0">Theo dõi trạng thái, chỉnh sửa thông tin và điều phối bàn theo thời gian thực.</p>
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

        <div v-if="isLoading" class="state-block">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2">Đang tải danh sách bàn...</p>
        </div>

        <div v-else-if="isError" class="state-block state-error">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <p>Không thể tải dữ liệu bàn: {{ error?.message || 'Vui lòng thử lại sau.' }}</p>
        </div>

        <div v-else>
            <div class="tables-grid">
                <article v-for="table in sortedTables" :key="table.id" class="table-card" :class="getStatusVariant(table.status)">
                    <header class="table-card__header">
                        <div>
                            <h3>{{ table.name }}</h3>
                            <p class="caption">ID: {{ table.id }}</p>
                        </div>
                        <div class="actions" v-if="canManage">
                            <button class="btn btn-icon" type="button" @click="openModal(table)"><i class="bi bi-pencil"></i></button>
                            <button class="btn btn-icon text-danger" type="button" @click="confirmDelete(table)"><i class="bi bi-trash"></i></button>
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

            <div v-if="sortedTables.length === 0" class="state-block">
                <i class="bi bi-search"></i>
                <p>Không tìm thấy bàn phù hợp với bộ lọc hiện tại.</p>
            </div>
        </div>
    </section>
</template>

<script setup>
import {computed, onMounted, onUnmounted, reactive, ref} from 'vue'
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

const confirmDelete = (table) => {
    if (!canManage.value) return
    if (window.confirm(`Bạn có chắc muốn xoá bàn "${table.name}"?`)) {
        deleteMutation.mutate(table.id)
    }
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
})

onUnmounted(() => {
    bsModal.value?.dispose()
})

const getStatusMetaRef = getStatusMeta

</script>

<style scoped>
.tables-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding-bottom: 3rem;
}

.tables-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.5rem;
    border-radius: 20px;
    border: 1px solid var(--color-border);
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-soft);
}

.tables-header h2 {
    font-weight: 700;
    color: var(--color-heading);
    margin-bottom: 0.25rem;
}


.filter-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.filter-item .form-label {
    font-weight: 600;
    color: var(--color-heading);
}

.filter-actions {
    display: flex;
    align-items: flex-end;
}

.tables-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1.25rem;
}

.table-card {
    border-radius: 18px;
    border: 1px solid var(--color-border);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-soft-sm);
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.table-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-medium);
}

.table-card__header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    border-bottom: 1px solid rgba(148, 163, 184, 0.22);
    padding-bottom: 0.75rem;
}

.table-card__header h3 {
    margin-bottom: 0.1rem;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-heading);
}

.table-card__header .caption {
    color: var(--color-text-muted);
    font-size: 0.8rem;
}

.table-card__body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.table-status-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.75rem;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 600;
}

.table-capacity {
    display: inline-flex;
    align-items: baseline;
    gap: 0.35rem;
    font-size: 1.1rem;
    color: var(--color-heading);
}

.table-card__footer {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.table-card__footer .form-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--color-text-muted);
}

.actions {
    display: inline-flex;
    gap: 0.35rem;
}

.btn-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    border: 1px solid transparent;
    background: rgba(148, 163, 184, 0.12);
    color: var(--color-text);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.18s ease;
}

.btn-icon:hover {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.35);
}

.state-block i {
    font-size: 2rem;
}

.state-error {
    color: #dc2626;
}

.status-success {
    border-color: rgba(34, 197, 94, 0.4);
    background: linear-gradient(170deg, rgba(34, 197, 94, 0.12), transparent);
}

.status-success .table-status-chip {
    background: rgba(34, 197, 94, 0.18);
    color: #166534;
}

.status-warning {
    border-color: rgba(234, 179, 8, 0.44);
    background: linear-gradient(170deg, rgba(234, 179, 8, 0.15), transparent);
}

.status-warning .table-status-chip {
    background: rgba(234, 179, 8, 0.18);
    color: #92400e;
}

.status-danger {
    border-color: rgba(239, 68, 68, 0.45);
    background: linear-gradient(170deg, rgba(239, 68, 68, 0.12), transparent);
}

.status-danger .table-status-chip {
    background: rgba(248, 113, 113, 0.22);
    color: #b91c1c;
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
    border-color: rgba(148, 163, 184, 0.35);
    background: linear-gradient(170deg, rgba(148, 163, 184, 0.12), transparent);
}

.status-neutral .table-status-chip {
    background: rgba(148, 163, 184, 0.22);
    color: #475569;
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
