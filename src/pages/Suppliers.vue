<template>
    <!-- Supplier Modal -->
    <div class="modal fade" id="supplierModal" tabindex="-1" ref="modalElement" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content form-modal">
                <div class="modal-header border-0 pb-0">
                    <div>
                        <h5 class="modal-title fw-semibold">{{ isEditing ? 'Cập nhật nhà cung cấp' : 'Thêm nhà cung cấp mới' }}</h5>
                        <p class="modal-subtitle text-muted mb-0">Lưu thông tin chính xác để quản lý chuỗi cung ứng hiệu quả.</p>
                    </div>
                    <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
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
                    <div class="modal-footer border-0 pt-0">
                        <button type="button" class="btn btn-outline-secondary" @click="closeModal">Hủy</button>
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

    <div class="suppliers-page container-fluid" data-aos="fade-up">
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
                <div v-if="isLoading" class="state-block py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                </div>
                <div v-else-if="isError" class="state-block py-5">
                    <div class="alert alert-danger mb-0">{{ errorMessage }}</div>
                </div>
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
                                        <button class="action-button" type="button" @click="openModal(supplier)">
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
                            <tr v-if="!tableData.length">
                                <td colspan="6" class="text-center text-muted py-5">Không tìm thấy nhà cung cấp phù hợp.</td>
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Modal } from 'bootstrap'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'

import Pagination from '@/components/common/Pagination.vue'
import { usePagination, PaginationMode } from '@/composables/usePagination'
import { showSuccess, showError } from '@/utils/toast'
import { formatNumber } from '@/utils/formatters'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/api/supplierService'

const queryClient = useQueryClient()

const modalElement = ref(null)
const bsModal = ref(null)
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
    if (confirm(`Bạn có chắc chắn muốn xoá nhà cung cấp "${supplier.name}"?`)) {
        deleteMutation.mutate(supplier.id)
    }
}

const handlePageChange = (page) => {
    setPage(page)
}
</script>

<style scoped>
.suppliers-page {
    padding-bottom: 2rem;
}


.stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    border: 1px solid var(--color-border);
    border-radius: 18px;
    padding: 1rem 1.25rem;
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
    height: 100%;
    min-height: 140px;
}

.stat-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: #fff;
}

.variant-primary {
    background: linear-gradient(140deg, #6366f1, #8b5cf6);
}

.variant-info {
    background: linear-gradient(140deg, #0ea5e9, #38bdf8);
}

.variant-success {
    background: linear-gradient(140deg, #22c55e, #4ade80);
}

.stat-label {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

.stat-value {
    font-weight: 700;
    color: var(--color-heading);
}

.table-card {
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.28);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
    background: linear-gradient(180deg, var(--color-card), var(--color-card-accent));
}

.search-group .input-group-text {
    background: transparent;
    border-right: none;
}

.search-group .form-control {
    border-left: none;
}


.form-modal {
    border-radius: 20px;
    border: 1px solid var(--color-border);
    box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);
}

.form-modal .modal-subtitle {
    font-size: 0.9rem;
}

.suppliers-header {
    padding: 1.5rem;
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    background: linear-gradient(165deg, #ffffff, rgba(255, 255, 255, 0.95));
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04);
    margin-bottom: 1.5rem;
}

.suppliers-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
}

.suppliers-header__title-section {
    flex: 1;
    min-width: 0;
}

.suppliers-header__title {
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.25rem;
    font-size: 1.5rem;
    line-height: 1.3;
}

.suppliers-header__subtitle {
    margin-bottom: 0;
    color: #64748b;
    font-size: 0.9rem;
    line-height: 1.5;
}

.suppliers-header__actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: flex-end;
}

.action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: 1px solid rgba(168, 85, 247, 0.3);
    background: #ffffff;
    color: #a855f7;
    font-size: 0.875rem;
    font-weight: 600;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.action-button:hover:not(:disabled) {
    background: rgba(168, 85, 247, 0.05);
    border-color: rgba(168, 85, 247, 0.5);
    transform: translateY(-1px);
}

.action-button:disabled {
    opacity: 0.65;
    pointer-events: none;
}

.action-button--danger {
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
}

.action-button--danger:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.5);
}

:deep(.form-modal) {
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    box-shadow: 0 10px 40px rgba(15, 23, 42, 0.15);
}

:deep(.form-modal .modal-header) {
    border-bottom: 1px solid #e2e8f0;
    padding: 1.5rem;
    background: #ffffff;
}

:deep(.form-modal .modal-title) {
    font-weight: 700;
    color: #1e293b;
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
}

:deep(.form-modal .modal-subtitle) {
    color: #64748b;
    font-size: 0.875rem;
}

:deep(.form-modal .modal-body) {
    padding: 1.5rem;
}

:deep(.form-modal .modal-footer) {
    border-top: 1px solid #e2e8f0;
    padding: 1rem 1.5rem;
    background: #ffffff;
}

@media (max-width: 768px) {
    .suppliers-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .suppliers-header__actions {
        width: 100%;
        justify-content: flex-start;
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