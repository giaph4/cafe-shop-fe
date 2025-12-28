<template>
  <Teleport to="body">
    <div
      ref="modalElement"
      class="modal fade product-customization-modal"
      tabindex="-1"
      aria-labelledby="customizationModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-header__content">
              <h5
                id="customizationModalLabel"
                class="modal-title"
              >
                Tùy chọn: {{ product?.name }}
              </h5>
              <p class="modal-subtitle">
                Vui lòng chọn các tùy chọn cho món này
              </p>
            </div>
            <button
              type="button"
              class="btn-close"
              aria-label="Close"
              @click="handleCancel"
            />
          </div>
          <div class="modal-body">
            <div
              v-if="error"
              class="alert alert-danger alert-sm"
            >
              <i class="bi bi-exclamation-triangle me-2" />
              {{ error }}
            </div>

            <!-- Size Options -->
            <div
              v-if="hasSizeOptions"
              class="customization-group"
            >
              <label class="customization-label">
                Kích thước <span class="text-danger">*</span>
              </label>
              <div class="customization-options">
                <button
                  v-for="size in sizeOptions"
                  :key="size.value"
                  type="button"
                  class="customization-btn"
                  :class="{ 'customization-btn--active': selectedSize === size.value }"
                  @click="selectedSize = size.value"
                >
                  {{ size.label }}
                  <span
                    v-if="size.priceDiff !== 0"
                    class="customization-btn__price"
                  >
                    {{ size.priceDiff > 0 ? '+' : '' }}{{ formatCurrency(size.priceDiff) }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Ice Options -->
            <div
              v-if="hasIceOptions"
              class="customization-group"
            >
              <label class="customization-label">
                Đá <span class="text-danger">*</span>
              </label>
              <div class="customization-options">
                <button
                  v-for="ice in iceOptions"
                  :key="ice.value"
                  type="button"
                  class="customization-btn"
                  :class="{ 'customization-btn--active': selectedIce === ice.value }"
                  @click="selectedIce = ice.value"
                >
                  {{ ice.label }}
                </button>
              </div>
            </div>

            <!-- Sugar Options -->
            <div
              v-if="hasSugarOptions"
              class="customization-group"
            >
              <label class="customization-label">
                Đường <span class="text-danger">*</span>
              </label>
              <div class="customization-options">
                <button
                  v-for="sugar in sugarOptions"
                  :key="sugar.value"
                  type="button"
                  class="customization-btn"
                  :class="{ 'customization-btn--active': selectedSugar === sugar.value }"
                  @click="selectedSugar = sugar.value"
                >
                  {{ sugar.label }}
                </button>
              </div>
            </div>

            <!-- Notes -->
            <div class="customization-group">
              <label
                for="customNotes"
                class="customization-label"
              >
                Ghi chú (tùy chọn)
              </label>
              <textarea
                id="customNotes"
                v-model="notes"
                class="form-control"
                rows="2"
                placeholder="Ví dụ: Ít đá, không đường, không sữa..."
              />
            </div>

            <!-- Price Summary -->
            <div
              v-if="priceAdjustment !== 0"
              class="customization-summary"
            >
              <div class="customization-summary__row">
                <span>Giá gốc:</span>
                <span>{{ formatCurrency(basePrice) }}</span>
              </div>
              <div
                v-if="priceAdjustment > 0"
                class="customization-summary__row"
              >
                <span>Phụ thu:</span>
                <span class="text-success">+{{ formatCurrency(priceAdjustment) }}</span>
              </div>
              <div class="customization-summary__row customization-summary__row--total">
                <span>Tổng:</span>
                <strong>{{ formatCurrency(finalPrice) }}</strong>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="handleCancel"
            >
              Hủy
            </button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!isValid || adding"
              @click="handleConfirm"
            >
              <span
                v-if="adding"
                class="spinner-border spinner-border-sm me-2"
              />
              <i
                v-else
                class="bi bi-check-lg me-2"
              />
              Thêm vào giỏ
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { Modal } from 'bootstrap'
import { formatCurrency } from '@/utils/formatters'

const props = defineProps({
    product: {
        type: Object,
        default: null
    },
    visible: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['close', 'confirm', 'cancel'])

const modalElement = ref(null)
let modalInstance = null

// Options mặc định (có thể lấy từ product.options sau này)
const sizeOptions = [
    { value: 'S', label: 'Nhỏ (S)', priceDiff: 0 },
    { value: 'M', label: 'Vừa (M)', priceDiff: 5000 },
    { value: 'L', label: 'Lớn (L)', priceDiff: 10000 }
]

const iceOptions = [
    { value: 'normal', label: 'Bình thường' },
    { value: 'less', label: 'Ít đá' },
    { value: 'no', label: 'Không đá' },
    { value: 'extra', label: 'Nhiều đá' }
]

const sugarOptions = [
    { value: 'normal', label: 'Bình thường' },
    { value: 'less', label: 'Ít đường' },
    { value: 'no', label: 'Không đường' },
    { value: 'extra', label: 'Nhiều đường' }
]

const selectedSize = ref('M')
const selectedIce = ref('normal')
const selectedSugar = ref('normal')
const notes = ref('')
const error = ref('')
const adding = ref(false)

const basePrice = computed(() => props.product?.price || 0)

const hasSizeOptions = computed(() => {
    // Logic: Nếu product có category là đồ uống thì có size
    const category = props.product?.categoryName?.toLowerCase() || ''
    return category.includes('cà phê') || category.includes('trà') || category.includes('nước') || category.includes('sinh tố')
})

const hasIceOptions = computed(() => {
    const category = props.product?.categoryName?.toLowerCase() || ''
    return category.includes('cà phê') || category.includes('trà') || category.includes('nước') || category.includes('sinh tố') || category.includes('đá xay')
})

const hasSugarOptions = computed(() => {
    const category = props.product?.categoryName?.toLowerCase() || ''
    return category.includes('cà phê') || category.includes('trà') || category.includes('nước') || category.includes('sinh tố')
})

const priceAdjustment = computed(() => {
    if (!hasSizeOptions.value) return 0
    const selected = sizeOptions.find(s => s.value === selectedSize.value)
    return selected?.priceDiff || 0
})

const finalPrice = computed(() => basePrice.value + priceAdjustment.value)

const isValid = computed(() => {
    if (hasSizeOptions.value && !selectedSize.value) return false
    if (hasIceOptions.value && !selectedIce.value) return false
    if (hasSugarOptions.value && !selectedSugar.value) return false
    return true
})

const handleConfirm = () => {
    if (!isValid.value) {
        error.value = 'Vui lòng chọn đầy đủ các tùy chọn bắt buộc'
        return
    }

    adding.value = true
    error.value = ''

    const customization = {
        size: hasSizeOptions.value ? selectedSize.value : null,
        ice: hasIceOptions.value ? selectedIce.value : null,
        sugar: hasSugarOptions.value ? selectedSugar.value : null,
        notes: notes.value.trim() || null,
        priceAdjustment: priceAdjustment.value,
        finalPrice: finalPrice.value
    }

    emit('confirm', {
        product: props.product,
        customization,
        quantity: 1
    })

    // Reset sau khi emit
    setTimeout(() => {
        adding.value = false
        resetForm()
    }, 300)
}

const handleCancel = () => {
    resetForm()
    emit('cancel')
    modalInstance?.hide()
}

const resetForm = () => {
    selectedSize.value = 'M'
    selectedIce.value = 'normal'
    selectedSugar.value = 'normal'
    notes.value = ''
    error.value = ''
}

watch(() => props.visible, (isVisible) => {
    if (isVisible) {
        resetForm()
        modalInstance?.show()
    } else {
        modalInstance?.hide()
    }
})

onMounted(() => {
    if (modalElement.value) {
        modalInstance = new Modal(modalElement.value, {
            backdrop: 'static',
            keyboard: false
        })
    }
})

onBeforeUnmount(() => {
    modalInstance?.dispose()
})
</script>

<style scoped>
.product-customization-modal :global(.modal-dialog) {
    max-width: 500px;
}

.product-customization-modal :global(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
}

.customization-group {
    margin-bottom: var(--spacing-5);
}

.customization-group:last-child {
    margin-bottom: 0;
}

.customization-label {
    display: block;
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-3);
    font-size: var(--font-size-base);
}

.customization-options {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
}

.customization-btn {
    flex: 1;
    min-width: 100px;
    padding: var(--spacing-3) var(--spacing-4);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    color: var(--color-text);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: all var(--transition-base);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-1);
}

.customization-btn:hover {
    border-color: var(--color-primary);
    background: var(--color-card-muted);
}

.customization-btn--active {
    border-color: var(--color-primary);
    background: var(--color-soft-primary);
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
}

.customization-btn__price {
    font-size: var(--font-size-xs);
    color: var(--color-success);
    font-weight: var(--font-weight-semibold);
}

.customization-summary {
    margin-top: var(--spacing-4);
    padding: var(--spacing-4);
    background: var(--color-card-muted);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
}

.customization-summary__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-2);
    font-size: var(--font-size-sm);
}

.customization-summary__row:last-child {
    margin-bottom: 0;
}

.customization-summary__row--total {
    margin-top: var(--spacing-2);
    padding-top: var(--spacing-2);
    border-top: 2px solid var(--color-border);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
}
</style>
