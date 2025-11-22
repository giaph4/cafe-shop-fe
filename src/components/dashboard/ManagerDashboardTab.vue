<template>
    <div class="manager-dashboard-tab">
        <!-- Stats Cards -->
        <div class="row g-4 mb-4" v-if="dashboardData">
            <div class="col-md-3 col-sm-6 d-flex" v-if="dashboardData.teamPerformance">
                <div class="card metric-card metric-card--primary w-100">
                    <div class="card-body">
                        <div class="metric-label">Doanh thu tổng</div>
                        <div class="metric-value">{{ formatCurrency(dashboardData.teamPerformance.totalRevenue) }}</div>
                        <div class="metric-detail">{{ formatNumber(dashboardData.teamPerformance.totalOrders) }} đơn hàng</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 d-flex" v-if="dashboardData.teamPerformance">
                <div class="card metric-card metric-card--success w-100">
                    <div class="card-body">
                        <div class="metric-label">Giá trị đơn trung bình</div>
                        <div class="metric-value">{{ formatCurrency(dashboardData.teamPerformance.averageOrderValue) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 d-flex" v-if="dashboardData.shiftOverview">
                <div class="card metric-card metric-card--warning w-100">
                    <div class="card-body">
                        <div class="metric-label">Ca đang diễn ra</div>
                        <div class="metric-value">{{ formatNumber(dashboardData.shiftOverview.inProgress) }}</div>
                        <div class="metric-detail">{{ formatNumber(dashboardData.shiftOverview.scheduledToday) }} ca hôm nay</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 d-flex" v-if="dashboardData.inventory">
                <div class="card metric-card metric-card--danger w-100">
                    <div class="card-body">
                        <div class="metric-label">Nguyên liệu sắp hết</div>
                        <div class="metric-value">{{ formatNumber(dashboardData.inventory.lowStockItems) }}</div>
                        <div class="metric-detail">{{ formatNumber(dashboardData.inventory.criticalStockItems) }} mức nguy hiểm</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-4">
            <!-- Shift Overview -->
            <div class="col-lg-6" v-if="dashboardData?.shiftOverview">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-calendar-check me-2"></i>Tổng quan Ca làm
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="row g-3 mb-3">
                            <div class="col-6">
                                <div class="stat-item">
                                    <div class="stat-item__label">Đã lên lịch hôm nay</div>
                                    <div class="stat-item__value text-primary">{{ formatNumber(dashboardData.shiftOverview.scheduledToday) }}</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="stat-item">
                                    <div class="stat-item__label">Đang diễn ra</div>
                                    <div class="stat-item__value text-warning">{{ formatNumber(dashboardData.shiftOverview.inProgress) }}</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="stat-item">
                                    <div class="stat-item__label">Đã hoàn thành</div>
                                    <div class="stat-item__value text-success">{{ formatNumber(dashboardData.shiftOverview.completed) }}</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="stat-item">
                                    <div class="stat-item__label">Đã hủy</div>
                                    <div class="stat-item__value text-danger">{{ formatNumber(dashboardData.shiftOverview.cancelled) }}</div>
                                </div>
                            </div>
                        </div>

                        <div v-if="dashboardData.shiftOverview.upcomingShifts?.length > 0">
                            <h6 class="mb-3">Ca sắp tới</h6>
                            <div class="list-group list-group-flush">
                                <div
                                    v-for="(shift, index) in dashboardData.shiftOverview.upcomingShifts.slice(0, 5)"
                                    :key="shift.shiftId || index"
                                    class="list-group-item"
                                >
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <div class="fw-semibold">{{ formatDate(shift.shiftDate) }}</div>
                                            <small class="text-muted">{{ shift.timeRange }}</small>
                                        </div>
                                        <div class="text-end">
                                            <span class="badge" :class="getShiftStatusBadge(shift.status)">
                                                {{ shift.status }}
                                            </span>
                                            <div class="small text-muted mt-1">
                                                {{ shift.assignedStaff }}/{{ shift.capacity }} nhân viên
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Team Performance -->
            <div class="col-lg-6" v-if="dashboardData?.teamPerformance">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-graph-up me-2"></i>Hiệu suất Team
                        </h5>
                    </div>
                    <div class="card-body">
                        <div v-if="dashboardData.teamPerformance.topStaff?.length > 0">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Nhân viên</th>
                                            <th class="text-end">Đơn hàng</th>
                                            <th class="text-end">Doanh thu</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr
                                            v-for="(staff, index) in dashboardData.teamPerformance.topStaff.slice(0, 5)"
                                            :key="staff.staffId || index"
                                        >
                                            <td>
                                                <strong>{{ staff.staffName || 'N/A' }}</strong>
                                            </td>
                                            <td class="text-end">{{ formatNumber(staff.orders) }}</td>
                                            <td class="text-end">{{ formatCurrency(staff.revenue) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div v-else class="text-center text-muted py-4">
                            Chưa có dữ liệu hiệu suất
                        </div>
                    </div>
                </div>
            </div>

            <!-- Inventory Alerts -->
            <div class="col-lg-6" v-if="dashboardData?.inventory?.alerts?.length > 0">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-exclamation-triangle me-2"></i>Cảnh báo Kho
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="list-group list-group-flush">
                            <div
                                v-for="(alert, index) in dashboardData.inventory.alerts.slice(0, 5)"
                                :key="alert.ingredientId || index"
                                class="list-group-item"
                            >
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <div class="fw-semibold">{{ alert.ingredientName || 'N/A' }}</div>
                                        <small class="text-muted">
                                            Tồn kho: {{ formatNumber(alert.quantityOnHand) }} | 
                                            Mức đặt lại: {{ formatNumber(alert.reorderLevel) }}
                                        </small>
                                    </div>
                                    <span class="badge bg-danger">Nguy hiểm</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Payroll Overview -->
            <div class="col-lg-6" v-if="dashboardData?.payroll">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-cash-coin me-2"></i>Tổng quan Lương
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-6">
                                <div class="stat-item">
                                    <div class="stat-item__label">Lương ước tính</div>
                                    <div class="stat-item__value text-primary">{{ formatCurrency(dashboardData.payroll.estimatedPayroll) }}</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="stat-item">
                                    <div class="stat-item__label">Số nhân viên</div>
                                    <div class="stat-item__value">{{ formatNumber(dashboardData.payroll.staffCount) }}</div>
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

            <!-- Pending Approvals -->
            <div class="col-lg-6" v-if="dashboardData?.pendingApprovals?.length > 0">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-clock-history me-2"></i>Chờ phê duyệt
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="list-group list-group-flush">
                            <div
                                v-for="(approval, index) in dashboardData.pendingApprovals.slice(0, 5)"
                                :key="index"
                                class="list-group-item"
                            >
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <div class="fw-semibold">{{ approval.module || 'N/A' }}</div>
                                        <small class="text-muted">{{ approval.description }}</small>
                                        <div class="small text-muted mt-1">
                                            Yêu cầu bởi: {{ approval.requestedBy }} | 
                                            {{ formatDate(approval.requestedAt) }}
                                        </div>
                                    </div>
                                    <span class="badge bg-warning">{{ approval.status }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Attendance Alerts -->
            <div class="col-lg-6" v-if="dashboardData?.attendanceAlerts?.length > 0">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-person-check me-2"></i>Cảnh báo Chấm công
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="list-group list-group-flush">
                            <div
                                v-for="(alert, index) in dashboardData.attendanceAlerts.slice(0, 5)"
                                :key="alert.assignmentId || index"
                                class="list-group-item"
                            >
                                <div>
                                    <div class="fw-semibold">{{ alert.staffName || 'N/A' }}</div>
                                    <small class="text-muted">{{ alert.issueType }}</small>
                                    <div v-if="alert.note" class="small text-muted mt-1">{{ alert.note }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Service Issues -->
            <div class="col-lg-6" v-if="dashboardData?.serviceIssues?.length > 0">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-exclamation-circle me-2"></i>Vấn đề Dịch vụ
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="list-group list-group-flush">
                            <div
                                v-for="(issue, index) in dashboardData.serviceIssues.slice(0, 5)"
                                :key="issue.orderId || index"
                                class="list-group-item"
                            >
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <div class="fw-semibold">Đơn #{{ issue.orderId }}</div>
                                        <small class="text-muted">Bàn: {{ issue.tableName }}</small>
                                        <div class="small text-muted mt-1">{{ issue.issue }}</div>
                                    </div>
                                    <span class="badge" :class="getSeverityBadge(issue.severity)">
                                        {{ issue.severity }}
                                    </span>
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
import { formatCurrency, formatNumber, formatDate } from '@/utils/formatters'

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
    } else if (statusLower.includes('active') || statusLower.includes('in_progress')) {
        return 'bg-info'
    }
    return 'bg-secondary'
}

const getSeverityBadge = (severity) => {
    if (!severity) return 'bg-secondary'
    const sev = severity.toLowerCase()
    if (sev.includes('critical') || sev.includes('high')) return 'bg-danger'
    if (sev.includes('medium')) return 'bg-warning'
    if (sev.includes('low')) return 'bg-info'
    return 'bg-secondary'
}
</script>

<style scoped>
.manager-dashboard-tab {
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

.metric-card--danger {
    background: linear-gradient(170deg, var(--color-card), var(--color-soft-danger));
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

.table {
    margin-bottom: 0;
}

.table thead th {
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.85rem;
    letter-spacing: 0.05em;
    border-bottom: 2px solid var(--color-border);
}
</style>

