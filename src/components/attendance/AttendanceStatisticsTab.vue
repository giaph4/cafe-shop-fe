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
    gap: 1rem;
    background: linear-gradient(160deg, rgba(244, 246, 255, 0.94), rgba(233, 240, 255, 0.9));
    border-radius: var(--radius-md);
    border: 1px solid rgba(148, 163, 184, 0.18);
    padding: 1rem 1.2rem;
    box-shadow: 0 16px 30px rgba(99, 102, 241, 0.12);
    color: var(--color-text);
    height: 100%;
    min-height: 140px;
    transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.stat-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
}

.stat-card__icon {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    font-size: 1.6rem;
    color: var(--color-primary);
    background: rgba(99, 102, 241, 0.12);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 10px 18px rgba(99, 102, 241, 0.18);
}

.stat-card__meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
}

.stat-card__label {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.stat-card__value {
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--color-heading);
}

.stat-card__subtitle {
    font-size: 0.8rem;
    color: var(--color-text-muted);
}

.analytics-card,
.summary-card {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);
    background: var(--color-card);
}

.analytics-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    border-bottom: 1px solid rgba(148, 163, 184, 0.15);
}

.analytics-item:last-child {
    border-bottom: none;
}

.analytics-item__label {
    font-weight: 600;
    color: var(--color-heading);
    display: flex;
    align-items: center;
}

.analytics-item__value {
    font-size: 1.25rem;
    color: var(--color-heading);
}

.progress {
    height: 8px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.2);
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    border-radius: 999px;
    transition: width 0.3s ease;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
}

.summary-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    background: #f8fafc;
    border-radius: 18px;
    border: 1px solid rgba(226, 232, 240, 0.7);
}

.summary-item__icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    color: #fff;
    flex-shrink: 0;
}

.summary-item__content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
}

.summary-item__label {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    font-weight: 600;
}

.summary-item__value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-heading);
    line-height: 1;
}

.bg-primary-light {
    background: var(--color-soft-primary);
}

.bg-amber-light {
    background: var(--color-soft-amber);
}

.bg-sky-light {
    background: var(--color-soft-sky);
}

.bg-emerald-light {
    background: var(--color-soft-emerald);
}
</style>

