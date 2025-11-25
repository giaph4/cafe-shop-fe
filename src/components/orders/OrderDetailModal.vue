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
                    <template v-if="loading">
                        <div class="text-center">
                            <div class="spinner-border text-primary" role="status"></div>
                        </div>
                    </template>
                    <template v-else-if="error">
                        <div class="alert alert-danger">{{ error }}</div>
                    </template>
                    <template v-else-if="order">
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Bàn:</strong> {{ order.tableName }}</p>
                                <p><strong>Nhân viên:</strong> {{ order.staffUsername }}</p>
                                <p><strong>Khách hàng:</strong> {{ order.customerName || 'N/A' }}</p>
                                <p><strong>Điện thoại:</strong> {{ order.customerPhone || 'N/A' }}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Trạng thái:</strong> <span :class="['badge', getStatusClass(order.status)]">{{ order.status }}</span></p>
                                <p><strong>Ngày tạo:</strong> {{ formatDateTime(order.createdAt) }}</p>
                                <p><strong>Thanh toán:</strong> {{ order.paymentMethod || 'N/A' }}</p>
                            </div>
                        </div>
                        <hr>
                        <h6>Chi tiết sản phẩm</h6>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Sản phẩm</th>
                                    <th>Số lượng</th>
                                    <th>Đơn giá</th>
                                    <th>Ghi chú</th>
                                    <th>Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in order.orderDetails" :key="item.id">
                                    <td>{{ item.productName }}</td>
                                    <td>{{ item.quantity }}</td>
                                    <td>{{ formatCurrency(item.priceAtOrder) }}</td>
                                    <td>{{ item.notes }}</td>
                                    <td>{{ formatCurrency(item.quantity * item.priceAtOrder) }}</td>
                                </tr>
                            </tbody>
                        </table>
                        <hr>
                        <div class="row justify-content-end text-end">
                            <div class="col-md-6">
                                <p><strong>Tổng phụ:</strong> {{ formatCurrency(order.subTotal) }}</p>
                                <p><strong>Giảm giá:</strong> -{{ formatCurrency(order.discountAmount) }}</p>
                                <h5><strong>Tổng cộng:</strong> {{ formatCurrency(order.totalAmount) }}</h5>
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <div class="text-center text-muted py-4">
                            <i class="bi bi-receipt-cutoff fs-1 mb-3 d-block"></i>
                            <p class="mb-0">Không tìm thấy thông tin đơn hàng.</p>
                        </div>
                    </template>
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
        case 'PENDING': return 'bg-warning'
        case 'PAID': return 'bg-success'
        case 'CANCELLED': return 'bg-danger'
        default: return 'bg-secondary'
    }
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
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    box-shadow: 0 10px 40px rgba(15, 23, 42, 0.15);
}

.order-detail-modal :global(.modal-header) {
    border-bottom: 1px solid #e2e8f0;
    padding: 1.5rem;
    background: #ffffff;
}

.order-detail-modal :global(.modal-header .modal-title) {
    font-weight: 700;
    color: #1e293b;
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
}

.order-detail-modal :global(.modal-header .text-muted.small) {
    color: #64748b;
    font-size: 0.875rem;
}

.order-detail-modal :global(.modal-body) {
    padding: 1.5rem;
}

.order-detail-modal :global(.modal-footer) {
    border-top: 1px solid #e2e8f0;
    padding: 1rem 1.5rem;
    background: #ffffff;
}

.order-detail-modal :global(.modal-backdrop.show) {
    backdrop-filter: none !important;
    filter: none !important;
}
</style>
