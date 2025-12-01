<template>
    <div class="staff-dashboard-tab">
        <!-- Top Row: KPI Cards -->
        <div class="row g-4 mb-4" v-if="dashboardData">
            <!-- DOANH THU CỦA TÔI -->
            <div class="col-md-3 col-sm-6" v-if="dashboardData.performance">
                <div class="kpi-card kpi-card--revenue">
                    <div class="kpi-card__icon">
                        <i class="bi bi-cash-stack"></i>
                    </div>
                    <div class="kpi-card__content">
                        <div class="kpi-card__label">Doanh thu của tôi:</div>
                        <div class="kpi-card__value">{{ formatCurrency(dashboardData.performance.totalRevenue || 0) }}</div>
                        <div class="kpi-card__detail">{{ formatNumber(dashboardData.performance.totalOrders || 0) }} đơn hàng</div>
                    </div>
                </div>
            </div>

            <!-- GIÁ TRỊ ĐƠN TRUNG BÌNH -->
            <div class="col-md-3 col-sm-6" v-if="dashboardData.performance">
                <div class="kpi-card kpi-card--average">
                    <div class="kpi-card__icon">
                        <i class="bi bi-tag"></i>
                    </div>
                    <div class="kpi-card__content">
                        <div class="kpi-card__label">Giá trị đơn trung bình:</div>
                        <div class="kpi-card__value">{{ formatCurrency(dashboardData.performance.averageOrderValue || 0) }}</div>
                    </div>
                </div>
            </div>

            <!-- CA TRONG TUẦN -->
            <div class="col-md-3 col-sm-6" v-if="dashboardData.shiftSummary">
                <div class="kpi-card kpi-card--shifts">
                    <div class="kpi-card__icon">
                        <i class="bi bi-calendar-week"></i>
                    </div>
                    <div class="kpi-card__content">
                        <div class="kpi-card__label">Ca trong tuần:</div>
                        <div class="kpi-card__value">{{ formatNumber(dashboardData.shiftSummary.shiftsThisWeek || 0) }}</div>
                        <div class="kpi-card__detail">{{ formatNumber(dashboardData.shiftSummary.completedShifts || 0) }} đã hoàn thành</div>
                    </div>
                </div>
            </div>

            <!-- LƯƠNG ƯỚC TÍNH -->
            <div class="col-md-3 col-sm-6" v-if="dashboardData.payroll">
                <div class="kpi-card kpi-card--salary">
                    <div class="kpi-card__icon">
                        <i class="bi bi-coin"></i>
                    </div>
                    <div class="kpi-card__content">
                        <div class="kpi-card__label">Lương ước tính:</div>
                        <div class="kpi-card__value">{{ formatCurrency(dashboardData.payroll.estimatedCurrentCycle || 0) }}</div>
                        <div class="kpi-card__detail">Đã nhận: {{ formatCurrency(dashboardData.payroll.lastCyclePaid || 0) }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Middle Row: Attendance & Shift Summary -->
        <div class="row g-4 mb-4">
            <!-- Trạng thái Chấm công -->
            <div class="col-lg-6" v-if="dashboardData?.attendance">
                <div class="card info-card">
                    <div class="card-header">
                        <div class="d-flex align-items-center gap-3">
                            <div class="info-card__icon">
                                <i class="bi bi-clock-history"></i>
                            </div>
                            <h5 class="card-title mb-0">Trạng thái Chấm công</h5>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="attendance-status">
                            <div class="attendance-status__indicator" :class="dashboardData.attendance.currentlyCheckedIn ? 'attendance-status__indicator--active' : 'attendance-status__indicator--inactive'">
                                <i :class="dashboardData.attendance.currentlyCheckedIn ? 'bi bi-check-circle' : 'bi bi-clock'"></i>
                            </div>
                            <div class="attendance-status__info">
                                <div class="attendance-status__label">
                                    {{ dashboardData.attendance.currentlyCheckedIn ? 'Đang làm việc' : 'Chưa check-in' }}
                                </div>
                                <div class="attendance-status__detail">
                                    Đúng giờ liên tiếp: {{ formatNumber(dashboardData.attendance.consecutiveOnTimeDays || 0) }} ngày
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tóm tắt Ca làm -->
            <div class="col-lg-6" v-if="dashboardData?.shiftSummary">
                <div class="card info-card">
                    <div class="card-header">
                        <div class="d-flex align-items-center gap-3">
                            <div class="info-card__icon">
                                <i class="bi bi-calendar-week"></i>
                            </div>
                            <h5 class="card-title mb-0">Tóm tắt Ca làm</h5>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="shift-summary">
                            <div class="shift-summary__item">
                                <div class="shift-summary__label">CA TRONG TUẦN</div>
                                <div class="shift-summary__value">{{ formatNumber(dashboardData.shiftSummary.shiftsThisWeek || 0) }}</div>
                            </div>
                            <div class="shift-summary__item">
                                <div class="shift-summary__label">ĐÃ HOÀN THÀNH</div>
                                <div class="shift-summary__value shift-summary__value--success">{{ formatNumber(dashboardData.shiftSummary.completedShifts || 0) }}</div>
                            </div>
                            <div class="shift-summary__item">
                                <div class="shift-summary__label">CHỜ XỬ LÝ</div>
                                <div class="shift-summary__value shift-summary__value--warning">{{ formatNumber(dashboardData.shiftSummary.pendingShifts || 0) }}</div>
                            </div>
                            <div class="shift-summary__item">
                                <div class="shift-summary__label">ĐI MUỘN</div>
                                <div class="shift-summary__value shift-summary__value--danger">{{ formatNumber(dashboardData.shiftSummary.lateCheckIns || 0) }}</div>
                            </div>
                            <div class="shift-summary__item">
                                <div class="shift-summary__label">VỀ SỚM</div>
                                <div class="shift-summary__value shift-summary__value--info">{{ formatNumber(dashboardData.shiftSummary.earlyCheckOuts || 0) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bottom Row: Performance & Payroll Details -->
        <div class="row g-4">
            <!-- Hiệu suất của tôi -->
            <div class="col-lg-6" v-if="dashboardData?.performance">
                <div class="card info-card">
                    <div class="card-header">
                        <div class="d-flex align-items-center gap-3">
                            <div class="info-card__icon">
                                <i class="bi bi-graph-up"></i>
                            </div>
                            <h5 class="card-title mb-0">Hiệu suất của tôi</h5>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="performance-metrics">
                            <div class="performance-metrics__item">
                                <div class="performance-metrics__label">TỔNG ĐƠN HÀNG</div>
                                <div class="performance-metrics__value">{{ formatNumber(dashboardData.performance.totalOrders || 0) }}</div>
                            </div>
                            <div class="performance-metrics__item">
                                <div class="performance-metrics__label">PHẢN HỒI TÍCH CỰC</div>
                                <div class="performance-metrics__value performance-metrics__value--success">{{ formatNumber(dashboardData.performance.positiveFeedbacks || 0) }}</div>
                            </div>
                            <div class="performance-metrics__item">
                                <div class="performance-metrics__label">PHẢN HỒI TIÊU CỰC</div>
                                <div class="performance-metrics__value performance-metrics__value--danger">{{ formatNumber(dashboardData.performance.negativeFeedbacks || 0) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Chi tiết Lương -->
            <div class="col-lg-6" v-if="dashboardData?.payroll">
                <div class="card info-card">
                    <div class="card-header">
                        <div class="d-flex align-items-center gap-3">
                            <div class="info-card__icon">
                                <i class="bi bi-cash-coin"></i>
                            </div>
                            <h5 class="card-title mb-0">Chi tiết Lương</h5>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="payroll-details">
                            <div class="payroll-details__item">
                                <div class="payroll-details__label">LƯƠNG ƯỚC TÍNH</div>
                                <div class="payroll-details__value">{{ formatCurrency(dashboardData.payroll.estimatedCurrentCycle || 0) }}</div>
                            </div>
                            <div class="payroll-details__item">
                                <div class="payroll-details__label">ĐÃ NHẬN KỲ TRƯỚC</div>
                                <div class="payroll-details__value">{{ formatCurrency(dashboardData.payroll.lastCyclePaid || 0) }}</div>
                            </div>
                            <div class="payroll-details__item">
                                <div class="payroll-details__label">TỔNG THƯỞNG</div>
                                <div class="payroll-details__value payroll-details__value--success">{{ formatCurrency(dashboardData.payroll.bonusTotal || 0) }}</div>
                            </div>
                            <div class="payroll-details__item">
                                <div class="payroll-details__label">TỔNG PHẠT</div>
                                <div class="payroll-details__value payroll-details__value--danger">{{ formatCurrency(dashboardData.payroll.penaltyTotal || 0) }}</div>
                            </div>
                            <div class="payroll-details__item">
                                <div class="payroll-details__label">ĐIỀU CHỈNH BỔ SUNG</div>
                                <div class="payroll-details__value" :class="(dashboardData.payroll.adjustmentNet || 0) >= 0 ? 'payroll-details__value--success' : 'payroll-details__value--danger'">
                                    {{ formatCurrency(dashboardData.payroll.adjustmentNet || 0) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { formatCurrency, formatNumber } from '@/utils/formatters'

defineProps({
    dashboardData: Object
})
</script>

<style scoped>
.staff-dashboard-tab {
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

.kpi-card--salary .kpi-card__icon {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
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


/* Attendance Status */
.attendance-status {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.attendance-status__indicator {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    flex-shrink: 0;
    color: white;
}

.attendance-status__indicator--active {
    background: linear-gradient(135deg, #22c55e, #4ade80);
    box-shadow: 0 10px 25px rgba(34, 197, 94, 0.3);
}

.attendance-status__indicator--inactive {
    background: linear-gradient(135deg, #94a3b8, #cbd5e1);
    box-shadow: 0 10px 25px rgba(148, 163, 184, 0.3);
}

.attendance-status__info {
    flex: 1;
}

.attendance-status__label {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-heading);
    margin-bottom: 0.5rem;
}

.attendance-status__detail {
    font-size: 0.9rem;
    color: var(--color-text-muted);
}

/* Shift Summary */
.shift-summary {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
}

.shift-summary__item {
    padding: 1rem;
    background: rgba(148, 163, 184, 0.05);
    border: 1px solid var(--color-border);
    border-radius: 12px;
}

.shift-summary__label {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.5rem;
}

.shift-summary__value {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--color-heading);
}

.shift-summary__value--success {
    color: #22c55e;
}

.shift-summary__value--warning {
    color: #f59e0b;
}

.shift-summary__value--danger {
    color: #ef4444;
}

.shift-summary__value--info {
    color: #3b82f6;
}

/* Performance Metrics */
.performance-metrics {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.performance-metrics__item {
    padding: 1rem;
    background: rgba(148, 163, 184, 0.05);
    border: 1px solid var(--color-border);
    border-radius: 12px;
}

.performance-metrics__label {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.5rem;
}

.performance-metrics__value {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--color-heading);
}

.performance-metrics__value--success {
    color: #22c55e;
}

.performance-metrics__value--danger {
    color: #ef4444;
}

/* Payroll Details */
.payroll-details {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.payroll-details__item {
    padding: 1rem;
    background: rgba(148, 163, 184, 0.05);
    border: 1px solid var(--color-border);
    border-radius: 12px;
}

.payroll-details__label {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.5rem;
}

.payroll-details__value {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--color-heading);
}

.payroll-details__value--success {
    color: #22c55e;
}

.payroll-details__value--danger {
    color: #ef4444;
}

@media (max-width: 768px) {
    .kpi-card {
        flex-direction: column;
        text-align: center;
    }

    .shift-summary {
        grid-template-columns: 1fr;
    }
}
</style>
