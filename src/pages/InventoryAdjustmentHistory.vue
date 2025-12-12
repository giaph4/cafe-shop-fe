<template>
  <div class="inventory-adjustment-history-page page-container">
    <!-- Header Section -->
    <div class="page-header">
      <div class="page-header__content">
        <div class="page-header__title-section">
          <h2 class="page-header__title">
            <i class="bi bi-clock-history me-2" />
            Lịch sử điều chỉnh tồn kho
          </h2>
          <p class="page-header__subtitle">
            Xem tất cả các lần điều chỉnh tồn kho và so sánh thay đổi
          </p>
        </div>
        <div class="page-header__actions">
          <button
            class="btn btn-outline-secondary"
            :disabled="loading"
            @click="handleRefresh"
          >
            <span
              v-if="loading"
              class="spinner-border spinner-border-sm me-2"
            />
            <i
              v-else
              class="bi bi-arrow-clockwise me-2"
            />
            Làm mới
          </button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-card mb-4">
      <div class="row g-3">
        <div class="col-md-3">
          <label class="form-label">Từ ngày</label>
          <input
            v-model="filters.startDate"
            type="date"
            class="form-control"
            @change="handleFilterChange"
          >
        </div>
        <div class="col-md-3">
          <label class="form-label">Đến ngày</label>
          <input
            v-model="filters.endDate"
            type="date"
            class="form-control"
            @change="handleFilterChange"
          >
        </div>
        <div class="col-md-3">
          <label class="form-label">Nguyên liệu</label>
          <input
            v-model="filters.ingredientName"
            type="text"
            class="form-control"
            placeholder="Tìm theo tên nguyên liệu..."
            @input="handleFilterChange"
          >
        </div>
        <div class="col-md-3 d-flex align-items-end">
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
    <LoadingState
      v-if="loading && !history.length"
      text="Đang tải lịch sử điều chỉnh..."
    />

    <!-- Error State -->
    <ErrorState
      v-else-if="error"
      :message="error"
      @retry="loadHistory"
    />

    <!-- History Table -->
    <div
      v-else-if="history.length > 0"
      class="history-container"
    >
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th style="width: 120px">
                Thời gian
              </th>
              <th style="width: 200px">
                Nguyên liệu
              </th>
              <th style="width: 150px">
                Người điều chỉnh
              </th>
              <th style="width: 120px">
                Tồn kho cũ
              </th>
              <th style="width: 120px">
                Tồn kho mới
              </th>
              <th style="width: 120px">
                Thay đổi
              </th>
              <th style="width: 100px">
                % Thay đổi
              </th>
              <th>Lý do</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in history"
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
                <div class="ingredient-name">
                  {{ item.ingredientName }}
                </div>
                <small class="text-muted">
                  {{ item.ingredientUnit }}
                </small>
              </td>
              <td>
                <span class="badge bg-secondary">
                  {{ item.adjustedBy }}
                </span>
              </td>
              <td>
                <span class="quantity-old">
                  {{ formatNumber(item.oldQuantity) }} {{ item.ingredientUnit }}
                </span>
              </td>
              <td>
                <span class="quantity-new">
                  {{ formatNumber(item.newQuantity) }} {{ item.ingredientUnit }}
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
                  {{ item.ingredientUnit }}
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

      <!-- Summary -->
      <div class="comparison-summary mt-4 p-3 bg-light rounded">
        <h6 class="mb-3">
          <i class="bi bi-graph-up me-2" />
          Tóm tắt
        </h6>
        <div class="row g-3">
          <div class="col-md-3">
            <div class="summary-card">
              <div class="summary-label">
                Tổng điều chỉnh
              </div>
              <div class="summary-value">
                {{ formatNumber(summary.totalAdjustments) }}
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="summary-card">
              <div class="summary-label">
                Tăng
              </div>
              <div class="summary-value text-success">
                {{ formatNumber(summary.totalIncreases) }}
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="summary-card">
              <div class="summary-label">
                Giảm
              </div>
              <div class="summary-value text-danger">
                {{ formatNumber(summary.totalDecreases) }}
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="summary-card">
              <div class="summary-label">
                Thay đổi trung bình
              </div>
              <div class="summary-value">
                {{ formatPercentage(summary.averageChangePercentage) }}
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
    <EmptyState
      v-else
      message="Không có lịch sử điều chỉnh nào"
      icon="bi-clock-history"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import * as inventoryAdjustmentHistoryService from '@/api/inventoryAdjustmentHistoryService'
import { formatNumber, formatDate, formatDateTime } from '@/utils/formatters'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'

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
  endDate: null,
  ingredientName: ''
})

const summary = computed(() => {
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

const handleRefresh = () => {
  loadHistory(0)
}

const handleFilterChange = () => {
  loadHistory(0)
}

const clearFilters = () => {
  filters.value.startDate = null
  filters.value.endDate = null
  filters.value.ingredientName = ''
  loadHistory(0)
}

const loadHistory = async (page = 0) => {
  loading.value = true
  error.value = null

  try {
    let response
    if (filters.value.startDate && filters.value.endDate) {
      const startDate = new Date(filters.value.startDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(filters.value.endDate)
      endDate.setHours(23, 59, 59, 999)
      response = await inventoryAdjustmentHistoryService.getAllHistory(
        page,
        pagination.value.size,
        startDate.toISOString(),
        endDate.toISOString()
      )
    } else {
      response = await inventoryAdjustmentHistoryService.getAllHistory(
        page,
        pagination.value.size
      )
    }

    let items = response.content || []
    
    // Filter by ingredient name if provided
    if (filters.value.ingredientName) {
      const searchTerm = filters.value.ingredientName.toLowerCase().trim()
      items = items.filter(item => 
        item.ingredientName?.toLowerCase().includes(searchTerm)
      )
    }

    history.value = items
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

onMounted(() => {
  loadHistory(0)
})
</script>

<style scoped>
.inventory-adjustment-history-page {
  background: var(--color-body-bg);
  padding: var(--spacing-4);
  min-height: 100vh;
}

.page-header {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-4);
  box-shadow: var(--shadow-sm);
}

.page-header__content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-4);
}

.page-header__title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-heading);
}

.page-header__subtitle {
  color: var(--color-text-muted);
  margin: 0.5rem 0 0 0;
  font-size: 0.9rem;
}

.filter-card {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-sm);
}

.history-container {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-sm);
}

.quantity-old {
  color: var(--color-text-muted);
  text-decoration: line-through;
}

.quantity-new {
  color: var(--color-primary);
  font-weight: 600;
}

.adjustment-amount {
  font-size: 0.95rem;
}

.percentage {
  font-size: 0.9rem;
}

.comparison-summary {
  border: 1px solid var(--color-border);
}

.summary-card {
  text-align: center;
}

.summary-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
}

.ingredient-name {
  font-weight: 500;
  color: var(--color-heading);
}
</style>

