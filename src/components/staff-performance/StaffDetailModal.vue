<template>
    <Teleport to="body">
        <div
            class="staff-detail-modal modal fade show"
            tabindex="-1"
            @click.self="handleClose"
            style="display: block; z-index: 1055;"
        >
            <div class="modal-backdrop fade show" @click="handleClose" style="z-index: 1050;"></div>
            <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" style="z-index: 1056;">
                <div class="modal-content" @click.stop>
                    <div class="modal-header">
                        <div class="modal-header__content">
                            <h5 class="modal-title">Chi tiết nhân viên: <strong>{{ staff.fullName }}</strong></h5>
                            <p class="modal-subtitle mb-0">Xem thông tin chi tiết và phân tích hiệu suất</p>
                        </div>
                        <button
                            type="button"
                            class="btn-close"
                            @click="handleClose"
                            aria-label="Đóng"
                        ></button>
                    </div>
                    <div class="modal-body">
                        <div class="row g-4">
                            <div class="col-md-6">
                                <div class="info-section">
                                    <h6 class="section-title mb-3">
                                        <i class="bi bi-person me-2"></i>
                                        Thông tin cá nhân
                                    </h6>
                                    <div class="info-grid">
                                        <div class="info-item">
                                            <span class="info-label">Họ tên:</span>
                                            <span class="info-value fw-semibold">{{ staff.fullName }}</span>
                                        </div>
                                        <div class="info-item">
                                            <span class="info-label">Username:</span>
                                            <span class="info-value">{{ staff.username }}</span>
                                        </div>
                                        <div class="info-item">
                                            <span class="info-label">Email:</span>
                                            <span class="info-value">{{ staff.email || 'N/A' }}</span>
                                        </div>
                                        <div class="info-item">
                                            <span class="info-label">Số điện thoại:</span>
                                            <span class="info-value">{{ staff.phone || 'N/A' }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="info-section">
                                    <h6 class="section-title mb-3">
                                        <i class="bi bi-graph-up me-2"></i>
                                        Chỉ số hiệu suất
                                    </h6>
                                    <div class="row g-3">
                                        <div class="col-6">
                                            <div class="stat-box">
                                                <div class="stat-icon stat-icon--primary">
                                                    <i class="bi bi-star"></i>
                                                </div>
                                                <div class="stat-content">
                                                    <div class="stat-label">Điểm hiệu suất</div>
                                                    <div class="stat-value">{{ staff.metrics.performanceScore.toFixed(1) }}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <div class="stat-box">
                                                <div class="stat-icon stat-icon--success">
                                                    <i class="bi bi-cash-stack"></i>
                                                </div>
                                                <div class="stat-content">
                                                    <div class="stat-label">Doanh thu</div>
                                                    <div class="stat-value">{{ formatCurrency(staff.metrics.revenue) }}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <div class="stat-box">
                                                <div class="stat-icon stat-icon--info">
                                                    <i class="bi bi-cart"></i>
                                                </div>
                                                <div class="stat-content">
                                                    <div class="stat-label">Số đơn</div>
                                                    <div class="stat-value">{{ formatNumber(staff.metrics.ordersCount) }}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <div class="stat-box">
                                                <div class="stat-icon stat-icon--warning">
                                                    <i class="bi bi-clock-history"></i>
                                                </div>
                                                <div class="stat-content">
                                                    <div class="stat-label">Chuyên cần</div>
                                                    <div class="stat-value">{{ (staff.metrics.attendanceRate * 100).toFixed(1) }}%</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row g-4 mt-2">
                            <div class="col-12">
                                <div class="info-section">
                                    <h6 class="section-title mb-3">
                                        <i class="bi bi-list-check me-2"></i>
                                        Chi tiết metrics
                                    </h6>
                                    <div class="table-responsive">
                                        <table class="table table-minimal">
                                            <thead>
                                                <tr>
                                                    <th>Chỉ số</th>
                                                    <th>Giá trị</th>
                                                    <th>So với TB</th>
                                                    <th>Đánh giá</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>Doanh thu</td>
                                                    <td class="revenue-cell">{{ formatCurrency(staff.metrics.revenue) }}</td>
                                                    <td>
                                                        <span :class="getComparisonClass(staff.metrics.revenue, staff.metrics.teamAvgRevenue)">
                                                            {{ getComparisonText(staff.metrics.revenue, staff.metrics.teamAvgRevenue) }}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span class="badge badge-soft" :class="getScoreBadgeClass(staff.metrics.revenue, staff.metrics.teamAvgRevenue)">
                                                            {{ getScoreLabel(staff.metrics.revenue, staff.metrics.teamAvgRevenue) }}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>Số đơn hàng</td>
                                                    <td>{{ formatNumber(staff.metrics.ordersCount) }}</td>
                                                    <td>
                                                        <span :class="getComparisonClass(staff.metrics.ordersCount, staff.metrics.teamAvgOrders)">
                                                            {{ getComparisonText(staff.metrics.ordersCount, staff.metrics.teamAvgOrders) }}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span class="badge badge-soft" :class="getScoreBadgeClass(staff.metrics.ordersCount, staff.metrics.teamAvgOrders)">
                                                            {{ getScoreLabel(staff.metrics.ordersCount, staff.metrics.teamAvgOrders) }}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>Đơn hàng trung bình</td>
                                                    <td>{{ formatCurrency(staff.metrics.avgOrderValue) }}</td>
                                                    <td>-</td>
                                                    <td>-</td>
                                                </tr>
                                                <tr>
                                                    <td>Tỷ lệ chuyên cần</td>
                                                    <td>{{ (staff.metrics.attendanceRate * 100).toFixed(1) }}%</td>
                                                    <td>-</td>
                                                    <td>
                                                        <span class="badge badge-soft" :class="getAttendanceBadgeClass(staff.metrics.attendanceRate)">
                                                            {{ getAttendanceLabel(staff.metrics.attendanceRate) }}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>Tỷ lệ đúng giờ</td>
                                                    <td>{{ (staff.metrics.onTimeRate * 100).toFixed(1) }}%</td>
                                                    <td>-</td>
                                                    <td>
                                                        <span class="badge badge-soft" :class="getOnTimeBadgeClass(staff.metrics.onTimeRate)">
                                                            {{ getOnTimeLabel(staff.metrics.onTimeRate) }}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>Tips</td>
                                                    <td class="tips-cell">{{ formatCurrency(staff.metrics.tipsEarned) }}</td>
                                                    <td>
                                                        <span :class="getComparisonClass(staff.metrics.tipsEarned, staff.metrics.teamAvgTips)">
                                                            {{ getComparisonText(staff.metrics.tipsEarned, staff.metrics.teamAvgTips) }}
                                                        </span>
                                                    </td>
                                                    <td>-</td>
                                                </tr>
                                                <tr>
                                                    <td>Thưởng</td>
                                                    <td class="bonus-cell">{{ formatCurrency(staff.metrics.bonuses) }}</td>
                                                    <td>-</td>
                                                    <td>-</td>
                                                </tr>
                                                <tr>
                                                    <td>Phạt</td>
                                                    <td class="penalty-cell">{{ formatCurrency(staff.metrics.penalties) }}</td>
                                                    <td>-</td>
                                                    <td>-</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-flat btn-flat--outline" @click="handleClose">
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { formatCurrency, formatNumber } from '@/utils/formatters'

const props = defineProps({
    staff: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['close'])

const handleClose = () => {
    emit('close')
}

const getComparisonClass = (value, avg) => {
    if (!avg || avg === 0) return 'text-muted'
    const ratio = value / avg
    if (ratio >= 1.2) return 'text-success fw-semibold'
    if (ratio >= 1.0) return 'text-info'
    if (ratio >= 0.8) return 'text-warning'
    return 'text-danger'
}

const getComparisonText = (value, avg) => {
    if (!avg || avg === 0) return 'N/A'
    const ratio = value / avg
    const percent = ((ratio - 1) * 100).toFixed(1)
    if (percent > 0) return `+${percent}%`
    return `${percent}%`
}

const getScoreBadgeClass = (value, avg) => {
    if (!avg || avg === 0) return 'badge-neutral'
    const ratio = value / avg
    if (ratio >= 1.2) return 'badge-success'
    if (ratio >= 1.0) return 'badge-info'
    if (ratio >= 0.8) return 'badge-warning'
    return 'badge-danger'
}

const getScoreLabel = (value, avg) => {
    if (!avg || avg === 0) return 'N/A'
    const ratio = value / avg
    if (ratio >= 1.2) return 'Xuất sắc'
    if (ratio >= 1.0) return 'Tốt'
    if (ratio >= 0.8) return 'Trung bình'
    return 'Cần cải thiện'
}

const getAttendanceBadgeClass = (rate) => {
    if (rate >= 0.95) return 'badge-success'
    if (rate >= 0.8) return 'badge-info'
    if (rate >= 0.6) return 'badge-warning'
    return 'badge-danger'
}

const getAttendanceLabel = (rate) => {
    if (rate >= 0.95) return 'Xuất sắc'
    if (rate >= 0.8) return 'Tốt'
    if (rate >= 0.6) return 'Trung bình'
    return 'Cần cải thiện'
}

const getOnTimeBadgeClass = (rate) => {
    if (rate >= 0.9) return 'badge-success'
    if (rate >= 0.7) return 'badge-info'
    if (rate >= 0.5) return 'badge-warning'
    return 'badge-danger'
}

const getOnTimeLabel = (rate) => {
    if (rate >= 0.9) return 'Xuất sắc'
    if (rate >= 0.7) return 'Tốt'
    if (rate >= 0.5) return 'Trung bình'
    return 'Cần cải thiện'
}
</script>

<style scoped>
.staff-detail-modal {
    font-family: var(--font-family-sans);
}

.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    pointer-events: auto;
}

:global(.modal-content) {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-card);
    box-shadow: var(--shadow-lg);
}

:global(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4) var(--spacing-5);
    background: var(--color-card);
}

.modal-header__content {
    flex: 1;
}

:global(.modal-title) {
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    margin: 0;
}

.modal-subtitle {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
}

:global(.modal-body) {
    padding: var(--spacing-5);
    font-family: var(--font-family-sans);
}

:global(.modal-footer) {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-4) var(--spacing-5);
    background: var(--color-card);
}

.info-section {
    padding: var(--spacing-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
}

.section-title {
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-base);
}

.info-grid {
    display: grid;
    gap: var(--spacing-3);
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-2) 0;
    border-bottom: 1px solid var(--color-border);
}

.info-item:last-child {
    border-bottom: none;
}

.info-label {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
}

.info-value {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    color: var(--color-text);
    text-align: right;
}

.stat-box {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    padding: var(--spacing-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
}

.stat-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125rem;
    flex-shrink: 0;
}

.stat-icon--primary {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.stat-icon--success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.stat-icon--info {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.stat-icon--warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.stat-content {
    flex: 1;
    min-width: 0;
}

.stat-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.stat-value {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.revenue-cell {
    color: var(--color-success);
    font-weight: var(--font-weight-semibold);
}

.tips-cell {
    color: var(--color-warning);
}

.bonus-cell {
    color: var(--color-success);
}

.penalty-cell {
    color: var(--color-danger);
}

.badge-soft {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    border: 1px solid transparent;
    display: inline-block;
}

.badge-success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.badge-info {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.badge-warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.badge-danger {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.badge-neutral {
    background: var(--color-card-muted);
    color: var(--color-text-muted);
}
</style>

