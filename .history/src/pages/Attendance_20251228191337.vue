<template>
  <div
    class="page-container container-fluid"
      
  >
    <div class="attendance-header">
      <div class="attendance-header__content">
        <div class="attendance-header__title-section">
          <h2 class="attendance-header__title">
            Quản lý Chấm công
          </h2>
          <p class="attendance-header__subtitle">
            Theo dõi và quản lý chấm công của nhân viên, xem lịch sử và thống kê chi tiết.
          </p>
        </div>
        <div class="attendance-header__actions">
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

    <div
      v-if="activeTab === 'history' || activeTab === 'statistics'"
      class="card filter-card mb-4"
    >
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-lg-3 col-md-4">
            <label class="form-label">Từ ngày</label>
            <input
              v-model="filters.startDate"
              type="date"
              class="form-control"
            >
          </div>
          <div class="col-lg-3 col-md-4">
            <label class="form-label">Đến ngày</label>
            <input
              v-model="filters.endDate"
              type="date"
              class="form-control"
            >
          </div>
          <div class="col-lg-4 col-md-6">
            <label class="form-label">Khoảng thời gian</label>
            <div
              class="btn-group w-100"
              role="group"
            >
              <button
                v-for="preset in presets"
                :key="preset.value"
                type="button"
                class="btn"
                :class="preset.value === selectedPreset ? 'btn-primary' : 'btn-outline-primary'"
                @click="applyPreset(preset.value)"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>
          <div
            v-if="isManagerOrAdmin"
            class="col-lg-2 col-md-4"
          >
            <label class="form-label">Nhân viên</label>
            <select
              v-model="filters.userId"
              class="form-select"
            >
              <option :value="authStore.user?.id">
                Tôi
              </option>
              <option
                v-for="user in filteredStaffList"
                :key="user.id"
                :value="user.id"
              >
                {{ user.fullName || user.username }}
              </option>
            </select>
            <small class="text-muted d-block mt-1">
              Lưu ý: Chỉ hiển thị ca làm của nhân viên được chọn
            </small>
          </div>
        </div>
      </div>
    </div>

    <section class="attendance-tabs">
      <div class="card tabs-card mb-4">
        <div class="card-body">
          <div class="tabs">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              type="button"
              class="tab"
              :class="{ active: activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              <i :class="tab.icon" />
              <span>{{ tab.label }}</span>
            </button>
          </div>

          <LoadingState v-if="loading && activeTab !== 'overview'" />
          <ErrorState
            v-else-if="error"
            :message="error"
            @retry="fetchData"
          />
          <div
            v-else
            class="tab-content"
          >
            <AttendanceOverviewTab
              v-if="activeTab === 'overview'"
              :current-session="currentSession"
              :assignments="myAssignments"
              :loading="overviewLoading"
              :check-in-submitting="checkInSubmitting"
              :check-out-submitting="checkOutSubmitting"
              @check-in="handleCheckIn"
              @check-out="handleCheckOut"
              @refresh="fetchMyAssignments"
            />
            <AttendanceHistoryTab
              v-else-if="activeTab === 'history'"
              :records="attendanceRecords"
              :loading="historyLoading"
              :filters="filters"
            />
            <AttendanceStatisticsTab
              v-else-if="activeTab === 'statistics'"
              :statistics="statistics"
              :loading="statisticsLoading"
              :filters="filters"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch, computed } from 'vue'
import { useAuthStore } from '@/store/auth'
import {
    getAssignmentsForCurrentUser,
    getAssignmentsByUserId,
    checkInAttendance,
    checkOutAttendance,
    getAttendanceByAssignment
} from '@/api/shiftService'
import { getUsers } from '@/api/userService'
import { showError, showSuccess } from '@/utils/toast'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import AttendanceOverviewTab from '@/components/attendance/AttendanceOverviewTab.vue'
import AttendanceHistoryTab from '@/components/attendance/AttendanceHistoryTab.vue'
import AttendanceStatisticsTab from '@/components/attendance/AttendanceStatisticsTab.vue'

const authStore = useAuthStore()
const isManagerOrAdmin = computed(() => authStore.isManager || authStore.isAdmin)

const today = () => new Date().toISOString().split('T')[0]
const formatDate = (date) => date.toISOString().split('T')[0]
const shiftDateFrom = (baseDate, diff) => {
    const date = new Date(baseDate)
    date.setDate(date.getDate() + diff)
    return date
}
const shiftDate = (diff) => formatDate(shiftDateFrom(new Date(), diff))

const presets = [
    { value: '7', label: '7 ngày' },
    { value: '30', label: '30 ngày' },
    { value: '90', label: '90 ngày' }
]

const tabs = [
    { key: 'overview', label: 'Tổng quan', icon: 'bi bi-speedometer2' },
    { key: 'history', label: 'Lịch sử', icon: 'bi bi-clock-history' },
    { key: 'statistics', label: 'Thống kê', icon: 'bi bi-graph-up-arrow' }
]

const filters = reactive({
    startDate: shiftDate(-7),
    endDate: today(),
    userId: authStore.user?.id || null
})

const selectedPreset = ref('7')
const loading = ref(false)
const error = ref('')
const activeTab = ref('overview')

// Overview tab state
const overviewLoading = ref(false)
const currentSession = ref(null)
const myAssignments = ref([])
const checkInSubmitting = ref(false)
const checkOutSubmitting = ref(false)

// History tab state
const historyLoading = ref(false)
const attendanceRecords = ref([])

// Statistics tab state
const statisticsLoading = ref(false)
const statistics = ref(null)

// Staff list for filter
const staffList = ref([])
const filteredStaffList = computed(() => staffList.value.filter(user => user.id !== authStore.user?.id))

const applyPreset = (value) => {
    selectedPreset.value = value
    const days = Number(value)
    filters.startDate = shiftDate(-days)
    filters.endDate = today()
    if (activeTab.value === 'history') {
        fetchHistory()
    } else if (activeTab.value === 'statistics') {
        fetchStatistics()
    }
}

const fetchMyAssignments = async () => {
    overviewLoading.value = true
    try {
        let assignments = []

        // Nếu là admin/manager và có filter userId, lấy assignments của user đó
        if (isManagerOrAdmin.value && filters.userId && filters.userId !== authStore.user?.id) {
            assignments = await getAssignmentsByUserId(filters.userId, {
                startDate: filters.startDate,
                endDate: filters.endDate
            })
        } else {
            // Lấy assignments của current user
            assignments = await getAssignmentsForCurrentUser()
        }

        myAssignments.value = Array.isArray(assignments) ? assignments : (Array.isArray(assignments?.content) ? assignments.content : [])

        // Find active assignment with active session
        const activeAssignment = myAssignments.value.find(a =>
            a.status === 'ACCEPTED' && a.shiftInstance?.status === 'ACTIVE'
        )

        if (activeAssignment) {
            // Try to get current session from shift session service
            // Hiện tại, sử dụng assignment làm phiên hiện tại
            currentSession.value = {
                assignmentId: activeAssignment.id,
                shiftInstanceId: activeAssignment.shiftInstance?.id,
                workShiftId: activeAssignment.shiftInstance?.workShiftId,
                startTime: activeAssignment.shiftInstance?.startTime,
                endTime: activeAssignment.shiftInstance?.endTime,
                status: 'ACTIVE'
            }
        } else {
            currentSession.value = null
        }
    } catch (err) {
        showError(err.response?.data?.message || 'Không thể tải danh sách ca làm.')
    } finally {
        overviewLoading.value = false
    }
}

const handleCheckIn = async (payload) => {
    checkInSubmitting.value = true
    try {
        await checkInAttendance(payload)
        showSuccess('Check-in thành công!')
        await fetchMyAssignments()
        if (activeTab.value === 'history') {
            await fetchHistory()
        }
    } catch (err) {
        showError(err.response?.data?.message || 'Không thể thực hiện check-in.')
    } finally {
        checkInSubmitting.value = false
    }
}

const handleCheckOut = async (payload) => {
    checkOutSubmitting.value = true
    try {
        await checkOutAttendance(payload)
        showSuccess('Check-out thành công!')
        await fetchMyAssignments()
        if (activeTab.value === 'history') {
            await fetchHistory()
        }
    } catch (err) {
        showError(err.response?.data?.message || 'Không thể thực hiện check-out.')
    } finally {
        checkOutSubmitting.value = false
    }
}

const fetchHistory = async () => {
    historyLoading.value = true
    error.value = ''
    try {
        let records = []
        let assignments = []

        // Nếu là admin/manager và có filter userId, lấy assignments của user đó
        if (isManagerOrAdmin.value && filters.userId && filters.userId !== authStore.user?.id) {
            assignments = await getAssignmentsByUserId(filters.userId, {
                startDate: filters.startDate,
                endDate: filters.endDate
            })
            assignments = Array.isArray(assignments) ? assignments : (Array.isArray(assignments?.content) ? assignments.content : [])
        } else {
            // Lấy assignments của current user
            assignments = await getAssignmentsForCurrentUser()
            assignments = Array.isArray(assignments) ? assignments : []
        }

        const filteredAssignments = assignments

        for (const assignment of filteredAssignments) {
            try {
                const attendance = await getAttendanceByAssignment(assignment.id)
                if (Array.isArray(attendance)) {
                    records.push(...attendance)
                }
            } catch {
                // Bỏ qua lỗi khi fetch attendance cho assignment đơn lẻ
            }
        }

        // Filter by date range
        const start = new Date(`${filters.startDate  }T00:00:00`)
        const end = new Date(`${filters.endDate  }T23:59:59`)

        records = records.filter(record => {
            const checkInDate = record.checkInAt ? new Date(record.checkInAt) : null
            return checkInDate && checkInDate >= start && checkInDate <= end
        })

        // Sort by check-in time descending
        records.sort((a, b) => {
            const dateA = a.checkInAt ? new Date(a.checkInAt).getTime() : 0
            const dateB = b.checkInAt ? new Date(b.checkInAt).getTime() : 0
            return dateB - dateA
        })

        attendanceRecords.value = records
    } catch (err) {
        error.value = err.response?.data?.message || 'Không thể tải lịch sử chấm công.'
    } finally {
        historyLoading.value = false
    }
}

const fetchStatistics = async () => {
    statisticsLoading.value = true
    error.value = ''
    try {
        let records = []
        let assignments = []

        // Nếu là admin/manager và có filter userId, lấy assignments của user đó
        if (isManagerOrAdmin.value && filters.userId && filters.userId !== authStore.user?.id) {
            assignments = await getAssignmentsByUserId(filters.userId, {
                startDate: filters.startDate,
                endDate: filters.endDate
            })
            assignments = Array.isArray(assignments) ? assignments : (Array.isArray(assignments?.content) ? assignments.content : [])
        } else {
            // Lấy assignments của current user
            assignments = await getAssignmentsForCurrentUser()
            assignments = Array.isArray(assignments) ? assignments : []
        }

        const filteredAssignments = assignments

        if (filteredAssignments.length === 0) {
            statistics.value = null
            return
        }

        for (const assignment of filteredAssignments) {
            try {
                const attendance = await getAttendanceByAssignment(assignment.id)
                if (Array.isArray(attendance)) {
                    records.push(...attendance)
                }
            } catch {
                // Bỏ qua lỗi khi fetch attendance cho assignment đơn lẻ
            }
        }

        // Filter by date range
        const start = new Date(`${filters.startDate  }T00:00:00`)
        const end = new Date(`${filters.endDate  }T23:59:59`)

        records = records.filter(record => {
            const checkInDate = record.checkInAt ? new Date(record.checkInAt) : null
            return checkInDate && checkInDate >= start && checkInDate <= end
        })

        // Calculate statistics
        const totalRecords = records.length
        const checkedIn = records.filter(r => r.checkInAt).length
        const checkedOut = records.filter(r => r.checkOutAt).length
        const lateCount = records.filter(r => r.lateMinutes && r.lateMinutes > 0).length
        const earlyLeaveCount = records.filter(r => r.earlyLeaveMinutes && r.earlyLeaveMinutes > 0).length

        const totalLateMinutes = records.reduce((sum, r) => sum + (r.lateMinutes || 0), 0)
        const totalEarlyLeaveMinutes = records.reduce((sum, r) => sum + (r.earlyLeaveMinutes || 0), 0)

        const avgLateMinutes = lateCount > 0 ? Math.round(totalLateMinutes / lateCount) : 0
        const avgEarlyLeaveMinutes = earlyLeaveCount > 0 ? Math.round(totalEarlyLeaveMinutes / earlyLeaveCount) : 0

        statistics.value = {
            totalRecords,
            checkedIn,
            checkedOut,
            lateCount,
            earlyLeaveCount,
            totalLateMinutes,
            totalEarlyLeaveMinutes,
            avgLateMinutes,
            avgEarlyLeaveMinutes,
            onTimeRate: totalRecords > 0 ? ((totalRecords - lateCount - earlyLeaveCount) / totalRecords * 100).toFixed(1) : 0
        }
    } catch (err) {
        error.value = err.response?.data?.message || 'Không thể tải thống kê chấm công.'
    } finally {
        statisticsLoading.value = false
    }
}

const fetchStaffList = async () => {
    if (!isManagerOrAdmin.value) return
    try {
        const response = await getUsers({ page: 0, size: 100, sort: 'fullName,asc' })
        const users = response?.content || response?.items || []
        staffList.value = users.filter(u =>
            u.roles?.some(r => r.name === 'ROLE_STAFF' || r === 'ROLE_STAFF')
        )
    } catch {
        // Export error handled silently
    }
}

const fetchData = () => {
    if (activeTab.value === 'overview') {
        fetchMyAssignments()
    } else if (activeTab.value === 'history') {
        fetchHistory()
    } else if (activeTab.value === 'statistics') {
        fetchStatistics()
    }
}

watch(() => activeTab.value, (newTab) => {
    if (newTab === 'overview') {
        fetchMyAssignments()
    } else if (newTab === 'history') {
        fetchHistory()
    } else if (newTab === 'statistics') {
        fetchStatistics()
    }
})

watch(() => [filters.startDate, filters.endDate, filters.userId], () => {
    if (activeTab.value === 'history') {
        fetchHistory()
    } else if (activeTab.value === 'statistics') {
        fetchStatistics()
    }
})

onMounted(() => {
    fetchMyAssignments()
    fetchStaffList()
})
</script>

<style scoped lang="scss">
.attendance-page {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
    padding-bottom: var(--spacing-12);
}

.attendance-header {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.attendance-header__content {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
}

.attendance-header__title-section {
    flex: 1;
    min-width: 0;
}

.attendance-header__title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.attendance-header__subtitle {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.attendance-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    align-items: center;
    justify-content: flex-end;
}

.attendance-header__actions .btn {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.attendance-header__actions .btn-outline-secondary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.attendance-header__actions .btn-outline-secondary:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.filter-card,
.tabs-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.filter-card :global(.card-body),
.tabs-card :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.filter-card :global(.form-label) {
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-control),
.filter-card :global(.form-select) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-control:focus),
.filter-card :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.filter-card :global(.btn-group .btn) {
    border-radius: var(--radius-sm);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.filter-card :global(.btn-group .btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.filter-card :global(.btn-group .btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.filter-card :global(.btn-group .btn-outline-primary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.filter-card :global(.btn-group .btn-outline-primary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.filter-card :global(.text-muted) {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    font-family: var(--font-family-sans);
}

.attendance-tabs {
    margin-top: var(--spacing-2);
}

.attendance-tabs .tabs {
    display: flex;
    gap: var(--spacing-2);
    background: transparent;
    padding: var(--spacing-2);
    border-bottom: 1px solid var(--color-border);
    overflow-x: auto;
}

.attendance-tabs .tab {
    border: 1px solid transparent;
    background: transparent;
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-base);
    white-space: nowrap;
    font-family: var(--font-family-sans);
}

.attendance-tabs .tab i {
    font-size: 18px;
    line-height: 1;
}

.attendance-tabs .tab.active {
    background: var(--color-primary);
    color: var(--color-text-inverse);
    border-color: var(--color-primary);
}

.attendance-tabs .tab:hover:not(.active) {
    background: var(--color-card-muted);
    border-color: var(--color-border);
    color: var(--color-heading);
}

@media (max-width: 768px) {
    .attendance-header {
        padding: var(--spacing-4);
    }

    .attendance-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .attendance-header__actions {
        width: 100%;
        justify-content: stretch;

        .btn {
            flex: 1;
        }
    }
}
</style>

