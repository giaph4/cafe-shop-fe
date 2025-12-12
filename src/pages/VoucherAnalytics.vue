<template>
  <div
    class="voucher-analytics-page page-container container-fluid"
    data-aos="fade-up"
  >
    <PageHeader
      title="Phân tích hiệu quả Marketing & Voucher"
      subtitle="Đo lường ROI và hiệu quả của các chiến dịch voucher"
    />

    <div class="card filter-card mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-end">
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
          <div class="col-lg-3 col-md-6">
            <label class="form-label">Voucher (tùy chọn)</label>
            <select
              v-model="filters.voucherId"
              class="form-select clean-input"
            >
              <option value="">
                Tất cả voucher
              </option>
              <option
                v-for="voucher in availableVouchers"
                :key="voucher.id"
                :value="voucher.id"
              >
                {{ voucher.code }} - {{ voucher.description || 'Không có mô tả' }}
              </option>
            </select>
          </div>
          <div class="col-lg-2 col-md-6">
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
      text="Đang phân tích dữ liệu voucher..."
    />
    <ErrorState
      v-else-if="error"
      :message="error"
      @retry="handleAnalyze"
    />

    <div
      v-else-if="analyticsData"
      class="analytics-content"
    >
      <div class="row g-4 mb-4">
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--primary">
            <div class="kpi-card__icon">
              <i class="bi bi-ticket-perforated" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Tổng voucher
              </div>
              <div class="kpi-card__value">
                {{ summary?.totalVouchers || 0 }}
              </div>
              <div class="kpi-card__subtitle">
                {{ summary?.activeVouchers || 0 }} đang hoạt động
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
                Tổng sử dụng
              </div>
              <div class="kpi-card__value">
                {{ formatNumber(summary?.totalUsage || 0) }}
              </div>
              <div class="kpi-card__subtitle">
                Lần sử dụng
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--warning">
            <div class="kpi-card__icon">
              <i class="bi bi-tag" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Tổng giảm giá
              </div>
              <div class="kpi-card__value">
                {{ formatCurrency(summary?.totalDiscount || 0) }}
              </div>
              <div class="kpi-card__subtitle">
                Đã chiết khấu
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6">
          <div
            class="kpi-card"
            :class="(summary?.avgROI || 0) >= 0 ? 'kpi-card--success' : 'kpi-card--danger'"
          >
            <div class="kpi-card__icon">
              <i class="bi bi-graph-up-arrow" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                ROI trung bình
              </div>
              <div class="kpi-card__value">
                {{ (summary?.avgROI || 0).toFixed(2) }}%
              </div>
              <div class="kpi-card__subtitle">
                Hiệu quả đầu tư
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card standard-card mb-4">
        <div class="card-header standard-card-header">
          <h5 class="card-title">
            Biểu đồ sử dụng voucher
          </h5>
          <button
            class="btn btn-flat btn-flat--outline btn-sm"
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
        </div>
        <div class="card-body">
          <VoucherUsageChart
            v-if="usageOverTime && usageOverTime.length > 0"
            :usage-data="usageOverTime"
          />
          <EmptyState
            v-else
            message="Chưa có dữ liệu sử dụng"
            icon="bi-graph-up"
          />
        </div>
      </div>

      <div class="card standard-card">
        <div class="card-header standard-card-header">
          <h5 class="card-title">
            Bảng so sánh voucher
          </h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-minimal">
              <thead>
                <tr>
                  <th>Mã voucher</th>
                  <th>Loại</th>
                  <th>Sử dụng</th>
                  <th>Giảm giá</th>
                  <th>Doanh thu</th>
                  <th>ROI</th>
                  <th>Khách hàng</th>
                  <th>Trạng thái</th>
                  <th>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="voucher in vouchers"
                  :key="voucher.voucherId"
                >
                  <td>
                    <strong class="voucher-code">{{ voucher.code }}</strong>
                    <br>
                    <small class="voucher-description">{{ voucher.description || 'Không có mô tả' }}</small>
                  </td>
                  <td>
                    <span
                      class="badge badge-soft"
                      :class="voucher.type === 'FIXED_AMOUNT' ? 'badge-primary' : 'badge-info'"
                    >
                      {{ voucher.type === 'FIXED_AMOUNT' ? 'Cố định' : 'Phần trăm' }}
                    </span>
                  </td>
                  <td class="fw-semibold usage-count">
                    {{ formatNumber(voucher.metrics.totalUsage) }}
                  </td>
                  <td class="discount-amount">
                    {{ formatCurrency(voucher.metrics.totalDiscount) }}
                  </td>
                  <td class="revenue-amount">
                    {{ formatCurrency(voucher.metrics.totalRevenue) }}
                  </td>
                  <td>
                    <span
                      class="badge badge-soft"
                      :class="voucher.metrics.roi >= 0 ? 'badge-success' : 'badge-danger'"
                    >
                      {{ voucher.metrics.roi.toFixed(2) }}%
                    </span>
                  </td>
                  <td class="customers-count">
                    {{ formatNumber(voucher.metrics.uniqueCustomers) }}
                  </td>
                  <td>
                    <span
                      class="badge badge-soft"
                      :class="voucher.active ? 'badge-success' : 'badge-neutral'"
                    >
                      {{ voucher.active ? 'Hoạt động' : 'Tạm dừng' }}
                    </span>
                  </td>
                  <td>
                    <button
                      class="btn btn-flat btn-flat--outline btn-sm"
                      @click="showVoucherDetail(voucher)"
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

    <EmptyState
      v-else
      message="Chọn khoảng thời gian và nhấn 'Phân tích' để bắt đầu"
      icon="bi-graph-up-arrow"
    />

    <VoucherDetailModal
      v-if="selectedVoucher"
      :voucher="selectedVoucher"
      @close="selectedVoucher = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useVoucherAnalyticsStore } from '@/store/voucherAnalytics'
import * as voucherService from '@/api/voucherService'
import VoucherUsageChart from '@/components/voucher-analytics/VoucherUsageChart.vue'
import VoucherDetailModal from '@/components/voucher-analytics/VoucherDetailModal.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import * as XLSX from 'xlsx'
import logger from '@/utils/logger'

const store = useVoucherAnalyticsStore()

const loading = computed(() => store.loading)
const error = computed(() => store.error)
const analyticsData = computed(() => store.analyticsData)
const usageOverTime = computed(() => store.usageOverTime)
const summary = computed(() => store.summary)
const vouchers = computed(() => store.vouchers)

const exporting = ref(false)
const validationError = ref('')
const selectedPreset = ref('30d')
const availableVouchers = ref([])
const selectedVoucher = ref(null)

const filters = ref({
    startDate: '',
    endDate: '',
    voucherId: ''
})

const presets = [
    { value: '7d', label: '7 ngày', days: 7 },
    { value: '30d', label: '30 ngày', days: 30 },
    { value: '90d', label: '90 ngày', days: 90 },
    { value: '180d', label: '6 tháng', days: 180 }
]

const canAnalyze = computed(() => filters.value.startDate && filters.value.endDate && !validationError.value)

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

const loadVouchers = async () => {
    try {
        const data = await voucherService.searchVouchers({ page: 0, size: 1000 })
        availableVouchers.value = Array.isArray(data) ? data : (data?.content || [])
    } catch (err) {
        logger.error('Không thể tải danh sách voucher:', err)
    }
}

const handleAnalyze = async () => {
    if (!canAnalyze.value || validationError.value) return

    try {
        await Promise.all([
            store.analyzePerformance({
                startDate: filters.value.startDate,
                endDate: filters.value.endDate,
                voucherId: filters.value.voucherId || null
            }),
            store.getUsageOverTime({
                startDate: filters.value.startDate,
                endDate: filters.value.endDate,
                voucherId: filters.value.voucherId || null
            })
        ])
    } catch (err) {
        logger.error('Không thể phân tích voucher:', err)
    }
}

const handleExport = async () => {
    if (!analyticsData.value) return

    exporting.value = true
    try {
        const exportData = await store.exportAnalytics()

        const ws = XLSX.utils.aoa_to_sheet(exportData.data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, exportData.sheetName)

        XLSX.writeFile(wb, exportData.filename)
    } catch (err) {
        logger.error('Không thể xuất báo cáo voucher:', err)
        alert('Không thể xuất file. Vui lòng thử lại.')
    } finally {
        exporting.value = false
    }
}

const showVoucherDetail = (voucher) => {
    selectedVoucher.value = voucher
}

onMounted(() => {
    applyPreset('30d')
    loadVouchers()
})
</script>

<style scoped>
/* Page Container */
.voucher-analytics-page {
    background: var(--color-body-bg);
    padding: var(--spacing-4);
    min-height: 100vh;
}

/* KPI Cards - Chuẩn hóa theo Global Design System */
.kpi-card {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-4);
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    transition: all var(--transition-base);
    min-height: 120px;
    height: 100%;
}

.kpi-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
}

.kpi-card__icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
    transition: all var(--transition-base);
}

/* KPI Card Variants - Màu icon theo design system */
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

.kpi-card--danger .kpi-card__icon {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.kpi-card__content {
    flex: 1;
    min-width: 0;
}

.kpi-card__label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-2);
    line-height: var(--line-height-normal);
    font-family: var(--font-family-sans);
}

.kpi-card__value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
    margin-bottom: var(--spacing-1);
}

.kpi-card__subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
    line-height: var(--line-height-normal);
}

/* Filter Card - Chuẩn hóa */
.filter-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    box-shadow: none;
}

.filter-card :global(.card-body) {
    padding: var(--spacing-5);
}

/* Form Labels - Chuẩn hóa */
:deep(.form-label) {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
}

/* Button Group - Chuẩn hóa */
.btn-group {
    display: flex;
    gap: var(--spacing-1);
    flex-wrap: wrap;
}

.btn-group .btn-flat {
    flex: 1;
    min-width: 0;
}

/* Alert Styles - Chuẩn hóa */
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

.alert i {
    color: var(--color-warning);
}

/* Typography chuẩn hóa */
:deep(.card-title) {
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    margin: 0;
}

/* Table Content Styles */
.voucher-code {
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-semibold);
}

.voucher-description {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.usage-count {
    font-family: var(--font-family-sans);
    color: var(--color-text);
}

.discount-amount {
    color: var(--color-warning);
    font-family: var(--font-family-sans);
}

.revenue-amount {
    color: var(--color-success);
    font-family: var(--font-family-sans);
}

.customers-count {
    font-family: var(--font-family-sans);
    color: var(--color-text);
}

/* Badge Styles */
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

.badge-success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.badge-danger {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.badge-neutral {
    background: var(--color-soft-neutral);
    color: var(--color-text-muted);
}

/* Content Animation */
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

/* Responsive improvements */
@media (max-width: 768px) {
    .kpi-card {
        min-height: 100px;
        padding: var(--spacing-3);
    }

    .kpi-card__icon {
        width: 48px;
        height: 48px;
        font-size: 20px;
    }

    .kpi-card__value {
        font-size: var(--font-size-lg);
    }

    .btn-group {
        flex-direction: column;
    }

    .btn-group .btn-flat {
        width: 100%;
    }
}
</style>

