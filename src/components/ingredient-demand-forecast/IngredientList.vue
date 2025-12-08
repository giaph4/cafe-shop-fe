<template>
    <div class="ingredient-list">
        <div v-if="ingredients.length === 0" class="empty-list">
            <EmptyState
                title="Không có dữ liệu"
                message="Không tìm thấy nguyên liệu nào phù hợp với bộ lọc"
            />
        </div>
        <div v-else class="table-responsive">
            <table class="table table-minimal">
                <thead>
                    <tr>
                        <th>Nguyên liệu</th>
                        <th>Tồn kho</th>
                        <th>Tiêu thụ TB/ngày</th>
                        <th>Dự báo 7 ngày</th>
                        <th>Dự báo 30 ngày</th>
                        <th>Số ngày còn lại</th>
                        <th>Trạng thái</th>
                        <th>Đề xuất đặt</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="ingredient in ingredients"
                        :key="ingredient.ingredientId"
                        :class="getRowClass(ingredient.status)"
                        @click="handleSelect(ingredient)"
                        style="cursor: pointer;"
                    >
                        <td>
                            <div>
                                <div class="fw-semibold ingredient-name">{{ ingredient.name }}</div>
                                <small class="text-muted">{{ ingredient.unit }}</small>
                            </div>
                        </td>
                        <td>
                            <span class="stock-value">{{ formatNumber(ingredient.currentStock) }}</span>
                            <small class="text-muted d-block">Mức đặt: {{ formatNumber(ingredient.reorderLevel) }}</small>
                        </td>
                        <td>{{ formatNumber(ingredient.avgDailyConsumption, 2) }}</td>
                        <td>{{ formatNumber(ingredient.forecast7d, 2) }}</td>
                        <td>{{ formatNumber(ingredient.forecast30d, 2) }}</td>
                        <td>
                            <span v-if="ingredient.daysRemaining !== null" class="days-remaining" :class="getDaysClass(ingredient.daysRemaining)">
                                {{ ingredient.daysRemaining }} ngày
                            </span>
                            <span v-else class="text-muted">N/A</span>
                        </td>
                        <td>
                            <span class="badge badge-soft" :class="getStatusClass(ingredient.status)">
                                {{ getStatusLabel(ingredient.status) }}
                            </span>
                        </td>
                        <td>
                            <span v-if="ingredient.suggestedOrder > 0" class="suggested-order">
                                {{ formatNumber(ingredient.suggestedOrder) }}
                            </span>
                            <span v-else class="text-muted">-</span>
                        </td>
                        <td @click.stop>
                            <div class="d-flex gap-2">
                                <button
                                    class="btn btn-flat btn-flat--outline btn-sm"
                                    @click="$emit('view', ingredient)"
                                    title="Xem chi tiết"
                                >
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button
                                    v-if="ingredient.suggestedOrder > 0"
                                    class="btn btn-flat btn-flat--primary btn-sm"
                                    @click="$emit('create-po', ingredient)"
                                    title="Tạo đơn đặt hàng"
                                >
                                    <i class="bi bi-cart-plus"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { formatNumber } from '@/utils/formatters'
import EmptyState from '@/components/common/EmptyState.vue'

defineProps({
    ingredients: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['view', 'create-po', 'select'])

const handleSelect = (ingredient) => {
    emit('select', ingredient)
}

const getRowClass = (status) => {
    const classes = {
        'critical': 'table-row-critical',
        'warning': 'table-row-warning',
        'attention': 'table-row-attention'
    }
    return classes[status] || ''
}

const getStatusClass = (status) => {
    const classes = {
        'critical': 'badge-danger',
        'warning': 'badge-warning',
        'attention': 'badge-info',
        'stable': 'badge-success'
    }
    return classes[status] || 'badge-neutral'
}

const getStatusLabel = (status) => {
    const labels = {
        'critical': 'Critical',
        'warning': 'Warning',
        'attention': 'Attention',
        'stable': 'Ổn định'
    }
    return labels[status] || status
}

const getDaysClass = (days) => {
    if (days <= 3) return 'days-critical'
    if (days <= 7) return 'days-warning'
    if (days <= 14) return 'days-attention'
    return 'days-stable'
}
</script>

<style scoped>
.ingredient-list {
    font-family: var(--font-family-sans);
}

.empty-list {
    padding: var(--spacing-8) 0;
}

.ingredient-name {
    font-family: var(--font-family-sans);
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
}

.stock-value {
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
}

.table-row-critical {
    background: var(--color-soft-rose);
}

.table-row-warning {
    background: var(--color-soft-amber);
}

.table-row-attention {
    background: var(--color-soft-sky);
}

.days-remaining {
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-semibold);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    display: inline-block;
}

.days-critical {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.days-warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.days-attention {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.days-stable {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.suggested-order {
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
}

.badge-soft {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    border: 1px solid transparent;
    display: inline-block;
}

.badge-danger {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.badge-warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.badge-info {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.badge-success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.badge-neutral {
    background: var(--color-card-muted);
    color: var(--color-text-muted);
}
</style>

