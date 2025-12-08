<template>
    <div class="forecast-summary">
        <div v-if="!summary" class="text-muted text-center">
            Chưa có dữ liệu
        </div>
        <div v-else class="summary-stats">
            <div class="stat-item">
                <div class="stat-label">Tổng nguyên liệu</div>
                <div class="stat-value">{{ summary.totalIngredients }}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Critical</div>
                <div class="stat-value stat-critical">{{ summary.criticalCount }}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Warning</div>
                <div class="stat-value stat-warning">{{ summary.warningCount }}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Attention</div>
                <div class="stat-value stat-info">{{ summary.attentionCount }}</div>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    summary: {
        type: Object,
        default: null
    }
})
</script>

<style scoped>
.forecast-summary {
    font-family: var(--font-family-sans);
}

.summary-stats {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.stat-item {
    padding: var(--spacing-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
}

.stat-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.stat-value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.stat-critical {
    color: var(--color-danger);
}

.stat-warning {
    color: var(--color-warning);
}

.stat-info {
    color: var(--color-info);
}
</style>

