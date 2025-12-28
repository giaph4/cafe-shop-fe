<template>
  <div
    class="performance-dashboard container-fluid"
      
    style="background: var(--color-body-bg); padding: var(--spacing-4);"
  >
    <div class="performance-header">
      <div class="performance-header__content">
        <div class="performance-header__title-section">
          <h2 class="performance-header__title">
            Performance Dashboard
          </h2>
          <p class="performance-header__subtitle">
            Theo dõi hiệu suất ứng dụng, thời gian tải trang và API calls
          </p>
        </div>
        <div class="performance-header__actions">
          <button
            class="btn btn-outline-secondary btn-sm"
            type="button"
            @click="refreshMetrics"
          >
            <i class="bi bi-arrow-clockwise me-2" />
            Làm mới
          </button>
          <button
            class="btn btn-outline-danger btn-sm"
            type="button"
            @click="clearMetrics"
          >
            <i class="bi bi-trash me-2" />
            Xóa dữ liệu
          </button>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <!-- Page Load Metrics -->
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">
              <i class="bi bi-speedometer2 me-2" />
              Thời gian tải trang
            </h5>
          </div>
          <div class="card-body">
            <div class="metrics-grid">
              <div class="metric-item">
                <div class="metric-label">
                  Trung bình
                </div>
                <div class="metric-value">
                  {{ formatTime(metrics.pageLoad.average) }}
                </div>
              </div>
              <div class="metric-item">
                <div class="metric-label">
                  Nhanh nhất
                </div>
                <div class="metric-value text-success">
                  {{ formatTime(metrics.pageLoad.min) }}
                </div>
              </div>
              <div class="metric-item">
                <div class="metric-label">
                  Chậm nhất
                </div>
                <div class="metric-value text-danger">
                  {{ formatTime(metrics.pageLoad.max) }}
                </div>
              </div>
            </div>
            <div
              v-if="metrics.pageLoad.recent.length > 0"
              class="mt-3"
            >
              <h6 class="small mb-2">
                Lịch sử gần đây:
              </h6>
              <div class="recent-list">
                <div
                  v-for="(load, index) in metrics.pageLoad.recent.slice(-5)"
                  :key="index"
                  class="recent-item"
                >
                  <span class="recent-item__page">{{ load.page }}</span>
                  <span
                    class="recent-item__time"
                    :class="getTimeClass(load.total)"
                  >
                    {{ formatTime(load.total) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- API Call Metrics -->
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">
              <i class="bi bi-cloud-download me-2" />
              API Calls
            </h5>
          </div>
          <div class="card-body">
            <div class="metrics-grid">
              <div class="metric-item">
                <div class="metric-label">
                  Tổng số
                </div>
                <div class="metric-value">
                  {{ metrics.apiCalls.total }}
                </div>
              </div>
              <div class="metric-item">
                <div class="metric-label">
                  Trung bình
                </div>
                <div class="metric-value">
                  {{ formatTime(metrics.apiCalls.average) }}
                </div>
              </div>
            </div>
            <div
              v-if="Object.keys(metrics.apiCalls.byType).length > 0"
              class="mt-3"
            >
              <h6 class="small mb-2">
                Theo loại:
              </h6>
              <div class="type-list">
                <div
                  v-for="(typeData, type) in metrics.apiCalls.byType"
                  :key="type"
                  class="type-item"
                >
                  <span class="type-item__name">{{ type }}</span>
                  <span class="type-item__count">{{ typeData.count }}</span>
                  <span class="type-item__avg">
                    {{ formatTime(typeData.totalDuration / typeData.count) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      <!-- Errors -->
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">
              <i class="bi bi-exclamation-triangle me-2" />
              Errors
            </h5>
          </div>
          <div class="card-body">
            <div class="metric-item">
              <div class="metric-label">
                Tổng số lỗi
              </div>
              <div
                class="metric-value"
                :class="metrics.errors.total > 0 ? 'text-danger' : 'text-success'"
              >
                {{ metrics.errors.total }}
              </div>
            </div>
            <div
              v-if="metrics.errors.recent.length > 0"
              class="mt-3"
            >
              <h6 class="small mb-2">
                Lỗi gần đây:
              </h6>
              <div class="error-list">
                <div
                  v-for="(error, index) in metrics.errors.recent.slice(-5)"
                  :key="index"
                  class="error-item"
                >
                  <div class="error-item__message">
                    {{ error.message }}
                  </div>
                  <div class="error-item__time">
                    {{ formatDateTime(error.timestamp) }}
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
import { ref, onMounted, onUnmounted } from 'vue'
import { performanceMonitor } from '@/utils/performanceMonitor'
import { formatDateTime } from '@/utils/formatters'

const metrics = ref({
    pageLoad: {
        recent: [],
        average: 0,
        min: 0,
        max: 0
    },
    apiCalls: {
        recent: [],
        average: 0,
        total: 0,
        byType: {}
    },
    render: {
        recent: [],
        average: 0
    },
    errors: {
        recent: [],
        total: 0
    },
    uptime: 0
})

let refreshInterval = null

const refreshMetrics = () => {
    metrics.value = performanceMonitor.getMetrics()
}

const clearMetrics = () => {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu performance?')) {
        performanceMonitor.clearMetrics()
        refreshMetrics()
    }
}


const formatTime = (ms) => {
    if (!ms || ms === 0) return '0ms'
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
}

const getTimeClass = (ms) => {
    if (ms < 1000) return 'text-success'
    if (ms < 3000) return 'text-warning'
    return 'text-danger'
}

onMounted(() => {
    refreshMetrics()
    refreshInterval = setInterval(refreshMetrics, 5000) // Làm mới mỗi 5 giây
})

onUnmounted(() => {
    if (refreshInterval) {
        clearInterval(refreshInterval)
    }
})
</script>

<style scoped>
.performance-dashboard {
    min-height: 100vh;
}

.performance-header {
    margin-bottom: 2rem;
}

.performance-header__content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
}

.performance-header__title {
    font-size: 1.75rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.performance-header__subtitle {
    color: var(--color-text-muted);
    margin: 0;
}

.metrics-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
}

.metric-item {
    text-align: center;
}

.metric-label {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    margin-bottom: 0.5rem;
}

.metric-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-heading);
}

.recent-list,
.type-list,
.error-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.recent-item,
.type-item,
.error-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background: var(--color-card-muted);
    border-radius: 6px;
    font-size: 0.875rem;
}

.recent-item__page {
    flex: 1;
    color: var(--color-heading);
}

.recent-item__time {
    font-weight: 600;
}

.type-item__name {
    flex: 1;
    text-transform: capitalize;
}

.type-item__count {
    margin: 0 1rem;
    color: var(--color-text-muted);
}

.error-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
}

.error-item__message {
    color: var(--color-danger);
    font-weight: 500;
}

.error-item__time {
    font-size: 0.75rem;
    color: var(--color-text-muted);
}
</style>

