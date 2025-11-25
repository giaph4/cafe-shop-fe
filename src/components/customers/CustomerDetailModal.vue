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
                        <template v-if="loading">
                            <div class="text-center py-5">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Đang tải...</span>
                                </div>
                            </div>
                        </template>
                        <template v-else-if="error">
                            <div class="alert alert-danger">{{ error }}</div>
                        </template>
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
                                <div v-else-if="orders.length === 0" class="text-center text-muted py-4">
                                    <i class="bi bi-inbox fs-3 d-block mb-2"></i>
                                    <p class="mb-0">Chưa có đơn hàng nào</p>
                                </div>
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
                                                    <span :class="['badge', getStatusBadgeClass(order.status)]">
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
                        <template v-else>
                            <div class="text-center text-muted py-4">
                                <i class="bi bi-person-x fs-1 mb-3 d-block"></i>
                                <p class="mb-0">Không tìm thấy thông tin khách hàng.</p>
                            </div>
                        </template>
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
    return STATUS_METADATA[status]?.badgeClass || 'bg-secondary-subtle text-secondary'
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
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    box-shadow: 0 10px 40px rgba(15, 23, 42, 0.15);
}

:deep(.modal-header) {
    border-bottom: 1px solid #e2e8f0;
    padding: 1.5rem;
    background: #ffffff;
}

:deep(.modal-header .modal-title) {
    font-weight: 700;
    color: #1e293b;
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
}

:deep(.modal-header .text-muted.small) {
    color: #64748b;
    font-size: 0.875rem;
}

.modal-body {
    padding: 1.5rem;
    max-height: 70vh;
    overflow-y: auto;
}

:deep(.modal-footer) {
    border-top: 1px solid #e2e8f0;
    padding: 1rem 1.5rem;
    background: #ffffff;
}

.info-section {
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
}

.info-section:last-of-type {
    border-bottom: none;
    padding-bottom: 0;
}

.section-title {
    font-weight: 700;
    color: #1e293b;
    font-size: 1rem;
    display: flex;
    align-items: center;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.info-label {
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 500;
}

.info-value {
    font-size: 0.95rem;
    color: #1e293b;
    font-weight: 600;
}

.stat-box {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 1.25rem;
    color: #ffffff;
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
    font-size: 0.75rem;
    color: #64748b;
    margin-bottom: 0.25rem;
    font-weight: 500;
}

.stat-value {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.2;
}

.stat-value.small {
    font-size: 0.875rem;
}

.orders-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.order-item {
    padding: 1rem;
    border-radius: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    transition: background-color 0.2s;
}

.order-item:hover {
    background: #f1f5f9;
}
</style>
