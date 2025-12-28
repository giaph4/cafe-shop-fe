<template>
  <div
    class="page-container container-fluid"
      
    style="background: var(--color-body-bg); padding: var(--spacing-4);"
  >
    <div class="customers-header">
      <div class="customers-header__content">
        <div class="customers-header__title-section">
          <h2 class="customers-header__title">
            Quản lý Khách hàng
          </h2>
        </div>
        <div class="customers-header__actions">
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
            :disabled="listTableData.loading || overviewLoading"
            @click="fetchData"
          >
            <span
              v-if="listTableData.loading || overviewLoading"
              class="spinner-border spinner-border-sm me-2"
            />
            Làm mới
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="activeTab === 'list'"
      class="card filter-card mb-4"
    >
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-lg-3 col-md-4">
            <label class="form-label">Tìm kiếm</label>
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search" /></span>
              <input
                v-model="listTableData.searchKeyword"
                type="text"
                class="form-control"
                placeholder="Tên, SĐT hoặc email"
                :disabled="listTableData.loading"
              >
            </div>
          </div>
          <div
            v-if="activeTab === 'list'"
            class="col-lg-2 col-md-4"
          >
            <label class="form-label">Điểm thưởng từ</label>
            <input
              v-model.number="clientFilters.minLoyaltyPoints"
              type="number"
              class="form-control"
              placeholder="0"
              min="0"
            >
          </div>
          <div
            v-if="activeTab === 'list'"
            class="col-lg-2 col-md-4"
          >
            <label class="form-label">Điểm thưởng đến</label>
            <input
              v-model.number="clientFilters.maxLoyaltyPoints"
              type="number"
              class="form-control"
              placeholder="999999"
              min="0"
            >
          </div>
          <div
            v-if="activeTab === 'list'"
            class="col-lg-2 col-md-4"
          >
            <label class="form-label">Ngày tạo từ</label>
            <input
              v-model="clientFilters.createdDateFrom"
              type="date"
              class="form-control"
            >
          </div>
          <div
            v-if="activeTab === 'list'"
            class="col-lg-2 col-md-4"
          >
            <label class="form-label">Ngày tạo đến</label>
            <input
              v-model="clientFilters.createdDateTo"
              type="date"
              class="form-control"
            >
          </div>
          <div class="col-lg-1 col-md-4">
            <button
              class="btn btn-outline-secondary w-100"
              type="button"
              :disabled="listTableData.loading || overviewLoading"
              @click="resetFilters"
            >
              <i class="bi bi-arrow-counterclockwise" />
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
            <i :class="tab.icon" />
            <span>{{ tab.label }}</span>
          </button>
        </div>
        <LoadingState v-if="(listTableData.loading || overviewLoading) && activeTab !== 'overview' && activeTab !== 'statistics'" />
        <ErrorState
          v-else-if="(listTableData.error || overviewError) && activeTab !== 'overview' && activeTab !== 'statistics'"
          :message="(listTableData.error && typeof listTableData.error === 'object' ? listTableData.error.message : listTableData.error) || overviewError || 'Có lỗi xảy ra'"
          @retry="fetchData"
        />
        <div
          v-else
          class="tab-content"
        >
          <CustomerOverviewTab
            v-if="activeTab === 'overview'"
            :stats="overviewStats"
            :recent-customers="recentCustomers"
            :top-customers="topCustomers"
          />
          <CustomerListTab
            v-else-if="activeTab === 'list'"
            :customers="filteredCustomers"
            :loading="listTableData.loading"
            :error="listTableData.error && typeof listTableData.error === 'object' ? listTableData.error.message : listTableData.error"
            :zero-based-page="listTableData.zeroBasedPage"
            :total-pages="listTableData.totalPages"
            :total-elements="listTableData.totalElements"
            :page-size="listTableData.pageSize"
            :can-manage="canManage"
            :can-delete="canDelete"
            :can-export="canExport"
            :deleting="deleting"
            @create="openCreateModal"
            @view-detail="openDetailDrawer"
            @edit="openEditModal"
            @delete="confirmDelete"
            @page-change="handlePageChange"
            @page-size-change="handlePageSizeChange"
            @export="handleExport"
            @refresh="listTableData.refresh"
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
      <div
        ref="deleteModalRef"
        class="modal fade customer-delete-modal"
        tabindex="-1"
        aria-labelledby="deleteCustomerModalLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <div class="modal-header__content">
                <h5
                  id="deleteCustomerModalLabel"
                  class="modal-title"
                >
                  Xóa khách hàng
                </h5>
                <p class="modal-subtitle">
                  Hành động này không thể hoàn tác.
                </p>
              </div>
              <button
                type="button"
                class="btn-close"
                :disabled="deleting"
                aria-label="Đóng"
                @click="closeDeleteModal"
              />
            </div>
            <div class="modal-body">
              <p class="mb-4">
                Bạn có chắc chắn muốn xóa khách hàng này không?
              </p>
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
              <button
                type="button"
                class="btn btn-outline-secondary"
                :disabled="deleting"
                @click="closeDeleteModal"
              >
                Hủy
              </button>
              <button
                type="button"
                class="btn btn-danger"
                :disabled="deleting"
                @click="handleDeleteConfirm"
              >
                <span
                  v-if="deleting"
                  class="spinner-border spinner-border-sm me-2"
                />
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
import { useTableData } from '@/composables/useTableData'
import { useAuthStore } from '@/store/auth'
import { useAsyncOperation } from '@/composables/useAsyncOperation'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import {
    createCustomer,
    deleteCustomer,
    getCustomers,
    updateCustomer
} from '@/api/customerService'
import { formatNumber } from '@/utils/formatters'
import logger from '@/utils/logger'

const router = useRouter()
const route = useRoute()

const authStore = useAuthStore()
const { isAdmin, isManager, isStaff } = storeToRefs(authStore)

const canManage = computed(() => isAdmin.value || isManager.value || isStaff.value)
const canDelete = computed(() => isAdmin.value)
const canExport = computed(() => isAdmin.value || isManager.value)

const activeTab = ref('list') // Mặc định là 'list' để hiển thị danh sách
const tabs = [
    { key: 'overview', label: 'Tổng quan', icon: 'bi bi-speedometer2' },
    { key: 'list', label: 'Danh sách', icon: 'bi bi-list-ul' },
    { key: 'statistics', label: 'Thống kê', icon: 'bi bi-graph-up' }
]

const autoRefresh = ref(false)
let autoRefreshInterval = null

// Sử dụng useTableData cho tab list (phân trang server-side)
const listTableData = useTableData({
    fetchFn: async (params) => await getCustomers(params),
    initialFilters: {
        minLoyaltyPoints: null,
        maxLoyaltyPoints: null,
        createdDateFrom: '',
        createdDateTo: ''
    },
    initialPageSize: 15,
    debounceMs: 500,
    syncUrl: true,
    pageParam: 'page',
    sizeParam: 'size',
    searchParam: 'search',
    zeroBasedPage: true
})

// Filters cho client-side filtering (tab list)
const clientFilters = reactive({
    minLoyaltyPoints: null,
    maxLoyaltyPoints: null,
    createdDateFrom: '',
    createdDateTo: ''
})

// Đồng bộ clientFilters với listTableData.filters
watch(
    () => listTableData.filters.value,
    (newFilters) => {
        if (newFilters) {
            clientFilters.minLoyaltyPoints = newFilters.minLoyaltyPoints
            clientFilters.maxLoyaltyPoints = newFilters.maxLoyaltyPoints
            clientFilters.createdDateFrom = newFilters.createdDateFrom
            clientFilters.createdDateTo = newFilters.createdDateTo
        }
    },
    { deep: true, immediate: true }
)

// Watch clientFilters và cập nhật vào listTableData
watch(
    clientFilters,
    () => {
        listTableData.setFilters({
            minLoyaltyPoints: clientFilters.minLoyaltyPoints,
            maxLoyaltyPoints: clientFilters.maxLoyaltyPoints,
            createdDateFrom: clientFilters.createdDateFrom,
            createdDateTo: clientFilters.createdDateTo
        })
    },
    { deep: true }
)

const allCustomers = ref([]) // Dùng cho thống kê

const { loading: overviewLoading, error: overviewError, execute } = useAsyncOperation({ context: 'Customers' })

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

// Fetch customers cho overview/statistics (fetchAll)
const fetchAllCustomers = async () => {
    await execute(async () => {
        const keyword = listTableData.searchKeyword.value
        const response = await getCustomers({
            keyword: (keyword && typeof keyword === 'string' ? keyword.trim() : '') || '',
            page: 0,
            size: 10000
        })
        const list = Array.isArray(response?.content) ? response.content : []
        allCustomers.value = list
    }, 'Không thể tải danh sách khách hàng. Vui lòng thử lại.', {
        onError: () => {
            allCustomers.value = []
        }
    })
}

const fetchData = async () => {
    if (activeTab.value === 'overview' || activeTab.value === 'statistics') {
        await fetchAllCustomers()
    }
    // Tab list tự động fetch qua useTableData
}

watch(
    () => activeTab.value,
    (newTab) => {
        if (newTab === 'overview' || newTab === 'statistics') {
            fetchAllCustomers()
        }
    },
    { immediate: true }
)

// Watch searchKeyword từ listTableData để fetch allCustomers khi cần
watch(
    () => listTableData.searchKeyword.value,
    () => {
        if (activeTab.value === 'overview' || activeTab.value === 'statistics') {
            fetchAllCustomers()
        }
    }
)

const resetFilters = () => {
    listTableData.setSearchKeyword('')
    listTableData.setFilters({
        minLoyaltyPoints: null,
        maxLoyaltyPoints: null,
        createdDateFrom: '',
        createdDateTo: ''
    })
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

const recentCustomers = computed(() => [...allCustomers.value]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5))

const topCustomers = computed(() => [...allCustomers.value]
    .sort((a, b) => (Number(b.loyaltyPoints) || 0) - (Number(a.loyaltyPoints) || 0))
    .slice(0, 5))

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
    const rows = (listTableData.data.value || []).map(c => [
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

    const blob = new Blob([`\ufeff${  csvContent}`], { type: 'text/csv;charset=utf-8;' })
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

// Thiết lập phím tắt
useKeyboardShortcuts({
    page: 'customers',
    shortcuts: {
        'new-customer': {
            handler: () => {
                if (canManage.value) {
                    openCreateModal()
                }
            }
        },
        'search': {
            handler: () => {
                // Focus vào search input
                const searchInput = document.querySelector('.filter-card input[type="text"]')
                if (searchInput) {
                    searchInput.focus()
                }
            }
        }
    }
})

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

        if (formState.mode === 'create') {
            listTableData.goToFirst()
        }
        if (activeTab.value === 'list') {
            listTableData.refresh()
        } else {
            fetchAllCustomers()
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
                listTableData.refresh()
            } else {
                fetchAllCustomers()
            }
        }, {
            showToast: false, // Đã có toast riêng
            onError: (err) => {
                const message = err?.response?.data?.message || 'Không thể xóa khách hàng. Vui lòng kiểm tra và thử lại.'
                toast.error(message)
            }
        })
    } catch (err) {
        // Error đã được handle trong onError callback
        // Chỉ cần log nếu cần
        logger.error('Error deleting customer:', err)
    } finally {
        deleting.value = false
    }
}

const handlePageChange = (page) => {
    listTableData.setPage(page)
}

const handlePageSizeChange = (size) => {
    listTableData.setPageSize(size)
}

// Filter customers for List tab (client-side filtering)
const filteredCustomers = computed(() => {
    if (activeTab.value !== 'list') return []

    // listTableData.data là ref, cần .value để lấy giá trị trong script
    const customers = listTableData.data.value || []

    if (!customers || customers.length === 0) {
        return []
    }

    let filtered = [...customers]

    // Filter by loyalty points
    if (clientFilters.minLoyaltyPoints !== null && clientFilters.minLoyaltyPoints !== '') {
        filtered = filtered.filter(c => (Number(c.loyaltyPoints) || 0) >= Number(clientFilters.minLoyaltyPoints))
    }
    if (clientFilters.maxLoyaltyPoints !== null && clientFilters.maxLoyaltyPoints !== '') {
        filtered = filtered.filter(c => (Number(c.loyaltyPoints) || 0) <= Number(clientFilters.maxLoyaltyPoints))
    }

    // Filter by created date
    if (clientFilters.createdDateFrom) {
        const fromDate = new Date(clientFilters.createdDateFrom)
        fromDate.setHours(0, 0, 0, 0)
        filtered = filtered.filter(c => {
            const created = new Date(c.createdAt)
            created.setHours(0, 0, 0, 0)
            return created >= fromDate
        })
    }
    if (clientFilters.createdDateTo) {
        const toDate = new Date(clientFilters.createdDateTo)
        toDate.setHours(23, 59, 59, 999)
        filtered = filtered.filter(c => {
            const created = new Date(c.createdAt)
            created.setHours(0, 0, 0, 0)
            return created <= toDate
        })
    }

    return filtered
})

// Không cần onBeforeRouteLeave nữa vì useTableData tự động sync URL

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
            toast.info('Dữ liệu khách hàng đã được  .', { autoClose: 2000 })
        }, 30000)
    } else {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval)
            autoRefreshInterval = null
        }
    }
})

onBeforeUnmount(() => {
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
/* Header - Chuẩn hóa theo base.css */
.customers-header {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    margin-bottom: var(--spacing-5);
}

.customers-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
}

.customers-header__title-section {
    flex: 1;
    min-width: 0;
}

.customers-header__title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.customers-header__subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-weight: var(--font-weight-normal);
    font-family: var(--font-family-sans);
}

.customers-header__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
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
    font-size: var(--font-size-base);
    white-space: nowrap;
}

.customers-header__actions .btn {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.customers-header__actions .btn-outline-secondary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.customers-header__actions .btn-outline-secondary:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.customers-header__actions .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.customers-header__actions .btn i {
    font-size: 18px;
    line-height: 1;
}

/* Filter Card - Chuẩn hóa theo base.css */
.filter-card {
    margin-bottom: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.filter-card :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.filter-card :global(.row.g-3) {
    row-gap: var(--spacing-3);
}

.filter-card :global(.form-label) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.filter-card :global(.input-group-text) {
    height: 40px;
    border: 1px solid var(--color-border);
    border-right: none;
    border-radius: var(--radius-sm) 0 0 var(--radius-sm);
    background: var(--color-card-muted);
    color: var(--color-text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 var(--spacing-3);
}

.filter-card :global(.input-group-text i) {
    font-size: 18px;
    line-height: 1;
}

.filter-card :global(.input-group .form-control) {
    height: 40px;
    border-left: none;
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-control),
.filter-card :global(.form-select) {
    height: 40px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    background: var(--color-card);
    color: var(--color-heading);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-control:focus),
.filter-card :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.filter-card :global(.btn) {
    height: 40px;
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
    color: var(--color-primary);
    border-color: var(--color-primary);
    background: var(--color-card);
    font-family: var(--font-family-sans);
}

.filter-card :global(.btn:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.filter-card :global(.btn i) {
    font-size: 18px;
    line-height: 1;
}

/* Tabs Card - Chuẩn hóa theo base.css */
.tabs-card {
    margin-bottom: 0;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.tabs-card :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

/* Customer Tabs - Chuẩn hóa theo base.css */
.customer-tabs {
    display: flex;
    gap: var(--spacing-2);
    background: var(--color-card-muted);
    padding: var(--spacing-2);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    overflow-x: auto;
    margin-bottom: var(--spacing-4);
}

.customer-tab {
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
    white-space: nowrap;
    font-family: var(--font-family-sans);
}

.customer-tab i {
    font-size: 18px;
    line-height: 1;
}

.customer-tab:hover:not(.active) {
    background: var(--color-card);
    color: var(--color-heading);
}

.customer-tab.active {
    background: var(--color-primary);
    color: var(--color-text-inverse);
}

/* Delete Info Card in Modal - Chuẩn hóa */
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

/* Delete Modal - Chuẩn hóa theo base.css */
.customer-delete-modal :global(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-modal);
}

.customer-delete-modal :global(.modal-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
}

.customer-delete-modal :global(.modal-header__content) {
    flex: 1;
}

.customer-delete-modal :global(.modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.customer-delete-modal :global(.modal-subtitle) {
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

.customer-delete-modal :global(.modal-body) {
    padding: var(--spacing-5);
    background: var(--color-card);
}

.customer-delete-modal :global(.modal-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
    gap: var(--spacing-2);
    justify-content: flex-end;
}

.customer-delete-modal :global(.btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    border-radius: var(--radius-sm);
    padding: 8px 16px;
    color: var(--color-primary);
    background: var(--color-card);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.customer-delete-modal :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.customer-delete-modal :global(.btn-danger) {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-text-inverse);
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    gap: 6px;
    font-family: var(--font-family-sans);
}

.customer-delete-modal :global(.btn-danger:hover:not(:disabled)) {
    background: var(--color-danger-dark);
}

.customer-delete-modal :global(.btn-danger:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Responsive cho Customers Page */
@media (max-width: 768px) {
    .customers-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .customers-header__actions {
        width: 100%;
        justify-content: flex-start;
    }

    .customer-tabs {
        gap: var(--spacing-1);
    }

    .customer-tab {
        padding: var(--spacing-2) var(--spacing-3);
        font-size: var(--font-size-base);
    }

    .customer-delete-modal :global(.modal-dialog) {
        max-width: 90%;
        margin: var(--spacing-4) auto;
    }

    .customer-delete-modal :global(.modal-body) {
        padding: var(--spacing-4);
    }
}
</style>
