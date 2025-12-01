<template>
    <div class="manager-dashboard-tab">
        <!-- Top Row: KPI Cards -->
        <div class="row g-4 mb-4" v-if="dashboardData">
            <!-- DOANH THU TỔNG -->
            <div class="col-md-3 col-sm-6" v-if="dashboardData.teamPerformance">
                <div class="kpi-card kpi-card--revenue">
                    <div class="kpi-card__icon">
                        <i class="bi bi-cash-stack"></i>
                    </div>
                    <div class="kpi-card__content">
                        <div class="kpi-card__label">Doanh thu tổng:</div>
                        <div class="kpi-card__value">{{ formatCurrency(dashboardData.teamPerformance.totalRevenue || 0) }}</div>
                        <div class="kpi-card__detail">{{ formatNumber(dashboardData.teamPerformance.totalOrders || 0) }} đơn hàng</div>
                    </div>
                </div>
            </div>

            <!-- GIÁ TRỊ ĐƠN TRUNG BÌNH -->
            <div class="col-md-3 col-sm-6" v-if="dashboardData.teamPerformance">
                <div class="kpi-card kpi-card--average">
                    <div class="kpi-card__icon">
                        <i class="bi bi-tag"></i>
                    </div>
                    <div class="kpi-card__content">
                        <div class="kpi-card__label">Giá trị đơn trung bình:</div>
                        <div class="kpi-card__value">{{ formatCurrency(dashboardData.teamPerformance.averageOrderValue || 0) }}</div>
                    </div>
                </div>
            </div>

            <!-- CA ĐANG DIỄN RA -->
            <div class="col-md-3 col-sm-6" v-if="dashboardData.shiftOverview">
                <div class="kpi-card kpi-card--shifts">
                    <div class="kpi-card__icon">
                        <i class="bi bi-calendar-check"></i>
                    </div>
                    <div class="kpi-card__content">
                        <div class="kpi-card__label">Ca đang diễn ra:</div>
                        <div class="kpi-card__value">{{ formatNumber(dashboardData.shiftOverview.inProgress || 0) }}</div>
                        <div class="kpi-card__detail">{{ formatNumber(dashboardData.shiftOverview.scheduledToday || 0) }} ca hôm nay</div>
                    </div>
                </div>
            </div>

            <!-- NGUYÊN LIỆU SẮP HẾT -->
            <div class="col-md-3 col-sm-6" v-if="dashboardData.inventory">
                <div class="kpi-card kpi-card--inventory">
                    <div class="kpi-card__icon">
                        <i class="bi bi-exclamation-triangle"></i>
                    </div>
                    <div class="kpi-card__content">
                        <div class="kpi-card__label">Nguyên liệu sắp hết:</div>
                        <div class="kpi-card__value">{{ formatNumber(dashboardData.inventory.lowStockItems || 0) }}</div>
                        <div class="kpi-card__detail">{{ formatNumber(dashboardData.inventory.criticalStockItems || 0) }} mức nguy hiểm</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Middle Row: 2 Cards -->
        <div class="row g-4 mb-4">
            <!-- Tổng quan Ca làm -->
            <div class="col-lg-6" v-if="dashboardData?.shiftOverview">
                <div class="card info-card">
                    <div class="card-header">
                        <div class="d-flex align-items-center gap-3">
                            <div class="info-card__icon">
                                <i class="bi bi-calendar-check"></i>
                            </div>
                            <h5 class="card-title mb-0">Tổng quan Ca làm</h5>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="stats-grid">
                            <div class="stat-box stat-box--primary">
                                <div class="stat-box__label">Đã lên lịch hôm nay</div>
                                <div class="stat-box__value">{{ formatNumber(dashboardData.shiftOverview.scheduledToday || 0) }}</div>
                            </div>
                            <div class="stat-box stat-box--warning">
                                <div class="stat-box__label">Đang diễn ra</div>
                                <div class="stat-box__value">{{ formatNumber(dashboardData.shiftOverview.inProgress || 0) }}</div>
                            </div>
                            <div class="stat-box stat-box--success">
                                <div class="stat-box__label">Đã hoàn thành</div>
                                <div class="stat-box__value">{{ formatNumber(dashboardData.shiftOverview.completed || 0) }}</div>
                            </div>
                            <div class="stat-box stat-box--danger">
                                <div class="stat-box__label">Đã hủy</div>
                                <div class="stat-box__value">{{ formatNumber(dashboardData.shiftOverview.cancelled || 0) }}</div>
                            </div>
                        </div>

                        <div v-if="dashboardData.shiftOverview.upcomingShifts?.length > 0" class="upcoming-shifts">
                            <h6 class="upcoming-shifts__title">Ca sắp tới</h6>
                            <div class="shift-list">
                                <div
                                    v-for="(shift, index) in dashboardData.shiftOverview.upcomingShifts.slice(0, 5)"
                                    :key="shift.shiftId || index"
                                    class="shift-item"
                                >
                                    <div class="shift-item__content">
                                        <div class="shift-item__date">{{ formatDate(shift.shiftDate) }}</div>
                                        <div class="shift-item__time">{{ shift.timeRange }}</div>
                                        <div class="shift-item__staff">{{ shift.assignedStaff }}/{{ shift.capacity }} nhân viên</div>
                                    </div>
                                    <span class="shift-item__badge" :class="getShiftStatusBadge(shift.status)">
                                        {{ shift.status }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Hiệu suất Team -->
            <div class="col-lg-6" v-if="dashboardData?.teamPerformance">
                <div class="card info-card">
                    <div class="card-header">
                        <div class="d-flex align-items-center gap-3">
                            <div class="info-card__icon">
                                <i class="bi bi-graph-up"></i>
                            </div>
                            <h5 class="card-title mb-0">Hiệu suất Team</h5>
                        </div>
                    </div>
                    <div class="card-body">
                        <div v-if="dashboardData.teamPerformance.topStaff?.length > 0" class="team-performance">
                            <div class="team-list">
                                <div
                                    v-for="(staff, index) in dashboardData.teamPerformance.topStaff.slice(0, 5)"
                                    :key="staff.staffId || index"
                                    class="team-item"
                                >
                                    <div class="team-item__content">
                                        <div class="team-item__name">{{ staff.staffName || 'N/A' }}</div>
                                        <div class="team-item__detail">{{ formatNumber(staff.orders) }} đơn hàng</div>
                                    </div>
                                    <div class="team-item__value">
                                        {{ formatCurrency(staff.revenue) }}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="empty-state">
                            Chưa có dữ liệu hiệu suất
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bottom Row: Multiple Cards -->
        <div class="row g-4">
            <!-- Cảnh báo Kho -->
            <div class="col-lg-6" v-if="dashboardData?.inventory?.alerts?.length > 0">
                <div class="card info-card">
                    <div class="card-header">
                        <div class="d-flex align-items-center gap-3">
                            <div class="info-card__icon">
                                <i class="bi bi-exclamation-triangle"></i>
                            </div>
                            <h5 class="card-title mb-0">Cảnh báo Kho</h5>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="alert-list">
                            <div
                                v-for="(alert, index) in dashboardData.inventory.alerts.slice(0, 5)"
                                :key="alert.ingredientId || index"
                                class="alert-item alert-item--danger"
                            >
                                <i class="bi bi-exclamation-triangle alert-item__icon"></i>
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
            <div class="col-lg-6" v-if="dashboardData?.payroll">
                <div class="card info-card">
                    <div class="card-header">
                        <div class="d-flex align-items-center gap-3">
                            <div class="info-card__icon">
                                <i class="bi bi-cash-coin"></i>
                            </div>
                            <h5 class="card-title mb-0">Tổng quan Lương</h5>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="payroll-grid">
                            <div class="payroll-item">
                                <div class="payroll-item__label">Lương ước tính</div>
                                <div class="payroll-item__value payroll-item__value--primary">
                                    {{ formatCurrency(dashboardData.payroll.estimatedPayroll || 0) }}
                                </div>
                            </div>
                            <div class="payroll-item">
                                <div class="payroll-item__label">Số nhân viên</div>
                                <div class="payroll-item__value">
                                    {{ formatNumber(dashboardData.payroll.staffCount || 0) }}
                                </div>
                            </div>
                            <div class="payroll-item">
                                <div class="payroll-item__label">Tổng thưởng</div>
                                <div class="payroll-item__value payroll-item__value--success">
                                    {{ formatCurrency(dashboardData.payroll.bonusTotal || 0) }}
                                </div>
                            </div>
                            <div class="payroll-item">
                                <div class="payroll-item__label">Tổng phạt</div>
                                <div class="payroll-item__value payroll-item__value--danger">
                                    {{ formatCurrency(dashboardData.payroll.penaltyTotal || 0) }}
                                </div>
                            </div>
                            <div class="payroll-item payroll-item--full">
                                <div class="payroll-item__label">Điều chỉnh ròng</div>
                                <div class="payroll-item__value" :class="(dashboardData.payroll.adjustmentNet || 0) >= 0 ? 'payroll-item__value--success' : 'payroll-item__value--danger'">
                                    {{ formatCurrency(dashboardData.payroll.adjustmentNet || 0) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Chờ phê duyệt -->
            <div class="col-lg-6" v-if="dashboardData?.pendingApprovals?.length > 0">
                <div class="card info-card">
                    <div class="card-header">
                        <div class="d-flex align-items-center gap-3">
                            <div class="info-card__icon">
                                <i class="bi bi-clock-history"></i>
                            </div>
                            <h5 class="card-title mb-0">Chờ phê duyệt</h5>
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
                                    <div class="approval-item__title">{{ approval.module || 'N/A' }}</div>
                                    <div class="approval-item__description">{{ approval.description }}</div>
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
            <div class="col-lg-6" v-if="dashboardData?.attendanceAlerts?.length > 0">
                <div class="card info-card">
                    <div class="card-header">
                        <div class="d-flex align-items-center gap-3">
                            <div class="info-card__icon">
                                <i class="bi bi-person-check"></i>
                            </div>
                            <h5 class="card-title mb-0">Cảnh báo Chấm công</h5>
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
                                    <div class="attendance-item__name">{{ alert.staffName || 'N/A' }}</div>
                                    <div class="attendance-item__issue">{{ alert.issueType }}</div>
                                    <div v-if="alert.note" class="attendance-item__note">{{ alert.note }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Vấn đề Dịch vụ -->
            <div class="col-lg-6" v-if="dashboardData?.serviceIssues?.length > 0">
                <div class="card info-card">
                    <div class="card-header">
                        <div class="d-flex align-items-center gap-3">
                            <div class="info-card__icon">
                                <i class="bi bi-exclamation-circle"></i>
                            </div>
                            <h5 class="card-title mb-0">Vấn đề Dịch vụ</h5>
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
                                    <div class="service-item__title">Đơn #{{ issue.orderId }}</div>
                                    <div class="service-item__detail">Bàn: {{ issue.tableName }}</div>
                                    <div class="service-item__issue">{{ issue.issue }}</div>
                                </div>
                                <span class="service-item__badge" :class="getSeverityBadge(issue.severity)">
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

/* KPI Cards */
.kpi-card {
    background: #f8fafc;
    border: 1px solid rgba(226, 232, 240, 0.5);
    border-radius: 24px;
    padding: var(--spacing-6);
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04);
    display: flex;
    align-items: center;
    gap: var(--spacing-5);
    transition: all var(--transition-base);
    min-height: 140px;
    height: 100%;
}

.kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.06);
}

.kpi-card__icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    flex-shrink: 0;
    color: #6366f1;
    position: relative;
}

.kpi-card--revenue .kpi-card__icon {
    background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
}

.kpi-card--average .kpi-card__icon {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.kpi-card--shifts .kpi-card__icon {
    background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
    box-shadow: 0 2px 8px rgba(124, 58, 237, 0.15);
}

.kpi-card--inventory .kpi-card__icon {
    background: linear-gradient(135deg, #fce7f3, #fbcfe8);
    box-shadow: 0 2px 8px rgba(236, 72, 153, 0.15);
}

.kpi-card__content {
    flex: 1;
    min-width: 0;
}

.kpi-card__label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
    text-transform: none;
    letter-spacing: normal;
    margin-bottom: var(--spacing-2);
    line-height: var(--line-height-normal);
}

.kpi-card__value {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
    margin-bottom: var(--spacing-1);
}

.kpi-card__detail {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
    line-height: var(--line-height-relaxed);
}

/* Info Cards */
.info-card {
    height: 100%;
}

.info-card .card-header {
    border-bottom: 1px solid var(--color-border);
    padding: 1.25rem 1.5rem;
    background: var(--color-card-muted);
}

.info-card__icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: linear-gradient(135deg, #4f46e5, #6366f1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 1.25rem;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
    filter: brightness(1.05) contrast(1.1);
}

.info-card__icon i {
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}


/* Stats Grid */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.stat-box {
    padding: 1rem;
    background: rgba(148, 163, 184, 0.05);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    text-align: center;
}

.stat-box__label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    margin-bottom: 0.5rem;
}

.stat-box__value {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--color-heading);
}

.stat-box--primary .stat-box__value {
    color: #3b82f6;
}

.stat-box--warning .stat-box__value {
    color: #f59e0b;
}

.stat-box--success .stat-box__value {
    color: #10b981;
}

.stat-box--danger .stat-box__value {
    color: #ef4444;
}

/* Upcoming Shifts */
.upcoming-shifts__title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-heading);
    margin-bottom: 1rem;
}

.shift-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.shift-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(148, 163, 184, 0.05);
    border: 1px solid var(--color-border);
    border-radius: 12px;
}

.shift-item__content {
    flex: 1;
}

.shift-item__date {
    font-weight: 600;
    color: var(--color-heading);
    margin-bottom: 0.25rem;
}

.shift-item__time {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    margin-bottom: 0.25rem;
}

.shift-item__staff {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.shift-item__badge {
    padding: 0.375rem 0.75rem;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.shift-item__badge--warning {
    background: rgba(245, 158, 11, 0.1);
    color: #d97706;
}

.shift-item__badge--success {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
}

.shift-item__badge--danger {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
}

.shift-item__badge--info {
    background: rgba(59, 130, 246, 0.1);
    color: #2563eb;
}

.shift-item__badge--secondary {
    background: rgba(148, 163, 184, 0.1);
    color: #64748b;
}

/* Team Performance */
.team-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.team-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(148, 163, 184, 0.05);
    border: 1px solid var(--color-border);
    border-radius: 12px;
}

.team-item__content {
    flex: 1;
}

.team-item__name {
    font-weight: 600;
    color: var(--color-heading);
    margin-bottom: 0.25rem;
}

.team-item__detail {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.team-item__value {
    font-weight: 700;
    color: var(--color-primary);
    font-size: 1rem;
}

.empty-state {
    text-align: center;
    padding: 2rem;
    color: var(--color-text-muted);
}

/* Alert List */
.alert-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.alert-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 12px;
    border: 1px solid;
}

.alert-item__icon {
    font-size: 1.25rem;
    flex-shrink: 0;
    margin-top: 0.125rem;
}

.alert-item__content {
    flex: 1;
}

.alert-item__detail {
    font-size: 0.85rem;
    margin-top: 0.25rem;
    opacity: 0.8;
}

.alert-item--danger {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
    color: #dc2626;
}

/* Payroll Grid */
.payroll-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
}

.payroll-item {
    padding: 1rem;
    background: rgba(148, 163, 184, 0.05);
    border: 1px solid var(--color-border);
    border-radius: 12px;
}

.payroll-item--full {
    grid-column: 1 / -1;
}

.payroll-item__label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    margin-bottom: 0.5rem;
}

.payroll-item__value {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-heading);
}

.payroll-item__value--primary {
    color: #3b82f6;
}

.payroll-item__value--success {
    color: #10b981;
}

.payroll-item__value--danger {
    color: #ef4444;
}

/* Approval List */
.approval-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.approval-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1rem;
    background: rgba(148, 163, 184, 0.05);
    border: 1px solid var(--color-border);
    border-radius: 12px;
}

.approval-item__content {
    flex: 1;
}

.approval-item__title {
    font-weight: 600;
    color: var(--color-heading);
    margin-bottom: 0.25rem;
}

.approval-item__description {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    margin-bottom: 0.25rem;
}

.approval-item__meta {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.approval-item__badge {
    padding: 0.375rem 0.75rem;
    border-radius: 8px;
    background: rgba(245, 158, 11, 0.1);
    color: #d97706;
    font-size: 0.75rem;
    font-weight: 600;
    flex-shrink: 0;
}

/* Attendance List */
.attendance-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.attendance-item {
    padding: 1rem;
    background: rgba(148, 163, 184, 0.05);
    border: 1px solid var(--color-border);
    border-radius: 12px;
}

.attendance-item__name {
    font-weight: 600;
    color: var(--color-heading);
    margin-bottom: 0.25rem;
}

.attendance-item__issue {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    margin-bottom: 0.25rem;
}

.attendance-item__note {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

/* Service List */
.service-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.service-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1rem;
    background: rgba(148, 163, 184, 0.05);
    border: 1px solid var(--color-border);
    border-radius: 12px;
}

.service-item__content {
    flex: 1;
}

.service-item__title {
    font-weight: 600;
    color: var(--color-heading);
    margin-bottom: 0.25rem;
}

.service-item__detail {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    margin-bottom: 0.25rem;
}

.service-item__issue {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.service-item__badge {
    padding: 0.375rem 0.75rem;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    flex-shrink: 0;
}

.service-item__badge--danger {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
}

.service-item__badge--warning {
    background: rgba(245, 158, 11, 0.1);
    color: #d97706;
}

.service-item__badge--info {
    background: rgba(59, 130, 246, 0.1);
    color: #2563eb;
}

.service-item__badge--secondary {
    background: rgba(148, 163, 184, 0.1);
    color: #64748b;
}

@media (max-width: 768px) {
    .kpi-card {
        flex-direction: column;
        text-align: center;
    }

    .stats-grid,
    .payroll-grid {
        grid-template-columns: 1fr;
    }
}
</style>
