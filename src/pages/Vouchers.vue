<template>
    <Teleport to="body">
        <div class="modal fade" ref="modalElement" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title">{{ isEditing ? 'Cập nhật voucher' : 'Thêm voucher mới' }}</h5>
                            <p class="mb-0 text-muted small">Điền đầy đủ thông tin voucher. Hệ thống sẽ kiểm tra tính hợp lệ trước khi lưu.</p>
                        </div>
                        <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
                    </div>

                    <LoadingState v-if="formLoading" text="Đang tải dữ liệu voucher..." />

                    <Form
                        v-else
                        :key="formKey"
                        :validation-schema="voucherSchema"
                        @submit="handleSubmit"
                        v-slot="{ errors, isSubmitting }"
                    >
                        <div class="modal-body">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label">Mã voucher <span class="text-danger">*</span></label>
                                    <Field
                                        name="code"
                                        type="text"
                                        class="form-control"
                                        v-model="formData.code"
                                        :class="{ 'is-invalid': errors.code }"
                                        autocomplete="off"
                                        maxlength="50"
                                    />
                                    <ErrorMessage name="code" class="invalid-feedback" />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Loại voucher <span class="text-danger">*</span></label>
                                    <Field
                                        name="type"
                                        as="select"
                                        class="form-select"
                                        v-model="formData.type"
                                        :class="{ 'is-invalid': errors.type }"
                                    >
                                        <option value="">Chọn loại</option>
                                        <option v-for="type in VOUCHER_TYPES" :key="type.value" :value="type.value">{{ type.label }}</option>
                                    </Field>
                                    <ErrorMessage name="type" class="invalid-feedback" />
                                </div>
                                <div class="col-12">
                                    <label class="form-label">Mô tả <span class="text-danger">*</span></label>
                                    <Field
                                        name="description"
                                        as="textarea"
                                        rows="2"
                                        class="form-control"
                                        v-model="formData.description"
                                        :class="{ 'is-invalid': errors.description }"
                                        maxlength="255"
                                    />
                                    <ErrorMessage name="description" class="invalid-feedback" />
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Giá trị giảm <span class="text-danger">*</span></label>
                                    <div class="input-group">
                                        <Field
                                            name="discountValue"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            class="form-control"
                                            v-model.number="formData.discountValue"
                                            :class="{ 'is-invalid': errors.discountValue }"
                                        />
                                        <span class="input-group-text" v-if="formData.type === 'PERCENTAGE'">%</span>
                                        <span class="input-group-text" v-else>VND</span>
                                    </div>
                                    <ErrorMessage name="discountValue" class="invalid-feedback" />
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Đơn hàng tối thiểu</label>
                                    <div class="input-group">
                                        <Field
                                            name="minimumOrderAmount"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            class="form-control"
                                            v-model.number="formData.minimumOrderAmount"
                                            :class="{ 'is-invalid': errors.minimumOrderAmount }"
                                        />
                                        <span class="input-group-text">VND</span>
                                    </div>
                                    <ErrorMessage name="minimumOrderAmount" class="invalid-feedback" />
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Giảm tối đa</label>
                                    <div class="input-group">
                                        <Field
                                            name="maximumDiscountAmount"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            class="form-control"
                                            v-model.number="formData.maximumDiscountAmount"
                                            :class="{ 'is-invalid': errors.maximumDiscountAmount }"
                                        />
                                        <span class="input-group-text">VND</span>
                                    </div>
                                    <ErrorMessage name="maximumDiscountAmount" class="invalid-feedback" />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Hiệu lực từ <span class="text-danger">*</span></label>
                                    <Field
                                        name="validFrom"
                                        type="datetime-local"
                                        class="form-control"
                                        v-model="formData.validFrom"
                                        :class="{ 'is-invalid': errors.validFrom }"
                                    />
                                    <ErrorMessage name="validFrom" class="invalid-feedback" />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Hiệu lực đến <span class="text-danger">*</span></label>
                                    <Field
                                        name="validTo"
                                        type="datetime-local"
                                        class="form-control"
                                        v-model="formData.validTo"
                                        :class="{ 'is-invalid': errors.validTo }"
                                    />
                                    <ErrorMessage name="validTo" class="invalid-feedback" />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Giới hạn lượt sử dụng <span class="text-danger">*</span></label>
                                    <Field
                                        name="usageLimit"
                                        type="number"
                                        min="1"
                                        step="1"
                                        class="form-control"
                                        v-model.number="formData.usageLimit"
                                        :class="{ 'is-invalid': errors.usageLimit }"
                                    />
                                    <ErrorMessage name="usageLimit" class="invalid-feedback" />
                                </div>
                                <div class="col-md-6 d-flex align-items-center">
                                    <div class="form-check form-switch mt-4 pt-1">
                                        <Field
                                            name="active"
                                            type="checkbox"
                                            class="form-check-input"
                                            role="switch"
                                            v-model="formData.active"
                                        />
                                        <label class="form-check-label">Kích hoạt ngay</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" @click="closeModal" :disabled="isSubmitting">Hủy</button>
                            <button type="submit" class="btn btn-primary" :disabled="isSubmitting || voucherStore.saving">
                                <span v-if="isSubmitting || voucherStore.saving" class="spinner-border spinner-border-sm me-2"></span>
                                {{ isEditing ? 'Lưu thay đổi' : 'Tạo mới' }}
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>

        <div class="modal fade" ref="deleteModalElement" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title">Xóa voucher</h5>
                            <p class="mb-0 text-muted small">Hành động này không thể hoàn tác.</p>
                        </div>
                        <button type="button" class="btn-close" @click="closeDeleteModal" :disabled="voucherStore.deleting" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p class="mb-3">Bạn có chắc chắn muốn xóa voucher này không?</p>
                        <div class="card bg-light">
                            <div class="card-body">
                                <div class="mb-2">
                                    <strong class="text-muted d-block mb-1">Mã voucher:</strong>
                                    <span>{{ deleteTarget?.code || '—' }}</span>
                                </div>
                                <div class="mb-0">
                                    <strong class="text-muted d-block mb-1">Mô tả:</strong>
                                    <span>{{ deleteTarget?.description || '—' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button
                            type="button"
                            class="btn btn-outline-secondary"
                            @click="closeDeleteModal"
                            :disabled="voucherStore.deleting"
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            class="btn btn-danger"
                            @click="handleDeleteConfirm"
                            :disabled="voucherStore.deleting"
                        >
                            <span v-if="voucherStore.deleting" class="spinner-border spinner-border-sm me-2"></span>
                            Xóa voucher
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>

    <section class="page-container container-fluid vouchers-page" data-aos="fade-up">
        <div class="vouchers-header">
            <div class="vouchers-header__content">
                <div class="vouchers-header__title-section">
                    <h2 class="page-title">Quản lý voucher</h2>
                    <p class="page-subtitle">Tạo và quản lý các mã giảm giá, khuyến mãi cho khách hàng.</p>
            </div>
                <div class="vouchers-header__actions">
                <button class="btn btn-outline-secondary" type="button" @click="handleRefresh" :disabled="loading">
                        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="bi bi-arrow-clockwise me-2"></i>
                        Làm mới
                </button>
                <button class="btn btn-outline-primary" type="button" @click="exportCurrentPage" :disabled="!items.length">
                        <i class="bi bi-file-earmark-arrow-down me-2"></i>
                        Xuất CSV
                </button>
                <button v-if="canManage" class="btn btn-primary" type="button" @click="openCreateModal" :disabled="voucherStore.saving || formLoading">
                        <i class="bi bi-plus-lg me-2"></i>
                        Thêm voucher
                </button>
            </div>
            </div>
        </div>

        <div class="summary-grid" v-if="summaryLoading">
            <article class="summary-card text-center justify-content-center">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2 mb-0 text-muted">Đang tải thống kê voucher...</p>
            </article>
        </div>
        <div class="summary-grid" v-else>
            <article class="summary-card summary-card--active">
                <div class="summary-icon summary-icon--active">
                    <i class="bi bi-check-circle"></i>
                </div>
                <div>
                    <p class="summary-label">Đang hoạt động</p>
                    <p class="summary-value">{{ summary.activeCount }}</p>
                </div>
            </article>
            <article class="summary-card summary-card--inactive">
                <div class="summary-icon summary-icon--inactive">
                    <i class="bi bi-pause-circle"></i>
                </div>
                <div>
                    <p class="summary-label">Ngừng hoạt động</p>
                    <p class="summary-value">{{ summary.inactiveCount }}</p>
                </div>
            </article>
            <article class="summary-card summary-card--expiring">
                <div class="summary-icon summary-icon--expiring">
                    <i class="bi bi-hourglass-split"></i>
                </div>
                <div>
                    <p class="summary-label">Sắp hết hạn (7 ngày)</p>
                    <p class="summary-value">{{ summary.expiringSoonCount }}</p>
                </div>
            </article>
            <article class="summary-card summary-card--redeemed">
                <div class="summary-icon summary-icon--redeemed">
                    <i class="bi bi-ticket-perforated"></i>
                </div>
                <div>
                    <p class="summary-label">Đã sử dụng</p>
                    <p class="summary-value">{{ summary.redeemedCount }}</p>
                </div>
            </article>
        </div>

        <div v-if="errorMessage" class="error-banner">
            <span class="error-banner__icon">
                <i class="bi bi-exclamation-triangle-fill"></i>
            </span>
            <div class="error-banner__content">
                <p class="error-banner__title">Không thể tải dữ liệu voucher</p>
                <p class="error-banner__message mb-0">{{ errorMessage }}</p>
            </div>
        </div>

        <div class="card filter-card mb-4">
            <div class="card-body">
            <div class="filter-grid">
                <div class="filter-item">
                    <label class="form-label">Tìm theo mã</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-search"></i></span>
                        <input type="text" class="form-control" v-model.trim="filterDraft.code" placeholder="Nhập mã voucher" />
                    </div>
                </div>
                <div class="filter-item">
                    <label class="form-label">Loại voucher</label>
                    <select class="form-select" v-model="filterDraft.type">
                        <option value="">Tất cả</option>
                        <option v-for="type in VOUCHER_TYPES" :key="type.value" :value="type.value">{{ type.label }}</option>
                    </select>
                </div>
                <div class="filter-item">
                    <label class="form-label">Trạng thái</label>
                    <select class="form-select" v-model="filterDraft.active">
                        <option value="">Tất cả</option>
                        <option value="true">Đang hoạt động</option>
                        <option value="false">Ngừng hoạt động</option>
                    </select>
                </div>
                <div class="filter-item">
                    <label class="form-label">Hiệu lực từ</label>
                    <input type="datetime-local" class="form-control" v-model="filterDraft.validFrom" />
                </div>
                <div class="filter-item">
                    <label class="form-label">Hiệu lực đến</label>
                    <input type="datetime-local" class="form-control" v-model="filterDraft.validTo" />
                </div>
                <div class="filter-actions">
                    <button class="btn btn-outline-secondary" type="button" @click="handleFilterReset" :disabled="loading">
                        Đặt lại
                    </button>
                    <button class="btn btn-primary" type="button" @click="handleFilterApply" :disabled="loading">
                        Áp dụng
                    </button>
                </div>
                </div>
            </div>
        </div>

        <div class="table-card">
            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                        <tr>
                            <th scope="col">Mã</th>
                            <th scope="col">Mô tả</th>
                            <th scope="col">Loại</th>
                            <th scope="col">Giá trị</th>
                            <th scope="col">Đơn tối thiểu</th>
                            <th scope="col">Giảm tối đa</th>
                            <th scope="col">Hiệu lực</th>
                            <th scope="col">Sử dụng</th>
                            <th scope="col">Trạng thái</th>
                            <th scope="col">Cập nhật</th>
                            <th scope="col" class="text-end">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading">
                            <td colspan="11" class="text-center py-5">
                                <LoadingState text="Đang tải dữ liệu voucher..." />
                            </td>
                        </tr>
                        <tr v-else-if="!items.length">
                            <td colspan="11" class="text-center py-5">
                                <EmptyState
                                    title="Không có voucher"
                                    message="Không có voucher nào phù hợp với bộ lọc hiện tại."
                                >
                                    <template #icon>
                                        <i class="bi bi-ticket-perforated"></i>
                                    </template>
                                </EmptyState>
                            </td>
                        </tr>
                        <tr v-for="voucher in items" :key="voucher.id">
                            <td class="fw-semibold">{{ voucher.code }}</td>
                            <td>{{ voucher.description }}</td>
                            <td>
                                <span class="badge rounded-pill" :class="voucher.type === 'PERCENTAGE' ? 'bg-info-subtle text-info' : 'bg-primary-subtle text-primary'">
                                    {{ voucher.type === 'PERCENTAGE' ? 'Giảm %' : 'Giảm cố định' }}
                                </span>
                            </td>
                            <td>
                                <span v-if="voucher.type === 'PERCENTAGE'">{{ formatNumber(voucher.discountValue) }}%</span>
                                <span v-else>{{ formatCurrencySafe(voucher.discountValue) }}</span>
                            </td>
                            <td>{{ voucher.minimumOrderAmount ? formatCurrencySafe(voucher.minimumOrderAmount) : '—' }}</td>
                            <td>{{ voucher.maximumDiscountAmount ? formatCurrencySafe(voucher.maximumDiscountAmount) : (voucher.type === 'PERCENTAGE' ? 'Không giới hạn' : '—') }}</td>
                            <td>
                                <div class="d-flex flex-column gap-1">
                                    <small class="text-muted">Từ: {{ formatDateTime(voucher.validFrom) }}</small>
                                    <small class="text-muted">Đến: {{ formatDateTime(voucher.validTo) }}</small>
                                </div>
                            </td>
                            <td>{{ voucher.timesUsed }} / {{ voucher.usageLimit }}</td>
                            <td>
                                <span class="badge rounded-pill" :class="voucher.active ? 'bg-success' : 'bg-secondary'">
                                    {{ voucher.active ? 'Đang hoạt động' : 'Ngừng hoạt động' }}
                                </span>
                            </td>
                            <td>{{ formatDateTime(voucher.updatedAt || voucher.createdAt) }}</td>
                            <td class="text-end">
                                <div class="action-buttons">
                                    <button class="action-button action-button--primary" type="button" @click="openEditModal(voucher)" title="Chỉnh sửa">
                                        <i class="bi bi-pencil"></i>
                                        <span>Chỉnh sửa</span>
                                    </button>
                                    <button
                                        class="action-button action-button--warning"
                                        type="button"
                                        @click="handleToggle(voucher)"
                                        :disabled="voucherStore.toggling"
                                        :title="voucher.active ? 'Tạm ngưng' : 'Kích hoạt'"
                                    >
                                        <i class="bi" :class="voucher.active ? 'bi-pause-circle' : 'bi-play-circle'"></i>
                                        <span>{{ voucher.active ? 'Tạm ngưng' : 'Kích hoạt' }}</span>
                                    </button>
                                    <button
                                        class="action-button action-button--danger"
                                        type="button"
                                        @click="handleDelete(voucher)"
                                        :disabled="voucher.timesUsed > 0 || voucherStore.deleting"
                                        title="Xóa"
                                    >
                                        <i class="bi bi-trash"></i>
                                        <span>Xóa</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="table-footer" v-if="pagination.totalPages > 1">
                <div>
                    <label class="form-label me-2 mb-0">Hiển thị</label>
                    <select class="form-select form-select-sm d-inline-flex w-auto" :value="pagination.size" @change="handlePageSizeChange($event.target.value)">
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </select>
                    <span class="ms-2 text-muted">mục / trang</span>
                </div>
                <Pagination
                    :current-page="pagination.page"
                    :total-pages="pagination.totalPages"
                    @page-change="handlePageChange"
                />
            </div>
        </div>
    </section>
</template>

<script setup>
import {computed, onMounted, onUnmounted, reactive, ref, watch, nextTick} from 'vue'
import {Form, Field, ErrorMessage} from 'vee-validate'
import * as yup from 'yup'
import {Modal} from 'bootstrap'
import {toast} from 'vue3-toastify'
import {storeToRefs} from 'pinia'
import {useVoucherStore} from '@/store/voucher'
import {VOUCHER_TYPES} from '@/api/voucherService'
import {formatCurrency, formatDateTime, formatNumber} from '@/utils/formatters'
import Pagination from '@/components/common/Pagination.vue'
import {useAuthStore} from '@/store/auth'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const voucherStore = useVoucherStore()
const authStore = useAuthStore()
const {items, pagination, loading, summary, summaryLoading, errorMessage} = storeToRefs(voucherStore)
const {userRoles} = storeToRefs(authStore)

// Chỉ ROLE_MANAGER và ROLE_ADMIN mới được phép thao tác tạo/sửa/xoá.
const canManage = computed(() => userRoles.value.includes('ROLE_ADMIN') || userRoles.value.includes('ROLE_MANAGER'))

const modalElement = ref(null)
const bsModal = ref(null)
const isEditing = ref(false)
const formLoading = ref(false)
const formKey = ref(0)

const defaultFormState = () => ({
    id: null,
    code: '',
    description: '',
    type: '',
    discountValue: '',
    minimumOrderAmount: '',
    maximumDiscountAmount: '',
    validFrom: '',
    validTo: '',
    usageLimit: 1,
    active: true
})

const formData = reactive(defaultFormState())

const filters = voucherStore.filters
const filterDraft = reactive({
    code: '',
    type: '',
    active: '',
    validFrom: '',
    validTo: ''
})

// Chuẩn hoá message trả về từ backend trước khi hiển thị.
const normalizeMessage = (err) => {
    const message = err?.response?.data?.message || err?.message || errorMessage.value
    if (!message) return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.'
    if (message.toLowerCase().includes('đã tồn tại')) return 'Mã voucher đã tồn tại. Vui lòng chọn mã khác.'
    if (message.toLowerCase().includes('usageLimit'.toLowerCase())) return 'Giới hạn lượt sử dụng phải lớn hơn hoặc bằng số lượt đã dùng hiện tại.'
    if (message.toLowerCase().includes('không thể xóa voucher')) return 'Không thể xoá voucher đã được sử dụng.'
    if (message.toLowerCase().includes('validfrom phải trước validto')) return 'Thời gian hiệu lực không hợp lệ: "Hiệu lực từ" phải sớm hơn "Hiệu lực đến".'
    if (message.toLowerCase().includes('voucher không tồn tại')) return 'Voucher không tồn tại hoặc đã bị xoá.'
    if (message.toLowerCase().includes('voucher code không được bỏ trống')) return 'Mã voucher là bắt buộc.'
    return message
}

const formatDateTimeInput = (value) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const yyyy = date.getFullYear()
    const mm = `${date.getMonth() + 1}`.padStart(2, '0')
    const dd = `${date.getDate()}`.padStart(2, '0')
    const hh = `${date.getHours()}`.padStart(2, '0')
    const min = `${date.getMinutes()}`.padStart(2, '0')
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

const syncFilterDraft = () => {
    filterDraft.code = filters.code || ''
    filterDraft.type = filters.type || ''
    filterDraft.active = filters.active === '' ? '' : String(filters.active)
    filterDraft.validFrom = formatDateTimeInput(filters.validFrom)
    filterDraft.validTo = formatDateTimeInput(filters.validTo)
}

watch(filters, () => {
    syncFilterDraft()
}, {deep: true})

const formatCurrencySafe = (value) => {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return ''
    return formatCurrency(numeric)
}

const resetFormState = () => {
    Object.assign(formData, defaultFormState())
    formKey.value += 1
}

const populateForm = (voucher) => {
    formData.id = voucher.id
    formData.code = voucher.code ?? ''
    formData.description = voucher.description ?? ''
    formData.type = voucher.type ?? ''
    formData.discountValue = voucher.discountValue != null ? Number(voucher.discountValue) : ''
    formData.minimumOrderAmount = voucher.minimumOrderAmount != null ? Number(voucher.minimumOrderAmount) : ''
    formData.maximumDiscountAmount = voucher.maximumDiscountAmount != null ? Number(voucher.maximumDiscountAmount) : ''
    formData.validFrom = formatDateTimeInput(voucher.validFrom)
    formData.validTo = formatDateTimeInput(voucher.validTo)
    formData.usageLimit = voucher.usageLimit != null ? Number(voucher.usageLimit) : 1
    formData.active = Boolean(voucher.active)
    formKey.value += 1
}

const voucherSchema = yup.object({
    code: yup.string().trim().max(50, 'Tối đa 50 ký tự').required('Mã voucher là bắt buộc'),
    description: yup.string().trim().max(255, 'Tối đa 255 ký tự').required('Mô tả là bắt buộc'),
    type: yup.string().oneOf(VOUCHER_TYPES.map((item) => item.value), 'Loại voucher không hợp lệ').required('Loại voucher là bắt buộc'),
    discountValue: yup
        .number()
        .transform((value, originalValue) => {
            if (originalValue === null || originalValue === undefined || originalValue === '') return Number.NaN
            const numeric = Number(originalValue)
            return Number.isFinite(numeric) ? numeric : Number.NaN
        })
        .typeError('Giá trị giảm phải là số hợp lệ')
        .moreThan(0, 'Giá trị giảm phải lớn hơn 0')
        .when('type', {
            is: 'PERCENTAGE',
            then: (schema) => schema.max(100, 'Giảm phần trăm tối đa 100%'),
            otherwise: (schema) => schema
        })
        .required('Giá trị giảm là bắt buộc'),
    minimumOrderAmount: yup
        .number()
        .transform((value, originalValue) => {
            if (originalValue === null || originalValue === undefined || originalValue === '') return null
            const numeric = Number(originalValue)
            return Number.isFinite(numeric) ? numeric : null
        })
        .nullable()
        .typeError('Giá trị tối thiểu phải là số hợp lệ')
        .test('min-order-positive', 'Đơn hàng tối thiểu phải lớn hơn 0', (value) => value === null || value > 0),
    maximumDiscountAmount: yup
        .number()
        .transform((value, originalValue) => {
            if (originalValue === null || originalValue === undefined || originalValue === '') return null
            const numeric = Number(originalValue)
            return Number.isFinite(numeric) ? numeric : null
        })
        .nullable()
        .typeError('Giảm tối đa phải là số hợp lệ')
        .test('max-discount-positive', 'Giảm tối đa phải lớn hơn 0', (value) => value === null || value > 0)
        .test('fixed-amount-check', 'Giảm tối đa không được nhỏ hơn giá trị giảm', function (value) {
            if (this.parent.type !== 'FIXED_AMOUNT' || value === null || value === undefined) return true
            return value >= this.parent.discountValue
        }),
    validFrom: yup.string().required('Thời gian bắt đầu là bắt buộc'),
    validTo: yup
        .string()
        .required('Thời gian kết thúc là bắt buộc')
        .test('after-start', '"Hiệu lực đến" phải sau "Hiệu lực từ"', function (value) {
            if (!value || !this.parent.validFrom) return true
            return new Date(value) > new Date(this.parent.validFrom)
        }),
    usageLimit: yup
        .number()
        .typeError('Giới hạn lượt sử dụng phải là số nguyên dương')
        .integer('Giới hạn lượt sử dụng phải là số nguyên')
        .moreThan(0, 'Giới hạn lượt sử dụng phải lớn hơn 0')
        .required('Giới hạn lượt sử dụng là bắt buộc'),
    active: yup.boolean()
})

const initialize = async () => {
    try {
        syncFilterDraft()
        await Promise.all([voucherStore.loadSummary(), voucherStore.loadVouchers()])
    } catch (err) {
        toast.error(normalizeMessage(err))
    }
}

const handleRefresh = async () => {
    try {
        await Promise.all([voucherStore.loadSummary(), voucherStore.loadVouchers()])
        toast.success('Đã làm mới dữ liệu voucher.')
    } catch (err) {
        toast.error(normalizeMessage(err))
    }
}

const handleFilterApply = async () => {
    try {
        voucherStore.setFilters({
            code: filterDraft.code,
            type: filterDraft.type,
            active: filterDraft.active,
            validFrom: filterDraft.validFrom,
            validTo: filterDraft.validTo
        })
        await voucherStore.loadVouchers()
        syncFilterDraft()
    } catch (err) {
        toast.error(normalizeMessage(err))
    }
}

const handleFilterReset = async () => {
    try {
        voucherStore.resetFilters()
        syncFilterDraft()
        await voucherStore.loadVouchers()
    } catch (err) {
        toast.error(normalizeMessage(err))
    }
}

const handlePageChange = async (page) => {
    voucherStore.setPage(page)
    try {
        await voucherStore.loadVouchers()
    } catch (err) {
        toast.error(normalizeMessage(err))
    }
}

const handlePageSizeChange = async (size) => {
    voucherStore.setPageSize(Number(size))
    try {
        await voucherStore.loadVouchers()
    } catch (err) {
        toast.error(normalizeMessage(err))
    }
}

const openCreateModal = () => {
    if (!canManage.value) return
    isEditing.value = false
    resetFormState()
    bsModal.value?.show()
}

const openEditModal = async (voucher) => {
    if (!canManage.value) return
    formLoading.value = true
    isEditing.value = true
    resetFormState()
    try {
        const detail = await voucherStore.fetchVoucher(voucher.id)
        populateForm(detail)
        bsModal.value?.show()
    } catch (err) {
        toast.error(normalizeMessage(err))
    } finally {
        formLoading.value = false
    }
}

const closeModal = () => {
    bsModal.value?.hide()
}

const handleSubmit = async () => {
    try {
        formData.code = formData.code?.toString().trim().toUpperCase()
        if (isEditing.value && formData.id) {
            await voucherStore.update(formData.id, formData)
            toast.success('Đã cập nhật voucher thành công.')
        } else {
            await voucherStore.create(formData)
            toast.success('Đã tạo voucher mới.')
        }
        closeModal()
    } catch (err) {
        toast.error(normalizeMessage(err))
    }
}

const handleToggle = async (voucher) => {
    try {
        const updated = await voucherStore.toggle(voucher.id)
        toast.success(updated.active ? 'Voucher đã được kích hoạt.' : 'Voucher đã được tạm ngưng.')
    } catch (err) {
        toast.error(normalizeMessage(err))
    }
}

const deleteTarget = ref(null)
const deleteModalElement = ref(null)
let deleteModalInstance = null

const handleDelete = (voucher) => {
    if (voucher.timesUsed > 0) {
        toast.warning('Voucher đã có lượt sử dụng, không thể xoá.')
        return
    }
    deleteTarget.value = voucher
    nextTick(() => {
        deleteModalInstance?.show()
    })
}

const handleDeleteConfirm = async () => {
    if (!deleteTarget.value) return
    try {
        await voucherStore.remove(deleteTarget.value.id)
        toast.success('Đã xoá voucher.')
        deleteModalInstance?.hide()
        deleteTarget.value = null
    } catch (err) {
        toast.error(normalizeMessage(err))
    }
}

const closeDeleteModal = () => {
    deleteModalInstance?.hide()
    deleteTarget.value = null
}

const exportCurrentPage = () => {
    if (!items.value.length) {
        toast.info('Không có dữ liệu để xuất.')
        return
    }

    const headers = ['Mã', 'Mô tả', 'Loại', 'Giá trị', 'Đơn tối thiểu', 'Giảm tối đa', 'Hiệu lực từ', 'Hiệu lực đến', 'Đã dùng', 'Giới hạn', 'Trạng thái', 'Cập nhật']
    const rows = items.value.map((voucher) => [
        voucher.code,
        voucher.description,
        voucher.type,
        voucher.type === 'PERCENTAGE' ? `${voucher.discountValue}%` : voucher.discountValue,
        voucher.minimumOrderAmount ?? '',
        voucher.maximumDiscountAmount ?? '',
        formatDateTime(voucher.validFrom),
        formatDateTime(voucher.validTo),
        voucher.timesUsed,
        voucher.usageLimit,
        voucher.active ? 'ACTIVE' : 'INACTIVE',
        formatDateTime(voucher.updatedAt || voucher.createdAt)
    ])

    const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n')

    const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const currentPage = pagination.value?.page ?? 1
    link.setAttribute('download', `vouchers_page_${currentPage}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

onMounted(() => {
    if (modalElement.value) {
        bsModal.value = new Modal(modalElement.value, {backdrop: 'static'})
    }
    if (deleteModalElement.value) {
        deleteModalInstance = new Modal(deleteModalElement.value, {backdrop: 'static'})
    }
    initialize()
})

onUnmounted(() => {
    bsModal.value?.dispose()
    deleteModalInstance?.dispose()
})
</script>

<style scoped>
.vouchers-page {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
    padding-bottom: var(--spacing-12);
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

/* Header Styles */
.vouchers-header {
    background: var(--color-card);
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-soft);
    margin-bottom: var(--spacing-6);
    padding: var(--spacing-6);
}

.vouchers-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-6);
    flex-wrap: wrap;
}

.vouchers-header__title-section {
    flex: 1;
    min-width: 0;
}

.vouchers-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-3);
    align-items: center;
    justify-content: flex-end;
}

.page-title {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-tight);
}

.page-subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
}

/* Action Buttons */
.action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    justify-content: flex-end;
    align-items: center;
}

.action-button {
    display: inline-flex;
    align-items: center;
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

.action-button--primary:hover {
    background: var(--color-primary-soft);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.action-button--warning {
    border-color: var(--color-warning);
    color: var(--color-warning);
    background: var(--color-card);
}

.action-button--warning:hover {
    background: var(--color-warning-soft);
    border-color: var(--color-warning);
    color: var(--color-warning);
}

.action-button--danger {
    border-color: var(--color-danger);
    color: var(--color-danger);
    background: var(--color-card);
}

.action-button--danger:hover {
    background: var(--color-danger-soft);
    border-color: var(--color-danger);
    color: var(--color-danger);
}

.action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-4);
}

.summary-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    border-radius: 24px;
    border: 1px solid rgba(226, 232, 240, 0.5);
    background: #f8fafc;
    padding: var(--spacing-5) var(--spacing-6);
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.summary-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.06);
}

.summary-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    font-size: 1.75rem;
    color: #6366f1;
}

.summary-icon--active {
    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
}

.summary-icon--inactive {
    background: linear-gradient(135deg, #e5e7eb, #e2e8f0);
    box-shadow: 0 2px 8px rgba(148, 163, 184, 0.18);
}

.summary-icon--expiring {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
}

.summary-icon--redeemed {
    background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
    box-shadow: 0 2px 8px rgba(79, 70, 229, 0.18);
}

.summary-label {
    margin-bottom: var(--spacing-0);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
}

.summary-value {
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-xl);
    color: var(--color-heading);
}


.filter-grid {
    display: grid;
    gap: var(--spacing-4);
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.filter-item .form-label {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
}

.filter-actions {
    display: flex;
    gap: var(--spacing-3);
    align-items: flex-end;
}

.table-card {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-md);
    overflow: hidden;
}

.table-card table {
    margin: 0;
}

.table-card thead {
    background: rgba(148, 163, 184, 0.12);
}

.table-card th {
    border-bottom: 0;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
    text-transform: uppercase;
    font-size: var(--font-size-xs);
}

.table-card td {
    vertical-align: middle;
}

.table-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-4);
    padding: var(--spacing-3) var(--spacing-6) var(--spacing-5);
    border-top: 1px solid var(--color-border);
}

@media (max-width: 992px) {
    .vouchers-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .vouchers-header__actions {
        width: 100%;
        justify-content: flex-start;
    }

    .action-buttons {
        flex-direction: column;
        width: 100%;
    }

    .action-button {
        width: 100%;
        justify-content: center;
    }

    .table-card {
        border-radius: 16px;
    }

    .table-card table {
        min-width: 1100px;
    }
}

.dark-theme .vouchers-header,
.dark-theme .filter-card,
.dark-theme .table-card,
.dark-theme .summary-card {
    border-color: rgba(129, 140, 248, 0.28);
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(17, 24, 39, 0.92));
    box-shadow: 0 24px 46px rgba(2, 6, 23, 0.55);
}

.comfort-theme .vouchers-header,
.comfort-theme .filter-card,
.comfort-theme .table-card,
.comfort-theme .summary-card {
    border-color: rgba(95, 111, 148, 0.25);
    background: linear-gradient(170deg, rgba(245, 241, 235, 0.98), rgba(236, 232, 226, 0.92));
}
</style>
