<template>
    <Teleport to="body">
        <Transition name="fade">
            <div v-if="visible" class="staff-detail-modal-overlay" @click.self="$emit('close')">
                <div class="staff-detail-modal-dialog">
                    <div class="staff-detail-modal-content">
                        <div class="staff-detail-modal-header">
                            <div class="staff-detail-modal-header-main">
                                <div class="avatar-wrapper">
                                    <img
                                        v-if="avatarUrl"
                                        :src="avatarUrl"
                                        class="avatar"
                                        :alt="staff.fullName || staff.username"
                                    />
                                    <div v-else class="avatar placeholder">{{ initials }}</div>
                                </div>
                                <div class="staff-detail-modal-header-text">
                                    <h4 class="mb-1">{{ staff.fullName || staff.username }}</h4>
                                    <p class="text-muted mb-1">@{{ staff.username }}</p>
                                    <div class="small text-muted">Tạo lúc {{ formatDateTime(staff.createdAt) }}</div>
                                </div>
                            </div>
                            <div class="staff-detail-modal-header-meta">
                                <span class="status-badge" :class="statusClass">{{ statusLabel }}</span>
                                <button type="button" class="btn btn-outline-secondary btn-sm" @click="$emit('close')">
                                    <i class="bi bi-x-lg"></i>
                                </button>
                            </div>
                        </div>

                        <div class="staff-detail-modal-body">
                            <section class="info-card">
                                <div class="section-header">
                                    <h6>Thông tin cá nhân</h6>
                                </div>
                                <div class="info-grid">
                                    <div>
                                        <label>Họ tên</label>
                                        <p>{{ staff.fullName || 'Chưa cập nhật' }}</p>
                                    </div>
                                    <div>
                                        <label>Email</label>
                                        <p>{{ staff.email || 'Chưa có email' }}</p>
                                    </div>
                                    <div>
                                        <label>Số điện thoại</label>
                                        <p>{{ staff.phone || 'Chưa cập nhật' }}</p>
                                    </div>
                                    <div>
                                        <label>Địa chỉ</label>
                                        <p>{{ staff.address || 'Chưa cập nhật' }}</p>
                                    </div>
                                    <div>
                                        <label>Quyền</label>
                                        <p>
                                            <span
                                                v-for="role in staff.roles"
                                                :key="role.id"
                                                class="badge bg-soft me-1"
                                            >
                                                {{ formatRole(role.name) }}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <label>Cập nhật lần cuối</label>
                                        <p>{{ formatDateTime(staff.updatedAt) }}</p>
                                    </div>
                                </div>
                            </section>

                            <section class="info-card" v-if="dashboard">
                                <div class="section-header">
                                    <h6>Hiệu suất & KPI</h6>
                                </div>
                                <div class="kpi-grid">
                                    <div class="kpi-item">
                                        <span class="kpi-label">Tổng đơn hàng</span>
                                        <span class="kpi-value">{{ dashboard.performance?.totalOrders ?? 0 }}</span>
                                    </div>
                                    <div class="kpi-item">
                                        <span class="kpi-label">Doanh thu</span>
                                        <span class="kpi-value">
                                            {{ formatCurrency(dashboard.performance?.totalRevenue) }}
                                        </span>
                                    </div>
                                    <div class="kpi-item">
                                        <span class="kpi-label">Giá trị trung bình</span>
                                        <span class="kpi-value">
                                            {{ formatCurrency(dashboard.performance?.averageOrderValue) }}
                                        </span>
                                    </div>
                                    <div class="kpi-item">
                                        <span class="kpi-label">Ca tuần này</span>
                                        <span class="kpi-value">{{ dashboard.shiftSummary?.shiftsThisWeek ?? 0 }}</span>
                                    </div>
                                    <div class="kpi-item">
                                        <span class="kpi-label">Đang/chờ thực hiện</span>
                                        <span class="kpi-value">{{ dashboard.shiftSummary?.pendingShifts ?? 0 }}</span>
                                    </div>
                                    <div class="kpi-item">
                                        <span class="kpi-label">Ca hoàn thành</span>
                                        <span class="kpi-value">{{ dashboard.shiftSummary?.completedShifts ?? 0 }}</span>
                                    </div>
                                </div>
                            </section>

                            <section class="info-card" v-if="dashboard?.attendance">
                                <div class="section-header">
                                    <h6>Chấm công</h6>
                                </div>
                                <ul class="list-unstyled mb-0">
                                    <li>
                                        <strong>Đang check-in:</strong>
                                        <span :class="dashboard.attendance.currentlyCheckedIn ? 'text-success' : 'text-muted'">
                                            {{ dashboard.attendance.currentlyCheckedIn ? 'Có' : 'Không' }}
                                        </span>
                                    </li>
                                    <li>
                                        <strong>Check-in gần nhất:</strong>
                                        {{ formatDateTime(dashboard.attendance.lastCheckIn) }}
                                    </li>
                                    <li>
                                        <strong>Check-out gần nhất:</strong>
                                        {{ formatDateTime(dashboard.attendance.lastCheckOut) }}
                                    </li>
                                    <li>
                                        <strong>Số ngày đúng giờ liên tiếp:</strong>
                                        {{ dashboard.attendance.consecutiveOnTimeDays ?? 0 }}
                                    </li>
                                </ul>
                            </section>

                            <section class="info-card" v-if="dashboard?.payroll">
                                <div class="section-header">
                                    <h6>Payroll</h6>
                                </div>
                                <div class="kpi-grid">
                                    <div class="kpi-item">
                                        <span class="kpi-label">Ước tính chu kỳ hiện tại</span>
                                        <span class="kpi-value">
                                            {{ formatCurrency(dashboard.payroll.estimatedCurrentCycle) }}
                                        </span>
                                    </div>
                                    <div class="kpi-item">
                                        <span class="kpi-label">Tổng thưởng</span>
                                        <span class="kpi-value text-success">
                                            {{ formatCurrency(dashboard.payroll.bonusTotal) }}
                                        </span>
                                    </div>
                                    <div class="kpi-item">
                                        <span class="kpi-label">Tổng phạt</span>
                                        <span class="kpi-value text-danger">
                                            {{ formatCurrency(dashboard.payroll.penaltyTotal) }}
                                        </span>
                                    </div>
                                    <div class="kpi-item">
                                        <span class="kpi-label">Điều chỉnh ròng</span>
                                        <span class="kpi-value">
                                            {{ formatCurrency(dashboard.payroll.adjustmentNet) }}
                                        </span>
                                    </div>
                                </div>
                            </section>

                            <section class="info-card" v-if="dashboard?.upcomingShifts?.length">
                                <div class="section-header">
                                    <h6>Ca sắp tới</h6>
                                </div>
                                <ul class="list-group list-group-flush staff-detail-upcoming-list">
                                    <li
                                        v-for="shift in dashboard.upcomingShifts"
                                        :key="shift.assignmentId"
                                        class="list-group-item"
                                    >
                                        <div class="d-flex justify-content-between align-items-start gap-3">
                                            <div>
                                                <div class="fw-semibold">
                                                    {{ formatDate(shift.shiftDate) }} • {{ shift.timeRange }}
                                                </div>
                                                <div class="text-muted small">Vai trò: {{ shift.role || '—' }}</div>
                                                <div class="text-muted small" v-if="shift.managerNote">
                                                    Ghi chú: {{ shift.managerNote }}
                                                </div>
                                            </div>
                                            <span class="badge bg-soft">{{ shift.status }}</span>
                                        </div>
                                    </li>
                                </ul>
                            </section>

                            <div v-if="loading" class="text-center py-3">
                                <div class="spinner-border text-primary"></div>
                            </div>
                        </div>

                        <div class="staff-detail-modal-footer">
                            <button type="button" class="btn btn-outline-secondary" @click="$emit('close')">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
import {computed} from 'vue'
import {formatCurrency, formatDate, formatDateTime} from '@/utils/formatters'

const props = defineProps({
    visible: {type: Boolean, default: false},
    staff: {type: Object, default: () => ({})},
    dashboard: {type: Object, default: null},
    loading: {type: Boolean, default: false}
})

defineEmits(['close'])

const avatarUrl = computed(() => props.staff?.avatarUrl || '')

const initials = computed(() => {
    const source = props.staff?.fullName || props.staff?.username || ''
    return source
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase())
        .slice(0, 2)
        .join('') || 'NV'
})

const statusClass = computed(() => {
    switch (props.staff?.status) {
        case 'ACTIVE':
            return 'status-badge--active'
        case 'INACTIVE':
            return 'status-badge--inactive'
        default:
            return 'status-badge--neutral'
    }
})

const statusLabel = computed(() => {
    switch (props.staff?.status) {
        case 'ACTIVE':
            return 'Đang hoạt động'
        case 'INACTIVE':
            return 'Đã khóa'
        default:
            return props.staff?.status || '—'
    }
})

const formatRole = (roleName) => {
    if (!roleName) return '—'
    return roleName.replace('ROLE_', '').toLowerCase().replace(/(^|\s)\w/g, (s) => s.toUpperCase())
}
</script>

<style scoped>
.staff-detail-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1050;
    padding: var(--spacing-4);
}

.staff-detail-modal-dialog {
    width: 100%;
    max-width: 900px;
}

.staff-detail-modal-content {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 80px);
    overflow: hidden;
}

.staff-detail-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: var(--spacing-6);
    border-bottom: 1px solid var(--color-border);
    gap: var(--spacing-4);
    background: var(--color-card);
    flex-shrink: 0;
}

.staff-detail-modal-header-main {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    min-width: 0;
}

.staff-detail-modal-header-text h4 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.staff-detail-modal-header-text p {
    font-size: var(--font-size-base);
}

.staff-detail-modal-header-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--spacing-2);
}

.staff-detail-modal-body {
    padding: var(--spacing-4);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.staff-detail-modal-footer {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-2);
    background: var(--color-bg);
}

.staff-detail-modal-footer .btn {
    font-size: var(--font-size-base);
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.staff-detail-modal-footer .btn-outline-secondary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.staff-detail-modal-footer .btn-outline-secondary:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.staff-detail-modal-footer .btn i {
    font-size: 18px;
    line-height: 1;
}

.staff-detail-modal-header-meta .btn-outline-secondary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.staff-detail-modal-header-meta .btn-outline-secondary:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.info-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-4);
    background: var(--color-card);
    transition: all var(--transition-base);
}

.info-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-3);
    gap: var(--spacing-2);
}

.section-header h6 {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin: 0;
    font-family: var(--font-family-sans);
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-3);
}

.info-grid label {
    display: block;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.info-grid p {
    margin-bottom: 0;
    color: var(--color-heading);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--spacing-3);
}

.kpi-item {
    padding: var(--spacing-3);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    transition: all var(--transition-base);
}

.kpi-item:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

.kpi-label {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-1);
    display: block;
    font-family: var(--font-family-sans);
}

.kpi-value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.avatar-wrapper {
    width: 64px;
    height: 64px;
    position: relative;
}

.avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--color-border);
}

.avatar.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-muted);
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    border-radius: 50%;
}

.badge.bg-soft {
    background: var(--color-card-muted);
    color: var(--color-heading);
    border-radius: var(--radius-sm);
    padding: var(--spacing-1) var(--spacing-2);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    border: 1px solid var(--color-border);
    font-family: var(--font-family-sans);
}

.staff-detail-modal-header-meta .status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    min-width: 120px;
    text-align: center;
}

.staff-detail-modal-header-meta .status-badge--active {
    background: var(--color-soft-emerald);
    color: var(--color-success);
    border: 2px solid var(--color-success);
}

.staff-detail-modal-header-meta .status-badge--inactive {
    background: var(--color-soft-rose);
    color: var(--color-danger);
    border: 2px solid var(--color-danger);
}

.staff-detail-modal-header-meta .status-badge--neutral {
    background: var(--color-card-muted);
    color: var(--color-heading);
    border: 2px solid var(--color-border);
}

.staff-detail-upcoming-list :global(.list-group-item) {
    padding: var(--spacing-3) var(--spacing-2);
    border-color: var(--color-border);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

@media (max-width: 768px) {
    .staff-detail-modal-overlay {
        padding: var(--spacing-3);
    }

    .staff-detail-modal-content {
        max-height: calc(100vh - 40px);
    }

    .staff-detail-modal-header {
        flex-direction: column;
        gap: var(--spacing-3);
    }

    .staff-detail-modal-header-meta {
        align-items: flex-start;
    }
}
</style>
