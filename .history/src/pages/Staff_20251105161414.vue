<template>
    <div class="modal fade" id="staffModal" tabindex="-1" ref="modalElement" aria-labelledby="staffModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="staffModalLabel">Cập nhật Nhân viên: {{ formData.username }}</h5>
                    <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
                </div>

                <Form @submit="handleSubmit" :validation-schema="staffSchema" v-slot="{ errors }">
                    <div class="modal-body">

                        <div class="mb-3">
                            <label class="form-label fw-bold">Tên đăng nhập (Username)</label>
                            <input type="text" class="form-control" :value="formData.username" disabled readonly />
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
                                id="phone" placeholder="0901234567" v-model="formData.phone" />
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
                            <div v-if="allRolesLoading" class="text-center">
                                <span class="spinner-border spinner-border-sm"></span> Đang tải quyền...
                            </div>
                            <div v-else id="roleIdsGroup" class="p-3 bg-light rounded border"
                                :class="{ 'is-invalid': errors.roleIds }">

                                <Field name="roleIds" v-model="formData.roleIds" class="d-none" />

                                <div class="form-check" v-for="role in allRoles" :key="role.id">
                                    <input class="form-check-input" type="checkbox" :id="`role-${role.id}`"
                                        :value="role.id" :checked="formData.roleIds.includes(role.id)"
                                        @change="toggleRole(role.id)" />
                                    <label class="form-check-label" :for="`role-${role.id}`">
                                        {{ role.name }}
                                    </label>
                                </div>
                            </div>
                            <ErrorMessage name="roleIds" class="invalid-feedback d-block" />
                        </div>

                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="closeModal">Huỷ</button>
                        <button type="submit" class="btn btn-primary" :disabled="updateMutation.isPending.value">
                            <span v-if="updateMutation.isPending.value" class="spinner-border spinner-border-sm me-2"
                                role="status" aria-hidden="true"></span>
                            Lưu thay đổi
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
                <div class="input-group" style="max-width: 400px;">
                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                    <input type="text" class="form-control" placeholder="Tìm theo Tên đăng nhập, Họ tên, SĐT, Email..."
                        v-model="searchQuery">
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
                                <th scope="col" @click="handleSort('id')" class="sortable">
                                    ID <i :class="getSortIcon('id')"></i>
                                </th>
                                <th scope="col" @click="handleSort('username')" class="sortable">
                                    Tên đăng nhập <i :class="getSortIcon('username')"></i>
                                </th>
                                <th scope="col" @click="handleSort('fullName')" class="sortable">
                                    Họ tên <i :class="getSortIcon('fullName')"></i>
                                </th>
                                <th scope="col">Liên hệ</th>
                                <th scope="col">Quyền</th>
                                <th scope="col" @click="handleSort('status')" class="sortable">
                                    Trạng thái <i :class="getSortIcon('status')"></i>
                                </th>
                                <th scope="col" class="text-end">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="user in filteredUsers" :key="user.id">
                                <th scope="row">{{ user.id }}</th>
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
                                    <span class="badge" :class="getStatusClass(user.status)">
                                        {{ user.status }}
                                    </span>
                                </td>
                                <td class="text-end">
                                    <button class="btn btn-sm btn-outline-primary" @click="openModal(user)">
                                        <i class="bi bi-pencil-fill"></i> Sửa
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="filteredUsers.length === 0">
                                <td colspan="7" class="text-center text-muted">Không tìm thấy nhân viên nào.</td>
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
import { Form, Field, ErrorMessage, useForm } from 'vee-validate' // <-- Đã import useForm
import * as yup from 'yup'
import { toast } from 'vue3-toastify'
import { getUsers, updateUser } from '@/api/userService'
import { getAllRoles } from '@/api/roleService'
import Pagination from '@/components/Pagination.vue'

const queryClient = useQueryClient()

// --- State chung ---
const currentPage = ref(1)
const searchQuery = ref('')
const sortState = reactive({
    key: 'username',
    direction: 'asc'
})

// --- Modal & Form ---
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

// --- Validation ---
const staffSchema = yup.object({
    fullName: yup.string().required('Họ tên là bắt buộc'),
    phone: yup
        .string()
        .required('Số điện thoại là bắt buộc')
        .matches(/^(\+?84|0)\d{9}$/, 'Số điện thoại VN không hợp lệ'),
    email: yup.string().email('Email không hợp lệ').nullable(),
    status: yup.string().required('Trạng thái là bắt buộc'),
    roleIds: yup.array().min(1, 'Phải chọn ít nhất 1 quyền').required()
})

// --- FIX: Lấy 'setFieldValue' từ 'useForm' ---
const { resetForm, setValues, setFieldValue } = useForm({
    validationSchema: staffSchema,
    initialValues: formData
})

// --- Query: Lấy danh sách Users ---
const { data: pageData, isLoading, isError, error } = useQuery({
    queryKey: ['users', currentPage, sortState],
    queryFn: () => {
        const sortString = `${sortState.key},${sortState.direction}`
        return getUsers(currentPage.value - 1, 15, sortString)
    },
    keepPreviousData: true
})

// --- FIX: Query: Lấy danh sách Roles (dùng code snippet bạn cung cấp) ---
const allRoles = ref([])
const { isLoading: allRolesLoading } = useQuery({
    queryKey: ['allRoles'],
    queryFn: getAllRoles,
    onSuccess: (data) => {
        allRoles.value = data
    },
    staleTime: 1000 * 60 * 5 // Cache 5 phút
})

// --- Update Mutation ---
const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
        toast.success('Cập nhật nhân viên thành công!')
        queryClient.invalidateQueries(['users'])
        closeModal()
    },
    onError: (err) => {
        toast.error(err.response?.data?.message || 'Không thể cập nhật.')
    }
})

// --- Search + Sort ---
const filteredUsers = computed(() => {
    if (!pageData.value?.content) return []
    if (!searchQuery.value) return pageData.value.content
    const q = searchQuery.value.toLowerCase()
    return pageData.value.content.filter(
        (u) =>
            u.username.toLowerCase().includes(q) ||
            u.fullName.toLowerCase().includes(q) ||
            u.phone.toLowerCase().includes(q) ||
            (u.email && u.email.toLowerCase().includes(q))
    )
})

const handleSort = (key) => {
    if (sortState.key === key) {
        sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc'
    } else {
        sortState.key = key
        sortState.direction = 'asc'
    }
    currentPage.value = 1
}

const getSortIcon = (key) => {
    if (sortState.key !== key) return 'bi bi-arrow-down-up'
    return sortState.direction === 'asc' ? 'bi bi-sort-up' : 'bi bi-sort-down'
}

const handlePageChange = (page) => {
    currentPage.value = page
}

// --- Modal logic ---
onMounted(() => {
    if (modalElement.value) {
        bsModal.value = new Modal(modalElement.value)
    }
})
onUnmounted(() => bsModal.value?.dispose())

// --- FIX: Hàm 'toggleRole' phải được định nghĩa ---
const toggleRole = (roleId) => {
    const index = formData.roleIds.indexOf(roleId);
    if (index > -1) {
        formData.roleIds.splice(index, 1); // Bỏ chọn
    } else {
        formData.roleIds.push(roleId); // Chọn
    }
    // **Đây là dòng fix quan trọng:**
    // Thông báo cho VeeValidate biết giá trị của 'roleIds' đã thay đổi.
    setFieldValue('roleIds', formData.roleIds);
}

const openModal = (user) => {
    // Không cần 'await loadAllRoles()' nữa vì useQuery đã tự xử lý
    formData.id = user.id
    formData.username = user.username
    formData.fullName = user.fullName
    formData.phone = user.phone
    formData.email = user.email || ''
    formData.status = user.status
    formData.roleIds = user.roles.map((r) => r.id)

    // Cập nhật giá trị cho VeeValidate
    setValues({ ...formData })

    bsModal.value?.show()
}

const closeModal = () => {
    bsModal.value?.hide()
    // Reset form để xóa lỗi validation cũ
    resetForm();
}

// Hàm này nhận 'values' từ VeeValidate (đã được cập nhật bởi setFieldValue)
const handleSubmit = (values) => {
    updateMutation.mutate({
        id: formData.id,
        data: values // 'values' này đã chứa 'roleIds' chính xác
    })
}

// --- Helpers ---
const getStatusClass = (status) => {
    if (status === 'ACTIVE') return 'bg-success'
    if (status === 'INACTIVE') return 'bg-danger'
    return 'bg-secondary'
}
const getRoleClass = (name) => {
    if (name === 'ROLE_ADMIN') return 'bg-primary'
    if (name === 'ROLE_MANAGER') return 'bg-info text-dark'
    if (name === 'ROLE_STAFF') return 'bg-secondary'
    return 'bg-light text-dark'
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

#roleIdsGroup.is-invalid {
    border-color: var(--bs-danger) !important;
}
</style>