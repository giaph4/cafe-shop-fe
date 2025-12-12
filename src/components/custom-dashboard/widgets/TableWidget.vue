<template>
  <WidgetBase
    :widget="widget"
    :is-editing="isEditing"
    :is-dragging="isDragging"
  >
    <div class="table-widget">
      <div
        v-if="loading"
        class="table-widget__loading"
      >
        <div class="spinner-border spinner-border-sm" />
        <span class="ms-2">Đang tải...</span>
      </div>
      <div
        v-else-if="error"
        class="table-widget__error"
      >
        <i class="bi bi-exclamation-triangle" />
        <span>{{ error }}</span>
      </div>
      <div
        v-else-if="tableData && tableData.length > 0"
        class="table-widget__table-container"
      >
        <table class="table table-hover table-sm">
          <thead>
            <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                :style="{ width: column.width }"
              >
                {{ column.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in paginatedData"
              :key="getRowKey(row, index)"
            >
              <td
                v-for="column in columns"
                :key="column.key"
              >
                <span v-if="column.format === 'currency'">
                  {{ formatCurrency(getValue(row, column.key)) }}
                </span>
                <span v-else-if="column.format === 'number'">
                  {{ formatNumber(getValue(row, column.key)) }}
                </span>
                <span v-else-if="column.format === 'date'">
                  {{ formatDate(getValue(row, column.key)) }}
                </span>
                <span v-else>
                  {{ getValue(row, column.key) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div
          v-if="showPagination && totalPages > 1"
          class="table-widget__pagination"
        >
          <button
            class="btn btn-sm btn-outline-primary"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <i class="bi bi-chevron-left" />
          </button>
          <span class="mx-2">
            Trang {{ currentPage }} / {{ totalPages }}
          </span>
          <button
            class="btn btn-sm btn-outline-primary"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            <i class="bi bi-chevron-right" />
          </button>
        </div>
      </div>
      <div
        v-else
        class="table-widget__empty"
      >
        <i class="bi bi-table" />
        <p>Không có dữ liệu</p>
      </div>
    </div>
  </WidgetBase>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import WidgetBase from '../WidgetBase.vue'
import { formatCurrency, formatNumber, formatDate } from '@/utils/formatters'
import { fetchTableData } from '@/api/widgetDataService'

const props = defineProps({
    widget: {
        type: Object,
        required: true
    },
    isEditing: {
        type: Boolean,
        default: false
    },
    isDragging: {
        type: Boolean,
        default: false
    },
    data: {
        type: Array,
        default: null
    }
})

const loading = ref(false)
const error = ref(null)
const tableData = ref([])
const currentPage = ref(1)
let refreshInterval = null

// Auto-generate columns từ dataSource nếu không có columns config
const columns = computed(() => {
    if (props.widget.config?.columns && props.widget.config.columns.length > 0) {
        return props.widget.config.columns
    }

    // Auto-generate columns dựa trên dataSource
    const dataSource = props.widget.config?.dataSource
    if (dataSource === 'topProducts' || dataSource === 'products') {
        return [
            { key: 'rank', label: 'Hạng', width: '60px' },
            { key: 'name', label: 'Tên sản phẩm' },
            { key: 'quantity', label: 'Số lượng', format: 'number' },
            { key: 'revenue', label: 'Doanh thu', format: 'currency' }
        ]
    }
    if (dataSource === 'topCustomers') {
        return [
            { key: 'rank', label: 'Hạng', width: '60px' },
            { key: 'name', label: 'Tên khách hàng' },
            { key: 'phone', label: 'SĐT' },
            { key: 'orders', label: 'Số đơn', format: 'number' },
            { key: 'spend', label: 'Tổng chi', format: 'currency' }
        ]
    }
    if (dataSource === 'topStaff') {
        return [
            { key: 'rank', label: 'Hạng', width: '60px' },
            { key: 'name', label: 'Tên nhân viên' },
            { key: 'orders', label: 'Số đơn', format: 'number' },
            { key: 'revenue', label: 'Doanh thu', format: 'currency' }
        ]
    }

    return []
})

const pageSize = computed(() => props.widget.config?.pageSize || 10)

const showPagination = computed(() => props.widget.config?.pagination !== false)

const totalPages = computed(() => Math.ceil(tableData.value.length / pageSize.value))

const paginatedData = computed(() => {
    if (!showPagination.value) {
        return tableData.value
    }
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return tableData.value.slice(start, end)
})

const getValue = (row, key) => key.split('.').reduce((obj, k) => obj?.[k], row) ?? ''

const getRowKey = (row, index) => row.id || row._id || row.rank || index

// Fetch data từ API
const fetchData = async () => {
    if (!props.widget.config?.dataSource) {
        // Nếu có data từ props, dùng data đó
        if (props.data) {
            tableData.value = Array.isArray(props.data) ? props.data : []
        }
        return
    }

    loading.value = true
    error.value = null

    try {
        const data = await fetchTableData(props.widget.config)
        tableData.value = data
        currentPage.value = 1
    } catch (err) {
        error.value = err.message || 'Không thể tải dữ liệu'
        console.error('Error fetching table data:', err)
        tableData.value = []
    } finally {
        loading.value = false
    }
}

watch(() => props.data, (newData) => {
    if (newData) {
        tableData.value = Array.isArray(newData) ? newData : []
        currentPage.value = 1
    }
}, { immediate: true })

watch(() => props.widget.config, () => {
    fetchData()
}, { deep: true })

onMounted(() => {
    // Initialize với data từ widget config nếu có
    if (props.widget.config?.data) {
        tableData.value = Array.isArray(props.widget.config.data) ? props.widget.config.data : []
    } else {
        fetchData()
    }

    // Auto refresh nếu có refreshInterval
    if (props.widget.config?.refreshInterval && props.widget.config.refreshInterval > 0) {
        refreshInterval = setInterval(() => {
            if (!props.isEditing) {
                fetchData()
            }
        }, props.widget.config.refreshInterval * 1000)
    }
})

onBeforeUnmount(() => {
    if (refreshInterval) {
        clearInterval(refreshInterval)
    }
})
</script>

<style scoped>
.table-widget {
    width: 100%;
    min-height: 200px;
}

.table-widget__loading,
.table-widget__error,
.table-widget__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    min-height: 200px;
    color: var(--color-text-muted);
}

.table-widget__table-container {
    width: 100%;
    overflow-x: auto;
}

.table-widget__table-container table {
    margin-bottom: 0;
}

.table-widget__pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-3);
    border-top: 1px solid var(--color-border);
}
</style>

