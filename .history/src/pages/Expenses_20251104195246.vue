<template>
    <div class="modal fade" id="expenseModal" tabindex="-1" ref="modalElement">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">{{ isEditing ? 'Cập nhật Chi phí' : 'Tạo mới Chi phí' }}</h5>
                    <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
                </div>

                <Form @submit="handleSubmit" :validation-schema="expenseSchema" v-slot="{ errors }">
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label fw-bold">Mô tả <span class="text-danger">*</span></label>
                            <Field name="description" as="textarea" rows="3" class="form-control"
                                :class="{ 'is-invalid': errors.description }" v-model="formData.description"
                                placeholder="ví dụ: Tiền điện tháng 10" />
                            <ErrorMessage name="description" class="invalid-feedback" />
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label fw-bold">Số tiền (VND) <span
                                        class="text-danger">*</span></label>
                                <Field name="amount" type="number" class="form-control"
                                    :class="{ 'is-invalid': errors.amount }" v-model="formData.amount" />
                                <ErrorMessage name="amount" class="invalid-feedback" />
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label fw-bold">Ngày chi <span class="text-danger">*</span></label>
                                <Field name="expenseDate" type="date" class="form-control"
                                    :class="{ 'is-invalid': errors.expenseDate }" v-model="formData.expenseDate" />
                                <ErrorMessage name="expenseDate" class="invalid-feedback" />
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="closeModal">Huỷ</button>
                        <button type="submit" class="btn btn-primary"
                            :disabled="createMutation.isPending.value || updateMutation.isPending.value">
                            Lưu
                        </button>
                    </div>
                </Form>
            </div>
        </div>
    </div>

    <div data-aos="fade-up">
        <div class="page-header d-flex justify-content-between align-items-center mb-4">
            <h2 class="page-title">Quản lý Chi phí</h2>
            <button class="btn btn-primary" @click="openModal()">
                <i class="bi bi-plus-lg me-2"></i> Thêm chi phí
            </button>
        </div>

        <div class="card mb-4">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-4">
                        <label class="form-label">Từ ngày</label>
                        <input type="date" class="form-control" v-model="filters.startDate" />
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Đến ngày</label>
                        <input type="date" class="form-control" v-model="filters.endDate" />
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-body">

                <div v-if="isLoading" class="text-center my-5">
                    <div class="spinner-border text-primary" role="status"></div>
                </div>
                <div v-else-if="isError" class="alert alert-danger">
                    Không thể tải dữ liệu: {{ error.message }}
                </div>

                <div v-else-if="data" class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th scope="col">Ngày chi</th>
                                <th scope="col">Mô tả</th>
                                <th scope="col" class="text-end">Số tiền</th>
                                <th scope="col" class="text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="expense in data.content" :key="expense.id">
                                <td>{{ new Date(expense.expenseDate).toLocaleDateString('vi-VN') }}</td>
                                <td class="text-wrap">{{ expense.description }}</td>
                                <td class="text-end fw-bold text-danger">{{ formatMoney(expense.amount) }}</td>
                                <td class="text-center">
                                    <button class="btn btn-sm btn-outline-primary me-2" @click="openModal(expense)">
                                        <i class="bi bi-pencil-fill"></i> Sửa
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" @click="handleDelete(expense)">
                                        <i class="bi bi-trash-fill"></i> Xoá
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="data.content.length === 0">
                                <td colspan="4" class="text-center text-muted">Không tìm thấy chi phí nào.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div v-if="data && data.totalPages > 1" class="mt-4">
                    <Pagination :current-page="currentPage" :total-pages="data.totalPages"
                        @page-change="handlePageChange" />
                </div>
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
import { formatMoney } from '@/utils/formatMoney.js'

const queryClient = useQueryClient()
const currentPage = ref(1)
const modalElement = ref(null)
const bsModal = ref(null)
const isEditing = ref(false)

// Hàm tiện ích để format Date object sang YYYY-MM-DD
const formatDateToInput = (date) => {
    if (!date) return new Date().toISOString().split('T')[0]
    // Tạo date mới để tránh lỗi timezone khi .split('T')
    const d = new Date(date)
    const year = d.getFullYear()
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
}

const initialFormData = {
    id: null,
    description: '',
    amount: 0,
    expenseDate: formatDateToInput(new Date()), // Mặc định là hôm nay
}
const formData = reactive({ ...initialFormData })

const filters = reactive({
    startDate: '',
    endDate: ''
})

const expenseSchema = yup.object({
    description: yup.string().required('Mô tả là bắt buộc'),
    amount: yup.number().required('Số tiền là bắt buộc').min(1, 'Số tiền phải lớn hơn 0'),
    expenseDate: yup.date().required('Ngày chi là bắt buộc'),
})

const { data, isLoading, isError, error } = useQuery({
    queryKey: ['expenses', currentPage, filters],
    queryFn: () => getExpenses({
        page: currentPage.value - 1,
        size: 10,
        ...filters
    }),
    keepPreviousData: true,
})

watch(filters, () => {
    currentPage.value = 1
})

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
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi!')
})

onMounted(() => {
    if (modalElement.value) {
        bsModal.value = new Modal(modalElement.value)
    }
})
onUnmounted(() => {
    bsModal.value?.dispose()
})

const openModal = (expense = null) => {
    if (expense) {
        isEditing.value = true
        formData.id = expense.id
        formData.description = expense.description
        formData.amount = expense.amount
        // API trả về mảng [YYYY, MM, DD] hoặc 1 chuỗi,
        // formatDateToInput sẽ xử lý cả 2 trường hợp
        formData.expenseDate = formatDateToInput(expense.expenseDate)
    } else {
        isEditing.value = false
        Object.assign(formData, initialFormData)
        formData.expenseDate = formatDateToInput(new Date()) // Đặt lại ngày hôm nay
    }
    bsModal.value?.show()
}
const closeModal = () => bsModal.value?.hide()


const handleSubmit = (values) => {
    const payload = {
        description: values.description,
        amount: values.amount,
        expenseDate: formatDateToInput(values.expenseDate)
    }

    if (isEditing.value) {
        updateMutation.mutate({ id: formData.id, data: payload })
    } else {
        createMutation.mutate(payload)
    }
}

const handleDelete = (expense) => {
    if (confirm(`Bạn có chắc chắn muốn xoá chi phí "${expense.description}"?`)) {
        deleteMutation.mutate(expense.id)
    }
}

const handlePageChange = (page) => {
    currentPage.value = page
}
</script>

<style scoped>
.page-title {
    color: #A36B4A;
}
</style>