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
                        <div class="kpi-card__label">DOANH THU CỦA TÔI</div>
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
                        <div class="kpi-card__label">GIÁ TRỊ ĐƠN TRUNG BÌNH</div>
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
                        <div class="kpi-card__label">CA TRONG TUẦN</div>
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
                        <div class="kpi-card__label">LƯƠNG ƯỚC TÍNH</div>
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
                <div class="info-card">
                    <div class="info-card__header">
                        <div class="info-card__icon">
                            <i class="bi bi-clock-history"></i>
                        </div>
                        <h5 class="info-card__title">Trạng thái Chấm công</h5>
                    </div>
                    <div class="info-card__body">
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
                <div class="info-card">
                    <div class="info-card__header">
                        <div class="info-card__icon">
                            <i class="bi bi-calendar-week"></i>
                        </div>
                        <h5 class="info-card__title">Tóm tắt Ca làm</h5>
                    </div>
                    <div class="info-card__body">
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
                <div class="info-card">
                    <div class="info-card__header">
                        <div class="info-card__icon">
                            <i class="bi bi-graph-up"></i>
                        </div>
                        <h5 class="info-card__title">Hiệu suất của tôi</h5>
                    </div>
                    <div class="info-card__body">
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
                <div class="info-card">
                    <div class="info-card__header">
                        <div class="info-card__icon">
                            <i class="bi bi-cash-coin"></i>
                        </div>
                        <h5 class="info-card__title">Chi tiết Lương</h5>
                    </div>
                    <div class="info-card__body">
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
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    border: 1px solid var(--color-border);
    border-radius: 18px;
    padding: 1.5rem;
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
    display: flex;
    align-items: center;
    gap: 1.25rem;
    transition: all 0.3s ease;
    min-height: 140px;
}

.kpi-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(15, 23, 184, 0.12);
}

.kpi-card__icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    flex-shrink: 0;
    color: white;
}

.kpi-card--revenue .kpi-card__icon {
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
}

.kpi-card--average .kpi-card__icon {
    background: linear-gradient(135deg, #10b981, #34d399);
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
}

.kpi-card--shifts .kpi-card__icon {
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
}

.kpi-card--salary .kpi-card__icon {
    background: linear-gradient(135deg, #8b5cf6, #a78bfa);
    box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
}

.kpi-card__content {
    flex: 1;
}

.kpi-card__label {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.5rem;
}

.kpi-card__value {
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--color-heading);
    line-height: 1.2;
    margin-bottom: 0.25rem;
}

.kpi-card__detail {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    margin-top: 0.25rem;
}

/* Info Cards */
.info-card {
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    border: 1px solid var(--color-border);
    border-radius: 18px;
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
    overflow: hidden;
    height: 100%;
}

.info-card__header {
    background: rgba(148, 163, 184, 0.08);
    border-bottom: 1px solid var(--color-border);
    padding: 1.25rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.info-card__icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.25rem;
    flex-shrink: 0;
}

.info-card__title {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--color-heading);
    margin: 0;
}

.info-card__body {
    padding: 1.5rem;
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
