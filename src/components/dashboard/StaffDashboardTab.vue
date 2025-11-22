<template>
    <div class="staff-dashboard-tab">
        <!-- Stats Cards -->
        <div class="row g-4 mb-4" v-if="dashboardData">
            <div class="col-md-3 col-sm-6 d-flex" v-if="dashboardData.performance">
                <div class="card metric-card metric-card--primary w-100">
                    <div class="card-body">
                        <div class="metric-label">Doanh thu của tôi</div>
                        <div class="metric-value">{{ formatCurrency(dashboardData.performance.totalRevenue) }}</div>
                        <div class="metric-detail">{{ formatNumber(dashboardData.performance.totalOrders) }} đơn hàng</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 d-flex" v-if="dashboardData.performance">
                <div class="card metric-card metric-card--success w-100">
                    <div class="card-body">
                        <div class="metric-label">Giá trị đơn trung bình</div>
                        <div class="metric-value">{{ formatCurrency(dashboardData.performance.averageOrderValue) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 d-flex" v-if="dashboardData.shiftSummary">
                <div class="card metric-card metric-card--warning w-100">
                    <div class="card-body">
                        <div class="metric-label">Ca trong tuần</div>
                        <div class="metric-value">{{ formatNumber(dashboardData.shiftSummary.shiftsThisWeek) }}</div>
                        <div class="metric-detail">{{ formatNumber(dashboardData.shiftSummary.completedShifts) }} đã hoàn thành</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 d-flex" v-if="dashboardData.payroll">
                <div class="card metric-card metric-card--info w-100">
                    <div class="card-body">
                        <div class="metric-label">Lương ước tính</div>
                        <div class="metric-value">{{ formatCurrency(dashboardData.payroll.estimatedCurrentCycle) }}</div>
                        <div class="metric-detail">Đã nhận: {{ formatCurrency(dashboardData.payroll.lastCyclePaid) }}</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-4">
            <!-- Attendance Status -->
            <div class="col-lg-6" v-if="dashboardData?.attendance">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-clock-history me-2"></i>Trạng thái Chấm công
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="attendance-status">
                            <div class="status-indicator" :class="dashboardData.attendance.currentlyCheckedIn ? 'status-indicator--active' : 'status-indicator--inactive'">
                                <i :class="dashboardData.attendance.currentlyCheckedIn ? 'bi bi-check-circle' : 'bi bi-clock'"></i>
                            </div>
                            <div class="status-info">
                                <div class="status-label">
                                    {{ dashboardData.attendance.currentlyCheckedIn ? 'Đang làm việc' : 'Chưa check-in' }}
                                </div>
                                <div v-if="dashboardData.attendance.lastCheckIn" class="status-detail">
                                    Check-in: {{ formatDateTime(dashboardData.attendance.lastCheckIn) }}
                                </div>
                                <div v-if="dashboardData.attendance.lastCheckOut" class="status-detail">
                                    Check-out: {{ formatDateTime(dashboardData.attendance.lastCheckOut) }}
                                </div>
                                <div class="status-detail">
                                    Đúng giờ liên tiếp: {{ formatNumber(dashboardData.attendance.consecutiveOnTimeDays) }} ngày
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Shift Summary -->
            <div class="col-lg-6" v-if="dashboardData?.shiftSummary">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-calendar-week me-2"></i>Tóm tắt Ca làm
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-6">
                                <div class="stat-item">
                                    <div class="stat-item__label">Ca trong tuần</div>
                                    <div class="stat-item__value text-primary">{{ formatNumber(dashboardData.shiftSummary.shiftsThisWeek) }}</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="stat-item">
                                    <div class="stat-item__label">Đã hoàn thành</div>
                                    <div class="stat-item__value text-success">{{ formatNumber(dashboardData.shiftSummary.completedShifts) }}</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="stat-item">
                                    <div class="stat-item__label">Chờ xử lý</div>
                                    <div class="stat-item__value text-warning">{{ formatNumber(dashboardData.shiftSummary.pendingShifts) }}</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="stat-item">
                                    <div class="stat-item__label">Đi muộn</div>
                                    <div class="stat-item__value text-danger">{{ formatNumber(dashboardData.shiftSummary.lateCheckIns) }}</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="stat-item">
                                    <div class="stat-item__label">Về sớm</div>
                                    <div class="stat-item__value text-info">{{ formatNumber(dashboardData.shiftSummary.earlyCheckOuts) }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Upcoming Shifts -->
            <div class="col-lg-6" v-if="dashboardData?.upcomingShifts?.length > 0">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-calendar-event me-2"></i>Ca sắp tới
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="list-group list-group-flush">
                            <div
                                v-for="(shift, index) in dashboardData.upcomingShifts.slice(0, 5)"
                                :key="shift.assignmentId || index"
                                class="list-group-item"
                            >
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <div class="fw-semibold">{{ formatDate(shift.shiftDate) }}</div>
                                        <small class="text-muted">{{ shift.timeRange }}</small>
                                        <div v-if="shift.role" class="small text-muted mt-1">
                                            Vai trò: {{ shift.role }}
                                        </div>
                                        <div v-if="shift.managerNote" class="small text-muted mt-1">
                                            Ghi chú: {{ shift.managerNote }}
                                        </div>
                                    </div>
                                    <span class="badge" :class="getShiftStatusBadge(shift.status)">
                                        {{ shift.status }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Performance Details -->
            <div class="col-lg-6" v-if="dashboardData?.performance">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-graph-up me-2"></i>Hiệu suất của tôi
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-6">
                                <div class="stat-item">
                                    <div class="stat-item__label">Tổng đơn hàng</div>
                                    <div class="stat-item__value">{{ formatNumber(dashboardData.performance.totalOrders) }}</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="stat-item">
                                    <div class="stat-item__label">Phản hồi tích cực</div>
                                    <div class="stat-item__value text-success">{{ formatNumber(dashboardData.performance.positiveFeedbacks) }}</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="stat-item">
                                    <div class="stat-item__label">Phản hồi tiêu cực</div>
                                    <div class="stat-item__value text-danger">{{ formatNumber(dashboardData.performance.negativeFeedbacks) }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Payroll Details -->
            <div class="col-lg-6" v-if="dashboardData?.payroll">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-cash-coin me-2"></i>Chi tiết Lương
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-6">
                                <div class="stat-item">
                                    <div class="stat-item__label">Lương ước tính</div>
                                    <div class="stat-item__value text-primary">{{ formatCurrency(dashboardData.payroll.estimatedCurrentCycle) }}</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="stat-item">
                                    <div class="stat-item__label">Đã nhận kỳ trước</div>
                                    <div class="stat-item__value">{{ formatCurrency(dashboardData.payroll.lastCyclePaid) }}</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="stat-item">
                                    <div class="stat-item__label">Tổng thưởng</div>
                                    <div class="stat-item__value text-success">{{ formatCurrency(dashboardData.payroll.bonusTotal) }}</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="stat-item">
                                    <div class="stat-item__label">Tổng phạt</div>
                                    <div class="stat-item__value text-danger">{{ formatCurrency(dashboardData.payroll.penaltyTotal) }}</div>
                                </div>
                            </div>
                            <div class="col-12">
                                <div class="stat-item">
                                    <div class="stat-item__label">Điều chỉnh ròng</div>
                                    <div class="stat-item__value" :class="dashboardData.payroll.adjustmentNet >= 0 ? 'text-success' : 'text-danger'">
                                        {{ formatCurrency(dashboardData.payroll.adjustmentNet) }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Task Reminders -->
            <div class="col-lg-6" v-if="dashboardData?.taskReminders?.length > 0">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-list-check me-2"></i>Nhắc nhở Công việc
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="list-group list-group-flush">
                            <div
                                v-for="(task, index) in dashboardData.taskReminders.slice(0, 5)"
                                :key="index"
                                class="list-group-item"
                            >
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <div class="fw-semibold">{{ task.title }}</div>
                                        <small class="text-muted">{{ task.description }}</small>
                                        <div class="small text-muted mt-1">
                                            Hạn: {{ formatDate(task.dueDate) }}
                                        </div>
                                    </div>
                                    <span class="badge" :class="getPriorityBadge(task.priority)">
                                        {{ task.priority }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Announcements -->
            <div class="col-lg-6" v-if="dashboardData?.announcements?.length > 0">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-megaphone me-2"></i>Thông báo
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="list-group list-group-flush">
                            <div
                                v-for="(announcement, index) in dashboardData.announcements.slice(0, 5)"
                                :key="index"
                                class="list-group-item"
                            >
                                <div>
                                    <div class="fw-semibold">{{ announcement.title }}</div>
                                    <div class="mt-2">{{ announcement.content }}</div>
                                    <div class="small text-muted mt-2">
                                        Bởi: {{ announcement.publisher }} | 
                                        {{ formatDateTime(announcement.publishedAt) }}
                                    </div>
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
import { formatCurrency, formatNumber, formatDate, formatDateTime } from '@/utils/formatters'

defineProps({
    dashboardData: Object
})

const getShiftStatusBadge = (status) => {
    if (!status) return 'bg-secondary'
    const statusLower = status.toLowerCase()
    if (statusLower.includes('pending') || statusLower.includes('scheduled')) {
        return 'bg-warning'
    } else if (statusLower.includes('completed')) {
        return 'bg-success'
    } else if (statusLower.includes('cancelled')) {
        return 'bg-danger'
    } else if (statusLower.includes('accepted')) {
        return 'bg-info'
    }
    return 'bg-secondary'
}

const getPriorityBadge = (priority) => {
    if (!priority) return 'bg-secondary'
    const pri = priority.toLowerCase()
    if (pri.includes('high') || pri.includes('urgent')) return 'bg-danger'
    if (pri.includes('medium')) return 'bg-warning'
    if (pri.includes('low')) return 'bg-info'
    return 'bg-secondary'
}
</script>

<style scoped>
.staff-dashboard-tab {
    padding: 0;
}

.metric-card {
    border-radius: 18px;
    border: 1px solid var(--color-border);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
    transition: all 0.2s ease;
    height: 100%;
    min-height: 140px;
}

.metric-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 20px 35px rgba(15, 23, 42, 0.12);
}

.metric-card--primary {
    background: linear-gradient(170deg, var(--color-card), var(--color-soft-primary));
}

.metric-card--success {
    background: linear-gradient(170deg, var(--color-card), var(--color-soft-success));
}

.metric-card--warning {
    background: linear-gradient(170deg, var(--color-card), var(--color-soft-warning));
}

.metric-card--info {
    background: linear-gradient(170deg, var(--color-card), var(--color-soft-info));
}

.metric-label {
    font-size: 0.88rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    margin-bottom: 0.5rem;
    font-weight: 600;
}

.metric-value {
    font-size: 1.8rem;
    font-weight: 800;
    color: var(--color-heading);
    margin-bottom: 0.25rem;
}

.metric-detail {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin-top: 0.25rem;
}

.card {
    border-radius: 18px;
    border: 1px solid var(--color-border);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
}

.card-header {
    background: rgba(148, 163, 184, 0.08);
    border-bottom: 1px solid var(--color-border);
    padding: 1rem 1.5rem;
    border-radius: 18px 18px 0 0;
}

.attendance-status {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1rem;
}

.status-indicator {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    flex-shrink: 0;
}

.status-indicator--active {
    background: linear-gradient(135deg, #22c55e, #4ade80);
    color: white;
    box-shadow: 0 10px 20px rgba(34, 197, 94, 0.3);
}

.status-indicator--inactive {
    background: linear-gradient(135deg, #94a3b8, #cbd5e1);
    color: white;
    box-shadow: 0 10px 20px rgba(148, 163, 184, 0.3);
}

.status-info {
    flex: 1;
}

.status-label {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-heading);
    margin-bottom: 0.5rem;
}

.status-detail {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    margin-top: 0.25rem;
}

.stat-item {
    padding: 0.75rem;
    background: rgba(148, 163, 184, 0.05);
    border-radius: 8px;
    border: 1px solid var(--color-border);
}

.stat-item__label {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: 0.25rem;
}

.stat-item__value {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-heading);
}

.list-group-item {
    border: none;
    border-bottom: 1px solid var(--color-border);
    padding: 1rem 0;
}

.list-group-item:last-child {
    border-bottom: none;
}
</style>

