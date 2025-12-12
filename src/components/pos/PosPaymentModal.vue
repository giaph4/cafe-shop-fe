<template>
  <Teleport to="body">
    <div
      ref="modal"
      class="modal fade pos-payment-modal"
      tabindex="-1"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <header class="modal-header align-items-start">
            <div>
              <h5 class="modal-title">
                Thanh toán đơn #{{ orderCode }}
              </h5>
              <p
                v-if="localOrder"
                class="mb-0 text-muted small"
              >
                Cập nhật: {{ formatDateTime(localOrder.updatedAt || localOrder.createdAt) }}
              </p>
            </div>
            <div class="d-flex align-items-center gap-2">
              <span
                v-if="statusMeta"
                class="status-pill"
                :class="statusMeta.class"
              >{{ statusMeta.label
              }}</span>
              <button
                v-if="isPaid"
                class="btn btn-outline-primary btn-sm"
                type="button"
                :disabled="printing"
                @click="handlePrint"
              >
                <span
                  v-if="printing"
                  class="spinner-border spinner-border-sm me-1"
                />
                <i
                  v-else
                  class="bi bi-printer me-1"
                />
                In hóa đơn
              </button>
              <button
                type="button"
                class="btn-close"
                :disabled="processing"
                @click="hide"
              />
            </div>
          </header>

          <section
            v-if="localOrder"
            class="modal-body"
          >
            <div class="row g-4">
              <div class="col-md-6">
                <ul class="list-unstyled payment-meta">
                  <li><span class="label">Bàn phục vụ</span><span>{{ tableLabel }}</span></li>
                  <li>
                    <span class="label">Nhân viên</span><span>{{ localOrder.staffUsername ||
                      localOrder.staffName ||
                      '—' }}</span>
                  </li>
                  <li><span class="label">Khách hàng</span><span>{{ localOrder.customerName || 'Khách lẻ' }}</span></li>
                  <li>
                    <span class="label">Thời gian tạo</span><span>{{
                      formatDateTime(localOrder.createdAt) }}</span>
                  </li>
                  <li v-if="localOrder.paymentMethod">
                    <span class="label">Phương thức</span><span>{{ paymentMethodDisplay }}</span>
                  </li>
                </ul>
              </div>
              <div class="col-md-6">
                <div class="payment-totals">
                  <div>
                    <span>Tổng phụ</span><span>{{ formatCurrency(localOrder.subTotal ?? subTotal)
                    }}</span>
                  </div>
                  <div v-if="(localOrder.discountAmount ?? 0) > 0">
                    <span>Giảm giá</span><span class="text-danger">-{{
                      formatCurrency(localOrder.discountAmount ?? 0)
                    }}</span>
                  </div>
                  <div
                    v-if="displayTipAmount > 0"
                    class="text-success"
                  >
                    <span>Tiền típ</span><span>+{{ formatCurrency(displayTipAmount) }}</span>
                  </div>
                  <div class="grand-total">
                    <span>Tổng cộng</span><span>{{ formatCurrency(calculatedTotalAmount) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <hr>

            <section class="payment-items">
              <h6 class="mb-3">
                Chi tiết sản phẩm
              </h6>
              <EmptyState
                v-if="!orderItems.length"
                title="Chưa có sản phẩm"
                message="Đơn hàng chưa có sản phẩm nào."
              >
                <template #icon>
                  <i class="bi bi-basket" />
                </template>
              </EmptyState>
              <div
                v-else
                class="table-responsive"
              >
                <table class="table align-middle">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th class="text-end">
                        SL
                      </th>
                      <th class="text-end">
                        Đơn giá
                      </th>
                      <th class="text-end">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in orderItems"
                      :key="item.id || item.productId"
                    >
                      <td>
                        <div class="fw-semibold">
                          {{ item.productName }}
                        </div>
                        <small
                          v-if="item.notes"
                          class="text-muted"
                        >Ghi chú: {{ item.notes
                        }}</small>
                      </td>
                      <td class="text-end">
                        {{ item.quantity }}
                      </td>
                      <td class="text-end">
                        {{ formatCurrency(item.priceAtOrder) }}
                      </td>
                      <td class="text-end">
                        {{ formatCurrency(item.quantity * item.priceAtOrder) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section
              v-if="!isPaid"
              class="payment-options mt-4"
            >
              <!-- Customer Phone Number -->
              <div class="payment-customer mb-4">
                <h6 class="mb-2">
                  <i class="bi bi-person me-2" />Thông tin khách hàng
                </h6>
                <div class="input-group">
                  <span class="input-group-text">
                    <i class="bi bi-telephone" />
                  </span>
                  <input
                    v-model.trim="customerPhone"
                    type="tel"
                    class="form-control"
                    placeholder="Nhập số điện thoại (tùy chọn)"
                    :disabled="processing || customerLoading"
                    @blur="handlePhoneBlur"
                  >
                  <button
                    v-if="customerLoading"
                    class="btn btn-outline-secondary"
                    type="button"
                    disabled
                  >
                    <span class="spinner-border spinner-border-sm" />
                  </button>
                  <button
                    v-else-if="customerPhone && !foundCustomer"
                    class="btn btn-outline-primary"
                    type="button"
                    :disabled="processing"
                    @click="handleFindOrCreateCustomer"
                  >
                    <i class="bi bi-search me-1" />Tìm/Tạo
                  </button>
                </div>
                <div
                  v-if="foundCustomer"
                  class="mt-2"
                >
                  <small class="text-success">
                    <i class="bi bi-check-circle me-1" />
                    Khách hàng: {{ foundCustomer.fullName || foundCustomer.phone }}
                  </small>
                </div>
                <div
                  v-if="customerError"
                  class="mt-2"
                >
                  <small class="text-danger">
                    <i class="bi bi-exclamation-triangle me-1" />
                    {{ customerError }}
                  </small>
                </div>
                <small class="text-muted d-block mt-2">
                  <i class="bi bi-info-circle me-1" />
                  Nếu số điện thoại không tồn tại, hệ thống sẽ tự động tạo khách hàng mới
                </small>
              </div>

              <!-- Voucher Code -->
              <div class="payment-voucher mb-4">
                <h6 class="mb-2">
                  <i class="bi bi-ticket-perforated me-2" />Mã giảm giá
                </h6>
                <div class="input-group">
                  <span
                    class="input-group-text voucher-input-icon"
                    :class="voucherApplied ? 'voucher-applied' : ''"
                  >
                    <i class="bi bi-ticket-perforated" />
                  </span>
                  <input
                    v-model.trim="voucherCode"
                    type="text"
                    class="form-control"
                    :class="voucherApplied ? 'voucher-input-applied' : ''"
                    placeholder="Nhập mã voucher và nhấn Áp dụng"
                    :disabled="processing || voucherLoading || !canApplyVoucher"
                    @keyup.enter="handleApplyVoucher"
                  >
                  <button
                    v-if="voucherLoading"
                    class="btn btn-warning"
                    type="button"
                    disabled
                  >
                    <span class="spinner-border spinner-border-sm me-1" />
                    Đang xử lý...
                  </button>
                  <button
                    v-else-if="voucherCode && !voucherApplied"
                    class="btn btn-success"
                    type="button"
                    :disabled="processing || !canApplyVoucher"
                    @click="handleApplyVoucher"
                  >
                    <i class="bi bi-check-circle me-1" />Áp dụng
                  </button>
                  <button
                    v-else-if="voucherApplied"
                    class="btn btn-danger"
                    type="button"
                    :disabled="processing"
                    @click="handleRemoveVoucher"
                  >
                    <i class="bi bi-x-circle me-1" />Bỏ voucher
                  </button>
                </div>
                <div
                  v-if="voucherApplied && discountAmount > 0"
                  class="voucher-success-message mt-2"
                >
                  <i class="bi bi-check-circle-fill me-1" />
                  <strong>Voucher đã áp dụng!</strong> Giảm giá:
                  <strong class="text-success">{{ formatCurrency(discountAmount) }}</strong>
                </div>
                <div
                  v-if="voucherError"
                  class="voucher-error-message mt-2"
                >
                  <i class="bi bi-exclamation-triangle-fill me-1" />
                  {{ voucherError }}
                </div>
                <div
                  v-if="!canApplyVoucher"
                  class="voucher-warning-message mt-2"
                >
                  <i class="bi bi-info-circle me-1" />
                  Vui lòng lưu đơn hàng trước khi áp dụng voucher
                </div>
              </div>

              <div class="payment-methods mb-4">
                <h6 class="mb-2">
                  Chọn phương thức thanh toán
                </h6>
                <div
                  class="btn-group payment-methods__group"
                  role="group"
                >
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
                    <i
                      :class="method.icon"
                      class="me-2"
                    />{{ method.label }}
                  </button>
                </div>
              </div>

              <div class="payment-tip">
                <h6 class="mb-2">
                  Tiền típ (tùy chọn)
                </h6>
                <div class="input-group">
                  <span class="input-group-text">
                    <i class="bi bi-cash-coin" />
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
                  >
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
                  <i class="bi bi-info-circle me-1" />
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
              <i class="bi bi-receipt-cutoff" />
            </template>
          </EmptyState>

          <footer class="modal-footer">
            <button
              type="button"
              class="btn btn-outline-secondary"
              :disabled="processing"
              @click="hide"
            >
              Đóng
            </button>
            <button
              v-if="!isPaid"
              type="button"
              class="btn btn-success"
              :disabled="processing || !localOrder || !selectedPaymentMethod"
              @click="handleConfirm"
            >
              <span
                v-if="processing"
                class="spinner-border spinner-border-sm me-2"
              />
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
const voucherLoading = ref(false)
const voucherApplied = ref(false)
const voucherError = ref(null)

const STATUS_METADATA = Object.freeze({
    PENDING: { label: 'Đang chờ', class: 'status-pill--pending' },
    PAID: { label: 'Đã thanh toán', class: 'status-pill--paid' },
    CANCELLED: { label: 'Đã hủy', class: 'status-pill--cancelled' },
    TRANSFERRED: { label: 'Đã chuyển ca', class: 'status-pill--transferred' }
})

const PAYMENT_METHODS = Object.freeze([
    { value: 'CASH', label: 'Tiền mặt', icon: 'bi bi-cash' },
    { value: 'TRANSFER', label: 'Chuyển khoản', icon: 'bi bi-bank' },
    { value: 'CARD', label: 'Thẻ', icon: 'bi bi-credit-card' }
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
    const discount = discountAmount.value
    const tip = displayTipAmount.value
    const amountAfterDiscount = Math.max(baseSubTotal - discount, 0)
    return Math.max(amountAfterDiscount + tip, 0)
})

const canApplyVoucher = computed(() => localOrder.value?.id !== null)
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
        voucherApplied.value = false
        voucherError.value = null
        return
    }
    try {
        localOrder.value = structuredClone(incoming)
    } catch {
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
        voucherError.value = null
    } else {
        voucherCode.value = ''
        voucherApplied.value = false
        voucherError.value = null
    }
}

watch(() => props.order, syncOrder, { immediate: true })

const handleTipInput = () => {
    const value = Number(tipAmount.value) || 0
    tipAmount.value = Math.max(0, Math.floor(value))
}

const applyQuickTip = (amount) => {
    tipAmount.value = Math.max(0, Math.floor(amount))
}

// Customer handling
const handlePhoneBlur = async () => {
    if (!customerPhone.value || customerPhone.value.length < 10) {
        foundCustomer.value = null
        customerError.value = null
        return
    }
    await handleFindOrCreateCustomer()
}

const handleFindOrCreateCustomer = async () => {
    if (!customerPhone.value || customerPhone.value.length < 10) {
        customerError.value = 'Số điện thoại không hợp lệ'
        return
    }

    customerLoading.value = true
    customerError.value = null
    foundCustomer.value = null

    try {
        // Tìm customer theo số điện thoại
        try {
            const customer = await getCustomerByPhone(customerPhone.value)
            foundCustomer.value = customer
            customerError.value = null
            toast.success(`Đã tìm thấy khách hàng: ${customer.fullName || customer.phone}`)
        } catch (error) {
            // Nếu không tìm thấy (404), tạo customer mới
            if (error.response?.status === 404) {
                const newCustomer = await createCustomer({
                    phone: customerPhone.value,
                    fullName: `Khách hàng ${customerPhone.value}`,
                    email: null
                })
                foundCustomer.value = newCustomer
                customerError.value = null
                toast.success(`Đã tạo khách hàng mới: ${newCustomer.fullName || newCustomer.phone}`)
            } else {
                throw error
            }
        }
    } catch (error) {
        const message = error.response?.data?.message || 'Không thể tìm hoặc tạo khách hàng'
        customerError.value = message
        foundCustomer.value = null
        toast.error(message)
        logger.error('Failed to find/create customer:', error)
    } finally {
        customerLoading.value = false
    }
}

// Voucher handling - Áp dụng trực tiếp không cần check
const handleApplyVoucher = async () => {
    if (!voucherCode.value || !voucherCode.value.trim()) {
        voucherError.value = 'Vui lòng nhập mã voucher'
        toast.warning('Vui lòng nhập mã voucher')
        return
    }
    if (!canApplyVoucher.value) {
        voucherError.value = 'Vui lòng lưu đơn hàng trước khi áp dụng voucher'
        toast.warning('Vui lòng lưu đơn hàng trước khi áp dụng voucher')
        return
    }

    voucherLoading.value = true
    voucherError.value = null

    try {
        const updatedOrder = await orderService.applyVoucher({
            orderId: localOrder.value.id,
            voucherCode: voucherCode.value.trim().toUpperCase()
        })

        // Cập nhật localOrder với dữ liệu mới từ server
        syncOrder(updatedOrder)
        voucherApplied.value = true
        voucherError.value = null
        toast.success('Áp dụng voucher thành công!')
    } catch (error) {
        const message = error.response?.data?.message || 'Không thể áp dụng voucher. Vui lòng kiểm tra lại mã voucher.'
        voucherError.value = message
        voucherApplied.value = false
        toast.error(message)
        logger.error('Failed to apply voucher:', error)
    } finally {
        voucherLoading.value = false
    }
}

const handleRemoveVoucher = async () => {
    if (!localOrder.value?.id || !voucherApplied.value) {
        return
    }

    voucherLoading.value = true
    voucherError.value = null

    try {
        const updatedOrder = await orderService.removeVoucher(localOrder.value.id)
        syncOrder(updatedOrder)
        voucherApplied.value = false
        voucherCode.value = ''
        voucherError.value = null
        toast.info('Đã bỏ voucher khỏi đơn hàng.')
    } catch (error) {
        const message = error.response?.data?.message || 'Không thể bỏ voucher'
        voucherError.value = message
        toast.error(message)
        logger.error('Failed to remove voucher:', error)
    } finally {
        voucherLoading.value = false
    }
}

const handleConfirm = async () => {
    if (!localOrder.value?.id) {
        toast.warning('Thiếu thông tin đơn hàng để thanh toán.')
        return
    }

    const tip = Number(tipAmount.value) || 0
    if (tip < 0) {
        toast.error('Số tiền tip không được nhỏ hơn 0.')
        return
    }

    // Lưu ý: Order entity không có field note, chỉ có OrderDetail có notes
    // Ghi chú cần được lưu ở cấp item (OrderDetail), không phải cấp đơn hàng

    emit('confirm-payment', {
        orderId: localOrder.value.id,
        paymentMethod: selectedPaymentMethod.value || 'CASH',
        tipAmount: tip,
        customerId: foundCustomer.value?.id || localOrder.value.customerId || null,
        voucherCode: voucherApplied.value ? voucherCode.value : null
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
	border-radius: var(--radius-sm);
	border: 1px solid var(--color-border);
	background: var(--color-card);
	box-shadow: var(--shadow-modal);
}

.pos-payment-modal :global(.modal-header) {
	padding: var(--spacing-4);
	border-bottom: 1px solid var(--color-border);
	background: var(--color-card);
}

.pos-payment-modal :global(.modal-body) {
	padding: var(--spacing-5);
	background: var(--color-card);
}

.pos-payment-modal :global(.modal-footer) {
	padding: var(--spacing-4);
	border-top: 1px solid var(--color-border);
	background: var(--color-card);
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
	font-weight: var(--font-weight-semibold);
	color: var(--color-heading);
	font-family: var(--font-family-sans);
}

.status-pill {
	display: inline-flex;
	align-items: center;
	gap: var(--spacing-1);
	padding: var(--spacing-1) var(--spacing-3);
	border-radius: var(--radius-sm);
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-semibold);
	text-transform: uppercase;
	letter-spacing: var(--letter-spacing-wide);
	font-family: var(--font-family-sans);
}

.status-pill--pending {
	background: var(--color-soft-amber);
	border: 1px solid var(--color-warning);
	color: var(--color-warning);
}

.status-pill--paid {
	background: var(--color-soft-emerald);
	border: 1px solid var(--color-success);
	color: var(--color-success);
}

.status-pill--cancelled {
	background: var(--color-soft-rose);
	border: 1px solid var(--color-danger);
	color: var(--color-danger);
}

.status-pill--transferred {
	background: var(--color-soft-sky);
	border: 1px solid var(--color-info);
	color: var(--color-info);
}

.status-pill--default {
	background: var(--color-card-muted);
	border: 1px solid var(--color-border);
	color: var(--color-text-muted);
}

.payment-items table {
	border-radius: var(--radius-sm);
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
	background: var(--color-card-muted);
	border-color: var(--color-success);
	color: var(--color-success);
}

.payment-tip .form-control {
	flex: 1;
	min-width: 150px;
	font-family: var(--font-family-sans);
}

.payment-tip .form-control:focus {
	box-shadow: none;
	outline: 2px solid var(--color-primary);
	outline-offset: 0;
}

.payment-tip .btn {
	white-space: nowrap;
	font-size: var(--font-size-sm);
	padding: var(--spacing-2) var(--spacing-3);
}

/* Voucher Styles */

/* Payment Customer */
.payment-customer h6 {
	color: var(--color-heading);
	font-weight: var(--font-weight-semibold);
	display: flex;
	align-items: center;
	font-family: var(--font-family-sans);
}

.payment-customer .input-group-text {
	background: var(--color-card-muted);
	border-color: var(--color-border);
	color: var(--color-primary);
}

.payment-customer .form-control {
	font-family: var(--font-family-sans);
}

.payment-customer .form-control:focus {
	border-color: var(--color-primary);
	outline: 2px solid var(--color-primary);
	outline-offset: 0;
	box-shadow: none;
}

/* Payment Voucher */
.payment-voucher h6 {
	color: var(--color-heading);
	font-weight: var(--font-weight-semibold);
	display: flex;
	align-items: center;
	font-family: var(--font-family-sans);
}

.voucher-input-icon {
	background: var(--color-card-muted);
	border-color: var(--color-border);
	color: var(--color-text-muted);
	transition: all var(--transition-base);
}

.voucher-input-icon.voucher-applied {
	background: var(--color-soft-emerald);
	border-color: var(--color-success);
	color: var(--color-success);
}

.voucher-input-applied {
	border-color: var(--color-success);
	background: var(--color-soft-emerald);
	font-family: var(--font-family-sans);
}

.voucher-input-applied:focus {
	border-color: var(--color-success);
	outline: 2px solid var(--color-success);
	outline-offset: 0;
	box-shadow: none;
}

.voucher-success-message {
	padding: var(--spacing-2) var(--spacing-3);
	border-radius: var(--radius-sm);
	background: var(--color-soft-emerald);
	border: 1px solid var(--color-success);
	color: var(--color-success);
	font-size: var(--font-size-sm);
	display: flex;
	align-items: center;
	font-family: var(--font-family-sans);
}

.voucher-error-message {
	padding: var(--spacing-2) var(--spacing-3);
	border-radius: var(--radius-sm);
	background: var(--color-soft-rose);
	border: 1px solid var(--color-danger);
	color: var(--color-danger);
	font-size: var(--font-size-sm);
	display: flex;
	align-items: center;
	font-family: var(--font-family-sans);
}

.voucher-warning-message {
	padding: var(--spacing-2) var(--spacing-3);
	border-radius: var(--radius-sm);
	background: var(--color-soft-amber);
	border: 1px solid var(--color-warning);
	color: var(--color-warning);
	font-size: var(--font-size-sm);
	display: flex;
	align-items: center;
	font-family: var(--font-family-sans);
}
</style>
