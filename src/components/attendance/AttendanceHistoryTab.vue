<template>
    <div class="attendance-history">
        <div class="history-stats mb-4">
            <div class="row g-3">
                <div class="col-md-3 col-sm-6 d-flex">
                    <div class="stat-card w-100">
                        <div class="stat-card__icon bg-primary-light">
                            <i class="bi bi-calendar-check"></i>
                        </div>
                        <div class="stat-card__meta">
                            <span class="stat-card__label">Tổng số lần</span>
                            <strong class="stat-card__value">{{ records.length }}</strong>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 d-flex">
                    <div class="stat-card w-100">
                        <div class="stat-card__icon bg-emerald-light">
                            <i class="bi bi-box-arrow-in-right"></i>
                        </div>
                        <div class="stat-card__meta">
                            <span class="stat-card__label">Đã check-in</span>
                            <strong class="stat-card__value">{{ checkedInCount }}</strong>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 d-flex">
                    <div class="stat-card w-100">
                        <div class="stat-card__icon bg-sky-light">
                            <i class="bi bi-box-arrow-right"></i>
                        </div>
                        <div class="stat-card__meta">
                            <span class="stat-card__label">Đã check-out</span>
                            <strong class="stat-card__value">{{ checkedOutCount }}</strong>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 d-flex">
                    <div class="stat-card w-100">
                        <div class="stat-card__icon bg-amber-light">
                            <i class="bi bi-clock-history"></i>
                        </div>
                        <div class="stat-card__meta">
                            <span class="stat-card__label">Đi muộn</span>
                            <strong class="stat-card__value">{{ lateCount }}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card history-table-card">
            <div class="card-header border-0 d-flex flex-wrap justify-content-between align-items-center">
                <div>
                    <h5 class="mb-1">Lịch sử chấm công</h5>
                    <p class="text-muted mb-0">Danh sách chi tiết các lần chấm công</p>
                </div>
            </div>
            <div class="card-body">
                <LoadingState v-if="loading" />
                <EmptyState
                    v-else-if="!records || records.length === 0"
                    title="Chưa có lịch sử"
                    message="Chưa có lịch sử chấm công trong khoảng thời gian đã chọn."
                />
                <div v-else class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Check-in</th>
                                <th>Check-out</th>
                                <th>Nguồn</th>
                                <th>Đi muộn</th>
                                <th>Về sớm</th>
                                <th>Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="record in records" :key="record.id">
                                <td>
                                    <div class="d-flex flex-column">
                                        <strong>{{ formatDateTime(record.checkInAt) }}</strong>
                                        <small class="text-muted" v-if="record.createdBy">Bởi: {{ record.createdBy }}</small>
                                    </div>
                                </td>
                                <td>
                                    <div class="d-flex flex-column" v-if="record.checkOutAt">
                                        <strong>{{ formatDateTime(record.checkOutAt) }}</strong>
                                        <small class="text-muted" v-if="record.updatedBy">Bởi: {{ record.updatedBy }}</small>
                                    </div>
                                    <span v-else class="text-muted">—</span>
                                </td>
                                <td>
                                    <span class="badge bg-secondary-subtle text-secondary-emphasis">
                                        {{ formatSource(record.source) }}
                                    </span>
                                </td>
                                <td>
                                    <span v-if="record.lateMinutes && record.lateMinutes > 0" class="text-warning">
                                        <i class="bi bi-clock me-1"></i>{{ record.lateMinutes }} phút
                                    </span>
                                    <span v-else class="text-success">
                                        <i class="bi bi-check-circle me-1"></i>Đúng giờ
                                    </span>
                                </td>
                                <td>
                                    <span v-if="record.earlyLeaveMinutes && record.earlyLeaveMinutes > 0" class="text-warning">
                                        <i class="bi bi-clock me-1"></i>{{ record.earlyLeaveMinutes }} phút
                                    </span>
                                    <span v-else-if="record.checkOutAt" class="text-success">
                                        <i class="bi bi-check-circle me-1"></i>Đúng giờ
                                    </span>
                                    <span v-else class="text-muted">—</span>
                                </td>
                                <td>
                                    <span v-if="record.note" class="text-muted small">{{ record.note }}</span>
                                    <span v-else class="text-muted">—</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatDateTime } from '@/utils/formatters'
import { ATTENDANCE_SOURCES } from '@/api/shiftService'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const props = defineProps({
    records: Array,
    loading: Boolean,
    filters: Object
})

const checkedInCount = computed(() => props.records?.filter(r => r.checkInAt).length || 0)
const checkedOutCount = computed(() => props.records?.filter(r => r.checkOutAt).length || 0)
const lateCount = computed(() => props.records?.filter(r => r.lateMinutes && r.lateMinutes > 0).length || 0)

const formatSource = (source) => {
    const found = ATTENDANCE_SOURCES.find(s => s.value === source)
    return found?.label || source
}
</script>

<style scoped lang="scss">
.attendance-history {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
}

.history-stats {
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

.history-table-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.history-table-card :global(.card-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
}

.history-table-card :global(.card-header h5) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.history-table-card :global(.card-header .text-muted) {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.history-table-card :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.table {
    margin-bottom: 0;
}

.table thead,
.table thead.table-light {
    background: var(--color-card-muted);
}

.table thead th {
    border-bottom: 1px solid var(--color-border);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    color: var(--color-heading);
    padding: var(--spacing-3);
    font-family: var(--font-family-sans);
}

.table tbody td {
    padding: var(--spacing-3);
    vertical-align: middle;
    border-bottom: 1px solid var(--color-border);
    font-family: var(--font-family-sans);
}

.table tbody tr:last-child td {
    border-bottom: none;
}

.table tbody tr:hover {
    background: var(--color-card-muted);
}

.table :global(.badge) {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.table :global(.badge.bg-secondary-subtle) {
    background: var(--color-card-muted);
    color: var(--color-heading);
    border: 1px solid var(--color-border);
}

.table :global(strong) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.table :global(.text-muted) {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.table :global(.text-warning) {
    color: var(--color-warning);
}

.table :global(.text-success) {
    color: var(--color-success);
}
</style>

