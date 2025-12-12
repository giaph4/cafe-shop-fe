<template>
  <div
    class="cancellation-analysis-page page-container container-fluid"
    data-aos="fade-up"
  >
    <PageHeader
      title="Phân tích Tỷ lệ Hủy Đơn"
      subtitle="Phân tích nguyên nhân hủy đơn và đề xuất cải thiện"
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
          <div class="col-lg-2 col-md-6">
            <label class="form-label">Từ ngày</label>
            <input
              v-model="filters.startDate"
              type="date"
              class="form-control clean-input"
              @change="validateDates"
            >
          </div>
          <div class="col-lg-2 col-md-6">
            <label class="form-label">Đến ngày</label>
            <input
              v-model="filters.endDate"
              type="date"
              class="form-control clean-input"
              @change="validateDates"
            >
          </div>
          <div class="col-lg-2 col-md-6">
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
          <div class="col-lg-6 col-md-6">
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
      text="Đang phân tích tỷ lệ hủy đơn..."
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
          <div class="kpi-card kpi-card--danger">
            <div class="kpi-card__icon">
              <i class="bi bi-x-circle" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Tỷ lệ hủy
              </div>
              <div class="kpi-card__value">
                {{ (summary?.cancellationRate || 0).toFixed(2) }}%
              </div>
              <div class="kpi-card__subtitle">
                {{ summary?.totalCancelled || 0 }} / {{ summary?.totalOrders || 0 }} đơn
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--warning">
            <div class="kpi-card__icon">
              <i class="bi bi-cash-stack" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Doanh thu mất
              </div>
              <div class="kpi-card__value">
                {{ formatCurrency(summary?.revenueLost || 0) }}
              </div>
              <div class="kpi-card__subtitle">
                Từ đơn hủy
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--info">
            <div class="kpi-card__icon">
              <i class="bi bi-cart-x" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Tổng đơn hủy
              </div>
              <div class="kpi-card__value">
                {{ formatNumber(summary?.totalCancelled || 0) }}
              </div>
              <div class="kpi-card__subtitle">
                Đơn hàng
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--primary">
            <div class="kpi-card__icon">
              <i class="bi bi-receipt" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Đơn TB/Đơn hủy
              </div>
              <div class="kpi-card__value">
                {{ formatCurrency(summary?.avgOrderValue || 0) }}
              </div>
              <div class="kpi-card__subtitle">
                Giá trị trung bình
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
                Xu hướng hủy đơn theo ngày
              </h5>
            </div>
            <div class="card-body">
              <CancellationTrendChart :daily-trend="dailyTrend" />
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="card standard-card">
            <div class="card-header standard-card-header">
              <h5 class="card-title">
                Đề xuất cải thiện
              </h5>
            </div>
            <div class="card-body">
              <RecommendationsPanel :recommendations="recommendations" />
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-lg-6">
          <div class="card standard-card">
            <div class="card-header standard-card-header">
              <h5 class="card-title">
                Hủy đơn theo giờ
              </h5>
            </div>
            <div class="card-body">
              <CancellationByHourChart :hourly-analysis="hourlyAnalysis" />
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card standard-card">
            <div class="card-header standard-card-header">
              <h5 class="card-title">
                Top 5 giờ có nhiều hủy nhất
              </h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-minimal">
                  <thead>
                    <tr>
                      <th>Giờ</th>
                      <th>Số đơn hủy</th>
                      <th>Doanh thu mất</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="hour in topCancelledHours"
                      :key="hour.hour"
                    >
                      <td class="fw-semibold">
                        {{ hour.hour }}:00
                      </td>
                      <td>{{ formatNumber(hour.count) }}</td>
                      <td class="revenue-lost">
                        {{ formatCurrency(hour.revenue) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-lg-6">
          <div class="card standard-card">
            <div class="card-header standard-card-header">
              <h5 class="card-title">
                Top 5 sản phẩm bị hủy nhiều
              </h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-minimal">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Số lần hủy</th>
                      <th>Doanh thu mất</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="product in topCancelledProducts.slice(0, 5)"
                      :key="product.productId"
                    >
                      <td class="fw-semibold">
                        {{ product.productName }}
                      </td>
                      <td>{{ formatNumber(product.count) }}</td>
                      <td class="revenue-lost">
                        {{ formatCurrency(product.revenue) }}
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
                Top 5 nguyên nhân hủy
              </h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-minimal">
                  <thead>
                    <tr>
                      <th>Nguyên nhân</th>
                      <th>Số đơn</th>
                      <th>Doanh thu mất</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="reason in topReasons"
                      :key="reason.reason"
                    >
                      <td class="fw-semibold">
                        {{ reason.reason }}
                      </td>
                      <td>{{ formatNumber(reason.count) }}</td>
                      <td class="revenue-lost">
                        {{ formatCurrency(reason.revenue) }}
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
            Danh sách đơn hủy
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
          <CancelledOrdersList
            :orders="filteredOrders"
            :loading="loading"
            @view="showOrderDetail"
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
        <i class="bi bi-x-circle" />
      </template>
    </EmptyState>

    <OrderDetailModal
      v-if="selectedOrder"
      :order="selectedOrder"
      @close="selectedOrder = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCancellationAnalysisStore } from '@/store/cancellationAnalysis'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import CancellationTrendChart from '@/components/cancellation-analysis/CancellationTrendChart.vue'
import CancellationByHourChart from '@/components/cancellation-analysis/CancellationByHourChart.vue'
import RecommendationsPanel from '@/components/cancellation-analysis/RecommendationsPanel.vue'
import CancelledOrdersList from '@/components/cancellation-analysis/CancelledOrdersList.vue'
import OrderDetailModal from '@/components/cancellation-analysis/OrderDetailModal.vue'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import * as XLSX from 'xlsx'
import logger from '@/utils/logger'

const store = useCancellationAnalysisStore()

const loading = computed(() => store.loading)
const error = computed(() => store.error)
const hasData = computed(() => store.hasData)
const summary = computed(() => store.summary)
const hourlyAnalysis = computed(() => store.hourlyAnalysis)
const topCancelledHours = computed(() => store.topCancelledHours)
const topCancelledProducts = computed(() => store.topCancelledProducts)
const topReasons = computed(() => store.topReasons)
const dailyTrend = computed(() => store.dailyTrend)
const cancelledOrders = computed(() => store.cancelledOrders)
const recommendations = computed(() => store.recommendations)

const exporting = ref(false)
const validationError = ref('')
const selectedPreset = ref('30d')
const searchQuery = ref('')
const selectedOrder = ref(null)

const filters = ref({
    startDate: '',
    endDate: ''
})

const presets = [
    { value: '7d', label: '7 ngày', days: 7 },
    { value: '30d', label: '30 ngày', days: 30 },
    { value: '90d', label: '90 ngày', days: 90 }
]

const canAnalyze = computed(() => filters.value.startDate && filters.value.endDate && !validationError.value)

const filteredOrders = computed(() => {
    let result = cancelledOrders.value

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(o => {
            const orderId = (o.id || o.orderId || '').toString().toLowerCase()
            const reason = (o.cancellationReason || o.reason || '').toLowerCase()
            return orderId.includes(query) || reason.includes(query)
        })
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
        await store.analyzeCancellations({
            startDate: filters.value.startDate,
            endDate: filters.value.endDate
        })
    } catch (err) {
        logger.error('Không thể phân tích hủy đơn:', err)
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
        logger.error('Không thể xuất báo cáo hủy đơn:', err)
        alert('Không thể xuất file. Vui lòng thử lại.')
    } finally {
        exporting.value = false
    }
}

const showOrderDetail = (order) => {
    selectedOrder.value = order
}

onMounted(() => {
    applyPreset('30d')
})
</script>

<style scoped>
.cancellation-analysis-page {
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

.kpi-card--primary .kpi-card__icon {
    background: var(--color-soft-primary);
    color: var(--color-primary);
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

.revenue-lost {
    color: var(--color-danger);
    font-weight: var(--font-weight-semibold);
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

