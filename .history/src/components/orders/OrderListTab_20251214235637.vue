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
                  class="badge badge-type"
                  :class="order.type === 'TAKE_AWAY' ? 'badge-type--takeaway' : 'badge-type--primary'"
                >
                  {{ order.type === 'TAKE_AWAY' ? 'Mang đi' : 'Tại quán' }}
                </span>
              </td>
              <td>
                <span v-if="order.type === 'DINE_IN'">{{ order.tableName || '—' }}</span>
                <span
                  v-else
                  class="text-muted"
                  style="font-size: 0.875rem;"
                >—</span>
              </td>
              <td>{{ getStaffDisplayName(order) }}</td>
              <td class="d-none d-md-table-cell">
                {{ order.customerName || 'Khách lẻ' }}
              </td>
              <td class="text-end fw-semibold">
                {{ formatCurrency(order.totalAmount || 0) }}
              </td>
              <td>
                <span
                  class="badge badge-status"
                  :class="getStatusBadgeClass(order.status)"
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
                <div class="action-buttons">
                  <button
                    class="action-button action-button--info"
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
                    title="Chỉnh sửa"
                    @click="$emit('update', order)"
                  >
                    <i class="bi bi-pencil" />
                    <span>Chỉnh sửa</span>
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
        v-if="totalPages > 1 || pageSize"
        class="d-flex justify-content-between align-items-center mt-3"
        style="margin-bottom: 80px;"
      >
        <!-- Page Size Selector -->
        <div
          v-if="pageSize"
          class="d-flex align-items-center gap-2"
        >
          <label
            class="mb-0 text-muted small"
            style="font-family: var(--font-family-sans);"
          >
            Hiển thị:
          </label>
          <select
            :value="pageSize"
            class="form-select form-select-sm"
            style="width: auto; min-width: 80px; font-family: var(--font-family-sans);"
            @change="$emit('page-size-change', parseInt($event.target.value, 10))"
          >
            <option :value="10">
              10
            </option>
            <option :value="20">
              20
            </option>
            <option :value="30">
              30
            </option>
            <option :value="50">
              50
            </option>
          </select>
          <span
            class="text-muted small"
            style="font-family: var(--font-family-sans);"
          >
            / trang
          </span>
        </div>
        <div v-else />
        <!-- Pagination -->
        <div
          v-if="totalPages > 1"
          class="d-flex justify-content-center"
          style="flex: 1;"
        >
          <Pagination
            mode="zero-based"
            :current-page="zeroBasedPage"
            :total-pages="totalPages"
            @page-change="$emit('page-change', $event)"
          />
        </div>
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
    pageSize: {
        type: Number,
        default: null
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

const emit = defineEmits(['view-detail', 'update', 'cancel', 'page-change', 'page-size-change', 'export', 'refresh'])

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
    { 
        key: 'staff', 
        label: 'Nhân viên',
        value: (item) => {
            const fullName = item.staff?.fullName || item.staffFullName || item.staffName
            if (fullName) {
                return fullName.split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ')
            }
            const username = item.staffUsername || item.staff?.username
            if (username) {
                return username.split(/[_\s-]/).map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ')
            }
            return '—'
        }
    },
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

// Format staff display name: Ưu tiên fullName, fallback về username với format chuẩn
const getStaffDisplayName = (order) => {
    if (!order) return '—'
    
    // Ưu tiên staff.fullName hoặc staffFullName
    const fullName = order.staff?.fullName || order.staffFullName || order.staffName
    if (fullName) {
        // Format: Viết hoa chữ cái đầu mỗi từ
        return fullName.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ')
    }
    
    // Fallback về username nhưng format lại
    const username = order.staffUsername || order.staff?.username
    if (username) {
        // Format username: "giapho" -> "Giapho" hoặc "gia_pho" -> "Gia Pho"
        return username
            .split(/[_\s-]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
    }
    
    return '—'
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
    PENDING: { label: 'Đang chờ', badgeClass: 'badge-status--warning' },
    PAID: { label: 'Đã thanh toán', badgeClass: 'badge-status--success' },
    CANCELLED: { label: 'Đã hủy', badgeClass: 'badge-status--danger' },
    TRANSFERRED: { label: 'Đã chuyển ca', badgeClass: 'badge-status--info' }
}

const getStatusLabel = (status) => STATUS_METADATA[status]?.label || status

const getStatusBadgeClass = (status) => STATUS_METADATA[status]?.badgeClass || 'badge-status--default'

</script>

<style scoped>
.order-list-tab {
  padding: 0;
}

/* Action buttons - Chuẩn hóa theo base.css */
/* Action Buttons Container - Đồng bộ với thiết kế */
.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  justify-content: flex-end;
}

/* Base Action Button Style */
.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  height: 36px;
  border-radius: var(--radius-sm);
  border: 1px solid;
  background: var(--color-card);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-base);
  cursor: pointer;
  white-space: nowrap;
  font-family: var(--font-family-sans);
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

/* Nút Xem chi tiết - Info */
.action-button--info {
  border-color: #0ea5e9;
  color: #0ea5e9;
  background: var(--color-card);
}

.action-button--info:hover:not(:disabled) {
  background: rgba(14, 165, 233, 0.18);
  color: #0284c7;
  border-color: #0284c7;
}

/* Nút Chỉnh sửa - Primary */
.action-button--primary {
  border-color: #3b82f6;
  color: #3b82f6;
  background: var(--color-card);
}

.action-button--primary:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.18);
  color: #2563eb;
  border-color: #2563eb;
}

/* Nút Xóa/Hủy - Danger */
.action-button--danger {
  border-color: #ef4444;
  color: #ef4444;
  background: var(--color-card);
}

.action-button--danger:hover:not(:disabled) {
  background: #ef4444;
  color: var(--color-text-inverse);
  border-color: #ef4444;
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

/* Base Badge - Tiêu chuẩn đồng bộ */
.order-list-tab :global(.badge) {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-sans);
  border: 1px solid;
  white-space: nowrap;
  line-height: 1.4;
}

/* Status Badges - Tiêu chuẩn đồng bộ */
.badge-status--success {
  background: rgba(34, 197, 94, 0.18);
  border-color: #22c55e;
  color: #22c55e;
}

.badge-status--warning {
  background: rgba(251, 191, 36, 0.18);
  border-color: #f59e0b;
  color: #f59e0b;
}

.badge-status--danger {
  background: rgba(244, 63, 94, 0.18);
  border-color: #ef4444;
  color: #ef4444;
}

.badge-status--info {
  background: rgba(14, 165, 233, 0.18);
  border-color: #0ea5e9;
  color: #0ea5e9;
}

.badge-status--default {
  background: var(--color-card-muted);
  border-color: var(--color-border);
  color: var(--color-text-muted);
}

/* Type Badges - Tiêu chuẩn đồng bộ */
.badge-type--primary {
  background: rgba(14, 165, 233, 0.18);
  border-color: #0ea5e9;
  color: #0ea5e9;
}

.badge-type--secondary {
  background: var(--color-card-muted);
  border-color: var(--color-border);
  color: var(--color-text-muted);
}

.badge-type--takeaway {
  background: rgba(251, 146, 60, 0.18);
  border-color: #fb923c;
  color: #ea580c;
  font-weight: var(--font-weight-semibold);
}

.badge-type--success {
  background: rgba(34, 197, 94, 0.18);
  border-color: #22c55e;
  color: #22c55e;
}

/* Responsive - Mobile */
@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
    width: 100%;
  }

  .action-button {
    width: 100%;
    justify-content: center;
  }

  .action-button span {
    display: inline;
  }
}

@media (max-width: 576px) {
  .action-button span {
    display: none;
  }

  .action-button {
    min-width: 36px;
    padding: 8px;
    justify-content: center;
  }
}
</style>
