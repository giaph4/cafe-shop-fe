<template>
    <div class="attendance-statistics">
        <LoadingState v-if="loading" />
        <EmptyState
            v-else-if="!statistics"
            title="Chưa có dữ liệu"
            message="Chưa có dữ liệu thống kê trong khoảng thời gian đã chọn."
        />
        <div v-else>
            <div class="stats-cards mb-4">
                <div class="row g-3">
                    <div class="col-lg-3 col-md-6 d-flex">
                        <div class="stat-card w-100">
                            <div class="stat-card__icon bg-primary-light">
                                <i class="bi bi-calendar-check"></i>
                            </div>
                            <div class="stat-card__meta">
                                <span class="stat-card__label">Tổng số lần</span>
                                <strong class="stat-card__value">{{ statistics.totalRecords }}</strong>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 d-flex">
                        <div class="stat-card w-100">
                            <div class="stat-card__icon bg-emerald-light">
                                <i class="bi bi-box-arrow-in-right"></i>
                            </div>
                            <div class="stat-card__meta">
                                <span class="stat-card__label">Đã check-in</span>
                                <strong class="stat-card__value">{{ statistics.checkedIn }}</strong>
                                <small class="stat-card__subtitle">
                                    {{ statistics.totalRecords > 0 ? ((statistics.checkedIn / statistics.totalRecords) * 100).toFixed(1) : 0 }}%
                                </small>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 d-flex">
                        <div class="stat-card w-100">
                            <div class="stat-card__icon bg-sky-light">
                                <i class="bi bi-box-arrow-right"></i>
                            </div>
                            <div class="stat-card__meta">
                                <span class="stat-card__label">Đã check-out</span>
                                <strong class="stat-card__value">{{ statistics.checkedOut }}</strong>
                                <small class="stat-card__subtitle">
                                    {{ statistics.checkedIn > 0 ? ((statistics.checkedOut / statistics.checkedIn) * 100).toFixed(1) : 0 }}%
                                </small>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 d-flex">
                        <div class="stat-card w-100">
                            <div class="stat-card__icon bg-amber-light">
                                <i class="bi bi-graph-up-arrow"></i>
                            </div>
                            <div class="stat-card__meta">
                                <span class="stat-card__label">Tỷ lệ đúng giờ</span>
                                <strong class="stat-card__value">{{ statistics.onTimeRate }}%</strong>
                                <small class="stat-card__subtitle">Tổng số lần</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-4">
                <div class="col-lg-6">
                    <div class="card analytics-card">
                        <div class="card-header border-0">
                            <h5 class="mb-1">Thống kê đi muộn</h5>
                            <p class="text-muted mb-0">Phân tích tình trạng đi muộn</p>
                        </div>
                        <div class="card-body">
                            <div class="analytics-item">
                                <div class="analytics-item__label">
                                    <i class="bi bi-exclamation-triangle text-warning me-2"></i>
                                    Số lần đi muộn
                                </div>
                                <div class="analytics-item__value">
                                    <strong>{{ statistics.lateCount }}</strong>
                                    <small class="text-muted ms-2">
                                        / {{ statistics.totalRecords }} lần
                                    </small>
                                </div>
                            </div>
                            <div class="analytics-item">
                                <div class="analytics-item__label">
                                    <i class="bi bi-clock-history text-warning me-2"></i>
                                    Tổng số phút muộn
                                </div>
                                <div class="analytics-item__value">
                                    <strong>{{ statistics.totalLateMinutes }}</strong>
                                    <small class="text-muted ms-2">phút</small>
                                </div>
                            </div>
                            <div class="analytics-item">
                                <div class="analytics-item__label">
                                    <i class="bi bi-calculator text-warning me-2"></i>
                                    Trung bình muộn
                                </div>
                                <div class="analytics-item__value">
                                    <strong>{{ statistics.avgLateMinutes }}</strong>
                                    <small class="text-muted ms-2">phút/lần</small>
                                </div>
                            </div>
                            <div class="progress mt-3" v-if="statistics.totalRecords > 0">
                                <div 
                                    class="progress-bar bg-warning" 
                                    role="progressbar" 
                                    :style="{ width: `${(statistics.lateCount / statistics.totalRecords) * 100}%` }"
                                >
                                    {{ ((statistics.lateCount / statistics.totalRecords) * 100).toFixed(1) }}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-6">
                    <div class="card analytics-card">
                        <div class="card-header border-0">
                            <h5 class="mb-1">Thống kê về sớm</h5>
                            <p class="text-muted mb-0">Phân tích tình trạng về sớm</p>
                        </div>
                        <div class="card-body">
                            <div class="analytics-item">
                                <div class="analytics-item__label">
                                    <i class="bi bi-exclamation-triangle text-info me-2"></i>
                                    Số lần về sớm
                                </div>
                                <div class="analytics-item__value">
                                    <strong>{{ statistics.earlyLeaveCount }}</strong>
                                    <small class="text-muted ms-2">
                                        / {{ statistics.checkedOut }} lần check-out
                                    </small>
                                </div>
                            </div>
                            <div class="analytics-item">
                                <div class="analytics-item__label">
                                    <i class="bi bi-clock-history text-info me-2"></i>
                                    Tổng số phút về sớm
                                </div>
                                <div class="analytics-item__value">
                                    <strong>{{ statistics.totalEarlyLeaveMinutes }}</strong>
                                    <small class="text-muted ms-2">phút</small>
                                </div>
                            </div>
                            <div class="analytics-item">
                                <div class="analytics-item__label">
                                    <i class="bi bi-calculator text-info me-2"></i>
                                    Trung bình về sớm
                                </div>
                                <div class="analytics-item__value">
                                    <strong>{{ statistics.avgEarlyLeaveMinutes }}</strong>
                                    <small class="text-muted ms-2">phút/lần</small>
                                </div>
                            </div>
                            <div class="progress mt-3" v-if="statistics.checkedOut > 0">
                                <div 
                                    class="progress-bar bg-info" 
                                    role="progressbar" 
                                    :style="{ width: `${(statistics.earlyLeaveCount / statistics.checkedOut) * 100}%` }"
                                >
                                    {{ ((statistics.earlyLeaveCount / statistics.checkedOut) * 100).toFixed(1) }}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card summary-card mt-4">
                <div class="card-header border-0">
                    <h5 class="mb-1">Tóm tắt</h5>
                    <p class="text-muted mb-0">Tổng hợp các chỉ số chấm công</p>
                </div>
                <div class="card-body">
                    <div class="summary-grid">
                        <div class="summary-item">
                            <div class="summary-item__icon bg-success">
                                <i class="bi bi-check-circle"></i>
                            </div>
                            <div class="summary-item__content">
                                <span class="summary-item__label">Tỷ lệ đúng giờ</span>
                                <strong class="summary-item__value">{{ statistics.onTimeRate }}%</strong>
                            </div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-item__icon bg-warning">
                                <i class="bi bi-clock"></i>
                            </div>
                            <div class="summary-item__content">
                                <span class="summary-item__label">Tỷ lệ đi muộn</span>
                                <strong class="summary-item__value">
                                    {{ statistics.totalRecords > 0 ? ((statistics.lateCount / statistics.totalRecords) * 100).toFixed(1) : 0 }}%
                                </strong>
                            </div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-item__icon bg-info">
                                <i class="bi bi-clock-history"></i>
                            </div>
                            <div class="summary-item__content">
                                <span class="summary-item__label">Tỷ lệ về sớm</span>
                                <strong class="summary-item__value">
                                    {{ statistics.checkedOut > 0 ? ((statistics.earlyLeaveCount / statistics.checkedOut) * 100).toFixed(1) : 0 }}%
                                </strong>
                            </div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-item__icon bg-primary">
                                <i class="bi bi-graph-up"></i>
                            </div>
                            <div class="summary-item__content">
                                <span class="summary-item__label">Tỷ lệ hoàn thành</span>
                                <strong class="summary-item__value">
                                    {{ statistics.checkedIn > 0 ? ((statistics.checkedOut / statistics.checkedIn) * 100).toFixed(1) : 0 }}%
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'

defineProps({
    statistics: Object,
    loading: Boolean,
    filters: Object
})
</script>

<style scoped lang="scss">
.attendance-statistics {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
}

.stats-cards {
    margin-bottom: var(--spacing-6);
}

.stat-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    padding: var(--spacing-4);
    height: 100%;
    min-height: 140px;
    transition: all var(--transition-base);
}

.stat-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

.stat-card__icon {
    width: 52px;
    height: 52px;
    border-radius: var(--radius-sm);
    display: grid;
    place-items: center;
    font-size: 1.6rem;
    flex-shrink: 0;
}

.stat-card__icon.bg-primary-light {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.stat-card__icon.bg-emerald-light {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.stat-card__icon.bg-sky-light {
    background: var(--color-soft-indigo);
    color: var(--color-primary);
}

.stat-card__icon.bg-amber-light {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.stat-card__meta {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    flex: 1;
}

.stat-card__label {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.stat-card__value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.stat-card__subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.analytics-card,
.summary-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.analytics-card :global(.card-header),
.summary-card :global(.card-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
}

.analytics-card :global(.card-header h5),
.summary-card :global(.card-header h5) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.analytics-card :global(.card-header .text-muted),
.summary-card :global(.card-header .text-muted) {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.analytics-card :global(.card-body),
.summary-card :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.analytics-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-3) 0;
    border-bottom: 1px solid var(--color-border);
    font-family: var(--font-family-sans);
}

.analytics-item:last-child {
    border-bottom: none;
}

.analytics-item__label {
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    display: flex;
    align-items: center;
    font-family: var(--font-family-sans);
}

.analytics-item__value {
    font-size: var(--font-size-lg);
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
}

.analytics-item__value strong {
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
}

.analytics-item__value small {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.progress {
    height: 8px;
    border-radius: var(--radius-sm);
    background: var(--color-card-muted);
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    border-radius: var(--radius-sm);
    transition: width var(--transition-base);
}

.progress-bar.bg-warning {
    background: var(--color-warning);
}

.progress-bar.bg-info {
    background: var(--color-primary);
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: var(--spacing-4);
}

.summary-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    padding: var(--spacing-5);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    transition: all var(--transition-base);
    min-height: 120px;
}

.summary-item:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.summary-item__icon {
    width: 64px;
    height: 64px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    flex-shrink: 0;
    font-weight: var(--font-weight-semibold);
}

.summary-item__icon.bg-success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.summary-item__icon.bg-warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.summary-item__icon.bg-info {
    background: var(--color-soft-indigo);
    color: var(--color-primary);
}

.summary-item__icon.bg-primary {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.summary-item__content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    flex: 1;
    min-width: 0;
}

.summary-item__label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    line-height: var(--line-height-normal);
    letter-spacing: 0.01em;
}

.summary-item__value {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    line-height: 1.2;
    font-family: var(--font-family-sans);
    letter-spacing: -0.02em;
}
</style>

