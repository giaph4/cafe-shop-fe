<template>
    <div class="pos-cart card shadow-sm">
        <div class="card-body d-flex flex-column gap-4">
            <header class="pos-cart__header">
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div class="d-flex align-items-center gap-2">
                        <h4 class="mb-0">{{ cartTitle }}</h4>
                        <button
                            v-if="showSelectTableButton"
                            class="btn btn-outline-primary btn-sm"
                            type="button"
                            @click="requestTableSelection"
                        >
                            <i class="bi bi-grid-3x3-gap me-1"></i>
                            Chọn bàn
                        </button>
                    </div>
                    <span class="status-pill" :class="orderStatusClass">{{ orderStatusLabel }}</span>
                </div>
                <p v-if="localOrder.code || localOrder.id" class="text-muted small mb-0">
                    Mã đơn: #{{ localOrder.code || localOrder.id }}
                </p>
            </header>

            <div v-if="!order && !isCreatingNew" class="pos-cart__empty">
                <i class="bi bi-clipboard-plus fs-2 text-primary"></i>
                <p class="mb-3 text-muted">Chưa có đơn hàng nào cho bàn này.</p>
                <button class="btn btn-primary" @click="createNewOrder">Tạo đơn hàng mới</button>
            </div>

            <template v-else>
                <section class="pos-cart__items" v-if="!cartIsEmpty">
                    <div
                        v-for="(item, index) in localOrder.items"
                        :key="item.id || item.productId || index"
                        class="pos-cart__item"
                    >
                        <div class="pos-cart__item-info">
                            <h6 class="mb-1">{{ item.productName }}</h6>
                            <p class="mb-0 text-muted small">
                                {{ formatCurrencySafe(item.priceAtOrder) }} × {{ item.quantity }}
                                <span v-if="item.notes" class="ms-1 fst-italic">({{ item.notes }})</span>
                            </p>
                        </div>
                        <div class="pos-cart__item-actions">
                            <div class="quantity-controls">
                                <button
                                    class="btn btn-sm btn-outline-secondary quantity-btn"
                                    type="button"
                                    @click="updateQuantity(index, -1)"
                                    :disabled="isProcessing('quantity')"
                                    aria-label="Giảm số lượng"
                                    title="Giảm (Phím -)"
                                >
                                    <i class="bi bi-dash"></i>
                                </button>
                                <input
                                    type="number"
                                    class="quantity-input"
                                    :value="item.quantity"
                                    @change="setQuantity(index, $event.target.value)"
                                    @blur="setQuantity(index, item.quantity)"
                                    min="1"
                                    :disabled="isProcessing('quantity')"
                                >
                                <button
                                    class="btn btn-sm btn-outline-secondary quantity-btn"
                                    type="button"
                                    @click="updateQuantity(index, 1)"
                                    :disabled="isProcessing('quantity')"
                                    aria-label="Tăng số lượng"
                                    title="Tăng (Phím +)"
                                >
                                    <i class="bi bi-plus"></i>
                                </button>
                            </div>
                            <button
                                class="btn btn-sm btn-outline-danger"
                                type="button"
                                @click="removeItem(index)"
                                :disabled="isProcessing('quantity')"
                                aria-label="Xóa món"
                                title="Xóa (Phím Delete)"
                            >
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                        <span class="pos-cart__item-total">{{ formatCurrencySafe(item.priceAtOrder * item.quantity) }}</span>
                    </div>
                </section>
                <div v-else class="pos-cart__empty">
                    <i class="bi bi-basket fs-1 text-muted"></i>
                    <p class="mb-0">Giỏ hàng đang trống. Vui lòng chọn sản phẩm.</p>
                </div>

                <section class="pos-cart__customer">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="mb-0">Khách hàng</h6>
                        <button
                            v-if="hasSelectedCustomer"
                            type="button"
                            class="btn btn-link btn-sm text-danger p-0"
                            @click="clearSelectedCustomer"
                        >
                            Bỏ chọn
                        </button>
                    </div>

                    <template v-if="hasSelectedCustomer">
                        <div class="pos-cart__customer-chip">
                            <div>
                                <div class="fw-semibold">{{ selectedCustomerName }}</div>
                                <small class="text-muted">
                                    {{ selectedCustomerPhone || 'Không có số điện thoại' }}
                                </small>
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <div class="input-group">
                            <input
                                v-model.trim="customerSearchTerm"
                                type="text"
                                class="form-control"
                                placeholder="Nhập tên hoặc SĐT khách hàng"
                                @keyup.enter.prevent="triggerCustomerSearch"
                            >
                            <button
                                type="button"
                                class="btn btn-outline-secondary"
                                :disabled="customerSearchLoading"
                                @click="triggerCustomerSearch"
                            >
                                <span v-if="customerSearchLoading" class="spinner-border spinner-border-sm me-2"></span>
                                Tìm
                            </button>
                        </div>
                        <ul
                            v-if="showCustomerSuggestions"
                            class="list-group pos-cart__customer-results mt-2"
                        >
                            <li
                                v-for="customer in customerSearchResults"
                                :key="customer.id || customer.customerId"
                                class="list-group-item list-group-item-action"
                                @click="selectCustomer(customer)"
                            >
                                <div class="fw-semibold">{{ customer.fullName || customer.customerName || customer.name }}</div>
                                <small class="text-muted">{{ customer.phone || customer.customerPhone || '—' }}</small>
                            </li>
                            <li v-if="!customerSearchResults.length" class="list-group-item text-muted small text-center">
                                Không tìm thấy khách phù hợp.
                            </li>
                        </ul>
                        <small class="text-muted d-block mt-2">Chọn khách để tích điểm và hiển thị trên hóa đơn.</small>
                    </template>
                </section>

                <section class="pos-cart__summary">
                    <div class="pos-cart__summary-row">
                        <span>Tổng phụ</span>
                        <span>{{ formatCurrencySafe(subTotal) }}</span>
                    </div>
                    <div class="pos-cart__summary-row" v-if="showDiscountRow">
                        <span>Giảm giá</span>
                        <span>-{{ formatCurrencySafe(discountAmount) }}</span>
                    </div>
                    <div class="pos-cart__summary-divider"></div>
                    <div class="pos-cart__summary-row pos-cart__summary-row--total">
                        <span>Tổng cộng</span>
                        <span>{{ formatCurrencySafe(totalAmount) }}</span>
                    </div>
                </section>

                <section class="pos-cart__voucher">
                    <template v-if="hasVoucherApplied">
                        <div class="alert alert-success d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <strong>Voucher đã áp dụng:</strong> {{ localOrder.voucherCode }}
                            </div>
                            <button
                                class="btn btn-sm btn-outline-danger"
                                type="button"
                                @click="removeVoucher"
                                :disabled="isProcessing('remove-voucher')"
                            >
                                <span v-if="isProcessing('remove-voucher')" class="spinner-border spinner-border-sm me-2"></span>
                                Bỏ voucher
                            </button>
                        </div>
                    </template>
                    <div v-else>
                        <div class="input-group mb-2">
                            <input
                                type="text"
                                class="form-control"
                                placeholder="Nhập mã voucher"
                                v-model.trim="voucherCode"
                                :disabled="!isExistingOrder || isProcessing('apply-voucher') || isProcessing('check-voucher')"
                                @keyup.enter="handleVoucherCheck"
                            >
                            <button
                                class="btn btn-outline-info"
                                type="button"
                                @click="handleVoucherCheck"
                                :disabled="!canCheckVoucher"
                                title="Kiểm tra voucher"
                            >
                                <span v-if="isProcessing('check-voucher')" class="spinner-border spinner-border-sm me-2"></span>
                                <i v-else class="bi bi-search me-1"></i>
                                Kiểm tra
                            </button>
                            <button
                                class="btn btn-primary"
                                type="button"
                                @click="applyVoucher"
                                :disabled="!canApplyVoucher"
                            >
                                <span v-if="isProcessing('apply-voucher')" class="spinner-border spinner-border-sm me-2"></span>
                                Áp dụng
                            </button>
                        </div>
                        <div v-if="voucherCheckResult" class="alert" :class="voucherCheckResult.valid ? 'alert-success' : 'alert-warning'">
                            <div v-if="voucherCheckResult.valid">
                                <i class="bi bi-check-circle me-2"></i>
                                <strong>Voucher hợp lệ!</strong>
                                <div class="mt-1">
                                    Giảm giá: <strong>{{ formatVoucherDiscount(voucherCheckResult) }}</strong>
                                </div>
                            </div>
                            <div v-else>
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                <strong>{{ voucherCheckResult.message || 'Voucher không hợp lệ' }}</strong>
                            </div>
                        </div>
                        <small v-if="!isExistingOrder" class="text-muted d-block mt-2">Lưu đơn hàng trước khi áp dụng voucher.</small>
                    </div>
                </section>

                <section class="pos-cart__actions">
                    <button
                        class="btn btn-success"
                        type="button"
                        @click="processPayment"
                        :disabled="!canProcessPayment"
                    >
                        <span v-if="isProcessing('pay')" class="spinner-border spinner-border-sm me-2"></span>
                        Thanh toán
                    </button>
                    <button
                        class="btn btn-outline-primary"
                        type="button"
                        @click="saveOrder"
                        :disabled="isProcessing('save') || cartIsEmpty"
                    >
                        <span v-if="isProcessing('save')" class="spinner-border spinner-border-sm me-2"></span>
                        Lưu đơn hàng
                    </button>
                    <button
                        class="btn btn-outline-danger"
                        type="button"
                        @click="cancelOrder"
                        :disabled="isProcessing('cancel')"
                    >
                        <span v-if="isProcessing('cancel')" class="spinner-border spinner-border-sm me-2"></span>
                        {{ isExistingOrder ? 'Hủy đơn hàng' : 'Hủy tạo mới' }}
                    </button>
                </section>
            </template>
        </div>
    </div>

    <PosPaymentModal
        ref="paymentModalRef"
        :order="localOrder"
        :table="props.table"
        :processing="loadingAction === 'pay'"
        @confirm-payment="confirmPayment"
        @closed="handlePaymentModalClosed"
    />
</template>

<script setup>
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import * as orderService from '@/api/orderService.js'
import { searchCustomers } from '@/api/customerService.js'
import { checkVoucher } from '@/api/voucherService.js'
import { formatCurrency } from '@/utils/formatters.js'
import { toast } from 'vue3-toastify'
import PosPaymentModal from './PosPaymentModal.vue'

const props = defineProps({
    table: Object,
    order: Object,
    viewIntent: {
        type: String,
        default: 'table-first',
    },
})

const emit = defineEmits(['order-updated', 'create-new-takeaway', 'request-table-selection'])

const localOrder = ref({
    items: [],
    customerId: null,
    customerName: null,
    customerPhone: null,
    customerEmail: null,
})
const originalOrderSnapshot = ref(null)
const isCreatingNew = ref(false)
const voucherCode = ref('')
const voucherCheckResult = ref(null)
const loadingAction = ref(null)
const paymentModalRef = ref(null)

const customerSearchTerm = ref('')
const customerSearchResults = ref([])
const customerSearchLoading = ref(false)
let customerSearchTimeout = null

const STATUS_METADATA = Object.freeze({
    PENDING: { label: 'Đang chờ', class: 'status-pill--pending' },
    PAID: { label: 'Đã thanh toán', class: 'status-pill--paid' },
    CANCELLED: { label: 'Đã hủy', class: 'status-pill--cancelled' },
    TRANSFERRED: { label: 'Đã chuyển ca', class: 'status-pill--transferred' }
})

const toNumberSafe = (value, fallback = 0) => {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : fallback
}

const normalizeItems = (orderLike) => {
    if (!orderLike) return []

    const base = Array.isArray(orderLike.items) && orderLike.items.length
        ? orderLike.items
        : Array.isArray(orderLike.orderDetails)
            ? orderLike.orderDetails
            : []

    return base.map((detail) => ({
        id: detail.id,
        orderDetailId: detail.id,
        productId: detail.productId ?? detail.product?.id ?? detail.id,
        productName: detail.productName ?? detail.product?.name ?? detail.name ?? 'Sản phẩm',
        quantity: toNumberSafe(detail.quantity ?? detail.qty ?? 0),
        priceAtOrder: toNumberSafe(detail.priceAtOrder ?? detail.price ?? detail.unitPrice ?? 0),
        notes: detail.notes ?? '',
    }))
}

const cloneDeep = (value) => {
    try {
        return structuredClone(value)
    } catch (err) {
        return JSON.parse(JSON.stringify(value))
    }
}

const normalizeOrder = (incoming) => {
    if (!incoming) return { items: [] }
    const cloned = cloneDeep(incoming)
    cloned.items = normalizeItems(cloned)
    const customerId = cloned.customerId ?? cloned.customer?.id ?? null
    const customerName = cloned.customerName ?? cloned.customer?.fullName ?? cloned.customer?.name ?? null
    const customerPhone = cloned.customerPhone ?? cloned.customer?.phone ?? null
    const customerEmail = cloned.customerEmail ?? cloned.customer?.email ?? null
    Object.assign(cloned, {
        customerId,
        customerName,
        customerPhone,
        customerEmail,
    })
    return cloned
}

const emitOrderUpdated = (reason, order = localOrder.value) => {
    emit('order-updated', {
        reason,
        order: cloneDeep(order),
    })
}

const updateLocalOrderFromServer = (order, { syncBaseline = false } = {}) => {
    if (!order) {
        localOrder.value = {
            items: [],
            customerId: null,
            customerName: null,
            customerPhone: null,
            customerEmail: null,
        }
        if (syncBaseline) {
            originalOrderSnapshot.value = null
        }
        return
    }
    const normalized = normalizeOrder(order)
    localOrder.value = normalized
    if (syncBaseline) {
        originalOrderSnapshot.value = cloneDeep(normalized)
    }
}

watch(() => props.order, (newOrder) => {
    if (newOrder) {
        updateLocalOrderFromServer(newOrder, { syncBaseline: true })
        isCreatingNew.value = false
    } else {
        localOrder.value = { items: [] }
        originalOrderSnapshot.value = null
    }
}, { immediate: true })

const cartTitle = computed(() => {
    if (props.table) {
        return `Đơn tại bàn: ${props.table.name}`
    }

    if (props.viewIntent === 'takeaway') {
        if (localOrder.value?.code || localOrder.value?.id) {
            return `Đơn mang đi: #${localOrder.value.code || localOrder.value.id}`
        }
        return 'Đơn mang đi (chưa lưu)'
    }

    if (props.viewIntent === 'product-first') {
        return localOrder.value?.id ? 'Đơn nháp đã lưu' : 'Đơn nháp (chờ gán bàn)'
    }

    return 'Đơn hàng POS'
})

const orderStatusMeta = computed(() => {
    const status = localOrder.value.status
    if (status) {
        return STATUS_METADATA[status] || { label: status, class: 'status-pill--default' }
    }

    if (props.viewIntent === 'takeaway') {
        return localOrder.value?.id
            ? { label: 'Mang đi • Đang xử lý', class: 'status-pill--takeaway' }
            : { label: 'Mang đi • Đang tạo', class: 'status-pill--draft' }
    }

    if (!props.table) {
        return isCreatingNew.value
            ? { label: 'Đang tạo đơn', class: 'status-pill--draft' }
            : { label: 'Chưa gán bàn', class: 'status-pill--default' }
    }

    if (isCreatingNew.value) {
        return { label: 'Đang tạo', class: 'status-pill--draft' }
    }

    return { label: 'Không xác định', class: 'status-pill--default' }
})

const orderStatusLabel = computed(() => orderStatusMeta.value.label)
const orderStatusClass = computed(() => orderStatusMeta.value.class)

const formatCurrencySafe = (value) => {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return '—'
    return formatCurrency(numeric)
}

const subTotal = computed(() => {
    const backendSubTotal = localOrder.value.subTotal
    if (Number.isFinite(backendSubTotal)) {
        return backendSubTotal
    }
    const items = Array.isArray(localOrder.value.items) ? localOrder.value.items : []
    return items.reduce((acc, item) => acc + (Number(item.priceAtOrder) || 0) * (Number(item.quantity) || 0), 0)
})

const discountAmount = computed(() => {
    const discount = Number(localOrder.value.discountAmount)
    return Number.isFinite(discount) ? Math.max(discount, 0) : 0
})

const totalAmount = computed(() => {
    const backendTotal = Number(localOrder.value.totalAmount)
    if (Number.isFinite(backendTotal)) {
        return Math.max(backendTotal, 0)
    }
    return Math.max(subTotal.value - discountAmount.value, 0)
})

const hasVoucherApplied = computed(() => Boolean(localOrder.value.voucherCode))
const isExistingOrder = computed(() => Boolean(localOrder.value?.id))
const cartIsEmpty = computed(() => {
    const items = localOrder.value.items
    return !Array.isArray(items) || items.length === 0
})
const showDiscountRow = computed(() => discountAmount.value > 0)

const showSelectTableButton = computed(() => !props.table && props.viewIntent !== 'takeaway' && !cartIsEmpty.value)

const trimmedVoucherCode = computed(() => voucherCode.value.trim().toUpperCase())
const canCheckVoucher = computed(() => isExistingOrder.value && Boolean(trimmedVoucherCode.value) && !isProcessing('check-voucher') && !isProcessing('apply-voucher'))
const canApplyVoucher = computed(() => isExistingOrder.value && Boolean(trimmedVoucherCode.value) && !isProcessing('apply-voucher'))
const canProcessPayment = computed(() => isExistingOrder.value && !cartIsEmpty.value && !isProcessing('pay'))

const hasSelectedCustomer = computed(() => Boolean(localOrder.value.customerId))
const selectedCustomerName = computed(() => localOrder.value.customerName || 'Khách lẻ')
const selectedCustomerPhone = computed(() => localOrder.value.customerPhone || '')
const showCustomerSuggestions = computed(() => customerSearchTerm.value && !hasSelectedCustomer.value)

const createNewOrder = () => {
    isCreatingNew.value = true
    if (!props.table) {
        emit('create-new-takeaway')
    }
}

const addProduct = (product) => {
    if (!isCreatingNew.value && !props.order) {
        createNewOrder()
    }

    const existingItem = localOrder.value.items.find(item => item.productId === product.id)
    if (existingItem) {
        existingItem.quantity++
    } else {
        localOrder.value.items.push({
            productId: product.id,
            productName: product.name,
            quantity: 1,
            priceAtOrder: product.price,
            notes: '',
        })
    }
}

const updateQuantity = (index, change) => {
    loadingAction.value = 'quantity'
    const newQuantity = localOrder.value.items[index].quantity + change
    if (newQuantity <= 0) {
        removeItem(index)
    } else {
        localOrder.value.items[index].quantity = newQuantity
    }
    loadingAction.value = null
}

const setQuantity = (index, value) => {
    const numValue = parseInt(value, 10)
    if (Number.isFinite(numValue) && numValue > 0) {
        loadingAction.value = 'quantity'
        localOrder.value.items[index].quantity = numValue
        loadingAction.value = null
    }
}

const removeItem = (index) => {
    const item = localOrder.value.items[index]
    if (!item) return
    // Quick remove without confirmation for better UX in POS
    localOrder.value.items.splice(index, 1)
    toast.info(`Đã xóa "${item.productName}" khỏi đơn hàng`, { autoClose: 2000 })
}

const saveOrder = async () => {
    loadingAction.value = 'save'
    try {
        const orderData = {
            tableId: props.table?.id,
            type: props.table ? 'DINE_IN' : 'TAKE_AWAY',
            customerId: localOrder.value.customerId || null,
            items: localOrder.value.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                notes: item.notes,
            })),
        }

        if (localOrder.value.id) {
            const orderId = localOrder.value.id
            const originalItems = originalOrderSnapshot.value?.items ?? []
            const currentItems = Array.isArray(localOrder.value.items) ? localOrder.value.items : []

            const originalByDetailId = new Map()
            originalItems.forEach((item) => {
                if (item.orderDetailId) {
                    originalByDetailId.set(item.orderDetailId, item)
                }
            })

            const currentByDetailId = new Map()
            const itemsToAdd = []
            currentItems.forEach((item) => {
                if (item.orderDetailId) {
                    currentByDetailId.set(item.orderDetailId, item)
                } else {
                    itemsToAdd.push({
                        productId: item.productId,
                        quantity: Math.max(1, toNumberSafe(item.quantity, 1)),
                        notes: item.notes || '',
                    })
                }
            })

            const itemsToRemove = []
            originalByDetailId.forEach((_, detailId) => {
                if (!currentByDetailId.has(detailId)) {
                    itemsToRemove.push(detailId)
                }
            })

            const itemsToUpdate = []
            currentByDetailId.forEach((item, detailId) => {
                const original = originalByDetailId.get(detailId)
                if (!original) return
                const quantityChanged = Number(item.quantity) !== Number(original.quantity)
                const notesChanged = (item.notes || '') !== (original.notes || '')
                if (quantityChanged || notesChanged) {
                    itemsToUpdate.push({
                        orderDetailId: detailId,
                        quantity: Math.max(1, toNumberSafe(item.quantity, 1)),
                        notes: item.notes || '',
                    })
                }
            })

            if (!itemsToAdd.length && !itemsToUpdate.length && !itemsToRemove.length) {
                toast.info('Không có thay đổi nào cần lưu.')
                return
            }

            let lastResponse = null

            for (const detailId of itemsToRemove) {
                lastResponse = await orderService.removeItemFromOrder({ orderId, orderDetailId: detailId })
                updateLocalOrderFromServer(lastResponse)
            }

            for (const update of itemsToUpdate) {
                lastResponse = await orderService.updateOrderItem({
                    orderId,
                    orderDetailId: update.orderDetailId,
                    updateData: {
                        quantity: update.quantity,
                        notes: update.notes,
                    },
                })
                updateLocalOrderFromServer(lastResponse)
            }

            for (const addition of itemsToAdd) {
                lastResponse = await orderService.addItemToOrder({
                    orderId,
                    itemData: {
                        productId: addition.productId,
                        quantity: addition.quantity,
                        notes: addition.notes,
                    },
                })
                updateLocalOrderFromServer(lastResponse)
            }

            if (lastResponse) {
                updateLocalOrderFromServer(lastResponse, { syncBaseline: true })
            }

            toast.success('Đơn hàng đã được cập nhật.')
            emitOrderUpdated('update', localOrder.value)
        } else {
            const newOrder = await orderService.createOrder(orderData)
            updateLocalOrderFromServer(newOrder, { syncBaseline: true })
            isCreatingNew.value = false
            toast.success('Đơn hàng đã được tạo.')
            emitOrderUpdated('create', newOrder)
        }
    } catch (error) {
        toast.error('Lưu đơn hàng thất bại.')
        console.error(error)
    } finally {
        loadingAction.value = null
    }
}

const handleVoucherCheck = async () => {
    if (!localOrder.value.id) {
        toast.error('Vui lòng lưu đơn hàng trước khi kiểm tra voucher.')
        return
    }
    if (!trimmedVoucherCode.value) {
        toast.info('Nhập mã voucher trước khi kiểm tra.')
        return
    }
    
    try {
        loadingAction.value = 'check-voucher'
        voucherCheckResult.value = null
        
        const totalAmount = Number(localOrder.value.totalAmount || 0)
        const result = await checkVoucher(trimmedVoucherCode.value, totalAmount)
        
        if (result.isValid) {
            voucherCheckResult.value = {
                valid: true,
                discountAmount: Number(result.discountAmount || 0),
                message: result.message || null
            }
        } else {
            voucherCheckResult.value = {
                valid: false,
                message: result.message || 'Voucher không hợp lệ.'
            }
        }
    } catch (error) {
        const message = error?.response?.data?.message || 'Voucher không hợp lệ hoặc không thể áp dụng.'
        voucherCheckResult.value = {
            valid: false,
            message: message
        }
    } finally {
        loadingAction.value = null
    }
}

const formatVoucherDiscount = (result) => {
    if (!result || !result.valid) return '—'
    const discount = Number(result.discountAmount || 0)
    return formatCurrency(discount)
}

const applyVoucher = async () => {
    if (!localOrder.value.id) {
        toast.error('Vui lòng lưu đơn hàng trước khi áp dụng voucher.')
        return
    }
    if (!trimmedVoucherCode.value) {
        toast.info('Nhập mã voucher trước khi áp dụng.')
        return
    }
    try {
        loadingAction.value = 'apply-voucher'
        const updatedOrder = await orderService.applyVoucher({
            orderId: localOrder.value.id,
            voucherCode: trimmedVoucherCode.value
        })
        updateLocalOrderFromServer(updatedOrder, { syncBaseline: true })
        voucherCode.value = ''
        voucherCheckResult.value = null
        toast.success('Áp dụng voucher thành công.')
        emitOrderUpdated('voucher-applied', updatedOrder)
    } catch (error) {
        const message = error?.response?.data?.message || 'Áp dụng voucher thất bại.'
        toast.error(message)
        console.error(error)
    } finally {
        loadingAction.value = null
    }
}

const removeVoucher = async () => {
    if (!localOrder.value.id) {
        return
    }
    try {
        loadingAction.value = 'remove-voucher'
        const updatedOrder = await orderService.removeVoucher(localOrder.value.id)
        updateLocalOrderFromServer(updatedOrder, { syncBaseline: true })
        voucherCheckResult.value = null
        toast.info('Đã bỏ voucher khỏi đơn hàng.')
        emitOrderUpdated('voucher-removed', updatedOrder)
    } catch (error) {
        const message = error?.response?.data?.message || 'Không thể bỏ voucher.'
        toast.error(message)
        console.error(error)
    } finally {
        loadingAction.value = null
    }
}

const processPayment = () => {
    if (!localOrder.value.id) {
        toast.error('Vui lòng lưu đơn hàng trước khi thanh toán.')
        return
    }
    paymentModalRef.value?.show()
}

const confirmPayment = async ({ orderId, paymentMethod } = {}) => {
    if (!orderId) {
        toast.error('Thiếu thông tin đơn hàng để thanh toán.')
        return
    }
    try {
        loadingAction.value = 'pay'
        const paymentData = {
            paymentMethod: paymentMethod || 'CASH',
        }
        if (localOrder.value.customerId) {
            paymentData.customerId = localOrder.value.customerId
        }
        const updatedOrder = await orderService.processPayment({
            orderId,
            paymentData,
        })
        updateLocalOrderFromServer(updatedOrder, { syncBaseline: true })
        paymentModalRef.value?.show()
        toast.success('Thanh toán thành công.')
        emitOrderUpdated('payment', updatedOrder)
    } catch (error) {
        const message = error?.response?.data?.message || 'Thanh toán thất bại.'
        toast.error(message)
        console.error(error)
    } finally {
        loadingAction.value = null
    }
}

const handlePaymentModalClosed = () => {
    if (loadingAction.value === 'pay') {
        loadingAction.value = null
    }
}

const requestTableSelection = () => {
    emit('request-table-selection')
}

const showPaymentModal = (order) => {
    if (order) {
        updateLocalOrderFromServer(order, { syncBaseline: true })
    }
    isCreatingNew.value = false
    paymentModalRef.value?.show()
}

const cancelOrder = async () => {
    if (!localOrder.value.id) {
        isCreatingNew.value = false
        localOrder.value = { items: [] }
        return
    }
    try {
        loadingAction.value = 'cancel'
        const updatedOrder = await orderService.cancelOrder(localOrder.value.id)
        updateLocalOrderFromServer(updatedOrder, { syncBaseline: true })
        toast.success('Đã hủy đơn hàng.')
        emitOrderUpdated('cancelled', updatedOrder)
    } catch (error) {
        const message = error?.response?.data?.message || 'Hủy đơn hàng thất bại.'
        toast.error(message)
        console.error(error)
    } finally {
        loadingAction.value = null
    }
}

const isProcessing = (action) => loadingAction.value === action

const startDraft = () => {
    isCreatingNew.value = true
    if (!localOrder.value || !Array.isArray(localOrder.value.items)) {
        localOrder.value = {
            items: [],
            customerId: null,
            customerName: null,
            customerPhone: null,
            customerEmail: null,
        }
    }
}

const attachToTable = (table) => {
    if (!table) return
    if (!localOrder.value || !Array.isArray(localOrder.value.items)) {
        localOrder.value = {
            items: [],
            customerId: null,
            customerName: null,
            customerPhone: null,
            customerEmail: null,
        }
    }
    if (!localOrder.value.items.length) {
        isCreatingNew.value = false
    }
}

const detachFromTable = () => {
    // Keep existing draft items but mark as creating new until table is selected again
    if (!localOrder.value || !Array.isArray(localOrder.value.items)) {
        localOrder.value = {
            items: [],
            customerId: null,
            customerName: null,
            customerPhone: null,
            customerEmail: null,
        }
    }
    isCreatingNew.value = true
}

const triggerCustomerSearch = () => {
    const keyword = customerSearchTerm.value.trim()
    if (!keyword) {
        customerSearchResults.value = []
        return
    }
    fetchCustomerSuggestions(keyword)
}

const fetchCustomerSuggestions = async (keyword) => {
    if (!keyword) return
    if (customerSearchTimeout) {
        clearTimeout(customerSearchTimeout)
    }
    customerSearchTimeout = setTimeout(async () => {
        customerSearchLoading.value = true
        try {
            const response = await searchCustomers({ keyword, page: 0, size: 5 })
            const content = Array.isArray(response?.content)
                ? response.content
                : Array.isArray(response)
                    ? response
                    : []
            customerSearchResults.value = content
        } catch (error) {
            console.error(error)
            toast.error('Không thể tìm khách hàng. Vui lòng thử lại.')
        } finally {
            customerSearchLoading.value = false
        }
    }, 200)
}

const selectCustomer = (customer) => {
    if (!customer) return
    if (!localOrder.value) {
        localOrder.value = { items: [] }
    }
    localOrder.value.customerId = customer.id ?? customer.customerId ?? null
    localOrder.value.customerName = customer.fullName ?? customer.customerName ?? customer.name ?? 'Khách lẻ'
    localOrder.value.customerPhone = customer.phone ?? customer.customerPhone ?? null
    localOrder.value.customerEmail = customer.email ?? customer.customerEmail ?? null
    customerSearchTerm.value = ''
    customerSearchResults.value = []
}

const clearSelectedCustomer = () => {
    if (!localOrder.value) return
    localOrder.value.customerId = null
    localOrder.value.customerName = null
    localOrder.value.customerPhone = null
    localOrder.value.customerEmail = null
    customerSearchTerm.value = ''
    customerSearchResults.value = []
}

watch(() => localOrder.value.customerId, () => {
    if (localOrder.value.customerId) {
        customerSearchTerm.value = ''
        customerSearchResults.value = []
    }
})

onBeforeUnmount(() => {
    if (customerSearchTimeout) {
        clearTimeout(customerSearchTimeout)
    }
})

defineExpose({ addProduct, startDraft, attachToTable, detachFromTable, showPaymentModal })
</script>

<style scoped>
.pos-cart {
    border-radius: 20px;
    background: var(--color-card, #fff);
}

.pos-cart__header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.pos-cart__empty {
    text-align: center;
    padding: 2rem 1rem;
    border: 1px dashed rgba(148, 163, 184, 0.4);
    border-radius: 16px;
    background: rgba(248, 250, 252, 0.7);
}

.pos-cart__items {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.pos-cart__item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 0.75rem;
    align-items: center;
    padding: 0.75rem 1rem;
    border: 1px solid rgba(148, 163, 184, 0.25);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.7);
}

.pos-cart__item-info h6 {
    font-weight: 600;
}

.pos-cart__item-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.quantity-controls {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 0.125rem;
    background: var(--color-bg-muted);
}

.quantity-btn {
    min-width: 32px;
    height: 32px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
}

.quantity-btn:hover:not(:disabled) {
    background: rgba(99, 102, 241, 0.1);
}

.quantity-input {
    width: 50px;
    text-align: center;
    border: none;
    background: transparent;
    font-weight: 600;
    font-size: 0.9rem;
    padding: 0.25rem;
}

.quantity-input:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
    border-radius: 4px;
}

.pos-cart__item-total {
    font-weight: 600;
    color: var(--color-heading, #1f2937);
}

.pos-cart__summary {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 16px;
    background: rgba(248, 250, 252, 0.75);
}

.pos-cart__summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.95rem;
}

.pos-cart__summary-row--total {
    font-size: 1.1rem;
    font-weight: 700;
}

.pos-cart__summary-divider {
    height: 1px;
    background: rgba(148, 163, 184, 0.35);
}

.pos-cart__customer {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.pos-cart__customer-results {
    max-height: 220px;
    overflow-y: auto;
    border-radius: 12px;
}

.pos-cart__customer-results .list-group-item {
    cursor: pointer;
}

.pos-cart__customer-chip {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    background: rgba(59, 130, 246, 0.08);
    border: 1px solid rgba(59, 130, 246, 0.18);
}

.pos-cart__voucher {
    display: flex;
    flex-direction: column;
}

.pos-cart__actions {
    display: grid;
    gap: 0.75rem;
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

.status-pill--takeaway {
    background: rgba(59, 130, 246, 0.18);
    color: #1d4ed8;
}

.status-pill--draft,
.status-pill--default {
    background: rgba(148, 163, 184, 0.18);
    color: #475569;
}

@media (max-width: 768px) {
    .pos-cart__item {
        grid-template-columns: minmax(0, 1fr);
    }

    .pos-cart__item-total {
        justify-self: flex-end;
    }

    .pos-cart__actions {
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>
