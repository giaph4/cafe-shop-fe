<template>
    <Teleport to="body">
        <div
            class="purchase-order-modal modal fade show"
            tabindex="-1"
            @click.self="handleClose"
        >
            <div class="modal-backdrop fade show" @click="handleClose"></div>
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content" @click.stop>
                    <div class="modal-header">
                        <div class="modal-header__content">
                            <h5 class="modal-title">Tạo đơn đặt hàng: <strong>{{ suggestion.name }}</strong></h5>
                            <p class="modal-subtitle mb-0">Tạo đơn đặt hàng từ đề xuất tự động của hệ thống</p>
                        </div>
                        <button
                            type="button"
                            class="btn-close"
                            @click="handleClose"
                            aria-label="Đóng"
                        ></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle me-2"></i>
                            {{ suggestion.suggestion.reason }}
                        </div>

                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label">Nguyên liệu</label>
                                <input
                                    type="text"
                                    class="form-control clean-input"
                                    :value="suggestion.name"
                                    disabled
                                />
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Đơn vị</label>
                                <input
                                    type="text"
                                    class="form-control clean-input"
                                    :value="suggestion.unit"
                                    disabled
                                />
                            </div>
                        </div>

                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label">Số lượng đề xuất</label>
                                <input
                                    type="number"
                                    class="form-control clean-input"
                                    v-model.number="formData.quantity"
                                    :min="1"
                                    step="0.01"
                                />
                                <small class="form-text">
                                    Đề xuất: {{ formatNumber(suggestion.suggestion.quantity) }} {{ suggestion.unit }}
                                </small>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Nhà cung cấp</label>
                                <select class="form-select clean-input" v-model="formData.supplierId" required>
                                    <option value="">Chọn nhà cung cấp</option>
                                    <option
                                        v-for="supplier in suppliers"
                                        :key="supplier.supplierId"
                                        :value="supplier.supplierId"
                                    >
                                        {{ supplier.supplierName }}
                                        <span v-if="supplier.lastUnitPrice" class="text-muted">
                                            ({{ formatCurrency(supplier.lastUnitPrice) }}/{{ suggestion.unit }})
                                        </span>
                                    </option>
                                </select>
                                <small v-if="suggestion.lastPurchaseOrder" class="form-text">
                                    Lần cuối: {{ formatDate(suggestion.lastPurchaseOrder.date) }} - 
                                    {{ formatNumber(suggestion.lastPurchaseOrder.quantity) }} {{ suggestion.unit }}
                                </small>
                            </div>
                        </div>

                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label">Đơn giá</label>
                                <input
                                    type="number"
                                    class="form-control clean-input"
                                    v-model.number="formData.unitPrice"
                                    :min="0"
                                    step="1000"
                                    placeholder="Nhập đơn giá"
                                />
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Thành tiền ước tính</label>
                                <input
                                    type="text"
                                    class="form-control clean-input"
                                    :value="estimatedTotal"
                                    disabled
                                />
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Ghi chú</label>
                            <textarea
                                class="form-control clean-input"
                                v-model="formData.note"
                                rows="3"
                                placeholder="Ghi chú cho đơn đặt hàng..."
                            ></textarea>
                        </div>

                        <div v-if="error" class="alert alert-danger">
                            {{ error }}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-flat btn-flat--outline" @click="handleClose" :disabled="creating">
                            Hủy
                        </button>
                        <button
                            type="button"
                            class="btn-flat btn-flat--primary"
                            @click="handleCreate"
                            :disabled="!canCreate || creating"
                        >
                            <span v-if="creating" class="spinner-border spinner-border-sm me-2"></span>
                            <i v-else class="bi bi-check-lg me-2"></i>
                            Tạo đơn đặt hàng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useInventoryManagementStore } from '@/store/inventoryManagement'
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters'

const props = defineProps({
    suggestion: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['close', 'created'])

const handleClose = () => {
    emit('close')
}

const store = useInventoryManagementStore()
const suppliers = computed(() => store.suppliers)
const creating = ref(false)
const error = ref('')

// Helper function to safely convert to number
const safeNumber = (value, defaultValue = 0) => {
    if (value === null || value === undefined || value === '') return defaultValue
    const num = Number(value)
    return Number.isNaN(num) ? defaultValue : num
}

// Initialize formData with safe number conversion
const initializeFormData = (suggestion) => {
    return {
        quantity: safeNumber(suggestion?.suggestion?.quantity, 0),
        supplierId: suggestion?.suggestion?.supplierId || '',
        unitPrice: safeNumber(suggestion?.lastPurchaseOrder?.unitPrice, 0),
        note: `Tự động tạo từ đề xuất: ${suggestion?.suggestion?.reason || ''}`
    }
}

const formData = ref(initializeFormData(props.suggestion))

const estimatedTotal = computed(() => {
    const quantity = safeNumber(formData.value.quantity, 0)
    const unitPrice = safeNumber(formData.value.unitPrice, 0)
    return formatCurrency(quantity * unitPrice)
})

const canCreate = computed(() => {
    const quantity = safeNumber(formData.value.quantity, 0)
    const unitPrice = safeNumber(formData.value.unitPrice, 0)
    return quantity > 0 &&
           formData.value.supplierId &&
           unitPrice > 0
})

watch(() => props.suggestion, (newSuggestion) => {
    if (newSuggestion) {
        formData.value = initializeFormData(newSuggestion)
    }
}, { immediate: true })

const handleCreate = async () => {
    if (!canCreate.value) return

    creating.value = true
    error.value = ''

    try {
        const orderData = {
            supplierId: formData.value.supplierId,
            note: formData.value.note,
            items: [{
                ingredientId: props.suggestion.ingredientId,
                quantity: safeNumber(formData.value.quantity, 0),
                unitPrice: safeNumber(formData.value.unitPrice, 0)
            }]
        }

        await store.createPurchaseOrder(orderData)

        emit('created')
        handleClose()
    } catch (err) {
        error.value = err.message || 'Không thể tạo đơn đặt hàng'
    } finally {
        creating.value = false
    }
}
</script>

<style scoped>
/* Modal Container - Fixed positioning */
.purchase-order-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1055;
    display: block;
    overflow-x: hidden;
    overflow-y: auto;
}

/* Modal Backdrop - Behind modal content */
.purchase-order-modal :global(.modal-backdrop) {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1050;
    background-color: var(--color-backdrop);
    opacity: 1;
}

/* Modal Dialog - Above backdrop */
.purchase-order-modal :global(.modal-dialog) {
    position: relative;
    z-index: 1056;
    margin: var(--spacing-4) auto;
    pointer-events: none;
}

.purchase-order-modal :global(.modal-content) {
    pointer-events: auto;
    border-radius: var(--component-radius-lg);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-modal);
    background: var(--color-card);
}

.purchase-order-modal :global(.modal-header) {
    padding: var(--spacing-6);
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

.purchase-order-modal :global(.modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
    line-height: var(--line-height-tight);
}

.purchase-order-modal :global(.modal-title strong) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
}

.modal-subtitle {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    margin: 0;
    font-family: var(--font-family-sans);
    line-height: var(--line-height-normal);
}

.purchase-order-modal :global(.modal-body) {
    padding: var(--spacing-6);
    color: var(--color-text);
    font-size: var(--font-size-base);
    line-height: var(--line-height-relaxed);
    background: var(--color-card);
}

.purchase-order-modal :global(.modal-footer) {
    padding: var(--spacing-4) var(--spacing-6);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--spacing-2);
}

/* Form Labels - Chuẩn hóa */
.purchase-order-modal :global(.form-label) {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
}

/* Form Text - Chuẩn hóa */
.purchase-order-modal :global(.form-text) {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
    display: block;
}

/* Alert Styles - Chuẩn hóa */
.purchase-order-modal :global(.alert) {
    font-family: var(--font-family-sans);
    border-radius: var(--radius-sm);
    border: 1px solid;
    padding: var(--spacing-3) var(--spacing-4);
    margin-bottom: var(--spacing-4);
}

.purchase-order-modal :global(.alert-info) {
    background: var(--color-soft-sky);
    border-color: var(--color-info);
    color: var(--color-text);
}

.purchase-order-modal :global(.alert-danger) {
    background: var(--color-soft-rose);
    border-color: var(--color-danger);
    color: var(--color-text);
}

.purchase-order-modal :global(.alert i) {
    color: var(--color-info);
}
</style>

