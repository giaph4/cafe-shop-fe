<template>
  <Teleport to="body">
    <div
      class="stock-chart-modal modal fade show"
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
                Lịch sử tồn kho: <strong>{{ ingredient.name }}</strong>
              </h5>
              <p class="modal-subtitle mb-0">
                Theo dõi biến động tồn kho theo thời gian
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
            <div
              v-if="stockHistory && stockHistory.length > 0"
              class="chart-container"
            >
              <StockLevelChart :history="stockHistory" />
            </div>
            <div
              v-else
              class="empty-chart-state"
            >
              <i class="bi bi-graph-up" />
              <p>Chưa có dữ liệu lịch sử</p>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="handleClose"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useInventoryManagementStore } from '@/store/inventoryManagement'
import StockLevelChart from './StockLevelChart.vue'

defineProps({
    ingredient: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['close'])

const store = useInventoryManagementStore()
const stockHistory = computed(() => store.stockHistory)

const handleClose = () => {
    emit('close')
}
</script>

<style scoped>
/* Modal Container - Fixed positioning */
.stock-chart-modal {
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
.stock-chart-modal :global(.modal-backdrop) {
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
.stock-chart-modal :global(.modal-dialog) {
    position: relative;
    z-index: 1056;
    margin: var(--spacing-4) auto;
    pointer-events: none;
}

.stock-chart-modal :global(.modal-content) {
    pointer-events: auto;
    border-radius: var(--component-radius-lg);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-modal);
    background: var(--color-card);
}

.stock-chart-modal :global(.modal-header) {
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

.stock-chart-modal :global(.modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
    line-height: var(--line-height-tight);
}

.stock-chart-modal :global(.modal-title strong) {
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

.stock-chart-modal :global(.modal-body) {
    padding: var(--spacing-6);
    color: var(--color-text);
    font-size: var(--font-size-base);
    line-height: var(--line-height-relaxed);
    background: var(--color-card);
}

.stock-chart-modal :global(.modal-footer) {
    padding: var(--spacing-4) var(--spacing-6);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--spacing-2);
}

/* Button Styles - Đồng bộ */
.stock-chart-modal :global(.btn-outline-secondary) {
    border: 1px solid var(--color-border);
    color: var(--color-heading);
    background: transparent;
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    padding: var(--spacing-2) var(--spacing-4);
    transition: all var(--transition-base);
}

.stock-chart-modal :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.chart-container {
    min-height: 300px;
}

.empty-chart-state {
    text-align: center;
    padding: var(--spacing-8);
    color: var(--color-text-muted);
}

.empty-chart-state i {
    font-size: 3rem;
    color: var(--color-text-subtle);
    margin-bottom: var(--spacing-3);
    display: block;
}

.empty-chart-state p {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    margin: 0;
}
</style>

