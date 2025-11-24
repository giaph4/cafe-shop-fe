<template>
    <div v-if="isLoading" class="pos-table-map__state">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2">Đang tải sơ đồ bàn...</p>
    </div>
    <div v-else-if="isError" class="pos-table-map__state pos-table-map__state--error">
        <i class="bi bi-exclamation-triangle-fill"></i>
        <p>Không thể tải sơ đồ bàn. Vui lòng thử lại.</p>
    </div>
    <div v-else class="pos-table-map__grid">
        <button v-for="table in tables" :key="table.id" type="button"
                class="table-chip" :class="getStatusVariant(table.status)"
                @click="selectT(table)">
            <span class="table-chip__name">{{ table.name }}</span>
            <span class="table-chip__status">
                <i class="bi" :class="getStatusMeta(table.status).icon"></i>
                {{ getStatusMeta(table.status).label }}
            </span>
            <span class="table-chip__capacity"><i class="bi bi-people-fill"></i>{{ table.capacity }}</span>
        </button>
    </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useTableStore } from '@/store/tables'

const emit = defineEmits(['table-selected'])

const tableStore = useTableStore()

// Use tables from store (with real-time updates)
const tables = computed(() => tableStore.tables)
const isLoading = computed(() => tableStore.loading)
const isError = computed(() => !!tableStore.error)

onMounted(async () => {
    // Load tables if not already loaded
    await tableStore.loadTables()
    // Connect WebSocket for real-time updates
    tableStore.connectWebSocket()
})

const selectT = (table) => {
    emit('table-selected', table)
}

const getStatusMeta = (status) => {
    switch (status) {
        case 'EMPTY':
            return { label: 'Còn trống', icon: 'bi-check-circle', tone: 'success' }
        case 'AVAILABLE':
            return { label: 'Sẵn sàng', icon: 'bi-arrow-repeat', tone: 'info' }
        case 'SERVING':
            return { label: 'Đang phục vụ', icon: 'bi-cup-hot', tone: 'warning' }
        case 'RESERVED':
            return { label: 'Đã đặt trước', icon: 'bi-bookmark-check', tone: 'danger' }
        case 'PENDING':
            return { label: 'Đang chờ', icon: 'bi-hourglass-split', tone: 'neutral' }
        default:
            return { label: status || 'Không xác định', icon: 'bi-question-circle', tone: 'neutral' }
    }
}

const getStatusVariant = (status) => `table-chip--${getStatusMeta(status).tone}`

</script>

<style scoped>
.pos-table-map__state {
    display: grid;
    place-items: center;
    gap: 0.5rem;
    padding: 2rem 0;
    color: var(--color-text-muted);
}

.pos-table-map__state--error {
    color: #dc2626;
}

.pos-table-map__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.75rem;
}

.table-chip {
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 0.85rem 1rem;
    display: grid;
    gap: 0.35rem;
    text-align: left;
    background: var(--color-card);
    color: var(--color-text);
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.table-chip:hover,
.table-chip:focus {
    transform: translateY(-3px);
    box-shadow: var(--shadow-soft);
    border-color: rgba(99, 102, 241, 0.45);
}

.table-chip__name {
    font-weight: 700;
    font-size: 1rem;
    color: var(--color-heading);
}

.table-chip__status {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-weight: 600;
    font-size: 0.85rem;
}

.table-chip__capacity {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.table-chip--success {
    border-color: rgba(34, 197, 94, 0.45);
    background: linear-gradient(165deg, rgba(34, 197, 94, 0.15), transparent);
}

.table-chip--warning {
    border-color: rgba(234, 179, 8, 0.45);
    background: linear-gradient(165deg, rgba(234, 179, 8, 0.18), transparent);
}

.table-chip--danger {
    border-color: rgba(239, 68, 68, 0.45);
    background: linear-gradient(165deg, rgba(239, 68, 68, 0.18), transparent);
}

.table-chip--info {
    border-color: rgba(59, 130, 246, 0.35);
    background: linear-gradient(165deg, rgba(59, 130, 246, 0.18), transparent);
}

.table-chip--neutral {
    border-color: rgba(148, 163, 184, 0.35);
    background: linear-gradient(165deg, rgba(148, 163, 184, 0.15), transparent);
}

.dark-theme .table-chip {
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(17, 24, 39, 0.9));
    border-color: rgba(129, 140, 248, 0.28);
}

.comfort-theme .table-chip {
    background: linear-gradient(170deg, rgba(245, 241, 235, 0.95), rgba(236, 232, 226, 0.92));
    border-color: rgba(95, 111, 148, 0.25);
}

</style>
