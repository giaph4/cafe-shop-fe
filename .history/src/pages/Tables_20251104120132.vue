<template>
    <div class="modal fade" id="tableModal" tabindex="-1" ref="modalElement">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">{{ isEditing ? 'Cập nhật Bàn' : 'Tạo mới Bàn' }}</h5>
                    <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
                </div>

                <Form @submit="handleSubmit" :validation-schema="tableSchema" v-slot="{ errors }">
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="name" class="form-label fw-bold">Tên Bàn <span
                                    class="text-danger">*</span></label>
                            <Field name="name" type="text" class="form-control" :class="{ 'is-invalid': errors.name }"
                                v-model="formData.name" />
                            <ErrorMessage name="name" class="invalid-feedback" />
                        </div>
                        <div class="mb-3">
                            <label for="capacity" class="form-label fw-bold">Số chỗ ngồi <span
                                    class="text-danger">*</span></label>
                            <Field name="capacity" type="number" class="form-control"
                                :class="{ 'is-invalid': errors.capacity }" v-model="formData.capacity" />
                            <ErrorMessage name="capacity" class="invalid-feedback" />
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="closeModal">Huỷ</button>
                        <button type="submit" class="btn btn-primary"
                            :disabled="createMutation.isPending.value || updateMutation.isPending.value">
                            <span v-if="createMutation.isPending.value || updateMutation.isPending.value"
                                class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Lưu
                        </button>
                    </div>
                </Form>
            </div>
        </div>
    </div>

    <div data-aos="fade-up">
        <div class="page-header d-flex justify-content-between align-items-center mb-4">
            <h2 class="page-title">Quản lý Bàn</h2>
            <button class="btn btn-primary" @click="openModal()">
                <i class="bi bi-plus-lg me-2"></i> Thêm bàn mới
            </button>
        </div>

        <div class="card mb-4">
            <div class="card-body">
                <div class="row g-3 align-items-center">
                    <div class="col-lg-4">
                        <label class="form-label">Tìm theo tên</label>
                        <input type="text" class="form-control" placeholder="Nhập tên bàn..."
                            v-model="filterState.name">
                    </div>
                    <div class="col-lg-4">
                        <label class="form-label">Trạng thái</label>
                        <select class="form-select" v-model="filterState.status">
                            <option value="">Tất cả trạng thái</option>
                            <option value="AVAILABLE">Còn trống</option>
                            <option value="SERVING">Đang phục vụ</option>
                            <option value="RESERVED">Đã đặt trước</option>
                        </select>
                    </div>
                    <div class="col-lg-4">
                        <label class="form-label">Số chỗ ngồi</label>
                        <select class="form-select" v-model="filterState.capacity">
                            <option value="">Tất cả</option>
                            <option value="1-2">1 - 2 chỗ</option>
                            <option value="3-4">3 - 4 chỗ</option>
                            <option value="5+">5+ chỗ</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="isLoading" class="text-center my-5">
            <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;"></div>
        </div>

        <div v-else-if="isError" class="alert alert-danger">
            Không thể tải dữ liệu bàn: {{ error.message }}
        </div>

        <div v-else>
            <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">

                <div v-for="table in filteredTables" :key="table.id" class="col">
                    <div class="card h-100 table-card" :class="getStatusClass(table.status)">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="card-title mb-0">{{ table.name }}</h5>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-icon" type="button" data-bs-toggle="dropdown">
                                    <i class="bi bi-three-dots-vertical"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end">
                                    <li>
                                        <a class="dropdown-item" href="#" @click.prevent="openModal(table)">
                                            <i class="bi bi-pencil-fill me-2"></i> Sửa thông tin
                                        </a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item text-danger" href="#"
                                            @click.prevent="handleDelete(table)">
                                            <i class="bi bi-trash-fill me-2"></i> Xoá bàn
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div class="card-body text-center">
                            <i class="bi table-icon" :class="getTableIcon(table.status)"></i>
                            <h4 class="card-text mt-2">
                                <i class="bi bi-people-fill"></i>
                                {{ table.capacity }} chỗ
                            </h4>
                        </div>

                        <div class="card-footer">
                            <label class="form-label small fw-bold">Đổi trạng thái:</label>
                            <select class="form-select form-select-sm" :value="table.status"
                                @change="handleStatusChange(table, $event.target.value)"
                                :disabled="statusMutation.isPending.value">
                                <option value="EMPTY">Còn trống</option>
                                <option value="PENDING">Đang xử lý (chưa thanh toán)</option>
                                <option value="SERVING">Đang phục vụ</option>
                                <option value="RESERVED">Đã đặt trước</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="filteredTables.length === 0" class="text-center text-muted mt-5">
                <h5>Không tìm thấy bàn nào phù hợp.</h5>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, reactive } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
// Đảm bảo bạn đã import JS của Bootstrap trong main.js
import { Modal } from 'bootstrap'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { toast } from 'vue3-toastify'
import { getTables, createTable, updateTable, updateTableStatus, deleteTable } from '@/api/tableService'

// === Quản lý State ===
const queryClient = useQueryClient()
const modalElement = ref(null)
const bsModal = ref(null)
const isEditing = ref(false)
const formData = reactive({
    id: null,
    name: '',
    capacity: 2
})
const filterState = reactive({
    name: '',
    status: '', // "" (rỗng) nghĩa là 'Tất cả'
    capacity: '' // "" (rỗng) nghĩa là 'Tất cả'
})

// === Cấu hình VeeValidate ===
const tableSchema = yup.object({
    name: yup.string().required('Tên bàn là bắt buộc'),
    capacity: yup.number()
        .required('Số chỗ là bắt buộc')
        .min(1, 'Số chỗ phải lớn hơn 0')
        .integer('Số chỗ phải là số nguyên')
})

// === Vue Query: Lấy dữ liệu (API 15) ===
const { data: tables, isLoading, isError, error } = useQuery({
    queryKey: ['tables'],
    queryFn: getTables,
    // Sắp xếp bàn theo tên
    select: (data) => {
        if (!data) return []
        return data.sort((a, b) => a.name.localeCompare(b.name))
    }
})

// === Vue Query: Tạo mới (API 17) ===
const createMutation = useMutation({
    mutationFn: createTable,
    onSuccess: () => {
        toast.success('Tạo bàn mới thành công!')
        queryClient.invalidateQueries(['tables'])
        closeModal()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi khi tạo bàn.')
})

// === Vue Query: Cập nhật (API 18) ===
const updateMutation = useMutation({
    mutationFn: updateTable,
    onSuccess: () => {
        toast.success('Cập nhật bàn thành công!')
        queryClient.invalidateQueries(['tables'])
        closeModal()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi khi cập nhật.')
})

// === Vue Query: Xoá (API 20) ===
const deleteMutation = useMutation({
    mutationFn: deleteTable,
    onSuccess: () => {
        toast.success('Xoá bàn thành công!')
        queryClient.invalidateQueries(['tables'])
    },
    onError: (err) => {
        // Bắt lỗi nghiệp vụ từ backend
        toast.error(err.response?.data?.message || 'Không thể xoá bàn.')
    }
})

// === Vue Query: Cập nhật Trạng thái (API 19) ===
const statusMutation = useMutation({
    mutationFn: updateTableStatus,
    onSuccess: (updatedTable) => {
        toast.success(`Đã cập nhật bàn "${updatedTable.name}"`);
        // Cập nhật cache của Vue Query ngay lập tức
        queryClient.setQueryData(['tables'], (oldData) => {
            if (!oldData) return []
            return oldData.map(table => table.id === updatedTable.id ? updatedTable : table)
        })
    },
    onError: (err) => {
        toast.error(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái.')
        // Nếu lỗi, tải lại toàn bộ list để reset dropdown về giá trị đúng
        queryClient.invalidateQueries(['tables'])
    }
})

// === Logic Lọc (Filter) Client-side ===
const filteredTables = computed(() => {
    if (!tables.value) return []

    return tables.value.filter(table => {
        if (!table) return false

        // Lọc Tên
        const nameMatch = table.name.toLowerCase().includes(filterState.name.toLowerCase())

        // Lọc Trạng thái
        const statusMatch = !filterState.status || table.status === filterState.status

        // Lọc Số chỗ
        const capacityMatch = (() => {
            if (!filterState.capacity) return true
            switch (filterState.capacity) {
                case '1-2': return table.capacity >= 1 && table.capacity <= 2
                case '3-4': return table.capacity >= 3 && table.capacity <= 4
                case '5+': return table.capacity >= 5
                default: return true
            }
        })()

        return nameMatch && statusMatch && capacityMatch
    })
})

// === Xử lý Modal ===
onMounted(() => {
    // Khởi tạo Bootstrap Modal
    if (modalElement.value) {
        bsModal.value = new Modal(modalElement.value)
    }
})
onUnmounted(() => {
    bsModal.value?.dispose()
})

const openModal = (table = null) => {
    if (table) {
        isEditing.value = true
        formData.id = table.id
        formData.name = table.name
        formData.capacity = table.capacity
    } else {
        isEditing.value = false
        formData.id = null
        formData.name = ''
        formData.capacity = 2 // Gán giá trị mặc định khi tạo mới
    }
    bsModal.value?.show()
}
const closeModal = () => bsModal.value?.hide()

// === Xử lý Submit Form (Tạo/Sửa) ===
const handleSubmit = () => {
    const data = {
        name: formData.name,
        capacity: formData.capacity
    }
    if (isEditing.value) {
        updateMutation.mutate({ id: formData.id, data })
    } else {
        createMutation.mutate(data)
    }
}

// === Xử lý Xoá ===
const handleDelete = (table) => {
    if (confirm(`Bạn có chắc chắn muốn xoá "${table.name}"?`)) {
        deleteMutation.mutate(table.id)
    }
}

// === Xử lý Cập nhật Trạng thái nhanh ===
const handleStatusChange = (table, newStatus) => {
    if (table.status === newStatus) return // Không thay đổi
    statusMutation.mutate({ id: table.id, status: newStatus })
}

// === Helpers cho Giao diện ===
const getStatusClass = (status) => {
    switch (status) {
        case 'EMPTY': return 'status-available'
        case 'PENDING': return 'status-pending'
        case 'SERVING': return 'status-serving'
        case 'RESERVED': return 'status-reserved'
        default: return ''
    }
}
const getTableIcon = (status) => {
    switch (status) {
        case 'EMPTY': return 'bi-check-circle-fill'
        case 'PENDING': return 'bi-cup-hot-fill'
        case 'SERVING': return 'bi-cup-hot-fill'
        case 'RESERVED': return 'bi-bookmark-fill'
        default: return 'bi-question-circle'
    }
}
</script>

<style scoped>
.page-title {
    color: #A36B4A;
}

.table-card {
    transition: all 0.3s ease;
    border-width: 2px;
    border-style: solid;
}

.table-card .card-header {
    background-color: transparent;
    border-bottom: 1px solid #eee;
}

.table-card .card-title {
    color: #3B2F2F;
}

.table-card .btn-icon {
    opacity: 0.6;
}

.table-card .btn-icon:hover {
    opacity: 1;
    color: #000;
}

.table-card .table-icon {
    font-size: 3.5rem;
}

.card-footer {
    background-color: #fdfaf7;
}

/* --- Trạng thái Bàn --- */

/* Trống */
.status-available {
    border-color: #d1e7dd;
    background-color: #f6fbf9;
}

.status-available .table-icon {
    color: #198754;
}

.status-available .card-footer select {
    border-color: #198754;
}

/* Đang phục vụ */
.status-serving {
    border-color: #ffc107;
    background-color: #fffbf0;
}

.status-serving .table-icon {
    color: #A36B4A;
    /* Màu primary */
}

.status-serving .card-footer select {
    border-color: #A36B4A;
}

/* Đã đặt */
.status-reserved {
    border-color: #c14a45;
    background-color: #fcf2f2;
}

.status-reserved .table-icon {
    color: #c14a45;
}

.status-reserved .card-footer select {
    border-color: #c14a45;
}
</style>