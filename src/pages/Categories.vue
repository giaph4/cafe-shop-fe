<template>
    <div class="modal fade" id="categoryModal" tabindex="-1" ref="modalElement">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <div>
                        <h5 class="modal-title">{{ isEditing ? 'Cập nhật Danh mục' : 'Tạo mới Danh mục' }}</h5>
                        <p class="mb-0 text-muted small">Điền đầy đủ thông tin theo quy định backend.</p>
                    </div>
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
                        <button type="button" class="btn btn-outline-secondary" @click="closeModal">Hủy</button>
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
        <div class="categories-header">
            <div class="categories-header__content">
                <div class="categories-header__title-section">
                    <h2 class="categories-header__title">Quản lý Danh mục</h2>
                    <p class="categories-header__subtitle">Quản lý các danh mục sản phẩm trong hệ thống</p>
                </div>
                <div class="categories-header__actions">
                    <button class="btn btn-primary btn-sm" @click="openModal()">
                        <i class="bi bi-plus-lg me-2"></i> Thêm mới
                    </button>
                </div>
            </div>
        </div>

        <div class="card filter-card mb-4">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-lg-4 col-md-6">
                        <label class="form-label">Tìm kiếm</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="bi bi-search"></i></span>
                            <input
                                type="text"
                                class="form-control"
                                placeholder="Tìm kiếm theo tên danh mục..."
                                v-model="searchQuery"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card tabs-card">
            <div class="card-body">
                <div v-if="isLoading" class="state-block py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                </div>

                <div v-else-if="isError" class="state-block py-5">
                    <div class="alert alert-danger mb-0">
                        Không thể tải dữ liệu: {{ errorMessage }}
                    </div>
                </div>

                <div v-else-if="categories" class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th scope="col">ID</th>
                                <th scope="col">Tên Danh mục</th>
                                <th scope="col">Mô tả</th>
                                <th scope="col" class="text-end">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="category in filteredCategories" :key="category.id">
                                <th scope="row">{{ category.id }}</th>
                                <td class="fw-bold">{{ category.name }}</td>
                                <td>{{ category.description || 'N/A' }}</td>
                                <td class="text-end">
                                    <div class="action-buttons">
                                        <button class="action-button" @click="openModal(category)">
                                            <i class="bi bi-pencil"></i>
                                            <span>Chỉnh sửa</span>
                                        </button>
                                        <button class="action-button action-button--danger" @click="handleDelete(category)">
                                            <i class="bi bi-trash"></i>
                                            <span>Xóa</span>
                                        </button>
                                    </div>
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
import { Modal } from 'bootstrap'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { toast } from 'vue3-toastify'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/categoryService'
import { useErrorHandler } from '@/composables/useErrorHandler'

const { extractErrorMessage } = useErrorHandler()

const queryClient = useQueryClient()
const modalElement = ref(null) 
const bsModal = ref(null)    
const isEditing = ref(false)
const searchQuery = ref('')
const formData = reactive({
    id: null,
    name: '',
    description: ''
})

const categorySchema = yup.object({
    name: yup.string().required('Tên danh mục là bắt buộc').max(100, 'Tên quá dài!'),
    description: yup.string().max(255, 'Mô tả quá dài!')
})
const { data: categories, isLoading, isError, error } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
})

const errorMessage = computed(() => {
    if (!error.value) return ''
    return extractErrorMessage(error.value)
})

const createMutation = useMutation({
    mutationFn: (payload) => createCategory(payload),
    onSuccess: () => {
        toast.success('Tạo danh mục mới thành công!')
        queryClient.invalidateQueries(['categories'])
        closeModal()
    },
    onError: (err) => {
        const message = extractErrorMessage(err) || 'Không thể tạo danh mục.'
        toast.error(message)
    }
})

const updateMutation = useMutation({
    mutationFn: ({id, ...payload}) => updateCategory(id, payload),
    onSuccess: () => {
        toast.success('Cập nhật danh mục thành công!')
        queryClient.invalidateQueries(['categories']) 
        closeModal()
    },
    onError: (err) => {
        const message = extractErrorMessage(err) || 'Không thể cập nhật danh mục.'
        toast.error(message)
    }
})

const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
        toast.success('Xoá danh mục thành công!')
        queryClient.invalidateQueries(['categories'])
    },
    onError: (err) => {
        const message = extractErrorMessage(err) || 'Không thể xoá danh mục.'
        toast.error(message)
    }
})

const filteredCategories = computed(() => {
    if (!categories.value) return []
    if (!searchQuery.value) return categories.value

    const lowerCaseQuery = searchQuery.value.toLowerCase()
    return categories.value.filter(
        category => category.name.toLowerCase().includes(lowerCaseQuery)
    )
})


onMounted(() => {
    if (modalElement.value) {
        bsModal.value = new Modal(modalElement.value)
    }
})
onUnmounted(() => {
    bsModal.value?.dispose()
})

const openModal = (category = null) => {
    if (category) {
        isEditing.value = true
        formData.id = category.id
        formData.name = category.name
        formData.description = category.description
    } else {
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

const handleSubmit = () => {
    if (isEditing.value) {
        updateMutation.mutate({
            id: formData.id,
            name: formData.name,
            description: formData.description
        })
    } else {
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
.categories-header {
    padding: 1.5rem;
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    background: linear-gradient(165deg, #ffffff, rgba(255, 255, 255, 0.95));
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04);
    margin-bottom: 1.5rem;
}

.categories-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
}

.categories-header__title-section {
    flex: 1;
    min-width: 0;
}

.categories-header__title {
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.25rem;
    font-size: 1.5rem;
    line-height: 1.3;
}

.categories-header__subtitle {
    margin-bottom: 0;
    color: #64748b;
    font-size: 0.9rem;
    line-height: 1.5;
}

.categories-header__actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: flex-end;
}

/* Page-specific styles only */
.table-hover tbody tr:hover {
    background-color: #fdfaf7;
}

:deep(.modal-content) {
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    box-shadow: 0 10px 40px rgba(15, 23, 42, 0.15);
}

:deep(.modal-header) {
    border-bottom: 1px solid #e2e8f0;
    padding: 1.5rem;
    background: #ffffff;
}

:deep(.modal-header .modal-title) {
    font-weight: 700;
    color: #1e293b;
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
}

:deep(.modal-header .text-muted.small) {
    color: #64748b;
    font-size: 0.875rem;
}

:deep(.modal-body) {
    padding: 1.5rem;
}

:deep(.modal-footer) {
    border-top: 1px solid #e2e8f0;
    padding: 1rem 1.5rem;
    background: #ffffff;
}

.action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: flex-end;
}

.action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: 1px solid rgba(168, 85, 247, 0.3);
    background: #ffffff;
    color: #a855f7;
    font-size: 0.875rem;
    font-weight: 600;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.action-button:hover:not(:disabled) {
    background: rgba(168, 85, 247, 0.05);
    border-color: rgba(168, 85, 247, 0.5);
    transform: translateY(-1px);
}

.action-button:disabled {
    opacity: 0.65;
    pointer-events: none;
}

.action-button--danger {
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
}

.action-button--danger:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.5);
}

@media (max-width: 768px) {
    .categories-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .categories-header__actions {
        width: 100%;
        justify-content: flex-start;
    }

    .action-buttons {
        flex-direction: column;
        width: 100%;
    }

    .action-button {
        width: 100%;
    }
}
</style>