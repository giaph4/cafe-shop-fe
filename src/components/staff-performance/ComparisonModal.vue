<template>
  <Teleport to="body">
    <div
      class="comparison-modal modal fade show"
      tabindex="-1"
      style="display: block; z-index: 1055;"
      @click.self="handleClose"
    >
      <div
        class="modal-backdrop fade show"
        style="z-index: 1050;"
        @click="handleClose"
      />
      <div
        class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
        style="z-index: 1056;"
      >
        <div
          class="modal-content"
          @click.stop
        >
          <div class="modal-header">
            <div class="modal-header__content">
              <h5 class="modal-title">
                So sánh nhân viên
              </h5>
              <p class="modal-subtitle mb-0">
                So sánh hiệu suất giữa các nhân viên đã chọn
              </p>
            </div>
            <button
              type="button"
              class="btn-close"
              aria-label="Đóng"
              @click="handleClose"
            />
          </div>
          <div class="modal-body">
            <LoadingState
              v-if="loading"
              text="Đang tải dữ liệu so sánh..."
            />
            <ErrorState
              v-else-if="error"
              :message="error"
              @retry="loadComparison"
            />
            <div v-else-if="comparisonData && comparisonData.staff.length > 0">
              <ComparisonChart :staff-list="comparisonData.staff" />
              <div class="table-responsive mt-4">
                <table class="table table-minimal">
                  <thead>
                    <tr>
                      <th>Nhân viên</th>
                      <th>Điểm hiệu suất</th>
                      <th>Doanh thu</th>
                      <th>Số đơn</th>
                      <th>Chuyên cần</th>
                      <th>Đúng giờ</th>
                      <th>Tips</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="staff in comparisonData.staff"
                      :key="staff.userId"
                    >
                      <td>
                        <div class="fw-semibold staff-name">
                          {{ staff.fullName }}
                        </div>
                      </td>
                      <td>
                        <span
                          class="score-badge"
                          :class="getScoreClass(staff.metrics.performanceScore)"
                        >
                          {{ staff.metrics.performanceScore.toFixed(1) }}
                        </span>
                      </td>
                      <td class="revenue-cell">
                        {{ formatCurrency(staff.metrics.revenue) }}
                      </td>
                      <td>{{ formatNumber(staff.metrics.ordersCount) }}</td>
                      <td>
                        <span class="rate-badge">{{ (staff.metrics.attendanceRate * 100).toFixed(1) }}%</span>
                      </td>
                      <td>
                        <span class="rate-badge">{{ (staff.metrics.onTimeRate * 100).toFixed(1) }}%</span>
                      </td>
                      <td class="tips-cell">
                        {{ formatCurrency(staff.metrics.tipsEarned) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <EmptyState
              v-else
              title="Không có dữ liệu"
              message="Không có dữ liệu để so sánh"
            >
              <template #icon>
                <i class="bi bi-bar-chart" />
              </template>
            </EmptyState>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-flat btn-flat--outline"
              @click="handleClose"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useStaffPerformanceStore } from '@/store/staffPerformance'
import ComparisonChart from './ComparisonChart.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { formatCurrency, formatNumber } from '@/utils/formatters'

const props = defineProps({
    staffIds: {
        type: Array,
        required: true
    },
    startDate: {
        type: String,
        required: true
    },
    endDate: {
        type: String,
        required: true
    }
})

const emit = defineEmits(['close'])

const store = useStaffPerformanceStore()
const loading = computed(() => store.loading)
const error = computed(() => store.error)
const comparisonData = computed(() => store.comparisonData)

const loadComparison = async () => {
    try {
        await store.compareStaff({
            userIds: props.staffIds,
            startDate: props.startDate,
            endDate: props.endDate
        })
    } catch (err) {
        console.error('Failed to load comparison', err)
    }
}

const handleClose = () => {
    emit('close')
}

const getScoreClass = (score) => {
    if (score >= 90) return 'score-excellent'
    if (score >= 75) return 'score-good'
    if (score >= 60) return 'score-average'
    return 'score-poor'
}

onMounted(() => {
    loadComparison()
})
</script>

<style scoped>
.comparison-modal {
    font-family: var(--font-family-sans);
}

.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    pointer-events: auto;
}

:global(.modal-content) {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-card);
    box-shadow: var(--shadow-lg);
}

:global(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4) var(--spacing-5);
    background: var(--color-card);
}

.modal-header__content {
    flex: 1;
}

:global(.modal-title) {
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    margin: 0;
}

.modal-subtitle {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
}

:global(.modal-body) {
    padding: var(--spacing-5);
    font-family: var(--font-family-sans);
}

:global(.modal-footer) {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-4) var(--spacing-5);
    background: var(--color-card);
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

.tips-cell {
    font-family: var(--font-family-sans);
    color: var(--color-warning);
}
</style>

