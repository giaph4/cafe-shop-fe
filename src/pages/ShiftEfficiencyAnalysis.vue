<template>
  <div
    class="shift-efficiency-page page-container container-fluid"
    data-aos="fade-up"
  >
    <PageHeader
      title="Phân tích Hiệu quả Ca làm việc"
      subtitle="Phân tích hiệu quả ca làm việc và đề xuất tối ưu lịch làm việc"
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
        <div class="row g-3 align-items-end">
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
      text="Đang phân tích hiệu quả ca làm việc..."
    />
    <ErrorState
      v-else-if="error"
      :message="error"
      @retry="handleAnalyze"
    />

    <div
      v-else-if="hasData"
      class="efficiency-content"
    >
      <div class="row g-4 mb-4">
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--primary">
            <div class="kpi-card__icon">
              <i class="bi bi-calendar-check" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Tổng số ca
              </div>
              <div class="kpi-card__value">
                {{ summary?.totalShifts || 0 }}
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--success">
            <div class="kpi-card__icon">
              <i class="bi bi-graph-up" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Hiệu quả TB
              </div>
              <div class="kpi-card__value">
                {{ (summary?.avgEfficiency || 0).toFixed(1) }}
              </div>
              <div class="kpi-card__subtitle">
                điểm
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--info">
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
          <div class="kpi-card kpi-card--warning">
            <div class="kpi-card__icon">
              <i class="bi bi-people" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Giờ nhân viên
              </div>
              <div class="kpi-card__value">
                {{ formatNumber(summary?.totalStaffHours || 0, 1) }}
              </div>
              <div class="kpi-card__subtitle">
                giờ
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
                Nhu cầu theo giờ vs Nhân sự
              </h5>
            </div>
            <div class="card-body">
              <HourlyDemandChart :hourly-analysis="hourlyAnalysis" />
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="card standard-card">
            <div class="card-header standard-card-header">
              <h5 class="card-title">
                Đề xuất tối ưu
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
                Top 5 ca hiệu quả cao
              </h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-minimal">
                  <thead>
                    <tr>
                      <th>Ca</th>
                      <th>Ngày</th>
                      <th>Nhân viên</th>
                      <th>Doanh thu</th>
                      <th>Điểm</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="shift in topShifts"
                      :key="shift.shiftId"
                    >
                      <td>
                        <div class="fw-semibold shift-name">
                          {{ shift.shiftName }}
                        </div>
                        <small class="text-muted">{{ formatTime(shift.startTime) }} - {{ formatTime(shift.endTime) }}</small>
                      </td>
                      <td>{{ formatDate(shift.date) }}</td>
                      <td>{{ formatNumber(shift.staffCount) }}</td>
                      <td class="revenue-cell">
                        {{ formatCurrency(shift.revenue) }}
                      </td>
                      <td>
                        <span class="score-badge score-excellent">{{ shift.efficiencyScore.toFixed(1) }}</span>
                      </td>
                      <td>
                        <button
                          class="btn btn-flat btn-flat--outline btn-sm"
                          title="Xem chi tiết"
                          @click="showShiftDetail(shift)"
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
                Ca cần tối ưu
              </h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-minimal">
                  <thead>
                    <tr>
                      <th>Ca</th>
                      <th>Ngày</th>
                      <th>Nhân viên</th>
                      <th>Doanh thu</th>
                      <th>Điểm</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="shift in lowEfficiencyShifts"
                      :key="shift.shiftId"
                    >
                      <td>
                        <div class="fw-semibold shift-name">
                          {{ shift.shiftName }}
                        </div>
                        <small class="text-muted">{{ formatTime(shift.startTime) }} - {{ formatTime(shift.endTime) }}</small>
                      </td>
                      <td>{{ formatDate(shift.date) }}</td>
                      <td>{{ formatNumber(shift.staffCount) }}</td>
                      <td class="revenue-cell">
                        {{ formatCurrency(shift.revenue) }}
                      </td>
                      <td>
                        <span class="score-badge score-poor">{{ shift.efficiencyScore.toFixed(1) }}</span>
                      </td>
                      <td>
                        <button
                          class="btn btn-flat btn-flat--outline btn-sm"
                          title="Xem chi tiết"
                          @click="showShiftDetail(shift)"
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
      </div>

      <div class="card standard-card mb-4">
        <div class="card-header standard-card-header">
          <h5 class="card-title">
            Lịch ca làm việc
          </h5>
        </div>
        <div class="card-body">
          <ShiftCalendar
            :shifts="shifts"
            @select="showShiftDetail"
          />
        </div>
      </div>

      <div class="card standard-card">
        <div class="card-header standard-card-header">
          <h5 class="card-title">
            Danh sách ca làm việc
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
          <ShiftList
            :shifts="filteredShifts"
            :loading="loading"
            @view="showShiftDetail"
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

    <ShiftDetailModal
      v-if="selectedShift"
      :shift="selectedShift"
      @close="selectedShift = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useShiftEfficiencyStore } from '@/store/shiftEfficiency'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import HourlyDemandChart from '@/components/shift-efficiency/HourlyDemandChart.vue'
import RecommendationsPanel from '@/components/shift-efficiency/RecommendationsPanel.vue'
import ShiftCalendar from '@/components/shift-efficiency/ShiftCalendar.vue'
import ShiftList from '@/components/shift-efficiency/ShiftList.vue'
import ShiftDetailModal from '@/components/shift-efficiency/ShiftDetailModal.vue'
import { formatCurrency, formatNumber, formatDate, formatTime } from '@/utils/formatters'
import * as XLSX from 'xlsx'
import logger from '@/utils/logger'

const store = useShiftEfficiencyStore()

const loading = computed(() => store.loading)
const error = computed(() => store.error)
const hasData = computed(() => store.hasData)
const shifts = computed(() => store.shifts)
const hourlyAnalysis = computed(() => store.hourlyAnalysis)
const topShifts = computed(() => store.topShifts)
const lowEfficiencyShifts = computed(() => store.lowEfficiencyShifts)
const recommendations = computed(() => store.recommendations)
const summary = computed(() => store.summary)

const exporting = ref(false)
const validationError = ref('')
const selectedPreset = ref('7d')
const searchQuery = ref('')
const selectedShift = ref(null)

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

const filteredShifts = computed(() => {
    let result = shifts.value

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(s =>
            s.shiftName.toLowerCase().includes(query) ||
            s.date.includes(query)
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
        await store.analyzeEfficiency({
            startDate: filters.value.startDate,
            endDate: filters.value.endDate
        })
    } catch (err) {
        logger.error('Không thể phân tích hiệu suất ca làm:', err)
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
        logger.error('Không thể xuất báo cáo hiệu suất ca làm:', err)
        alert('Không thể xuất file. Vui lòng thử lại.')
    } finally {
        exporting.value = false
    }
}

const showShiftDetail = (shift) => {
    selectedShift.value = shift
}

onMounted(() => {
    applyPreset('7d')
})
</script>

<style scoped>
.shift-efficiency-page {
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

.kpi-card--info .kpi-card__icon {
    background: var(--color-soft-sky);
    color: var(--color-info);
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

.shift-name {
    font-family: var(--font-family-sans);
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
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

.score-poor {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.efficiency-content {
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

