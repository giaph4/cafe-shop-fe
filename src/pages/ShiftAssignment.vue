<template>
    <div class="shift-assignment-page container-fluid" data-aos="fade-up">
        <div class="shift-assignment-header">
            <div class="shift-assignment-header__content">
                <div class="shift-assignment-header__title-section">
                    <h2 class="page-title">Quản lý Phân công Ca làm</h2>
                    <p class="page-subtitle">Phân công nhân viên vào ca làm, quản lý thời gian và lương theo ca.</p>
                </div>
                <div class="shift-assignment-header__actions">
                    <button class="btn btn-primary" type="button" @click="openCreateModal" v-if="activeTab === 'list'">
                        <i class="bi bi-plus-lg me-2"></i>Tạo phân công mới
                    </button>
                    <button class="btn btn-outline-secondary" type="button" @click="fetchData" :disabled="loading">
                        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="bi bi-arrow-clockwise me-2"></i>
                        Làm mới
                    </button>
                </div>
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

        <ShiftAssignmentStatusUpdateModal
            ref="statusModal"
            :status-options="ASSIGNMENT_STATUSES"
            @submit="handleStatusUpdateSubmit"
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
import ShiftAssignmentStatusUpdateModal from '@/components/shifts/ShiftAssignmentStatusUpdateModal.vue'
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
const statusModal = ref(null)
const editingAssignment = ref(null)
const updatingStatusAssignment = ref(null)
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
    updatingStatusAssignment.value = assignment
    statusModal.value?.show(assignment)
}

const handleStatusUpdateSubmit = async (payload) => {
    if (!updatingStatusAssignment.value) return
    statusModal.value?.setSubmitting(true)
    try {
        await updateShiftAssignmentStatus(updatingStatusAssignment.value.id, payload)
        toast.success('Đã cập nhật trạng thái phân công.')
        await fetchAssignments()
        await fetchMyAssignments()
        statusModal.value?.setSubmitting(false)
    } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái.')
        statusModal.value?.setSubmitting(false)
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

.shift-assignment-header {
    background: #ffffff;
    background: linear-gradient(165deg, #ffffff, rgba(255, 255, 255, 0.95));
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04);
    margin-bottom: 1.5rem;
    padding: 1.5rem;
}

.shift-assignment-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.shift-assignment-header__title-section {
    flex: 1;
    min-width: 0;
}

.shift-assignment-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    justify-content: flex-end;
}

.page-title {
    font-weight: 700;
    color: var(--color-heading, #1e293b);
    margin-bottom: 0.25rem;
    font-size: 1.5rem;
    line-height: 1.3;
}

.page-subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted, #64748b);
    font-size: 0.9rem;
    line-height: 1.5;
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
    .shift-assignment-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .shift-assignment-header__actions {
        width: 100%;
        justify-content: flex-start;
    }
}
</style>

