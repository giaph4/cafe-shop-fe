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
                            <input type="text" class="form-control" placeholder="Tìm theo hạng mục, mô tả, người tạo..."
                                v-model="searchQuery">
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
                <Pagination v-if="pageData" v-model:currentPage="pagination.page" :total-pages="pageData.totalPages" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, reactive, watch } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { Modal } from 'bootstrap'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { toast } from 'vue3-toastify'
import { getExpenses, createExpense, updateExpense, deleteExpense } from '@/api/expenseService'
import Pagination from '@/components/Pagination.vue' // Đã kiểm tra, component này tồn tại
import { formatMoney } from '@/utils/formatMoney.js' // Đã kiểm tra, tệp này tồn tại

const queryClient = useQueryClient()
const modalElement = ref(null)
const bsModal = ref(null)
const isEditing = ref(false)
const searchQuery = ref('')

// Trạng thái cho form
const formData = reactive({
    id: null,
    category: '',
    amount: null,
    description: '',
    expenseDate: new Date().toISOString().split('T')[0] // Mặc định là hôm nay
})

// Trạng thái cho API (lọc, sort, phân trang)
const pagination = reactive({ page: 1, size: 10 })
const sorting = reactive({ sortBy: 'expenseDate', sortDesc: true })
const filters = reactive({ startDate: '', endDate: '' })

// Định nghĩa Schema Validation với Yup
const expenseSchema = yup.object({
    category: yup.string().required('Hạng mục là bắt buộc').max(100, 'Tên quá dài!'),
    amount: yup.number().required('Số tiền là bắt buộc').positive('Số tiền phải lớn hơn 0'),
    expenseDate: yup.date().required('Ngày chi là bắt buộc').max(new Date(), 'Ngày chi không thể ở trong tương lai'),
    description: yup.string().nullable().max(500, 'Mô tả quá dài!')
})




// Lấy ngày hôm nay làm ngày mặc định cho bộ lọc
const getTodayDate = () => new Date().toISOString().split('T')[0];

// Lấy ngày đầu tiên của tháng
const getFirstDayOfMonth = () => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
}
// Tự động gán bộ lọc ngày
filters.startDate = getFirstDayOfMonth();
filters.endDate = getTodayDate();


// === VUE QUERY ===

// computed key để query tự động cập nhật khi state thay đổi
const queryKey = computed(() => [
    'expenses',
    pagination.page,
    pagination.size,
    sorting.sortBy,
    sorting.sortDesc,
    filters.startDate,
    filters.endDate
])

// 1. Query (Lấy dữ liệu)
const { data: pageData, isLoading, isError, error } = useQuery({
    queryKey: queryKey,
    queryFn: () => getExpenses({
        page: pagination.page - 1, // API 0-indexed
        size: pagination.size,
        sort: `${sorting.sortBy},${sorting.sortDesc ? 'desc' : 'asc'}`,
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
    }),
    keepPreviousData: true, // Giữ data cũ khi đang fetch data mới
})

// 2. Create Mutation
const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
        toast.success('Ghi nhận chi phí thành công!')
        queryClient.invalidateQueries(['expenses']) // Tải lại data
        closeModal()
    },
    onError: (err) => {
        toast.error(err.response?.data?.message || 'Không thể tạo chi phí.')
    }
})

// 3. Update Mutation
const updateMutation = useMutation({
    mutationFn: updateExpense,
    onSuccess: () => {
        toast.success('Cập nhật chi phí thành công!')
        queryClient.invalidateQueries(['expenses'])
        closeModal()
    },
    onError: (err) => {
        toast.error(err.response?.data?.message || 'Không thể cập nhật chi phí.')
    }
})

// 4. Delete Mutation
const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
        toast.success('Xoá chi phí thành công!')
        queryClient.invalidateQueries(['expenses'])
    },
    onError: (err) => {
        toast.error(err.response?.data?.message || 'Không thể xoá chi phí.')
    }
})

// === LOGIC ===

// Lọc Client-side (Tìm kiếm)
const filteredExpenses = computed(() => {
    if (!pageData.value?.content) return []
    if (!searchQuery.value) return pageData.value.content

    const lowerCaseQuery = searchQuery.value.toLowerCase()
    return pageData.value.content.filter(
        expense =>
            expense.category.toLowerCase().includes(lowerCaseQuery) ||
            (expense.description && expense.description.toLowerCase().includes(lowerCaseQuery)) ||
            expense.username.toLowerCase().includes(lowerCaseQuery)
    )
})

// Sắp xếp
const setSort = (field) => {
    if (sorting.sortBy === field) {
        sorting.sortDesc = !sorting.sortDesc
    } else {
        sorting.sortBy = field
        sorting.sortDesc = true // Mặc định DESC
    }
}

// Lấy icon cho cột sort
const getSortIcon = (field) => {
    if (sorting.sortBy !== field) return 'bi bi-arrow-down-up'
    return sorting.sortDesc ? 'bi bi-sort-down' : 'bi bi-sort-up'
}

// Lọc (theo ngày)
const clearDateFilters = () => {
    filters.startDate = ''
    filters.endDate = ''
}

// Reset về trang 1 khi lọc hoặc sort
watch([filters, sorting], () => {
    pagination.page = 1
}, { deep: true })


// === MODAL & FORM ===
onMounted(() => {
    if (modalElement.value) {
        bsModal.value = new Modal(modalElement.value)
    }
})

onUnmounted(() => {
    bsModal.value?.dispose()
})

const resetForm = () => {
    formData.id = null
    formData.category = ''
    formData.amount = null
    formData.description = ''
    formData.expenseDate = new Date().toISOString().split('T')[0]
}

const openModal = (expense = null) => {
    if (expense) {
        isEditing.value = true
        formData.id = expense.id
        formData.category = expense.category
        formData.amount = expense.amount
        formData.description = expense.description
        formData.expenseDate = expense.expenseDate // Backend gửi YYYY-MM-DD
    } else {
        isEditing.value = false
        resetForm()
    }
    bsModal.value?.show()
}

const closeModal = () => {
    bsModal.value?.hide()
}

const handleSubmit = (values) => {
    const payload = { ...values }
    if (isEditing.value) {
        updateMutation.mutate({ id: formData.id, data: payload })
    } else {
        createMutation.mutate(payload)
    }
}

const handleDelete = (expense) => {
    if (confirm(`Bạn có chắc chắn muốn xoá khoản chi "${expense.category}" trị giá ${formatMoney(expense.amount)}?`)) {
        deleteMutation.mutate(expense.id)
    }
}

// === HELPERS ===
const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}/${year}`
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