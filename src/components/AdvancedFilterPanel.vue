<template>
  <div class="advanced-filter-panel">
    <div class="advanced-filter-panel__header">
      <h3 class="advanced-filter-panel__title">
        <i class="bi bi-funnel me-2" />
        Bộ lọc nâng cao
      </h3>
      <button
        class="advanced-filter-panel__close"
        type="button"
        @click="$emit('close')"
      >
        <i class="bi bi-x-lg" />
      </button>
    </div>

    <div class="advanced-filter-panel__body">
      <slot name="filters">
        <!-- Filters sẽ được inject từ parent -->
      </slot>
    </div>

    <div class="advanced-filter-panel__footer">
      <div class="advanced-filter-panel__actions">
        <button
          class="btn btn-outline-secondary"
          type="button"
          @click="clearFilters"
        >
          <i class="bi bi-x-circle me-2" />
          Xóa bộ lọc
        </button>
        <button
          class="btn btn-outline-primary"
          type="button"
          @click="savePreset"
        >
          <i class="bi bi-bookmark me-2" />
          Lưu bộ lọc
        </button>
        <button
          class="btn btn-primary"
          type="button"
          @click="applyFilters"
        >
          <i class="bi bi-check-lg me-2" />
          Áp dụng
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
    pageName: {
        type: String,
        required: true
    }
})

const emit = defineEmits(['close', 'apply', 'clear', 'save-preset'])

const applyFilters = () => {
    emit('apply')
}

const clearFilters = () => {
    emit('clear')
}

const savePreset = () => {
    emit('save-preset')
}
</script>

<style scoped>
.advanced-filter-panel {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    display: flex;
    flex-direction: column;
    max-height: 80vh;
    overflow: hidden;
}

.advanced-filter-panel__header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--color-card-muted);
}

.advanced-filter-panel__title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-heading);
    display: flex;
    align-items: center;
}

.advanced-filter-panel__close {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.advanced-filter-panel__close:hover {
    background: var(--color-card);
    color: var(--color-heading);
}

.advanced-filter-panel__body {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
}

.advanced-filter-panel__footer {
    padding: 16px 20px;
    border-top: 1px solid var(--color-border);
    background: var(--color-card-muted);
}

.advanced-filter-panel__actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}
</style>

