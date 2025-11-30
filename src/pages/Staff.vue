<template>
    <div class="page-container container-fluid" data-aos="fade-up">
        <div class="staff-header">
            <div class="staff-header__content">
                <div class="staff-header__title-section">
                    <h2 class="page-title">Quản lý Nhân viên</h2>
                    <p class="page-subtitle">Quản lý thông tin nhân viên, phân ca làm việc và theo dõi hiệu suất.</p>
                </div>
                <div class="staff-header__actions">
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
                    <button class="btn btn-outline-secondary" type="button" @click="fetchUsers" :disabled="loading">
                        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="bi bi-arrow-clockwise me-2"></i>
                        Làm mới
                    </button>
                    <button class="btn btn-outline-success" type="button" @click="handleExport"
                        :disabled="exporting || !users.length">
                        <span v-if="exporting" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="bi bi-file-earmark-excel me-2"></i>
                        Xuất Excel
                    </button>
                    <button class="btn btn-primary" type="button" @click="openCreateModal" :disabled="rolesLoading">
                        <span v-if="rolesLoading" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="bi bi-person-plus me-2"></i>
                        Thêm nhân viên
                    </button>
                </div>
            </div>
        </div>

        <!-- Statistics Cards -->
        <div class="row g-3 mb-4" v-if="!loading && users.length > 0">
            <div class="col-lg-3 col-md-6">
                <div class="stat-card stat-card--blue">
                    <div class="stat-icon stat-icon--blue">
                        <i class="bi bi-people"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Tổng số nhân viên</div>
                        <div class="stat-value">{{ formatNumber(totalUsers) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="stat-card stat-card--green">
                    <div class="stat-icon stat-icon--green">
                        <i class="bi bi-check-circle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Đang hoạt động</div>
                        <div class="stat-value">{{ formatNumber(activeUsersCount) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="stat-card stat-card--purple">
                    <div class="stat-icon stat-icon--purple">
                        <i class="bi bi-person-badge"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Theo quyền</div>
                        <div class="stat-value">{{ formatNumber(usersByRoleCount) }}</div>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="stat-card stat-card--orange">
                    <div class="stat-icon stat-icon--orange">
                        <i class="bi bi-clock-history"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Hoạt động gần đây</div>
                        <div class="stat-value">{{ formatNumber(recentlyActiveCount) }}</div>
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
                        <button class="btn btn-sm btn-primary" type="button" @click="handleBulkAssignRoles"
                            :disabled="bulkProcessing">
                            <span v-if="bulkProcessing" class="spinner-border spinner-border-sm me-1"></span>
                            <i v-else class="bi bi-person-badge me-1"></i>
                            Gán quyền
                        </button>
                        <button class="btn btn-sm btn-outline-info" type="button" @click="handleBulkExport"
                            :disabled="bulkProcessing || exporting">
                            <span v-if="exporting" class="spinner-border spinner-border-sm me-1"></span>
                            <i v-else class="bi bi-download me-1"></i>
                            Xuất Excel
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
                <LoadingState v-if="loading" />
                <ErrorState v-else-if="error" :message="error" @retry="fetchUsers" />
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
                                            <div class="action-buttons">
                                                <button class="action-button action-button--primary" type="button"
                                                    @click="openDetail(user)" title="Xem chi tiết">
                                                    <i class="bi bi-eye"></i>
                                                    <span>Chi tiết</span>
                                                </button>
                                                <button class="action-button action-button--primary" type="button"
                                                    @click="openEditModal(user)" title="Chỉnh sửa">
                                                    <i class="bi bi-pencil"></i>
                                                    <span>Chỉnh sửa</span>
                                                </button>
                                                <button class="action-button action-button--info" type="button"
                                                    @click="openLoginHistory(user)" title="Lịch sử đăng nhập">
                                                    <i class="bi bi-clock-history"></i>
                                                    <span>Lịch sử</span>
                                                </button>
                                                <button class="action-button action-button--warning" type="button"
                                                    @click="openResetPasswordModal(user)" title="Đặt lại mật khẩu"
                                                    :disabled="isCurrentUser(user.id)">
                                                    <i class="bi bi-key"></i>
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

        <!-- Bulk Action Confirmation Modal -->
        <Teleport to="body">
            <div class="modal fade" ref="bulkActionModalRef" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <div>
                                <h5 class="modal-title">
                                    {{ bulkActionTarget?.action === 'activate' ? 'Kích hoạt nhân viên' : 'Vô hiệu hóa nhân viên' }}
                                </h5>
                                <p class="mb-0 text-muted small">Hành động này sẽ áp dụng cho tất cả nhân viên đã chọn.</p>
                            </div>
                            <button type="button" class="btn-close" @click="closeBulkActionModal" :disabled="bulkProcessing" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-3">Bạn có chắc chắn muốn {{ bulkActionTarget?.action === 'activate' ? 'kích hoạt' : 'vô hiệu hóa' }} <strong>{{ bulkActionTarget?.count || 0 }}</strong> nhân viên đã chọn không?</p>
                            <div class="alert alert-warning">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                {{ bulkActionTarget?.action === 'activate' ? 'Các nhân viên sẽ được kích hoạt và có thể đăng nhập vào hệ thống.' : 'Các nhân viên sẽ bị vô hiệu hóa và không thể đăng nhập vào hệ thống.' }}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button
                                type="button"
                                class="btn btn-outline-secondary"
                                @click="closeBulkActionModal"
                                :disabled="bulkProcessing"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                class="btn"
                                :class="bulkActionTarget?.action === 'activate' ? 'btn-success' : 'btn-danger'"
                                @click="handleBulkActionConfirm"
                                :disabled="bulkProcessing"
                            >
                                <span v-if="bulkProcessing" class="spinner-border spinner-border-sm me-2"></span>
                                {{ bulkActionTarget?.action === 'activate' ? 'Kích hoạt' : 'Vô hiệu hóa' }}
                            </button>
                        </div>
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
                            <LoadingState v-if="activityLogLoading" text="Đang tải lịch sử hoạt động..." />
                            <EmptyState
                                v-else-if="!activityLogs.length"
                                title="Chưa có dữ liệu hoạt động"
                                message="Tính năng này cần hỗ trợ từ backend."
                            >
                                <template #icon>
                                    <i class="bi bi-inbox"></i>
                                </template>
                            </EmptyState>
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
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, nextTick } from 'vue'
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
import { getUsers, updateUser, getAllRoles, getUserById, createUser, adminResetPassword, getUserActivityLogs } from '@/api/userService'
import { uploadFile, deleteFile, extractFileName } from '@/api/fileService'
import { getStaffDashboard } from '@/api/staffDashboardService'
import { formatDateTime, formatNumber } from '@/utils/formatters'
import { PaginationMode, usePagination } from '@/composables/usePagination'
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
    await execute(async () => {
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
    }, 'Không thể tải danh sách nhân viên.', {
        onError: () => {
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
        rememberCurrent()
        setPageFromZero(0)
        await fetchUsers()
    } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể tạo nhân viên mới.')
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
                } catch (deleteErr) {
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
        toast.error(err.response?.data?.message || 'Không thể xuất danh sách nhân viên.')
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
        // Gọi API admin reset password
        await adminResetPassword(resetPasswordForm.userId, resetPasswordForm.newPassword)
        toast.success('Đã đặt lại mật khẩu thành công.')
        hideResetPasswordModal()
    } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể đặt lại mật khẩu.')
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
/* Header Styles */
.staff-header {
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
    margin-bottom: var(--spacing-6);
    padding: var(--spacing-6);
}

.staff-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-6);
    flex-wrap: wrap;
}

.staff-header__title-section {
    flex: 1;
    min-width: 0;
}

.staff-header__actions {
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

/* Stat Cards */
.stat-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    padding: var(--spacing-5);
    border-radius: var(--radius-xl);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
    height: 100%;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.stat-icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: var(--font-size-xl);
    color: #ffffff;
    border: 2px solid;
}

.stat-icon--blue {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    border-color: #3b82f6;
}

.stat-icon--green {
    background: linear-gradient(135deg, #10b981, #059669);
    border-color: #10b981;
}

.stat-icon--purple {
    background: linear-gradient(135deg, #a855f7, #9333ea);
    border-color: #a855f7;
}

.stat-icon--orange {
    background: linear-gradient(135deg, #f97316, #ea580c);
    border-color: #f97316;
}

.stat-content {
    flex: 1;
    min-width: 0;
}

.stat-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-1);
    font-weight: var(--font-weight-medium);
}

.stat-value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
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

.action-button--info {
    border-color: var(--color-info);
    color: var(--color-info);
    background: var(--color-card);
}

.action-button--info:hover {
    background: var(--color-info-soft);
    border-color: var(--color-info);
    color: var(--color-info);
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

.action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.filter-card .card-body {
    padding: var(--spacing-7);
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
    border-radius: var(--radius-lg);
    padding: var(--spacing-3) var(--spacing-4);
    max-height: 220px;
    overflow-y: auto;
    background: var(--color-card-muted);
}

.role-box.is-invalid {
    border-color: var(--color-danger) !important;
}

.modal-body label {
    font-weight: var(--font-weight-semibold);
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

@media (max-width: 768px) {
    .staff-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .staff-header__actions {
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
}
</style>