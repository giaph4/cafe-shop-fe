<template>
  <div class="overview-tab">
    <div class="row g-4">
      <div class="col-lg-6">
        <div class="card standard-card">
          <div class="card-header standard-card-header">
            <h6 class="card-title mb-0">
              Top 5 nhân viên xuất sắc
            </h6>
          </div>
          <div class="card-body">
            <div class="leaderboard">
              <div
                v-for="(staff, index) in topPerformers"
                :key="staff.userId"
                class="leaderboard-item"
                :class="getRankClass(index)"
              >
                <div class="leaderboard-rank">
                  {{ index + 1 }}
                </div>
                <div class="leaderboard-info">
                  <div class="leaderboard-name">
                    {{ staff.fullName }}
                  </div>
                  <div class="leaderboard-metrics">
                    <span class="metric-item">
                      <i class="bi bi-cash-stack me-1" />
                      {{ formatCurrency(staff.metrics.revenue) }}
                    </span>
                    <span class="metric-item">
                      <i class="bi bi-cart me-1" />
                      {{ formatNumber(staff.metrics.ordersCount) }} đơn
                    </span>
                  </div>
                </div>
                <div class="leaderboard-score">
                  <span class="score-value">{{ staff.metrics.performanceScore.toFixed(1) }}</span>
                  <span class="score-label">điểm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-6">
        <div class="card standard-card">
          <div class="card-header standard-card-header">
            <h6 class="card-title mb-0">
              Thống kê tổng quan
            </h6>
          </div>
          <div class="card-body">
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-icon stat-icon--primary">
                  <i class="bi bi-cash-stack" />
                </div>
                <div class="stat-content">
                  <div class="stat-label">
                    Tổng doanh thu
                  </div>
                  <div class="stat-value">
                    {{ formatCurrency(totalRevenue) }}
                  </div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon stat-icon--success">
                  <i class="bi bi-cart" />
                </div>
                <div class="stat-content">
                  <div class="stat-label">
                    Tổng đơn hàng
                  </div>
                  <div class="stat-value">
                    {{ formatNumber(totalOrders) }}
                  </div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon stat-icon--info">
                  <i class="bi bi-clock-history" />
                </div>
                <div class="stat-content">
                  <div class="stat-label">
                    Tỷ lệ chuyên cần TB
                  </div>
                  <div class="stat-value">
                    {{ (avgAttendance * 100).toFixed(1) }}%
                  </div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon stat-icon--warning">
                  <i class="bi bi-check-circle" />
                </div>
                <div class="stat-content">
                  <div class="stat-label">
                    Tỷ lệ đúng giờ TB
                  </div>
                  <div class="stat-value">
                    {{ (avgOnTime * 100).toFixed(1) }}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatCurrency, formatNumber } from '@/utils/formatters'

const props = defineProps({
    staffList: {
        type: Array,
        default: () => []
    },
    teamMetrics: {
        type: Object,
        default: null
    }
})

const topPerformers = computed(() => props.staffList.slice(0, 5))

const totalRevenue = computed(() => props.staffList.reduce((sum, s) => sum + (s.metrics?.revenue || 0), 0))

const totalOrders = computed(() => props.staffList.reduce((sum, s) => sum + (s.metrics?.ordersCount || 0), 0))

const avgAttendance = computed(() => {
    if (props.staffList.length === 0) return 0
    const sum = props.staffList.reduce((sum, s) => sum + (s.metrics?.attendanceRate || 0), 0)
    return sum / props.staffList.length
})

const avgOnTime = computed(() => {
    if (props.staffList.length === 0) return 0
    const sum = props.staffList.reduce((sum, s) => sum + (s.metrics?.onTimeRate || 0), 0)
    return sum / props.staffList.length
})

const getRankClass = (index) => {
    if (index === 0) return 'rank-gold'
    if (index === 1) return 'rank-silver'
    if (index === 2) return 'rank-bronze'
    return ''
}
</script>

<style scoped>
.overview-tab {
    font-family: var(--font-family-sans);
}

.leaderboard {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.leaderboard-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    padding: var(--spacing-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    transition: all var(--transition-base);
}

.leaderboard-item:hover {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
}

.leaderboard-item.rank-gold {
    background: var(--color-soft-amber);
    border-color: var(--color-warning);
}

.leaderboard-item.rank-silver {
    background: var(--color-card-muted);
}

.leaderboard-item.rank-bronze {
    background: var(--color-card-muted);
    opacity: 0.9;
}

.leaderboard-rank {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    background: var(--color-card-muted);
    color: var(--color-text);
    flex-shrink: 0;
}

.leaderboard-item.rank-gold .leaderboard-rank {
    background: var(--color-warning);
    color: var(--color-text-inverse);
}

.leaderboard-item.rank-silver .leaderboard-rank {
    background: var(--color-text-muted);
    color: var(--color-text-inverse);
}

.leaderboard-item.rank-bronze .leaderboard-rank {
    background: var(--color-warning);
    color: var(--color-text-inverse);
    opacity: 0.8;
}

.leaderboard-info {
    flex: 1;
    min-width: 0;
}

.leaderboard-name {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    margin-bottom: var(--spacing-1);
}

.leaderboard-metrics {
    display: flex;
    gap: var(--spacing-3);
    flex-wrap: wrap;
}

.metric-item {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.leaderboard-score {
    text-align: right;
    flex-shrink: 0;
}

.score-value {
    display: block;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    font-family: var(--font-family-sans);
}

.score-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-3);
}

.stat-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    padding: var(--spacing-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    flex-shrink: 0;
}

.stat-icon--primary {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.stat-icon--success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.stat-icon--info {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.stat-icon--warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.stat-content {
    flex: 1;
    min-width: 0;
}

.stat-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.stat-value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

@media (max-width: 768px) {
    .stats-grid {
        grid-template-columns: 1fr;
    }
}
</style>

