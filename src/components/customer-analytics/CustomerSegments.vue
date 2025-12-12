<template>
  <div class="customer-segments">
    <div class="segments-grid">
      <div
        v-for="(segment, key) in segments"
        :key="key"
        class="segment-card"
        :class="getSegmentClass(key)"
      >
        <div class="segment-icon">
          <i :class="getSegmentIcon(key)" />
        </div>
        <div class="segment-content">
          <div class="segment-label">
            {{ getSegmentLabel(key) }}
          </div>
          <div class="segment-value">
            {{ segment?.length || 0 }}
          </div>
          <div class="segment-percentage">
            {{ getPercentage(segment?.length || 0) }}%
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    segments: {
        type: Object,
        required: true
    }
})

const totalCustomers = computed(() => Object.values(props.segments).reduce((sum, arr) => sum + (arr?.length || 0), 0))

const getPercentage = (count) => {
    if (totalCustomers.value === 0) return 0
    return ((count / totalCustomers.value) * 100).toFixed(1)
}

const getSegmentClass = (key) => {
    const classes = {
        'VIP': 'segment-vip',
        'Regular': 'segment-regular',
        'Occasional': 'segment-occasional',
        'At-risk': 'segment-atrisk',
        'New': 'segment-new'
    }
    return classes[key] || ''
}

const getSegmentIcon = (key) => {
    const icons = {
        'VIP': 'bi bi-star-fill',
        'Regular': 'bi bi-person-check-fill',
        'Occasional': 'bi bi-person',
        'At-risk': 'bi bi-exclamation-triangle-fill',
        'New': 'bi bi-person-plus-fill'
    }
    return icons[key] || 'bi bi-person'
}

const getSegmentLabel = (key) => {
    const labels = {
        'VIP': 'VIP',
        'Regular': 'Thường xuyên',
        'Occasional': 'Thỉnh thoảng',
        'At-risk': 'Có nguy cơ',
        'New': 'Mới'
    }
    return labels[key] || key
}
</script>

<style scoped>
.customer-segments {
    font-family: var(--font-family-sans);
}

.segments-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--spacing-3);
}

.segment-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    padding: var(--spacing-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    transition: all var(--transition-base);
}

.segment-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
}

.segment-vip {
    border-color: var(--color-warning);
    background: var(--color-soft-amber);
}

.segment-regular {
    border-color: var(--color-info);
    background: var(--color-soft-sky);
}

.segment-occasional {
    border-color: var(--color-text-muted);
    background: var(--color-card-muted);
}

.segment-atrisk {
    border-color: var(--color-danger);
    background: var(--color-soft-rose);
}

.segment-new {
    border-color: var(--color-primary);
    background: var(--color-soft-primary);
}

.segment-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.5);
}

.segment-vip .segment-icon {
    color: var(--color-warning);
}

.segment-regular .segment-icon {
    color: var(--color-info);
}

.segment-occasional .segment-icon {
    color: var(--color-text-muted);
}

.segment-atrisk .segment-icon {
    color: var(--color-danger);
}

.segment-new .segment-icon {
    color: var(--color-primary);
}

.segment-content {
    flex: 1;
    min-width: 0;
}

.segment-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-medium);
}

.segment-value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    margin-bottom: var(--spacing-1);
}

.segment-percentage {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

@media (max-width: 768px) {
    .segments-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>

