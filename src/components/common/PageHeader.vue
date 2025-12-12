<template>
  <header class="page-header">
    <div class="page-header__content">
      <div>
        <h2 class="page-header__title">
          {{ title }}
        </h2>
        <p
          v-if="subtitle"
          class="page-header__subtitle mb-0"
        >
          {{ subtitle }}
        </p>
      </div>
      <div
        v-if="$slots.actions"
        class="page-header__actions"
      >
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
    title: {
        type: String,
        required: true
    },
    subtitle: {
        type: String,
        default: ''
    }
})
</script>

<style scoped>
.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    margin-bottom: var(--spacing-4);
}

.page-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    width: 100%;
    flex-wrap: wrap;
}

.page-header__title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-xl);
    font-family: var(--font-family-sans);
}

.page-header__subtitle {
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    margin: 0;
    font-family: var(--font-family-sans);
}

.page-header__actions {
    display: inline-flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: flex-end;
}

@media (max-width: 768px) {
    .page-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .page-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .page-header__actions {
        width: 100%;
        justify-content: flex-start;
    }
}
</style>
