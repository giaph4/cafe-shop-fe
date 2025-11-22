<template>
    <div class="shift-assignment-my-tab">
        <div class="card table-card">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <h5 class="card-title mb-1">Phân công của tôi</h5>
                        <p class="text-muted mb-0">Danh sách các ca làm bạn đã được phân công.</p>
                    </div>
                    <button class="btn btn-outline-primary btn-sm" type="button" @click="handleRefresh" :disabled="loading">
                        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                        Làm mới
                    </button>
                </div>

                <div v-if="loading" class="text-center py-5">
                    <div class="spinner-border text-primary"></div>
                </div>
                <div v-else-if="error" class="alert alert-warning d-flex align-items-center gap-2">
                    <i class="bi bi-exclamation-triangle"></i>
                    <span>{{ error }}</span>
                </div>
                <EmptyState
                    v-else-if="!assignments.length"
                    title="Chưa có phân công nào"
                    message="Bạn chưa được phân công vào ca làm nào."
                />
                <div v-else class="table-responsive">
                    <table class="table align-middle">
                        <thead class="table-light">
                        <tr>
                            <th>Ca làm</th>
                            <th>Thời gian</th>
                            <th>Doanh thu</th>
                            <th>Lương</th>
                            <th>Thưởng/Phạt</th>
                            <th>Trạng thái</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="assignment in assignments" :key="assignment.id">
                            <td>
                                <div class="fw-semibold">Shift #{{ assignment.shiftId }}</div>
                                <div class="text-muted small" v-if="assignment.roleName">Vai trò: {{ assignment.roleName }}</div>
                            </td>
                            <td>
                                <div>{{ formatTime(assignment.plannedStart) }} - {{ formatTime(assignment.plannedEnd) }}</div>
                                <div class="text-muted small">{{ assignment.plannedMinutes }} phút</div>
                                <div class="text-muted small" v-if="assignment.actualMinutes">
                                    Thực tế: {{ assignment.actualMinutes }} phút
                                </div>
                            </td>
                            <td>
                                <div class="fw-semibold">{{ formatCurrency(assignment.totalRevenue ?? 0) }}</div>
                                <div class="text-muted small" v-if="assignment.totalOrders">
                                    {{ assignment.totalOrders }} đơn
                                </div>
                            </td>
                            <td>
                                <div>{{ formatCurrency(assignment.hourlyRate ?? 0) }}/giờ</div>
                                <div class="text-muted small" v-if="assignment.fixedAllowance">
                                    Phụ cấp: {{ formatCurrency(assignment.fixedAllowance) }}
                                </div>
                            </td>
                            <td>
                                <div class="text-success" v-if="assignment.bonusAmount">
                                    + {{ formatCurrency(assignment.bonusAmount) }}
                                </div>
                                <div class="text-danger" v-if="assignment.penaltyAmount">
                                    - {{ formatCurrency(assignment.penaltyAmount) }}
                                </div>
                                <div v-if="!assignment.bonusAmount && !assignment.penaltyAmount" class="text-muted small">
                                    Không có
                                </div>
                            </td>
                            <td>
                                <span class="badge" :class="statusClass(assignment.status)">
                                    {{ translateStatus(assignment.status) }}
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
import EmptyState from '@/components/common/EmptyState.vue'
import { formatCurrency } from '@/utils/formatters'

const props = defineProps({
    assignments: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    error: { type: String, default: null }
})

const emit = defineEmits(['refresh'])

const formatTime = (time) => {
    if (!time) return '--:--'
    return time.length === 5 ? time : time.slice(0, 5)
}

const translateStatus = (status) => {
    const map = {
        SCHEDULED: 'Đã xếp',
        CONFIRMED: 'Đã xác nhận',
        IN_PROGRESS: 'Đang làm',
        COMPLETED: 'Hoàn thành',
        CANCELLED: 'Đã hủy'
    }
    return map[status] || status
}

const statusClass = (status) => {
    switch (status) {
        case 'COMPLETED':
            return 'bg-success'
        case 'IN_PROGRESS':
            return 'bg-warning text-dark'
        case 'CONFIRMED':
            return 'bg-info text-dark'
        case 'CANCELLED':
            return 'bg-danger'
        default:
            return 'bg-secondary'
    }
}

const handleRefresh = () => emit('refresh')
</script>

<style scoped>
.table-card {
    border-radius: 18px;
    border: 1px solid var(--color-border);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
}
</style>

