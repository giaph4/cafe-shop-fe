<template>
  <div data-aos="fade-up">
    <Teleport to="body">
      <!-- Supplier Modal -->
      <div
        id="supplierModal"
        ref="modalElement"
        class="modal fade"
        tabindex="-1"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <div>
                <h5 class="modal-title">
                  {{ isEditing ? 'Cập nhật nhà cung cấp' : 'Thêm nhà cung cấp mới' }}
                </h5>
                <p class="modal-subtitle mb-0">
                  Lưu thông tin chính xác để quản lý chuỗi cung ứng hiệu quả.
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
              :validation-schema="supplierSchema"
              @submit="handleSubmit"
            >
              <div class="modal-body">
                <div class="row g-4">
                  <div class="col-md-6">
                    <label class="form-label">Tên nhà cung cấp <span class="text-danger">*</span></label>
                    <Field
                      v-model="formData.name"
                      name="name"
                      type="text"
                      class="form-control"
                      placeholder="Ví dụ: Công ty ABC"
                      :class="{ 'is-invalid': errors.name }"
                    />
                    <ErrorMessage
                      name="name"
                      class="invalid-feedback"
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Người liên hệ</label>
                    <Field
                      v-model="formData.contactPerson"
                      name="contactPerson"
                      type="text"
                      class="form-control"
                      placeholder="Nguyễn Văn A"
                      :class="{ 'is-invalid': errors.contactPerson }"
                    />
                    <ErrorMessage
                      name="contactPerson"
                      class="invalid-feedback"
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Số điện thoại <span class="text-danger">*</span></label>
                    <Field
                      v-model="formData.phone"
                      name="phone"
                      type="text"
                      class="form-control"
                      placeholder="0123456789"
                      :class="{ 'is-invalid': errors.phone }"
                    />
                    <ErrorMessage
                      name="phone"
                      class="invalid-feedback"
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Email</label>
                    <Field
                      v-model="formData.email"
                      name="email"
                      type="email"
                      class="form-control"
                      placeholder="supplier@email.com"
                      :class="{ 'is-invalid': errors.email }"
                    />
                    <ErrorMessage
                      name="email"
                      class="invalid-feedback"
                    />
                  </div>
                  <div class="col-12">
                    <label class="form-label">Địa chỉ</label>
                    <Field
                      v-model="formData.address"
                      name="address"
                      as="textarea"
                      rows="3"
                      class="form-control"
                      placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
                      :class="{ 'is-invalid': errors.address }"
                    />
                    <ErrorMessage
                      name="address"
                      class="invalid-feedback"
                    />
                  </div>
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
                  />
                  Lưu thay đổi
                </button>
              </div>
            </Form>
          </div>
        </div>
      </div>

      <!-- Delete Supplier Confirmation Modal -->
      <div
        id="deleteSupplierModal"
        ref="deleteSupplierModalElement"
        class="modal fade"
        tabindex="-1"
        aria-labelledby="deleteSupplierModalLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <div>
                <h5
                  id="deleteSupplierModalLabel"
                  class="modal-title"
                >
                  Xóa nhà cung cấp
                </h5>
                <p class="modal-subtitle mb-0">
                  Hành động này không thể hoàn tác.
                </p>
              </div>
              <button
                type="button"
                class="btn-close"
                :disabled="deleteMutation.isPending.value"
                aria-label="Close"
                @click="deleteSupplierBsModal?.hide()"
              />
            </div>
            <div class="modal-body">
              <p class="mb-3">
                Bạn có chắc chắn muốn xóa nhà cung cấp này không?
              </p>
              <div
                v-if="supplierToDelete"
                class="delete-info-card"
              >
                <div class="delete-info-item">
                  <span class="delete-info-label">Tên:</span>
                  <span class="delete-info-value">{{ supplierToDelete.name || '—' }}</span>
                </div>
                <div class="delete-info-item">
                  <span class="delete-info-label">Người liên hệ:</span>
                  <span class="delete-info-value">{{ supplierToDelete.contactPerson || '—' }}</span>
                </div>
                <div class="delete-info-item">
                  <span class="delete-info-label">Số điện thoại:</span>
                  <span class="delete-info-value">{{ supplierToDelete.phone || '—' }}</span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-secondary"
                :disabled="deleteMutation.isPending.value"
                @click="deleteSupplierBsModal?.hide()"
              >
                Hủy
              </button>
              <button
                type="button"
                class="btn btn-danger"
                :disabled="deleteMutation.isPending.value"
                @click="confirmDeleteSupplier"
              >
                <span
                  v-if="deleteMutation.isPending.value"
                  class="spinner-border spinner-border-sm me-2"
                />
                Xóa nhà cung cấp
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <div
      class="suppliers-page container-fluid"
      style="background: var(--color-body-bg); padding: var(--spacing-4);"
    >
      <div class="suppliers-header">
        <div class="suppliers-header__content">
          <div class="suppliers-header__title-section">
            <h2 class="suppliers-header__title">
              Quản lý Nhà cung cấp
            </h2>
            <p class="suppliers-header__subtitle">
              Theo dõi thông tin liên hệ và hợp tác chặt chẽ với đối tác cung ứng.
            </p>
          </div>
          <div class="suppliers-header__actions">
            <button
              class="btn btn-outline-secondary btn-sm"
              type="button"
              :disabled="isFetching"
              @click="refetch"
            >
              <span
                v-if="isFetching"
                class="spinner-border spinner-border-sm me-2"
              />
              Làm mới
            </button>
            <button
              class="btn btn-primary btn-sm"
              type="button"
              @click="openModal()"
            >
              <i class="bi bi-plus-lg me-2" />Thêm nhà cung cấp
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
              <div class="input-group search-group">
                <span class="input-group-text"><i class="bi bi-search" /></span>
                <input
                  v-model="searchQuery"
                  type="text"
                  class="form-control"
                  placeholder="Tên, người liên hệ, SĐT, email"
                >
              </div>
            </div>
            <div
              v-if="supportsPagination"
              class="col-lg-2 col-md-3"
            >
              <label class="form-label">Số dòng / trang</label>
              <select
                class="form-select"
                :value="pageSize"
                @change="updatePageSize($event.target.value)"
              >
                <option
                  v-for="size in pageSizeOptions"
                  :key="size"
                  :value="size"
                >
                  {{ size }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="card table-card">
        <div class="card-body p-0">
          <LoadingState v-if="isLoading" />
          <ErrorState
            v-else-if="isError"
            :message="errorMessage"
            @retry="refetch"
          />
          <EmptyState
            v-else-if="!tableData.length"
            title="Chưa có nhà cung cấp"
            message="Tạo nhà cung cấp mới bằng nút ở góc trên bên phải."
          />
          <div
            v-else
            class="table-responsive"
          >
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th
                    scope="col"
                    style="width: 50px;"
                  >
                    <input
                      type="checkbox"
                      :checked="bulkActions.isSelectAll && tableData.length > 0"
                      :indeterminate="bulkActions.selectedCount > 0 && !bulkActions.isSelectAll"
                      @change="handleSelectAll"
                    >
                  </th>
                  <th scope="col">
                    Tên nhà cung cấp
                  </th>
                  <th scope="col">
                    Người liên hệ
                  </th>
                  <th scope="col">
                    Điện thoại
                  </th>
                  <th scope="col">
                    Email
                  </th>
                  <th scope="col">
                    Địa chỉ
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
                  v-for="supplier in tableData"
                  :key="supplier.id"
                >
                  <td>
                    <input
                      type="checkbox"
                      :checked="bulkActions.isSelected(supplier.id)"
                      @change="bulkActions.toggleSelection(supplier.id)"
                    >
                  </td>
                  <td class="fw-semibold">
                    {{ supplier.name }}
                  </td>
                  <td>{{ supplier.contactPerson || '—' }}</td>
                  <td>{{ supplier.phone }}</td>
                  <td>{{ supplier.email || '—' }}</td>
                  <td>{{ supplier.address || '—' }}</td>
                  <td class="text-end">
                    <div class="action-buttons">
                      <button
                        class="action-button action-button--primary"
                        type="button"
                        @click="openModal(supplier)"
                      >
                        <i class="bi bi-pencil" />
                        <span>Chỉnh sửa</span>
                      </button>
                      <button
                        class="action-button action-button--danger"
                        type="button"
                        @click="handleDelete(supplier)"
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
        </div>
        <div
          v-if="supportsPagination && totalPages > 1"
          class="card-footer bg-transparent"
          style="margin-bottom: 80px;"
        >
          <Pagination
            mode="zero-based"
            :current-page="zeroBasedPage"
            :total-pages="totalPages"
            @page-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <!-- Bulk Actions Bar -->
    <BulkActionsBar
      :selected-count="bulkActions.selectedCount.value"
      :has-selection="bulkActions.hasSelection.value"
      :is-processing="bulkActions.isProcessing.value"
      :progress-percentage="progressPercentage"
      :actions="bulkActionItems"
      item-label="nhà cung cấp"
      @action="handleBulkAction"
      @clear="bulkActions.clearSelection"
    />

    <!-- Export Modal -->
    <ExportModal
      :show="showExportModal"
      :data="tableData"
      :columns="exportColumns"
      :has-filters="false"
      default-filename="suppliers"
      @close="showExportModal = false"
      @export="handleExport"
    />

    <!-- Import Modal -->
    <ImportModal
      :show="showImportModal"
      :required-fields="importRequiredFields"
      :validation-rules="importValidationRules"
      :on-import="handleImport"
      @close="showImportModal = false"
      @import="handleImportComplete"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { Teleport } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Modal } from 'bootstrap'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'

import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Pagination from '@/components/common/Pagination.vue'
import { usePagination, PaginationMode } from '@/composables/usePagination'
import { showSuccess, showError } from '@/utils/toast'
import { formatNumber } from '@/utils/formatters'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/api/supplierService'
import { useBulkActions } from '@/composables/useBulkActions'
import BulkActionsBar from '@/components/BulkActionsBar.vue'
import ExportModal from '@/components/ExportModal.vue'
import ImportModal from '@/components/ImportModal.vue'
import { toast } from 'vue3-toastify'
import logger from '@/utils/logger'

const queryClient = useQueryClient()

const modalElement = ref(null)
const bsModal = ref(null)
const deleteSupplierModalElement = ref(null)
const deleteSupplierBsModal = ref(null)
const supplierToDelete = ref(null)
const isEditing = ref(false)

// Bulk Actions
const bulkActions = useBulkActions({
    onBulkAction: (action, selectedIds, results) => {
        if (results.success > 0) {
            toast.success(`${results.success} nhà cung cấp đã được ${action} thành công`)
        }
        if (results.failed > 0) {
            toast.error(`${results.failed} nhà cung cấp ${action} thất bại`)
        }
        queryClient.invalidateQueries(['suppliers'])
    },
    maxBatchSize: 100
})

const showExportModal = ref(false)
const showImportModal = ref(false)
const progressPercentage = ref(0)

// Bulk action items
const bulkActionItems = computed(() => [
    {
        id: 'export',
        label: 'Xuất',
        icon: 'bi bi-download',
        confirm: false
    },
    {
        id: 'delete',
        label: 'Xóa',
        icon: 'bi bi-trash',
        danger: true,
        confirm: true,
        confirmMessage: 'Bạn có chắc chắn muốn xóa các nhà cung cấp đã chọn? Hành động này không thể hoàn tác.'
    }
])

// Export columns
const exportColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Tên nhà cung cấp' },
    { key: 'contactPerson', label: 'Người liên hệ' },
    { key: 'phone', label: 'Số điện thoại' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Địa chỉ' }
]

// Import fields
const importRequiredFields = [
    { key: 'name', label: 'Tên nhà cung cấp', required: true },
    { key: 'phone', label: 'Số điện thoại', required: true }
]

const importValidationRules = [
    { field: 'name', label: 'Tên nhà cung cấp', required: true, type: 'string' },
    { field: 'phone', label: 'Số điện thoại', required: true, type: 'string' }
]

// Handle bulk actions
const handleBulkAction = async (action) => {
    try {
        switch (action.id) {
            case 'delete':
                if (bulkActions.selectedCount.value === 0) {
                    toast.warning('Vui lòng chọn ít nhất một nhà cung cấp')
                    return
                }
                await bulkActions.executeBulkAction(
                    'delete',
                    async (id) => {
                        await deleteSupplier(id)
                    },
                    {
                        confirm: false,
                        skipConfirm: true,
                        onProgress: (progress) => {
                            progressPercentage.value = progress.percentage
                        },
                        clearOnSuccess: true,
                        onComplete: (results) => {
                            progressPercentage.value = 0
                        }
                    }
                )
                break

            case 'export':
                showExportModal.value = true
                break
        }
    } catch (err) {
        logger.error('[Suppliers] Lỗi khi thực hiện thao tác hàng loạt:', err)
        toast.error(`Có lỗi xảy ra: ${  err.message || 'Lỗi không xác định'}`)
        progressPercentage.value = 0
    }
}

// Handle select all
const handleSelectAll = () => {
    if (bulkActions.isSelectAll.value) {
        bulkActions.clearSelection()
    } else {
        bulkActions.selectAll(tableData.value)
    }
}

// Handle export
const handleExport = (result) => {
    toast.success(`Đã xuất ${result.rowCount} nhà cung cấp thành công`)
}

// Handle import
const handleImport = async (mappedData) => {
    const results = await Promise.allSettled(
        mappedData.map(item => createSupplier(item))
    )

    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failedCount = results.filter(r => r.status === 'rejected').length

    if (successCount > 0) {
        toast.success(`Đã nhập ${successCount} nhà cung cấp thành công`)
    }
    if (failedCount > 0) {
        toast.error(`${failedCount} nhà cung cấp nhập thất bại`)
    }

    return {
        success: successCount,
        failed: failedCount
    }
}

// Handle import complete
const handleImportComplete = (result) => {
    logger.log('[Suppliers] Nhập dữ liệu hoàn tất', result)
    queryClient.invalidateQueries(['suppliers'])
}

const formData = reactive({ id: null, name: '', contactPerson: '', phone: '', email: '', address: '' })

const searchQuery = ref('')
const debouncedSearch = ref('')
const pageSizeOptions = [10, 25, 50]

const pagination = usePagination({ mode: PaginationMode.ZERO_BASED, pageSize: pageSizeOptions[0] })
const { pageSize, zeroBasedPage, setPage, updatePageSize, resetPage } = pagination

let searchTimeoutId

watch(searchQuery, (value) => {
    clearTimeout(searchTimeoutId)
    searchTimeoutId = setTimeout(() => {
        debouncedSearch.value = value.trim()
        if (supportsPagination.value) {
            resetPage()
        }
    }, 300)
})

onMounted(() => {
    if (modalElement.value) {
        bsModal.value = new Modal(modalElement.value, { backdrop: 'static' })
    }
    if (deleteSupplierModalElement.value) {
        deleteSupplierBsModal.value = new Modal(deleteSupplierModalElement.value)
    }
})

onUnmounted(() => {
    if (searchTimeoutId) {
        clearTimeout(searchTimeoutId)
    }
    bsModal.value?.dispose()
})

const phoneRegex = /^(0\d{9})$/
const supplierSchema = yup.object({
    name: yup.string().trim().required('Tên nhà cung cấp là bắt buộc'),
    contactPerson: yup.string().trim().nullable().transform((value) => (value === '' ? null : value)),
    phone: yup
        .string()
        .required('Số điện thoại là bắt buộc')
        .matches(phoneRegex, 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)'),
    email: yup
        .string()
        .trim()
        .nullable()
        .transform((value) => (value === '' ? null : value))
        .email('Email không hợp lệ'),
    address: yup.string().trim().nullable().transform((value) => (value === '' ? null : value))
})

const query = useQuery({
    queryKey: computed(() => ['suppliers', { page: zeroBasedPage.value, size: pageSize.value, keyword: debouncedSearch.value }]),
    queryFn: ({ queryKey }) => {
        const [, params] = queryKey
        return getSuppliers({ page: params.page, size: params.size, keyword: params.keyword || undefined })
    },
    keepPreviousData: true
})

const { data, isLoading, isError, error, isFetching, refetch } = query

const rawSuppliers = computed(() => data.value ?? null)
const paginatedContent = computed(() => Array.isArray(rawSuppliers.value?.content) ? rawSuppliers.value.content : null)
const supportsPagination = computed(() => Array.isArray(paginatedContent.value))

const baseItems = computed(() => {
    if (supportsPagination.value) return paginatedContent.value
    if (Array.isArray(rawSuppliers.value)) return rawSuppliers.value
    if (Array.isArray(rawSuppliers.value?.data)) return rawSuppliers.value.data
    return []
})

const tableData = computed(() => {
    if (supportsPagination.value) return baseItems.value

    const keyword = debouncedSearch.value.toLowerCase()
    if (!keyword) return baseItems.value

    return baseItems.value.filter((supplier) => {
        const haystack = [supplier.name, supplier.contactPerson, supplier.phone, supplier.email]
            .filter(Boolean)
            .map((value) => value.toString().toLowerCase())
        return haystack.some((value) => value.includes(keyword))
    })
})

const totalElements = computed(() => {
    if (supportsPagination.value) {
        const total = rawSuppliers.value?.totalElements ?? rawSuppliers.value?.total
        return typeof total === 'number' ? total : baseItems.value.length
    }
    return baseItems.value.length
})

const totalPages = computed(() => {
    if (supportsPagination.value) {
        const total = rawSuppliers.value?.totalPages ?? rawSuppliers.value?.totalPage ?? rawSuppliers.value?.pageInfo?.totalPages
        return typeof total === 'number' ? total : 0
    }
    return baseItems.value.length > 0 ? 1 : 0
})

const emailCount = computed(() => tableData.value.filter((supplier) => supplier.email)?.length ?? 0)
const addressCount = computed(() => tableData.value.filter((supplier) => supplier.address)?.length ?? 0)

const stats = computed(() => [
    {
        label: 'Tổng nhà cung cấp',
        value: formatNumber(totalElements.value, { maximumFractionDigits: 0 }),
        icon: 'bi bi-people',
        variant: 'variant-primary'
    },
    {
        label: 'Có email liên hệ',
        value: formatNumber(emailCount.value, { maximumFractionDigits: 0 }),
        icon: 'bi bi-envelope-open',
        variant: 'variant-info'
    },
    {
        label: 'Có địa chỉ đầy đủ',
        value: formatNumber(addressCount.value, { maximumFractionDigits: 0 }),
        icon: 'bi bi-geo-alt',
        variant: 'variant-success'
    }
])

const errorMessage = computed(() => error.value?.response?.data?.message || error.value?.message || 'Không thể tải dữ liệu nhà cung cấp.')

const openModal = (supplier = null) => {
    if (supplier) {
        isEditing.value = true
        formData.id = supplier.id
        formData.name = supplier.name ?? ''
        formData.contactPerson = supplier.contactPerson ?? ''
        formData.phone = supplier.phone ?? ''
        formData.email = supplier.email ?? ''
        formData.address = supplier.address ?? ''
    } else {
        isEditing.value = false
        formData.id = null
        formData.name = ''
        formData.contactPerson = ''
        formData.phone = ''
        formData.email = ''
        formData.address = ''
    }
    bsModal.value?.show()
}

const closeModal = () => {
    bsModal.value?.hide()
}

const createMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
        showSuccess('Tạo nhà cung cấp thành công!')
        queryClient.invalidateQueries({ queryKey: ['suppliers'] })
        closeModal()
    },
    onError: (err) => showError(err.response?.data?.message || 'Không thể tạo nhà cung cấp.')
})

const updateMutation = useMutation({
    mutationFn: updateSupplier,
    onSuccess: () => {
        showSuccess('Cập nhật nhà cung cấp thành công!')
        queryClient.invalidateQueries({ queryKey: ['suppliers'] })
        closeModal()
    },
    onError: (err) => showError(err.response?.data?.message || 'Không thể cập nhật nhà cung cấp.')
})

const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
        showSuccess('Xoá nhà cung cấp thành công!')
        queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
    onError: (err) => showError(err.response?.data?.message || 'Không thể xoá nhà cung cấp này.')
})

const handleSubmit = (values) => {
    const payload = { ...values }

    if (isEditing.value && formData.id) {
        updateMutation.mutate({ id: formData.id, data: payload })
    } else {
        createMutation.mutate(payload)
    }
}

const handleDelete = (supplier) => {
    supplierToDelete.value = supplier
    deleteSupplierBsModal.value?.show()
}

const confirmDeleteSupplier = () => {
    if (!supplierToDelete.value) return
    const supplier = supplierToDelete.value
    deleteSupplierBsModal.value?.hide()
    deleteMutation.mutate(supplier.id)
    supplierToDelete.value = null
}

const handlePageChange = (page) => {
    setPage(page)
}
</script>

<style scoped>
/* Header - Chuẩn hóa theo base.css */
.suppliers-header {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    margin-bottom: var(--spacing-4);
}

.suppliers-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    flex-wrap: wrap;
}

.suppliers-header__title-section {
    flex: 1;
    min-width: 0;
}

.suppliers-header__title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.suppliers-header__subtitle {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.suppliers-header__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    flex-wrap: wrap;
    justify-content: flex-end;
}

.suppliers-header__actions .btn {
    font-size: var(--font-size-base);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.suppliers-header__actions .btn-primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.suppliers-header__actions .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-dark);
}

.suppliers-header__actions .btn-outline-secondary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.suppliers-header__actions .btn-outline-secondary:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.suppliers-header__actions .btn i {
    font-size: 18px;
    line-height: 1;
}

/* Stat Cards (KPI) - Flat Design */
.stat-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
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

.stat-icon.variant-info {
    background: var(--color-soft-blue);
    color: var(--color-info);
}

.stat-icon.variant-success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
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

/* Filter Card - Chuẩn hóa */
.filter-card {
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

.filter-card :global(.form-control),
.filter-card :global(.form-select) {
    height: 40px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    background: var(--color-card);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-control:focus),
.filter-card :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.filter-card :global(.input-group-text) {
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
    border-right: none;
    color: var(--color-text-muted);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm) 0 0 var(--radius-sm);
}

.filter-card :global(.input-group-text i) {
    font-size: 18px;
    line-height: 1;
}

.filter-card :global(.search-group .form-control) {
    border-left: none;
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

/* Table Card - Minimal Table Styling */
.table-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.table-card :global(.card-body) {
    padding: 0;
    background: var(--color-card);
}

.table-card :global(.card-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
}

.table-card :global(.table) {
    margin-bottom: 0;
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
}

.table-card :global(.table thead),
.table-card :global(.table thead.table-light) {
    background: var(--color-card-muted);
}

.table-card :global(.table thead th) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    background: var(--color-card-muted);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-3);
    vertical-align: middle;
    font-family: var(--font-family-sans);
}

.table-card :global(.table tbody td) {
    font-size: var(--font-size-base);
    padding: var(--spacing-3);
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
    font-family: var(--font-family-sans);
}

.table-card :global(.table tbody tr:last-child td) {
    border-bottom: none;
}

.table-card :global(.table tbody tr:hover) {
    background: var(--color-card-muted);
}

.table-card :global(.fw-semibold) {
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

/* Modal - Chuẩn hóa theo base.css */
.suppliers-page :global(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.suppliers-page :global(.modal-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
}

.suppliers-page :global(.modal-header .modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

.suppliers-page :global(.modal-header .modal-subtitle) {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    margin-top: var(--spacing-1);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

.suppliers-page :global(.modal-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.suppliers-page :global(.modal-body p) {
    font-family: var(--font-family-sans);
}

.suppliers-page :global(.modal-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
}

.suppliers-page :global(.modal-body .form-label) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.suppliers-page :global(.modal-body .form-control),
.suppliers-page :global(.modal-body .form-select) {
    height: 40px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    background: var(--color-card);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.suppliers-page :global(.modal-body .form-control:focus),
.suppliers-page :global(.modal-body .form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.suppliers-page :global(.modal-body .form-control.is-invalid) {
    border-color: var(--color-danger);
}

.suppliers-page :global(.modal-body textarea.form-control) {
    height: auto;
    min-height: 80px;
    resize: vertical;
    font-family: var(--font-family-sans);
}

.suppliers-page :global(.modal-body .invalid-feedback) {
    font-size: var(--font-size-sm);
    color: var(--color-danger);
    margin-top: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.suppliers-page :global(.modal-footer .btn) {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.suppliers-page :global(.modal-footer .btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.suppliers-page :global(.modal-footer .btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.suppliers-page :global(.modal-footer .btn-primary:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

.suppliers-page :global(.modal-footer .btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.suppliers-page :global(.modal-footer .btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.suppliers-page :global(.modal-footer .btn-danger) {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-text-inverse);
}

.suppliers-page :global(.modal-footer .btn-danger:hover:not(:disabled)) {
    background: var(--color-danger-dark);
}

.suppliers-page :global(.modal-footer .btn-danger:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
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

/* Global Button Styles - Đồng bộ với các trang trước */
.suppliers-page :global(.btn-primary) {
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

.suppliers-page :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.suppliers-page :global(.btn-primary:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

.suppliers-page :global(.btn-primary i) {
    font-size: 18px;
    line-height: 1;
}

.suppliers-page :global(.btn-outline-primary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.suppliers-page :global(.btn-outline-primary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.suppliers-page :global(.btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.suppliers-page :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.suppliers-page :global(.btn-danger) {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-text-inverse);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.suppliers-page :global(.btn-danger:hover:not(:disabled)) {
    background: var(--color-danger-dark);
}

.suppliers-page :global(.btn-sm) {
    padding: var(--spacing-1) var(--spacing-3);
    font-size: var(--font-size-sm);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

/* Responsive */
@media (max-width: 768px) {
    .suppliers-header__content {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-3);
    }

    .suppliers-header__actions {
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

    .action-buttons {
        flex-direction: column;
        width: 100%;
    }

    .action-button {
        width: 100%;
    }
}
</style>
