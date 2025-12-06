<template>
    <Teleport to="body">
        <div class="modal fade customer-detail-modal" ref="modalElement" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-header__content">
                            <h5 class="modal-title">Chi tiết khách hàng #{{ customerId }}</h5>
                            <p class="modal-subtitle">Xem thông tin chi tiết, lịch sử mua hàng và thống kê của khách hàng.</p>
                        </div>
                        <button type="button" class="btn-close" @click="hide" aria-label="Đóng"></button>
                    </div>
                    <div class="modal-body">
                        <LoadingState v-if="loading" />
                        <ErrorState v-else-if="error" :message="error" :show-retry="false" />
                        <template v-else-if="customer">
                            <!-- Thông tin cơ bản -->
                            <div class="info-section mb-4">
                                <h6 class="section-title mb-3">
                                    <i class="bi bi-person-circle me-2"></i>
                                    Thông tin cơ bản
                                </h6>
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <div class="info-item">
                                            <span class="info-label">Mã khách hàng:</span>
                                            <span class="info-value">{{ customer.id }}</span>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="info-item">
                                            <span class="info-label">Họ và tên:</span>
                                            <span class="info-value">{{ customer.fullName }}</span>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="info-item">
                                            <span class="info-label">Số điện thoại:</span>
                                            <span class="info-value">{{ customer.phone || '—' }}</span>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="info-item">
                                            <span class="info-label">Email:</span>
                                            <span class="info-value">{{ customer.email || '—' }}</span>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="info-item">
                                            <span class="info-label">Điểm thưởng:</span>
                                            <span class="info-value fw-bold" style="color: var(--color-primary); font-family: var(--font-family-sans);">{{ formatLoyaltyPoints(customer.loyaltyPoints) }} điểm</span>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="info-item">
                                            <span class="info-label">Ngày tạo:</span>
                                            <span class="info-value text-muted">{{ formatDate(customer.createdAt) }}</span>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="info-item">
                                            <span class="info-label">Cập nhật lần cuối:</span>
                                            <span class="info-value text-muted">{{ formatDate(customer.updatedAt) }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Thống kê -->
                            <div class="info-section mb-4">
                                <h6 class="section-title mb-3">
                                    <i class="bi bi-graph-up me-2"></i>
                                    Thống kê
                                </h6>
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <div class="stat-box">
                                            <div class="stat-icon stat-icon--purple">
                                                <i class="bi bi-receipt"></i>
                                            </div>
                                            <div class="stat-info">
                                                <div class="stat-label">Tổng đơn hàng</div>
                                                <div class="stat-value">{{ summary.totalOrders }}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="stat-box">
                                            <div class="stat-icon stat-icon--green">
                                                <i class="bi bi-cash-stack"></i>
                                            </div>
                                            <div class="stat-info">
                                                <div class="stat-label">Tổng chi tiêu</div>
                                                <div class="stat-value">{{ formatCurrency(summary.totalAmount) }}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="stat-box">
                                            <div class="stat-icon stat-icon--blue">
                                                <i class="bi bi-graph-up-arrow"></i>
                                            </div>
                                            <div class="stat-info">
                                                <div class="stat-label">Giá trị TB/đơn</div>
                                                <div class="stat-value">{{ formatCurrency(summary.averageOrderValue) }}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="stat-box">
                                            <div class="stat-icon stat-icon--yellow">
                                                <i class="bi bi-calendar-check"></i>
                                            </div>
                                            <div class="stat-info">
                                                <div class="stat-label">Đơn gần nhất</div>
                                                <div class="stat-value small">{{ formatDate(summary.lastPurchaseDate) }}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Lịch sử đơn hàng -->
                            <div class="info-section">
                                <h6 class="section-title mb-3">
                                    <i class="bi bi-clock-history me-2"></i>
                                    Lịch sử mua hàng
                                </h6>
                                <div v-if="ordersLoading" class="text-center py-3">
                                    <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                                </div>
                                <div v-else-if="ordersError" class="error-message mb-0">
                                    <i class="bi bi-exclamation-triangle me-2"></i>
                                    {{ ordersError }}
                                </div>
                                <EmptyState
                                    v-else-if="orders.length === 0"
                                    title="Chưa có đơn hàng"
                                    message="Khách hàng này chưa có đơn hàng nào."
                                >
                                    <template #icon>
                                        <i class="bi bi-receipt-cutoff"></i>
                                    </template>
                                </EmptyState>
                                <div v-else class="orders-list">
                                    <div
                                        v-for="order in orders"
                                        :key="order.id"
                                        class="order-item"
                                    >
                                        <div class="d-flex justify-content-between align-items-start">
                                            <div class="flex-grow-1">
                                                <div class="fw-semibold">Đơn #{{ order.id }}</div>
                                                <div class="small text-muted">
                                                    {{ order.tableName || 'Mang về' }} • {{ formatDateTime(order.createdAt) }}
                                                </div>
                                                <div class="mt-1">
                                                    <span :class="getStatusBadgeClass(order.status)" :style="getStatusBadgeStyle(order.status)">
                                                        {{ getStatusLabel(order.status) }}
                                                    </span>
                                                </div>
                                            </div>
                                            <div class="text-end">
                                                <div class="fw-semibold" style="color: var(--color-primary); font-family: var(--font-family-sans);">{{ formatCurrency(order.totalAmount) }}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                        <EmptyState
                            v-else
                            title="Không tìm thấy khách hàng"
                            message="Không tìm thấy thông tin khách hàng."
                        >
                            <template #icon>
                                <i class="bi bi-person-x"></i>
                            </template>
                        </EmptyState>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" @click="hide">Đóng</button>
                        <button
                            v-if="customer"
                            type="button"
                            class="btn btn-primary"
                            @click="handleEdit"
                        >
                            <i class="bi bi-pencil me-2"></i>
                            Chỉnh sửa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Modal } from 'bootstrap'
import { getCustomerById, getCustomerPurchaseHistory } from '@/api/customerService'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import logger from '@/utils/logger'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const props = defineProps({
    customerId: {
        type: [Number, String],
        default: null
    }
})

const emit = defineEmits(['close', 'edit'])

const modalElement = ref(null)
let modalInstance = null

const customer = ref(null)
const orders = ref([])
const summary = ref({
    totalOrders: 0,
    totalAmount: 0,
    averageOrderValue: 0,
    lastPurchaseDate: null
})
const loading = ref(false)
const ordersLoading = ref(false)
const error = ref(null)
const ordersError = ref(null)

const STATUS_METADATA = {
    PENDING: { label: 'Đang chờ', badgeClass: 'bg-warning-subtle text-warning' },
    PAID: { label: 'Đã thanh toán', badgeClass: 'bg-success-subtle text-success' },
    CANCELLED: { label: 'Đã hủy', badgeClass: 'bg-danger-subtle text-danger' },
    TRANSFERRED: { label: 'Đã chuyển ca', badgeClass: 'bg-info-subtle text-info' }
}

const fetchCustomerDetails = async () => {
    if (!props.customerId) {
        customer.value = null
        return
    }

    loading.value = true
    error.value = null
    try {
        const response = await getCustomerById(props.customerId)
        customer.value = response
        await fetchOrders()
    } catch (err) {
        logger.error('Failed to fetch customer details:', err)
        error.value = err?.response?.data?.message || 'Không thể tải thông tin chi tiết khách hàng.'
        customer.value = null
    } finally {
        loading.value = false
    }
}

const fetchOrders = async () => {
    if (!props.customerId) return

    ordersLoading.value = true
    ordersError.value = null
    try {
        const response = await getCustomerPurchaseHistory({
            id: props.customerId,
            page: 0,
            size: 10
        })

        const ordersList = Array.isArray(response?.content) ? response.content : (Array.isArray(response) ? response : [])
        orders.value = ordersList

        // Tính toán thống kê
        const paidOrders = ordersList.filter(o => o.status === 'PAID')
        summary.value.totalOrders = ordersList.length
        summary.value.totalAmount = paidOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
        summary.value.averageOrderValue = paidOrders.length > 0 ? summary.value.totalAmount / paidOrders.length : 0
        
        if (ordersList.length > 0) {
            const sortedByDate = [...ordersList].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            summary.value.lastPurchaseDate = sortedByDate[0].createdAt
        } else {
            summary.value.lastPurchaseDate = null
        }
    } catch (err) {
        logger.error('Failed to fetch customer orders:', err)
        ordersError.value = 'Không thể tải lịch sử đơn hàng.'
        orders.value = []
    } finally {
        ordersLoading.value = false
    }
}

const formatDate = (value) => {
    if (!value) return '—'
    return formatDateTime(value)
}

const formatLoyaltyPoints = (points) => {
    const numeric = Number(points)
    if (!Number.isFinite(numeric)) return '0'
    return numeric.toLocaleString('vi-VN')
}

const getStatusLabel = (status) => {
    return STATUS_METADATA[status]?.label || status
}

const getStatusBadgeClass = (status) => {
    return 'badge'
}

const getStatusBadgeStyle = (status) => {
    const styles = {
        PENDING: {
            background: 'var(--color-soft-amber)',
            border: '1px solid var(--color-warning)',
            color: 'var(--color-warning)'
        },
        PAID: {
            background: 'var(--color-soft-emerald)',
            border: '1px solid var(--color-success)',
            color: 'var(--color-success)'
        },
        CANCELLED: {
            background: 'var(--color-soft-rose)',
            border: '1px solid var(--color-danger)',
            color: 'var(--color-danger)'
        },
        TRANSFERRED: {
            background: 'var(--color-soft-sky)',
            border: '1px solid var(--color-info)',
            color: 'var(--color-info)'
        }
    }
    return styles[status] || {
        background: 'var(--color-card-muted)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-muted)'
    }
}

const handleEdit = () => {
    if (customer.value) {
        emit('edit', customer.value)
        hide()
    }
}

const show = () => {
    if (modalInstance) {
        modalInstance.show()
        fetchCustomerDetails()
    }
}

const hide = () => {
    if (modalInstance) {
        modalInstance.hide()
    }
    emit('close')
}

watch(() => props.customerId, (newId) => {
    if (newId && modalInstance?._isShown) {
        fetchCustomerDetails()
    }
})

onMounted(() => {
    modalInstance = new Modal(modalElement.value, { backdrop: 'static' })
})

onBeforeUnmount(() => {
    if (modalInstance) {
        modalInstance.dispose()
        modalInstance = null
    }
})

defineExpose({ show, hide })
</script>

<style scoped>
/* Customer Detail Modal - Chuẩn hóa theo base.css */
.customer-detail-modal :global(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-modal);
}

.customer-detail-modal :global(.modal-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
}

.modal-header__content {
    flex: 1;
    min-width: 0;
}

.customer-detail-modal :global(.modal-header .modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.modal-subtitle {
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    margin-bottom: 0;
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.customer-detail-modal :global(.modal-body) {
    padding: var(--spacing-5);
    background: var(--color-card);
    max-height: 70vh;
    overflow-y: auto;
}

.customer-detail-modal :global(.modal-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
    gap: var(--spacing-2);
    justify-content: flex-end;
}

/* Info Section - Chuẩn hóa */
.info-section {
    padding-bottom: var(--spacing-5);
    border-bottom: 1px solid var(--color-border);
    margin-bottom: var(--spacing-5);
}

.info-section:last-of-type {
    border-bottom: none;
    padding-bottom: 0;
    margin-bottom: 0;
}

.section-title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: var(--spacing-3);
    font-family: var(--font-family-sans);
}

.section-title i {
    font-size: 18px;
    line-height: 1;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.info-label {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.info-value {
    font-size: var(--font-size-base);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-semibold);
}

/* Stat Box - Chuẩn hóa */
.stat-box {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    transition: all var(--transition-base);
}

.stat-box:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

.stat-icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 24px;
    color: var(--color-primary);
    background: var(--color-card-muted);
}

/* Màu icon - không dùng gradient, dùng màu nhạt */
.stat-icon--purple {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.stat-icon--green {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.stat-icon--blue {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.stat-icon--yellow {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.stat-info {
    flex: 1;
    min-width: 0;
}

.stat-label {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-2);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.stat-value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.stat-value.small {
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

/* Orders List - Chuẩn hóa */
.orders-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.order-item {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
    transition: all var(--transition-base);
}

.order-item:hover {
    background: var(--color-card);
    border-color: var(--color-primary);
}

/* Badge - Chuẩn hóa */
.customer-detail-modal :global(.badge) {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

/* Error message - không dùng alert */
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

/* Buttons - Chuẩn hóa */
.customer-detail-modal :global(.btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-family-sans);
}

.customer-detail-modal :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.customer-detail-modal :global(.btn-primary i) {
    font-size: 18px;
    line-height: 1;
}

.customer-detail-modal :global(.btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    border-radius: var(--radius-sm);
    padding: 8px 16px;
    color: var(--color-primary);
    background: var(--color-card);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.customer-detail-modal :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

/* Responsive */
@media (max-width: 768px) {
    .customer-detail-modal :global(.modal-dialog) {
        max-width: 90%;
        margin: var(--spacing-4) auto;
    }

    .customer-detail-modal :global(.modal-body) {
        padding: var(--spacing-4);
    }

    .stat-box {
        flex-direction: column;
        text-align: center;
    }

    .stat-icon {
        width: 48px;
        height: 48px;
        font-size: 20px;
    }
}
</style>
