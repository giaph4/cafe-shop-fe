<template>
  <div
    class="ingredient-demand-forecast-page page-container container-fluid"
      
  >
    <PageHeader
      title="Dự báo Nhu cầu Nguyên liệu"
      subtitle="Dự báo nhu cầu nguyên liệu dựa trên đơn hàng và xu hướng"
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
            <label class="form-label">Dự báo (ngày)</label>
            <select
              v-model="filters.forecastDays"
              class="form-select clean-input"
            >
              <option :value="7">
                7 ngày
              </option>
              <option :value="14">
                14 ngày
              </option>
              <option :value="30">
                30 ngày
              </option>
              <option :value="60">
                60 ngày
              </option>
            </select>
          </div>
          <div class="col-lg-2 col-md-4 col-sm-6">
            <label class="form-label">Trạng thái</label>
            <select
              v-model="filters.status"
              class="form-select clean-input"
            >
              <option value="">
                Tất cả
              </option>
              <option value="critical">
                Critical
              </option>
              <option value="warning">
                Warning
              </option>
              <option value="attention">
                Attention
              </option>
              <option value="stable">
                Ổn định
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
      text="Đang phân tích nhu cầu nguyên liệu..."
    />
    <ErrorState
      v-else-if="error"
      :message="error"
      @retry="handleAnalyze"
    />

    <div
      v-else-if="hasData"
      class="forecast-content"
    >
      <div class="row g-4 mb-4">
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--danger">
            <div class="kpi-card__icon">
              <i class="bi bi-exclamation-triangle" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Critical
              </div>
              <div class="kpi-card__value">
                {{ critical.length }}
              </div>
              <div class="kpi-card__subtitle">
                Cần đặt hàng ngay
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--warning">
            <div class="kpi-card__icon">
              <i class="bi bi-exclamation-circle" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Warning
              </div>
              <div class="kpi-card__value">
                {{ warning.length }}
              </div>
              <div class="kpi-card__subtitle">
                Cần chú ý
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--info">
            <div class="kpi-card__icon">
              <i class="bi bi-info-circle" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Attention
              </div>
              <div class="kpi-card__value">
                {{ attention.length }}
              </div>
              <div class="kpi-card__subtitle">
                Theo dõi
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--success">
            <div class="kpi-card__icon">
              <i class="bi bi-check-circle" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Tổng nguyên liệu
              </div>
              <div class="kpi-card__value">
                {{ summary?.totalIngredients || 0 }}
              </div>
              <div class="kpi-card__subtitle">
                Đã phân tích
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
                Xu hướng tiêu thụ
              </h5>
            </div>
            <div class="card-body">
              <ConsumptionChart
                v-if="selectedIngredient"
                :ingredient="selectedIngredient"
              />
              <EmptyState
                v-else
                title="Chọn nguyên liệu"
                message="Chọn một nguyên liệu từ bảng để xem biểu đồ tiêu thụ"
              >
                <template #icon>
                  <i class="bi bi-graph-up" />
                </template>
              </EmptyState>
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="card standard-card">
            <div class="card-header standard-card-header">
              <h5 class="card-title">
                Dự báo tổng quan
              </h5>
            </div>
            <div class="card-body">
              <ForecastSummary :summary="summary" />
            </div>
          </div>
        </div>
      </div>

      <div class="card standard-card">
        <div class="card-header standard-card-header">
          <h5 class="card-title">
            Danh sách nguyên liệu
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
          <IngredientList
            :ingredients="filteredIngredients"
            :loading="loading"
            @view="showIngredientDetail"
            @create-po="showCreatePO"
            @select="handleSelectIngredientFromList"
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

    <IngredientDetailModal
      v-if="selectedIngredient"
      :ingredient="selectedIngredient"
      @close="selectedIngredient = null"
      @select="handleSelectIngredient"
    />

    <CreatePurchaseOrderModal
      v-if="showPO"
      :ingredients="poIngredients"
      @close="showPO = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useIngredientDemandForecastStore } from '@/store/ingredientDemandForecast'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConsumptionChart from '@/components/ingredient-demand-forecast/ConsumptionChart.vue'
import ForecastSummary from '@/components/ingredient-demand-forecast/ForecastSummary.vue'
import IngredientList from '@/components/ingredient-demand-forecast/IngredientList.vue'
import IngredientDetailModal from '@/components/ingredient-demand-forecast/IngredientDetailModal.vue'
import CreatePurchaseOrderModal from '@/components/ingredient-demand-forecast/CreatePurchaseOrderModal.vue'
import * as XLSX from 'xlsx'
import logger from '@/utils/logger'

const store = useIngredientDemandForecastStore()

const loading = computed(() => store.loading)
const error = computed(() => store.error)
const hasData = computed(() => store.hasData)
const ingredients = computed(() => store.ingredients)
const critical = computed(() => store.critical)
const warning = computed(() => store.warning)
const attention = computed(() => store.attention)
const summary = computed(() => store.summary)

const exporting = ref(false)
const validationError = ref('')
const selectedPreset = ref('30d')
const searchQuery = ref('')
const selectedIngredient = ref(null)
const showPO = ref(false)
const poIngredients = ref([])

const filters = ref({
    startDate: '',
    endDate: '',
    forecastDays: 30,
    status: ''
})

const presets = [
    { value: '7d', label: '7 ngày', days: 7 },
    { value: '30d', label: '30 ngày', days: 30 },
    { value: '90d', label: '90 ngày', days: 90 }
]

const canAnalyze = computed(() => filters.value.startDate && filters.value.endDate && !validationError.value)

const filteredIngredients = computed(() => {
    let result = ingredients.value

    if (filters.value.status) {
        result = result.filter(i => i.status === filters.value.status)
    }

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(i =>
            i.name.toLowerCase().includes(query) ||
            i.unit.toLowerCase().includes(query)
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

const handleAnalyze = async () => {
    if (!canAnalyze.value || validationError.value) return

    try {
        await store.analyzeDemand({
            startDate: filters.value.startDate,
            endDate: filters.value.endDate,
            forecastDays: filters.value.forecastDays
        })
    } catch (err) {
        logger.error('Không thể phân tích nhu cầu nguyên liệu:', err)
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
        logger.error('Không thể xuất báo cáo dự báo nguyên liệu:', err)
        alert('Không thể xuất file. Vui lòng thử lại.')
    } finally {
        exporting.value = false
    }
}

const showIngredientDetail = (ingredient) => {
    selectedIngredient.value = ingredient
}

const handleSelectIngredient = (ingredient) => {
    selectedIngredient.value = ingredient
}

const handleSelectIngredientFromList = (ingredient) => {
    selectedIngredient.value = ingredient
}

const showCreatePO = (ingredient) => {
    poIngredients.value = [ingredient]
    showPO.value = true
}

onMounted(() => {
    applyPreset('30d')
})
</script>

<style scoped>
.ingredient-demand-forecast-page {
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

.kpi-card--danger .kpi-card__icon {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.kpi-card--warning .kpi-card__icon {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.kpi-card--info .kpi-card__icon {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.kpi-card--success .kpi-card__icon {
    background: var(--color-soft-emerald);
    color: var(--color-success);
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
    margin-bottom: var(--spacing-1);
}

.kpi-card__subtitle {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
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

.forecast-content {
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

