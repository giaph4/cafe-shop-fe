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
                                    <div v-if="(localOrder.discountAmount ?? 0) > 0"><span>Giảm giá</span><span class="text-danger">-{{ formatCurrency(localOrder.discountAmount ?? 0) }}</span></div>
                                    <div v-if="displayTipAmount > 0" class="text-success"><span>Tiền típ</span><span>+{{ formatCurrency(displayTipAmount) }}</span></div>
                                    <div class="grand-total"><span>Tổng cộng</span><span>{{ formatCurrency(calculatedTotalAmount) }}</span></div>
                                </div>
                            </div>
                        </div>

                        <hr>

                        <section class="payment-items">
                            <h6 class="mb-3">Chi tiết sản phẩm</h6>
                            <EmptyState
                                v-if="!orderItems.length"
                                title="Chưa có sản phẩm"
                                message="Đơn hàng chưa có sản phẩm nào."
                            >
                                <template #icon>
                                    <i class="bi bi-basket"></i>
                                </template>
                            </EmptyState>
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

                        <section v-if="!isPaid" class="payment-options mt-4">
                            <!-- Customer Phone Number -->
                            <div class="payment-customer mb-4">
                                <h6 class="mb-2">Thông tin khách hàng</h6>
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="bi bi-telephone"></i>
                                    </span>
                                    <input
                                        v-model.trim="customerPhone"
                                        type="tel"
                                        class="form-control"
                                        placeholder="Nhập số điện thoại (tùy chọn)"
                                        :disabled="processing || customerLoading"
                                        @blur="handlePhoneBlur"
                                    />
                                    <button
                                        v-if="customerLoading"
                                        class="btn btn-outline-secondary"
                                        type="button"
                                        disabled
                                    >
                                        <span class="spinner-border spinner-border-sm"></span>
                                    </button>
                                    <button
                                        v-else-if="customerPhone && !foundCustomer"
                                        class="btn btn-outline-primary"
                                        type="button"
                                        :disabled="processing"
                                        @click="handleFindOrCreateCustomer"
                                    >
                                        <i class="bi bi-search me-1"></i>Tìm/Tạo
                                    </button>
                                </div>
                                <div v-if="foundCustomer" class="mt-2">
                                    <small class="text-success">
                                        <i class="bi bi-check-circle me-1"></i>
                                        Khách hàng: {{ foundCustomer.fullName || foundCustomer.phone }}
                                    </small>
                                </div>
                                <div v-if="customerError" class="mt-2">
                                    <small class="text-danger">
                                        <i class="bi bi-exclamation-triangle me-1"></i>
                                        {{ customerError }}
                                    </small>
                                </div>
                                <small class="text-muted d-block mt-2">
                                    <i class="bi bi-info-circle me-1"></i>
                                    Nếu số điện thoại không tồn tại, hệ thống sẽ tự động tạo khách hàng mới
                                </small>
                            </div>

                            <!-- Voucher Code -->
                            <div class="payment-voucher mb-4">
                                <h6 class="mb-2">Mã giảm giá</h6>
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="bi bi-ticket-perforated"></i>
                                    </span>
                                    <input
                                        v-model.trim="voucherCode"
                                        type="text"
                                        class="form-control"
                                        placeholder="Nhập mã voucher"
                                        :disabled="processing || voucherLoading || !canApplyVoucher"
                                        @blur="handleVoucherBlur"
                                    />
                                    <button
                                        v-if="voucherLoading"
                                        class="btn btn-outline-secondary"
                                        type="button"
                                        disabled
                                    >
                                        <span class="spinner-border spinner-border-sm"></span>
                                    </button>
                                    <button
                                        v-else-if="voucherCode && !voucherApplied"
                                        class="btn btn-outline-primary"
                                        type="button"
                                        :disabled="processing || !canApplyVoucher"
                                        @click="handleCheckVoucher"
                                    >
                                        <i class="bi bi-search me-1"></i>Kiểm tra
                                    </button>
                                    <button
                                        v-else-if="voucherApplied"
                                        class="btn btn-outline-danger"
                                        type="button"
                                        :disabled="processing"
                                        @click="handleRemoveVoucher"
                                    >
                                        <i class="bi bi-x-circle me-1"></i>Bỏ
                                    </button>
                                </div>
                                <div v-if="voucherCheckResult" class="mt-2">
                                    <small :class="voucherCheckResult.valid ? 'text-success' : 'text-danger'">
                                        <i :class="voucherCheckResult.valid ? 'bi bi-check-circle' : 'bi bi-x-circle'" class="me-1"></i>
                                        {{ voucherCheckResult.message }}
                                        <span v-if="voucherCheckResult.valid && voucherCheckResult.discountAmount">
                                            - Giảm: {{ formatCurrency(voucherCheckResult.discountAmount) }}
                                        </span>
                                    </small>
                                </div>
                                <div v-if="!canApplyVoucher" class="mt-2">
                                    <small class="text-warning">
                                        <i class="bi bi-info-circle me-1"></i>
                                        Voucher chỉ áp dụng được khi đơn hàng đã được lưu
                                    </small>
                                </div>
                            </div>

                            <div class="payment-methods mb-4">
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
                            </div>
                            
                            <div class="payment-tip">
                                <h6 class="mb-2">Tiền típ (tùy chọn)</h6>
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="bi bi-cash-coin"></i>
                                    </span>
                                    <input
                                        v-model.number="tipAmount"
                                        type="number"
                                        class="form-control"
                                        placeholder="Nhập số tiền típ"
                                        min="0"
                                        step="1000"
                                        :disabled="processing"
                                        @input="handleTipInput"
                                    />
                                    <button
                                        v-for="quickTip in QUICK_TIP_OPTIONS"
                                        :key="quickTip"
                                        type="button"
                                        class="btn btn-outline-secondary"
                                        :disabled="processing"
                                        @click="applyQuickTip(quickTip)"
                                    >
                                        {{ formatCurrency(quickTip) }}
                                    </button>
                                </div>
                                <small class="text-muted d-block mt-2">
                                    <i class="bi bi-info-circle me-1"></i>
                                    Tiền típ sẽ được cộng vào tổng thanh toán cuối cùng
                                </small>
                            </div>
                        </section>
                    </section>
                    <EmptyState
                        v-else
                        title="Không có dữ liệu"
                        message="Không có dữ liệu đơn hàng để hiển thị."
                    >
                        <template #icon>
                            <i class="bi bi-receipt-cutoff"></i>
                        </template>
                    </EmptyState>

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
import EmptyState from '@/components/common/EmptyState.vue'
import { getCustomerByPhone, createCustomer } from '@/api/customerService'
import { checkVoucher, applyVoucher as applyVoucherApi, removeVoucher as removeVoucherApi } from '@/api/voucherService'
import * as orderService from '@/api/orderService'

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
const tipAmount = ref(0)

// Customer phone
const customerPhone = ref('')
const foundCustomer = ref(null)
const customerLoading = ref(false)
const customerError = ref(null)

// Voucher
const voucherCode = ref('')
const voucherCheckResult = ref(null)
const voucherLoading = ref(false)
const voucherApplied = ref(false)

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

const QUICK_TIP_OPTIONS = Object.freeze([10000, 20000, 50000, 100000])

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

const discountAmount = computed(() => {
    const discount = Number(localOrder.value?.discountAmount) || 0
    return Math.max(discount, 0)
})

const displayTipAmount = computed(() => {
    // Ưu tiên lấy từ localOrder (khi đã thanh toán), sau đó từ tipAmount ref (khi đang nhập)
    if (localOrder.value?.tipAmount !== undefined) {
        return Math.max(0, Number(localOrder.value.tipAmount) || 0)
    }
    return Math.max(0, Number(tipAmount.value) || 0)
})

const calculatedTotalAmount = computed(() => {
    const baseSubTotal = localOrder.value?.subTotal ?? subTotal.value
    // Nếu có voucher check result và chưa apply, tính discount từ đó
    let discount = discountAmount.value
    if (voucherCheckResult.value?.valid && voucherCheckResult.value.discountAmount && !voucherApplied.value) {
        discount = voucherCheckResult.value.discountAmount
    }
    const tip = displayTipAmount.value
    const amountAfterDiscount = Math.max(baseSubTotal - discount, 0)
    return Math.max(amountAfterDiscount + tip, 0)
})

const canApplyVoucher = computed(() => {
    return localOrder.value?.id != null
})
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
        tipAmount.value = 0
        customerPhone.value = ''
        foundCustomer.value = null
        customerError.value = null
        voucherCode.value = ''
        voucherCheckResult.value = null
        voucherApplied.value = false
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

    // Khôi phục tipAmount từ order nếu có (khi đã thanh toán)
    if (localOrder.value?.tipAmount !== undefined) {
        tipAmount.value = Number(localOrder.value.tipAmount) || 0
    } else {
        tipAmount.value = 0
    }

    // Khôi phục customer info
    if (localOrder.value?.customerPhone) {
        customerPhone.value = localOrder.value.customerPhone
    } else if (localOrder.value?.customer?.phone) {
        customerPhone.value = localOrder.value.customer.phone
        foundCustomer.value = localOrder.value.customer
    }

    // Khôi phục voucher info
    if (localOrder.value?.voucherCode) {
        voucherCode.value = localOrder.value.voucherCode
        voucherApplied.value = true
    } else {
        voucherCode.value = ''
        voucherApplied.value = false
    }
    voucherCheckResult.value = null
}

watch(() => props.order, syncOrder, { immediate: true })

const handleTipInput = () => {
    const value = Number(tipAmount.value) || 0
    tipAmount.value = Math.max(0, Math.floor(value))
}

const applyQuickTip = (amount) => {
    tipAmount.value = Math.max(0, Math.floor(amount))
}

const handleConfirm = () => {
    if (!localOrder.value?.id) {
        toast.warning('Thiếu thông tin đơn hàng để thanh toán.')
        return
    }
    
    const tip = Number(tipAmount.value) || 0
    if (tip < 0) {
        toast.error('Số tiền tip không được nhỏ hơn 0.')
        return
    }
    
    emit('confirm-payment', {
        orderId: localOrder.value.id,
        paymentMethod: selectedPaymentMethod.value || 'CASH',
        tipAmount: tip,
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
/* Modal - Chuẩn hóa theo base.css */
.pos-payment-modal :global(.modal-content) {
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    box-shadow: var(--shadow-modal);
}

.pos-payment-modal :global(.modal-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg);
}

.pos-payment-modal :global(.modal-body) {
    padding: var(--spacing-5);
    background: var(--color-bg);
}

.pos-payment-modal :global(.modal-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-bg);
}

.payment-meta li {
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-4);
    padding: var(--spacing-1) 0;
    font-size: var(--font-size-sm);
}

.payment-meta .label {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-semibold);
}

.payment-totals {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.payment-totals div {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.payment-totals .grand-total {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
}

.status-pill {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-1);
    padding: var(--spacing-1) var(--spacing-3);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
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
    border-radius: var(--radius-md);
    overflow: hidden;
}

.payment-methods__group {
    display: flex;
    gap: var(--spacing-3);
    flex-wrap: wrap;
}

.payment-methods__btn {
    min-width: 120px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-1);
    text-transform: uppercase;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    border-radius: var(--radius-full);
    padding: var(--spacing-2) var(--spacing-4);
}

.payment-methods__btn i {
    font-size: var(--font-size-base);
}

.payment-options {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
}

.payment-tip .input-group {
    display: flex;
    gap: var(--spacing-2);
    flex-wrap: wrap;
}

.payment-tip .input-group-text {
    background: var(--color-bg-muted);
    border-color: var(--color-success);
    color: var(--color-success);
}

.payment-tip .form-control {
    flex: 1;
    min-width: 150px;
}

.payment-tip .btn {
    white-space: nowrap;
    font-size: var(--font-size-sm);
    padding: var(--spacing-2) var(--spacing-3);
}
</style>
