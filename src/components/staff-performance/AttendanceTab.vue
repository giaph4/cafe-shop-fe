<template>
    <div class="attendance-tab">
        <div class="row g-4 mb-4">
            <div class="col-lg-6">
                <div class="card standard-card">
                    <div class="card-header standard-card-header">
                        <h6 class="card-title mb-0">Tỷ lệ chuyên cần</h6>
                    </div>
                    <div class="card-body">
                        <AttendanceChart :staff-list="staffList" />
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="card standard-card">
                    <div class="card-header standard-card-header">
                        <h6 class="card-title mb-0">Tỷ lệ đúng giờ</h6>
                    </div>
                    <div class="card-body">
                        <OnTimeChart :staff-list="staffList" />
                    </div>
                </div>
            </div>
        </div>
        <div class="card standard-card">
            <div class="card-header standard-card-header">
                <h6 class="card-title mb-0">Chi tiết chuyên cần</h6>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-minimal">
                        <thead>
                            <tr>
                                <th>Nhân viên</th>
                                <th>Tổng ca</th>
                                <th>Đã tham gia</th>
                                <th>Đúng giờ</th>
                                <th>Tỷ lệ chuyên cần</th>
                                <th>Tỷ lệ đúng giờ</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="staff in staffList" :key="staff.userId">
                                <td>
                                    <div class="fw-semibold staff-name">{{ staff.fullName }}</div>
                                </td>
                                <td>{{ formatNumber(staff.metrics.totalShifts) }}</td>
                                <td>{{ formatNumber(staff.metrics.attendedShifts) }}</td>
                                <td>{{ formatNumber(staff.metrics.onTimeShifts) }}</td>
                                <td>
                                    <div class="progress-wrapper">
                                        <div class="progress" style="height: 8px;">
                                            <div
                                                class="progress-bar"
                                                :class="getAttendanceClass(staff.metrics.attendanceRate)"
                                                :style="{ width: `${staff.metrics.attendanceRate * 100}%` }"
                                            ></div>
                                        </div>
                                        <span class="progress-text">{{ (staff.metrics.attendanceRate * 100).toFixed(1) }}%</span>
                                    </div>
                                </td>
                                <td>
                                    <div class="progress-wrapper">
                                        <div class="progress" style="height: 8px;">
                                            <div
                                                class="progress-bar"
                                                :class="getOnTimeClass(staff.metrics.onTimeRate)"
                                                :style="{ width: `${staff.metrics.onTimeRate * 100}%` }"
                                            ></div>
                                        </div>
                                        <span class="progress-text">{{ (staff.metrics.onTimeRate * 100).toFixed(1) }}%</span>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge badge-soft" :class="getStatusClass(staff.metrics.attendanceRate)">
                                        {{ getStatusLabel(staff.metrics.attendanceRate) }}
                                    </span>
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
import { formatNumber } from '@/utils/formatters'
import AttendanceChart from './AttendanceChart.vue'
import OnTimeChart from './OnTimeChart.vue'

const props = defineProps({
    staffList: {
        type: Array,
        default: () => []
    }
})

const getAttendanceClass = (rate) => {
    if (rate >= 0.95) return 'bg-success'
    if (rate >= 0.8) return 'bg-info'
    if (rate >= 0.6) return 'bg-warning'
    return 'bg-danger'
}

const getOnTimeClass = (rate) => {
    if (rate >= 0.9) return 'bg-success'
    if (rate >= 0.7) return 'bg-info'
    if (rate >= 0.5) return 'bg-warning'
    return 'bg-danger'
}

const getStatusClass = (rate) => {
    if (rate >= 0.95) return 'badge-success'
    if (rate >= 0.8) return 'badge-info'
    if (rate >= 0.6) return 'badge-warning'
    return 'badge-danger'
}

const getStatusLabel = (rate) => {
    if (rate >= 0.95) return 'Xuất sắc'
    if (rate >= 0.8) return 'Tốt'
    if (rate >= 0.6) return 'Trung bình'
    return 'Cần cải thiện'
}
</script>

<style scoped>
.attendance-tab {
    font-family: var(--font-family-sans);
}

.staff-name {
    font-family: var(--font-family-sans);
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
}

.progress-wrapper {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
}

.progress {
    flex: 1;
    background: var(--color-card-muted);
    border-radius: var(--radius-sm);
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    transition: width var(--transition-base);
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

.progress-text {
    font-size: var(--font-size-xs);
    color: var(--color-text);
    font-family: var(--font-family-sans);
    min-width: 45px;
    text-align: right;
}
</style>

