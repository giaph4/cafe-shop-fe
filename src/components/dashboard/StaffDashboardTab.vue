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

.kpi-card--salary .kpi-card__icon {
    background: var(--color-bg-muted);
    color: var(--color-accent);
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

/* Attendance Status - Chuẩn hóa */
.attendance-status {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
}

.attendance-status__indicator {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    flex-shrink: 0;
    color: var(--color-text-inverse);
}

.attendance-status__indicator--active {
    background: var(--color-success);
}

.attendance-status__indicator--inactive {
    background: var(--color-secondary);
}

.attendance-status__info {
    flex: 1;
}

.attendance-status__label {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    margin-bottom: var(--spacing-2);
}

.attendance-status__detail {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
}

/* Shift Summary - Chuẩn hóa */
.shift-summary {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-3);
}

.shift-summary__item {
    padding: var(--spacing-3) var(--spacing-4);
    background: var(--color-bg-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
}

.shift-summary__label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-2);
}

.shift-summary__value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
}

.shift-summary__value--success {
    color: var(--color-success);
}

.shift-summary__value--warning {
    color: var(--color-warning);
}

.shift-summary__value--danger {
    color: var(--color-danger);
}

.shift-summary__value--info {
    color: var(--color-info);
}

/* Performance Metrics - Chuẩn hóa */
.performance-metrics {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.performance-metrics__item {
    padding: var(--spacing-3) var(--spacing-4);
    background: var(--color-bg-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
}

.performance-metrics__label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-2);
}

.performance-metrics__value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
}

.performance-metrics__value--success {
    color: var(--color-success);
}

.performance-metrics__value--danger {
    color: var(--color-danger);
}

/* Payroll Details - Chuẩn hóa */
.payroll-details {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.payroll-details__item {
    padding: var(--spacing-3) var(--spacing-4);
    background: var(--color-bg-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
}

.payroll-details__label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-2);
}

.payroll-details__value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
}

.payroll-details__value--success {
    color: var(--color-success);
}

.payroll-details__value--danger {
    color: var(--color-danger);
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

    .shift-summary {
        grid-template-columns: 1fr;
    }
    
    .attendance-status {
        flex-direction: column;
        text-align: center;
    }
    
    .attendance-status__indicator {
        width: 56px;
        height: 56px;
        font-size: 28px;
    }
}
</style>
