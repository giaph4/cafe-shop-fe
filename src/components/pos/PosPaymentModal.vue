<template>
  <Teleport to="body">
    <div
      v-if="!showPaymentResult"
      ref="modal"
      class="modal fade pos-payment-modal"
      tabindex="-1"
      aria-labelledby="posPaymentModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog pos-payment-modal__dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <!-- Header -->
          <div class="modal-header">
            <div class="modal-header__content">
              <h5
                id="posPaymentModalLabel"
                class="modal-title"
              >
                Thanh toán đơn #{{ orderCode }}
              </h5>
              <p
                v-if="localOrder"
                class="modal-subtitle"
              >
                Cập nhật: {{ formatDateTime(localOrder.updatedAt || localOrder.createdAt) }}
              </p>
            </div>
            <div class="modal-header__actions">
              <span
                v-if="statusMeta"
                class="badge badge-status"
                :class="getStatusBadgeClass(localOrder?.status)"
              >{{ statusMeta.label }}</span>
              <button
                v-if="isPaid"
                class="btn btn-outline-primary btn-sm"
                type="button"
                :disabled="printing"
                aria-label="In hóa đơn"
                @click="handlePrint"
              >
                <span
                  v-if="printing"
                  class="spinner-border spinner-border-sm"
                  aria-hidden="true"
                />
                <i
                  v-else
                  class="bi bi-printer"
                  aria-hidden="true"
                />
                In hóa đơn
              </button>
              <button
                type="button"
                class="btn-close"
                :disabled="processing"
                aria-label="Đóng"
                @click="hide"
              />
            </div>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <template v-if="localOrder">
              <div class="payment-layout">
                <!-- Left Column: Order Info & Payment Options -->
                <div class="payment-layout__left">
                  <!-- Order Info Card -->
                  <div class="info-card">
                    <h6 class="info-card__title">
                      <i class="bi bi-receipt me-2" />
                      Thông tin đơn hàng
                    </h6>
                    <div class="info-card__content">
                      <div class="info-row">
                        <div class="info-item">
                          <span class="info-label">
                            <i class="bi bi-grid-3x3-gap me-1" />
                            Bàn phục vụ
                          </span>
                          <span class="info-value">{{ tableLabel }}</span>
                        </div>
                        <div class="info-item">
                          <span class="info-label">
                            <i class="bi bi-person-badge me-1" />
                            Nhân viên
                          </span>
                          <span class="info-value">{{ localOrder.staffUsername || localOrder.staffName || '—' }}</span>
                        </div>
                      </div>
                      <div class="info-row">
                        <div class="info-item">
                          <span class="info-label">
                            <i class="bi bi-person me-1" />
                            Khách hàng
                          </span>
                          <span class="info-value">{{ localOrder.customerName || 'Khách lẻ' }}</span>
                        </div>
                        <div class="info-item">
                          <span class="info-label">
                            <i class="bi bi-clock me-1" />
                            Thời gian tạo
                          </span>
                          <span class="info-value">{{ formatDateTime(localOrder.createdAt) }}</span>
                        </div>
                      </div>
                      <div
                        v-if="localOrder.paymentMethod"
                        class="info-row"
                      >
                        <div class="info-item">
                          <span class="info-label">
                            <i class="bi bi-credit-card me-1" />
                            Phương thức thanh toán
                          </span>
                          <span class="info-value">
                            <span
                              class="badge badge-type"
                              :class="getPaymentMethodBadgeClass(localOrder.paymentMethod)"
                            >{{ paymentMethodDisplay }}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Payment Options (only if not paid) -->
                  <template v-if="!isPaid">
                    <!-- Customer Section -->
                    <div class="info-card">
                      <h6 class="info-card__title">
                        <i class="bi bi-person me-2" />
                        Thông tin khách hàng
                      </h6>
                      <div class="info-card__content">
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
                          class="alert alert-success alert-sm mt-3"
                        >
                          <i class="bi bi-check-circle me-1" />
                          Khách hàng: {{ foundCustomer.fullName || foundCustomer.phone }}
                        </div>
                        <div
                          v-if="customerError"
                          class="alert alert-danger alert-sm mt-3"
                        >
                          <i class="bi bi-exclamation-triangle me-1" />
                          {{ customerError }}
                        </div>
                        <small class="text-muted d-block mt-2">
                          <i class="bi bi-info-circle me-1" />
                          Nếu số điện thoại không tồn tại, hệ thống sẽ tự động tạo khách hàng mới
                        </small>
                      </div>
                    </div>

                    <!-- Voucher Section -->
                    <div class="info-card">
                      <h6 class="info-card__title">
                        <i class="bi bi-ticket-perforated me-2" />
                        Mã giảm giá
                      </h6>
                      <div class="info-card__content">
                        <div class="input-group">
                          <span
                            class="input-group-text"
                            :class="voucherApplied ? 'bg-success text-white' : ''"
                          >
                            <i class="bi bi-ticket-perforated" />
                          </span>
                          <input
                            v-model.trim="voucherCode"
                            type="text"
                            class="form-control"
                            :class="voucherApplied ? 'border-success' : ''"
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
                            class="btn btn-outline-primary"
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
                          class="alert alert-success alert-sm mt-3"
                        >
                          <i class="bi bi-check-circle-fill me-1" />
                          <strong>Voucher đã áp dụng!</strong> Giảm giá:
                          <strong>{{ formatCurrency(discountAmount) }}</strong>
                        </div>
                        <div
                          v-if="voucherError"
                          class="alert alert-danger alert-sm mt-3"
                        >
                          <i class="bi bi-exclamation-triangle-fill me-1" />
                          {{ voucherError }}
                        </div>
                        <div
                          v-if="!canApplyVoucher"
                          class="alert alert-warning alert-sm mt-3"
                        >
                          <i class="bi bi-info-circle me-1" />
                          Vui lòng lưu đơn hàng trước khi áp dụng voucher
                        </div>
                      </div>
                    </div>

                    <!-- Payment Method Section -->
                    <div class="info-card">
                      <h6 class="info-card__title">
                        Chọn phương thức thanh toán
                      </h6>
                      <div class="info-card__content">
                        <div class="payment-methods-group">
                          <button
                            v-for="method in PAYMENT_METHODS"
                            :key="method.value"
                            type="button"
                            class="payment-method-btn"
                            :class="selectedPaymentMethod === method.value ? 'payment-method-btn--active' : ''"
                            :disabled="processing"
                            @click="selectedPaymentMethod = method.value"
                          >
                            <i :class="method.icon" />
                            {{ method.label }}
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Tip Section -->
                    <div class="info-card">
                      <h6 class="info-card__title">
                        <i class="bi bi-cash-coin me-2" />
                        Tiền típ (tùy chọn)
                      </h6>
                      <div class="info-card__content">
                        <div class="input-group mb-3">
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
                        </div>
                        <div class="quick-tip-buttons">
                          <button
                            v-for="quickTip in QUICK_TIP_OPTIONS"
                            :key="quickTip"
                            type="button"
                            class="btn btn-outline-secondary btn-sm"
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
                    </div>
                  </template>
                </div>

                <!-- Right Column: Products & Summary -->
                <div class="payment-layout__right">
                  <!-- Products Section -->
                  <div class="products-card">
                    <h6 class="products-card__title">
                      <i class="bi bi-basket me-2" />
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
                      class="table-wrapper"
                    >
                      <table class="table">
                        <thead>
                          <tr>
                            <th>Sản phẩm</th>
                            <th class="text-center">
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
                              <div class="product-name">
                                {{ item.productName }}
                              </div>
                              <small
                                v-if="item.notes"
                                class="product-notes"
                              >Ghi chú: {{ item.notes }}</small>
                            </td>
                            <td class="text-center">
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
                  </div>

                  <!-- Summary Card -->
                  <div class="summary-card">
                    <h6 class="summary-card__title">
                      <i class="bi bi-calculator me-2" />
                      Tổng thanh toán
                    </h6>
                    <div class="summary-card__content">
                      <div
                        v-if="showSubTotalInModal"
                        class="summary-row"
                      >
                        <span class="summary-label">Tổng phụ:</span>
                        <span class="summary-value">{{ formatCurrency(localOrder.subTotal ?? subTotal) }}</span>
                      </div>
                      <div
                        v-if="(localOrder.discountAmount ?? 0) > 0"
                        class="summary-row summary-row--discount"
                      >
                        <span class="summary-label">Giảm giá:</span>
                        <span class="summary-value text-danger">-{{ formatCurrency(localOrder.discountAmount ?? 0) }}</span>
                      </div>
                      <div
                        v-if="displayTipAmount > 0"
                        class="summary-row summary-row--tip"
                      >
                        <span class="summary-label">Tiền típ:</span>
                        <span class="summary-value text-success">+{{ formatCurrency(displayTipAmount) }}</span>
                      </div>
                      <div
                        v-if="showSubTotalInModal || (localOrder.discountAmount ?? 0) > 0 || displayTipAmount > 0"
                        class="summary-divider"
                      />
                      <div class="summary-row summary-row--total">
                        <span class="summary-label">Tổng cộng:</span>
                        <span class="summary-value summary-value--total">{{ formatCurrency(calculatedTotalAmount) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <EmptyState
              v-else
              title="Không có dữ liệu"
              message="Không có dữ liệu đơn hàng để hiển thị."
            >
              <template #icon>
                <i class="bi bi-receipt-cutoff" />
              </template>
            </EmptyState>
          </div>

          <!-- Footer -->
          <!-- Ẩn footer khi PaymentResultModal đang hiển thị -->
          <div
            v-if="!showPaymentResult"
            class="modal-footer"
          >
            <button
              type="button"
              class="btn btn-outline-secondary"
              :disabled="processing || showPaymentResult"
              @click="hide"
            >
              Đóng
            </button>
            <!-- Trạng thái 1: Chưa thanh toán -->
            <button
              v-if="!isPaid && !processing"
              type="button"
              class="btn btn-success"
              :disabled="!localOrder || !selectedPaymentMethod || showPaymentResult"
              @click="handleConfirm"
            >
              <i class="bi bi-check-circle" />
              Xác nhận thanh toán
            </button>
            <!-- Trạng thái 2: Đang xử lý thanh toán -->
            <button
              v-if="processing"
              type="button"
              class="btn btn-success"
              disabled
            >
              <span class="spinner-border spinner-border-sm" />
              Đang xử lý...
            </button>
            <!-- Trạng thái 3: Đã thanh toán - Hiển thị nút In hóa đơn -->
            <button
              v-if="isPaid && !processing"
              type="button"
              class="btn btn-primary"
              :disabled="printing || showPaymentResult"
              @click="handlePrint"
            >
              <span
                v-if="printing"
                class="spinner-border spinner-border-sm"
              />
              <i
                v-else
                class="bi bi-printer"
              />
              In hóa đơn
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Modal } from 'bootstrap'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { downloadInvoiceAsTxt } from '@/utils/invoicePrinter'
import { toast } from 'vue3-toastify'
import logger from '@/utils/logger'
import EmptyState from '@/components/common/EmptyState.vue'
import { getCustomerByPhone, createCustomer } from '@/api/customerService'
import * as orderService from '@/api/orderService'

const props = defineProps({
    order: { type: Object, default: null },
    table: { type: Object, default: null },
    processing: { type: Boolean, default: false },
    showPaymentResult: { type: Boolean, default: false }
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
    PENDING: { label: 'Đang chờ', badgeClass: 'badge-status--warning' },
    PAID: { label: 'Đã thanh toán', badgeClass: 'badge-status--success' },
    CANCELLED: { label: 'Đã hủy', badgeClass: 'badge-status--danger' },
    TRANSFERRED: { label: 'Đã chuyển ca', badgeClass: 'badge-status--info' }
})

const getStatusBadgeClass = (status) => {
    if (!status) return 'badge-status--default'
    const meta = STATUS_METADATA[status]
    return meta?.badgeClass || 'badge-status--default'
}

const PAYMENT_METHODS = Object.freeze([
    { value: 'CASH', label: 'Tiền mặt', icon: 'bi bi-cash' },
    { value: 'TRANSFER', label: 'Chuyển khoản', icon: 'bi bi-bank' },
    { value: 'CARD', label: 'Thẻ', icon: 'bi bi-credit-card' }
])

const QUICK_TIP_OPTIONS = Object.freeze([10000, 20000, 50000, 100000])

const orderCode = computed(() => localOrder.value?.code || localOrder.value?.id || '—')
const statusMeta = computed(() => {
    const status = localOrder.value?.status
    return status ? STATUS_METADATA[status] || { label: status, badgeClass: 'badge-status--default' } : null
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

// Chỉ hiển thị "Tổng phụ" nếu khác "Tổng cộng" (có giảm giá, tip, hoặc thuế)
const showSubTotalInModal = computed(() => {
    const baseSubTotal = localOrder.value?.subTotal ?? subTotal.value
    const total = calculatedTotalAmount.value
    // Hiển thị nếu có giảm giá hoặc tip, hoặc nếu tổng phụ khác tổng cộng
    return (discountAmount.value > 0) || (displayTipAmount.value > 0) || Math.abs(baseSubTotal - total) > 0.01
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

const getPaymentMethodBadgeClass = (method) => {
    if (method === 'CASH') return 'badge-type--secondary'
    if (method === 'TRANSFER' || method === 'CARD') return 'badge-type--primary'
    return 'badge-type--secondary'
}

const show = () => {
    if (modalInstance) {
        modalInstance.show()
    }
}

const hide = () => {
    if (modalInstance) {
        modalInstance.hide()
        // Cleanup backdrop sau khi đóng
        setTimeout(() => {
            cleanupBackdrop()
        }, 350)
    }
}

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

    if (localOrder.value?.tipAmount !== undefined) {
        tipAmount.value = Number(localOrder.value.tipAmount) || 0
    } else {
        tipAmount.value = 0
    }

    if (localOrder.value?.customerPhone) {
        customerPhone.value = localOrder.value.customerPhone
    } else if (localOrder.value?.customer?.phone) {
        customerPhone.value = localOrder.value.customer.phone
        foundCustomer.value = localOrder.value.customer
    }

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
        try {
            const customer = await getCustomerByPhone(customerPhone.value)
            foundCustomer.value = customer
            customerError.value = null
            toast.success(`Đã tìm thấy khách hàng: ${customer.fullName || customer.phone}`)
        } catch (error) {
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
        
        // Đợi một chút để đảm bảo click event hoàn tất
        await new Promise(resolve => setTimeout(resolve, 50))
        
        downloadInvoiceAsTxt(localOrder.value)
        toast.success('Đã tải xuống hóa đơn dạng TXT.')
    } catch (error) {
        logger.error('Failed to download invoice:', error)
        toast.error('Không thể tải xuống hóa đơn. Vui lòng thử lại.')
    } finally {
        // Đợi một chút trước khi reset printing state
        setTimeout(() => {
            printing.value = false
        }, 500)
    }
}

onMounted(() => {
    // Cleanup bất kỳ backdrop nào còn sót lại khi component mount
    cleanupBackdrop()
    
    if (!modal.value) return
    modalInstance = new Modal(modal.value, { 
        backdrop: 'static',
        keyboard: true
    })
    modal.value.addEventListener('hidden.bs.modal', () => {
        emit('closed')
        // Cleanup backdrop sau khi đóng
        setTimeout(() => {
            cleanupBackdrop()
        }, 350)
    })
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

// Đảm bảo đóng modal khi PaymentResultModal mở
watch(() => props.showPaymentResult, async (isOpen) => {
    if (isOpen && modalInstance) {
        // Đóng modal ngay lập tức khi PaymentResultModal mở
        hide()
        // Đợi modal đóng hoàn toàn và cleanup backdrop
        await new Promise(resolve => setTimeout(resolve, 400))
        cleanupBackdrop()
    }
}, { immediate: true })

// Cleanup backdrop còn sót lại
const cleanupBackdrop = () => {
    // Xóa tất cả backdrop còn sót lại
    const backdrops = document.querySelectorAll('.modal-backdrop')
    backdrops.forEach(backdrop => {
        // Chỉ xóa backdrop không thuộc về modal đang mở
        const modalElement = backdrop.closest('.modal.show')
        if (!modalElement) {
            backdrop.remove()
        }
    })

    // Xóa class modal-open khỏi body nếu không còn modal nào mở
    const openModals = document.querySelectorAll('.modal.show')
    if (openModals.length === 0) {
        document.body.classList.remove('modal-open')
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
    }
}

defineExpose({ show, hide })
</script>

<style scoped>
/* Modal Container - Fixed positioning */
.pos-payment-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1055; /* Thấp hơn PaymentResultModal (1060) */
    display: none;
    overflow-x: hidden;
    overflow-y: auto;
    pointer-events: none;
}

.pos-payment-modal.show {
    display: block;
    pointer-events: auto;
}

/* Modal Base - Override Bootstrap với !important và specificity cao */
.pos-payment-modal.pos-payment-modal :global(.modal-dialog),
.pos-payment-modal :global(.modal-dialog.pos-payment-modal__dialog) {
    position: relative;
    z-index: 1056;
    max-width: 95vw !important;
    width: 95vw !important;
    margin: var(--spacing-2) auto !important;
    pointer-events: none;
}

.pos-payment-modal :global(.modal-content) {
    pointer-events: auto;
}

@media (min-width: 992px) {
    .pos-payment-modal.pos-payment-modal :global(.modal-dialog),
    .pos-payment-modal :global(.modal-dialog.pos-payment-modal__dialog) {
        max-width: 1200px !important;
        width: 90vw !important;
    }
}

@media (min-width: 1400px) {
    .pos-payment-modal.pos-payment-modal :global(.modal-dialog),
    .pos-payment-modal :global(.modal-dialog.pos-payment-modal__dialog) {
        max-width: 1400px !important;
        width: 90vw !important;
    }
}

.pos-payment-modal :global(.modal-content) {
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-modal);
}

.pos-payment-modal :global(.modal-header) {
    padding: var(--spacing-5);
    border-bottom: 1px solid var(--color-border);
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

.pos-payment-modal :global(.modal-header .modal-title) {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.modal-subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
    font-family: var(--font-family-sans);
}

.modal-header__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    flex-shrink: 0;
}

.pos-payment-modal :global(.modal-body) {
    padding: var(--spacing-6) var(--spacing-6);
    background: var(--color-card);
    max-height: calc(100vh - 150px);
    overflow-y: auto;
}

.pos-payment-modal :global(.modal-footer) {
    padding: var(--spacing-4) var(--spacing-5);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-2);
}

/* Payment Layout - 2 Columns */
.payment-layout {
    display: grid;
    grid-template-columns: minmax(350px, 1fr) minmax(400px, 1.5fr);
    gap: var(--spacing-5);
    align-items: start;
}

.payment-layout__left {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
}

.payment-layout__right {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
}

/* Info Card */
.info-card {
    background: var(--color-card-muted);
    border-radius: var(--radius-md);
    padding: var(--spacing-5);
    border: 1px solid var(--color-border);
}

.info-card__title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-3);
    padding-bottom: var(--spacing-2);
    border-bottom: 1px solid var(--color-border);
    font-family: var(--font-family-sans);
    display: flex;
    align-items: center;
}

.info-card__title i {
    font-size: 18px;
    color: var(--color-primary);
}

.info-card__content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.info-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-4);
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.info-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
}

.info-label i {
    font-size: 14px;
    margin-right: var(--spacing-1);
}

.info-value {
    font-size: var(--font-size-base);
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
}

/* Products Card */
.products-card {
    background: var(--color-card-muted);
    border-radius: var(--radius-md);
    padding: var(--spacing-5);
    border: 1px solid var(--color-border);
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.products-card__title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-3);
    padding-bottom: var(--spacing-2);
    border-bottom: 1px solid var(--color-border);
    font-family: var(--font-family-sans);
    display: flex;
    align-items: center;
}

.products-card__title i {
    font-size: 18px;
    color: var(--color-primary);
}

.table-wrapper {
    border-radius: var(--radius-sm);
    overflow: hidden;
    border: 1px solid var(--color-border);
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

.products-card :global(.table) {
    margin-bottom: 0;
    flex: 1;
}

.products-card :global(.table thead) {
    background: var(--color-card);
    position: sticky;
    top: 0;
    z-index: 10;
}

.products-card :global(.table th) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-sm);
    padding: var(--spacing-3) var(--spacing-4);
    border-bottom: 2px solid var(--color-border);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.products-card :global(.table tbody) {
    max-height: 400px;
    overflow-y: auto;
}

.products-card :global(.table td) {
    padding: var(--spacing-3) var(--spacing-4);
    font-size: var(--font-size-base);
    vertical-align: middle;
    border-bottom: 1px solid var(--color-border);
}

.product-name {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-base);
}

.product-notes {
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    display: block;
    margin-top: var(--spacing-1);
}

/* Summary Card */
.summary-card {
    background: var(--color-card);
    border-radius: var(--radius-md);
    padding: var(--spacing-6);
    border: 2px solid var(--color-primary);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    position: sticky;
    bottom: 0;
}

.summary-card__title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-4);
    padding-bottom: var(--spacing-3);
    border-bottom: 2px solid var(--color-border);
    font-family: var(--font-family-sans);
    display: flex;
    align-items: center;
}

.summary-card__title i {
    font-size: 20px;
    color: var(--color-primary);
}

.summary-card__content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-2) 0;
}

.summary-label {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.summary-value {
    font-size: var(--font-size-base);
    color: var(--color-heading);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.summary-divider {
    height: 2px;
    background: var(--color-border);
    margin: var(--spacing-2) 0;
}

.summary-row--total {
    padding-top: var(--spacing-3);
    margin-top: var(--spacing-2);
    border-top: 2px solid var(--color-primary);
}

.summary-row--total .summary-label {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
}

.summary-value--total {
    font-size: 1.75rem;
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
}

/* Payment Methods */
.payment-methods-group {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-2);
}

.payment-method-btn {
    padding: var(--spacing-3) var(--spacing-4);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-card);
    color: var(--color-heading);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    transition: all var(--transition-base);
    cursor: pointer;
}

.payment-method-btn:hover:not(:disabled) {
    border-color: var(--color-primary);
    background: var(--color-soft-primary);
    color: var(--color-primary);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.15);
}

.payment-method-btn:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 1px 3px rgba(59, 130, 246, 0.1);
}

.payment-method-btn--active {
    border-color: var(--color-primary);
    background: var(--color-primary);
    color: white;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.payment-method-btn--active:hover {
    background: var(--color-primary-dark);
    border-color: var(--color-primary-dark);
}

.payment-method-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.payment-method-btn i {
    font-size: 20px;
}

/* Quick Tip Buttons */
.quick-tip-buttons {
    display: flex;
    gap: var(--spacing-2);
    flex-wrap: wrap;
}

/* Alert Styles */
.alert-sm {
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-sm);
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    margin-bottom: 0;
}

/* Responsive */
@media (max-width: 1400px) {
    .payment-layout {
        grid-template-columns: minmax(320px, 1fr) minmax(350px, 1.2fr);
    }
}

@media (max-width: 1200px) {
    .payment-layout {
        grid-template-columns: 1fr;
    }

    .summary-card {
        position: relative;
    }
}

@media (max-width: 992px) {
    .pos-payment-modal :global(.modal-dialog) {
        max-width: 95vw;
        width: 95vw;
    }

    .info-row {
        grid-template-columns: 1fr;
    }

    .payment-methods-group {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .pos-payment-modal :global(.modal-dialog) {
        margin: var(--spacing-2);
        max-width: calc(100% - var(--spacing-4));
    }

    .pos-payment-modal :global(.modal-header) {
        flex-direction: column;
        gap: var(--spacing-3);
    }

    .modal-header__actions {
        width: 100%;
        justify-content: space-between;
    }

    .pos-payment-modal :global(.modal-body) {
        padding: var(--spacing-4);
    }
}

</style>
