<template>
  <div class="shift-assignment-my-tab">
    <div class="card table-card">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 class="card-title mb-1">
              Phân công của tôi
            </h5>
            <p class="text-muted mb-0">
              Danh sách các ca làm bạn đã được phân công.
            </p>
          </div>
          <button
            class="btn btn-outline-primary btn-sm"
            type="button"
            :disabled="loading"
            @click="handleRefresh"
          >
            <span
              v-if="loading"
              class="spinner-border spinner-border-sm me-2"
            />
            Làm mới
          </button>
        </div>

        <LoadingState v-if="loading" />
        <ErrorState
          v-else-if="error"
          :message="error"
        />
        <EmptyState
          v-else-if="!assignments.length"
          title="Chưa có phân công nào"
          message="Bạn chưa được phân công vào ca làm nào."
        />
        <div
          v-else
          class="table-responsive"
        >
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
              <tr
                v-for="assignment in assignments"
                :key="assignment.id"
              >
                <td>
                  <div class="fw-semibold">
                    Shift #{{ assignment.shiftId }}
                  </div>
                  <div
                    v-if="assignment.roleName"
                    class="text-muted small"
                  >
                    Vai trò: {{ assignment.roleName }}
                  </div>
                </td>
                <td>
                  <div>{{ formatTime(assignment.plannedStart) }} - {{ formatTime(assignment.plannedEnd) }}</div>
                  <div class="text-muted small">
                    {{ assignment.plannedMinutes }} phút
                  </div>
                  <div
                    v-if="assignment.actualMinutes"
                    class="text-muted small"
                  >
                    Thực tế: {{ assignment.actualMinutes }} phút
                  </div>
                </td>
                <td>
                  <div class="fw-semibold">
                    {{ formatCurrency(assignment.totalRevenue ?? 0) }}
                  </div>
                  <div
                    v-if="assignment.totalOrders"
                    class="text-muted small"
                  >
                    {{ assignment.totalOrders }} đơn
                  </div>
                </td>
                <td>
                  <div>{{ formatCurrency(assignment.hourlyRate ?? 0) }}/giờ</div>
                  <div
                    v-if="assignment.fixedAllowance"
                    class="text-muted small"
                  >
                    Phụ cấp: {{ formatCurrency(assignment.fixedAllowance) }}
                  </div>
                </td>
                <td>
                  <div
                    v-if="assignment.bonusAmount"
                    class="text-success"
                  >
                    + {{ formatCurrency(assignment.bonusAmount) }}
                  </div>
                  <div
                    v-if="assignment.penaltyAmount"
                    class="text-danger"
                  >
                    - {{ formatCurrency(assignment.penaltyAmount) }}
                  </div>
                  <div
                    v-if="!assignment.bonusAmount && !assignment.penaltyAmount"
                    class="text-muted small"
                  >
                    Không có
                  </div>
                </td>
                <td>
                  <span
                    class="badge text-light"
                    :class="statusClass(assignment.status)"
                  >
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
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { formatCurrency } from '@/utils/formatters'

defineProps({
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

<style scoped lang="scss">
.table-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.table-card :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.table-card :global(.card-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.table-card :global(.text-muted) {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.table-card :global(.btn-outline-primary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.table-card :global(.btn-outline-primary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.table-card :global(.table) {
    margin-bottom: 0;
}

.table-card :global(.table thead),
.table-card :global(.table thead.table-light) {
    background: var(--color-card-muted);
}

.table-card :global(.table thead th) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    background: var(--color-card-muted);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-3);
    font-family: var(--font-family-sans);
}

.table-card :global(.table tbody td) {
    padding: var(--spacing-3);
    vertical-align: middle;
    border-bottom: 1px solid var(--color-border);
    font-family: var(--font-family-sans);
}

.table-card :global(.table tbody tr:last-child td) {
    border-bottom: none;
}

.table-card :global(.table tbody tr:hover) {
    background: var(--color-card-muted);
}

.table-card :global(.fw-semibold) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.table-card :global(.badge) {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.table-card :global(.badge.bg-success) {
    background: var(--color-soft-emerald);
    color: var(--color-success);
    border: 1px solid var(--color-success);
}

.table-card :global(.badge.bg-warning) {
    background: var(--color-soft-amber);
    color: var(--color-warning);
    border: 1px solid var(--color-warning);
}

.table-card :global(.badge.bg-info) {
    background: var(--color-soft-indigo);
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
}

.table-card :global(.badge.bg-danger) {
    background: var(--color-soft-rose);
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
}

.table-card :global(.badge.bg-secondary) {
    background: var(--color-card-muted);
    color: var(--color-heading);
    border: 1px solid var(--color-border);
}

.table-card :global(.text-success) {
    color: var(--color-success);
}

.table-card :global(.text-danger) {
    color: var(--color-danger);
}
</style>

