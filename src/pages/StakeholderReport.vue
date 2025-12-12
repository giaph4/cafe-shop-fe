<template>
  <div
    class="stakeholder-report-page page-container container-fluid"
    data-aos="fade-up"
  >
    <PageHeader
      title="Báo cáo tổng hợp cho Stakeholders"
      subtitle="Tự động tạo báo cáo chuyên nghiệp cho nhà đầu tư và các bên liên quan"
    >
      <template #actions>
        <button
          v-if="!hasReport"
          class="btn btn-flat btn-flat--primary"
          @click="showReportBuilder"
        >
          <i class="bi bi-file-earmark-text me-2" />
          Tạo báo cáo mới
        </button>
        <div
          v-else
          class="d-flex gap-2"
        >
          <button
            class="btn btn-flat btn-flat--outline"
            :disabled="exportingPDF"
            @click="handleExportPDF"
          >
            <span
              v-if="exportingPDF"
              class="spinner-border spinner-border-sm me-2"
            />
            <i
              v-else
              class="bi bi-file-pdf me-2"
            />
            Xuất PDF
          </button>
          <button
            class="btn btn-flat btn-flat--outline"
            :disabled="exportingExcel"
            @click="handleExportExcel"
          >
            <span
              v-if="exportingExcel"
              class="spinner-border spinner-border-sm me-2"
            />
            <i
              v-else
              class="bi bi-file-excel me-2"
            />
            Xuất Excel
          </button>
          <button
            class="btn btn-flat btn-flat--outline"
            @click="showReportBuilder"
          >
            <i class="bi bi-arrow-clockwise me-2" />
            Tạo lại
          </button>
        </div>
      </template>
    </PageHeader>

    <ReportBuilder
      ref="reportBuilderRef"
      :config="reportConfig"
      :loading="loading"
      @generate="handleGenerateReport"
    />

    <LoadingState
      v-if="loading"
      text="Đang tạo báo cáo tổng hợp..."
    />
    <ErrorState
      v-else-if="error"
      :message="error"
      @retry="handleRetry"
    />

    <div
      v-else-if="reportData"
      class="report-content"
    >
      <div class="row g-4 mb-4">
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--primary">
            <div class="kpi-card__icon">
              <i class="bi bi-currency-dollar" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Tổng doanh thu
              </div>
              <div class="kpi-card__value">
                {{ formatCurrency(reportData.financialPerformance?.revenue || 0) }}
              </div>
              <div class="kpi-card__subtitle">
                {{ formatPeriod(reportData.period) }}
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--success">
            <div class="kpi-card__icon">
              <i class="bi bi-graph-up-arrow" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Lợi nhuận
              </div>
              <div class="kpi-card__value">
                {{ formatCurrency(reportData.financialPerformance?.profit || 0) }}
              </div>
              <div class="kpi-card__subtitle">
                Biên lợi nhuận: {{ reportData.financialPerformance?.profitMargin?.toFixed(1) || 0 }}%
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--info">
            <div class="kpi-card__icon">
              <i class="bi bi-cart-check" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Tổng đơn hàng
              </div>
              <div class="kpi-card__value">
                {{ formatNumber(reportData.operationalMetrics?.totalOrders || 0) }}
              </div>
              <div class="kpi-card__subtitle">
                Giá trị TB: {{ formatCurrency(reportData.operationalMetrics?.averageOrderValue || 0) }}
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--success">
            <div class="kpi-card__icon">
              <i class="bi bi-people" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Tổng khách hàng
              </div>
              <div class="kpi-card__value">
                {{ formatNumber(reportData.operationalMetrics?.totalCustomers || 0) }}
              </div>
              <div class="kpi-card__subtitle">
                Khách mới: {{ formatNumber(reportData.operationalMetrics?.newCustomers || 0) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReportSection
        v-if="reportData.executiveSummary"
        title="Tóm tắt điều hành"
      >
        <div class="executive-summary">
          <p class="summary-overview">
            {{ reportData.executiveSummary.overview }}
          </p>
          <div class="row g-3">
            <div class="col-md-6">
              <h6 class="section-subtitle">
                Điểm nổi bật
              </h6>
              <ul class="highlights-list">
                <li
                  v-for="(highlight, index) in reportData.executiveSummary.keyHighlights"
                  :key="index"
                >
                  {{ highlight }}
                </li>
              </ul>
            </div>
            <div class="col-md-6">
              <h6 class="section-subtitle">
                Khuyến nghị
              </h6>
              <ul class="recommendations-list">
                <li
                  v-for="(recommendation, index) in reportData.executiveSummary.recommendations"
                  :key="index"
                >
                  {{ recommendation }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </ReportSection>

      <ReportSection
        v-if="reportData.financialPerformance"
        title="Hiệu suất tài chính"
      >
        <div class="financial-performance">
          <div class="row g-4 mb-4">
            <div class="col-md-4">
              <div class="metric-box">
                <div class="metric-label">
                  Doanh thu
                </div>
                <div class="metric-value text-primary">
                  {{ formatCurrency(reportData.financialPerformance.revenue) }}
                </div>
                <div class="metric-change">
                  <i class="bi bi-arrow-up-circle text-success me-1" />
                  Tăng {{ reportData.financialPerformance.growthRate?.toFixed(1) || 0 }}%
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="metric-box">
                <div class="metric-label">
                  Lợi nhuận
                </div>
                <div class="metric-value text-success">
                  {{ formatCurrency(reportData.financialPerformance.profit) }}
                </div>
                <div class="metric-change">
                  Biên lợi nhuận: {{ reportData.financialPerformance.profitMargin?.toFixed(1) || 0 }}%
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="metric-box">
                <div class="metric-label">
                  Chi phí
                </div>
                <div class="metric-value">
                  {{ formatCurrency(reportData.financialPerformance.expenses) }}
                </div>
                <div class="metric-change">
                  Tỷ lệ: {{ ((reportData.financialPerformance.expenses / reportData.financialPerformance.revenue) *
                    100).toFixed(1) }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </ReportSection>

      <ReportSection
        v-if="reportData.operationalMetrics"
        title="Chỉ số vận hành"
      >
        <div class="table-responsive">
          <table class="table table-minimal">
            <thead>
              <tr>
                <th>Chỉ số</th>
                <th>Giá trị</th>
                <th>Mô tả</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Tổng đơn hàng</td>
                <td class="fw-semibold">
                  {{ formatNumber(reportData.operationalMetrics.totalOrders) }}
                </td>
                <td>Tổng số đơn hàng trong kỳ</td>
              </tr>
              <tr>
                <td>Giá trị đơn hàng trung bình</td>
                <td class="fw-semibold">
                  {{ formatCurrency(reportData.operationalMetrics.averageOrderValue) }}
                </td>
                <td>Giá trị trung bình mỗi đơn hàng</td>
              </tr>
              <tr>
                <td>Tổng khách hàng</td>
                <td class="fw-semibold">
                  {{ formatNumber(reportData.operationalMetrics.totalCustomers) }}
                </td>
                <td>Tổng số khách hàng trong kỳ</td>
              </tr>
              <tr>
                <td>Khách hàng mới</td>
                <td class="fw-semibold text-success">
                  {{ formatNumber(reportData.operationalMetrics.newCustomers) }}
                </td>
                <td>Số khách hàng mới trong kỳ</td>
              </tr>
              <tr>
                <td>Khách hàng quay lại</td>
                <td class="fw-semibold text-primary">
                  {{ formatNumber(reportData.operationalMetrics.repeatCustomers) }}
                </td>
                <td>Số khách hàng quay lại</td>
              </tr>
              <tr>
                <td>Tỷ lệ hủy đơn</td>
                <td
                  class="fw-semibold"
                  :class="reportData.operationalMetrics.cancellationRate > 5 ? 'text-danger' : 'text-warning'"
                >
                  {{ reportData.operationalMetrics.cancellationRate?.toFixed(1) || 0 }}%
                </td>
                <td>Tỷ lệ đơn hàng bị hủy</td>
              </tr>
            </tbody>
          </table>
        </div>
      </ReportSection>

      <ReportSection
        v-if="reportData.productPerformance && reportData.productPerformance.length > 0"
        title="Hiệu suất sản phẩm"
      >
        <div class="table-responsive">
          <table class="table table-minimal">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Số lượng</th>
                <th>Doanh thu</th>
                <th>Lợi nhuận</th>
                <th>Biên lợi nhuận</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="product in reportData.productPerformance"
                :key="product.productId"
              >
                <td class="fw-semibold">
                  {{ product.productName }}
                </td>
                <td>{{ formatNumber(product.quantity) }}</td>
                <td>{{ formatCurrency(product.revenue) }}</td>
                <td class="text-success">
                  {{ formatCurrency(product.profit) }}
                </td>
                <td>
                  <span
                    class="badge badge-soft"
                    :class="product.profitMargin >= 50 ? 'badge-success' : product.profitMargin >= 40 ? 'badge-warning' : 'badge-danger'"
                  >
                    {{ product.profitMargin?.toFixed(1) || 0 }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ReportSection>

      <ReportSection
        v-if="reportData.customerInsights && reportData.customerInsights.length > 0"
        title="Thông tin khách hàng"
      >
        <div class="table-responsive">
          <table class="table table-minimal">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Tổng đơn hàng</th>
                <th>Tổng chi tiêu</th>
                <th>Giá trị đơn TB</th>
                <th>Đơn hàng cuối</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="customer in reportData.customerInsights"
                :key="customer.customerId"
              >
                <td class="fw-semibold">
                  {{ customer.customerName }}
                </td>
                <td>{{ formatNumber(customer.totalOrders) }}</td>
                <td class="text-primary">
                  {{ formatCurrency(customer.totalSpent) }}
                </td>
                <td>{{ formatCurrency(customer.averageOrderValue) }}</td>
                <td>{{ formatDate(customer.lastOrderDate) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </ReportSection>

      <ReportSection
        v-if="reportData.staffPerformance && reportData.staffPerformance.length > 0"
        title="Hiệu suất nhân viên"
      >
        <div class="table-responsive">
          <table class="table table-minimal">
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Tổng đơn hàng</th>
                <th>Tổng doanh thu</th>
                <th>Giá trị đơn TB</th>
                <th>Hiệu suất</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="staff in reportData.staffPerformance"
                :key="staff.staffId"
              >
                <td class="fw-semibold">
                  {{ staff.staffName }}
                </td>
                <td>{{ formatNumber(staff.totalOrders) }}</td>
                <td class="text-primary">
                  {{ formatCurrency(staff.totalRevenue) }}
                </td>
                <td>{{ formatCurrency(staff.averageOrderValue) }}</td>
                <td>
                  <span
                    class="badge badge-soft"
                    :class="staff.efficiency >= 90 ? 'badge-success' : staff.efficiency >= 80 ? 'badge-warning' : 'badge-danger'"
                  >
                    {{ staff.efficiency }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ReportSection>

      <ReportSection
        v-if="reportData.trends"
        title="Xu hướng và dự báo"
      >
        <div class="trends-section">
          <div class="row g-4">
            <div class="col-md-6">
              <h6 class="section-subtitle">
                Xu hướng hiện tại
              </h6>
              <ul class="trends-list">
                <li>
                  <i class="bi bi-arrow-up-circle text-success me-2" />
                  Doanh thu: {{ reportData.trends.revenueTrend === 'increasing' ? 'Tăng' : 'Giảm' }}
                </li>
                <li>
                  <i class="bi bi-arrow-up-circle text-success me-2" />
                  Khách hàng: {{ reportData.trends.customerTrend === 'increasing' ? 'Tăng' : 'Giảm' }}
                </li>
                <li>
                  <i class="bi bi-arrow-up-circle text-success me-2" />
                  Đơn hàng: {{ reportData.trends.orderTrend === 'increasing' ? 'Tăng' : 'Giảm' }}
                </li>
              </ul>
            </div>
            <div class="col-md-6">
              <h6 class="section-subtitle">
                Dự báo tháng tới
              </h6>
              <div class="forecast-box">
                <div class="forecast-value">
                  {{ formatCurrency(reportData.trends.forecast?.nextMonthRevenue || 0) }}
                </div>
                <div class="forecast-confidence">
                  Độ tin cậy: {{ reportData.trends.forecast?.confidence || 0 }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </ReportSection>
    </div>

    <EmptyState
      v-else
      message="Nhấn 'Tạo báo cáo mới' để bắt đầu tạo báo cáo tổng hợp"
      icon="bi-file-earmark-text"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useStakeholderReportStore } from '@/store/stakeholderReport'
import ReportBuilder from '@/components/stakeholder-report/ReportBuilder.vue'
import ReportSection from '@/components/stakeholder-report/ReportSection.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters'
import logger from '@/utils/logger'

const store = useStakeholderReportStore()

const loading = computed(() => store.loading)
const error = computed(() => store.error)
const reportData = computed(() => store.reportData)
const reportConfig = computed(() => store.reportConfig)
const hasReport = computed(() => store.hasReport)

const exportingPDF = ref(false)
const exportingExcel = ref(false)
const reportBuilderRef = ref(null)

const handleGenerateReport = async (config) => {
    try {
        await store.generateReport(config)
    } catch (err) {
        logger.error('Không thể tạo báo cáo cổ đông:', err)
        // Lỗi đã được store xử lý
    }
}

const handleExportPDF = async () => {
    exportingPDF.value = true
    try {
        await store.exportToPDF()
    } catch (err) {
        logger.error('Không thể xuất PDF báo cáo cổ đông:', err)
        alert('Không thể xuất PDF. Vui lòng thử lại.')
    } finally {
        exportingPDF.value = false
    }
}

const handleExportExcel = async () => {
    exportingExcel.value = true
    try {
        await store.exportToExcel()
    } catch (err) {
        logger.error('Không thể xuất Excel báo cáo cổ đông:', err)
        alert('Không thể xuất Excel. Vui lòng thử lại.')
    } finally {
        exportingExcel.value = false
    }
}

const handleRetry = () => {
    if (reportConfig.value.startDate && reportConfig.value.endDate) {
        handleGenerateReport(reportConfig.value)
    }
}

const formatPeriod = (period) => {
    if (!period) return ''
    return `${formatDate(period.startDate)} - ${formatDate(period.endDate)}`
}

const showReportBuilder = async () => {
    await nextTick()
    if (reportBuilderRef.value) {
        reportBuilderRef.value.show()
    }
}

onMounted(() => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    store.reportConfig.startDate = startDate.toISOString().split('T')[0]
    store.reportConfig.endDate = endDate.toISOString().split('T')[0]
})
</script>

<style scoped>
/* ============================================
   PAGE CONTAINER - Chuẩn hóa theo Design System
   ============================================ */
.stakeholder-report-page {
  background: var(--color-body-bg);
  padding: var(--spacing-4);
  min-height: 100vh;
}

/* ============================================
   KPI CARDS - Chuẩn hóa theo Global Design System
   ============================================ */
.kpi-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--spacing-4);
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  transition: background-color var(--transition-fast), border-color var(--transition-fast);
  min-height: 120px;
  height: 100%;
}

.kpi-card:hover {
  background: var(--color-card-muted);
  border-color: var(--color-border-strong);
}

.kpi-card__icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
  transition: background-color var(--transition-fast);
}

.kpi-card--primary .kpi-card__icon {
  background: var(--color-soft-primary);
  color: var(--color-primary);
}

.kpi-card--success .kpi-card__icon {
  background: var(--color-soft-emerald);
  color: var(--color-success);
}

.kpi-card--info .kpi-card__icon {
  background: var(--color-soft-sky);
  color: var(--color-info);
}

.kpi-card__content {
  flex: 1;
  min-width: 0;
}

.kpi-card__label {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-2);
  line-height: var(--line-height-normal);
  font-family: var(--font-family-sans);
}

.kpi-card__value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-heading);
  line-height: var(--line-height-tight);
  font-family: var(--font-family-sans);
  margin-bottom: var(--spacing-1);
}

.kpi-card__subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-family: var(--font-family-sans);
  line-height: var(--line-height-normal);
}

/* ============================================
   EXECUTIVE SUMMARY - Chuẩn hóa
   ============================================ */
.executive-summary {
  font-family: var(--font-family-sans);
}

.summary-overview {
  font-size: var(--font-size-base);
  color: var(--color-text);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-4);
}

.section-subtitle {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-heading);
  margin-bottom: var(--spacing-3);
  font-family: var(--font-family-sans);
}

.highlights-list,
.recommendations-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.highlights-list li,
.recommendations-list li {
  padding: var(--spacing-2) 0;
  padding-left: var(--spacing-4);
  position: relative;
  font-size: var(--font-size-base);
  color: var(--color-text);
  line-height: var(--line-height-normal);
  font-family: var(--font-family-sans);
}

.highlights-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--color-success);
  font-weight: var(--font-weight-bold);
}

.recommendations-list li::before {
  content: '→';
  position: absolute;
  left: 0;
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
}

/* ============================================
   FINANCIAL PERFORMANCE - Chuẩn hóa
   ============================================ */
.metric-box {
  padding: var(--spacing-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-card);
  text-align: center;
}

.metric-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-2);
  font-family: var(--font-family-sans);
}

.metric-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-heading);
  margin-bottom: var(--spacing-2);
  font-family: var(--font-family-sans);
}

.metric-change {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-family: var(--font-family-sans);
}

/* ============================================
   TRENDS SECTION - Chuẩn hóa
   ============================================ */
.trends-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.trends-list li {
  padding: var(--spacing-2) 0;
  font-size: var(--font-size-base);
  color: var(--color-text);
  font-family: var(--font-family-sans);
}

.forecast-box {
  padding: var(--spacing-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-card);
  text-align: center;
}

.forecast-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-2);
  font-family: var(--font-family-sans);
}

.forecast-confidence {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-family: var(--font-family-sans);
}

/* ============================================
   BADGE STYLES - Chuẩn hóa
   ============================================ */
.badge-soft {
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-sans);
  border: 1px solid transparent;
  display: inline-block;
}

.badge-success {
  background: var(--color-soft-emerald);
  color: var(--color-success);
}

.badge-warning {
  background: var(--color-soft-amber);
  color: var(--color-warning);
}

.badge-danger {
  background: var(--color-soft-rose);
  color: var(--color-danger);
}

/* ============================================
   CONTENT ANIMATION - Minimal
   ============================================ */
.report-content {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* ============================================
   SPINNER - Chuẩn hóa
   ============================================ */
.spinner-border-sm {
  width: 1rem;
  height: 1rem;
  border-width: 0.15em;
  border-color: currentColor;
  border-right-color: transparent;
}

/* ============================================
   RESPONSIVE - Chuẩn hóa
   ============================================ */
@media (max-width: 768px) {
  .stakeholder-report-page {
    padding: var(--spacing-3);
  }

  .kpi-card {
    min-height: 100px;
    padding: var(--spacing-3);
    gap: var(--spacing-3);
  }

  .kpi-card__icon {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }

  .kpi-card__value {
    font-size: var(--font-size-lg);
  }
}
</style>
