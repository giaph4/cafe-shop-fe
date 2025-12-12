<template>
  <LoadingState
    v-if="isLoading"
    text="Đang tải sơ đồ bàn..."
  />
  <ErrorState
    v-else-if="isError"
    message="Không thể tải sơ đồ bàn. Vui lòng thử lại."
    :show-retry="true"
    :retry-handler="() => tableStore.loadTables()"
  />
  <div
    v-else
    class="pos-table-map__grid"
  >
    <button
      v-for="table in tables"
      :key="table.id"
      type="button"
      class="table-chip"
      :class="getStatusVariant(table.status)"
      @click="selectT(table)"
    >
      <span class="table-chip__name">{{ table.name }}</span>
      <span class="table-chip__status">
        <i
          class="bi"
          :class="getStatusMeta(table.status).icon"
        />
        {{ getStatusMeta(table.status).label }}
      </span>
      <span class="table-chip__capacity"><i class="bi bi-people-fill" />{{ table.capacity }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useTableStore } from '@/store/tables'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const emit = defineEmits(['table-selected'])

const tableStore = useTableStore()

// Use tables from store (with real-time updates)
const tables = computed(() => tableStore.tables)
const isLoading = computed(() => tableStore.loading)
const isError = computed(() => Boolean(tableStore.error))

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
.pos-table-map__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--spacing-3);
}

/* Table Chip - Chuẩn hóa */
.table-chip {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-3) var(--spacing-4);
    display: grid;
    gap: var(--spacing-1);
    text-align: left;
    background: var(--color-card);
    color: var(--color-text);
    transition: all var(--transition-base);
    cursor: pointer;
}

.table-chip:hover,
.table-chip:focus {
    border-color: var(--color-primary);
    background: var(--color-card-muted);
}

.table-chip__name {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.table-chip__status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.table-chip__status i {
    font-size: 16px;
    line-height: 1;
}

.table-chip__capacity {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
}

.table-chip__capacity i {
    font-size: 16px;
    line-height: 1;
}

/* Table Chip Variants - Chuẩn hóa theo màu nhạt */
.table-chip--success {
    border-color: var(--color-success);
    background: var(--color-soft-emerald);
}

.table-chip--success .table-chip__status {
    color: var(--color-success);
}

.table-chip--warning {
    border-color: var(--color-warning);
    background: var(--color-soft-amber);
}

.table-chip--warning .table-chip__status {
    color: var(--color-warning);
}

.table-chip--danger {
    border-color: var(--color-danger);
    background: var(--color-soft-rose);
}

.table-chip--danger .table-chip__status {
    color: var(--color-danger);
}

.table-chip--info {
    border-color: var(--color-info);
    background: var(--color-soft-sky);
}

.table-chip--info .table-chip__status {
    color: var(--color-info);
}

.table-chip--neutral {
    border-color: var(--color-border);
    background: var(--color-card-muted);
}

.table-chip--neutral .table-chip__status {
    color: var(--color-text-muted);
}

</style>
