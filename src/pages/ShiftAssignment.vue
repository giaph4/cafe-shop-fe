<template>
    <div class="shift-assignment-page container-fluid">
        <div class="shift-assignment-header">
            <div class="shift-assignment-header__content">
                <div class="shift-assignment-header__title-section">
                    <h2 class="shift-assignment-header__title">Quản lý Phân công Ca làm</h2>
                    <p class="shift-assignment-header__subtitle">Phân công nhân viên vào ca làm, quản lý thời gian và lương theo ca.</p>
                </div>
                <div class="shift-assignment-header__actions">
                    <button 
                        class="btn btn-primary" 
                        type="button" 
                        @click="openCreateModal" 
                        v-if="activeTab === 'list'"
                    >
                        <i class="bi bi-plus-lg me-2"></i>
                        Tạo phân công mới
                    </button>
                    <button 
                        class="btn btn-outline-secondary" 
                        type="button" 
                        @click="fetchData" 
                        :disabled="loading"
                    >
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
                <LoadingState v-if="loading && activeTab === 'list'" />
                <ErrorState 
                    v-else-if="error && activeTab === 'list'" 
                    :message="error"
                    @retry="fetchData"
                />
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

        <Teleport to="body">
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

            <!-- Delete Assignment Confirmation Modal -->
            <div 
                class="modal fade" 
                id="deleteAssignmentModal" 
                tabindex="-1" 
                ref="deleteAssignmentModalElement" 
                aria-labelledby="deleteAssignmentModalLabel"
                aria-hidden="true"
            >
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="deleteAssignmentModalLabel">Xác nhận xóa</h5>
                            <button type="button" class="btn-close" @click="deleteAssignmentBsModal?.hide()" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p>Bạn có chắc chắn muốn xóa phân công này không?</p>
                            <div v-if="assignmentToDelete" class="card mt-3">
                                <div class="card-body">
                                    <p class="mb-2"><strong>Nhân viên:</strong> {{ assignmentToDelete.fullName || assignmentToDelete.username || 'N/A' }}</p>
                                    <p class="mb-2"><strong>Ca làm:</strong> Shift #{{ assignmentToDelete.shiftId || 'N/A' }}</p>
                                    <p class="mb-0"><strong>Thời gian:</strong> {{ formatTime(assignmentToDelete.plannedStart) }} - {{ formatTime(assignmentToDelete.plannedEnd) }}</p>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" @click="deleteAssignmentBsModal?.hide()">
                                Hủy
                            </button>
                            <button type="button" class="btn btn-danger" @click="confirmDeleteAssignment">
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Teleport } from 'vue'
import { Modal } from 'bootstrap'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/store/auth'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
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

const deleteAssignmentModalElement = ref(null)
const deleteAssignmentBsModal = ref(null)
const assignmentToDelete = ref(null)

const handleRemove = (assignment) => {
    assignmentToDelete.value = assignment
    deleteAssignmentBsModal.value?.show()
}

const confirmDeleteAssignment = async () => {
    if (!assignmentToDelete.value) return
    const assignment = assignmentToDelete.value
    deleteAssignmentBsModal.value?.hide()
    try {
        await deleteShiftAssignment(assignment.id)
        toast.success('Đã xóa phân công.')
        await fetchAssignments()
        await fetchMyAssignments()
    } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể xóa phân công.')
    } finally {
        assignmentToDelete.value = null
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
    if (deleteAssignmentModalElement.value) {
        deleteAssignmentBsModal.value = new Modal(deleteAssignmentModalElement.value)
    }
    fetchShiftOptions()
    fetchStaffOptions()
    if (activeTab.value === 'my') {
        fetchMyAssignments()
    }
})
</script>

<style scoped lang="scss">
.shift-assignment-page {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
    padding-bottom: var(--spacing-12);
}

.shift-assignment-header {
    padding: var(--spacing-6);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-md);
}

.shift-assignment-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-6);
    flex-wrap: wrap;
}

.shift-assignment-header__title-section {
    flex: 1;
    min-width: 0;
}

.shift-assignment-header__title {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-tight);
    margin-bottom: var(--spacing-1);
}

.shift-assignment-header__subtitle {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
}

.shift-assignment-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-3);
    align-items: center;
    justify-content: flex-end;
}

.tabs-card {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);
    background: var(--color-card);
}

.reports-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-3);
}

.reports-tabs .nav-link {
    border-radius: var(--radius-full);
    padding: var(--spacing-2) var(--spacing-5);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
    background: var(--color-card-muted);
    transition: all var(--transition-base);
}

.reports-tabs .nav-link:hover {
    background: var(--color-primary-soft);
    color: var(--color-primary);
}

.reports-tabs .nav-link.active {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
    color: var(--color-white);
}

@media (max-width: 768px) {
    .shift-assignment-header {
        padding: var(--spacing-4);
    }

    .shift-assignment-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .shift-assignment-header__actions {
        width: 100%;
        justify-content: stretch;

        .btn {
            flex: 1;
        }
    }
}
</style>

