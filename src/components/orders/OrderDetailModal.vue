<template>
    <Teleport to="body">
        <div class="modal fade order-detail-modal" ref="modal" tabindex="-1" aria-labelledby="orderDetailModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-header__content">
                            <h5 class="modal-title" id="orderDetailModalLabel">Chi tiết đơn hàng #{{ order?.id }}</h5>
                            <p class="modal-subtitle">Xem thông tin chi tiết và in hóa đơn cho đơn hàng.</p>
                        </div>
                        <div class="modal-header__actions">
                            <button
                                v-if="order?.status === 'PAID'"
                                class="btn btn-outline-primary btn-sm"
                                type="button"
                                :disabled="printing"
                                @click="printInvoice"
                            >
                                <span v-if="printing" class="spinner-border spinner-border-sm me-2"></span>
                                <i v-else class="bi bi-printer me-2"></i>
                                In hóa đơn
                            </button>
                            <button type="button" class="btn-close" @click="hide" aria-label="Đóng"></button>
                        </div>
                    </div>
                    <div class="modal-body">
                    <LoadingState v-if="loading" />
                    <ErrorState v-else-if="error" :message="error" :show-retry="false" />
                    <template v-else-if="order">
                        <div class="order-detail__info-grid">
                            <div class="order-detail__info-card">
                                <h6 class="order-detail__info-title">Thông tin đơn hàng</h6>
                                <div class="order-detail__info-list">
                                    <div class="order-detail__info-item">
                                        <span class="order-detail__info-label">Bàn:</span>
                                        <span class="order-detail__info-value">{{ order.tableName || 'Mang về' }}</span>
                                    </div>
                                    <div class="order-detail__info-item">
                                        <span class="order-detail__info-label">Nhân viên:</span>
                                        <span class="order-detail__info-value">{{ order.staffUsername || '—' }}</span>
                                    </div>
                                    <div class="order-detail__info-item">
                                        <span class="order-detail__info-label">Khách hàng:</span>
                                        <span class="order-detail__info-value">{{ order.customerName || 'Khách lẻ' }}</span>
                                    </div>
                                    <div class="order-detail__info-item">
                                        <span class="order-detail__info-label">Điện thoại:</span>
                                        <span class="order-detail__info-value">{{ order.customerPhone || '—' }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="order-detail__info-card">
                                <h6 class="order-detail__info-title">Thông tin thanh toán</h6>
                                <div class="order-detail__info-list">
                                    <div class="order-detail__info-item">
                                        <span class="order-detail__info-label">Trạng thái:</span>
                                        <span :class="['badge', getStatusClass(order.status)]" :style="getStatusStyle(order.status)">{{ getStatusLabel(order.status) }}</span>
                                    </div>
                                    <div class="order-detail__info-item">
                                        <span class="order-detail__info-label">Ngày tạo:</span>
                                        <span class="order-detail__info-value">{{ formatDateTime(order.createdAt) }}</span>
                                    </div>
                                    <div class="order-detail__info-item">
                                        <span class="order-detail__info-label">Phương thức:</span>
                                        <span class="order-detail__info-value">{{ order.paymentMethod || '—' }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="order-detail__products-section">
                            <h6 class="order-detail__section-title">Chi tiết sản phẩm</h6>
                            <div class="table-responsive">
                                <table class="table order-detail__table">
                                    <thead>
                                        <tr>
                                            <th>Sản phẩm</th>
                                            <th class="text-center">Số lượng</th>
                                            <th class="text-end">Đơn giá</th>
                                            <th>Ghi chú</th>
                                            <th class="text-end">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="item in order.orderDetails" :key="item.id">
                                            <td>{{ item.productName }}</td>
                                            <td class="text-center">{{ item.quantity }}</td>
                                            <td class="text-end">{{ formatCurrency(item.priceAtOrder) }}</td>
                                            <td class="text-muted">{{ item.notes || '—' }}</td>
                                            <td class="text-end fw-semibold">{{ formatCurrency(item.quantity * item.priceAtOrder) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="order-detail__summary">
                            <div class="order-detail__summary-item">
                                <span class="order-detail__summary-label">Tổng phụ:</span>
                                <span class="order-detail__summary-value">{{ formatCurrency(order.subTotal) }}</span>
                            </div>
                            <div class="order-detail__summary-item">
                                <span class="order-detail__summary-label">Giảm giá:</span>
                                <span class="order-detail__summary-value text-danger">-{{ formatCurrency(order.discountAmount) }}</span>
                            </div>
                            <div v-if="order.tipAmount && order.tipAmount > 0" class="order-detail__summary-item">
                                <span class="order-detail__summary-label">Tiền típ:</span>
                                <span class="order-detail__summary-value">{{ formatCurrency(order.tipAmount) }}</span>
                            </div>
                            <div class="order-detail__summary-divider"></div>
                            <div class="order-detail__summary-item order-detail__summary-item--total">
                                <span class="order-detail__summary-label">Tổng cộng:</span>
                                <span class="order-detail__summary-value order-detail__summary-value--total">{{ formatCurrency(order.totalAmount) }}</span>
                            </div>
                        </div>
                    </template>
                    <EmptyState
                        v-else
                        title="Không tìm thấy đơn hàng"
                        message="Không tìm thấy thông tin đơn hàng."
                    >
                        <template #icon>
                            <i class="bi bi-receipt-cutoff"></i>
                        </template>
                    </EmptyState>
                </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" @click="hide">Đóng</button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Modal } from 'bootstrap'
import * as orderService from '@/api/orderService'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { toast } from 'vue3-toastify'
import { printInvoiceToWindow } from '@/utils/invoicePrinter'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const props = defineProps({
    orderId: Number,
})

const modal = ref(null)
let modalInstance = null

const order = ref(null)
const loading = ref(false)
const error = ref(null)
const printing = ref(false)

watch(() => props.orderId, (newId) => {
    if (newId) {
        fetchOrderDetail(newId)
    }
})

const fetchOrderDetail = async (id) => {
    loading.value = true
    error.value = null
    try {
        order.value = await orderService.getOrderById(id)
    } catch (err) {
        error.value = 'Không thể tải chi tiết đơn hàng.'
    } finally {
        loading.value = false
    }
}

const getStatusClass = (status) => {
    return 'badge'
}

const getStatusStyle = (status) => {
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

const getStatusLabel = (status) => {
    const labels = {
        'PENDING': 'Đang chờ',
        'PAID': 'Đã thanh toán',
        'CANCELLED': 'Đã hủy',
        'TRANSFERRED': 'Đã chuyển ca'
    }
    return labels[status] || status
}

const show = () => {
    modalInstance.show()
}

const hide = () => {
    modalInstance.hide()
}

onMounted(() => {
    modalInstance = new Modal(modal.value)
})

const printInvoice = async () => {
    if (!order.value) {
        toast.warning('Không có dữ liệu đơn hàng để in.')
        return
    }
    try {
        printing.value = true
        const printWindow = printInvoiceToWindow(order.value)
        if (!printWindow) {
            toast.error('Trình duyệt chặn cửa sổ in. Vui lòng cho phép popup.')
            return
        }
        toast.success('Đã gửi lệnh in hóa đơn.')
    } catch (err) {
        toast.error('Không thể in hóa đơn. Vui lòng thử lại.')
    } finally {
        printing.value = false
    }
}

defineExpose({ show, hide })
</script>

<style scoped>
/* Modal - Chuẩn hóa theo base.css */
.order-detail-modal :global(.modal-dialog) {
    max-width: 900px;
}

.order-detail-modal :global(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-modal);
}

.order-detail-modal :global(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4);
    background: var(--color-card);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-4);
}

.modal-header__content {
    flex: 1;
    min-width: 0;
}

.order-detail-modal :global(.modal-header .modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-1);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.modal-subtitle {
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    margin-bottom: 0;
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.modal-header__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    flex-shrink: 0;
}

.order-detail-modal :global(.modal-body) {
    padding: var(--spacing-5);
    max-height: calc(100vh - 200px);
    overflow-y: auto;
    background: var(--color-card);
}

.order-detail-modal :global(.modal-footer) {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-4);
    background: var(--color-card);
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-2);
}

/* Info Grid - Chuẩn hóa */
.order-detail__info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--spacing-4);
    margin-bottom: var(--spacing-5);
}

.order-detail__info-card {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.order-detail__info-title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-3);
    padding-bottom: var(--spacing-2);
    border-bottom: 1px solid var(--color-border);
    font-family: var(--font-family-sans);
}

.order-detail__info-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.order-detail__info-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-3);
}

.order-detail__info-label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    flex-shrink: 0;
    min-width: 100px;
    font-family: var(--font-family-sans);
}

.order-detail__info-value {
    font-size: var(--font-size-base);
    color: var(--color-heading);
    text-align: right;
    word-break: break-word;
    font-family: var(--font-family-sans);
}

/* Products Section - Chuẩn hóa */
.order-detail__products-section {
    margin-bottom: var(--spacing-5);
}

.order-detail__section-title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-3);
    padding-bottom: var(--spacing-2);
    border-bottom: 1px solid var(--color-border);
    font-family: var(--font-family-sans);
}

.order-detail__table {
    margin-bottom: 0;
    border-collapse: separate;
    border-spacing: 0;
}

.order-detail__table thead th {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    background: var(--color-card-muted);
    border-bottom: 1px solid var(--color-border);
    border-top: none;
    border-left: none;
    border-right: none;
    padding: var(--spacing-3) var(--spacing-4);
    font-family: var(--font-family-sans);
}

.order-detail__table tbody td {
    font-size: var(--font-size-base);
    padding: var(--spacing-3) var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    border-top: none;
    border-left: none;
    border-right: none;
    vertical-align: middle;
    font-family: var(--font-family-sans);
}

.order-detail__table tbody tr:last-child td {
    border-bottom: none;
}

/* Summary - Chuẩn hóa */
.order-detail__summary {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.order-detail__summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-4);
}

.order-detail__summary-label {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.order-detail__summary-value {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.order-detail__summary-divider {
    height: 1px;
    background: var(--color-border);
    margin: var(--spacing-2) 0;
}

.order-detail__summary-item--total {
    margin-top: var(--spacing-2);
}

.order-detail__summary-item--total .order-detail__summary-label {
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.order-detail__summary-value--total {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    font-family: var(--font-family-sans);
}

/* Badge - Chuẩn hóa */
.order-detail-modal :global(.badge) {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

/* Responsive */
@media (max-width: 768px) {
    .order-detail__info-grid {
        grid-template-columns: 1fr;
    }

    .order-detail-modal :global(.modal-dialog) {
        max-width: 90%;
        margin: var(--spacing-4) auto;
    }

    .order-detail-modal :global(.modal-body) {
        padding: var(--spacing-4);
    }

    .order-detail__table {
        font-size: var(--font-size-base);
    }

    .order-detail__table thead th,
    .order-detail__table tbody td {
        padding: var(--spacing-2);
    }
}
</style>
