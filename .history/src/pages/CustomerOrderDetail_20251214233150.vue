<template>
  <div
    class="customer-order-detail-page container-fluid"
      
  >
    <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-4">
      <div>
        <h2 class="text-primary mb-1">
          Lịch sử mua hàng
        </h2>
        <p class="text-muted mb-0">
          Theo dõi lịch sử đơn hàng và doanh thu theo từng khách hàng.
        </p>
      </div>
      <div
        v-if="summary.customerName || summary.customerPhone"
        class="text-md-end"
      >
        <div class="fw-semibold">
          {{ summary.customerName || 'Khách hàng' }}
        </div>
        <div class="text-muted small">
          {{ summary.customerPhone || '' }}
        </div>
      </div>
    </div>

    <div class="card shadow-sm border-0 mb-4">
      <div class="card-body">
        <div class="row gy-3 gx-3 align-items-end">
          <div class="col-12 col-sm-6 col-lg-3">
            <label
              for="history-status-filter"
              class="form-label text-muted small fw-semibold"
            >Trạng thái</label>
            <select
              id="history-status-filter"
              v-model="filters.status"
              class="form-select"
              @change="handleStatusChange"
            >
              <option value="">
                Tất cả trạng thái
              </option>
              <option
                v-for="option in STATUS_FILTER_OPTIONS"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>
          <div class="col-12 col-sm-6 col-lg-3">
            <label
              for="history-start-date"
              class="form-label text-muted small fw-semibold"
            >Ngày bắt đầu</label>
            <input
              id="history-start-date"
              v-model="filters.startDate"
              type="date"
              class="form-control"
              @change="handleDateChange('startDate')"
            >
          </div>
          <div class="col-12 col-sm-6 col-lg-3">
            <label
              for="history-end-date"
              class="form-label text-muted small fw-semibold"
            >Ngày kết thúc</label>
            <input
              id="history-end-date"
              v-model="filters.endDate"
              type="date"
              class="form-control"
              @change="handleDateChange('endDate')"
            >
          </div>
          <div class="col-12 col-sm-6 col-lg-3 d-flex gap-2 justify-content-sm-end">
            <button
              class="btn btn-primary flex-fill flex-sm-grow-0"
              type="button"
              @click="triggerFetchFromFilterChange"
            >
              Áp dụng
            </button>
            <button
              class="btn btn-outline-secondary flex-fill flex-sm-grow-0"
              type="button"
              :disabled="!canResetFilters"
              @click="resetFilters"
            >
              Đặt lại
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="card shadow-sm border-0">
      <div class="card-body p-0">
        <LoadingState
          v-if="loading"
          text="Đang tải lịch sử mua hàng..."
        />
        <ErrorState
          v-else-if="error"
          :message="error"
          :show-retry="true"
          :retry-handler="() => tableData.fetchData()"
        />
        <div v-else>
          <div class="history-summary border-bottom px-3 px-md-4 py-3">
            <div class="row g-3">
              <div class="col-6 col-md-3">
                <div class="text-muted small text-uppercase mb-1">
                  Số đơn
                </div>
                <div class="fs-5 fw-semibold">
                  {{ summary.totalOrders }}
                </div>
              </div>
              <div class="col-6 col-md-3">
                <div class="text-muted small text-uppercase mb-1">
                  Tổng chi tiêu
                </div>
                <div class="fs-5 fw-semibold">
                  {{ formatCurrencySafe(summary.totalAmount) }}
                </div>
              </div>
              <div class="col-6 col-md-3">
                <div class="text-muted small text-uppercase mb-1">
                  Giá trị TB/đơn
                </div>
                <div class="fs-5 fw-semibold">
                  {{ formatCurrencySafe(summary.averageOrderValue) }}
                </div>
              </div>
              <div class="col-6 col-md-3">
                <div class="text-muted small text-uppercase mb-1">
                  Đơn gần nhất
                </div>
                <div class="fs-6">
                  {{ formatDate(summary.lastPurchaseDate) }}
                </div>
              </div>
            </div>
          </div>

          <EmptyState
            v-if="!orders.length"
            title="Chưa có đơn hàng"
            message="Khách hàng chưa có đơn hàng nào trong khoảng thời gian đã chọn."
          >
            <template #icon>
              <i class="bi bi-receipt-cutoff" />
            </template>
          </EmptyState>
          <div
            v-else
            class="table-responsive"
          >
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="text-uppercase small text-muted">
                    Mã đơn
                  </th>
                  <th class="text-uppercase small text-muted">
                    Ngày tạo
                  </th>
                  <th class="text-uppercase small text-muted d-none d-lg-table-cell">
                    Thanh toán
                  </th>
                  <th class="text-uppercase small text-muted">
                    Trạng thái
                  </th>
                  <th class="text-uppercase small text-muted d-none d-md-table-cell">
                    Bàn
                  </th>
                  <th class="text-uppercase small text-muted d-none d-md-table-cell">
                    Nhân viên
                  </th>
                  <th class="text-uppercase small text-muted text-end">
                    Tạm tính
                  </th>
                  <th class="text-uppercase small text-muted text-end d-none d-lg-table-cell">
                    Giảm giá
                  </th>
                  <th class="text-uppercase small text-muted text-end">
                    Thành tiền
                  </th>
                  <th class="text-uppercase small text-muted text-center">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="order in orders"
                  :key="order.orderId"
                >
                  <td class="fw-semibold">
                    #{{ order.orderId }}
                  </td>
                  <td>{{ formatDate(order.createdAt) }}</td>
                  <td class="d-none d-lg-table-cell">
                    {{ formatDate(order.paidAt) }}
                  </td>
                  <td>
                    <span :class="['status-pill', getStatusClass(order.status)]">
                      {{ getStatusLabel(order.status) }}
                    </span>
                  </td>
                  <td class="d-none d-md-table-cell">
                    {{ order.tableName || '—' }}
                  </td>
                  <td class="d-none d-md-table-cell">
                    {{ order.staffUsername || '—' }}
                  </td>
                  <td class="text-end">
                    {{ formatCurrencySafe(order.subTotal) }}
                  </td>
                  <td class="text-end d-none d-lg-table-cell">
                    {{ formatCurrencySafe(order.discountAmount) }}
                  </td>
                  <td class="text-end fw-semibold">
                    {{ formatCurrencySafe(order.totalAmount) }}
                  </td>
                  <td class="text-center">
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-secondary"
                      @click="openOrderDetail(order.orderId)"
                    >
                      Xem
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div
        v-if="(totalPages > 1 || pageSize) && orders.length > 0"
        class="d-flex justify-content-between align-items-center mt-3 px-3 px-md-4 py-3"
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
            @change="handlePageSizeChange(parseInt($event.target.value, 10))"
          >
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="30">30</option>
            <option :value="50">50</option>
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
        <Pagination
          v-if="totalPages > 1"
          mode="zero-based"
          :current-page="zeroBasedPage"
          :total-pages="totalPages"
          @page-change="handlePageChange"
        />
      </div>
    </div>

    <OrderDetailModal
      ref="orderDetailModal"
      :order-id="selectedOrderId"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue3-toastify'

import Pagination from '@/components/common/Pagination.vue'
import OrderDetailModal from '@/components/orders/OrderDetailModal.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useTableData } from '@/composables/useTableData'
import { getCustomerPurchaseHistory } from '@/api/customerService'
import { formatCurrency, formatDateTime } from '@/utils/formatters'

const route = useRoute()

const error = ref('')

const customerId = computed(() => {
    const raw = route.params.id
    const numeric = Number(raw)
    return Number.isFinite(numeric) ? numeric : null
})

const summary = reactive({
    customerName: '',
    customerPhone: '',
    totalOrders: 0,
    totalAmount: 0,
    averageOrderValue: 0,
    lastPurchaseDate: null
})

const filters = reactive({
    status: '',
    startDate: '',
    endDate: ''
})

// Sử dụng useTableData cho phân trang
const tableData = useTableData({
    fetchFn: async (params) => {
        if (!customerId.value) {
            return { content: [], totalPages: 0, totalElements: 0 }
        }
        const response = await getCustomerPurchaseHistory({
            id: customerId.value,
            startDate: filters.startDate || undefined,
            endDate: filters.endDate || undefined,
            status: filters.status || undefined,
            page: params.page,
            size: params.size
        })
        
        // Cập nhật summary từ response
        if (response) {
            summary.customerName = response?.customerName || ''
            summary.customerPhone = response?.customerPhone || ''
            summary.totalOrders = Number(response?.totalOrders) || 0
            summary.totalAmount = Number(response?.totalAmount) || 0
            summary.averageOrderValue = Number(response?.averageOrderValue) || 0
            summary.lastPurchaseDate = response?.lastPurchaseDate || null
        }
        
        // API có thể trả về orders thay vì content
        // Chuẩn hóa về format Spring Boot Pageable
        if (response?.orders && Array.isArray(response.orders)) {
            return {
                ...response,
                content: response.orders,
                totalPages: response.totalPages || 0,
                totalElements: response.totalElements || response.orders.length
            }
        }
        
        return response
    },
    initialFilters: {
        status: '',
        startDate: '',
        endDate: ''
    },
    initialPageSize: 10,
    debounceMs: 300,
    syncUrl: true,
    pageParam: 'page',
    sizeParam: 'size',
    zeroBasedPage: true
})

// Expose pagination properties
const zeroBasedPage = computed(() => tableData.zeroBasedPage?.value ?? 0)
const pageSize = computed(() => tableData.pageSize?.value ?? 10)
const totalPages = computed(() => tableData.totalPages?.value ?? 0)
const totalElements = computed(() => tableData.totalElements?.value ?? 0)

// Đồng bộ filters với tableData
watch(
    filters,
    () => {
        tableData.setFilters({
            status: filters.status,
            startDate: filters.startDate,
            endDate: filters.endDate
        })
    },
    { deep: true }
)

// Đồng bộ tableData.filters với filters (khi sync từ URL)
watch(
    () => tableData.filters.value,
    (newFilters) => {
        if (newFilters) {
            filters.status = newFilters.status || ''
            filters.startDate = newFilters.startDate || ''
            filters.endDate = newFilters.endDate || ''
        }
    },
    { deep: true, immediate: true }
)

// Lấy orders từ tableData (đã được chuẩn hóa trong fetchFn)
const orders = computed(() => {
    const data = tableData.data.value || []
    return Array.isArray(data) ? data : []
})

const orderDetailModal = ref(null)
const selectedOrderId = ref(null)

const STATUS_METADATA = Object.freeze({
    PENDING: { value: 'PENDING', label: 'Đang chờ', badgeClass: 'status-pill--pending' },
    PAID: { value: 'PAID', label: 'Đã thanh toán', badgeClass: 'status-pill--paid' },
    CANCELLED: { value: 'CANCELLED', label: 'Đã hủy', badgeClass: 'status-pill--cancelled' },
    TRANSFERRED: { value: 'TRANSFERRED', label: 'Đã chuyển ca', badgeClass: 'status-pill--transferred' }
})

const STATUS_FILTER_OPTIONS = Object.values(STATUS_METADATA)

const canResetFilters = computed(() => Boolean(filters.status) || Boolean(filters.startDate) || Boolean(filters.endDate))

const formatCurrencySafe = (value) => {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return '—'
    return formatCurrency(numeric)
}

const formatDate = (value) => {
    if (!value) return '—'
    return formatDateTime(value)
}

const resolveStatus = (status) => {
    if (!status) {
        return { label: 'Không xác định', badgeClass: 'status-pill--default' }
    }
    return STATUS_METADATA[status] || { label: status, badgeClass: 'status-pill--default' }
}

const getStatusLabel = (status) => resolveStatus(status).label

const getStatusClass = (status) => resolveStatus(status).badgeClass

// fetchHistory được xử lý tự động bởi useTableData
// Chỉ cần cập nhật loading và error từ tableData
const loading = computed(() => tableData.loading.value)
const error = computed(() => {
    const err = tableData.error.value
    if (!err) return ''
    if (typeof err === 'object' && err.message) return err.message
    if (typeof err === 'string') return err
    return 'Không thể tải lịch sử mua hàng. Vui lòng thử lại.'
})

const triggerFetchFromFilterChange = () => {
    tableData.setPage(0) // Reset về trang đầu
    tableData.fetchData() // Tự động fetch với filters mới
}

const handleStatusChange = () => {
    if (filters.status) {
        filters.startDate = ''
        filters.endDate = ''
    }
    triggerFetchFromFilterChange()
}

const handleDateChange = (field) => {
    if (filters.startDate || filters.endDate) {
        filters.status = ''
    }

    const hasBothDates = Boolean(filters.startDate) && Boolean(filters.endDate)
    const hasNoDate = !filters.startDate && !filters.endDate

    if (hasBothDates) {
        const start = new Date(filters.startDate)
        const end = new Date(filters.endDate)
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            toast.error('Ngày lọc không hợp lệ.', { autoClose: 3000 })
            return
        }
        if (start > end) {
            toast.error('Ngày bắt đầu không được lớn hơn ngày kết thúc.', { autoClose: 3000 })
            return
        }
        triggerFetchFromFilterChange()
        return
    }

    if (hasNoDate) {
        triggerFetchFromFilterChange()
    }
}

const resetFilters = () => {
    filters.status = ''
    filters.startDate = ''
    filters.endDate = ''
    tableData.resetFilters()
    tableData.setPage(0)
    tableData.fetchData()
}

const handlePageChange = (page) => {
    tableData.setPage(page)
}

const handlePageSizeChange = (size) => {
    tableData.setPageSize(size)
    tableData.setPage(0) // Reset về trang đầu khi đổi pageSize
}

const openOrderDetail = (orderId) => {
    if (!orderId) return
    selectedOrderId.value = orderId
    orderDetailModal.value?.show()
}

onMounted(() => {
    if (customerId.value) {
        tableData.fetchData()
    }
})

watch(
    () => route.params.id,
    (next, prev) => {
        if (next !== prev && customerId.value) {
            tableData.setPage(0)
            tableData.fetchData()
        }
    }
)

// Watch customerId để fetch khi thay đổi
watch(
    () => customerId.value,
    (newId) => {
        if (newId) {
            tableData.setPage(0)
            tableData.fetchData()
        }
    },
    { immediate: true }
)
</script>

<style scoped>
.customer-order-detail-page {
    padding-bottom: 3rem;
}

.history-summary {
    background-color: var(--color-card, #ffffff);
}

.status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.status-pill--pending {
    background: rgba(250, 204, 21, 0.18);
    color: #b45309;
}

.status-pill--paid {
    background: rgba(34, 197, 94, 0.18);
    color: #15803d;
}

.status-pill--cancelled {
    background: rgba(239, 68, 68, 0.18);
    color: #b91c1c;
}

.status-pill--transferred {
    background: rgba(129, 140, 248, 0.18);
    color: #4338ca;
}

.status-pill--default {
    background: rgba(148, 163, 184, 0.18);
    color: #475569;
}

@media (max-width: 576px) {
    .table-responsive {
        border-radius: var(--radius-md, 1rem);
    }

    .table tbody td {
        white-space: nowrap;
    }
}
</style>

