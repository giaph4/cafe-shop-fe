<template>
  <div class="historical-comparison">
    <span
      v-if="loading"
      class="text-muted small"
    >
      <span class="spinner-border spinner-border-sm me-1" />
      Đang tải...
    </span>
    <span
      v-else-if="comparisonData"
      class="comparison-text"
      :class="getChangeClass(change)"
    >
      <i :class="getChangeIcon(change)" />
      {{ formatChange(change) }}
    </span>
    <span
      v-else
      class="text-muted small"
    >So với {{ getCompareLabel(compareType) }}</span>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRealTimeDashboardStore } from '@/store/realTimeDashboard'

const props = defineProps({
    type: {
        type: String,
        required: true,
        validator: (value) => ['revenue', 'orders'].includes(value)
    },
    compareType: {
        type: String,
        default: 'yesterday'
    }
})

const store = useRealTimeDashboardStore()
const loading = ref(false)
const comparisonData = ref(null)

const change = computed(() => {
    if (!comparisonData.value) return 0
    return props.type === 'revenue'
        ? comparisonData.value.revenue.change
        : comparisonData.value.orders.change
})

const loadComparison = async () => {
    loading.value = true
    try {
        const data = await store.getHistoricalComparison(props.compareType)
        comparisonData.value = data
    } catch (err) {
        console.error('Failed to load comparison', err)
        comparisonData.value = null
    } finally {
        loading.value = false
    }
}

const getChangeClass = (change) => {
    if (change > 0) return 'text-success'
    if (change < 0) return 'text-danger'
    return 'text-muted'
}

const getChangeIcon = (change) => {
    if (change > 0) return 'bi bi-arrow-up'
    if (change < 0) return 'bi bi-arrow-down'
    return 'bi bi-dash'
}

const formatChange = (change) => {
    if (change === 0) return 'Không đổi'
    const sign = change > 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
}

const getCompareLabel = (type) => {
    const labels = {
        'yesterday': 'hôm qua',
        'lastWeek': 'tuần trước'
    }
    return labels[type] || 'trước đó'
}

watch(() => props.compareType, () => {
    loadComparison()
})

onMounted(() => {
    loadComparison()
})
</script>

<style scoped>
.historical-comparison {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-xs);
}

.comparison-text {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-1);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}
</style>

