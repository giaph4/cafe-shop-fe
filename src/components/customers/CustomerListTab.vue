<template>
  <div class="customer-list-tab">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h5
          class="mb-0"
          style="font-weight: var(--font-weight-semibold); color: var(--color-heading); font-family: var(--font-family-sans);"
        >
          Danh sách khách hàng
        </h5>
        <small
          class="text-muted"
          style="font-family: var(--font-family-sans);"
        >Tổng: {{ totalElements.toLocaleString('vi-VN') }} khách hàng</small>
      </div>
      <div class="d-flex gap-2">
        <button
          v-if="canExport"
          class="btn btn-sm btn-outline-primary"
          type="button"
          :disabled="loading || customers.length === 0"
          @click="handleExport"
        >
          <i class="bi bi-download me-1" />
          Xuất Excel
        </button>
        <button
          v-if="canManage"
          class="btn btn-sm btn-primary"
          type="button"
          @click="$emit('create')"
        >
          <i class="bi bi-plus-lg me-1" />
          Thêm khách hàng
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
        v-if="!customers.length"
        title="Không có khách hàng"
        message="Không có khách hàng nào phù hợp bộ lọc hiện tại."
      >
        <template #icon>
          <i class="bi bi-people" />
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
                  :checked="bulkActions.isSelectAll && customers.length > 0"
                  :indeterminate="bulkActions.selectedCount > 0 && !bulkActions.isSelectAll"
                  @change="handleSelectAll"
                >
              </th>
              <th scope="col">
                Khách hàng
              </th>
              <th scope="col">
                Liên hệ
              </th>
              <th
                scope="col"
                class="text-center"
              >
                Điểm thưởng
              </th>
              <th scope="col">
                Ngày tạo
              </th>
              <th scope="col">
                Cập nhật
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
              v-for="customer in customers"
              :key="customer.id"
            >
              <td>
                <input
                  type="checkbox"
                  :checked="bulkActions.isSelected(customer.id)"
                  @change="bulkActions.toggleSelection(customer.id)"
                >
              </td>
              <td>
                <div class="d-flex flex-column">
                  <button
                    class="btn btn-link p-0 text-start fw-semibold"
                    type="button"
                    @click="$emit('view-detail', customer.id)"
                  >
                    {{ customer.fullName || '—' }}
                  </button>
                  <small class="text-muted">Mã KH: {{ customer.id }}</small>
                </div>
              </td>
              <td>
                <div class="d-flex flex-column">
                  <span><i class="bi bi-telephone me-1" />{{ customer.phone || '—' }}</span>
                  <span class="text-muted small"><i class="bi bi-envelope me-1" />{{ customer.email || '—' }}</span>
                </div>
              </td>
              <td class="text-center">
                <span class="badge bg-soft-primary">
                  {{ formatLoyaltyPoints(customer.loyaltyPoints) }}
                </span>
              </td>
              <td>
                <div class="text-muted small">
                  {{ formatDate(customer.createdAt) }}
                </div>
              </td>
              <td>
                <div class="text-muted small">
                  {{ formatDate(customer.updatedAt) }}
                </div>
              </td>
              <td class="text-end">
                <div class="action-grid">
                  <button
                    class="action-button"
                    type="button"
                    title="Xem chi tiết"
                    @click="$emit('view-detail', customer.id)"
                  >
                    <i class="bi bi-eye" />
                    <span>Chi tiết</span>
                  </button>
                  <router-link
                    :to="{ name: 'Chi tiết Khách hàng', params: { id: customer.id } }"
                    class="action-button"
                    title="Lịch sử mua hàng"
                  >
                    <i class="bi bi-receipt" />
                    <span>Lịch sử</span>
                  </router-link>
                  <button
                    v-if="canManage"
                    class="action-button"
                    type="button"
                    title="Chỉnh sửa"
                    @click="$emit('edit', customer)"
                  >
                    <i class="bi bi-pencil" />
                    <span>Chỉnh sửa</span>
                  </button>
                  <button
                    v-if="canDelete"
                    class="action-button action-button--danger"
                    type="button"
                    title="Xóa khách hàng"
                    :disabled="deleting"
                    @click="$emit('delete', customer)"
                  >
                    <i class="bi bi-trash" />
                    <span>Xóa</span>
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
      item-label="khách hàng"
      @action="handleBulkAction"
      @clear="bulkActions.clearSelection"
    />

    <!-- Export Modal -->
    <ExportModal
      :show="showExportModal"
      :data="customers"
      :columns="exportColumns"
      :has-filters="false"
      default-filename="customers"
      @close="showExportModal = false"
      @export="handleExport"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { toast } from 'vue3-toastify'
import { formatDateTime, formatNumber } from '@/utils/formatters'
import logger from '@/utils/logger'
import Pagination from '@/components/common/Pagination.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useBulkActions } from '@/composables/useBulkActions'
import BulkActionsBar from '@/components/BulkActionsBar.vue'
import ExportModal from '@/components/ExportModal.vue'
import * as customerService from '@/api/customerService'

const props = defineProps({
    customers: {
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
    canManage: {
        type: Boolean,
        default: false
    },
    canDelete: {
        type: Boolean,
        default: false
    },
    deleting: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['create', 'view-detail', 'edit', 'delete', 'page-change', 'export', 'refresh'])

// Bulk Actions
const bulkActions = useBulkActions({
    onBulkAction: (action, selectedIds, results) => {
        if (results.success > 0) {
            toast.success(`${results.success} khách hàng đã được ${action} thành công`)
        }
        if (results.failed > 0) {
            toast.error(`${results.failed} khách hàng ${action} thất bại`)
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

    if (props.canDelete) {
        items.unshift({
            id: 'delete',
            label: 'Xóa',
            icon: 'bi bi-trash',
            danger: true,
            confirm: true,
            confirmMessage: 'Bạn có chắc chắn muốn xóa các khách hàng đã chọn? Hành động này không thể hoàn tác.'
        })
    }

    return items
})

// Export columns
const exportColumns = [
    { key: 'id', label: 'ID' },
    { key: 'fullName', label: 'Họ tên' },
    { key: 'phone', label: 'Số điện thoại' },
    { key: 'email', label: 'Email' },
    { key: 'loyaltyPoints', label: 'Điểm tích lũy' },
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
            case 'delete':
                if (bulkActions.selectedCount.value === 0) {
                    toast.warning('Vui lòng chọn ít nhất một khách hàng')
                    return
                }
                await bulkActions.executeBulkAction(
                    'delete',
                    async (id) => {
                        await customerService.deleteCustomer(id)
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

            case 'export':
                showExportModal.value = true
                break
        }
    } catch (err) {
        logger.error('[CustomerListTab] Lỗi khi thực hiện thao tác hàng loạt:', err)
        toast.error(`Có lỗi xảy ra: ${  err.message || 'Lỗi không xác định'}`)
        progressPercentage.value = 0
    }
}

// Handle select all
const handleSelectAll = () => {
    if (bulkActions.isSelectAll.value) {
        bulkActions.clearSelection()
    } else {
        bulkActions.selectAll(props.customers)
    }
}

// Handle export
const handleExport = (result) => {
    toast.success(`Đã xuất ${result.rowCount} khách hàng thành công`)
    emit('export')
}

const formatDate = (value) => {
    if (!value) return '—'
    return formatDateTime(value)
}

const formatLoyaltyPoints = (points) => {
    const numeric = Number(points)
    if (!Number.isFinite(numeric)) return '0'
    return formatNumber(numeric, { maximumFractionDigits: 0 })
}
</script>

<style scoped>
.customer-list-tab {
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
    border: 1px solid var(--color-primary);
    background: var(--color-card);
    color: var(--color-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    text-decoration: none;
    transition: all var(--transition-base);
    cursor: pointer;
    min-width: auto;
    font-family: var(--font-family-sans);
}

.action-button:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
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
.customer-list-tab :global(.table) {
    margin-bottom: 0;
    border-collapse: separate;
    border-spacing: 0;
}

.customer-list-tab :global(.table thead th) {
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

.customer-list-tab :global(.table tbody td) {
    font-size: var(--font-size-base);
    padding: var(--spacing-3) var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    border-top: none;
    border-left: none;
    border-right: none;
    vertical-align: middle;
    font-family: var(--font-family-sans);
}

.customer-list-tab :global(.table tbody tr:hover) {
    background: var(--color-card-muted);
}

/* Badge - Chuẩn hóa */
.customer-list-tab :global(.badge) {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.bg-soft-primary {
    background: var(--color-soft-primary);
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    font-weight: var(--font-weight-medium);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

/* Buttons - Chuẩn hóa theo màu teal tiêu chuẩn */
.customer-list-tab :global(.btn-outline-primary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.customer-list-tab :global(.btn-outline-primary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.customer-list-tab :global(.btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.customer-list-tab :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
    border-color: var(--color-primary-dark);
}

@media (max-width: 768px) {
    .action-grid {
        flex-direction: column;
        width: 100%;
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

