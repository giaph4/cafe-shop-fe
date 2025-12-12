<template>
  <Teleport to="body">
    <div
      ref="modalElement"
      class="modal fade"
      tabindex="-1"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <h5 class="modal-title">
                Cập nhật đơn nhập hàng #{{ purchaseOrderId }}
              </h5>
              <p class="modal-subtitle mb-0">
                Chỉnh sửa thông tin và danh sách nguyên liệu của phiếu nhập.
              </p>
            </div>
            <button
              type="button"
              class="btn-close"
              :disabled="submitting"
              @click="hide"
            />
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSubmit">
              <!-- Supplier Selection -->
              <div class="mb-3">
                <label class="form-label">Nhà cung cấp</label>
                <select
                  v-model="form.supplierId"
                  class="form-select"
                  :disabled="submitting || loadingSuppliers"
                >
                  <option :value="null">
                    -- Chọn nhà cung cấp --
                  </option>
                  <option
                    v-for="supplier in suppliers"
                    :key="supplier.id"
                    :value="supplier.id"
                  >
                    {{ supplier.name }} ({{ supplier.phone || 'N/A' }})
                  </option>
                </select>
                <div
                  v-if="loadingSuppliers"
                  class="form-text"
                >
                  <span class="spinner-border spinner-border-sm me-1" />
                  Đang tải danh sách nhà cung cấp...
                </div>
              </div>

              <!-- Note -->
              <div class="mb-3">
                <label class="form-label">Ghi chú</label>
                <textarea
                  v-model="form.note"
                  class="form-control"
                  rows="3"
                  :disabled="submitting"
                  placeholder="Nhập ghi chú cho đơn nhập hàng..."
                />
              </div>

              <!-- Items Section -->
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <label class="form-label mb-0">Danh sách nguyên liệu</label>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-primary"
                    :disabled="submitting"
                    @click="addItem"
                  >
                    <i class="bi bi-plus-lg me-1" />
                    Thêm nguyên liệu
                  </button>
                </div>
                <div
                  v-if="form.items.length === 0"
                  class="text-muted text-center py-3 border rounded"
                >
                  Chưa có nguyên liệu nào. Nhấn "Thêm nguyên liệu" để thêm.
                </div>
                <div
                  v-else
                  class="table-responsive"
                >
                  <table class="table table-sm table-bordered">
                    <thead class="table-light">
                      <tr>
                        <th>Nguyên liệu</th>
                        <th class="text-end">
                          Số lượng
                        </th>
                        <th class="text-end">
                          Đơn giá
                        </th>
                        <th class="text-end">
                          Thành tiền
                        </th>
                        <th class="text-center">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(item, index) in form.items"
                        :key="index"
                      >
                        <td>
                          <select
                            v-model="item.ingredientId"
                            class="form-select form-select-sm"
                            :disabled="submitting || loadingIngredients"
                            required
                          >
                            <option :value="null">
                              -- Chọn nguyên liệu --
                            </option>
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
                            v-model.number="item.quantity"
                            type="number"
                            class="form-control form-control-sm text-end"
                            :disabled="submitting"
                            min="0"
                            step="0.01"
                            required
                            @input="calculateItemTotal(index)"
                          >
                        </td>
                        <td>
                          <input
                            v-model.number="item.unitPrice"
                            type="number"
                            class="form-control form-control-sm text-end"
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
                            :disabled="submitting"
                            @click="removeItem(index)"
                          >
                            <i class="bi bi-trash" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                    <tfoot v-if="form.items.length > 0">
                      <tr>
                        <td
                          colspan="3"
                          class="text-end fw-bold"
                        >
                          Tổng cộng:
                        </td>
                        <td class="text-end fw-bold text-primary">
                          {{ formatCurrency(totalAmount) }}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <!-- Error Message -->
              <div
                v-if="error"
                class="alert alert-danger mb-0"
              >
                {{ error }}
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-outline-secondary"
              :disabled="submitting"
              @click="hide"
            >
              Hủy
            </button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="submitting || !canSubmit"
              @click="handleSubmit"
            >
              <span
                v-if="submitting"
                class="spinner-border spinner-border-sm me-2"
              />
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

const totalAmount = computed(() => form.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0))

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

const calculateItemTotal = () => {
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

        // Backend không hỗ trợ cập nhật purchase order
        // Thông báo rõ ràng cho người dùng
        error.value = 'Backend không hỗ trợ cập nhật đơn nhập hàng. Vui lòng hủy đơn cũ và tạo đơn mới.'
        toast.error(error.value)
        return
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

:deep(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

:deep(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4);
    background: var(--color-card);
}

:deep(.modal-header .modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

:deep(.modal-header .modal-subtitle) {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    margin-top: var(--spacing-1);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

:deep(.modal-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

:deep(.modal-body .form-label) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

:deep(.modal-body .form-control),
:deep(.modal-body .form-select) {
    height: 40px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    background: var(--color-card);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

:deep(.modal-body .form-control:focus),
:deep(.modal-body .form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

:deep(.modal-body textarea.form-control) {
    height: auto;
    min-height: 80px;
    resize: vertical;
    font-family: var(--font-family-sans);
}

:deep(.modal-body .form-control-sm),
:deep(.modal-body .form-select-sm) {
    height: 36px;
    padding: var(--spacing-1) var(--spacing-2);
    font-size: var(--font-size-sm);
}

:deep(.modal-body .form-text) {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

:deep(.modal-body .alert) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-danger);
    background: var(--color-soft-rose);
    color: var(--color-danger);
    font-family: var(--font-family-sans);
}

:deep(.modal-body .table) {
    margin-bottom: 0;
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
}

:deep(.modal-body .table thead),
:deep(.modal-body .table thead.table-light) {
    background: var(--color-card-muted);
}

:deep(.modal-body .table thead th) {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    background: var(--color-card-muted);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-2);
    vertical-align: middle;
    font-family: var(--font-family-sans);
}

:deep(.modal-body .table tbody td) {
    font-size: var(--font-size-sm);
    padding: var(--spacing-2);
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
    font-family: var(--font-family-sans);
}

:deep(.modal-body .table tbody tr:last-child td) {
    border-bottom: none;
}

:deep(.modal-body .table tbody tr:hover) {
    background: var(--color-card-muted);
}

:deep(.modal-body .table tfoot td) {
    font-family: var(--font-family-sans);
}

:deep(.modal-body .table .fw-bold),
:deep(.modal-body .table .fw-semibold) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

:deep(.modal-body .table .text-primary) {
    color: var(--color-primary) !important;
}

:deep(.modal-body .table-bordered) {
    border: 1px solid var(--color-border);
}

:deep(.modal-body .table-bordered th),
:deep(.modal-body .table-bordered td) {
    border: 1px solid var(--color-border);
}

:deep(.modal-body .border) {
    border: 1px solid var(--color-border) !important;
}

:deep(.modal-body .border.rounded) {
    border-radius: var(--radius-sm) !important;
}

:deep(.modal-body .text-muted) {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

:deep(.modal-body .btn-outline-primary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

:deep(.modal-body .btn-outline-primary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

:deep(.modal-body .btn-outline-danger) {
    border: 1px solid var(--color-danger);
    color: var(--color-danger);
    background: var(--color-card);
}

:deep(.modal-body .btn-outline-danger:hover:not(:disabled)) {
    background: var(--color-soft-rose);
    border-color: var(--color-danger);
    color: var(--color-danger);
}

:deep(.modal-footer) {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-4);
    background: var(--color-card);
}

:deep(.modal-footer .btn) {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    font-family: var(--font-family-sans);
}

:deep(.modal-footer .btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

:deep(.modal-footer .btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

:deep(.modal-footer .btn-primary:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

:deep(.modal-footer .btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

:deep(.modal-footer .btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

:deep(.modal-footer .btn-outline-primary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

:deep(.modal-footer .btn-outline-primary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

:deep(.modal-footer .btn-outline-danger) {
    border-color: var(--color-border);
    color: var(--color-danger);
    background: transparent;
}

:deep(.modal-footer .btn-outline-danger:hover:not(:disabled)) {
    background: var(--color-soft-rose);
    border-color: var(--color-danger);
    color: var(--color-danger);
}

:deep(.modal-footer .btn-sm) {
    padding: var(--spacing-1) var(--spacing-3);
    font-size: var(--font-size-sm);
}
</style>

