<template>
    <div class="overview">
        <div class="overview__stats">
            <div v-for="metric in metrics" :key="metric.key" class="stat-card">
                <div class="stat-card__icon" :class="metric.iconBg">
                    <i :class="metric.icon"></i>
                </div>
                <div class="stat-card__meta">
                    <span class="stat-card__label">{{ metric.label }}</span>
                    <strong class="stat-card__value">{{ metric.display }}</strong>
                    <span v-if="metric.subLabel" class="stat-card__sub">{{ metric.subLabel }}</span>
                </div>
            </div>
        </div>

        <div class="overview__grid">
            <div class="card">
                <div class="card-header">
                    <div>
                        <h5 class="card-title">Doanh thu theo ngày</h5>
                        <p class="card-subtitle">Biến động doanh thu trong giai đoạn đã chọn</p>
                    </div>
                </div>
                <div class="card-body">
                    <ApexChart 
                        v-if="isMounted && revenueSeries && revenueSeries.length > 0 && revenueOptions"
                        type="area" 
                        height="320" 
                        :series="revenueSeries" 
                        :options="revenueOptions"
                    />
                    <EmptyState v-else message="Chưa có dữ liệu doanh thu"/>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div>
                        <h5 class="card-title">Phương thức thanh toán</h5>
                        <p class="card-subtitle">Tỷ trọng đơn hàng theo kênh thanh toán</p>
                    </div>
                </div>
                <div class="card-body">
                    <div v-if="paymentStats && paymentStats.length" class="payment-list">
                        <div v-for="item in paymentStats" :key="item.paymentMethod" class="payment-item">
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
                    <EmptyState v-else message="Chưa có thống kê thanh toán"/>
                </div>
            </div>
        </div>

        <div class="composite-grid">
            <div class="card">
                <div class="card-header">
                    <div>
                        <h5 class="card-title">So sánh với kỳ trước</h5>
                        <p class="card-subtitle">Đo lường tăng trưởng doanh thu và số đơn hàng</p>
                    </div>
                </div>
                <div class="card-body">
                    <div v-if="salesComparison" class="comparison">
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
                            <span class="comparison__sub" :class="salesComparison.growthPercentage >= 0 ? 'text-success' : 'text-danger'">
                                {{ salesComparison.growthPercentage?.toFixed(2) ?? 0 }}%
                            </span>
                        </div>
                        <div class="comparison__item">
                            <span class="comparison__label">Số đơn: </span>
                            <strong>{{ salesComparison.currentOrders }}</strong>
                            <span class="comparison__sub">Trước: {{ salesComparison.previousOrders }}</span>
                        </div>
                    </div>
                    <EmptyState v-else message="Chưa có dữ liệu so sánh"/>
                </div>
            </div>

            <div v-if="quickActions.length" class="card">
                <div class="card-header">
                    <div>
                        <h5 class="card-title">Thao tác nhanh</h5>
                        <p class="card-subtitle">Truy cập nhanh các nghiệp vụ quan trọng theo vai trò của bạn.</p>
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
                            <div class="quick-icon" :class="action.variant">
                                <i :class="action.icon"></i>
                            </div>
                            <div class="quick-body">
                                <h4>{{ action.title }}</h4>
                                <p>{{ action.description }}</p>
                            </div>
                            <span class="quick-arrow"><i class="bi bi-arrow-right"></i></span>
                        </router-link>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import {computed, ref, onMounted, nextTick} from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import {formatCurrency} from '@/utils/formatters'
import EmptyState from '@/components/common/EmptyState.vue'
import {useAuthStore} from '@/store/auth'

const props = defineProps({
    stats: {type: Object, default: null},
    revenueSeries: {type: Array, default: () => []},
    revenueOptions: {type: Object, default: () => ({})},
    paymentStats: {type: Array, default: () => []},
    salesComparison: {type: Object, default: null}
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
        actions.push({
            id: 'vouchers',
            title: 'Quản lý voucher',
            description: 'Tạo, cập nhật và kiểm soát mã giảm giá theo chuẩn backend.',
            icon: 'bi bi-ticket-detailed-fill',
            variant: 'variant-primary',
            to: '/vouchers'
        })
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
</script>

<style scoped>
.overview {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
}

.overview__stats {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-4);
}

/* Flat design - NO gradient, NO shadow, NO transform */
.stat-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    background: var(--color-card);
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    padding: var(--spacing-5) var(--spacing-6);
    color: var(--color-text);
    transition: background-color var(--transition-base), border-color var(--transition-base);
}

.stat-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
    /* NO transform, NO shadow */
}

.stat-card__icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-base);
    display: grid;
    place-items: center;
    font-size: 1.5rem;
    color: var(--color-primary);
    background: var(--color-soft-primary);
    /* NO shadow, NO gradient */
}

.stat-card__meta {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.stat-card__label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
}

.stat-card__value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
}

.stat-card__sub {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
}

.overview__grid {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: var(--spacing-6);
}

.card-header {
    border-bottom: 1px solid var(--color-border);
    padding-bottom: var(--spacing-4);
    margin-bottom: 0;
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
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-4);
}

/* Flat design - NO gradient, NO shadow */
.comparison__item {
    background: var(--color-card);
    border-radius: var(--radius-base);
    padding: var(--spacing-5);
    border: 1px solid var(--color-border);
    transition: background-color var(--transition-base), border-color var(--transition-base);
}

.comparison__item:hover {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
    /* NO transform, NO shadow */
}

.comparison__label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
}

.comparison__sub {
    display: block;
    margin-top: var(--spacing-2);
    font-size: var(--font-size-xs);
}

.quick-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--spacing-4);
}

/* Flat design - NO gradient, NO shadow, NO transform */
.quick-card {
    position: relative;
    display: flex;
    gap: var(--spacing-4);
    align-items: center;
    border-radius: var(--radius-base);
    padding: var(--spacing-5) var(--spacing-6);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: inherit;
    text-decoration: none;
    transition: background-color var(--transition-base), border-color var(--transition-base);
    /* NO shadow, NO gradient */
}

.quick-card:hover,
.quick-card:focus-visible {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
    /* NO transform, NO shadow */
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

.bg-primary-light {
    background: var(--color-soft-primary);
}

.bg-indigo-light {
    background: var(--color-soft-indigo);
}

.bg-amber-light {
    background: var(--color-soft-amber);
}

.bg-rose-light {
    background: var(--color-soft-rose);
}

.bg-sky-light {
    background: var(--color-soft-sky);
}

.bg-emerald-light {
    background: var(--color-soft-emerald);
}

.bg-fuchsia-light {
    background: var(--color-soft-fuchsia);
}

.bg-orange-light {
    background: var(--color-soft-orange);
}

@media (max-width: 1200px) {
    .overview__grid {
        grid-template-columns: 1fr;
    }

    .overview__stats {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    }
}
</style>
