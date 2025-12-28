<template>
  <div   >
    <Teleport to="body">
      <div
        ref="modalElement"
        class="modal fade"
        tabindex="-1"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <div>
                <h5 class="modal-title">
                  {{ isEditing ? 'Cập nhật voucher' : 'Thêm voucher mới' }}
                </h5>
                <p class="modal-subtitle">
                  Điền đầy đủ thông tin voucher. Hệ thống sẽ kiểm tra tính hợp
                  lệ trước khi lưu.
                </p>
              </div>
              <button
                type="button"
                class="btn-close"
                aria-label="Close"
                @click="closeModal"
              />
            </div>

            <LoadingState
              v-if="formLoading"
              text="Đang tải dữ liệu voucher..."
            />

            <Form
              v-else
              :key="formKey"
              v-slot="{ errors, isSubmitting }"
              :validation-schema="voucherSchema"
              @submit="handleSubmit"
            >
              <div class="modal-body">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Mã voucher <span
                      class="required-mark"
                    >*</span></label>
                    <Field
                      v-model="formData.code"
                      name="code"
                      type="text"
                      class="form-control"
                      :class="{ 'is-invalid': errors.code }"
                      autocomplete="off"
                      maxlength="50"
                    />
                    <ErrorMessage
                      name="code"
                      class="invalid-feedback"
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Loại voucher <span
                      class="required-mark"
                    >*</span></label>
                    <Field
                      v-model="formData.type"
                      name="type"
                      as="select"
                      class="form-select"
                      :class="{ 'is-invalid': errors.type }"
                    >
                      <option value="">
                        Chọn loại
                      </option>
                      <option
                        v-for="type in VOUCHER_TYPES"
                        :key="type.value"
                        :value="type.value"
                      >
                        {{ type.label }}
                      </option>
                    </Field>
                    <ErrorMessage
                      name="type"
                      class="invalid-feedback"
                    />
                  </div>
                  <div class="col-12">
                    <label class="form-label">Mô tả <span class="required-mark">*</span></label>
                    <Field
                      v-model="formData.description"
                      name="description"
                      as="textarea"
                      rows="2"
                      class="form-control"
                      :class="{ 'is-invalid': errors.description }"
                      maxlength="255"
                    />
                    <ErrorMessage
                      name="description"
                      class="invalid-feedback"
                    />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Giá trị giảm <span
                      class="required-mark"
                    >*</span></label>
                    <div class="input-group">
                      <Field
                        v-model.number="formData.discountValue"
                        name="discountValue"
                        type="number"
                        step="0.01"
                        min="0"
                        class="form-control"
                        :class="{ 'is-invalid': errors.discountValue }"
                      />
                      <span
                        v-if="formData.type === 'PERCENTAGE'"
                        class="input-group-text"
                      >%</span>
                      <span
                        v-else
                        class="input-group-text"
                      >VND</span>
                    </div>
                    <ErrorMessage
                      name="discountValue"
                      class="invalid-feedback"
                    />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Đơn hàng tối thiểu</label>
                    <div class="input-group">
                      <Field
                        v-model.number="formData.minimumOrderAmount"
                        name="minimumOrderAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        class="form-control"
                        :class="{ 'is-invalid': errors.minimumOrderAmount }"
                      />
                      <span class="input-group-text">VND</span>
                    </div>
                    <ErrorMessage
                      name="minimumOrderAmount"
                      class="invalid-feedback"
                    />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Giảm tối đa</label>
                    <div class="input-group">
                      <Field
                        v-model.number="formData.maximumDiscountAmount"
                        name="maximumDiscountAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        class="form-control"
                        :class="{ 'is-invalid': errors.maximumDiscountAmount }"
                      />
                      <span class="input-group-text">VND</span>
                    </div>
                    <ErrorMessage
                      name="maximumDiscountAmount"
                      class="invalid-feedback"
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Hiệu lực từ <span
                      class="required-mark"
                    >*</span></label>
                    <Field
                      v-model="formData.validFrom"
                      name="validFrom"
                      type="datetime-local"
                      class="form-control"
                      :class="{ 'is-invalid': errors.validFrom }"
                    />
                    <ErrorMessage
                      name="validFrom"
                      class="invalid-feedback"
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Hiệu lực đến <span
                      class="required-mark"
                    >*</span></label>
                    <Field
                      v-model="formData.validTo"
                      name="validTo"
                      type="datetime-local"
                      class="form-control"
                      :class="{ 'is-invalid': errors.validTo }"
                    />
                    <ErrorMessage
                      name="validTo"
                      class="invalid-feedback"
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Giới hạn lượt sử dụng <span
                      class="required-mark"
                    >*</span></label>
                    <Field
                      v-model.number="formData.usageLimit"
                      name="usageLimit"
                      type="number"
                      min="1"
                      step="1"
                      class="form-control"
                      :class="{ 'is-invalid': errors.usageLimit }"
                    />
                    <ErrorMessage
                      name="usageLimit"
                      class="invalid-feedback"
                    />
                  </div>
                  <div class="col-md-6 d-flex align-items-center">
                    <div class="form-switch-wrapper">
                      <Field
                        v-model="formData.active"
                        name="active"
                        type="checkbox"
                        class="form-check-input"
                        role="switch"
                      />
                      <label class="form-check-label">Kích hoạt ngay</label>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  :disabled="isSubmitting"
                  @click="closeModal"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="isSubmitting || voucherStore.saving"
                >
                  <span
                    v-if="isSubmitting || voucherStore.saving"
                    class="spinner-border spinner-border-sm"
                  />
                  <i
                    v-else
                    class="bi"
                    :class="isEditing ? 'bi-check-circle' : 'bi-plus-lg'"
                  />
                  {{ isEditing ? 'Lưu thay đổi' : 'Tạo mới' }}
                </button>
              </div>
            </Form>
          </div>
        </div>
      </div>

      <div
        ref="deleteModalElement"
        class="modal fade"
        tabindex="-1"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <div>
                <h5 class="modal-title">
                  Xóa voucher
                </h5>
                <p class="modal-subtitle">
                  Hành động này không thể hoàn tác.
                </p>
              </div>
              <button
                type="button"
                class="btn-close"
                :disabled="voucherStore.deleting"
                aria-label="Close"
                @click="closeDeleteModal"
              />
            </div>
            <div class="modal-body">
              <p class="delete-confirm-text">
                Bạn có chắc chắn muốn xóa voucher này không?
              </p>
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
              <button
                type="button"
                class="btn btn-outline-secondary"
                :disabled="voucherStore.deleting"
                @click="closeDeleteModal"
              >
                Hủy
              </button>
              <button
                type="button"
                class="btn btn-danger"
                :disabled="voucherStore.deleting"
                @click="handleDeleteConfirm"
              >
                <span
                  v-if="voucherStore.deleting"
                  class="spinner-border spinner-border-sm me-2"
                />
                Xóa voucher
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <section
      class="page-container container-fluid vouchers-page"
      style="background: var(--color-body-bg); padding: var(--spacing-4);"
    >
      <div class="vouchers-header">
        <div class="vouchers-header__content">
          <div class="vouchers-header__title-section">
            <h2 class="page-title">
              Quản lý voucher
            </h2>
            <p class="page-subtitle">
              Tạo và quản lý các mã giảm giá, khuyến mãi cho khách hàng.
            </p>
          </div>
          <div class="vouchers-header__actions">
            <button
              class="btn btn-outline-secondary"
              type="button"
              :disabled="loading"
              @click="handleRefresh"
            >
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
              />
              <i
                v-else
                class="bi bi-arrow-clockwise me-2"
              />
              Làm mới
            </button>
            <button
              class="btn btn-outline-primary me-2"
              type="button"
              @click="showImportModal = true"
            >
              <i class="bi bi-upload me-2" />
              Nhập
            </button>
            <button
              class="btn btn-outline-primary"
              type="button"
              :disabled="!items.length"
              @click="showExportModal = true"
            >
              <i class="bi bi-download me-2" />
              Xuất
            </button>
            <button
              v-if="canManage"
              class="btn btn-primary"
              type="button"
              :disabled="voucherStore.saving || formLoading"
              @click="openCreateModal"
            >
              <i class="bi bi-plus-lg" />
              Thêm voucher
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="summaryLoading"
        class="summary-grid"
      >
        <article class="summary-card summary-card--loading">
          <div class="summary-loading">
            <div
              class="spinner-border spinner-border-sm"
              role="status"
            />
            <p class="summary-loading-text">
              Đang tải thống kê voucher...
            </p>
          </div>
        </article>
      </div>
      <div
        v-else
        class="summary-grid"
      >
        <article class="summary-card summary-card--active">
          <div class="summary-card__icon-wrapper summary-card__icon-wrapper--active">
            <i class="bi bi-check-circle" />
          </div>
          <div class="summary-card__content">
            <p class="summary-card__label">
              Đang hoạt động
            </p>
            <p class="summary-card__value">
              {{ summary.activeCount }}
            </p>
          </div>
        </article>
        <article class="summary-card summary-card--inactive">
          <div class="summary-card__icon-wrapper summary-card__icon-wrapper--inactive">
            <i class="bi bi-pause-circle" />
          </div>
          <div class="summary-card__content">
            <p class="summary-card__label">
              Ngừng hoạt động
            </p>
            <p class="summary-card__value">
              {{ summary.inactiveCount }}
            </p>
          </div>
        </article>
        <article class="summary-card summary-card--expiring">
          <div class="summary-card__icon-wrapper summary-card__icon-wrapper--expiring">
            <i class="bi bi-hourglass-split" />
          </div>
          <div class="summary-card__content">
            <p class="summary-card__label">
              Sắp hết hạn (7 ngày)
            </p>
            <p class="summary-card__value">
              {{ summary.expiringSoonCount }}
            </p>
          </div>
        </article>
        <article class="summary-card summary-card--redeemed">
          <div class="summary-card__icon-wrapper summary-card__icon-wrapper--redeemed">
            <i class="bi bi-ticket-perforated" />
          </div>
          <div class="summary-card__content">
            <p class="summary-card__label">
              Đã sử dụng
            </p>
            <p class="summary-card__value">
              {{ summary.redeemedCount }}
            </p>
          </div>
        </article>
      </div>

      <div
        v-if="errorMessage"
        class="error-banner"
      >
        <span class="error-banner__icon">
          <i class="bi bi-exclamation-triangle-fill" />
        </span>
        <div class="error-banner__content">
          <p class="error-banner__title">
            Không thể tải dữ liệu voucher
          </p>
          <p class="error-banner__message">
            {{ errorMessage }}
          </p>
        </div>
      </div>

      <div class="card filter-card">
        <div class="card-body">
          <div class="filter-grid">
            <div class="filter-item">
              <label class="form-label">Tìm theo mã</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-search" /></span>
                <input
                  v-model.trim="filterDraft.code"
                  type="text"
                  class="form-control"
                  placeholder="Nhập mã voucher"
                >
              </div>
            </div>
            <div class="filter-item">
              <label class="form-label">Loại voucher</label>
              <select
                v-model="filterDraft.type"
                class="form-select"
              >
                <option value="">
                  Tất cả
                </option>
                <option
                  v-for="type in VOUCHER_TYPES"
                  :key="type.value"
                  :value="type.value"
                >
                  {{
                    type.label }}
                </option>
              </select>
            </div>
            <div class="filter-item">
              <label class="form-label">Trạng thái</label>
              <select
                v-model="filterDraft.active"
                class="form-select"
              >
                <option value="">
                  Tất cả
                </option>
                <option value="true">
                  Đang hoạt động
                </option>
                <option value="false">
                  Ngừng hoạt động
                </option>
              </select>
            </div>
            <div class="filter-item">
              <label class="form-label">Hiệu lực từ</label>
              <input
                v-model="filterDraft.validFrom"
                type="datetime-local"
                class="form-control"
              >
            </div>
            <div class="filter-item">
              <label class="form-label">Hiệu lực đến</label>
              <input
                v-model="filterDraft.validTo"
                type="datetime-local"
                class="form-control"
              >
            </div>
            <div class="filter-actions">
              <button
                class="btn btn-outline-secondary"
                type="button"
                :disabled="loading"
                @click="handleFilterReset"
              >
                Đặt lại
              </button>
              <button
                class="btn btn-primary"
                type="button"
                :disabled="loading"
                @click="handleFilterApply"
              >
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
                <th
                  scope="col"
                  style="width: 50px;"
                >
                  <input
                    type="checkbox"
                    :checked="bulkActions.isSelectAll && items.length > 0"
                    :indeterminate="bulkActions.selectedCount > 0 && !bulkActions.isSelectAll"
                    @change="handleSelectAll"
                  >
                </th>
                <th scope="col">
                  Mã
                </th>
                <th scope="col">
                  Mô tả
                </th>
                <th scope="col">
                  Loại
                </th>
                <th
                  scope="col"
                  class="text-end"
                >
                  Giá trị
                </th>
                <th
                  scope="col"
                  class="text-end"
                >
                  Đơn tối thiểu
                </th>
                <th
                  scope="col"
                  class="text-end"
                >
                  Giảm tối đa
                </th>
                <th scope="col">
                  Hiệu lực
                </th>
                <th scope="col">
                  Sử dụng
                </th>
                <th scope="col">
                  Trạng thái
                </th>
                <th scope="col">
                  Cập nhật
                </th>
                <th
                  scope="col"
                  class="table-actions-header"
                >
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td
                  colspan="12"
                  class="table-loading"
                >
                  <LoadingState text="Đang tải dữ liệu voucher..." />
                </td>
              </tr>
              <tr v-else-if="!items.length">
                <td
                  colspan="12"
                  class="table-empty"
                >
                  <EmptyState
                    title="Không có voucher"
                    message="Không có voucher nào phù hợp với bộ lọc hiện tại."
                  >
                    <template #icon>
                      <i class="bi bi-ticket-perforated" />
                    </template>
                  </EmptyState>
                </td>
              </tr>
              <tr
                v-for="voucher in items"
                :key="voucher.id"
              >
                <td>
                  <input
                    type="checkbox"
                    :checked="bulkActions.isSelected(voucher.id)"
                    @change="bulkActions.toggleSelection(voucher.id)"
                  >
                </td>
                <td class="voucher-code">
                  {{ voucher.code }}
                </td>
                <td>{{ voucher.description }}</td>
                <td>
                  <span
                    class="badge badge-type"
                    :class="voucher.type === 'PERCENTAGE' ? 'badge-type--percentage' : 'badge-type--fixed'"
                  >
                    {{ voucher.type === 'PERCENTAGE' ? 'GIẢM %' : 'GIẢM CỐ ĐỊNH' }}
                  </span>
                </td>
                <td class="text-end">
                  <span v-if="voucher.type === 'PERCENTAGE'">{{ formatNumber(voucher.discountValue)
                  }}%</span>
                  <span v-else>{{ formatCurrencySafe(voucher.discountValue) }}</span>
                </td>
                <td class="text-end">
                  {{ voucher.minimumOrderAmount ? formatCurrencySafe(voucher.minimumOrderAmount) : '—'
                  }}
                </td>
                <td class="text-end">
                  {{ voucher.maximumDiscountAmount ? formatCurrencySafe(voucher.maximumDiscountAmount)
                    : (voucher.type ===
                      'PERCENTAGE' ? 'Không giới hạn' : '—') }}
                </td>
                <td>
                  <div class="voucher-validity">
                    <div class="voucher-validity-item">
                      <span class="voucher-validity-label">Từ:</span>
                      <span class="voucher-validity-value">{{ formatDateCompact(voucher.validFrom) }}</span>
                    </div>
                    <div class="voucher-validity-item">
                      <span class="voucher-validity-label">Đến:</span>
                      <span class="voucher-validity-value">{{ formatDateCompact(voucher.validTo) }}</span>
                    </div>
                  </div>
                </td>
                <td>{{ voucher.timesUsed }} / {{ voucher.usageLimit }}</td>
                <td>
                  <span
                    class="badge badge-status"
                    :class="voucher.active ? 'badge-status--active' : 'badge-status--inactive'"
                  >
                    {{ voucher.active ? 'ĐANG HOẠT ĐỘNG' : 'NGỪNG HOẠT ĐỘNG' }}
                  </span>
                </td>
                <td>{{ formatDateCompact(voucher.updatedAt || voucher.createdAt) }}</td>
                <td class="table-actions-cell">
                  <div class="dropdown">
                    <button
                      :id="`voucher-menu-${voucher.id}`"
                      class="action-kebab"
                      type="button"
                      :disabled="voucherStore.saving || voucherStore.deleting || voucherStore.toggling"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      title="Thao tác"
                    >
                      <i class="bi bi-three-dots-vertical" />
                    </button>
                    <ul
                      class="dropdown-menu dropdown-menu-end"
                      :aria-labelledby="`voucher-menu-${voucher.id}`"
                    >
                      <li>
                        <button
                          class="dropdown-item"
                          type="button"
                          :disabled="voucherStore.saving || voucherStore.deleting || voucherStore.toggling"
                          @click="openEditModal(voucher)"
                        >
                          <i class="bi bi-pencil me-2" />
                          Chỉnh sửa
                        </button>
                      </li>
                      <li>
                        <button
                          class="dropdown-item"
                          type="button"
                          :disabled="voucherStore.toggling || voucherStore.saving || voucherStore.deleting"
                          @click="handleToggle(voucher)"
                        >
                          <i
                            class="bi me-2"
                            :class="voucher.active ? 'bi-pause-circle' : 'bi-play-circle'"
                          />
                          {{ voucher.active ? 'Tạm ngưng' : 'Kích hoạt' }}
                        </button>
                      </li>
                      <li><hr class="dropdown-divider"></li>
                      <li>
                        <button
                          class="dropdown-item text-danger"
                          type="button"
                          :disabled="voucher.timesUsed > 0 || voucherStore.deleting || voucherStore.saving || voucherStore.toggling"
                          @click="handleDelete(voucher)"
                        >
                          <i class="bi bi-trash me-2" />
                          Xóa
                        </button>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="pagination.totalPages > 1 || pagination.size"
          class="table-footer"
        >
          <!-- PageSize Selector -->
          <div class="d-flex align-items-center gap-2">
            <label
              class="mb-0 text-muted small"
              style="font-family: var(--font-family-sans);"
            >
              Hiển thị:
            </label>
            <select
              :value="pagination.size"
              class="form-select form-select-sm"
              style="width: auto; min-width: 80px; font-family: var(--font-family-sans);"
              @change="handlePageSizeChange(parseInt($event.target.value, 10))"
            >
              <option :value="10">
                10
              </option>
              <option :value="20">
                20
              </option>
              <option :value="30">
                30
              </option>
              <option :value="50">
                50
              </option>
            </select>
            <span
              class="text-muted small"
              style="font-family: var(--font-family-sans);"
            >
              / trang
            </span>
          </div>
          <!-- Pagination -->
          <Pagination
            v-if="pagination.totalPages > 1"
            mode="one-based"
            :current-page="pagination.page"
            :total-pages="pagination.totalPages"
            @page-change="handlePageChange"
          />
          <div v-else />
        </div>
      </div>
    </section>

    <!-- Bulk Actions Bar -->
    <BulkActionsBar
      :selected-count="bulkActions.selectedCount.value"
      :has-selection="bulkActions.hasSelection.value"
      :is-processing="bulkActions.isProcessing.value"
      :progress-percentage="progressPercentage"
      :actions="bulkActionItems"
      item-label="voucher"
      @action="handleBulkAction"
      @clear="bulkActions.clearSelection"
    />

    <!-- Export Modal -->
    <ExportModal
      :show="showExportModal"
      :data="items"
      :columns="exportColumns"
      :has-filters="false"
      default-filename="vouchers"
      @close="showExportModal = false"
      @export="handleExport"
    />

    <!-- Import Modal -->
    <ImportModal
      :show="showImportModal"
      :required-fields="importRequiredFields"
      :validation-rules="importValidationRules"
      :on-import="handleImport"
      @close="showImportModal = false"
      @import="handleImportComplete"
    />
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

// Format ngày tháng gọn gàng cho bảng - hiển thị trên 1 dòng
const formatDateCompact = (dateTime) => {
    if (!dateTime) return ''
    try {
        const d = new Date(dateTime)
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const year = d.getFullYear()
        const hours = String(d.getHours()).padStart(2, '0')
        const minutes = String(d.getMinutes()).padStart(2, '0')
        return `${day}/${month}/${year} ${hours}:${minutes}`
    } catch {
        return ''
    }
}
import Pagination from '@/components/common/Pagination.vue'
import { useAuthStore } from '@/store/auth'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useBulkActions } from '@/composables/useBulkActions'
import BulkActionsBar from '@/components/BulkActionsBar.vue'
import ExportModal from '@/components/ExportModal.vue'
import ImportModal from '@/components/ImportModal.vue'
import * as voucherService from '@/api/voucherService'
import logger from '@/utils/logger'

const voucherStore = useVoucherStore()
const authStore = useAuthStore()
const { items, pagination, loading, summary, summaryLoading, errorMessage } = storeToRefs(voucherStore)
const { userRoles } = storeToRefs(authStore)

// Chỉ ROLE_MANAGER và ROLE_ADMIN mới được phép thao tác tạo/sửa/xoá.
const canManage = computed(() => userRoles.value.includes('ROLE_ADMIN') || userRoles.value.includes('ROLE_MANAGER'))

// Bulk Actions
const bulkActions = useBulkActions({
    onBulkAction: (action, selectedIds, results) => {
        if (results.success > 0) {
            toast.success(`${results.success} voucher đã được ${action} thành công`)
        }
        if (results.failed > 0) {
            toast.error(`${results.failed} voucher ${action} thất bại`)
        }
        voucherStore.fetchVouchers()
    },
    maxBatchSize: 100
})

const showExportModal = ref(false)
const showImportModal = ref(false)
const progressPercentage = ref(0)

// Bulk action items
const bulkActionItems = computed(() => {
    const items = [
        {
            id: 'export',
            label: 'Xuất',
            icon: 'bi bi-download',
            confirm: false
        },
        {
            id: 'activate',
            label: 'Kích hoạt',
            icon: 'bi bi-check-circle',
            confirm: true,
            confirmMessage: 'Bạn có chắc chắn muốn kích hoạt các voucher đã chọn?'
        },
        {
            id: 'deactivate',
            label: 'Vô hiệu hóa',
            icon: 'bi bi-pause-circle',
            confirm: true,
            confirmMessage: 'Bạn có chắc chắn muốn vô hiệu hóa các voucher đã chọn?'
        }
    ]

    if (canManage.value) {
        items.unshift({
            id: 'delete',
            label: 'Xóa',
            icon: 'bi bi-trash',
            danger: true,
            confirm: true,
            confirmMessage: 'Bạn có chắc chắn muốn xóa các voucher đã chọn? Hành động này không thể hoàn tác.'
        })
    }

    return items
})

// Export columns
const exportColumns = [
    { key: 'id', label: 'ID' },
    { key: 'code', label: 'Mã voucher' },
    { key: 'description', label: 'Mô tả' },
    {
        key: 'type',
        label: 'Loại',
        value: (item) => item.type === 'PERCENTAGE' ? 'Giảm %' : 'Giảm cố định'
    },
    {
        key: 'discountValue',
        label: 'Giá trị',
        value: (item) => item.type === 'PERCENTAGE' ? `${item.discountValue}%` : formatCurrency(item.discountValue)
    },
    { key: 'active', label: 'Trạng thái', value: (item) => item.active ? 'Hoạt động' : 'Ngừng hoạt động' }
]

// Import fields
const importRequiredFields = [
    { key: 'code', label: 'Mã voucher', required: true },
    { key: 'type', label: 'Loại voucher', required: true },
    { key: 'discountValue', label: 'Giá trị giảm', required: true }
]

const importValidationRules = [
    { field: 'code', label: 'Mã voucher', required: true, type: 'string' },
    { field: 'type', label: 'Loại voucher', required: true, type: 'string' },
    { field: 'discountValue', label: 'Giá trị giảm', required: true, type: 'number' }
]

// Xử lý thao tác hàng loạt
const handleBulkAction = async (action) => {
    try {
        switch (action.id) {
            case 'delete':
                if (bulkActions.selectedCount.value === 0) {
                    toast.warning('Vui lòng chọn ít nhất một voucher')
                    return
                }
                await bulkActions.executeBulkAction(
                    'delete',
                    async (id) => {
                        await voucherService.deleteVoucher(id)
                    },
                    {
                        confirm: false,
                        skipConfirm: true,
                        onProgress: (progress) => {
                            progressPercentage.value = progress.percentage
                        },
                        clearOnSuccess: true,
                        onComplete: (_results) => {
                            progressPercentage.value = 0
                        }
                    }
                )
                break

            case 'export':
                showExportModal.value = true
                break

            case 'activate':
                if (bulkActions.selectedCount.value === 0) {
                    toast.warning('Vui lòng chọn ít nhất một voucher')
                    return
                }
                await bulkActions.executeBulkAction(
                    'activate',
                    async (id) => {
                        await voucherService.updateVoucher({ id, data: { active: true } })
                    },
                    {
                        confirm: false,
                        skipConfirm: true,
                        clearOnSuccess: true,
                        onProgress: (progress) => {
                            progressPercentage.value = progress.percentage
                        },
                        onComplete: (_results) => {
                            progressPercentage.value = 0
                        }
                    }
                )
                break

            case 'deactivate':
                if (bulkActions.selectedCount.value === 0) {
                    toast.warning('Vui lòng chọn ít nhất một voucher')
                    return
                }
                await bulkActions.executeBulkAction(
                    'deactivate',
                    async (id) => {
                        await voucherService.updateVoucher({ id, data: { active: false } })
                    },
                    {
                        confirm: false,
                        skipConfirm: true,
                        clearOnSuccess: true,
                        onProgress: (progress) => {
                            progressPercentage.value = progress.percentage
                        },
                        onComplete: (_results) => {
                            progressPercentage.value = 0
                        }
                    }
                )
                break
        }
    } catch (err) {
        logger.error('[Vouchers] Lỗi khi thực hiện thao tác hàng loạt:', err)
        toast.error(`Có lỗi xảy ra: ${  err.message || 'Lỗi không xác định'}`)
        progressPercentage.value = 0
    }
}

// Xử lý chọn tất cả
const handleSelectAll = () => {
    if (bulkActions.isSelectAll.value) {
        bulkActions.clearSelection()
    } else {
        bulkActions.selectAll(items.value)
    }
}

// Xử lý xuất dữ liệu
const handleExport = (result) => {
    toast.success(`Đã xuất ${result.rowCount} voucher thành công`)
}

// Xử lý nhập dữ liệu
const handleImport = async (mappedData) => {
    const results = await Promise.allSettled(
        mappedData.map(item => voucherService.createVoucher(item))
    )

    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failedCount = results.filter(r => r.status === 'rejected').length

    if (successCount > 0) {
        toast.success(`Đã nhập ${successCount} voucher thành công`)
    }
    if (failedCount > 0) {
        toast.error(`${failedCount} voucher nhập thất bại`)
    }

    return {
        success: successCount,
        failed: failedCount
    }
}

// Xử lý hoàn thành nhập dữ liệu
const handleImportComplete = (result) => {
    logger.log('[Vouchers] Nhập dữ liệu hoàn tất', result)
    voucherStore.fetchVouchers()
}

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
    formData.discountValue = voucher.discountValue !== null ? Number(voucher.discountValue) : ''
    formData.minimumOrderAmount = voucher.minimumOrderAmount !== null ? Number(voucher.minimumOrderAmount) : ''
    formData.maximumDiscountAmount = voucher.maximumDiscountAmount !== null ? Number(voucher.maximumDiscountAmount) : ''
    formData.validFrom = formatDateTimeInput(voucher.validFrom)
    formData.validTo = formatDateTimeInput(voucher.validTo)
    formData.usageLimit = voucher.usageLimit !== null ? Number(voucher.usageLimit) : 1
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
    // setPageSize tự động reset về trang 1
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

/* Kebab Menu - Thay thế action buttons */
.action-kebab {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.action-kebab:hover:not(:disabled) {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
    color: var(--color-heading);
}

.action-kebab:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
}

.action-kebab i {
    font-size: 18px;
    line-height: 1;
}

/* Dropdown Menu Styles */
:deep(.dropdown-menu) {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    box-shadow: var(--shadow-md);
    padding: var(--spacing-1);
    min-width: 160px;
    margin-top: var(--spacing-1);
}

:deep(.dropdown-item) {
    display: flex;
    align-items: center;
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-sm);
    color: var(--color-heading);
    border-radius: var(--radius-xs);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
    cursor: pointer;
}

:deep(.dropdown-item:hover:not(:disabled)) {
    background: var(--color-card-muted);
    color: var(--color-heading);
}

:deep(.dropdown-item:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
}

:deep(.dropdown-item.text-danger) {
    color: var(--color-danger);
}

:deep(.dropdown-item.text-danger:hover:not(:disabled)) {
    background: rgba(239, 68, 68, 0.1);
    color: var(--color-danger);
}

:deep(.dropdown-item i) {
    font-size: 16px;
    width: 20px;
    text-align: center;
}

:deep(.dropdown-divider) {
    margin: var(--spacing-1) 0;
    border-color: var(--color-border);
}

/* Summary Cards - Đồng bộ với Dashboard */
.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-4);
}

.summary-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    padding: var(--spacing-5) var(--spacing-6);
    transition: background-color var(--transition-base), border-color var(--transition-base);
    min-height: 120px;
    height: 100%;
}

.summary-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
    /* NO transform, NO shadow */
}

/* Icon wrapper - chỉ có hình vuông bo tròn và icon */
.summary-card__icon-wrapper {
    flex-shrink: 0;
    width: 56px;
    height: 56px;
    border-radius: var(--radius-base);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform var(--transition-base);
}

.summary-card:hover .summary-card__icon-wrapper {
    transform: scale(1.05);
}

/* Icon */
.summary-card__icon-wrapper i {
    font-size: 24px;
}

/* Đang hoạt động - Xanh lá */
.summary-card__icon-wrapper--active {
    background: rgba(34, 197, 94, 0.18);
}

.summary-card__icon-wrapper--active i {
    color: #22c55e;
}

/* Ngừng hoạt động - Xám */
.summary-card__icon-wrapper--inactive {
    background: rgba(148, 163, 184, 0.18);
}

.summary-card__icon-wrapper--inactive i {
    color: #94a3b8;
}

/* Sắp hết hạn - Cam */
.summary-card__icon-wrapper--expiring {
    background: rgba(251, 146, 60, 0.18);
}

.summary-card__icon-wrapper--expiring i {
    color: #fb923c;
}

/* Đã sử dụng - Xanh dương */
.summary-card__icon-wrapper--redeemed {
    background: rgba(59, 130, 246, 0.18);
}

.summary-card__icon-wrapper--redeemed i {
    color: #3b82f6;
}

.summary-card__content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.summary-card__label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    margin-bottom: 0;
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.summary-card__value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
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
    margin-top: var(--spacing-3);
    margin-bottom: 80px;
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
}

/* Badge Styles - Chuẩn hóa theo tiêu chuẩn */
.badge {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    border: 1px solid;
    white-space: nowrap;
    line-height: 1.4;
}

/* Status Badges */
.badge-status {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    border: 1px solid;
    white-space: nowrap;
    line-height: 1.4;
}

.badge-status--active,
.badge-status--success {
    background: rgba(34, 197, 94, 0.18);
    border-color: #22c55e;
    color: #22c55e;
}

.badge-status--inactive,
.badge-status--default {
    background: var(--color-card-muted);
    border-color: var(--color-border);
    color: var(--color-text-muted);
}

.badge-status--warning,
.badge-status--pending {
    background: rgba(251, 191, 36, 0.18);
    border-color: #f59e0b;
    color: #f59e0b;
}

.badge-status--danger,
.badge-status--cancelled {
    background: rgba(244, 63, 94, 0.18);
    border-color: #ef4444;
    color: #ef4444;
}

.badge-status--info,
.badge-status--transferred {
    background: rgba(14, 165, 233, 0.18);
    border-color: #0ea5e9;
    color: #0ea5e9;
}

/* Type Badges */
.badge-type {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    border: 1px solid;
    white-space: nowrap;
    line-height: 1.4;
}

.badge-type--percentage,
.badge-type--primary {
    background: rgba(14, 165, 233, 0.18);
    border-color: #0ea5e9;
    color: #0ea5e9;
}

.badge-type--fixed,
.badge-type--secondary {
    background: var(--color-card-muted);
    border-color: var(--color-border);
    color: var(--color-text-muted);
}

.badge-type--premium,
.badge-type--success {
    background: rgba(34, 197, 94, 0.18);
    border-color: #22c55e;
    color: #22c55e;
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
}
</style>
