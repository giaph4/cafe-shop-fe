<template>
    <!-- Ingredient Modal -->
    <div class="modal fade" id="ingredientModal" tabindex="-1" ref="modalElement" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content form-modal">
                <div class="modal-header border-0 pb-0">
                    <div>
                        <h5 class="modal-title fw-semibold">{{ isEditing ? 'Cập nhật nguyên liệu' : 'Thêm nguyên liệu mới' }}</h5>
                        <p class="modal-subtitle text-muted mb-0">Nhập thông tin nguyên liệu để quản lý tồn kho hiệu quả hơn.</p>
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
                            <div v-if="adjustData.newQuantityOnHand && !errors.newQuantityOnHand" class="form-text">
                                <span v-if="Number(adjustData.newQuantityOnHand) > adjustData.currentStock" class="text-success">
                                    ➕ Tăng: +{{ formatQuantity(Number(adjustData.newQuantityOnHand) - adjustData.currentStock) }}
                                </span>
                                <span v-else-if="Number(adjustData.newQuantityOnHand) < adjustData.currentStock" class="text-danger">
                                    ➖ Giảm: {{ formatQuantity(Number(adjustData.newQuantityOnHand) - adjustData.currentStock) }}
                                </span>
                                <span v-else class="text-muted">
                                    ➡️ Không thay đổi
                                </span>
                            </div>
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
                        <button type="button" class="btn btn-outline-secondary" @click="closeAdjustModal">Hủy</button>
                        <button type="submit" class="btn btn-primary" :disabled="adjustMutation.isPending.value">
                            <span v-if="adjustMutation.isPending.value" class="spinner-border spinner-border-sm me-2"></span>
                            Lưu thay đổi
                        </button>
                    </div>
                </Form>
            </div>
        </div>
    </div>

    <div class="ingredients-page container-fluid" data-aos="fade-up">
        <div class="ingredients-header">
            <div class="ingredients-header__content">
                <div class="ingredients-header__title-section">
                    <h2 class="ingredients-header__title">Quản lý Nguyên liệu</h2>
                    <p class="ingredients-header__subtitle">Theo dõi tồn kho nguyên liệu, thiết lập cảnh báo và điều chỉnh khi cần.</p>
                </div>
                <div class="ingredients-header__actions">
                    <button class="btn btn-outline-secondary btn-sm" type="button" @click="refetch" :disabled="isFetching">
                        <span v-if="isFetching" class="spinner-border spinner-border-sm me-2"></span>
                        Làm mới
                    </button>
                    <button class="btn btn-primary btn-sm" type="button" @click="openModal()">
                        <i class="bi bi-plus-lg me-2"></i>Thêm nguyên liệu
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
                                    <div class="action-buttons">
                                        <button class="action-button" type="button" @click="openAdjustModal(ingredient)">
                                            <i class="bi bi-sliders"></i>
                                            <span>Điều chỉnh</span>
                                        </button>
                                        <button class="action-button" type="button" @click="openModal(ingredient)">
                                            <i class="bi bi-pencil"></i>
                                            <span>Chỉnh sửa</span>
                                        </button>
                                        <button class="action-button action-button--danger" type="button" @click="handleDelete(ingredient)">
                                            <i class="bi bi-trash"></i>
                                            <span>Xóa</span>
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
            <div class="card-footer bg-transparent" v-if="pagination.totalPages > 1">
                <Pagination mode="zero-based" :current-page="zeroBasedPage" :total-pages="pagination.totalPages" @page-change="handlePageChange" />
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
const { currentPage, pageSize, zeroBasedPage, setPage, updatePageSize, resetPage, updateFromResponse } = pagination

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

// Cập nhật pagination từ response
watch(data, (newData) => {
    if (newData) {
        pagination.updateFromResponse({
            page: newData.number ?? zeroBasedPage.value,
            totalPages: newData.totalPages ?? 0,
            totalElements: newData.totalElements ?? 0
        })
    }
}, { immediate: true })

const totalElements = computed(() => pagination.totalElements)

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

const handleAdjustSubmit = async (values) => {
    const newQuantity = Number(values.newQuantityOnHand)
    const currentQuantity = adjustData.currentStock
    const difference = newQuantity - currentQuantity
    
    // Kiểm tra kho trước khi chỉnh
    const checkResult = await checkInventoryBeforeAdjust({
        ingredientId: adjustData.ingredientId,
        currentQuantity,
        newQuantity,
        difference
    })
    
    if (!checkResult.confirmed) {
        return // User cancelled
    }
    
    // Nếu có cảnh báo nhưng user vẫn muốn tiếp tục
    adjustMutation.mutate({
        ingredientId: adjustData.ingredientId,
        newQuantityOnHand: values.newQuantityOnHand,
        reason: values.reason
    })
}

const checkInventoryBeforeAdjust = async ({ ingredientId, currentQuantity, newQuantity, difference }) => {
    // Tìm nguyên liệu để lấy thông tin reorderLevel
    const ingredient = tableData.value.find(item => item.id === ingredientId)
    const reorderLevel = ingredient?.reorderLevel ? Number(ingredient.reorderLevel) : null
    
    // Tính toán thông tin
    const isDecrease = difference < 0
    const isIncrease = difference > 0
    const willBeBelowReorder = reorderLevel !== null && newQuantity < reorderLevel
    const isCurrentlyBelowReorder = reorderLevel !== null && currentQuantity < reorderLevel
    
    // Tạo thông báo chi tiết
    let message = `Bạn có chắc chắn muốn điều chỉnh tồn kho?\n\n`
    message += `📦 Nguyên liệu: ${adjustData.name}\n`
    message += `📊 Tồn kho hiện tại: ${formatQuantity(currentQuantity)}\n`
    message += `📊 Tồn kho mới: ${formatQuantity(newQuantity)}\n`
    message += `${isIncrease ? '➕' : isDecrease ? '➖' : '➡️'} Chênh lệch: ${isIncrease ? '+' : ''}${formatQuantity(difference)}\n\n`
    
    // Cảnh báo nếu giảm xuống dưới mức đặt lại
    if (willBeBelowReorder && !isCurrentlyBelowReorder) {
        message += `⚠️ CẢNH BÁO: Tồn kho mới sẽ dưới mức đặt lại (${formatQuantity(reorderLevel)})!\n\n`
    } else if (willBeBelowReorder && isCurrentlyBelowReorder) {
        message += `⚠️ LƯU Ý: Tồn kho vẫn dưới mức đặt lại (${formatQuantity(reorderLevel)}).\n\n`
    }
    
    message += `Bạn có muốn tiếp tục?`
    
    return { confirmed: confirm(message) }
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
    // page từ Pagination component là zero-based index
    setPage(page)
}
</script>

<style scoped>
.ingredients-page {
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

.inventory-summary {
    border: 1px dashed rgba(99, 102, 241, 0.35);
    background: rgba(99, 102, 241, 0.08);
}

.ingredients-header {
    padding: 1.5rem;
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    background: linear-gradient(165deg, #ffffff, rgba(255, 255, 255, 0.95));
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04);
    margin-bottom: 1.5rem;
}

.ingredients-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
}

.ingredients-header__title-section {
    flex: 1;
    min-width: 0;
}

.ingredients-header__title {
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.25rem;
    font-size: 1.5rem;
    line-height: 1.3;
}

.ingredients-header__subtitle {
    margin-bottom: 0;
    color: #64748b;
    font-size: 0.9rem;
    line-height: 1.5;
}

.ingredients-header__actions {
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

@media (max-width: 768px) {
    .ingredients-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .ingredients-header__actions {
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
}

@media (max-width: 768px) {
    .stat-card {
        flex-direction: row;
    }
}
</style>
