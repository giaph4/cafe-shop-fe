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
                        <div class="kpi-card__label">DOANH THU HÔM NAY</div>
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
                        <div class="kpi-card__label">DOANH THU THÁNG NÀY</div>
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
                        <div class="kpi-card__label">ĐƠN HÀNG HÔM NAY</div>
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
                        <div class="kpi-card__label">NGUYÊN LIỆU SẮP HẾT</div>
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
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    border: 1px solid var(--color-border);
    border-radius: 18px;
    padding: 1.5rem;
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
    display: flex;
    align-items: center;
    gap: 1.25rem;
    transition: all 0.3s ease;
    min-height: 140px;
}

.kpi-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(15, 23, 184, 0.12);
}

.kpi-card__icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    flex-shrink: 0;
    color: white;
}

.kpi-card--revenue .kpi-card__icon {
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
}

.kpi-card--month .kpi-card__icon {
    background: linear-gradient(135deg, #10b981, #34d399);
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
}

.kpi-card--orders .kpi-card__icon {
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
}

.kpi-card--inventory .kpi-card__icon {
    background: linear-gradient(135deg, #ef4444, #f87171);
    box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3);
}

.kpi-card__content {
    flex: 1;
}

.kpi-card__label {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.5rem;
}

.kpi-card__value {
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--color-heading);
    line-height: 1.2;
    margin-bottom: 0.25rem;
}

.kpi-card__detail {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    margin-top: 0.25rem;
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
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.25rem;
    flex-shrink: 0;
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
