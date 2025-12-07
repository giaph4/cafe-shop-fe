<template>
    <div data-aos="fade-up">
        <Teleport to="body">
            <div class="modal fade" ref="modalElement" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <div>
                                <h5 class="modal-title">{{ isEditing ? 'Cập nhật voucher' : 'Thêm voucher mới' }}</h5>
                                <p class="modal-subtitle">Điền đầy đủ thông tin voucher. Hệ thống sẽ kiểm tra tính hợp
                                    lệ trước khi lưu.</p>
                            </div>
                            <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
                        </div>

                        <LoadingState v-if="formLoading" text="Đang tải dữ liệu voucher..." />

                        <Form v-else :key="formKey" :validation-schema="voucherSchema" @submit="handleSubmit"
                            v-slot="{ errors, isSubmitting }">
                            <div class="modal-body">
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Mã voucher <span
                                                class="required-mark">*</span></label>
                                        <Field name="code" type="text" class="form-control" v-model="formData.code"
                                            :class="{ 'is-invalid': errors.code }" autocomplete="off" maxlength="50" />
                                        <ErrorMessage name="code" class="invalid-feedback" />
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Loại voucher <span
                                                class="required-mark">*</span></label>
                                        <Field name="type" as="select" class="form-select" v-model="formData.type"
                                            :class="{ 'is-invalid': errors.type }">
                                            <option value="">Chọn loại</option>
                                            <option v-for="type in VOUCHER_TYPES" :key="type.value" :value="type.value">
                                                {{ type.label }}</option>
                                        </Field>
                                        <ErrorMessage name="type" class="invalid-feedback" />
                                    </div>
                                    <div class="col-12">
                                        <label class="form-label">Mô tả <span class="required-mark">*</span></label>
                                        <Field name="description" as="textarea" rows="2" class="form-control"
                                            v-model="formData.description" :class="{ 'is-invalid': errors.description }"
                                            maxlength="255" />
                                        <ErrorMessage name="description" class="invalid-feedback" />
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Giá trị giảm <span
                                                class="required-mark">*</span></label>
                                        <div class="input-group">
                                            <Field name="discountValue" type="number" step="0.01" min="0"
                                                class="form-control" v-model.number="formData.discountValue"
                                                :class="{ 'is-invalid': errors.discountValue }" />
                                            <span class="input-group-text"
                                                v-if="formData.type === 'PERCENTAGE'">%</span>
                                            <span class="input-group-text" v-else>VND</span>
                                        </div>
                                        <ErrorMessage name="discountValue" class="invalid-feedback" />
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Đơn hàng tối thiểu</label>
                                        <div class="input-group">
                                            <Field name="minimumOrderAmount" type="number" step="0.01" min="0"
                                                class="form-control" v-model.number="formData.minimumOrderAmount"
                                                :class="{ 'is-invalid': errors.minimumOrderAmount }" />
                                            <span class="input-group-text">VND</span>
                                        </div>
                                        <ErrorMessage name="minimumOrderAmount" class="invalid-feedback" />
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Giảm tối đa</label>
                                        <div class="input-group">
                                            <Field name="maximumDiscountAmount" type="number" step="0.01" min="0"
                                                class="form-control" v-model.number="formData.maximumDiscountAmount"
                                                :class="{ 'is-invalid': errors.maximumDiscountAmount }" />
                                            <span class="input-group-text">VND</span>
                                        </div>
                                        <ErrorMessage name="maximumDiscountAmount" class="invalid-feedback" />
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Hiệu lực từ <span
                                                class="required-mark">*</span></label>
                                        <Field name="validFrom" type="datetime-local" class="form-control"
                                            v-model="formData.validFrom" :class="{ 'is-invalid': errors.validFrom }" />
                                        <ErrorMessage name="validFrom" class="invalid-feedback" />
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Hiệu lực đến <span
                                                class="required-mark">*</span></label>
                                        <Field name="validTo" type="datetime-local" class="form-control"
                                            v-model="formData.validTo" :class="{ 'is-invalid': errors.validTo }" />
                                        <ErrorMessage name="validTo" class="invalid-feedback" />
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Giới hạn lượt sử dụng <span
                                                class="required-mark">*</span></label>
                                        <Field name="usageLimit" type="number" min="1" step="1" class="form-control"
                                            v-model.number="formData.usageLimit"
                                            :class="{ 'is-invalid': errors.usageLimit }" />
                                        <ErrorMessage name="usageLimit" class="invalid-feedback" />
                                    </div>
                                    <div class="col-md-6 d-flex align-items-center">
                                        <div class="form-switch-wrapper">
                                            <Field name="active" type="checkbox" class="form-check-input" role="switch"
                                                v-model="formData.active" />
                                            <label class="form-check-label">Kích hoạt ngay</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-outline-secondary" @click="closeModal"
                                    :disabled="isSubmitting">Hủy</button>
                                <button type="submit" class="btn btn-primary"
                                    :disabled="isSubmitting || voucherStore.saving">
                                    <span v-if="isSubmitting || voucherStore.saving"
                                        class="spinner-border spinner-border-sm me-2"></span>
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
                                <p class="modal-subtitle">Hành động này không thể hoàn tác.</p>
                            </div>
                            <button type="button" class="btn-close" @click="closeDeleteModal"
                                :disabled="voucherStore.deleting" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p class="delete-confirm-text">Bạn có chắc chắn muốn xóa voucher này không?</p>
                            <div class="delete-info-card">
                                <div class="delete-info-item">
                                    <strong class="delete-info-label">Mã voucher:</strong>
                                    <span class="delete-info-value">{{ deleteTarget?.code || '—' }}</span>
                                </div>
                                <div class="delete-info-item">
                                    <strong class="delete-info-label">Mô tả:</strong>
                                    <span class="delete-info-value">{{ deleteTarget?.description || '—' }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" @click="closeDeleteModal"
                                :disabled="voucherStore.deleting">
                                Hủy
                            </button>
                            <button type="button" class="btn btn-danger" @click="handleDeleteConfirm"
                                :disabled="voucherStore.deleting">
                                <span v-if="voucherStore.deleting" class="spinner-border spinner-border-sm me-2"></span>
                                Xóa voucher
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>

        <section class="page-container container-fluid vouchers-page"
            style="background: var(--color-body-bg); padding: var(--spacing-4);">
            <div class="vouchers-header">
                <div class="vouchers-header__content">
                    <div class="vouchers-header__title-section">
                        <h2 class="page-title">Quản lý voucher</h2>
                        <p class="page-subtitle">Tạo và quản lý các mã giảm giá, khuyến mãi cho khách hàng.</p>
                    </div>
                    <div class="vouchers-header__actions">
                        <button class="btn btn-outline-secondary" type="button" @click="handleRefresh"
                            :disabled="loading">
                            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                            <i v-else class="bi bi-arrow-clockwise me-2"></i>
                            Làm mới
                        </button>
                        <button class="btn btn-outline-primary" type="button" @click="exportCurrentPage"
                            :disabled="!items.length">
                            <i class="bi bi-file-earmark-arrow-down me-2"></i>
                            Xuất CSV
                        </button>
                        <button v-if="canManage" class="btn btn-primary" type="button" @click="openCreateModal"
                            :disabled="voucherStore.saving || formLoading">
                            <i class="bi bi-plus-lg me-2"></i>
                            Thêm voucher
                        </button>
                    </div>
                </div>
            </div>

            <div class="summary-grid" v-if="summaryLoading">
                <article class="summary-card summary-card--loading">
                    <div class="summary-loading">
                        <div class="spinner-border spinner-border-sm" role="status"></div>
                        <p class="summary-loading-text">Đang tải thống kê voucher...</p>
                    </div>
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
                    <p class="error-banner__message">{{ errorMessage }}</p>
                </div>
            </div>

            <div class="card filter-card">
                <div class="card-body">
                    <div class="filter-grid">
                        <div class="filter-item">
                            <label class="form-label">Tìm theo mã</label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="bi bi-search"></i></span>
                                <input type="text" class="form-control" v-model.trim="filterDraft.code"
                                    placeholder="Nhập mã voucher" />
                            </div>
                        </div>
                        <div class="filter-item">
                            <label class="form-label">Loại voucher</label>
                            <select class="form-select" v-model="filterDraft.type">
                                <option value="">Tất cả</option>
                                <option v-for="type in VOUCHER_TYPES" :key="type.value" :value="type.value">{{
                                    type.label }}</option>
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
                            <button class="btn btn-outline-secondary" type="button" @click="handleFilterReset"
                                :disabled="loading">
                                Đặt lại
                            </button>
                            <button class="btn btn-primary" type="button" @click="handleFilterApply"
                                :disabled="loading">
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
                                <th scope="col" class="table-actions-header">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="loading">
                                <td colspan="11" class="table-loading">
                                    <LoadingState text="Đang tải dữ liệu voucher..." />
                                </td>
                            </tr>
                            <tr v-else-if="!items.length">
                                <td colspan="11" class="table-empty">
                                    <EmptyState title="Không có voucher"
                                        message="Không có voucher nào phù hợp với bộ lọc hiện tại.">
                                        <template #icon>
                                            <i class="bi bi-ticket-perforated"></i>
                                        </template>
                                    </EmptyState>
                                </td>
                            </tr>
                            <tr v-for="voucher in items" :key="voucher.id">
                                <td class="voucher-code">{{ voucher.code }}</td>
                                <td>{{ voucher.description }}</td>
                                <td>
                                    <span class="badge badge-type"
                                        :class="voucher.type === 'PERCENTAGE' ? 'badge-type--percentage' : 'badge-type--fixed'">
                                        {{ voucher.type === 'PERCENTAGE' ? 'Giảm %' : 'Giảm cố định' }}
                                    </span>
                                </td>
                                <td>
                                    <span v-if="voucher.type === 'PERCENTAGE'">{{ formatNumber(voucher.discountValue)
                                        }}%</span>
                                    <span v-else>{{ formatCurrencySafe(voucher.discountValue) }}</span>
                                </td>
                                <td>{{ voucher.minimumOrderAmount ? formatCurrencySafe(voucher.minimumOrderAmount) : '—'
                                    }}</td>
                                <td>{{ voucher.maximumDiscountAmount ? formatCurrencySafe(voucher.maximumDiscountAmount)
                                    : (voucher.type ===
                                    'PERCENTAGE' ? 'Không giới hạn' : '—') }}</td>
                                <td>
                                    <div class="voucher-validity">
                                        <div class="voucher-validity-item">
                                            <span class="voucher-validity-label">Từ:</span>
                                            <span class="voucher-validity-value">{{ formatDateTime(voucher.validFrom)
                                                }}</span>
                                        </div>
                                        <div class="voucher-validity-item">
                                            <span class="voucher-validity-label">Đến:</span>
                                            <span class="voucher-validity-value">{{ formatDateTime(voucher.validTo)
                                                }}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>{{ voucher.timesUsed }} / {{ voucher.usageLimit }}</td>
                                <td>
                                    <span class="badge badge-status"
                                        :class="voucher.active ? 'badge-status--active' : 'badge-status--inactive'">
                                        {{ voucher.active ? 'Đang hoạt động' : 'Ngừng hoạt động' }}
                                    </span>
                                </td>
                                <td>{{ formatDateTime(voucher.updatedAt || voucher.createdAt) }}</td>
                                <td class="table-actions-cell">
                                    <div class="action-buttons">
                                        <button class="action-button action-button--primary" type="button"
                                            @click="openEditModal(voucher)" title="Chỉnh sửa">
                                            <i class="bi bi-pencil"></i>
                                            <span>Chỉnh sửa</span>
                                        </button>
                                        <button class="action-button action-button--warning" type="button"
                                            @click="handleToggle(voucher)" :disabled="voucherStore.toggling"
                                            :title="voucher.active ? 'Tạm ngưng' : 'Kích hoạt'">
                                            <i class="bi"
                                                :class="voucher.active ? 'bi-pause-circle' : 'bi-play-circle'"></i>
                                            <span>{{ voucher.active ? 'Tạm ngưng' : 'Kích hoạt' }}</span>
                                        </button>
                                        <button class="action-button action-button--danger" type="button"
                                            @click="handleDelete(voucher)"
                                            :disabled="voucher.timesUsed > 0 || voucherStore.deleting" title="Xóa">
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
                        <label class="pagination-label">Hiển thị</label>
                        <select class="pagination-select" :value="pagination.size"
                            @change="handlePageSizeChange($event.target.value)">
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                        </select>
                        <span class="pagination-text">mục / trang</span>
                    </div>
                    <Pagination :current-page="pagination.page" :total-pages="pagination.totalPages"
                        @page-change="handlePageChange" />
                </div>
            </div>
        </section>
    </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch, nextTick } from 'vue'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { Modal } from 'bootstrap'
import { toast } from 'vue3-toastify'
import { storeToRefs } from 'pinia'
import { useVoucherStore } from '@/store/voucher'
import { VOUCHER_TYPES } from '@/api/voucherService'
import { formatCurrency, formatDateTime, formatNumber } from '@/utils/formatters'
import Pagination from '@/components/common/Pagination.vue'
import { useAuthStore } from '@/store/auth'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const voucherStore = useVoucherStore()
const authStore = useAuthStore()
const { items, pagination, loading, summary, summaryLoading, errorMessage } = storeToRefs(voucherStore)
const { userRoles } = storeToRefs(authStore)

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
}, { deep: true })

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

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
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
        bsModal.value = new Modal(modalElement.value, { backdrop: 'static' })
    }
    if (deleteModalElement.value) {
        deleteModalInstance = new Modal(deleteModalElement.value, { backdrop: 'static' })
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

/* Modal Styles */
:deep(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-modal);
}

:deep(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4);
    background: var(--color-card);
}

:deep(.modal-header .modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

:deep(.modal-header .text-muted) {
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

:deep(.modal-body) {
    padding: var(--spacing-5);
    background: var(--color-card);
}

:deep(.modal-footer) {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-4);
    background: var(--color-card);
}

:deep(.modal-body label) {
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

:deep(.form-control.is-invalid),
:deep(.form-select.is-invalid) {
    border-color: var(--color-danger);
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23ef4444'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath d='m5.8 3.6 .4.4.4-.4m0 4.8-.4-.4-.4.4'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right calc(0.375em + 0.1875rem) center;
    background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
    padding-right: calc(1.5em + 0.75rem);
}

:deep(.form-control),
:deep(.form-select) {
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

:deep(.form-control:focus),
:deep(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

:deep(.invalid-feedback) {
    display: block;
    width: 100%;
    margin-top: var(--spacing-1);
    font-size: var(--font-size-sm);
    color: var(--color-danger);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

/* Header Styles */
.vouchers-header {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    margin-bottom: 0;
    padding: var(--spacing-4);
}

.vouchers-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    flex-wrap: wrap;
}

.vouchers-header__title-section {
    flex: 1;
    min-width: 0;
}

.vouchers-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    align-items: center;
    justify-content: flex-end;
}

.page-title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.page-subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

/* Error Banner */
.error-banner {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-3);
    padding: var(--spacing-4) var(--spacing-5);
    background: var(--color-soft-rose);
    border: 1px solid var(--color-danger);
    border-radius: var(--radius-sm);
    margin-bottom: var(--spacing-4);
}

.error-banner__icon {
    color: var(--color-danger);
    font-size: var(--font-size-lg);
    flex-shrink: 0;
    margin-top: var(--spacing-1);
}

.error-banner__content {
    flex: 1;
    min-width: 0;
}

.error-banner__title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-danger);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.error-banner__message {
    color: var(--color-heading);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
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
    gap: 6px;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid;
    background: var(--color-card);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
    white-space: nowrap;
    cursor: pointer;
    font-family: var(--font-family-sans);
}

.action-button--primary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.action-button--primary:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.action-button--warning {
    border-color: var(--color-border);
    color: var(--color-warning);
    background: var(--color-card);
}

.action-button--warning:hover:not(:disabled) {
    background: var(--color-warning);
    border-color: var(--color-warning);
    color: var(--color-text-inverse);
}

.action-button--danger {
    border-color: var(--color-border);
    color: var(--color-danger);
    background: var(--color-card);
}

.action-button--danger:hover:not(:disabled) {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-text-inverse);
}

.action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
}

/* Summary Cards */
.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-4);
}

.summary-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    padding: var(--spacing-4);
    transition: all var(--transition-base);
}

.summary-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

.summary-icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-sm);
    display: grid;
    place-items: center;
    font-size: var(--font-size-xl);
    flex-shrink: 0;
}

.summary-icon--active {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.summary-icon--inactive {
    background: var(--color-card-muted);
    color: var(--color-text-muted);
}

.summary-icon--expiring {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.summary-icon--redeemed {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.summary-label {
    margin-bottom: var(--spacing-0);
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.summary-value {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-xl);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

/* Filter Card */
.filter-card {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-4);
    margin-bottom: var(--spacing-4);
}

.filter-card .card-body {
    padding: 0;
    background: var(--color-card);
}

.filter-grid {
    display: grid;
    gap: var(--spacing-4);
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.filter-item .form-label {
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.filter-actions {
    display: flex;
    gap: var(--spacing-2);
    align-items: flex-end;
}

/* Table Card */
.table-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    overflow: hidden;
}

.table-card table {
    margin: 0;
    border-collapse: separate;
    border-spacing: 0;
}

.table-card thead {
    background: var(--color-card-muted);
}

.table-card th {
    border-bottom: 1px solid var(--color-border);
    border-top: none;
    border-left: none;
    border-right: none;
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    padding: var(--spacing-3) var(--spacing-4);
    font-family: var(--font-family-sans);
}

.table-card tbody tr {
    transition: background-color var(--transition-base);
}

.table-card tbody tr:hover {
    background: var(--color-card-muted);
}

.table-card td {
    vertical-align: middle;
    padding: var(--spacing-3) var(--spacing-4);
    font-size: var(--font-size-base);
    color: var(--color-heading);
    border-bottom: 1px solid var(--color-border);
    border-top: none;
    border-left: none;
    border-right: none;
    font-family: var(--font-family-sans);
}

.table-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-4);
    padding: var(--spacing-4) var(--spacing-6);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
}

/* Badge Styles */
.badge-type {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-sm);
    font-family: var(--font-family-sans);
}

.badge-type--percentage {
    background: var(--color-soft-sky);
    border: 1px solid var(--color-info);
    color: var(--color-info);
}

.badge-type--fixed {
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
}

.badge-status {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-sm);
    font-family: var(--font-family-sans);
}

.badge-status--active {
    background: var(--color-soft-emerald);
    border: 1px solid var(--color-success);
    color: var(--color-success);
}

.badge-status--inactive {
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
}

/* Delete Modal Info Card */
.delete-info-card {
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-4);
}

.delete-info-item {
    margin-bottom: var(--spacing-3);
}

.delete-info-item:last-child {
    margin-bottom: 0;
}

.delete-info-label {
    display: block;
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.delete-info-value {
    display: block;
    color: var(--color-heading);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

/* Summary Loading State */
.summary-card--loading {
    justify-content: center;
    align-items: center;
    min-height: 120px;
}

.summary-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-3);
}

.summary-loading .spinner-border {
    width: 2rem;
    height: 2rem;
    border-width: 0.2em;
    color: var(--color-primary);
}

.summary-loading-text {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
}

/* Required Mark */
.required-mark {
    color: var(--color-danger);
    font-weight: var(--font-weight-bold);
    margin-left: var(--spacing-1);
}

/* Modal Subtitle */
.modal-subtitle {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

/* Delete Confirm Text */
.delete-confirm-text {
    margin-bottom: var(--spacing-4);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

/* Voucher Code */
.voucher-code {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

/* Voucher Validity */
.voucher-validity {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.voucher-validity-item {
    display: flex;
    align-items: baseline;
    gap: var(--spacing-2);
}

.voucher-validity-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    min-width: 32px;
    font-family: var(--font-family-sans);
}

.voucher-validity-value {
    font-size: var(--font-size-sm);
    color: var(--color-heading);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

/* Table Loading/Empty States */
.table-loading,
.table-empty {
    text-align: center;
    padding: var(--spacing-12) var(--spacing-6);
}

.table-actions-header {
    text-align: right;
}

.table-actions-cell {
    text-align: right;
}

/* Pagination Controls */
.pagination-label {
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    margin: 0 var(--spacing-2) 0 0;
    font-family: var(--font-family-sans);
}

.pagination-select {
    display: inline-flex;
    width: auto;
    min-width: 80px;
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    margin-right: var(--spacing-2);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.pagination-select:hover {
    border-color: var(--color-primary);
}

.pagination-select:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    border-color: var(--color-primary);
    box-shadow: none;
}

.pagination-text {
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

/* Form Switch Wrapper */
.form-switch-wrapper {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    padding-top: var(--spacing-4);
}

.form-switch-wrapper .form-check-input {
    margin-top: 0;
    cursor: pointer;
}

.form-switch-wrapper .form-check-label {
    margin-bottom: 0;
    cursor: pointer;
    font-size: var(--font-size-base);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

/* Input Group Text */
:deep(.input-group-text) {
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    padding: var(--spacing-2) var(--spacing-3);
    height: 40px;
    font-family: var(--font-family-sans);
}

/* Buttons - Chuẩn hóa */
:deep(.btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

:deep(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

:deep(.btn-outline-primary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

:deep(.btn-outline-primary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

:deep(.btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

:deep(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

:deep(.btn-danger) {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-text-inverse);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

:deep(.btn-danger:hover:not(:disabled)) {
    background: var(--color-danger-dark);
}

:deep(.input-group .form-control:first-child),
:deep(.input-group .form-select:first-child) {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
}

:deep(.input-group .form-control:last-child),
:deep(.input-group .form-select:last-child) {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}

:deep(.input-group-text:first-child) {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
}

:deep(.input-group-text:last-child) {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}

/* Responsive */
@media (max-width: 992px) {
    .vouchers-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .vouchers-header__actions {
        width: 100%;
        justify-content: flex-start;
    }

    .vouchers-header__actions .btn {
        flex: 1;
        min-width: 0;
    }

    .summary-grid {
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    }

    .filter-grid {
        grid-template-columns: 1fr;
    }

    .filter-actions {
        width: 100%;
    }

    .filter-actions .btn {
        flex: 1;
    }

    .action-buttons {
        flex-direction: column;
        width: 100%;
    }

    .action-button {
        width: 100%;
        justify-content: center;
    }

    .table-footer {
        flex-direction: column;
        align-items: stretch;
        gap: var(--spacing-3);
    }

    .table-card {
        overflow-x: auto;
    }

    .table-card table {
        min-width: 1100px;
    }
}

@media (max-width: 768px) {
    .vouchers-page {
        gap: var(--spacing-4);
        padding-bottom: var(--spacing-8);
    }

    .vouchers-header {
        padding: var(--spacing-4);
    }

    .summary-grid {
        grid-template-columns: 1fr;
    }

    .summary-card {
        padding: var(--spacing-4) var(--spacing-5);
    }

    .summary-icon {
        width: 48px;
        height: 48px;
        font-size: var(--font-size-xl);
    }

    .filter-card {
        padding: var(--spacing-4);
    }

    .table-card th,
    .table-card td {
        padding: var(--spacing-3) var(--spacing-4);
        font-size: var(--font-size-xs);
    }

    .action-button span {
        display: none;
    }

    .action-button {
        min-width: 36px;
        padding: var(--spacing-2);
        justify-content: center;
    }
}
</style>
