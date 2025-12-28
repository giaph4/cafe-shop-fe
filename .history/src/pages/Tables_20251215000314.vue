<template>
  <div   >
    <Teleport to="body">
      <div
        ref="modalElement"
        class="modal fade table-edit-modal"
        tabindex="-1"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <div>
                <h5 class="modal-title">
                  {{ isEditing ? 'Cập nhật bàn' : 'Thêm bàn mới' }}
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
              v-slot="{ errors, isSubmitting }"
              :validation-schema="tableSchema"
              @submit="handleSubmit"
            >
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label fw-semibold">Tên bàn <span class="text-danger">*</span></label>
                  <Field
                    v-model="formData.name"
                    name="name"
                    type="text"
                    class="form-control"
                    :class="{'is-invalid': errors.name}"
                    autocomplete="off"
                    maxlength="60"
                    :disabled="createMutation.isPending.value || updateMutation.isPending.value"
                  />
                  <ErrorMessage
                    name="name"
                    class="invalid-feedback"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label fw-semibold">Sức chứa (số chỗ) <span class="text-danger">*</span></label>
                  <Field
                    v-model="formData.capacity"
                    name="capacity"
                    type="number"
                    class="form-control"
                    :class="{'is-invalid': errors.capacity}"
                    min="1"
                    max="50"
                    step="1"
                    :disabled="createMutation.isPending.value || updateMutation.isPending.value"
                  />
                  <ErrorMessage
                    name="capacity"
                    class="invalid-feedback"
                  />
                </div>
              </div>
              <div class="modal-footer">
                <button
                  v-if="isEditing && canManage"
                  type="button"
                  class="btn btn-danger"
                  :disabled="isSubmitting || createMutation.isPending.value || updateMutation.isPending.value || deleteMutation.isPending.value"
                  @click="handleDeleteFromModal"
                >
                  <span
                    v-if="deleteMutation.isPending.value"
                    class="spinner-border spinner-border-sm"
                  />
                  <i
                    v-else
                    class="bi bi-trash"
                  />
                  Xóa bàn
                </button>
                <div class="ms-auto d-flex gap-2">
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    :disabled="isSubmitting || createMutation.isPending.value || updateMutation.isPending.value"
                    @click="closeModal"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    class="btn btn-primary"
                    :disabled="isSubmitting || createMutation.isPending.value || updateMutation.isPending.value"
                  >
                    <span
                      v-if="isSubmitting || createMutation.isPending.value || updateMutation.isPending.value"
                      class="spinner-border spinner-border-sm"
                    />
                    <i
                      v-else
                      class="bi"
                      :class="isEditing ? 'bi-check-circle' : 'bi-plus-lg'"
                    />
                    {{ isEditing ? 'Cập nhật' : 'Tạo mới' }}
                  </button>
                </div>
              </div>
            </Form>
          </div>
        </div>
      </div>

      <div
        id="deleteTableModal"
        ref="deleteModalElement"
        class="modal fade table-delete-modal"
        tabindex="-1"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <div>
                <h5 class="modal-title">
                  Xóa bàn
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
                Bạn có chắc chắn muốn xóa bàn này không?
              </p>
              <div
                class="card"
                style="background: var(--color-card-muted); border: 1px solid var(--color-border); border-radius: var(--radius-sm);"
              >
                <div class="card-body">
                  <div class="mb-2">
                    <strong
                      class="d-block mb-1"
                      style="color: var(--color-text-muted); font-family: var(--font-family-sans);"
                    >Tên bàn:</strong>
                    <span style="font-family: var(--font-family-sans); color: var(--color-heading);">{{ deleteTarget?.name || '—' }}</span>
                  </div>
                  <div class="mb-0">
                    <strong
                      class="d-block mb-1"
                      style="color: var(--color-text-muted); font-family: var(--font-family-sans);"
                    >Sức chứa:</strong>
                    <span style="font-family: var(--font-family-sans); color: var(--color-heading);">{{ deleteTarget?.capacity || '—' }} chỗ</span>
                  </div>
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
                  class="spinner-border spinner-border-sm"
                />
                <i
                  v-else
                  class="bi bi-trash"
                />
                Xóa bàn
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <div
      class="page-container container-fluid"
        
      style="background: var(--color-body-bg); padding: var(--spacing-4);"
    >
      <header class="tables-header">
        <div>
          <h2>Quản lý bàn</h2>
        </div>
        <div class="tables-header__actions">
          <div
            class="btn-group layout-toggle"
            role="group"
            aria-label="Chọn bố cục hiển thị"
          >
            <button
              type="button"
              class="btn btn-sm"
              :class="layoutMode === 'table' ? 'btn-primary' : 'btn-outline-primary'"
              @click="layoutMode = 'table'"
            >
              <i class="bi bi-table me-2" />Bảng
            </button>
            <button
              type="button"
              class="btn btn-sm"
              :class="layoutMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'"
              @click="layoutMode = 'grid'"
            >
              <i class="bi bi-grid-3x3-gap me-2" />Thẻ
            </button>
          </div>
          <button
            v-if="canManage"
            class="btn btn-primary"
            type="button"
            @click="openModal()"
          >
            <i class="bi bi-plus-lg" />
            Thêm bàn mới
          </button>
        </div>
      </header>

      <div class="card filter-card mb-4">
        <div class="card-body">
          <div class="filter-grid">
            <div class="filter-item">
              <label class="form-label">Tìm theo tên</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-search" /></span>
                <input
                  v-model.trim="filterState.name"
                  type="text"
                  class="form-control"
                  placeholder="Nhập tên bàn"
                >
              </div>
            </div>
            <div class="filter-item">
              <label class="form-label">Trạng thái</label>
              <select
                v-model="filterState.status"
                class="form-select"
              >
                <option value="">
                  Tất cả trạng thái
                </option>
                <option
                  v-for="status in TABLE_STATUS_OPTIONS"
                  :key="status.value"
                  :value="status.value"
                >
                  {{ status.label }}
                </option>
              </select>
            </div>
            <div class="filter-item">
              <label class="form-label">Sức chứa</label>
              <select
                v-model="filterState.capacity"
                class="form-select"
              >
                <option value="">
                  Tất cả
                </option>
                <option value="1-2">
                  1 - 2 chỗ
                </option>
                <option value="3-4">
                  3 - 4 chỗ
                </option>
                <option value="5-8">
                  5 - 8 chỗ
                </option>
                <option value="9+">
                  9+ chỗ
                </option>
              </select>
            </div>
            <div class="filter-item">
              <label class="form-label">Sắp xếp</label>
              <select
                v-model="sortState"
                class="form-select"
              >
                <option value="name-asc">
                  Tên A → Z
                </option>
                <option value="name-desc">
                  Tên Z → A
                </option>
                <option value="capacity-asc">
                  Sức chứa tăng dần
                </option>
                <option value="capacity-desc">
                  Sức chứa giảm dần
                </option>
              </select>
            </div>
            <div class="filter-actions">
              <button
                class="btn btn-outline-secondary"
                type="button"
                @click="resetFilters"
              >
                Đặt lại
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="card tabs-card">
        <div class="card-body">
          <LoadingState
            v-if="tableData.loading.value"
            text="Đang tải danh sách bàn..."
          />
          <ErrorState
            v-else-if="tableData.error.value"
            :message="tableData.error.value?.message || 'Không thể tải dữ liệu bàn. Vui lòng thử lại sau.'"
            :show-retry="true"
            :retry-handler="() => tableData.fetchData()"
          />
          <template v-else>
            <EmptyState
              v-if="sortedTables.length === 0"
              title="Không tìm thấy bàn"
              :message="hasActiveFilters ? 'Không tìm thấy bàn nào phù hợp với bộ lọc hiện tại.' : 'Chưa có bàn nào. Hãy tạo bàn đầu tiên.'"
            >
              <template #icon>
                <i class="bi bi-table" />
              </template>
              <template
                v-if="!hasActiveFilters && canManage"
                #action
              >
                <button
                  class="btn btn-primary"
                  @click="openModal()"
                >
                  <i class="bi bi-plus-lg" />
                  Tạo bàn đầu tiên
                </button>
              </template>
            </EmptyState>
            <div v-else>
              <!-- Table View -->
              <div
                v-if="layoutMode === 'table'"
                class="table-responsive"
              >
                <table class="table align-middle table-hover">
                  <thead>
                    <tr>
                      <th>Tên bàn</th>
                      <th>Chỗ</th>
                      <th>Trạng thái</th>
                      <th class="text-center">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="table in paginatedTables"
                      :key="table.id"
                    >
                      <td class="fw-semibold">
                        {{ table.name }}
                      </td>
                      <td>
                        <div class="table-capacity-badge">
                          <i class="bi bi-people-fill" />
                          <strong>{{ table.capacity }}</strong>
                        </div>
                      </td>
                      <td>
                        <span
                          class="badge badge-status"
                          :class="getStatusBadgeClass(table.status)"
                          :aria-label="`Trạng thái: ${getStatusMeta(table.status).label}`"
                        >
                          <i :class="getStatusMeta(table.status).icon" />
                          {{ getStatusMeta(table.status).label }}
                        </span>
                      </td>
                      <td>
                        <div
                          v-if="canManage"
                          class="action-buttons"
                        >
                          <button
                            v-if="table.status === 'EMPTY' || table.status === 'AVAILABLE'"
                            class="action-button action-button--success"
                            type="button"
                            :disabled="createMutation.isPending.value || updateMutation.isPending.value || deleteMutation.isPending.value || statusMutation.isPending.value"
                            title="Tạo đơn"
                            @click="handleCreateOrder(table)"
                          >
                            <i class="bi bi-plus-circle" />
                            <span>Tạo đơn</span>
                          </button>
                          <button
                            v-else-if="table.status === 'SERVING' || table.status === 'OCCUPIED'"
                            class="action-button action-button--warning"
                            type="button"
                            :disabled="createMutation.isPending.value || updateMutation.isPending.value || deleteMutation.isPending.value || statusMutation.isPending.value"
                            title="Xem đơn"
                            @click="handleViewOrder(table)"
                          >
                            <i class="bi bi-receipt" />
                            <span>Xem đơn</span>
                          </button>
                        </div>
                        <span
                          v-else
                          class="text-muted small"
                        >—</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!-- Grid View -->
              <div
                v-else
                class="tables-grid"
              >
                <article
                  v-for="table in paginatedTables"
                  :key="table.id"
                  class="table-card"
                  :class="getStatusVariant(table.status)"
                >
                  <header class="table-card__header">
                    <div class="table-card__header-content">
                      <h3>{{ table.name }}</h3>
                      <span
                        class="badge badge-status"
                        :class="getStatusBadgeClass(table.status)"
                        :aria-label="`Trạng thái: ${getStatusMeta(table.status).label}`"
                      >
                        <i :class="getStatusMeta(table.status).icon" />
                        {{ getStatusMeta(table.status).label }}
                      </span>
                    </div>
                    <button
                      v-if="canManage"
                      class="btn btn-icon btn-icon--subtle"
                      type="button"
                      title="Chỉnh sửa"
                      @click="openModal(table)"
                    >
                      <i class="bi bi-pencil" />
                    </button>
                  </header>

                  <div class="table-card__body">
                    <div class="table-card__info">
                      <div class="table-info-item">
                        <i class="bi bi-people-fill" />
                        <span><strong>{{ table.capacity }}</strong> chỗ</span>
                      </div>
                      <div
                        v-if="table.currentOrder"
                        class="table-info-item"
                      >
                        <i class="bi bi-receipt" />
                        <span>Đơn: #{{ table.currentOrder.id || table.currentOrder.orderId }}</span>
                      </div>
                      <div
                        v-if="table.occupiedAt"
                        class="table-info-item"
                      >
                        <i class="bi bi-clock" />
                        <span>{{ formatOccupiedTime(table.occupiedAt) }}</span>
                      </div>
                      <div
                        v-if="table.currentOrder && table.currentOrder.totalAmount"
                        class="table-info-item table-info-item--highlight"
                      >
                        <i class="bi bi-cash-coin" />
                        <span>{{ formatCurrency(table.currentOrder.totalAmount) }}</span>
                      </div>
                    </div>
                    <div
                      v-if="table.status === 'RESERVED' && table.reservedAt"
                      class="table-card__warning"
                    >
                      <i class="bi bi-calendar-check" />
                      <span>Đã đặt: {{ formatReservationTime(table.reservedAt) }}</span>
                    </div>
                  </div>

                  <footer class="table-card__footer">
                    <div class="table-card__actions">
                      <button
                        v-if="table.status === 'EMPTY' || table.status === 'AVAILABLE'"
                        class="btn btn-sm btn-outline-success"
                        type="button"
                        :disabled="statusMutation.isPending.value"
                        @click="handleCreateOrder(table)"
                      >
                        <i class="bi bi-plus-circle" />
                        Tạo đơn
                      </button>
                      <template v-else-if="table.status === 'SERVING' || table.status === 'OCCUPIED'">
                        <button
                          class="btn btn-sm btn-warning"
                          type="button"
                          :disabled="statusMutation.isPending.value"
                          @click="handleViewOrder(table)"
                        >
                          <i class="bi bi-receipt" />
                          Xem đơn
                        </button>
                        <button
                          class="btn btn-sm btn-primary"
                          type="button"
                          :disabled="statusMutation.isPending.value"
                          @click="handleAddItems(table)"
                        >
                          <i class="bi bi-plus-lg" />
                          Thêm món
                        </button>
                      </template>
                      <button
                        v-else-if="table.status === 'RESERVED'"
                        class="btn btn-sm btn-info"
                        type="button"
                        :disabled="statusMutation.isPending.value"
                        @click="handleCheckIn(table)"
                      >
                        <i class="bi bi-check-circle" />
                        Check-in
                      </button>
                    </div>
                  </footer>
                </article>
              </div>

              <!-- Pagination -->
              <div
                v-if="clientTotalPages > 1 || pageSize"
                class="d-flex justify-content-between align-items-center mt-3"
                style="margin-bottom: 80px;"
              >
                <!-- Page Size Selector -->
                <div
                  v-if="pageSize"
                  class="d-flex align-items-center gap-2"
                >
                  <label
                    class="mb-0 text-muted small"
                    style="font-family: var(--font-family-sans);"
                  >
                    Hiển thị:
                  </label>
                  <select
                    :value="pageSize"
                    class="form-select form-select-sm"
                    style="width: auto; min-width: 80px; font-family: var(--font-family-sans);"
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
                  <span
                    class="text-muted small"
                    style="font-family: var(--font-family-sans);"
                  >
                    / trang
                  </span>
                </div>
                <div v-else />
                <!-- Pagination -->
                <Pagination
                  v-if="clientTotalPages > 1"
                  mode="zero-based"
                  :current-page="zeroBasedPage"
                  :total-pages="clientTotalPages"
                  @page-change="handlePageChange"
                />
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, nextTick, watch } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { Modal } from 'bootstrap'
import { Form, Field, ErrorMessage } from 'vee-validate'
import { toast } from 'vue3-toastify'
import * as yup from 'yup'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import {
    getTables,
    createTable,
    updateTable,
    updateTableStatus,
    deleteTable,
    TABLE_STATUS_OPTIONS,
    buildTablePayload
} from '@/api/tableService'
import { getPendingOrderByTable } from '@/api/orderService'
import { useTableData } from '@/composables/useTableData'
import Pagination from '@/components/common/Pagination.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const router = useRouter()
const authStore = useAuthStore()
const { userRoles } = storeToRefs(authStore)
const canManage = computed(() => userRoles.value.includes('ROLE_ADMIN') || userRoles.value.includes('ROLE_MANAGER'))

const modalElement = ref(null)
const bsModal = ref(null)
const isEditing = ref(false)
const sortState = ref('name-asc')
const layoutMode = ref('grid')

const formData = reactive({
    id: null,
    name: '',
    capacity: 1
})

const filterState = reactive({
    name: '',
    status: '',
    capacity: ''
})

const tableSchema = yup.object({
    name: yup.string().trim().required('Tên bàn là bắt buộc'),
    capacity: yup.number()
        .transform((value, originalValue) => {
            const parsed = Number(originalValue)
            return Number.isFinite(parsed) ? parsed : NaN
        })
        .required('Sức chứa là bắt buộc')
        .min(1, 'Sức chứa phải lớn hơn hoặc bằng 1')
        .integer('Sức chứa phải là số nguyên')
})

// Sử dụng useTableData cho phân trang và tìm kiếm
// API getTables() không hỗ trợ pagination, nên sẽ fetch tất cả và làm client-side pagination
const tableData = useTableData({
    fetchFn: async () => {
        const data = await getTables()
        return Array.isArray(data) ? data : []
    },
    initialPageSize: 10,
    debounceMs: 300,
    syncUrl: true,
    pageParam: 'page',
    sizeParam: 'size',
    zeroBasedPage: true,
    enablePagination: true // Bật client-side pagination
})

// Expose pagination properties
const zeroBasedPage = computed(() => tableData.zeroBasedPage?.value ?? 0)
const pageSize = computed(() => tableData.pageSize?.value ?? 10)
// Tính toán pagination dựa trên client-side filtered/sorted results
const clientTotalElements = computed(() => sortedTables.value.length)
const clientTotalPages = computed(() => Math.ceil(clientTotalElements.value / pageSize.value) || 1)
const setPageFromZero = (page) => tableData.setPage(page)

const createMutation = useMutation({
    mutationFn: createTable,
    onSuccess: () => {
        toast.success('Đã tạo bàn mới.')
        tableData.fetchData() // Refresh data
        closeModal()
    },
    onError: handleApiError
})

const updateMutation = useMutation({
    mutationFn: updateTable,
    onSuccess: () => {
        toast.success('Đã cập nhật thông tin bàn.')
        tableData.fetchData() // Refresh data
        closeModal()
    },
    onError: handleApiError
})

const deleteMutation = useMutation({
    mutationFn: deleteTable,
    onSuccess: () => {
        toast.success('Đã xoá bàn.')
        tableData.fetchData() // Refresh data
    },
    onError: handleApiError
})

const statusMutation = useMutation({
    mutationFn: updateTableStatus,
    onSuccess: (updatedTable) => {
        toast.success(`Đã cập nhật trạng thái bàn "${updatedTable.name}".`)
        // Cập nhật trực tiếp trong tableData.data
        if (Array.isArray(tableData.data.value)) {
            const index = tableData.data.value.findIndex(item => item.id === updatedTable.id)
            if (index !== -1) {
                tableData.data.value[index] = updatedTable
            }
        }
    },
    onError: handleApiError
})

// Lấy dữ liệu từ tableData và apply filters
const normalizedTables = computed(() => Array.isArray(tableData.data.value) ? tableData.data.value : [])

const filteredTables = computed(() => {
    const keyword = filterState.name.trim().toLowerCase()
    return normalizedTables.value.filter((table) => {
        if (!table) return false
        const matchesName = !keyword || table.name.toLowerCase().includes(keyword)
        const matchesStatus = !filterState.status || table.status === filterState.status
        const matchesCapacity = (() => {
            if (!filterState.capacity) return true
            switch (filterState.capacity) {
                case '1-2':
                    return table.capacity >= 1 && table.capacity <= 2
                case '3-4':
                    return table.capacity >= 3 && table.capacity <= 4
                case '5-8':
                    return table.capacity >= 5 && table.capacity <= 8
                case '9+':
                    return table.capacity >= 9
                default:
                    return true
            }
        })()
        return matchesName && matchesStatus && matchesCapacity
    })
})

const sortedTables = computed(() => {
    const list = [...filteredTables.value]
    switch (sortState.value) {
        case 'name-desc':
            return list.sort((a, b) => b.name.localeCompare(a.name))
        case 'capacity-asc':
            return list.sort((a, b) => a.capacity - b.capacity)
        case 'capacity-desc':
            return list.sort((a, b) => b.capacity - a.capacity)
        case 'name-asc':
        default:
            return list.sort((a, b) => a.name.localeCompare(b.name))
    }
})

// Áp dụng client-side pagination cho sortedTables
const paginatedTables = computed(() => {
    const startIndex = zeroBasedPage.value * pageSize.value
    const endIndex = startIndex + pageSize.value
    return sortedTables.value.slice(startIndex, endIndex)
})

// Cập nhật page nếu vượt quá totalPages sau khi filter/sort
watch([clientTotalPages, zeroBasedPage], ([totalPages, currentPage]) => {
    if (currentPage >= totalPages && totalPages > 0) {
        tableData.setPage(Math.max(0, totalPages - 1))
    }
}, { immediate: true })

const openModal = (table = null) => {
    if (!canManage.value) return
    if (table) {
        isEditing.value = true
        formData.id = table.id
        formData.name = table.name
        formData.capacity = table.capacity
    } else {
        isEditing.value = false
        resetForm()
    }
    bsModal.value?.show()
}

const closeModal = () => {
    bsModal.value?.hide()
}

const handleDeleteFromModal = () => {
    if (!formData.id) return
    const table = normalizedTables.value.find(t => t.id === formData.id)
    if (table) {
        closeModal()
        nextTick(() => {
            confirmDelete(table)
        })
    }
}

const resetForm = () => {
    formData.id = null
    formData.name = ''
    formData.capacity = 1
}

const resetFilters = () => {
    filterState.name = ''
    filterState.status = ''
    filterState.capacity = ''
    sortState.value = 'name-asc'
    tableData.setPage(0)
}

const handlePageChange = (page) => {
    setPageFromZero(page)
}

const handlePageSizeChange = (size) => {
    tableData.setPageSize(size)
    tableData.setPage(0) // Reset về trang đầu khi đổi pageSize
}

const handleSubmit = () => {
    const payload = buildTablePayload(formData)
    if (isEditing.value) {
        updateMutation.mutate({ id: formData.id, data: payload })
    } else {
        createMutation.mutate(payload)
    }
}


const deleteTarget = ref(null)
const deleteModalElement = ref(null)
let deleteModalInstance = null

const hasActiveFilters = computed(() => Boolean(filterState.name || filterState.status || filterState.capacity))

const confirmDelete = (table) => {
    if (!canManage.value) return
    deleteTarget.value = table
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

const getStatusMeta = (status) => {
    switch (status) {
        case 'EMPTY':
        case 'AVAILABLE':
            return { label: 'Trống', icon: 'bi-check-circle', variant: 'neutral' }
        case 'SERVING':
        case 'OCCUPIED':
            return { label: 'Đang dùng', icon: 'bi-cup-hot', variant: 'warning' }
        case 'RESERVED':
            return { label: 'Đã đặt', icon: 'bi-bookmark-check', variant: 'info' }
        case 'PENDING':
            return { label: 'Đang chờ', icon: 'bi-hourglass-split', variant: 'warning' }
        case 'UNAVAILABLE':
            return { label: 'Không khả dụng', icon: 'bi-x-circle', variant: 'default' }
        default:
            return { label: status || 'Không xác định', icon: 'bi-question-circle', variant: 'default' }
    }
}

const getStatusBadgeClass = (status) => {
    const meta = getStatusMeta(status)
    return `badge-status--${meta.variant}`
}

const getStatusVariant = (status) => {
    // Chỉ highlight viền khi bàn có khách hoặc đã đặt
    if (status === 'SERVING' || status === 'OCCUPIED') {
        return 'status-warning'
    }
    if (status === 'RESERVED') {
        return 'status-info'
    }
    // Mặc định là neutral (xám mờ) cho bàn trống
    return 'status-neutral'
}

function handleApiError (err) {
    const message = err?.response?.data?.message || err?.message
    if (!message) {
        toast.error('Đã xảy ra lỗi. Vui lòng thử lại.')
        return
    }
    if (message.includes('already exists')) {
        toast.error('Tên bàn đã tồn tại. Vui lòng chọn tên khác.')
        return
    }
    if (message.includes('Cannot delete table')) {
        toast.error('Không thể xoá bàn vì đang gắn với hoá đơn. Hãy xử lý hoá đơn trước.')
        return
    }
    if (message.includes('Invalid status')) {
        toast.error('Trạng thái không hợp lệ. Vui lòng chọn trong danh sách được phép.')
        return
    }
    if (message.includes('Table not found')) {
        toast.error('Không tìm thấy bàn. Có thể dữ liệu đã bị xoá hoặc thay đổi.')
        tableData.fetchData() // Refresh data
        return
    }
    toast.error(message)
}

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

// Format currency
const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '—'
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount)
}

// Format occupied time
const formatOccupiedTime = (occupiedAt) => {
    if (!occupiedAt) return '—'
    const now = new Date()
    const occupied = new Date(occupiedAt)
    const diffMs = now - occupied
    const diffMins = Math.floor(diffMs / 60000)
    const hours = Math.floor(diffMins / 60)
    const minutes = diffMins % 60

    if (hours > 0) {
        return `${hours}h ${minutes}p`
    }
    return `${minutes}p`
}

// Format reservation time
const formatReservationTime = (reservedAt) => {
    if (!reservedAt) return '—'
    const date = new Date(reservedAt)
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

// Handle create order
const handleCreateOrder = (table) => {
    router.push({ name: 'POS', query: { tableId: table.id, tableName: table.name } })
}

// Handle view order
const handleViewOrder = async (table) => {
    try {
        const order = await getPendingOrderByTable(table.id)
        if (order && order.id) {
            router.push({ name: 'POS', query: { orderId: order.id, tableId: table.id } })
        } else {
            toast.info('Bàn này chưa có đơn hàng đang xử lý.')
        }
    } catch {
        toast.error('Không thể tải thông tin đơn hàng.')
    }
}

// Handle add items
const handleAddItems = async (table) => {
    try {
        const order = await getPendingOrderByTable(table.id)
        if (order && order.id) {
            router.push({ name: 'POS', query: { orderId: order.id, tableId: table.id, action: 'add' } })
        } else {
            // Nếu chưa có đơn, tạo đơn mới
            handleCreateOrder(table)
        }
    } catch {
        // Nếu không tìm thấy đơn, tạo đơn mới
        handleCreateOrder(table)
    }
}

// Handle check-in for reserved table
const handleCheckIn = async (table) => {
    try {
        await statusMutation.mutateAsync({ id: table.id, status: 'SERVING' })
        toast.success(`Đã check-in bàn "${table.name}".`)
        handleCreateOrder(table)
    } catch {
        // Error đã được xử lý trong handleApiError
    }
}

</script>

<style scoped>
/* Page Container - Chuẩn hóa theo base.css */
.tables-page {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    padding-bottom: var(--spacing-6);
}

/* Header - Chuẩn hóa theo base.css */
.tables-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    margin-bottom: var(--spacing-4);
}

.tables-header h2 {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.tables-header p {
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

.tables-header__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    flex-wrap: wrap;
}

/* Layout Toggle - Exact match with image */
.layout-toggle {
    display: inline-flex;
    gap: var(--spacing-3);
    background: transparent;
    padding: 0;
    border: none;
}

.layout-toggle .btn {
    padding: 0.65rem 1.25rem;
    border-radius: 9999px;
    font-size: 0.9rem;
    font-weight: var(--font-weight-semibold);
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--font-family-sans);
    transition: all 0.2s ease;
}

.layout-toggle .btn-primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: #ffffff;
}

.layout-toggle .btn-outline-primary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.layout-toggle .btn-outline-primary:hover {
    background: var(--color-card);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.layout-toggle .btn i {
    font-size: 1rem;
    line-height: 1;
    color: inherit;
}

.layout-toggle .btn-primary i {
    color: #ffffff;
}

.layout-toggle .btn-outline-primary i {
    color: var(--color-primary);
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

/* Tabs Card - Chuẩn hóa */
.tabs-card {
    margin-bottom: 0;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.tabs-card :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.filter-grid {
    display: grid;
    gap: var(--spacing-4);
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    align-items: end;
}

.filter-item {
    display: flex;
    flex-direction: column;
}

.filter-item .form-label {
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

/* Input Group - Chuẩn hóa height */
.filter-item :global(.input-group) {
    display: flex;
}

.filter-item :global(.input-group-text) {
    height: 40px;
    border: 1px solid var(--color-border);
    border-right: none;
    border-radius: var(--radius-sm) 0 0 var(--radius-sm);
    background: var(--color-card-muted);
    color: var(--color-text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 var(--spacing-3);
}

.filter-item :global(.input-group-text i) {
    font-size: 18px;
    line-height: 1;
}

.filter-item :global(.input-group .form-control) {
    height: 40px;
    border-left: none;
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.filter-item :global(.input-group .form-control:focus) {
    border-left: none;
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

/* Form Select - Chuẩn hóa height */
.filter-item :global(.form-select) {
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

.filter-item :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.filter-actions {
    display: flex;
    align-items: flex-end;
}

.filter-actions :global(.btn) {
    height: 40px;
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    font-family: var(--font-family-sans);
}

/* Table View - Chuẩn hóa theo base.css */
.tables-page :global(.table) {
    margin-bottom: 0;
    border-collapse: separate;
    border-spacing: 0;
}

.tables-page :global(.table thead th) {
    background: var(--color-card-muted);
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    padding: var(--spacing-3) var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    border-top: none;
    border-left: none;
    border-right: none;
    font-family: var(--font-family-sans);
}

.tables-page :global(.table tbody td) {
    padding: var(--spacing-3) var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    border-top: none;
    border-left: none;
    border-right: none;
    vertical-align: middle;
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.tables-page :global(.table tbody tr:hover) {
    background: var(--color-card-muted);
}

/* Grid View - Chuẩn hóa */
.tables-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: var(--spacing-4);
}

.table-card {
    border-radius: var(--radius-sm);
    border: 2px solid var(--color-border);
    background: var(--color-card);
    padding: var(--spacing-4);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
    transition: all var(--transition-base);
    position: relative;
    overflow: hidden;
    min-height: 200px;
}

.table-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--color-border);
    transition: all var(--transition-base);
}

.table-card:hover {
    background: var(--color-card-muted);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.table-card__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-3);
    padding-bottom: var(--spacing-3);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
}

.table-card__header-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    flex: 1;
}

.table-card__header h3 {
    margin-bottom: 0;
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    line-height: 1.2;
}

.table-card__header .badge {
    align-self: flex-start;
}

.table-card__body {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
    flex: 1;
    min-height: 0;
}

.table-card__info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.table-info-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    font-size: var(--font-size-sm);
    color: var(--color-text);
    font-family: var(--font-family-sans);
}

.table-info-item i {
    font-size: 16px;
    color: var(--color-text-muted);
    width: 20px;
    text-align: center;
}

.table-info-item--highlight {
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    font-size: var(--font-size-base);
    padding: var(--spacing-2);
    background: rgba(59, 130, 246, 0.1);
    border-radius: var(--radius-sm);
}

.table-info-item--highlight i {
    color: var(--color-primary);
}

.table-card__warning {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2);
    background: rgba(251, 191, 36, 0.1);
    border-radius: var(--radius-sm);
    color: #f59e0b;
    font-size: var(--font-size-sm);
    font-family: var(--font-family-sans);
}

.table-card__warning i {
    font-size: 16px;
}

/* Badge Styles - Chuẩn hóa theo tiêu chuẩn */
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
    gap: var(--spacing-1);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    border: 1px solid;
    white-space: nowrap;
    line-height: 1.4;
}

.badge-status i {
    font-size: 14px;
    line-height: 1;
}

.badge-status--success {
    background: rgba(34, 197, 94, 0.18);
    border-color: #22c55e;
    color: #22c55e;
}

.badge-status--neutral {
    background: rgba(156, 163, 175, 0.15);
    border-color: #9ca3af;
    color: #6b7280;
}

.badge-status--warning {
    background: rgba(245, 158, 11, 0.2);
    border-color: #f59e0b;
    color: #d97706;
    font-weight: var(--font-weight-semibold);
}

.badge-status--danger {
    background: rgba(244, 63, 94, 0.18);
    border-color: #ef4444;
    color: #ef4444;
}

.badge-status--info {
    background: rgba(14, 165, 233, 0.18);
    border-color: #0ea5e9;
    color: #0ea5e9;
}

.badge-status--default {
    background: var(--color-card-muted);
    border-color: var(--color-border);
    color: var(--color-text-muted);
}

.table-capacity {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    font-size: var(--font-size-lg);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.table-capacity i {
    font-size: 18px;
    line-height: 1;
    color: var(--color-primary);
}

.table-card__footer {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    padding-top: var(--spacing-3);
    border-top: 1px solid var(--color-border);
    margin-top: auto;
}

.table-card__actions {
    display: flex;
    gap: var(--spacing-2);
    flex-wrap: wrap;
    margin-top: var(--spacing-2);
}

.table-card__actions .btn {
    flex: 1;
    min-width: 120px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    padding: var(--spacing-3) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
    transition: all var(--transition-base);
    min-height: 44px;
}

.table-card__actions .btn i {
    font-size: 18px;
    line-height: 1;
}

/* Outline button style cho nút Tạo đơn - Rõ ràng và dễ bấm */
.table-card__actions .btn-outline-success {
    border: 2px solid #22c55e;
    color: #22c55e;
    background: #ffffff;
    font-weight: var(--font-weight-semibold);
}

.table-card__actions .btn-outline-success:hover:not(:disabled) {
    background: #22c55e;
    color: #ffffff;
    border-color: #22c55e;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.table-card__actions .btn-outline-success:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(34, 197, 94, 0.2);
}

.table-card__actions .btn-outline-success:focus:not(:disabled) {
    outline: 2px solid rgba(34, 197, 94, 0.3);
    outline-offset: 2px;
}

.actions {
    display: inline-flex;
    gap: var(--spacing-2);
    flex-shrink: 0;
}

.btn-icon {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
    color: var(--color-heading);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-base);
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
}

.btn-icon:hover {
    background: var(--color-card);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.btn-icon i {
    font-size: 18px;
    line-height: 1;
}

.btn-icon--danger {
    color: var(--color-danger);
}

.btn-icon--danger:hover {
    background: var(--color-card);
    border-color: var(--color-danger);
    color: var(--color-danger);
}

/* Status Colors cho table-card - Cải thiện màu sắc rõ ràng hơn */
.status-success {
    border-color: #22c55e;
    background: linear-gradient(to bottom, rgba(34, 197, 94, 0.05) 0%, var(--color-card) 100%);
}

.status-success::before {
    background: #22c55e;
}

.status-success:hover {
    border-color: #16a34a;
    background: linear-gradient(to bottom, rgba(34, 197, 94, 0.1) 0%, var(--color-card-muted) 100%);
}

.status-warning {
    border-color: #f59e0b;
    background: linear-gradient(to bottom, rgba(245, 158, 11, 0.08) 0%, var(--color-card) 100%);
    box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.1);
}

.status-warning::before {
    background: #f59e0b;
    height: 5px;
}

.status-warning:hover {
    border-color: #d97706;
    background: linear-gradient(to bottom, rgba(245, 158, 11, 0.12) 0%, var(--color-card-muted) 100%);
    box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.2);
}

.status-danger {
    border-color: #ef4444;
    background: linear-gradient(to bottom, rgba(239, 68, 68, 0.05) 0%, var(--color-card) 100%);
}

.status-danger::before {
    background: #ef4444;
}

.status-danger:hover {
    border-color: #dc2626;
    background: linear-gradient(to bottom, rgba(239, 68, 68, 0.1) 0%, var(--color-card-muted) 100%);
}

.status-info {
    border-color: #0ea5e9;
    border-width: 3px;
    background: linear-gradient(to bottom, rgba(14, 165, 233, 0.08) 0%, var(--color-card) 100%);
    box-shadow: 0 0 0 1px rgba(14, 165, 233, 0.1);
}

.status-info::before {
    background: #0ea5e9;
    height: 5px;
}

.status-info:hover {
    border-color: #0284c7;
    background: linear-gradient(to bottom, rgba(14, 165, 233, 0.12) 0%, var(--color-card-muted) 100%);
    box-shadow: 0 0 0 1px rgba(14, 165, 233, 0.2);
}

.status-neutral {
    border-color: #e5e7eb;
    border-width: 2px;
    background: var(--color-card);
}

.status-neutral::before {
    background: #e5e7eb;
    height: 3px;
}

.status-neutral:hover {
    border-color: #d1d5db;
    background: var(--color-card-muted);
}

/* Modal - Chuẩn hóa theo base.css */
.table-edit-modal :global(.modal-content),
.table-delete-modal :global(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-modal);
}

.table-edit-modal :global(.modal-header),
.table-delete-modal :global(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4);
    background: var(--color-card);
}

.table-edit-modal :global(.modal-header .modal-title),
.table-delete-modal :global(.modal-header .modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.table-edit-modal :global(.modal-header .text-muted.small),
.table-delete-modal :global(.modal-header .text-muted.small) {
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.table-edit-modal :global(.modal-body),
.table-delete-modal :global(.modal-body) {
    padding: var(--spacing-5);
    background: var(--color-card);
}

/* Form Controls trong Modal - Chuẩn hóa */
.table-edit-modal :global(.form-label) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.table-edit-modal :global(.form-control),
.table-edit-modal :global(.form-select) {
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

.table-edit-modal :global(.form-control:focus),
.table-edit-modal :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.table-delete-modal :global(.modal-body .card) {
    border-radius: var(--radius-sm);
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
}

.table-edit-modal :global(.modal-footer),
.table-delete-modal :global(.modal-footer) {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-4);
    background: var(--color-card);
    gap: var(--spacing-2);
    justify-content: flex-end;
}

.table-edit-modal :global(.btn-primary),
.table-delete-modal :global(.btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.table-edit-modal :global(.btn-primary:hover:not(:disabled)),
.table-delete-modal :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.table-edit-modal :global(.btn-outline-secondary) {
    border-color: var(--color-border);
    color: var(--color-heading);
    background: transparent;
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.table-edit-modal :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.table-delete-modal :global(.btn-danger) {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-text-inverse);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.table-delete-modal :global(.btn-danger:hover:not(:disabled)) {
    background: var(--color-danger-dark);
}

/* Action Buttons - Chuẩn hóa theo tiêu chuẩn */
.action-buttons,
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
    font-family: var(--font-family-sans);
    transition: all var(--transition-base);
    cursor: pointer;
    white-space: nowrap;
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

.action-button .spinner-border-sm {
    width: 14px;
    height: 14px;
    border-width: 0.15em;
}

/* Nút Chỉnh sửa - Primary */
.action-button--primary {
    border-color: #3b82f6;
    color: #3b82f6;
    background: var(--color-card);
}

.action-button--primary:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.18);
    color: #2563eb;
    border-color: #2563eb;
}

/* Dropdown menu */
.action-dropdown {
    position: relative;
}

.action-button--icon-only {
    width: 36px;
    padding: 8px;
    min-width: 36px;
}

.action-button--secondary {
    border-color: var(--color-border);
    color: var(--color-text);
    background: var(--color-card);
}

.action-button--secondary:hover:not(:disabled) {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
    color: var(--color-heading);
}

/* Dropdown menu items */
:global(.dropdown-item) {
    display: flex;
    align-items: center;
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-sm);
    color: var(--color-text);
    transition: background-color var(--transition-base);
}

:global(.dropdown-item:hover) {
    background: var(--color-card-muted);
    color: var(--color-heading);
}

:global(.dropdown-item i) {
    font-size: 16px;
    width: 20px;
    text-align: center;
}

/* Nút Xóa - Danger */
.action-button--danger {
    border-color: #ef4444;
    color: #ef4444;
    background: var(--color-card);
}

.action-button--danger:hover:not(:disabled) {
    background: #ef4444;
    color: var(--color-text-inverse);
    border-color: #ef4444;
}

/* Action Button Success */
.action-button--success {
    border-color: #22c55e;
    color: #22c55e;
    background: var(--color-card);
}

.action-button--success:hover:not(:disabled) {
    background: rgba(34, 197, 94, 0.18);
    color: #16a34a;
    border-color: #16a34a;
}

/* Action Button Warning */
.action-button--warning {
    border-color: #f59e0b;
    color: #f59e0b;
    background: var(--color-card);
}

.action-button--warning:hover:not(:disabled) {
    background: rgba(245, 158, 11, 0.18);
    color: #d97706;
    border-color: #d97706;
}

/* Table Capacity Badge - Giống cột Ảnh trong Products */
.table-capacity-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-md);
    background: var(--color-soft-primary);
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    min-width: 60px;
}

.table-capacity-badge i {
    font-size: 16px;
    color: var(--color-primary);
}

.table-capacity-badge strong {
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
}

/* Form Select Small - Chuẩn hóa */
:global(.form-select-sm) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

:global(.form-select-sm:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

/* Button Small - Chuẩn hóa */
:global(.btn-sm) {
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

/* Responsive - Chuẩn hóa */
@media (max-width: 768px) {
    .tables-page {
        padding: var(--spacing-2);
        gap: var(--spacing-3);
    }

    .tables-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-3);
    }

    .tables-header__actions {
        width: 100%;
        justify-content: flex-start;
    }

    .layout-toggle {
        width: 100%;
    }

    .layout-toggle .btn {
        flex: 1;
    }

    .tables-grid {
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: var(--spacing-3);
    }

    .action-grid {
        flex-direction: column;
        width: 100%;
    }

    .action-button {
        width: 100%;
        justify-content: center;
    }

    .table-edit-modal :global(.modal-dialog),
    .table-delete-modal :global(.modal-dialog) {
        max-width: 90%;
        margin: var(--spacing-4) auto;
    }

    .table-edit-modal :global(.modal-body),
    .table-delete-modal :global(.modal-body) {
        padding: var(--spacing-4);
    }
}

</style>

