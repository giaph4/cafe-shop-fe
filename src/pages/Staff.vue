<template>
    <div class="staff-page" data-aos="fade-up">
        <div class="page-header d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div>
                <h2 class="page-title mb-1">Quản lý Nhân viên</h2>
                <p class="text-muted mb-0">Theo dõi thông tin nhân sự, hiệu suất và lịch sử đăng nhập.</p>
            </div>
            <div class="d-flex flex-wrap gap-2 align-items-center">
                <div class="btn-group" role="group" aria-label="Chế độ hiển thị">
                    <button class="btn btn-outline-secondary" :class="{active: viewMode === 'grid'}" @click="viewMode = 'grid'">
                        <i class="bi bi-grid-3x3-gap"></i>
                    </button>
                    <button class="btn btn-outline-secondary" :class="{active: viewMode === 'table'}" @click="viewMode = 'table'">
                        <i class="bi bi-list"></i>
                    </button>
                </div>
                <button class="btn btn-primary" type="button" @click="openCreateModal" :disabled="rolesLoading">
                    <span v-if="rolesLoading" class="spinner-border spinner-border-sm me-2"></span>
                    <i class="bi bi-person-plus me-1"></i>Thêm nhân viên
                </button>
            </div>
        </div>

        <div class="card filter-card mb-4">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-lg-4 col-md-6">
                        <label class="form-label">Tìm kiếm</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="bi bi-search"></i></span>
                            <input type="text" class="form-control" placeholder="Tên đăng nhập, họ tên, SĐT..." v-model="filters.search" />
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label">Trạng thái</label>
                        <select class="form-select" v-model="filters.status">
                            <option value="">Tất cả</option>
                            <option v-for="option in STATUS_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
                        </select>
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label">Quyền</label>
                        <select class="form-select" v-model="filters.role" :disabled="rolesLoading">
                            <option value="">Tất cả</option>
                            <option v-for="role in roleFilterOptions" :key="role" :value="role">{{ formatRole(role) }}</option>
                        </select>
                    </div>
                    <div class="col-lg-2 col-md-6 text-md-end">
                        <button class="btn btn-outline-secondary me-2" type="button" @click="resetFilters" :disabled="loading">Đặt lại</button>
                        <button class="btn btn-outline-primary" type="button" @click="fetchUsers" :disabled="loading">
                            <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
                            Làm mới
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
                                        <th></th>
                                        <th>Tên đăng nhập</th>
                                        <th>Họ tên</th>
                                        <th>Liên hệ</th>
                                        <th>Quyền</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày tạo</th>
                                        <th class="text-end">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="user in filteredUsers" :key="user.id">
                                        <td>
                                            <img v-if="user.avatarUrl" :src="user.avatarUrl" :alt="user.fullName || user.username" class="table-avatar" />
                                            <div v-else class="table-avatar placeholder">{{ buildInitials(user) }}</div>
                                        </td>
                                        <td>
                                            <button class="btn btn-link p-0" type="button" @click="openDetail(user)">{{ user.username }}</button>
                                        </td>
                                        <td>{{ user.fullName || '—' }}</td>
                                        <td>
                                            <div>{{ user.phone || '—' }}</div>
                                            <div class="text-muted small">{{ user.email || '—' }}</div>
                                        </td>
                                        <td>
                                            <span v-for="role in user.roles" :key="role.id" class="badge bg-soft staff-role-badge">{{ formatRole(role.name) }}</span>
                                        </td>
                                        <td><span class="badge" :class="statusBadgeClass(user.status)">{{ user.status }}</span></td>
                                        <td>{{ formatDateTime(user.createdAt) }}</td>
                                        <td class="text-end">
                                            <div class="staff-action-group" role="group" aria-label="Thao tác nhân viên">
                                                <button class="staff-action-btn staff-action-btn--primary" type="button" @click="openDetail(user)" title="Xem chi tiết">
                                                    <i class="bi bi-eye"></i>
                                                </button>
                                                <button class="staff-action-btn" type="button" @click="openEditModal(user)" title="Chỉnh sửa">
                                                    <i class="bi bi-pencil"></i>
                                                </button>
                                                <button class="staff-action-btn staff-action-btn--muted" type="button" @click="openLoginHistory(user)" title="Lịch sử đăng nhập">
                                                    <i class="bi bi-clock-history"></i>
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
                                <StaffCard :staff="user" @detail="openDetail" @edit="openEditModal" @history="openLoginHistory" />
                            </div>
                        </div>
                    </div>
                </template>
            </div>
            <div class="card-footer d-flex justify-content-end" v-if="totalPages > 1">
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

        <LoginHistoryModal ref="loginHistoryRef" :username="historyUsername" />
        <AvatarEditorModal ref="avatarEditorRef" @apply="handleAvatarEditorApply" @closed="handleAvatarEditorClosed" />

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
                                        <input type="text" class="form-control" v-model.trim="editForm.fullName" :class="{'is-invalid': editErrors.fullName}" :disabled="editSubmitting" />
                                        <div class="invalid-feedback" v-if="editErrors.fullName">{{ editErrors.fullName }}</div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Trạng thái <span class="text-danger">*</span></label>
                                        <select class="form-select" v-model="editForm.status" :class="{'is-invalid': editErrors.status}" :disabled="editSubmitting">
                                            <option value="ACTIVE">ACTIVE</option>
                                            <option value="INACTIVE">INACTIVE</option>
                                        </select>
                                        <div class="invalid-feedback" v-if="editErrors.status">{{ editErrors.status }}</div>
                                    </div>
                                </div>
                                <div class="row g-3 mt-1">
                                    <div class="col-md-6">
                                        <label class="form-label">Email</label>
                                        <input type="email" class="form-control" v-model.trim="editForm.email" :class="{'is-invalid': editErrors.email}" :disabled="editSubmitting" />
                                        <div class="invalid-feedback" v-if="editErrors.email">{{ editErrors.email }}</div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Số điện thoại <span class="text-danger">*</span></label>
                                        <input type="tel" class="form-control" v-model.trim="editForm.phone" :class="{'is-invalid': editErrors.phone}" :disabled="editSubmitting" />
                                        <div class="invalid-feedback" v-if="editErrors.phone">{{ editErrors.phone }}</div>
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
                                                />
                                                <div v-else class="avatar-preview-placeholder">
                                                    <i class="bi bi-person"></i>
                                                </div>
                                            </div>
                                            <div class="d-flex flex-wrap gap-2 mt-3">
                                                <label class="btn btn-outline-primary btn-sm mb-0">
                                                    <i class="bi bi-cloud-arrow-up me-1"></i>Chọn ảnh
                                                    <input
                                                        type="file"
                                                        class="d-none"
                                                        accept="image/*"
                                                        @change="handleEditAvatarSelect"
                                                        :disabled="editSubmitting"
                                                        ref="editAvatarInputRef"
                                                    />
                                                </label>
                                                <button
                                                    type="button"
                                                    class="btn btn-outline-secondary btn-sm"
                                                    @click="openAvatarEditor"
                                                    :disabled="!editAvatarDisplaySrc || editSubmitting"
                                                >
                                                    <i class="bi bi-eye me-1"></i>Xem & chỉnh sửa
                                                </button>
                                                <button
                                                    type="button"
                                                    class="btn btn-outline-danger btn-sm"
                                                    @click="handleEditAvatarRemove"
                                                    :disabled="editSubmitting || (!editAvatarFile && !editForm.avatarUrl)"
                                                >
                                                    <span v-if="editAvatarFile">Hủy ảnh vừa chọn</span>
                                                    <span v-else>Xóa avatar hiện tại</span>
                                                </button>
                                            </div>
                                            <div class="form-text mt-2">Hỗ trợ JPG, JPEG, PNG, GIF, WEBP • Tối đa 5MB.</div>
                                        </div>
                                        <div class="text-danger small mt-1" v-if="editErrors.avatarUrl">{{ editErrors.avatarUrl }}</div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Địa chỉ</label>
                                        <input type="text" class="form-control" v-model.trim="editForm.address" :class="{'is-invalid': editErrors.address}" :disabled="editSubmitting" />
                                        <div class="invalid-feedback" v-if="editErrors.address">{{ editErrors.address }}</div>
                                    </div>
                                </div>
                                <div class="mt-3">
                                    <label class="form-label">Quyền <span class="text-danger">*</span></label>
                                    <div class="role-box" :class="{'is-invalid': editErrors.roleIds}">
                                        <div v-if="rolesLoading" class="text-center"><span class="spinner-border spinner-border-sm"></span></div>
                                        <div v-else class="form-check" v-for="role in roles" :key="role.id">
                                            <input class="form-check-input" type="checkbox" :id="`edit-role-${role.id}`" :value="role.id" :checked="editForm.roleIds.includes(role.id)" @change="toggleEditRole(role.id)" :disabled="editSubmitting" />
                                            <label class="form-check-label" :for="`edit-role-${role.id}`">{{ role.name }}</label>
                                        </div>
                                    </div>
                                    <div class="text-danger small" v-if="editErrors.roleIds">{{ editErrors.roleIds }}</div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-outline-secondary" @click="hideEditModal" :disabled="editSubmitting">Hủy</button>
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
    </div>
</template>

<script setup>
import {computed, onBeforeUnmount, onMounted, reactive, ref, watch} from 'vue'
import {onBeforeRouteLeave, useRoute, useRouter} from 'vue-router'
import {Modal} from 'bootstrap'
import {toast} from 'vue3-toastify'
import EmptyState from '@/components/common/EmptyState.vue'
import Pagination from '@/components/common/Pagination.vue'
import StaffCard from '@/components/staff/StaffCard.vue'
import StaffDetailDrawer from '@/components/staff/StaffDetailDrawer.vue'
import StaffCreateModal from '@/components/staff/StaffCreateModal.vue'
import LoginHistoryModal from '@/components/staff/LoginHistoryModal.vue'
import AvatarEditorModal from '@/components/staff/AvatarEditorModal.vue'
import {defineAsyncComponent} from 'vue'
import {getUsers, updateUser, getAllRoles, getUserById} from '@/api/userService'
import {register} from '@/api/authService'
import {uploadFile, deleteFile, extractFileName} from '@/api/fileService'
import {getStaffDashboard} from '@/api/staffDashboardService'
import {formatDateTime} from '@/utils/formatters'
import {PaginationMode, usePagination} from '@/composables/usePagination'

const STATUS_OPTIONS = [
    {value: 'ACTIVE', label: 'Đang hoạt động'},
    {value: 'INACTIVE', label: 'Đã khóa'}
]

const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

const viewMode = ref('grid')
const filters = reactive({search: '', status: '', role: ''})
const loading = ref(false)
const error = ref('')
const users = ref([])

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

const handleAvatarEditorApply = ({file, url}) => {
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
    return list
})

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
    loading.value = true
    error.value = ''
    try {
        const data = await getUsers({
            page: zeroBasedPage.value,
            size: pageSize.value,
            search: filters.search || undefined,
            status: filters.status || undefined,
            role: filters.role || undefined
        })
        users.value = data?.content || []

        suppressWatcherFetch = true
        const {adjusted} = updateFromResponse({
            page: data?.number,
            totalPages: data?.totalPages,
            totalElements: data?.totalElements
        })
        suppressWatcherFetch = false

        if (adjusted) {
            toast.info('Trang nhân viên đã được điều chỉnh theo dữ liệu hiện có.', {autoClose: 2500})
        }
    } catch (err) {
        console.error(err)
        error.value = err.response?.data?.message || 'Không thể tải danh sách nhân viên.'
        users.value = []
    } finally {
        loading.value = false
    }
}

const handlePageChange = (newPage) => {
    rememberCurrent()
    setPageFromZero(newPage)
}

const resetFilters = () => {
    filters.search = ''
    filters.status = ''
    filters.role = ''
    rememberCurrent()
    fetchUsers()
}

watch(
    () => [filters.search, filters.status, filters.role],
    () => {
        rememberCurrent()
        fetchUsers()
    },
    {deep: true}
)

watch(
    () => [zeroBasedPage.value, pageSize.value],
    () => {
        if (suppressWatcherFetch) return
        fetchUsers()
    },
    {immediate: true}
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
        console.error(err)
        toast.error('Không thể tải danh sách quyền.')
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
        console.error(err)
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
        console.error(err)
    }
    try {
        dashboardData.value = await getStaffDashboard(user.id)
    } catch (err) {
        console.error(err)
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
                    console.warn('Không thể xóa file avatar cũ:', deleteErr)
                }
            }
        }

        hideEditModal()
        await fetchUsers()
    } catch (err) {
        console.error(err)
        if (uploadedFileName) {
            try {
                await deleteFile(uploadedFileName)
            } catch (cleanupErr) {
                console.warn('Không thể dọn dẹp file avatar mới tải lên:', cleanupErr)
            }
        }
        toast.error(err.response?.data?.message || 'Không thể cập nhật nhân viên.')
    } finally {
        editSubmitting.value = false
    }
}

onMounted(async () => {
    editModalInstance = new Modal(editModalRef.value, {backdrop: 'static'})
    await Promise.all([loadRoles(), fetchUsers()])
})

onBeforeUnmount(() => {
    editModalInstance?.dispose()
    editModalInstance = null
})

const closeDetail = () => {
    detailVisible.value = false
    dashboardData.value = null
}

</script>

<style scoped>
.staff-page {
    padding-bottom: 3rem;
}

.filter-card,
.data-card {
    border-radius: 18px;
    border: 1px solid var(--color-border);
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
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

.page-title {
    font-weight: 700;
    color: var(--color-heading);
}

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
</style>
