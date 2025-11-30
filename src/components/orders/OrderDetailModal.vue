<template>
    <Teleport to="body">
        <div class="modal fade order-detail-modal" ref="modal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                <div class="modal-header">
                    <div>
                        <h5 class="modal-title">Chi tiết đơn hàng #{{ order?.id }}</h5>
                        <p class="mb-0 text-muted small">Xem thông tin chi tiết và in hóa đơn cho đơn hàng.</p>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <button
                            v-if="order?.status === 'PAID'"
                            class="btn btn-outline-primary btn-sm"
                            type="button"
                            :disabled="printing"
                            @click="printInvoice"
                        >
                            <span v-if="printing" class="spinner-border spinner-border-sm me-1"></span>
                            <i v-else class="bi bi-printer me-1"></i>
                            In hóa đơn
                        </button>
                        <button type="button" class="btn-close" @click="hide" aria-label="Close"></button>
                    </div>
                </div>
                <div class="modal-body">
                    <LoadingState v-if="loading" />
                    <ErrorState v-else-if="error" :message="error" :show-retry="false" />
                    <template v-else-if="order">
                        <div class="row g-4 mb-4">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-body">
                                        <h6 class="card-title mb-3">Thông tin đơn hàng</h6>
                                        <div class="mb-2">
                                            <strong class="text-muted d-block mb-1">Bàn:</strong>
                                            <span>{{ order.tableName || 'Mang về' }}</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong class="text-muted d-block mb-1">Nhân viên:</strong>
                                            <span>{{ order.staffUsername || '—' }}</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong class="text-muted d-block mb-1">Khách hàng:</strong>
                                            <span>{{ order.customerName || 'Khách lẻ' }}</span>
                                        </div>
                                        <div class="mb-0">
                                            <strong class="text-muted d-block mb-1">Điện thoại:</strong>
                                            <span>{{ order.customerPhone || '—' }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-body">
                                        <h6 class="card-title mb-3">Thông tin thanh toán</h6>
                                        <div class="mb-2">
                                            <strong class="text-muted d-block mb-1">Trạng thái:</strong>
                                            <span :class="['badge', getStatusClass(order.status)]">{{ getStatusLabel(order.status) }}</span>
                                        </div>
                                        <div class="mb-2">
                                            <strong class="text-muted d-block mb-1">Ngày tạo:</strong>
                                            <span>{{ formatDateTime(order.createdAt) }}</span>
                                        </div>
                                        <div class="mb-0">
                                            <strong class="text-muted d-block mb-1">Phương thức:</strong>
                                            <span>{{ order.paymentMethod || '—' }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card mb-4">
                            <div class="card-header">
                                <h6 class="mb-0">Chi tiết sản phẩm</h6>
                            </div>
                            <div class="card-body p-0">
                                <div class="table-responsive">
                                    <table class="table table-hover mb-0">
                                        <thead class="table-light">
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
                                                <td>{{ item.notes || '—' }}</td>
                                                <td class="text-end fw-semibold">{{ formatCurrency(item.quantity * item.priceAtOrder) }}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-body">
                                <div class="row justify-content-end">
                                    <div class="col-md-6">
                                        <div class="d-flex justify-content-between mb-2">
                                            <span class="text-muted">Tổng phụ:</span>
                                            <strong>{{ formatCurrency(order.subTotal) }}</strong>
                                        </div>
                                        <div class="d-flex justify-content-between mb-2">
                                            <span class="text-muted">Giảm giá:</span>
                                            <strong class="text-danger">-{{ formatCurrency(order.discountAmount) }}</strong>
                                        </div>
                                        <div v-if="order.tipAmount && order.tipAmount > 0" class="d-flex justify-content-between mb-2">
                                            <span class="text-muted">Tiền típ:</span>
                                            <strong>{{ formatCurrency(order.tipAmount) }}</strong>
                                        </div>
                                        <hr>
                                        <div class="d-flex justify-content-between">
                                            <span class="fw-bold">Tổng cộng:</span>
                                            <h5 class="mb-0 text-primary">{{ formatCurrency(order.totalAmount) }}</h5>
                                        </div>
                                    </div>
                                </div>
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
    switch (status) {
        case 'PENDING': return 'badge bg-warning-subtle text-warning'
        case 'PAID': return 'badge bg-success-subtle text-success'
        case 'CANCELLED': return 'badge bg-danger-subtle text-danger'
        case 'TRANSFERRED': return 'badge bg-info-subtle text-info'
        default: return 'badge bg-secondary-subtle text-secondary'
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
.order-detail-modal :global(.modal-content) {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-2xl);
}

.order-detail-modal :global(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-6);
    background: var(--color-card);
}

.order-detail-modal :global(.modal-header .modal-title) {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-1);
}

.order-detail-modal :global(.modal-header .text-muted.small) {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
}

.order-detail-modal :global(.modal-body) {
    padding: var(--spacing-6);
}

.order-detail-modal :global(.modal-footer) {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-4) var(--spacing-6);
    background: var(--color-card);
}

.order-detail-modal :global(.modal-backdrop.show) {
    backdrop-filter: none !important;
    filter: none !important;
}
</style>
