<template>
  <!-- Ingredient Modal -->
  <div data-aos="fade-up">
    <Teleport to="body">
      <div
        id="ingredientModal"
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
                  {{ isEditing ? 'Cập nhật nguyên liệu' : 'Thêm nguyên liệu mới' }}
                </h5>
                <p class="mb-0 text-muted small">
                  Nhập thông tin nguyên liệu để quản lý tồn kho hiệu quả hơn.
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
              :validation-schema="ingredientSchema"
              @submit="handleSubmit"
            >
              <div class="modal-body">
                <div class="row g-4">
                  <div class="col-12">
                    <label class="form-label">Tên nguyên liệu <span class="text-danger">*</span></label>
                    <Field
                      v-model="formData.name"
                      name="name"
                      type="text"
                      class="form-control"
                      placeholder="Ví dụ: Sữa tươi"
                      :class="{ 'is-invalid': errors.name }"
                    />
                    <ErrorMessage
                      name="name"
                      class="invalid-feedback"
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Đơn vị tính <span class="text-danger">*</span></label>
                    <Field
                      v-model="formData.unit"
                      name="unit"
                      type="text"
                      class="form-control"
                      placeholder="kg, lít, cái"
                      :class="{ 'is-invalid': errors.unit }"
                    />
                    <ErrorMessage
                      name="unit"
                      class="invalid-feedback"
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Mức đặt lại</label>
                    <Field
                      v-model="formData.reorderLevel"
                      name="reorderLevel"
                      type="number"
                      step="0.01"
                      min="0"
                      class="form-control"
                      placeholder="Nhập ngưỡng cảnh báo"
                      :class="{ 'is-invalid': errors.reorderLevel }"
                    />
                    <div class="form-text">
                      Để trống nếu không muốn theo dõi cảnh báo thiếu hụt.
                    </div>
                    <ErrorMessage
                      name="reorderLevel"
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
                  {{ isEditing ? 'Cập nhật' : 'Tạo mới' }}
                </button>
              </div>
            </Form>
          </div>
        </div>
      </div>

      <!-- Adjust Inventory Modal -->
      <div
        id="adjustModal"
        ref="adjustModalElement"
        class="modal fade"
        tabindex="-1"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <div>
                <h5 class="modal-title">
                  Điều chỉnh tồn kho
                </h5>
                <p class="mb-0 text-muted small">
                  Cập nhật số lượng thực tế và ghi nhận lý do điều chỉnh.
                </p>
              </div>
              <button
                type="button"
                class="btn-close"
                :disabled="adjustMutation.isPending.value"
                aria-label="Close"
                @click="closeAdjustModal"
              />
            </div>

            <Form
              v-slot="{ errors }"
              :validation-schema="adjustSchema"
              @submit="handleAdjustSubmit"
            >
              <div class="modal-body">
                <div class="inventory-summary">
                  <h6 class="inventory-summary__title">
                    {{ adjustData.name }}
                  </h6>
                  <p class="inventory-summary__text">
                    Tồn kho hiện tại: <strong>{{ formatQuantity(adjustData.currentStock) }}</strong>
                  </p>
                </div>

                <div class="mb-3">
                  <label class="form-label">Số lượng tồn mới <span class="text-danger">*</span></label>
                  <Field
                    v-model="adjustData.newQuantityOnHand"
                    name="newQuantityOnHand"
                    type="number"
                    step="0.01"
                    min="0"
                    class="form-control"
                    placeholder="Nhập tổng tồn kho sau điều chỉnh"
                    :class="{ 'is-invalid': errors.newQuantityOnHand }"
                  />
                  <ErrorMessage
                    name="newQuantityOnHand"
                    class="invalid-feedback"
                  />
                  <div
                    v-if="adjustData.newQuantityOnHand && !errors.newQuantityOnHand"
                    class="form-text"
                  >
                    <span
                      v-if="Number(adjustData.newQuantityOnHand) > adjustData.currentStock"
                      class="text-success"
                    >
                      ➕ Tăng: +{{ formatQuantity(Number(adjustData.newQuantityOnHand) - adjustData.currentStock) }}
                    </span>
                    <span
                      v-else-if="Number(adjustData.newQuantityOnHand) < adjustData.currentStock"
                      class="text-danger"
                    >
                      ➖ Giảm: {{ formatQuantity(Number(adjustData.newQuantityOnHand) - adjustData.currentStock) }}
                    </span>
                    <span
                      v-else
                      class="text-muted"
                    >
                      ➡️ Không thay đổi
                    </span>
                  </div>
                </div>
                <div>
                  <label class="form-label">Lý do điều chỉnh</label>
                  <Field
                    v-model="adjustData.reason"
                    name="reason"
                    as="textarea"
                    rows="3"
                    class="form-control"
                    placeholder="Ví dụ: Kiểm kê kho, hao hụt, hỏng hóc"
                    :class="{ 'is-invalid': errors.reason }"
                  />
                  <ErrorMessage
                    name="reason"
                    class="invalid-feedback"
                  />
                </div>
              </div>
              <div class="modal-footer">
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  :disabled="adjustMutation.isPending.value"
                  @click="closeAdjustModal"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="adjustMutation.isPending.value"
                >
                  <span
                    v-if="adjustMutation.isPending.value"
                    class="spinner-border spinner-border-sm me-2"
                  />
                  Lưu thay đổi
                </button>
              </div>
            </Form>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div
        ref="deleteModalElement"
        class="modal fade"
        tabindex="-1"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <div>
                <h5 class="modal-title">
                  Xóa nguyên liệu
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
                Bạn có chắc chắn muốn xóa nguyên liệu này không?
              </p>
              <div class="delete-info-card">
                <div class="delete-info-item">
                  <span class="delete-info-label">Tên nguyên liệu:</span>
                  <span class="delete-info-value">{{ deleteTarget?.name || '—' }}</span>
                </div>
                <div class="delete-info-item">
                  <span class="delete-info-label">Đơn vị:</span>
                  <span class="delete-info-value">{{ deleteTarget?.unit || '—' }}</span>
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
                @click="handleDeleteConfirm"
              >
                <span
                  v-if="deleteMutation.isPending.value"
                  class="spinner-border spinner-border-sm me-2"
                />
                Xóa nguyên liệu
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Adjust Confirmation Modal -->
      <div
        ref="adjustConfirmModalElement"
        class="modal fade"
        tabindex="-1"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <div>
                <h5 class="modal-title">
                  Xác nhận điều chỉnh tồn kho
                </h5>
                <p class="mb-0 text-muted small">
                  Vui lòng xem lại thông tin trước khi xác nhận.
                </p>
              </div>
              <button
                type="button"
                class="btn-close"
                aria-label="Close"
                @click="handleAdjustCancel"
              />
            </div>
            <div
              v-if="adjustConfirmData"
              class="modal-body"
            >
              <div class="confirm-info-card">
                <h6 class="confirm-info-card__title">
                  {{ adjustConfirmData.name }}
                </h6>
                <div class="confirm-info-grid">
                  <div class="confirm-info-item">
                    <span class="confirm-info-label">Tồn kho hiện tại:</span>
                    <span class="confirm-info-value">{{ formatQuantity(adjustConfirmData.currentQuantity) }}</span>
                  </div>
                  <div class="confirm-info-item">
                    <span class="confirm-info-label">Tồn kho mới:</span>
                    <span class="confirm-info-value">{{ formatQuantity(adjustConfirmData.newQuantity) }}</span>
                  </div>
                  <div class="confirm-info-item">
                    <span class="confirm-info-label">Chênh lệch:</span>
                    <span
                      class="confirm-info-value"
                      :class="adjustConfirmData.isIncrease ? 'confirm-info-value--success' : adjustConfirmData.isDecrease ? 'confirm-info-value--danger' : ''"
                    >
                      {{ adjustConfirmData.isIncrease ? '+' : '' }}{{ formatQuantity(adjustConfirmData.difference) }}
                    </span>
                  </div>
                </div>
              </div>
              <div
                v-if="adjustConfirmData.willBeBelowReorder"
                class="error-message"
                :class="adjustConfirmData.isCurrentlyBelowReorder ? 'error-message--warning' : 'error-message--danger'"
              >
                <i class="bi bi-exclamation-triangle me-2" />
                <strong v-if="!adjustConfirmData.isCurrentlyBelowReorder">CẢNH BÁO:</strong>
                <span v-else>LƯU Ý:</span>
                Tồn kho {{ adjustConfirmData.isCurrentlyBelowReorder ? 'vẫn' : 'sẽ' }} dưới mức đặt lại
                <strong v-if="adjustConfirmData.reorderLevel !== null">({{ formatQuantity(adjustConfirmData.reorderLevel) }})</strong>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="handleAdjustCancel"
              >
                Hủy
              </button>
              <button
                type="button"
                class="btn btn-primary"
                @click="handleAdjustConfirm"
              >
                Xác nhận điều chỉnh
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <div
      class="ingredients-page container-fluid"
      data-aos="fade-up"
      style="background: var(--color-body-bg); padding: var(--spacing-4);"
    >
      <div class="ingredients-header">
        <div class="ingredients-header__content">
          <div class="ingredients-header__title-section">
            <h2 class="ingredients-header__title">
              Quản lý Nguyên liệu
            </h2>
            <p class="ingredients-header__subtitle">
              Theo dõi tồn kho nguyên liệu, thiết lập cảnh báo và điều chỉnh khi cần.
            </p>
          </div>
          <div class="ingredients-header__actions">
            <button
              class="btn btn-outline-secondary btn-sm"
              type="button"
              :disabled="isFetching"
              @click="() => refetch()"
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
              <i class="bi bi-plus-lg me-2" />Thêm nguyên liệu
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
                  placeholder="Nhập tên nguyên liệu"
                >
              </div>
            </div>
            <div class="col-lg-2 col-md-3">
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
          <LoadingState
            v-if="isLoading"
            text="Đang tải dữ liệu nguyên liệu..."
          />
          <ErrorState
            v-else-if="isError"
            :message="errorMessage"
            :show-retry="true"
            :retry-handler="() => refetch()"
          />
          <template v-else>
            <EmptyState
              v-if="!tableData.length"
              title="Không tìm thấy nguyên liệu"
              message="Không có nguyên liệu nào phù hợp với bộ lọc hiện tại."
            >
              <template #icon>
                <i class="bi bi-droplet-half" />
              </template>
              <template #action>
                <button
                  class="btn btn-primary"
                  @click="openModal()"
                >
                  <i class="bi bi-plus-lg me-2" />
                  Thêm nguyên liệu đầu tiên
                </button>
              </template>
            </EmptyState>
            <div
              v-else
              class="table-responsive"
            >
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th scope="col">
                      Tên nguyên liệu
                    </th>
                    <th scope="col">
                      Đơn vị
                    </th>
                    <th
                      scope="col"
                      class="text-end"
                    >
                      Tồn kho
                    </th>
                    <th
                      scope="col"
                      class="text-end"
                    >
                      Mức đặt lại
                    </th>
                    <th
                      scope="col"
                      class="text-center"
                    >
                      Trạng thái
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
                    v-for="ingredient in tableData"
                    :key="ingredient.id"
                  >
                    <td class="fw-semibold">
                      {{ ingredient.name }}
                    </td>
                    <td>{{ ingredient.unit }}</td>
                    <td class="text-end">
                      {{ formatQuantity(ingredient.quantityOnHand) }}
                    </td>
                    <td class="text-end">
                      {{ ingredient.reorderLevel !== null ? formatQuantity(ingredient.reorderLevel) : '—' }}
                    </td>
                    <td class="text-center">
                      <span
                        class="badge rounded-pill px-3 py-2"
                        :class="getStatusBadge(ingredient)"
                      >
                        {{ getStatusLabel(ingredient) }}
                      </span>
                    </td>
                    <td class="text-end">
                      <div class="action-buttons">
                        <button
                          class="action-button action-button--primary"
                          type="button"
                          title="Điều chỉnh tồn kho"
                          @click="openAdjustModal(ingredient)"
                        >
                          <i class="bi bi-sliders" />
                          <span>Điều chỉnh</span>
                        </button>
                        <button
                          class="action-button action-button--primary"
                          type="button"
                          title="Chỉnh sửa"
                          @click="openModal(ingredient)"
                        >
                          <i class="bi bi-pencil" />
                          <span>Chỉnh sửa</span>
                        </button>
                        <button
                          class="action-button action-button--danger"
                          type="button"
                          title="Xóa"
                          @click="handleDelete(ingredient)"
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
        <div
          v-if="pagination.totalPages > 1"
          class="card-footer bg-transparent"
        >
          <Pagination
            mode="zero-based"
            :current-page="zeroBasedPage"
            :total-pages="pagination.totalPages"
            @page-change="handlePageChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch, nextTick } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Modal } from 'bootstrap'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'

import Pagination from '@/components/common/Pagination.vue'
import { getIngredients, createIngredient, updateIngredient, deleteIngredient, adjustInventory } from '@/api/ingredientService'
import { usePagination, PaginationMode } from '@/composables/usePagination'
import { showSuccess, showError } from '@/utils/toast'
import { formatNumber } from '@/utils/formatters'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const queryClient = useQueryClient()

const modalElement = ref(null)
const adjustModalElement = ref(null)
const deleteModalElement = ref(null)
const adjustConfirmModalElement = ref(null)
const bsModal = ref(null)
const bsAdjustModal = ref(null)
let deleteModalInstance = null
let adjustConfirmModalInstance = null

const isEditing = ref(false)
const formData = reactive({ id: null, name: '', unit: '', reorderLevel: '' })
const adjustData = reactive({ ingredientId: null, name: '', currentStock: 0, newQuantityOnHand: '', reason: '' })

const searchQuery = ref('')
const debouncedSearch = ref('')
const pageSizeOptions = [10, 25, 50]

const pagination = usePagination({ mode: PaginationMode.ZERO_BASED, pageSize: pageSizeOptions[0] })
const { currentPage, pageSize, zeroBasedPage, setPage, updatePageSize, resetPage, updateFromResponse } = pagination

let searchTimeoutId

watch(searchQuery, (value) => {
    clearTimeout(searchTimeoutId)
    searchTimeoutId = setTimeout(() => {
        debouncedSearch.value = value.trim()
        resetPage()
    }, 300)
})

onMounted(() => {
    if (modalElement.value) {
        bsModal.value = new Modal(modalElement.value, { backdrop: 'static' })
    }
    if (adjustModalElement.value) {
        bsAdjustModal.value = new Modal(adjustModalElement.value, { backdrop: 'static' })
    }
    if (deleteModalElement.value) {
        deleteModalInstance = new Modal(deleteModalElement.value, { backdrop: 'static' })
    }
    if (adjustConfirmModalElement.value) {
        adjustConfirmModalInstance = new Modal(adjustConfirmModalElement.value, { backdrop: 'static' })
    }
})

onUnmounted(() => {
    if (searchTimeoutId) {
        clearTimeout(searchTimeoutId)
    }
    bsModal.value?.dispose()
    bsAdjustModal.value?.dispose()
    deleteModalInstance?.dispose()
    adjustConfirmModalInstance?.dispose()
})

const ingredientSchema = yup.object({
    name: yup.string().trim().required('Tên nguyên liệu là bắt buộc'),
    unit: yup.string().trim().required('Đơn vị là bắt buộc'),
    reorderLevel: yup
        .number()
        .nullable()
        .transform((value, original) => (original === '' || original === null ? null : value))
        .min(0, 'Mức đặt lại không thể âm')
})

const adjustSchema = yup.object({
    newQuantityOnHand: yup
        .number()
        .required('Số lượng mới là bắt buộc')
        .min(0, 'Số lượng không thể âm'),
    reason: yup.string().nullable().transform((value) => (value === '' ? null : value))
})

const query = useQuery({
    queryKey: computed(() => ['ingredients', { page: zeroBasedPage.value, size: pageSize.value, keyword: debouncedSearch.value }]),
    queryFn: ({ queryKey }) => {
        const [, params] = queryKey
        return getIngredients({ page: params.page, size: params.size, name: params.keyword || undefined })
    },
    keepPreviousData: true
})

const { data, isLoading, isError, error, isFetching, refetch } = query

const tableData = computed(() => data.value?.content ?? [])

// Cập nhật pagination từ response
watch(data, (newData) => {
    if (newData) {
        pagination.updateFromResponse({
            page: newData.number ?? zeroBasedPage.value,
            totalPages: newData.totalPages ?? 0,
            totalElements: newData.totalElements ?? 0
        })
    }
}, { immediate: true })

const totalElements = computed(() => pagination.totalElements)

const lowStockCount = computed(() =>
    tableData.value.filter((item) => item.reorderLevel !== null && Number(item.quantityOnHand ?? 0) <= Number(item.reorderLevel)).length
)

const totalOnHand = computed(() =>
    tableData.value.reduce((sum, item) => sum + Number(item.quantityOnHand ?? 0), 0)
)

const stats = computed(() => [
    {
        label: 'Tổng nguyên liệu',
        value: formatNumber(totalElements.value, { maximumFractionDigits: 0 }),
        icon: 'bi bi-droplet-half',
        variant: 'variant-primary'
    },
    {
        label: 'Đang thiếu hụt',
        value: formatNumber(lowStockCount.value, { maximumFractionDigits: 0 }),
        icon: 'bi bi-exclamation-triangle',
        variant: 'variant-warning'
    },
    {
        label: 'Tổng tồn kho (trang)',
        value: formatNumber(totalOnHand.value),
        icon: 'bi bi-archive',
        variant: 'variant-success'
    }
])

const errorMessage = computed(() => error.value?.response?.data?.message || error.value?.message || 'Không thể tải dữ liệu nguyên liệu.')

const formatQuantity = (value) => formatNumber(value, { minimumFractionDigits: 0, maximumFractionDigits: 2 })

const openModal = (ingredient = null) => {
    if (ingredient) {
        isEditing.value = true
        formData.id = ingredient.id
        formData.name = ingredient.name
        formData.unit = ingredient.unit
        formData.reorderLevel = ingredient.reorderLevel ?? ''
    } else {
        isEditing.value = false
        formData.id = null
        formData.name = ''
        formData.unit = ''
        formData.reorderLevel = ''
    }
    bsModal.value?.show()
}

const closeModal = () => {
    bsModal.value?.hide()
}

const openAdjustModal = (ingredient) => {
    adjustData.ingredientId = ingredient.id
    adjustData.name = ingredient.name
    adjustData.currentStock = Number(ingredient.quantityOnHand ?? 0)
    adjustData.newQuantityOnHand = ingredient.quantityOnHand ?? ''
    adjustData.reason = ''
    bsAdjustModal.value?.show()
}

const closeAdjustModal = () => {
    bsAdjustModal.value?.hide()
}

const createMutation = useMutation({
    mutationFn: createIngredient,
    onSuccess: () => {
        showSuccess('Tạo nguyên liệu thành công!')
        queryClient.invalidateQueries({ queryKey: ['ingredients'] })
        closeModal()
    },
    onError: (err) => showError(err.response?.data?.message || 'Không thể tạo nguyên liệu.')
})

const updateMutation = useMutation({
    mutationFn: updateIngredient,
    onSuccess: () => {
        showSuccess('Cập nhật nguyên liệu thành công!')
        queryClient.invalidateQueries({ queryKey: ['ingredients'] })
        closeModal()
    },
    onError: (err) => showError(err.response?.data?.message || 'Không thể cập nhật nguyên liệu.')
})

const deleteMutation = useMutation({
    mutationFn: deleteIngredient,
    onSuccess: () => {
        showSuccess('Xoá nguyên liệu thành công!')
        queryClient.invalidateQueries({ queryKey: ['ingredients'] })
    },
    onError: (err) => showError(err.response?.data?.message || 'Không thể xoá nguyên liệu.')
})

const adjustMutation = useMutation({
    mutationFn: adjustInventory,
    onSuccess: () => {
        showSuccess('Điều chỉnh tồn kho thành công!')
        queryClient.invalidateQueries({ queryKey: ['ingredients'] })
        closeAdjustModal()
    },
    onError: (err) => showError(err.response?.data?.message || err.message || 'Không thể điều chỉnh tồn kho.')
})

const handleSubmit = () => {
    const payload = {
        name: formData.name,
        unit: formData.unit,
        reorderLevel: formData.reorderLevel
    }

    if (isEditing.value) {
        updateMutation.mutate({ id: formData.id, data: payload })
    } else {
        createMutation.mutate(payload)
    }
}

const handleAdjustSubmit = async (values) => {
    const newQuantity = Number(values.newQuantityOnHand)
    const currentQuantity = adjustData.currentStock
    const difference = newQuantity - currentQuantity

    // Kiểm tra kho trước khi chỉnh
    const checkResult = await checkInventoryBeforeAdjust({
        ingredientId: adjustData.ingredientId,
        currentQuantity,
        newQuantity,
        difference
    })

    if (!checkResult?.confirmed) {
        return // User cancelled
    }

    // Nếu có cảnh báo nhưng user vẫn muốn tiếp tục
    adjustMutation.mutate({
        ingredientId: adjustData.ingredientId,
        newQuantityOnHand: values.newQuantityOnHand,
        reason: values.reason
    })
}

const adjustConfirmData = ref(null)

const checkInventoryBeforeAdjust = async ({ ingredientId, currentQuantity, newQuantity, difference }) => {
    // Tìm nguyên liệu để lấy thông tin reorderLevel
    const ingredient = tableData.value.find(item => item.id === ingredientId)
    const reorderLevel = ingredient?.reorderLevel ? Number(ingredient.reorderLevel) : null

    // Tính toán thông tin
    const isDecrease = difference < 0
    const isIncrease = difference > 0
    const willBeBelowReorder = reorderLevel !== null && newQuantity < reorderLevel
    const isCurrentlyBelowReorder = reorderLevel !== null && currentQuantity < reorderLevel

    adjustConfirmData.value = {
        ingredientId,
        name: adjustData.name,
        currentQuantity,
        newQuantity,
        difference,
        isIncrease,
        isDecrease,
        willBeBelowReorder,
        isCurrentlyBelowReorder,
        reorderLevel
    }

    return new Promise((resolve) => {
        nextTick(() => {
            adjustConfirmModalInstance?.show()
            // Store resolve để sử dụng trong handleAdjustConfirm
            adjustConfirmData.value.resolve = resolve
        })
    })
}

const handleAdjustConfirm = () => {
    if (adjustConfirmData.value?.resolve) {
        adjustConfirmData.value.resolve({ confirmed: true })
        adjustConfirmModalInstance?.hide()
        adjustConfirmData.value = null
    }
}

const handleAdjustCancel = () => {
    if (adjustConfirmData.value?.resolve) {
        adjustConfirmData.value.resolve({ confirmed: false })
        adjustConfirmModalInstance?.hide()
        adjustConfirmData.value = null
    }
}

const deleteTarget = ref(null)

const handleDelete = (ingredient) => {
    deleteTarget.value = ingredient
    nextTick(() => {
        deleteModalInstance?.show()
    })
}

const handleDeleteConfirm = () => {
    if (deleteTarget.value) {
        deleteMutation.mutate(deleteTarget.value.id)
        deleteModalInstance?.hide()
    }
}

const closeDeleteModal = () => {
    deleteModalInstance?.hide()
    deleteTarget.value = null
}

const getStatusLabel = (ingredient) => {
    if (ingredient.reorderLevel === null) return 'Không theo dõi'
    return Number(ingredient.quantityOnHand ?? 0) <= Number(ingredient.reorderLevel) ? 'Thiếu hụt' : 'Đủ hàng'
}

const getStatusBadge = (ingredient) => {
    if (ingredient.reorderLevel === null) return 'bg-secondary-subtle text-secondary'
    return Number(ingredient.quantityOnHand ?? 0) <= Number(ingredient.reorderLevel)
        ? 'bg-danger-subtle text-danger'
        : 'bg-success-subtle text-success'
}

const handlePageChange = (page) => {
    // page từ Pagination component là zero-based index
    setPage(page)
}
</script>

<style scoped>
/* Header - Chuẩn hóa theo base.css */
.ingredients-header {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    margin-bottom: var(--spacing-4);
}

.ingredients-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    flex-wrap: wrap;
}

.ingredients-header__title-section {
    flex: 1;
    min-width: 0;
}

.ingredients-header__title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.ingredients-header__subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.ingredients-header__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    flex-wrap: wrap;
    justify-content: flex-end;
}

.ingredients-header__actions .btn {
    font-size: var(--font-size-base);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.ingredients-header__actions .btn-primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.ingredients-header__actions .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-dark);
}

.ingredients-header__actions .btn-outline-secondary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.ingredients-header__actions .btn-outline-secondary:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.ingredients-header__actions .btn i {
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

.stat-icon.variant-warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
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

.search-group :global(.input-group-text) {
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
    border-right: none;
    color: var(--color-text-muted);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm) 0 0 var(--radius-sm);
}

.search-group :global(.form-control) {
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

/* Badge - Flat Design */
.table-card :global(.badge) {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    border: 1px solid transparent;
    font-family: var(--font-family-sans);
}

.table-card :global(.bg-secondary-subtle) {
    background: var(--color-card-muted) !important;
    color: var(--color-text-muted) !important;
    border-color: var(--color-border);
}

.table-card :global(.bg-danger-subtle) {
    background: var(--color-soft-rose) !important;
    color: var(--color-danger) !important;
    border-color: var(--color-danger);
}

.table-card :global(.bg-success-subtle) {
    background: var(--color-soft-emerald) !important;
    color: var(--color-success) !important;
    border-color: var(--color-success);
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
.ingredients-page :global(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.ingredients-page :global(.modal-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
}

.ingredients-page :global(.modal-header .modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

.ingredients-page :global(.modal-header .text-muted.small) {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    margin-top: var(--spacing-1);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

.ingredients-page :global(.modal-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.ingredients-page :global(.modal-body p) {
    font-family: var(--font-family-sans);
}

.ingredients-page :global(.modal-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
}

.ingredients-page :global(.modal-body .form-label) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.ingredients-page :global(.modal-body .form-control),
.ingredients-page :global(.modal-body .form-select) {
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

.ingredients-page :global(.modal-body .form-control:focus),
.ingredients-page :global(.modal-body .form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.ingredients-page :global(.modal-body textarea.form-control) {
    height: auto;
    min-height: 80px;
    resize: vertical;
    font-family: var(--font-family-sans);
}

.ingredients-page :global(.modal-body .form-control.is-invalid) {
    border-color: var(--color-danger);
}

.ingredients-page :global(.modal-body .form-text) {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.ingredients-page :global(.modal-body .invalid-feedback) {
    font-size: var(--font-size-sm);
    color: var(--color-danger);
    margin-top: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.ingredients-page :global(.modal-footer .btn) {
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

.ingredients-page :global(.modal-footer .btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.ingredients-page :global(.modal-footer .btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.ingredients-page :global(.modal-footer .btn-primary:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

.ingredients-page :global(.modal-footer .btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.ingredients-page :global(.modal-footer .btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.ingredients-page :global(.modal-footer .btn-danger) {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-text-inverse);
}

.ingredients-page :global(.modal-footer .btn-danger:hover:not(:disabled)) {
    background: var(--color-danger-dark);
}

.ingredients-page :global(.modal-footer .btn-danger:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Inventory Summary - Chuẩn hóa */
.inventory-summary {
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
    border-radius: var(--radius-sm);
    padding: var(--spacing-4);
    margin-bottom: var(--spacing-4);
}

.inventory-summary__title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.inventory-summary__text {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

.inventory-summary__text strong {
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
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

/* Confirm Info Card - Chuẩn hóa */
.confirm-info-card {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
    margin-bottom: var(--spacing-4);
}

.confirm-info-card__title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-3);
    font-family: var(--font-family-sans);
}

.confirm-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-3);
}

.confirm-info-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.confirm-info-label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.confirm-info-value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.confirm-info-value--success {
    color: var(--color-success);
}

.confirm-info-value--danger {
    color: var(--color-danger);
}

/* Error Message - Thay thế alert */
.error-message {
    padding: var(--spacing-3) var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid;
    background: var(--color-card-muted);
    font-size: var(--font-size-base);
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.error-message i {
    font-size: 18px;
    line-height: 1;
    flex-shrink: 0;
    margin-top: 2px;
}

.error-message strong {
    font-family: var(--font-family-sans);
}

.error-message--warning {
    border-color: var(--color-warning);
    color: var(--color-warning);
    background: var(--color-soft-amber);
}

.error-message--danger {
    border-color: var(--color-danger);
    color: var(--color-danger);
    background: var(--color-soft-rose);
}

/* Global Button Styles - Đồng bộ với các trang trước */
.ingredients-page :global(.btn-primary) {
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

.ingredients-page :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.ingredients-page :global(.btn-primary:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

.ingredients-page :global(.btn-primary i) {
    font-size: 18px;
    line-height: 1;
}

.ingredients-page :global(.btn-outline-primary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.ingredients-page :global(.btn-outline-primary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.ingredients-page :global(.btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.ingredients-page :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.ingredients-page :global(.btn-danger) {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-text-inverse);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.ingredients-page :global(.btn-danger:hover:not(:disabled)) {
    background: var(--color-danger-dark);
}

.ingredients-page :global(.btn-sm) {
    padding: var(--spacing-1) var(--spacing-3);
    font-size: var(--font-size-sm);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

/* Responsive */
@media (max-width: 768px) {
    .ingredients-header__content {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-3);
    }

    .ingredients-header__actions {
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

    .confirm-info-grid {
        grid-template-columns: 1fr;
    }
}
</style>
