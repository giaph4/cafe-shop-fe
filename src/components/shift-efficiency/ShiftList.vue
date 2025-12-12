<template>
  <div class="shift-list">
    <div
      v-if="shifts.length === 0"
      class="empty-list"
    >
      <EmptyState
        title="Không có dữ liệu"
        message="Không tìm thấy ca làm việc nào phù hợp"
      />
    </div>
    <div
      v-else
      class="table-responsive"
    >
      <table class="table table-minimal">
        <thead>
          <tr>
            <th>Ca</th>
            <th>Ngày</th>
            <th>Thời gian</th>
            <th>Nhân viên</th>
            <th>Doanh thu</th>
            <th>Số đơn</th>
            <th>Doanh thu/NV</th>
            <th>Điểm hiệu quả</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="shift in shifts"
            :key="shift.shiftId"
            :class="getRowClass(shift.efficiencyScore)"
          >
            <td>
              <div class="fw-semibold shift-name">
                {{ shift.shiftName }}
              </div>
            </td>
            <td>{{ formatDate(shift.date) }}</td>
            <td>
              <small>{{ formatTime(shift.startTime) }} - {{ formatTime(shift.endTime) }}</small>
            </td>
            <td>{{ formatNumber(shift.staffCount) }}</td>
            <td class="revenue-cell">
              {{ formatCurrency(shift.revenue) }}
            </td>
            <td>{{ formatNumber(shift.ordersCount) }}</td>
            <td>{{ formatCurrency(shift.revenuePerStaff) }}</td>
            <td>
              <span
                class="score-badge"
                :class="getScoreClass(shift.efficiencyScore)"
              >
                {{ shift.efficiencyScore.toFixed(1) }}
              </span>
            </td>
            <td>
              <button
                class="btn btn-flat btn-flat--outline btn-sm"
                title="Xem chi tiết"
                @click="$emit('view', shift)"
              >
                <i class="bi bi-eye" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { formatCurrency, formatNumber, formatDate, formatTime } from '@/utils/formatters'
import EmptyState from '@/components/common/EmptyState.vue'

defineProps({
    shifts: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
})

defineEmits(['view'])

const getRowClass = (score) => {
    if (score >= 80) return 'table-row-excellent'
    if (score >= 60) return 'table-row-good'
    if (score >= 40) return 'table-row-average'
    return 'table-row-poor'
}

const getScoreClass = (score) => {
    if (score >= 80) return 'score-excellent'
    if (score >= 60) return 'score-good'
    if (score >= 40) return 'score-average'
    return 'score-poor'
}
</script>

<style scoped>
.shift-list {
    font-family: var(--font-family-sans);
}

.empty-list {
    padding: var(--spacing-8) 0;
}

.shift-name {
    font-family: var(--font-family-sans);
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
}

.table-row-excellent {
    background: var(--color-soft-emerald);
}

.table-row-good {
    background: var(--color-soft-sky);
}

.table-row-average {
    background: var(--color-soft-amber);
}

.table-row-poor {
    background: var(--color-soft-rose);
}

.revenue-cell {
    font-family: var(--font-family-sans);
    color: var(--color-success);
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
</style>

