<template>
    <div class="summary-table card">
        <div class="card-body">
            <div class="d-flex flex-column flex-xl-row gap-3 align-items-xl-center justify-content-between mb-3">
                <div>
                    <h6 class="mb-1">Tổng hợp lương</h6>
                    <p class="text-muted mb-0">Thống kê payroll theo chu kỳ và nhân viên.</p>
                </div>
                <div class="d-flex flex-wrap gap-2">
                    <slot name="filters"></slot>
                </div>
            </div>

            <div v-if="loading" class="text-center py-4">
                <div class="spinner-border text-primary"></div>
            </div>

            <div v-else-if="error" class="alert alert-warning">
                {{ error }}
            </div>

            <EmptyState
                v-else-if="!summaries.length"
                title="Không có dữ liệu"
                message="Hãy chọn chu kỳ và nhấn đồng bộ để tạo dữ liệu."
            />

            <div v-else class="table-responsive">
                <table class="table align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Nhân viên</th>
                            <th class="text-center">Số ca</th>
                            <th class="text-center">Chấm công</th>
                            <th class="text-end">Giờ làm</th>
                            <th class="text-end">Đơn hàng</th>
                            <th class="text-end">Doanh thu</th>
                            <th class="text-end">Lương cơ bản</th>
                            <th class="text-end">Thưởng</th>
                            <th class="text-end">Phạt</th>
                            <th class="text-end">Điều chỉnh</th>
                            <th class="text-end">Thực lĩnh</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="summary in summaries" :key="`${summary.cycleId}-${summary.userId}`">
                            <td>
                                <div class="fw-semibold">{{ summary.fullName || summary.username }}</div>
                                <div class="text-muted small">{{ summary.username }}</div>
                            </td>
                            <td class="text-center">{{ summary.assignmentCount }}</td>
                            <td class="text-center">{{ summary.attendanceCount }}</td>
                            <td class="text-end">{{ formatMinutes(summary.totalActualMinutes) }}</td>
                            <td class="text-end">{{ formatNumber(summary.totalOrders) }}</td>
                            <td class="text-end">{{ formatCurrency(summary.totalRevenue) }}</td>
                            <td class="text-end">{{ formatCurrency(summary.totalBasePayroll) }}</td>
                            <td class="text-end text-success">{{ formatCurrency(summary.totalBonus) }}</td>
                            <td class="text-end text-danger">{{ formatCurrency(summary.totalPenalty) }}</td>
                            <td class="text-end">{{ formatCurrency(summary.totalAdjustment) }}</td>
                            <td class="text-end fw-semibold">{{ formatCurrency(summary.totalNetPayroll) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
import EmptyState from '@/components/common/EmptyState.vue'
import {formatCurrency, formatNumber} from '@/utils/formatters'

const props = defineProps({
    summaries: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    },
    error: {
        type: String,
        default: ''
    }
})

const formatMinutes = (minutes) => {
    const total = Number(minutes) || 0
    const hours = Math.floor(total / 60)
    const rest = total % 60
    if (!hours) return `${rest} phút`
    if (!rest) return `${hours} giờ`
    return `${hours} giờ ${rest} phút`
}
</script>

<style scoped>
.summary-table {
    border-radius: 18px;
    border: 1px solid var(--color-border);
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
}
</style>
