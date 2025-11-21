<template>
    <!-- Modal Cập nhật Nhân viên -->
    <div class="modal fade" id="staffModal" tabindex="-1" ref="modalElement" aria-labelledby="staffModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Cập nhật Nhân viên: {{ formData.username }}</h5>
                    <button type="button" class="btn-close" @click="closeModal"></button>
                </div>

                <Form @submit="handleSubmit" :validation-schema="staffSchema" v-slot="{ errors }">
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label fw-bold">Tên đăng nhập</label>
                            <input type="text" class="form-control" :value="formData.username" disabled />
                        </div>

                        <div class="mb-3">
                            <label class="form-label fw-bold">Họ và tên <span class="text-danger">*</span></label>
                            <Field name="fullName" type="text" class="form-control" v-model="formData.fullName"
                                :class="{ 'is-invalid': errors.fullName }" placeholder="Nguyễn Văn A" />
                            <ErrorMessage name="fullName" class="invalid-feedback" />
                        </div>

                        <div class="mb-3">
                            <label class="form-label fw-bold">Số điện thoại <span class="text-danger">*</span></label>
                            <Field name="phone" type="text" class="form-control" v-model="formData.phone"
                                :class="{ 'is-invalid': errors.phone }" placeholder="0901234567" />
                            <ErrorMessage name="phone" class="invalid-feedback" />
                        </div>

                        <div class="mb-3">
                            <label class="form-label fw-bold">Email</label>
                            <Field name="email" type="email" class="form-control" v-model="formData.email"
                                :class="{ 'is-invalid': errors.email }" placeholder="example@email.com" />
                            <ErrorMessage name="email" class="invalid-feedback" />
                        </div>

                        <div class="mb-3">
                            <label class="form-label fw-bold">Trạng thái <span class="text-danger">*</span></label>
                            <Field name="status" as="select" class="form-select" v-model="formData.status"
                                :class="{ 'is-invalid': errors.status }">
                                <option value="ACTIVE">Đang hoạt động</option>
                                <option value="INACTIVE">Đã khoá</option>
                            </Field>
                            <ErrorMessage name="status" class="invalid-feedback" />
                        </div>

                        <div class="mb-3">
                            <label class="form-label fw-bold">Phân quyền <span class="text-danger">*</span></label>
                            <div v-if="allRolesLoading" class="text-center">
                                
                            </div>
                            <div v-else id="roleIdsGroup" class="p-3 bg-light rounded border"
                                :class="{ 'is-invalid': errors.roleIds }">
                                <div class="form-check" v-for="role in allRoles" :key="role.id">
                                    <input class="form-check-input" type="checkbox" :id="'role-' + role.id"
                                        :checked="formData.roleIds.includes(role.id)" @change="toggleRole(role.id)" />
                                    <label class="form-check-label" :for="'role-' + role.id">{{ role.name }}</label>
                                </div>
                            </div>
                            <ErrorMessage name="roleIds" class="invalid-feedback d-block" />
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="closeModal">Huỷ</button>
                        <button type="submit" class="btn btn-primary" :disabled="updateMutation.isPending.value">
                            <span v-if="updateMutation.isPending.value"
                                class="spinner-border spinner-border-sm me-2"></span>
                            Lưu thay đổi
                        </button>
                    </div>
                </Form>
            </div>
        </div>
    </div>

    <!-- Trang danh sách -->
    <div data-aos="fade-up">
        <div class="page-header d-flex justify-content-between align-items-center mb-4">
            <h2 class="page-title">Quản lý Nhân viên</h2>
        </div>

        <div class="card mb-4">
            <div class="card-body">
                <div class="input-group" style="max-width: 400px;">
                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                    <input type="text" class="form-control" placeholder="Tìm theo tên, SĐT, email..."
                        v-model="searchQuery" />
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-body">
                <div v-if="isLoading" class="text-center my-5">
                    <div class="spinner-border text-primary"></div>
                </div>

                <div v-else-if="isError" class="alert alert-danger">
                    Lỗi tải dữ liệu: {{ error.message }}
                </div>

                <div v-else-if="pageData && pageData.content" class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th @click="handleSort('id')" class="sortable">ID <i :class="getSortIcon('id')"></i>
                                </th>
                                <th @click="handleSort('username')" class="sortable">Tên đăng nhập <i
                                        :class="getSortIcon('username')"></i></th>
                                <th @click="handleSort('fullName')" class="sortable">Họ tên <i
                                        :class="getSortIcon('fullName')"></i></th>
                                <th>Liên hệ</th>
                                <th>Quyền</th>
                                <th @click="handleSort('status')" class="sortable">Trạng thái <i
                                        :class="getSortIcon('status')"></i></th>
                                <th class="text-end">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="user in filteredUsers" :key="user.id">
                                <td>{{ user.id }}</td>
                                <td class="fw-bold">{{ user.username }}</td>
                                <td>{{ user.fullName }}</td>
                                <td>
                                    <div>{{ user.phone }}</div>
                                    <div class="small text-muted">{{ user.email }}</div>
                                </td>
                                <td>
                                    <span v-for="role in user.roles" :key="role.id" class="badge me-1"
                                        :class="getRoleClass(role.name)">
                                        {{ role.name }}
                                    </span>
                                </td>
                                <td>
                                    <span class="badge" :class="getStatusClass(user.status)">{{ user.status }}</span>
                                </td>
                                <td class="text-end">
                                    <button class="btn btn-sm btn-outline-primary" @click="openModal(user)">
                                        <i class="bi bi-pencil-fill"></i> Sửa
                                    </button>
                                </td>
                            </tr>

                            <tr v-if="filteredUsers.length === 0">
                                <td colspan="7" class="text-center text-muted">Không tìm thấy nhân viên nào</td>
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { Modal } from 'bootstrap'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { toast } from 'vue3-toastify'
import Pagination from '@/components/Pagination.vue'
import { getUsers, updateUser } from '@/api/userService'
import { getAllRoles } from '@/api/userService'

// State
const queryClient = useQueryClient()
const currentPage = ref(1)
const searchQuery = ref('')
const sortState = reactive({ key: 'username', direction: 'asc' })

// Modal
const modalElement = ref(null)
const bsModal = ref(null)
const formData = reactive({
    id: null,
    username: '',
    fullName: '',
    phone: '',
    email: '',
    status: 'ACTIVE',
    roleIds: []
})

// Roles
const allRoles = ref([])
const { isLoading: allRolesLoading } = useQuery({
    queryKey: ['allRoles'],
    queryFn: getAllRoles,
    onSuccess: (data) => (allRoles.value = data)
})

// Validation
const staffSchema = yup.object({
    fullName: yup.string().required('Họ tên là bắt buộc'),
    phone: yup.string().required('SĐT là bắt buộc').matches(/^(\+?84|0)\d{9}$/, 'Sai định dạng SĐT'),
    email: yup.string().email('Email không hợp lệ').nullable(),
    status: yup.string().required('Trạng thái là bắt buộc'),
    roleIds: yup.array().min(1, 'Phải chọn ít nhất 1 quyền')
})

// Query danh sách user
const { data: pageData, isLoading, isError, error } = useQuery({
    queryKey: ['users', currentPage, sortState],
    queryFn: () => getUsers(currentPage.value - 1, 15, `${sortState.key},${sortState.direction}`),
    keepPreviousData: true
})

// Mutation update
const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
        toast.success('Cập nhật thành công!')
        queryClient.invalidateQueries(['users'])
        closeModal()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Không thể cập nhật.')
})

// Filter client-side
const filteredUsers = computed(() => {
    if (!pageData.value?.content) return []
    if (!searchQuery.value) return pageData.value.content
    const q = searchQuery.value.toLowerCase()
    return pageData.value.content.filter(u =>
        u.username.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q))
    )
})

// Sort + Pagination
const handleSort = (key) => {
    if (sortState.key === key) sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc'
    else { sortState.key = key; sortState.direction = 'asc' }
    currentPage.value = 1
}
const getSortIcon = (key) => sortState.key !== key ? 'bi bi-arrow-down-up' : (sortState.direction === 'asc' ? 'bi bi-sort-up' : 'bi bi-sort-down')
const handlePageChange = (page) => currentPage.value = page

// Modal logic
onMounted(() => { bsModal.value = new Modal(modalElement.value) })
onUnmounted(() => { bsModal.value?.dispose() })
const openModal = (user) => {
    formData.id = user.id
    formData.username = user.username
    formData.fullName = user.fullName
    formData.phone = user.phone
    formData.email = user.email
    formData.status = user.status
    formData.roleIds = user.roles.map(r => r.id)
    bsModal.value?.show()
}
const closeModal = () => bsModal.value?.hide()
const toggleRole = (id) => {
    const i = formData.roleIds.indexOf(id)
    i === -1 ? formData.roleIds.push(id) : formData.roleIds.splice(i, 1)
}
const handleSubmit = (values) => {
    updateMutation.mutate({ id: formData.id, data: { ...values, roleIds: formData.roleIds } })
}

// Helpers
const getStatusClass = (status) => status === 'ACTIVE' ? 'bg-success' : (status === 'INACTIVE' ? 'bg-danger' : 'bg-secondary')
const getRoleClass = (role) => role === 'ROLE_ADMIN' ? 'bg-primary' : (role === 'ROLE_MANAGER' ? 'bg-info' : 'bg-secondary')
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

.sortable i {
    margin-left: 4px;
    font-size: 0.8em;
    color: #aaa;
}

.sortable:hover i {
    color: #A36B4A;
}

#roleIdsGroup.is-invalid {
    border-color: var(--bs-danger) !important;
}
</style>