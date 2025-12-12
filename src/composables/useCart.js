import { ref, computed } from 'vue'
import { VAT_RATE } from '@/constants/finance'
import { formatCurrency } from '@/utils/formatters'

/**
 * Composable for cart logic
 * Handles cart operations, calculations, and state management
 */
export function useCart () {
    const items = ref([])
    const selectedTable = ref(null)
    const customer = ref(null)
    const voucher = ref(null)
    const note = ref('')

    // Computed
    const itemCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))

    const subtotal = computed(() => items.value.reduce((sum, item) => sum + (item.price * item.quantity), 0))

    const discountAmount = computed(() => {
        if (!voucher.value) return 0

        if (voucher.value.type === 'PERCENTAGE') {
            return subtotal.value * (voucher.value.value / 100)
        } else if (voucher.value.type === 'FIXED') {
            return Math.min(voucher.value.value, subtotal.value)
        }

        return 0
    })

    const tax = computed(() => (subtotal.value - discountAmount.value) * VAT_RATE)

    const total = computed(() => subtotal.value - discountAmount.value + tax.value)

    // Methods
    const addItem = (product, quantity = 1) => {
        const existingItem = items.value.find(item => item.productId === product.id)

        if (existingItem) {
            existingItem.quantity += quantity
        } else {
            items.value.push({
                productId: product.id,
                productName: product.name,
                price: product.price,
                quantity,
                imageUrl: product.imageUrl
            })
        }
    }

    const removeItem = (productId) => {
        const index = items.value.findIndex(item => item.productId === productId)
        if (index > -1) {
            items.value.splice(index, 1)
        }
    }

    const updateQuantity = (productId, quantity) => {
        const item = items.value.find(item => item.productId === productId)
        if (item) {
            if (quantity <= 0) {
                removeItem(productId)
            } else {
                item.quantity = quantity
            }
        }
    }

    const clearCart = () => {
        items.value = []
        selectedTable.value = null
        customer.value = null
        voucher.value = null
        note.value = ''
    }

    const applyVoucher = (voucherData) => {
        voucher.value = voucherData
    }

    const removeVoucher = () => {
        voucher.value = null
    }

    const setTable = (table) => {
        selectedTable.value = table
    }

    const setCustomer = (customerData) => {
        customer.value = customerData
    }

    const getCartSummary = () => ({
        itemCount: itemCount.value,
        subtotal: subtotal.value,
        discountAmount: discountAmount.value,
        tax: tax.value,
        total: total.value,
        formatted: {
            subtotal: formatCurrency(subtotal.value),
            discountAmount: formatCurrency(discountAmount.value),
            tax: formatCurrency(tax.value),
            total: formatCurrency(total.value)
        }
    })

    return {
        // State
        items,
        selectedTable,
        customer,
        voucher,
        note,

        // Computed
        itemCount,
        subtotal,
        discountAmount,
        tax,
        total,

        // Methods
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        applyVoucher,
        removeVoucher,
        setTable,
        setCustomer,
        getCartSummary
    }
}

