<template>
  <div
    class="staff-page container-fluid"
      
    style="background: var(--color-body-bg); padding: var(--spacing-4);"
  >
    <div class="staff-header">
      <div class="staff-header__content">
        <div class="staff-header__title-section">
          <h2 class="page-title">
            Quản lý Nhân viên
          </h2>
          <p class="page-subtitle">
            Quản lý thông tin nhân viên, phân ca làm việc và theo dõi hiệu suất.
          </p>
        </div>
        <div class="staff-header__actions">
          <div
            class="btn-group layout-toggle"
            role="group"
            aria-label="Chọn bố cục hiển thị"
          >
            <button
              type="button"
              class="btn btn-sm"
              :class="viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'"
              @click="viewMode = 'table'"
            >
              <i class="bi bi-table me-2" />Bảng
            </button>
            <button
              type="button"
              class="btn btn-sm"
              :class="viewMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'"
              @click="viewMode = 'grid'"
            >
              <i class="bi bi-grid-3x3-gap me-2" />Thẻ
            </button>
          </div>
          <button
            class="btn btn-outline-secondary"
            type="button"
            :disabled="loading"
            @click="fetchUsers"
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
            class="btn btn-outline-success"
            type="button"
            :disabled="exporting || !users.length"
            @click="handleExport"
          >
            <span
              v-if="exporting"
              class="spinner-border spinner-border-sm me-2"
            />
            <i
              v-else
              class="bi bi-file-earmark-excel me-2"
            />
            Xuất Excel
          </button>
          <button
            class="btn btn-primary"
            type="button"
            :disabled="rolesLoading"
            @click="openCreateModal"
          >
            <span
              v-if="rolesLoading"
              class="spinner-border spinner-border-sm me-2"
            />
            <i
              v-else
              class="bi bi-person-plus me-2"
            />
            Thêm nhân viên
          </button>
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div
      v-if="!loading && users.length > 0"
      class="row g-4 mb-4"
    >
      <div class="col-md-3 col-sm-6">
        <div class="kpi-card kpi-card--people">
          <div class="kpi-card__icon">
            <i class="bi bi-people" />
          </div>
          <div class="kpi-card__content">
            <div class="kpi-card__label">
              Tổng số nhân viên
            </div>
            <div class="kpi-card__value">
              {{ formatNumber(totalUsers) }}
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-sm-6">
        <div class="kpi-card kpi-card--active">
          <div class="kpi-card__icon">
            <i class="bi bi-check-circle" />
          </div>
          <div class="kpi-card__content">
            <div class="kpi-card__label">
              Đang hoạt động
            </div>
            <div class="kpi-card__value">
              {{ formatNumber(activeUsersCount) }}
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-sm-6">
        <div class="kpi-card kpi-card--role">
          <div class="kpi-card__icon">
            <i class="bi bi-person-badge" />
          </div>
          <div class="kpi-card__content">
            <div class="kpi-card__label">
              Theo quyền
            </div>
            <div class="kpi-card__value">
              {{ formatNumber(usersByRoleCount) }}
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-sm-6">
        <div class="kpi-card kpi-card--recent">
          <div class="kpi-card__icon">
            <i class="bi bi-clock-history" />
          </div>
          <div class="kpi-card__content">
            <div class="kpi-card__label">
              Hoạt động gần đây
            </div>
            <div class="kpi-card__value">
              {{ formatNumber(recentlyActiveCount) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card filter-card mb-4">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="mb-0">
            Bộ lọc
          </h5>
          <button
            class="btn btn-sm btn-outline-secondary"
            type="button"
            @click="toggleAdvancedFilters"
          >
            <i
              class="bi"
              :class="showAdvancedFilters ? 'bi-chevron-up' : 'bi-chevron-down'"
            />
            {{ showAdvancedFilters ? 'Ẩn' : 'Hiện' }} bộ lọc nâng cao
          </button>
        </div>
        <div class="row g-3 align-items-end">
          <div class="col-lg-3 col-md-6">
            <label class="form-label">Tìm kiếm</label>
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search" /></span>
              <input
                v-model="filters.search"
                type="text"
                class="form-control"
                placeholder="Tên đăng nhập, họ tên, SĐT..."
              >
            </div>
          </div>
          <div class="col-lg-3 col-md-6">
            <label class="form-label">Trạng thái</label>
            <select
              v-model="filters.status"
              class="form-select"
            >
              <option value="">
                Tất cả
              </option>
              <option
                v-for="option in STATUS_OPTIONS"
                :key="option.value"
                :value="option.value"
              >
                {{
                  option.label }}
              </option>
            </select>
          </div>
          <div class="col-lg-3 col-md-6">
            <label class="form-label">Quyền</label>
            <select
              v-model="filters.role"
              class="form-select"
              :disabled="rolesLoading"
            >
              <option value="">
                Tất cả
              </option>
              <option
                v-for="role in roleFilterOptions"
                :key="role"
                :value="role"
              >
                {{ formatRole(role) }}
              </option>
            </select>
          </div>
          <div class="col-lg-3 col-md-6 text-md-end">
            <button
              class="btn btn-outline-secondary me-2"
              type="button"
              :disabled="loading"
              @click="resetFilters"
            >
              Đặt lại
            </button>
            <button
              class="btn btn-outline-primary"
              type="button"
              :disabled="loading"
              @click="fetchUsers"
            >
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-1"
              />
              Làm mới
            </button>
          </div>
        </div>
        <div
          v-if="showAdvancedFilters"
          class="row g-3 align-items-end mt-3 pt-3 border-top"
        >
          <div class="col-lg-3 col-md-6">
            <label class="form-label">Ngày tạo từ</label>
            <input
              v-model="filters.createdFrom"
              type="date"
              class="form-control"
            >
          </div>
          <div class="col-lg-3 col-md-6">
            <label class="form-label">Ngày tạo đến</label>
            <input
              v-model="filters.createdTo"
              type="date"
              class="form-control"
            >
          </div>
          <div class="col-lg-3 col-md-6">
            <label class="form-label">Cập nhật từ</label>
            <input
              v-model="filters.updatedFrom"
              type="date"
              class="form-control"
            >
          </div>
          <div class="col-lg-3 col-md-6">
            <label class="form-label">Cập nhật đến</label>
            <input
              v-model="filters.updatedTo"
              type="date"
              class="form-control"
            >
          </div>
          <div class="col-lg-3 col-md-6">
            <label class="form-label">Hoạt động cuối</label>
            <select
              v-model="filters.lastSeen"
              class="form-select"
            >
              <option value="">
                Tất cả
              </option>
              <option value="today">
                Hôm nay
              </option>
              <option value="week">
                Trong tuần
              </option>
              <option value="month">
                Trong tháng
              </option>
              <option value="never">
                Chưa từng
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Actions Bar -->
    <div
      v-if="selectedUsers.length > 0"
      class="card mb-4 border-primary"
    >
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <strong>{{ selectedUsers.length }}</strong> nhân viên đã chọn
          </div>
          <div class="d-flex gap-2">
            <button
              class="btn btn-sm btn-success"
              type="button"
              :disabled="bulkProcessing"
              @click="handleBulkActivate"
            >
              <span
                v-if="bulkProcessing"
                class="spinner-border spinner-border-sm me-1"
              />
              <i
                v-else
                class="bi bi-check-circle me-1"
              />
              Kích hoạt
            </button>
            <button
              class="btn btn-sm btn-danger"
              type="button"
              :disabled="bulkProcessing"
              @click="handleBulkDeactivate"
            >
              <span
                v-if="bulkProcessing"
                class="spinner-border spinner-border-sm me-1"
              />
              <i
                v-else
                class="bi bi-x-circle me-1"
              />
              Vô hiệu hóa
            </button>
            <button
              class="btn btn-sm btn-primary"
              type="button"
              :disabled="bulkProcessing"
              @click="handleBulkAssignRoles"
            >
              <span
                v-if="bulkProcessing"
                class="spinner-border spinner-border-sm me-1"
              />
              <i
                v-else
                class="bi bi-person-badge me-1"
              />
              Gán quyền
            </button>
            <button
              class="btn btn-sm btn-outline-info"
              type="button"
              :disabled="bulkProcessing || exporting"
              @click="handleBulkExport"
            >
              <span
                v-if="exporting"
                class="spinner-border spinner-border-sm me-1"
              />
              <i
                v-else
                class="bi bi-download me-1"
              />
              Xuất Excel
            </button>
            <button
              class="btn btn-sm btn-outline-secondary"
              type="button"
              :disabled="bulkProcessing"
              @click="clearSelection"
            >
              <i class="bi bi-x-lg me-1" />
              Bỏ chọn
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="card data-card mb-4">
      <div class="card-body">
        <LoadingState v-if="loading || tableData.loading.value" />
        <ErrorState
          v-else-if="error || tableData.error.value"
          :message="error || (tableData.error.value?.message || 'Không thể tải danh sách nhân viên')"
          @retry="fetchUsers"
        />
        <template v-else>
          <div v-if="viewMode === 'table'">
            <div v-if="!filteredUsers.length">
              <EmptyState
                title="Không có dữ liệu"
                message="Điều chỉnh bộ lọc hoặc tải lại danh sách."
              />
            </div>
            <div
              v-else
              class="table-responsive"
            >
              <table class="table table-hover align-middle">
                <thead class="table-light">
                  <tr>
                    <th width="40">
                      <input
                        type="checkbox"
                        class="form-check-input"
                        :checked="allSelected"
                        @change="toggleSelectAll"
                      >
                    </th>
                    <th />
                    <th>Tên đăng nhập</th>
                    <th>Họ tên</th>
                    <th>Liên hệ</th>
                    <th>Quyền</th>
                    <th>Trạng thái</th>
                    <th>Hoạt động cuối</th>
                    <th>Ngày tạo</th>
                    <th class="text-end">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="user in filteredUsers"
                    :key="user.id"
                  >
                    <td>
                      <input
                        type="checkbox"
                        class="form-check-input"
                        :checked="isUserSelected(user.id)"
                        :disabled="isCurrentUser(user.id)"
                        @change="toggleUserSelection(user.id)"
                      >
                    </td>
                    <td>
                      <img
                        v-if="user.avatarUrl"
                        :src="user.avatarUrl"
                        :alt="user.fullName || user.username"
                        class="table-avatar"
                      >
                      <div
                        v-else
                        class="table-avatar placeholder"
                      >
                        {{ buildInitials(user) }}
                      </div>
                    </td>
                    <td>
                      <button
                        class="btn btn-link p-0"
                        type="button"
                        @click="openDetail(user)"
                      >
                        {{
                          user.username }}
                      </button>
                    </td>
                    <td>{{ user.fullName || '—' }}</td>
                    <td>
                      <div>{{ user.phone || '—' }}</div>
                      <div class="text-muted small">
                        {{ user.email || '—' }}
                      </div>
                    </td>
                    <td>
                      <span
                        v-for="role in user.roles"
                        :key="role.id"
                        class="badge bg-soft staff-role-badge"
                      >{{ formatRole(role.name)
                      }}</span>
                    </td>
                    <td>
                      <span
                        class="badge"
                        :class="statusBadgeClass(user.status)"
                      >{{ user.status
                      }}</span>
                    </td>
                    <td>
                      <div
                        v-if="user.lastSeenAt"
                        class="small"
                      >
                        {{ formatDateTime(user.lastSeenAt) }}
                      </div>
                      <div
                        v-else
                        class="text-muted small"
                      >
                        Chưa từng
                      </div>
                    </td>
                    <td>{{ formatDateTime(user.createdAt) }}</td>
                    <td class="text-end">
                      <div class="action-buttons">
                        <button
                          class="action-button action-button--primary"
                          type="button"
                          title="Xem chi tiết"
                          @click="openDetail(user)"
                        >
                          <i class="bi bi-eye" />
                          <span>Chi tiết</span>
                        </button>
                        <button
                          class="action-button action-button--primary"
                          type="button"
                          title="Chỉnh sửa"
                          @click="openEditModal(user)"
                        >
                          <i class="bi bi-pencil" />
                          <span>Chỉnh sửa</span>
                        </button>
                        <button
                          class="action-button action-button--info"
                          type="button"
                          title="Lịch sử đăng nhập"
                          @click="openLoginHistory(user)"
                        >
                          <i class="bi bi-clock-history" />
                          <span>Lịch sử</span>
                        </button>
                        <button
                          class="action-button action-button--warning"
                          type="button"
                          title="Đặt lại mật khẩu"
                          :disabled="isCurrentUser(user.id)"
                          @click="openResetPasswordModal(user)"
                        >
                          <i class="bi bi-key" />
                          <span>Đặt lại mật khẩu</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-else>
            <div v-if="!filteredUsers.length">
              <EmptyState
                title="Không có dữ liệu"
                message="Điều chỉnh bộ lọc hoặc tải lại danh sách."
              />
            </div>
            <div
              v-else
              class="row g-3"
            >
              <div
                v-for="user in filteredUsers"
                :key="user.id"
                class="col-12 col-md-6 col-xl-4"
              >
                <StaffCard
                  :staff="user"
                  @detail="openDetail"
                  @edit="openEditModal"
                  @history="openLoginHistory"
                />
              </div>
            </div>
          </div>
        </template>
      </div>
      <div
        v-if="totalPages > 1"
        class="card-footer d-flex justify-content-end"
      >
        <Pagination
          mode="zero-based"
          :current-page="zeroBasedPage"
          :total-pages="totalPages"
          @page-change="handlePageChange"
        />
      </div>
    </div>

    <StaffDetailDrawer
      :visible="detailVisible"
      :staff="selectedUser"
      :dashboard="dashboardData"
      :loading="dashboardLoading"
      @close="closeDetail"
    />

    <StaffCreateModal
      ref="createModalRef"
      :roles="roles"
      :submitting="createSubmitting"
      @submit="handleCreateSubmit"
    />

    <LoginHistoryModal
      ref="loginHistoryRef"
      :username="historyUsername"
    />
    <AvatarEditorModal
      ref="avatarEditorRef"
      @apply="handleAvatarEditorApply"
      @closed="handleAvatarEditorClosed"
    />

    <!-- Reset Password Modal -->
    <Teleport to="body">
      <div
        ref="resetPasswordModalRef"
        class="modal fade"
        tabindex="-1"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                Đặt lại mật khẩu: {{ resetPasswordForm.username }}
              </h5>
              <button
                type="button"
                class="btn-close"
                @click="hideResetPasswordModal"
              />
            </div>
            <form @submit.prevent="submitResetPassword">
              <div class="modal-body">
                <div class="error-message mb-3">
                  <i class="bi bi-exclamation-triangle me-2" />
                  Mật khẩu mới sẽ được áp dụng ngay lập tức. Người dùng sẽ cần đăng nhập lại với mật
                  khẩu mới.
                </div>
                <div class="mb-3">
                  <label class="form-label">Mật khẩu mới <span class="text-danger">*</span></label>
                  <PasswordInput
                    v-model="resetPasswordForm.newPassword"
                    :input-class="['form-control', { 'is-invalid': resetPasswordErrors.newPassword }]"
                    :disabled="resetPasswordSubmitting"
                    autocomplete="new-password"
                  />
                  <div
                    v-if="resetPasswordErrors.newPassword"
                    class="invalid-feedback"
                  >
                    {{
                      resetPasswordErrors.newPassword }}
                  </div>
                  <div class="form-text">
                    Tối thiểu 6 ký tự
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Xác nhận mật khẩu <span
                    class="text-danger"
                  >*</span></label>
                  <PasswordInput
                    v-model="resetPasswordForm.confirmPassword"
                    :input-class="['form-control', { 'is-invalid': resetPasswordErrors.confirmPassword }]"
                    :disabled="resetPasswordSubmitting"
                    autocomplete="new-password"
                  />
                  <div
                    v-if="resetPasswordErrors.confirmPassword"
                    class="invalid-feedback"
                  >
                    {{
                      resetPasswordErrors.confirmPassword }}
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  :disabled="resetPasswordSubmitting"
                  @click="hideResetPasswordModal"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="resetPasswordSubmitting"
                >
                  <span
                    v-if="resetPasswordSubmitting"
                    class="spinner-border spinner-border-sm me-2"
                  />
                  Đặt lại mật khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        ref="editModalRef"
        class="modal fade"
        tabindex="-1"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                Cập nhật nhân viên: {{ editForm.username }}
              </h5>
              <button
                type="button"
                class="btn-close"
                @click="hideEditModal"
              />
            </div>
            <form @submit.prevent="submitEditForm">
              <div class="modal-body">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Họ và tên <span class="text-danger">*</span></label>
                    <input
                      v-model.trim="editForm.fullName"
                      type="text"
                      class="form-control"
                      :class="{ 'is-invalid': editErrors.fullName }"
                      :disabled="editSubmitting"
                    >
                    <div
                      v-if="editErrors.fullName"
                      class="invalid-feedback"
                    >
                      {{ editErrors.fullName
                      }}
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Trạng thái <span class="text-danger">*</span></label>
                    <select
                      v-model="editForm.status"
                      class="form-select"
                      :class="{ 'is-invalid': editErrors.status }"
                      :disabled="editSubmitting || isCurrentUser(editForm.id)"
                    >
                      <option value="ACTIVE">
                        ACTIVE
                      </option>
                      <option value="INACTIVE">
                        INACTIVE
                      </option>
                    </select>
                    <div
                      v-if="editErrors.status"
                      class="invalid-feedback"
                    >
                      {{ editErrors.status }}
                    </div>
                    <div
                      v-if="isCurrentUser(editForm.id)"
                      class="form-text text-warning"
                    >
                      <i class="bi bi-exclamation-triangle me-1" />Bạn không thể thay đổi trạng
                      thái của
                      chính mình.
                    </div>
                  </div>
                </div>
                <div class="row g-3 mt-1">
                  <div class="col-md-6">
                    <label class="form-label">Email</label>
                    <input
                      v-model.trim="editForm.email"
                      type="email"
                      class="form-control"
                      :class="{ 'is-invalid': editErrors.email }"
                      :disabled="editSubmitting"
                    >
                    <div
                      v-if="editErrors.email"
                      class="invalid-feedback"
                    >
                      {{ editErrors.email }}
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Số điện thoại <span
                      class="text-danger"
                    >*</span></label>
                    <input
                      v-model.trim="editForm.phone"
                      type="tel"
                      class="form-control"
                      :class="{ 'is-invalid': editErrors.phone }"
                      :disabled="editSubmitting"
                    >
                    <div
                      v-if="editErrors.phone"
                      class="invalid-feedback"
                    >
                      {{ editErrors.phone }}
                    </div>
                  </div>
                </div>
                <div class="row g-3 mt-1">
                  <div class="col-md-6">
                    <label class="form-label">Ảnh đại diện</label>
                    <div class="avatar-upload-box">
                      <div class="avatar-preview-wrapper">
                        <img
                          v-if="editAvatarDisplaySrc"
                          :src="editAvatarDisplaySrc"
                          class="avatar-preview-img"
                          :alt="editForm.fullName || editForm.username"
                        >
                        <div
                          v-else
                          class="avatar-preview-placeholder"
                        >
                          <i class="bi bi-person" />
                        </div>
                      </div>
                      <div class="d-flex flex-wrap gap-2 mt-3">
                        <label class="btn btn-outline-primary btn-sm mb-0">
                          <i class="bi bi-cloud-arrow-up me-1" />Chọn ảnh
                          <input
                            ref="editAvatarInputRef"
                            type="file"
                            class="d-none"
                            accept="image/*"
                            :disabled="editSubmitting"
                            @change="handleEditAvatarSelect"
                          >
                        </label>
                        <button
                          type="button"
                          class="btn btn-outline-secondary btn-sm"
                          :disabled="!editAvatarDisplaySrc || editSubmitting"
                          @click="openAvatarEditor"
                        >
                          <i class="bi bi-eye me-1" />Xem & chỉnh sửa
                        </button>
                        <button
                          type="button"
                          class="btn btn-outline-danger btn-sm"
                          :disabled="editSubmitting || (!editAvatarFile && !editForm.avatarUrl)"
                          @click="handleEditAvatarRemove"
                        >
                          <span v-if="editAvatarFile">Hủy ảnh vừa chọn</span>
                          <span v-else>Xóa avatar hiện tại</span>
                        </button>
                      </div>
                      <div class="form-text mt-2">
                        Hỗ trợ JPG, JPEG, PNG, GIF, WEBP • Tối đa 5MB.
                      </div>
                    </div>
                    <div
                      v-if="editErrors.avatarUrl"
                      class="text-danger small mt-1"
                    >
                      {{
                        editErrors.avatarUrl
                      }}
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Địa chỉ</label>
                    <input
                      v-model.trim="editForm.address"
                      type="text"
                      class="form-control"
                      :class="{ 'is-invalid': editErrors.address }"
                      :disabled="editSubmitting"
                    >
                    <div
                      v-if="editErrors.address"
                      class="invalid-feedback"
                    >
                      {{ editErrors.address }}
                    </div>
                  </div>
                </div>
                <div class="row g-3 mt-1">
                  <div class="col-12">
                    <label class="form-label">Thông điệp trạng thái</label>
                    <input
                      v-model.trim="editForm.statusMessage"
                      type="text"
                      class="form-control"
                      placeholder="Ví dụ: Đang nghỉ phép, Đang làm việc từ xa..."
                      maxlength="255"
                      :disabled="editSubmitting"
                    >
                    <div class="form-text">
                      Thông điệp hiển thị cùng với trạng thái (tùy chọn)
                    </div>
                  </div>
                </div>
                <div class="mt-3">
                  <label class="form-label">Quyền <span class="text-danger">*</span></label>
                  <div
                    class="role-box"
                    :class="{ 'is-invalid': editErrors.roleIds }"
                  >
                    <div
                      v-if="rolesLoading"
                      class="text-center"
                    >
                      <span
                        class="spinner-border spinner-border-sm"
                      />
                    </div>
                    <div
                      v-for="role in roles"
                      v-else
                      :key="role.id"
                      class="form-check"
                    >
                      <input
                        :id="`edit-role-${role.id}`"
                        class="form-check-input"
                        type="checkbox"
                        :value="role.id"
                        :checked="editForm.roleIds.includes(role.id)"
                        :disabled="editSubmitting || isCurrentUser(editForm.id)"
                        @change="toggleEditRole(role.id)"
                      >
                      <label
                        class="form-check-label"
                        :for="`edit-role-${role.id}`"
                      >{{ role.name
                      }}</label>
                    </div>
                  </div>
                  <div
                    v-if="editErrors.roleIds"
                    class="text-danger small"
                  >
                    {{ editErrors.roleIds }}
                  </div>
                  <div
                    v-if="isCurrentUser(editForm.id)"
                    class="form-text text-warning mt-2"
                  >
                    <i class="bi bi-exclamation-triangle me-1" />Bạn không thể thay đổi quyền của
                    chính
                    mình.
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  :disabled="editSubmitting"
                  @click="hideEditModal"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="editSubmitting"
                >
                  <span
                    v-if="editSubmitting"
                    class="spinner-border spinner-border-sm me-2"
                  />
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Bulk Action Confirmation Modal -->
    <Teleport to="body">
      <div
        ref="bulkActionModalRef"
        class="modal fade"
        tabindex="-1"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <div>
                <h5 class="modal-title">
                  {{ bulkActionTarget?.action === 'activate' ? 'Kích hoạt nhân viên' : 'Vô hiệu hóa nhân viên' }}
                </h5>
                <p class="mb-0 text-muted small">
                  Hành động này sẽ áp dụng cho tất cả nhân viên đã chọn.
                </p>
              </div>
              <button
                type="button"
                class="btn-close"
                :disabled="bulkProcessing"
                aria-label="Close"
                @click="closeBulkActionModal"
              />
            </div>
            <div class="modal-body">
              <p class="mb-3">
                Bạn có chắc chắn muốn {{ bulkActionTarget?.action === 'activate' ? 'kích hoạt' : 'vô hiệu hóa' }} <strong>{{ bulkActionTarget?.count || 0 }}</strong> nhân viên đã chọn không?
              </p>
              <div class="error-message">
                <i class="bi bi-exclamation-triangle me-2" />
                {{ bulkActionTarget?.action === 'activate' ? 'Các nhân viên sẽ được kích hoạt và có thể đăng nhập vào hệ thống.' : 'Các nhân viên sẽ bị vô hiệu hóa và không thể đăng nhập vào hệ thống.' }}
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-secondary"
                :disabled="bulkProcessing"
                @click="closeBulkActionModal"
              >
                Hủy
              </button>
              <button
                type="button"
                class="btn"
                :class="bulkActionTarget?.action === 'activate' ? 'btn-success' : 'btn-danger'"
                :disabled="bulkProcessing"
                @click="handleBulkActionConfirm"
              >
                <span
                  v-if="bulkProcessing"
                  class="spinner-border spinner-border-sm me-2"
                />
                {{ bulkActionTarget?.action === 'activate' ? 'Kích hoạt' : 'Vô hiệu hóa' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- User Activity Log Modal -->
    <Teleport to="body">
      <div
        ref="userActivityLogModalRef"
        class="modal fade"
        tabindex="-1"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                Lịch sử hoạt động: {{ activityLogUser?.username || '—' }}
              </h5>
              <button
                type="button"
                class="btn-close"
                @click="hideUserActivityLogModal"
              />
            </div>
            <div class="modal-body">
              <LoadingState
                v-if="activityLogLoading"
                text="Đang tải lịch sử hoạt động..."
              />
              <EmptyState
                v-else-if="!activityLogs.length"
                title="Chưa có dữ liệu hoạt động"
                message="Tính năng này cần hỗ trợ từ backend."
              >
                <template #icon>
                  <i class="bi bi-inbox" />
                </template>
              </EmptyState>
              <div
                v-else
                class="table-responsive"
              >
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Thời gian</th>
                      <th>Hành động</th>
                      <th>Loại tài nguyên</th>
                      <th>ID tài nguyên</th>
                      <th>Kết quả</th>
                      <th>Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="log in activityLogs"
                      :key="log.id"
                    >
                      <td>{{ formatDateTime(log.timestamp) }}</td>
                      <td><code>{{ log.action }}</code></td>
                      <td>{{ log.resourceType || '—' }}</td>
                      <td>{{ log.resourceId || '—' }}</td>
                      <td>
                        <span
                          class="badge"
                          :class="log.success ? 'bg-success' : 'bg-danger'"
                        >
                          {{ log.success ? 'Thành công' : 'Thất bại' }}
                        </span>
                      </td>
                      <td>
                        <small class="text-muted">{{ log.details || '—' }}</small>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="hideUserActivityLogModal"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, nextTick } from 'vue'
import { Modal } from 'bootstrap'
import { toast } from 'vue3-toastify'
import EmptyState from '@/components/common/EmptyState.vue'
import Pagination from '@/components/common/Pagination.vue'
import PasswordInput from '@/components/common/PasswordInput.vue'
import StaffCard from '@/components/staff/StaffCard.vue'
import StaffDetailDrawer from '@/components/staff/StaffDetailDrawer.vue'
import StaffCreateModal from '@/components/staff/StaffCreateModal.vue'
import LoginHistoryModal from '@/components/staff/LoginHistoryModal.vue'
import AvatarEditorModal from '@/components/staff/AvatarEditorModal.vue'
import { getUsers, updateUser, getAllRoles, getUserById, createUser, adminResetPassword, getUserActivityLogs } from '@/api/userService'
import { uploadFile, deleteFile, extractFileName } from '@/api/fileService'
import { getStaffDashboard } from '@/api/staffDashboardService'
import { formatDateTime, formatNumber } from '@/utils/formatters'
import { useTableData } from '@/composables/useTableData'
import { useAuthStore } from '@/store/auth'
import { useAsyncOperation } from '@/composables/useAsyncOperation'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const authStore = useAuthStore()
const currentUserId = computed(() => authStore.user?.id)

const STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'Đang hoạt động' },
    { value: 'INACTIVE', label: 'Đã khóa' }
]

const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

const viewMode = ref('table')
const filters = reactive({
    search: '',
    status: '',
    role: '',
    createdFrom: '',
    createdTo: '',
    updatedFrom: '',
    updatedTo: '',
    lastSeen: ''
})
const showAdvancedFilters = ref(false)
const { loading, error, execute } = useAsyncOperation({ context: 'Staff' })

const users = ref([])
const selectedUsers = ref([])
const bulkProcessing = ref(false)
const exporting = ref(false)
const totalElements = ref(0)

const roles = ref([])
const rolesLoading = ref(false)

const selectedUser = ref(null)
const detailVisible = ref(false)
const dashboardData = ref(null)
const dashboardLoading = ref(false)

const createModalRef = ref(null)
const createSubmitting = ref(false)

const loginHistoryRef = ref(null)
const historyUsername = ref('')

const resetPasswordModalRef = ref(null)
let resetPasswordModalInstance = null
const resetPasswordSubmitting = ref(false)
const resetPasswordForm = reactive({
    userId: null,
    username: '',
    newPassword: '',
    confirmPassword: ''
})
const resetPasswordErrors = reactive({})

const userActivityLogModalRef = ref(null)
let userActivityLogModalInstance = null
const activityLogLoading = ref(false)
const activityLogs = ref([])
const activityLogUser = ref(null)

const editModalRef = ref(null)
let editModalInstance = null
const editSubmitting = ref(false)
const editForm = reactive({
    id: null,
    username: '',
    fullName: '',
    phone: '',
    email: '',
    status: 'ACTIVE',
    roleIds: [],
    avatarUrl: '',
    address: '',
    statusMessage: '',
    removeAvatar: false
})
const editErrors = reactive({})
const editAvatarFile = ref(null)
const editAvatarPreview = ref('')
const editAvatarInputRef = ref(null)
const originalAvatarUrl = ref('')
const avatarEditorRef = ref(null)
const editModalPaused = ref(false)

const editAvatarDisplaySrc = computed(() => editAvatarPreview.value || editForm.avatarUrl || '')

const resetEditAvatarState = () => {
    if (editAvatarPreview.value && editAvatarPreview.value.startsWith('blob:')) {
        URL.revokeObjectURL(editAvatarPreview.value)
    }
    editAvatarPreview.value = ''
    editAvatarFile.value = null
    if (editAvatarInputRef.value) {
        editAvatarInputRef.value.value = ''
    }
}

const handleEditAvatarSelect = (event) => {
    const file = event.target?.files?.[0]
    if (!file) return

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
        toast.error('Định dạng ảnh không được hỗ trợ. Hãy chọn JPG, JPEG, PNG, GIF hoặc WEBP.')
        event.target.value = ''
        return
    }

    if (file.size > MAX_AVATAR_SIZE) {
        toast.error('Kích thước ảnh tối đa 5MB. Vui lòng chọn ảnh khác.')
        event.target.value = ''
        return
    }

    if (editAvatarPreview.value && editAvatarPreview.value.startsWith('blob:')) {
        URL.revokeObjectURL(editAvatarPreview.value)
    }

    editAvatarFile.value = file
    editAvatarPreview.value = URL.createObjectURL(file)
    editForm.removeAvatar = false
    editErrors.avatarUrl = ''
}

const handleEditAvatarRemove = () => {
    if (editAvatarFile.value) {
        resetEditAvatarState()
        editForm.removeAvatar = false
        return
    }

    if (!editForm.avatarUrl && !originalAvatarUrl.value) {
        return
    }

    resetEditAvatarState()
    editForm.avatarUrl = ''
    editForm.removeAvatar = true
    editErrors.avatarUrl = ''
}

const openAvatarEditor = () => {
    const src = editAvatarDisplaySrc.value
    if (!src) {
        toast.warning('Chưa có ảnh để xem/chỉnh sửa.')
        return
    }
    editModalPaused.value = true
    editModalInstance?.hide()
    avatarEditorRef.value?.open(src)
}

const handleAvatarEditorApply = ({ file, url }) => {
    if (!file || !url) return
    if (editAvatarPreview.value && editAvatarPreview.value.startsWith('blob:')) {
        URL.revokeObjectURL(editAvatarPreview.value)
    }
    editAvatarFile.value = file
    editAvatarPreview.value = url
    editForm.removeAvatar = false
    editErrors.avatarUrl = ''
    if (editModalPaused.value) {
        editModalInstance?.show()
        editModalPaused.value = false
    }
}

const handleAvatarEditorClosed = () => {
    if (editModalPaused.value) {
        editModalInstance?.show()
        editModalPaused.value = false
    }
}

const filteredUsers = computed(() => {
    let list = [...users.value]

    // Basic filters
    if (filters.status) {
        list = list.filter((user) => user.status === filters.status)
    }
    if (filters.role) {
        list = list.filter((user) => user.roles?.some((role) => role.name === filters.role))
    }
    if (filters.search) {
        const keyword = filters.search.toLowerCase()
        list = list.filter((user) => {
            const username = user.username?.toLowerCase() || ''
            const fullName = user.fullName?.toLowerCase() || ''
            const phone = user.phone?.toLowerCase() || ''
            const email = user.email?.toLowerCase() || ''
            return username.includes(keyword) || fullName.includes(keyword) || phone.includes(keyword) || email.includes(keyword)
        })
    }

    // Advanced filters
    if (filters.createdFrom) {
        const fromDate = new Date(filters.createdFrom)
        list = list.filter((user) => {
            if (!user.createdAt) return false
            return new Date(user.createdAt) >= fromDate
        })
    }
    if (filters.createdTo) {
        const toDate = new Date(filters.createdTo)
        toDate.setHours(23, 59, 59, 999)
        list = list.filter((user) => {
            if (!user.createdAt) return false
            return new Date(user.createdAt) <= toDate
        })
    }
    if (filters.updatedFrom) {
        const fromDate = new Date(filters.updatedFrom)
        list = list.filter((user) => {
            if (!user.updatedAt) return false
            return new Date(user.updatedAt) >= fromDate
        })
    }
    if (filters.updatedTo) {
        const toDate = new Date(filters.updatedTo)
        toDate.setHours(23, 59, 59, 999)
        list = list.filter((user) => {
            if (!user.updatedAt) return false
            return new Date(user.updatedAt) <= toDate
        })
    }
    if (filters.lastSeen) {
        const now = new Date()
        list = list.filter((user) => {
            if (!user.lastSeenAt) {
                return filters.lastSeen === 'never'
            }
            const lastSeen = new Date(user.lastSeenAt)
            const diffDays = Math.floor((now - lastSeen) / (1000 * 60 * 60 * 24))

            if (filters.lastSeen === 'today') return diffDays === 0
            if (filters.lastSeen === 'week') return diffDays <= 7
            if (filters.lastSeen === 'month') return diffDays <= 30
            return false
        })
    }

    return list
})

// Statistics
const totalUsers = computed(() => filteredUsers.value.length)
const activeUsersCount = computed(() => filteredUsers.value.filter(u => u.status === 'ACTIVE').length)
const usersByRoleCount = computed(() => {
    if (!filters.role) return filteredUsers.value.length
    return filteredUsers.value.filter(u => u.roles?.some(r => r.name === filters.role)).length
})
const recentlyActiveCount = computed(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return filteredUsers.value.filter(u => {
        if (!u.lastSeenAt) return false
        return new Date(u.lastSeenAt) >= weekAgo
    }).length
})

// Bulk selection
const allSelected = computed(() => {
    const selectableUsers = filteredUsers.value.filter(u => !isCurrentUser(u.id))
    return selectableUsers.length > 0 && selectableUsers.every(u => isUserSelected(u.id))
})

const isUserSelected = (userId) => selectedUsers.value.includes(userId)
const isCurrentUser = (userId) => userId === currentUserId.value

const toggleUserSelection = (userId) => {
    if (isCurrentUser(userId)) return
    const index = selectedUsers.value.indexOf(userId)
    if (index === -1) {
        selectedUsers.value.push(userId)
    } else {
        selectedUsers.value.splice(index, 1)
    }
}

const toggleSelectAll = () => {
    const selectableUsers = filteredUsers.value.filter(u => !isCurrentUser(u.id))
    if (allSelected.value) {
        selectedUsers.value = selectedUsers.value.filter(id => !selectableUsers.some(u => u.id === id))
    } else {
        selectableUsers.forEach(u => {
            if (!selectedUsers.value.includes(u.id)) {
                selectedUsers.value.push(u.id)
            }
        })
    }
}

const clearSelection = () => {
    selectedUsers.value = []
}

const toggleAdvancedFilters = () => {
    showAdvancedFilters.value = !showAdvancedFilters.value
}

const roleFilterOptions = computed(() => roles.value.map((role) => role.name))

// Sử dụng useTableData cho phân trang và tìm kiếm
const tableData = useTableData({
    fetchFn: async (params) => await getUsers({
        page: params.page,
        size: params.size,
        search: params.searchKeyword || filters.search || undefined,
        status: filters.status || undefined,
        role: filters.role || undefined
    }),
    initialPageSize: 12,
    debounceMs: 300,
    syncUrl: true,
    pageParam: 'page',
    sizeParam: 'size',
    searchParam: 'search',
    zeroBasedPage: true
})

// Expose pagination properties
const zeroBasedPage = computed(() => tableData.zeroBasedPage.value)
const totalPages = computed(() => tableData.totalPages.value)
const setPageFromZero = (page) => tableData.setPage(page)

const fetchUsers = async () => {
    // Cập nhật searchKeyword trong tableData nếu filters.search thay đổi
    if (filters.search !== tableData.searchKeyword.value) {
        tableData.setSearchKeyword(filters.search)
    } else {
        // Nếu search không đổi, chỉ fetch lại
        await tableData.fetchData()
    }
    users.value = tableData.data.value || []
    totalElements.value = tableData.totalElements.value
}

const handlePageChange = (newPage) => {
    setPageFromZero(newPage)
}

const resetFilters = () => {
    filters.search = ''
    filters.status = ''
    filters.role = ''
    filters.createdFrom = ''
    filters.createdTo = ''
    filters.updatedFrom = ''
    filters.updatedTo = ''
    filters.lastSeen = ''
    clearSelection()
    tableData.setSearchKeyword('')
    tableData.setFilters({})
    tableData.setPage(0)
    fetchUsers()
}

watch(
    () => [filters.search, filters.status, filters.role, filters.createdFrom, filters.createdTo, filters.updatedFrom, filters.updatedTo, filters.lastSeen],
    () => {
        // Advanced filters are client-side, no need to refetch
        if (!filters.createdFrom && !filters.createdTo && !filters.updatedFrom && !filters.updatedTo && !filters.lastSeen) {
            // Cập nhật searchKeyword và filters trong tableData
            tableData.setSearchKeyword(filters.search)
            tableData.setFilters({
                status: filters.status || undefined,
                role: filters.role || undefined
            })
            tableData.setPage(0)
        }
    },
    { deep: true }
)

const buildInitials = (user) => {
    const source = user?.fullName || user?.username || ''
    return source
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase())
        .slice(0, 2)
        .join('') || 'NV'
}

const statusBadgeClass = (status) => {
    switch (status) {
        case 'ACTIVE':
            return 'status-badge status-badge--active'
        case 'INACTIVE':
            return 'status-badge status-badge--inactive'
        default:
            return 'status-badge status-badge--neutral'
    }
}

const formatRole = (roleName) => {
    if (!roleName) return '—'
    return roleName.replace('ROLE_', '').toLowerCase().replace(/(^|\s)\w/g, (s) => s.toUpperCase())
}

const loadRoles = async () => {
    if (roles.value.length) return
    rolesLoading.value = true
    try {
        await execute(async () => {
            roles.value = await getAllRoles()
        }, 'Không thể tải danh sách quyền.', {
            showToast: false // Không hiển thị toast cho roles
        })
    } finally {
        rolesLoading.value = false
    }
}

const openCreateModal = async () => {
    await loadRoles()
    createModalRef.value?.show()
}

const handleCreateSubmit = async (payload) => {
    createSubmitting.value = true
    try {
        // Sử dụng createUser từ userService thay vì register từ authService
        // Điều này cho phép admin tạo user với đầy đủ quyền kiểm soát (bao gồm roleIds)
        await createUser(payload)
        toast.success('Đã tạo tài khoản nhân viên mới.')
        createModalRef.value?.hide()
        setPageFromZero(0)
        await fetchUsers()
    } catch {
        toast.error('Không thể tạo nhân viên mới.')
    } finally {
        createSubmitting.value = false
    }
}

const openLoginHistory = (user) => {
    if (!user?.username) {
        toast.warning('Không xác định được username để truy vấn log đăng nhập.')
        return
    }
    historyUsername.value = user.username
    loginHistoryRef.value?.show()
}

const openDetail = async (user) => {
    selectedUser.value = user
    detailVisible.value = true
    dashboardLoading.value = true
    try {
        const freshUser = await getUserById(user.id)
        selectedUser.value = freshUser
    } catch {
        // Error loading user, continue with existing user data
    }
    try {
        dashboardData.value = await getStaffDashboard(user.id)
    } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể tải dữ liệu hiệu suất.')
        dashboardData.value = null
    } finally {
        dashboardLoading.value = false
    }
}

const resetEditErrors = () => {
    Object.keys(editErrors).forEach((key) => {
        editErrors[key] = ''
    })
}

const openEditModal = async (user) => {
    await loadRoles()
    resetEditErrors()
    resetEditAvatarState()
    editForm.id = user.id
    editForm.username = user.username
    editForm.fullName = user.fullName || ''
    editForm.phone = user.phone || ''
    editForm.email = user.email || ''
    editForm.status = user.status || 'ACTIVE'
    editForm.roleIds = user.roles?.map((role) => role.id) || []
    editForm.avatarUrl = user.avatarUrl || ''
    editForm.address = user.address || ''
    editForm.statusMessage = user.statusMessage || ''
    editForm.removeAvatar = false
    originalAvatarUrl.value = user.avatarUrl || ''
    editModalInstance?.show()
}

const hideEditModal = () => {
    editModalInstance?.hide()
    resetEditAvatarState()
    originalAvatarUrl.value = ''
}

const toggleEditRole = (roleId) => {
    const index = editForm.roleIds.indexOf(roleId)
    if (index === -1) {
        editForm.roleIds.push(roleId)
    } else {
        editForm.roleIds.splice(index, 1)
    }
}

const validateEditForm = () => {
    let valid = true
    resetEditErrors()
    if (!editForm.fullName) {
        editErrors.fullName = 'Họ tên là bắt buộc.'
        valid = false
    }
    if (!editForm.status) {
        editErrors.status = 'Trạng thái là bắt buộc.'
        valid = false
    }
    if (isCurrentUser(editForm.id)) {
        // Prevent changing own status
        const originalUser = users.value.find(u => u.id === editForm.id)
        if (originalUser && editForm.status !== originalUser.status) {
            editErrors.status = 'Bạn không thể thay đổi trạng thái của chính mình.'
            valid = false
        }
        // Prevent changing own roles
        const originalRoleIds = originalUser?.roles?.map(r => r.id) || []
        const roleChanged = JSON.stringify([...editForm.roleIds].sort()) !== JSON.stringify([...originalRoleIds].sort())
        if (roleChanged) {
            editErrors.roleIds = 'Bạn không thể thay đổi quyền của chính mình.'
            valid = false
        }
    }
    if (!editForm.phone) {
        editErrors.phone = 'Số điện thoại là bắt buộc.'
        valid = false
    } else if (!/^(\+?84|0)\d{9}$/.test(editForm.phone)) {
        editErrors.phone = 'Số điện thoại không hợp lệ.'
        valid = false
    }
    if (editForm.email) {
        const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/
        if (!emailRegex.test(editForm.email)) {
            editErrors.email = 'Email không hợp lệ.'
            valid = false
        }
    }
    if (editForm.address && editForm.address.length > 255) {
        editErrors.address = 'Địa chỉ tối đa 255 ký tự.'
        valid = false
    }
    if (editForm.statusMessage && editForm.statusMessage.length > 255) {
        editErrors.statusMessage = 'Thông điệp trạng thái tối đa 255 ký tự.'
        valid = false
    }
    if (!editForm.roleIds.length) {
        editErrors.roleIds = 'Phải chọn ít nhất một quyền.'
        valid = false
    }
    return valid
}

const submitEditForm = async () => {
    if (!validateEditForm()) return
    editSubmitting.value = true

    const previousAvatarUrl = originalAvatarUrl.value
    let uploadedFileName = ''

    try {
        let newAvatarUrl = editForm.avatarUrl?.trim() || null
        let removeAvatarFlag = editForm.removeAvatar && !editAvatarFile.value

        if (editAvatarFile.value) {
            const uploadResponse = await uploadFile(editAvatarFile.value)
            newAvatarUrl = uploadResponse?.fileUrl || null
            uploadedFileName = extractFileName(uploadResponse?.fileUrl)
            removeAvatarFlag = false
        }

        const payload = {
            fullName: editForm.fullName.trim(),
            phone: editForm.phone.trim(),
            email: editForm.email.trim() || null,
            status: editForm.status,
            roleIds: [...editForm.roleIds],
            avatarUrl: removeAvatarFlag ? null : newAvatarUrl,
            address: editForm.address?.trim() || null,
            statusMessage: editForm.statusMessage?.trim() || null,
            removeAvatar: removeAvatarFlag
        }

        const updatedUser = await updateUser(editForm.id, payload)
        toast.success('Đã cập nhật thông tin nhân viên.')

        if (selectedUser.value?.id === updatedUser.id) {
            selectedUser.value = updatedUser
        }

        // cleanup old avatar on success if replaced or removed
        if ((editAvatarFile.value || removeAvatarFlag) && previousAvatarUrl) {
            const oldFileName = extractFileName(previousAvatarUrl)
            if (oldFileName && oldFileName !== uploadedFileName) {
                try {
                    await deleteFile(oldFileName)
                } catch {
                    // Failed to delete old avatar, continue
                }
            }
        }

        hideEditModal()
        await fetchUsers()
    } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể cập nhật thông tin nhân viên.')
        if (uploadedFileName) {
            try {
                await deleteFile(uploadedFileName)
            } catch {
                // Failed to cleanup uploaded file
            }
        }
        toast.error(err.response?.data?.message || 'Không thể cập nhật nhân viên.')
    } finally {
        editSubmitting.value = false
    }
}

onMounted(async () => {
    editModalInstance = new Modal(editModalRef.value, { backdrop: 'static' })
    resetPasswordModalInstance = new Modal(resetPasswordModalRef.value, { backdrop: 'static' })
    userActivityLogModalInstance = new Modal(userActivityLogModalRef.value, { backdrop: 'static' })
    if (bulkActionModalRef.value) {
        bulkActionModalInstance = new Modal(bulkActionModalRef.value, { backdrop: 'static' })
    }
    await Promise.all([loadRoles(), fetchUsers()])
})

onBeforeUnmount(() => {
    editModalInstance?.dispose()
    editModalInstance = null
    resetPasswordModalInstance?.dispose()
    resetPasswordModalInstance = null
    userActivityLogModalInstance?.dispose()
    userActivityLogModalInstance = null
    bulkActionModalInstance?.dispose()
    bulkActionModalInstance = null
})

const closeDetail = () => {
    detailVisible.value = false
    dashboardData.value = null
}

// Bulk Operations
const bulkActionTarget = ref(null)
const bulkActionModalRef = ref(null)
let bulkActionModalInstance = null

const handleBulkActivate = async () => {
    if (!selectedUsers.value.length) return
    bulkActionTarget.value = { action: 'activate', count: selectedUsers.value.length }
    nextTick(() => {
        bulkActionModalInstance?.show()
    })
}

const handleBulkActivateConfirm = async () => {
    if (!selectedUsers.value.length) return

    bulkActionModalInstance?.hide()
    bulkProcessing.value = true
    try {
        const promises = selectedUsers.value.map(userId => {
            const user = users.value.find(u => u.id === userId)
            if (!user || user.status === 'ACTIVE') return Promise.resolve()
            return updateUser(userId, {
                ...user,
                status: 'ACTIVE',
                roleIds: user.roles?.map(r => r.id) || []
            })
        })
        await Promise.all(promises)
        toast.success(`Đã kích hoạt ${selectedUsers.value.length} nhân viên.`)
        clearSelection()
        await fetchUsers()
    } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể kích hoạt một số nhân viên.')
    } finally {
        bulkProcessing.value = false
    }
}

const handleBulkActionConfirm = async () => {
    if (!bulkActionTarget.value) return
    if (bulkActionTarget.value.action === 'activate') {
        await handleBulkActivateConfirm()
    } else if (bulkActionTarget.value.action === 'deactivate') {
        await handleBulkDeactivateConfirm()
    }
}

const closeBulkActionModal = () => {
    bulkActionModalInstance?.hide()
    bulkActionTarget.value = null
}

const handleBulkDeactivate = async () => {
    if (!selectedUsers.value.length) return
    bulkActionTarget.value = { action: 'deactivate', count: selectedUsers.value.length }
    nextTick(() => {
        bulkActionModalInstance?.show()
    })
}

const handleBulkDeactivateConfirm = async () => {
    if (!selectedUsers.value.length) return

    bulkActionModalInstance?.hide()
    bulkProcessing.value = true
    try {
        const promises = selectedUsers.value.map(userId => {
            const user = users.value.find(u => u.id === userId)
            if (!user || user.status === 'INACTIVE') return Promise.resolve()
            return updateUser(userId, {
                ...user,
                status: 'INACTIVE',
                roleIds: user.roles?.map(r => r.id) || []
            })
        })
        await Promise.all(promises)
        toast.success(`Đã vô hiệu hóa ${selectedUsers.value.length} nhân viên.`)
        clearSelection()
        await fetchUsers()
    } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể vô hiệu hóa một số nhân viên.')
    } finally {
        bulkProcessing.value = false
    }
}

// Export
const handleExport = async () => {
    if (exporting.value || !users.value.length) return

    exporting.value = true
    try {
        // Get all users (not just current page)
        const allUsersData = await getUsers({
            page: 0,
            size: 10000, // Get all
            search: filters.search || undefined,
            status: filters.status || undefined,
            role: filters.role || undefined
        })
        const allUsers = allUsersData?.content || []

        // Create CSV content
        const headers = ['Tên đăng nhập', 'Họ tên', 'SĐT', 'Email', 'Quyền', 'Trạng thái', 'Thông điệp', 'Hoạt động cuối', 'Ngày tạo', 'Ngày cập nhật']
        const rows = allUsers.map(user => {
            const roles = user.roles?.map(r => formatRole(r.name)).join(', ') || '—'
            return [
                user.username || '—',
                user.fullName || '—',
                user.phone || '—',
                user.email || '—',
                roles,
                user.status || '—',
                user.statusMessage || '—',
                user.lastSeenAt ? formatDateTime(user.lastSeenAt) : 'Chưa từng',
                user.createdAt ? formatDateTime(user.createdAt) : '—',
                user.updatedAt ? formatDateTime(user.updatedAt) : '—'
            ]
        })

        // Convert to CSV
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n')

        // Thêm BOM để Excel hỗ trợ UTF-8
        const BOM = '\uFEFF'
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `Users_${new Date().toISOString().slice(0, 10)}.csv`
        link.click()
        URL.revokeObjectURL(url)

        toast.success('Đã xuất danh sách nhân viên thành công!')
    } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể xuất danh sách nhân viên.')
    } finally {
        exporting.value = false
    }
}

// Đặt lại mật khẩu
const openResetPasswordModal = (user) => {
    if (isCurrentUser(user.id)) {
        toast.warning('Bạn không thể đặt lại mật khẩu của chính mình. Vui lòng sử dụng chức năng đổi mật khẩu trong hồ sơ.')
        return
    }
    resetPasswordForm.userId = user.id
    resetPasswordForm.username = user.username
    resetPasswordForm.newPassword = ''
    resetPasswordForm.confirmPassword = ''
    Object.keys(resetPasswordErrors).forEach(key => {
        resetPasswordErrors[key] = ''
    })
    resetPasswordModalInstance?.show()
}

const hideResetPasswordModal = () => {
    resetPasswordModalInstance?.hide()
    resetPasswordForm.userId = null
    resetPasswordForm.username = ''
    resetPasswordForm.newPassword = ''
    resetPasswordForm.confirmPassword = ''
}

const validateResetPasswordForm = () => {
    let valid = true
    Object.keys(resetPasswordErrors).forEach(key => {
        resetPasswordErrors[key] = ''
    })

    if (!resetPasswordForm.newPassword) {
        resetPasswordErrors.newPassword = 'Mật khẩu mới là bắt buộc.'
        valid = false
    } else if (resetPasswordForm.newPassword.length < 6) {
        resetPasswordErrors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự.'
        valid = false
    }

    if (!resetPasswordForm.confirmPassword) {
        resetPasswordErrors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc.'
        valid = false
    } else if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
        resetPasswordErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.'
        valid = false
    }

    return valid
}

const submitResetPassword = async () => {
    if (!validateResetPasswordForm()) return

    resetPasswordSubmitting.value = true
    try {
        // Gọi API admin reset password
        // Backend không nhận newPassword, tự generate temporary password
        const response = await adminResetPassword(resetPasswordForm.userId)
        const tempPassword = response?.temporaryPassword
        const message = response?.message || 'Đã đặt lại mật khẩu thành công.'

        if (tempPassword && import.meta.env.DEV) {
            toast.success(`${message} Mật khẩu tạm: ${tempPassword}`)
        } else {
            toast.success(message)
        }
        hideResetPasswordModal()
    } catch (err) {
        toast.error(err.response?.data?.message || err.message || 'Không thể đặt lại mật khẩu.')
    } finally {
        resetPasswordSubmitting.value = false
    }
}

// User Activity Log
const _openUserActivityLog = async (user) => {
    activityLogUser.value = user
    activityLogs.value = []
    activityLogLoading.value = true
    userActivityLogModalInstance?.show()

    try {
        // Gọi API lấy activity logs của user
        const response = await getUserActivityLogs(user.id, { page: 0, size: 50 })

        // Xử lý response: có thể là Page object hoặc Array
        if (Array.isArray(response)) {
            activityLogs.value = response
        } else if (Array.isArray(response?.content)) {
            activityLogs.value = response.content
        } else if (Array.isArray(response?.items)) {
            activityLogs.value = response.items
        } else {
            activityLogs.value = []
        }
    } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể tải lịch sử hoạt động.')
        activityLogs.value = []
    } finally {
        activityLogLoading.value = false
    }
}

const hideUserActivityLogModal = () => {
    userActivityLogModalInstance?.hide()
    activityLogUser.value = null
    activityLogs.value = []
}

</script>

<style scoped>
.staff-page {
    display: flex;
    flex-direction: column;
    gap: var(--component-gap-lg);
    padding-bottom: var(--component-padding-lg);
}

/* Header - Chuẩn hóa theo base.css */
.staff-header {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    margin-bottom: var(--spacing-4);
}

.staff-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    flex-wrap: wrap;
}

.staff-header__title-section {
    flex: 1;
    min-width: 0;
}

.staff-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    align-items: center;
    justify-content: flex-end;
}

.staff-header__actions .btn {
    font-size: var(--font-size-base);
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    transition: all var(--transition-base);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    font-weight: var(--font-weight-medium);
    line-height: var(--line-height-normal);
    font-family: var(--font-family-sans);
}

.staff-header__actions .btn-primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.staff-header__actions .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-dark);
}

.staff-header__actions .btn-outline-secondary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.staff-header__actions .btn-outline-secondary:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.staff-header__actions .btn-outline-success {
    border-color: var(--color-border);
    color: var(--color-success);
    background: transparent;
}

.staff-header__actions .btn-outline-success:hover:not(:disabled) {
    background: var(--color-soft-emerald);
    border-color: var(--color-success);
    color: var(--color-success);
}

.staff-header__actions .btn i {
    font-size: 18px;
    line-height: 1;
}

.staff-header__actions .btn-sm {
    padding: var(--spacing-2) var(--spacing-4);
    font-size: var(--font-size-sm);
}

.page-title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-tight);
    font-family: var(--font-family-sans);
}

.page-subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-weight: var(--font-weight-normal);
    font-family: var(--font-family-sans);
}

/* Layout Toggle - Exact match with Tables.vue */
.layout-toggle {
    display: inline-flex;
    gap: var(--spacing-3);
    background: transparent;
    padding: 0;
    border: none;
}

.layout-toggle .btn {
    padding: 0.65rem 1.25rem;
    border-radius: 9999px;
    font-size: 0.9rem;
    font-weight: var(--font-weight-semibold);
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--font-family-sans);
    transition: all 0.2s ease;
}

.layout-toggle .btn-primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: #ffffff;
}

.layout-toggle .btn-outline-primary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.layout-toggle .btn-outline-primary:hover {
    background: var(--color-card);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.layout-toggle .btn i {
    font-size: 1rem;
    line-height: 1;
    color: inherit;
}

.layout-toggle .btn-primary i {
    color: #ffffff;
}

.layout-toggle .btn-outline-primary i {
    color: var(--color-primary);
}

/* KPI Cards - Flat Design */
.kpi-card {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-4);
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    transition: all var(--transition-base);
    min-height: 120px;
    height: 100%;
}

.kpi-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

.kpi-card__icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
    transition: all var(--transition-base);
}

/* Màu icon - dùng var(--color-soft-*) */
.kpi-card--people .kpi-card__icon {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.kpi-card--active .kpi-card__icon {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.kpi-card--role .kpi-card__icon {
    background: var(--color-soft-indigo);
    color: var(--color-primary);
}

.kpi-card--recent .kpi-card__icon {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.kpi-card__content {
    flex: 1;
    min-width: 0;
}

.kpi-card__label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-2);
    line-height: var(--line-height-normal);
    font-family: var(--font-family-sans);
}

.kpi-card__value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

/* Filter Card - Chuẩn hóa */
.filter-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.filter-card :global(.card-body) {
    padding: var(--spacing-5);
}

.filter-card :global(.card-body h5) {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-4);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-label) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
    line-height: var(--line-height-normal);
    display: block;
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-control),
.filter-card :global(.form-select) {
    height: 40px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    line-height: var(--line-height-normal);
    transition: all var(--transition-base);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-control:focus),
.filter-card :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.filter-card :global(.form-control:hover:not(:focus)),
.filter-card :global(.form-select:hover:not(:focus)) {
    border-color: var(--color-border);
}

.filter-card :global(.input-group-text) {
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
    border-right: none;
    color: var(--color-text-muted);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm) 0 0 var(--radius-sm);
    font-size: var(--font-size-base);
}

.filter-card :global(.input-group .form-control) {
    border-left: none;
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.filter-card :global(.btn) {
    font-size: var(--font-size-base);
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    transition: all var(--transition-base);
    font-weight: var(--font-weight-medium);
    line-height: var(--line-height-normal);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.filter-card :global(.btn-outline-primary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.filter-card :global(.btn-outline-primary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.filter-card :global(.btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.filter-card :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.filter-card :global(.btn i) {
    font-size: 18px;
    line-height: 1;
}

/* Bulk Actions Bar - Chuẩn hóa */
.staff-page :global(.card.border-primary) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-primary);
    background: var(--color-card);
}

.staff-page :global(.card.border-primary .card-body) {
    padding: var(--spacing-4);
}

.staff-page :global(.card.border-primary .btn) {
    font-size: var(--font-size-sm);
    padding: var(--spacing-1) var(--spacing-3);
    border-radius: var(--radius-sm);
    transition: all var(--transition-base);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    font-weight: var(--font-weight-medium);
    line-height: var(--line-height-normal);
    font-family: var(--font-family-sans);
}

.staff-page :global(.card.border-primary .btn-success) {
    background: var(--color-success);
    border-color: var(--color-success);
    color: var(--color-text-inverse);
}

.staff-page :global(.card.border-primary .btn-success:hover:not(:disabled)) {
    background: var(--color-success-dark, #1e7e4e);
}

.staff-page :global(.card.border-primary .btn-danger) {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-text-inverse);
}

.staff-page :global(.card.border-primary .btn-danger:hover:not(:disabled)) {
    background: var(--color-danger-dark, #a0281d);
}

.staff-page :global(.card.border-primary .btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.staff-page :global(.card.border-primary .btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.staff-page :global(.card.border-primary .btn-outline-info) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.staff-page :global(.card.border-primary .btn-outline-info:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.staff-page :global(.card.border-primary .btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.staff-page :global(.card.border-primary .btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.staff-page :global(.card.border-primary .btn i) {
    font-size: 18px;
    line-height: 1;
}

/* Data Card - Chuẩn hóa */
.data-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.data-card :global(.card-body) {
    padding: var(--spacing-5);
}

.data-card :global(.card-footer) {
    padding: var(--spacing-4) var(--spacing-5);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
}

/* Table - Minimal Table Styling */
.staff-page :global(.table) {
    margin-bottom: 0;
    border-collapse: separate;
    border-spacing: 0;
    background: var(--color-card);
    color: var(--color-heading);
    width: 100%;
}

.staff-page :global(.table thead),
.staff-page :global(.table thead.table-light) {
    background: var(--color-card-muted);
}

.staff-page :global(.table thead th) {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    color: var(--color-heading);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-3);
    vertical-align: middle;
    font-family: var(--font-family-sans);
}

.staff-page :global(.table tbody td) {
    font-size: var(--font-size-base);
    padding: var(--spacing-3);
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
    line-height: var(--line-height-normal);
    font-family: var(--font-family-sans);
}

.staff-page :global(.table tbody tr:last-child td) {
    border-bottom: none;
}

.staff-page :global(.table tbody tr:hover) {
    background: var(--color-card-muted);
}

.staff-page :global(.table .form-check-input) {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    cursor: pointer;
    transition: all var(--transition-base);
    margin-top: 0.15rem;
}

.staff-page :global(.table .form-check-input:checked) {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
}

.staff-page :global(.table .form-check-input:focus) {
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.staff-page :global(.table .btn-link) {
    padding: 0;
    border: none;
    background: transparent;
    color: var(--color-primary);
    text-decoration: none;
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.staff-page :global(.table .btn-link:hover) {
    color: var(--color-primary-dark);
    text-decoration: underline;
}

.table-avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--color-border);
}

.table-avatar.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-soft-primary);
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    border: 2px solid var(--color-border);
}

/* Action Buttons - Flat Design */
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
    justify-content: center;
    gap: var(--spacing-2);
    padding: var(--spacing-1) var(--spacing-3);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    line-height: var(--line-height-normal);
    transition: all var(--transition-base);
    white-space: nowrap;
    cursor: pointer;
    font-family: var(--font-family-sans);
}

.action-button:hover:not(:disabled) {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.action-button:active:not(:disabled) {
    background: var(--color-card-muted);
}

.action-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
}

.action-button i {
    font-size: 18px;
    line-height: 1;
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

.action-button--info {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.action-button--info:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.action-button--warning {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.action-button--warning:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

/* Badge - Flat Design */
.staff-page :global(.badge) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
    font-family: var(--font-family-sans);
}

.staff-role-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 58px;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

/* Trạng thái nhân viên - Flat Design */
.status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.status-badge--active {
    background: var(--color-soft-emerald);
    color: var(--color-success);
    border: 1px solid var(--color-success);
}

.status-badge--inactive {
    background: var(--color-soft-rose);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
}

.status-badge--neutral {
    background: var(--color-card-muted);
    color: var(--color-heading);
    border: 1px solid var(--color-border);
}

/* Avatar Upload Box - Chuẩn hóa */
.avatar-upload-box {
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-4);
    background: var(--color-card-muted);
    display: inline-flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.avatar-preview-wrapper {
    width: 156px;
    height: 156px;
    border-radius: var(--radius-sm);
    overflow: hidden;
    background: var(--color-card-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-border);
}

.avatar-preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-preview-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
    font-size: 48px;
}

.avatar-upload-box .btn {
    font-size: var(--font-size-base);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    transition: all var(--transition-base);
    font-weight: var(--font-weight-medium);
    line-height: var(--line-height-normal);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.avatar-upload-box .btn-outline-primary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.avatar-upload-box .btn-outline-primary:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.avatar-upload-box .btn-outline-secondary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.avatar-upload-box .btn-outline-secondary:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.avatar-upload-box .btn-outline-danger {
    border-color: var(--color-border);
    color: var(--color-danger);
    background: transparent;
}

.avatar-upload-box .btn-outline-danger:hover:not(:disabled) {
    background: var(--color-soft-rose);
    border-color: var(--color-danger);
    color: var(--color-danger);
}

.avatar-upload-box .btn i {
    font-size: 18px;
    line-height: 1;
}

/* Role Box - Chuẩn hóa */
.role-box {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-3) var(--spacing-4);
    max-height: 220px;
    overflow-y: auto;
    background: var(--color-card-muted);
    transition: border-color var(--transition-base);
}

.role-box.is-invalid {
    border-color: var(--color-danger) !important;
}

.role-box :global(.form-check) {
    margin-bottom: var(--spacing-2);
}

.role-box :global(.form-check-label) {
    font-size: var(--font-size-base);
    color: var(--color-heading);
    cursor: pointer;
    margin-left: var(--spacing-2);
    line-height: var(--line-height-normal);
    font-weight: var(--font-weight-normal);
    font-family: var(--font-family-sans);
}

.role-box :global(.form-check-input) {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    cursor: pointer;
    margin-top: 0.15rem;
    transition: all var(--transition-base);
}

.role-box :global(.form-check-input:checked) {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
}

.role-box :global(.form-check-input:focus) {
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

/* Error Message - Flat Design */
.error-message {
    padding: var(--spacing-3) var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-warning);
    background: var(--color-soft-amber);
    color: var(--color-warning);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.error-message i {
    font-size: 18px;
    line-height: 1;
    flex-shrink: 0;
    margin-top: 2px;
}

/* Modal - Chuẩn hóa */
.staff-page :global(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
}

.staff-page :global(.modal-header) {
    padding: var(--spacing-6);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-4);
    flex-shrink: 0;
}

.staff-page :global(.modal-header .modal-title) {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-xl);
    color: var(--color-heading);
    margin: 0 0 var(--spacing-1) 0;
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-tight);
    font-family: var(--font-family-sans);
}

.staff-page :global(.modal-header .text-muted) {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
    line-height: var(--line-height-normal);
}

/* Sử dụng style chung từ base.css cho btn-close */

.staff-page :global(.modal-body) {
    padding: var(--spacing-6);
    color: var(--color-text);
    font-size: var(--font-size-base);
    line-height: var(--line-height-relaxed);
    flex: 1 1 auto;
    overflow-y: auto;
    max-height: calc(100vh - 200px);
}

.staff-page :global(.modal-body .form-label) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
    display: block;
}

.staff-page :global(.modal-body .form-label .text-danger) {
    color: var(--color-danger);
}

.staff-page :global(.modal-body .form-control),
.staff-page :global(.modal-body .form-select) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    line-height: var(--line-height-normal);
    transition: all var(--transition-base);
    width: 100%;
    font-family: var(--font-family-sans);
}

.staff-page :global(.modal-body .form-control:focus),
.staff-page :global(.modal-body .form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.staff-page :global(.modal-body .form-control:hover:not(:focus)),
.staff-page :global(.modal-body .form-select:hover:not(:focus)) {
    border-color: var(--color-border);
}

.staff-page :global(.modal-body .form-control.is-invalid),
.staff-page :global(.modal-body .form-select.is-invalid) {
    border-color: var(--color-danger);
}

.staff-page :global(.modal-body .form-control.is-invalid:focus),
.staff-page :global(.modal-body .form-select.is-invalid:focus) {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.staff-page :global(.modal-body .invalid-feedback) {
    display: block;
    margin-top: var(--spacing-1);
    font-size: var(--font-size-xs);
    color: var(--color-danger);
}

.staff-page :global(.modal-body .form-text) {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
    line-height: var(--line-height-normal);
}

.staff-page :global(.modal-body .form-text.text-warning) {
    color: var(--color-warning);
}

.staff-page :global(.modal-footer) {
    padding: var(--spacing-4) var(--spacing-6);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--spacing-2);
    flex-shrink: 0;
}

.staff-page :global(.modal-footer .btn) {
    font-size: var(--font-size-base);
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    transition: all var(--transition-base);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    font-weight: var(--font-weight-medium);
    line-height: var(--line-height-normal);
    font-family: var(--font-family-sans);
}

.staff-page :global(.modal-footer .btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.staff-page :global(.modal-footer .btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.staff-page :global(.modal-footer .btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.staff-page :global(.modal-footer .btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.staff-page :global(.modal-footer .btn i) {
    font-size: 18px;
    line-height: 1;
}

/* Responsive */
/* Responsive - Tối ưu trên mọi kích thước màn hình */
@media (max-width: 992px) {
    .staff-header {
        padding: var(--spacing-4);
    }

    .staff-header__content {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-3);
    }

    .staff-header__actions {
        width: 100%;
        justify-content: flex-start;
    }

    .layout-toggle {
        width: 100%;
    }

    .layout-toggle .btn {
        flex: 1;
    }

    .kpi-card {
        min-height: 100px;
    }
}

@media (max-width: 768px) {
    .staff-header {
        padding: var(--spacing-4);
        margin-bottom: var(--spacing-4);
    }

    .kpi-card {
        flex-direction: row;
        text-align: left;
        min-height: auto;
        padding: var(--spacing-4);
    }

    .kpi-card__icon {
        width: 48px;
        height: 48px;
        font-size: 20px;
    }

    .kpi-card__value {
        font-size: var(--font-size-xl);
    }

    .action-buttons {
        flex-direction: row;
        width: auto;
        flex-wrap: wrap;
    }

    .action-button {
        width: auto;
        justify-content: center;
    }

    .filter-card :global(.card-body) {
        padding: var(--spacing-4);
    }

    .staff-page :global(.table thead th),
    .staff-page :global(.table tbody td) {
        padding: var(--spacing-3) var(--spacing-4);
        font-size: var(--font-size-sm);
    }

    .data-card :global(.card-body) {
        padding: var(--spacing-4);
    }
}

@media (max-width: 576px) {
    .staff-page {
        gap: var(--spacing-4);
        padding-bottom: var(--spacing-4);
    }

    .staff-header {
        padding: var(--spacing-3);
        margin-bottom: var(--spacing-3);
    }

    .staff-header__actions {
        flex-direction: column;
        width: 100%;
    }

    .staff-header__actions .btn {
        width: 100%;
        justify-content: center;
    }

    .kpi-card {
        padding: var(--spacing-3);
        gap: var(--spacing-3);
    }

    .kpi-card__icon {
        width: 40px;
        height: 40px;
        font-size: 18px;
    }

    .kpi-card__value {
        font-size: var(--font-size-lg);
    }

    .kpi-card__label {
        font-size: var(--font-size-xs);
    }

    .filter-card :global(.card-body) {
        padding: var(--spacing-3);
    }

    .staff-page :global(.table thead th),
    .staff-page :global(.table tbody td) {
        padding: var(--spacing-2) var(--spacing-3);
        font-size: var(--font-size-xs);
    }

    .action-buttons {
        flex-direction: column;
        width: 100%;
    }

    .action-button {
        width: 100%;
    }

    .staff-page :global(.modal-body) {
        padding: var(--spacing-4);
    }

    .staff-page :global(.modal-header) {
        padding: var(--spacing-4);
    }

    .staff-page :global(.modal-footer) {
        padding: var(--spacing-3) var(--spacing-4);
        flex-direction: column;
    }

    .staff-page :global(.modal-footer .btn) {
        width: 100%;
    }
}
</style>
