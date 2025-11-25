<template>
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
                        <div class="mb-3">
                            <label for="category" class="form-label fw-bold">Hạng mục <span
                                    class="text-danger">*</span></label>
                            <Field name="category" type="text" class="form-control"
                                :class="{ 'is-invalid': errors.category }" id="category"
                                placeholder="VD: Tiền điện, Tiền nước, Lương..." v-model="formData.category" />
                            <ErrorMessage name="category" class="invalid-feedback" />
                        </div>

                        <div class="mb-3">
                            <label for="amount" class="form-label fw-bold">Số tiền (VND) <span
                                    class="text-danger">*</span></label>
                            <Field name="amount" type="number" class="form-control"
                                :class="{ 'is-invalid': errors.amount }" id="amount" placeholder="500000"
                                v-model="formData.amount" />
                            <ErrorMessage name="amount" class="invalid-feedback" />
                        </div>

                        <div class="mb-3">
                            <label for="expenseDate" class="form-label fw-bold">Ngày chi <span
                                    class="text-danger">*</span></label>
                            <Field name="expenseDate" type="date" class="form-control"
                                :class="{ 'is-invalid': errors.expenseDate }" id="expenseDate"
                                v-model="formData.expenseDate" />
                            <ErrorMessage name="expenseDate" class="invalid-feedback" />
                        </div>

                        <div class="mb-3">
                            <label for="description" class="form-label fw-bold">Mô tả</label>
                            <Field name="description" as="textarea" rows="3" class="form-control" id="description"
                                placeholder="Mô tả chi tiết khoản chi..." v-model="formData.description" />
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" @click="closeModal" :disabled="createMutation.isPending.value || updateMutation.isPending.value">
                            Hủy
                        </button>
                        <button type="submit" class="btn btn-primary"
                            :disabled="createMutation.isPending.value || updateMutation.isPending.value">
                            <span v-if="createMutation.isPending.value || updateMutation.isPending.value"
                                class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Lưu thay đổi
                        </button>
                    </div>
                </Form>
            </div>
        </div>
    </div>

    <div class="page-container container-fluid" data-aos="fade-up">
        <div class="expenses-header">
            <div class="expenses-header__content">
                <div class="expenses-header__title-section">
                    <h2 class="page-title">Quản lý Chi phí</h2>
                    <p class="page-subtitle">Theo dõi và quản lý các khoản chi phí hoạt động của cửa hàng.</p>
                </div>
                <div class="expenses-header__actions">
                    <button class="btn btn-outline-secondary" type="button" @click="queryClient.invalidateQueries(['expenses'])" :disabled="isLoading">
                        <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="bi bi-arrow-clockwise me-2"></i>
                        Làm mới
                    </button>
                    <button class="btn btn-primary" type="button" @click="openModal()">
                        <i class="bi bi-plus-lg me-2"></i>
                        Ghi nhận chi phí
                    </button>
                </div>
            </div>
        </div>

        <div class="card filter-card mb-4">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-md-4">
                        <label class="form-label">Tìm kiếm</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="bi bi-search"></i></span>
                            <input type="text" class="form-control" placeholder="Tìm theo hạng mục, mô tả, người tạo..."
                                v-model="searchQuery">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Từ ngày</label>
                        <input type="date" class="form-control" v-model="startDate">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Đến ngày</label>
                        <input type="date" class="form-control" v-model="endDate">
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-outline-secondary w-100" @click="clearDateFilters">
                            <i class="bi bi-x-lg me-1"></i> Xóa lọc
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card table-card">
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
                                <th scope="col">ID</th>
                                <th scope="col">Ngày chi</th>
                                <th scope="col">Hạng mục</th>
                                <th scope="col">Số tiền</th>
                                <th scope="col">Người tạo</th>
                                <th scope="col">Mô tả</th>
                                <th scope="col" class="text-end">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="expense in filteredExpenses" :key="expense.id">
                                <th scope="row">{{ expense.id }}</th>
                                <td class="fw-bold">{{ formatDate(expense.expenseDate) }}</td>
                                <td>{{ expense.category }}</td>
                                <td class="text-danger fw-bold">{{ formatCurrency(expense.amount) }}</td>
                                <td>{{ expense.username }}</td>
                                <td class="text-muted">{{ expense.description || 'N/A' }}</td>
                                <td class="text-end">
                                    <div class="action-buttons">
                                        <button class="action-button action-button--primary" @click="openModal(expense)" title="Chỉnh sửa">
                                            <i class="bi bi-pencil"></i>
                                            <span>Chỉnh sửa</span>
                                        </button>
                                        <button class="action-button action-button--danger" @click="handleDelete(expense)" title="Xóa">
                                            <i class="bi bi-trash"></i>
                                            <span>Xóa</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="filteredExpenses.length === 0">
                                <td colspan="7" class="text-center text-muted">Không tìm thấy dữ liệu.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card-footer d-flex justify-content-end">
                <Pagination
                    v-if="totalPages > 1"
                    mode="zero-based"
                    :current-page="currentPage"
                    :total-pages="totalPages"
                    @page-change="handlePageChange"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { Modal } from 'bootstrap'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { toast } from 'vue3-toastify'
import { getExpenses, createExpense, updateExpense, deleteExpense } from '@/api/expenseService'
import Pagination from '@/components/common/Pagination.vue'
import { formatCurrency, formatDate } from '@/utils/formatters.js'
import { PaginationMode, usePagination } from '@/composables/usePagination'

const queryClient = useQueryClient()

const searchQuery = ref('')
const startDate = ref('')
const endDate = ref('')

const modalElement = ref(null)
const bsModal = ref(null)
const isEditing = ref(false)
const formData = reactive({
    id: null,
    category: '',
    amount: null,
    description: '',
    expenseDate: new Date().toISOString().split('T')[0]
})

const getTodayDate = () => new Date().toISOString().split('T')[0];
const getFirstDayOfMonth = () => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
}
startDate.value = getFirstDayOfMonth();
endDate.value = getTodayDate();

const expenseSchema = yup.object({
    category: yup.string().required('Hạng mục là bắt buộc').max(100, 'Tên quá dài!'),
    amount: yup.number().required('Số tiền là bắt buộc').positive('Số tiền phải lớn hơn 0'),
    expenseDate: yup.date().required('Ngày chi là bắt buộc').max(new Date(), 'Ngày chi không thể ở trong tương lai'),
    description: yup.string().nullable().max(500, 'Mô tả quá dài!')
})

const router = useRouter()
const route = useRoute()

const {
    currentPage,
    zeroBasedPage,
    pageSize,
    totalPages,
    setPageFromZero,
    updateFromResponse,
    rememberCurrent,
    syncQuery
} = usePagination({
    mode: PaginationMode.ZERO_BASED,
    pageSize: 10,
    persistKey: 'expenses'
})

syncQuery(route, router, {
    queryMode: PaginationMode.ZERO_BASED,
    pageParam: 'page',
    sizeParam: 'size'
})

onBeforeRouteLeave(() => {
    rememberCurrent()
})

const expensesQueryKey = computed(() => [
    'expenses',
    zeroBasedPage.value,
    pageSize.value,
    startDate.value,
    endDate.value
])

const { data: pageData, isLoading, isError, error } = useQuery({
    queryKey: expensesQueryKey,
    queryFn: async () => {
        const response = await getExpenses({
            page: zeroBasedPage.value,
            size: pageSize.value,
            startDate: startDate.value || null,
            endDate: endDate.value || null
        })
        return response
    },
    keepPreviousData: true,
    onSuccess: (response) => {
        const { adjusted } = updateFromResponse({
            page: response.number,
            totalPages: response.totalPages,
            totalElements: response.totalElements
        })
        if (adjusted) {
            toast.info('Trang hiện tại đã được điều chỉnh theo dữ liệu mới.', { autoClose: 2500 })
        }
    }
})

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

const clearDateFilters = () => {
    startDate.value = ''
    endDate.value = ''
}

const handlePageChange = (page) => {
    rememberCurrent()
    setPageFromZero(page)
}


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
    if (confirm(`Bạn có chắc chắn muốn xoá khoản chi "${expense.category}" trị giá ${formatCurrency(expense.amount)}?`)) {
        deleteMutation.mutate(expense.id)
    }
}
</script>

<style scoped>
/* Header Styles */
.expenses-header {
    background: #ffffff;
    background: linear-gradient(165deg, #ffffff, rgba(255, 255, 255, 0.95));
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04);
    margin-bottom: 1.5rem;
    padding: 1.5rem;
}

.expenses-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.expenses-header__title-section {
    flex: 1;
    min-width: 0;
}

.expenses-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    justify-content: flex-end;
}

.page-title {
    font-weight: 700;
    color: var(--color-heading, #1e293b);
    margin-bottom: 0.25rem;
    font-size: 1.5rem;
    line-height: 1.3;
}

.page-subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted, #64748b);
    font-size: 0.9rem;
    line-height: 1.5;
}

/* Action Buttons */
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

/* Modal Styles */
.modal-content {
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);
    background: #ffffff;
}

.modal-header {
    border-bottom: 1px solid #e2e8f0;
    padding: 1.5rem;
}

.modal-title {
    font-weight: 700;
    color: #1e293b;
    font-size: 1.25rem;
}

.modal-body {
    padding: 1.5rem;
}

.modal-footer {
    border-top: 1px solid #e2e8f0;
    padding: 1.5rem;
}

.form-control,
.form-select {
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.form-control:focus,
.form-select:focus {
    border-color: #a855f7;
    box-shadow: 0 0 0 0.2rem rgba(168, 85, 247, 0.25);
}

.btn-primary {
    background: linear-gradient(135deg, #a855f7, #9333ea);
    border: none;
    border-radius: 12px;
    font-weight: 600;
}

.btn-primary:hover {
    background: linear-gradient(135deg, #9333ea, #7e22ce);
}

.btn-outline-secondary {
    border-radius: 12px;
    border-color: #e2e8f0;
}

.filter-card,
.table-card {
    border-radius: 18px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.filter-card .card-body {
    padding: 1.75rem;
}

.table-hover tbody tr:hover {
    background-color: #fdfaf7;
}

@media (max-width: 768px) {
    .expenses-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .expenses-header__actions {
        width: 100%;
        justify-content: flex-start;
    }

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
