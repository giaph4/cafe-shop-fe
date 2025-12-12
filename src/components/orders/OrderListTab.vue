<template>
  <div class="order-list-tab">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h5
          class="mb-0"
          style="font-weight: var(--font-weight-semibold); color: var(--color-heading); font-family: var(--font-family-sans);"
        >
          Danh sách đơn hàng
        </h5>
        <small
          class="text-muted"
          style="font-family: var(--font-family-sans);"
        >Tổng: {{
          totalElements.toLocaleString('vi-VN') }} đơn hàng</small>
      </div>
      <div class="d-flex gap-2">
        <button
          v-if="canExport"
          class="btn btn-sm btn-outline-primary"
          type="button"
          :disabled="loading || orders.length === 0"
          @click="handleExport"
        >
          <i class="bi bi-download me-1" />
          Xuất Excel
        </button>
      </div>
    </div>

    <LoadingState v-if="loading" />
    <ErrorState
      v-else-if="error"
      :message="error"
      :show-retry="false"
    />
    <template v-else>
      <EmptyState
        v-if="!orders.length"
        title="Không có đơn hàng"
        message="Không có đơn hàng nào phù hợp bộ lọc hiện tại."
      >
        <template #icon>
          <i class="bi bi-receipt-cutoff" />
        </template>
      </EmptyState>
      <div
        v-else
        class="table-responsive"
      >
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th
                scope="col"
                style="width: 50px;"
              >
                <input
                  type="checkbox"
                  :checked="bulkActions.isSelectAll && orders.length > 0"
                  :indeterminate="bulkActions.selectedCount > 0 && !bulkActions.isSelectAll"
                  @change="handleSelectAll"
                >
              </th>
              <th scope="col">
                ID
              </th>
              <th scope="col">
                Loại
              </th>
              <th scope="col">
                Bàn
              </th>
              <th scope="col">
                Nhân viên
              </th>
              <th
                scope="col"
                class="d-none d-md-table-cell"
              >
                Khách hàng
              </th>
              <th
                scope="col"
                class="text-end"
              >
                Tổng tiền
              </th>
              <th scope="col">
                Trạng thái
              </th>
              <th
                scope="col"
                class="d-none d-lg-table-cell"
              >
                Ngày tạo
              </th>
              <th
                scope="col"
                class="text-end"
              >
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="order in orders"
              :key="order.id"
            >
              <td>
                <input
                  type="checkbox"
                  :checked="bulkActions.isSelected(order.id)"
                  @change="bulkActions.toggleSelection(order.id)"
                >
              </td>
              <td class="fw-semibold">
                #{{ order.id }}
              </td>
              <td>
                <span
                  class="badge"
                  :class="order.type === 'TAKE_AWAY' ? 'bg-info' : 'bg-primary'"
                >
                  {{ order.type === 'TAKE_AWAY' ? 'Mang về' : 'Tại quán' }}
                </span>
              </td>
              <td>{{ order.tableName || '—' }}</td>
              <td>{{ order.staffUsername || '—' }}</td>
              <td class="d-none d-md-table-cell">
                {{ order.customerName || 'Khách lẻ' }}
              </td>
              <td class="text-end fw-semibold">
                {{ formatCurrency(order.totalAmount || 0) }}
              </td>
              <td>
                <span
                  :class="getStatusBadgeClass(order.status)"
                  :style="getStatusBadgeStyle(order.status)"
                >
                  {{ getStatusLabel(order.status) }}
                </span>
              </td>
              <td class="d-none d-lg-table-cell">
                <div class="text-muted small">
                  {{ formatDateTime(order.createdAt) }}
                </div>
              </td>
              <td class="text-end">
                <div class="action-grid">
                  <button
                    class="action-button"
                    type="button"
                    title="Xem chi tiết"
                    @click="$emit('view-detail', order.id)"
                  >
                    <i class="bi bi-eye" />
                    <span>Chi tiết</span>
                  </button>
                  <button
                    v-if="canCancel"
                    class="action-button action-button--primary"
                    type="button"
                    title="Cập nhật đơn hàng"
                    @click="$emit('update', order)"
                  >
                    <i class="bi bi-pencil" />
                    <span>Cập nhật</span>
                  </button>
                  <button
                    v-if="canCancel && order.status === 'PENDING'"
                    class="action-button action-button--danger"
                    type="button"
                    title="Hủy đơn"
                    :disabled="cancelling"
                    @click="$emit('cancel', order)"
                  >
                    <i class="bi bi-x-circle" />
                    <span>Hủy</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        v-if="totalPages > 1"
        class="d-flex justify-content-end mt-3"
        style="margin-bottom: 80px;"
      >
        <Pagination
          mode="zero-based"
          :current-page="zeroBasedPage"
          :total-pages="totalPages"
          @page-change="$emit('page-change', $event)"
        />
      </div>
    </template>

    <!-- Bulk Actions Bar -->
    <BulkActionsBar
      :selected-count="bulkActions.selectedCount.value"
      :has-selection="bulkActions.hasSelection.value"
      :is-processing="bulkActions.isProcessing.value"
      :progress-percentage="progressPercentage"
      :actions="bulkActionItems"
      item-label="đơn hàng"
      @action="handleBulkAction"
      @clear="bulkActions.clearSelection"
    />

    <!-- Export Modal -->
    <ExportModal
      :show="showExportModal"
      :data="orders"
      :columns="exportColumns"
      :has-filters="false"
      default-filename="orders"
      @close="showExportModal = false"
      @export="handleExport"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { toast } from 'vue3-toastify'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import Pagination from '@/components/common/Pagination.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useBulkActions } from '@/composables/useBulkActions'
import BulkActionsBar from '@/components/BulkActionsBar.vue'
import ExportModal from '@/components/ExportModal.vue'
import * as orderService from '@/api/orderService'
import logger from '@/utils/logger'

const props = defineProps({
    orders: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    },
    error: {
        type: String,
        default: ''
    },
    zeroBasedPage: {
        type: Number,
        default: 0
    },
    totalPages: {
        type: Number,
        default: 0
    },
    totalElements: {
        type: Number,
        default: 0
    },
    canExport: {
        type: Boolean,
        default: false
    },
    canCancel: {
        type: Boolean,
        default: false
    },
    cancelling: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['view-detail', 'update', 'cancel', 'page-change', 'export', 'refresh'])

// Bulk Actions
const bulkActions = useBulkActions({
    onBulkAction: (action, selectedIds, results) => {
        if (results.success > 0) {
            toast.success(`${results.success} đơn hàng đã được ${action} thành công`)
        }
        if (results.failed > 0) {
            toast.error(`${results.failed} đơn hàng ${action} thất bại`)
        }
        emit('refresh')
    },
    maxBatchSize: 100
})

const showExportModal = ref(false)
const progressPercentage = ref(0)

// Bulk action items
const bulkActionItems = computed(() => {
    const items = [
        {
            id: 'export',
            label: 'Xuất',
            icon: 'bi bi-download',
            confirm: false
        }
    ]

    if (props.canCancel) {
        items.push({
            id: 'cancel',
            label: 'Hủy đơn',
            icon: 'bi bi-x-circle',
            danger: true,
            confirm: true,
            confirmMessage: 'Bạn có chắc chắn muốn hủy các đơn hàng đã chọn?'
        })
    }

    return items
})

// Export columns
const exportColumns = [
    { key: 'id', label: 'ID' },
    { key: 'tableName', label: 'Bàn' },
    { key: 'staffUsername', label: 'Nhân viên' },
    { key: 'customerName', label: 'Khách hàng' },
    {
        key: 'totalAmount',
        label: 'Tổng tiền',
        value: (item) => formatCurrency(item.totalAmount)
    },
    { key: 'status', label: 'Trạng thái' },
    {
        key: 'createdAt',
        label: 'Ngày tạo',
        value: (item) => formatDateTime(item.createdAt)
    }
]

// Handle bulk actions
const handleBulkAction = async (action) => {
    try {
        switch (action.id) {
            case 'export':
                showExportModal.value = true
                break

            case 'cancel':
                if (bulkActions.selectedCount.value === 0) {
                    toast.warning('Vui lòng chọn ít nhất một đơn hàng')
                    return
                }
                await bulkActions.executeBulkAction(
                    'cancel',
                    async (id) => {
                        await orderService.cancelOrder(id)
                    },
                    {
                        confirm: false,
                        skipConfirm: true,
                        onProgress: (progress) => {
                            progressPercentage.value = progress.percentage
                        },
                        clearOnSuccess: true,
                        onComplete: (_results) => {
                            progressPercentage.value = 0
                        }
                    }
                )
                break
        }
    } catch (err) {
        logger.error('[OrderListTab] Lỗi khi thực hiện thao tác hàng loạt:', err)
        toast.error(`Có lỗi xảy ra: ${  err.message || 'Lỗi không xác định'}`)
        progressPercentage.value = 0
    }
}

// Handle select all
const handleSelectAll = () => {
    if (bulkActions.isSelectAll.value) {
        bulkActions.clearSelection()
    } else {
        bulkActions.selectAll(props.orders)
    }
}

// Handle export
const handleExport = (result) => {
    toast.success(`Đã xuất ${result.rowCount} đơn hàng thành công`)
    emit('export')
}

const STATUS_METADATA = {
    PENDING: { label: 'Đang chờ', badgeClass: 'badge' },
    PAID: { label: 'Đã thanh toán', badgeClass: 'badge' },
    CANCELLED: { label: 'Đã hủy', badgeClass: 'badge' },
    TRANSFERRED: { label: 'Đã chuyển ca', badgeClass: 'badge' }
}

const getStatusLabel = (status) => STATUS_METADATA[status]?.label || status

const getStatusBadgeClass = (status) => STATUS_METADATA[status]?.badgeClass || 'badge'

const getStatusBadgeStyle = (status) => {
    const styles = {
        PENDING: {
            background: 'var(--color-soft-amber)',
            border: '1px solid var(--color-warning)',
            color: 'var(--color-warning)'
        },
        PAID: {
            background: 'var(--color-soft-emerald)',
            border: '1px solid var(--color-success)',
            color: 'var(--color-success)'
        },
        CANCELLED: {
            background: 'var(--color-soft-rose)',
            border: '1px solid var(--color-danger)',
            color: 'var(--color-danger)'
        },
        TRANSFERRED: {
            background: 'var(--color-soft-sky)',
            border: '1px solid var(--color-info)',
            color: 'var(--color-info)'
        }
    }
    return styles[status] || {
        background: 'var(--color-card-muted)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-muted)'
    }
}

</script>

<style scoped>
.order-list-tab {
  padding: 0;
}

/* Action buttons - Chuẩn hóa theo base.css */
.action-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  justify-content: flex-end;
}

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-card);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-base);
  cursor: pointer;
  min-width: auto;
  font-family: var(--font-family-sans);
}

.action-button:hover:not(:disabled) {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
}

.action-button:active:not(:disabled) {
  background: var(--color-primary-dark);
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.action-button i {
  font-size: 18px;
  line-height: 1;
}

.action-button--primary {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.action-button--primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.action-button--danger {
  border-color: var(--color-danger);
  background: var(--color-card);
  color: var(--color-danger);
}

.action-button--danger:hover:not(:disabled) {
  background: var(--color-danger);
  color: var(--color-text-inverse);
  border-color: var(--color-danger);
}

/* Table - Chuẩn hóa theo base.css */
.order-list-tab :global(.table) {
  margin-bottom: 0;
  border-collapse: separate;
  border-spacing: 0;
}

.order-list-tab :global(.table thead th) {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-heading);
  background: var(--color-card-muted);
  border-bottom: 1px solid var(--color-border);
  border-top: none;
  border-left: none;
  border-right: none;
  padding: var(--spacing-3) var(--spacing-4);
  font-family: var(--font-family-sans);
}

.order-list-tab :global(.table tbody td) {
  font-size: var(--font-size-base);
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid var(--color-border);
  border-top: none;
  border-left: none;
  border-right: none;
  vertical-align: middle;
  font-family: var(--font-family-sans);
}

.order-list-tab :global(.table tbody tr:hover) {
  background: var(--color-card-muted);
}

/* Badge - Chuẩn hóa */
.order-list-tab :global(.badge) {
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-sans);
}

@media (max-width: 768px) {
  .action-grid {
    flex-direction: column;
    gap: var(--spacing-1);
  }

  .action-button {
    width: 100%;
    justify-content: center;
  }

  .action-button span {
    display: none;
  }
}
</style>
