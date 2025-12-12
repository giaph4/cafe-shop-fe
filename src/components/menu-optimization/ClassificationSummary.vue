<template>
  <div class="classification-summary">
    <div
      v-if="!classifications"
      class="text-muted text-center"
    >
      Chưa có dữ liệu
    </div>
    <div
      v-else
      class="classification-grid"
    >
      <div
        v-for="cls in classificationList"
        :key="cls.type"
        class="classification-card"
        :class="`classification-${cls.type.toLowerCase()}`"
      >
        <div class="classification-header">
          <div class="classification-icon">
            <i :class="cls.icon" />
          </div>
          <div class="classification-info">
            <div class="classification-label">
              {{ cls.label }}
            </div>
            <div class="classification-count">
              {{ cls.count }} sản phẩm
            </div>
          </div>
        </div>
        <div class="classification-metrics">
          <div class="metric-item">
            <span class="metric-label">Doanh thu:</span>
            <span class="metric-value">{{ formatCurrency(cls.revenue) }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Lợi nhuận:</span>
            <span class="metric-value">{{ formatCurrency(cls.profit) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatCurrency } from '@/utils/formatters'

const props = defineProps({
    classifications: {
        type: Object,
        default: null
    }
})

const classificationList = computed(() => {
    if (!props.classifications) return []

    return [
        {
            type: 'STAR',
            label: 'Ngôi sao',
            icon: 'bi bi-star-fill',
            products: props.classifications.stars || [],
            count: (props.classifications.stars || []).length,
            revenue: (props.classifications.stars || []).reduce((sum, p) => sum + p.revenue, 0),
            profit: (props.classifications.stars || []).reduce((sum, p) => sum + p.profit, 0)
        },
        {
            type: 'CASH_COW',
            label: 'Bò sữa',
            icon: 'bi bi-cash-coin',
            products: props.classifications.cashCows || [],
            count: (props.classifications.cashCows || []).length,
            revenue: (props.classifications.cashCows || []).reduce((sum, p) => sum + p.revenue, 0),
            profit: (props.classifications.cashCows || []).reduce((sum, p) => sum + p.profit, 0)
        },
        {
            type: 'QUESTION_MARK',
            label: 'Dấu hỏi',
            icon: 'bi bi-question-circle-fill',
            products: props.classifications.questionMarks || [],
            count: (props.classifications.questionMarks || []).length,
            revenue: (props.classifications.questionMarks || []).reduce((sum, p) => sum + p.revenue, 0),
            profit: (props.classifications.questionMarks || []).reduce((sum, p) => sum + p.profit, 0)
        },
        {
            type: 'DOG',
            label: 'Chó',
            icon: 'bi bi-x-circle-fill',
            products: props.classifications.dogs || [],
            count: (props.classifications.dogs || []).length,
            revenue: (props.classifications.dogs || []).reduce((sum, p) => sum + p.revenue, 0),
            profit: (props.classifications.dogs || []).reduce((sum, p) => sum + p.profit, 0)
        }
    ]
})
</script>

<style scoped>
.classification-summary {
    font-family: var(--font-family-sans);
}

.classification-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-3);
}

.classification-card {
    padding: var(--spacing-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    transition: all var(--transition-base);
}

.classification-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
}

.classification-star {
    border-left: 3px solid var(--color-success);
}

.classification-cash_cow {
    border-left: 3px solid var(--color-info);
}

.classification-question_mark {
    border-left: 3px solid var(--color-warning);
}

.classification-dog {
    border-left: 3px solid var(--color-danger);
}

.classification-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    margin-bottom: var(--spacing-3);
}

.classification-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    flex-shrink: 0;
}

.classification-star .classification-icon {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.classification-cash_cow .classification-icon {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.classification-question_mark .classification-icon {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.classification-dog .classification-icon {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.classification-info {
    flex: 1;
    min-width: 0;
}

.classification-label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    margin-bottom: var(--spacing-1);
}

.classification-count {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.classification-metrics {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    padding-top: var(--spacing-2);
    border-top: 1px solid var(--color-border);
}

.metric-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: var(--font-family-sans);
}

.metric-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
}

.metric-value {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
}

@media (max-width: 768px) {
    .classification-grid {
        grid-template-columns: 1fr;
    }
}
</style>

