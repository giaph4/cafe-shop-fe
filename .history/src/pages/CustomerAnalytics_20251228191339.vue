<template>
  <div
    class="customer-analytics-page page-container container-fluid"
      
  >
    <PageHeader
      title="Phân tích Khách hàng & Loyalty"
      subtitle="Phân tích hành vi khách hàng và đề xuất chiến lược loyalty"
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
            <label class="form-label">Phân loại</label>
            <select
              v-model="filters.segment"
              class="form-select clean-input"
            >
              <option value="">
                Tất cả
              </option>
              <option value="VIP">
                VIP
              </option>
              <option value="Regular">
                Thường xuyên
              </option>
              <option value="Occasional">
                Thỉnh thoảng
              </option>
              <option value="At-risk">
                Có nguy cơ
              </option>
              <option value="New">
                Mới
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
          <div class="col-lg-3 col-md-6">
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
      text="Đang phân tích khách hàng..."
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
        <div class="col-lg-2 col-md-4 col-sm-6">
          <div class="kpi-card kpi-card--primary">
            <div class="kpi-card__icon">
              <i class="bi bi-people" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Tổng khách hàng
              </div>
              <div class="kpi-card__value">
                {{ customers.length }}
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-2 col-md-4 col-sm-6">
          <div class="kpi-card kpi-card--success">
            <div class="kpi-card__icon">
              <i class="bi bi-star" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                VIP
              </div>
              <div class="kpi-card__value">
                {{ segments.VIP?.length || 0 }}
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-2 col-md-4 col-sm-6">
          <div class="kpi-card kpi-card--info">
            <div class="kpi-card__icon">
              <i class="bi bi-person-check" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Thường xuyên
              </div>
              <div class="kpi-card__value">
                {{ segments.Regular?.length || 0 }}
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-2 col-md-4 col-sm-6">
          <div class="kpi-card kpi-card--warning">
            <div class="kpi-card__icon">
              <i class="bi bi-exclamation-triangle" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Có nguy cơ
              </div>
              <div class="kpi-card__value">
                {{ segments['At-risk']?.length || 0 }}
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-2 col-md-4 col-sm-6">
          <div class="kpi-card kpi-card--danger">
            <div class="kpi-card__icon">
              <i class="bi bi-cash-stack" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Tổng chi tiêu
              </div>
              <div class="kpi-card__value">
                {{ formatCurrency(totalSpend) }}
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-2 col-md-4 col-sm-6">
          <div class="kpi-card kpi-card--info">
            <div class="kpi-card__icon">
              <i class="bi bi-cart" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Tổng đơn hàng
              </div>
              <div class="kpi-card__value">
                {{ formatNumber(totalOrders) }}
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
                Phân loại khách hàng
              </h5>
            </div>
            <div class="card-body">
              <CustomerSegments :segments="segments" />
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card standard-card">
            <div class="card-header standard-card-header">
              <h5 class="card-title">
                Phân tích RFM
              </h5>
            </div>
            <div class="card-body">
              <RFMChart :customers="filteredCustomers" />
            </div>
          </div>
        </div>
      </div>

      <div class="card standard-card mb-4">
        <div class="card-header standard-card-header">
          <h5 class="card-title">
            Top 10 khách hàng
          </h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-minimal">
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Khách hàng</th>
                  <th>Phân loại</th>
                  <th>Tổng chi tiêu</th>
                  <th>Số đơn</th>
                  <th>Đơn TB</th>
                  <th>RFM Score</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(customer, index) in topCustomers"
                  :key="customer.customerId"
                >
                  <td>
                    <span
                      class="rank-badge"
                      :class="getRankClass(index)"
                    >
                      {{ index + 1 }}
                    </span>
                  </td>
                  <td>
                    <div>
                      <div class="fw-semibold customer-name">
                        {{ customer.fullName }}
                      </div>
                      <small class="text-muted">{{ customer.phone }}</small>
                    </div>
                  </td>
                  <td>
                    <span
                      class="badge badge-soft"
                      :class="getSegmentClass(customer.segment)"
                    >
                      {{ customer.segment }}
                    </span>
                  </td>
                  <td class="revenue-cell">
                    {{ formatCurrency(customer.metrics.totalSpend) }}
                  </td>
                  <td>{{ formatNumber(customer.metrics.orderCount) }}</td>
                  <td>{{ formatCurrency(customer.metrics.avgOrderValue) }}</td>
                  <td>
                    <span
                      class="score-badge"
                      :class="getScoreClass(customer.metrics.rfmScore)"
                    >
                      {{ customer.metrics.rfmScore }}
                    </span>
                  </td>
                  <td>
                    <button
                      class="btn btn-flat btn-flat--outline btn-sm"
                      title="Xem chi tiết"
                      @click="showCustomerDetail(customer)"
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

      <div class="card standard-card">
        <div class="card-header standard-card-header">
          <h5 class="card-title">
            Danh sách khách hàng
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
          <CustomerList
            :customers="filteredCustomers"
            :loading="loading"
            @view="showCustomerDetail"
            @create-campaign="showCampaignBuilder"
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

    <CustomerDetailModal
      v-if="selectedCustomer"
      :customer="selectedCustomer"
      :start-date="filters.startDate"
      :end-date="filters.endDate"
      @close="selectedCustomer = null"
    />

    <CampaignBuilderModal
      v-if="showCampaign"
      :customer-segment="campaignSegment"
      @close="showCampaign = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCustomerAnalyticsStore } from '@/store/customerAnalytics'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import CustomerSegments from '@/components/customer-analytics/CustomerSegments.vue'
import RFMChart from '@/components/customer-analytics/RFMChart.vue'
import CustomerList from '@/components/customer-analytics/CustomerList.vue'
import CustomerDetailModal from '@/components/customer-analytics/CustomerDetailModal.vue'
import CampaignBuilderModal from '@/components/customer-analytics/CampaignBuilderModal.vue'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import * as XLSX from 'xlsx'
import logger from '@/utils/logger'

const store = useCustomerAnalyticsStore()

const loading = computed(() => store.loading)
const error = computed(() => store.error)
const hasData = computed(() => store.hasData)
const customers = computed(() => store.customers)
const segments = computed(() => store.segments)
const topCustomers = computed(() => store.topCustomers)

const exporting = ref(false)
const validationError = ref('')
const selectedPreset = ref('30d')
const searchQuery = ref('')
const selectedCustomer = ref(null)
const showCampaign = ref(false)
const campaignSegment = ref(null)

const filters = ref({
    startDate: '',
    endDate: '',
    segment: ''
})

const presets = [
    { value: '7d', label: '7 ngày', days: 7 },
    { value: '30d', label: '30 ngày', days: 30 },
    { value: '90d', label: '90 ngày', days: 90 },
    { value: '180d', label: '6 tháng', days: 180 }
]

const canAnalyze = computed(() => filters.value.startDate && filters.value.endDate && !validationError.value)

const totalSpend = computed(() => customers.value.reduce((sum, c) => sum + (c.metrics?.totalSpend || 0), 0))

const totalOrders = computed(() => customers.value.reduce((sum, c) => sum + (c.metrics?.orderCount || 0), 0))

const filteredCustomers = computed(() => {
    let result = customers.value

    if (filters.value.segment) {
        result = result.filter(c => c.segment === filters.value.segment)
    }

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(c =>
            c.fullName.toLowerCase().includes(query) ||
            c.phone?.toLowerCase().includes(query) ||
            c.email?.toLowerCase().includes(query)
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
        await store.analyzeCustomers({
            startDate: filters.value.startDate,
            endDate: filters.value.endDate
        })
    } catch (err) {
        logger.error('Không thể phân tích khách hàng:', err)
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
        logger.error('Không thể xuất báo cáo khách hàng:', err)
        alert('Không thể xuất file. Vui lòng thử lại.')
    } finally {
        exporting.value = false
    }
}

const showCustomerDetail = (customer) => {
    selectedCustomer.value = customer
}

const showCampaignBuilder = (segment) => {
    campaignSegment.value = segment
    showCampaign.value = true
}

const getRankClass = (index) => {
    if (index === 0) return 'rank-gold'
    if (index === 1) return 'rank-silver'
    if (index === 2) return 'rank-bronze'
    return 'rank-normal'
}

const getSegmentClass = (segment) => {
    const classes = {
        'VIP': 'badge-primary',
        'Regular': 'badge-info',
        'Occasional': 'badge-warning',
        'At-risk': 'badge-danger',
        'New': 'badge-neutral'
    }
    return classes[segment] || 'badge-neutral'
}

const getScoreClass = (score) => {
    if (score >= 13) return 'score-excellent'
    if (score >= 10) return 'score-good'
    if (score >= 7) return 'score-average'
    return 'score-poor'
}

onMounted(() => {
    applyPreset('30d')
})
</script>

<style scoped>
.customer-analytics-page {
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

.kpi-card--success .kpi-card__icon {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.kpi-card--warning .kpi-card__icon {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.kpi-card--info .kpi-card__icon {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.kpi-card--danger .kpi-card__icon {
    background: var(--color-soft-rose);
    color: var(--color-danger);
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

.customer-name {
    font-family: var(--font-family-sans);
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
}

.rank-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
}

.rank-gold {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.rank-silver {
    background: var(--color-soft-neutral);
    color: var(--color-text-muted);
}

.rank-bronze {
    background: var(--color-soft-amber);
    color: var(--color-warning);
    opacity: 0.7;
}

.rank-normal {
    background: var(--color-card-muted);
    color: var(--color-text);
}

.badge-soft {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    border: 1px solid transparent;
    display: inline-block;
}

.badge-primary {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.badge-info {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.badge-warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.badge-danger {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.badge-neutral {
    background: var(--color-card-muted);
    color: var(--color-text-muted);
}

.revenue-cell {
    font-family: var(--font-family-sans);
    color: var(--color-success);
    font-weight: var(--font-weight-semibold);
}

.score-badge {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
}

.score-excellent {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.score-good {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.score-average {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.score-poor {
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

