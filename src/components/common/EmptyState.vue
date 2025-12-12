<template>
  <div class="empty-state">
    <div class="empty-state__icon">
      <slot name="icon">
        <i class="bi bi-clipboard-data" />
      </slot>
    </div>
    <div class="empty-state__text">
      <h6>{{ title }}</h6>
      <p>{{ message }}</p>
    </div>
    <div
      v-if="$slots.action"
      class="empty-state__action"
    >
      <slot name="action" />
    </div>
  </div>
</template>

<script setup>
defineProps({
    title: { type: String, default: 'Không có dữ liệu' },
    message: { type: String, default: 'Hãy thử điều chỉnh bộ lọc hoặc tạo mới dữ liệu.' }
})
</script>

<style scoped>
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-3);
    text-align: center;
    padding: var(--spacing-8) var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px dashed var(--color-border);
    background: var(--color-card-muted);
}

.empty-state__icon {
    width: 64px;
    height: 64px;
    border-radius: var(--radius-sm);
    background: var(--color-primary-soft);
    display: grid;
    place-items: center;
    font-size: var(--font-size-3xl);
    color: var(--color-primary);
    margin-bottom: var(--spacing-2);
}

.empty-state__text h6 {
    margin: 0;
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-lg);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.empty-state__text p {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-relaxed);
    max-width: 400px;
    font-family: var(--font-family-sans);
}

.empty-state__action {
    margin-top: var(--spacing-2);
}
</style>
