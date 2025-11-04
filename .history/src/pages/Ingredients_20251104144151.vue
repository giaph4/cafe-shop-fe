<template>
    <div class="modal fade" id="ingredientModal" tabindex="-1" ref="modalElement">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">{{ isEditing ? 'Cập nhật Nguyên liệu' : 'Tạo mới Nguyên liệu' }}</h5>
                    <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
                </div>

                <Form @submit="handleSubmit" :validation-schema="ingredientSchema" v-slot="{ errors }">
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label fw-bold">Tên Nguyên liệu <span class="text-danger">*</span></label>
                            <Field name="name" type="text" class="form-control" :class="{ 'is-invalid': errors.name }"
                                v-model="formData.name" />
                            <ErrorMessage name="name" class="invalid-feedback" />
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label fw-bold">Đơn vị <span class="text-danger">*</span></label>
                                <Field name="unit" type="text" class="form-control" placeholder="ví dụ: kg, lít, cái"
                                    :class="{ 'is-invalid': errors.unit }" v-model="formData.unit" />
                                <ErrorMessage name="unit" class="invalid-feedback" />
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label fw-bold">Mức đặt lại <span class="text-danger">*</span></label>
                                <Field name="reorderLevel" type="number" step="0.01" class="form-control"
                                    :class="{ 'is-invalid': errors.reorderLevel }" v-model="formData.reorderLevel" />
                                <ErrorMessage name="reorderLevel" class="invalid-feedback" />
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

    <div class="modal fade" id="adjustModal" tabindex="-1" ref="adjustModalElement">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Điều chỉnh Tồn kho</h5>
                    <button type="button" class="btn-close" @click="closeAdjustModal" aria-label="Close"></button>
                </div>

                <Form @submit="handleAdjustSubmit" :validation-schema="adjustSchema" v-slot="{ errors }">
                    <div class="modal-body">
                        <h6 class="mb-3">Nguyên liệu: <span class="text-primary">{{ adjustData.name }}</span></h6>
                        <p>Số lượng tồn kho hiện tại: <span class="fw-bold">{{ adjustData.currentStock }}</span></p>

                        <div class="mb-3">
                            <label class="form-label fw-bold">Số lượng tồn MỚI <span
                                    class="text-danger">*</span></label>
                            <Field name="newQuantityOnHand" type="number" step="0.01" class="form-control"
                                placeholder="Nhập tổng số lượng tồn kho mới"
                                :class="{ 'is-invalid': errors.newQuantityOnHand }"
                                v-model="adjustData.newQuantityOnHand" />
                            <ErrorMessage name="newQuantityOnHand" class="invalid-feedback" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">Lý do <span class="text-danger">*</span></label>
                            <Field name="reason" as="textarea" rows="3" class="form-control"
                                placeholder="ví dụ: Hỏng, Kiểm kho,..." :class="{ 'is-invalid': errors.reason }"
                                v-model="adjustData.reason" />
                            <ErrorMessage name="reason" class="invalid-feedback" />
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="closeAdjustModal">Huỷ</button>
                        <button type="submit" class="btn btn-primary" :disabled="adjustMutation.isPending.value">
                            Xác nhận
                        </button>
                    </div>
                </Form>
            </div>
        </div>
    </div>


    <div data-aos="fade-up">
        <div class="page-header d-flex justify-content-between align-items-center mb-4">
            <h2 class="page-title">Quản lý Nguyên liệu</h2>
            <button class="btn btn-primary" @click="openModal()">
                <i class="bi bi-plus-lg me-2"></i> Thêm mới
            </button>
        </div>

        <div class="card mb-4">
            <div class="card-body">
                <div class="input-group" style="max-width: 400px;">
                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                    <input type="text" class="form-control" placeholder="Tìm kiếm theo tên nguyên liệu..."
                        v-model="searchQuery">
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
                                <th scope="col" @click="handleSort('name')" class="sortable">
                                    Tên Nguyên liệu
                                    <i :class="getSortIcon('name')"></i>
                                </th>
                                <th scope="col">Đơn vị</th>
                                <th scope="col" @click="handleSort('quantityInStock')" class="sortable">
                                    Tồn kho
                                    <i :class="getSortIcon('quantityInStock')"></i>
                                </th>
                                <th scope="col" @click="handleSort('reorderLevel')" class="sortable">
                                    Mức đặt lại
                                    <i :class="getSortIcon('reorderLevel')"></i>
                                </th>
                                <th scope="col" class="text-end">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="ingredient in data.content" :key="ingredient.id">
                                <td class="fw-bold">{{ ingredient.name }}</td>
                                <td>{{ ingredient.unit }}</td>
                                <td>
                                    <span class="badge"
                                        :class="ingredient.quantityInStock <= ingredient.reorderLevel ? 'bg-danger-muted' : 'bg-light text-dark'">
                                        {{ ingredient.quantityInStock }}
                                    </span>
                                </td>
                                <td>{{ ingredient.reorderLevel }}</td>
                                <td class="text-end">
                                    <button class="btn btn-sm btn-info me-2" @click="openAdjustModal(ingredient)">
                                        <i class="bi bi-gear-fill"></i> Điều chỉnh
                                    </button>
                                    <button class="btn btn-sm btn-outline-primary me-2" @click="openModal(ingredient)">
                                        <i class="bi bi-pencil-fill"></i> Sửa
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" @click="handleDelete(ingredient)">
                                        <i class="bi bi-trash-fill"></i> Xoá
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="data.content.length === 0">
                                <td colspan="5" class="text-center text-muted">Không tìm thấy nguyên liệu nào.</td>
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
import { ref, onMounted, onUnmounted, reactive, watch } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { Modal } from 'bootstrap'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { toast } from 'vue3-toastify'
import { getIngredients, createIngredient, updateIngredient, deleteIngredient, adjustInventory } from '@/api/ingredientService'
import Pagination from '@/components/Pagination.vue'

const queryClient = useQueryClient()
const currentPage = ref(1)
const searchQuery = ref('')
const debouncedSearch = ref('')
let searchTimeout = null

const sortState = reactive({
    key: 'name',
    direction: 'asc'
})

const modalElement = ref(null)
const bsModal = ref(null)
const isEditing = ref(false)
const formData = reactive({ id: null, name: '', unit: '', reorderLevel: 0 })

const adjustModalElement = ref(null)
const bsAdjustModal = ref(null)
const adjustData = reactive({
    ingredientId: null,
    name: '',
    currentStock: 0,
    newQuantityOnHand: null,
    reason: ''
})

const ingredientSchema = yup.object({
    name: yup.string().required('Tên là bắt buộc'),
    unit: yup.string().required('Đơn vị là bắt buộc'),
    reorderLevel: yup.number().required('Mức đặt lại là bắt buộc').min(0, 'Không thể là số âm'),
})

const adjustSchema = yup.object({
    newQuantityOnHand: yup.number()
        .required('Số lượng mới là bắt buộc')
        .min(0, 'Số lượng không thể âm'),
    reason: yup.string().required('Lý do là bắt buộc'),
})

watch(searchQuery, (newVal) => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        debouncedSearch.value = newVal
        currentPage.value = 1
    }, 300)
})

const { data, isLoading, isError, error } = useQuery({
    queryKey: ['ingredients', currentPage, debouncedSearch, sortState],
    queryFn: () => {
        const sortString = `${sortState.key},${sortState.direction}`
        return getIngredients(currentPage.value - 1, 10, debouncedSearch.value, sortString)
    },
    keepPreviousData: true,
})

const createMutation = useMutation({
    mutationFn: createIngredient,
    onSuccess: () => {
        toast.success('Tạo nguyên liệu thành công!')
        queryClient.invalidateQueries(['ingredients'])
        closeModal()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi!')
})

const updateMutation = useMutation({
    mutationFn: updateIngredient,
    onSuccess: () => {
        toast.success('Cập nhật nguyên liệu thành công!')
        queryClient.invalidateQueries(['ingredients'])
        closeModal()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi!')
})

const deleteMutation = useMutation({
    mutationFn: deleteIngredient,
    onSuccess: () => {
        toast.success('Xoá nguyên liệu thành công!')
        queryClient.invalidateQueries(['ingredients'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Không thể xoá!')
})

const adjustMutation = useMutation({
    mutationFn: adjustInventory,
    onSuccess: () => {
        toast.success('Điều chỉnh tồn kho thành công!')
        queryClient.invalidateQueries(['ingredients'])
        closeAdjustModal()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi!')
})

onMounted(() => {
    if (modalElement.value) bsModal.value = new Modal(modalElement.value)
    if (adjustModalElement.value) bsAdjustModal.value = new Modal(adjustModalElement.value)
})

onUnmounted(() => {
    bsModal.value?.dispose()
    bsAdjustModal.value?.dispose()
})

const openModal = (ingredient = null) => {
    if (ingredient) {
        isEditing.value = true
        formData.id = ingredient.id
        formData.name = ingredient.name
        formData.unit = ingredient.unit
        formData.reorderLevel = ingredient.reorderLevel
    } else {
        isEditing.value = false
        formData.id = null
        formData.name = ''
        formData.unit = ''
        formData.reorderLevel = 0
    }
    bsModal.value?.show()
}
const closeModal = () => bsModal.value?.hide()

const openAdjustModal = (ingredient) => {
    adjustData.ingredientId = ingredient.id
    adjustData.name = ingredient.name
    adjustData.currentStock = ingredient.quantityInStock
    adjustData.newQuantityOnHand = ingredient.quantityInStock
    adjustData.reason = ''
    bsAdjustModal.value?.show()
}
const closeAdjustModal = () => bsAdjustModal.value?.hide()

const handleSubmit = () => {
    const data = {
        name: formData.name,
        unit: formData.unit,
        reorderLevel: formData.reorderLevel
    }
    if (isEditing.value) {
        updateMutation.mutate({ id: formData.id, data })
    } else {
        createMutation.mutate(data)
    }
}

const handleAdjustSubmit = (values) => {
    adjustMutation.mutate({
        ingredientId: adjustData.ingredientId,
        newQuantityOnHand: values.newQuantityOnHand,
        reason: values.reason
    })
}

const handleDelete = (ingredient) => {
    if (confirm(`Bạn có chắc chắn muốn xoá "${ingredient.name}"?`)) {
        deleteMutation.mutate(ingredient.id)
    }
}

const handlePageChange = (page) => {
    currentPage.value = page
}

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

.bg-danger-muted {
    background-color: #f8d7da !important;
    color: #C14A45 !important;
    font-weight: 600;
}

.btn-info {
    background-color: #E9CDA7;
    border-color: #E9CDA7;
    color: #3B2F2F;
}

.sortable {
    cursor: pointer;
    user-select: none;
}

.sortable:hover {
    background-color: #f8f9fa;
}

.sortable i {
    margin-left: 5px;
    color: #999;
}

.sortable:hover i {
    color: #333;
}
</style>
```eof

---

### 📋 Báo cáo và Bước tiếp theo

Như vậy, chúng ta đã sửa xong 2 trang quan trọng:
1. **Trang Bàn:** Đã hỗ trợ 5 trạng thái (`EMPTY`, `AVAILABLE`...) và thêm sắp xếp.
2. **Trang Nguyên liệu:** Đã fix lỗi 400 (bằng cách gửi `newQuantityOnHand`), fix lỗi hiển thị "Tồn kho" (bằng cách dùng
`quantityInStock`), và thêm sắp xếp (server-side).

Sau khi bạn xác nhận các chức năng này hoạt động ổn định, chúng ta sẽ làm bước tiếp theo.

**Bước 7 (Tiếp theo): Xây dựng trang Quản lý Nhà cung cấp (Supplier Management) - (API 30 đến 34).**

Đây là một trang CRUD cơ bản (Tạo, Sửa, Xoá, Hiển thị danh sách) giống như trang Quản lý Danh mục.