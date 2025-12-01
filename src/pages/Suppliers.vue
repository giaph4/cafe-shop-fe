<template>
    <Teleport to="body">
        <!-- Supplier Modal -->
        <div class="modal fade" id="supplierModal" tabindex="-1" ref="modalElement" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <div>
                        <h5 class="modal-title">{{ isEditing ? 'Cập nhật nhà cung cấp' : 'Thêm nhà cung cấp mới' }}</h5>
                        <p class="modal-subtitle mb-0">Lưu thông tin chính xác để quản lý chuỗi cung ứng hiệu quả.</p>
                    </div>
                    <button type="button" class="btn-close" @click="closeModal" :disabled="createMutation.isPending.value || updateMutation.isPending.value" aria-label="Close"></button>
                </div>

                <Form @submit="handleSubmit" :validation-schema="supplierSchema" v-slot="{ errors }">
                    <div class="modal-body">
                        <div class="row g-4">
                            <div class="col-md-6">
                                <label class="form-label">Tên nhà cung cấp <span class="text-danger">*</span></label>
                                <Field name="name" type="text" class="form-control" placeholder="Ví dụ: Công ty ABC"
                                    :class="{ 'is-invalid': errors.name }" v-model="formData.name" />
                                <ErrorMessage name="name" class="invalid-feedback" />
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Người liên hệ</label>
                                <Field name="contactPerson" type="text" class="form-control" placeholder="Nguyễn Văn A"
                                    :class="{ 'is-invalid': errors.contactPerson }" v-model="formData.contactPerson" />
                                <ErrorMessage name="contactPerson" class="invalid-feedback" />
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Số điện thoại <span class="text-danger">*</span></label>
                                <Field name="phone" type="text" class="form-control" placeholder="0123456789"
                                    :class="{ 'is-invalid': errors.phone }" v-model="formData.phone" />
                                <ErrorMessage name="phone" class="invalid-feedback" />
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Email</label>
                                <Field name="email" type="email" class="form-control" placeholder="supplier@email.com"
                                    :class="{ 'is-invalid': errors.email }" v-model="formData.email" />
                                <ErrorMessage name="email" class="invalid-feedback" />
                            </div>
                            <div class="col-12">
                                <label class="form-label">Địa chỉ</label>
                                <Field name="address" as="textarea" rows="3" class="form-control"
                                    placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
                                    :class="{ 'is-invalid': errors.address }" v-model="formData.address" />
                                <ErrorMessage name="address" class="invalid-feedback" />
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" @click="closeModal" :disabled="createMutation.isPending.value || updateMutation.isPending.value">Hủy</button>
                        <button type="submit" class="btn btn-primary"
                            :disabled="createMutation.isPending.value || updateMutation.isPending.value">
                            <span v-if="createMutation.isPending.value || updateMutation.isPending.value"
                                class="spinner-border spinner-border-sm me-2"></span>
                            Lưu thay đổi
                        </button>
                    </div>
                </Form>
            </div>
        </div>
        </div>

        <!-- Delete Supplier Confirmation Modal -->
        <div 
            class="modal fade" 
            id="deleteSupplierModal" 
            tabindex="-1" 
            ref="deleteSupplierModalElement" 
            aria-labelledby="deleteSupplierModalLabel"
            aria-hidden="true"
        >
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title" id="deleteSupplierModalLabel">Xóa nhà cung cấp</h5>
                            <p class="modal-subtitle mb-0">Hành động này không thể hoàn tác.</p>
                        </div>
                        <button type="button" class="btn-close" @click="deleteSupplierBsModal?.hide()" :disabled="deleteMutation.isPending.value" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p class="mb-3">Bạn có chắc chắn muốn xóa nhà cung cấp này không?</p>
                        <div v-if="supplierToDelete" class="delete-info-card">
                            <div class="delete-info-item">
                                <span class="delete-info-label">Tên:</span>
                                <span class="delete-info-value">{{ supplierToDelete.name || '—' }}</span>
                            </div>
                            <div class="delete-info-item">
                                <span class="delete-info-label">Người liên hệ:</span>
                                <span class="delete-info-value">{{ supplierToDelete.contactPerson || '—' }}</span>
                            </div>
                            <div class="delete-info-item">
                                <span class="delete-info-label">Số điện thoại:</span>
                                <span class="delete-info-value">{{ supplierToDelete.phone || '—' }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" @click="deleteSupplierBsModal?.hide()" :disabled="deleteMutation.isPending.value">
                            Hủy
                        </button>
                        <button type="button" class="btn btn-danger" @click="confirmDeleteSupplier" :disabled="deleteMutation.isPending.value">
                            <span v-if="deleteMutation.isPending.value" class="spinner-border spinner-border-sm me-2"></span>
                            Xóa nhà cung cấp
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>

    <div class="suppliers-page container-fluid">
        <div class="suppliers-header">
            <div class="suppliers-header__content">
                <div class="suppliers-header__title-section">
                    <h2 class="suppliers-header__title">Quản lý Nhà cung cấp</h2>
                    <p class="suppliers-header__subtitle">Theo dõi thông tin liên hệ và hợp tác chặt chẽ với đối tác cung ứng.</p>
                </div>
                <div class="suppliers-header__actions">
                    <button class="btn btn-outline-secondary btn-sm" type="button" @click="refetch" :disabled="isFetching">
                        <span v-if="isFetching" class="spinner-border spinner-border-sm me-2"></span>
                        Làm mới
                    </button>
                    <button class="btn btn-primary btn-sm" type="button" @click="openModal()">
                        <i class="bi bi-plus-lg me-2"></i>Thêm nhà cung cấp
                    </button>
                </div>
            </div>
        </div>

        <div class="row g-4 mb-4 mt-1">
            <div class="col-md-4 d-flex" v-for="stat in stats" :key="stat.label">
                <div class="stat-card w-100">
                    <div class="stat-icon" :class="stat.variant">
                        <i :class="stat.icon"></i>
                    </div>
                    <div>
                        <p class="stat-label mb-1">{{ stat.label }}</p>
                        <h4 class="stat-value mb-0">{{ stat.value }}</h4>
                    </div>
                </div>
            </div>
        </div>

        <div class="card filter-card mb-4">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-lg-4 col-md-6">
                        <label class="form-label">Tìm kiếm</label>
                        <div class="input-group search-group">
                            <span class="input-group-text"><i class="bi bi-search"></i></span>
                            <input type="text" class="form-control" placeholder="Tên, người liên hệ, SĐT, email"
                                v-model="searchQuery" />
                        </div>
                    </div>
                    <div class="col-lg-2 col-md-3" v-if="supportsPagination">
                        <label class="form-label">Số dòng / trang</label>
                        <select class="form-select" :value="pageSize" @change="updatePageSize($event.target.value)">
                            <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <div class="card table-card">
            <div class="card-body p-0">
                <LoadingState v-if="isLoading" />
                <ErrorState 
                    v-else-if="isError" 
                    :message="errorMessage"
                    @retry="refetch"
                />
                <EmptyState
                    v-else-if="!tableData.length"
                    title="Chưa có nhà cung cấp"
                    message="Tạo nhà cung cấp mới bằng nút ở góc trên bên phải."
                />
                <div v-else class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th scope="col">Tên nhà cung cấp</th>
                                <th scope="col">Người liên hệ</th>
                                <th scope="col">Điện thoại</th>
                                <th scope="col">Email</th>
                                <th scope="col">Địa chỉ</th>
                                <th scope="col" class="text-end">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="supplier in tableData" :key="supplier.id">
                                <td class="fw-semibold">{{ supplier.name }}</td>
                                <td>{{ supplier.contactPerson || '—' }}</td>
                                <td>{{ supplier.phone }}</td>
                                <td>{{ supplier.email || '—' }}</td>
                                <td>{{ supplier.address || '—' }}</td>
                                <td class="text-end">
                                    <div class="action-buttons">
                                        <button class="action-button action-button--primary" type="button" @click="openModal(supplier)">
                                            <i class="bi bi-pencil"></i>
                                            <span>Chỉnh sửa</span>
                                        </button>
                                        <button class="action-button action-button--danger" type="button" @click="handleDelete(supplier)">
                                            <i class="bi bi-trash"></i>
                                            <span>Xóa</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="card-footer bg-transparent" v-if="supportsPagination && totalPages > 1">
                <Pagination mode="zero-based" :current-page="zeroBasedPage" :total-pages="totalPages"
                    @page-change="handlePageChange" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { Teleport } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Modal } from 'bootstrap'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'

import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Pagination from '@/components/common/Pagination.vue'
import { usePagination, PaginationMode } from '@/composables/usePagination'
import { showSuccess, showError } from '@/utils/toast'
import { formatNumber } from '@/utils/formatters'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/api/supplierService'

const queryClient = useQueryClient()

const modalElement = ref(null)
const bsModal = ref(null)
const deleteSupplierModalElement = ref(null)
const deleteSupplierBsModal = ref(null)
const supplierToDelete = ref(null)
const isEditing = ref(false)

const formData = reactive({ id: null, name: '', contactPerson: '', phone: '', email: '', address: '' })

const searchQuery = ref('')
const debouncedSearch = ref('')
const pageSizeOptions = [10, 25, 50]

const pagination = usePagination({ mode: PaginationMode.ZERO_BASED, pageSize: pageSizeOptions[0] })
const { pageSize, zeroBasedPage, setPage, updatePageSize, resetPage } = pagination

let searchTimeoutId

watch(searchQuery, (value) => {
    clearTimeout(searchTimeoutId)
    searchTimeoutId = setTimeout(() => {
        debouncedSearch.value = value.trim()
        if (supportsPagination.value) {
            resetPage()
        }
    }, 300)
})

onMounted(() => {
    if (modalElement.value) {
        bsModal.value = new Modal(modalElement.value, { backdrop: 'static' })
    }
    if (deleteSupplierModalElement.value) {
        deleteSupplierBsModal.value = new Modal(deleteSupplierModalElement.value)
    }
})

onUnmounted(() => {
    if (searchTimeoutId) {
        clearTimeout(searchTimeoutId)
    }
    bsModal.value?.dispose()
})

const phoneRegex = /^(0\d{9})$/
const supplierSchema = yup.object({
    name: yup.string().trim().required('Tên nhà cung cấp là bắt buộc'),
    contactPerson: yup.string().trim().nullable().transform((value) => (value === '' ? null : value)),
    phone: yup
        .string()
        .required('Số điện thoại là bắt buộc')
        .matches(phoneRegex, 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)'),
    email: yup
        .string()
        .trim()
        .nullable()
        .transform((value) => (value === '' ? null : value))
        .email('Email không hợp lệ'),
    address: yup.string().trim().nullable().transform((value) => (value === '' ? null : value)),
})

const query = useQuery({
    queryKey: computed(() => ['suppliers', { page: zeroBasedPage.value, size: pageSize.value, keyword: debouncedSearch.value }]),
    queryFn: ({ queryKey }) => {
        const [, params] = queryKey
        return getSuppliers({ page: params.page, size: params.size, keyword: params.keyword || undefined })
    },
    keepPreviousData: true,
})

const { data, isLoading, isError, error, isFetching, refetch } = query

const rawSuppliers = computed(() => data.value ?? null)
const paginatedContent = computed(() => Array.isArray(rawSuppliers.value?.content) ? rawSuppliers.value.content : null)
const supportsPagination = computed(() => Array.isArray(paginatedContent.value))

const baseItems = computed(() => {
    if (supportsPagination.value) return paginatedContent.value
    if (Array.isArray(rawSuppliers.value)) return rawSuppliers.value
    if (Array.isArray(rawSuppliers.value?.data)) return rawSuppliers.value.data
    return []
})

const tableData = computed(() => {
    if (supportsPagination.value) return baseItems.value

    const keyword = debouncedSearch.value.toLowerCase()
    if (!keyword) return baseItems.value

    return baseItems.value.filter((supplier) => {
        const haystack = [supplier.name, supplier.contactPerson, supplier.phone, supplier.email]
            .filter(Boolean)
            .map((value) => value.toString().toLowerCase())
        return haystack.some((value) => value.includes(keyword))
    })
})

const totalElements = computed(() => {
    if (supportsPagination.value) {
        const total = rawSuppliers.value?.totalElements ?? rawSuppliers.value?.total
        return typeof total === 'number' ? total : baseItems.value.length
    }
    return baseItems.value.length
})

const totalPages = computed(() => {
    if (supportsPagination.value) {
        const total = rawSuppliers.value?.totalPages ?? rawSuppliers.value?.totalPage ?? rawSuppliers.value?.pageInfo?.totalPages
        return typeof total === 'number' ? total : 0
    }
    return baseItems.value.length > 0 ? 1 : 0
})

const emailCount = computed(() => tableData.value.filter((supplier) => supplier.email)?.length ?? 0)
const addressCount = computed(() => tableData.value.filter((supplier) => supplier.address)?.length ?? 0)

const stats = computed(() => [
    {
        label: 'Tổng nhà cung cấp',
        value: formatNumber(totalElements.value, { maximumFractionDigits: 0 }),
        icon: 'bi bi-people',
        variant: 'variant-primary'
    },
    {
        label: 'Có email liên hệ',
        value: formatNumber(emailCount.value, { maximumFractionDigits: 0 }),
        icon: 'bi bi-envelope-open',
        variant: 'variant-info'
    },
    {
        label: 'Có địa chỉ đầy đủ',
        value: formatNumber(addressCount.value, { maximumFractionDigits: 0 }),
        icon: 'bi bi-geo-alt',
        variant: 'variant-success'
    }
])

const errorMessage = computed(() => error.value?.response?.data?.message || error.value?.message || 'Không thể tải dữ liệu nhà cung cấp.')

const openModal = (supplier = null) => {
    if (supplier) {
        isEditing.value = true
        formData.id = supplier.id
        formData.name = supplier.name ?? ''
        formData.contactPerson = supplier.contactPerson ?? ''
        formData.phone = supplier.phone ?? ''
        formData.email = supplier.email ?? ''
        formData.address = supplier.address ?? ''
    } else {
        isEditing.value = false
        formData.id = null
        formData.name = ''
        formData.contactPerson = ''
        formData.phone = ''
        formData.email = ''
        formData.address = ''
    }
    bsModal.value?.show()
}

const closeModal = () => {
    bsModal.value?.hide()
}

const createMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
        showSuccess('Tạo nhà cung cấp thành công!')
        queryClient.invalidateQueries({ queryKey: ['suppliers'] })
        closeModal()
    },
    onError: (err) => showError(err.response?.data?.message || 'Không thể tạo nhà cung cấp.'),
})

const updateMutation = useMutation({
    mutationFn: updateSupplier,
    onSuccess: () => {
        showSuccess('Cập nhật nhà cung cấp thành công!')
        queryClient.invalidateQueries({ queryKey: ['suppliers'] })
        closeModal()
    },
    onError: (err) => showError(err.response?.data?.message || 'Không thể cập nhật nhà cung cấp.'),
})

const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
        showSuccess('Xoá nhà cung cấp thành công!')
        queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
    onError: (err) => showError(err.response?.data?.message || 'Không thể xoá nhà cung cấp này.'),
})

const handleSubmit = (values) => {
    const payload = { ...values }

    if (isEditing.value && formData.id) {
        updateMutation.mutate({ id: formData.id, data: payload })
    } else {
        createMutation.mutate(payload)
    }
}

const handleDelete = (supplier) => {
    supplierToDelete.value = supplier
    deleteSupplierBsModal.value?.show()
}

const confirmDeleteSupplier = () => {
    if (!supplierToDelete.value) return
    const supplier = supplierToDelete.value
    deleteSupplierBsModal.value?.hide()
    deleteMutation.mutate(supplier.id)
    supplierToDelete.value = null
}

const handlePageChange = (page) => {
    setPage(page)
}
</script>

<style scoped lang="scss">
.suppliers-page {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
    padding-bottom: var(--spacing-12);
}

.stat-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    border-radius: 24px;
    padding: var(--spacing-4) var(--spacing-5);
    background: var(--color-card);
    border: 1px solid var(--color-border-soft);
    box-shadow: var(--shadow-soft);
    height: 100%;
    min-height: 120px;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast);
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    background: var(--color-card-muted);
}

.stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    flex-shrink: 0;
    color: #4338ca;
}

.variant-primary {
    background-color: #e0e7ff;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.18);
}

.variant-info {
    background-color: #dbeafe;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.18);
}

.variant-success {
    background-color: #dcfce7;
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.18);
}

.stat-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--spacing-1);
}

.stat-value {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
}

.table-card {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border-soft);
    box-shadow: var(--shadow-soft);
    background: var(--color-card);
}

.filter-card {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border-soft);
    box-shadow: var(--shadow-soft);
    background: var(--color-card);
}

.filter-card .input-group-text {
    background: var(--color-card-muted);
    border-right: none;
    color: var(--color-text-muted);
}

.filter-card .form-control {
    border-left: none;
    background: var(--color-card);
}

.delete-info-card {
    border: 1px dashed var(--color-primary-border-soft);
    background: var(--color-primary-soft);
    border-radius: var(--radius-lg);
    padding: var(--spacing-3);
}

.delete-info-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-3);
    margin-bottom: var(--spacing-2);
}

.delete-info-item:last-child {
    margin-bottom: 0;
}

.delete-info-label {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
}

.delete-info-value {
    color: var(--color-heading);
    font-size: var(--font-size-sm);
    text-align: right;
    flex: 1;
}


:deep(.modal-content) {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-2xl);
}

:deep(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-6);
    background: var(--color-card);
}

:deep(.modal-header .modal-title) {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-1);
}

:deep(.modal-header .modal-subtitle) {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
}

:deep(.modal-body) {
    padding: var(--spacing-6);
}

:deep(.modal-footer) {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-4) var(--spacing-6);
    background: var(--color-card);
}

.suppliers-header {
    padding: var(--spacing-6);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border-soft);
    background: var(--color-card);
    box-shadow: var(--shadow-soft);
}

.suppliers-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-6);
    flex-wrap: wrap;
}

.suppliers-header__title-section {
    flex: 1;
    min-width: 0;
}

.suppliers-header__title {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-tight);
    margin-bottom: var(--spacing-1);
}

.suppliers-header__subtitle {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
}

.suppliers-header__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    flex-wrap: wrap;
    justify-content: flex-end;
}

.action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    justify-content: flex-end;
}

.action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-md);
    border: 1px solid;
    background: var(--color-card);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-fast);
    white-space: nowrap;
}

.action-button--primary {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.action-button--primary:hover:not(:disabled) {
    background: var(--color-primary-soft);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.action-button--danger {
    border-color: var(--color-danger);
    color: var(--color-danger);
    background: var(--color-card);
}

.action-button--danger:hover:not(:disabled) {
    background: var(--color-danger-soft);
    border-color: var(--color-danger);
    color: var(--color-danger);
}

@media (max-width: 768px) {
    .suppliers-header {
        padding: var(--spacing-4);
    }

    .suppliers-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .suppliers-header__actions {
        width: 100%;
        justify-content: stretch;
    }

    .suppliers-header__actions .btn {
        flex: 1;
    }

    .action-buttons {
        flex-direction: column;
        width: 100%;
    }

    .action-button {
        width: 100%;
    }

    .stat-card {
        flex-direction: row;
    }
}
</style>