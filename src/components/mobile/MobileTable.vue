<template>
  <div class="mobile-table">
    <!-- Card View for Mobile -->
    <div
      v-if="isMobile"
      class="mobile-table__cards"
    >
      <div
        v-for="(row, index) in items"
        :key="getRowKey(row, index)"
        class="mobile-table__card"
        :class="{ 'mobile-table__card--selected': isSelected(row, index) }"
        @click="handleRowClick(row, index)"
      >
        <div class="mobile-table__card-header">
          <div class="mobile-table__card-title">
            {{ getCardTitle(row) }}
          </div>
          <div class="mobile-table__card-actions">
            <slot
              name="actions"
              :row="row"
              :index="index"
            />
          </div>
        </div>
        <div class="mobile-table__card-body">
          <div
            v-for="(column, colIndex) in visibleColumns"
            :key="colIndex"
            class="mobile-table__card-field"
          >
            <div class="mobile-table__card-label">
              {{ column.label }}
            </div>
            <div class="mobile-table__card-value">
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :value="row[column.key]"
              >
                {{ formatValue(row[column.key], column) }}
              </slot>
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="items.length === 0"
        class="mobile-table__empty"
      >
        <slot name="empty">
          <p>Không có dữ liệu</p>
        </slot>
      </div>
    </div>

    <!-- Table View for Desktop -->
    <table
      v-else
      class="table"
    >
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :style="{ width: column.width }"
          >
            {{ column.label }}
          </th>
          <th
            v-if="$slots.actions"
            class="text-end"
          >
            Thao tác
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, index) in items"
          :key="getRowKey(row, index)"
          :class="{ 'table-active': isSelected(row, index) }"
          @click="handleRowClick(row, index)"
        >
          <td
            v-for="column in columns"
            :key="column.key"
          >
            <slot
              :name="`cell-${column.key}`"
              :row="row"
              :value="row[column.key]"
            >
              {{ formatValue(row[column.key], column) }}
            </slot>
          </td>
          <td
            v-if="$slots.actions"
            class="text-end"
          >
            <slot
              name="actions"
              :row="row"
              :index="index"
            />
          </td>
        </tr>
        <tr v-if="items.length === 0">
          <td
            :colspan="columns.length + ($slots.actions ? 1 : 0)"
            class="text-center text-muted py-4"
          >
            <slot name="empty">
              Không có dữ liệu
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDeviceDetection } from '@/composables/useDeviceDetection'

const props = defineProps({
    items: {
        type: Array,
        default: () => []
    },
    columns: {
        type: Array,
        required: true
    },
    rowKey: {
        type: [String, Function],
        default: 'id'
    },
    selectedRows: {
        type: Array,
        default: () => []
    },
    cardTitleField: {
        type: String,
        default: null
    }
})

const emit = defineEmits(['row-click'])

const { isMobile } = useDeviceDetection()

const visibleColumns = computed(() => props.columns.filter(col => col.mobile !== false))

const getRowKey = (row, index) => {
    if (typeof props.rowKey === 'function') {
        return props.rowKey(row, index)
    }
    return row[props.rowKey] || index
}

const isSelected = (row, index) => {
    const key = getRowKey(row, index)
    return props.selectedRows.some(selected => {
        if (typeof props.rowKey === 'function') {
            return props.rowKey(selected, -1) === key
        }
        return selected[props.rowKey] === key
    })
}

const getCardTitle = (row) => {
    if (props.cardTitleField) {
        return row[props.cardTitleField] || '—'
    }
    // Try to find a name or title field
    return row.name || row.title || row.label || '—'
}

const formatValue = (value, column) => {
    if (value === null || value === undefined) return '—'

    if (column.formatter && typeof column.formatter === 'function') {
        return column.formatter(value)
    }

    if (column.type === 'currency') {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value)
    }

    if (column.type === 'date') {
        return new Date(value).toLocaleDateString('vi-VN')
    }

    if (column.type === 'datetime') {
        return new Date(value).toLocaleString('vi-VN')
    }

    return value
}

const handleRowClick = (row, index) => {
    emit('row-click', { row, index })
}
</script>

<style scoped>
.mobile-table {
    width: 100%;
}

.mobile-table__cards {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.mobile-table__card {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    padding: var(--spacing-4);
    transition: all var(--transition-base);
    cursor: pointer;
}

.mobile-table__card:hover {
    border-color: var(--color-border-strong);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.mobile-table__card--selected {
    border-color: var(--color-primary);
    background: var(--color-bg-muted);
}

.mobile-table__card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-3);
    padding-bottom: var(--spacing-3);
    border-bottom: 1px solid var(--color-border);
}

.mobile-table__card-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
    flex: 1;
}

.mobile-table__card-actions {
    display: flex;
    gap: var(--spacing-2);
    margin-left: var(--spacing-2);
}

.mobile-table__card-body {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.mobile-table__card-field {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-2);
}

.mobile-table__card-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    min-width: 100px;
    flex-shrink: 0;
}

.mobile-table__card-value {
    font-size: var(--font-size-base);
    color: var(--color-text);
    text-align: right;
    flex: 1;
    word-break: break-word;
}

.mobile-table__empty {
    text-align: center;
    padding: var(--spacing-8);
    color: var(--color-text-muted);
}

/* Desktop table styles */
.mobile-table :deep(.table) {
    width: 100%;
    margin-bottom: 0;
}

.mobile-table :deep(.table thead th) {
    background: var(--color-bg-muted);
    border-bottom: 2px solid var(--color-border);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
    padding: var(--spacing-3);
}

.mobile-table :deep(.table tbody tr) {
    cursor: pointer;
    transition: background-color var(--transition-base);
}

.mobile-table :deep(.table tbody tr:hover) {
    background: var(--color-bg-muted);
}

.mobile-table :deep(.table tbody tr.table-active) {
    background: var(--color-bg-muted);
}

.mobile-table :deep(.table tbody td) {
    padding: var(--spacing-3);
    vertical-align: middle;
}
</style>

