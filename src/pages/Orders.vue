<template>
    <div class="page-container container-fluid" data-aos="fade-up">
        <div class="page-header card-shadow">
            <div>
                <h2 class="page-title">Quản lý Đơn hàng</h2>
                <p class="page-subtitle">Theo dõi đơn hàng, thanh toán và trạng thái vận hành.</p>
            </div>
            <div class="d-flex flex-wrap gap-2 align-items-center">
                <button class="btn btn-outline-secondary" type="button" @click="fetchData" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    Làm mới
                </button>
            </div>
        </div>

        <div class="card filter-card mb-4" v-if="activeTab === 'list' || activeTab === 'statistics'">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-lg-3 col-md-4">
                        <label class="form-label">Trạng thái</label>
                        <select class="form-select" v-model="filters.status" @change="handleStatusChange">
                            <option value="">Tất cả trạng thái</option>
                            <option v-for="option in STATUS_FILTER_OPTIONS" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                    <div class="col-lg-3 col-md-4">
                        <label class="form-label">Từ ngày</label>
                        <input type="date" class="form-control" v-model="filters.startDate" @change="handleDateChange('startDate')" />
                    </div>
                    <div class="col-lg-3 col-md-4">
                        <label class="form-label">Đến ngày</label>
                        <input type="date" class="form-control" v-model="filters.endDate" @change="handleDateChange('endDate')" />
                    </div>
                    <div class="col-lg-3 col-md-4">
                        <button class="btn btn-outline-secondary w-100" type="button" @click="resetFilters" :disabled="loading">
                            <i class="bi bi-arrow-counterclockwise"></i> Đặt lại
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card tabs-card mb-4">
            <div class="card-body">
                <ul class="nav nav-pills reports-tabs mb-3" role="tablist">
                    <li class="nav-item" v-for="tab in tabs" :key="tab.key" role="presentation">
                        <button
                            type="button"
                            class="nav-link"
                            :class="{ active: activeTab === tab.key }"
                            @click="activeTab = tab.key"
                        >
                            <i :class="[tab.icon, 'me-2']"></i>{{ tab.label }}
                        </button>
                    </li>
                </ul>
                <LoadingState v-if="loading && activeTab !== 'overview'" />
                <ErrorState v-else-if="error && activeTab !== 'overview'" :message="error" @retry="fetchData" />
                <div v-else class="tab-content">
                    <OrderOverviewTab
                        v-if="activeTab === 'overview'"
                        :orders="allOrders"
                        :loading="loading"
                    />
                    <OrderListTab
                        v-else-if="activeTab === 'list'"
                        :orders="orders"
                        :loading="loading"
                        :error="error"
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
        <OrderDetailModal ref="orderDetailModal" :orderId="selectedOrderId" />
        
        <!-- Order Update Modal -->
        <OrderUpdateModal 
            ref="orderUpdateModal" 
            :orderId="selectedOrderId"
            :order="selectedOrder"
            @updated="handleOrderUpdated"
        />
    </div>
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue3-toastify'
import { storeToRefs } from 'pinia'
import * as orderService from '@/api/orderService'
import { exportOrdersToExcel } from '@/api/reportService'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import OrderDetailModal from '@/components/orders/OrderDetailModal.vue'
import OrderUpdateModal from '@/components/orders/OrderUpdateModal.vue'
import OrderOverviewTab from '@/components/orders/OrderOverviewTab.vue'
import OrderListTab from '@/components/orders/OrderListTab.vue'
import OrderStatisticsTab from '@/components/orders/OrderStatisticsTab.vue'
import { PaginationMode, usePagination } from '@/composables/usePagination'
import { useAuthStore } from '@/store/auth'
import { useAsyncOperation } from '@/composables/useAsyncOperation'
import { handleApiError } from '@/composables/useErrorHandler'

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

const activeTab = ref('overview')
const tabs = [
    { key: 'overview', label: 'Tổng quan', icon: 'bi bi-speedometer2' },
    { key: 'list', label: 'Danh sách', icon: 'bi bi-list-ul' },
    { key: 'statistics', label: 'Thống kê', icon: 'bi bi-graph-up' }
]

const { loading, error, execute } = useAsyncOperation({ context: 'Orders' })

const orders = ref([])
const allOrders = ref([]) // For statistics
const selectedOrderId = ref(null)
const selectedOrder = ref(null)
const orderDetailModal = ref(null)
const orderUpdateModal = ref(null)
const cancelling = ref(false)
const exporting = ref(false)

const filters = reactive({
    status: '',
    startDate: '',
    endDate: ''
})

const {
    currentPage,
    zeroBasedPage,
    pageSize,
    totalPages,
    totalElements,
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

const fetchData = async (fetchAll = false) => {
    if (activeTab.value === 'overview' || (activeTab.value === 'statistics' && fetchAll)) {
        await fetchAllOrders()
    } else if (activeTab.value === 'list') {
        await fetchOrders()
    }
}

const fetchAllOrders = async () => {
    await execute(async () => {
        // Fetch all orders for statistics (with a reasonable limit)
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

        allOrders.value = allData
        
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
            // Service layer đã có fallback logic khi 500, chỉ cần gọi và xử lý response
            response = await orderService.getOrdersByDateRange(
                filters.startDate,
                filters.endDate,
                page,
                size,
                { useFallback: true } // Cho phép fallback
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
        // Error handling đã được xử lý trong service layer
        // Chỉ cần hiển thị error message cho user
        error.value = handleApiError(err, { 
            context: 'Orders',
            fallbackMessage: 'Không thể tải danh sách đơn hàng.'
        })
        orders.value = []
        
        // Reset pagination về trang đầu nếu có lỗi
        updateFromResponse({
            page: 0,
            totalPages: 0,
            totalElements: 0
        })
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

const handleStatusChange = () => {
    if (filters.status) {
        filters.startDate = ''
        filters.endDate = ''
    }
    rememberCurrent()
    if (zeroBasedPage.value !== 0) {
        setPageFromZero(0)
    } else {
        fetchData()
    }
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
        rememberCurrent()
        if (zeroBasedPage.value !== 0) {
            setPageFromZero(0)
        } else {
            fetchData()
        }
        return
    }

    if (hasNoDate) {
        rememberCurrent()
        if (zeroBasedPage.value !== 0) {
            setPageFromZero(0)
        } else {
            fetchData()
        }
    }
}

const resetFilters = () => {
    filters.status = ''
    filters.startDate = ''
    filters.endDate = ''
    rememberCurrent()
    if (zeroBasedPage.value !== 0) {
        setPageFromZero(0)
    } else {
        fetchData()
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
    if (confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${order.id} không?`)) {
        handleCancel(order.id)
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

watch(
    () => [zeroBasedPage.value, pageSize.value],
    () => {
        if (activeTab.value === 'list') {
            fetchOrders()
        }
    }
)
</script>

<style scoped>
/* Page-specific styles only - Global styles (.card-shadow, .filter-card, .tabs-card, .reports-tabs, .state-block) are in components.scss */
</style>
