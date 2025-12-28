<template>
  <div class="smart-inventory-page page-container">
    <!-- Header Section -->
    <div class="page-header">
      <div class="page-header__content">
        <div class="page-header__title-section">
          <h2 class="page-header__title">
            <i class="bi bi-box-seam me-2" />
            Quản lý tồn kho thông minh
          </h2>
          <p class="page-header__subtitle">
            Phân tích và cảnh báo tồn kho tự động, đề xuất đặt hàng thông minh
          </p>
        </div>
        <div class="page-header__actions">
          <div class="form-check form-switch me-3">
            <input
              id="includeStable"
              v-model="includeStable"
              class="form-check-input"
              type="checkbox"
              :disabled="loading"
              @change="handleAnalyze"
            >
            <label
              class="form-check-label"
              for="includeStable"
            >
              Hiển thị ổn định
            </label>
          </div>
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

    <!-- Loading State -->
    <LoadingState
      v-if="loading && !analysisData"
      text="Đang phân tích tồn kho..."
    />

    <!-- Error State -->
    <ErrorState
      v-else-if="error"
      :message="error"
      @retry="handleAnalyze"
    />

    <!-- Main Content -->
    <div
      v-else-if="analysisData"
      class="inventory-content"
    >
      <!-- Summary KPI Cards -->
      <div class="row g-3 mb-4">
        <div class="col-xl-3 col-md-6">
          <div class="stat-card stat-card--danger">
            <div class="stat-card__icon">
              <i class="bi bi-exclamation-triangle-fill" />
            </div>
            <div class="stat-card__content">
              <div class="stat-card__label">
                Nguy cấp
              </div>
              <div class="stat-card__value">
                {{ summary?.critical || 0 }}
              </div>
              <div class="stat-card__subtitle">
                Cần đặt hàng ngay
              </div>
            </div>
          </div>
        </div>
        <div class="col-xl-3 col-md-6">
          <div class="stat-card stat-card--warning">
            <div class="stat-card__icon">
              <i class="bi bi-exclamation-circle-fill" />
            </div>
            <div class="stat-card__content">
              <div class="stat-card__label">
                Cảnh báo
              </div>
              <div class="stat-card__value">
                {{ summary?.warning || 0 }}
              </div>
              <div class="stat-card__subtitle">
                Cần chú ý
              </div>
            </div>
          </div>
        </div>
        <div class="col-xl-3 col-md-6">
          <div class="stat-card stat-card--info">
            <div class="stat-card__icon">
              <i class="bi bi-info-circle-fill" />
            </div>
            <div class="stat-card__content">
              <div class="stat-card__label">
                Chú ý
              </div>
              <div class="stat-card__value">
                {{ summary?.info || 0 }}
              </div>
              <div class="stat-card__subtitle">
                Theo dõi
              </div>
            </div>
          </div>
        </div>
        <div class="col-xl-3 col-md-6">
          <div class="stat-card stat-card--success">
            <div class="stat-card__icon">
              <i class="bi bi-check-circle-fill" />
            </div>
            <div class="stat-card__content">
              <div class="stat-card__label">
                Ổn định
              </div>
              <div class="stat-card__value">
                {{ summary?.stable || 0 }}
              </div>
              <div class="stat-card__subtitle">
                Đủ hàng
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters and Search -->
      <div class="card standard-card mb-4">
        <div class="card-header standard-card-header">
          <h5 class="card-title mb-0">
            <i class="bi bi-funnel me-2" />
            Bộ lọc
          </h5>
        </div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-6 col-lg-4">
              <label class="form-label">
                <i class="bi bi-search me-1" />
                Tìm kiếm
              </label>
              <input
                v-model="searchQuery"
                type="text"
                class="form-control clean-input"
                placeholder="Tên nguyên liệu, đơn vị..."
              >
            </div>
            <div class="col-md-6 col-lg-3">
              <label class="form-label">
                <i class="bi bi-filter me-1" />
                Trạng thái
              </label>
              <select
                v-model="statusFilter"
                class="form-select clean-input"
              >
                <option value="">
                  Tất cả trạng thái
                </option>
                <option value="CRITICAL">
                  Nguy cấp
                </option>
                <option value="WARNING">
                  Cảnh báo
                </option>
                <option value="INFO">
                  Chú ý
                </option>
                <option value="STABLE">
                  Ổn định
                </option>
              </select>
            </div>
            <div class="col-md-6 col-lg-3">
              <label class="form-label">
                <i class="bi bi-sort-alpha-down me-1" />
                Sắp xếp
              </label>
              <select
                v-model="sortBy"
                class="form-select clean-input"
              >
                <option value="priority">
                  Ưu tiên (mặc định)
                </option>
                <option value="name">
                  Tên A-Z
                </option>
                <option value="stock">
                  Tồn kho (thấp → cao)
                </option>
                <option value="days">
                  Số ngày còn lại
                </option>
              </select>
            </div>
            <div class="col-md-6 col-lg-2 d-flex align-items-end">
              <button
                v-if="hasActiveFilters"
                class="btn btn-outline-secondary w-100"
                @click="clearFilters"
              >
                <i class="bi bi-x-circle me-1" />
                Xóa lọc
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Inventory Table -->
      <div class="card standard-card">
        <div class="card-header standard-card-header">
          <h5 class="card-title mb-0">
            <i class="bi bi-list-ul me-2" />
            Danh sách nguyên liệu
            <span class="badge bg-secondary ms-2">
              {{ filteredItems.length }}
            </span>
          </h5>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover table-minimal mb-0">
              <thead>
                <tr>
                  <th style="width: 200px">
                    Nguyên liệu
                  </th>
                  <th style="width: 120px">
                    Tồn kho
                  </th>
                  <th style="width: 120px">
                    Mức đặt lại
                  </th>
                  <th style="width: 140px">
                    Tiêu thụ/ngày
                  </th>
                  <th style="width: 120px">
                    Còn lại
                  </th>
                  <th style="width: 120px">
                    Trạng thái
                  </th>
                  <th style="width: 180px">
                    Đề xuất
                  </th>
                  <th
                    style="width: 120px"
                    class="text-center"
                  >
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in sortedItems"
                  :key="item.ingredientId"
                  :class="getRowClass(item)"
                >
                  <td>
                    <div class="ingredient-info">
                      <div class="ingredient-info__name">
                        {{ item.name }}
                      </div>
                      <div class="ingredient-info__unit">
                        <i class="bi bi-tag me-1" />
                        {{ item.unit }}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="stock-info">
                      <span class="stock-info__value">
                        {{ formatNumber(item.currentStock) }}
                      </span>
                      <span class="stock-info__unit">
                        {{ item.unit }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      v-if="item.reorderLevel > 0"
                      class="reorder-level"
                    >
                      {{ formatNumber(item.reorderLevel) }} {{ item.unit }}
                    </span>
                    <span
                      v-else
                      class="text-muted"
                    >
                      <i class="bi bi-dash-circle me-1" />
                      Chưa đặt
                    </span>
                  </td>
                  <td>
                    <div class="consumption-rate">
                      <span class="consumption-rate__value">
                        {{ formatNumber(item.consumptionRate) }}
                      </span>
                      <span class="consumption-rate__unit">
                        {{ item.unit }}/ngày
                      </span>
                    </div>
                  </td>
                  <td>
                    <div
                      class="days-remaining"
                      :class="getDaysRemainingClass(item)"
                    >
                      <i
                        v-if="item.daysRemaining === null || !isFinite(item.daysRemaining)"
                        class="bi bi-question-circle me-1"
                      />
                      <i
                        v-else-if="item.daysRemaining <= 5"
                        class="bi bi-exclamation-triangle me-1"
                      />
                      <span v-if="item.daysRemaining === null || !isFinite(item.daysRemaining)">
                        N/A
                      </span>
                      <span v-else>
                        {{ item.daysRemaining.toFixed(1) }} ngày
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      class="badge badge-soft"
                      :class="`badge-${item.alert.color}`"
                    >
                      <i
                        class="bi me-1"
                        :class="getStatusIcon(item.alert.status)"
                      />
                      {{ item.alert.label }}
                    </span>
                  </td>
                  <td>
                    <div
                      v-if="item.suggestion"
                      class="suggestion-box"
                    >
                      <div class="suggestion-box__quantity">
                        <i class="bi bi-cart-plus me-1" />
                        {{ formatNumber(item.suggestion.quantity) }} {{ item.unit }}
                      </div>
                      <div
                        v-if="item.suggestion.estimatedCost"
                        class="suggestion-box__cost"
                      >
                        ~{{ formatCurrency(item.suggestion.estimatedCost) }}
                      </div>
                      <div class="suggestion-box__reason">
                        <small>{{ item.suggestion.reason }}</small>
                      </div>
                    </div>
                    <span
                      v-else
                      class="text-muted"
                    >
                      <i class="bi bi-dash-circle me-1" />
                      Chưa có đề xuất
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button
                        class="btn btn-sm btn-outline-primary"
                        title="Xem lịch sử tồn kho"
                        @click="showStockHistory(item)"
                      >
                        <i class="bi bi-graph-up" />
                      </button>
                      <button
                        class="btn btn-sm btn-outline-info"
                        title="Xem lịch sử điều chỉnh tồn kho"
                        @click="showAdjustmentHistory(item)"
                      >
                        <i class="bi bi-clock-history" />
                      </button>
                      <button
                        v-if="item.suggestion && item.alert.status !== 'STABLE'"
                        class="btn btn-sm btn-success"
                        title="Tạo đơn đặt hàng"
                        @click="showPurchaseOrderModal(item)"
                      >
                        <i class="bi bi-cart-plus" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div
            v-if="sortedItems.length === 0"
            class="empty-state p-5 text-center"
          >
            <i class="bi bi-inbox fs-1 text-muted mb-3" />
            <h6 class="text-muted">
              Không tìm thấy nguyên liệu nào
            </h6>
            <p class="text-muted small mb-0">
              Thử thay đổi bộ lọc hoặc tìm kiếm
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State (No Data) -->
    <EmptyState
      v-else
      message="Nhấn 'Làm mới' để bắt đầu phân tích tồn kho"
      icon="bi-box-seam"
    />

    <!-- Modals -->
    <StockLevelChartModal
      v-if="selectedIngredient"
      :ingredient="selectedIngredient"
      @close="selectedIngredient = null"
    />

    <PurchaseOrderSuggestionModal
      v-if="selectedSuggestion"
      :suggestion="selectedSuggestion"
      @close="selectedSuggestion = null"
      @created="handlePurchaseOrderCreated"
    />

    <InventoryAdjustmentHistoryModal
      :show="showHistoryModal"
      :ingredient="selectedHistoryIngredient"
      @close="closeHistoryModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useInventoryManagementStore } from '@/store/inventoryManagement'
import StockLevelChartModal from '@/components/inventory-management/StockLevelChartModal.vue'
import PurchaseOrderSuggestionModal from '@/components/inventory-management/PurchaseOrderSuggestionModal.vue'
import InventoryAdjustmentHistoryModal from '@/components/inventory-management/InventoryAdjustmentHistoryModal.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import logger from '@/utils/logger'

const store = useInventoryManagementStore()

// Computed from store
const loading = computed(() => store.loading)
const error = computed(() => store.error)
const analysisData = computed(() => store.analysisData)
const summary = computed(() => store.summary)
const items = computed(() => store.items)

// Local state
const includeStable = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const sortBy = ref('priority')
const selectedIngredient = ref(null)
const selectedSuggestion = ref(null)
const showHistoryModal = ref(false)
const selectedHistoryIngredient = ref(null)

// Computed filters
const hasActiveFilters = computed(() => searchQuery.value !== '' || statusFilter.value !== '')

const filteredItems = computed(() => {
    let result = items.value

    // Search filter
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase().trim()
        result = result.filter(item =>
            item.name.toLowerCase().includes(query) ||
      item.unit.toLowerCase().includes(query)
        )
    }

    // Status filter
    if (statusFilter.value) {
        result = result.filter(item => item.alert.status === statusFilter.value)
    }

    return result
})

const sortedItems = computed(() => {
    const items = [...filteredItems.value]

    switch (sortBy.value) {
        case 'name':
            return items.sort((a, b) => a.name.localeCompare(b.name))
        case 'stock':
            return items.sort((a, b) => a.currentStock - b.currentStock)
        case 'days':
            return items.sort((a, b) => {
                const aDays = a.daysRemaining ?? Infinity
                const bDays = b.daysRemaining ?? Infinity
                return aDays - bDays
            })
        case 'priority':
        default:
            return items.sort((a, b) => a.alert.priority - b.alert.priority)
    }
})

// Helper functions
const getRowClass = (item) => {
    if (item.alert.status === 'CRITICAL') return 'table-danger'
    if (item.alert.status === 'WARNING') return 'table-warning'
    if (item.alert.status === 'INFO') return 'table-info'
    return ''
}

const getDaysRemainingClass = (item) => {
    if (item.daysRemaining === null || !isFinite(item.daysRemaining)) {
        return 'days-remaining--na'
    }
    if (item.daysRemaining <= 2) {
        return 'days-remaining--critical'
    }
    if (item.daysRemaining <= 5) {
        return 'days-remaining--warning'
    }
    return 'days-remaining--normal'
}

const getStatusIcon = (status) => {
    switch (status) {
        case 'CRITICAL':
            return 'bi-exclamation-triangle-fill'
        case 'WARNING':
            return 'bi-exclamation-circle-fill'
        case 'INFO':
            return 'bi-info-circle-fill'
        case 'STABLE':
            return 'bi-check-circle-fill'
        default:
            return 'bi-circle'
    }
}

// Actions
const handleAnalyze = async () => {
    try {
        await store.analyzeInventory({ includeStable: includeStable.value })
    } catch (err) {
        logger.error('Không thể phân tích tồn kho thông minh:', err)
    }
}

const handleRefresh = () => {
    handleAnalyze()
}

const clearFilters = () => {
    searchQuery.value = ''
    statusFilter.value = ''
}

const showStockHistory = async (item) => {
    selectedIngredient.value = item
    try {
        await store.getStockHistory(item.ingredientId, 30)
    } catch (err) {
        logger.error('Không thể tải lịch sử tồn kho:', err)
    }
}

const showPurchaseOrderModal = async (item) => {
    selectedSuggestion.value = item
    try {
        await store.getSuppliers(item.ingredientId)
    } catch (err) {
        logger.error('Không thể tải danh sách nhà cung cấp:', err)
    }
}

const showAdjustmentHistory = (item) => {
    selectedHistoryIngredient.value = {
        id: item.ingredientId,
        name: item.name,
        unit: item.unit
    }
    showHistoryModal.value = true
}

const closeHistoryModal = () => {
    showHistoryModal.value = false
    selectedHistoryIngredient.value = null
}

const handlePurchaseOrderCreated = () => {
    selectedSuggestion.value = null
    handleAnalyze()
}

onMounted(() => {
    handleAnalyze()
})
</script>

<style scoped>
/* Page Container */
.smart-inventory-page {
  background: var(--color-body-bg);
  padding: var(--spacing-4);
  min-height: 100vh;
}

/* Page Header */
.page-header {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-4);
}

.page-header__content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-4);
  flex-wrap: wrap;
}

.page-header__title-section {
  flex: 1;
  min-width: 0;
}

.page-header__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-heading);
  margin: 0 0 var(--spacing-1) 0;
  display: flex;
  align-items: center;
}

.page-header__subtitle {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  margin: 0;
}

.page-header__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

/* Stat Cards */
.stat-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-4);
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  transition: all var(--transition-base);
  height: 100%;
  min-height: 120px;
}

.stat-card:hover {
  background: var(--color-card-muted);
  border-color: var(--color-border-strong);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.stat-card__icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.stat-card--danger .stat-card__icon {
  background: var(--color-soft-rose);
  color: var(--color-danger);
}

.stat-card--warning .stat-card__icon {
  background: var(--color-soft-amber);
  color: var(--color-warning);
}

.stat-card--info .stat-card__icon {
  background: var(--color-soft-sky);
  color: var(--color-info);
}

.stat-card--success .stat-card__icon {
  background: var(--color-soft-emerald);
  color: var(--color-success);
}

.stat-card__content {
  flex: 1;
  min-width: 0;
}

.stat-card__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-1);
}

.stat-card__value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-heading);
  line-height: 1.2;
  margin-bottom: var(--spacing-1);
}

.stat-card__subtitle {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* Standard Card */
.standard-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.standard-card-header {
  background: var(--color-card-muted);
  border-bottom: 1px solid var(--color-border);
  padding: var(--spacing-3) var(--spacing-4);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-heading);
  margin: 0;
  display: flex;
  align-items: center;
}

/* Ingredient Info */
.ingredient-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.ingredient-info__name {
  font-weight: var(--font-weight-semibold);
  color: var(--color-heading);
  font-size: var(--font-size-base);
}

.ingredient-info__unit {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
}

/* Stock Info */
.stock-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.stock-info__value {
  font-weight: var(--font-weight-semibold);
  color: var(--color-heading);
  font-size: var(--font-size-base);
}

.stock-info__unit {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* Reorder Level */
.reorder-level {
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

/* Consumption Rate */
.consumption-rate {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.consumption-rate__value {
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  font-size: var(--font-size-base);
}

.consumption-rate__unit {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* Days Remaining */
.days-remaining {
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  font-size: var(--font-size-base);
}

.days-remaining--critical {
  color: var(--color-danger);
}

.days-remaining--warning {
  color: var(--color-warning);
}

.days-remaining--normal {
  color: var(--color-text);
}

.days-remaining--na {
  color: var(--color-text-muted);
}

/* Badge Styles */
.badge-soft {
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
}

.badge-danger {
  background: var(--color-soft-rose);
  color: var(--color-danger);
}

.badge-warning {
  background: var(--color-soft-amber);
  color: var(--color-warning);
}

.badge-info {
  background: var(--color-soft-sky);
  color: var(--color-info);
}

.badge-success {
  background: var(--color-soft-emerald);
  color: var(--color-success);
}

/* Suggestion Box */
.suggestion-box {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.suggestion-box__quantity {
  font-weight: var(--font-weight-semibold);
  color: var(--color-heading);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
}

.suggestion-box__cost {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.suggestion-box__reason {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-style: italic;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: var(--spacing-2);
  justify-content: center;
}

/* Table Styles */
.table-minimal {
  font-size: var(--font-size-sm);
}

.table-minimal thead th {
  background: var(--color-card-muted);
  border-bottom: 2px solid var(--color-border);
  font-weight: var(--font-weight-semibold);
  color: var(--color-heading);
  padding: var(--spacing-3);
  white-space: nowrap;
}

.table-minimal tbody td {
  padding: var(--spacing-3);
  vertical-align: middle;
  border-bottom: 1px solid var(--color-border);
}

.table-minimal tbody tr:hover {
  background: var(--color-card-muted);
}

.table-danger {
  background: var(--color-soft-rose) !important;
}

.table-warning {
  background: var(--color-soft-amber) !important;
}

.table-info {
  background: var(--color-soft-sky) !important;
}

/* Empty State */
.empty-state {
  background: var(--color-card-muted);
}

/* Content Animation */
.inventory-content {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .page-header__content {
    flex-direction: column;
  }

  .page-header__actions {
    width: 100%;
    justify-content: space-between;
  }

  .stat-card {
    min-height: 100px;
    padding: var(--spacing-3);
  }

  .stat-card__icon {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }

  .stat-card__value {
    font-size: var(--font-size-xl);
  }

  .table-responsive {
    font-size: var(--font-size-xs);
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
