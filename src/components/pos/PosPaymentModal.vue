<template>
    <Teleport to="body">
        <div class="modal fade pos-payment-modal" ref="modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <header class="modal-header align-items-start">
                        <div>
                            <h5 class="modal-title">Thanh toán đơn #{{ orderCode }}</h5>
                            <p v-if="localOrder" class="mb-0 text-muted small">
                                Cập nhật: {{ formatDateTime(localOrder.updatedAt || localOrder.createdAt) }}
                            </p>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            <span v-if="statusMeta" class="status-pill" :class="statusMeta.class">{{ statusMeta.label }}</span>
                            <button
                                v-if="isPaid"
                                class="btn btn-outline-primary btn-sm"
                                type="button"
                                :disabled="printing"
                                @click="handlePrint"
                            >
                                <span v-if="printing" class="spinner-border spinner-border-sm me-1"></span>
                                <i v-else class="bi bi-printer me-1"></i>
                                In hóa đơn
                            </button>
                            <button type="button" class="btn-close" :disabled="processing" @click="hide"></button>
                        </div>
                    </header>

                    <section v-if="localOrder" class="modal-body">
                        <div class="row g-4">
                            <div class="col-md-6">
                                <ul class="list-unstyled payment-meta">
                                    <li><span class="label">Bàn phục vụ</span><span>{{ tableLabel }}</span></li>
                                    <li><span class="label">Nhân viên</span><span>{{ localOrder.staffUsername || localOrder.staffName || '—' }}</span></li>
                                    <li><span class="label">Khách hàng</span><span>{{ localOrder.customerName || 'Khách lẻ' }}</span></li>
                                    <li><span class="label">Thời gian tạo</span><span>{{ formatDateTime(localOrder.createdAt) }}</span></li>
                                    <li v-if="localOrder.paymentMethod"><span class="label">Phương thức</span><span>{{ paymentMethodDisplay }}</span></li>
                                </ul>
                            </div>
                            <div class="col-md-6">
                                <div class="payment-totals">
                                    <div><span>Tổng phụ</span><span>{{ formatCurrency(localOrder.subTotal ?? subTotal) }}</span></div>
                                    <div><span>Giảm giá</span><span class="text-danger">-{{ formatCurrency(localOrder.discountAmount ?? 0) }}</span></div>
                                    <div class="grand-total"><span>Tổng cộng</span><span>{{ formatCurrency(localOrder.totalAmount ?? subTotal) }}</span></div>
                                </div>
                            </div>
                        </div>

                        <hr>

                        <section class="payment-items">
                            <h6 class="mb-3">Chi tiết sản phẩm</h6>
                            <div v-if="!orderItems.length" class="text-center text-muted py-4">
                                <i class="bi bi-basket fs-1 mb-2 d-block"></i>
                                <span>Đơn hàng chưa có sản phẩm.</span>
                            </div>
                            <div v-else class="table-responsive">
                                <table class="table align-middle">
                                    <thead>
                                        <tr>
                                            <th>Sản phẩm</th>
                                            <th class="text-end">SL</th>
                                            <th class="text-end">Đơn giá</th>
                                            <th class="text-end">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="item in orderItems" :key="item.id || item.productId">
                                            <td>
                                                <div class="fw-semibold">{{ item.productName }}</div>
                                                <small v-if="item.notes" class="text-muted">Ghi chú: {{ item.notes }}</small>
                                            </td>
                                            <td class="text-end">{{ item.quantity }}</td>
                                            <td class="text-end">{{ formatCurrency(item.priceAtOrder) }}</td>
                                            <td class="text-end">{{ formatCurrency(item.quantity * item.priceAtOrder) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section v-if="!isPaid" class="payment-methods mt-4">
                            <h6 class="mb-2">Chọn phương thức thanh toán</h6>
                            <div class="btn-group payment-methods__group" role="group">
                                <button
                                    v-for="method in PAYMENT_METHODS"
                                    :key="method.value"
                                    type="button"
                                    class="btn"
                                    :class="[
                                        selectedPaymentMethod === method.value ? 'btn-primary' : 'btn-outline-primary',
                                        'payment-methods__btn'
                                    ]"
                                    :disabled="processing"
                                    @click="selectedPaymentMethod = method.value"
                                >
                                    <i :class="method.icon" class="me-2"></i>{{ method.label }}
                                </button>
                            </div>
                        </section>
                    </section>
                    <section v-else class="modal-body py-5 text-center text-muted">
                        Không có dữ liệu đơn hàng để hiển thị.
                    </section>

                    <footer class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" :disabled="processing" @click="hide">Đóng</button>
                        <button
                            v-if="!isPaid"
                            type="button"
                            class="btn btn-success"
                            :disabled="processing || !localOrder || !selectedPaymentMethod"
                            @click="handleConfirm"
                        >
                            <span v-if="processing" class="spinner-border spinner-border-sm me-2"></span>
                            Xác nhận thanh toán
                        </button>
                    </footer>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Modal } from 'bootstrap'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { printInvoiceToWindow } from '@/utils/invoicePrinter'
import { toast } from 'vue3-toastify'
import logger from '@/utils/logger'

const props = defineProps({
    order: { type: Object, default: null },
    table: { type: Object, default: null },
    processing: { type: Boolean, default: false }
})

const emit = defineEmits(['confirm-payment', 'closed'])

const modal = ref(null)
let modalInstance = null

const localOrder = ref(null)
const printing = ref(false)
const selectedPaymentMethod = ref('CASH')

const STATUS_METADATA = Object.freeze({
    PENDING: { label: 'Đang chờ', class: 'status-pill--pending' },
    PAID: { label: 'Đã thanh toán', class: 'status-pill--paid' },
    CANCELLED: { label: 'Đã hủy', class: 'status-pill--cancelled' },
    TRANSFERRED: { label: 'Đã chuyển ca', class: 'status-pill--transferred' },
})

const PAYMENT_METHODS = Object.freeze([
    { value: 'CASH', label: 'Tiền mặt', icon: 'bi bi-cash' },
    { value: 'TRANSFER', label: 'Chuyển khoản', icon: 'bi bi-bank' },
    { value: 'CARD', label: 'Thẻ', icon: 'bi bi-credit-card' },
])

const orderCode = computed(() => localOrder.value?.code || localOrder.value?.id || '—')
const statusMeta = computed(() => {
    const status = localOrder.value?.status
    return status ? STATUS_METADATA[status] || { label: status, class: 'status-pill--default' } : null
})
const isPaid = computed(() => localOrder.value?.status === 'PAID')
const orderItems = computed(() => {
    const items = localOrder.value?.items
    if (Array.isArray(items)) return items
    if (Array.isArray(localOrder.value?.orderDetails)) return localOrder.value.orderDetails
    return []
})
const subTotal = computed(() => orderItems.value.reduce((sum, item) => sum + (Number(item.priceAtOrder) || 0) * (Number(item.quantity) || 0), 0))
const tableLabel = computed(() => {
    if (localOrder.value?.tableName) return localOrder.value.tableName
    if (localOrder.value?.table?.name) return localOrder.value.table.name
    if (props.table?.name) return props.table.name
    if (localOrder.value?.type === 'TAKE_AWAY') return 'Mang đi'
    return '—'
})

const paymentMethodDisplay = computed(() => {
    if (!localOrder.value?.paymentMethod) return '—'
    const method = PAYMENT_METHODS.find(item => item.value === localOrder.value.paymentMethod)
    return method ? method.label : localOrder.value.paymentMethod
})

const show = () => modalInstance?.show()
const hide = () => modalInstance?.hide()

const syncOrder = (incoming) => {
    if (!incoming) {
        localOrder.value = null
        return
    }
    try {
        localOrder.value = structuredClone(incoming)
    } catch (err) {
        localOrder.value = JSON.parse(JSON.stringify(incoming))
    }

    if (localOrder.value?.paymentMethod) {
        selectedPaymentMethod.value = localOrder.value.paymentMethod
    } else {
        selectedPaymentMethod.value = 'CASH'
    }
}

watch(() => props.order, syncOrder, { immediate: true })

const handleConfirm = () => {
    if (!localOrder.value?.id) {
        toast.warning('Thiếu thông tin đơn hàng để thanh toán.')
        return
    }
    emit('confirm-payment', {
        orderId: localOrder.value.id,
        paymentMethod: selectedPaymentMethod.value || 'CASH',
    })
}

const handlePrint = async () => {
    if (!localOrder.value) {
        toast.warning('Không có dữ liệu để in.')
        return
    }
    try {
        printing.value = true
        const windowRef = printInvoiceToWindow(localOrder.value)
        if (!windowRef) {
            toast.error('Trình duyệt chặn cửa sổ in. Cho phép popup để tiếp tục.')
        } else {
            toast.success('Đã gửi lệnh in hóa đơn.')
        }
    } catch (error) {
        logger.error('Failed to print receipt:', error)
        toast.error('Không thể in hóa đơn. Vui lòng thử lại.')
    } finally {
        printing.value = false
    }
}

onMounted(() => {
    if (!modal.value) return
    modalInstance = new Modal(modal.value, { backdrop: 'static' })
    modal.value.addEventListener('hidden.bs.modal', () => emit('closed'))
})

onBeforeUnmount(() => {
    if (modalInstance) {
        modalInstance.hide()
        modalInstance.dispose()
        modalInstance = null
    }
})

watch(() => isPaid.value, (paid) => {
    if (paid && printing.value) printing.value = false
    if (paid && localOrder.value?.paymentMethod) {
        selectedPaymentMethod.value = localOrder.value.paymentMethod
    }
})

watch(() => props.processing, (processing) => {
    if (!processing && isPaid.value && localOrder.value) {
        syncOrder(localOrder.value)
    }
})

defineExpose({ show, hide })
</script>

<style scoped>
.pos-payment-modal :global(.modal-content) {
    border-radius: 20px;
    border: none;
}

.pos-payment-modal :global(.modal-header) {
    padding: 1.5rem 1.5rem 1rem;
    border-bottom: none;
}

.pos-payment-modal :global(.modal-body) {
    padding: 0 1.5rem 1.5rem;
}

.pos-payment-modal :global(.modal-footer) {
    padding: 1rem 1.5rem 1.5rem;
    border-top: none;
}

.payment-meta li {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.35rem 0;
    font-size: 0.95rem;
}

.payment-meta .label {
    color: #64748b;
    font-weight: 600;
}

.payment-totals {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.payment-totals div {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.payment-totals .grand-total {
    font-size: 1.1rem;
    font-weight: 700;
}

.status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.status-pill--pending {
    background: rgba(250, 204, 21, 0.18);
    color: #b45309;
}

.status-pill--paid {
    background: rgba(34, 197, 94, 0.18);
    color: #15803d;
}

.status-pill--cancelled {
    background: rgba(239, 68, 68, 0.18);
    color: #b91c1c;
}

.status-pill--transferred {
    background: rgba(129, 140, 248, 0.18);
    color: #4338ca;
}

.status-pill--default {
    background: rgba(148, 163, 184, 0.18);
    color: #475569;
}

.payment-items table {
    border-radius: 12px;
    overflow: hidden;
}

.payment-methods__group {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.payment-methods__btn {
    min-width: 120px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    text-transform: uppercase;
    font-size: 0.85rem;
    font-weight: 600;
    border-radius: 999px;
    padding: 0.6rem 1.1rem;
}

.payment-methods__btn i {
    font-size: 1rem;
}
</style>
