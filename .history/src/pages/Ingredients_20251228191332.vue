<template>
  <!-- Ingredient Modal -->
  <div   >
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
      class="page-container container-fluid"
        
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
              class="btn btn-primary"
              type="button"
              @click="openModal()"
            >
              <i class="bi bi-plus-lg me-2" />
              Thêm nguyên liệu
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
                  v-model="tableData.searchKeyword.value"
                  type="text"
                  class="form-control"
                  placeholder="Nhập tên nguyên liệu"
                >
              </div>
            </div>
            <div class="col-lg-3 col-md-6">
              <label class="form-label">Trạng thái</label>
              <select
                v-model="filters.status"
                class="form-select"
                @change="handleFilterChange"
              >
                <option :value="null">
                  Tất cả trạng thái
                </option>
                <option value="sufficient">
                  Đủ hàng
                </option>
                <option value="low">
                  Thiếu hụt
                </option>
                <option value="notracked">
                  Không theo dõi
                </option>
              </select>
            </div>
            <div class="col-lg-3 col-md-6">
              <label class="form-label">Đơn vị</label>
              <select
                v-model="filters.unit"
                class="form-select"
                @change="handleFilterChange"
              >
                <option :value="null">
                  Tất cả đơn vị
                </option>
                <option
                  v-for="unit in unitOptions"
                  :key="unit"
                  :value="unit"
                >
                  {{ unit }}
                </option>
              </select>
            </div>
            <div class="col-lg-2 col-md-6">
              <label class="form-label">&nbsp;</label>
              <button
                class="btn btn-outline-secondary w-100"
                type="button"
                :disabled="tableData.loading.value"
                @click="resetFilters"
              >
                <i class="bi bi-arrow-counterclockwise" /> Đặt lại
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="card table-card">
        <div class="card-body p-0">
          <LoadingState
            v-if="tableData.loading.value"
            text="Đang tải dữ liệu nguyên liệu..."
          />
          <ErrorState
            v-else-if="tableData.error.value"
            :message="errorMessage"
            :show-retry="true"
            :retry-handler="fetchAllIngredients"
          />
          <template v-else>
            <EmptyState
              v-if="!ingredients.length"
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
                    <th
                      scope="col"
                      class="text-center"
                    >
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
                    v-for="ingredient in ingredients"
                    :key="ingredient.id"
                  >
                    <td class="fw-semibold">
                      {{ ingredient.name }}
                    </td>
                    <td class="text-center">
                      {{ ingredient.unit }}
                    </td>
                    <td class="text-end text-nowrap">
                      {{ formatQuantity(ingredient.quantityOnHand) }}
                    </td>
                    <td class="text-end text-nowrap">
                      {{ ingredient.reorderLevel !== null ? formatQuantity(ingredient.reorderLevel) : '—' }}
                    </td>
                    <td class="text-center">
                      <span
                        class="badge badge-status"
                        :class="getStatusBadgeClass(ingredient)"
                        :aria-label="`Trạng thái: ${getStatusLabel(ingredient)}`"
                      >
                        {{ getStatusLabel(ingredient) }}
                      </span>
                    </td>
                    <td class="text-end action-cell">
                      <div class="dropdown d-inline-flex justify-content-end">
                        <button
                          class="btn btn-sm btn-outline-secondary action-menu-btn"
                          type="button"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          title="Thao tác"
                        >
                          <i class="bi bi-three-dots-vertical" />
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                          <li>
                            <button
                              class="dropdown-item"
                              type="button"
                              @click="openAdjustModal(ingredient)"
                            >
                              <i class="bi bi-sliders me-2" />
                              Điều chỉnh tồn kho
                            </button>
                          </li>
                          <li>
                            <hr class="dropdown-divider">
                            <button
                              class="dropdown-item"
                              type="button"
                              @click="openModal(ingredient)"
                            >
                              <i class="bi bi-pencil me-2" />
                              Chỉnh sửa
                            </button>
                          </li>
                          <li>
                            <hr class="dropdown-divider">
                            <button
                              class="dropdown-item dropdown-item--danger"
                              type="button"
                              @click="handleDelete(ingredient)"
                            >
                              <i class="bi bi-trash me-2" />
                              Xóa
                            </button>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>
        <div
          v-if="filteredTotalPages > 1 || pageSize"
          class="d-flex justify-content-between align-items-center mt-3 pagination-wrapper"
        >
          <!-- Page Size Selector -->
          <div
            v-if="pageSize"
            class="d-flex align-items-center gap-2"
          >
            <label class="mb-0 text-muted small">
              Hiển thị:
            </label>
            <select
              :value="pageSize"
              class="form-select form-select-sm page-size-select"
              @change="handlePageSizeChange(parseInt($event.target.value, 10))"
            >
              <option :value="10">
                10
              </option>
              <option :value="20">
                20
              </option>
              <option :value="30">
                30
              </option>
              <option :value="50">
                50
              </option>
            </select>
            <span class="text-muted small">
              / trang
            </span>
          </div>
          <div v-else />
          <!-- Pagination -->
          <Pagination
            v-if="filteredTotalPages > 1"
            mode="zero-based"
            :current-page="zeroBasedPage"
            :total-pages="filteredTotalPages"
            @page-change="setPageFromZero"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { Modal } from 'bootstrap'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'

import Pagination from '@/components/common/Pagination.vue'
import { getIngredients, createIngredient, updateIngredient, deleteIngredient, adjustInventory } from '@/api/ingredientService'
import { useTableData } from '@/composables/useTableData'
import { showSuccess, showError } from '@/utils/toast'
import { formatNumber } from '@/utils/formatters'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'

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

const pageSizeOptions = [10, 25, 50]

// Filters
const filters = reactive({
    status: null, // 'sufficient', 'low', 'notracked'
    unit: null
})

// Fetch tất cả data để có thể filter client-side
const allIngredientsData = ref([])
const isLoadingAll = ref(false)

// Sử dụng useTableData cho sync URL và search
const tableData = useTableData({
    fetchFn: async (params) => {
        isLoadingAll.value = true
        try {
            const response = await getIngredients({
                page: 0,
                size: 1000, // Fetch tất cả
                name: params.searchKeyword || undefined
            })
            const data = response?.content || response?.data || (Array.isArray(response) ? response : [])
            allIngredientsData.value = data
            return {
                content: data,
                totalElements: data.length,
                totalPages: 1
            }
        } catch (err) {
            console.error('[Ingredients] Error fetching all data:', err)
            allIngredientsData.value = []
            return {
                content: [],
                totalElements: 0,
                totalPages: 1
            }
        } finally {
            isLoadingAll.value = false
        }
    },
    initialPageSize: pageSizeOptions[0],
    debounceMs: 300,
    syncUrl: true,
    pageParam: 'page',
    sizeParam: 'size',
    searchParam: 'search',
    zeroBasedPage: true,
    enablePagination: false // Tắt server-side pagination, dùng client-side
})

// Fetch tất cả data
const fetchAllIngredients = async () => {
    await tableData.fetchData()
}

// Watch search keyword để fetch lại
watch(() => tableData.searchKeyword.value, () => {
    fetchAllIngredients()
}, { debounce: 300 })

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
    // Fetch data khi mount
    fetchAllIngredients()
})

onUnmounted(() => {
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

// Lấy dữ liệu từ allIngredientsData
const allIngredients = computed(() => allIngredientsData.value || [])

// Unit options từ danh sách nguyên liệu
const unitOptions = computed(() => {
    const units = new Set()
    allIngredients.value.forEach(ingredient => {
        if (ingredient.unit) {
            units.add(ingredient.unit)
        }
    })
    return Array.from(units).sort()
})

// Filtered ingredients
const ingredients = computed(() => {
    let filtered = [...allIngredients.value]

    // Filter by status
    if (filters.status) {
        filtered = filtered.filter(ingredient => {
            if (filters.status === 'notracked') {
                return ingredient.reorderLevel === null
            }
            if (ingredient.reorderLevel === null) return false
            const quantity = Number(ingredient.quantityOnHand ?? 0)
            const reorderLevel = Number(ingredient.reorderLevel)
            if (filters.status === 'sufficient') {
                return quantity > reorderLevel
            }
            if (filters.status === 'low') {
                return quantity <= reorderLevel
            }
            return true
        })
    }

    // Filter by unit
    if (filters.unit) {
        filtered = filtered.filter(ingredient => ingredient.unit === filters.unit)
    }

    return filtered
})

// Page size
const pageSize = computed(() => tableData.pageSize.value)

// Page size change handler
const handlePageSizeChange = (size) => {
    tableData.setPageSize(size)
    // Reset về trang đầu khi thay đổi page size
    zeroBasedPage.value = 0
}

// Filter change handler
const handleFilterChange = () => {
    // Reset về trang đầu khi filter thay đổi
    zeroBasedPage.value = 0
}

// Reset filters
const resetFilters = () => {
    filters.status = null
    filters.unit = null
    handleFilterChange()
}
const totalElements = computed(() => tableData.totalElements.value)

const lowStockCount = computed(() =>
    allIngredients.value.filter((item) => item.reorderLevel !== null && Number(item.quantityOnHand ?? 0) <= Number(item.reorderLevel)).length
)

const totalOnHand = computed(() =>
    allIngredients.value.reduce((sum, item) => sum + Number(item.quantityOnHand ?? 0), 0)
)

// Client-side pagination cho filtered data
const filteredTotalElements = computed(() => ingredients.value.length)
const filteredTotalPages = computed(() => Math.ceil(filteredTotalElements.value / pageSize.value) || 1)

// Zero-based page cho client-side pagination
const zeroBasedPage = ref(0)


// Set page handler
const setPageFromZero = (page) => {
    zeroBasedPage.value = Math.max(0, Math.min(page, filteredTotalPages.value - 1))
}

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

const errorMessage = computed(() => {
    const err = tableData.error.value
    return err?.response?.data?.message || err?.message || 'Không thể tải dữ liệu nguyên liệu.'
})

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
        fetchAllIngredients() // Refresh data
        closeModal()
    },
    onError: (err) => showError(err.response?.data?.message || 'Không thể tạo nguyên liệu.')
})

const updateMutation = useMutation({
    mutationFn: updateIngredient,
    onSuccess: () => {
        showSuccess('Cập nhật nguyên liệu thành công!')
        fetchAllIngredients() // Refresh data
        closeModal()
    },
    onError: (err) => showError(err.response?.data?.message || 'Không thể cập nhật nguyên liệu.')
})

const deleteMutation = useMutation({
    mutationFn: deleteIngredient,
    onSuccess: () => {
        showSuccess('Xoá nguyên liệu thành công!')
        fetchAllIngredients() // Refresh data
    },
    onError: (err) => showError(err.response?.data?.message || 'Không thể xoá nguyên liệu.')
})

const adjustMutation = useMutation({
    mutationFn: adjustInventory,
    onSuccess: () => {
        showSuccess('Điều chỉnh tồn kho thành công!')
        fetchAllIngredients() // Refresh data
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

const getStatusBadgeClass = (ingredient) => {
    if (ingredient.reorderLevel === null) return 'badge-status--default'
    return Number(ingredient.quantityOnHand ?? 0) <= Number(ingredient.reorderLevel)
        ? 'badge-status--danger'
        : 'badge-status--success'
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
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
    display: inline-flex;
    align-items: center;
    font-family: var(--font-family-sans);
}

.ingredients-header__actions .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-dark);
    border-color: var(--color-primary-dark);
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
    width: 64px;
    height: 64px;
    border-radius: var(--radius-sm);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
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
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    font-size: 32px;
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

/* Badge System - Chuẩn hóa theo tiêu chuẩn */
.badge {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    border: 1px solid;
    white-space: nowrap;
    line-height: 1.4;
}

/* Status Badges */
.badge-status {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    border: 1px solid;
    white-space: nowrap;
    line-height: 1.4;
}

.badge-status--success,
.badge-status--active {
    background: rgba(34, 197, 94, 0.18);
    border-color: #22c55e;
    color: #22c55e;
}

.badge-status--warning,
.badge-status--pending {
    background: rgba(251, 191, 36, 0.18);
    border-color: #f59e0b;
    color: #f59e0b;
}

.badge-status--danger,
.badge-status--cancelled {
    background: rgba(244, 63, 94, 0.18);
    border-color: #ef4444;
    color: #ef4444;
}

.badge-status--info,
.badge-status--transferred {
    background: rgba(14, 165, 233, 0.18);
    border-color: #0ea5e9;
    color: #0ea5e9;
}

.badge-status--default,
.badge-status--inactive {
    background: var(--color-card-muted);
    border-color: var(--color-border);
    color: var(--color-text-muted);
}

/* Type Badges */
.badge-type {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    border: 1px solid;
    white-space: nowrap;
    line-height: 1.4;
}

.badge-type--primary,
.badge-type--percentage {
    background: rgba(14, 165, 233, 0.18);
    border-color: #0ea5e9;
    color: #0ea5e9;
}

.badge-type--secondary,
.badge-type--fixed {
    background: var(--color-card-muted);
    border-color: var(--color-border);
    color: var(--color-text-muted);
}

.badge-type--success,
.badge-type--premium {
    background: rgba(34, 197, 94, 0.18);
    border-color: #22c55e;
    color: #22c55e;
}

/* Action Cell - Đảm bảo căn chỉnh đúng */
.action-cell {
    text-align: right !important;
}

.action-cell .dropdown {
    display: inline-flex;
    justify-content: flex-end;
    width: 100%;
}

/* Action Menu Button - Dropdown */
.action-menu-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    margin-left: auto;
}

.action-menu-btn i {
    font-size: 16px;
    line-height: 1;
}

/* Dropdown Menu Styles */
.ingredients-page :global(.dropdown-menu) {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: var(--spacing-1);
    background: var(--color-card);
    min-width: 200px;
}

.ingredients-page :global(.dropdown-item) {
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    color: var(--color-heading);
    transition: all var(--transition-base);
    display: flex;
    align-items: center;
    font-family: var(--font-family-sans);
}

.ingredients-page :global(.dropdown-item:hover) {
    background: var(--color-card-muted);
    color: var(--color-heading);
}

.ingredients-page :global(.dropdown-item--danger) {
    color: var(--color-danger);
}

.ingredients-page :global(.dropdown-item--danger:hover) {
    background: var(--color-danger);
    color: var(--color-text-inverse);
}

.ingredients-page :global(.dropdown-divider) {
    margin: var(--spacing-1) 0;
    border-color: var(--color-border);
    opacity: 0.5;
}

/* Action Buttons - Thiết kế đồng bộ */
.action-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    justify-content: flex-end;
}

.action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 36px;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid;
    background: var(--color-card);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
    white-space: nowrap;
    cursor: pointer;
    font-family: var(--font-family-sans);
}

.action-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
}

.action-button i {
    font-size: 18px;
    line-height: 1;
}

/* Primary (Chỉnh sửa) */
.action-button--primary {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.action-button--primary:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.18);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

/* Info (Điều chỉnh) */
.action-button--info {
    border-color: #0ea5e9;
    color: #0ea5e9;
    background: var(--color-card);
}

.action-button--info:hover:not(:disabled) {
    background: rgba(14, 165, 233, 0.18);
    border-color: #0284c7;
    color: #0284c7;
}

/* Danger (Xóa) */
.action-button--danger {
    border-color: var(--color-danger);
    color: var(--color-danger);
    background: var(--color-card);
}

.action-button--danger:hover:not(:disabled) {
    background: var(--color-danger);
    color: var(--color-text-inverse);
    border-color: var(--color-danger);
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

    .action-grid {
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

.pagination-wrapper {
    margin-bottom: 80px;
}

.page-size-select {
    width: auto;
    min-width: 80px;
}
</style>
