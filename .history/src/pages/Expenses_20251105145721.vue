<template>
    <!-- Modal cho Thêm mới & Cập nhật -->
    <div class="modal fade" id="expenseModal" tabindex="-1" ref="modalElement" aria-labelledby="expenseModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="expenseModalLabel">{{ isEditing ? 'Cập nhật Chi phí' : 'Thêm mới Chi phí' }}
                    </h5>
                    <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
                </div>

                <Form @submit="handleSubmit" :validation-schema="expenseSchema" v-slot="{ errors }">
                    <div class="modal-body">
                        <!-- Hạng mục -->
                        <div class="mb-3">
                            <label for="category" class="form-label fw-bold">Hạng mục <span
                                    class="text-danger">*</span></label>
                            <Field name="category" type="text" class="form-control"
                                :class="{ 'is-invalid': errors.category }" id="category"
                                placeholder="VD: Tiền điện, Tiền nước, Lương..." v-model="formData.category" />
                            <ErrorMessage name="category" class="invalid-feedback" />
                        </div>

                        <!-- Số tiền -->
                        <div class="mb-3">
                            <label for="amount" class="form-label fw-bold">Số tiền (VND) <span
                                    class="text-danger">*</span></label>
                            <Field name="amount" type="number" class="form-control"
                                :class="{ 'is-invalid': errors.amount }" id="amount" placeholder="500000"
                                v-model="formData.amount" />
                            <ErrorMessage name="amount" class="invalid-feedback" />
                        </div>

                        <!-- Ngày chi -->
                        <div class="mb-3">
                            <label for="expenseDate" class="form-label fw-bold">Ngày chi <span
                                    class="text-danger">*</span></label>
                            <Field name="expenseDate" type="date" class="form-control"
                                :class="{ 'is-invalid': errors.expenseDate }" id="expenseDate"
                                v-model="formData.expenseDate" />
                            <ErrorMessage name="expenseDate" class="invalid-feedback" />
                        </div>

                        <!-- Mô tả -->
                        <div class="mb-3">
                            <label for="description" class="form-label fw-bold">Mô tả</label>
                            <Field name="description" as="textarea" rows="3" class="form-control" id="description"
                                placeholder="Mô tả chi tiết khoản chi..." v-model="formData.description" />
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

    <!-- Nội dung trang chính -->
    <div data-aos="fade-up">
        <div class="page-header d-flex justify-content-between align-items-center mb-4">
            <h2 class="page-title">Quản lý Chi phí</h2>
            <button class="btn btn-primary" @click="openModal()">
                <i class="bi bi-plus-lg me-2"></i> Ghi nhận chi phí
            </button>
        </div>

        <!-- Bộ lọc và Tìm kiếm -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row g-3">
                    <!-- Tìm kiếm (Client-side) -->
                    <div class="col-md-4">
                        <div class="input-group">
                            <span class="input-group-text"><i class="bi bi-search"></i></span>
                            <input type="text" class="form-control"
                                placeholder="Tìm theo hạng mục, mô tả, người tạo..." v-model="searchQuery">
                        </div>
                    </div>
                    <!-- Lọc theo ngày (Server-side) -->
                    <div class="col-md-3">
                        <input type="date" class="form-control" v-model="filters.startDate">
                    </div>
                    <div class="col-md-3">
                        <input type="date" class="form-control" v-model="filters.endDate">
                    </div>
                    <div class="col-md-2 d-grid">
                        <button class="btn btn-outline-secondary" @click="clearDateFilters">
                            <i class="bi bi-x-lg me-1"></i> Xoá lọc
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bảng dữ liệu -->
        <div class="card">
            <div class="card-body">

                <div v-if="isLoading" class="text-center my-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>

                <div v-else-if="isError" class="alert alert-danger">
                    Không thể tải dữ liệu: {{ error.message }}
                </div>

                <div v-else-if="pageData && pageData.content" class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th scope="col" @click="setSort('id')" class="sortable">
                                    ID <i :class="getSortIcon('id')"></i>
                                </th>
                                <th scope="col" @click="setSort('expenseDate')" class="sortable">
                                    Ngày chi <i :class="getSortIcon('expenseDate')"></i>
                                </th>
                                <th scope="col" @click="setSort('category')" class="sortable">
                                    Hạng mục <i :class="getSortIcon('category')"></i>
                                </th>
                                <th scope="col" @click="setSort('amount')" class="sortable">
                                    Số tiền <i :class="getSortIcon('amount')"></i>
                                </th>
                                <th scope="col" @click="setSort('user')" class="sortable">
                                    Người tạo <i :class="getSortIcon('user')"></i>
                                </th>
                                <th scope="col">Mô tả</th>
                                <th scope="col" class="text-end">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="expense in filteredExpenses" :key="expense.id">
                                <th scope="row">{{ expense.id }}</th>
                                <td class="fw-bold">{{ formatDate(expense.expenseDate) }}</td>
                                <td>{{ expense.category }}</td>
                                <td class="text-danger fw-bold">{{ formatMoney(expense.amount) }}</td>
                                <td>{{ expense.username }}</td>
                                <td class="text-muted">{{ expense.description || 'N/A' }}</td>
                                <td class="text-end">
                                    <button class="btn btn-sm btn-outline-primary me-2" @click="openModal(expense)">
                                        <i class="bi bi-pencil-fill"></i> Sửa
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" @click="handleDelete(expense)">
                                        <i class="bi bi-trash-fill"></i> Xoá
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="filteredExpenses.length === 0">
                                <td colspan="7" class="text-center text-muted">Không tìm thấy dữ liệu.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Phân trang -->
            <div class="card-footer d-flex justify-content-end">
                <Pagination
                :currentPage="currentPage"
                :totalPages="data?.totalPages || 1"
                @page-change="handlePageChange"
            />
            
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { Modal } from 'bootstrap'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { toast } from 'vue3-toastify'
import { getExpenses, createExpense, updateExpense, deleteExpense } from '@/api/expenseService'
import Pagination from '@/components/Pagination.vue'

// query client
const queryClient = useQueryClient()

// phân trang
const currentPage = ref(1)

// tìm kiếm (debounce)
const searchQuery = ref('')
const debouncedSearch = ref('')
let searchTimeout = null

// sắp xếp
const sortState = reactive({
    key: 'expenseDate',
    direction: 'desc'
})

// modal
const modalElement = ref(null)
const bsModal = ref(null)
const isEditing = ref(false)
const formData = reactive({
    id: null,
    expenseDate: '',
    amount: '',
    description: '',
    category: ''
})

// validate schema
const expenseSchema = yup.object({
    expenseDate: yup.string().required('Ngày chi là bắt buộc'),
    amount: yup.number().required('Số tiền là bắt buộc').min(0, 'Không thể âm'),
    description: yup.string().required('Mô tả là bắt buộc'),
    category: yup.string().required('Danh mục là bắt buộc'),
})

// debounce tìm kiếm
watch(searchQuery, (newVal) => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        debouncedSearch.value = newVal
        currentPage.value = 1
    }, 300)
})

// lấy dữ liệu
const { data, isLoading, isError, error } = useQuery({
    queryKey: ['expenses', currentPage, debouncedSearch, sortState],
    queryFn: () => {
        const sortString = `${sortState.key},${sortState.direction}`
        return getExpenses(currentPage.value - 1, 10, debouncedSearch.value, sortString)
    },
    keepPreviousData: true
})

// mutations
const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
        toast.success('Thêm chi phí thành công!')
        queryClient.invalidateQueries(['expenses'])
        closeModal()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi!')
})

const updateMutation = useMutation({
    mutationFn: updateExpense,
    onSuccess: () => {
        toast.success('Cập nhật chi phí thành công!')
        queryClient.invalidateQueries(['expenses'])
        closeModal()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi!')
})

const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
        toast.success('Xoá chi phí thành công!')
        queryClient.invalidateQueries(['expenses'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Không thể xoá!')
})

// lifecycle
onMounted(() => {
    if (modalElement.value) bsModal.value = new Modal(modalElement.value)
})
onUnmounted(() => {
    bsModal.value?.dispose()
})

// modal logic
const openModal = (expense = null) => {
    if (expense) {
        isEditing.value = true
        formData.id = expense.id
        formData.expenseDate = expense.expenseDate
        formData.amount = expense.amount
        formData.description = expense.description
        formData.category = expense.category
    } else {
        isEditing.value = false
        formData.id = null
        formData.expenseDate = ''
        formData.amount = ''
        formData.description = ''
        formData.category = ''
    }
    bsModal.value?.show()
}

const closeModal = () => bsModal.value?.hide()

// submit form
const handleSubmit = () => {
    const data = {
        expenseDate: formData.expenseDate,
        amount: formData.amount,
        description: formData.description,
        category: formData.category
    }
    if (isEditing.value) {
        updateMutation.mutate({ id: formData.id, data })
    } else {
        createMutation.mutate(data)
    }
}

// xoá chi phí
const handleDelete = (expense) => {
    if (confirm(`Bạn có chắc chắn muốn xoá chi phí ngày ${expense.expenseDate}?`)) {
        deleteMutation.mutate(expense.id)
    }
}

// xử lý phân trang
const handlePageChange = (page) => {
    currentPage.value = page
}

// sắp xếp
const handleSort = (key) => {
    if (sortState.key === key) {
        sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc'
    } else {
        sortState.key = key
        sortState.direction = 'asc'
    }
    currentPage.value = 1
}

const getSortIcon = (key) => {
    if (sortState.key !== key) return 'bi-arrow-down-up'
    if (sortState.direction === 'asc') return 'bi-sort-up'
    return 'bi-sort-down'
}
</script>

<style scoped>
.page-title {
    color: #A36B4A;
}

.table-hover tbody tr:hover {
    background-color: #fdfaf7;
}

.sortable {
    cursor: pointer;
    user-select: none;
}

.sortable:hover {
    color: #A36B4A;
}

.sortable i {
    font-size: 0.8em;
    margin-left: 4px;
    color: #aaa;
}

.sortable:hover i {
    color: #A36B4A;
}
</style>