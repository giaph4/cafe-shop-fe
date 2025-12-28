<template>
  <div class="overview">
    <div class="overview__stats">
      <div
        v-for="metric in metrics"
        :key="metric.key"
        class="stat-card"
        :class="{ 'stat-card--featured': metric.key === 'todayRevenue' }"
      >
        <div
          class="stat-card__icon"
          :class="metric.iconBg"
        >
          <i :class="metric.icon" />
        </div>
        <div class="stat-card__meta">
          <span class="stat-card__label">{{ metric.label }}</span>
          <strong class="stat-card__value">{{ metric.display }}</strong>
          <span
            v-if="metric.subLabel"
            class="stat-card__sub"
          >{{ metric.subLabel }}</span>
        </div>
      </div>
    </div>

    <div class="overview__grid">
      <div class="card">
        <div class="card-header">
          <div>
            <h5 class="card-title">
              {{ chartTitle }}
            </h5>
            <p class="card-subtitle">
              Biến động doanh thu trong giai đoạn đã chọn
            </p>
          </div>
        </div>
        <div class="card-body">
          <ApexChart
            v-if="isMounted && revenueSeries && revenueSeries.length > 0 && revenueOptions"
            type="bar"
            height="320"
            :series="revenueSeries"
            :options="revenueOptions"
          />
          <EmptyState
            v-else
            message="Chưa có dữ liệu doanh thu"
          />
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <h5 class="card-title">
              Phương thức thanh toán
            </h5>
            <p class="card-subtitle">
              Tỷ trọng đơn hàng theo kênh thanh toán
            </p>
          </div>
        </div>
        <div class="card-body">
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
                <span class="badge bg-soft">{{ item.percentage?.toFixed(1) ?? 0 }}%</span>
              </div>
            </div>
          </div>
          <EmptyState
            v-else
            message="Chưa có thống kê thanh toán"
          />
        </div>
      </div>
    </div>

    <div class="composite-grid">
      <div class="card card-compact">
        <div class="card-header">
          <div>
            <h5 class="card-title">
              So sánh với kỳ trước
            </h5>
            <p class="card-subtitle">
              Đo lường tăng trưởng doanh thu và số đơn hàng
            </p>
          </div>
        </div>
        <div class="card-body">
          <div
            v-if="salesComparison"
            class="comparison"
          >
            <div class="comparison__item">
              <span class="comparison__label">Doanh thu kỳ hiện tại: </span>
              <strong>{{ formatCurrency(salesComparison.currentRevenue) }}</strong>
            </div>
            <div class="comparison__item">
              <span class="comparison__label">Doanh thu kỳ trước: </span>
              <strong>{{ formatCurrency(salesComparison.previousRevenue) }}</strong>
            </div>
            <div class="comparison__item">
              <span class="comparison__label">Tăng trưởng: </span>
              <strong :class="salesComparison.growthAmount >= 0 ? 'text-success' : 'text-danger'">
                {{ formatCurrency(salesComparison.growthAmount) }}
              </strong>
              <span
                class="comparison__sub"
                :class="salesComparison.growthPercentage >= 0 ? 'text-success' : 'text-danger'"
              >
                {{ salesComparison.growthPercentage?.toFixed(2) ?? 0 }}%
              </span>
            </div>
            <div class="comparison__item">
              <span class="comparison__label">Số đơn: </span>
              <strong>{{ salesComparison.currentOrders }}</strong>
              <span class="comparison__sub">Trước: {{ salesComparison.previousOrders }}</span>
            </div>
          </div>
          <EmptyState
            v-else
            message="Chưa có dữ liệu so sánh"
          />
        </div>
      </div>

      <div
        v-if="quickActions.length"
        class="card"
      >
        <div class="card-header">
          <div>
            <h5 class="card-title">
              Thao tác nhanh
            </h5>
            <p class="card-subtitle">
              Truy cập nhanh các nghiệp vụ quan trọng theo vai trò của bạn.
            </p>
          </div>
        </div>
        <div class="card-body">
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, nextTick } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { formatCurrency } from '@/utils/formatters'
import EmptyState from '@/components/common/EmptyState.vue'
import { useAuthStore } from '@/store/auth'

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

const cards = computed(() => {
    const s = props.stats || {}
    return [
        {
            key: 'todayRevenue',
            label: 'Doanh thu hôm nay: ',
            icon: 'bi bi-cash-stack',
            iconBg: 'bg-primary-light',
            value: s.todayRevenue
        },
        {
            key: 'monthRevenue',
            label: 'Doanh thu tháng: ',
            icon: 'bi bi-calendar-event',
            iconBg: 'bg-indigo-light',
            value: s.monthRevenue
        },
        {
            key: 'todayOrders',
            label: 'Đơn hàng hôm nay: ',
            icon: 'bi bi-clipboard-check',
            iconBg: 'bg-amber-light',
            value: s.todayOrders,
            formatter: (val) => val ?? 0
        },
        {
            key: 'lowStockItems',
            label: 'Nguyên liệu sắp hết: ',
            icon: 'bi bi-exclamation-triangle',
            iconBg: 'bg-rose-light',
            value: s.lowStockItems,
            formatter: (val) => val ?? 0
        },
        {
            key: 'averageOrderValue',
            label: 'Giá trị đơn trung bình: ',
            icon: 'bi bi-receipt',
            iconBg: 'bg-sky-light',
            value: s.averageOrderValue
        },
        {
            key: 'todayProfit',
            label: 'Lợi nhuận hôm nay',
            icon: 'bi bi-graph-up',
            iconBg: 'bg-emerald-light',
            value: s.todayProfit
        },
        {
            key: 'totalCustomers',
            label: 'Khách hàng',
            icon: 'bi bi-people',
            iconBg: 'bg-fuchsia-light',
            value: s.totalCustomers,
            formatter: (val) => val ?? 0
        },
        {
            key: 'totalProducts',
            label: 'Sản phẩm đang bán',
            icon: 'bi bi-basket2',
            iconBg: 'bg-orange-light',
            value: s.totalProducts,
            formatter: (val) => val ?? 0
        }
    ]
})

const metrics = computed(() => cards.value.map(card => ({
    ...card,
    display: typeof card.formatter === 'function'
        ? card.formatter(card.value)
        : formatCurrency(card.value ?? 0)
})))

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
</script>

<style scoped>
.overview {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
}

.overview__stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-4);
}

/* Flat design với shadow thay vì border */
.stat-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    background: var(--color-card);
    border-radius: var(--radius-md);
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    padding: var(--spacing-4) var(--spacing-5);
    color: var(--color-text);
    transition: all var(--transition-base);
    position: relative;
    overflow: hidden;
}

.stat-card--featured {
    background: linear-gradient(135deg, var(--color-card) 0%, rgba(59, 130, 246, 0.05) 100%);
    border: 2px solid var(--color-primary);
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
    transform: scale(1.02);
}

.stat-card--featured .stat-card__value {
    font-size: calc(var(--font-size-xl) * 1.15);
    color: var(--color-primary);
    font-weight: var(--font-weight-bold);
}

.stat-card--featured .stat-card__icon {
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.stat-card::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--color-primary);
    opacity: 0;
    transition: opacity var(--transition-base);
}

.stat-card:hover {
    background: var(--color-card-muted);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.stat-card:hover::before {
    opacity: 0.6;
}

.stat-card__icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-base);
    display: grid;
    place-items: center;
    font-size: 24px;
    flex-shrink: 0;
    transition: transform var(--transition-base);
}

.stat-card:hover .stat-card__icon {
    transform: scale(1.05);
}

.stat-card__meta {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    flex: 1;
    min-width: 0;
}

.stat-card__label {
    font-size: var(--font-size-sm);
    color: #6B7280; /* Tăng độ tương phản từ #9CA3AF lên #6B7280 */
    font-weight: var(--font-weight-medium);
    letter-spacing: 0.01em;
    line-height: 1.4;
}

.stat-card__value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    line-height: 1.3;
    letter-spacing: -0.01em;
}

.stat-card__sub {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    line-height: 1.4;
}

.overview__grid {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: var(--spacing-6);
}

/* Card với shadow thay vì border */
.overview :global(.card) {
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: box-shadow var(--transition-base);
}

.overview :global(.card:hover) {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.card-header {
    border-bottom: 1px solid var(--color-border);
    padding-bottom: var(--spacing-4);
    margin-bottom: 0;
}

.card-subtitle {
    color: #6B7280; /* Tăng độ tương phản từ #9CA3AF lên #6B7280 */
    font-size: var(--font-size-sm);
}

.payment-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
}

.payment-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: var(--spacing-3);
}

.payment-item:last-of-type {
    border-bottom: none;
    padding-bottom: 0;
}

.payment-item__left {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.payment-item__method {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
}

.payment-item__orders {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
}

.payment-item__right {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
}

.comparison {
    display: flex;
    flex-direction: column;
    gap: 0;
}

/* Compact card - giảm kích thước */
.card-compact {
    max-width: 100%;
}

.card-compact .card-body {
    padding: var(--spacing-4);
}

/* Giao diện "thoáng" - bỏ background trắng, dùng divider */
.comparison__item {
    background: transparent;
    border-radius: 0;
    padding: var(--spacing-3) var(--spacing-4);
    border: none;
    border-bottom: 1px solid var(--color-border);
    box-shadow: none;
    transition: background-color var(--transition-base);
}

.comparison__item:last-child {
    border-bottom: none;
}

.comparison__item:hover {
    background: var(--color-card-muted);
}

.comparison__label {
    font-size: var(--font-size-sm);
    color: #6B7280; /* Tăng độ tương phản */
    font-weight: var(--font-weight-medium);
}

.comparison__sub {
    display: block;
    margin-top: var(--spacing-2);
    font-size: var(--font-size-xs);
}

.quick-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-3);
}

/* Flat design với shadow thay vì border */
.quick-card {
    position: relative;
    display: flex;
    gap: var(--spacing-4);
    align-items: center;
    border-radius: var(--radius-base);
    padding: var(--spacing-4) var(--spacing-5);
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    background: var(--color-card);
    color: inherit;
    text-decoration: none;
    transition: background-color var(--transition-base), box-shadow var(--transition-base);
}

.quick-card:hover,
.quick-card:focus-visible {
    background: var(--color-card-muted);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.quick-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-base);
    display: grid;
    place-items: center;
    font-size: 1.4rem;
    flex-shrink: 0;
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

.quick-body h4 {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
}

.quick-body p {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
}

.quick-arrow {
    margin-left: auto;
    color: var(--color-text-muted);
    font-size: 1.25rem;
    flex-shrink: 0;
}

/* Icon background colors - đồng bộ với voucher card style */
.bg-primary-light {
    background: rgba(59, 130, 246, 0.18);
    color: #3b82f6;
}

.bg-indigo-light {
    background: rgba(99, 102, 241, 0.18);
    color: #6366f1;
}

.bg-amber-light {
    background: rgba(251, 191, 36, 0.18);
    color: #fbbf24;
}

.bg-rose-light {
    background: rgba(244, 63, 94, 0.18);
    color: #f43f5e;
}

.bg-sky-light {
    background: rgba(14, 165, 233, 0.18);
    color: #0ea5e9;
}

.bg-emerald-light {
    background: rgba(34, 197, 94, 0.18);
    color: #22c55e;
}

.bg-fuchsia-light {
    background: rgba(217, 70, 239, 0.18);
    color: #d946ef;
}

.bg-orange-light {
    background: rgba(251, 146, 60, 0.18);
    color: #fb923c;
}

.composite-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-6);
}

/* Card trong composite-grid cũng có shadow */
.composite-grid :global(.card) {
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: box-shadow var(--transition-base);
}

.composite-grid :global(.card:hover) {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

@media (max-width: 1200px) {
    .overview__grid {
        grid-template-columns: 1fr;
    }

    .overview__stats {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>
