<template>
  <div
    class="product-profitability-page page-container container-fluid"
      
  >
    <PageHeader
      title="Phân tích Lợi nhuận Sản phẩm"
      subtitle="Phân tích profit margin và đề xuất pricing strategy"
    >
      <template #actions>
        <button
          class="btn-flat btn-flat--outline"
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
        <button
          v-if="hasData"
          class="btn-flat btn-flat--outline"
          :disabled="exporting"
          @click="handleExport"
        >
          <span
            v-if="exporting"
            class="spinner-border spinner-border-sm me-2"
          />
          <i
            v-else
            class="bi bi-download me-2"
          />
          Xuất Excel
        </button>
      </template>
    </PageHeader>

    <div class="card filter-card mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-center">
          <div class="col-lg-2 col-md-4 col-sm-6">
            <label class="form-label">Từ ngày</label>
            <input
              v-model="filters.startDate"
              type="date"
              class="form-control clean-input"
              @change="validateDates"
            >
          </div>
          <div class="col-lg-2 col-md-4 col-sm-6">
            <label class="form-label">Đến ngày</label>
            <input
              v-model="filters.endDate"
              type="date"
              class="form-control clean-input"
              @change="validateDates"
            >
          </div>
          <div class="col-lg-2 col-md-4 col-sm-6">
            <label class="form-label">Danh mục</label>
            <select
              v-model="filters.categoryId"
              class="form-select clean-input"
            >
              <option value="">
                Tất cả
              </option>
              <option
                v-for="cat in categories"
                :key="cat.id"
                :value="cat.id"
              >
                {{ cat.name }}
              </option>
            </select>
          </div>
          <div class="col-lg-2 col-md-4 col-sm-6">
            <label class="form-label">Phân loại</label>
            <select
              v-model="filters.classification"
              class="form-select clean-input"
            >
              <option value="">
                Tất cả
              </option>
              <option value="Star">
                Star
              </option>
              <option value="Cash Cow">
                Cash Cow
              </option>
              <option value="Question Mark">
                Question Mark
              </option>
              <option value="Dog">
                Dog
              </option>
            </select>
          </div>
          <div class="col-lg-3 col-md-6">
            <label class="form-label">Khoảng thời gian</label>
            <div
              class="btn-group w-100"
              role="group"
            >
              <button
                v-for="preset in presets"
                :key="preset.value"
                type="button"
                class="btn btn-flat"
                :class="selectedPreset === preset.value ? 'btn-flat--active' : 'btn-flat--outline'"
                @click="applyPreset(preset.value)"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>
          <div class="col-lg-1 col-md-6">
            <label class="form-label">&nbsp;</label>
            <button
              class="btn btn-flat btn-flat--primary w-100"
              :disabled="loading || !canAnalyze"
              @click="handleAnalyze"
            >
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
              />
              <i
                v-else
                class="bi bi-graph-up-arrow me-2"
              />
              Phân tích
            </button>
          </div>
        </div>
        <div
          v-if="validationError"
          class="alert alert-warning mt-3 mb-0"
        >
          <i class="bi bi-exclamation-triangle me-2" />
          {{ validationError }}
        </div>
      </div>
    </div>

    <LoadingState
      v-if="loading"
      text="Đang phân tích lợi nhuận sản phẩm..."
    />
    <ErrorState
      v-else-if="error"
      :message="error"
      @retry="handleAnalyze"
    />

    <div
      v-else-if="hasData"
      class="analytics-content"
    >
      <div class="row g-4 mb-4">
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--success">
            <div class="kpi-card__icon">
              <i class="bi bi-cash-stack" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Tổng doanh thu
              </div>
              <div class="kpi-card__value">
                {{ formatCurrency(summary?.totalRevenue || 0) }}
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--danger">
            <div class="kpi-card__icon">
              <i class="bi bi-cart-x" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Tổng chi phí
              </div>
              <div class="kpi-card__value">
                {{ formatCurrency(summary?.totalCost || 0) }}
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--primary">
            <div class="kpi-card__icon">
              <i class="bi bi-graph-up" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Tổng lợi nhuận
              </div>
              <div class="kpi-card__value">
                {{ formatCurrency(summary?.totalProfit || 0) }}
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--info">
            <div class="kpi-card__icon">
              <i class="bi bi-percent" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Margin trung bình
              </div>
              <div class="kpi-card__value">
                {{ (summary?.avgMargin || 0).toFixed(1) }}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-lg-8">
          <div class="card standard-card">
            <div class="card-header standard-card-header">
              <h5 class="card-title">
                Profitability Matrix
              </h5>
            </div>
            <div class="card-body">
              <ProfitabilityMatrix :products="filteredProducts" />
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="card standard-card">
            <div class="card-header standard-card-header">
              <h5 class="card-title">
                So sánh theo Danh mục
              </h5>
            </div>
            <div class="card-body">
              <CategoryComparison :categories="categoryAnalysis" />
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-lg-6">
          <div class="card standard-card">
            <div class="card-header standard-card-header">
              <h5 class="card-title">
                Top 10 sản phẩm lợi nhuận cao
              </h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-minimal">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Lợi nhuận</th>
                      <th>Margin</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="product in topProfitable"
                      :key="product.productId"
                    >
                      <td>
                        <div class="fw-semibold product-name">
                          {{ product.name }}
                        </div>
                        <small class="text-muted">{{ product.categoryName }}</small>
                      </td>
                      <td class="profit-cell">
                        {{ formatCurrency(product.profit) }}
                      </td>
                      <td>
                        <span
                          class="margin-badge"
                          :class="getMarginClass(product.margin)"
                        >
                          {{ product.margin.toFixed(1) }}%
                        </span>
                      </td>
                      <td>
                        <button
                          class="btn btn-flat btn-flat--outline btn-sm"
                          title="Xem chi tiết"
                          @click="showProductDetail(product)"
                        >
                          <i class="bi bi-eye" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card standard-card">
            <div class="card-header standard-card-header">
              <h5 class="card-title">
                Sản phẩm cần chú ý (Margin thấp)
              </h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-minimal">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Margin</th>
                      <th>Số lượng</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="product in lowMargin"
                      :key="product.productId"
                    >
                      <td>
                        <div class="fw-semibold product-name">
                          {{ product.name }}
                        </div>
                        <small class="text-muted">{{ product.categoryName }}</small>
                      </td>
                      <td>
                        <span class="margin-badge margin-low">{{ product.margin.toFixed(1) }}%</span>
                      </td>
                      <td>{{ formatNumber(product.totalQuantity) }}</td>
                      <td>
                        <button
                          class="btn btn-flat btn-flat--primary btn-sm"
                          title="Đề xuất giá"
                          @click="showPricingSuggestion(product)"
                        >
                          <i class="bi bi-tag" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card standard-card">
        <div class="card-header standard-card-header">
          <h5 class="card-title">
            Danh sách sản phẩm
          </h5>
          <div class="d-flex gap-2">
            <input
              v-model="searchQuery"
              type="text"
              class="form-control form-control-sm clean-input"
              style="width: 200px;"
              placeholder="Tìm kiếm..."
            >
          </div>
        </div>
        <div class="card-body">
          <ProductList
            :products="filteredProducts"
            :loading="loading"
            @view="showProductDetail"
            @pricing="showPricingSuggestion"
          />
        </div>
      </div>
    </div>

    <EmptyState
      v-else
      title="Chưa có dữ liệu"
      message="Chọn khoảng thời gian và nhấn 'Phân tích' để bắt đầu"
    >
      <template #icon>
        <i class="bi bi-graph-up-arrow" />
      </template>
    </EmptyState>

    <ProductDetailModal
      v-if="selectedProduct"
      :product="selectedProduct"
      @close="selectedProduct = null"
    />

    <PricingSuggestionModal
      v-if="showPricing"
      :product="pricingProduct"
      @close="showPricing = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProductProfitabilityStore } from '@/store/productProfitability'
import * as categoryService from '@/api/categoryService'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ProfitabilityMatrix from '@/components/product-profitability/ProfitabilityMatrix.vue'
import CategoryComparison from '@/components/product-profitability/CategoryComparison.vue'
import ProductList from '@/components/product-profitability/ProductList.vue'
import ProductDetailModal from '@/components/product-profitability/ProductDetailModal.vue'
import PricingSuggestionModal from '@/components/product-profitability/PricingSuggestionModal.vue'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import * as XLSX from 'xlsx'
import logger from '@/utils/logger'

const store = useProductProfitabilityStore()

const loading = computed(() => store.loading)
const error = computed(() => store.error)
const hasData = computed(() => store.hasData)
const products = computed(() => store.products)
const categoryAnalysis = computed(() => store.categoryAnalysis)
const topProfitable = computed(() => store.topProfitable)
const lowMargin = computed(() => store.lowMargin)
const summary = computed(() => store.summary)

const exporting = ref(false)
const validationError = ref('')
const selectedPreset = ref('30d')
const searchQuery = ref('')
const categories = ref([])
const selectedProduct = ref(null)
const showPricing = ref(false)
const pricingProduct = ref(null)

const filters = ref({
    startDate: '',
    endDate: '',
    categoryId: '',
    classification: ''
})

const presets = [
    { value: '7d', label: '7 ngày', days: 7 },
    { value: '30d', label: '30 ngày', days: 30 },
    { value: '90d', label: '90 ngày', days: 90 },
    { value: '180d', label: '6 tháng', days: 180 }
]

const canAnalyze = computed(() => filters.value.startDate && filters.value.endDate && !validationError.value)

const filteredProducts = computed(() => {
    let result = products.value

    if (filters.value.categoryId) {
        result = result.filter(p => p.categoryId === filters.value.categoryId)
    }

    if (filters.value.classification) {
        result = result.filter(p => p.classification === filters.value.classification)
    }

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.categoryName.toLowerCase().includes(query)
        )
    }

    return result
})

const applyPreset = (preset) => {
    selectedPreset.value = preset
    const presetConfig = presets.find(p => p.value === preset)
    if (!presetConfig) return

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - presetConfig.days)

    filters.value.endDate = endDate.toISOString().split('T')[0]
    filters.value.startDate = startDate.toISOString().split('T')[0]
    validateDates()
}

const validateDates = () => {
    validationError.value = ''

    if (!filters.value.startDate || !filters.value.endDate) {
        return
    }

    const start = new Date(filters.value.startDate)
    const end = new Date(filters.value.endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (start > end) {
        validationError.value = 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc'
        return
    }

    if (end > today) {
        validationError.value = 'Ngày kết thúc không được vượt quá hôm nay'
    }
}

const loadCategories = async () => {
    try {
        const data = await categoryService.getCategories({ page: 0, size: 1000 })
        categories.value = Array.isArray(data) ? data : (data?.content || [])
    } catch (err) {
        logger.error('Không thể tải danh mục sản phẩm:', err)
    }
}

const handleAnalyze = async () => {
    if (!canAnalyze.value || validationError.value) return

    try {
        await store.analyzeProfitability({
            startDate: filters.value.startDate,
            endDate: filters.value.endDate
        })
    } catch (err) {
        logger.error('Không thể phân tích lợi nhuận sản phẩm:', err)
    }
}

const handleRefresh = () => {
    handleAnalyze()
}

const handleExport = async () => {
    if (!hasData.value) return

    exporting.value = true
    try {
        const exportData = await store.exportReport()

        const ws = XLSX.utils.aoa_to_sheet(exportData.data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, exportData.sheetName)

        XLSX.writeFile(wb, exportData.filename)
    } catch (err) {
        logger.error('Không thể xuất báo cáo lợi nhuận sản phẩm:', err)
        alert('Không thể xuất file. Vui lòng thử lại.')
    } finally {
        exporting.value = false
    }
}

const showProductDetail = (product) => {
    selectedProduct.value = product
}

const showPricingSuggestion = (product) => {
    pricingProduct.value = product
    showPricing.value = true
}

const getMarginClass = (margin) => {
    if (margin >= 40) return 'margin-excellent'
    if (margin >= 25) return 'margin-good'
    if (margin >= 15) return 'margin-average'
    return 'margin-low'
}

onMounted(() => {
    applyPreset('30d')
    loadCategories()
})
</script>

<style scoped>
.product-profitability-page {
    background: var(--color-body-bg);
    padding: var(--spacing-4);
    min-height: 100vh;
}

.kpi-card {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-4);
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    transition: all var(--transition-base);
    min-height: 100px;
    height: 100%;
}

.kpi-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
}

.kpi-card__icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
}

.kpi-card--success .kpi-card__icon {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.kpi-card--danger .kpi-card__icon {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.kpi-card--primary .kpi-card__icon {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.kpi-card--info .kpi-card__icon {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.kpi-card__content {
    flex: 1;
    min-width: 0;
}

.kpi-card__label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.kpi-card__value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.filter-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
}

.alert {
    font-family: var(--font-family-sans);
    border-radius: var(--radius-sm);
    border: 1px solid;
    padding: var(--spacing-3) var(--spacing-4);
}

.alert-warning {
    background: var(--color-soft-amber);
    border-color: var(--color-warning);
    color: var(--color-text);
}

.product-name {
    font-family: var(--font-family-sans);
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
}

.profit-cell {
    font-family: var(--font-family-sans);
    color: var(--color-success);
    font-weight: var(--font-weight-semibold);
}

.margin-badge {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
}

.margin-excellent {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.margin-good {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.margin-average {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.margin-low {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.analytics-content {
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

@media (max-width: 768px) {
    .kpi-card {
        min-height: 90px;
        padding: var(--spacing-3);
    }

    .kpi-card__icon {
        width: 40px;
        height: 40px;
        font-size: 18px;
    }

    .kpi-card__value {
        font-size: var(--font-size-base);
    }
}
</style>

