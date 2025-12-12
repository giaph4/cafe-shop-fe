<template>
  <div class="manager-dashboard-tab">
    <!-- Top Row: KPI Cards -->
    <div
      v-if="dashboardData"
      class="row g-4 mb-4"
    >
      <!-- DOANH THU TỔNG -->
      <div
        v-if="dashboardData.teamPerformance"
        class="col-md-3 col-sm-6"
      >
        <div class="kpi-card kpi-card--revenue">
          <div class="kpi-card__icon">
            <i class="bi bi-cash-stack" />
          </div>
          <div class="kpi-card__content">
            <div class="kpi-card__label">
              Doanh thu tổng:
            </div>
            <div class="kpi-card__value">
              {{ formatCurrency(dashboardData.teamPerformance.totalRevenue || 0) }}
            </div>
            <div class="kpi-card__detail">
              {{ formatNumber(dashboardData.teamPerformance.totalOrders || 0) }} đơn hàng
            </div>
          </div>
        </div>
      </div>

      <!-- GIÁ TRỊ ĐƠN TRUNG BÌNH -->
      <div
        v-if="dashboardData.teamPerformance"
        class="col-md-3 col-sm-6"
      >
        <div class="kpi-card kpi-card--average">
          <div class="kpi-card__icon">
            <i class="bi bi-tag" />
          </div>
          <div class="kpi-card__content">
            <div class="kpi-card__label">
              Giá trị đơn trung bình:
            </div>
            <div class="kpi-card__value">
              {{ formatCurrency(dashboardData.teamPerformance.averageOrderValue || 0) }}
            </div>
          </div>
        </div>
      </div>

      <!-- CA ĐANG DIỄN RA -->
      <div
        v-if="dashboardData.shiftOverview"
        class="col-md-3 col-sm-6"
      >
        <div class="kpi-card kpi-card--shifts">
          <div class="kpi-card__icon">
            <i class="bi bi-calendar-check" />
          </div>
          <div class="kpi-card__content">
            <div class="kpi-card__label">
              Ca đang diễn ra:
            </div>
            <div class="kpi-card__value">
              {{ formatNumber(dashboardData.shiftOverview.inProgress || 0) }}
            </div>
            <div class="kpi-card__detail">
              {{ formatNumber(dashboardData.shiftOverview.scheduledToday || 0) }} ca hôm nay
            </div>
          </div>
        </div>
      </div>

      <!-- NGUYÊN LIỆU SẮP HẾT -->
      <div
        v-if="dashboardData.inventory"
        class="col-md-3 col-sm-6"
      >
        <div class="kpi-card kpi-card--inventory">
          <div class="kpi-card__icon">
            <i class="bi bi-exclamation-triangle" />
          </div>
          <div class="kpi-card__content">
            <div class="kpi-card__label">
              Nguyên liệu sắp hết:
            </div>
            <div class="kpi-card__value">
              {{ formatNumber(dashboardData.inventory.lowStockItems || 0) }}
            </div>
            <div class="kpi-card__detail">
              {{ formatNumber(dashboardData.inventory.criticalStockItems || 0) }} mức nguy hiểm
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Middle Row: 2 Cards -->
    <div class="row g-4 mb-4">
      <!-- Tổng quan Ca làm -->
      <div
        v-if="dashboardData?.shiftOverview"
        class="col-lg-6"
      >
        <div class="card info-card">
          <div class="card-header">
            <div class="d-flex align-items-center gap-3">
              <div class="info-card__icon">
                <i class="bi bi-calendar-check" />
              </div>
              <h5 class="card-title mb-0">
                Tổng quan Ca làm
              </h5>
            </div>
          </div>
          <div class="card-body">
            <div class="stats-grid">
              <div class="stat-box stat-box--primary">
                <div class="stat-box__label">
                  Đã lên lịch hôm nay
                </div>
                <div class="stat-box__value">
                  {{ formatNumber(dashboardData.shiftOverview.scheduledToday || 0) }}
                </div>
              </div>
              <div class="stat-box stat-box--warning">
                <div class="stat-box__label">
                  Đang diễn ra
                </div>
                <div class="stat-box__value">
                  {{ formatNumber(dashboardData.shiftOverview.inProgress || 0) }}
                </div>
              </div>
              <div class="stat-box stat-box--success">
                <div class="stat-box__label">
                  Đã hoàn thành
                </div>
                <div class="stat-box__value">
                  {{ formatNumber(dashboardData.shiftOverview.completed || 0) }}
                </div>
              </div>
              <div class="stat-box stat-box--danger">
                <div class="stat-box__label">
                  Đã hủy
                </div>
                <div class="stat-box__value">
                  {{ formatNumber(dashboardData.shiftOverview.cancelled || 0) }}
                </div>
              </div>
            </div>

            <div
              v-if="dashboardData.shiftOverview.upcomingShifts?.length > 0"
              class="upcoming-shifts"
            >
              <h6 class="upcoming-shifts__title">
                Ca sắp tới
              </h6>
              <div class="shift-list">
                <div
                  v-for="(shift, index) in dashboardData.shiftOverview.upcomingShifts.slice(0, 5)"
                  :key="shift.shiftId || index"
                  class="shift-item"
                >
                  <div class="shift-item__content">
                    <div class="shift-item__date">
                      {{ formatDate(shift.shiftDate) }}
                    </div>
                    <div class="shift-item__time">
                      {{ shift.timeRange }}
                    </div>
                    <div class="shift-item__staff">
                      {{ shift.assignedStaff }}/{{ shift.capacity }} nhân viên
                    </div>
                  </div>
                  <span
                    class="shift-item__badge"
                    :class="getShiftStatusBadge(shift.status)"
                  >
                    {{ shift.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Hiệu suất Team -->
      <div
        v-if="dashboardData?.teamPerformance"
        class="col-lg-6"
      >
        <div class="card info-card">
          <div class="card-header">
            <div class="d-flex align-items-center gap-3">
              <div class="info-card__icon">
                <i class="bi bi-graph-up" />
              </div>
              <h5 class="card-title mb-0">
                Hiệu suất Team
              </h5>
            </div>
          </div>
          <div class="card-body">
            <div
              v-if="dashboardData.teamPerformance.topStaff?.length > 0"
              class="team-performance"
            >
              <div class="team-list">
                <div
                  v-for="(staff, index) in dashboardData.teamPerformance.topStaff.slice(0, 5)"
                  :key="staff.staffId || index"
                  class="team-item"
                >
                  <div class="team-item__content">
                    <div class="team-item__name">
                      {{ staff.staffName || 'N/A' }}
                    </div>
                    <div class="team-item__detail">
                      {{ formatNumber(staff.orders) }} đơn hàng
                    </div>
                  </div>
                  <div class="team-item__value">
                    {{ formatCurrency(staff.revenue) }}
                  </div>
                </div>
              </div>
            </div>
            <div
              v-else
              class="empty-state"
            >
              Chưa có dữ liệu hiệu suất
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Row: Multiple Cards -->
    <div class="row g-4">
      <!-- Cảnh báo Kho -->
      <div
        v-if="dashboardData?.inventory?.alerts?.length > 0"
        class="col-lg-6"
      >
        <div class="card info-card">
          <div class="card-header">
            <div class="d-flex align-items-center gap-3">
              <div class="info-card__icon">
                <i class="bi bi-exclamation-triangle" />
              </div>
              <h5 class="card-title mb-0">
                Cảnh báo Kho
              </h5>
            </div>
          </div>
          <div class="card-body">
            <div class="alert-list">
              <div
                v-for="(alert, index) in dashboardData.inventory.alerts.slice(0, 5)"
                :key="alert.ingredientId || index"
                class="alert-item alert-item--danger"
              >
                <i class="bi bi-exclamation-triangle alert-item__icon" />
                <div class="alert-item__content">
                  <strong>{{ alert.ingredientName || 'N/A' }}</strong>
                  <div class="alert-item__detail">
                    Tồn kho: {{ formatNumber(alert.quantityOnHand) }} |
                    Mức đặt lại: {{ formatNumber(alert.reorderLevel) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tổng quan Lương -->
      <div
        v-if="dashboardData?.payroll"
        class="col-lg-6"
      >
        <div class="card info-card">
          <div class="card-header">
            <div class="d-flex align-items-center gap-3">
              <div class="info-card__icon">
                <i class="bi bi-cash-coin" />
              </div>
              <h5 class="card-title mb-0">
                Tổng quan Lương
              </h5>
            </div>
          </div>
          <div class="card-body">
            <div class="payroll-grid">
              <div class="payroll-item">
                <div class="payroll-item__label">
                  Lương ước tính
                </div>
                <div class="payroll-item__value payroll-item__value--primary">
                  {{ formatCurrency(dashboardData.payroll.estimatedPayroll || 0) }}
                </div>
              </div>
              <div class="payroll-item">
                <div class="payroll-item__label">
                  Số nhân viên
                </div>
                <div class="payroll-item__value">
                  {{ formatNumber(dashboardData.payroll.staffCount || 0) }}
                </div>
              </div>
              <div class="payroll-item">
                <div class="payroll-item__label">
                  Tổng thưởng
                </div>
                <div class="payroll-item__value payroll-item__value--success">
                  {{ formatCurrency(dashboardData.payroll.bonusTotal || 0) }}
                </div>
              </div>
              <div class="payroll-item">
                <div class="payroll-item__label">
                  Tổng phạt
                </div>
                <div class="payroll-item__value payroll-item__value--danger">
                  {{ formatCurrency(dashboardData.payroll.penaltyTotal || 0) }}
                </div>
              </div>
              <div class="payroll-item payroll-item--full">
                <div class="payroll-item__label">
                  Điều chỉnh ròng
                </div>
                <div
                  class="payroll-item__value"
                  :class="(dashboardData.payroll.adjustmentNet || 0) >= 0 ? 'payroll-item__value--success' : 'payroll-item__value--danger'"
                >
                  {{ formatCurrency(dashboardData.payroll.adjustmentNet || 0) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chờ phê duyệt -->
      <div
        v-if="dashboardData?.pendingApprovals?.length > 0"
        class="col-lg-6"
      >
        <div class="card info-card">
          <div class="card-header">
            <div class="d-flex align-items-center gap-3">
              <div class="info-card__icon">
                <i class="bi bi-clock-history" />
              </div>
              <h5 class="card-title mb-0">
                Chờ phê duyệt
              </h5>
            </div>
          </div>
          <div class="card-body">
            <div class="approval-list">
              <div
                v-for="(approval, index) in dashboardData.pendingApprovals.slice(0, 5)"
                :key="index"
                class="approval-item"
              >
                <div class="approval-item__content">
                  <div class="approval-item__title">
                    {{ approval.module || 'N/A' }}
                  </div>
                  <div class="approval-item__description">
                    {{ approval.description }}
                  </div>
                  <div class="approval-item__meta">
                    Yêu cầu bởi: {{ approval.requestedBy }} | {{ formatDate(approval.requestedAt) }}
                  </div>
                </div>
                <span class="approval-item__badge">{{ approval.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cảnh báo Chấm công -->
      <div
        v-if="dashboardData?.attendanceAlerts?.length > 0"
        class="col-lg-6"
      >
        <div class="card info-card">
          <div class="card-header">
            <div class="d-flex align-items-center gap-3">
              <div class="info-card__icon">
                <i class="bi bi-person-check" />
              </div>
              <h5 class="card-title mb-0">
                Cảnh báo Chấm công
              </h5>
            </div>
          </div>
          <div class="card-body">
            <div class="attendance-list">
              <div
                v-for="(alert, index) in dashboardData.attendanceAlerts.slice(0, 5)"
                :key="alert.assignmentId || index"
                class="attendance-item"
              >
                <div class="attendance-item__content">
                  <div class="attendance-item__name">
                    {{ alert.staffName || 'N/A' }}
                  </div>
                  <div class="attendance-item__issue">
                    {{ alert.issueType }}
                  </div>
                  <div
                    v-if="alert.note"
                    class="attendance-item__note"
                  >
                    {{ alert.note }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vấn đề Dịch vụ -->
      <div
        v-if="dashboardData?.serviceIssues?.length > 0"
        class="col-lg-6"
      >
        <div class="card info-card">
          <div class="card-header">
            <div class="d-flex align-items-center gap-3">
              <div class="info-card__icon">
                <i class="bi bi-exclamation-circle" />
              </div>
              <h5 class="card-title mb-0">
                Vấn đề Dịch vụ
              </h5>
            </div>
          </div>
          <div class="card-body">
            <div class="service-list">
              <div
                v-for="(issue, index) in dashboardData.serviceIssues.slice(0, 5)"
                :key="issue.orderId || index"
                class="service-item"
              >
                <div class="service-item__content">
                  <div class="service-item__title">
                    Đơn #{{ issue.orderId }}
                  </div>
                  <div class="service-item__detail">
                    Bàn: {{ issue.tableName }}
                  </div>
                  <div class="service-item__issue">
                    {{ issue.issue }}
                  </div>
                </div>
                <span
                  class="service-item__badge"
                  :class="getSeverityBadge(issue.severity)"
                >
                  {{ issue.severity }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatCurrency, formatNumber, formatDate } from '@/utils/formatters'

defineProps({
    dashboardData: Object
})

const getShiftStatusBadge = (status) => {
    if (!status) return 'shift-item__badge--secondary'
    const statusLower = status.toLowerCase()
    if (statusLower.includes('pending') || statusLower.includes('scheduled')) {
        return 'shift-item__badge--warning'
    } else if (statusLower.includes('completed')) {
        return 'shift-item__badge--success'
    } else if (statusLower.includes('cancelled')) {
        return 'shift-item__badge--danger'
    } else if (statusLower.includes('active') || statusLower.includes('in_progress')) {
        return 'shift-item__badge--info'
    }
    return 'shift-item__badge--secondary'
}

const getSeverityBadge = (severity) => {
    if (!severity) return 'service-item__badge--secondary'
    const sev = severity.toLowerCase()
    if (sev.includes('critical') || sev.includes('high')) return 'service-item__badge--danger'
    if (sev.includes('medium')) return 'service-item__badge--warning'
    if (sev.includes('low')) return 'service-item__badge--info'
    return 'service-item__badge--secondary'
}
</script>

<style scoped>
.manager-dashboard-tab {
    padding: 0;
}

/* KPI Cards - Flat design, NO shadow */
.kpi-card {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    padding: var(--spacing-5) var(--spacing-6);
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    transition: background-color var(--transition-base), border-color var(--transition-base);
    min-height: 120px;
    height: 100%;
}

.kpi-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
    /* NO transform, NO shadow */
}

.kpi-card__icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-base);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
    color: var(--color-primary);
    background: var(--color-bg-muted);
}

/* Màu icon - không dùng gradient, dùng màu nhạt */
.kpi-card--revenue .kpi-card__icon {
    background: var(--color-bg-muted);
    color: var(--color-primary);
}

.kpi-card--average .kpi-card__icon {
    background: var(--color-bg-muted);
    color: var(--color-info);
}

.kpi-card--shifts .kpi-card__icon {
    background: var(--color-bg-muted);
    color: var(--color-secondary);
}

.kpi-card--inventory .kpi-card__icon {
    background: var(--color-bg-muted);
    color: var(--color-warning);
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
    line-height: var(--line-height-base);
}

.kpi-card__value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    line-height: var(--line-height-tight);
}

.kpi-card__detail {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
    line-height: var(--line-height-base);
}

/* Info Cards - Chuẩn hóa */
.info-card {
    height: 100%;
}

.info-card .card-header {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4);
    background: var(--color-bg);
}

.info-card__icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-base);
    background: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-inverse);
    font-size: 20px;
    flex-shrink: 0;
}


/* Stats Grid - Chuẩn hóa */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-3);
    margin-bottom: var(--spacing-4);
}

.stat-box {
    padding: var(--spacing-3) var(--spacing-4);
    background: var(--color-bg-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    text-align: center;
}

.stat-box__label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-2);
}

.stat-box__value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
}

.stat-box--primary .stat-box__value {
    color: var(--color-info);
}

.stat-box--warning .stat-box__value {
    color: var(--color-warning);
}

.stat-box--success .stat-box__value {
    color: var(--color-success);
}

.stat-box--danger .stat-box__value {
    color: var(--color-danger);
}

/* Upcoming Shifts - Chuẩn hóa */
.upcoming-shifts__title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
    margin-bottom: var(--spacing-3);
}

.shift-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.shift-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-3) var(--spacing-4);
    background: var(--color-bg-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
}

.shift-item__content {
    flex: 1;
}

.shift-item__date {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    color: var(--color-text);
    margin-bottom: var(--spacing-1);
}

.shift-item__time {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-1);
}

.shift-item__staff {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
}

.shift-item__badge {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-base);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
}

.shift-item__badge--warning {
    background: var(--color-bg-muted);
    color: var(--color-warning);
    border: 1px solid var(--color-warning);
}

.shift-item__badge--success {
    background: var(--color-bg-muted);
    color: var(--color-success);
    border: 1px solid var(--color-success);
}

.shift-item__badge--danger {
    background: var(--color-bg-muted);
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
}

.shift-item__badge--info {
    background: var(--color-bg-muted);
    color: var(--color-info);
    border: 1px solid var(--color-info);
}

.shift-item__badge--secondary {
    background: var(--color-bg-muted);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
}

/* Team Performance - Chuẩn hóa */
.team-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.team-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-3) var(--spacing-4);
    background: var(--color-bg-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
}

.team-item__content {
    flex: 1;
}

.team-item__name {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    color: var(--color-text);
    margin-bottom: var(--spacing-1);
}

.team-item__detail {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
}

.team-item__value {
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
    font-size: var(--font-size-base);
}

.empty-state {
    text-align: center;
    padding: var(--spacing-5);
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
}

/* Alert List - Chuẩn hóa, không dùng alert */
.alert-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.alert-item {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-3);
    padding: var(--spacing-3) var(--spacing-4);
    border-radius: var(--radius-base);
    border: 1px solid;
    font-size: var(--font-size-base);
}

.alert-item__icon {
    font-size: 20px;
    flex-shrink: 0;
    margin-top: 2px;
}

.alert-item__content {
    flex: 1;
    line-height: var(--line-height-base);
}

.alert-item__detail {
    font-size: var(--font-size-base);
    margin-top: var(--spacing-1);
    opacity: 0.8;
}

.alert-item--danger {
    background: var(--color-bg-muted);
    border-color: var(--color-danger);
    color: var(--color-danger);
}

/* Payroll Grid - Chuẩn hóa */
.payroll-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-3);
}

.payroll-item {
    padding: var(--spacing-3) var(--spacing-4);
    background: var(--color-bg-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
}

.payroll-item--full {
    grid-column: 1 / -1;
}

.payroll-item__label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-2);
}

.payroll-item__value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
}

.payroll-item__value--primary {
    color: var(--color-info);
}

.payroll-item__value--success {
    color: var(--color-success);
}

.payroll-item__value--danger {
    color: var(--color-danger);
}

/* Approval List - Chuẩn hóa */
.approval-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.approval-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: var(--spacing-3) var(--spacing-4);
    background: var(--color-bg-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
}

.approval-item__content {
    flex: 1;
}

.approval-item__title {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    color: var(--color-text);
    margin-bottom: var(--spacing-1);
}

.approval-item__description {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-1);
}

.approval-item__meta {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
}

.approval-item__badge {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-base);
    background: var(--color-bg-muted);
    color: var(--color-warning);
    border: 1px solid var(--color-warning);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    flex-shrink: 0;
}

/* Attendance List - Chuẩn hóa */
.attendance-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.attendance-item {
    padding: var(--spacing-3) var(--spacing-4);
    background: var(--color-bg-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
}

.attendance-item__name {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    color: var(--color-text);
    margin-bottom: var(--spacing-1);
}

.attendance-item__issue {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-1);
}

.attendance-item__note {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
}

/* Service List - Chuẩn hóa */
.service-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.service-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: var(--spacing-3) var(--spacing-4);
    background: var(--color-bg-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
}

.service-item__content {
    flex: 1;
}

.service-item__title {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    color: var(--color-text);
    margin-bottom: var(--spacing-1);
}

.service-item__detail {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-1);
}

.service-item__issue {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
}

.service-item__badge {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-base);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    flex-shrink: 0;
}

.service-item__badge--danger {
    background: var(--color-bg-muted);
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
}

.service-item__badge--warning {
    background: var(--color-bg-muted);
    color: var(--color-warning);
    border: 1px solid var(--color-warning);
}

.service-item__badge--info {
    background: var(--color-bg-muted);
    color: var(--color-info);
    border: 1px solid var(--color-info);
}

.service-item__badge--secondary {
    background: var(--color-bg-muted);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
}

@media (max-width: 768px) {
    .kpi-card {
        flex-direction: column;
        text-align: center;
        min-height: auto;
    }

    .kpi-card__icon {
        width: 48px;
        height: 48px;
        font-size: 20px;
    }

    .stats-grid,
    .payroll-grid {
        grid-template-columns: 1fr;
    }
}
</style>
