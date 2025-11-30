<template>
    <Teleport to="body">
        <div class="modal fade customer-detail-modal" ref="modalElement" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title">Chi tiết khách hàng #{{ customerId }}</h5>
                            <p class="mb-0 text-muted small">Xem thông tin chi tiết, lịch sử mua hàng và thống kê của khách hàng.</p>
                        </div>
                        <button type="button" class="btn-close" @click="hide" aria-label="Close"></button>
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
                                            <span class="info-value text-primary fw-bold">{{ formatLoyaltyPoints(customer.loyaltyPoints) }} điểm</span>
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
                                <div v-else-if="ordersError" class="alert alert-warning mb-0">
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
                                                    <span :class="getStatusBadgeClass(order.status)">
                                                        {{ getStatusLabel(order.status) }}
                                                    </span>
                                                </div>
                                            </div>
                                            <div class="text-end">
                                                <div class="fw-semibold text-primary">{{ formatCurrency(order.totalAmount) }}</div>
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
    return STATUS_METADATA[status]?.badgeClass || 'badge bg-secondary-subtle text-secondary'
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
:deep(.modal-content) {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-2xl);
}

:deep(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-6);
    background: var(--color-card);
}

:deep(.modal-header .modal-title) {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-1);
}

:deep(.modal-header .text-muted.small) {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
}

.modal-body {
    padding: var(--spacing-6);
    max-height: 70vh;
    overflow-y: auto;
}

:deep(.modal-footer) {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-4) var(--spacing-6);
    background: var(--color-card);
}

.info-section {
    padding-bottom: var(--spacing-6);
    border-bottom: 1px solid var(--color-border);
}

.info-section:last-of-type {
    border-bottom: none;
    padding-bottom: 0;
}

.section-title {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    display: flex;
    align-items: center;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.info-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
}

.info-value {
    font-size: var(--font-size-sm);
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
}

.stat-box {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    border-radius: var(--radius-md);
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: var(--font-size-xl);
    color: var(--color-white);
    border: 2px solid;
}

.stat-icon--purple {
    background: linear-gradient(135deg, #a855f7, #9333ea);
    border-color: #a855f7;
}

.stat-icon--green {
    background: linear-gradient(135deg, #10b981, #059669);
    border-color: #10b981;
}

.stat-icon--blue {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    border-color: #3b82f6;
}

.stat-icon--yellow {
    background: linear-gradient(135deg, #eab308, #ca8a04);
    border-color: #eab308;
}

.stat-info {
    flex: 1;
    min-width: 0;
}

.stat-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-1);
    font-weight: var(--font-weight-medium);
}

.stat-value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
}

.stat-value.small {
    font-size: var(--font-size-sm);
}

.orders-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.order-item {
    padding: var(--spacing-4);
    border-radius: var(--radius-md);
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
    transition: background-color var(--transition-fast);
}

.order-item:hover {
    background: var(--color-card-accent);
}
</style>
