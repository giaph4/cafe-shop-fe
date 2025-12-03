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

/* KPI Cards - Chuẩn hóa theo base.css */
.kpi-card {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    padding: var(--spacing-4);
    box-shadow: var(--shadow-base);
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    transition: all var(--transition-base);
    min-height: 120px;
    height: 100%;
}

.kpi-card:hover {
    box-shadow: var(--shadow-hover);
}

.kpi-card__icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-base);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
    color: var(--color-primary);
    background: var(--color-bg-muted);
}

/* Màu icon - không dùng gradient, dùng màu nhạt */
.kpi-card--revenue .kpi-card__icon {
    background: var(--color-bg-muted);
    color: var(--color-primary);
}

.kpi-card--month .kpi-card__icon {
    background: var(--color-bg-muted);
    color: var(--color-secondary);
}

.kpi-card--orders .kpi-card__icon {
    background: var(--color-bg-muted);
    color: var(--color-accent);
}

.kpi-card--inventory .kpi-card__icon {
    background: var(--color-bg-muted);
    color: var(--color-warning);
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
    line-height: var(--line-height-base);
}

.kpi-card__value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    line-height: var(--line-height-tight);
}

.kpi-card__detail {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
    line-height: var(--line-height-base);
}

/* Info Cards - Chuẩn hóa */
.info-card {
    height: 100%;
}

.info-card .card-header {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4);
    background: var(--color-bg);
}

.info-card__icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-base);
    background: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 20px;
    flex-shrink: 0;
}

/* Alert List - Chuẩn hóa, không dùng alert */
.alert-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.alert-item {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-3);
    padding: var(--spacing-3) var(--spacing-4);
    border-radius: var(--radius-base);
    border: 1px solid;
    font-size: var(--font-size-base);
}

.alert-item__icon {
    font-size: 20px;
    flex-shrink: 0;
    margin-top: 2px;
}

.alert-item__content {
    flex: 1;
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
}

.alert-item--danger {
    background: var(--color-bg-muted);
    border-color: var(--color-danger);
    color: var(--color-danger);
}

.alert-item--warning {
    background: var(--color-bg-muted);
    border-color: var(--color-warning);
    color: var(--color-warning);
}

.alert-item--info {
    background: var(--color-bg-muted);
    border-color: var(--color-info);
    color: var(--color-info);
}

.alert-item--secondary {
    background: var(--color-bg-muted);
    border-color: var(--color-border);
    color: var(--color-text-muted);
}

/* Top List - Chuẩn hóa */
.top-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.top-list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-3) var(--spacing-4);
    background: var(--color-bg-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    transition: all var(--transition-base);
}

.top-list-item:hover {
    background: var(--color-bg);
    border-color: var(--color-border-strong);
}

.top-list-item__content {
    flex: 1;
    min-width: 0;
}

.top-list-item__name {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    color: var(--color-text);
    margin-bottom: var(--spacing-1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.top-list-item__detail {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
}

.top-list-item__value {
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-base);
    color: var(--color-primary);
    white-space: nowrap;
    margin-left: var(--spacing-4);
    flex-shrink: 0;
}

@media (max-width: 768px) {
    .kpi-card {
        flex-direction: column;
        text-align: center;
        min-height: auto;
    }
    
    .kpi-card__icon {
        width: 48px;
        height: 48px;
        font-size: 20px;
    }
}
</style>
