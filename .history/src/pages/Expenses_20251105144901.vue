<template>
    <div class="expenses-page">
        <div class="header d-flex align-items-center justify-content-between mb-3">
            <h2 class="mb-0">Quản lý chi phí</h2>
            <button class="btn btn-primary" @click="openAddModal">+ Thêm chi phí</button>
        </div>

        <!-- Bộ lọc -->
        <div class="filters card p-3 mb-3">
            <div class="row g-3">
                <div class="col-md-3">
                    <input type="text" class="form-control" placeholder="Tìm kiếm chi phí..." v-model="filters.search"
                        @input="handleSearch" />
                </div>
                <div class="col-md-3">
                    <input type="date" class="form-control" v-model="filters.startDate" @change="handleFilterChange" />
                </div>
                <div class="col-md-3">
                    <input type="date" class="form-control" v-model="filters.endDate" @change="handleFilterChange" />
                </div>
                <div class="col-md-3">
                    <select class="form-select" v-model="filters.category" @change="handleFilterChange">
                        <option value="">Tất cả loại chi phí</option>
                        <option v-for="cat in categories" :key="cat.id" :value="cat.name">
                            {{ cat.name }}
                        </option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Bảng chi phí -->
        <div class="card">
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Ngày</th>
                            <th>Loại chi phí</th>
                            <th>Mô tả</th>
                            <th>Số tiền (VNĐ)</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(expense, index) in filteredExpenses" :key="expense.id">
                            <td>{{ (filters.page - 1) * filters.limit + index + 1 }}</td>
                            <td>{{ formatDate(expense.expenseDate) }}</td>
                            <td>{{ expense.category }}</td>
                            <td>{{ expense.description || 'Không có mô tả' }}</td>
                            <td>{{ formatCurrency(expense.amount) }}</td>
                            <td>
                                <button class="btn btn-sm btn-warning me-1" @click="openEditModal(expense)">
                                    Sửa
                                </button>
                                <button class="btn btn-sm btn-danger" @click="confirmDelete(expense.id)">
                                    Xóa
                                </button>
                            </td>
                        </tr>
                        <tr v-if="filteredExpenses.length === 0">
                            <td colspan="6" class="text-center py-4">Không có dữ liệu</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Phân trang -->
        <Pagination v-if="pageData" :current-page="filters.page" :total-pages="pageData.totalPages"
            @page-change="onPageChange" />

        <!-- Modal thêm/sửa -->
        <div class="modal fade" id="expenseModal" tabindex="-1" aria-labelledby="expenseModalLabel" aria-hidden="true"
            ref="modalRef">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="expenseModalLabel">
                            {{ isEditing ? 'Sửa chi phí' : 'Thêm chi phí' }}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" />
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="handleSubmit">
                            <div class="mb-3">
                                <label class="form-label">Ngày chi</label>
                                <input type="date" class="form-control" v-model="form.expenseDate" required />
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Loại chi phí</label>
                                <select class="form-select" v-model="form.category" required>
                                    <option value="">Chọn loại chi phí</option>
                                    <option v-for="cat in categories" :key="cat.id" :value="cat.name">
                                        {{ cat.name }}
                                    </option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Số tiền</label>
                                <input type="number" class="form-control" v-model="form.amount" min="1000" required />
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Mô tả</label>
                                <textarea class="form-control" v-model="form.description" rows="2"></textarea>
                            </div>

                            <div class="text-end">
                                <button type="submit" class="btn btn-success">
                                    {{ isEditing ? 'Cập nhật' : 'Thêm mới' }}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
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
import Pagination from '@/components/Pagination.vue'
import { formatMoney } from '@/utils/formatMoney.js'

const queryClient = useQueryClient()
const modalElement = ref(null)
const bsModal = ref(null)
const isEditing = ref(false)
const searchQuery = ref('')

const formData = reactive({
    id: null,
    category: '',
    amount: null,
    description: '',
    expenseDate: new Date().toISOString().split('T')[0]
})

const filters = reactive({
    page: 1,
    size: 10,
    sortBy: 'expenseDate',
    sortDesc: true,
    startDate: '',
    endDate: ''
})

const expenseSchema = yup.object({
    category: yup.string().required('Hạng mục là bắt buộc').max(100, 'Tên quá dài!'),
    amount: yup.number().required('Số tiền là bắt buộc').positive('Số tiền phải lớn hơn 0'),
    expenseDate: yup.date().required('Ngày chi là bắt buộc').max(new Date(), 'Ngày chi không thể ở trong tương lai'),
    description: yup.string().nullable().max(500, 'Mô tả quá dài!')
})

const getTodayDate = () => new Date().toISOString().split('T')[0];
const getFirstDayOfMonth = () => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
}
filters.startDate = getFirstDayOfMonth();
filters.endDate = getTodayDate();

// queryKey bây giờ theo dõi toàn bộ object 'filters'
const queryKey = computed(() => ['expenses', filters]);

const { data: pageData, isLoading, isError, error } = useQuery({
    queryKey: queryKey,
    queryFn: () => getExpenses({
        page: filters.page - 1, 
        size: filters.size,
        sort: `${filters.sortBy},${filters.sortDesc ? 'desc' : 'asc'}`,
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
    }),
    keepPreviousData: true,
});

const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
        toast.success('Ghi nhận chi phí thành công!')
        queryClient.invalidateQueries(['expenses'])
        closeModal()
    },
    onError: (err) => {
        toast.error(err.response?.data?.message || 'Không thể tạo chi phí.')
    }
})

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

const setSort = (field) => {
    if (filters.sortBy === field) {
        filters.sortDesc = !filters.sortDesc
    } else {
        filters.sortBy = field
        filters.sortDesc = true
    }
}

const getSortIcon = (field) => {
    if (filters.sortBy !== field) return 'bi bi-arrow-down-up'
    return filters.sortDesc ? 'bi bi-sort-down' : 'bi bi-sort-up'
}

const clearDateFilters = () => {
    filters.startDate = ''
    filters.endDate = ''
}

// Hàm xử lý sự kiện
const onPageChange = (page) => {
    filters.page = page
}

// Reset về trang 1 khi lọc hoặc sort
watch(() => [filters.startDate, filters.endDate, filters.sortBy, filters.sortDesc], () => {
    filters.page = 1
})

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
        formData.expenseDate = expense.expenseDate
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

const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}/${year}`
}

/* FIX 2:
  Đã xoá hàm watch() theo dõi 'filters.page' ở đây.
  Nó không cần thiết vì useQuery đã tự động theo dõi 'queryKey' (đã chứa filters.page).
*/


</script>

<style scoped>
.expenses-page {
    padding: 20px;
}

.table th {
    white-space: nowrap;
}
</style>