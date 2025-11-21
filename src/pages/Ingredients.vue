<template>
    <!-- Ingredient Modal -->
    <div class="modal fade" id="ingredientModal" tabindex="-1" ref="modalElement" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content form-modal">
                <div class="modal-header border-0 pb-0">
                    <div>
                        <h5 class="modal-title fw-semibold">{{ isEditing ? 'Cập nhật nguyên liệu' : 'Thêm nguyên liệu mới' }}</h5>
                        <p class="modal-subtitle text-muted mb-0">Chuẩn hoá dữ liệu nguyên liệu để quản lý tồn kho chính xác.</p>
                    </div>
                    <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
                </div>

                <Form @submit="handleSubmit" :validation-schema="ingredientSchema" v-slot="{ errors }">
                    <div class="modal-body">
                        <div class="row g-4">
                            <div class="col-12">
                                <label class="form-label">Tên nguyên liệu <span class="text-danger">*</span></label>
                                <Field name="name" type="text" class="form-control" placeholder="Ví dụ: Sữa tươi"
                                    :class="{ 'is-invalid': errors.name }" v-model="formData.name" />
                                <ErrorMessage name="name" class="invalid-feedback" />
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Đơn vị tính <span class="text-danger">*</span></label>
                                <Field name="unit" type="text" class="form-control" placeholder="kg, lít, cái"
                                    :class="{ 'is-invalid': errors.unit }" v-model="formData.unit" />
                                <ErrorMessage name="unit" class="invalid-feedback" />
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Mức đặt lại</label>
                                <Field name="reorderLevel" type="number" step="0.01" min="0" class="form-control"
                                    placeholder="Nhập ngưỡng cảnh báo" :class="{ 'is-invalid': errors.reorderLevel }"
                                    v-model="formData.reorderLevel" />
                                <div class="form-text">Để trống nếu không muốn theo dõi cảnh báo thiếu hụt.</div>
                                <ErrorMessage name="reorderLevel" class="invalid-feedback" />
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer border-0 pt-0">
                        <button type="button" class="btn btn-outline-secondary" @click="closeModal">Huỷ</button>
                        <button type="submit" class="btn btn-primary"
                            :disabled="createMutation.isPending.value || updateMutation.isPending.value">
                            {{ isEditing ? 'Cập nhật' : 'Thêm mới' }}
                        </button>
                    </div>
                </Form>
            </div>
        </div>
    </div>

    <!-- Adjust Inventory Modal -->
    <div class="modal fade" id="adjustModal" tabindex="-1" ref="adjustModalElement" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content form-modal">
                <div class="modal-header border-0 pb-0">
                    <div>
                        <h5 class="modal-title fw-semibold">Điều chỉnh tồn kho</h5>
                        <p class="modal-subtitle text-muted mb-0">Cập nhật số lượng thực tế và ghi nhận lý do điều chỉnh.</p>
                    </div>
                    <button type="button" class="btn-close" @click="closeAdjustModal" aria-label="Close"></button>
                </div>

                <Form @submit="handleAdjustSubmit" :validation-schema="adjustSchema" v-slot="{ errors }">
                    <div class="modal-body">
                        <div class="inventory-summary rounded-3 p-3 mb-3">
                            <h6 class="mb-1">{{ adjustData.name }}</h6>
                            <p class="mb-0 text-muted">Tồn kho hiện tại: <strong>{{ formatQuantity(adjustData.currentStock) }}</strong></p>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Số lượng tồn mới <span class="text-danger">*</span></label>
                            <Field name="newQuantityOnHand" type="number" step="0.01" min="0" class="form-control"
                                placeholder="Nhập tổng tồn kho sau điều chỉnh"
                                :class="{ 'is-invalid': errors.newQuantityOnHand }" v-model="adjustData.newQuantityOnHand" />
                            <ErrorMessage name="newQuantityOnHand" class="invalid-feedback" />
                        </div>
                        <div>
                            <label class="form-label">Lý do điều chỉnh</label>
                            <Field name="reason" as="textarea" rows="3" class="form-control"
                                placeholder="Ví dụ: Kiểm kê kho, hao hụt, hỏng hóc"
                                :class="{ 'is-invalid': errors.reason }" v-model="adjustData.reason" />
                            <ErrorMessage name="reason" class="invalid-feedback" />
                        </div>
                    </div>
                    <div class="modal-footer border-0 pt-0">
                        <button type="button" class="btn btn-outline-secondary" @click="closeAdjustModal">Huỷ</button>
                        <button type="submit" class="btn btn-primary" :disabled="adjustMutation.isPending.value">
                            Xác nhận
                        </button>
                    </div>
                </Form>
            </div>
        </div>
    </div>

    <div class="ingredients-page container-fluid" data-aos="fade-up">
        <div class="page-header card-shadow">
            <div>
                <h2 class="page-title">Quản lý Nguyên liệu</h2>
                <p class="page-subtitle">Theo dõi tồn kho, ngưỡng cảnh báo và xử lý điều chỉnh kịp thời.</p>
            </div>
            <div class="d-flex flex-wrap gap-2">
                <button class="btn btn-outline-primary" type="button" @click="refetch" :disabled="isFetching">
                    <span v-if="isFetching" class="spinner-border spinner-border-sm me-2"></span>
                    Làm mới
                </button>
                <button class="btn btn-primary" type="button" @click="openModal()">
                    <i class="bi bi-plus-lg me-2"></i>Thêm nguyên liệu
                </button>
            </div>
        </div>

        <div class="row g-4 mb-4 mt-1">
            <div class="col-md-4" v-for="stat in stats" :key="stat.label">
                <div class="stat-card">
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
                            <input type="text" class="form-control" placeholder="Nhập tên nguyên liệu" v-model="searchQuery" />
                        </div>
                    </div>
                    <div class="col-lg-2 col-md-3">
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
                    <div class="alert alert-danger mb-0" role="alert">{{ errorMessage }}</div>
                </div>
                <div v-else class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th scope="col">Tên nguyên liệu</th>
                                <th scope="col">Đơn vị</th>
                                <th scope="col" class="text-end">Tồn kho</th>
                                <th scope="col" class="text-end">Mức đặt lại</th>
                                <th scope="col" class="text-center">Trạng thái</th>
                                <th scope="col" class="text-end">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="ingredient in tableData" :key="ingredient.id">
                                <td class="fw-semibold">{{ ingredient.name }}</td>
                                <td>{{ ingredient.unit }}</td>
                                <td class="text-end">{{ formatQuantity(ingredient.quantityOnHand) }}</td>
                                <td class="text-end">{{ ingredient.reorderLevel != null ? formatQuantity(ingredient.reorderLevel) : '—' }}</td>
                                <td class="text-center">
                                    <span class="badge rounded-pill px-3 py-2" :class="getStatusBadge(ingredient)">
                                        {{ getStatusLabel(ingredient) }}
                                    </span>
                                </td>
                                <td class="text-end">
                                    <div class="btn-group btn-group-sm" role="group">
                                        <button class="btn btn-outline-secondary" type="button" @click="openAdjustModal(ingredient)">
                                            <i class="bi bi-sliders"></i>
                                        </button>
                                        <button class="btn btn-outline-primary" type="button" @click="openModal(ingredient)">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" type="button" @click="handleDelete(ingredient)">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="!tableData.length">
                                <td colspan="6" class="text-center text-muted py-5">Không tìm thấy nguyên liệu phù hợp.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="card-footer bg-transparent" v-if="totalPages > 1">
                <Pagination mode="zero-based" :current-page="zeroBasedPage" :total-pages="totalPages" @page-change="handlePageChange" />
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
import { getIngredients, createIngredient, updateIngredient, deleteIngredient, adjustInventory } from '@/api/ingredientService'
import { usePagination, PaginationMode } from '@/composables/usePagination'
import { showSuccess, showError } from '@/utils/toast'
import { formatNumber } from '@/utils/formatters'

const queryClient = useQueryClient()

const modalElement = ref(null)
const adjustModalElement = ref(null)
const bsModal = ref(null)
const bsAdjustModal = ref(null)

const isEditing = ref(false)
const formData = reactive({ id: null, name: '', unit: '', reorderLevel: '' })
const adjustData = reactive({ ingredientId: null, name: '', currentStock: 0, newQuantityOnHand: '', reason: '' })

const searchQuery = ref('')
const debouncedSearch = ref('')
const pageSizeOptions = [10, 25, 50]

const pagination = usePagination({ mode: PaginationMode.ZERO_BASED, pageSize: pageSizeOptions[0] })
const { currentPage, pageSize, zeroBasedPage, setPage, updatePageSize, resetPage } = pagination

let searchTimeoutId

watch(searchQuery, (value) => {
    clearTimeout(searchTimeoutId)
    searchTimeoutId = setTimeout(() => {
        debouncedSearch.value = value.trim()
        resetPage()
    }, 300)
})

onMounted(() => {
    if (modalElement.value) {
        bsModal.value = new Modal(modalElement.value, { backdrop: 'static' })
    }
    if (adjustModalElement.value) {
        bsAdjustModal.value = new Modal(adjustModalElement.value, { backdrop: 'static' })
    }
})

onUnmounted(() => {
    if (searchTimeoutId) {
        clearTimeout(searchTimeoutId)
    }
    bsModal.value?.dispose()
    bsAdjustModal.value?.dispose()
})

const ingredientSchema = yup.object({
    name: yup.string().trim().required('Tên nguyên liệu là bắt buộc'),
    unit: yup.string().trim().required('Đơn vị là bắt buộc'),
    reorderLevel: yup
        .number()
        .nullable()
        .transform((value, original) => (original === '' || original === null ? null : value))
        .min(0, 'Mức đặt lại không thể âm'),
})

const adjustSchema = yup.object({
    newQuantityOnHand: yup
        .number()
        .required('Số lượng mới là bắt buộc')
        .min(0, 'Số lượng không thể âm'),
    reason: yup.string().nullable().transform((value) => (value === '' ? null : value)),
})

const query = useQuery({
    queryKey: computed(() => ['ingredients', { page: zeroBasedPage.value, size: pageSize.value, keyword: debouncedSearch.value }]),
    queryFn: ({ queryKey }) => {
        const [, params] = queryKey
        return getIngredients({ page: params.page, size: params.size, name: params.keyword || undefined })
    },
    keepPreviousData: true,
})

const { data, isLoading, isError, error, isFetching, refetch } = query

const tableData = computed(() => data.value?.content ?? [])
const totalPages = computed(() => data.value?.totalPages ?? 0)
const totalElements = computed(() => data.value?.totalElements ?? 0)

const lowStockCount = computed(() =>
    tableData.value.filter((item) => item.reorderLevel != null && Number(item.quantityOnHand ?? 0) <= Number(item.reorderLevel)).length
)

const totalOnHand = computed(() =>
    tableData.value.reduce((sum, item) => sum + Number(item.quantityOnHand ?? 0), 0)
)

const stats = computed(() => [
    {
        label: 'Tổng nguyên liệu',
        value: formatNumber(totalElements.value, { maximumFractionDigits: 0 }),
        icon: 'bi bi-droplet-half',
        variant: 'variant-primary'
    },
    {
        label: 'Đang thiếu hụt',
        value: formatNumber(lowStockCount.value, { maximumFractionDigits: 0 }),
        icon: 'bi bi-exclamation-triangle',
        variant: 'variant-warning'
    },
    {
        label: 'Tổng tồn kho (trang)',
        value: formatNumber(totalOnHand.value),
        icon: 'bi bi-archive',
        variant: 'variant-success'
    }
])

const errorMessage = computed(() => error.value?.response?.data?.message || error.value?.message || 'Không thể tải dữ liệu nguyên liệu.')

const formatQuantity = (value) => formatNumber(value, { minimumFractionDigits: 0, maximumFractionDigits: 2 })

const openModal = (ingredient = null) => {
    if (ingredient) {
        isEditing.value = true
        formData.id = ingredient.id
        formData.name = ingredient.name
        formData.unit = ingredient.unit
        formData.reorderLevel = ingredient.reorderLevel ?? ''
    } else {
        isEditing.value = false
        formData.id = null
        formData.name = ''
        formData.unit = ''
        formData.reorderLevel = ''
    }
    bsModal.value?.show()
}

const closeModal = () => {
    bsModal.value?.hide()
}

const openAdjustModal = (ingredient) => {
    adjustData.ingredientId = ingredient.id
    adjustData.name = ingredient.name
    adjustData.currentStock = Number(ingredient.quantityOnHand ?? 0)
    adjustData.newQuantityOnHand = ingredient.quantityOnHand ?? ''
    adjustData.reason = ''
    bsAdjustModal.value?.show()
}

const closeAdjustModal = () => {
    bsAdjustModal.value?.hide()
}

const createMutation = useMutation({
    mutationFn: createIngredient,
    onSuccess: () => {
        showSuccess('Tạo nguyên liệu thành công!')
        queryClient.invalidateQueries({ queryKey: ['ingredients'] })
        closeModal()
    },
    onError: (err) => showError(err.response?.data?.message || 'Không thể tạo nguyên liệu.')
})

const updateMutation = useMutation({
    mutationFn: updateIngredient,
    onSuccess: () => {
        showSuccess('Cập nhật nguyên liệu thành công!')
        queryClient.invalidateQueries({ queryKey: ['ingredients'] })
        closeModal()
    },
    onError: (err) => showError(err.response?.data?.message || 'Không thể cập nhật nguyên liệu.')
})

const deleteMutation = useMutation({
    mutationFn: deleteIngredient,
    onSuccess: () => {
        showSuccess('Xoá nguyên liệu thành công!')
        queryClient.invalidateQueries({ queryKey: ['ingredients'] })
    },
    onError: (err) => showError(err.response?.data?.message || 'Không thể xoá nguyên liệu.')
})

const adjustMutation = useMutation({
    mutationFn: adjustInventory,
    onSuccess: () => {
        showSuccess('Điều chỉnh tồn kho thành công!')
        queryClient.invalidateQueries({ queryKey: ['ingredients'] })
        closeAdjustModal()
    },
    onError: (err) => showError(err.response?.data?.message || err.message || 'Không thể điều chỉnh tồn kho.')
})

const handleSubmit = () => {
    const payload = {
        name: formData.name,
        unit: formData.unit,
        reorderLevel: formData.reorderLevel
    }

    if (isEditing.value) {
        updateMutation.mutate({ id: formData.id, data: payload })
    } else {
        createMutation.mutate(payload)
    }
}

const handleAdjustSubmit = (values) => {
    adjustMutation.mutate({
        ingredientId: adjustData.ingredientId,
        newQuantityOnHand: values.newQuantityOnHand,
        reason: values.reason
    })
}

const handleDelete = (ingredient) => {
    if (confirm(`Bạn có chắc chắn muốn xoá "${ingredient.name}"?`)) {
        deleteMutation.mutate(ingredient.id)
    }
}

const getStatusLabel = (ingredient) => {
    if (ingredient.reorderLevel == null) return 'Không theo dõi'
    return Number(ingredient.quantityOnHand ?? 0) <= Number(ingredient.reorderLevel) ? 'Thiếu hụt' : 'Đủ hàng'
}

const getStatusBadge = (ingredient) => {
    if (ingredient.reorderLevel == null) return 'bg-secondary-subtle text-secondary'
    return Number(ingredient.quantityOnHand ?? 0) <= Number(ingredient.reorderLevel)
        ? 'bg-danger-subtle text-danger'
        : 'bg-success-subtle text-success'
}

const handlePageChange = (page) => {
    setPage(page)
}
</script>

<style scoped>
.ingredients-page {
    padding-bottom: 2rem;
}

.card-shadow {
    background: linear-gradient(120deg, rgba(99, 102, 241, 0.12), rgba(129, 140, 248, 0.08));
    border: 1px solid var(--color-border);
    border-radius: 20px;
    padding: 1.5rem 2rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
}

.page-title {
    font-weight: 700;
    color: var(--color-heading);
    margin-bottom: 0.25rem;
}

.page-subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
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

.variant-warning {
    background: linear-gradient(140deg, #f97316, #fb923c);
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

.filter-card,
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

.table-card .table {
    margin-bottom: 0;
}

.state-block {
    display: flex;
    align-items: center;
    justify-content: center;
}

.form-modal {
    border-radius: 20px;
    border: 1px solid var(--color-border);
    box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);
}

.form-modal .modal-subtitle {
    font-size: 0.9rem;
}

.inventory-summary {
    border: 1px dashed rgba(99, 102, 241, 0.35);
    background: rgba(99, 102, 241, 0.08);
}

.btn-group .btn + .btn {
    margin-left: 0.25rem;
}

@media (max-width: 768px) {
    .card-shadow {
        padding: 1.25rem;
    }

    .stat-card {
        flex-direction: row;
    }
}
</style>
