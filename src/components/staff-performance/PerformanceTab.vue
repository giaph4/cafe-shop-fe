<template>
    <div class="performance-tab">
        <div class="row g-4 mb-4">
            <div class="col-lg-6">
                <div class="card standard-card">
                    <div class="card-header standard-card-header">
                        <h6 class="card-title mb-0">Phân bố điểm hiệu suất</h6>
                    </div>
                    <div class="card-body">
                        <PerformanceChart :staff-list="staffList" />
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="card standard-card">
                    <div class="card-header standard-card-header">
                        <h6 class="card-title mb-0">So sánh doanh thu</h6>
                    </div>
                    <div class="card-body">
                        <RevenueChart :staff-list="staffList" />
                    </div>
                </div>
            </div>
        </div>
        <div class="card standard-card">
            <div class="card-header standard-card-header">
                <h6 class="card-title mb-0">Chi tiết hiệu suất</h6>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-minimal">
                        <thead>
                            <tr>
                                <th>Nhân viên</th>
                                <th>Điểm hiệu suất</th>
                                <th>Doanh thu</th>
                                <th>Số đơn</th>
                                <th>Đơn TB</th>
                                <th>Chuyên cần</th>
                                <th>Đúng giờ</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="staff in staffList" :key="staff.userId">
                                <td>
                                    <div class="fw-semibold staff-name">{{ staff.fullName }}</div>
                                    <small class="text-muted">{{ staff.username }}</small>
                                </td>
                                <td>
                                    <span class="score-badge" :class="getScoreClass(staff.metrics.performanceScore)">
                                        {{ staff.metrics.performanceScore.toFixed(1) }}
                                    </span>
                                </td>
                                <td class="revenue-cell">{{ formatCurrency(staff.metrics.revenue) }}</td>
                                <td>{{ formatNumber(staff.metrics.ordersCount) }}</td>
                                <td>{{ formatCurrency(staff.metrics.avgOrderValue) }}</td>
                                <td>
                                    <span class="rate-badge">{{ (staff.metrics.attendanceRate * 100).toFixed(1) }}%</span>
                                </td>
                                <td>
                                    <span class="rate-badge">{{ (staff.metrics.onTimeRate * 100).toFixed(1) }}%</span>
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
import { formatCurrency, formatNumber } from '@/utils/formatters'
import PerformanceChart from './PerformanceChart.vue'
import RevenueChart from './RevenueChart.vue'

const props = defineProps({
    staffList: {
        type: Array,
        default: () => []
    }
})

const getScoreClass = (score) => {
    if (score >= 90) return 'score-excellent'
    if (score >= 75) return 'score-good'
    if (score >= 60) return 'score-average'
    return 'score-poor'
}
</script>

<style scoped>
.performance-tab {
    font-family: var(--font-family-sans);
}

.staff-name {
    font-family: var(--font-family-sans);
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
}

.score-badge {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
}

.score-excellent {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.score-good {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.score-average {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.score-poor {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.revenue-cell {
    font-family: var(--font-family-sans);
    color: var(--color-success);
    font-weight: var(--font-weight-semibold);
}

.rate-badge {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    color: var(--color-text);
}
</style>

