<template>
    <div class="attendance-page container-fluid" data-aos="fade-up">
        <div class="page-header card-shadow">
            <div>
                <h2 class="page-title">Quản lý Chấm công</h2>
                <p class="page-subtitle">Theo dõi và quản lý chấm công của nhân viên, xem lịch sử và thống kê chi tiết.</p>
            </div>
            <div class="d-flex flex-wrap gap-2 align-items-center">
                <button class="btn btn-outline-secondary" type="button" @click="fetchData" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    Làm mới
                </button>
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
                        <small class="text-muted d-block mt-1">Lưu ý: Chỉ hiển thị ca làm của nhân viên được chọn</small>
                    </div>
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
                <div v-if="loading && activeTab !== 'overview'" class="state-block py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                </div>
                <div v-else-if="error" class="state-block py-5">
                    <div class="alert alert-danger mb-0">{{ error }}</div>
                </div>
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
    </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch, computed } from 'vue'
import { useAuthStore } from '@/store/auth'
import {
    getAssignmentsForShift,
    getAssignmentsForCurrentUser,
    checkInAttendance,
    checkOutAttendance,
    getAttendanceByAssignment,
    getAttendanceByShift,
    ATTENDANCE_SOURCES
} from '@/api/shiftService'
import { getUsers } from '@/api/userService'
import { showError, showSuccess } from '@/utils/toast'
import { formatDateTime } from '@/utils/formatters'
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
        const assignments = await getAssignmentsForCurrentUser()
        myAssignments.value = Array.isArray(assignments) ? assignments : []
        
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
        console.error(err)
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
        console.error(err)
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
        console.error(err)
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
        
        // Get assignments for current user
        // Note: Backend doesn't have endpoint to get all assignments for admin/manager
        // So we can only get current user's assignments
        const assignments = await getAssignmentsForCurrentUser()
        
        // If admin/manager selected a specific user, filter assignments
        // But since we can only get current user's assignments, this will only work if viewing own data
        let filteredAssignments = assignments
        
        if (isManagerOrAdmin.value && filters.userId && filters.userId !== authStore.user?.id) {
            // If admin/manager selected another user, we can't fetch their assignments
            // This would require a backend endpoint like GET /api/v1/shifts/assignments/user/{userId}
            filteredAssignments = assignments.filter(a => 
                (a.userId === filters.userId) || (a.user?.id === filters.userId)
            )
            
            if (filteredAssignments.length === 0) {
                // No assignments found for selected user (likely because we can only get current user's)
                attendanceRecords.value = []
                return
            }
        }
        
        for (const assignment of filteredAssignments) {
            try {
                const attendance = await getAttendanceByAssignment(assignment.id)
                if (Array.isArray(attendance)) {
                    records.push(...attendance)
                }
            } catch (err) {
                console.warn(`Failed to fetch attendance for assignment ${assignment.id}:`, err)
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
        console.error(err)
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
        
        // Get assignments for current user
        // Note: Backend doesn't have endpoint to get all assignments for admin/manager
        const assignments = await getAssignmentsForCurrentUser()
        
        // If admin/manager selected a specific user, filter assignments
        let filteredAssignments = assignments
        
        if (isManagerOrAdmin.value && filters.userId && filters.userId !== authStore.user?.id) {
            filteredAssignments = assignments.filter(a => 
                (a.userId === filters.userId) || (a.user?.id === filters.userId)
            )
            
            if (filteredAssignments.length === 0) {
                statistics.value = null
                return
            }
        }
        
        for (const assignment of filteredAssignments) {
            try {
                const attendance = await getAttendanceByAssignment(assignment.id)
                if (Array.isArray(attendance)) {
                    records.push(...attendance)
                }
            } catch (err) {
                console.warn(`Failed to fetch attendance for assignment ${assignment.id}:`, err)
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
        console.error(err)
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
        console.error(err)
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

<style scoped>
.attendance-page {
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

.filter-card,
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

