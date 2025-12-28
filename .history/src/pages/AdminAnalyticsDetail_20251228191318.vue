<template>
  <div
    class="page-container container-fluid"
      
  >
    <div class="page-header card-shadow">
      <div>
        <h2 class="page-title">
          Chi tiết Phân tích AI
        </h2>
        <p class="page-subtitle">
          Xem chi tiết phân tích #{{ analyticsId }}
        </p>
      </div>
      <div class="d-flex flex-wrap gap-2 align-items-center">
        <router-link
          to="/admin-analytics"
          class="btn btn-outline-secondary"
        >
          <i class="bi bi-arrow-left me-2" />
          Quay lại
        </router-link>
      </div>
    </div>

    <div
      v-if="loading"
      class="card"
class="info-card"
    >
      <div class="card-body text-center py-5">
        <div
          class="spinner-border text-primary"
          role="status"
        />
        <p class="mt-3 text-muted">
          Đang tải dữ liệu...
        </p>
      </div>
    </div>

    <div
      v-else-if="error"
      class="card"
class="info-card"
    >
      <div class="card-body">
        <div
          class="alert alert-danger mb-0"
        >
          {{ error }}
        </div>
      </div>
    </div>

    <div
      v-else-if="analytics"
      class="card"
class="info-card"
    >
      <div class="card-body">
        <div class="row g-4">
          <div class="col-md-6">
            <h5 class="mb-3">
              Thông tin cơ bản
            </h5>
            <table class="table table-borderless">
              <tr>
                <th width="40%">
                  ID Phân tích:
                </th>
                <td>#{{ analytics.id }}</td>
              </tr>
              <tr>
                <th>Loại phân tích:</th>
                <td>{{ analytics.type || 'N/A' }}</td>
              </tr>
              <tr>
                <th>Tiêu đề:</th>
                <td>{{ analytics.title || 'N/A' }}</td>
              </tr>
              <tr>
                <th>Ngày tạo:</th>
                <td>{{ formatDateTime(analytics.createdAt) || 'N/A' }}</td>
              </tr>
              <tr>
                <th>Trạng thái:</th>
                <td>
                  <span :class="['badge', getStatusClass(analytics.status)]">
                    {{ getStatusLabel(analytics.status) }}
                  </span>
                </td>
              </tr>
            </table>
          </div>
          <div class="col-md-6">
            <h5 class="mb-3">
              Kết quả phân tích
            </h5>
            <div
              v-if="analytics.results"
              class="border rounded p-3 bg-light"
            >
              <pre
                class="mb-0"
class="pre-wrap small"
              >{{ formatResults(analytics.results) }}</pre>
            </div>
            <div
              v-else
              class="text-muted"
            >
              Chưa có kết quả phân tích
            </div>
          </div>
        </div>

        <div
          v-if="analytics.insights && analytics.insights.length > 0"
          class="mt-4"
        >
          <h5 class="mb-3">
            Insights
          </h5>
          <div class="list-group">
            <div
              v-for="(insight, index) in analytics.insights"
              :key="index"
              class="list-group-item"
            >
              <div class="d-flex align-items-start">
                <i class="bi bi-lightbulb text-warning me-2 mt-1" />
                <div>
                  <strong>{{ insight.title || `Insight ${index + 1}` }}</strong>
                  <p class="mb-0 mt-1">
                    {{ insight.description || insight }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="analytics.recommendations && analytics.recommendations.length > 0"
          class="mt-4"
        >
          <h5 class="mb-3">
            Khuyến nghị
          </h5>
          <div class="list-group">
            <div
              v-for="(recommendation, index) in analytics.recommendations"
              :key="index"
              class="list-group-item"
            >
              <div class="d-flex align-items-start">
                <i class="bi bi-check-circle text-success me-2 mt-1" />
                <div>
                  <strong>{{ recommendation.title || `Khuyến nghị ${index + 1}` }}</strong>
                  <p class="mb-0 mt-1">
                    {{ recommendation.description || recommendation }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="card"
class="info-card"
    >
      <div class="card-body text-center py-5">
        <i
          class="bi bi-inbox fs-1 d-block mb-3 text-muted"
        />
        <p class="text-muted">
          Không tìm thấy phân tích với ID này.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { formatDateTime } from '@/utils/formatters'
import logger from '@/utils/logger'

const route = useRoute()
const analyticsId = route.params.id

const analytics = ref(null)
const loading = ref(true)
const error = ref(null)

const getStatusClass = (status) => {
    if (status === 'COMPLETED') return 'bg-success'
    if (status === 'PROCESSING') return 'bg-warning'
    if (status === 'FAILED') return 'bg-danger'
    return 'bg-secondary'
}

const getStatusLabel = (status) => {
    if (status === 'COMPLETED') return 'Hoàn thành'
    if (status === 'PROCESSING') return 'Đang xử lý'
    if (status === 'FAILED') return 'Thất bại'
    return 'Chưa xác định'
}

const formatResults = (results) => {
    if (typeof results === 'string') return results
    if (typeof results === 'object') return JSON.stringify(results, null, 2)
    return String(results)
}

onMounted(async () => {
    loading.value = true
    error.value = null

    try {
        // Backend endpoint chưa có sẵn, hiển thị thông báo
        error.value = 'Chức năng này cần hỗ trợ từ backend. Vui lòng liên hệ quản trị viên.'
    } catch (err) {
        error.value = err.response?.data?.message || err.message || 'Không thể tải chi tiết phân tích.'
        logger.error('Failed to load admin analytics detail:', err)
    } finally {
        loading.value = false
    }
})
</script>

<style scoped>
/* Chuẩn hóa theo Global Design System */
.page-container :global(.card) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.page-container :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.page-container :global(.card-body h5) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.page-container :global(.card-body .text-muted) {
    font-family: var(--font-family-sans);
}

/* Minimal Table Styling */
.page-container :global(.table) {
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
}

.page-container :global(.table th) {
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    padding: var(--spacing-3);
    border-bottom: 1px solid var(--color-border);
}

.page-container :global(.table td) {
    padding: var(--spacing-3);
    border-bottom: 1px solid var(--color-border);
    font-family: var(--font-family-sans);
}

.page-container :global(.table tbody tr:last-child td) {
    border-bottom: none;
}

.page-container :global(.table-borderless th),
.page-container :global(.table-borderless td) {
    border-bottom: none;
}

/* Badge Styling */
.page-container :global(.badge) {
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-medium);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
}

/* List Group Styling */
.page-container :global(.list-group-item) {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    margin-bottom: var(--spacing-2);
    padding: var(--spacing-3);
    background: var(--color-card);
    font-family: var(--font-family-sans);
}

.page-container :global(.list-group-item strong) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.page-container :global(.list-group-item p) {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.page-container :global(.list-group-item .text-warning) {
    color: var(--color-warning);
}

.page-container :global(.list-group-item .text-success) {
    color: var(--color-success);
}

/* Results Display */
.page-container :global(.border.rounded) {
    border: 1px solid var(--color-border) !important;
    border-radius: var(--radius-sm) !important;
    background: var(--color-card-muted) !important;
    padding: var(--spacing-3) !important;
}

.page-container :global(pre) {
    font-family: var(--font-family-mono);
    color: var(--color-heading);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-base);
    margin: 0;
    white-space: pre-wrap;
}

/* Button Styling */
.page-container :global(.btn-outline-secondary) {
    border-color: var(--color-border);
    color: var(--color-heading);
    background: transparent;
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.page-container :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.info-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.pre-wrap {
    white-space: pre-wrap;
}
</style>

