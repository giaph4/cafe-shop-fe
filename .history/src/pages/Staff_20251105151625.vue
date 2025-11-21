<template>
    <div class="modal fade" id="staffModal" tabindex="-1" ref="modalElement" aria-labelledby="staffModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="staffModalLabel">Cập nhật Nhân viên</h5>
                    <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
                </div>

                <Form @submit="handleSubmit" :validation-schema="staffSchema" v-slot="{ errors }">
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="username" class="form-label fw-bold">Tên đăng nhập (Username)</label>
                            <input type="text" class="form-control" id="username" :value="formData.username" disabled>
                        </div>

                        <div class="mb-3">
                            <label for="fullName" class="form-label fw-bold">Họ và tên <span
                                    class="text-danger">*</span></label>
                            <Field name="fullName" type="text" class="form-control"
                                :class="{ 'is-invalid': errors.fullName }" id="fullName" placeholder="Nguyễn Văn A"
                                v-model="formData.fullName" />
                            <ErrorMessage name="fullName" class="invalid-feedback" />
                        </div>

                        <div class="mb-3">
                            <label for="phone" class="form-label fw-bold">Số điện thoại <span
                                    class="text-danger">*</span></label>
                            <Field name="phone" type="text" class="form-control" :class="{ 'is-invalid': errors.phone }"
                                id="phone" placeholder="0905123456" v-model="formData.phone" />
                            <ErrorMessage name="phone" class="invalid-feedback" />
                        </div>

                        <div class="mb-3">
                            <label for="email" class="form-label fw-bold">Email</label>
                            <Field name="email" type="email" class="form-control"
                                :class="{ 'is-invalid': errors.email }" id="email" placeholder="example@email.com"
                                v-model="formData.email" />
                            <ErrorMessage name="email" class="invalid-feedback" />
                        </div>

                        <div class="mb-3">
                            <label for="status" class="form-label fw-bold">Trạng thái <span
                                    class="text-danger">*</span></label>
                            <Field name="status" as="select" class="form-select"
                                :class="{ 'is-invalid': errors.status }" id="status" v-model="formData.status">
                                <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                                <option value="INACTIVE">Đã khoá (INACTIVE)</option>
                            </Field>
                            <ErrorMessage name="status" class="invalid-feedback" />
                        </div>

                        <div class="mb-3">
                            <label class="form-label fw-bold">Phân quyền <span class="text-danger">*</span></label>
                            <div v-if="rolesLoading" class="text-center">
                                <div class="spinner-border spinner-border-sm" role="status"></div>
                            </div>
                            <div v-else-if="rolesError" class="alert alert-danger p-2">Không tải được danh sách quyền.
                            </div>
                            <div v-else class="d-flex flex-wrap gap-3">
                                <Field name="roleIds" type="checkbox" v-for="role in allRoles" :key="role.id"
                                    :value="role.id" :id="`role-${role.id}`" v-slot="{ field }">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="roleIds"
                                            :id="`role-${role.id}`" :value="role.id" v-model="formData.roleIds" />
                                        <label class="form-check-label" :for="`role-${role.id}`">{{ role.name }}</label>
                                    </div>
                                </Field>
                            </div>
                            <ErrorMessage name="roleIds" class="invalid-feedback d-block" />
                        </div>

                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="closeModal">Huỷ</button>
                        <button type="submit" class="btn btn-primary" :disabled="updateMutation.isPending.value">
                            <span v-if="updateMutation.isPending.value" class="spinner-border spinner-border-sm me-2"
                                role="status" aria-hidden="true"></span>
                            Lưu cập nhật
                        </button>
                    </div>
                </Form>
            </div>
        </div>
    </div>

    <div data-aos="fade-up">
        <div class="page-header d-flex justify-content-between align-items-center mb-4">
            <h2 class="page-title">Quản lý Nhân viên</h2>
        </div>

        <div class="card mb-4">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-5">
                        <div class="input-group">
                            <span class="input-group-text"><i class="bi bi-search"></i></span>
                            <input type="text" class="form-control" placeholder="Tìm theo tên, SĐT, email, username..."
                                v-model="searchQuery">
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-body">

                <div v-if="isLoading" class="text-center my-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>

                <div v-else-if="isError" class="alert alert-danger">
                    Không thể tải dữ liệu: {{ error.message }}
                </div>

                <div v-else-if="pageData && pageData.content" class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th scope="col" @click="handleSort('username')" class="sortable">
                                    Tài khoản <i :class="getSortIcon('username')"></i>
                                </th>
                                <th scope="col" @click="handleSort('fullName')" class="sortable">
                                    Họ tên <i :class="getSortIcon('fullName')"></i>
                                </th>
                                <th scope="col">Liên hệ</th>
                                <th scope="col" @click="handleSort('status')" class="sortable">
                                    Trạng thái <i :class="getSortIcon('status')"></i>
                                </th>
                                <th scope="col">Quyền</th>
                                <th scope="col" class="text-end">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="user in filteredData" :key="user.id">
                                <td class="fw-bold">{{ user.username }}</td>
                                <td>{{ user.fullName }}</td>
                                <td>
                                    <div>{{ user.phone }}</div>
                                    <div class="small text-muted">{{ user.email }}</div>
                                </td>
                                <td>
                                    <span class="badge" :class="getStatusClass(user.status)">
                                        {{ user.status }}
                                    </span>
                                </td>
                                <td>
                                    <span v-for="role in user.roles" :key="role.id" class="badge bg-secondary me-1">
                                        {{ role.name.replace('ROLE_', '') }}
                                    </span>
                                </td>
                                <td class="text-end">
                                    <button class="btn btn-sm btn-outline-primary" @click="openModal(user)">
                                        <i class="bi bi-pencil-fill"></i> Sửa
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="filteredData.length === 0">
                                <td colspan="6" class="text-center text-muted">Không tìm thấy nhân viên nào.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card-footer d-flex justify-content-end">
                <Pagination v-if="pageData" :current-page="currentPage" :total-pages="pageData.totalPages"
                    @page-change="handlePageChange" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, reactive, watch } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { Modal } from 'bootstrap'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { toast } from 'vue3-toastify'
import { getUsers, updateUser } from '@/api/userService'
import { getAllRoles } from '@/api/roleService' // Giả định API
import Pagination from '@/components/Pagination.vue'

// Query Client
const queryClient = useQueryClient()

// --- State (theo phong cách Expenses.vue / Ingredients.vue) ---
const currentPage = ref(1)
const searchQuery = ref('')
const sortState = reactive({
    key: 'username',
    direction: 'asc'
})

// --- Modal & Form State ---
const modalElement = ref(null)
const bsModal = ref(null)
const isEditing = ref(false) // Modal này chỉ dùng để Sửa
const formData = reactive({
    id: null,
    username: '',
    fullName: '',
    phone: '',
    email: '',
    status: 'ACTIVE',
    roleIds: []
})

// --- Validation Schema ---
const staffSchema = yup.object({
    fullName: yup.string().required('Họ tên là bắt buộc'),
    phone: yup.string()
        .required('Số điện thoại là bắt buộc')
        .matches(/^(\\+?84|0)\\d{9}$/, 'Định dạng SĐT Việt Nam không đúng'),
    email: yup.string().nullable().email('Email không đúng định dạng'),
    status: yup.string().required('Trạng thái là bắt buộc'),
    roleIds: yup.array().min(1, 'Phải chọn ít nhất một quyền').required()
})

// === VUE QUERY ===

// 1. Query (Lấy danh sách Users)
const { data: pageData, isLoading, isError, error } = useQuery({
    queryKey: ['users', currentPage, sortState],
    queryFn: () => {
        const sortString = `${sortState.key},${sortState.direction}`
        return getUsers(currentPage.value - 1, 10, sortString)
    },
    keepPreviousData: true
})

// 2. Query (Lấy danh sách tất cả Roles cho modal)
const { data: allRoles, isLoading: rolesLoading, isError: rolesError } = useQuery({
    queryKey: ['roles'],
    queryFn: getAllRoles,
    staleTime: Infinity, // Chỉ fetch 1 lần
    cacheTime: Infinity
})

// 3. Update Mutation
const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
        toast.success('Cập nhật nhân viên thành công!')
        queryClient.invalidateQueries(['users'])
        closeModal()
    },
    onError: (err) => {
        toast.error(err.response?.data?.message || 'Lỗi! Không thể cập nhật.')
    }
})


// === LOGIC ===

// Lọc Client-side (Tìm kiếm)
const filteredData = computed(() => {
    if (!pageData.value?.content) return []
    if (!searchQuery.value) return pageData.value.content

    const lowerCaseQuery = searchQuery.value.toLowerCase()
    return pageData.value.content.filter(
        user =>
            user.username.toLowerCase().includes(lowerCaseQuery) ||
            user.fullName.toLowerCase().includes(lowerCaseQuery) ||
            user.phone.toLowerCase().includes(lowerCaseQuery) ||
            (user.email && user.email.toLowerCase().includes(lowerCaseQuery))
    )
})

// Xử lý Sắp xếp
const handleSort = (key) => {
    if (sortState.key === key) {
        sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc'
    } else {
        sortState.key = key
        sortState.direction = 'asc' // Mặc định asc
    }
}

// Lấy icon cho cột sort
const getSortIcon = (key) => {
    if (sortState.key !== key) return 'bi bi-arrow-down-up'
    if (sortState.direction === 'asc') return 'bi bi-sort-up'
    return 'bi bi-sort-down'
}

// Xử lý Phân trang
const handlePageChange = (page) => {
    currentPage.value = page
}

// Reset về trang 1 khi sort
watch(sortState, () => {
    currentPage.value = 1
}, { deep: true })


// === MODAL & FORM ===
onMounted(() => {
    if (modalElement.value) {
        bsModal.value = new Modal(modalElement.value)
    }
})

onUnmounted(() => {
    bsModal.value?.dispose()
})

const openModal = (user) => {
    isEditing.value = true
    formData.id = user.id
    formData.username = user.username
    formData.fullName = user.fullName
    formData.phone = user.phone
    formData.email = user.email
    formData.status = user.status
    // Chuyển Set<RoleDTO> thành Array<Long> cho form
    formData.roleIds = user.roles.map(role => role.id)

    bsModal.value?.show()
}

const closeModal = () => {
    bsModal.value?.hide()
    // Không cần resetForm vì không có chức năng "Thêm mới"
}

// Xử lý Submit Form
const handleSubmit = (values) => {
    // API yêu cầu một Set<Long> cho roleIds, mảng (Array) là đủ
    const payload = {
        fullName: values.fullName,
        phone: values.phone,
        email: values.email || null, // Gửi null nếu rỗng
        status: values.status,
        roleIds: values.roleIds
    }

    updateMutation.mutate({ id: formData.id, data: payload })
}

// === HELPERS ===
const getStatusClass = (status) => {
    if (status === 'ACTIVE') return 'bg-success'
    if (status === 'INACTIVE') return 'bg-danger'
    return 'bg-secondary'
}

</script>

<style scoped>
.page-title {
    color: #A36B4A;
}

.table-hover tbody tr:hover {
    background-color: #fdfaf7;
}

.sortable {
    cursor: pointer;
    user-select: none;
}

.sortable:hover {
    color: #A36B4A;
}

.sortable i {
    font-size: 0.8em;
    margin-left: 4px;
    color: #aaa;
}

.sortable:hover i {
    color: #A36B4A;
}
</style>