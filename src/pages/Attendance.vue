<template>
    <div class="attendance-page container-fluid">
        <div class="attendance-header">
            <div class="attendance-header__content">
                <div class="attendance-header__title-section">
                    <h2 class="attendance-header__title">Quản lý Chấm công</h2>
                    <p class="attendance-header__subtitle">
                        Theo dõi và quản lý chấm công của nhân viên, xem lịch sử và thống kê chi tiết.
                    </p>
                </div>
                <div class="attendance-header__actions">
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

        <div class="card filter-card mb-4" v-if="activeTab === 'history' || activeTab === 'statistics'">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-lg-3 col-md-4">
                        <label class="form-label">Từ ngày</label>
                        <input type="date" class="form-control" v-model="filters.startDate" />
                    </div>
                    <div class="col-lg-3 col-md-4">
                        <label class="form-label">Đến ngày</label>
                        <input type="date" class="form-control" v-model="filters.endDate" />
                    </div>
                    <div class="col-lg-4 col-md-6">
                        <label class="form-label">Khoảng thời gian</label>
                        <div class="btn-group w-100" role="group">
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
                    <div class="col-lg-2 col-md-4" v-if="isManagerOrAdmin">
                        <label class="form-label">Nhân viên</label>
                        <select class="form-select" v-model="filters.userId">
                            <option :value="authStore.user?.id">Tôi</option>
                            <option v-for="user in filteredStaffList" :key="user.id" :value="user.id">
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
                            <i :class="tab.icon"></i>
                            <span>{{ tab.label }}</span>
                        </button>
                    </div>

                    <LoadingState v-if="loading && activeTab !== 'overview'" />
                    <ErrorState
                        v-else-if="error"
                        :message="error"
                        @retry="fetchData"
                    />
                    <div v-else class="tab-content">
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
    getAssignmentsForShift,
    getAssignmentsForCurrentUser,
    getAssignmentsByUserId,
    checkInAttendance,
    checkOutAttendance,
    getAttendanceByAssignment,
    getAttendanceByShift,
    ATTENDANCE_SOURCES
} from '@/api/shiftService'
import { getUsers } from '@/api/userService'
import { showError, showSuccess } from '@/utils/toast'
import { formatDateTime } from '@/utils/formatters'
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
const filteredStaffList = computed(() => {
    return staffList.value.filter(user => user.id !== authStore.user?.id)
})

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
            // For now, we'll use the assignment as current session
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
        
        let filteredAssignments = assignments
        
        for (const assignment of filteredAssignments) {
            try {
                const attendance = await getAttendanceByAssignment(assignment.id)
                if (Array.isArray(attendance)) {
                    records.push(...attendance)
                }
            } catch (err) {
                // Bỏ qua lỗi khi fetch attendance cho assignment đơn lẻ
            }
        }
        
        // Filter by date range
        const start = new Date(filters.startDate + 'T00:00:00')
        const end = new Date(filters.endDate + 'T23:59:59')
        
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
        
        let filteredAssignments = assignments
        
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
            } catch (err) {
                // Bỏ qua lỗi khi fetch attendance cho assignment đơn lẻ
            }
        }
        
        // Filter by date range
        const start = new Date(filters.startDate + 'T00:00:00')
        const end = new Date(filters.endDate + 'T23:59:59')
        
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
    } catch (err) {
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
    padding: var(--spacing-6);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-md);
}

.attendance-header__content {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-6);
}

.attendance-header__title-section {
    flex: 1;
    min-width: 0;
}

.attendance-header__title {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-tight);
    margin-bottom: var(--spacing-1);
}

.attendance-header__subtitle {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
}

.attendance-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-3);
    align-items: center;
    justify-content: flex-end;
}

.filter-card,
.tabs-card {
    border-radius: var(--component-radius-lg);
    border: 1px solid var(--color-border);
    box-shadow: var(--component-shadow);
    background: var(--color-card);
}

.attendance-tabs {
    margin-top: var(--spacing-2);
}

.attendance-tabs .tabs {
    display: flex;
    gap: 0.75rem;
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    padding: 0.6rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-soft);
    overflow-x: auto;
}

.attendance-tabs .tab {
    border: none;
    background: transparent;
    padding: 0.75rem 1.35rem;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    font-weight: 600;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
    white-space: nowrap;
}

.attendance-tabs .tab i {
    font-size: 1.15rem;
}

.attendance-tabs .tab.active {
    background: var(--color-soft-primary);
    color: var(--color-primary);
    box-shadow: var(--shadow-md);
}

.attendance-tabs .tab:hover:not(.active) {
    background: var(--color-card-muted);
    transform: translateY(-1px);
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

