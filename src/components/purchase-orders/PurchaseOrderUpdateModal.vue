<template>
    <Teleport to="body">
        <div class="modal fade" ref="modalElement" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Cập nhật đơn nhập hàng #{{ purchaseOrderId }}</h5>
                        <button type="button" class="btn-close" @click="hide"></button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="handleSubmit">
                            <!-- Supplier Selection -->
                            <div class="mb-3">
                                <label class="form-label">Nhà cung cấp</label>
                                <select 
                                    class="form-select" 
                                    v-model="form.supplierId"
                                    :disabled="submitting || loadingSuppliers"
                                >
                                    <option :value="null">-- Chọn nhà cung cấp --</option>
                                    <option 
                                        v-for="supplier in suppliers" 
                                        :key="supplier.id" 
                                        :value="supplier.id"
                                    >
                                        {{ supplier.name }} ({{ supplier.phone || 'N/A' }})
                                    </option>
                                </select>
                                <div v-if="loadingSuppliers" class="form-text">
                                    <span class="spinner-border spinner-border-sm me-1"></span>
                                    Đang tải danh sách nhà cung cấp...
                                </div>
                            </div>

                            <!-- Note -->
                            <div class="mb-3">
                                <label class="form-label">Ghi chú</label>
                                <textarea 
                                    class="form-control" 
                                    v-model="form.note"
                                    rows="3"
                                    :disabled="submitting"
                                    placeholder="Nhập ghi chú cho đơn nhập hàng..."
                                ></textarea>
                            </div>

                            <!-- Items Section -->
                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <label class="form-label mb-0">Danh sách nguyên liệu</label>
                                    <button 
                                        type="button" 
                                        class="btn btn-sm btn-outline-primary"
                                        @click="addItem"
                                        :disabled="submitting"
                                    >
                                        <i class="bi bi-plus-lg me-1"></i>
                                        Thêm nguyên liệu
                                    </button>
                                </div>
                                <div v-if="form.items.length === 0" class="text-muted text-center py-3 border rounded">
                                    Chưa có nguyên liệu nào. Nhấn "Thêm nguyên liệu" để thêm.
                                </div>
                                <div v-else class="table-responsive">
                                    <table class="table table-sm table-bordered">
                                        <thead class="table-light">
                                            <tr>
                                                <th>Nguyên liệu</th>
                                                <th class="text-end">Số lượng</th>
                                                <th class="text-end">Đơn giá</th>
                                                <th class="text-end">Thành tiền</th>
                                                <th class="text-center">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="(item, index) in form.items" :key="index">
                                                <td>
                                                    <select 
                                                        class="form-select form-select-sm" 
                                                        v-model="item.ingredientId"
                                                        :disabled="submitting || loadingIngredients"
                                                        required
                                                    >
                                                        <option :value="null">-- Chọn nguyên liệu --</option>
                                                        <option 
                                                            v-for="ingredient in ingredients" 
                                                            :key="ingredient.id" 
                                                            :value="ingredient.id"
                                                        >
                                                            {{ ingredient.name }} ({{ ingredient.unit }})
                                                        </option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <input 
                                                        type="number" 
                                                        class="form-control form-control-sm text-end" 
                                                        v-model.number="item.quantity"
                                                        :disabled="submitting"
                                                        min="0"
                                                        step="0.01"
                                                        required
                                                        @input="calculateItemTotal(index)"
                                                    >
                                                </td>
                                                <td>
                                                    <input 
                                                        type="number" 
                                                        class="form-control form-control-sm text-end" 
                                                        v-model.number="item.unitPrice"
                                                        :disabled="submitting"
                                                        min="0"
                                                        step="1000"
                                                        required
                                                        @input="calculateItemTotal(index)"
                                                    >
                                                </td>
                                                <td class="text-end fw-semibold">
                                                    {{ formatCurrency((item.quantity || 0) * (item.unitPrice || 0)) }}
                                                </td>
                                                <td class="text-center">
                                                    <button 
                                                        type="button" 
                                                        class="btn btn-sm btn-outline-danger"
                                                        @click="removeItem(index)"
                                                        :disabled="submitting"
                                                    >
                                                        <i class="bi bi-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                        <tfoot v-if="form.items.length > 0">
                                            <tr>
                                                <td colspan="3" class="text-end fw-bold">Tổng cộng:</td>
                                                <td class="text-end fw-bold text-primary">
                                                    {{ formatCurrency(totalAmount) }}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            <!-- Error Message -->
                            <div v-if="error" class="alert alert-danger mb-0">
                                {{ error }}
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button 
                            type="button" 
                            class="btn btn-secondary" 
                            @click="hide"
                            :disabled="submitting"
                        >
                            Hủy
                        </button>
                        <button 
                            type="button" 
                            class="btn btn-primary" 
                            @click="handleSubmit"
                            :disabled="submitting || !canSubmit"
                        >
                            <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                            Cập nhật
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { Modal } from 'bootstrap'
import { updatePurchaseOrder } from '@/api/purchaseOrderService'
import { getSuppliers } from '@/api/supplierService'
import { getIngredients } from '@/api/ingredientService'
import { formatCurrency } from '@/utils/formatters'
import { toast } from 'vue3-toastify'
import logger from '@/utils/logger'

const props = defineProps({
    purchaseOrderId: {
        type: [Number, String],
        default: null
    },
    purchaseOrder: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['updated', 'close'])

const modalElement = ref(null)
let modalInstance = null

const form = reactive({
    supplierId: null,
    note: '',
    items: []
})

const suppliers = ref([])
const ingredients = ref([])
const loadingSuppliers = ref(false)
const loadingIngredients = ref(false)
const submitting = ref(false)
const error = ref(null)

const totalAmount = computed(() => {
    return form.items.reduce((sum, item) => {
        return sum + ((item.quantity || 0) * (item.unitPrice || 0))
    }, 0)
})

const canSubmit = computed(() => {
    if (submitting.value) return false
    // At least one field should be changed or items should be valid
    return form.items.every(item => item.ingredientId && item.quantity > 0 && item.unitPrice >= 0)
})

// Load suppliers and ingredients
const loadSuppliers = async () => {
    loadingSuppliers.value = true
    try {
        const response = await getSuppliers({ page: 0, size: 1000 })
        suppliers.value = Array.isArray(response?.content) ? response.content : (Array.isArray(response) ? response : [])
    } catch (err) {
        logger.warn('Failed to load suppliers:', err)
        suppliers.value = []
    } finally {
        loadingSuppliers.value = false
    }
}

const loadIngredients = async () => {
    loadingIngredients.value = true
    try {
        const response = await getIngredients({ page: 0, size: 1000 })
        ingredients.value = Array.isArray(response?.content) ? response.content : (Array.isArray(response) ? response : [])
    } catch (err) {
        logger.warn('Failed to load ingredients:', err)
        ingredients.value = []
    } finally {
        loadingIngredients.value = false
    }
}

// Initialize form from purchaseOrder prop
const initializeForm = () => {
    if (props.purchaseOrder) {
        form.supplierId = props.purchaseOrder.supplierId || null
        form.note = props.purchaseOrder.note || ''
        
        // Initialize items from purchaseOrder
        if (Array.isArray(props.purchaseOrder.items)) {
            form.items = props.purchaseOrder.items.map(item => ({
                ingredientId: item.ingredientId || item.ingredient?.id || null,
                quantity: item.quantity || 0,
                unitPrice: item.unitPrice || 0
            }))
        } else {
            form.items = []
        }
    } else {
        form.supplierId = null
        form.note = ''
        form.items = []
    }
}

watch(() => props.purchaseOrder, initializeForm, { immediate: true })

const addItem = () => {
    form.items.push({
        ingredientId: null,
        quantity: 0,
        unitPrice: 0
    })
}

const removeItem = (index) => {
    form.items.splice(index, 1)
}

const calculateItemTotal = (index) => {
    // This is handled by computed totalAmount
    // But we can add validation here if needed
}

const handleSubmit = async () => {
    if (!props.purchaseOrderId) {
        error.value = 'Purchase order ID is required'
        return
    }

    if (!canSubmit.value) {
        error.value = 'Vui lòng điền đầy đủ thông tin và đảm bảo tất cả nguyên liệu hợp lệ.'
        return
    }

    submitting.value = true
    error.value = null

    try {
        const updateData = {}
        if (form.supplierId !== undefined) {
            updateData.supplierId = form.supplierId
        }
        if (form.note !== undefined) {
            updateData.note = form.note
        }
        if (form.items.length > 0) {
            updateData.items = form.items.map(item => ({
                ingredientId: item.ingredientId,
                quantity: item.quantity,
                unitPrice: item.unitPrice
            }))
        }

        await updatePurchaseOrder(props.purchaseOrderId, updateData)
        toast.success('Đã cập nhật đơn nhập hàng thành công.')
        emit('updated')
        hide()
    } catch (err) {
        error.value = err.response?.data?.message || err.message || 'Không thể cập nhật đơn nhập hàng.'
        toast.error(error.value)
    } finally {
        submitting.value = false
    }
}

const show = () => {
    if (modalInstance) {
        modalInstance.show()
        initializeForm()
        loadSuppliers()
        loadIngredients()
    }
}

const hide = () => {
    if (modalInstance) {
        modalInstance.hide()
        error.value = null
    }
    emit('close')
}

onMounted(() => {
    modalInstance = new Modal(modalElement.value, { backdrop: 'static' })
    loadSuppliers()
    loadIngredients()
})

onBeforeUnmount(() => {
    if (modalInstance) {
        modalInstance.dispose()
        modalInstance = null
    }
})

defineExpose({ show, hide })
</script>

<style scoped>
.modal-body {
    max-height: 70vh;
    overflow-y: auto;
}
</style>

