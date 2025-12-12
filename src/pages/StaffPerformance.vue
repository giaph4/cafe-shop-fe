<template>
  <div
    class="staff-performance-page page-container container-fluid"
    data-aos="fade-up"
  >
    <PageHeader
      title="Phân tích hiệu suất nhân viên"
      subtitle="Đánh giá toàn diện hiệu suất và hiệu quả làm việc của nhân viên"
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
            <label class="form-label">Nhân viên (tùy chọn)</label>
            <select
              v-model="filters.userId"
              class="form-select clean-input"
            >
              <option value="">
                Tất cả nhân viên
              </option>
              <option
                v-for="staff in availableStaff"
                :key="staff.id"
                :value="staff.id"
              >
                {{ staff.fullName }}
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
      text="Đang phân tích hiệu suất nhân viên..."
    />
    <ErrorState
      v-else-if="error"
      :message="error"
      @retry="handleAnalyze"
    />

    <div
      v-else-if="hasData"
      class="performance-content"
    >
      <div class="row g-4 mb-4">
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--primary">
            <div class="kpi-card__icon">
              <i class="bi bi-people" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Tổng nhân viên
              </div>
              <div class="kpi-card__value">
                {{ staffList.length }}
              </div>
              <div class="kpi-card__subtitle">
                Đã phân tích
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--success">
            <div class="kpi-card__icon">
              <i class="bi bi-trophy" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Top performer
              </div>
              <div class="kpi-card__value">
                {{ topPerformers[0]?.fullName || 'N/A' }}
              </div>
              <div class="kpi-card__subtitle">
                {{ topPerformers[0] ? formatNumber(topPerformers[0].metrics.performanceScore.toFixed(1)) : 0 }} điểm
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
                Doanh thu TB
              </div>
              <div class="kpi-card__value">
                {{ formatCurrency(teamMetrics?.avgRevenue || 0) }}
              </div>
              <div class="kpi-card__subtitle">
                Theo nhân viên
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--warning">
            <div class="kpi-card__icon">
              <i class="bi bi-clipboard-check" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Đơn hàng TB
              </div>
              <div class="kpi-card__value">
                {{ formatNumber(teamMetrics?.avgOrders || 0) }}
              </div>
              <div class="kpi-card__subtitle">
                Theo nhân viên
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card standard-card mb-4">
        <div class="card-header standard-card-header">
          <h5 class="card-title">
            Bảng xếp hạng
          </h5>
          <button
            class="btn btn-flat btn-flat--outline btn-sm"
            :disabled="selectedStaffIds.length < 2"
            @click="showComparisonModal"
          >
            <i class="bi bi-bar-chart me-2" />
            So sánh
          </button>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-minimal">
              <thead>
                <tr>
                  <th style="width: 40px;">
                    <input
                      type="checkbox"
                      class="form-check-input"
                      :checked="allSelected"
                      @change="toggleSelectAll"
                    >
                  </th>
                  <th>Hạng</th>
                  <th>Nhân viên</th>
                  <th>Điểm hiệu suất</th>
                  <th>Doanh thu</th>
                  <th>Số đơn</th>
                  <th>Chuyên cần</th>
                  <th>Đúng giờ</th>
                  <th>Tips</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(staff, index) in staffList"
                  :key="staff.userId"
                >
                  <td>
                    <input
                      v-model="selectedStaffIds"
                      type="checkbox"
                      class="form-check-input"
                      :value="staff.userId"
                    >
                  </td>
                  <td>
                    <span
                      class="rank-badge"
                      :class="getRankClass(index)"
                    >
                      {{ index + 1 }}
                    </span>
                  </td>
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <div
                        v-if="staff.avatarUrl"
                        class="staff-avatar"
                      >
                        <img
                          :src="staff.avatarUrl"
                          :alt="staff.fullName"
                        >
                      </div>
                      <div>
                        <div class="fw-semibold staff-name">
                          {{ staff.fullName }}
                        </div>
                        <small class="text-muted staff-username">{{ staff.username }}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      class="score-badge"
                      :class="getScoreClass(staff.metrics.performanceScore)"
                    >
                      {{ staff.metrics.performanceScore.toFixed(1) }}
                    </span>
                  </td>
                  <td class="revenue-cell">
                    {{ formatCurrency(staff.metrics.revenue) }}
                  </td>
                  <td class="orders-cell">
                    {{ formatNumber(staff.metrics.ordersCount) }}
                  </td>
                  <td>
                    <span class="rate-badge">{{ (staff.metrics.attendanceRate * 100).toFixed(1) }}%</span>
                  </td>
                  <td>
                    <span class="rate-badge">{{ (staff.metrics.onTimeRate * 100).toFixed(1) }}%</span>
                  </td>
                  <td class="tips-cell">
                    {{ formatCurrency(staff.metrics.tipsEarned) }}
                  </td>
                  <td>
                    <button
                      class="btn btn-flat btn-flat--outline btn-sm"
                      title="Xem chi tiết"
                      @click="showStaffDetail(staff)"
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
          <ul
            class="nav nav-tabs card-header-tabs"
            role="tablist"
          >
            <li
              class="nav-item"
              role="presentation"
            >
              <button
                class="nav-link"
                :class="{ active: activeTab === 'overview' }"
                type="button"
                @click="activeTab = 'overview'"
              >
                Tổng quan
              </button>
            </li>
            <li
              class="nav-item"
              role="presentation"
            >
              <button
                class="nav-link"
                :class="{ active: activeTab === 'performance' }"
                type="button"
                @click="activeTab = 'performance'"
              >
                Hiệu suất
              </button>
            </li>
            <li
              class="nav-item"
              role="presentation"
            >
              <button
                class="nav-link"
                :class="{ active: activeTab === 'attendance' }"
                type="button"
                @click="activeTab = 'attendance'"
              >
                Chuyên cần
              </button>
            </li>
            <li
              class="nav-item"
              role="presentation"
            >
              <button
                class="nav-link"
                :class="{ active: activeTab === 'financial' }"
                type="button"
                @click="activeTab = 'financial'"
              >
                Tài chính
              </button>
            </li>
            <li
              class="nav-item"
              role="presentation"
            >
              <button
                class="nav-link"
                :class="{ active: activeTab === 'trends' }"
                type="button"
                @click="activeTab = 'trends'"
              >
                Xu hướng
              </button>
            </li>
          </ul>
        </div>
        <div class="card-body">
          <OverviewTab
            v-if="activeTab === 'overview'"
            :staff-list="staffList"
            :team-metrics="teamMetrics"
          />
          <PerformanceTab
            v-if="activeTab === 'performance'"
            :staff-list="staffList"
          />
          <AttendanceTab
            v-if="activeTab === 'attendance'"
            :staff-list="staffList"
          />
          <FinancialTab
            v-if="activeTab === 'financial'"
            :staff-list="staffList"
          />
          <TrendsTab
            v-if="activeTab === 'trends'"
            :selected-staff-id="filters.userId"
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

    <StaffDetailModal
      v-if="selectedStaff"
      :staff="selectedStaff"
      @close="selectedStaff = null"
    />

    <ComparisonModal
      v-if="showComparison"
      :staff-ids="selectedStaffIds"
      :start-date="filters.startDate"
      :end-date="filters.endDate"
      @close="showComparison = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStaffPerformanceStore } from '@/store/staffPerformance'
import * as userService from '@/api/userService'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import OverviewTab from '@/components/staff-performance/OverviewTab.vue'
import PerformanceTab from '@/components/staff-performance/PerformanceTab.vue'
import AttendanceTab from '@/components/staff-performance/AttendanceTab.vue'
import FinancialTab from '@/components/staff-performance/FinancialTab.vue'
import TrendsTab from '@/components/staff-performance/TrendsTab.vue'
import StaffDetailModal from '@/components/staff-performance/StaffDetailModal.vue'
import ComparisonModal from '@/components/staff-performance/ComparisonModal.vue'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import * as XLSX from 'xlsx'
import logger from '@/utils/logger'

const store = useStaffPerformanceStore()

const loading = computed(() => store.loading)
const error = computed(() => store.error)
const hasData = computed(() => store.hasData)
const staffList = computed(() => store.staffList)
const teamMetrics = computed(() => store.teamMetrics)
const topPerformers = computed(() => store.topPerformers)
const selectedStaff = ref(null)

const exporting = ref(false)
const validationError = ref('')
const selectedPreset = ref('30d')
const availableStaff = ref([])
const selectedStaffIds = ref([])
const activeTab = ref('overview')
const showComparison = ref(false)

const filters = ref({
    startDate: '',
    endDate: '',
    userId: ''
})

const presets = [
    { value: '7d', label: '7 ngày', days: 7 },
    { value: '30d', label: '30 ngày', days: 30 },
    { value: '90d', label: '90 ngày', days: 90 },
    { value: '180d', label: '6 tháng', days: 180 }
]

const canAnalyze = computed(() => filters.value.startDate && filters.value.endDate && !validationError.value)

const allSelected = computed(() => staffList.value.length > 0 && selectedStaffIds.value.length === staffList.value.length)

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

const loadStaff = async () => {
    try {
        const data = await userService.getUsers({ role: 'STAFF', page: 0, size: 1000 })
        availableStaff.value = Array.isArray(data) ? data : (data?.content || [])
    } catch (err) {
        logger.error('Không thể tải danh sách nhân viên:', err)
    }
}

const handleAnalyze = async () => {
    if (!canAnalyze.value || validationError.value) return

    try {
        await store.analyzePerformance({
            startDate: filters.value.startDate,
            endDate: filters.value.endDate,
            userId: filters.value.userId || null
        })
    } catch (err) {
        logger.error('Không thể phân tích hiệu suất nhân viên:', err)
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
        logger.error('Không thể xuất báo cáo hiệu suất:', err)
        alert('Không thể xuất file. Vui lòng thử lại.')
    } finally {
        exporting.value = false
    }
}

const toggleSelectAll = () => {
    if (allSelected.value) {
        selectedStaffIds.value = []
    } else {
        selectedStaffIds.value = staffList.value.map(s => s.userId)
    }
}

const showStaffDetail = (staff) => {
    selectedStaff.value = staff
}

const showComparisonModal = () => {
    if (selectedStaffIds.value.length >= 2) {
        showComparison.value = true
    }
}

const getRankClass = (index) => {
    if (index === 0) return 'rank-gold'
    if (index === 1) return 'rank-silver'
    if (index === 2) return 'rank-bronze'
    return 'rank-normal'
}

const getScoreClass = (score) => {
    if (score >= 90) return 'score-excellent'
    if (score >= 75) return 'score-good'
    if (score >= 60) return 'score-average'
    return 'score-poor'
}

onMounted(() => {
    applyPreset('30d')
    loadStaff()
})
</script>

<style scoped>
.staff-performance-page {
    background: var(--color-body-bg);
    padding: var(--spacing-4);
    min-height: 100vh;
}

/* KPI Cards - Chuẩn hóa theo Global Design System */
.kpi-card {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-4);
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    transition: all var(--transition-base);
    min-height: 120px;
    height: 100%;
    position: relative;
    overflow: hidden;
}

.kpi-card::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: currentColor;
    opacity: 0;
    transition: opacity var(--transition-base);
}

.kpi-card--primary::before {
    background: var(--color-primary);
}

.kpi-card--success::before {
    background: var(--color-success);
}

.kpi-card--warning::before {
    background: var(--color-warning);
}

.kpi-card--info::before {
    background: var(--color-info);
}

.kpi-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
}

.kpi-card:hover::before {
    opacity: 0.7;
}

.kpi-card__icon {
    width: 52px;
    height: 52px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.375rem;
    flex-shrink: 0;
    transition: transform var(--transition-base);
}

.kpi-card:hover .kpi-card__icon {
    transform: scale(1.05);
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

.kpi-card__content {
    flex: 1;
    min-width: 0;
}

.kpi-card__label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-1);
    line-height: 1.4;
    font-family: var(--font-family-sans);
    letter-spacing: 0.01em;
}

.kpi-card__value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    line-height: 1.3;
    font-family: var(--font-family-sans);
    margin-bottom: var(--spacing-1);
    letter-spacing: -0.01em;
}

.kpi-card__subtitle {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
    line-height: 1.4;
}

/* Filter Card */
.filter-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    box-shadow: none;
}

.filter-card :global(.card-body) {
    padding: var(--spacing-5);
}

/* Form Labels */
:deep(.form-label) {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
}

/* Button Group */
.btn-group {
    display: flex;
    gap: var(--spacing-1);
    flex-wrap: wrap;
}

.btn-group .btn-flat {
    flex: 1;
    min-width: 0;
}

/* Alert */
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

/* Typography */
:deep(.card-title) {
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    margin: 0;
}

/* Table Styles */
.staff-avatar {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    overflow: hidden;
    flex-shrink: 0;
}

.staff-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.staff-name {
    font-family: var(--font-family-sans);
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
}

.staff-username {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
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

.revenue-cell {
    font-family: var(--font-family-sans);
    color: var(--color-success);
    font-weight: var(--font-weight-semibold);
}

.orders-cell {
    font-family: var(--font-family-sans);
    color: var(--color-text);
}

.rate-badge {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    color: var(--color-text);
}

.tips-cell {
    font-family: var(--font-family-sans);
    color: var(--color-warning);
}

/* Nav Tabs */
:deep(.nav-tabs) {
    border-bottom: 1px solid var(--color-border);
}

:deep(.nav-link) {
    font-family: var(--font-family-sans);
    color: var(--color-text-muted);
    border: none;
    border-bottom: 2px solid transparent;
    padding: var(--spacing-2) var(--spacing-4);
    transition: all var(--transition-base);
}

:deep(.nav-link:hover) {
    color: var(--color-primary);
    border-bottom-color: var(--color-border);
}

:deep(.nav-link.active) {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
}

/* Content Animation */
.performance-content {
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

