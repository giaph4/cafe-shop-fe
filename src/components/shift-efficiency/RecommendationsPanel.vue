<template>
  <div class="recommendations-panel">
    <div
      v-if="recommendations.length === 0"
      class="text-muted text-center"
    >
      Không có đề xuất nào
    </div>
    <div
      v-else
      class="recommendations-list"
    >
      <div
        v-for="(rec, index) in recommendations"
        :key="index"
        class="recommendation-item"
        :class="getPriorityClass(rec.priority)"
      >
        <div class="recommendation-icon">
          <i :class="getPriorityIcon(rec.priority)" />
        </div>
        <div class="recommendation-content">
          <div class="recommendation-message">
            {{ rec.message }}
          </div>
          <div class="recommendation-impact">
            {{ rec.impact }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
    recommendations: {
        type: Array,
        required: true,
        default: () => []
    }
})

const getPriorityClass = (priority) => {
    const classes = {
        'high': 'priority-high',
        'medium': 'priority-medium',
        'low': 'priority-low'
    }
    return classes[priority] || 'priority-medium'
}

const getPriorityIcon = (priority) => {
    const icons = {
        'high': 'bi bi-exclamation-triangle-fill',
        'medium': 'bi bi-info-circle-fill',
        'low': 'bi bi-check-circle-fill'
    }
    return icons[priority] || 'bi bi-info-circle-fill'
}
</script>

<style scoped>
.recommendations-panel {
    font-family: var(--font-family-sans);
}

.recommendations-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.recommendation-item {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-3);
    padding: var(--spacing-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    transition: all var(--transition-base);
}

.recommendation-item:hover {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
}

.priority-high {
    border-left: 3px solid var(--color-danger);
}

.priority-medium {
    border-left: 3px solid var(--color-warning);
}

.priority-low {
    border-left: 3px solid var(--color-info);
}

.recommendation-icon {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
}

.priority-high .recommendation-icon {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.priority-medium .recommendation-icon {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.priority-low .recommendation-icon {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.recommendation-content {
    flex: 1;
    min-width: 0;
}

.recommendation-message {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.recommendation-impact {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}
</style>

