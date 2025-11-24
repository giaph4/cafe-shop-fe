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
            <div class="card chart-card">
                <div class="card-header">
                    <h5>Doanh thu theo ngày</h5>
                    <p>Biến động doanh thu trong giai đoạn đã chọn</p>
                </div>
                <ApexChart 
                    v-if="isMounted && revenueSeries && revenueSeries.length > 0 && revenueOptions"
                    type="area" 
                    height="320" 
                    :series="revenueSeries" 
                    :options="revenueOptions"
                />
                <EmptyState v-else message="Chưa có dữ liệu doanh thu"/>
            </div>

            <div class="card chart-card">
                <div class="card-header">
                    <h5>Phương thức thanh toán</h5>
                    <p>Tỷ trọng đơn hàng theo kênh thanh toán</p>
                </div>
                <div v-if="paymentStats && paymentStats.length" class="payment-list">
                    <div v-for="item in paymentStats" :key="item.paymentMethod" class="payment-item">
                        <div class="payment-item__left">
                            <span class="payment-item__method">{{ prettyMethod(item.paymentMethod) }}</span>
                            <span class="payment-item__orders">{{ item.orderCount }} đơn</span>
                        </div>
                        <div class="payment-item__right">
                            <strong>{{ formatCurrency(item.totalAmount) }}</strong>
                            <span :class="['badge', 'bg-light']">{{ item.percentage?.toFixed(1) ?? 0 }}%</span>
                        </div>
                    </div>
                </div>
                <EmptyState v-else message="Chưa có thống kê thanh toán"/>
            </div>
        </div>

        <div class="composite-grid">
            <div class="card comparison-card">
                <div class="card-header mb-3">
                    <h5>So sánh với kỳ trước</h5>
                    <p>Đo lường tăng trưởng doanh thu và số đơn hàng</p>
                </div>
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

            <section v-if="quickActions.length" class="quick-actions">
                <header class="quick-header mt-3">
                    <h5>Thao tác nhanh</h5>
                    <p class="text-muted">Truy cập nhanh các nghiệp vụ quan trọng theo vai trò của bạn.</p>
                </header>
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
            </section>
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
    gap: 1.75rem;
}

.overview__stats {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
}


.stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: linear-gradient(160deg, rgba(244, 246, 255, 0.92), rgba(233, 240, 255, 0.84));
    border-radius: var(--radius-md);
    border: 1px solid rgba(148, 163, 184, 0.18);
    padding: 1rem 1.2rem;
    box-shadow: 0 16px 30px rgba(99, 102, 241, 0.12);
    color: var(--color-text);
}

.stat-card__icon {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    font-size: 1.6rem;
    color: var(--color-primary);
    background: rgba(99, 102, 241, 0.12);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 10px 18px rgba(99, 102, 241, 0.18);
}

.stat-card__meta {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.stat-card__label {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.stat-card__value {
    font-size: 1.35rem;
}

.stat-card__sub {
    font-size: 0.8rem;
    color: var(--color-text-muted);
}

.overview__grid {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: 1.5rem;
}

.chart-card .card-header {
    border-bottom: none;
    margin-bottom: 0.75rem;
}

.payment-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.payment-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 0.75rem;
}

.payment-item:last-of-type {
    border-bottom: none;
    padding-bottom: 0;
}

.payment-item__left {
    display: flex;
    flex-direction: column;
}

.payment-item__method {
    font-weight: 600;
}

.payment-item__orders {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.payment-item__right {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.comparison-card .card-header {
    border-bottom: none;
}

.comparison {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
}

.comparison__item {
    background: linear-gradient(150deg, rgba(244, 246, 255, 0.92), rgba(233, 240, 255, 0.84));
    border-radius: 16px;
    padding: 1rem;
    border: 1px solid rgba(148, 163, 184, 0.18);
    box-shadow: 0 14px 26px rgba(99, 102, 241, 0.1);
}

.comparison__label {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.comparison__sub {
    display: block;
    margin-top: 0.35rem;
    font-size: 0.8rem;
}

.overview-tab__quick {
    border-radius: 20px;
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-soft);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.quick-header h3 {
    font-weight: 700;
    color: var(--color-heading);
    margin-bottom: 0.35rem;
}

.quick-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
}

.quick-card {
    position: relative;
    display: flex;
    gap: 1rem;
    align-items: center;
    border-radius: 16px;
    padding: 1.1rem 1.25rem;
    border: 1px solid rgba(148, 163, 184, 0.18);
    background: linear-gradient(170deg, rgba(244, 246, 255, 0.92), rgba(233, 240, 255, 0.84));
    color: inherit;
    text-decoration: none;
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    box-shadow: 0 18px 32px rgba(99, 102, 241, 0.12);
}

.quick-card:hover,
.quick-card:focus-visible {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(99, 102, 241, 0.22);
    border-color: rgba(99, 102, 241, 0.28);
}

.quick-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    font-size: 1.4rem;
}

.quick-icon.variant-primary {
    background: rgba(99, 102, 241, 0.16);
    color: #4f46e5;
}

.quick-body h4 {
    font-weight: 700;
    font-size: 1rem;
    color: var(--color-heading);
    margin-bottom: 0.25rem;
}

.quick-body p {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.88rem;
}

.quick-arrow {
    margin-left: auto;
    color: var(--color-text-muted);
    font-size: 1.25rem;
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

.dark-theme .chart-card,
.dark-theme .stat-card__icon,
.dark-theme .stat-card__trend {
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(17, 24, 39, 0.92));
}

.dark-theme .overview-tab__quick {
    border-color: rgba(129, 140, 248, 0.28);
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(17, 24, 39, 0.92));
}

.dark-theme .quick-card {
    border-color: rgba(129, 140, 248, 0.25);
    background: linear-gradient(170deg, rgba(30, 41, 59, 0.92), rgba(17, 24, 39, 0.92));
}

.comfort-theme .overview-tab__quick {
    border-color: rgba(95, 111, 148, 0.25);
    background: linear-gradient(170deg, rgba(245, 241, 235, 0.98), rgba(236, 232, 226, 0.92));
}

.comfort-theme .quick-card {
    border-color: rgba(95, 111, 148, 0.25);
    background: linear-gradient(170deg, rgba(245, 241, 235, 0.98), rgba(236, 232, 226, 0.92));
}

@media (max-width: 1200px) {
    .overview__grid {
        grid-template-columns: 1fr;
    }

    .overview__stats {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    }
}

@media (max-width: 992px) {
    .overview-tab__charts {
        grid-template-columns: 1fr;
    }
}
</style>
