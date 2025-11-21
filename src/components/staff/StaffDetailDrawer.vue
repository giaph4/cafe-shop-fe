<template>
    <Transition name="slide">
        <div v-if="visible" class="drawer-overlay" @click.self="$emit('close')">
            <aside class="drawer">
                <div class="drawer-header d-flex justify-content-between align-items-start gap-3">
                    <div class="d-flex align-items-center gap-3">
                        <div class="avatar-wrapper">
                            <img v-if="avatarUrl" :src="avatarUrl" class="avatar" :alt="staff.fullName || staff.username" />
                            <div v-else class="avatar placeholder">{{ initials }}</div>
                        </div>
                        <div>
                            <h4 class="mb-1">{{ staff.fullName || staff.username }}</h4>
                            <p class="text-muted mb-0">@{{ staff.username }}</p>
                            <div class="small text-muted">Tạo lúc {{ formatDateTime(staff.createdAt) }}</div>
                        </div>
                    </div>
                    <button type="button" class="btn btn-outline-secondary btn-sm" @click="$emit('close')">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>

                <div class="drawer-body">
                    <section class="info-card">
                        <div class="section-header">
                            <h6>Thông tin cá nhân</h6>
                            <span class="badge" :class="statusClass">{{ staff.status }}</span>
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
                                    <span v-for="role in staff.roles" :key="role.id" class="badge bg-soft me-1">{{ formatRole(role.name) }}</span>
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
                                <span class="kpi-value">{{ formatCurrency(dashboard.performance?.totalRevenue) }}</span>
                            </div>
                            <div class="kpi-item">
                                <span class="kpi-label">Giá trị trung bình</span>
                                <span class="kpi-value">{{ formatCurrency(dashboard.performance?.averageOrderValue) }}</span>
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
                                <strong>Check-in gần nhất:</strong> {{ formatDateTime(dashboard.attendance.lastCheckIn) }}
                            </li>
                            <li>
                                <strong>Check-out gần nhất:</strong> {{ formatDateTime(dashboard.attendance.lastCheckOut) }}
                            </li>
                            <li>
                                <strong>Số ngày đúng giờ liên tiếp:</strong> {{ dashboard.attendance.consecutiveOnTimeDays ?? 0 }}
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
                                <span class="kpi-value">{{ formatCurrency(dashboard.payroll.estimatedCurrentCycle) }}</span>
                            </div>
                            <div class="kpi-item">
                                <span class="kpi-label">Tổng thưởng</span>
                                <span class="kpi-value text-success">{{ formatCurrency(dashboard.payroll.bonusTotal) }}</span>
                            </div>
                            <div class="kpi-item">
                                <span class="kpi-label">Tổng phạt</span>
                                <span class="kpi-value text-danger">{{ formatCurrency(dashboard.payroll.penaltyTotal) }}</span>
                            </div>
                            <div class="kpi-item">
                                <span class="kpi-label">Điều chỉnh ròng</span>
                                <span class="kpi-value">{{ formatCurrency(dashboard.payroll.adjustmentNet) }}</span>
                            </div>
                        </div>
                    </section>

                    <section class="info-card" v-if="dashboard?.upcomingShifts?.length">
                        <div class="section-header">
                            <h6>Ca sắp tới</h6>
                        </div>
                        <ul class="list-group list-group-flush">
                            <li v-for="shift in dashboard.upcomingShifts" :key="shift.assignmentId" class="list-group-item">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <div class="fw-semibold">{{ formatDate(shift.shiftDate) }} • {{ shift.timeRange }}</div>
                                        <div class="text-muted small">Vai trò: {{ shift.role || '—' }}</div>
                                        <div class="text-muted small" v-if="shift.managerNote">Ghi chú: {{ shift.managerNote }}</div>
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
            </aside>
        </div>
    </Transition>
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
            return 'bg-success'
        case 'INACTIVE':
            return 'bg-danger'
        default:
            return 'bg-secondary'
    }
})

const formatRole = (roleName) => {
    if (!roleName) return '—'
    return roleName.replace('ROLE_', '').toLowerCase().replace(/(^|\s)\w/g, (s) => s.toUpperCase())
}
</script>

<style scoped>
.drawer-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.4);
    display: flex;
    justify-content: flex-end;
    z-index: 1050;
}

.drawer {
    width: min(520px, 100%);
    height: 100%;
    overflow-y: auto;
    padding: 1.75rem 1.5rem 2rem;
    background: var(--color-elevated);
    color: var(--color-text);
    box-shadow: -18px 0 38px rgba(15, 23, 42, 0.22);
    border-left: 1px solid var(--color-border);
    animation: slideIn 0.28s ease;
    backdrop-filter: blur(12px);
}

.drawer-header {
    margin-bottom: 1.5rem;
    border-bottom: 1px solid rgba(148, 163, 184, 0.18);
    padding-bottom: 1rem;
}

.drawer-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.info-card {
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 1.15rem 1.35rem;
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    box-shadow: 0 18px 34px rgba(15, 23, 42, 0.12);
    transition: background-color var(--transition-all), border-color var(--transition-all), box-shadow var(--transition-all);
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    gap: 0.75rem;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
}

.info-grid label {
    display: block;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-subtle);
    margin-bottom: 0.25rem;
}

.info-grid p {
    margin-bottom: 0;
    color: var(--color-text);
}

.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 0.75rem;
}

.kpi-item {
    padding: 0.85rem;
    border-radius: 12px;
    background: rgba(99, 102, 241, 0.08);
    border: 1px solid rgba(99, 102, 241, 0.16);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 12px 20px rgba(79, 70, 229, 0.12);
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.kpi-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    color: var(--color-text-subtle);
}

.kpi-value {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-heading);
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
    border: 2px solid rgba(148, 163, 184, 0.35);
}

.avatar.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(129, 140, 248, 0.12));
    color: var(--color-primary);
    font-weight: 700;
    font-size: 1.2rem;
    border-radius: 50%;
}

.badge.bg-soft {
    background: var(--color-badge-soft-bg);
    color: var(--color-badge-soft-text);
}

.status-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    font-size: 0.78rem;
    letter-spacing: 0.04em;
    font-weight: 600;
}

.info-card + .info-card {
    margin-top: 0.5rem;
}

.info-card .badge.bg-soft {
    border: 1px solid rgba(148, 163, 184, 0.28);
    box-shadow: inset 0 0.5px 1px rgba(255, 255, 255, 0.2);
}

.dark-theme .drawer {
    background: rgba(17, 24, 39, 0.94);
    border-left-color: rgba(129, 140, 248, 0.28);
    box-shadow: -20px 0 48px rgba(2, 6, 23, 0.65);
}

.dark-theme .info-card {
    border-color: rgba(129, 140, 248, 0.22);
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(17, 24, 39, 0.92));
    box-shadow: 0 20px 36px rgba(2, 6, 23, 0.55);
}

.dark-theme .kpi-item {
    background: rgba(79, 70, 229, 0.18);
    border-color: rgba(129, 140, 248, 0.32);
    color: #e0e7ff;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 16px 28px rgba(5, 10, 25, 0.55);
}

.dark-theme .kpi-value {
    color: #f8fafc;
}

.dark-theme .info-grid p,
.dark-theme .section-header h6 {
    color: #e2e8f0;
}

.comfort-theme .drawer {
    background: rgba(248, 245, 239, 0.96);
    border-left-color: rgba(95, 111, 148, 0.22);
}

.comfort-theme .info-card {
    border-color: rgba(95, 111, 148, 0.24);
    background: linear-gradient(170deg, rgba(245, 241, 235, 0.98), rgba(236, 232, 226, 0.92));
    box-shadow: 0 18px 30px rgba(95, 111, 148, 0.14);
}

.comfort-theme .kpi-item {
    background: rgba(95, 111, 148, 0.12);
    border-color: rgba(95, 111, 148, 0.28);
    color: #374151;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.24), 0 14px 22px rgba(95, 111, 148, 0.18);
}

.comfort-theme .kpi-value {
    color: #2f3540;
}

.kpi-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 26px rgba(79, 70, 229, 0.18);
    border-color: rgba(99, 102, 241, 0.3);
}

.dark-theme .kpi-item:hover {
    box-shadow: 0 22px 32px rgba(5, 10, 25, 0.6);
    border-color: rgba(129, 140, 248, 0.45);
}

.comfort-theme .kpi-item:hover {
    box-shadow: 0 20px 28px rgba(95, 111, 148, 0.24);
    border-color: rgba(95, 111, 148, 0.38);
}

.slide-enter-active,
.slide-leave-active {
    transition: opacity 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
}

@keyframes slideIn {
    from {
        transform: translateX(20px);
    }
    to {
        transform: translateX(0);
    }
}
</style>
