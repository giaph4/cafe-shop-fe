<template>
  <div
    class="page-container container-fluid"
      
    style="background: var(--color-body-bg); padding: var(--spacing-4);"
  >
    <div class="orders-header">
      <div class="orders-header__content">
        <div class="orders-header__title-section">
          <h2 class="orders-header__title">
            Quản lý Đơn hàng
          </h2>
          <p class="orders-header__subtitle">
            Xem và quản lý tất cả đơn hàng, thanh toán và trạng thái của quán.
          </p>
        </div>
        <div class="orders-header__actions">
          <div class="form-check form-switch">
            <input
              id="autoRefreshSwitch"
              v-model="autoRefresh"
              class="form-check-input"
              type="checkbox"
              role="switch"
            >
            <label
              class="form-check-label"
              for="autoRefreshSwitch"
            > </label>
          </div>
          <button
            class="btn btn-outline-secondary"
            type="button"
            :disabled="loading"
            @click="fetchData"
          >
            <span
              v-if="loading"
              class="spinner-border spinner-border-sm me-2"
            />
            Làm mới
          </button>
          <button
            v-if="canExport"
            class="btn btn-primary"
            type="button"
            :disabled="loading || exporting"
            @click="handleExport"
          >
            <span
              v-if="exporting"
              class="spinner-border spinner-border-sm me-2"
            />
            <i
              v-else
              class="bi bi-download me-2"
            />
            Xuất Excel
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="activeTab === 'list' || activeTab === 'statistics'"
      class="card filter-card mb-4"
    >
      <div class="card-body">
        <!-- Basic Filters -->
        <div class="row g-3 align-items-end">
          <div class="col-lg-2 col-md-4 col-sm-6">
            <label class="form-label">Tìm kiếm ID</label>
            <input
              v-model="filters.orderId"
              type="text"
              class="form-control"
              placeholder="Nhập ID đơn hàng"
              @input="handleFilterChange"
            >
          </div>
          <div class="col-lg-2 col-md-4 col-sm-6">
            <label class="form-label">Trạng thái</label>
            <select
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
          <div class="col-lg-2 col-md-4 col-sm-6">
            <label class="form-label">Loại đơn</label>
            <select
              v-model="filters.orderType"
              class="form-select"
              @change="handleFilterChange"
            >
              <option value="">
                Tất cả
              </option>
              <option value="DINE_IN">
                Tại bàn
              </option>
              <option value="TAKEAWAY">
                Mang về
              </option>
            </select>
          </div>
          <div class="col-lg-2 col-md-4 col-sm-6">
            <label class="form-label">Nhân viên</label>
            <select
              v-model="filters.staffId"
              class="form-select"
              @change="handleFilterChange"
            >
              <option value="">
                Tất cả nhân viên
              </option>
              <option
                v-for="staff in staffList"
                :key="staff.id"
                :value="staff.id"
              >
                {{ staff.fullName || staff.username }}
              </option>
            </select>
          </div>
          <div class="col-lg-2 col-md-4 col-sm-6">
            <label class="form-label">Từ ngày</label>
            <input
              v-model="filters.startDate"
              type="date"
              class="form-control"
              @change="handleDateChange('startDate')"
            >
          </div>
          <div class="col-lg-2 col-md-4 col-sm-6">
            <label class="form-label">Đến ngày</label>
            <input
              v-model="filters.endDate"
              type="date"
              class="form-control"
              @change="handleDateChange('endDate')"
            >
          </div>
        </div>

        <!-- Advanced Filters (Collapsible) -->
        <div class="mt-3">
          <button
            class="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-2"
            type="button"
            @click="showAdvancedFilters = !showAdvancedFilters"
          >
            <i :class="showAdvancedFilters ? 'bi bi-chevron-down' : 'bi bi-chevron-right'" />
            <span class="fw-medium">Bộ lọc nâng cao</span>
          </button>

          <div
            v-show="showAdvancedFilters"
            class="mt-3 pt-3 border-top"
          >
            <div class="row g-3 align-items-end">
              <div class="col-lg-3 col-md-6">
                <label class="form-label">Giá từ (₫)</label>
                <input
                  v-model.number="filters.minAmount"
                  type="number"
                  class="form-control"
                  placeholder="0"
                  min="0"
                  @input="handleFilterChange"
                >
              </div>
              <div class="col-lg-3 col-md-6">
                <label class="form-label">Giá đến (₫)</label>
                <input
                  v-model.number="filters.maxAmount"
                  type="number"
                  class="form-control"
                  placeholder="Không giới hạn"
                  min="0"
                  @input="handleFilterChange"
                >
              </div>
              <div class="col-lg-3 col-md-6">
                <label class="form-label">Khách hàng</label>
                <select
                  v-model="filters.customerId"
                  class="form-select"
                  @change="handleFilterChange"
                >
                  <option value="">
                    Tất cả khách hàng
                  </option>
                  <option
                    v-for="customer in customerList"
                    :key="customer.id"
                    :value="customer.id"
                  >
                    {{ customer.name || customer.phone || `Khách hàng #${customer.id}` }}
                  </option>
                </select>
              </div>
              <div class="col-lg-3 col-md-6">
                <button
                  class="btn btn-outline-secondary w-100"
                  type="button"
                  :disabled="loading"
                  @click="resetFilters"
                >
                  <i class="bi bi-arrow-counterclockwise" /> Đặt lại
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card tabs-card mb-4">
      <div class="card-body">
        <div class="orders-tabs mb-3">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="orders-tab"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            <i :class="tab.icon" />
            <span>{{ tab.label }}</span>
          </button>
        </div>
        <LoadingState v-if="(loading || tableData.loading.value) && activeTab !== 'overview'" />
        <ErrorState
          v-else-if="(error || tableData.error.value) && activeTab !== 'overview'"
          :message="error || (tableData.error.value?.message || 'Không thể tải dữ liệu đơn hàng')"
          @retry="fetchData"
        />
        <div
          v-else
          class="tab-content"
        >
          <OrderOverviewTab
            v-if="activeTab === 'overview'"
            :orders="allOrders"
            :loading="loading"
          />
          <OrderListTab
            v-else-if="activeTab === 'list'"
            :orders="orders"
            :loading="tableData.loading.value"
            :error="tableData.error.value"
            :zero-based-page="zeroBasedPage"
            :total-pages="totalPages"
            :total-elements="totalElements"
            :can-export="canExport"
            :can-cancel="canCancel"
            :cancelling="cancelling"
            @view-detail="openModal"
            @update="handleUpdateOrder"
            @cancel="confirmCancel"
            @page-change="handlePageChange"
            @export="handleExport"
            @refresh="fetchData"
          />
          <OrderStatisticsTab
            v-else-if="activeTab === 'statistics'"
            :orders="allOrders"
            :loading="loading"
          />
        </div>
      </div>
    </div>

    <!-- Order Detail Modal -->
    <OrderDetailModal
      ref="orderDetailModal"
      :order-id="selectedOrderId"
    />

    <!-- Order Update Modal -->
    <OrderUpdateModal
      ref="orderUpdateModal"
      :order-id="selectedOrderId"
      :order="selectedOrder"
      @updated="handleOrderUpdated"
    />

    <!-- Cancel Order Modal -->
    <Teleport to="body">
      <div
        ref="cancelModalRef"
        class="modal fade"
        tabindex="-1"
        aria-labelledby="cancelOrderModalLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <div class="modal-header__content">
                <h5
                  id="cancelOrderModalLabel"
                  class="modal-title"
                >
                  Hủy đơn hàng
                </h5>
                <p class="modal-subtitle mb-0">
                  Hành động này không thể hoàn tác.
                </p>
              </div>
              <button
                type="button"
                class="btn-close"
                aria-label="Đóng"
                data-bs-dismiss="modal"
                @click="closeCancelModal"
              />
            </div>
            <div class="modal-body">
              <p class="mb-3">
                Bạn có chắc chắn muốn hủy đơn hàng này không?
              </p>
              <div class="delete-info-card">
                <div class="delete-info-item">
                  <span class="delete-info-label">Mã đơn:</span>
                  <span class="delete-info-value">#{{ cancelTarget?.id ?? '—' }}</span>
                </div>
                <div class="delete-info-item">
                  <span class="delete-info-label">Bàn:</span>
                  <span class="delete-info-value">{{ cancelTarget?.tableName || 'Mang về' }}</span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-secondary"
                :disabled="cancelling"
                @click="closeCancelModal"
              >
                Hủy
              </button>
              <button
                type="button"
                class="btn btn-danger"
                :disabled="cancelling"
                @click="confirmCancelOrder"
              >
                <span
                  v-if="cancelling"
                  class="spinner-border spinner-border-sm me-2"
                />
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { reactive, ref, watch, computed, onBeforeUnmount, onMounted } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue3-toastify'
import { storeToRefs } from 'pinia'
import { Modal } from 'bootstrap'
import * as orderService from '@/api/orderService'
import { exportOrdersToExcel } from '@/api/reportService'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import * as userService from '@/api/userService'
import * as customerService from '@/api/customerService'
import OrderDetailModal from '@/components/orders/OrderDetailModal.vue'
import OrderUpdateModal from '@/components/orders/OrderUpdateModal.vue'
import OrderOverviewTab from '@/components/orders/OrderOverviewTab.vue'
import OrderListTab from '@/components/orders/OrderListTab.vue'
import OrderStatisticsTab from '@/components/orders/OrderStatisticsTab.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { useTableData } from '@/composables/useTableData'
import { useAuthStore } from '@/store/auth'
import { useAsyncOperation } from '@/composables/useAsyncOperation'
import { handleApiError } from '@/composables/useErrorHandler'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import logger from '@/utils/logger'

const STATUS_METADATA = Object.freeze({
    PENDING: { value: 'PENDING', label: 'Đang chờ', badgeClass: 'status-pill--pending' },
    PAID: { value: 'PAID', label: 'Đã thanh toán', badgeClass: 'status-pill--paid' },
    CANCELLED: { value: 'CANCELLED', label: 'Đã hủy', badgeClass: 'status-pill--cancelled' },
    TRANSFERRED: { value: 'TRANSFERRED', label: 'Đã chuyển ca', badgeClass: 'status-pill--transferred' }
})

const STATUS_FILTER_OPTIONS = Object.values(STATUS_METADATA)

const router = useRouter()
const route = useRoute()

const authStore = useAuthStore()
const { isAdmin, isManager } = storeToRefs(authStore)

const canExport = computed(() => isAdmin.value || isManager.value)
const canCancel = computed(() => isAdmin.value || isManager.value)

const activeTab = ref('list')
const tabs = [
    { key: 'overview', label: 'Tổng quan', icon: 'bi bi-speedometer2' },
    { key: 'list', label: 'Danh sách', icon: 'bi bi-list-ul' },
    { key: 'statistics', label: 'Thống kê', icon: 'bi bi-graph-up' }
]

const autoRefresh = ref(false)
let autoRefreshInterval = null

const { loading, error, execute } = useAsyncOperation({ context: 'Orders' })

const orders = ref([])
const allOrders = ref([]) // Dùng cho thống kê
const selectedOrderId = ref(null)
const selectedOrder = ref(null)
const orderDetailModal = ref(null)
const orderUpdateModal = ref(null)
const cancelling = ref(false)
const exporting = ref(false)
const cancelTarget = ref(null)
const cancelModalRef = ref(null)
let cancelModalInstance = null

const filters = reactive({
    orderId: '',
    status: '',
    orderType: '',
    staffId: '',
    customerId: '',
    startDate: '',
    endDate: '',
    minAmount: null,
    maxAmount: null
})

const showAdvancedFilters = ref(false)
const staffList = ref([])
const customerList = ref([])

// Sử dụng useTableData cho phân trang và tìm kiếm
const tableData = useTableData({
    fetchFn: async (params) => {
        // Đảm bảo page và size là số hợp lệ
        const page = typeof params.page === 'number' ? params.page : (parseInt(params.page, 10) || 0)
        const size = typeof params.size === 'number' ? params.size : (parseInt(params.size, 10) || 10)

        console.log('[Orders] Fetching với params:', { page, size, filters })

        const hasStatus = Boolean(filters.status)
        const hasDateRange = Boolean(filters.startDate) && Boolean(filters.endDate)

        let response
        if (hasStatus) {
            response = await orderService.getOrdersByStatus(filters.status, page, size)
        } else if (hasDateRange) {
            response = await orderService.getOrdersByDateRange(
                filters.startDate,
                filters.endDate,
                page,
                size,
                { useFallback: true }
            )
            // Nếu response có flag _fallback, hiển thị warning
            if (response?._fallback) {
                toast.warn('Không thể lọc theo khoảng ngày từ server, đã sử dụng bộ lọc phía client.', {
                    autoClose: 4000
                })
            }
        } else {
            response = await orderService.getOrders(page, size)
        }

        console.log('[Orders] Response nhận được:', {
            page: response?.number,
            size: response?.size,
            totalPages: response?.totalPages,
            totalElements: response?.totalElements,
            contentLength: response?.content?.length
        })

        // KHÔNG apply client-side filters ở đây vì nó sẽ làm sai pagination
        // Client-side filters sẽ được apply sau khi nhận data
        return response
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
const currentPage = computed(() => tableData.currentPage?.value ?? 1)
const pageSize = computed(() => tableData.pageSize?.value ?? 10)
const totalPages = computed(() => tableData.totalPages?.value ?? 0)
const totalElements = computed(() => tableData.totalElements?.value ?? 0)
const setPageFromZero = (page) => tableData.setPage(page)
const updatePageSize = (size) => tableData.setPageSize(size)
const updateFromResponse = ({ page, totalPages: total, totalElements: totalItems }) => {
    if (typeof total === 'number') {
        tableData.totalPages.value = total
    }
    if (typeof totalItems === 'number') {
        tableData.totalElements.value = totalItems
    }
    if (typeof page === 'number') {
        tableData.setPage(page)
    }
}

const fetchData = async (fetchAll = false) => {
    if (activeTab.value === 'overview' || (activeTab.value === 'statistics' && fetchAll)) {
        await fetchAllOrders()
    } else if (activeTab.value === 'list') {
        await fetchOrders()
    }
}

const fetchAllOrders = async () => {
    await execute(async () => {
        // Lấy tất cả đơn hàng cho thống kê (với giới hạn hợp lý)
        let allData = []
        let page = 0
        const size = 100
        let hasMore = true
        let usedFallback = false

        while (hasMore && page < 10) { // Limit to 1000 orders max
            let response
            const hasStatus = Boolean(filters.status)
            const hasDateRange = Boolean(filters.startDate) && Boolean(filters.endDate)

            if (hasStatus) {
                response = await orderService.getOrdersByStatus(filters.status, page, size)
            } else if (hasDateRange) {
                response = await orderService.getOrdersByDateRange(
                    filters.startDate,
                    filters.endDate,
                    page,
                    size,
                    { useFallback: true } // Cho phép fallback
                )

                // Track nếu đã dùng fallback
                if (response?._fallback) {
                    usedFallback = true
                }
            } else {
                response = await orderService.getOrders(page, size)
            }

            const content = response?.content ?? []
            allData = [...allData, ...content]
            hasMore = !response?.last
            page++
        }

        // Apply client-side filters
        const filteredData = applyClientSideFilters(allData)

        allOrders.value = filteredData

        // Hiển thị warning nếu đã dùng fallback
        if (usedFallback) {
            toast.warn('Không thể lọc theo khoảng ngày từ server, đã sử dụng bộ lọc phía client.', {
                autoClose: 4000
            })
        }
    }, 'Không thể tải dữ liệu đơn hàng.', {
        onError: () => {
            allOrders.value = []
        }
    })
}

const fetchOrders = async () => {
    // Sử dụng useTableData để fetch
    await tableData.fetchData()
    // Apply client-side filters sau khi nhận data từ server
    const rawOrders = tableData.data.value || []
    orders.value = applyClientSideFilters(rawOrders)
    loading.value = tableData.loading.value
    error.value = tableData.error.value?.message || null
}

// Apply client-side filters
const applyClientSideFilters = (orderList) => {
    let result = [...orderList]

    // Filter by order ID
    if (filters.orderId && filters.orderId.trim()) {
        const orderIdStr = String(filters.orderId).trim()
        result = result.filter(order =>
            String(order.id).includes(orderIdStr)
        )
    }

    // Filter by order type
    if (filters.orderType) {
        result = result.filter(order => {
            // Check if order has tableId (DINE_IN) or not (TAKEAWAY)
            if (filters.orderType === 'DINE_IN') {
                return order.tableId !== null && order.tableId !== undefined
            } else if (filters.orderType === 'TAKEAWAY') {
                return order.tableId === null || order.tableId === undefined
            }
            return true
        })
    }

    // Filter by staff
    if (filters.staffId) {
        result = result.filter(order =>
            order.staffId === filters.staffId || order.staff?.id === filters.staffId
        )
    }

    // Filter by customer
    if (filters.customerId) {
        result = result.filter(order =>
            order.customerId === filters.customerId || order.customer?.id === filters.customerId
        )
    }

    // Filter by amount range
    if (filters.minAmount !== null && filters.minAmount > 0) {
        result = result.filter(order => {
            const total = order.totalAmount || order.total || 0
            return total >= filters.minAmount
        })
    }

    if (filters.maxAmount !== null && filters.maxAmount > 0) {
        result = result.filter(order => {
            const total = order.totalAmount || order.total || 0
            return total <= filters.maxAmount
        })
    }

    return result
}

const openModal = (orderId) => {
    selectedOrderId.value = orderId
    orderDetailModal.value.show()
}

const handlePageChange = (page) => {
    setPageFromZero(page)
}

const handleStatusChange = () => {
    if (filters.status) {
        filters.startDate = ''
        filters.endDate = ''
    }
    tableData.setPage(0)
    tableData.fetchData()
}

const handleDateChange = (field) => {
    if (filters.status) {
        filters.status = ''
    }

    const hasBothDates = Boolean(filters.startDate) && Boolean(filters.endDate)
    const hasNoDate = !filters.startDate && !filters.endDate

    if (hasBothDates) {
        const start = new Date(filters.startDate)
        const end = new Date(filters.endDate)
        if (start > end) {
            toast.error('Ngày bắt đầu không được lớn hơn ngày kết thúc.', { autoClose: 3000 })
            return
        }
        tableData.setPage(0)
        tableData.fetchData()
        return
    }

    if (hasNoDate) {
        tableData.setPage(0)
        tableData.fetchData()
    }
}

const resetFilters = () => {
    filters.orderId = ''
    filters.status = ''
    filters.orderType = ''
    filters.staffId = ''
    filters.customerId = ''
    filters.startDate = ''
    filters.endDate = ''
    filters.minAmount = null
    filters.maxAmount = null
    tableData.setPage(0)
    tableData.fetchData()
}

const handleFilterChange = () => {
    if (zeroBasedPage.value !== 0) {
        setPageFromZero(0)
    } else {
        fetchData()
    }
}

// Lấy danh sách nhân viên
const fetchStaffList = async () => {
    try {
        const response = await userService.getUsers({ page: 0, size: 100, sort: 'fullName,asc' })
        const users = response?.content || response?.items || []
        staffList.value = users.filter(u =>
            u.roles?.some(r => r.name === 'ROLE_STAFF' || r === 'ROLE_STAFF')
        )
    } catch (err) {
        logger.error('Failed to fetch staff list:', err)
        staffList.value = []
    }
}

// Lấy danh sách khách hàng
const fetchCustomerList = async () => {
    try {
        const response = await customerService.getCustomers({ page: 0, size: 100 })
        customerList.value = response?.content || []
    } catch (err) {
        logger.error('Failed to fetch customer list:', err)
        customerList.value = []
    }
}

const handleExport = async () => {
    if (exporting.value) return
    try {
        exporting.value = true
        const startDate = filters.startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
        const endDate = filters.endDate || new Date().toISOString().split('T')[0]
        const blob = await exportOrdersToExcel(startDate, endDate)
        const url = URL.createObjectURL(new Blob([blob]))
        const link = document.createElement('a')
        link.href = url
        link.download = `Orders_${startDate}_to_${endDate}.xlsx`
        link.click()
        URL.revokeObjectURL(url)
        toast.success('Xuất đơn hàng thành công!')
    } catch (err) {
        handleApiError(err, {
            context: 'Orders',
            fallbackMessage: 'Xuất đơn hàng thất bại.'
        })
    } finally {
        exporting.value = false
    }
}

const confirmCancel = (order) => {
    if (!canCancel.value || !order) return
    cancelTarget.value = order
    if (cancelModalInstance) {
        cancelModalInstance.show()
    }
}

const closeCancelModal = () => {
    if (cancelModalInstance) {
        cancelModalInstance.hide()
    }
    cancelTarget.value = null
}

const confirmCancelOrder = async () => {
    if (!cancelTarget.value || cancelling.value) return
    const orderId = cancelTarget.value.id
    cancelling.value = true
    try {
        await execute(async () => {
            await orderService.cancelOrder(orderId)
            toast.success('Đã hủy đơn hàng thành công.')
            closeCancelModal()
            await fetchData()
        }, 'Không thể hủy đơn hàng.')
    } finally {
        cancelling.value = false
    }
}

const handleCancel = async (orderId) => {
    if (cancelling.value) return
    cancelling.value = true
    try {
        await execute(async () => {
            await orderService.cancelOrder(orderId)
            toast.success('Đã hủy đơn hàng thành công.')
            await fetchData()
        }, 'Không thể hủy đơn hàng.')
    } finally {
        cancelling.value = false
    }
}

const handleUpdateOrder = (order) => {
    if (!order || !canCancel.value) return
    selectedOrderId.value = order.id
    selectedOrder.value = order
    orderUpdateModal.value?.show()
}

const handleOrderUpdated = async () => {
    await fetchData()
}

watch(
    () => activeTab.value,
    (newTab) => {
        if (newTab === 'overview' || newTab === 'statistics') {
            fetchData(true)
        } else if (newTab === 'list') {
            fetchData(false)
        }
    },
    { immediate: true }
)

// Watch được xử lý tự động bởi useTableData, không cần watch thủ công

watch(autoRefresh, (enabled) => {
    if (enabled) {
        // Auto refresh every 30 seconds
        autoRefreshInterval = setInterval(() => {
            fetchData()
        }, 30000)
    } else {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval)
            autoRefreshInterval = null
        }
    }
})

// Lấy danh sách nhân viên và khách hàng khi mount
// Thiết lập phím tắt
const filterInputRef = ref(null)

useKeyboardShortcuts({
    page: 'orders',
    shortcuts: {
        'new-order': {
            handler: () => {
                router.push('/pos')
            }
        },
        'focus-filter': {
            handler: () => {
                // Focus vào filter input đầu tiên
                const filterInput = document.querySelector('.filter-card input[type="text"]')
                if (filterInput) {
                    filterInput.focus()
                }
            }
        }
    }
})

onMounted(() => {
    fetchStaffList()
    fetchCustomerList()
    // Khởi tạo modal hủy đơn
    if (cancelModalRef.value) {
        cancelModalInstance = new Modal(cancelModalRef.value)
    }
})

onBeforeUnmount(() => {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval)
    }
})
</script>

<style scoped>
/* Header - Chuẩn hóa theo base.css */
.orders-header {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    margin-bottom: var(--spacing-5);
}

.orders-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
}

.orders-header__title-section {
    flex: 1;
    min-width: 0;
}

.orders-header__title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.orders-header__subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-weight: var(--font-weight-normal);
    font-family: var(--font-family-sans);
}

.orders-header__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    flex-wrap: wrap;
    justify-content: flex-end;
}

.orders-header__actions .form-check {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    margin-bottom: 0;
}

.orders-header__actions .form-check-label {
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    white-space: nowrap;
}

/* Tabs - Chuẩn hóa theo base.css */
.orders-tabs {
    display: flex;
    gap: var(--spacing-2);
    background: var(--color-card-muted);
    padding: var(--spacing-2);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    overflow-x: auto;
}

.orders-tab {
    border: none;
    background: transparent;
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.orders-tab i {
    font-size: 18px;
    line-height: 1;
}

.orders-tab:hover:not(.active) {
    background: var(--color-card);
    color: var(--color-heading);
}

.orders-tab.active {
    background: var(--color-primary);
    color: var(--color-text-inverse);
}

/* Delete info card trong modal */
.delete-info-card {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.delete-info-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-3);
}

.delete-info-label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    flex-shrink: 0;
    min-width: 120px;
    font-family: var(--font-family-sans);
}

.delete-info-value {
    font-size: var(--font-size-base);
    color: var(--color-heading);
    text-align: right;
    word-break: break-word;
    font-family: var(--font-family-sans);
}

/* Filter Card - Chuẩn hóa */
.filter-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.filter-card .form-label {
    font-family: var(--font-family-sans);
    color: var(--color-heading);
    font-weight: var(--font-weight-medium);
}

.filter-card .form-control,
.filter-card .form-select {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    font-family: var(--font-family-sans);
}

.filter-card .form-control:focus,
.filter-card .form-select:focus {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.filter-card .btn-link {
    color: var(--color-text-p);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    transition: all var(--transition-base);
}

.filter-card .btn-link:hover {
    color: var(--color-text-inverse);
    text-decoration: underline;
}

.filter-card .btn-link i {
    font-size: 16px;
    line-height: 1;
}

/* Tabs Card - Chuẩn hóa */
.tabs-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

@media (max-width: 768px) {
    .orders-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .orders-header__actions {
        width: 100%;
        justify-content: flex-start;
    }

    .orders-tabs {
        gap: var(--spacing-1);
    }

    .orders-tab {
        padding: var(--spacing-2) var(--spacing-3);
        font-size: var(--font-size-base);
    }
}
</style>
