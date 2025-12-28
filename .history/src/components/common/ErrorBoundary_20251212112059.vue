<template>
  <slot v-if="!error" />
  <div
    v-else
    class="error-boundary"
  >
    <div class="error-boundary__content">
      <div class="error-boundary__icon">
        <i class="bi bi-exclamation-triangle-fill" />
      </div>
      <h4 class="error-boundary__title">
        Đã xảy ra lỗi
      </h4>
      <p class="error-boundary__message">
        {{ errorMessage }}
      </p>
      <div class="error-boundary__actions">
        <button
          class="btn btn-primary"
          @click="reset"
        >
          <i class="bi bi-arrow-clockwise me-2" />
          Thử lại
        </button>
        <button
          class="btn btn-outline-secondary"
          @click="reload"
        >
          <i class="bi bi-arrow-repeat me-2" />
          Tải lại trang
        </button>
      </div>
      <details
        v-if="showDetails && error"
        class="error-boundary__details"
      >
        <summary>Chi tiết lỗi (dành cho developer)</summary>
        <pre>{{ error.stack || error.message }}</pre>
      </details>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onErrorCaptured } from 'vue'
import logger from '@/utils/logger'

defineProps({
    showDetails: {
        type: Boolean,
        default: import.meta.env.DEV
    }
})

const error = ref(null)

const errorMessage = computed(() => {
    if (!error.value) {
        return ''
    }
    return error.value.message || 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.'
})

// Bắt lỗi từ các component con
onErrorCaptured((err, instance, info) => {
    logger.error('[ErrorBoundary] Bắt được lỗi:', {
        error: err,
        component: instance?.$options?.name || 'Unknown',
        info
    })
    error.value = err
    // Trả về false để ngăn lỗi lan truyền lên component cha
    return false
})

// Reset state để thử lại
const reset = () => {
    error.value = null
}

// Tải lại trang
const reload = () => {
    window.location.reload()
}
</script>

<style scoped>
.error-boundary {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    padding: var(--spacing-6);
}

.error-boundary__content {
    text-align: center;
    max-width: 500px;
}

.error-boundary__icon {
    font-size: 48px;
    color: var(--color-danger);
    margin-bottom: var(--spacing-4);
}

.error-boundary__title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
}

.error-boundary__message {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-4);
}

.error-boundary__actions {
    display: flex;
    gap: var(--spacing-3);
    justify-content: center;
    flex-wrap: wrap;
}

.error-boundary__actions .btn {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
}

.error-boundary__details {
    margin-top: var(--spacing-4);
    text-align: left;
    background: var(--color-card-muted);
    border-radius: var(--radius-sm);
    padding: var(--spacing-3);
}

.error-boundary__details summary {
    cursor: pointer;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-2);
}

.error-boundary__details pre {
    font-size: var(--font-size-sm);
    color: var(--color-danger);
    white-space: pre-wrap;
    word-break: break-all;
    margin: 0;
    padding: var(--spacing-2);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    max-height: 200px;
    overflow-y: auto;
}
</style>
