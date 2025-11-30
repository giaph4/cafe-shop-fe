<template>
    <!-- Expense Modal -->
    <Teleport to="body">
        <div class="modal fade" id="expenseModal" tabindex="-1" ref="modalElement" aria-labelledby="expenseModalLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="expenseModalLabel">
                            {{ isEditing ? 'Cập nhật Chi phí' : 'Thêm mới Chi phí' }}
                        </h5>
                        <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
                    </div>

                    <Form @submit="handleSubmit" :validation-schema="expenseSchema" v-slot="{ errors }">
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="category" class="form-label">
                                    Hạng mục <span class="text-danger">*</span>
                                </label>
                                <Field 
                                    name="category" 
                                    type="text" 
                                    class="form-control"
                                    :class="{ 'is-invalid': errors.category }" 
                                    id="category"
                                    placeholder="VD: Tiền điện, Tiền nước, Lương..." 
                                    v-model="formData.category" 
                                />
                                <ErrorMessage name="category" class="invalid-feedback" />
                            </div>

                            <div class="mb-3">
                                <label for="amount" class="form-label">
                                    Số tiền (VND) <span class="text-danger">*</span>
                                </label>
                                <Field 
                                    name="amount" 
                                    type="number" 
                                    class="form-control"
                                    :class="{ 'is-invalid': errors.amount }" 
                                    id="amount" 
                                    placeholder="500000"
                                    v-model="formData.amount" 
                                />
                                <ErrorMessage name="amount" class="invalid-feedback" />
                            </div>

                            <div class="mb-3">
                                <label for="expenseDate" class="form-label">
                                    Ngày chi <span class="text-danger">*</span>
                                </label>
                                <Field 
                                    name="expenseDate" 
                                    type="date" 
                                    class="form-control"
                                    :class="{ 'is-invalid': errors.expenseDate }" 
                                    id="expenseDate"
                                    v-model="formData.expenseDate" 
                                />
                                <ErrorMessage name="expenseDate" class="invalid-feedback" />
                            </div>

                            <div class="mb-3">
                                <label for="description" class="form-label">Mô tả</label>
                                <Field 
                                    name="description" 
                                    as="textarea" 
                                    rows="3" 
                                    class="form-control" 
                                    id="description"
                                    placeholder="Mô tả chi tiết khoản chi..." 
                                    v-model="formData.description" 
                                />
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button 
                                type="button" 
                                class="btn btn-outline-secondary" 
                                @click="closeModal" 
                                :disabled="createMutation.isPending.value || updateMutation.isPending.value"
                            >
                                Hủy
                            </button>
                            <button 
                                type="submit" 
                                class="btn btn-primary"
                                :disabled="createMutation.isPending.value || updateMutation.isPending.value"
                            >
                                <span 
                                    v-if="createMutation.isPending.value || updateMutation.isPending.value"
                                    class="spinner-border spinner-border-sm me-2" 
                                    role="status" 
                                    aria-hidden="true"
                                ></span>
                                Lưu thay đổi
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
        <div class="modal fade" id="deleteExpenseModal" tabindex="-1" ref="deleteModalElement" aria-labelledby="deleteExpenseModalLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="deleteExpenseModalLabel">Xác nhận xóa</h5>
                        <button type="button" class="btn-close" @click="closeDeleteModal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>Bạn có chắc chắn muốn xóa khoản chi phí này không?</p>
                        <div v-if="expenseToDelete" class="card mt-3">
                            <div class="card-body">
                                <p class="mb-2"><strong>Hạng mục:</strong> {{ expenseToDelete.category }}</p>
                                <p class="mb-2"><strong>Số tiền:</strong> <span class="text-danger fw-bold">{{ formatCurrency(expenseToDelete.amount) }}</span></p>
                                <p class="mb-0"><strong>Ngày chi:</strong> {{ formatDate(expenseToDelete.expenseDate) }}</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" @click="closeDeleteModal">
                            Hủy
                        </button>
                        <button 
                            type="button" 
                            class="btn btn-danger" 
                            @click="confirmDelete"
                            :disabled="deleteMutation.isPending.value"
                        >
                            <span 
                                v-if="deleteMutation.isPending.value"
                                class="spinner-border spinner-border-sm me-2" 
                                role="status" 
                                aria-hidden="true"
                            ></span>
                            Xóa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>

    <div class="page-container container-fluid expenses-page">
        <div class="expenses-header">
            <div class="expenses-header__content">
                <div class="expenses-header__title-section">
                    <h2 class="expenses-header__title">Quản lý Chi phí</h2>
                    <p class="expenses-header__subtitle">Theo dõi và quản lý các khoản chi phí hoạt động của cửa hàng.</p>
                </div>
                <div class="expenses-header__actions">
                    <button 
                        class="btn btn-outline-secondary" 
                        type="button" 
                        @click="queryClient.invalidateQueries(['expenses'])" 
                        :disabled="isLoading"
                    >
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
                <LoadingState v-if="isLoading" />
                <ErrorState v-else-if="isError" :message="error?.message || 'Không thể tải dữ liệu'" @retry="queryClient.invalidateQueries(['expenses'])" />
                <template v-else-if="pageData && pageData.content">
                    <div v-if="filteredExpenses.length === 0" class="table-empty">
                        <EmptyState
                            title="Không tìm thấy chi phí"
                            :message="searchQuery ? 'Không có chi phí nào khớp với từ khóa tìm kiếm.' : 'Chưa có chi phí nào được ghi nhận.'"
                        />
                    </div>
                    <div v-else class="table-responsive">
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
                                            <button 
                                                class="btn btn-sm btn-outline-primary" 
                                                @click="openModal(expense)" 
                                                title="Chỉnh sửa"
                                            >
                                                <i class="bi bi-pencil me-1"></i>
                                                <span class="d-none d-md-inline">Sửa</span>
                                            </button>
                                            <button 
                                                class="btn btn-sm btn-outline-danger" 
                                                @click="openDeleteModal(expense)" 
                                                title="Xóa"
                                            >
                                                <i class="bi bi-trash me-1"></i>
                                                <span class="d-none d-md-inline">Xóa</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </template>
            </div>

            <div v-if="pageData && pageData.content && filteredExpenses.length > 0" class="card-footer d-flex justify-content-end">
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
import { Teleport } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { Modal } from 'bootstrap'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { toast } from 'vue3-toastify'
import { getExpenses, createExpense, updateExpense, deleteExpense } from '@/api/expenseService'
import Pagination from '@/components/common/Pagination.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { formatCurrency, formatDate } from '@/utils/formatters.js'
import { PaginationMode, usePagination } from '@/composables/usePagination'

const queryClient = useQueryClient()

const searchQuery = ref('')
const startDate = ref('')
const endDate = ref('')

const modalElement = ref(null)
const bsModal = ref(null)
const deleteModalElement = ref(null)
const deleteBsModal = ref(null)
const expenseToDelete = ref(null)
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
        toast.success('Xóa chi phí thành công!')
        queryClient.invalidateQueries(['expenses'])
        closeDeleteModal()
    },
    onError: (err) => {
        toast.error(err.response?.data?.message || 'Không thể xóa chi phí.')
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
    if (deleteModalElement.value) {
        deleteBsModal.value = new Modal(deleteModalElement.value)
    }
})

onUnmounted(() => {
    bsModal.value?.dispose()
    deleteBsModal.value?.dispose()
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

const openDeleteModal = (expense) => {
    expenseToDelete.value = expense
    deleteBsModal.value?.show()
}

const closeDeleteModal = () => {
    expenseToDelete.value = null
    deleteBsModal.value?.hide()
}

const confirmDelete = () => {
    if (expenseToDelete.value) {
        deleteMutation.mutate(expenseToDelete.value.id)
        closeDeleteModal()
    }
}
</script>

<style scoped lang="scss">
.expenses-page {
    padding-bottom: var(--spacing-12);
}

.expenses-header {
    padding: var(--spacing-6);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-md);
    margin-bottom: var(--spacing-6);
}

.expenses-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-6);
    flex-wrap: wrap;
}

.expenses-header__title-section {
    flex: 1;
    min-width: 0;
}

.expenses-header__title {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-tight);
    margin-bottom: var(--spacing-1);
}

.expenses-header__subtitle {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
}

.expenses-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-3);
    align-items: center;
    justify-content: flex-end;
}

.action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    justify-content: flex-end;
    align-items: center;
}

.table-empty {
    padding: var(--spacing-8) var(--spacing-4);
}

@media (max-width: 768px) {
    .expenses-header {
        padding: var(--spacing-4);
    }

    .expenses-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .expenses-header__actions {
        width: 100%;
        justify-content: stretch;

        .btn {
            flex: 1;
        }
    }

    .action-buttons {
        flex-direction: column;
        width: 100%;

        .btn {
            width: 100%;
        }
    }
}
</style>
