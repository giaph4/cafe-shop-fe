<template>
    <div class="admin-dashboard-tab">
        <!-- Range Selector -->
        <div class="filter-card card mb-4">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-lg-4 col-md-6">
                        <label class="form-label">Khoảng thời gian</label>
                        <select class="form-select" v-model="selectedRange" @change="handleRangeChange">
                            <option value="">Mặc định</option>
                            <option value="TODAY">Hôm nay</option>
                            <option value="WEEK">Tuần này</option>
                            <option value="MONTH">Tháng này</option>
                            <option value="LAST_30_DAYS">30 ngày qua</option>
                            <option value="CUSTOM">Tùy chọn</option>
                        </select>
                    </div>
                    <div v-if="selectedRange === 'CUSTOM'" class="col-lg-3 col-md-6">
                        <label class="form-label">Từ ngày</label>
                        <input type="date" class="form-control" v-model="customFrom" @change="handleCustomRange" />
                    </div>
                    <div v-if="selectedRange === 'CUSTOM'" class="col-lg-3 col-md-6">
                        <label class="form-label">Đến ngày</label>
                        <input type="date" class="form-control" v-model="customTo" @change="handleCustomRange" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Top Row: KPI Cards -->
        <div class="row g-4 mb-4" v-if="dashboardData">
            <!-- DOANH THU HÔM NAY -->
            <div class="col-md-3 col-sm-6" v-if="dashboardData.revenue">
                <div class="kpi-card kpi-card--revenue">
                    <div class="kpi-card__icon">
                        <i class="bi bi-cash-stack"></i>
                    </div>
                    <div class="kpi-card__content">
                        <div class="kpi-card__label">Doanh thu hôm nay:</div>
                        <div class="kpi-card__value">{{ formatCurrency(dashboardData.revenue.today || 0) }}</div>
                        <div class="kpi-card__detail">Lợi nhuận: {{ formatCurrency(dashboardData.revenue.todayProfit || 0) }}</div>
                    </div>
                </div>
            </div>

            <!-- DOANH THU THÁNG NÀY -->
            <div class="col-md-3 col-sm-6" v-if="dashboardData.revenue">
                <div class="kpi-card kpi-card--month">
                    <div class="kpi-card__icon">
                        <i class="bi bi-calendar-month"></i>
                    </div>
                    <div class="kpi-card__content">
                        <div class="kpi-card__label">Doanh thu tháng này:</div>
                        <div class="kpi-card__value">{{ formatCurrency(dashboardData.revenue.month || 0) }}</div>
                        <div class="kpi-card__detail">Lợi nhuận: {{ formatCurrency(dashboardData.revenue.monthProfit || 0) }}</div>
                    </div>
                </div>
            </div>

            <!-- ĐƠN HÀNG HÔM NAY -->
            <div class="col-md-3 col-sm-6" v-if="dashboardData.orders">
                <div class="kpi-card kpi-card--orders">
                    <div class="kpi-card__icon">
                        <i class="bi bi-receipt"></i>
                    </div>
                    <div class="kpi-card__content">
                        <div class="kpi-card__label">Đơn hàng hôm nay:</div>
                        <div class="kpi-card__value">{{ formatNumber(dashboardData.orders.today || 0) }}</div>
                        <div class="kpi-card__detail">Đã hủy: {{ formatNumber(dashboardData.orders.cancelledToday || 0) }}</div>
                    </div>
                </div>
            </div>

            <!-- NGUYÊN LIỆU SẮP HẾT -->
            <div class="col-md-3 col-sm-6" v-if="dashboardData.inventory">
                <div class="kpi-card kpi-card--inventory">
                    <div class="kpi-card__icon">
                        <i class="bi bi-exclamation-triangle"></i>
                    </div>
                    <div class="kpi-card__content">
                        <div class="kpi-card__label">Nguyên liệu sắp hết:</div>
                        <div class="kpi-card__value">{{ formatNumber(dashboardData.inventory.lowStockItems || 0) }}</div>
                        <div class="kpi-card__detail">Đơn nhập chờ: {{ formatNumber(dashboardData.inventory.pendingPurchaseOrders || 0) }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- System Alerts -->
        <div v-if="dashboardData?.alerts?.length > 0" class="card mb-4">
            <div class="card-header">
                <div class="d-flex align-items-center gap-3">
                    <div class="info-card__icon">
                        <i class="bi bi-exclamation-triangle"></i>
                    </div>
                    <h5 class="card-title mb-0">Cảnh báo hệ thống</h5>
                </div>
            </div>
            <div class="card-body">
                <div class="alert-list">
                    <div
                        v-for="(alert, index) in dashboardData.alerts"
                        :key="index"
                        class="alert-item"
                        :class="getAlertClass(alert.severity)"
                    >
                        <i :class="getAlertIcon(alert.severity)" class="alert-item__icon"></i>
                        <div class="alert-item__content">
                            <strong>{{ alert.type }}:</strong> {{ alert.message }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bottom Row: Top Lists -->
        <div class="row g-4">
            <!-- Top Products -->
            <div v-if="dashboardData?.topProducts?.length > 0" class="col-lg-4">
                <div class="card info-card">
                    <div class="card-header">
                        <div class="d-flex align-items-center gap-3">
                            <div class="info-card__icon">
                                <i class="bi bi-trophy"></i>
                            </div>
                            <h5 class="card-title mb-0">Top Sản phẩm</h5>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="top-list">
                            <div
                                v-for="(product, index) in dashboardData.topProducts.slice(0, 5)"
                                :key="product.productId || index"
                                class="top-list-item"
                            >
                                <div class="top-list-item__content">
                                    <div class="top-list-item__name">{{ product.productName || 'N/A' }}</div>
                                    <div class="top-list-item__detail">{{ formatNumber(product.quantity) }} sản phẩm</div>
                                </div>
                                <div class="top-list-item__value">
                                    {{ formatCurrency(product.revenue) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Top Customers -->
            <div v-if="dashboardData?.topCustomers?.length > 0" class="col-lg-4">
                <div class="card info-card">
                    <div class="card-header">
                        <div class="d-flex align-items-center gap-3">
                            <div class="info-card__icon">
                                <i class="bi bi-people"></i>
                            </div>
                            <h5 class="card-title mb-0">Top Khách hàng</h5>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="top-list">
                            <div
                                v-for="(customer, index) in dashboardData.topCustomers.slice(0, 5)"
                                :key="customer.customerId || index"
                                class="top-list-item"
                            >
                                <div class="top-list-item__content">
                                    <div class="top-list-item__name">{{ customer.customerName || 'N/A' }}</div>
                                    <div class="top-list-item__detail">{{ formatNumber(customer.orders) }} đơn</div>
                                </div>
                                <div class="top-list-item__value">
                                    {{ formatCurrency(customer.spend) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Top Staff -->
            <div v-if="dashboardData?.topStaff?.length > 0" class="col-lg-4">
                <div class="card info-card">
                    <div class="card-header">
                        <div class="d-flex align-items-center gap-3">
                            <div class="info-card__icon">
                                <i class="bi bi-person-badge"></i>
                            </div>
                            <h5 class="card-title mb-0">Top Nhân viên</h5>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="top-list">
                            <div
                                v-for="(staff, index) in dashboardData.topStaff.slice(0, 5)"
                                :key="staff.staffId || index"
                                class="top-list-item"
                            >
                                <div class="top-list-item__content">
                                    <div class="top-list-item__name">{{ staff.staffName || 'N/A' }}</div>
                                    <div class="top-list-item__detail">{{ formatNumber(staff.orders) }} đơn</div>
                                </div>
                                <div class="top-list-item__value">
                                    {{ formatCurrency(staff.revenue) }}
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
import { ref, watch } from 'vue'
import { toast } from 'vue3-toastify'
import { formatCurrency, formatNumber } from '@/utils/formatters'

const props = defineProps({
    dashboardData: Object,
    range: String
})

const emit = defineEmits(['update-range'])

const selectedRange = ref(props.range || '')
const customFrom = ref('')
const customTo = ref('')

const handleRangeChange = () => {
    if (selectedRange.value === 'CUSTOM') {
        return
    }
    customFrom.value = ''
    customTo.value = ''
    emit('update-range', selectedRange.value || null)
}

const handleCustomRange = () => {
    if (!customFrom.value || !customTo.value) {
        return
    }
    
    if (new Date(customFrom.value) > new Date(customTo.value)) {
        toast.error('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.')
        return
    }
    
    emit('update-range', {
        range: 'CUSTOM',
        from: customFrom.value,
        to: customTo.value
    })
}

const getAlertClass = (severity) => {
    if (!severity) return 'alert-item--warning'
    const sev = severity.toLowerCase()
    if (sev.includes('error') || sev.includes('critical')) return 'alert-item--danger'
    if (sev.includes('warning')) return 'alert-item--warning'
    if (sev.includes('info')) return 'alert-item--info'
    return 'alert-item--secondary'
}

const getAlertIcon = (severity) => {
    if (!severity) return 'bi bi-exclamation-triangle'
    const sev = severity.toLowerCase()
    if (sev.includes('error') || sev.includes('critical')) return 'bi bi-x-circle'
    if (sev.includes('warning')) return 'bi bi-exclamation-triangle'
    if (sev.includes('info')) return 'bi bi-info-circle'
    return 'bi bi-bell'
}

watch(() => props.range, (newRange) => {
    selectedRange.value = newRange || ''
})
</script>

<style scoped>
.admin-dashboard-tab {
    padding: 0;
}


/* KPI Cards */
.kpi-card {
    background: #f8fafc;
    border: 1px solid rgba(226, 232, 240, 0.5);
    border-radius: 24px;
    padding: var(--spacing-6);
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04);
    display: flex;
    align-items: center;
    gap: var(--spacing-5);
    transition: all var(--transition-base);
    min-height: 140px;
    height: 100%;
}

.kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.06);
}

.kpi-card__icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    flex-shrink: 0;
    color: #6366f1;
    position: relative;
}

.kpi-card--revenue .kpi-card__icon {
    background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
}

.kpi-card--month .kpi-card__icon {
    background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
    box-shadow: 0 2px 8px rgba(124, 58, 237, 0.15);
}

.kpi-card--orders .kpi-card__icon {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
}

.kpi-card--inventory .kpi-card__icon {
    background: linear-gradient(135deg, #fce7f3, #fbcfe8);
    box-shadow: 0 2px 8px rgba(236, 72, 153, 0.15);
}

.kpi-card__content {
    flex: 1;
    min-width: 0;
}

.kpi-card__label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
    text-transform: none;
    letter-spacing: normal;
    margin-bottom: var(--spacing-2);
    line-height: var(--line-height-normal);
}

.kpi-card__value {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
    margin-bottom: var(--spacing-1);
}

.kpi-card__detail {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
    line-height: var(--line-height-relaxed);
}

/* Info Cards */
.info-card {
    height: 100%;
}

.info-card .card-header {
    border-bottom: 1px solid var(--color-border);
    padding: 1.25rem 1.5rem;
    background: var(--color-card-muted);
}

.info-card__icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: linear-gradient(135deg, #4f46e5, #6366f1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 1.25rem;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
    filter: brightness(1.05) contrast(1.1);
}

.info-card__icon i {
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}


/* Alert List */
.alert-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.alert-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 12px;
    border: 1px solid;
}

.alert-item__icon {
    font-size: 1.25rem;
    flex-shrink: 0;
    margin-top: 0.125rem;
}

.alert-item__content {
    flex: 1;
    font-size: 0.9rem;
}

.alert-item--danger {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
    color: #dc2626;
}

.alert-item--warning {
    background: rgba(245, 158, 11, 0.1);
    border-color: rgba(245, 158, 11, 0.3);
    color: #d97706;
}

.alert-item--info {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
    color: #2563eb;
}

.alert-item--secondary {
    background: rgba(148, 163, 184, 0.1);
    border-color: rgba(148, 163, 184, 0.3);
    color: #64748b;
}

/* Top List */
.top-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.top-list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(148, 163, 184, 0.05);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    transition: all 0.2s ease;
}

.top-list-item:hover {
    background: rgba(148, 163, 184, 0.1);
    transform: translateX(4px);
}

.top-list-item__content {
    flex: 1;
    min-width: 0;
}

.top-list-item__name {
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--color-heading);
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.top-list-item__detail {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.top-list-item__value {
    font-weight: 700;
    font-size: 1rem;
    color: var(--color-primary);
    white-space: nowrap;
    margin-left: 1rem;
    flex-shrink: 0;
}


@media (max-width: 768px) {
    .kpi-card {
        flex-direction: column;
        text-align: center;
    }
}
</style>
