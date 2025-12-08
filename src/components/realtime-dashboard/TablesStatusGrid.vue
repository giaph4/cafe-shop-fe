<template>
    <div class="tables-status-grid">
        <div class="tables-grid">
            <div
                v-for="table in tables"
                :key="table.id"
                class="table-item"
                :class="getTableClass(table.status)"
            >
                <div class="table-number">{{ table.number || table.name || 'N/A' }}</div>
                <div class="table-status">
                    <i :class="getTableIcon(table.status)"></i>
                    <span>{{ getTableLabel(table.status) }}</span>
                </div>
                <div v-if="table.currentOrder" class="table-order">
                    <small>Đơn: #{{ table.currentOrder.id || table.currentOrder.orderId }}</small>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    tables: {
        type: Array,
        default: () => []
    }
})

const getTableClass = (status) => {
    const classes = {
        'OCCUPIED': 'table-occupied',
        'RESERVED': 'table-reserved',
        'AVAILABLE': 'table-available',
        'CLEANING': 'table-cleaning'
    }
    return classes[status] || 'table-available'
}

const getTableIcon = (status) => {
    const icons = {
        'OCCUPIED': 'bi bi-person-fill',
        'RESERVED': 'bi bi-clock-fill',
        'AVAILABLE': 'bi bi-check-circle-fill',
        'CLEANING': 'bi bi-broom'
    }
    return icons[status] || 'bi bi-circle'
}

const getTableLabel = (status) => {
    const labels = {
        'OCCUPIED': 'Đang dùng',
        'RESERVED': 'Đã đặt',
        'AVAILABLE': 'Trống',
        'CLEANING': 'Đang dọn'
    }
    return labels[status] || status
}
</script>

<style scoped>
.tables-status-grid {
    font-family: var(--font-family-sans);
}

.tables-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--spacing-3);
}

.table-item {
    padding: var(--spacing-3);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    text-align: center;
    transition: all var(--transition-base);
    cursor: pointer;
}

.table-item:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
}

.table-occupied {
    border-color: var(--color-danger);
    background: var(--color-soft-rose);
}

.table-reserved {
    border-color: var(--color-warning);
    background: var(--color-soft-amber);
}

.table-available {
    border-color: var(--color-success);
    background: var(--color-soft-emerald);
}

.table-cleaning {
    border-color: var(--color-info);
    background: var(--color-soft-sky);
}

.table-number {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.table-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-1);
    font-size: var(--font-size-xs);
    color: var(--color-text);
    font-family: var(--font-family-sans);
    margin-bottom: var(--spacing-1);
}

.table-order {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

@media (max-width: 768px) {
    .tables-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}
</style>

