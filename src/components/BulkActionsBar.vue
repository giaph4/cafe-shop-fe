<template>
  <Transition name="slide-up">
    <div
      v-if="hasSelection"
      class="bulk-actions-bar"
    >
      <div class="bulk-actions-bar__content">
        <div class="bulk-actions-bar__info">
          <i class="bi bi-check-square" />
          <span class="bulk-actions-bar__count">
            Đã chọn <strong>{{ selectedCount }}</strong> {{ itemLabel }}
          </span>
          <button
            class="bulk-actions-bar__clear"
            type="button"
            @click="handleClear"
          >
            <i class="bi bi-x" />
            Bỏ chọn
          </button>
        </div>

        <div class="bulk-actions-bar__actions">
          <button
            v-for="action in availableActions"
            :key="action.id"
            class="bulk-actions-bar__action"
            :class="{
              'bulk-actions-bar__action--danger': action.danger,
              'bulk-actions-bar__action--disabled': isProcessing
            }"
            type="button"
            :disabled="isProcessing || (action.disabled && action.disabled(selectedCount))"
            @click="handleAction(action)"
          >
            <i :class="action.icon" />
            <span>{{ action.label }}</span>
          </button>
        </div>
      </div>

      <!-- Progress Bar -->
      <div
        v-if="isProcessing"
        class="bulk-actions-bar__progress"
      >
        <div
          class="bulk-actions-bar__progress-bar"
          :style="{ width: `${progressPercentage}%` }"
        />
      </div>
    </div>
  </Transition>

  <!-- Confirmation Modal -->
  <Teleport to="body">
    <div
      v-if="showConfirmModal"
      class="modal fade show"
      style="display: block;"
      tabindex="-1"
      @click.self="showConfirmModal = false"
    >
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ confirmAction?.label }}
            </h5>
            <button
              type="button"
              class="btn-close"
              aria-label="Đóng"
              @click="showConfirmModal = false"
            />
          </div>
          <div class="modal-body">
            <p>{{ confirmAction?.confirmMessage || `Bạn có chắc chắn muốn ${confirmAction?.label.toLowerCase()} ${selectedCount} ${itemLabel}?` }}</p>
            <div
              v-if="confirmAction?.showPreview"
              class="bulk-actions-bar__modal-preview"
            >
              <strong>Preview:</strong>
              <div class="bulk-actions-bar__modal-preview-content">
                {{ previewText }}
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              class="btn btn-outline-secondary"
              type="button"
              @click="showConfirmModal = false"
            >
              Hủy
            </button>
            <button
              class="btn"
              :class="confirmAction?.danger ? 'btn-danger' : 'btn-primary'"
              type="button"
              :disabled="isProcessing"
              @click="confirmExecute"
            >
              <i class="bi bi-check-lg me-2" />
              Xác nhận
            </button>
          </div>
        </div>
      </div>
      <div
        class="modal-backdrop fade show"
        @click="showConfirmModal = false"
      />
    </div>
  </Teleport>

  <!-- Results Summary -->
  <div
    v-if="showResults"
    class="bulk-actions-bar__results"
  >
    <div class="bulk-actions-bar__results-content">
      <i
        class="bi"
        :class="results.success > 0 ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'"
      />
      <div class="bulk-actions-bar__results-text">
        <strong>{{ results.success }}</strong> thành công,
        <strong>{{ results.failed }}</strong> thất bại
      </div>
      <button
        class="bulk-actions-bar__results-close"
        type="button"
        @click="showResults = false"
      >
        <i class="bi bi-x" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
    selectedCount: {
        type: Number,
        required: true
    },
    hasSelection: {
        type: Boolean,
        required: true
    },
    isProcessing: {
        type: Boolean,
        default: false
    },
    progressPercentage: {
        type: Number,
        default: 0
    },
    actions: {
        type: Array,
        default: () => []
    },
    itemLabel: {
        type: String,
        default: 'mục'
    }
})

const emit = defineEmits(['action', 'clear'])

const showConfirmModal = ref(false)
const confirmAction = ref(null)
const showResults = ref(false)
const results = ref({ success: 0, failed: 0 })
const previewText = ref('')

const availableActions = computed(() => props.actions.filter(action => {
    if (action.condition) {
        return action.condition(props.selectedCount)
    }
    return true
}))

const handleClear = () => {
    emit('clear')
}

const handleAction = (action) => {
    if (action.confirm !== false && action.confirm !== undefined) {
        confirmAction.value = action
        previewText.value = action.preview ? action.preview(props.selectedCount) : ''
        showConfirmModal.value = true
    } else {
        emit('action', action)
    }
}

const confirmExecute = () => {
    showConfirmModal.value = false
    const action = confirmAction.value
    confirmAction.value = null
    emit('action', action)
}

watch(() => props.isProcessing, (processing) => {
    if (!processing && results.value.success + results.value.failed > 0) {
        showResults.value = true
        setTimeout(() => {
            showResults.value = false
        }, 5000)
    }
})

// Expose method to show results
defineExpose({
    showResults: (resultData) => {
        results.value = resultData
        showResults.value = true
        setTimeout(() => {
            showResults.value = false
        }, 5000)
    }
})
</script>

<style scoped>
.bulk-actions-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--color-card);
    border-top: 1px solid var(--color-border);
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    padding: 0;
}

.bulk-actions-bar__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    gap: 20px;
}

.bulk-actions-bar__info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
}

.bulk-actions-bar__info i {
    color: var(--color-primary);
    font-size: 1.2rem;
}

.bulk-actions-bar__count {
    font-size: 0.95rem;
    color: var(--color-heading);
}

.bulk-actions-bar__count strong {
    font-weight: 600;
    color: var(--color-primary);
}

.bulk-actions-bar__clear {
    padding: 6px 12px;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-muted);
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
}

.bulk-actions-bar__clear:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.bulk-actions-bar__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.bulk-actions-bar__action {
    padding: 8px 16px;
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    border-radius: 8px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
}

.bulk-actions-bar__action:hover:not(:disabled) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
}

.bulk-actions-bar__action--danger:hover:not(:disabled) {
    background: #ef4444;
    border-color: #ef4444;
    color: white;
}

.bulk-actions-bar__action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.bulk-actions-bar__progress {
    height: 4px;
    background: var(--color-card-muted);
    overflow: hidden;
}

.bulk-actions-bar__progress-bar {
    height: 100%;
    background: var(--color-primary);
    transition: width 0.3s ease;
}

/* Modal Preview */
.bulk-actions-bar__modal-preview {
    margin-top: 16px;
    padding: 12px;
    background: var(--color-card-muted);
    border-radius: 8px;
}

.bulk-actions-bar__modal-preview strong {
    display: block;
    margin-bottom: 8px;
    color: var(--color-heading);
}

.bulk-actions-bar__modal-preview-content {
    font-size: 0.9rem;
    color: var(--color-text-muted);
}

/* Results */
.bulk-actions-bar__results {
    position: fixed;
    top: 80px;
    right: 20px;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    z-index: 1500;
    padding: 16px 20px;
    min-width: 300px;
}

.bulk-actions-bar__results-content {
    display: flex;
    align-items: center;
    gap: 12px;
}

.bulk-actions-bar__results-text {
    flex: 1;
    font-size: 0.9rem;
    color: var(--color-heading);
}

.bulk-actions-bar__results-close {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.bulk-actions-bar__results-close:hover {
    background: var(--color-card-muted);
    color: var(--color-heading);
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
    transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
    transform: translateY(100%);
    opacity: 0;
}

@media (max-width: 768px) {
    .bulk-actions-bar__content {
        flex-direction: column;
        align-items: stretch;
    }

    .bulk-actions-bar__actions {
        justify-content: center;
    }

    .bulk-actions-bar__action {
        flex: 1;
        justify-content: center;
    }
}
</style>

