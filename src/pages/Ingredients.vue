<template>
    <!-- Ingredient Modal -->
    <Teleport to="body">
        <div class="modal fade" id="ingredientModal" tabindex="-1" ref="modalElement" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title">{{ isEditing ? 'Cập nhật nguyên liệu' : 'Thêm nguyên liệu mới' }}</h5>
                            <p class="mb-0 text-muted small">Nhập thông tin nguyên liệu để quản lý tồn kho hiệu quả hơn.</p>
                        </div>
                        <button
                            type="button"
                            class="btn-close"
                            @click="closeModal"
                            :disabled="createMutation.isPending.value || updateMutation.isPending.value"
                            aria-label="Close"
                        ></button>
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
                        <div class="modal-footer">
                            <button
                                type="button"
                                class="btn btn-outline-secondary"
                                @click="closeModal"
                                :disabled="createMutation.isPending.value || updateMutation.isPending.value"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                class="btn btn-primary"
                                :disabled="createMutation.isPending.value || updateMutation.isPending.value"
                            >
                                <span v-if="createMutation.isPending.value || updateMutation.isPending.value"
                                    class="spinner-border spinner-border-sm me-2"></span>
                                {{ isEditing ? 'Cập nhật' : 'Tạo mới' }}
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>

        <!-- Adjust Inventory Modal -->
        <div class="modal fade" id="adjustModal" tabindex="-1" ref="adjustModalElement" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title">Điều chỉnh tồn kho</h5>
                            <p class="mb-0 text-muted small">Cập nhật số lượng thực tế và ghi nhận lý do điều chỉnh.</p>
                        </div>
                        <button
                            type="button"
                            class="btn-close"
                            @click="closeAdjustModal"
                            :disabled="adjustMutation.isPending.value"
                            aria-label="Close"
                        ></button>
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
                        <div class="modal-footer">
                            <button
                                type="button"
                                class="btn btn-outline-secondary"
                                @click="closeAdjustModal"
                                :disabled="adjustMutation.isPending.value"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                class="btn btn-primary"
                                :disabled="adjustMutation.isPending.value"
                            >
                                <span v-if="adjustMutation.isPending.value" class="spinner-border spinner-border-sm me-2"></span>
                                Lưu thay đổi
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <div class="modal fade" ref="deleteModalElement" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title">Xóa nguyên liệu</h5>
                            <p class="mb-0 text-muted small">Hành động này không thể hoàn tác.</p>
                        </div>
                        <button type="button" class="btn-close" @click="closeDeleteModal" :disabled="deleteMutation.isPending.value" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p class="mb-3">Bạn có chắc chắn muốn xóa nguyên liệu này không?</p>
                        <div class="card bg-light">
                            <div class="card-body">
                                <div class="mb-2">
                                    <strong class="text-muted d-block mb-1">Tên nguyên liệu:</strong>
                                    <span>{{ deleteTarget?.name || '—' }}</span>
                                </div>
                                <div class="mb-0">
                                    <strong class="text-muted d-block mb-1">Đơn vị:</strong>
                                    <span>{{ deleteTarget?.unit || '—' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button
                            type="button"
                            class="btn btn-outline-secondary"
                            @click="closeDeleteModal"
                            :disabled="deleteMutation.isPending.value"
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            class="btn btn-danger"
                            @click="handleDeleteConfirm"
                            :disabled="deleteMutation.isPending.value"
                        >
                            <span v-if="deleteMutation.isPending.value" class="spinner-border spinner-border-sm me-2"></span>
                            Xóa nguyên liệu
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Adjust Confirmation Modal -->
        <div class="modal fade" ref="adjustConfirmModalElement" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title">Xác nhận điều chỉnh tồn kho</h5>
                            <p class="mb-0 text-muted small">Vui lòng xem lại thông tin trước khi xác nhận.</p>
                        </div>
                        <button type="button" class="btn-close" @click="handleAdjustCancel" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" v-if="adjustConfirmData">
                        <div class="card mb-3">
                            <div class="card-body">
                                <h6 class="mb-3">{{ adjustConfirmData.name }}</h6>
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <strong class="text-muted d-block mb-1">Tồn kho hiện tại:</strong>
                                        <span class="fs-5">{{ formatQuantity(adjustConfirmData.currentQuantity) }}</span>
                                    </div>
                                    <div class="col-md-6">
                                        <strong class="text-muted d-block mb-1">Tồn kho mới:</strong>
                                        <span class="fs-5">{{ formatQuantity(adjustConfirmData.newQuantity) }}</span>
                                    </div>
                                    <div class="col-12">
                                        <strong class="text-muted d-block mb-1">Chênh lệch:</strong>
                                        <span
                                            class="fs-5"
                                            :class="adjustConfirmData.isIncrease ? 'text-success' : adjustConfirmData.isDecrease ? 'text-danger' : 'text-muted'"
                                        >
                                            {{ adjustConfirmData.isIncrease ? '+' : '' }}{{ formatQuantity(adjustConfirmData.difference) }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-if="adjustConfirmData.willBeBelowReorder" class="alert" :class="adjustConfirmData.isCurrentlyBelowReorder ? 'alert-warning' : 'alert-danger'">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            <strong v-if="!adjustConfirmData.isCurrentlyBelowReorder">CẢNH BÁO:</strong>
                            <span v-else>LƯU Ý:</span>
                            Tồn kho {{ adjustConfirmData.isCurrentlyBelowReorder ? 'vẫn' : 'sẽ' }} dưới mức đặt lại
                            <strong v-if="adjustConfirmData.reorderLevel !== null">({{ formatQuantity(adjustConfirmData.reorderLevel) }})</strong>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button
                            type="button"
                            class="btn btn-outline-secondary"
                            @click="handleAdjustCancel"
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            class="btn btn-primary"
                            @click="handleAdjustConfirm"
                        >
                            Xác nhận điều chỉnh
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>

    <div class="ingredients-page container-fluid" data-aos="fade-up">
        <div class="ingredients-header">
            <div class="ingredients-header__content">
                <div class="ingredients-header__title-section">
                    <h2 class="ingredients-header__title">Quản lý Nguyên liệu</h2>
                    <p class="ingredients-header__subtitle">Theo dõi tồn kho nguyên liệu, thiết lập cảnh báo và điều chỉnh khi cần.</p>
                </div>
                <div class="ingredients-header__actions">
                    <button class="btn btn-outline-secondary btn-sm" type="button" @click="() => refetch()" :disabled="isFetching">
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
                <LoadingState v-if="isLoading" text="Đang tải dữ liệu nguyên liệu..." />
                <ErrorState
                    v-else-if="isError"
                    :message="errorMessage"
                    :show-retry="true"
                    :retry-handler="() => refetch()"
                />
                <template v-else>
                    <EmptyState
                        v-if="!tableData.length"
                        title="Không tìm thấy nguyên liệu"
                        message="Không có nguyên liệu nào phù hợp với bộ lọc hiện tại."
                    >
                        <template #icon>
                            <i class="bi bi-droplet-half"></i>
                        </template>
                        <template #action>
                            <button class="btn btn-primary" @click="openModal()">
                                <i class="bi bi-plus-lg me-2"></i>
                                Thêm nguyên liệu đầu tiên
                            </button>
                        </template>
                    </EmptyState>
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
                                            <button class="action-button action-button--primary" type="button" @click="openAdjustModal(ingredient)" title="Điều chỉnh tồn kho">
                                                <i class="bi bi-sliders"></i>
                                                <span>Điều chỉnh</span>
                                            </button>
                                            <button class="action-button action-button--primary" type="button" @click="openModal(ingredient)" title="Chỉnh sửa">
                                                <i class="bi bi-pencil"></i>
                                                <span>Chỉnh sửa</span>
                                            </button>
                                            <button class="action-button action-button--danger" type="button" @click="handleDelete(ingredient)" title="Xóa">
                                                <i class="bi bi-trash"></i>
                                                <span>Xóa</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </template>
            </div>
            <div class="card-footer bg-transparent" v-if="pagination.totalPages > 1">
                <Pagination mode="zero-based" :current-page="zeroBasedPage" :total-pages="pagination.totalPages" @page-change="handlePageChange" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch, nextTick } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Modal } from 'bootstrap'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'

import Pagination from '@/components/common/Pagination.vue'
import { getIngredients, createIngredient, updateIngredient, deleteIngredient, adjustInventory } from '@/api/ingredientService'
import { usePagination, PaginationMode } from '@/composables/usePagination'
import { showSuccess, showError } from '@/utils/toast'
import { formatNumber } from '@/utils/formatters'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const queryClient = useQueryClient()

const modalElement = ref(null)
const adjustModalElement = ref(null)
const deleteModalElement = ref(null)
const adjustConfirmModalElement = ref(null)
const bsModal = ref(null)
const bsAdjustModal = ref(null)
let deleteModalInstance = null
let adjustConfirmModalInstance = null

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
    if (deleteModalElement.value) {
        deleteModalInstance = new Modal(deleteModalElement.value, { backdrop: 'static' })
    }
    if (adjustConfirmModalElement.value) {
        adjustConfirmModalInstance = new Modal(adjustConfirmModalElement.value, { backdrop: 'static' })
    }
})

onUnmounted(() => {
    if (searchTimeoutId) {
        clearTimeout(searchTimeoutId)
    }
    bsModal.value?.dispose()
    bsAdjustModal.value?.dispose()
    deleteModalInstance?.dispose()
    adjustConfirmModalInstance?.dispose()
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
    
    if (!checkResult?.confirmed) {
        return // User cancelled
    }
    
    // Nếu có cảnh báo nhưng user vẫn muốn tiếp tục
    adjustMutation.mutate({
        ingredientId: adjustData.ingredientId,
        newQuantityOnHand: values.newQuantityOnHand,
        reason: values.reason
    })
}

const adjustConfirmData = ref(null)

const checkInventoryBeforeAdjust = async ({ ingredientId, currentQuantity, newQuantity, difference }) => {
    // Tìm nguyên liệu để lấy thông tin reorderLevel
    const ingredient = tableData.value.find(item => item.id === ingredientId)
    const reorderLevel = ingredient?.reorderLevel ? Number(ingredient.reorderLevel) : null
    
    // Tính toán thông tin
    const isDecrease = difference < 0
    const isIncrease = difference > 0
    const willBeBelowReorder = reorderLevel !== null && newQuantity < reorderLevel
    const isCurrentlyBelowReorder = reorderLevel !== null && currentQuantity < reorderLevel
    
    adjustConfirmData.value = {
        ingredientId,
        name: adjustData.name,
        currentQuantity,
        newQuantity,
        difference,
        isIncrease,
        isDecrease,
        willBeBelowReorder,
        isCurrentlyBelowReorder,
        reorderLevel
    }
    
    return new Promise((resolve) => {
        nextTick(() => {
            adjustConfirmModalInstance?.show()
            // Store resolve để sử dụng trong handleAdjustConfirm
            adjustConfirmData.value.resolve = resolve
        })
    })
}

const handleAdjustConfirm = () => {
    if (adjustConfirmData.value?.resolve) {
        adjustConfirmData.value.resolve({ confirmed: true })
        adjustConfirmModalInstance?.hide()
        adjustConfirmData.value = null
    }
}

const handleAdjustCancel = () => {
    if (adjustConfirmData.value?.resolve) {
        adjustConfirmData.value.resolve({ confirmed: false })
        adjustConfirmModalInstance?.hide()
        adjustConfirmData.value = null
    }
}

const deleteTarget = ref(null)

const handleDelete = (ingredient) => {
    deleteTarget.value = ingredient
    nextTick(() => {
        deleteModalInstance?.show()
    })
}

const handleDeleteConfirm = () => {
    if (deleteTarget.value) {
        deleteMutation.mutate(deleteTarget.value.id)
        deleteModalInstance?.hide()
    }
}

const closeDeleteModal = () => {
    deleteModalInstance?.hide()
    deleteTarget.value = null
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
    padding-bottom: var(--spacing-8);
}

.stat-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: var(--spacing-4) var(--spacing-5);
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-md);
    height: 100%;
    min-height: 140px;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}

.stat-icon {
    width: 52px;
    height: 52px;
    border-radius: var(--radius-lg);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-xl);
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
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
    font-weight: var(--font-weight-medium);
}

.stat-value {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
}

.table-card {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-md);
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

:deep(.modal-header .text-muted) {
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

:deep(.modal-body label) {
    font-weight: var(--font-weight-semibold);
}

.inventory-summary {
    border: 1px dashed var(--color-primary-border-soft);
    background: var(--color-primary-soft);
    border-radius: var(--radius-lg);
    padding: var(--spacing-3);
}

.ingredients-header {
    padding: var(--spacing-6);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-md);
    margin-bottom: var(--spacing-6);
}

.ingredients-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-6);
}

.ingredients-header__title-section {
    flex: 1;
    min-width: 0;
}

.ingredients-header__title {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-tight);
}

.ingredients-header__subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
}

.ingredients-header__actions {
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
