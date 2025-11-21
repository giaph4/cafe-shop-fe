<template>
    <div class="container-fluid" data-aos="fade-up">
        <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-4">
            <h2 class="text-primary mb-0">Quản lý Đơn hàng</h2>
            <span class="text-muted small">Theo dõi đơn hàng, thanh toán và trạng thái vận hành</span>
        </div>

        <!-- Filters -->
        <div class="card shadow-sm border-0 mb-4">
            <div class="card-body">
                <div class="row gy-3 gx-3 align-items-end">
                    <div class="col-12 col-sm-6 col-lg-3">
                        <label for="order-status-filter" class="form-label text-muted small fw-semibold">Trạng thái</label>
                        <select id="order-status-filter" class="form-select" v-model="filters.status" @change="handleStatusChange">
                            <option value="">Tất cả trạng thái</option>
                            <option v-for="option in STATUS_FILTER_OPTIONS" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                    <div class="col-12 col-sm-6 col-lg-3">
                        <label for="order-start-date" class="form-label text-muted small fw-semibold">Ngày bắt đầu</label>
                        <input id="order-start-date" type="date" class="form-control" v-model="filters.startDate" @change="handleDateChange('startDate')">
                    </div>
                    <div class="col-12 col-sm-6 col-lg-3">
                        <label for="order-end-date" class="form-label text-muted small fw-semibold">Ngày kết thúc</label>
                        <input id="order-end-date" type="date" class="form-control" v-model="filters.endDate" @change="handleDateChange('endDate')">
                    </div>
                    <div class="col-12 col-sm-6 col-lg-3 d-flex gap-2 justify-content-sm-end">
                        <button class="btn btn-primary flex-fill flex-sm-grow-0" type="button" @click="triggerFetchFromFilterChange">Áp dụng</button>
                        <button
                            class="btn btn-outline-secondary flex-fill flex-sm-grow-0"
                            type="button"
                            :disabled="!canResetFilters"
                            @click="resetFilters"
                        >Đặt lại</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Orders Table -->
        <div class="card shadow-sm border-0">
            <div class="card-body p-0">
                <div v-if="loading" class="text-center">
                    <div class="spinner-border text-primary" role="status"></div>
                </div>
                <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
                <div v-else>
                    <div v-if="orders.length === 0" class="py-5 text-center text-muted">
                        <i class="bi bi-receipt-cutoff fs-1 mb-3 d-block"></i>
                        <p class="mb-0">Không có đơn hàng nào phù hợp bộ lọc hiện tại.</p>
                    </div>
                    <div v-else class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="bg-light">
                                <tr>
                                    <th class="text-uppercase small text-muted">ID</th>
                                    <th class="text-uppercase small text-muted">Bàn</th>
                                    <th class="text-uppercase small text-muted">Nhân viên</th>
                                    <th class="text-uppercase small text-muted d-none d-md-table-cell">Khách hàng</th>
                                    <th class="text-uppercase small text-muted">Tổng tiền</th>
                                    <th class="text-uppercase small text-muted">Trạng thái</th>
                                    <th class="text-uppercase small text-muted d-none d-lg-table-cell">Ngày tạo</th>
                                    <th class="text-uppercase small text-muted text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="order in orders" :key="order.id">
                                    <td class="fw-semibold">#{{ order.id }}</td>
                                    <td>{{ order.tableName }}</td>
                                    <td>{{ order.staffUsername }}</td>
                                    <td class="d-none d-md-table-cell">{{ order.customerName || 'Khách lẻ' }}</td>
                                    <td class="fw-semibold">{{ formatCurrencySafe(order.totalAmount) }}</td>
                                    <td>
                                        <span :class="['status-pill', getStatusClass(order.status)]">
                                            {{ getStatusLabel(order.status) }}
                                        </span>
                                    </td>
                                    <td class="d-none d-lg-table-cell">{{ formatDateTime(order.createdAt) }}</td>
                                    <td class="text-center">
                                        <button class="btn btn-sm btn-outline-info" @click="openModal(order.id)">Xem</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="card-footer bg-white py-3" v-if="orders.length > 0 && totalPages > 1">
                <Pagination
                    :total-pages="totalPages"
                    :current-page="currentPage"
                    mode="zero-based"
                    @page-change="handlePageChange"
                />
            </div>
        </div>

        <!-- Order Detail Modal -->
        <OrderDetailModal ref="orderDetailModal" :orderId="selectedOrderId" />
    </div>
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue3-toastify'
import * as orderService from '@/api/orderService'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import Pagination from '@/components/common/Pagination.vue'
import OrderDetailModal from '@/components/orders/OrderDetailModal.vue'
import { PaginationMode, usePagination } from '@/composables/usePagination'

const STATUS_METADATA = Object.freeze({
    PENDING: { value: 'PENDING', label: 'Đang chờ', badgeClass: 'status-pill--pending' },
    PAID: { value: 'PAID', label: 'Đã thanh toán', badgeClass: 'status-pill--paid' },
    CANCELLED: { value: 'CANCELLED', label: 'Đã hủy', badgeClass: 'status-pill--cancelled' },
    TRANSFERRED: { value: 'TRANSFERRED', label: 'Đã chuyển ca', badgeClass: 'status-pill--transferred' }
})

const STATUS_FILTER_OPTIONS = Object.values(STATUS_METADATA)

const orders = ref([])
const loading = ref(true)
const error = ref(null)
const selectedOrderId = ref(null)
const orderDetailModal = ref(null)

const filters = reactive({
    status: '',
    startDate: '',
    endDate: ''
})

const router = useRouter()
const route = useRoute()

const {
    currentPage,
    zeroBasedPage,
    pageSize,
    totalPages,
    setPageFromZero,
    updatePageSize,
    updateFromResponse,
    rememberCurrent,
    syncQuery
} = usePagination({
    mode: PaginationMode.ZERO_BASED,
    pageSize: 10,
    persistKey: 'orders'
})

syncQuery(route, router, {
    queryMode: PaginationMode.ZERO_BASED,
    pageParam: 'page',
    sizeParam: 'size'
})

onBeforeRouteLeave(() => {
    rememberCurrent()
})

const formatCurrencySafe = (value) => {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return '—'
    return formatCurrency(numeric)
}

const fetchOrders = async () => {
    loading.value = true
    error.value = null
    const page = zeroBasedPage.value
    const size = pageSize.value
    const hasStatus = Boolean(filters.status)
    const hasDateRange = Boolean(filters.startDate) && Boolean(filters.endDate)
    try {
        let response

        if (hasStatus) {
            response = await orderService.getOrdersByStatus(filters.status, page, size)
        } else if (hasDateRange) {
            response = await orderService.getOrdersByDateRange(
                filters.startDate,
                filters.endDate,
                page,
                size
            )
        } else {
            response = await orderService.getOrders(page, size)
        }

        orders.value = response?.content ?? []

        const { adjusted } = updateFromResponse({
            page: response?.number ?? 0,
            totalPages: response?.totalPages ?? 0,
            totalElements: response?.totalElements ?? 0
        })
        if (adjusted) {
            toast.info('Trang đơn hàng đã được điều chỉnh theo dữ liệu hiện có.', { autoClose: 2500 })
        }
    } catch (err) {
        console.error(err)
        if (hasDateRange && err?.response?.status === 500) {
            toast.warn('Không thể lọc theo khoảng ngày, hiển thị tất cả đơn hàng.', { autoClose: 3000 })
            try {
                const fallback = await orderService.getOrders(page, size)
                orders.value = fallback?.content ?? []
                updateFromResponse({
                    page: fallback?.number ?? 0,
                    totalPages: fallback?.totalPages ?? 0,
                    totalElements: fallback?.totalElements ?? 0
                })
                error.value = null
                return
            } catch (fallbackErr) {
                console.error(fallbackErr)
            }
        }
        error.value = err?.response?.data?.message || 'Không thể tải danh sách đơn hàng.'
    } finally {
        loading.value = false
    }
}

const openModal = (orderId) => {
    selectedOrderId.value = orderId
    orderDetailModal.value.show()
}

const handlePageChange = (page) => {
    rememberCurrent()
    setPageFromZero(page)
}

const resolveStatus = (status) => STATUS_METADATA[status] || { label: 'Không xác định', badgeClass: 'status-pill--default' }

const getStatusLabel = (status) => resolveStatus(status).label

const getStatusClass = (status) => resolveStatus(status).badgeClass

const triggerFetchFromFilterChange = () => {
    rememberCurrent()
    if (zeroBasedPage.value !== 0) {
        setPageFromZero(0)
        return
    }
    fetchOrders()
}

const handleStatusChange = () => {
    if (filters.status) {
        filters.startDate = ''
        filters.endDate = ''
    }
    triggerFetchFromFilterChange()
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

const canResetFilters = computed(() => {
    return Boolean(filters.status) || Boolean(filters.startDate) || Boolean(filters.endDate)
})

watch(
    () => [zeroBasedPage.value, pageSize.value],
    () => {
        fetchOrders()
    },
    { immediate: true }
)
</script>

<style scoped>
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
