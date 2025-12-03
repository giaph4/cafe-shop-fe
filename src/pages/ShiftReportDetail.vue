<template>
    <div class="shift-report-detail-page container-fluid">
        <div class="shift-report-detail-header">
            <div class="shift-report-detail-header__content">
                <div class="shift-report-detail-header__title-section">
                    <h2 class="shift-report-detail-header__title">Chi tiết Báo cáo Ca làm</h2>
                    <p class="shift-report-detail-header__subtitle">Xem chi tiết báo cáo ca làm #{{ reportId }}</p>
                </div>
                <div class="shift-report-detail-header__actions">
                    <router-link to="/shift-report" class="action-button action-button--secondary">
                        <i class="bi bi-arrow-left"></i>
                        Quay lại
                    </router-link>
                </div>
            </div>
        </div>

        <div v-if="loading" class="card loading-card">
            <div class="card-body">
                <div class="loading-state">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="loading-state__text">Đang tải dữ liệu...</p>
                </div>
            </div>
        </div>

        <div v-else-if="error" class="card error-card">
            <div class="card-body">
                <div class="error-banner">
                    <span class="error-banner__icon">
                        <i class="bi bi-exclamation-triangle-fill"></i>
                    </span>
                    <div class="error-banner__content">
                        <p class="error-banner__title">Không thể tải dữ liệu</p>
                        <p class="error-banner__message mb-0">{{ error }}</p>
                    </div>
                </div>
            </div>
        </div>

        <div v-else-if="report" class="card detail-card">
            <div class="card-body">
                <div class="row g-4">
                    <div class="col-md-6">
                        <h5 class="info-section__title">Thông tin cơ bản</h5>
                        <table class="table info-table">
                            <tr>
                                <th width="40%">ID Báo cáo:</th>
                                <td>#{{ report.id }}</td>
                            </tr>
                            <tr>
                                <th>Ca làm việc:</th>
                                <td>{{ report.workShiftName || 'N/A' }}</td>
                            </tr>
                            <tr>
                                <th>Nhân viên:</th>
                                <td>{{ report.staffName || 'N/A' }}</td>
                            </tr>
                            <tr>
                                <th>Ngày bắt đầu:</th>
                                <td>{{ formatDateTime(report.startTime) || 'N/A' }}</td>
                            </tr>
                            <tr>
                                <th>Ngày kết thúc:</th>
                                <td>{{ formatDateTime(report.endTime) || 'N/A' }}</td>
                            </tr>
                            <tr>
                                <th>Trạng thái:</th>
                                <td>
                                    <span :class="['badge', getStatusClass(report.status)]">
                                        {{ getStatusLabel(report.status) }}
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h5 class="info-section__title">Thống kê</h5>
                        <table class="table info-table">
                            <tr>
                                <th width="40%">Tổng đơn hàng:</th>
                                <td class="fw-semibold">{{ report.totalOrders || 0 }}</td>
                            </tr>
                            <tr>
                                <th>Tổng doanh thu:</th>
                                <td class="fw-semibold text-success">{{ formatCurrency(report.totalRevenue || 0) }}</td>
                            </tr>
                            <tr>
                                <th>Tổng chi phí:</th>
                                <td class="fw-semibold text-danger">{{ formatCurrency(report.totalCost || 0) }}</td>
                            </tr>
                            <tr>
                                <th>Lợi nhuận:</th>
                                <td class="fw-semibold text-primary">{{ formatCurrency(report.totalProfit || 0) }}</td>
                            </tr>
                            <tr>
                                <th>Thời gian làm việc:</th>
                                <td>{{ formatDuration(report.duration) || 'N/A' }}</td>
                            </tr>
                        </table>
                    </div>
                </div>

                <div v-if="report.notes" class="notes-section">
                    <h5 class="info-section__title">Ghi chú</h5>
                    <div class="notes-content">
                        {{ report.notes }}
                    </div>
                </div>
            </div>
        </div>

        <div v-else class="card empty-card">
            <div class="card-body">
                <div class="empty-state">
                    <i class="bi bi-inbox empty-state__icon"></i>
                    <p class="empty-state__text">Không tìm thấy báo cáo với ID này.</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import logger from '@/utils/logger'

const route = useRoute()
const reportId = route.params.id

const report = ref(null)
const loading = ref(true)
const error = ref(null)

const getStatusClass = (status) => {
    if (status === 'COMPLETED') return 'bg-success'
    if (status === 'CANCELLED') return 'bg-danger'
    return 'bg-warning'
}

const getStatusLabel = (status) => {
    if (status === 'COMPLETED') return 'Hoàn thành'
    if (status === 'CANCELLED') return 'Đã hủy'
    return 'Đang xử lý'
}

const formatDuration = (seconds) => {
    if (!seconds || typeof seconds !== 'number') return null
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
}

onMounted(async () => {
    loading.value = true
    error.value = null

    try {
        // Backend endpoint chưa có sẵn, hiển thị thông báo
        error.value = 'Chức năng này cần hỗ trợ từ backend. Vui lòng liên hệ quản trị viên.'
    } catch (err) {
        error.value = err.response?.data?.message || err.message || 'Không thể tải chi tiết báo cáo.'
        logger.error('Failed to load shift report detail:', err)
    } finally {
        loading.value = false
    }
})
</script>

<style scoped>
.shift-report-detail-page {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    padding-bottom: var(--spacing-10);
}

/* Header */
.shift-report-detail-header {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    box-shadow: var(--shadow-base);
    margin-bottom: var(--spacing-4);
    padding: var(--spacing-4);
}

.shift-report-detail-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    flex-wrap: wrap;
}

.shift-report-detail-header__title-section {
    flex: 1;
    min-width: 0;
}

.shift-report-detail-header__title {
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    margin-bottom: var(--spacing-1);
}

.shift-report-detail-header__subtitle {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-relaxed);
}

.shift-report-detail-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    align-items: center;
    justify-content: flex-end;
}

/* Action Button */
.action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
    white-space: nowrap;
    text-decoration: none;
    color: var(--color-text);
}

.action-button i {
    font-size: 18px;
    line-height: 1;
}

.action-button--secondary {
    border-color: var(--color-secondary);
    color: var(--color-secondary);
    background: var(--color-bg);
}

.action-button--secondary:hover {
    background: var(--color-secondary-soft);
    border-color: var(--color-secondary);
    color: var(--color-secondary);
}

/* Cards */
.card {
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-base);
    background: var(--color-bg);
}

.card :global(.card-body) {
    padding: var(--spacing-4);
}

/* Loading State */
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-8) var(--spacing-4);
}

.loading-state__text {
    margin-top: var(--spacing-3);
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
}

/* Error Banner */
.error-banner {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-3);
    padding: var(--spacing-3) var(--spacing-4);
    border-radius: var(--radius-base);
    border: 1px solid rgba(239, 68, 68, 0.25);
    background: rgba(239, 68, 68, 0.04);
    color: var(--color-text);
}

.error-banner__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: var(--color-danger);
    margin-top: 2px;
    flex-shrink: 0;
}

.error-banner__content {
    flex: 1;
    min-width: 0;
}

.error-banner__title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--spacing-1);
    color: var(--color-text);
}

.error-banner__message {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
}

/* Detail Card */
.detail-card {
    margin-bottom: var(--spacing-4);
}

/* Info Section */
.info-section__title {
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-3);
}

.info-table {
    margin-bottom: 0;
}

.info-table th {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    padding: var(--spacing-2) var(--spacing-3);
    border-bottom: 1px solid var(--color-border);
}

.info-table td {
    color: var(--color-text);
    font-size: var(--font-size-base);
    padding: var(--spacing-2) var(--spacing-3);
    border-bottom: 1px solid var(--color-border);
}

.info-table tr:last-child th,
.info-table tr:last-child td {
    border-bottom: none;
}

/* Notes Section */
.notes-section {
    margin-top: var(--spacing-4);
    padding-top: var(--spacing-4);
    border-top: 1px solid var(--color-border);
}

.notes-content {
    padding: var(--spacing-3) var(--spacing-4);
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    background: var(--color-bg-muted);
    color: var(--color-text);
    font-size: var(--font-size-base);
    line-height: var(--line-height-relaxed);
}

/* Empty State */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-8) var(--spacing-4);
    text-align: center;
}

.empty-state__icon {
    font-size: 48px;
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-3);
}

.empty-state__text {
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    margin: 0;
}

/* Responsive */
@media (max-width: 992px) {
    .shift-report-detail-header {
        padding: var(--spacing-3);
    }

    .shift-report-detail-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .shift-report-detail-header__actions {
        width: 100%;
        justify-content: flex-start;
    }

    .action-button {
        width: 100%;
        justify-content: center;
    }

    .card :global(.card-body) {
        padding: var(--spacing-3);
    }
}

@media (max-width: 768px) {
    .info-table th,
    .info-table td {
        padding: var(--spacing-2);
        font-size: var(--font-size-sm);
    }

    .info-section__title {
        font-size: var(--font-size-base);
    }
}
</style>

