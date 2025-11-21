<template>
    <div class="container-fluid mt-4">
        <div class="card shadow-sm">
            <div class="card-header bg-primary text-white">
                <h3 class="mb-0">
                    <i class="bi bi-cash-coin me-2"></i> Quản lý Chi phí
                </h3>
            </div>
            <div class="card-body">
                <div class="row mb-3 gy-2 align-items-end">
                    <div class="col-md-3">
                        <label for="search" class="form-label fw-bold">Tìm kiếm (FE)</label>
                        <input type="text" class="form-control" id="search" v-model="filters.search"
                            placeholder="Tìm theo danh mục, mô tả, người tạo..." />
                    </div>
                    <div class="col-md-3">
                        <label for="startDate" class="form-label fw-bold">Từ ngày</label>
                        <input type="date" class="form-control" id="startDate" v-model="filters.startDate" />
                    </div>
                    <div class="col-md-3">
                        <label for="endDate" class="form-label fw-bold">Đến ngày</label>
                        <input type="date" class="form-control" id="endDate" v-model="filters.endDate" />
                    </div>
                    <div class="col-md-3 text-md-end">
                        <button class="btn btn-primary" @click="openModal()">
                            <i class="bi bi-plus-circle me-1"></i> Thêm mới
                        </button>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table table-hover table-striped align-middle">
                        <thead class="table-light">
                            <tr>
                                <th @click="handleSort('category')" class="cursor-pointer">
                                    Danh mục <i :class="getSortIcon('category')"></i>
                                </th>
                                <th @click="handleSort('amount')" class="cursor-pointer">
                                    Số tiền <i :class="getSortIcon('amount')"></i>
                                </th>
                                <th @click="handleSort('expenseDate')" class="cursor-pointer">
                                    Ngày chi <i :class="getSortIcon('expenseDate')"></i>
                                </th>
                                <th @click="handleSort('user.username')" class="cursor-pointer">
                                    Người tạo <i :class="getSortIcon('user.username')"></i>
                                </th>
                                <th>Mô tả</th>
                                <th class="text-center" style="width: 120px">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="isLoading">
                                <td colspan="6" class="text-center">
                                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    Đang tải dữ liệu...
                                </td>
                            </tr>
                            <tr v-else-if="isError">
                                <td colspan="6" class="text-center text-danger">
                                    <i class="bi bi-exclamation-triangle-fill me-1"></i> Có lỗi xảy ra: {{ error.message
                                    }}
                                </td>
                            </tr>
                            <tr v-else-if="!filteredContent.length">
                                <td colspan="6" class="text-center">
                                    Không tìm thấy khoản chi nào.
                                </td>
                            </tr>
                            <tr v-else v-for="expense in filteredContent" :key="expense.id">
                                <td>{{ expense.category }}</td>
                                <td class="text-danger fw-bold">{{ formatMoney(expense.amount) }}</td>
                                <td>{{ expense.expenseDate }}</td>
                                <td>{{ expense.username }}</td>
                                <td class="text-truncate" style="max-width: 250px" :title="expense.description">
                                    {{ expense.description || 'N/A' }}
                                </td>
                                <td class="text-center">
                                    <button class="btn btn-sm btn-outline-warning me-2" @click="openModal(expense)"
                                        title="Sửa">
                                        <i class="bi bi-pencil-square"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" @click="handleDelete(expense.id)"
                                        :disabled="deleteMutation.isPending.value" title="Xoá">
                                        <i class="bi bi-trash3"></i>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div v-if="expensesData && expensesData.totalPages > 1"
                    class="d-flex justify-content-between align-items-center">
                    <span class="text-muted small">
                        Hiển thị {{ expensesData.numberOfElements }} trong tổng số {{ expensesData.totalElements }} kết
                        quả.
                    </span>
                    <Pagination :currentPage="expensesData.number" :totalPages="expensesData.totalPages"
                        @page-change="handlePageChange" />
                </div>
            </div>
        </div>

        <div class="modal fade" id="expenseModal" ref="modalRef" tabindex="-1" aria-labelledby="expenseModalLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <Form :validation-schema="schema" @submit="handleSubmit" :initial-values="editingExpense"
                        ref="formRef" v-slot="{ isSubmitting }">
                        <div class="modal-header">
                            <h5 class="modal-title" id="expenseModalLabel">
                                {{ editingExpense?.id ? 'Cập nhật Chi phí' : 'Thêm mới Chi phí' }}
                            </h5>
                            <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="category" class="form-label">Danh mục <span
                                        class="text-danger">*</span></label>
                                <Field name="category" type="text" class="form-control" id="category"
                                    placeholder="V.d: Tiền điện, Nước, Lương..." />
                                <ErrorMessage name="category" class="form-text text-danger" />
                            </div>

                            <div class="mb-3">
                                <label for="amount" class="form-label">Số tiền <span
                                        class="text-danger">*</span></label>
                                <Field name="amount" type="number" class="form-control" id="amount" step="1000"
                                    min="0" />
                                <ErrorMessage name="amount" class="form-text text-danger" />
                            </div>

                            <div class="mb-3">
                                <label for="expenseDate" class="form-label">Ngày chi <span
                                        class="text-danger">*</span></label>
                                <Field name="expenseDate" type="date" class="form-control" id="expenseDate" />
                                <ErrorMessage name="expenseDate" class="form-text text-danger" />
                            </div>

                            <div classmb-3">
                                <label for="description" class="form-label">Mô tả</label>
                                <Field name="description" as="textarea" class="form-control" id="description" rows="3"
                                    placeholder="Mô tả chi tiết..." />
                                <ErrorMessage name="description" class="form-text text-danger" />
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="closeModal">Huỷ</button>
                            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                                <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1" role="status"
                                    aria-hidden="true"></span>
                                Lưu
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, watch, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { Modal } from 'bootstrap'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { toast } from 'vue3-toastify'
import * as expenseService from '@/api/expenseService' // Kiểm tra đường dẫn này
import Pagination from '@/components/Pagination.vue' // Kiểm tra đường dẫn này
import { formatMoney } from '@/utils/formatMoney' // Kiểm tra đường dẫn này

// ----- State -----
const queryClient = useQueryClient()
const modalRef = ref(null)
const modalInstance = ref(null)
const formRef = ref(null) // Ref cho vee-validate form
const editingExpense = ref(null) // null = tạo mới, object = chỉnh sửa

// State cho lọc, tìm kiếm (BE) và phân trang (BE)
const filters = reactive({
    startDate: '',
    endDate: '',
    search: '', // Biến này dùng để tìm kiếm ở FE (theo yêu cầu "xử lý trong fe")
})

const pagination = reactive({
    page: 0,      // API dùng 0-based index
    size: 10,
    sort: 'expenseDate,desc', // Mặc định sắp xếp theo API
})

// ----- Validation Schema (dựa trên ExpenseDTO) -----
const schema = yup.object({
    category: yup.string().required('Danh mục là bắt buộc.'),
    amount: yup
        .number()
        .required('Số tiền là bắt buộc.')
        .positive('Số tiền phải là số dương.')
        .typeError('Số tiền phải là một con số.'),
    description: yup.string().nullable(),
    expenseDate: yup
        .date()
        .required('Ngày chi là bắt buộc.')
        .max(new Date(), 'Ngày chi không được ở tương lai.')
        .typeError('Ngày chi không hợp lệ.'),
})

// ----- API (vue-query) -----

// 1. Fetch Expenses (GET)
// `useQuery` sẽ tự động fetch lại khi `pagination` hoặc `filters` thay đổi
const {
    data: expensesData,
    isLoading,
    isError,
    error,
} = useQuery({
    queryKey: [
        'expenses',
        pagination.page,
        pagination.size,
        pagination.sort,
        filters.startDate,
        filters.endDate
    ],
    queryFn: () => {
        // Chỉ gửi các filter BE cho API
        const apiParams = {
            page: pagination.page,
            size: pagination.size,
            sort: pagination.sort,
            startDate: filters.startDate || null, // Gửi null nếu rỗng
            endDate: filters.endDate || null,
        }
        return expenseService.getAllExpenses(apiParams)
    },
    keepPreviousData: true, // Giữ data cũ khi đang fetch page mới (trải nghiệm mượt hơn)
})

// 2. Create Mutation (POST)
const createMutation = useMutation({
    mutationFn: expenseService.createExpense,
    onSuccess: () => {
        toast.success('Tạo khoản chi thành công!')
        queryClient.invalidateQueries(['expenses'])
        closeModal()
    },
    onError: (err) => {
        toast.error(`Tạo thất bại: ${err.message || 'Lỗi không xác định'}`)
    },
})

// 3. Update Mutation (PUT)
const updateMutation = useMutation({
    mutationFn: expenseService.updateExpense, // Chờ { id, expenseDTO }
    onSuccess: () => {
        toast.success('Cập nhật khoản chi thành công!')
        queryClient.invalidateQueries(['expenses'])
        closeModal()
    },
    onError: (err) => {
        toast.error(`Cập nhật thất bại: ${err.message || 'Lỗi không xác định'}`)
    },
})

// 4. Delete Mutation (DELETE)
const deleteMutation = useMutation({
    mutationFn: expenseService.deleteExpense,
    onSuccess: () => {
        toast.success('Xoá khoản chi thành công!')
        queryClient.invalidateQueries(['expenses'])
        // Nếu xoá hết item ở trang cuối, lùi về trang trước
        if (expensesData.value?.content.length === 1 && pagination.page > 0) {
            pagination.page--
        }
    },
    onError: (err) => {
        toast.error(`Xoá thất bại: ${err.message || 'Bạn không có quyền xoá'}`)
    },
})

// ----- Computed (Lọc/Tìm kiếm trong FE) -----

// Yêu cầu "tìm kiếm, xắp xếp, phân trang (trong fe)" mâu thuẫn với API (phân trang BE).
// Giải pháp: Lọc (filter) và Tìm kiếm (search) sẽ thực hiện "trong fe" 
// TRÊN DỮ LIỆU CỦA TRANG HIỆN TẠI (do BE trả về).
// Sắp xếp và Phân trang sẽ gọi lại API (BE).

const filteredContent = computed(() => {
    const content = expensesData.value?.content || []
    if (!filters.search) {
        return content // Trả về toàn bộ data của trang hiện tại
    }

    const searchTerm = filters.search.toLowerCase().trim()
    return content.filter(expense =>
        expense.category.toLowerCase().includes(searchTerm) ||
        (expense.description && expense.description.toLowerCase().includes(searchTerm)) ||
        expense.username.toLowerCase().includes(searchTerm)
    )
})

// ----- Event Handlers -----

// 1. Modal
const openModal = (expense = null) => {
    if (expense) {
        // Chỉnh sửa: copy object để tránh reactive
        // Chuyển đổi ngày cho input type="date"
        editingExpense.value = {
            ...expense,
            expenseDate: expense.expenseDate // API đã trả về YYYY-MM-DD
        }
    } else {
        // Thêm mới: Đặt giá trị mặc định
        editingExpense.value = {
            category: '',
            amount: null,
            description: '',
            expenseDate: new Date().toISOString().split('T')[0], // Ngày hôm nay
        }
    }
    // Reset validation (nếu có)
    formRef.value?.resetForm({ values: editingExpense.value })
    modalInstance.value.show()
}

const closeModal = () => {
    modalInstance.value.hide()
    editingExpense.value = null
}

// 2. Form Submit
const handleSubmit = (values) => {
    const expenseDTO = {
        ...values,
        amount: parseFloat(values.amount) // Đảm bảo amount là number
    }

    if (editingExpense.value.id) {
        // Update
        updateMutation.mutate({ id: editingExpense.value.id, expenseDTO })
    } else {
        // Create
        createMutation.mutate(expenseDTO)
    }
}

// 3. Delete
const handleDelete = (id) => {
    // (Tùy chọn: Dùng modal xác nhận thay vì confirm)
    if (confirm('Bạn có chắc chắn muốn xoá khoản chi này?')) {
        deleteMutation.mutate(id)
    }
}

// 4. Pagination
const handlePageChange = (page) => {
    pagination.page = page // component Pagination nên trả về 0-based index
}

// 5. Sorting (BE)
const handleSort = (field) => {
    if (pagination.sort.startsWith(field)) {
        // Đảo chiều
        const direction = pagination.sort.endsWith('asc') ? 'desc' : 'asc'
        pagination.sort = `${field},${direction}`
    } else {
        // Sắp xếp cột mới (mặc định desc)
        pagination.sort = `${field},desc`
    }
    pagination.page = 0 // Quay về trang đầu khi sắp xếp
}

const getSortIcon = (field) => {
    if (!pagination.sort.startsWith(field)) return 'bi bi-arrow-down-up'
    if (pagination.sort.endsWith('asc')) return 'bi bi-sort-up-alt'
    return 'bi bi-sort-down'
}

// ----- Lifecycle Hooks -----
onMounted(() => {
    if (modalRef.value) {
        modalInstance.value = new Modal(modalRef.value)
    }
})

onUnmounted(() => {
    if (modalInstance.value) {
        modalInstance.value.dispose()
    }
})

</script>

<style scoped>
.cursor-pointer {
    cursor: pointer;
}

.table-hover tbody tr:hover {
    background-color: #f5f5f5;
    transition: background-color 0.2s;
}

.text-truncate {
    cursor: help;
}
</style>