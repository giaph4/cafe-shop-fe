<template>
    <div class="low-stock-list">
        <div v-if="items.length === 0" class="text-muted text-center">
            Không có nguyên liệu sắp hết
        </div>
        <div v-else class="table-responsive">
            <table class="table table-minimal">
                <thead>
                    <tr>
                        <th>Nguyên liệu</th>
                        <th>Tồn kho</th>
                        <th>Tối thiểu</th>
                        <th>Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="item in items"
                        :key="item.id || item.ingredientId"
                    >
                        <td>
                            <div class="fw-semibold ingredient-name">{{ item.name || item.ingredientName || 'Unknown' }}</div>
                            <small class="text-muted">{{ item.unit || 'kg' }}</small>
                        </td>
                        <td>{{ formatNumber(item.stockLevel || 0, 2) }}</td>
                        <td>{{ formatNumber(item.minStockLevel || 0, 2) }}</td>
                        <td>
                            <span class="stock-badge" :class="getStockClass(item)">
                                {{ getStockLabel(item) }}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { formatNumber } from '@/utils/formatters'

defineProps({
    items: {
        type: Array,
        default: () => []
    }
})

const getStockClass = (item) => {
    const ratio = item.minStockLevel > 0 ? (item.stockLevel / item.minStockLevel) : 0
    if (ratio < 0.2) return 'stock-critical'
    if (ratio < 0.5) return 'stock-warning'
    return 'stock-low'
}

const getStockLabel = (item) => {
    const ratio = item.minStockLevel > 0 ? (item.stockLevel / item.minStockLevel) : 0
    if (ratio < 0.2) return 'Nguy cấp'
    if (ratio < 0.5) return 'Cảnh báo'
    return 'Sắp hết'
}
</script>

<style scoped>
.low-stock-list {
    font-family: var(--font-family-sans);
}

.ingredient-name {
    font-family: var(--font-family-sans);
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
}

.stock-badge {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    display: inline-block;
}

.stock-critical {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.stock-warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.stock-low {
    background: var(--color-soft-sky);
    color: var(--color-info);
}
</style>

