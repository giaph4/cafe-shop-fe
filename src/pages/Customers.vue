<template>
    <div class="page-container container-fluid" data-aos="fade-up">
        <div class="customers-header">
            <div class="customers-header__content">
                <div class="customers-header__title-section">
                    <h2 class="customers-header__title">Quản lý Khách hàng</h2>
                    <p class="customers-header__subtitle">Xem thông tin khách hàng, lịch sử mua hàng và quản lý điểm tích lũy.</p>
                </div>
                <div class="customers-header__actions">
                    <div class="form-check form-switch">
                        <input
                            class="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="autoRefreshSwitch"
                            v-model="autoRefresh"
                        >
                        <label class="form-check-label" for="autoRefreshSwitch">Tự động làm mới</label>
                    </div>
                    <button class="btn btn-outline-secondary" type="button" @click="fetchData" :disabled="loading">
                        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                        Làm mới
                    </button>
                </div>
            </div>
        </div>

        <div class="card filter-card mb-4" v-if="activeTab === 'list'">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-lg-3 col-md-4">
                        <label class="form-label">Tìm kiếm</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="bi bi-search"></i></span>
                            <input
                                type="text"
                                class="form-control"
                                placeholder="Tên, SĐT hoặc email"
                                v-model="filters.keyword"
                                :disabled="loading"
                            />
                        </div>
                    </div>
                    <div class="col-lg-2 col-md-4" v-if="activeTab === 'list'">
                        <label class="form-label">Điểm thưởng từ</label>
                        <input
                            type="number"
                            class="form-control"
                            placeholder="0"
                            v-model.number="filters.minLoyaltyPoints"
                            min="0"
                        />
                    </div>
                    <div class="col-lg-2 col-md-4" v-if="activeTab === 'list'">
                        <label class="form-label">Điểm thưởng đến</label>
                        <input
                            type="number"
                            class="form-control"
                            placeholder="999999"
                            v-model.number="filters.maxLoyaltyPoints"
                            min="0"
                        />
                    </div>
                    <div class="col-lg-2 col-md-4" v-if="activeTab === 'list'">
                        <label class="form-label">Ngày tạo từ</label>
                        <input type="date" class="form-control" v-model="filters.createdDateFrom" />
                    </div>
                    <div class="col-lg-2 col-md-4" v-if="activeTab === 'list'">
                        <label class="form-label">Ngày tạo đến</label>
                        <input type="date" class="form-control" v-model="filters.createdDateTo" />
                    </div>
                    <div class="col-lg-1 col-md-4">
                        <button class="btn btn-outline-secondary w-100" type="button" @click="resetFilters" :disabled="loading">
                            <i class="bi bi-arrow-counterclockwise"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card tabs-card">
            <div class="card-body">
                <div class="customer-tabs mb-4">
                    <button
                        v-for="tab in tabs"
                        :key="tab.key"
                        type="button"
                        class="customer-tab"
                        :class="{ active: activeTab === tab.key }"
                        @click="activeTab = tab.key"
                    >
                        <i :class="tab.icon"></i>
                        <span>{{ tab.label }}</span>
                    </button>
                </div>
                <LoadingState v-if="loading && activeTab !== 'overview'" />
                <ErrorState v-else-if="error && activeTab !== 'overview'" :message="error" @retry="fetchData" />
                <div v-else class="tab-content">
                    <CustomerOverviewTab
                        v-if="activeTab === 'overview'"
                        :stats="overviewStats"
                        :recent-customers="recentCustomers"
                        :top-customers="topCustomers"
                    />
                    <CustomerListTab
                        v-else-if="activeTab === 'list'"
                        :customers="filteredCustomers"
                        :loading="loading"
                        :error="error"
                        :zero-based-page="zeroBasedPage"
                        :total-pages="totalPages"
                        :total-elements="totalElements"
                        :can-manage="canManage"
                        :can-delete="canDelete"
                        :can-export="canExport"
                        :deleting="deleting"
                        @create="openCreateModal"
                        @view-detail="openDetailDrawer"
                        @edit="openEditModal"
                        @delete="confirmDelete"
                        @page-change="handlePageChange"
                        @export="handleExport"
                    />
                    <CustomerStatisticsTab
                        v-else-if="activeTab === 'statistics'"
                        :stats="statisticsStats"
                        :loyalty-distribution="loyaltyDistribution"
                        :monthly-new-customers="monthlyNewCustomers"
                    />
                </div>
            </div>
        </div>

        <CustomerDetailModal
            ref="customerDetailModalRef"
            :customer-id="detailState.customerId"
            @close="handleDetailClose"
            @edit="handleDetailEdit"
        />

        <CustomerFormModal
            ref="customerFormModalRef"
            :mode="formState.mode"
            :loading="formState.submitting"
            :customer="formState.initialData"
            @close="handleFormClose"
            @submit="handleFormSubmit"
        />

        <Teleport to="body">
            <div class="modal fade" tabindex="-1" aria-labelledby="deleteCustomerModalLabel" aria-hidden="true" ref="deleteModalRef">
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header">
                            <div class="modal-header__content">
                                <h5 class="modal-title" id="deleteCustomerModalLabel">Xóa khách hàng</h5>
                                <p class="modal-subtitle">Hành động này không thể hoàn tác.</p>
                            </div>
                            <button type="button" class="btn-close" @click="closeDeleteModal" :disabled="deleting" aria-label="Đóng"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-4">Bạn có chắc chắn muốn xóa khách hàng này không?</p>
                            <div class="delete-info-card">
                                <div class="delete-info-item">
                                    <span class="delete-info-label">Khách hàng:</span>
                                    <span class="delete-info-value">{{ deleteTarget?.fullName || '—' }}</span>
                                </div>
                                <div class="delete-info-item">
                                    <span class="delete-info-label">Số điện thoại:</span>
                                    <span class="delete-info-value">{{ deleteTarget?.phone || '—' }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" @click="closeDeleteModal" :disabled="deleting">
                                Hủy
                            </button>
                            <button type="button" class="btn btn-danger" @click="handleDeleteConfirm" :disabled="deleting">
                                <span v-if="deleting" class="spinner-border spinner-border-sm me-2"></span>
                                Xóa khách hàng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, reactive, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { Modal } from 'bootstrap'
import { toast } from 'vue3-toastify'
import { storeToRefs } from 'pinia'

import CustomerFormModal from '@/components/customers/CustomerFormModal.vue'
import CustomerDetailModal from '@/components/customers/CustomerDetailModal.vue'
import CustomerOverviewTab from '@/components/customers/CustomerOverviewTab.vue'
import CustomerListTab from '@/components/customers/CustomerListTab.vue'
import CustomerStatisticsTab from '@/components/customers/CustomerStatisticsTab.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { PaginationMode, usePagination } from '@/composables/usePagination'
import { useAuthStore } from '@/store/auth'
import { useAsyncOperation } from '@/composables/useAsyncOperation'
import {
    createCustomer,
    deleteCustomer,
    getCustomers,
    updateCustomer
} from '@/api/customerService'
import { formatNumber } from '@/utils/formatters'

const router = useRouter()
const route = useRoute()

const authStore = useAuthStore()
const { isAdmin, isManager, isStaff } = storeToRefs(authStore)

const canManage = computed(() => isAdmin.value || isManager.value || isStaff.value)
const canDelete = computed(() => isAdmin.value)
const canExport = computed(() => isAdmin.value || isManager.value)

const activeTab = ref('overview')
const tabs = [
    { key: 'overview', label: 'Tổng quan', icon: 'bi bi-speedometer2' },
    { key: 'list', label: 'Danh sách', icon: 'bi bi-list-ul' },
    { key: 'statistics', label: 'Thống kê', icon: 'bi bi-graph-up' }
]

const autoRefresh = ref(false)
let autoRefreshInterval = null

const filters = reactive({
    keyword: typeof route.query.keyword === 'string' ? route.query.keyword : '',
    minLoyaltyPoints: null,
    maxLoyaltyPoints: null,
    createdDateFrom: '',
    createdDateTo: ''
})

const allCustomers = ref([]) // For statistics

const { loading, error, execute } = useAsyncOperation({ context: 'Customers' })

const customers = ref([])

const formState = reactive({
    visible: false,
    mode: 'create',
    submitting: false,
    initialData: null
})

const detailState = reactive({
    customerId: null
})

const customerFormModalRef = ref(null)
const customerDetailModalRef = ref(null)
const deleteTarget = ref(null)
const deleting = ref(false)
const deleteModalRef = ref(null)
let deleteModalInstance = null

const {
    zeroBasedPage,
    pageSize,
    totalPages,
    totalElements,
    setPageFromZero,
    updateFromResponse,
    rememberCurrent,
    syncQuery
} = usePagination({
    mode: PaginationMode.ZERO_BASED,
    pageSize: 15,
    persistKey: 'customers'
})

syncQuery(route, router, {
    queryMode: PaginationMode.ZERO_BASED,
    pageParam: 'page',
    sizeParam: 'size'
})

let suppressWatcherFetch = false

const fetchCustomers = async (fetchAll = false) => {
    await execute(async () => {
        const size = fetchAll ? 10000 : pageSize.value
        const response = await getCustomers({
            keyword: filters.keyword?.trim() || '',
            page: fetchAll ? 0 : zeroBasedPage.value,
            size: size
        })

        const list = Array.isArray(response?.content) ? response.content : []
        
        if (fetchAll) {
            allCustomers.value = list
        } else {
            customers.value = list
            const { adjusted } = updateFromResponse({
                page: response?.number,
                totalPages: response?.totalPages,
                totalElements: response?.totalElements
            })
            suppressWatcherFetch = adjusted
        }
    }, 'Không thể tải danh sách khách hàng. Vui lòng thử lại.', {
        onError: () => {
            customers.value = []
            allCustomers.value = []
        }
    })
}

const fetchData = async () => {
    if (activeTab.value === 'overview' || activeTab.value === 'statistics') {
        await fetchCustomers(true)
    } else {
        await fetchCustomers(false)
    }
}

watch(
    () => activeTab.value,
    (newTab) => {
        if (newTab === 'overview' || newTab === 'statistics') {
            fetchCustomers(true)
        } else {
            fetchCustomers(false)
        }
    },
    { immediate: true }
)

watch(
    () => [zeroBasedPage.value, pageSize.value],
    () => {
        if (activeTab.value !== 'list') return
        if (suppressWatcherFetch) {
            suppressWatcherFetch = false
            return
        }
        fetchCustomers(false)
    }
)

let keywordDebounceId = null
let isSynchronizingRoute = false

const updateRouteKeyword = (value) => {
    const currentKeyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
    if (value === currentKeyword) {
        return
    }
    const nextQuery = { ...route.query }
    if (value) {
        nextQuery.keyword = value
    } else {
        delete nextQuery.keyword
    }
    isSynchronizingRoute = true
    router
        .replace({ query: nextQuery })
        .catch(() => {})
        .finally(() => {
            isSynchronizingRoute = false
        })
}

watch(
    () => route.query.keyword,
    (next) => {
        if (isSynchronizingRoute) return
        filters.keyword = typeof next === 'string' ? next : ''
    }
)

watch(
    () => filters.keyword,
    () => {
        if (keywordDebounceId) {
            clearTimeout(keywordDebounceId)
        }
        keywordDebounceId = window.setTimeout(() => {
            const normalized = filters.keyword?.trim() || ''
            updateRouteKeyword(normalized)

            const previousPage = zeroBasedPage.value
            const target = setPageFromZero(0)

            if (previousPage === target) {
                if (activeTab.value === 'list') {
                    fetchCustomers(false)
                } else if (activeTab.value === 'overview' || activeTab.value === 'statistics') {
                    fetchCustomers(true)
                }
            }
        }, 400)
    }
)

const resetFilters = () => {
    filters.keyword = ''
    filters.minLoyaltyPoints = null
    filters.maxLoyaltyPoints = null
    filters.createdDateFrom = ''
    filters.createdDateTo = ''
}

// Computed properties for statistics
const overviewStats = computed(() => {
    const total = allCustomers.value.length
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)
    
    const newThisMonth = allCustomers.value.filter(c => {
        const created = new Date(c.createdAt)
        return created >= thisMonth
    }).length
    
    const totalLoyaltyPoints = allCustomers.value.reduce((sum, c) => sum + (Number(c.loyaltyPoints) || 0), 0)
    const avgLoyaltyPoints = total > 0 ? Math.round(totalLoyaltyPoints / total) : 0
    
    const vipCount = allCustomers.value.filter(c => (Number(c.loyaltyPoints) || 0) >= 1000).length
    
    return [
        {
            label: 'Tổng khách hàng',
            value: formatNumber(total, { maximumFractionDigits: 0 }),
            icon: 'bi bi-people',
            iconClass: 'bg-primary-subtle'
        },
        {
            label: 'Khách hàng mới (tháng này)',
            value: formatNumber(newThisMonth, { maximumFractionDigits: 0 }),
            icon: 'bi bi-person-plus',
            iconClass: 'bg-success-subtle'
        },
        {
            label: 'Điểm thưởng trung bình',
            value: formatNumber(avgLoyaltyPoints, { maximumFractionDigits: 0 }),
            icon: 'bi bi-star',
            iconClass: 'bg-warning-subtle'
        },
        {
            label: 'Khách hàng VIP',
            value: formatNumber(vipCount, { maximumFractionDigits: 0 }),
            icon: 'bi bi-trophy',
            iconClass: 'bg-info-subtle'
        }
    ]
})

const recentCustomers = computed(() => {
    return [...allCustomers.value]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
})

const topCustomers = computed(() => {
    return [...allCustomers.value]
        .sort((a, b) => (Number(b.loyaltyPoints) || 0) - (Number(a.loyaltyPoints) || 0))
        .slice(0, 5)
})

const statisticsStats = computed(() => {
    const total = allCustomers.value.length
    const totalLoyaltyPoints = allCustomers.value.reduce((sum, c) => sum + (Number(c.loyaltyPoints) || 0), 0)
    const avgLoyaltyPoints = total > 0 ? Math.round(totalLoyaltyPoints / total) : 0
    const maxLoyaltyPoints = allCustomers.value.length > 0
        ? Math.max(...allCustomers.value.map(c => Number(c.loyaltyPoints) || 0))
        : 0
    
    return [
        {
            label: 'Tổng khách hàng',
            value: formatNumber(total, { maximumFractionDigits: 0 }),
            icon: 'bi bi-people',
            iconClass: 'bg-primary-subtle'
        },
        {
            label: 'Điểm thưởng trung bình',
            value: formatNumber(avgLoyaltyPoints, { maximumFractionDigits: 0 }),
            icon: 'bi bi-star',
            iconClass: 'bg-warning-subtle'
        },
        {
            label: 'Điểm thưởng cao nhất',
            value: formatNumber(maxLoyaltyPoints, { maximumFractionDigits: 0 }),
            icon: 'bi bi-trophy',
            iconClass: 'bg-info-subtle'
        }
    ]
})

const loyaltyDistribution = computed(() => {
    const ranges = [
        { label: '0-100', min: 0, max: 100 },
        { label: '101-500', min: 101, max: 500 },
        { label: '501-1000', min: 501, max: 1000 },
        { label: '1001-5000', min: 1001, max: 5000 },
        { label: '5000+', min: 5001, max: Infinity }
    ]
    
    const distribution = ranges.map(range => {
        const count = allCustomers.value.filter(c => {
            const points = Number(c.loyaltyPoints) || 0
            return points >= range.min && points <= range.max
        }).length
        return { ...range, count }
    })
    
    const total = distribution.reduce((sum, item) => sum + item.count, 0)
    
    return distribution.map(item => ({
        range: item.label,
        count: item.count,
        percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
    }))
})

const monthlyNewCustomers = computed(() => {
    const monthly = {}
    allCustomers.value.forEach(customer => {
        const date = new Date(customer.createdAt)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!monthly[key]) {
            monthly[key] = { year: date.getFullYear(), month: date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }), count: 0 }
        }
        monthly[key].count++
    })
    
    return Object.values(monthly)
        .sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year
            return b.month.localeCompare(a.month)
        })
        .slice(0, 12)
})

const handleExport = () => {
    // Export to Excel/CSV
    const headers = ['ID', 'Họ và tên', 'Số điện thoại', 'Email', 'Điểm thưởng', 'Ngày tạo', 'Ngày cập nhật']
    const rows = customers.value.map(c => [
        c.id,
        c.fullName || '',
        c.phone || '',
        c.email || '',
        c.loyaltyPoints || 0,
        c.createdAt || '',
        c.updatedAt || ''
    ])
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Đã xuất danh sách khách hàng thành công!')
}

const openCreateModal = () => {
    if (!canManage.value) return
    formState.mode = 'create'
    formState.initialData = null
    customerFormModalRef.value?.show()
}

const openEditModal = (customer) => {
    if (!canManage.value || !customer) return
    formState.mode = 'edit'
    formState.initialData = {
        id: customer.id,
        fullName: customer.fullName || '',
        phone: customer.phone || '',
        email: customer.email || '',
        loyaltyPoints: customer.loyaltyPoints ?? 0,
        createdAt: customer.createdAt || '',
        updatedAt: customer.updatedAt || ''
    }
    customerFormModalRef.value?.show()
}

const handleFormClose = () => {
    if (formState.submitting) return
    customerFormModalRef.value?.hide()
    formState.initialData = null
}

const handleFormSubmit = async (payload) => {
    formState.submitting = true
    try {
        if (formState.mode === 'edit') {
            const id = formState.initialData?.id
            if (!id) {
                throw new Error('Thiếu thông tin khách hàng để cập nhật')
            }
            await updateCustomer({ id, data: payload })
            toast.success('Cập nhật khách hàng thành công.')
        } else {
            await createCustomer(payload)
            toast.success('Tạo khách hàng mới thành công.')
        }

        formState.visible = false
        formState.initialData = null

        const previousPage = zeroBasedPage.value
        const target = formState.mode === 'create' ? setPageFromZero(0) : zeroBasedPage.value
        if (formState.mode === 'create' && previousPage !== target) {
            // Fetch sẽ được kích hoạt bởi watcher phân trang
            return
        }
        if (activeTab.value === 'list') {
            fetchCustomers(false)
        } else {
            fetchCustomers(true)
        }
    } catch (err) {
        // Form submission error handled by error handler
        const message = err?.response?.data?.message
            || err?.message
            || 'Không thể lưu thông tin khách hàng. Vui lòng thử lại.'
        toast.error(message)
    } finally {
        formState.submitting = false
    }
}

const openDetailDrawer = (customerId, initialTab = 'overview') => {
    detailState.customerId = customerId
    customerDetailModalRef.value?.show()
}

const handleDetailClose = () => {
    detailState.customerId = null
}

const handleDetailEdit = (customer) => {
    if (!canManage.value || !customer) return
    detailState.customerId = null
    openEditModal(customer)
}

const confirmDelete = (customer) => {
    if (!canDelete.value || !customer) return
    deleteTarget.value = customer
    nextTick(() => {
        deleteModalInstance?.show()
    })
}

const closeDeleteModal = () => {
    deleteModalInstance?.hide()
}

const handleDeleteConfirm = async () => {
    if (!deleteTarget.value?.id) return
    deleting.value = true
    try {
        await execute(async () => {
            await deleteCustomer(deleteTarget.value.id)
            toast.success('Đã xóa khách hàng thành công.')
            closeDeleteModal()
            if (activeTab.value === 'list') {
                fetchCustomers(false)
            } else {
                fetchCustomers(true)
            }
        }, 'Không thể xóa khách hàng. Vui lòng kiểm tra và thử lại.', {
            showToast: false // Đã có toast riêng
        })
    } finally {
        deleting.value = false
    }
}

const handlePageChange = (page) => {
    setPageFromZero(page)
}

// Filter customers for List tab
const filteredCustomers = computed(() => {
    if (activeTab.value !== 'list') return customers.value
    
    let filtered = [...customers.value]
    
    // Filter by loyalty points
    if (filters.minLoyaltyPoints !== null && filters.minLoyaltyPoints !== '') {
        filtered = filtered.filter(c => (Number(c.loyaltyPoints) || 0) >= Number(filters.minLoyaltyPoints))
    }
    if (filters.maxLoyaltyPoints !== null && filters.maxLoyaltyPoints !== '') {
        filtered = filtered.filter(c => (Number(c.loyaltyPoints) || 0) <= Number(filters.maxLoyaltyPoints))
    }
    
    // Filter by created date
    if (filters.createdDateFrom) {
        const fromDate = new Date(filters.createdDateFrom)
        fromDate.setHours(0, 0, 0, 0)
        filtered = filtered.filter(c => {
            const created = new Date(c.createdAt)
            created.setHours(0, 0, 0, 0)
            return created >= fromDate
        })
    }
    if (filters.createdDateTo) {
        const toDate = new Date(filters.createdDateTo)
        toDate.setHours(23, 59, 59, 999)
        filtered = filtered.filter(c => {
            const created = new Date(c.createdAt)
            created.setHours(0, 0, 0, 0)
            return created <= toDate
        })
    }
    
    return filtered
})

onBeforeRouteLeave(() => {
    rememberCurrent()
})

watch(
    () => deleteModalRef.value,
    (element) => {
        if (!element) return
        deleteModalInstance = new Modal(element, { backdrop: 'static' })
        element.addEventListener('hidden.bs.modal', () => {
            deleteTarget.value = null
        })
    },
    { immediate: true }
)

watch(autoRefresh, (enabled) => {
    if (enabled) {
        autoRefreshInterval = setInterval(() => {
            fetchData()
            toast.info('Dữ liệu khách hàng đã được tự động làm mới.', { autoClose: 2000 })
        }, 30000)
    } else {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval)
            autoRefreshInterval = null
        }
    }
})

onBeforeUnmount(() => {
    if (keywordDebounceId) {
        clearTimeout(keywordDebounceId)
    }
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval)
    }
    if (deleteModalInstance) {
        deleteModalInstance.hide()
        deleteModalInstance.dispose()
        deleteModalInstance = null
    }
})
</script>

<style scoped>
.customers-header {
    padding: var(--spacing-6);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border-soft);
    background: var(--color-card);
    box-shadow: var(--shadow-soft);
    margin-bottom: var(--spacing-6);
}

.customers-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-6);
}

.customers-header__title-section {
    flex: 1;
    min-width: 0;
}

.customers-header__title {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-tight);
}

.customers-header__subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
    font-weight: var(--font-weight-normal);
}

.customers-header__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    flex-wrap: wrap;
    justify-content: flex-end;
}

.customers-header__actions .form-check {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    margin-bottom: 0;
}

.customers-header__actions .form-check-label {
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    white-space: nowrap;
}

@media (max-width: 768px) {
    .customers-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .customers-header__actions {
        width: 100%;
        justify-content: flex-start;
    }
}
</style>

<style scoped>
/* Page-specific styles only - Global styles (.page-header.card-shadow, .page-title, .page-subtitle, .filter-card, .tabs-card, .reports-tabs, .state-block) are in components.scss */

.customer-tabs {
    display: flex;
    gap: 0.75rem;
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    padding: 0.6rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-soft);
    overflow-x: auto;
}

.customer-tab {
    border: none;
    background: transparent;
    padding: 0.75rem 1.35rem;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    font-weight: 600;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: background 0.2s ease;
}

.customer-tab i {
    font-size: 1.15rem;
}

.customer-tab.active {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.delete-info-card {
    padding: var(--spacing-4);
    border-radius: var(--radius-md);
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
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    flex-shrink: 0;
    min-width: 120px;
}

.delete-info-value {
    font-size: var(--font-size-sm);
    color: var(--color-text);
    text-align: right;
    word-break: break-word;
}
</style>
