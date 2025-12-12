<template>
  <div
    class="customer-order-detail-page container-fluid"
    data-aos="fade-up"
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
        <div
          v-if="loading"
          class="text-center py-5"
        >
          <div
            class="spinner-border text-primary"
            role="status"
          >
            <span class="visually-hidden">Đang tải...</span>
          </div>
        </div>
        <div
          v-else-if="error"
          class="alert alert-warning m-3 mb-0"
        >
          {{ error }}
        </div>
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

          <div
            v-if="!orders.length"
            class="py-5 text-center text-muted"
          >
            <i class="bi bi-receipt-cutoff fs-1 mb-3 d-block" />
            <p class="mb-0">
              Khách hàng chưa có đơn hàng nào trong khoảng thời gian đã chọn.
            </p>
          </div>
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
        v-if="orders.length && pagination.totalPages > 1"
        class="card-footer bg-white py-3"
      >
        <Pagination
          mode="zero-based"
          :current-page="pagination.page"
          :total-pages="pagination.totalPages"
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
import { getCustomerPurchaseHistory } from '@/api/customerService'
import { formatCurrency, formatDateTime } from '@/utils/formatters'

const route = useRoute()

const loading = ref(false)
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

const pagination = reactive({
    page: 0,
    size: 10,
    totalPages: 0,
    totalElements: 0
})

const orders = ref([])

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

const fetchHistory = async () => {
    if (!customerId.value) {
        error.value = 'Thiếu thông tin khách hàng để tải lịch sử mua hàng.'
        orders.value = []
        return
    }

    loading.value = true
    error.value = ''

    try {
        const response = await getCustomerPurchaseHistory({
            id: customerId.value,
            startDate: filters.startDate || undefined,
            endDate: filters.endDate || undefined,
            status: filters.status || undefined,
            page: pagination.page,
            size: pagination.size
        })

        summary.customerName = response?.customerName || ''
        summary.customerPhone = response?.customerPhone || ''
        summary.totalOrders = Number(response?.totalOrders) || 0
        summary.totalAmount = Number(response?.totalAmount) || 0
        summary.averageOrderValue = Number(response?.averageOrderValue) || 0
        summary.lastPurchaseDate = response?.lastPurchaseDate || null

        const list = Array.isArray(response?.orders) ? response.orders : []
        orders.value = list

        pagination.page = Number(response?.page) || 0
        pagination.size = Number(response?.size) || pagination.size
        pagination.totalPages = Number(response?.totalPages) || 0
        pagination.totalElements = Number(response?.totalElements) || 0
    } catch (err) {
        error.value = err?.response?.data?.message || 'Không thể tải lịch sử mua hàng. Vui lòng thử lại.'
        orders.value = []
        summary.customerName = ''
        summary.customerPhone = ''
        summary.totalOrders = 0
        summary.totalAmount = 0
        summary.averageOrderValue = 0
        summary.lastPurchaseDate = null
    } finally {
        loading.value = false
    }
}

const triggerFetchFromFilterChange = () => {
    if (pagination.page !== 0) {
        pagination.page = 0
    }
    fetchHistory()
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
    triggerFetchFromFilterChange()
}

const handlePageChange = (page) => {
    pagination.page = page
    fetchHistory()
}

const openOrderDetail = (orderId) => {
    if (!orderId) return
    selectedOrderId.value = orderId
    orderDetailModal.value?.show()
}

onMounted(() => {
    fetchHistory()
})

watch(
    () => route.params.id,
    (next, prev) => {
        if (next !== prev) {
            pagination.page = 0
            fetchHistory()
        }
    }
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
