<template>
    <div class="modal fade" id="categoryModal" tabindex="-1" ref="modalElement">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">{{ isEditing ? 'Cập nhật Danh mục' : 'Tạo mới Danh mục' }}</h5>
                    <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
                </div>

                <Form @submit="handleSubmit" :validation-schema="categorySchema" v-slot="{ errors }">
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="name" class="form-label fw-bold">Tên Danh mục <span
                                    class="text-danger">*</span></label>
                            <Field name="name" type="text" class="form-control" :class="{ 'is-invalid': errors.name }"
                                id="name" placeholder="Cà phê Việt Nam" v-model="formData.name" />
                            <ErrorMessage name="name" class="invalid-feedback" />
                        </div>

                        <div class="mb-3">
                            <label for="description" class="form-label fw-bold">Mô tả</label>
                            <Field name="description" as="textarea" rows="3" class="form-control" id="description"
                                placeholder="Mô tả ngắn gọn về danh mục..." v-model="formData.description" />
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
            <h2 class="page-title">Quản lý Danh mục</h2>
            <button class="btn btn-primary" @click="openModal()">
                <i class="bi bi-plus-lg me-2"></i> Thêm mới
            </button>
        </div>

        <div class="card mb-4">
            <div class="card-body d-flex justify-content-between">
                <div class="input-group" style="max-width: 400px;">
                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                    <input type="text" class="form-control" placeholder="Tìm kiếm theo tên danh mục..."
                        v-model="searchQuery">
                </div>
            </div>
        </div>

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

                <div v-else-if="categories" class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th scope="col">ID</th>
                                <th scope="col">Tên Danh mục</th>
                                <th scope="col">Mô tả</th>
                                <th scope="col">Số sản phẩm</th>
                                <th scope="col" class="text-end">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="category in filteredCategories" :key="category.id">
                                <th scope="row">{{ category.id }}</th>
                                <td class="fw-bold">{{ category.name }}</td>
                                <td>{{ category.description || 'N/A' }}</td>
                                <td>
                                    <span class="badge bg-light text-dark">{{ category.productCount }}</span>
                                </td>
                                <td class="text-end">
                                    <button class="btn btn-sm btn-outline-primary me-2" @click="openModal(category)">
                                        <i class="bi bi-pencil-fill"></i> Sửa
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" @click="handleDelete(category)">
                                        <i class="bi bi-trash-fill"></i> Xoá
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="filteredCategories.length === 0">
                                <td colspan="5" class="text-center text-muted">Không tìm thấy danh mục nào.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, reactive } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { Modal } from 'bootstrap' // Import Bootstrap JS
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { toast } from 'vue3-toastify'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/categoryService'

// === Quản lý State ===
const queryClient = useQueryClient()
const modalElement = ref(null) // DOM element của modal
const bsModal = ref(null)      // Instance của Bootstrap modal
const isEditing = ref(false)
const searchQuery = ref('')
const formData = reactive({
    id: null,
    name: '',
    description: ''
})

// === Cấu hình VeeValidate ===
const categorySchema = yup.object({
    name: yup.string().required('Tên danh mục là bắt buộc').max(100, 'Tên quá dài!'),
    description: yup.string().max(255, 'Mô tả quá dài!')
})

// === Vue Query: Lấy dữ liệu (API 4) ===
const { data: categories, isLoading, isError, error } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
})

// === Vue Query: Tạo mới (API 3) ===
const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
        toast.success('Tạo danh mục mới thành công!')
        queryClient.invalidateQueries(['categories']) // Tải lại danh sách
        closeModal()
    },
    onError: (err) => {
        toast.error(err.response?.data?.message || 'Không thể tạo danh mục.')
    }
})

// === Vue Query: Cập nhật (API 5) ===
const updateMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
        toast.success('Cập nhật danh mục thành công!')
        queryClient.invalidateQueries(['categories']) // Tải lại danh sách
        closeModal()
    },
    onError: (err) => {
        toast.error(err.response?.data?.message || 'Không thể cập nhật danh mục.')
    }
})

// === Vue Query: Xoá (API 6) ===
const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
        toast.success('Xoá danh mục thành công!')
        queryClient.invalidateQueries(['categories']) // Tải lại danh sách
    },
    onError: (err) => {
        // Đây là phần bắt lỗi từ backend (ví dụ: không cho xoá khi có sản phẩm)
        toast.error(err.response?.data?.message || 'Không thể xoá danh mục.')
    }
})

// === Logic Tìm kiếm (Client-side) ===
const filteredCategories = computed(() => {
    if (!categories.value) return []
    if (!searchQuery.value) return categories.value

    const lowerCaseQuery = searchQuery.value.toLowerCase()
    return categories.value.filter(
        category => category.name.toLowerCase().includes(lowerCaseQuery)
    )
})

// === Xử lý Modal (Bootstrap JS) ===
onMounted(() => {
    // Đảm bảo JS của Bootstrap đã được tải (từ main.js)
    // và khởi tạo modal
    if (modalElement.value) {
        bsModal.value = new Modal(modalElement.value)
    }
})
onUnmounted(() => {
    bsModal.value?.dispose()
})

const openModal = (category = null) => {
    if (category) {
        // Sửa
        isEditing.value = true
        formData.id = category.id
        formData.name = category.name
        formData.description = category.description
    } else {
        // Tạo mới
        isEditing.value = false
        formData.id = null
        formData.name = ''
        formData.description = ''
    }
    bsModal.value?.show()
}

const closeModal = () => {
    bsModal.value?.hide()
}

// === Xử lý Form ===
const handleSubmit = () => {
    if (isEditing.value) {
        // Chạy mutation Cập nhật
        updateMutation.mutate({
            id: formData.id,
            data: { name: formData.name, description: formData.description }
        })
    } else {
        // Chạy mutation Tạo mới
        createMutation.mutate({
            name: formData.name,
            description: formData.description
        })
    }
}

const handleDelete = (category) => {
    if (confirm(`Bạn có chắc chắn muốn xoá danh mục "${category.name}"?`)) {
        deleteMutation.mutate(category.id)
    }
}
</script>

<style scoped>
.page-title {
    color: #A36B4A;
}

.table-hover tbody tr:hover {
    background-color: #fdfaf7;
}
</style>