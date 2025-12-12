<template>
  <div data-aos="fade-up">
    <Teleport to="body">
      <div
        id="categoryModal"
        ref="modalElement"
        class="modal fade"
        tabindex="-1"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <div>
                <h5 class="modal-title">
                  {{ isEditing ? 'Cập nhật Danh mục' : 'Tạo mới Danh mục' }}
                </h5>
                <p class="mb-0 text-muted small">
                  Điền đầy đủ thông tin theo quy định backend.
                </p>
              </div>
              <button
                type="button"
                class="btn-close"
                :disabled="createMutation.isPending.value || updateMutation.isPending.value"
                aria-label="Close"
                @click="closeModal"
              />
            </div>

            <Form
              v-slot="{ errors }"
              :validation-schema="categorySchema"
              @submit="handleSubmit"
            >
              <div class="modal-body">
                <div class="mb-3">
                  <label
                    for="name"
                    class="form-label fw-semibold"
                  >Tên Danh mục <span
                    class="text-danger"
                  >*</span></label>
                  <Field
                    id="name"
                    v-model="formData.name"
                    name="name"
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': errors.name }"
                    placeholder="Cà phê Việt Nam"
                    :disabled="createMutation.isPending.value || updateMutation.isPending.value"
                  />
                  <ErrorMessage
                    name="name"
                    class="invalid-feedback"
                  />
                </div>

                <div class="mb-3">
                  <label
                    for="description"
                    class="form-label fw-semibold"
                  >Mô tả</label>
                  <Field
                    id="description"
                    v-model="formData.description"
                    name="description"
                    as="textarea"
                    rows="3"
                    class="form-control"
                    placeholder="Mô tả ngắn gọn về danh mục..."
                    :disabled="createMutation.isPending.value || updateMutation.isPending.value"
                  />
                  <ErrorMessage
                    name="description"
                    class="invalid-feedback"
                  />
                </div>
              </div>

              <div class="modal-footer">
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  :disabled="createMutation.isPending.value || updateMutation.isPending.value"
                  @click="closeModal"
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
                  />
                  {{ isEditing ? 'Cập nhật' : 'Tạo mới' }}
                </button>
              </div>
            </Form>
          </div>
        </div>
      </div>

      <div
        id="deleteCategoryModal"
        ref="deleteModalElement"
        class="modal fade"
        tabindex="-1"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <div>
                <h5 class="modal-title">
                  Xóa danh mục
                </h5>
                <p class="mb-0 text-muted small">
                  Hành động này không thể hoàn tác.
                </p>
              </div>
              <button
                type="button"
                class="btn-close"
                :disabled="deleteMutation.isPending.value"
                aria-label="Close"
                @click="closeDeleteModal"
              />
            </div>
            <div class="modal-body">
              <p class="mb-3">
                Bạn có chắc chắn muốn xóa danh mục này không?
              </p>
              <div class="delete-info-card">
                <div class="delete-info-item">
                  <span class="delete-info-label">Tên danh mục:</span>
                  <span class="delete-info-value">{{ deleteTarget?.name || '—' }}</span>
                </div>
                <div
                  v-if="deleteTarget?.description"
                  class="delete-info-item"
                >
                  <span class="delete-info-label">Mô tả:</span>
                  <span class="delete-info-value">{{ deleteTarget.description }}</span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-secondary"
                :disabled="deleteMutation.isPending.value"
                @click="closeDeleteModal"
              >
                Hủy
              </button>
              <button
                type="button"
                class="btn btn-danger"
                :disabled="deleteMutation.isPending.value"
                @click="confirmDelete"
              >
                <span
                  v-if="deleteMutation.isPending.value"
                  class="spinner-border spinner-border-sm me-2"
                />
                Xóa danh mục
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <div
      class="categories-page container-fluid"
      style="background: var(--color-body-bg); padding: var(--spacing-4);"
    >
      <div class="categories-header">
        <div class="categories-header__content">
          <div class="categories-header__title-section">
            <h2 class="categories-header__title">
              Quản lý Danh mục
            </h2>
            <p class="categories-header__subtitle">
              Quản lý các danh mục sản phẩm trong hệ thống
            </p>
          </div>
          <div class="categories-header__actions">
            <button
              class="btn btn-primary btn-sm"
              @click="openModal()"
            >
              <i class="bi bi-plus-lg me-2" /> Thêm mới
            </button>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-4 mt-1">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="col-md-4 d-flex"
        >
          <div class="stat-card w-100">
            <div
              class="stat-icon"
              :class="stat.variant"
            >
              <i :class="stat.icon" />
            </div>
            <div>
              <p class="stat-label mb-1">
                {{ stat.label }}
              </p>
              <h4 class="stat-value mb-0">
                {{ stat.value }}
              </h4>
            </div>
          </div>
        </div>
      </div>

      <div class="card filter-card mb-4">
        <div class="card-body">
          <div class="row g-3 align-items-end">
            <div class="col-lg-4 col-md-6">
              <label class="form-label">Tìm kiếm</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-search" /></span>
                <input
                  v-model="searchQuery"
                  type="text"
                  class="form-control"
                  placeholder="Tìm kiếm theo tên danh mục..."
                >
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
                <i class="bi bi-folder-x" />
              </template>
              <template
                v-if="!searchQuery"
                #action
              >
                <button
                  class="btn btn-primary"
                  @click="openModal()"
                >
                  <i class="bi bi-plus-lg me-2" />
                  Tạo danh mục đầu tiên
                </button>
              </template>
            </EmptyState>
            <div
              v-else
              class="table-responsive"
            >
              <table class="table table-hover align-middle">
                <thead class="table-light">
                  <tr>
                    <th scope="col">
                      ID
                    </th>
                    <th scope="col">
                      Tên Danh mục
                    </th>
                    <th scope="col">
                      Mô tả
                    </th>
                    <th
                      scope="col"
                      class="text-end"
                    >
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="category in filteredCategories"
                    :key="category.id"
                  >
                    <th scope="row">
                      {{ category.id }}
                    </th>
                    <td class="fw-semibold">
                      {{ category.name }}
                    </td>
                    <td>{{ category.description || '—' }}</td>
                    <td class="text-end">
                      <div class="action-buttons">
                        <button
                          class="action-button action-button--primary"
                          type="button"
                          @click="openModal(category)"
                        >
                          <i class="bi bi-pencil" />
                          <span>Chỉnh sửa</span>
                        </button>
                        <button
                          class="action-button action-button--danger"
                          type="button"
                          @click="handleDelete(category)"
                        >
                          <i class="bi bi-trash" />
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
    mutationFn: ({ id, ...payload }) => updateCategory(id, payload),
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

const stats = computed(() => {
    const total = categories.value?.length || 0
    const withDescription = categories.value?.filter(c => c.description && c.description.trim()).length || 0
    const withoutDescription = total - withDescription
    return [
        {
            label: 'Tổng danh mục',
            value: total,
            icon: 'bi bi-folder',
            variant: 'variant-primary'
        },
        {
            label: 'Có mô tả',
            value: withDescription,
            icon: 'bi bi-file-text',
            variant: 'variant-success'
        },
        {
            label: 'Không mô tả',
            value: withoutDescription,
            icon: 'bi bi-file',
            variant: 'variant-warning'
        }
    ]
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
/* Categories Page - Chuẩn hóa theo base.css */
.categories-page {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
}

/* Header - Chuẩn hóa theo base.css */
.categories-header {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    margin-bottom: var(--spacing-4);
}

.categories-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    flex-wrap: wrap;
}

.categories-header__title-section {
    flex: 1;
    min-width: 0;
}

.categories-header__title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.categories-header__subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-weight: var(--font-weight-normal);
    font-family: var(--font-family-sans);
}

.categories-header__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    flex-wrap: wrap;
    justify-content: flex-end;
}

.categories-header__actions .btn {
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.categories-header__actions .btn-primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.categories-header__actions .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-dark);
}

.categories-header__actions .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.categories-header__actions .btn i {
    font-size: 18px;
    line-height: 1;
}

/* Modal - Chuẩn hóa theo base.css */
:global(.modal#categoryModal .modal-content),
:global(.modal#deleteCategoryModal .modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

:global(.modal#categoryModal .modal-header),
:global(.modal#deleteCategoryModal .modal-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
}

:global(.modal#categoryModal .modal-header .modal-title),
:global(.modal#deleteCategoryModal .modal-header .modal-title) {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

:global(.modal#categoryModal .modal-header .text-muted.small),
:global(.modal#deleteCategoryModal .modal-header .text-muted.small) {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    margin-top: var(--spacing-1);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

:global(.modal#categoryModal .modal-body),
:global(.modal#deleteCategoryModal .modal-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

:global(.modal#categoryModal .modal-body p) {
    font-family: var(--font-family-sans);
}

:global(.modal#categoryModal .modal-footer),
:global(.modal#deleteCategoryModal .modal-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
}

:global(.modal#categoryModal .modal-footer .btn),
:global(.modal#deleteCategoryModal .modal-footer .btn) {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    font-family: var(--font-family-sans);
}

:global(.modal#categoryModal .modal-footer .btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

:global(.modal#categoryModal .modal-footer .btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

:global(.modal#categoryModal .modal-footer .btn-outline-secondary),
:global(.modal#deleteCategoryModal .modal-footer .btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

:global(.modal#categoryModal .modal-footer .btn-outline-secondary:hover:not(:disabled)),
:global(.modal#deleteCategoryModal .modal-footer .btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

:global(.modal#deleteCategoryModal .modal-footer .btn-danger) {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-text-inverse);
}

:global(.modal#deleteCategoryModal .modal-footer .btn-danger:hover:not(:disabled)) {
    background: var(--color-danger-dark);
}

:global(.modal#categoryModal .modal-footer .btn:disabled),
:global(.modal#deleteCategoryModal .modal-footer .btn:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

:global(.modal#categoryModal .modal-footer .btn i),
:global(.modal#deleteCategoryModal .modal-footer .btn i) {
    font-size: 18px;
    line-height: 1;
}

/* Form Controls - Clean Input Style */
:global(.modal#categoryModal .form-label),
:global(.modal#deleteCategoryModal .form-label) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

:global(.modal#categoryModal .form-label .fw-semibold) {
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
}

:global(.modal#categoryModal .form-control),
:global(.modal#deleteCategoryModal .form-control) {
    height: 40px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    background: var(--color-card);
    color: var(--color-heading);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

:global(.modal#categoryModal .form-control:focus),
:global(.modal#deleteCategoryModal .form-control:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

:global(.modal#categoryModal textarea.form-control),
:global(.modal#deleteCategoryModal textarea.form-control) {
    height: auto;
    min-height: 80px;
    resize: vertical;
    font-family: var(--font-family-sans);
}

:global(.modal#categoryModal .form-control.is-invalid),
:global(.modal#deleteCategoryModal .form-control.is-invalid) {
    border-color: var(--color-danger);
}

:global(.modal#categoryModal .invalid-feedback),
:global(.modal#deleteCategoryModal .invalid-feedback) {
    font-size: var(--font-size-sm);
    color: var(--color-danger);
    margin-top: var(--spacing-1);
    font-family: var(--font-family-sans);
}

/* Delete Info Card - Chuẩn hóa */
.delete-info-card {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.delete-info-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-3);
}

.delete-info-label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    flex-shrink: 0;
    min-width: 120px;
    font-family: var(--font-family-sans);
}

.delete-info-value {
    font-size: var(--font-size-base);
    color: var(--color-heading);
    text-align: right;
    word-break: break-word;
    font-family: var(--font-family-sans);
}

/* Stat Cards (KPI Cards) - Flat Design */
.stat-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    border-radius: var(--radius-sm);
    padding: var(--spacing-4);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    height: 100%;
    min-height: 120px;
    transition: all var(--transition-base);
}

.stat-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

.stat-icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-sm);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
}

/* Màu icon - dùng var(--color-soft-*) */
.stat-icon.variant-primary {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.stat-icon.variant-success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.stat-icon.variant-warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.stat-label {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.stat-value {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

/* Filter Card - Chuẩn hóa theo base.css */
.filter-card {
    margin-bottom: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.filter-card :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.filter-card :global(.form-label) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-control) {
    height: 40px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    background: var(--color-card);
    color: var(--color-heading);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-control:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.filter-card :global(.input-group-text) {
    height: 40px;
    background: var(--color-card-muted);
    border-color: var(--color-border);
    color: var(--color-text-muted);
    padding: var(--spacing-2) var(--spacing-3);
}

.filter-card :global(.input-group-text i) {
    font-size: 18px;
    line-height: 1;
}

/* Tabs Card - Chuẩn hóa */
.tabs-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.tabs-card :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

/* Table - Minimal Table Styling */
.categories-page :global(.table) {
    margin-bottom: 0;
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
}

.categories-page :global(.table thead),
.categories-page :global(.table thead.table-light) {
    background: var(--color-card-muted);
}

.categories-page :global(.table thead th) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    background: var(--color-card-muted);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-3);
    vertical-align: middle;
    font-family: var(--font-family-sans);
}

.categories-page :global(.table tbody td),
.categories-page :global(.table tbody th) {
    font-size: var(--font-size-base);
    padding: var(--spacing-3);
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
    font-family: var(--font-family-sans);
}

.categories-page :global(.table tbody tr:last-child td),
.categories-page :global(.table tbody tr:last-child th) {
    border-bottom: none;
}

.categories-page :global(.table tbody tr:hover) {
    background: var(--color-card-muted);
}

.categories-page :global(.table tbody .fw-semibold) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

/* Action Buttons - Flat Design */
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
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
    white-space: nowrap;
    cursor: pointer;
    font-family: var(--font-family-sans);
}

.action-button i {
    font-size: 16px;
    line-height: 1;
}

.action-button--primary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.action-button--primary:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.action-button--primary:active:not(:disabled) {
    background: var(--color-card-muted);
}

.action-button--danger {
    border-color: var(--color-border);
    color: var(--color-danger);
    background: var(--color-card);
}

.action-button--danger:hover:not(:disabled) {
    background: var(--color-soft-rose);
    border-color: var(--color-danger);
    color: var(--color-danger);
}

.action-button--danger:active:not(:disabled) {
    background: var(--color-soft-rose);
}

.action-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
}

/* Global Button Styles - Đồng bộ với các trang trước */
.categories-page :global(.btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.categories-page :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.categories-page :global(.btn-primary:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

.categories-page :global(.btn-primary i) {
    font-size: 18px;
    line-height: 1;
}

.categories-page :global(.btn-outline-primary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.categories-page :global(.btn-outline-primary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.categories-page :global(.btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.categories-page :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.categories-page :global(.btn-danger) {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-text-inverse);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.categories-page :global(.btn-danger:hover:not(:disabled)) {
    background: var(--color-danger-dark);
}

.categories-page :global(.btn-sm) {
    padding: var(--spacing-1) var(--spacing-3);
    font-size: var(--font-size-sm);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

/* Responsive */
@media (max-width: 992px) {
    .categories-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .categories-header__actions {
        width: 100%;
        justify-content: flex-start;
    }

    .stat-card {
        flex-direction: column;
        text-align: center;
        min-height: auto;
    }

    .stat-icon {
        width: 48px;
        height: 48px;
        font-size: 20px;
    }
}

@media (max-width: 768px) {
    .categories-page {
        padding: var(--spacing-3);
    }

    .action-buttons {
        flex-direction: column;
        width: 100%;
    }

    .action-button {
        width: 100%;
    }

    .categories-page :global(.table-responsive) {
        overflow-x: auto;
    }
}
</style>
