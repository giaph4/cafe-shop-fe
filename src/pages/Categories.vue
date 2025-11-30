<template>
    <Teleport to="body">
        <div class="modal fade" id="categoryModal" tabindex="-1" ref="modalElement">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title">{{ isEditing ? 'Cập nhật Danh mục' : 'Tạo mới Danh mục' }}</h5>
                            <p class="mb-0 text-muted small">Điền đầy đủ thông tin theo quy định backend.</p>
                        </div>
                        <button type="button" class="btn-close" @click="closeModal" :disabled="createMutation.isPending.value || updateMutation.isPending.value" aria-label="Close"></button>
                    </div>

                    <Form @submit="handleSubmit" :validation-schema="categorySchema" v-slot="{ errors }">
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="name" class="form-label fw-semibold">Tên Danh mục <span class="text-danger">*</span></label>
                                <Field
                                    name="name"
                                    type="text"
                                    class="form-control"
                                    :class="{ 'is-invalid': errors.name }"
                                    id="name"
                                    placeholder="Cà phê Việt Nam"
                                    v-model="formData.name"
                                    :disabled="createMutation.isPending.value || updateMutation.isPending.value"
                                />
                                <ErrorMessage name="name" class="invalid-feedback" />
                            </div>

                            <div class="mb-3">
                                <label for="description" class="form-label fw-semibold">Mô tả</label>
                                <Field
                                    name="description"
                                    as="textarea"
                                    rows="3"
                                    class="form-control"
                                    id="description"
                                    placeholder="Mô tả ngắn gọn về danh mục..."
                                    v-model="formData.description"
                                    :disabled="createMutation.isPending.value || updateMutation.isPending.value"
                                />
                                <ErrorMessage name="description" class="invalid-feedback" />
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
                                {{ isEditing ? 'Cập nhật' : 'Tạo mới' }}
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>

        <div class="modal fade" id="deleteCategoryModal" tabindex="-1" ref="deleteModalElement">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title">Xóa danh mục</h5>
                            <p class="mb-0 text-muted small">Hành động này không thể hoàn tác.</p>
                        </div>
                        <button type="button" class="btn-close" @click="closeDeleteModal" :disabled="deleteMutation.isPending.value" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p class="mb-3">Bạn có chắc chắn muốn xóa danh mục này không?</p>
                        <div class="card bg-light">
                            <div class="card-body">
                                <div class="mb-2">
                                    <strong class="text-muted d-block mb-1">Tên danh mục:</strong>
                                    <span>{{ deleteTarget?.name || '—' }}</span>
                                </div>
                                <div class="mb-0" v-if="deleteTarget?.description">
                                    <strong class="text-muted d-block mb-1">Mô tả:</strong>
                                    <span>{{ deleteTarget.description }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button
                            type="button"
                            class="btn btn-outline-secondary"
                            @click="closeDeleteModal"
                            :disabled="deleteMutation.isPending.value"
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            class="btn btn-danger"
                            @click="confirmDelete"
                            :disabled="deleteMutation.isPending.value"
                        >
                            <span v-if="deleteMutation.isPending.value" class="spinner-border spinner-border-sm me-2"></span>
                            Xóa danh mục
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>

    <div class="page-container container-fluid">
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
                <LoadingState v-if="isLoading" />
                <ErrorState
                    v-else-if="isError"
                    :message="errorMessage || 'Không thể tải dữ liệu danh mục.'"
                    :show-retry="true"
                    :retry-handler="() => queryClient.invalidateQueries(['categories'])"
                />
                <template v-else>
                    <EmptyState
                        v-if="!filteredCategories.length"
                        title="Không tìm thấy danh mục"
                        :message="searchQuery ? 'Không tìm thấy danh mục nào phù hợp với từ khóa tìm kiếm.' : 'Chưa có danh mục nào. Hãy tạo danh mục đầu tiên.'"
                    >
                        <template #icon>
                            <i class="bi bi-folder-x"></i>
                        </template>
                        <template v-if="!searchQuery" #action>
                            <button class="btn btn-primary" @click="openModal()">
                                <i class="bi bi-plus-lg me-2"></i>
                                Tạo danh mục đầu tiên
                            </button>
                        </template>
                    </EmptyState>
                    <div v-else class="table-responsive">
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
                                    <td class="fw-semibold">{{ category.name }}</td>
                                    <td>{{ category.description || '—' }}</td>
                                    <td class="text-end">
                                        <div class="action-buttons">
                                            <button class="action-button" type="button" @click="openModal(category)">
                                                <i class="bi bi-pencil"></i>
                                                <span>Chỉnh sửa</span>
                                            </button>
                                            <button class="action-button action-button--danger" type="button" @click="handleDelete(category)">
                                                <i class="bi bi-trash"></i>
                                                <span>Xóa</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </template>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, reactive, nextTick } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { Modal } from 'bootstrap'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { toast } from 'vue3-toastify'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/categoryService'
import { useErrorHandler } from '@/composables/useErrorHandler'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'

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
        bsModal.value = new Modal(modalElement.value, { backdrop: 'static' })
    }
    if (deleteModalElement.value) {
        deleteModalInstance = new Modal(deleteModalElement.value, { backdrop: 'static' })
    }
})
onUnmounted(() => {
    bsModal.value?.dispose()
    deleteModalInstance?.dispose()
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

const deleteTarget = ref(null)
const deleteModalElement = ref(null)
let deleteModalInstance = null

const handleDelete = (category) => {
    deleteTarget.value = category
    nextTick(() => {
        deleteModalInstance?.show()
    })
}

const confirmDelete = () => {
    if (deleteTarget.value) {
        deleteMutation.mutate(deleteTarget.value.id)
        deleteModalInstance?.hide()
    }
}

const closeDeleteModal = () => {
    deleteModalInstance?.hide()
    deleteTarget.value = null
}
</script>

<style scoped>
.categories-header {
    padding: var(--spacing-6);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-md);
    margin-bottom: var(--spacing-6);
}

.categories-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-6);
}

.categories-header__title-section {
    flex: 1;
    min-width: 0;
}

.categories-header__title {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-tight);
}

.categories-header__subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
    font-weight: var(--font-weight-normal);
}

.categories-header__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    flex-wrap: wrap;
    justify-content: flex-end;
}

:deep(.modal-content) {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-2xl);
}

:deep(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-6);
    background: var(--color-card);
}

:deep(.modal-header .modal-title) {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-1);
}

:deep(.modal-header .text-muted.small) {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
}

:deep(.modal-body) {
    padding: var(--spacing-6);
}

:deep(.modal-footer) {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-4) var(--spacing-6);
    background: var(--color-card);
}

.action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    justify-content: flex-end;
}

.action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-1);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-primary-border-soft);
    background: var(--color-card);
    color: var(--color-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    transition: all var(--transition-fast);
    white-space: nowrap;
    cursor: pointer;
}

.action-button:hover:not(:disabled) {
    background: var(--color-primary);
    color: var(--color-white);
    border-color: var(--color-primary);
    box-shadow: var(--shadow-sm);
}

.action-button:disabled {
    opacity: 0.65;
    pointer-events: none;
}

.action-button--danger {
    border-color: var(--color-danger-border);
    background: var(--color-danger-soft);
    color: var(--color-danger);
}

.action-button--danger:hover:not(:disabled) {
    background: var(--color-danger);
    color: var(--color-white);
    border-color: var(--color-danger);
    box-shadow: var(--shadow-sm);
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

    .action-button span {
        display: none;
    }
}
</style>