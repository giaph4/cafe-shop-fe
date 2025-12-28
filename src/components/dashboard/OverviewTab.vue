<template>
  <div class="overview">
    <!-- Hero Metric + Secondary KPIs -->
    <div class="overview__hero-section">
      <!-- Hero Metric: Doanh thu hôm nay -->
      <div class="hero-metric">
        <div class="hero-metric__header">
          <div class="hero-metric__icon hero-metric__icon--primary">
            <i class="bi bi-cash-stack" />
          </div>
          <div class="hero-metric__meta">
            <span class="hero-metric__label">Doanh thu hôm nay</span>
            <div class="hero-metric__value">
              {{ formatCurrency(stats?.todayRevenue || 0) }}
            </div>
            <span
              v-if="salesComparison"
              class="hero-metric__change"
              :class="salesComparison.growthPercentage >= 0 ? 'hero-metric__change--positive' : 'hero-metric__change--negative'"
            >
              <i
                :class="salesComparison.growthPercentage >= 0 ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"
              />
              {{ Math.abs(salesComparison.growthPercentage || 0).toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Secondary KPIs Grid -->
      <div class="overview__secondary-kpis">
        <div
          v-for="metric in secondaryMetrics"
          :key="metric.key"
          class="kpi-card"
          :class="[`kpi-card--${metric.variant}`, { 'is-warning': metric.isWarning }]"
        >
          <div class="kpi-card__icon">
            <i :class="metric.icon" />
          </div>
          <div class="kpi-card__content">
            <span class="kpi-card__label">{{ metric.label }}</span>
            <strong class="kpi-card__value">{{ metric.display }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Collapsible Sections -->
    <div class="overview__sections">
      <!-- Revenue Chart Section -->
      <div class="section-card">
        <div
          class="section-card__header"
          @click="toggleSection('revenue')"
        >
          <div class="section-card__header-content">
            <div>
              <h5 class="section-card__title">
                {{ chartTitle }}
              </h5>
              <p class="section-card__subtitle">
                Biến động doanh thu trong giai đoạn đã chọn
              </p>
            </div>
            <button
              class="section-card__toggle"
              :class="{ 'section-card__toggle--expanded': expandedSections.revenue }"
            >
              <i class="bi bi-chevron-down" />
            </button>
          </div>
        </div>
        <Transition name="accordion">
          <div
            v-if="expandedSections.revenue"
            class="section-card__body"
          >
            <div
              class="chart-container"
              data-chart-type="revenue"
            >
              <ApexChart
                v-if="isMounted && revenueSeries && revenueSeries.length > 0 && revenueOptions"
                ref="revenueChartRef"
                type="bar"
                height="320"
                :series="revenueSeries"
                :options="enhancedRevenueOptions"
              />
              <div
                v-else
                class="chart-skeleton"
              >
                <SkeletonLoader
                  variant="rectangular"
                  height="320px"
                />
              </div>
            </div>
            <div class="chart-actions">
              <div class="btn-group">
                <button
                  class="btn-flat btn-flat--outline"
                  @click="handleExportChart('revenue', 'png')"
                  title="Xuất PNG"
                >
                  <i class="bi bi-image me-2" />
                  PNG
                </button>
                <button
                  class="btn-flat btn-flat--outline"
                  @click="handleExportChart('revenue', 'pdf')"
                  title="Xuất PDF"
                >
                  <i class="bi bi-file-pdf me-2" />
                  PDF
                </button>
                <button
                  class="btn-flat btn-flat--outline"
                  @click="handleExportChart('revenue', 'csv')"
                  title="Xuất CSV"
                >
                  <i class="bi bi-file-earmark-spreadsheet me-2" />
                  CSV
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Payment Methods Section -->
      <div class="section-card">
        <div
          class="section-card__header"
          @click="toggleSection('payment')"
        >
          <div class="section-card__header-content">
            <div>
              <h5 class="section-card__title">
                Phương thức thanh toán
              </h5>
              <p class="section-card__subtitle">
                Tỷ trọng đơn hàng theo kênh thanh toán
              </p>
            </div>
            <button
              class="section-card__toggle"
              :class="{ 'section-card__toggle--expanded': expandedSections.payment }"
            >
              <i class="bi bi-chevron-down" />
            </button>
          </div>
        </div>
        <Transition name="accordion">
          <div
            v-if="expandedSections.payment"
            class="section-card__body"
          >
            <div
              v-if="paymentStats && paymentStats.length"
              class="payment-list"
            >
              <div
                v-for="item in paymentStats"
                :key="item.paymentMethod"
                class="payment-item"
              >
                <div class="payment-item__left">
                  <span class="payment-item__method">{{ prettyMethod(item.paymentMethod) }}</span>
                  <span class="payment-item__orders">{{ item.orderCount }} đơn</span>
                </div>
                <div class="payment-item__right">
                  <strong>{{ formatCurrency(item.totalAmount) }}</strong>
                  <span
                    class="payment-badge"
                    :class="getPaymentBadgeClass(item.percentage)"
                  >
                    {{ item.percentage?.toFixed(1) ?? 0 }}%
                  </span>
                </div>
              </div>
            </div>
            <EmptyState
              v-else
              message="Chưa có thống kê thanh toán"
            />
          </div>
        </Transition>
      </div>

      <!-- Comparison Section -->
      <div class="section-card">
        <div
          class="section-card__header"
          @click="toggleSection('comparison')"
        >
          <div class="section-card__header-content">
            <div>
              <h5 class="section-card__title">
                So sánh với kỳ trước
              </h5>
              <p class="section-card__subtitle">
                Đo lường tăng trưởng doanh thu và số đơn hàng
              </p>
            </div>
            <button
              class="section-card__toggle"
              :class="{ 'section-card__toggle--expanded': expandedSections.comparison }"
            >
              <i class="bi bi-chevron-down" />
            </button>
          </div>
        </div>
        <Transition name="accordion">
          <div
            v-if="expandedSections.comparison"
            class="section-card__body"
          >
            <div
              v-if="salesComparison"
              class="comparison"
            >
              <div class="comparison__item">
                <span class="comparison__label">Doanh thu kỳ hiện tại</span>
                <strong class="comparison__value">{{ formatCurrency(salesComparison.currentRevenue) }}</strong>
              </div>
              <div class="comparison__item">
                <span class="comparison__label">Doanh thu kỳ trước</span>
                <strong class="comparison__value comparison__value--muted">{{ formatCurrency(salesComparison.previousRevenue) }}</strong>
              </div>
              <div class="comparison__item comparison__item--highlight">
                <span class="comparison__label">Tăng trưởng</span>
                <div class="comparison__growth">
                  <strong
                    class="comparison__value"
                    :class="salesComparison.growthAmount >= 0 ? 'comparison__value--success' : 'comparison__value--danger'"
                  >
                    {{ formatCurrency(salesComparison.growthAmount) }}
                  </strong>
                  <span
                    class="comparison__percentage"
                    :class="salesComparison.growthPercentage >= 0 ? 'comparison__percentage--success' : 'comparison__percentage--danger'"
                  >
                    {{ salesComparison.growthPercentage >= 0 ? '+' : '' }}{{ salesComparison.growthPercentage?.toFixed(2) ?? 0 }}%
                  </span>
                </div>
              </div>
              <div class="comparison__item">
                <span class="comparison__label">Số đơn</span>
                <div class="comparison__orders">
                  <strong class="comparison__value">{{ salesComparison.currentOrders }}</strong>
                  <span class="comparison__sub">Trước: {{ salesComparison.previousOrders }}</span>
                </div>
              </div>
            </div>
            <EmptyState
              v-else
              message="Chưa có dữ liệu so sánh"
            />
          </div>
        </Transition>
      </div>

      <!-- Quick Actions Section -->
      <div
        v-if="quickActions.length"
        class="section-card section-card--quick-actions"
      >
        <div
          class="section-card__header"
          @click="toggleSection('actions')"
        >
          <div class="section-card__header-content">
            <div>
              <h5 class="section-card__title">
                Thao tác nhanh
                <span
                  v-if="!expandedSections.actions"
                  class="section-card__badge"
                >
                  {{ quickActions.length }}
                </span>
              </h5>
              <p class="section-card__subtitle">
                Truy cập nhanh các nghiệp vụ quan trọng theo vai trò của bạn
              </p>
            </div>
            <button
              class="section-card__toggle"
              :class="{ 'section-card__toggle--expanded': expandedSections.actions }"
            >
              <i class="bi bi-chevron-down" />
            </button>
          </div>
        </div>
        <Transition name="accordion">
          <div
            v-if="expandedSections.actions"
            class="section-card__body"
          >
            <div class="quick-grid">
              <router-link
                v-for="action in quickActions"
                :key="action.id"
                class="quick-card"
                :to="action.to"
              >
                <div
                  class="quick-icon"
                  :class="action.variant"
                >
                  <i :class="action.icon" />
                </div>
                <div class="quick-body">
                  <h4>{{ action.title }}</h4>
                  <p>{{ action.description }}</p>
                </div>
                <span class="quick-arrow"><i class="bi bi-arrow-right" /></span>
              </router-link>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, nextTick } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { formatCurrency } from '@/utils/formatters'
import EmptyState from '@/components/common/EmptyState.vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
import { useAuthStore } from '@/store/auth'
import { useAccordionState } from '@/composables/useAccordionState'
import { exportChart, exportChartToPNG, exportChartToPDF } from '@/utils/chartExport'
import { exportChartDataToCSV } from '@/utils/csvExport'

const props = defineProps({
    stats: { type: Object, default: null },
    revenueSeries: { type: Array, default: () => [] },
    revenueOptions: { type: Object, default: () => ({}) },
    paymentStats: { type: Array, default: () => [] },
    salesComparison: { type: Object, default: null },
    chartGroupType: { type: String, default: 'day' }
})

const authStore = useAuthStore()
const ApexChart = VueApexCharts
const isMounted = ref(false)

// Expanded sections state với localStorage persistence
// Mặc định chỉ mở 1-2 sections quan trọng nhất
const { state: expandedSections, toggle: toggleSection } = useAccordionState('overview-tab', {
    revenue: true,
    payment: false,
    comparison: true,
    actions: false
})

onMounted(async () => {
    await nextTick()
    isMounted.value = true
})

const quickActions = computed(() => {
    const roles = authStore.userRoles ?? []
    const actions = []
    if (roles.includes('ROLE_ADMIN') || roles.includes('ROLE_MANAGER')) {
        actions.push(
            {
                id: 'new-order',
                title: 'Tạo đơn mới',
                description: 'Tạo đơn hàng mới tại quầy POS.',
                icon: 'bi bi-plus-circle-fill',
                variant: 'variant-success',
                to: '/pos'
            },
            {
                id: 'expenses',
                title: 'Thêm chi phí',
                description: 'Ghi nhận chi phí vận hành hàng ngày.',
                icon: 'bi bi-receipt-cutoff',
                variant: 'variant-primary',
                to: '/expenses'
            },
            {
                id: 'inventory',
                title: 'Nhập kho nhanh',
                description: 'Thêm nguyên liệu vào kho nhanh chóng.',
                icon: 'bi bi-box-arrow-in-down',
                variant: 'variant-info',
                to: '/inventory'
            },
            {
                id: 'customers',
                title: 'Thêm khách hàng',
                description: 'Đăng ký khách hàng mới vào hệ thống.',
                icon: 'bi bi-person-plus-fill',
                variant: 'variant-warning',
                to: '/customers'
            }
        )
    } else if (roles.includes('ROLE_STAFF')) {
        actions.push(
            {
                id: 'new-order',
                title: 'Tạo đơn mới',
                description: 'Tạo đơn hàng mới tại quầy POS.',
                icon: 'bi bi-plus-circle-fill',
                variant: 'variant-success',
                to: '/pos'
            }
        )
    }
    return actions
})

// Secondary metrics - chỉ 4 metrics quan trọng nhất
// Đơn giản hóa colors: dùng grayscale + 1 accent color (primary)
const secondaryMetrics = computed(() => {
    const s = props.stats || {}
    return [
        {
            key: 'todayOrders',
            label: 'Đơn hàng hôm nay',
            icon: 'bi bi-clipboard-check',
            variant: 'primary', // Chỉ dùng primary cho accent
            value: s.todayOrders ?? 0,
            display: (s.todayOrders ?? 0).toLocaleString('vi-VN')
        },
        {
            key: 'todayProfit',
            label: 'Lợi nhuận hôm nay',
            icon: 'bi bi-graph-up',
            variant: 'muted', // Grayscale
            value: s.todayProfit ?? 0,
            display: formatCurrency(s.todayProfit ?? 0)
        },
        {
            key: 'averageOrderValue',
            label: 'Giá trị đơn TB',
            icon: 'bi bi-receipt',
            variant: 'muted', // Grayscale
            value: s.averageOrderValue ?? 0,
            display: formatCurrency(s.averageOrderValue ?? 0)
        },
        {
            key: 'lowStockItems',
            label: 'Nguyên liệu sắp hết',
            icon: 'bi bi-exclamation-triangle',
            variant: 'muted', // Grayscale, nhưng sẽ highlight nếu > 0
            value: s.lowStockItems ?? 0,
            display: (s.lowStockItems ?? 0).toLocaleString('vi-VN'),
            isWarning: (s.lowStockItems ?? 0) > 0
        }
    ]
})

const prettyMethod = (method) => {
    if (!method) return 'Khác'
    return method.replace(/_/g, ' ')
}

const chartTitle = computed(() => {
    const groupType = props.chartGroupType || 'day'
    if (groupType === 'week') {
        return 'Doanh thu theo tuần'
    } else if (groupType === 'month') {
        return 'Doanh thu theo tháng'
    }
    return 'Doanh thu theo ngày'
})

// Enhanced chart options với tooltips và annotations (min, max, average, trends)
const enhancedRevenueOptions = computed(() => {
    const baseOptions = { ...props.revenueOptions }
    
    // Cải thiện tooltip
    baseOptions.tooltip = {
        ...baseOptions.tooltip,
        theme: 'light',
        style: {
            fontSize: '14px',
            fontFamily: 'var(--font-family-sans)'
        },
        y: {
            formatter: (val) => formatCurrency(val)
        },
        marker: {
            show: true
        }
    }
    
    // Thêm annotations cho insights (min, max, average, trends)
    if (props.revenueSeries?.[0]?.data?.length > 0) {
        const data = props.revenueSeries[0].data
        const maxValue = Math.max(...data)
        const minValue = Math.min(...data.filter(v => v > 0)) // Bỏ qua giá trị 0
        const avgValue = data.reduce((a, b) => a + b, 0) / data.length
        const maxIndex = data.indexOf(maxValue)
        const minIndex = data.indexOf(minValue)
        
        const annotations = {
            points: []
        }
        
        // Max point
        if (maxValue > 0) {
            annotations.points.push({
                x: maxIndex,
                y: maxValue,
                marker: {
                    size: 6,
                    fillColor: '#fff',
                    strokeColor: 'var(--color-primary)',
                    strokeWidth: 2,
                    radius: 2
                },
                label: {
                    text: `Cao nhất: ${formatCurrency(maxValue)}`,
                    style: {
                        color: '#fff',
                        background: 'var(--color-primary)',
                        fontSize: '12px',
                        padding: {
                            left: 5,
                            right: 5,
                            top: 2,
                            bottom: 2
                        }
                    }
                }
            })
        }
        
        // Min point (nếu khác max)
        if (minValue > 0 && minValue !== maxValue) {
            annotations.points.push({
                x: minIndex,
                y: minValue,
                marker: {
                    size: 5,
                    fillColor: '#fff',
                    strokeColor: 'var(--color-text-muted)',
                    strokeWidth: 1.5,
                    radius: 2
                },
                label: {
                    text: `Thấp nhất: ${formatCurrency(minValue)}`,
                    style: {
                        color: 'var(--color-text)',
                        background: 'var(--color-card-muted)',
                        fontSize: '11px',
                        padding: {
                            left: 4,
                            right: 4,
                            top: 2,
                            bottom: 2
                        }
                    }
                }
            })
        }
        
        // Average line
        annotations.yaxis = [{
            y: avgValue,
            borderColor: 'var(--color-text-muted)',
            borderWidth: 2,
            borderDashArray: 5,
            label: {
                text: `TB: ${formatCurrency(avgValue)}`,
                style: {
                    color: 'var(--color-text-muted)',
                    background: 'var(--color-card)',
                    fontSize: '11px',
                    padding: {
                        left: 4,
                        right: 4,
                        top: 2,
                        bottom: 2
                    }
                },
                position: 'right'
            }
        }]
        
        baseOptions.annotations = annotations
    }
    
    return baseOptions
})

// Chart refs for export
const revenueChartRef = ref(null)

// Export chart functionality
const handleExportChart = async (type, format = 'png') => {
    try {
        // Find chart element
        const chartContainer = document.querySelector(`.chart-container[data-chart-type="${type}"]`)
        if (!chartContainer) {
            throw new Error('Không tìm thấy biểu đồ để xuất')
        }
        
        // Get chart element (ApexCharts canvas)
        const chartElement = chartContainer.querySelector('.apexcharts-canvas') || chartContainer
        
        const filename = `doanh-thu-${type}-${new Date().toISOString().split('T')[0]}`
        
        if (format === 'csv') {
            // Export data to CSV
            if (props.revenueSeries?.[0]?.data && props.revenueOptions?.xaxis?.categories) {
                exportChartDataToCSV(
                    props.revenueSeries,
                    props.revenueOptions.xaxis.categories,
                    filename
                )
            } else {
                throw new Error('Không có dữ liệu để xuất CSV')
            }
        } else {
            // Export chart image
            await exportChart(chartElement, format, filename)
        }
    } catch (error) {
        console.error('Lỗi khi xuất biểu đồ:', error)
        alert(`Không thể xuất biểu đồ: ${error.message}`)
    }
}

// Payment badge color based on percentage
const getPaymentBadgeClass = (percentage) => {
    if (percentage >= 50) return 'payment-badge--primary'
    if (percentage >= 25) return 'payment-badge--info'
    return 'payment-badge--muted'
}
</script>

<style scoped>
/* ============================================
   OVERVIEW CONTAINER
   ============================================ */
.overview {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
}

/* ============================================
   HERO METRIC SECTION
   ============================================ */
.overview__hero-section {
    display: grid;
    grid-template-columns: 2fr 3fr;
    gap: var(--spacing-6);
}

.hero-metric {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-6);
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-base);
    position: relative;
    overflow: hidden;
}

.hero-metric::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: var(--color-primary);
    opacity: 0;
    transition: opacity var(--transition-base);
}

.hero-metric:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
}

.hero-metric:hover::before {
    opacity: 1;
}

.hero-metric__header {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-4);
}

.hero-metric__icon {
    width: 64px;
    height: 64px;
    border-radius: var(--radius-md);
    display: grid;
    place-items: center;
    font-size: 28px;
    flex-shrink: 0;
    transition: transform var(--transition-base);
}

.hero-metric__icon--primary {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.hero-metric:hover .hero-metric__icon {
    transform: scale(1.05) rotate(5deg);
}

.hero-metric__meta {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    flex: 1;
    min-width: 0;
}

.hero-metric__label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
    letter-spacing: 0.02em;
    text-transform: uppercase;
}

.hero-metric__value {
    font-size: 2rem;
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
    font-family: var(--font-family-sans);
    line-height: 1.2;
    letter-spacing: -0.02em;
}

.hero-metric__change {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-1);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.hero-metric__change--positive {
    color: var(--color-success);
    background: var(--color-soft-emerald);
}

.hero-metric__change--negative {
    color: var(--color-danger);
    background: var(--color-soft-rose);
}

/* ============================================
   SECONDARY KPIs
   ============================================ */
.overview__secondary-kpis {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-4);
}

.kpi-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-4);
    transition: all var(--transition-base);
    position: relative;
    overflow: hidden;
}

.kpi-card::before {
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

.kpi-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
    box-shadow: var(--shadow-sm);
    transform: translateY(-2px);
}

.kpi-card:hover::before {
    opacity: 1;
}

.kpi-card--primary::before {
    background: var(--color-primary);
}

.kpi-card--muted::before {
    background: var(--color-text-muted);
}

.kpi-card__icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    display: grid;
    place-items: center;
    font-size: 20px;
    flex-shrink: 0;
    transition: transform var(--transition-base);
}

.kpi-card--primary .kpi-card__icon {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.kpi-card--muted .kpi-card__icon {
    background: var(--color-card-muted);
    color: var(--color-text-muted);
}

.kpi-card--muted.is-warning .kpi-card__icon {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.kpi-card--muted.is-warning::before {
    background: var(--color-warning);
}

.kpi-card:hover .kpi-card__icon {
    transform: scale(1.1);
}

.kpi-card__content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    flex: 1;
    min-width: 0;
}

.kpi-card__label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
    line-height: 1.4;
}

.kpi-card__value {
    font-size: 1.5rem;
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    line-height: 1.3;
    letter-spacing: -0.01em;
}

/* ============================================
   COLLAPSIBLE SECTIONS
   ============================================ */
.overview__sections {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
}

.section-card {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    transition: box-shadow var(--transition-base);
    overflow: hidden;
}

.section-card:hover {
    box-shadow: var(--shadow-md);
}

.section-card__header {
    padding: var(--spacing-4) var(--spacing-5);
    cursor: pointer;
    user-select: none;
    transition: background-color var(--transition-base);
}

.section-card__header:hover {
    background: var(--color-card-muted);
}

.section-card__header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
}

.section-card__title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    margin: 0 0 var(--spacing-1) 0;
}

.section-card__subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
    margin: 0;
}

.section-card__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 var(--spacing-1);
    margin-left: var(--spacing-2);
    background: var(--color-primary);
    color: var(--color-text-inverse);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
}

.section-card--quick-actions .section-card__header {
    background: var(--color-soft-primary);
    border-bottom: 2px solid var(--color-primary);
}

.section-card__toggle {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    border-radius: var(--radius-sm);
    display: grid;
    place-items: center;
    cursor: pointer;
    transition: all var(--transition-base);
    flex-shrink: 0;
}

.section-card__toggle:hover {
    background: var(--color-card-muted);
    color: var(--color-heading);
}

.section-card__toggle i {
    font-size: 18px;
    transition: transform var(--transition-base);
}

.section-card__toggle--expanded i {
    transform: rotate(180deg);
}

.section-card__body {
    padding: 0 var(--spacing-5) var(--spacing-5);
}

/* Accordion transition */
.accordion-enter-active,
.accordion-leave-active {
    transition: all var(--transition-base);
    overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
}

.accordion-enter-to,
.accordion-leave-from {
    max-height: 1000px;
    opacity: 1;
}

/* ============================================
   CHART CONTAINER
   ============================================ */
.chart-container {
    margin-bottom: var(--spacing-4);
    border-radius: var(--radius-sm);
    overflow: hidden;
}

.chart-skeleton {
    height: 320px;
    border-radius: var(--radius-sm);
    overflow: hidden;
}

.chart-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-2);
    padding-top: var(--spacing-4);
    border-top: 1px solid var(--color-border);
}

.btn-group {
    display: inline-flex;
    gap: var(--spacing-1);
    border-radius: var(--radius-sm);
    overflow: hidden;
    border: 1px solid var(--color-border);
}

.btn-group .btn-flat {
    margin: 0;
    border-radius: 0;
    border: none;
    border-right: 1px solid var(--color-border);
}

.btn-group .btn-flat:last-child {
    border-right: none;
}

.btn-group .btn-flat:hover {
    background: var(--color-primary);
    color: var(--color-text-inverse);
}

/* ============================================
   PAYMENT LIST
   ============================================ */
.payment-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.payment-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-3);
    border-radius: var(--radius-sm);
    transition: background-color var(--transition-base);
}

.payment-item:hover {
    background: var(--color-card-muted);
}

.payment-item__left {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.payment-item__method {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.payment-item__orders {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.payment-item__right {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
}

.payment-badge {
    padding: var(--spacing-1) var(--spacing-3);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
}

.payment-badge--primary {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.payment-badge--info {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.payment-badge--muted {
    background: var(--color-card-muted);
    color: var(--color-text-muted);
}

/* ============================================
   COMPARISON
   ============================================ */
.comparison {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.comparison__item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    transition: background-color var(--transition-base);
}

.comparison__item:last-child {
    border-bottom: none;
}

.comparison__item:hover {
    background: var(--color-card-muted);
}

.comparison__item--highlight {
    background: var(--color-soft-primary);
    border-radius: var(--radius-sm);
    margin: var(--spacing-2) 0;
}

.comparison__label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.comparison__value {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.comparison__value--muted {
    color: var(--color-text-muted);
}

.comparison__value--success {
    color: var(--color-success);
}

.comparison__value--danger {
    color: var(--color-danger);
}

.comparison__growth {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--spacing-1);
}

.comparison__percentage {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
}

.comparison__percentage--success {
    color: var(--color-success);
}

.comparison__percentage--danger {
    color: var(--color-danger);
}

.comparison__orders {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--spacing-1);
}

.comparison__sub {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

/* ============================================
   QUICK ACTIONS
   ============================================ */
.quick-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-3);
}

.quick-card {
    position: relative;
    display: flex;
    gap: var(--spacing-4);
    align-items: center;
    border-radius: var(--radius-md);
    padding: var(--spacing-4);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: inherit;
    text-decoration: none;
    transition: all var(--transition-base);
}

.quick-card:hover,
.quick-card:focus-visible {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    box-shadow: var(--shadow-sm);
    transform: translateY(-2px);
}

.quick-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    display: grid;
    place-items: center;
    font-size: 20px;
    flex-shrink: 0;
    transition: transform var(--transition-base);
}

.quick-card:hover .quick-icon {
    transform: scale(1.1) rotate(5deg);
}

.quick-icon.variant-primary {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.quick-icon.variant-success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.quick-icon.variant-info {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.quick-icon.variant-warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.quick-body {
    flex: 1;
    min-width: 0;
}

.quick-body h4 {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    margin: 0 0 var(--spacing-1) 0;
}

.quick-body p {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    font-family: var(--font-family-sans);
    line-height: var(--line-height-normal);
}

.quick-arrow {
    margin-left: auto;
    color: var(--color-text-muted);
    font-size: 18px;
    flex-shrink: 0;
    transition: transform var(--transition-base);
}

.quick-card:hover .quick-arrow {
    transform: translateX(4px);
    color: var(--color-primary);
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 1200px) {
    .overview__hero-section {
        grid-template-columns: 1fr;
    }

    .overview__secondary-kpis {
        grid-template-columns: repeat(2, 1fr);
    }

    .hero-metric__value {
        font-size: 1.75rem;
    }
}

@media (max-width: 768px) {
    .overview__secondary-kpis {
        grid-template-columns: 1fr;
    }

    .hero-metric__value {
        font-size: 1.5rem;
    }

    .kpi-card__value {
        font-size: 1.25rem;
    }

    .quick-grid {
        grid-template-columns: 1fr;
    }
}
</style>
