<template>
    <div class="attendance-history">
        <div class="history-stats mb-4">
            <div class="row g-3">
                <div class="col-md-3 col-sm-6">
                    <div class="stat-card">
                        <div class="stat-card__icon bg-primary">
                            <i class="bi bi-calendar-check"></i>
                        </div>
                        <div class="stat-card__meta">
                            <span class="stat-card__label">Tổng số lần</span>
                            <strong class="stat-card__value">{{ records.length }}</strong>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="stat-card">
                        <div class="stat-card__icon bg-success">
                            <i class="bi bi-box-arrow-in-right"></i>
                        </div>
                        <div class="stat-card__meta">
                            <span class="stat-card__label">Đã check-in</span>
                            <strong class="stat-card__value">{{ checkedInCount }}</strong>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="stat-card">
                        <div class="stat-card__icon bg-info">
                            <i class="bi bi-box-arrow-right"></i>
                        </div>
                        <div class="stat-card__meta">
                            <span class="stat-card__label">Đã check-out</span>
                            <strong class="stat-card__value">{{ checkedOutCount }}</strong>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="stat-card">
                        <div class="stat-card__icon bg-warning">
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
                <div v-if="loading" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                </div>
                <div v-else-if="!records || records.length === 0" class="text-center py-5">
                    <i class="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
                    <p class="text-muted mb-0">Chưa có lịch sử chấm công trong khoảng thời gian đã chọn.</p>
                </div>
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

<style scoped>
.attendance-history {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.history-stats {
    margin-bottom: 1.5rem;
}

.stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.8));
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.1);
}

.stat-card__icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: #fff;
    flex-shrink: 0;
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
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
}

.stat-card__value {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--color-heading);
    line-height: 1;
}

.history-table-card {
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.28);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
    background: linear-gradient(180deg, var(--color-card), var(--color-card-accent));
}

.table {
    margin-bottom: 0;
}

.table thead th {
    border-bottom: 2px solid rgba(148, 163, 184, 0.2);
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.85rem;
    letter-spacing: 0.05em;
    color: var(--color-heading);
    padding: 1rem;
}

.table tbody td {
    padding: 1rem;
    vertical-align: middle;
}

.table tbody tr:hover {
    background-color: rgba(99, 102, 241, 0.05);
}
</style>

