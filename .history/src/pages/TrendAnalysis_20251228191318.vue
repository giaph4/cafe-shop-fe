<template>
  <div
    class="trend-analysis-page page-container container-fluid"
      
  >
    <PageHeader
      title="Phân tích Xu hướng và Seasonal Patterns"
      subtitle="Phân tích xu hướng dài hạn và seasonal patterns"
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
          <div class="col-lg-2 col-md-4 col-sm-6">
            <label class="form-label">Metric</label>
            <select
              v-model="filters.metric"
              class="form-select clean-input"
            >
              <option value="revenue">
                Doanh thu
              </option>
              <option value="orders">
                Đơn hàng
              </option>
            </select>
          </div>
          <div class="col-lg-3 col-md-6">
            <label class="form-label d-block">&nbsp;</label>
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
      text="Đang phân tích xu hướng..."
    />
    <ErrorState
      v-else-if="error"
      :message="error"
      @retry="handleAnalyze"
    />

    <div
      v-else-if="hasData"
      class="analysis-content"
    >
      <div class="row g-4 mb-4">
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--primary">
            <div class="kpi-card__icon">
              <i class="bi bi-graph-up" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Tăng trưởng Tuần
              </div>
              <div
                class="kpi-card__value"
                :class="growthMetrics?.wow >= 0 ? 'text-success' : 'text-danger'"
              >
                {{ growthMetrics?.wow >= 0 ? '+' : '' }}{{ (growthMetrics?.wow || 0).toFixed(1) }}%
              </div>
              <div class="kpi-card__subtitle">
                Week-over-week
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--info">
            <div class="kpi-card__icon">
              <i class="bi bi-calendar-month" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Tăng trưởng Tháng
              </div>
              <div
                class="kpi-card__value"
                :class="growthMetrics?.mom >= 0 ? 'text-success' : 'text-danger'"
              >
                {{ growthMetrics?.mom >= 0 ? '+' : '' }}{{ (growthMetrics?.mom || 0).toFixed(1) }}%
              </div>
              <div class="kpi-card__subtitle">
                Month-over-month
              </div>
            </div>
          </div>
        </div>
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
              <div class="kpi-card__subtitle">
                {{ summary?.totalDays || 0 }} ngày
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--warning">
            <div class="kpi-card__icon">
              <i class="bi bi-cart" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Tổng đơn hàng
              </div>
              <div class="kpi-card__value">
                {{ formatNumber(summary?.totalOrders || 0) }}
              </div>
              <div class="kpi-card__subtitle">
                Đơn hàng
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="anomalies.length > 0"
        class="alerts-section mb-4"
      >
        <div class="alert alert-warning">
          <div class="d-flex align-items-center gap-3">
            <i class="bi bi-exclamation-triangle-fill alert-icon" />
            <div class="flex-grow-1">
              <div class="alert-title">
                Phát hiện {{ anomalies.length }} bất thường
              </div>
              <div class="alert-message">
                Có những ngày có doanh thu bất thường so với trung bình
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
                Xu hướng theo thời gian
              </h5>
            </div>
            <div class="card-body">
              <TrendChart
                :daily-data="dailyData"
                :anomalies="anomalies"
              />
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="card standard-card">
            <div class="card-header standard-card-header">
              <h5 class="card-title">
                Pattern theo tuần
              </h5>
            </div>
            <div class="card-body">
              <WeeklyPatternChart :weekly-pattern="weeklyPattern" />
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-lg-6">
          <div class="card standard-card">
            <div class="card-header standard-card-header">
              <h5 class="card-title">
                Pattern theo tháng
              </h5>
            </div>
            <div class="card-body">
              <MonthlyPatternChart :monthly-pattern="monthlyPattern" />
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card standard-card">
            <div class="card-header standard-card-header">
              <h5 class="card-title">
                Xu hướng theo danh mục
              </h5>
            </div>
            <div class="card-body">
              <CategoryTrendsChart :category-trends="categoryTrends" />
            </div>
          </div>
        </div>
      </div>

      <div class="card standard-card">
        <div class="card-header standard-card-header">
          <h5 class="card-title">
            Chi tiết theo ngày
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
          <DailyDataList
            :daily-data="filteredDailyData"
            :loading="loading"
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTrendAnalysisStore } from '@/store/trendAnalysis'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import TrendChart from '@/components/trend-analysis/TrendChart.vue'
import WeeklyPatternChart from '@/components/trend-analysis/WeeklyPatternChart.vue'
import MonthlyPatternChart from '@/components/trend-analysis/MonthlyPatternChart.vue'
import CategoryTrendsChart from '@/components/trend-analysis/CategoryTrendsChart.vue'
import DailyDataList from '@/components/trend-analysis/DailyDataList.vue'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import * as XLSX from 'xlsx'
import logger from '@/utils/logger'

const store = useTrendAnalysisStore()

const loading = computed(() => store.loading)
const error = computed(() => store.error)
const hasData = computed(() => store.hasData)
const dailyData = computed(() => store.dailyData)
const weeklyPattern = computed(() => store.weeklyPattern)
const monthlyPattern = computed(() => store.monthlyPattern)
const categoryTrends = computed(() => store.categoryTrends)
const anomalies = computed(() => store.anomalies)
const growthMetrics = computed(() => store.growthMetrics)
const summary = computed(() => store.summary)

const exporting = ref(false)
const validationError = ref('')
const selectedPreset = ref('365d')
const searchQuery = ref('')

const filters = ref({
    startDate: '',
    endDate: '',
    metric: 'revenue'
})

const presets = [
    { value: '90d', label: '3 tháng', days: 90 },
    { value: '180d', label: '6 tháng', days: 180 },
    { value: '365d', label: '1 năm', days: 365 },
    { value: '730d', label: '2 năm', days: 730 }
]

const canAnalyze = computed(() => filters.value.startDate && filters.value.endDate && !validationError.value)

const filteredDailyData = computed(() => {
    let result = dailyData.value

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(d => d.date.includes(query))
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
        return
    }

    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    if (daysDiff < 30) {
        validationError.value = 'Cần ít nhất 30 ngày dữ liệu để phân tích xu hướng'
        return
    }

    if (daysDiff > 730) {
        validationError.value = 'Khoảng thời gian không được vượt quá 2 năm'
    }
}

const handleAnalyze = async () => {
    if (!canAnalyze.value || validationError.value) return

    try {
        await store.analyzeTrends({
            startDate: filters.value.startDate,
            endDate: filters.value.endDate,
            metric: filters.value.metric
        })
    } catch (err) {
        logger.error('Không thể phân tích xu hướng:', err)
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
        logger.error('Không thể xuất báo cáo xu hướng:', err)
        alert('Không thể xuất file. Vui lòng thử lại.')
    } finally {
        exporting.value = false
    }
}

onMounted(() => {
    applyPreset('365d')
})
</script>

<style scoped>
.trend-analysis-page {
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

.kpi-card--primary .kpi-card__icon {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.kpi-card--info .kpi-card__icon {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.kpi-card--success .kpi-card__icon {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.kpi-card--warning .kpi-card__icon {
    background: var(--color-soft-amber);
    color: var(--color-warning);
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
    box-shadow: none;
}

.filter-card :global(.card-body) {
    padding: var(--spacing-4);
}

.filter-card :global(.form-label) {
    font-size: var(--font-size-sm);
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

.filter-card :global(.btn-group) {
    display: flex;
    gap: var(--spacing-1);
    flex-wrap: wrap;
}

.filter-card :global(.btn-group .btn-flat) {
    flex: 1;
    min-width: 0;
    font-size: var(--font-size-sm);
    padding: var(--spacing-2) var(--spacing-3);
    white-space: nowrap;
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

.alert-icon {
    color: var(--color-warning);
    font-size: 1.25rem;
}

.alert-title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    margin-bottom: var(--spacing-1);
}

.alert-message {
    font-size: var(--font-size-sm);
    color: var(--color-text);
    font-family: var(--font-family-sans);
}

.analysis-content {
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

