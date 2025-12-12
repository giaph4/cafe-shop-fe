<template>
  <Teleport to="body">
    <div
      class="pricing-suggestion-modal modal fade show"
      tabindex="-1"
      style="display: block; z-index: 1055;"
      @click.self="handleClose"
    >
      <div
        class="modal-backdrop fade show"
        style="z-index: 1050;"
        @click="handleClose"
      />
      <div
        class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
        style="z-index: 1056;"
      >
        <div
          class="modal-content"
          @click.stop
        >
          <div class="modal-header">
            <div class="modal-header__content">
              <h5 class="modal-title">
                Đề xuất Giá: <strong>{{ product.name }}</strong>
              </h5>
              <p class="modal-subtitle mb-0">
                Phân tích và đề xuất giá mới để cải thiện margin
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
            <LoadingState
              v-if="loading"
              text="Đang tính toán đề xuất..."
            />
            <div v-else-if="suggestion">
              <div class="row g-4 mb-4">
                <div class="col-md-6">
                  <div class="info-section">
                    <h6 class="section-title mb-3">
                      Giá hiện tại
                    </h6>
                    <div class="price-display price-current">
                      <div class="price-value">
                        {{ formatCurrency(suggestion.currentPrice) }}
                      </div>
                      <div class="price-margin">
                        Margin: {{ suggestion.currentMargin.toFixed(1) }}%
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="info-section">
                    <h6 class="section-title mb-3">
                      Đề xuất giá
                    </h6>
                    <div class="price-display price-suggested">
                      <div class="price-value">
                        {{ formatCurrency(suggestion.suggestedPrice) }}
                      </div>
                      <div class="price-margin">
                        Margin: {{ suggestion.targetMargin.toFixed(1) }}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="info-section">
                <h6 class="section-title mb-3">
                  Phân tích tác động
                </h6>
                <div class="impact-grid">
                  <div class="impact-item">
                    <div class="impact-label">
                      Thay đổi giá
                    </div>
                    <div
                      class="impact-value"
                      :class="getImpactClass(suggestion.impact.priceChange)"
                    >
                      {{ suggestion.impact.priceChange >= 0 ? '+' : '' }}{{ formatCurrency(suggestion.impact.priceChange) }}
                    </div>
                    <div class="impact-percent">
                      ({{ suggestion.impact.priceChangePercent >= 0 ? '+' : '' }}{{ suggestion.impact.priceChangePercent.toFixed(1) }}%)
                    </div>
                  </div>
                  <div class="impact-item">
                    <div class="impact-label">
                      Thay đổi margin
                    </div>
                    <div
                      class="impact-value"
                      :class="getImpactClass(suggestion.impact.marginChange)"
                    >
                      {{ suggestion.impact.marginChange >= 0 ? '+' : '' }}{{ suggestion.impact.marginChange.toFixed(1) }}%
                    </div>
                  </div>
                  <div class="impact-item">
                    <div class="impact-label">
                      Tăng lợi nhuận
                    </div>
                    <div class="impact-value impact-positive">
                      +{{ formatCurrency(suggestion.impact.profitIncrease) }}
                    </div>
                    <div class="impact-percent">
                      ({{ suggestion.impact.profitIncreasePercent >= 0 ? '+' : '' }}{{ suggestion.impact.profitIncreasePercent.toFixed(1) }}%)
                    </div>
                  </div>
                </div>
              </div>
              <div class="info-section">
                <h6 class="section-title mb-3">
                  Chi phí đơn vị
                </h6>
                <div class="cost-display">
                  {{ formatCurrency(suggestion.costPerUnit) }}
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-flat btn-flat--outline"
              @click="handleClose"
            >
              Đóng
            </button>
            <button
              v-if="suggestion"
              type="button"
              class="btn btn-flat btn-flat--primary"
              :disabled="applying"
              @click="handleApply"
            >
              <span
                v-if="applying"
                class="spinner-border spinner-border-sm me-2"
              />
              <i
                v-else
                class="bi bi-check me-2"
              />
              Áp dụng đề xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useProductProfitabilityStore } from '@/store/productProfitability'
import LoadingState from '@/components/common/LoadingState.vue'
import { formatCurrency } from '@/utils/formatters'

const props = defineProps({
    product: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['close'])

const store = useProductProfitabilityStore()
const loading = ref(false)
const applying = ref(false)
const suggestion = ref(null)

const loadSuggestion = async () => {
    loading.value = true
    try {
        const data = await store.getPricingSuggestion({
            productId: props.product.productId,
            currentPrice: props.product.price,
            currentMargin: props.product.margin,
            targetMargin: 30
        })
        suggestion.value = data
    } catch (err) {
        console.error('Failed to load suggestion', err)
    } finally {
        loading.value = false
    }
}

const handleClose = () => {
    emit('close')
}

const handleApply = async () => {
    applying.value = true
    try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        alert('Đã áp dụng đề xuất giá! (Tính năng demo - cần tích hợp với API cập nhật giá)')
        handleClose()
    } catch (err) {
        console.error('Failed to apply', err)
        alert('Không thể áp dụng đề xuất. Vui lòng thử lại.')
    } finally {
        applying.value = false
    }
}

const getImpactClass = (value) => {
    if (value > 0) return 'impact-positive'
    if (value < 0) return 'impact-negative'
    return ''
}

onMounted(() => {
    loadSuggestion()
})
</script>

<style scoped>
.pricing-suggestion-modal {
    font-family: var(--font-family-sans);
}

.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    pointer-events: auto;
}

:global(.modal-content) {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-card);
    box-shadow: var(--shadow-lg);
}

:global(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4) var(--spacing-5);
    background: var(--color-card);
}

.modal-header__content {
    flex: 1;
}

:global(.modal-title) {
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    margin: 0;
}

.modal-subtitle {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
}

:global(.modal-body) {
    padding: var(--spacing-5);
    font-family: var(--font-family-sans);
}

:global(.modal-footer) {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-4) var(--spacing-5);
    background: var(--color-card);
}

.info-section {
    padding: var(--spacing-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
}

.section-title {
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-base);
}

.price-display {
    text-align: center;
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
}

.price-current {
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
}

.price-suggested {
    background: var(--color-soft-emerald);
    border: 1px solid var(--color-success);
}

.price-value {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    margin-bottom: var(--spacing-2);
}

.price-margin {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.impact-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-3);
}

.impact-item {
    text-align: center;
    padding: var(--spacing-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
}

.impact-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.impact-value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    margin-bottom: var(--spacing-1);
}

.impact-positive {
    color: var(--color-success);
}

.impact-negative {
    color: var(--color-danger);
}

.impact-percent {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.cost-display {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-danger);
    font-family: var(--font-family-sans);
    text-align: center;
    padding: var(--spacing-3);
    background: var(--color-card-muted);
    border-radius: var(--radius-sm);
}

@media (max-width: 768px) {
    .impact-grid {
        grid-template-columns: 1fr;
    }
}
</style>

