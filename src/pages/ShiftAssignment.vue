<template>
    <div class="shift-assignment-page container-fluid" data-aos="fade-up">
        <div class="page-header card-shadow">
            <div>
                <h2 class="page-title">Quản lý Phân công Ca làm</h2>
                <p class="page-subtitle">Phân công nhân viên vào ca làm, quản lý thời gian và lương theo ca.</p>
            </div>
            <div class="d-flex flex-wrap gap-2 align-items-center">
                <button class="btn btn-primary" type="button" @click="openCreateModal" v-if="activeTab === 'list'">
                    <i class="bi bi-plus-lg me-2"></i>Tạo phân công mới
                </button>
                <button class="btn btn-outline-secondary" type="button" @click="fetchData" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    Làm mới
                </button>
            </div>
        </div>

        <div class="card tabs-card mb-4">
            <div class="card-body">
                <ul class="nav nav-pills reports-tabs mb-3" role="tablist">
                    <li class="nav-item" v-for="tab in tabs" :key="tab.key" role="presentation">
                        <button
                            type="button"
                            class="nav-link"
                            :class="{ active: activeTab === tab.key }"
                            @click="activeTab = tab.key"
                        >
                            <i :class="[tab.icon, 'me-2']"></i>{{ tab.label }}
                        </button>
                    </li>
                </ul>
                <div v-if="loading && activeTab === 'list'" class="state-block py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                </div>
                <div v-else-if="error && activeTab === 'list'" class="state-block py-5">
                    <div class="alert alert-danger mb-0">{{ error }}</div>
                </div>
                <div v-else class="tab-content">
                    <ShiftAssignmentListTab
                        v-if="activeTab === 'list'"
                        :assignments="assignments"
                        :loading="loading"
                        :error="error"
                        :filters="filters"
                        :status-options="ASSIGNMENT_STATUSES"
                        :shift-options="shiftOptions"
                        :staff-options="staffOptions"
                        @filter="fetchAssignments"
                        @reset-filters="resetFilters"
                        @view-detail="openDetail"
                        @edit="openEdit"
                        @update-status="handleUpdateStatus"
                        @remove="handleRemove"
                    />
                    <ShiftAssignmentMyTab
                        v-else-if="activeTab === 'my'"
                        :assignments="myAssignments"
                        :loading="myLoading"
                        :error="myError"
                        @refresh="fetchMyAssignments"
                    />
                </div>
            </div>
        </div>

        <ShiftAssignmentFormModal
            ref="formModal"
            :assignment="editingAssignment"
            :shift-options="shiftOptions"
            :staff-options="staffOptions"
            :submitting="formSubmitting"
            @submit="handleFormSubmit"
        />
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/store/auth'
import ShiftAssignmentListTab from '@/components/shift-assignments/ShiftAssignmentListTab.vue'
import ShiftAssignmentMyTab from '@/components/shift-assignments/ShiftAssignmentMyTab.vue'
import ShiftAssignmentFormModal from '@/components/shift-assignments/ShiftAssignmentFormModal.vue'
import {
    ASSIGNMENT_STATUSES,
    getAssignmentsForCurrentUser,
    getAssignmentsForShift,
    createShiftAssignment,
    updateShiftAssignment,
    updateShiftAssignmentStatus,
    deleteShiftAssignment
} from '@/api/shiftService'
import { listShiftInstances } from '@/api/shiftService'
import { getUsers } from '@/api/userService'
import { toast } from 'vue3-toastify'
import { formatDate } from '@/utils/formatters'

const activeTab = ref('list')
const tabs = [
    { key: 'list', label: 'Danh sách phân công', icon: 'bi bi-list-ul' },
    { key: 'my', label: 'Phân công của tôi', icon: 'bi bi-person-check' }
]

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const filters = reactive({
    shiftId: null,
    status: '',
    userId: null
})

const loading = ref(false)
const error = ref(null)
const assignments = ref([])

const myLoading = ref(false)
const myError = ref(null)
const myAssignments = ref([])

const shiftOptions = ref([])
const staffOptions = ref([])

const formModal = ref(null)
const editingAssignment = ref(null)
const formSubmitting = ref(false)

const fetchShiftOptions = async () => {
    try {
        const data = await listShiftInstances({ page: 0, size: 100, sort: 'shiftDate,desc' })
        shiftOptions.value = (data?.content || []).map(shift => ({
            value: shift.id,
            label: `${shift.templateName || 'Ca'} • ${formatDate(shift.shiftDate)} • ${formatTime(shift.startTime)}-${formatTime(shift.endTime)}`
        }))
    } catch (err) {
        shiftOptions.value = []
    }
}

const fetchStaffOptions = async () => {
    try {
        const response = await getUsers({ page: 0, size: 100, sort: 'fullName,asc' })
        const users = response?.content || response?.items || []
        staffOptions.value = users.filter(u =>
            u.roles?.some(r => r.name === 'ROLE_STAFF' || r === 'ROLE_STAFF')
        ).map(u => ({
            value: u.id,
            label: u.fullName || u.username,
            username: u.username
        }))
    } catch (err) {
        handleError(err, 'Không thể tải danh sách nhân viên.')
        staffOptions.value = []
    }
}

const fetchAssignments = async () => {
    if (!filters.shiftId) {
        error.value = 'Vui lòng chọn ca làm để xem phân công.'
        assignments.value = []
        return
    }
    loading.value = true
    error.value = null
    try {
        const data = await getAssignmentsForShift(filters.shiftId)
        let fetched = Array.isArray(data) ? data : []
        
        // Filter by status if selected
        if (filters.status) {
            fetched = fetched.filter(a => a.status === filters.status)
        }
        
        // Filter by user if selected
        if (filters.userId) {
            fetched = fetched.filter(a => a.userId === filters.userId)
        }
        
        // Sort by created date desc
        fetched.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0)
            const dateB = new Date(b.createdAt || 0)
            return dateB - dateA
        })
        
        assignments.value = fetched
    } catch (err) {
        error.value = err.response?.data?.message || 'Không thể tải danh sách phân công.'
        assignments.value = []
    } finally {
        loading.value = false
    }
}

const fetchMyAssignments = async () => {
    myLoading.value = true
    myError.value = null
    try {
        const data = await getAssignmentsForCurrentUser()
        const fetched = Array.isArray(data) ? data : []
        
        // Sort by created date desc
        fetched.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0)
            const dateB = new Date(b.createdAt || 0)
            return dateB - dateA
        })
        
        myAssignments.value = fetched
    } catch (err) {
        myError.value = err.response?.data?.message || 'Không thể tải phân công của bạn.'
        myAssignments.value = []
    } finally {
        myLoading.value = false
    }
}

const resetFilters = () => {
    filters.shiftId = null
    filters.status = ''
    filters.userId = null
    assignments.value = []
}

const openCreateModal = () => {
    editingAssignment.value = null
    formModal.value?.show()
}

const openEdit = (assignment) => {
    editingAssignment.value = assignment
    formModal.value?.show()
}

const openDetail = (assignment) => {
    // Có thể mở modal detail hoặc navigate
    toast.info(`Xem chi tiết phân công #${assignment.id}`)
}

const handleFormSubmit = async (payload) => {
    formSubmitting.value = true
    try {
        if (editingAssignment.value?.id) {
            await updateShiftAssignment(editingAssignment.value.id, payload)
            toast.success('Đã cập nhật phân công.')
        } else {
            await createShiftAssignment(payload)
            toast.success('Đã tạo phân công mới.')
        }
        formModal.value?.hide()
        editingAssignment.value = null
        await fetchAssignments()
        await fetchMyAssignments()
    } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể lưu phân công.')
    } finally {
        formSubmitting.value = false
    }
}

const handleUpdateStatus = async (assignment) => {
    const nextStatus = window.prompt('Nhập trạng thái mới (SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED):', assignment.status)
    if (!nextStatus) return
    if (!ASSIGNMENT_STATUSES.some((item) => item.value === nextStatus)) {
        toast.warning('Trạng thái không hợp lệ.')
        return
    }
    try {
        await updateShiftAssignmentStatus(assignment.id, { status: nextStatus, notes: assignment.notes || null })
        toast.success('Đã cập nhật trạng thái phân công.')
        await fetchAssignments()
        await fetchMyAssignments()
    } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái.')
    }
}

const handleRemove = async (assignment) => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa phân công này?')
    if (!confirmed) return
    try {
        await deleteShiftAssignment(assignment.id)
        toast.success('Đã xóa phân công.')
        await fetchAssignments()
        await fetchMyAssignments()
    } catch (err) {
        handleError(err, 'Không thể xóa phân công.')
    }
}

const formatTime = (time) => {
    if (!time) return '--:--'
    return time.length === 5 ? time : time.slice(0, 5)
}

const fetchData = () => {
    if (activeTab.value === 'list') {
        fetchAssignments()
    } else if (activeTab.value === 'my') {
        fetchMyAssignments()
    }
}

watch(activeTab, (newTab) => {
    if (newTab === 'list') {
        fetchShiftOptions()
        fetchStaffOptions()
    } else if (newTab === 'my') {
        fetchMyAssignments()
    }
})

watch(() => filters.shiftId, () => {
    if (filters.shiftId) {
        fetchAssignments()
    } else {
        assignments.value = []
    }
})

onMounted(() => {
    fetchShiftOptions()
    fetchStaffOptions()
    if (activeTab.value === 'my') {
        fetchMyAssignments()
    }
})
</script>

<style scoped>
.shift-assignment-page {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
    padding-bottom: 2rem;
}

.card-shadow {
    background: linear-gradient(120deg, rgba(99, 102, 241, 0.12), rgba(129, 140, 248, 0.08));
    border: 1px solid var(--color-border);
    border-radius: 20px;
    padding: 1.5rem 2rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
}

.page-title {
    font-weight: 700;
    color: var(--color-heading);
    margin-bottom: 0.25rem;
}

.page-subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
}

.tabs-card {
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.28);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
    background: linear-gradient(180deg, var(--color-card), var(--color-card-accent));
}

.reports-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.reports-tabs .nav-link {
    border-radius: 999px;
    padding: 0.65rem 1.25rem;
    font-weight: 600;
    color: var(--color-text-muted);
    background: rgba(148, 163, 184, 0.12);
}

.reports-tabs .nav-link.active {
    background: linear-gradient(135deg, #4f46e5, #6366f1);
    color: #fff;
}

.state-block {
    display: flex;
    align-items: center;
    justify-content: center;
}

@media (max-width: 768px) {
    .card-shadow {
        padding: 1.25rem;
    }
}
</style>

