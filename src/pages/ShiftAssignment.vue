<template>
  <div
    class="shift-assignment-page container-fluid"
    data-aos="fade-up"
    style="background: var(--color-body-bg); padding: var(--spacing-4);"
  >
    <div class="shift-assignment-header">
      <div class="shift-assignment-header__content">
        <div class="shift-assignment-header__title-section">
          <h2 class="shift-assignment-header__title">
            Quản lý Phân công Ca làm
          </h2>
          <p class="shift-assignment-header__subtitle">
            Phân công nhân viên vào ca làm, quản lý thời gian và lương theo ca.
          </p>
        </div>
        <div class="shift-assignment-header__actions">
          <button
            v-if="activeTab === 'list'"
            class="btn btn-primary"
            type="button"
            @click="openCreateModal"
          >
            <i class="bi bi-plus-lg me-2" />
            Tạo phân công mới
          </button>
          <button
            class="btn btn-outline-secondary"
            type="button"
            :disabled="loading"
            @click="fetchData"
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
        </div>
      </div>
    </div>

    <div class="card tabs-card mb-4">
      <div class="card-body">
        <ul
          class="nav nav-pills reports-tabs mb-3"
          role="tablist"
        >
          <li
            v-for="tab in tabs"
            :key="tab.key"
            class="nav-item"
            role="presentation"
          >
            <button
              type="button"
              class="nav-link"
              :class="{ active: activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              <i :class="[tab.icon, 'me-2']" />{{ tab.label }}
            </button>
          </li>
        </ul>
        <LoadingState v-if="loading && activeTab === 'list'" />
        <ErrorState
          v-else-if="error && activeTab === 'list'"
          :message="error"
          @retry="fetchData"
        />
        <div
          v-else
          class="tab-content"
        >
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
        id="deleteAssignmentModal"
        ref="deleteAssignmentModalElement"
        class="modal fade shift-assignment-delete-modal"
        tabindex="-1"
        aria-labelledby="deleteAssignmentModalLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5
                id="deleteAssignmentModalLabel"
                class="modal-title"
              >
                Xác nhận xóa
              </h5>
              <button
                type="button"
                class="btn-close"
                aria-label="Close"
                @click="deleteAssignmentBsModal?.hide()"
              />
            </div>
            <div class="modal-body">
              <p>Bạn có chắc chắn muốn xóa phân công này không?</p>
              <div
                v-if="assignmentToDelete"
                class="card mt-3"
              >
                <div class="card-body">
                  <p class="mb-2">
                    <strong>Nhân viên:</strong> {{ assignmentToDelete.fullName || assignmentToDelete.username || 'N/A' }}
                  </p>
                  <p class="mb-2">
                    <strong>Ca làm:</strong> Shift #{{ assignmentToDelete.shiftId || 'N/A' }}
                  </p>
                  <p class="mb-0">
                    <strong>Thời gian:</strong> {{ formatTime(assignmentToDelete.plannedStart) }} - {{ formatTime(assignmentToDelete.plannedEnd) }}
                  </p>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="deleteAssignmentBsModal?.hide()"
              >
                Hủy
              </button>
              <button
                type="button"
                class="btn btn-danger"
                @click="confirmDeleteAssignment"
              >
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
    } catch {
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

const handleError = (err, defaultMessage) => {
    const message = err.response?.data?.message || err.message || defaultMessage
    toast.error(message)
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
    gap: var(--spacing-4);
    padding-bottom: var(--spacing-12);
}

.shift-assignment-header {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.shift-assignment-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    flex-wrap: wrap;
}

.shift-assignment-header__title-section {
    flex: 1;
    min-width: 0;
}

.shift-assignment-header__title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.shift-assignment-header__subtitle {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.shift-assignment-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    align-items: center;
    justify-content: flex-end;
}

.shift-assignment-header__actions .btn {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.shift-assignment-header__actions .btn-primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.shift-assignment-header__actions .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-dark);
}

.shift-assignment-header__actions .btn-outline-secondary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.shift-assignment-header__actions .btn-outline-secondary:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.tabs-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.tabs-card :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.reports-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: var(--spacing-2);
    margin-bottom: var(--spacing-4);
}

.reports-tabs .nav-link {
    border-radius: var(--radius-sm);
    padding: var(--spacing-2) var(--spacing-3);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    background: transparent;
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.reports-tabs .nav-link:hover:not(.active) {
    background: var(--color-card-muted);
    border-color: var(--color-border);
    color: var(--color-heading);
}

.reports-tabs .nav-link.active {
    background: var(--color-primary);
    color: var(--color-text-inverse);
    border-color: var(--color-primary);
}

.shift-assignment-delete-modal :global(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.shift-assignment-delete-modal :global(.modal-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
}

.shift-assignment-delete-modal :global(.modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

.shift-assignment-delete-modal :global(.modal-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.shift-assignment-delete-modal :global(.modal-body p) {
    font-family: var(--font-family-sans);
    color: var(--color-heading);
}

.shift-assignment-delete-modal :global(.modal-body .card) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
}

.shift-assignment-delete-modal :global(.modal-body .card-body) {
    padding: var(--spacing-3);
    background: var(--color-card-muted);
}

.shift-assignment-delete-modal :global(.modal-body strong) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.shift-assignment-delete-modal :global(.modal-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
}

.shift-assignment-delete-modal :global(.modal-footer .btn) {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.shift-assignment-delete-modal :global(.modal-footer .btn-danger) {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-text-inverse);
}

.shift-assignment-delete-modal :global(.modal-footer .btn-danger:hover:not(:disabled)) {
    background: var(--color-danger-dark, #a0281d);
}

.shift-assignment-delete-modal :global(.modal-footer .btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.shift-assignment-delete-modal :global(.modal-footer .btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

@media (max-width: 768px) {
    .shift-assignment-header {
        padding: var(--spacing-3);
    }

    .shift-assignment-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .shift-assignment-header__actions {
        width: 100%;
        justify-content: stretch;
    }

    .shift-assignment-header__actions .btn {
        flex: 1;
    }
}
</style>

