<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="inventory-adjustment-history-modal modal fade show"
      tabindex="-1"
      role="dialog"
      @click.self="handleClose"
    >
      <div
        class="modal-backdrop fade show"
        @click="handleClose"
      />
      <div
        class="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable"
        @click.stop
      >
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-header__content">
              <h5 class="modal-title">
                <i class="bi bi-clock-history me-2" />
                Lịch sử điều chỉnh tồn kho
              </h5>
              <p
                v-if="ingredient"
                class="modal-subtitle mb-0"
              >
                {{ ingredient.name }} ({{ ingredient.unit }})
              </p>
            </div>
            <button
              type="button"
              class="btn-close"
              aria-label="Đóng"
              @click="handleClose"
            />
          </div>

          <div class="modal-body">
            <!-- Filters -->
            <div class="history-filters mb-4">
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label">Từ ngày</label>
                  <input
                    v-model="filters.startDate"
                    type="date"
                    class="form-control"
                    @change="handleFilterChange"
                  >
                </div>
                <div class="col-md-4">
                  <label class="form-label">Đến ngày</label>
                  <input
                    v-model="filters.endDate"
                    type="date"
                    class="form-control"
                    @change="handleFilterChange"
                  >
                </div>
                <div class="col-md-4 d-flex align-items-end">
                  <button
                    class="btn btn-outline-secondary w-100"
                    @click="clearFilters"
                  >
                    <i class="bi bi-x-circle me-2" />
                    Xóa bộ lọc
                  </button>
                </div>
              </div>
            </div>

            <!-- Loading State -->
            <div
              v-if="loading"
              class="text-center py-5"
            >
              <div class="spinner-border text-primary" />
              <p class="mt-2 text-muted">
                Đang tải lịch sử...
              </p>
            </div>

            <!-- Error State -->
            <div
              v-else-if="error"
              class="alert alert-danger"
            >
              <i class="bi bi-exclamation-triangle me-2" />
              {{ error }}
            </div>

            <!-- History Table -->
            <div
              v-else-if="history.length > 0"
              class="history-table-container"
            >
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th class="col-time">
                        Thời gian
                      </th>
                      <th class="col-adjuster">
                        Người điều chỉnh
                      </th>
                      <th class="col-old-stock">
                        Tồn kho cũ
                      </th>
                      <th class="col-new-stock">
                        Tồn kho mới
                      </th>
                      <th class="col-change">
                        Thay đổi
                      </th>
                      <th class="col-change-percent">
                        % Thay đổi
                      </th>
                      <th>Lý do</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(item, index) in history"
                      :key="item.id"
                      :class="getRowClass(item)"
                    >
                      <td>
                        <div class="fw-semibold">
                          {{ formatDateTimeDisplay(item.adjustedAt) }}
                        </div>
                        <small class="text-muted">
                          {{ formatRelativeTime(item.adjustedAt) }}
                        </small>
                      </td>
                      <td>
                        <span class="badge bg-secondary">
                          {{ item.adjustedBy }}
                        </span>
                      </td>
                      <td>
                        <span class="quantity-old">
                          {{ formatNumber(item.oldQuantity) }} {{ ingredient?.unit || '' }}
                        </span>
                      </td>
                      <td>
                        <span class="quantity-new">
                          {{ formatNumber(item.newQuantity) }} {{ ingredient?.unit || '' }}
                        </span>
                      </td>
                      <td>
                        <span
                          :class="getAdjustmentClass(item)"
                          class="adjustment-amount"
                        >
                          <i
                            :class="getAdjustmentIcon(item)"
                            class="me-1"
                          />
                          {{ formatAdjustmentAmount(item.adjustmentAmount) }}
                          {{ ingredient?.unit || '' }}
                        </span>
                      </td>
                      <td>
                        <span
                          :class="getAdjustmentClass(item)"
                          class="percentage"
                        >
                          {{ formatPercentage(item.changePercentage) }}
                        </span>
                      </td>
                      <td>
                        <span
                          v-if="item.reason"
                          class="text-muted"
                        >
                          {{ item.reason }}
                        </span>
                        <span
                          v-else
                          class="text-muted fst-italic"
                        >
                          Không có lý do
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Comparison Summary -->
              <div class="comparison-summary mt-4 p-3 bg-light rounded">
                <h6 class="mb-3">
                  <i class="bi bi-graph-up me-2" />
                  Tóm tắt so sánh
                </h6>
                <div class="row g-3">
                  <div class="col-md-3">
                    <div class="summary-card">
                      <div class="summary-label">
                        Tổng điều chỉnh
                      </div>
                      <div class="summary-value">
                        {{ formatNumber(comparisonSummary.totalAdjustments) }}
                      </div>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="summary-card">
                      <div class="summary-label">
                        Tăng
                      </div>
                      <div class="summary-value text-success">
                        {{ formatNumber(comparisonSummary.totalIncreases) }}
                      </div>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="summary-card">
                      <div class="summary-label">
                        Giảm
                      </div>
                      <div class="summary-value text-danger">
                        {{ formatNumber(comparisonSummary.totalDecreases) }}
                      </div>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="summary-card">
                      <div class="summary-label">
                        Thay đổi trung bình
                      </div>
                      <div class="summary-value">
                        {{ formatPercentage(comparisonSummary.averageChangePercentage) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Pagination -->
              <div
                v-if="pagination.totalPages > 1"
                class="mt-4"
              >
                <nav aria-label="Lịch sử phân trang">
                  <ul class="pagination justify-content-center">
                    <li
                      class="page-item"
                      :class="{ disabled: pagination.currentPage === 0 }"
                    >
                      <button
                        class="page-link"
                        @click="loadPage(pagination.currentPage - 1)"
                      >
                        Trước
                      </button>
                    </li>
                    <li
                      v-for="page in pagination.totalPages"
                      :key="page"
                      class="page-item"
                      :class="{ active: page - 1 === pagination.currentPage }"
                    >
                      <button
                        class="page-link"
                        @click="loadPage(page - 1)"
                      >
                        {{ page }}
                      </button>
                    </li>
                    <li
                      class="page-item"
                      :class="{ disabled: pagination.currentPage === pagination.totalPages - 1 }"
                    >
                      <button
                        class="page-link"
                        @click="loadPage(pagination.currentPage + 1)"
                      >
                        Sau
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>

            <!-- Empty State -->
            <div
              v-else
              class="text-center py-5"
            >
              <i class="bi bi-inbox fs-1 text-muted mb-3" />
              <h6 class="text-muted">
                Không có lịch sử điều chỉnh
              </h6>
              <p class="text-muted small mb-0">
                Chưa có điều chỉnh tồn kho nào được thực hiện
              </p>
            </div>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="handleClose"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import * as inventoryAdjustmentHistoryService from '@/api/inventoryAdjustmentHistoryService'
import { formatNumber, formatDate, formatDateTime } from '@/utils/formatters'

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    ingredient: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['close'])

const loading = ref(false)
const error = ref(null)
const history = ref([])
const pagination = ref({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 20
})

const filters = ref({
    startDate: null,
    endDate: null
})

const comparisonSummary = computed(() => {
    const totalAdjustments = history.value.length
    const totalIncreases = history.value
        .filter(item => item.isIncrease)
        .reduce((sum, item) => sum + Math.abs(parseFloat(item.adjustmentAmount || 0)), 0)
    const totalDecreases = history.value
        .filter(item => item.isDecrease)
        .reduce((sum, item) => sum + Math.abs(parseFloat(item.adjustmentAmount || 0)), 0)
    const averageChangePercentage = totalAdjustments > 0
        ? history.value.reduce((sum, item) => sum + parseFloat(item.changePercentage || 0), 0) / totalAdjustments
        : 0

    return {
        totalAdjustments,
        totalIncreases,
        totalDecreases,
        averageChangePercentage
    }
})

const handleClose = () => {
    emit('close')
}

const handleFilterChange = () => {
    loadHistory(0)
}

const clearFilters = () => {
    filters.value.startDate = null
    filters.value.endDate = null
    loadHistory(0)
}

const loadHistory = async (page = 0) => {
    if (!props.ingredient?.id) return

    loading.value = true
    error.value = null

    try {
        let response
        if (filters.value.startDate && filters.value.endDate) {
            const startDate = new Date(filters.value.startDate)
            startDate.setHours(0, 0, 0, 0)
            const endDate = new Date(filters.value.endDate)
            endDate.setHours(23, 59, 59, 999)
            response = await inventoryAdjustmentHistoryService.getHistoryByIngredientIdAndDateRange(
                props.ingredient.id,
                startDate.toISOString(),
                endDate.toISOString(),
                page,
                pagination.value.size
            )
        } else {
            response = await inventoryAdjustmentHistoryService.getHistoryByIngredientId(
                props.ingredient.id,
                page,
                pagination.value.size
            )
        }

        history.value = response.content || []
        pagination.value = {
            currentPage: response.number || page,
            totalPages: response.totalPages || 0,
            totalElements: response.totalElements || 0,
            size: response.size || 20
        }
    } catch (err) {
        error.value = err.response?.data?.message || err.message || 'Không thể tải lịch sử điều chỉnh'
        console.error('Error loading adjustment history:', err)
    } finally {
        loading.value = false
    }
}

const loadPage = (page) => {
    if (page >= 0 && page < pagination.value.totalPages) {
        loadHistory(page)
    }
}

const formatDateTimeDisplay = (dateString) => {
    if (!dateString) return '—'
    try {
        return formatDateTime(dateString)
    } catch {
        return dateString
    }
}

const formatRelativeTime = (dateString) => {
    if (!dateString) return ''
    try {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Vừa xong'
        if (diffMins < 60) return `${diffMins} phút trước`
        if (diffHours < 24) return `${diffHours} giờ trước`
        if (diffDays < 7) return `${diffDays} ngày trước`
        return formatDate(dateString)
    } catch {
        return ''
    }
}

const formatAdjustmentAmount = (amount) => {
    if (!amount) return '0'
    const num = parseFloat(amount)
    return num > 0 ? `+${formatNumber(num)}` : formatNumber(num)
}

const formatPercentage = (percentage) => {
    if (!percentage) return '0%'
    const num = parseFloat(percentage)
    return num > 0 ? `+${num.toFixed(2)}%` : `${num.toFixed(2)}%`
}

const getRowClass = (item) => {
    if (item.isIncrease) return 'table-success'
    if (item.isDecrease) return 'table-danger'
    return ''
}

const getAdjustmentClass = (item) => {
    if (item.isIncrease) return 'text-success fw-semibold'
    if (item.isDecrease) return 'text-danger fw-semibold'
    return 'text-muted'
}

const getAdjustmentIcon = (item) => {
    if (item.isIncrease) return 'bi-arrow-up'
    if (item.isDecrease) return 'bi-arrow-down'
    return 'bi-dash'
}

watch(() => props.show, (newVal) => {
    if (newVal && props.ingredient?.id) {
        loadHistory(0)
    }
})

watch(() => props.ingredient, (newVal) => {
    if (props.show && newVal?.id) {
        loadHistory(0)
    }
})
</script>

<style scoped>
.history-filters {
  background: var(--color-card);
  padding: var(--spacing-4);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.inventory-adjustment-history-modal :global(.form-label) {
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-heading);
  margin-bottom: var(--spacing-2);
}

.inventory-adjustment-history-modal :global(.form-control) {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-base);
  background: var(--color-card);
  color: var(--color-heading);
  font-family: var(--font-family-sans);
  transition: all var(--transition-base);
}

.inventory-adjustment-history-modal :global(.form-control:focus) {
  border-color: var(--color-primary);
  outline: 2px solid var(--color-primary);
  outline-offset: 0;
  box-shadow: none;
}

.history-table-container {
  max-height: 500px;
  overflow-y: auto;
}

.quantity-old {
  color: var(--color-text-muted);
  text-decoration: line-through;
  font-family: var(--font-family-sans);
}

.quantity-new {
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-sans);
}

.adjustment-amount {
  font-size: 0.95rem;
}

.percentage {
  font-size: 0.9rem;
}

.comparison-summary {
  border: 1px solid var(--color-border);
  background: var(--color-card-muted);
  border-radius: var(--radius-sm);
}

.summary-card {
  text-align: center;
}

.summary-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-2);
  font-family: var(--font-family-sans);
  font-weight: var(--font-weight-medium);
}

.summary-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-heading);
  font-family: var(--font-family-sans);
}

/* Modal Container - Fixed positioning */
.inventory-adjustment-history-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1055;
  display: block;
  overflow-x: hidden;
  overflow-y: auto;
}

/* Modal Backdrop - Behind modal content */
.inventory-adjustment-history-modal :global(.modal-backdrop) {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1050;
  background-color: var(--color-backdrop);
  opacity: 1;
}

/* Modal Dialog - Above backdrop */
.inventory-adjustment-history-modal :global(.modal-dialog) {
  position: relative;
  z-index: 1056;
  margin: var(--spacing-4) auto;
  pointer-events: none;
}

.inventory-adjustment-history-modal :global(.modal-content) {
  pointer-events: auto;
  border-radius: var(--component-radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-modal);
  background: var(--color-card);
}

.inventory-adjustment-history-modal :global(.modal-header) {
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-card);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-4);
}

.modal-header__content {
  flex: 1;
  min-width: 0;
}

.inventory-adjustment-history-modal :global(.modal-title) {
  font-weight: var(--font-weight-semibold);
  color: var(--color-heading);
  font-size: var(--font-size-xl);
  margin-bottom: var(--spacing-1);
  font-family: var(--font-family-sans);
  line-height: var(--line-height-tight);
  display: flex;
  align-items: center;
}

.modal-subtitle {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin: 0;
  font-family: var(--font-family-sans);
  line-height: var(--line-height-normal);
}

.inventory-adjustment-history-modal :global(.modal-body) {
  padding: var(--spacing-6);
  color: var(--color-text);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  background: var(--color-card);
}

.inventory-adjustment-history-modal :global(.modal-footer) {
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--color-border);
  background: var(--color-card);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-2);
}

/* Button Styles - Đồng bộ */
.inventory-adjustment-history-modal :global(.btn-outline-secondary) {
  border: 1px solid var(--color-border);
  color: var(--color-heading);
  background: transparent;
  border-radius: var(--radius-sm);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  padding: var(--spacing-2) var(--spacing-4);
  transition: all var(--transition-base);
}

.inventory-adjustment-history-modal :global(.btn-outline-secondary:hover:not(:disabled)) {
  background: var(--color-card-muted);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.col-time {
  width: 120px;
}

.col-adjuster {
  width: 150px;
}

.col-old-stock {
  width: 120px;
}

.col-new-stock {
  width: 120px;
}

.col-change {
  width: 120px;
}

.col-change-percent {
  width: 100px;
}
</style>

