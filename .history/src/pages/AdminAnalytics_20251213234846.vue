<template>
  <div
    class="admin-analytics-page container-fluid"
      
    style="background: var(--color-body-bg); padding: var(--spacing-4);"
  >
    <PageHeader
      title="Phân tích AI"
      subtitle="Phân tích dữ liệu kinh doanh thông minh với AI, nhận insights và đề xuất hành động."
    >
      <template #actions>
        <button
          class="btn btn-flat btn-flat--outline"
          type="button"
          :disabled="loading || generating"
          @click="resetForm"
        >
          <i class="bi bi-arrow-clockwise me-2" />Đặt lại
        </button>
      </template>
    </PageHeader>

    <div class="card filter-card mb-4">
      <div class="card-body">
        <!-- Nhóm 1: Khoảng thời gian -->
        <div class="filter-section">
          <h6 class="filter-section__title">
            <i class="bi bi-calendar-range me-2" />Khoảng thời gian
          </h6>
          <div class="row g-3">
            <div class="col-lg-3 col-md-6">
              <label class="form-label">Từ ngày <span class="text-danger">*</span></label>
              <input
                v-model="filters.from"
                type="date"
                class="form-control clean-input"
                required
              >
            </div>
            <div class="col-lg-3 col-md-6">
              <label class="form-label">Đến ngày <span class="text-danger">*</span></label>
              <input
                v-model="filters.to"
                type="date"
                class="form-control clean-input"
                required
              >
            </div>
            <div class="col-lg-6 col-md-12">
              <label class="form-label">Nhanh</label>
              <div
                class="btn-group w-100"
                role="group"
              >
                <button
                  v-for="preset in timePresets"
                  :key="preset.value"
                  type="button"
                  class="btn btn-flat"
                  :class="selectedTimePreset === preset.value ? 'btn-flat--active' : 'btn-flat--outline'"
                  @click="applyTimePreset(preset.value)"
                >
                  {{ preset.label }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Nhóm 2: Tùy chọn dữ liệu -->
        <div class="filter-section">
          <h6 class="filter-section__title">
            <i class="bi bi-database me-2" />Tùy chọn dữ liệu
            <i
              class="bi bi-question-circle ms-2"
              title="Chọn các loại dữ liệu để AI phân tích. Dữ liệu được chọn sẽ được gửi kèm trong prompt phân tích."
              style="font-size: 14px; cursor: help; color: var(--color-text-muted);"
            />
          </h6>
          <div class="d-flex flex-wrap gap-3">
            <div class="form-check">
              <input
                id="includeTopProducts"
                v-model="filters.includeTopProducts"
                class="form-check-input"
                type="checkbox"
              >
              <label
                class="form-check-label"
                for="includeTopProducts"
              >
                Top sản phẩm
              </label>
            </div>
            <div class="form-check">
              <input
                id="includeVoucherStats"
                v-model="filters.includeVoucherStats"
                class="form-check-input"
                type="checkbox"
              >
              <label
                class="form-check-label"
                for="includeVoucherStats"
              >
                Thống kê Voucher
              </label>
            </div>
            <div class="form-check">
              <input
                id="includeCustomerStats"
                v-model="filters.includeCustomerStats"
                class="form-check-input"
                type="checkbox"
              >
              <label
                class="form-check-label"
                for="includeCustomerStats"
              >
                Thống kê Khách hàng
              </label>
            </div>
          </div>
        </div>

        <!-- Nhóm 3: Metric -->
        <div class="filter-section">
          <h6 class="filter-section__title">
            <i class="bi bi-graph-up me-2" />Metric
          </h6>
          <div class="row g-3">
            <div class="col-lg-4 col-md-6">
              <select
                v-model="filters.metric"
                class="form-select clean-input"
              >
                <option value="revenue">
                  Doanh thu
                </option>
                <option value="profit">
                  Lợi nhuận
                </option>
                <option value="orders">
                  Đơn hàng
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Nhóm 4: Nút hành động -->
        <div class="filter-section">
          <div class="d-flex gap-2 align-items-center flex-wrap">
            <button
              class="btn btn-flat btn-flat--primary"
              type="button"
              :disabled="loading || generating || !isFormValid"
              @click="generateInsight"
            >
              <span
                v-if="generating"
                class="spinner-border spinner-border-sm me-2"
              />
              <i
                v-else
                class="bi bi-graph-up-arrow me-2"
              />
              {{ generating ? 'Đang phân tích...' : 'Phân tích' }}
            </button>
            <button
              class="btn btn-flat btn-flat--outline"
              type="button"
              :disabled="loading || generating"
              @click="resetForm"
            >
              <i class="bi bi-arrow-clockwise me-2" />
              Đặt lại
            </button>
          </div>
        </div>

        <!-- Prompt Templates -->
        <div
          v-if="showPromptTemplates"
          class="filter-section"
        >
          <div class="prompt-templates">
            <div class="prompt-templates__header">
              <h6 class="mb-2">
                <i class="bi bi-magic me-2" />Prompt mẫu (Click để sử dụng)
              </h6>
            </div>
            <div class="prompt-templates__list">
              <button
                v-for="(prompt, index) in promptTemplates"
                :key="index"
                type="button"
                class="prompt-template-item"
                @click="selectPrompt(prompt)"
              >
                <div class="prompt-template-item__icon">
                  <i :class="prompt.icon" />
                </div>
                <div class="prompt-template-item__content">
                  <strong>{{ prompt.title }}</strong>
                  <small>{{ prompt.description }}</small>
                </div>
                <i class="bi bi-arrow-right prompt-template-item__arrow" />
              </button>
            </div>
          </div>
        </div>

        <!-- Validation Error -->
        <div
          v-if="validationError"
          class="filter-section"
        >
          <div class="error-message mb-0">
            <i class="bi bi-exclamation-triangle me-2" />
            {{ validationError }}
          </div>
        </div>
      </div>
    </div>

    <LoadingState
      v-if="loading"
      message="Đang tải dữ liệu..."
    />
    <ErrorState
      v-else-if="error"
      :message="error"
    />

    <div
      v-else-if="insightData"
      class="row g-4"
    >
      <!-- AI Insights -->
      <div class="col-lg-8">
        <div class="card insight-card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <div>
              <h5 class="mb-0">
                <i class="bi bi-robot me-2" />Phân tích AI
              </h5>
              <small class="text-muted">Được tạo lúc {{ formatDateTime(insightData.generatedAt) }}</small>
            </div>
            <button
              class="btn btn-sm btn-outline-primary"
              :disabled="!insightData.aiInsightMarkdown"
              @click="copyInsight"
            >
              <i class="bi bi-clipboard me-1" />Copy
            </button>
          </div>
          <div class="card-body">
            <!-- Thông báo lỗi nếu có -->
            <div
              v-if="aiError"
              class="alert alert-danger d-flex align-items-center gap-2 mb-3"
            >
              <i class="bi bi-exclamation-triangle-fill" />
              <div>
                <strong>Lỗi phân tích AI:</strong> {{ aiError }}
              </div>
            </div>
            <div
              v-else-if="insightData.aiInsightMarkdown"
              class="ai-insight-content"
              v-html="formatMarkdown(insightData.aiInsightMarkdown)"
            />
            <div
              v-else
              class="text-muted text-center py-4"
            >
              <i class="bi bi-inbox fs-1 d-block mb-2" />
              Chưa có phân tích AI
            </div>
          </div>
          <!-- Input câu hỏi phân tích ở dưới box -->
          <div class="card-footer border-top">
            <label class="form-label mb-2">
              <i class="bi bi-chat-dots me-2" />Câu hỏi phân tích <span class="text-danger">*</span>
            </label>
            <div class="input-group">
              <input
                v-model="filters.question"
                type="text"
                class="form-control clean-input"
                placeholder="Ví dụ: Phân tích xu hướng bán hàng và đề xuất cải thiện..."
                required
                @keyup.enter="generateInsight"
              >
              <button
                type="button"
                class="btn btn-flat btn-flat--outline"
                title="Xem prompt mẫu"
                @click="showPromptTemplates = !showPromptTemplates"
              >
                <i class="bi bi-lightbulb" />
              </button>
              <button
                class="btn btn-flat btn-flat--primary"
                type="button"
                :disabled="loading || generating || !isFormValid"
                @click="generateInsight"
              >
                <span
                  v-if="generating"
                  class="spinner-border spinner-border-sm me-2"
                />
                <i
                  v-else
                  class="bi bi-send-fill"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div
          v-if="insightData.metrics"
          class="row g-4 mt-2"
        >
          <!-- Revenue Trend Chart -->
          <div class="col-lg-12">
            <div class="card">
              <div class="card-header">
                <h5 class="mb-0">
                  <i class="bi bi-graph-up me-2" />Xu hướng Doanh thu
                </h5>
              </div>
              <div class="card-body">
                <ApexChart
                  type="area"
                  height="300"
                  :options="revenueChartOptions"
                  :series="revenueChartSeries"
                />
              </div>
            </div>
          </div>

          <!-- Top Products Chart -->
          <div
            v-if="insightData.metrics?.topProducts?.length > 0"
            class="col-lg-6"
          >
            <div class="card">
              <div class="card-header">
                <h5 class="mb-0">
                  <i class="bi bi-pie-chart me-2" />Top Sản phẩm (Doanh thu)
                </h5>
              </div>
              <div class="card-body">
                <ApexChart
                  type="donut"
                  height="300"
                  :options="topProductsChartOptions"
                  :series="topProductsChartSeries"
                />
              </div>
            </div>
          </div>

          <!-- Order Status Chart -->
          <div class="col-lg-6">
            <div class="card">
              <div class="card-header">
                <h5 class="mb-0">
                  <i class="bi bi-bar-chart me-2" />Trạng thái Đơn hàng
                </h5>
              </div>
              <div class="card-body">
                <ApexChart
                  type="bar"
                  height="300"
                  :options="orderStatusChartOptions"
                  :series="orderStatusChartSeries"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Metrics Summary -->
      <div class="col-lg-4">
        <div class="card metrics-card">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="bi bi-bar-chart me-2" />Tóm tắt Metrics
            </h5>
          </div>
          <div class="card-body">
            <div
              v-if="insightData.metrics"
              class="metrics-summary"
            >
              <div
                v-for="metric in metricItems"
                :key="metric.key"
                class="metric-item"
                :class="metric.variant"
              >
                <div class="metric-item__icon">
                  <i :class="metric.icon" />
                </div>
                <div class="metric-item__content">
                  <div class="metric-label">
                    {{ metric.label }}
                  </div>
                  <div
                    class="metric-value"
                    :class="metric.valueClass"
                  >
                    {{ metric.value }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Rankings - Tabs -->
      <div
        v-if="hasTopRankings"
        class="col-lg-12"
      >
        <div class="card">
          <div class="card-header">
            <ul
              class="nav nav-tabs card-header-tabs"
              role="tablist"
            >
              <li
                v-if="insightData.metrics?.topProducts?.length > 0"
                class="nav-item"
                role="presentation"
              >
                <button
                  class="nav-link"
                  :class="{ active: activeTab === 'products' }"
                  type="button"
                  @click="activeTab = 'products'"
                >
                  <i class="bi bi-trophy me-2" />Top Sản phẩm
                </button>
              </li>
              <li
                v-if="insightData.metrics?.topCustomers?.length > 0"
                class="nav-item"
                role="presentation"
              >
                <button
                  class="nav-link"
                  :class="{ active: activeTab === 'customers' }"
                  type="button"
                  @click="activeTab = 'customers'"
                >
                  <i class="bi bi-people me-2" />Top Khách hàng
                </button>
              </li>
              <li
                v-if="insightData.metrics?.topStaff?.length > 0"
                class="nav-item"
                role="presentation"
              >
                <button
                  class="nav-link"
                  :class="{ active: activeTab === 'staff' }"
                  type="button"
                  @click="activeTab = 'staff'"
                >
                  <i class="bi bi-person-badge me-2" />Top Nhân viên
                </button>
              </li>
            </ul>
          </div>
          <div class="card-body">
            <!-- Top Products Tab -->
            <div
              v-if="activeTab === 'products' && insightData.metrics?.topProducts?.length > 0"
              class="tab-content"
            >
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Sản phẩm</th>
                      <th class="text-end">
                        Số lượng
                      </th>
                      <th class="text-end">
                        Doanh thu
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(product, index) in insightData.metrics.topProducts"
                      :key="product.productId || index"
                    >
                      <td>
                        <strong>{{ product.productName || 'N/A' }}</strong>
                      </td>
                      <td class="text-end">
                        {{ formatNumber(product.totalQuantity) }}
                      </td>
                      <td class="text-end">
                        {{ formatCurrency(product.totalRevenue) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Top Customers Tab -->
            <div
              v-if="activeTab === 'customers' && insightData.metrics?.topCustomers?.length > 0"
              class="tab-content"
            >
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Khách hàng</th>
                      <th class="text-end">
                        Số đơn
                      </th>
                      <th class="text-end">
                        Tổng chi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(customer, index) in insightData.metrics.topCustomers"
                      :key="customer.customerId || index"
                    >
                      <td>
                        <div>
                          <strong>{{ customer.customerName || 'N/A' }}</strong>
                          <small
                            v-if="customer.phone"
                            class="text-muted d-block"
                          >{{ customer.phone }}</small>
                        </div>
                      </td>
                      <td class="text-end">
                        {{ formatNumber(customer.orderCount) }}
                      </td>
                      <td class="text-end">
                        {{ formatCurrency(customer.totalSpend) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Top Staff Tab -->
            <div
              v-if="activeTab === 'staff' && insightData.metrics?.topStaff?.length > 0"
              class="tab-content"
            >
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Nhân viên</th>
                      <th class="text-end">
                        Số đơn
                      </th>
                      <th class="text-end">
                        Doanh thu
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(staff, index) in insightData.metrics.topStaff"
                      :key="staff.staffId || index"
                    >
                      <td>
                        <strong>{{ staff.staffName || 'N/A' }}</strong>
                      </td>
                      <td class="text-end">
                        {{ formatNumber(staff.orderCount) }}
                      </td>
                      <td class="text-end">
                        {{ formatCurrency(staff.totalRevenue) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { toast } from 'vue3-toastify'
import VueApexCharts from 'vue3-apexcharts'
import DOMPurify from 'dompurify'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { formatDateTime, formatCurrency, formatNumber } from '@/utils/formatters'
import { generateAdminInsight } from '@/api/adminAnalyticsService'
import { getRevenueByDate, getProfitReport } from '@/api/reportService'
import { useThemePreference } from '@/composables/useThemePreference'
import logger from '@/utils/logger'

const ApexChart = VueApexCharts
const { isDark } = useThemePreference()

const loading = ref(false)
const generating = ref(false)
const error = ref('')
const aiError = ref('')
const validationError = ref('')
const insightData = ref(null)
const showPromptTemplates = ref(false)
const revenueData = ref(null)
const profitData = ref(null)
const activeTab = ref('products')

const filters = reactive({
    from: '',
    to: '',
    question: '',
    metric: 'revenue',
    includeTopProducts: true,
    includeVoucherStats: true,
    includeCustomerStats: true
})

const selectedTimePreset = ref('1year')
const timePresets = [
    { label: '3 tháng', value: '3months' },
    { label: '6 tháng', value: '6months' },
    { label: '1 năm', value: '1year' }
]

const applyTimePreset = (preset) => {
    selectedTimePreset.value = preset
    const today = new Date()
    const to = new Date(today)
    const from = new Date(today)

    if (preset === '3months') {
        from.setMonth(today.getMonth() - 3)
    } else if (preset === '6months') {
        from.setMonth(today.getMonth() - 6)
    } else if (preset === '1year') {
        from.setFullYear(today.getFullYear() - 1)
    }

    filters.from = from.toISOString().split('T')[0]
    filters.to = to.toISOString().split('T')[0]
}

const isFormValid = computed(() => filters.from && filters.to && filters.question.trim())

const hasTopRankings = computed(() => {
    if (!insightData.value?.metrics) return false
    const m = insightData.value.metrics
    return (m.topProducts?.length > 0) || (m.topCustomers?.length > 0) || (m.topStaff?.length > 0)
})

// Tự động chọn tab đầu tiên có dữ liệu
watch(() => insightData.value?.metrics, (metrics) => {
    if (!metrics) return
    if (metrics.topProducts?.length > 0) {
        activeTab.value = 'products'
    } else if (metrics.topCustomers?.length > 0) {
        activeTab.value = 'customers'
    } else if (metrics.topStaff?.length > 0) {
        activeTab.value = 'staff'
    }
}, { immediate: true })

const metricItems = computed(() => {
    if (!insightData.value?.metrics) return []
    const m = insightData.value.metrics
    return [
        {
            key: 'totalOrders',
            label: 'Tổng đơn hàng',
            value: formatNumber(m.totalOrders),
            icon: 'bi bi-receipt',
            variant: 'metric-item--primary',
            valueClass: ''
        },
        {
            key: 'paidOrders',
            label: 'Đơn đã thanh toán',
            value: formatNumber(m.paidOrders),
            icon: 'bi bi-check-circle',
            variant: 'metric-item--success',
            valueClass: 'text-success'
        },
        {
            key: 'cancelledOrders',
            label: 'Đơn đã hủy',
            value: formatNumber(m.cancelledOrders),
            icon: 'bi bi-x-circle',
            variant: 'metric-item--danger',
            valueClass: 'text-danger'
        },
        {
            key: 'totalRevenue',
            label: 'Tổng doanh thu',
            value: formatCurrency(m.totalRevenue),
            icon: 'bi bi-cash-coin',
            variant: 'metric-item--primary',
            valueClass: 'text-primary'
        },
        {
            key: 'averageOrderValue',
            label: 'Giá trị đơn trung bình',
            value: formatCurrency(m.averageOrderValue),
            icon: 'bi bi-graph-up',
            variant: 'metric-item--indigo',
            valueClass: ''
        },
        {
            key: 'totalDiscount',
            label: 'Tổng giảm giá',
            value: formatCurrency(m.totalDiscount),
            icon: 'bi bi-ticket-perforated',
            variant: 'metric-item--warning',
            valueClass: 'text-warning'
        },
        {
            key: 'voucherUsageCount',
            label: 'Sử dụng Voucher',
            value: formatNumber(m.voucherUsageCount),
            icon: 'bi bi-tags',
            variant: 'metric-item--violet',
            valueClass: ''
        }
    ]
})

const formatMarkdown = (markdown) => {
    if (!markdown) return ''

    // Chuyển đổi markdown sang HTML
    let html = markdown
        // Tiêu đề
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // In đậm
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        // In nghiêng
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        // Danh sách
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        // Xuống dòng
        .replace(/\n\n/gim, '</p><p>')
        .replace(/\n/gim, '<br>')

    // Bao bọc các mục danh sách
    html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>')

    // Bao bọc đoạn văn
    if (!html.startsWith('<')) {
        html = `<p>${html}</p>`
    }

    // Sanitize HTML để ngăn chặn XSS
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'strong', 'em', 'ul', 'li', 'br', 'ol'],
        ALLOWED_ATTR: []
    })
}

const generateInsight = async () => {
    if (!isFormValid.value) {
        validationError.value = 'Vui lòng điền đầy đủ thông tin bắt buộc.'
        return
    }

    if (new Date(filters.from) > new Date(filters.to)) {
        validationError.value = 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.'
        return
    }

    validationError.value = ''
    generating.value = true
    error.value = ''
    insightData.value = null

    try {
        // Lấy dữ liệu doanh thu và lợi nhuận cho biểu đồ
        await fetchRevenueData()

        const data = await generateAdminInsight({
            from: filters.from,
            to: filters.to,
            question: filters.question.trim(),
            includeTopProducts: filters.includeTopProducts,
            includeVoucherStats: filters.includeVoucherStats,
            includeCustomerStats: filters.includeCustomerStats
        })

        insightData.value = data
        aiError.value = ''
        toast.success('Đã tạo phân tích AI thành công!')
    } catch (err) {
        const errorMsg = err.response?.data?.message || 'Không thể tạo phân tích AI. Vui lòng thử lại.'
        aiError.value = errorMsg
        error.value = errorMsg
        toast.error(errorMsg)
    } finally {
        generating.value = false
    }
}

const copyInsight = async () => {
    if (!insightData.value?.aiInsightMarkdown) return

    try {
        await navigator.clipboard.writeText(insightData.value.aiInsightMarkdown)
        toast.success('Đã copy phân tích AI vào clipboard!')
    } catch (error) {
        toast.error('Không thể copy phân tích AI.')
    }
}

const resetForm = () => {
    filters.from = ''
    filters.to = ''
    filters.question = ''
    filters.includeTopProducts = true
    filters.includeVoucherStats = true
    filters.includeCustomerStats = true
    validationError.value = ''
    error.value = ''
    aiError.value = ''
    insightData.value = null
    showPromptTemplates.value = false
    activeTab.value = 'products'
}

const promptTemplates = [
    {
        icon: 'bi bi-trending-up',
        title: 'Phân tích Xu hướng Bán hàng',
        description: 'Phân tích chi tiết xu hướng bán hàng, doanh thu theo thời gian, và dự đoán tương lai',
        prompt: 'Phân tích chi tiết xu hướng bán hàng trong khoảng thời gian này. Hãy xác định: (1) Xu hướng doanh thu theo ngày/tuần, (2) Các điểm cao/thấp bất thường và nguyên nhân, (3) So sánh với các kỳ trước, (4) Dự đoán xu hướng 7-14 ngày tới, (5) Đề xuất chiến lược tối ưu hóa doanh thu dựa trên phân tích.'
    },
    {
        icon: 'bi bi-trophy',
        title: 'Phân tích Top Sản phẩm & Khách hàng',
        description: 'Xác định sản phẩm bán chạy, khách hàng VIP và đề xuất chiến lược marketing',
        prompt: 'Phân tích sâu về top sản phẩm và khách hàng: (1) Xác định top 10 sản phẩm bán chạy nhất và lý do, (2) Phân tích khách hàng VIP - đặc điểm, hành vi mua hàng, giá trị trọn đời, (3) Tìm mối tương quan giữa sản phẩm và khách hàng, (4) Đề xuất chiến lược cross-sell/upsell, (5) Gợi ý chương trình khuyến mãi tối ưu cho từng nhóm khách hàng.'
    },
    {
        icon: 'bi bi-cash-coin',
        title: 'Tối ưu Hóa Doanh thu & Lợi nhuận',
        description: 'Phân tích cơ cấu doanh thu, chi phí và đề xuất cách tăng lợi nhuận',
        prompt: 'Phân tích toàn diện về doanh thu và lợi nhuận: (1) Phân tích cơ cấu doanh thu theo sản phẩm, thời gian, kênh bán, (2) Xác định các sản phẩm/dịch vụ có margin cao nhất, (3) Phân tích hiệu quả sử dụng voucher - ROI, tác động đến doanh thu, (4) Tính toán điểm hòa vốn và đề xuất mục tiêu doanh thu, (5) Đề xuất 5-7 hành động cụ thể để tăng lợi nhuận ít nhất 15% trong tháng tới.'
    },
    {
        icon: 'bi bi-people',
        title: 'Phân tích Hành vi Khách hàng',
        description: 'Hiểu rõ hành vi mua hàng, phân khúc khách hàng và đề xuất cá nhân hóa',
        prompt: 'Phân tích hành vi khách hàng chi tiết: (1) Phân khúc khách hàng theo giá trị, tần suất mua, sản phẩm yêu thích, (2) Xác định customer journey - các giai đoạn từ lần mua đầu đến khách hàng trung thành, (3) Phân tích churn rate và nguyên nhân khách hàng rời bỏ, (4) Xác định thời điểm vàng để upsell/cross-sell, (5) Đề xuất chiến lược retention và loyalty program tùy chỉnh cho từng segment.'
    },
    {
        icon: 'bi bi-graph-up-arrow',
        title: 'Dự đoán & Forecasting',
        description: 'Dự đoán doanh thu, nhu cầu sản phẩm và xu hướng tương lai',
        prompt: 'Thực hiện forecasting và dự đoán: (1) Dự đoán doanh thu 30 ngày tới dựa trên dữ liệu lịch sử và xu hướng, (2) Dự đoán nhu cầu sản phẩm để tối ưu inventory, (3) Xác định các rủi ro tiềm ẩn và cơ hội tăng trưởng, (4) Phân tích seasonality và chu kỳ kinh doanh, (5) Đề xuất kế hoạch hành động dựa trên dự đoán với timeline và KPI cụ thể.'
    },
    {
        icon: 'bi bi-lightning-charge',
        title: 'Phân tích Hiệu suất Nhân viên',
        description: 'Đánh giá hiệu suất nhân viên, top performers và đề xuất cải thiện',
        prompt: 'Phân tích hiệu suất nhân viên: (1) Xác định top performers và các best practices của họ, (2) Phân tích mối tương quan giữa số đơn xử lý và doanh thu tạo ra, (3) Xác định nhân viên cần training/coaching, (4) Đề xuất hệ thống incentive phù hợp, (5) Tạo action plan để nâng cao hiệu suất team với các mục tiêu SMART cụ thể.'
    },
    {
        icon: 'bi bi-tags',
        title: 'Tối ưu Chiến lược Voucher',
        description: 'Phân tích hiệu quả voucher, ROI và đề xuất chiến lược tối ưu',
        prompt: 'Phân tích chiến lược voucher: (1) Đánh giá ROI của từng loại voucher - voucher nào tạo doanh thu tốt nhất, (2) Phân tích hành vi sử dụng voucher - ai dùng, khi nào, sản phẩm nào, (3) Xác định optimal discount rate để tối đa hóa doanh thu và lợi nhuận, (4) Phân tích voucher abuse và đề xuất cách ngăn chặn, (5) Đề xuất chiến lược voucher mới với timing, target audience, và expected impact.'
    },
    {
        icon: 'bi bi-speedometer2',
        title: 'Phân tích Tổng thể Kinh doanh',
        description: 'Báo cáo tổng hợp toàn diện với insights và đề xuất hành động',
        prompt: 'Tạo báo cáo phân tích tổng thể kinh doanh: (1) Executive Summary - 3-5 insights quan trọng nhất, (2) Phân tích SWOT dựa trên dữ liệu thực tế, (3) Benchmarking - so sánh với industry standards và best practices, (4) Xác định 5-7 cơ hội tăng trưởng lớn nhất với potential impact, (5) Tạo action plan 30-60-90 ngày với priorities, owners, và success metrics. Format output như một strategic business report chuyên nghiệp.'
    },
    {
        icon: 'bi bi-shield-check',
        title: 'Phân tích Rủi ro & Cơ hội',
        description: 'Xác định rủi ro tiềm ẩn, cơ hội tăng trưởng và đề xuất mitigation',
        prompt: 'Phân tích rủi ro và cơ hội: (1) Xác định top 5 rủi ro tiềm ẩn với probability và impact, (2) Phân tích các điểm yếu trong operations và đề xuất cải thiện, (3) Xác định 5-7 cơ hội tăng trưởng lớn nhất với ROI estimate, (4) Đề xuất risk mitigation strategies với timeline, (5) Tạo opportunity roadmap với quick wins và long-term initiatives. Prioritize dựa trên effort vs impact matrix.'
    },
    {
        icon: 'bi bi-gear',
        title: 'Tối ưu Hóa Operations',
        description: 'Phân tích quy trình, bottleneck và đề xuất cải thiện hiệu quả',
        prompt: 'Phân tích và tối ưu operations: (1) Xác định bottlenecks trong quy trình bán hàng và xử lý đơn, (2) Phân tích thời gian xử lý đơn trung bình và đề xuất cải thiện, (3) Xác định các sản phẩm có inventory turnover thấp và đề xuất action, (4) Phân tích peak hours và đề xuất staffing optimization, (5) Đề xuất automation opportunities để giảm manual work và tăng accuracy. Include cost-benefit analysis cho mỗi đề xuất.'
    }
]

const selectPrompt = (template) => {
    filters.question = template.prompt
    showPromptTemplates.value = false
    toast.success(`Đã chọn prompt: ${template.title}`)
}

const VIBRANT_PALETTE = ['#2563eb', '#f97316', '#22c55e', '#facc15', '#ec4899', '#9333ea', '#0ea5e9', '#ef4444', '#14b8a6', '#8b5cf6']

const baseLabelStyle = computed(() => ({
    colors: isDark.value ? '#cbd5f5' : '#64748b',
    fontSize: '12px'
}))

// Lấy dữ liệu doanh thu từ API
const fetchRevenueData = async () => {
    if (!filters.from || !filters.to) {
        revenueData.value = null
        profitData.value = null
        return
    }

    try {
        const [revenue, profit] = await Promise.all([
            getRevenueByDate(filters.from, filters.to),
            getProfitReport(filters.from, filters.to)
        ])
        revenueData.value = revenue
        profitData.value = profit
    } catch (err) {
        logger.error('Không thể tải dữ liệu doanh thu/lợi nhuận:', err)
        revenueData.value = null
        profitData.value = null
    }
}

// Generate daily revenue data from API
const generateDailyRevenue = () => {
    if (!revenueData.value?.entries || revenueData.value.entries.length === 0) {
        return []
    }

    return revenueData.value.entries.map(entry => ({
        date: new Date(entry.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        revenue: entry.value || 0
    }))
}

// Generate daily profit data from API
const generateDailyProfit = () => {
    if (!profitData.value?.entries || profitData.value.entries.length === 0) {
        return []
    }

    return profitData.value.entries.map(entry => ({
        date: new Date(entry.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        profit: entry.profit || 0
    }))
}

const revenueChartOptions = computed(() => ({
    chart: {
        type: 'area',
        height: 350,
        toolbar: { show: false },
        foreColor: isDark.value ? '#e2e8f0' : '#475569',
        background: 'transparent',
        zoom: { enabled: false }
    },
    stroke: { curve: 'smooth', width: 3 },
    dataLabels: { enabled: false },
    colors: [VIBRANT_PALETTE[0], VIBRANT_PALETTE[2]],
    grid: {
        strokeDashArray: 4,
        borderColor: isDark.value ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.35)',
        padding: { top: 16, bottom: 40, left: 20, right: 20 },
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: true } }
    },
    xaxis: {
        categories: generateDailyRevenue().map(d => d.date),
        labels: {
            style: { ...baseLabelStyle.value },
            rotate: -45,
            rotateAlways: true,
            maxHeight: 60,
            offsetY: 5
        },
        axisBorder: {
            color: isDark.value ? 'rgba(148, 163, 184, 0.28)' : 'rgba(203, 213, 225, 0.6)'
        },
        axisTicks: {
            color: isDark.value ? 'rgba(148, 163, 184, 0.28)' : 'rgba(203, 213, 225, 0.6)'
        }
    },
    yaxis: {
        labels: {
            style: { ...baseLabelStyle.value },
            formatter: (value) => formatCurrency(value),
            maxWidth: 80
        }
    },
    legend: {
        position: 'top',
        horizontalAlign: 'right',
        labels: { colors: isDark.value ? '#cbd5f5' : '#475569' },
        offsetY: -10,
        itemMargin: {
            horizontal: 10,
            vertical: 5
        }
    },
    tooltip: {
        theme: isDark.value ? 'dark' : 'light',
        y: {
            formatter: (value) => formatCurrency(value)
        }
    },
    fill: {
        type: 'gradient',
        gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.4,
            opacityTo: 0.1,
            stops: [0, 90, 100]
        }
    }
}))

const revenueChartSeries = computed(() => {
    const dailyRevenue = generateDailyRevenue()
    const dailyProfit = generateDailyProfit()

    // Map profit data to match revenue dates
    const profitMap = new Map(dailyProfit.map(d => [d.date, d.profit]))

    return [
        {
            name: 'Doanh thu',
            data: dailyRevenue.map(d => d.revenue)
        },
        {
            name: 'Lợi nhuận',
            data: dailyRevenue.map(d => profitMap.get(d.date) || 0)
        }
    ]
})

const topProductsChartOptions = computed(() => ({
    chart: {
        type: 'donut',
        toolbar: { show: false },
        foreColor: isDark.value ? '#e2e8f0' : '#475569',
        background: 'transparent'
    },
    labels: insightData.value?.metrics?.topProducts?.slice(0, 5).map(p => p.productName) || [],
    colors: VIBRANT_PALETTE,
    legend: {
        position: 'bottom',
        labels: { colors: isDark.value ? '#cbd5f5' : '#475569' }
    },
    tooltip: {
        theme: isDark.value ? 'dark' : 'light',
        y: {
            formatter: (value) => formatCurrency(value)
        }
    },
    dataLabels: {
        formatter: (val) => `${val.toFixed(1)}%`
    }
}))

const topProductsChartSeries = computed(() =>
    insightData.value?.metrics?.topProducts?.slice(0, 5).map(p => p.totalRevenue) || []
)

const orderStatusChartOptions = computed(() => ({
    chart: {
        type: 'bar',
        toolbar: { show: false },
        foreColor: isDark.value ? '#e2e8f0' : '#475569',
        background: 'transparent',
        horizontal: true
    },
    colors: ['#22c55e', '#f97316', '#ef4444'],
    plotOptions: {
        bar: {
            barHeight: '60%',
            columnWidth: '60%',
            borderRadius: 4,
            dataLabels: {
                position: 'center'
            }
        }
    },
    grid: {
        strokeDashArray: 4,
        borderColor: isDark.value ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.35)',
        padding: { top: 8, bottom: 8, left: 12, right: 12 }
    },
    xaxis: {
        categories: ['Đã thanh toán', 'Đang xử lý', 'Đã hủy'],
        labels: { style: { ...baseLabelStyle.value } }
    },
    yaxis: {
        labels: {
            style: { ...baseLabelStyle.value },
            formatter: (value) => formatNumber(value)
        }
    },
    tooltip: {
        theme: isDark.value ? 'dark' : 'light',
        y: {
            formatter: (value) => formatNumber(value)
        }
    },
    dataLabels: {
        enabled: true,
        formatter: (val) => formatNumber(val)
    }
}))

const orderStatusChartSeries = computed(() => [{
    name: 'Số lượng',
    data: [
        insightData.value?.metrics?.paidOrders || 0,
        (insightData.value?.metrics?.totalOrders || 0) - (insightData.value?.metrics?.paidOrders || 0) - (insightData.value?.metrics?.cancelledOrders || 0),
        insightData.value?.metrics?.cancelledOrders || 0
    ]
}])
</script>

<style scoped>
/* Admin Analytics Page - Chuẩn hóa theo base.css */
.admin-analytics-page {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
}


/* Error Message - không dùng alert */
.error-message {
    padding: var(--spacing-3) var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-warning);
    background: var(--color-soft-amber);
    color: var(--color-warning);
    font-size: var(--font-size-base);
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.error-message i {
    font-size: 18px;
    line-height: 1;
}

/* Filter Card - Chuẩn hóa theo base.css */
.filter-card {
    margin-bottom: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.filter-section {
    padding-bottom: var(--spacing-4);
    margin-bottom: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
}

.filter-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
}

.filter-section__title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-3);
    display: flex;
    align-items: center;
    font-family: var(--font-family-sans);
}

.filter-card :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.filter-card :global(.form-label) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-control),
.filter-card :global(.form-select) {
    height: 40px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    background: var(--color-card);
    color: var(--color-heading);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-control:focus),
.filter-card :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.filter-card :global(.input-group-text) {
    height: 40px;
    background: var(--color-card-muted);
    border-color: var(--color-border);
    color: var(--color-text-muted);
    padding: var(--spacing-2) var(--spacing-3);
}

.filter-card :global(.input-group-text i) {
    font-size: 18px;
    line-height: 1;
}

.filter-card :global(.input-group .btn-outline-secondary) {
    border-color: var(--color-border);
    color: var(--color-heading);
    background: transparent;
}

.filter-card :global(.input-group .btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.filter-card :global(.form-check-label) {
    font-size: var(--font-size-base);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.filter-card :global(.btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.filter-card :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.filter-card :global(.btn-primary:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

.filter-card :global(.btn-primary i) {
    font-size: 18px;
    line-height: 1;
}

/* Prompt Templates - Chuẩn hóa */
.prompt-templates {
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-4);
    max-height: 500px;
    overflow-y: auto;
    margin-top: var(--spacing-3);
}

.prompt-templates__header h6 {
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-2);
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.prompt-templates__header h6 i {
    font-size: 18px;
    line-height: 1;
}

.prompt-templates__list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.prompt-template-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--transition-base);
    text-align: left;
    width: 100%;
}

.prompt-template-item:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

.prompt-template-item__icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    background: var(--color-soft-primary);
    color: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
}

.prompt-template-item__content {
    flex: 1;
    min-width: 0;
}

.prompt-template-item__content strong {
    display: block;
    color: var(--color-heading);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.prompt-template-item__content small {
    display: block;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.prompt-template-item__arrow {
    color: var(--color-text-muted);
    font-size: 18px;
    flex-shrink: 0;
    transition: transform var(--transition-base);
}

.prompt-template-item:hover .prompt-template-item__arrow {
    transform: translateX(4px);
    color: var(--color-primary);
}

/* Cards - Chuẩn hóa theo base.css */
.insight-card,
.metrics-card,
.admin-analytics-page :global(.card) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    margin-bottom: var(--spacing-4);
}

.admin-analytics-page :global(.card-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
}

.admin-analytics-page :global(.card-header h5) {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

.admin-analytics-page :global(.card-header h5 i) {
    font-size: 18px;
    line-height: 1;
}

.admin-analytics-page :global(.card-header .text-muted) {
    font-family: var(--font-family-sans);
}

.admin-analytics-page :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.admin-analytics-page :global(.card-footer) {
    padding: var(--spacing-4);
    background: var(--color-card);
    border-top: 1px solid var(--color-border);
    border-radius: 0 0 var(--radius-sm) var(--radius-sm);
}

/* Tabs Styling */
.admin-analytics-page :global(.nav-tabs) {
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 0;
}

.admin-analytics-page :global(.nav-tabs .nav-link) {
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--color-text-muted);
    padding: var(--spacing-3) var(--spacing-4);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.admin-analytics-page :global(.nav-tabs .nav-link:hover) {
    border-bottom-color: var(--color-border-strong);
    color: var(--color-heading);
}

.admin-analytics-page :global(.nav-tabs .nav-link.active) {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
    background: transparent;
}

.admin-analytics-page :global(.tab-content) {
    padding-top: var(--spacing-3);
}

.admin-analytics-page :global(.card-header .btn) {
    padding: var(--spacing-1) var(--spacing-3);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.admin-analytics-page :global(.card-header .btn-outline-primary) {
    border-color: var(--color-border);
    color: var(--color-heading);
    background: transparent;
}

.admin-analytics-page :global(.card-header .btn-outline-primary:hover:not(:disabled)) {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

/* AI Insight Content - Chuẩn hóa */
.ai-insight-content {
    line-height: var(--line-height-base);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.ai-insight-content :deep(h1),
.ai-insight-content :deep(h2),
.ai-insight-content :deep(h3) {
    margin-top: var(--spacing-4);
    margin-bottom: var(--spacing-2);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.ai-insight-content :deep(h1) {
    font-size: var(--font-size-xl);
}

.ai-insight-content :deep(h2) {
    font-size: var(--font-size-lg);
}

.ai-insight-content :deep(h3) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
}

.ai-insight-content :deep(p) {
    margin-bottom: var(--spacing-3);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.ai-insight-content :deep(ul) {
    margin-left: var(--spacing-4);
    margin-bottom: var(--spacing-3);
    padding-left: var(--spacing-4);
}

.ai-insight-content :deep(li) {
    margin-bottom: var(--spacing-2);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.ai-insight-content :deep(strong) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

/* Metrics Summary - Chuẩn hóa theo base.css */
.metrics-summary {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.metric-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    transition: all var(--transition-base);
    position: relative;
    overflow: hidden;
}

.metric-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: currentColor;
    opacity: 0;
    transition: opacity var(--transition-base);
}

.metric-item--primary::before {
    background: var(--color-primary);
}

.metric-item--success::before {
    background: var(--color-success);
}

.metric-item--danger::before {
    background: var(--color-danger);
}

.metric-item--warning::before {
    background: var(--color-warning);
}

.metric-item--indigo::before,
.metric-item--violet::before {
    background: var(--color-info);
}

.metric-item:hover {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
}

.metric-item:hover::before {
    opacity: 0.7;
}

.metric-item__icon {
    width: 52px;
    height: 52px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.375rem;
    flex-shrink: 0;
    transition: transform var(--transition-base);
}

.metric-item:hover .metric-item__icon {
    transform: scale(1.05);
}

/* Màu icon - dùng var(--color-soft-*) */
.metric-item--primary .metric-item__icon {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.metric-item--success .metric-item__icon {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.metric-item--danger .metric-item__icon {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.metric-item--warning .metric-item__icon {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.metric-item--indigo .metric-item__icon {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.metric-item--violet .metric-item__icon {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.metric-item__content {
    flex: 1;
    min-width: 0;
}

.metric-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
    letter-spacing: 0.01em;
    line-height: 1.4;
}

.metric-value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    line-height: 1.3;
    letter-spacing: -0.01em;
    color: var(--color-heading);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

/* Tables - Minimal Table Styling */
.admin-analytics-page :global(.table) {
    margin-bottom: 0;
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
}

.admin-analytics-page :global(.table thead th) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    background: var(--color-card-muted);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-3);
    vertical-align: middle;
    font-family: var(--font-family-sans);
}

.admin-analytics-page :global(.table tbody td) {
    font-size: var(--font-size-base);
    padding: var(--spacing-3);
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
    font-family: var(--font-family-sans);
}

.admin-analytics-page :global(.table tbody tr:last-child td) {
    border-bottom: none;
}

.admin-analytics-page :global(.table tbody tr:hover) {
    background: var(--color-card-muted);
}

.admin-analytics-page :global(.table tbody strong) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

/* Responsive cho Admin Analytics Page */
@media (max-width: 992px) {
    .metric-item {
        flex-direction: column;
        text-align: center;
    }

    .metric-item__icon {
        width: 48px;
        height: 48px;
        font-size: 20px;
    }
}

@media (max-width: 768px) {
    .admin-analytics-page {
        padding: var(--spacing-3);
    }

    .admin-analytics-header {
        padding: var(--spacing-3);
    }

    .prompt-templates {
        max-height: 400px;
    }
}
</style>

