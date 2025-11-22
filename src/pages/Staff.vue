<template>
    <div class="page-container container-fluid" data-aos="fade-up">
        <div class="page-header card-shadow">
            <div>
                <h2 class="page-title">Quản lý Nhân viên</h2>
                <p class="page-subtitle">Theo dõi thông tin nhân sự, hiệu suất và lịch sử đăng nhập.</p>
            </div>
            <div class="d-flex flex-wrap gap-2 align-items-center">
                <div class="btn-group" role="group" aria-label="Chế độ hiển thị">
                    <button class="btn btn-outline-secondary" :class="{ active: viewMode === 'grid' }"
                        @click="viewMode = 'grid'">
                        <i class="bi bi-grid-3x3-gap"></i>
                    </button>
                    <button class="btn btn-outline-secondary" :class="{ active: viewMode === 'table' }"
                        @click="viewMode = 'table'">
                        <i class="bi bi-list"></i>
                    </button>
                </div>
                <button class="btn btn-outline-success" type="button" @click="handleExport"
                    :disabled="exporting || !users.length">
                    <span v-if="exporting" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-file-earmark-excel me-1"></i>
                    Xuất Excel
                </button>
                <button class="btn btn-primary" type="button" @click="openCreateModal" :disabled="rolesLoading">
                    <span v-if="rolesLoading" class="spinner-border spinner-border-sm me-2"></span>
                    <i class="bi bi-person-plus me-1"></i>Thêm nhân viên
                </button>
            </div>
        </div>

        <!-- Statistics Cards -->
        <div class="row g-4 mb-4" v-if="!loading && users.length > 0">
            <div class="col-md-3 col-sm-6 d-flex">
                <div class="card metric-card metric-card--primary w-100">
                    <div class="card-body">
                        <div class="metric-label">Tổng số nhân viên</div>
                        <div class="metric-value">{{ formatNumber(totalUsers) }}</div>
                        <div class="metric-detail">Trên tổng số {{ formatNumber(totalElements) }} người dùng</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 d-flex">
                <div class="card metric-card metric-card--success w-100">
                    <div class="card-body">
                        <div class="metric-label">Đang hoạt động</div>
                        <div class="metric-value">{{ formatNumber(activeUsersCount) }}</div>
                        <div class="metric-detail">{{ formatNumber(inactiveUsersCount) }} đã khóa</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 d-flex">
                <div class="card metric-card metric-card--info w-100">
                    <div class="card-body">
                        <div class="metric-label">Theo quyền</div>
                        <div class="metric-value">{{ formatNumber(usersByRoleCount) }}</div>
                        <div class="metric-detail">{{ roleFilterOptions.length }} loại quyền</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 d-flex">
                <div class="card metric-card metric-card--warning w-100">
                    <div class="card-body">
                        <div class="metric-label">Hoạt động gần đây</div>
                        <div class="metric-value">{{ formatNumber(recentlyActiveCount) }}</div>
                        <div class="metric-detail">Trong 7 ngày qua</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card filter-card mb-4">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="mb-0">Bộ lọc</h5>
                    <button class="btn btn-sm btn-outline-secondary" type="button" @click="toggleAdvancedFilters">
                        <i class="bi" :class="showAdvancedFilters ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                        {{ showAdvancedFilters ? 'Ẩn' : 'Hiện' }} bộ lọc nâng cao
                    </button>
                </div>
                <div class="row g-3 align-items-end">
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label">Tìm kiếm</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="bi bi-search"></i></span>
                            <input type="text" class="form-control" placeholder="Tên đăng nhập, họ tên, SĐT..."
                                v-model="filters.search" />
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label">Trạng thái</label>
                        <select class="form-select" v-model="filters.status">
                            <option value="">Tất cả</option>
                            <option v-for="option in STATUS_OPTIONS" :key="option.value" :value="option.value">{{
                                option.label }}</option>
                        </select>
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label">Quyền</label>
                        <select class="form-select" v-model="filters.role" :disabled="rolesLoading">
                            <option value="">Tất cả</option>
                            <option v-for="role in roleFilterOptions" :key="role" :value="role">{{ formatRole(role) }}
                            </option>
                        </select>
                    </div>
                    <div class="col-lg-3 col-md-6 text-md-end">
                        <button class="btn btn-outline-secondary me-2" type="button" @click="resetFilters"
                            :disabled="loading">Đặt lại</button>
                        <button class="btn btn-outline-primary" type="button" @click="fetchUsers" :disabled="loading">
                            <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
                            Làm mới
                        </button>
                    </div>
                </div>
                <div v-if="showAdvancedFilters" class="row g-3 align-items-end mt-3 pt-3 border-top">
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label">Ngày tạo từ</label>
                        <input type="date" class="form-control" v-model="filters.createdFrom" />
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label">Ngày tạo đến</label>
                        <input type="date" class="form-control" v-model="filters.createdTo" />
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label">Cập nhật từ</label>
                        <input type="date" class="form-control" v-model="filters.updatedFrom" />
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label">Cập nhật đến</label>
                        <input type="date" class="form-control" v-model="filters.updatedTo" />
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label">Hoạt động cuối</label>
                        <select class="form-select" v-model="filters.lastSeen">
                            <option value="">Tất cả</option>
                            <option value="today">Hôm nay</option>
                            <option value="week">Trong tuần</option>
                            <option value="month">Trong tháng</option>
                            <option value="never">Chưa từng</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bulk Actions Bar -->
        <div v-if="selectedUsers.length > 0" class="card mb-4 border-primary">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>{{ selectedUsers.length }}</strong> nhân viên đã chọn
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-success" type="button" @click="handleBulkActivate"
                            :disabled="bulkProcessing">
                            <span v-if="bulkProcessing" class="spinner-border spinner-border-sm me-1"></span>
                            <i v-else class="bi bi-check-circle me-1"></i>
                            Kích hoạt
                        </button>
                        <button class="btn btn-sm btn-danger" type="button" @click="handleBulkDeactivate"
                            :disabled="bulkProcessing">
                            <span v-if="bulkProcessing" class="spinner-border spinner-border-sm me-1"></span>
                            <i v-else class="bi bi-x-circle me-1"></i>
                            Vô hiệu hóa
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" type="button" @click="clearSelection"
                            :disabled="bulkProcessing">
                            <i class="bi bi-x-lg me-1"></i>
                            Bỏ chọn
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card data-card mb-4">
            <div class="card-body">
                <div v-if="loading" class="text-center py-5">
                    <div class="spinner-border text-primary"></div>
                </div>
                <div v-else-if="error" class="alert alert-warning">{{ error }}</div>
                <template v-else>
                    <div v-if="viewMode === 'table'">
                        <div v-if="!filteredUsers.length">
                            <EmptyState title="Không có dữ liệu" message="Điều chỉnh bộ lọc hoặc tải lại danh sách." />
                        </div>
                        <div v-else class="table-responsive">
                            <table class="table table-hover align-middle">
                                <thead class="table-light">
                                    <tr>
                                        <th width="40">
                                            <input type="checkbox" class="form-check-input" :checked="allSelected"
                                                @change="toggleSelectAll" />
                                        </th>
                                        <th></th>
                                        <th>Tên đăng nhập</th>
                                        <th>Họ tên</th>
                                        <th>Liên hệ</th>
                                        <th>Quyền</th>
                                        <th>Trạng thái</th>
                                        <th>Hoạt động cuối</th>
                                        <th>Ngày tạo</th>
                                        <th class="text-end">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="user in filteredUsers" :key="user.id">
                                        <td>
                                            <input type="checkbox" class="form-check-input"
                                                :checked="isUserSelected(user.id)"
                                                @change="toggleUserSelection(user.id)"
                                                :disabled="isCurrentUser(user.id)" />
                                        </td>
                                        <td>
                                            <img v-if="user.avatarUrl" :src="user.avatarUrl"
                                                :alt="user.fullName || user.username" class="table-avatar" />
                                            <div v-else class="table-avatar placeholder">{{ buildInitials(user) }}</div>
                                        </td>
                                        <td>
                                            <button class="btn btn-link p-0" type="button" @click="openDetail(user)">{{
                                                user.username }}</button>
                                        </td>
                                        <td>{{ user.fullName || '—' }}</td>
                                        <td>
                                            <div>{{ user.phone || '—' }}</div>
                                            <div class="text-muted small">{{ user.email || '—' }}</div>
                                        </td>
                                        <td>
                                            <span v-for="role in user.roles" :key="role.id"
                                                class="badge bg-soft staff-role-badge">{{ formatRole(role.name)
                                                }}</span>
                                        </td>
                                        <td><span class="badge" :class="statusBadgeClass(user.status)">{{ user.status
                                                }}</span></td>
                                        <td>
                                            <div v-if="user.lastSeenAt" class="small">
                                                {{ formatDateTime(user.lastSeenAt) }}
                                            </div>
                                            <div v-else class="text-muted small">Chưa từng</div>
                                        </td>
                                        <td>{{ formatDateTime(user.createdAt) }}</td>
                                        <td class="text-end">
                                            <div class="staff-action-group" role="group"
                                                aria-label="Thao tác nhân viên">
                                                <button class="staff-action-btn staff-action-btn--primary" type="button"
                                                    @click="openDetail(user)" title="Xem chi tiết">
                                                    <i class="bi bi-eye"></i>
                                                </button>
                                                <button class="staff-action-btn" type="button"
                                                    @click="openEditModal(user)" title="Chỉnh sửa">
                                                    <i class="bi bi-pencil"></i>
                                                </button>
                                                <button class="staff-action-btn staff-action-btn--muted" type="button"
                                                    @click="openLoginHistory(user)" title="Lịch sử đăng nhập">
                                                    <i class="bi bi-clock-history"></i>
                                                </button>
                                                <button class="staff-action-btn staff-action-btn--muted" type="button"
                                                    @click="openResetPasswordModal(user)" title="Đặt lại mật khẩu"
                                                    :disabled="isCurrentUser(user.id)">
                                                    <i class="bi bi-key"></i>
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
                            <EmptyState title="Không có dữ liệu" message="Điều chỉnh bộ lọc hoặc tải lại danh sách." />
                        </div>
                        <div v-else class="row g-3">
                            <div class="col-12 col-md-6 col-xl-4" v-for="user in filteredUsers" :key="user.id">
                                <StaffCard :staff="user" @detail="openDetail" @edit="openEditModal"
                                    @history="openLoginHistory" />
                            </div>
                        </div>
                    </div>
                </template>
            </div>
            <div class="card-footer d-flex justify-content-end" v-if="totalPages > 1">
                <Pagination mode="zero-based" :current-page="zeroBasedPage" :total-pages="totalPages"
                    @page-change="handlePageChange" />
            </div>
        </div>

        <StaffDetailDrawer :visible="detailVisible" :staff="selectedUser" :dashboard="dashboardData"
            :loading="dashboardLoading" @close="closeDetail" />

        <StaffCreateModal ref="createModalRef" :roles="roles" :submitting="createSubmitting"
            @submit="handleCreateSubmit" />

        <LoginHistoryModal ref="loginHistoryRef" :username="historyUsername" />
        <AvatarEditorModal ref="avatarEditorRef" @apply="handleAvatarEditorApply" @closed="handleAvatarEditorClosed" />

        <!-- Reset Password Modal -->
        <Teleport to="body">
            <div class="modal fade" ref="resetPasswordModalRef" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Đặt lại mật khẩu: {{ resetPasswordForm.username }}</h5>
                            <button type="button" class="btn-close" @click="hideResetPasswordModal"></button>
                        </div>
                        <form @submit.prevent="submitResetPassword">
                            <div class="modal-body">
                                <div class="alert alert-warning">
                                    <i class="bi bi-exclamation-triangle me-2"></i>
                                    Mật khẩu mới sẽ được áp dụng ngay lập tức. Người dùng sẽ cần đăng nhập lại với mật
                                    khẩu mới.
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Mật khẩu mới <span class="text-danger">*</span></label>
                                    <input type="password" class="form-control"
                                        v-model.trim="resetPasswordForm.newPassword"
                                        :class="{ 'is-invalid': resetPasswordErrors.newPassword }"
                                        :disabled="resetPasswordSubmitting" />
                                    <div class="invalid-feedback" v-if="resetPasswordErrors.newPassword">{{
                                        resetPasswordErrors.newPassword }}</div>
                                    <div class="form-text">Tối thiểu 6 ký tự</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Xác nhận mật khẩu <span
                                            class="text-danger">*</span></label>
                                    <input type="password" class="form-control"
                                        v-model.trim="resetPasswordForm.confirmPassword"
                                        :class="{ 'is-invalid': resetPasswordErrors.confirmPassword }"
                                        :disabled="resetPasswordSubmitting" />
                                    <div class="invalid-feedback" v-if="resetPasswordErrors.confirmPassword">{{
                                        resetPasswordErrors.confirmPassword }}</div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-outline-secondary" @click="hideResetPasswordModal"
                                    :disabled="resetPasswordSubmitting">Hủy</button>
                                <button type="submit" class="btn btn-primary" :disabled="resetPasswordSubmitting">
                                    <span v-if="resetPasswordSubmitting"
                                        class="spinner-border spinner-border-sm me-2"></span>
                                    Đặt lại mật khẩu
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Teleport>

        <Teleport to="body">
            <div class="modal fade" ref="editModalRef" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Cập nhật nhân viên: {{ editForm.username }}</h5>
                            <button type="button" class="btn-close" @click="hideEditModal"></button>
                        </div>
                        <form @submit.prevent="submitEditForm">
                            <div class="modal-body">
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Họ và tên <span class="text-danger">*</span></label>
                                        <input type="text" class="form-control" v-model.trim="editForm.fullName"
                                            :class="{ 'is-invalid': editErrors.fullName }" :disabled="editSubmitting" />
                                        <div class="invalid-feedback" v-if="editErrors.fullName">{{ editErrors.fullName
                                            }}</div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Trạng thái <span class="text-danger">*</span></label>
                                        <select class="form-select" v-model="editForm.status"
                                            :class="{ 'is-invalid': editErrors.status }"
                                            :disabled="editSubmitting || isCurrentUser(editForm.id)">
                                            <option value="ACTIVE">ACTIVE</option>
                                            <option value="INACTIVE">INACTIVE</option>
                                        </select>
                                        <div class="invalid-feedback" v-if="editErrors.status">{{ editErrors.status }}
                                        </div>
                                        <div v-if="isCurrentUser(editForm.id)" class="form-text text-warning">
                                            <i class="bi bi-exclamation-triangle me-1"></i>Bạn không thể thay đổi trạng
                                            thái của
                                            chính mình.
                                        </div>
                                    </div>
                                </div>
                                <div class="row g-3 mt-1">
                                    <div class="col-md-6">
                                        <label class="form-label">Email</label>
                                        <input type="email" class="form-control" v-model.trim="editForm.email"
                                            :class="{ 'is-invalid': editErrors.email }" :disabled="editSubmitting" />
                                        <div class="invalid-feedback" v-if="editErrors.email">{{ editErrors.email }}
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Số điện thoại <span
                                                class="text-danger">*</span></label>
                                        <input type="tel" class="form-control" v-model.trim="editForm.phone"
                                            :class="{ 'is-invalid': editErrors.phone }" :disabled="editSubmitting" />
                                        <div class="invalid-feedback" v-if="editErrors.phone">{{ editErrors.phone }}
                                        </div>
                                    </div>
                                </div>
                                <div class="row g-3 mt-1">
                                    <div class="col-md-6">
                                        <label class="form-label">Ảnh đại diện</label>
                                        <div class="avatar-upload-box">
                                            <div class="avatar-preview-wrapper">
                                                <img v-if="editAvatarDisplaySrc" :src="editAvatarDisplaySrc"
                                                    class="avatar-preview-img"
                                                    :alt="editForm.fullName || editForm.username" />
                                                <div v-else class="avatar-preview-placeholder">
                                                    <i class="bi bi-person"></i>
                                                </div>
                                            </div>
                                            <div class="d-flex flex-wrap gap-2 mt-3">
                                                <label class="btn btn-outline-primary btn-sm mb-0">
                                                    <i class="bi bi-cloud-arrow-up me-1"></i>Chọn ảnh
                                                    <input type="file" class="d-none" accept="image/*"
                                                        @change="handleEditAvatarSelect" :disabled="editSubmitting"
                                                        ref="editAvatarInputRef" />
                                                </label>
                                                <button type="button" class="btn btn-outline-secondary btn-sm"
                                                    @click="openAvatarEditor"
                                                    :disabled="!editAvatarDisplaySrc || editSubmitting">
                                                    <i class="bi bi-eye me-1"></i>Xem & chỉnh sửa
                                                </button>
                                                <button type="button" class="btn btn-outline-danger btn-sm"
                                                    @click="handleEditAvatarRemove"
                                                    :disabled="editSubmitting || (!editAvatarFile && !editForm.avatarUrl)">
                                                    <span v-if="editAvatarFile">Hủy ảnh vừa chọn</span>
                                                    <span v-else>Xóa avatar hiện tại</span>
                                                </button>
                                            </div>
                                            <div class="form-text mt-2">Hỗ trợ JPG, JPEG, PNG, GIF, WEBP • Tối đa 5MB.
                                            </div>
                                        </div>
                                        <div class="text-danger small mt-1" v-if="editErrors.avatarUrl">{{
                                            editErrors.avatarUrl
                                            }}</div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Địa chỉ</label>
                                        <input type="text" class="form-control" v-model.trim="editForm.address"
                                            :class="{ 'is-invalid': editErrors.address }" :disabled="editSubmitting" />
                                        <div class="invalid-feedback" v-if="editErrors.address">{{ editErrors.address }}
                                        </div>
                                    </div>
                                </div>
                                <div class="row g-3 mt-1">
                                    <div class="col-12">
                                        <label class="form-label">Thông điệp trạng thái</label>
                                        <input type="text" class="form-control" v-model.trim="editForm.statusMessage"
                                            placeholder="Ví dụ: Đang nghỉ phép, Đang làm việc từ xa..." maxlength="255"
                                            :disabled="editSubmitting" />
                                        <div class="form-text">Thông điệp hiển thị cùng với trạng thái (tùy chọn)</div>
                                    </div>
                                </div>
                                <div class="mt-3">
                                    <label class="form-label">Quyền <span class="text-danger">*</span></label>
                                    <div class="role-box" :class="{ 'is-invalid': editErrors.roleIds }">
                                        <div v-if="rolesLoading" class="text-center"><span
                                                class="spinner-border spinner-border-sm"></span></div>
                                        <div v-else class="form-check" v-for="role in roles" :key="role.id">
                                            <input class="form-check-input" type="checkbox" :id="`edit-role-${role.id}`"
                                                :value="role.id" :checked="editForm.roleIds.includes(role.id)"
                                                @change="toggleEditRole(role.id)"
                                                :disabled="editSubmitting || isCurrentUser(editForm.id)" />
                                            <label class="form-check-label" :for="`edit-role-${role.id}`">{{ role.name
                                                }}</label>
                                        </div>
                                    </div>
                                    <div class="text-danger small" v-if="editErrors.roleIds">{{ editErrors.roleIds }}
                                    </div>
                                    <div v-if="isCurrentUser(editForm.id)" class="form-text text-warning mt-2">
                                        <i class="bi bi-exclamation-triangle me-1"></i>Bạn không thể thay đổi quyền của
                                        chính
                                        mình.
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-outline-secondary" @click="hideEditModal"
                                    :disabled="editSubmitting">Hủy</button>
                                <button type="submit" class="btn btn-primary" :disabled="editSubmitting">
                                    <span v-if="editSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                                    Lưu thay đổi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- User Activity Log Modal -->
        <Teleport to="body">
            <div class="modal fade" ref="userActivityLogModalRef" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Lịch sử hoạt động: {{ activityLogUser?.username || '—' }}</h5>
                            <button type="button" class="btn-close" @click="hideUserActivityLogModal"></button>
                        </div>
                        <div class="modal-body">
                            <div v-if="activityLogLoading" class="text-center py-5">
                                <div class="spinner-border text-primary"></div>
                            </div>
                            <div v-else-if="!activityLogs.length" class="text-center py-5 text-muted">
                                <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                                <p class="mb-0">Chưa có dữ liệu hoạt động.</p>
                                <small class="text-muted">Tính năng này cần hỗ trợ từ backend.</small>
                            </div>
                            <div v-else class="table-responsive">
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
                                        <tr v-for="log in activityLogs" :key="log.id">
                                            <td>{{ formatDateTime(log.timestamp) }}</td>
                                            <td><code>{{ log.action }}</code></td>
                                            <td>{{ log.resourceType || '—' }}</td>
                                            <td>{{ log.resourceId || '—' }}</td>
                                            <td>
                                                <span class="badge" :class="log.success ? 'bg-success' : 'bg-danger'">
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
                            <button type="button" class="btn btn-outline-secondary" @click="hideUserActivityLogModal">Đóng</button>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { Modal } from 'bootstrap'
import { toast } from 'vue3-toastify'
import EmptyState from '@/components/common/EmptyState.vue'
import Pagination from '@/components/common/Pagination.vue'
import StaffCard from '@/components/staff/StaffCard.vue'
import StaffDetailDrawer from '@/components/staff/StaffDetailDrawer.vue'
import StaffCreateModal from '@/components/staff/StaffCreateModal.vue'
import LoginHistoryModal from '@/components/staff/LoginHistoryModal.vue'
import AvatarEditorModal from '@/components/staff/AvatarEditorModal.vue'
import { defineAsyncComponent } from 'vue'
import { getUsers, updateUser, getAllRoles, getUserById } from '@/api/userService'
import { register } from '@/api/authService'
import { uploadFile, deleteFile, extractFileName } from '@/api/fileService'
import { getStaffDashboard } from '@/api/staffDashboardService'
import { formatDateTime, formatNumber } from '@/utils/formatters'
import { PaginationMode, usePagination } from '@/composables/usePagination'
import { useAuthStore } from '@/store/auth'
import { useLoading } from '@/composables/useLoading'
import { useErrorHandler } from '@/composables/useErrorHandler'

const authStore = useAuthStore()
const currentUserId = computed(() => authStore.user?.id)

const STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'Đang hoạt động' },
    { value: 'INACTIVE', label: 'Đã khóa' }
]

const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

const viewMode = ref('grid')
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
const { loading, withLoading } = useLoading(false)
const { handleError } = useErrorHandler({ context: 'Staff' })
const error = ref('')

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
const inactiveUsersCount = computed(() => filteredUsers.value.filter(u => u.status === 'INACTIVE').length)
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

const router = useRouter()
const route = useRoute()

const {
    currentPage,
    zeroBasedPage,
    pageSize,
    totalPages,
    setPageFromZero,
    updateFromResponse,
    rememberCurrent,
    syncQuery
} = usePagination({
    mode: PaginationMode.ZERO_BASED,
    pageSize: 12,
    persistKey: 'staff'
})

syncQuery(route, router, {
    queryMode: PaginationMode.ZERO_BASED,
    pageParam: 'page',
    sizeParam: 'size'
})

onBeforeRouteLeave(() => {
    rememberCurrent()
})

let suppressWatcherFetch = false

const fetchUsers = async () => {
    error.value = ''
    
    await withLoading(async () => {
        try {
            const data = await getUsers({
                page: zeroBasedPage.value,
                size: pageSize.value,
                search: filters.search || undefined,
                status: filters.status || undefined,
                role: filters.role || undefined
            })
            users.value = data?.content || []
            totalElements.value = data?.totalElements || 0

            suppressWatcherFetch = true
            const { adjusted } = updateFromResponse({
                page: data?.number,
                totalPages: data?.totalPages,
                totalElements: data?.totalElements
            })
            suppressWatcherFetch = false
        } catch (err) {
            error.value = handleError(err, 'Không thể tải danh sách nhân viên.')
            users.value = []
        }
    })
}

const handlePageChange = (newPage) => {
    rememberCurrent()
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
    rememberCurrent()
    fetchUsers()
}

watch(
    () => [filters.search, filters.status, filters.role, filters.createdFrom, filters.createdTo, filters.updatedFrom, filters.updatedTo, filters.lastSeen],
    () => {
        rememberCurrent()
        // Advanced filters are client-side, no need to refetch
        if (!filters.createdFrom && !filters.createdTo && !filters.updatedFrom && !filters.updatedTo && !filters.lastSeen) {
            fetchUsers()
        }
    },
    { deep: true }
)

watch(
    () => [zeroBasedPage.value, pageSize.value],
    () => {
        if (suppressWatcherFetch) return
        fetchUsers()
    },
    { immediate: true }
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
            return 'bg-success'
        case 'INACTIVE':
            return 'bg-danger'
        default:
            return 'bg-secondary'
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
        roles.value = await getAllRoles()
    } catch (err) {
        handleError(err, 'Không thể tải danh sách quyền.')
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
        await register(payload)
        toast.success('Đã tạo tài khoản nhân viên mới.')
        createModalRef.value?.hide()
        rememberCurrent()
        setPageFromZero(0)
        await fetchUsers()
    } catch (err) {
        handleError(err, 'Không thể tạo nhân viên mới.')
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
    } catch (err) {
        // Error loading user, continue with existing user data
    }
    try {
        dashboardData.value = await getStaffDashboard(user.id)
    } catch (err) {
        handleError(err, 'Không thể tải dữ liệu hiệu suất.')
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
                } catch (deleteErr) {
                    // Failed to delete old avatar, continue
                }
            }
        }

        hideEditModal()
        await fetchUsers()
    } catch (err) {
        handleError(err, 'Không thể cập nhật thông tin nhân viên.')
        if (uploadedFileName) {
            try {
                await deleteFile(uploadedFileName)
            } catch (cleanupErr) {
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
    await Promise.all([loadRoles(), fetchUsers()])
})

onBeforeUnmount(() => {
    editModalInstance?.dispose()
    editModalInstance = null
    resetPasswordModalInstance?.dispose()
    resetPasswordModalInstance = null
    userActivityLogModalInstance?.dispose()
    userActivityLogModalInstance = null
})

const closeDetail = () => {
    detailVisible.value = false
    dashboardData.value = null
}

// Bulk Operations
const handleBulkActivate = async () => {
    if (!selectedUsers.value.length) return
    if (!confirm(`Bạn có chắc chắn muốn kích hoạt ${selectedUsers.value.length} nhân viên đã chọn?`)) return

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
        handleError(err, 'Không thể kích hoạt một số nhân viên.')
    } finally {
        bulkProcessing.value = false
    }
}

const handleBulkDeactivate = async () => {
    if (!selectedUsers.value.length) return
    if (!confirm(`Bạn có chắc chắn muốn vô hiệu hóa ${selectedUsers.value.length} nhân viên đã chọn?`)) return

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
        handleError(err, 'Không thể vô hiệu hóa một số nhân viên.')
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

        // Add BOM for Excel UTF-8 support
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
        handleError(err, 'Không thể xuất danh sách nhân viên.')
    } finally {
        exporting.value = false
    }
}

// Reset Password
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
        // Note: Backend may need a new endpoint for admin reset password
        // For now, we'll use the changePassword endpoint with a workaround
        // This might need backend support
        toast.warning('Tính năng đặt lại mật khẩu cần hỗ trợ từ backend. Vui lòng liên hệ admin.')
        // await adminResetPassword(resetPasswordForm.userId, resetPasswordForm.newPassword)
        // toast.success('Đã đặt lại mật khẩu thành công.')
        // hideResetPasswordModal()
    } catch (err) {
        handleError(err, 'Không thể đặt lại mật khẩu.')
    } finally {
        resetPasswordSubmitting.value = false
    }
}

// User Activity Log
const openUserActivityLog = async (user) => {
    activityLogUser.value = user
    activityLogs.value = []
    activityLogLoading.value = true
    userActivityLogModalInstance?.show()
    
    try {
        // Note: Backend may need an endpoint to get audit logs for a user
        // For now, we'll show a placeholder message
        // This would typically call: await getAuditLogsByUserId(user.id)
        toast.info('Tính năng lịch sử hoạt động cần hỗ trợ từ backend.')
        // const logs = await getAuditLogsByUserId(user.id)
        // activityLogs.value = logs
    } catch (err) {
        handleError(err, 'Không thể tải lịch sử hoạt động.')
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
/* Page-specific styles only - Global styles (.page-header.card-shadow, .page-title, .page-subtitle, .filter-card) are in components.scss */

.filter-card .card-body {
    padding: 1.75rem;
}

.table-avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    object-fit: cover;
}

.table-avatar.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(129, 140, 248, 0.18);
    color: var(--color-primary);
    font-weight: 600;
}

.avatar-upload-box {
    border: 1px dashed rgba(148, 163, 184, 0.4);
    border-radius: 16px;
    padding: 1rem;
    background: var(--color-card-muted);
    display: inline-flex;
    flex-direction: column;
    gap: 0.75rem;
}

.avatar-preview-wrapper {
    width: 156px;
    height: 156px;
    border-radius: 12px;
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
    color: var(--color-text-subtle);
    font-size: 2.25rem;
}

/* .page-title is in components.scss */

.badge.bg-soft {
    background: var(--color-badge-soft-bg);
    color: var(--color-badge-soft-text);
}

.staff-role-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 58px;
    padding: 0.3rem 0.75rem;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    text-transform: capitalize;
    border: 1px solid rgba(148, 163, 184, 0.28);
    box-shadow: inset 0 0.5px 1px rgba(255, 255, 255, 0.24), 0 8px 16px rgba(15, 23, 42, 0.12);
}

.dark-theme .staff-role-badge {
    border-color: rgba(129, 140, 248, 0.35);
    box-shadow: inset 0 0.5px 0 rgba(255, 255, 255, 0.08), 0 10px 18px rgba(15, 23, 42, 0.35);
}

.comfort-theme .staff-role-badge {
    border-color: rgba(95, 111, 148, 0.28);
}

.role-box {
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 0.75rem 1rem;
    max-height: 220px;
    overflow-y: auto;
    background: var(--color-card-muted);
}

.role-box.is-invalid {
    border-color: var(--bs-danger) !important;
}

.modal-body label {
    font-weight: 600;
}

.staff-action-group {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.25rem;
    border-radius: 999px;
    border: 1px solid rgba(148, 163, 184, 0.32);
    background: rgba(255, 255, 255, 0.04);
    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.12), 0 10px 26px rgba(15, 23, 42, 0.12);
    transition: border-color var(--transition-all), background-color var(--transition-all), box-shadow var(--transition-all);
}

.dark-theme .staff-action-group {
    border-color: rgba(129, 140, 248, 0.28);
    background: rgba(37, 45, 71, 0.6);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 18px 30px rgba(5, 10, 25, 0.55);
}

.staff-action-btn {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: var(--color-card-muted);
    color: var(--color-text-muted);
    display: grid;
    place-items: center;
    font-size: 1.05rem;
    transition: transform 0.18s ease, border-color 0.18s ease, color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease;
}

.staff-action-btn:hover,
.staff-action-btn:focus-visible {
    transform: translateY(-1px);
    border-color: rgba(99, 102, 241, 0.32);
    background: rgba(99, 102, 241, 0.12);
    color: var(--color-primary);
    box-shadow: 0 10px 18px rgba(99, 102, 241, 0.18);
}

.staff-action-btn--primary {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
    color: var(--color-primary-contrast, #fff);
    border-color: transparent;
    box-shadow: 0 12px 22px rgba(79, 70, 229, 0.28);
}

.staff-action-btn--primary:hover,
.staff-action-btn--primary:focus-visible {
    color: var(--color-primary-contrast, #fff);
    box-shadow: 0 16px 26px rgba(79, 70, 229, 0.32);
}

.staff-action-btn--muted {
    background: rgba(99, 102, 241, 0.08);
    color: var(--color-text);
}

.staff-action-btn--muted:hover,
.staff-action-btn--muted:focus-visible {
    background: rgba(99, 102, 241, 0.14);
    color: var(--color-primary);
}

.dark-theme .staff-action-btn {
    border-color: rgba(129, 140, 248, 0.35);
    background: rgba(30, 41, 59, 0.78);
    color: rgba(219, 234, 254, 0.85);
}

.dark-theme .staff-action-btn:hover,
.dark-theme .staff-action-btn:focus-visible {
    background: rgba(129, 140, 248, 0.22);
    border-color: rgba(129, 140, 248, 0.48);
    color: #e0e7ff;
    box-shadow: 0 16px 24px rgba(15, 23, 42, 0.45);
}

.comfort-theme .staff-action-group {
    border-color: rgba(95, 111, 148, 0.28);
    background: rgba(245, 241, 235, 0.55);
}

.comfort-theme .staff-action-btn {
    border-color: rgba(95, 111, 148, 0.28);
    background: rgba(241, 236, 228, 0.86);
    color: #4b5563;
}

.comfort-theme .staff-action-btn:hover,
.comfort-theme .staff-action-btn:focus-visible {
    background: rgba(95, 111, 148, 0.22);
    border-color: rgba(95, 111, 148, 0.4);
    color: var(--color-primary);
    box-shadow: 0 16px 24px rgba(95, 111, 148, 0.22);
}

.metric-card {
    border-radius: 18px;
    border: 1px solid var(--color-border);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
    transition: all 0.2s ease;
    height: 100%;
    min-height: 140px;
}

.metric-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 20px 35px rgba(15, 23, 42, 0.12);
}

.metric-card--primary {
    background: linear-gradient(170deg, var(--color-card), var(--color-soft-primary));
}

.metric-card--success {
    background: linear-gradient(170deg, var(--color-card), var(--color-soft-success));
}

.metric-card--info {
    background: linear-gradient(170deg, var(--color-card), var(--color-soft-info));
}

.metric-card--warning {
    background: linear-gradient(170deg, var(--color-card), var(--color-soft-warning));
}

.metric-label {
    font-size: 0.88rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    margin-bottom: 0.5rem;
    font-weight: 600;
}

.metric-value {
    font-size: 1.8rem;
    font-weight: 800;
    color: var(--color-heading);
    margin-bottom: 0.25rem;
}

.metric-detail {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin-top: 0.25rem;
}
</style>
