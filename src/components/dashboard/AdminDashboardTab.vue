<template>
    <div class="admin-dashboard-tab">
        <!-- Range Selector -->
        <div class="card filter-card mb-4">
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

        <!-- Stats Cards -->
        <div class="row g-4 mb-4" v-if="dashboardData">
            <div class="col-md-3 col-sm-6 d-flex" v-if="dashboardData.revenue">
                <div class="card metric-card metric-card--primary w-100">
                    <div class="card-body">
                        <div class="metric-label">Doanh thu hôm nay</div>
                        <div class="metric-value">{{ formatCurrency(dashboardData.revenue.today) }}</div>
                        <div class="metric-detail">Lợi nhuận: {{ formatCurrency(dashboardData.revenue.todayProfit) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 d-flex" v-if="dashboardData.revenue">
                <div class="card metric-card metric-card--success w-100">
                    <div class="card-body">
                        <div class="metric-label">Doanh thu tháng này</div>
                        <div class="metric-value">{{ formatCurrency(dashboardData.revenue.month) }}</div>
                        <div class="metric-detail">Lợi nhuận: {{ formatCurrency(dashboardData.revenue.monthProfit) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 d-flex" v-if="dashboardData.orders">
                <div class="card metric-card metric-card--warning w-100">
                    <div class="card-body">
                        <div class="metric-label">Đơn hàng hôm nay</div>
                        <div class="metric-value">{{ formatNumber(dashboardData.orders.today) }}</div>
                        <div class="metric-detail">Đã hủy: {{ formatNumber(dashboardData.orders.cancelledToday) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 d-flex" v-if="dashboardData.inventory">
                <div class="card metric-card metric-card--danger w-100">
                    <div class="card-body">
                        <div class="metric-label">Nguyên liệu sắp hết</div>
                        <div class="metric-value">{{ formatNumber(dashboardData.inventory.lowStockItems) }}</div>
                        <div class="metric-detail">Đơn nhập chờ: {{ formatNumber(dashboardData.inventory.pendingPurchaseOrders) }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- System Alerts -->
        <div v-if="dashboardData?.alerts?.length > 0" class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">
                    <i class="bi bi-exclamation-triangle me-2"></i>Cảnh báo hệ thống
                </h5>
            </div>
            <div class="card-body">
                <div class="alert-list">
                    <div
                        v-for="(alert, index) in dashboardData.alerts"
                        :key="index"
                        class="alert"
                        :class="getAlertClass(alert.severity)"
                    >
                        <i :class="getAlertIcon(alert.severity)" class="me-2"></i>
                        <strong>{{ alert.type }}:</strong> {{ alert.message }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Top Lists -->
        <div class="row g-4">
            <!-- Top Products -->
            <div v-if="dashboardData?.topProducts?.length > 0" class="col-lg-4 d-flex">
                <div class="card top-list-card w-100">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-trophy me-2"></i>Top Sản phẩm
                        </h5>
                    </div>
                    <div class="card-body p-0">
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
                                <div class="top-list-item__value text-primary">
                                    {{ formatCurrency(product.revenue) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Top Customers -->
            <div v-if="dashboardData?.topCustomers?.length > 0" class="col-lg-4 d-flex">
                <div class="card top-list-card w-100">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-people me-2"></i>Top Khách hàng
                        </h5>
                    </div>
                    <div class="card-body p-0">
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
                                <div class="top-list-item__value text-success">
                                    {{ formatCurrency(customer.spend) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Top Staff -->
            <div v-if="dashboardData?.topStaff?.length > 0" class="col-lg-4 d-flex">
                <div class="card top-list-card w-100">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-person-badge me-2"></i>Top Nhân viên
                        </h5>
                    </div>
                    <div class="card-body p-0">
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
                                <div class="top-list-item__value text-primary">
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
        // Wait for user to input dates - don't emit yet
        return
    }
    // Clear custom dates when switching to non-custom range
    customFrom.value = ''
    customTo.value = ''
    emit('update-range', selectedRange.value || null)
}

const handleCustomRange = () => {
    if (!customFrom.value || !customTo.value) {
        return // Don't emit if dates are not filled
    }
    
    if (new Date(customFrom.value) > new Date(customTo.value)) {
        alert('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.')
        return
    }
    
    emit('update-range', {
        range: 'CUSTOM',
        from: customFrom.value,
        to: customTo.value
    })
}

const getAlertClass = (severity) => {
    if (!severity) return 'alert-warning'
    const sev = severity.toLowerCase()
    if (sev.includes('error') || sev.includes('critical')) return 'alert-danger'
    if (sev.includes('warning')) return 'alert-warning'
    if (sev.includes('info')) return 'alert-info'
    return 'alert-secondary'
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

.filter-card {
    border-radius: 18px;
    border: 1px solid var(--color-border);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
}

.metric-card {
    border-radius: 18px;
    border: 1px solid var(--color-border);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
    transition: all 0.2s ease;
    height: 100%;
    min-height: 140px;
}

.metric-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 20px 35px rgba(15, 23, 42, 0.12);
}

.metric-card--primary {
    background: linear-gradient(170deg, var(--color-card), var(--color-soft-primary));
}

.metric-card--success {
    background: linear-gradient(170deg, var(--color-card), var(--color-soft-success));
}

.metric-card--warning {
    background: linear-gradient(170deg, var(--color-card), var(--color-soft-warning));
}

.metric-card--danger {
    background: linear-gradient(170deg, var(--color-card), var(--color-soft-danger));
}

.metric-label {
    font-size: 0.88rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    margin-bottom: 0.5rem;
    font-weight: 600;
}

.metric-value {
    font-size: 1.8rem;
    font-weight: 800;
    color: var(--color-heading);
    margin-bottom: 0.25rem;
}

.metric-detail {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin-top: 0.25rem;
}

.card {
    border-radius: 18px;
    border: 1px solid var(--color-border);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
}

.card-header {
    background: rgba(148, 163, 184, 0.08);
    border-bottom: 1px solid var(--color-border);
    padding: 1rem 1.5rem;
    border-radius: 18px 18px 0 0;
}

.list-group-item {
    border: none;
    border-bottom: 1px solid var(--color-border);
    padding: 1rem 0;
}

.list-group-item:last-child {
    border-bottom: none;
}

.alert-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.top-list-card {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.top-list {
    display: flex;
    flex-direction: column;
}

.top-list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
    transition: background-color 0.2s ease;
}

.top-list-item:last-child {
    border-bottom: none;
}

.top-list-item:hover {
    background-color: rgba(148, 163, 184, 0.05);
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
    white-space: nowrap;
    margin-left: 1rem;
    flex-shrink: 0;
}
</style>

