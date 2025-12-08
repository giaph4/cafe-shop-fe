<template>
    <div class="top-categories-table">
        <div v-if="categories.length === 0" class="text-muted text-center">
            Không có dữ liệu
        </div>
        <div v-else class="table-responsive">
            <table class="table table-minimal">
                <thead>
                    <tr>
                        <th>Danh mục</th>
                        <th>Số lượng</th>
                        <th>Tổng chi phí</th>
                        <th>Tỷ lệ</th>
                        <th>Xu hướng</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="(category, index) in categories"
                        :key="category.category"
                    >
                        <td>
                            <div class="d-flex align-items-center gap-2">
                                <div class="category-color" :style="{ backgroundColor: getCategoryColor(index) }"></div>
                                <span class="fw-semibold">{{ category.categoryLabel }}</span>
                            </div>
                        </td>
                        <td>{{ formatNumber(category.count) }}</td>
                        <td class="cost-cell">{{ formatCurrency(category.amount) }}</td>
                        <td>
                            <div class="ratio-display">
                                <div class="ratio-bar">
                                    <div
                                        class="ratio-fill"
                                        :style="{
                                            width: `${getRatio(category.amount)}%`,
                                            backgroundColor: getCategoryColor(index)
                                        }"
                                    ></div>
                                </div>
                                <span class="ratio-text">{{ getRatio(category.amount).toFixed(1) }}%</span>
                            </div>
                        </td>
                        <td>
                            <span class="trend-badge" :class="getTrendClass(category)">
                                <i :class="getTrendIcon(category)"></i>
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { formatCurrency, formatNumber } from '@/utils/formatters'

const props = defineProps({
    categories: {
        type: Array,
        required: true,
        default: () => []
    },
    totalCost: {
        type: Number,
        default: 0
    }
})

const getCategoryColor = (index) => {
    const colors = [
        'var(--color-primary)',
        'var(--color-success)',
        'var(--color-info)',
        'var(--color-warning)',
        'var(--color-danger)'
    ]
    return colors[index % colors.length]
}

const getRatio = (amount) => {
    if (props.totalCost === 0) return 0
    return (amount / props.totalCost) * 100
}

const getTrendClass = (category) => {
    const ratio = getRatio(category.amount)
    if (ratio > 40) return 'trend-high'
    if (ratio > 20) return 'trend-medium'
    return 'trend-low'
}

const getTrendIcon = (category) => {
    const ratio = getRatio(category.amount)
    if (ratio > 40) return 'bi bi-arrow-up-circle-fill'
    if (ratio > 20) return 'bi bi-dash-circle-fill'
    return 'bi bi-arrow-down-circle-fill'
}
</script>

<style scoped>
.top-categories-table {
    font-family: var(--font-family-sans);
}

.category-color {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
}

.cost-cell {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.ratio-display {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
}

.ratio-bar {
    flex: 1;
    height: 8px;
    background: var(--color-border);
    border-radius: var(--radius-sm);
    overflow: hidden;
}

.ratio-fill {
    height: 100%;
    transition: width var(--transition-base);
}

.ratio-text {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
    min-width: 50px;
    text-align: right;
}

.trend-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-size: 14px;
}

.trend-high {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.trend-medium {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.trend-low {
    background: var(--color-soft-sky);
    color: var(--color-info);
}
</style>

