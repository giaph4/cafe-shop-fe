<template>
  <Teleport to="body">
    <div
      class="purchase-order-modal modal fade show"
      tabindex="-1"
      @click.self="handleClose"
    >
      <div
        class="modal-backdrop fade show"
        @click="handleClose"
      />
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div
          class="modal-content"
          @click.stop
        >
          <div class="modal-header">
            <div class="modal-header__content">
              <h5 class="modal-title">
                Tạo đơn đặt hàng: <strong>{{ suggestion.name }}</strong>
              </h5>
              <p class="modal-subtitle mb-0">
                Tạo đơn đặt hàng từ đề xuất tự động của hệ thống
              </p>
            </div>
            <button
              type="button"
              class="btn-close"
              aria-label="Đóng"
              @click="handleClose"
            />
          </div>
          <div class="modal-body">
            <div class="alert alert-info">
              <i class="bi bi-info-circle me-2" />
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
                >
              </div>
              <div class="col-md-6">
                <label class="form-label">Đơn vị</label>
                <input
                  type="text"
                  class="form-control clean-input"
                  :value="suggestion.unit"
                  disabled
                >
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Số lượng đề xuất</label>
                <input
                  v-model.number="formData.quantity"
                  type="number"
                  class="form-control clean-input"
                  :min="1"
                  step="0.01"
                >
                <small class="form-text">
                  Đề xuất: {{ formatNumber(suggestion.suggestion.quantity) }} {{ suggestion.unit }}
                </small>
              </div>
              <div class="col-md-6">
                <label class="form-label">Nhà cung cấp</label>
                <select
                  v-model="formData.supplierId"
                  class="form-select clean-input"
                  required
                >
                  <option value="">
                    Chọn nhà cung cấp
                  </option>
                  <option
                    v-for="supplier in suppliers"
                    :key="supplier.supplierId"
                    :value="supplier.supplierId"
                  >
                    {{ supplier.supplierName }}
                    <template v-if="supplier.lastUnitPrice">
                      ({{ formatCurrency(supplier.lastUnitPrice) }}/{{ suggestion.unit }})
                    </template>
                    <template v-if="supplier.isHistorical">
                      - ✓ Đã từng cung cấp
                    </template>
                  </option>
                </select>
                <small
                  v-if="loadingSuppliers"
                  class="form-text text-muted"
                >
                  <span class="spinner-border spinner-border-sm me-1" />
                  Đang tải danh sách nhà cung cấp...
                </small>
                <small
                  v-else-if="suppliers.length === 0"
                  class="form-text text-warning"
                >
                  <i class="bi bi-exclamation-triangle me-1" />
                  Không có nhà cung cấp nào trong hệ thống
                </small>
                <small
                  v-else-if="suggestion.lastPurchaseOrder"
                  class="form-text"
                >
                  <i class="bi bi-info-circle me-1" />
                  Lần cuối: {{ formatDate(suggestion.lastPurchaseOrder.date) }} -
                  {{ formatNumber(suggestion.lastPurchaseOrder.quantity) }} {{ suggestion.unit }}
                </small>
                <small
                  v-else
                  class="form-text text-muted"
                >
                  <i class="bi bi-info-circle me-1" />
                  Chọn nhà cung cấp từ danh sách. Nhà cung cấp đã từng cung cấp sẽ được đánh dấu.
                </small>
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Đơn giá</label>
                <input
                  v-model.number="formData.unitPrice"
                  type="number"
                  class="form-control clean-input"
                  :min="0"
                  step="1000"
                  placeholder="Nhập đơn giá"
                >
              </div>
              <div class="col-md-6">
                <label class="form-label">Thành tiền ước tính</label>
                <input
                  type="text"
                  class="form-control clean-input"
                  :value="estimatedTotal"
                  disabled
                >
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">
                  Ngày dự kiến nhận hàng
                  <small class="text-muted">(Tùy chọn)</small>
                </label>
                <input
                  v-model="formData.expectedDate"
                  type="date"
                  class="form-control clean-input"
                  :min="minDate"
                >
                <small class="form-text">
                  Để trống nếu chưa xác định ngày nhận hàng
                </small>
              </div>
            </div>

            <div
              v-if="error"
              class="alert alert-danger"
            >
              {{ error }}
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn-flat btn-flat--outline"
              :disabled="creating"
              @click="handleClose"
            >
              Hủy
            </button>
            <button
              type="button"
              class="btn-flat btn-flat--primary"
              :disabled="!canCreate || creating"
              @click="handleCreate"
            >
              <span
                v-if="creating"
                class="spinner-border spinner-border-sm me-2"
              />
              <i
                v-else
                class="bi bi-check-lg me-2"
              />
              Tạo đơn đặt hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useInventoryManagementStore } from '@/store/inventoryManagement'
import * as supplierService from '@/api/supplierService'
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters'
import logger from '@/utils/logger'

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
const allSuppliers = ref([])
const historicalSuppliers = computed(() => store.suppliers) // Nhà cung cấp đã từng cung cấp
const creating = ref(false)
const loadingSuppliers = ref(false)
const error = ref('')

// Merge tất cả nhà cung cấp, ưu tiên hiển thị những người đã từng cung cấp trước
const suppliers = computed(() => {
    const historicalIds = new Set(historicalSuppliers.value.map(s => s.supplierId))
    
    // Tách thành 2 nhóm: đã từng cung cấp và chưa từng cung cấp
    const historical = []
    const others = []
    
    for (const supplier of allSuppliers.value) {
        // Backend có thể trả về id hoặc supplierId
        const supplierId = supplier.id || supplier.supplierId
        const supplierName = supplier.name || supplier.supplierName || 'N/A'
        
        if (historicalIds.has(supplierId)) {
            // Tìm thông tin từ historical để có lastUnitPrice
            const historicalInfo = historicalSuppliers.value.find(s => s.supplierId === supplierId)
            historical.push({
                ...supplier,
                supplierId: supplierId,
                supplierName: supplierName,
                lastUnitPrice: historicalInfo?.lastUnitPrice,
                isHistorical: true
            })
        } else {
            others.push({
                ...supplier,
                supplierId: supplierId,
                supplierName: supplierName,
                isHistorical: false
            })
        }
    }
    
    // Sắp xếp: đã từng cung cấp trước, sau đó là các nhà cung cấp khác
    return [...historical, ...others]
})

// Helper function to safely convert to number
const safeNumber = (value, defaultValue = 0) => {
    if (value === null || value === undefined || value === '') return defaultValue
    const num = Number(value)
    return Number.isNaN(num) ? defaultValue : num
}

// Helper to get minimum date (today)
const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
}

// Initialize formData with safe number conversion
const initializeFormData = (suggestion) => {
    const suggestedQuantity = safeNumber(suggestion?.suggestion?.quantity, 0)
    const lastUnitPrice = safeNumber(suggestion?.lastPurchaseOrder?.unitPrice, 0)
    
    return {
        quantity: suggestedQuantity > 0 ? suggestedQuantity : 1, // Tối thiểu 1
        supplierId: suggestion?.suggestion?.supplierId || '',
        unitPrice: lastUnitPrice > 0 ? lastUnitPrice : 0,
        expectedDate: '' // Optional field, user can set later
    }
}

const formData = ref(initializeFormData(props.suggestion))
const minDate = getMinDate()

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

// Load tất cả nhà cung cấp
const loadAllSuppliers = async () => {
    loadingSuppliers.value = true
    try {
        const response = await supplierService.getSuppliers()
        // Handle both array and page format
        const suppliersList = Array.isArray(response) 
            ? response 
            : (response?.content || [])
        allSuppliers.value = suppliersList
    } catch (err) {
        logger.error('Không thể tải danh sách nhà cung cấp:', err)
        error.value = 'Không thể tải danh sách nhà cung cấp'
    } finally {
        loadingSuppliers.value = false
    }
}

// Load nhà cung cấp đã từng cung cấp nguyên liệu này (để hiển thị thông tin giá)
const loadHistoricalSuppliers = async () => {
    if (props.suggestion?.ingredientId) {
        try {
            await store.getSuppliers(props.suggestion.ingredientId)
        } catch (err) {
            logger.warn('Không thể tải lịch sử nhà cung cấp:', err)
            // Không throw error vì đây chỉ là thông tin bổ sung
        }
    }
}

watch(() => props.suggestion, async (newSuggestion) => {
    if (newSuggestion) {
        formData.value = initializeFormData(newSuggestion)
        // Load cả tất cả nhà cung cấp và lịch sử
        await Promise.all([
            loadAllSuppliers(),
            loadHistoricalSuppliers()
        ])
    }
}, { immediate: true })

onMounted(() => {
    loadAllSuppliers()
    if (props.suggestion?.ingredientId) {
        loadHistoricalSuppliers()
    }
})

const handleCreate = async () => {
    if (!canCreate.value) return

    creating.value = true
    error.value = ''

    try {
        // Build request data matching backend PurchaseOrderRequestDTO
        const orderData = {
            supplierId: Number(formData.value.supplierId),
            items: [{
                ingredientId: Number(props.suggestion.ingredientId),
                quantity: safeNumber(formData.value.quantity, 0),
                unitPrice: safeNumber(formData.value.unitPrice, 0)
            }]
        }

        // Add expectedDate only if provided (optional field)
        // Backend expects LocalDateTime, so we send ISO string with time
        if (formData.value.expectedDate) {
            // Convert date string to ISO format with time (LocalDateTime format)
            // Format: "2024-01-15T00:00:00" (Spring will parse this to LocalDateTime)
            const date = new Date(formData.value.expectedDate)
            date.setHours(0, 0, 0, 0)
            // Format as ISO string but remove 'Z' to make it local time
            const isoString = date.toISOString().replace('Z', '')
            orderData.expectedDate = isoString
        }

        await store.createPurchaseOrder(orderData)

        emit('created')
        handleClose()
    } catch (err) {
        error.value = err.response?.data?.message || err.message || 'Không thể tạo đơn đặt hàng'
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

