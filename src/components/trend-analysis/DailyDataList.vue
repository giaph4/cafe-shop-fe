<template>
  <div class="daily-data-list">
    <div
      v-if="dailyData.length === 0"
      class="empty-list"
    >
      <EmptyState
        title="Không có dữ liệu"
        message="Không tìm thấy dữ liệu nào"
      />
    </div>
    <div
      v-else
      class="table-responsive"
    >
      <table class="table table-minimal">
        <thead>
          <tr>
            <th>Ngày</th>
            <th>Thứ</th>
            <th>Doanh thu</th>
            <th>Số đơn</th>
            <th>Đơn TB</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="day in dailyData"
            :key="day.date"
            :class="getRowClass(day)"
          >
            <td>{{ formatDate(day.date) }}</td>
            <td>{{ getDayOfWeek(day.date) }}</td>
            <td class="revenue-cell">
              {{ formatCurrency(day.value) }}
            </td>
            <td>{{ formatNumber(day.orders) }}</td>
            <td>{{ formatCurrency(day.orders > 0 ? day.value / day.orders : 0) }}</td>
            <td>
              <span
                v-if="isAnomaly(day)"
                class="badge badge-soft badge-warning"
              >
                Bất thường
              </span>
              <span
                v-else
                class="badge badge-soft badge-success"
              >
                Bình thường
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { formatCurrency, formatNumber, formatDate } from '@/utils/formatters'
import EmptyState from '@/components/common/EmptyState.vue'

defineProps({
    dailyData: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
})

const getDayOfWeek = (date) => {
    const d = new Date(date)
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
    return days[d.getDay()]
}

const isAnomaly = (day) => day.zScore && day.zScore > 2

const getRowClass = (day) => {
    if (isAnomaly(day)) return 'table-row-anomaly'
    return ''
}
</script>


<style scoped>
.daily-data-list {
    font-family: var(--font-family-sans);
}

.empty-list {
    padding: var(--spacing-8) 0;
}

.revenue-cell {
    color: var(--color-success);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
}

.table-row-anomaly {
    background: var(--color-soft-amber);
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

.badge-warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.badge-success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}
</style>

