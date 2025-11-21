<template>
    <div class="customers-page" data-aos="fade-up">
        <div class="page-header d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div>
                <h2 class="page-title mb-1">Quản lý Khách hàng</h2>
                <p class="text-muted mb-0">Theo dõi thông tin, lịch sử mua hàng và điểm thưởng của khách hàng.</p>
            </div>
            <div class="d-flex flex-wrap align-items-center gap-2">
                <span v-if="totalCustomerCount > -1" class="badge rounded-pill bg-light text-dark">
                    <i class="bi bi-people me-2"></i>
                    Tổng khách hàng: {{ totalCustomerCount.toLocaleString('vi-VN') }}
                </span>
                <button v-if="canManage" class="btn btn-primary" type="button" @click="openCreateModal">
                    <i class="bi bi-person-plus me-2"></i>
                    Thêm khách hàng
                </button>
            </div>
        </div>

        <div class="card filter-card mb-4">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-xl-4 col-lg-5 col-md-6">
                        <label class="form-label">Tìm kiếm</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="bi bi-search"></i></span>
                            <input
                                type="text"
                                class="form-control"
                                placeholder="Tên, SĐT hoặc email khách hàng"
                                v-model="filters.keyword"
                                :disabled="loading"
                            />
                        </div>
                        <div class="form-text">Nhập từ khóa để tìm theo tên, số điện thoại hoặc email.</div>
                    </div>
                    <div class="col-md-auto ms-md-auto">
                        <div class="d-flex gap-2 justify-content-md-end">
                            <button
                                class="btn btn-outline-secondary"
                                type="button"
                                @click="resetFilters"
                                :disabled="loading || !filters.keyword"
                            >
                                Đặt lại
                            </button>
                            <button class="btn btn-outline-primary" type="button" @click="refreshList" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                                Làm mới
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card data-card mb-4">
            <div class="card-body">
                <div v-if="loading" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Đang tải...</span>
                    </div>
                </div>
                <div v-else-if="error" class="alert alert-warning mb-0">
                    {{ error }}
                </div>
                <template v-else>
                    <div v-if="!customers.length">
                        <EmptyState
                            title="Chưa có khách hàng phù hợp"
                            message="Điều chỉnh bộ lọc hoặc tạo khách hàng mới để bắt đầu quản lý."
                        >
                            <template #action>
                                <button v-if="canManage" class="btn btn-primary" type="button" @click="openCreateModal">
                                    <i class="bi bi-person-plus me-2"></i>
                                    Thêm khách hàng
                                </button>
                            </template>
                        </EmptyState>
                    </div>
                    <div v-else class="table-responsive">
                        <table class="table table-hover align-middle">
                            <thead class="table-light">
                                <tr>
                                    <th scope="col">Khách hàng</th>
                                    <th scope="col">Liên hệ</th>
                                    <th scope="col" class="text-center">Điểm thưởng</th>
                                    <th scope="col">Ngày tạo</th>
                                    <th scope="col">Cập nhật</th>
                                    <th scope="col" class="text-end">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="customer in customers" :key="customer.id">
                                    <td>
                                        <div class="d-flex flex-column">
                                            <button class="btn btn-link p-0 text-start fw-semibold" type="button" @click="openDetailDrawer(customer.id)">
                                                {{ customer.fullName || '—' }}
                                            </button>
                                            <small class="text-muted">Mã KH: {{ customer.id }}</small>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="d-flex flex-column">
                                            <span><i class="bi bi-telephone me-1"></i>{{ customer.phone || '—' }}</span>
                                            <span class="text-muted small"><i class="bi bi-envelope me-1"></i>{{ customer.email || '—' }}</span>
                                        </div>
                                    </td>
                                    <td class="text-center">
                                        <span class="badge bg-soft-primary">
                                            {{ formatLoyaltyPoints(customer.loyaltyPoints) }}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="text-muted small">{{ formatDate(customer.createdAt) }}</div>
                                    </td>
                                    <td>
                                        <div class="text-muted small">{{ formatDate(customer.updatedAt) }}</div>
                                    </td>
                                    <td class="text-end">
                                        <div class="btn-group btn-group-sm action-group" role="group" aria-label="Thao tác khách hàng">
                                            <button class="btn btn-outline-secondary" type="button" title="Xem chi tiết" @click="openDetailDrawer(customer.id)">
                                                <i class="bi bi-eye"></i>
                                            </button>
                                            <router-link
                                                :to="{ name: 'Chi tiết Khách hàng', params: { id: customer.id } }"
                                                class="btn btn-outline-secondary"
                                                title="Lịch sử mua hàng"
                                            >
                                                <i class="bi bi-receipt"></i>
                                            </router-link>
                                            <button
                                                v-if="canManage"
                                                class="btn btn-outline-secondary"
                                                type="button"
                                                title="Chỉnh sửa"
                                                @click="openEditModal(customer)"
                                            >
                                                <i class="bi bi-pencil"></i>
                                            </button>
                                            <button
                                                v-if="canDelete"
                                                class="btn btn-outline-danger"
                                                type="button"
                                                title="Xóa khách hàng"
                                                @click="confirmDelete(customer)"
                                                :disabled="deleting"
                                            >
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </template>
            </div>
            <div class="card-footer d-flex justify-content-end" v-if="!loading && customers.length && totalPages > 1">
                <Pagination
                    mode="zero-based"
                    :current-page="zeroBasedPage"
                    :total-pages="totalPages"
                    @page-change="handlePageChange"
                />
            </div>
        </div>

        <CustomerDetailDrawer
            :customer-id="detailState.customerId"
            :visible="detailState.visible"
            :initial-tab="detailState.initialTab"
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
            <div class="modal fade" tabindex="-1" aria-hidden="true" ref="deleteModalRef">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Xóa khách hàng</h5>
                            <button type="button" class="btn-close" @click="closeDeleteModal" :disabled="deleting"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-2">Bạn có chắc chắn muốn xóa khách hàng này không?</p>
                            <p class="mb-0 text-muted">
                                Khách hàng: <strong>{{ deleteTarget?.fullName || '—' }}</strong><br />
                                Số điện thoại: {{ deleteTarget?.phone || '—' }}
                            </p>
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

import EmptyState from '@/components/common/EmptyState.vue'
import Pagination from '@/components/common/Pagination.vue'
import CustomerFormModal from '@/components/customers/CustomerFormModal.vue'
import CustomerDetailDrawer from '@/components/customers/CustomerDetailDrawer.vue'
import { PaginationMode, usePagination } from '@/composables/usePagination'
import { useAuthStore } from '@/store/auth'
import {
    createCustomer,
    deleteCustomer,
    getCustomers,
    updateCustomer
} from '@/api/customerService'
import { formatDateTime } from '@/utils/formatters'

const router = useRouter()
const route = useRoute()

const authStore = useAuthStore()
const { isAdmin, isManager, isStaff } = storeToRefs(authStore)

const canManage = computed(() => isAdmin.value || isManager.value || isStaff.value)
const canDelete = computed(() => isAdmin.value)

const filters = reactive({
    keyword: typeof route.query.keyword === 'string' ? route.query.keyword : ''
})

const customers = ref([])
const loading = ref(false)
const error = ref('')

const formState = reactive({
    visible: false,
    mode: 'create',
    submitting: false,
    initialData: null
})

const detailState = reactive({
    visible: false,
    customerId: null,
    initialTab: 'overview'
})

const customerFormModalRef = ref(null)
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

const fetchCustomers = async () => {
    loading.value = true
    error.value = ''
    try {
        const response = await getCustomers({
            keyword: filters.keyword?.trim() || '',
            page: zeroBasedPage.value,
            size: pageSize.value
        })

        const list = Array.isArray(response?.content) ? response.content : []
        customers.value = list

        const { adjusted } = updateFromResponse({
            page: response?.number,
            totalPages: response?.totalPages,
            totalElements: response?.totalElements
        })

        suppressWatcherFetch = adjusted
    } catch (err) {
        console.error('Failed to fetch customers', err)
        error.value = err?.response?.data?.message || 'Không thể tải danh sách khách hàng. Vui lòng thử lại.'
        customers.value = []
    } finally {
        loading.value = false
    }
}

watch(
    () => [zeroBasedPage.value, pageSize.value],
    () => {
        if (suppressWatcherFetch) {
            suppressWatcherFetch = false
            return
        }
        fetchCustomers()
    },
    { immediate: true }
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
                fetchCustomers()
            }
        }, 400)
    }
)

const resetFilters = () => {
    filters.keyword = ''
}

const refreshList = () => {
    fetchCustomers()
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
        email: customer.email || ''
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
        fetchCustomers()
    } catch (err) {
        console.error('Failed to submit customer form', err)
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
    detailState.initialTab = initialTab
    detailState.visible = true
}



const handleDetailClose = () => {
    detailState.visible = false
    detailState.customerId = null
}

const handleDetailEdit = (customer) => {
    if (!canManage.value || !customer) return
    detailState.visible = false
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
        await deleteCustomer(deleteTarget.value.id)
        toast.success('Đã xóa khách hàng thành công.')
        closeDeleteModal()
        fetchCustomers()
    } catch (err) {
        console.error('Failed to delete customer', err)
        const message = err?.response?.data?.message
            || 'Không thể xóa khách hàng. Vui lòng kiểm tra và thử lại.'
        toast.error(message)
    } finally {
        deleting.value = false
    }
}

const handlePageChange = (page) => {
    setPageFromZero(page)
}

const formatDate = (value) => {
    if (!value) return '—'
    return formatDateTime(value)
}

const formatLoyaltyPoints = (points) => {
    const numeric = Number(points)
    if (!Number.isFinite(numeric)) return '0'
    return numeric.toLocaleString('vi-VN')
}

const totalCustomerCount = computed(() => totalElements.value ?? 0)

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

onBeforeUnmount(() => {
    if (keywordDebounceId) {
        clearTimeout(keywordDebounceId)
    }
    if (deleteModalInstance) {
        deleteModalInstance.hide()
        deleteModalInstance.dispose()
        deleteModalInstance = null
    }
})
</script>

<style scoped>
.customers-page {
    padding-bottom: 3rem;
}

.page-title {
    font-weight: 700;
}

.filter-card,
.data-card {
    border: none;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
    border-radius: var(--radius-lg, 18px);
}

.filter-card .card-body {
    padding: 1.75rem;
}

.data-card .card-body {
    padding: 0;
}

.data-card .card-body > *:not(.table-responsive) {
    padding: 2rem;
}

.table {
    margin-bottom: 0;
}

.table thead th {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-muted, #64748b);
}

.table tbody tr:hover {
    background: rgba(99, 102, 241, 0.04);
}

.action-group .btn {
    border-radius: 999px;
    min-width: 36px;
    min-height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.action-group .btn i {
    font-size: 0.95rem;
}

.bg-soft-primary {
    background: rgba(99, 102, 241, 0.12);
    color: var(--color-primary, #4f46e5);
    font-weight: 600;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
}

.card-footer {
    border-top: none;
    padding: 1rem 1.75rem 1.75rem;
}

.form-text {
    font-size: 0.85rem;
    color: var(--color-text-muted, #64748b);
}

@media (max-width: 767.98px) {
    .filter-card .card-body {
        padding: 1.25rem;
    }

    .data-card .card-body > *:not(.table-responsive) {
        padding: 1.5rem;
    }

    .action-group {
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 0.35rem;
    }
}
</style>
