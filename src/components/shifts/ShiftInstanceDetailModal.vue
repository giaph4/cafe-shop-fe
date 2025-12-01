<template>
    <Teleport to="body">
        <div class="modal fade" ref="modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title">Chi tiết ca làm</h5>
                            <p class="text-muted mb-0" v-if="currentInstance">
                                {{ formatDate(currentInstance.shiftDate) }} • {{ formatTime(currentInstance.startTime) }} -
                                {{ formatTime(currentInstance.endTime) }} • {{ currentInstance.templateName }}
                            </p>
                        </div>
                        <button type="button" class="btn-close" @click="hide"></button>
                    </div>

                    <div class="modal-body" v-if="currentInstance">
                        <div class="instance-summary mb-4">
                            <div class="d-flex align-items-center gap-3 flex-wrap">
                                <span class="badge bg-primary-subtle text-primary">Trạng thái: {{ translateStatus(currentInstance.status) }}</span>
                                <span class="badge bg-info-subtle text-info" v-if="currentInstance.lockedAt">
                                    Khóa lúc: {{ formatDateTime(currentInstance.lockedAt) }}
                                </span>
                                <span class="badge bg-light text-muted">Tạo bởi: {{ currentInstance.createdBy || 'Hệ thống' }}</span>
                            </div>
                            <p class="mt-3 mb-0" v-if="currentInstance.notes">Ghi chú: {{ currentInstance.notes }}</p>
                        </div>

                        <!-- 
                            Lưu ý: ShiftInstance không có workShiftId, nên không thể lấy active sessions.
                            Active sessions chỉ có thể lấy từ WorkShift, không phải ShiftInstance.
                            Phần này đã được ẩn để tránh lỗi API.
                        -->

                        <section class="assignment-form card mb-4">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <h6 class="mb-1">{{ assignmentForm.assignmentId ? 'Cập nhật phân công' : 'Thêm phân công mới' }}</h6>
                                        <p class="text-muted mb-0">Phân công nhân viên vào ca làm này.</p>
                                    </div>
                                    <button
                                        v-if="assignmentForm.assignmentId"
                                        type="button"
                                        class="btn btn-outline-secondary btn-sm"
                                        @click="resetAssignmentForm"
                                    >
                                        Huỷ chỉnh sửa
                                    </button>
                                </div>

                                <div class="row g-3">
                                    <div class="col-lg-4 col-md-6">
                                        <label class="form-label">Nhân viên <span class="text-danger">*</span></label>
                                        <select class="form-select" v-model.number="assignmentForm.userId" :disabled="assignmentFormLoading">
                                            <option :value="null">Chọn nhân viên</option>
                                            <option v-for="staff in staffOptions" :key="staff.id" :value="staff.id">
                                                {{ staff.fullName || staff.username }} ({{ staff.username }})
                                            </option>
                                        </select>
                                    </div>
                                    <div class="col-lg-3 col-md-6">
                                        <label class="form-label">Vai trò</label>
                                        <input class="form-control" v-model.trim="assignmentForm.roleName" maxlength="50" />
                                    </div>
                                    <div class="col-lg-2 col-md-6">
                                        <label class="form-label">Giờ bắt đầu <span class="text-danger">*</span></label>
                                        <input type="time" class="form-control" v-model="assignmentForm.plannedStart" @change="recomputePlannedMinutes" />
                                    </div>
                                    <div class="col-lg-2 col-md-6">
                                        <label class="form-label">Giờ kết thúc <span class="text-danger">*</span></label>
                                        <input type="time" class="form-control" v-model="assignmentForm.plannedEnd" @change="recomputePlannedMinutes" />
                                    </div>
                                    <div class="col-lg-1 col-md-6">
                                        <label class="form-label">Phút</label>
                                        <input type="number" class="form-control" min="15" step="5" v-model.number="assignmentForm.plannedMinutes" />
                                    </div>
                                </div>

                                <div class="row g-3 mt-1">
                                    <div class="col-lg-3 col-md-6">
                                        <label class="form-label">Lương giờ</label>
                                        <input type="number" class="form-control" min="0" step="1000" v-model.number="assignmentForm.hourlyRate" />
                                    </div>
                                    <div class="col-lg-3 col-md-6">
                                        <label class="form-label">Phụ cấp cố định</label>
                                        <input type="number" class="form-control" min="0" step="1000" v-model.number="assignmentForm.fixedAllowance" />
                                    </div>
                                    <div class="col-12">
                                        <label class="form-label">Ghi chú</label>
                                        <textarea class="form-control" rows="2" v-model.trim="assignmentForm.notes" maxlength="255"></textarea>
                                    </div>
                                </div>

                                <div class="mt-3 d-flex justify-content-end">
                                    <button type="button" class="btn btn-primary" :disabled="assignmentFormLoading" @click="submitAssignment">
                                        <span v-if="assignmentFormLoading" class="spinner-border spinner-border-sm me-2"></span>
                                        {{ assignmentForm.assignmentId ? 'Cập nhật' : 'Thêm phân công' }}
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section class="assignment-table card">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h6 class="mb-0">Danh sách phân công</h6>
                                    <button type="button" class="btn btn-outline-primary btn-sm" @click="fetchAssignments(true)" :disabled="assignmentsLoading">
                                        <span v-if="assignmentsLoading" class="spinner-border spinner-border-sm me-2"></span>
                                        Làm mới
                                    </button>
                                </div>

                                <div v-if="assignmentsLoading" class="text-center py-4">
                                    <div class="spinner-border text-primary"></div>
                                </div>
                                <ErrorState
                                    v-else-if="assignmentsError"
                                    :message="assignmentsError"
                                    @retry="fetchAssignments"
                                />
                                <EmptyState
                                    v-else-if="!assignments.length"
                                    title="Chưa có phân công"
                                    message="Thêm nhân viên để bắt đầu ca làm này."
                                />
                                <div v-else class="table-responsive">
                                    <table class="table align-middle">
                                        <thead class="table-light">
                                        <tr>
                                            <th>Nhân viên</th>
                                            <th>Thời gian</th>
                                            <th>Doanh thu</th>
                                            <th>Thưởng/Phạt</th>
                                            <th>Trạng thái</th>
                                            <th class="text-end">Hành động</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        <template v-for="assignment in visibleAssignments" :key="assignment.id">
                                            <tr>
                                                <td>
                                                    <div class="fw-semibold">{{ assignment.fullName || assignment.username }}</div>
                                                    <div class="text-muted small">{{ assignment.username }}</div>
                                                </td>
                                                <td>
                                                    <div>{{ formatTime(assignment.plannedStart) }} - {{ formatTime(assignment.plannedEnd) }} ({{ assignment.plannedMinutes }} phút)</div>
                                                    <div class="text-muted small" v-if="assignment.actualMinutes">
                                                        Thực tế: {{ assignment.actualMinutes }} phút
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>{{ formatCurrency(assignment.totalRevenue ?? 0) }}</div>
                                                    <div class="text-muted small">Lương: {{ formatCurrency(assignment.basePayroll ?? 0) }}</div>
                                                </td>
                                                <td>
                                                    <div class="text-success">+ {{ formatCurrency(assignment.bonusAmount ?? 0) }}</div>
                                                    <div class="text-danger">- {{ formatCurrency(assignment.penaltyAmount ?? 0) }}</div>
                                                </td>
                                                <td>
                                                    <span class="badge" :class="statusClass(assignment.status)">{{ translateAssignmentStatus(assignment.status) }}</span>
                                                </td>
                                                <td class="text-end">
                                                    <div class="action-buttons">
                                                        <button
                                                            class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
                                                            @click="toggleAssignmentDetails(assignment)"
                                                            :title="expandedAssignmentId === assignment.id ? 'Thu gọn' : 'Mở rộng'"
                                                        >
                                                            <i class="bi" :class="expandedAssignmentId === assignment.id ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                                                            <span>{{ expandedAssignmentId === assignment.id ? 'Thu gọn' : 'Mở rộng' }}</span>
                                                        </button>
                                                        <button
                                                            class="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
                                                            @click="editAssignment(assignment)"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <i class="bi bi-pencil"></i>
                                                            <span>Chỉnh sửa</span>
                                                        </button>
                                                        <button
                                                            class="btn btn-outline-info btn-sm d-inline-flex align-items-center gap-2"
                                                            @click="openStatusModal(assignment)"
                                                            title="Cập nhật trạng thái"
                                                        >
                                                            <i class="bi bi-arrow-repeat"></i>
                                                            <span>Trạng thái</span>
                                                        </button>
                                                        <button
                                                            class="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-2"
                                                            @click="removeAssignment(assignment)"
                                                            title="Xóa"
                                                        >
                                                            <i class="bi bi-trash"></i>
                                                            <span>Xóa</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr v-if="expandedAssignmentId === assignment.id">
                                                <td colspan="6">
                                                <div class="assignment-detail border rounded-3 p-3 bg-light-subtle">
                                                    <div class="d-flex justify-content-between align-items-center mb-3">
                                                        <h6 class="mb-0">Chi tiết phân công: {{ assignment.fullName || assignment.username }}</h6>
                                                        <span class="text-muted small">Cập nhật lúc: {{ formatDateTime(assignment.updatedAt) }}</span>
                                                    </div>

                                                    <ul class="nav nav-pills nav-pills-sm mb-3">
                                                        <li class="nav-item">
                                                            <button
                                                                type="button"
                                                                class="nav-link"
                                                                :class="{active: detailTab === 'adjustments'}"
                                                                @click="switchDetailTab('adjustments')"
                                                            >
                                                                Điều chỉnh hiệu suất
                                                            </button>
                                                        </li>
                                                        <li class="nav-item">
                                                            <button
                                                                type="button"
                                                                class="nav-link"
                                                                :class="{active: detailTab === 'attendance'}"
                                                                @click="switchDetailTab('attendance')"
                                                            >
                                                                Chấm công
                                                            </button>
                                                        </li>
                                                    </ul>

                                                    <div v-if="detailTab === 'adjustments'">
                                                        <div class="row g-3 align-items-end mb-3">
                                                            <div class="col-lg-4">
                                                                <label class="form-label">Loại điều chỉnh</label>
                                                                <select class="form-select" v-model="adjustmentState.form.type">
                                                                    <option v-for="opt in adjustmentTypeOptions" :key="opt.value" :value="opt.value">
                                                                        {{ opt.label }}
                                                                    </option>
                                                                </select>
                                                            </div>
                                                            <div class="col-lg-4">
                                                                <label class="form-label">Số tiền <span class="text-danger">*</span></label>
                                                                <input type="number" class="form-control" min="0" step="1000" v-model="adjustmentState.form.amount" placeholder="VD: 50000" />
                                                            </div>
                                                            <div class="col-lg-4">
                                                                <label class="form-label">Lý do</label>
                                                                <input type="text" class="form-control" maxlength="255" v-model="adjustmentState.form.reason" placeholder="Ghi chú (tuỳ chọn)" />
                                                            </div>
                                                            <div class="col-12 text-end">
                                                                <button
                                                                    type="button"
                                                                    class="btn btn-primary"
                                                                    :disabled="adjustmentState.submitting"
                                                                    @click="submitAdjustment()"
                                                                >
                                                                    <span v-if="adjustmentState.submitting" class="spinner-border spinner-border-sm me-2"></span>
                                                                    Thêm điều chỉnh
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div v-if="adjustmentState.loading" class="text-center py-3">
                                                            <div class="spinner-border text-primary"></div>
                                                        </div>
                                                        <div v-else>
                                                            <ErrorState
                                                                v-if="adjustmentState.error"
                                                                :message="adjustmentState.error"
                                                                @retry="() => loadAdjustmentData(expandedAssignment.value?.id)"
                                                            />
                                                            <EmptyState
                                                                v-else-if="!adjustmentState.list.length"
                                                                title="Chưa có điều chỉnh"
                                                                message="Thêm thưởng/phạt để cập nhật bảng lương."
                                                            />
                                                            <div v-else class="table-responsive">
                                                                <table class="table table-sm align-middle">
                                                                    <thead class="table-light">
                                                                        <tr>
                                                                            <th>Loại</th>
                                                                            <th>Số tiền</th>
                                                                            <th>Ghi chú</th>
                                                                            <th>Trạng thái</th>
                                                                            <th>Thời gian</th>
                                                                            <th class="text-end">Hành động</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        <tr v-for="adj in adjustmentState.list" :key="adj.id">
                                                                            <td>{{ formatAdjustmentType(adj.type) }}</td>
                                                                            <td>{{ formatCurrency(adj.amount ?? 0) }}</td>
                                                                            <td>{{ adj.reason || '-' }}</td>
                                                                            <td>
                                                                                <span class="badge" :class="adj.revoked ? 'bg-secondary' : 'bg-success'">
                                                                                    {{ adj.revoked ? 'Đã thu hồi' : 'Hiệu lực' }}
                                                                                </span>
                                                                            </td>
                                                                            <td>
                                                                                <div class="small text-muted">Tạo: {{ formatDateTime(adj.createdAt) }}</div>
                                                                                <div class="small text-muted" v-if="adj.revokedAt">Thu hồi: {{ formatDateTime(adj.revokedAt) }}</div>
                                                                            </td>
                                                                            <td class="text-end">
                                                                                <div class="btn-group btn-group-sm">
                                                                                    <button
                                                                                        type="button"
                                                                                        class="btn btn-outline-warning"
                                                                                        v-if="!adj.revoked"
                                                                                        @click="revokeAdjustmentRecord(adj)"
                                                                                    >
                                                                                        Thu hồi
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        class="btn btn-outline-danger"
                                                                                        @click="deleteAdjustmentRecord(adj)"
                                                                                    >
                                                                                        Xoá
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div v-else>
                                                        <div class="row g-3 align-items-end mb-3">
                                                            <div class="col-lg-4">
                                                                <label class="form-label">Nguồn chấm công</label>
                                                                <select class="form-select" v-model="attendanceState.form.source">
                                                                    <option v-for="opt in attendanceSourceOptions" :key="opt.value" :value="opt.value">
                                                                        {{ opt.label }}
                                                                    </option>
                                                                </select>
                                                            </div>
                                                            <div class="col-lg-8">
                                                                <label class="form-label">Ghi chú</label>
                                                                <input type="text" class="form-control" maxlength="255" v-model="attendanceState.form.note" placeholder="Ghi chú (tuỳ chọn)" />
                                                            </div>
                                                            <div class="col-12 d-flex gap-2 justify-content-end">
                                                                <button
                                                                    type="button"
                                                                    class="btn btn-outline-success"
                                                                    :disabled="attendanceState.submitting"
                                                                    @click="submitAttendance('check-in')"
                                                                >
                                                                    <span v-if="attendanceState.submitting && attendanceState.action === 'check-in'" class="spinner-border spinner-border-sm me-2"></span>
                                                                    Check-in
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    class="btn btn-outline-danger"
                                                                    :disabled="attendanceState.submitting"
                                                                    @click="submitAttendance('check-out')"
                                                                >
                                                                    <span v-if="attendanceState.submitting && attendanceState.action === 'check-out'" class="spinner-border spinner-border-sm me-2"></span>
                                                                    Check-out
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div v-if="attendanceState.loading" class="text-center py-3">
                                                            <div class="spinner-border text-primary"></div>
                                                        </div>
                                                        <div v-else>
                                                            <ErrorState
                                                                v-if="attendanceState.error"
                                                                :message="attendanceState.error"
                                                                @retry="() => loadAttendanceData(expandedAssignment.value?.id)"
                                                            />
                                                            <EmptyState
                                                                v-else-if="!attendanceState.list.length"
                                                                title="Chưa có chấm công"
                                                                message="Thực hiện check-in để bắt đầu theo dõi thời gian."
                                                            />
                                                            <div v-else class="table-responsive">
                                                                <table class="table table-sm align-middle">
                                                                    <thead class="table-light">
                                                                        <tr>
                                                                            <th>Check-in</th>
                                                                            <th>Check-out</th>
                                                                            <th>Trễ / về sớm</th>
                                                                            <th>Nguồn</th>
                                                                            <th>Ghi chú</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        <tr v-for="record in attendanceState.list" :key="record.id">
                                                                            <td>{{ formatDateTime(record.checkInAt) }}</td>
                                                                            <td>{{ record.checkOutAt ? formatDateTime(record.checkOutAt) : '-' }}</td>
                                                                            <td>
                                                                                <div class="small">Trễ: {{ record.lateMinutes ?? 0 }} phút</div>
                                                                                <div class="small">Về sớm: {{ record.earlyLeaveMinutes ?? 0 }} phút</div>
                                                                            </td>
                                                                            <td>{{ formatAttendanceSource(record.source) }}</td>
                                                                            <td>{{ record.note || '-' }}</td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                </td>
                                            </tr>
                                        </template>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" @click="hide">Đóng</button>
                    </div>
                    </div>
                </div>
            </div>
        </Teleport>

        <ShiftAssignmentStatusUpdateModal
            ref="statusUpdateModalRef"
            :status-options="ASSIGNMENT_STATUSES"
            @submit="handleAssignmentStatusUpdate"
        />
    </template>

<script setup>
import {computed, onBeforeUnmount, onMounted, reactive, ref, watch} from 'vue'
import {storeToRefs} from 'pinia'
import {Modal} from 'bootstrap'
import {toast} from 'vue3-toastify'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import ShiftAssignmentStatusUpdateModal from '@/components/shifts/ShiftAssignmentStatusUpdateModal.vue'
import {
    ASSIGNMENT_STATUSES,
    ADJUSTMENT_TYPES,
    ATTENDANCE_SOURCES,
    createShiftAssignment,
    deleteShiftAssignment,
    getAssignmentsForShift,
    updateShiftAssignment,
    updateShiftAssignmentStatus,
    getShiftInstance,
    getAdjustmentsByAssignment,
    createAdjustment,
    revokeAdjustment,
    deleteAdjustment,
    getAttendanceByAssignment,
    checkInAttendance,
    checkOutAttendance
} from '@/api/shiftService'
import {getUsers} from '@/api/userService'
import {formatCurrency, formatDate, formatDateTime} from '@/utils/formatters'
import {useShiftSessionStore} from '@/store/shiftSession'
import logger from '@/utils/logger'

const modal = ref(null)
let modalInstance = null

const currentInstance = ref(null)
const assignments = ref([])
const assignmentsLoading = ref(false)
const assignmentsError = ref(null)
const assignmentFormLoading = ref(false)

const staffOptions = ref([])

const shiftSessionStore = useShiftSessionStore()
const {lastEvent, realtimeConnected, realtimeConnecting, realtimeError} = storeToRefs(shiftSessionStore)

// ShiftInstance không có workShiftId, nên không thể lấy active sessions
// Active sessions chỉ có thể lấy từ WorkShift, không phải ShiftInstance
const activeSessions = computed(() => [])

const sessionListLoading = computed(() => false)

const sessionListError = computed(() => null)

const realtimeStatus = computed(() => {
    if (realtimeConnecting.value) return {label: 'Đang kết nối…', variant: 'bg-warning text-dark'}
    if (realtimeConnected.value) return {label: 'Realtime đã kết nối', variant: 'bg-success'}
    return {label: 'Chưa kết nối realtime', variant: 'bg-secondary'}
})

const realtimeErrorMessage = computed(() => {
    const error = realtimeError.value
    if (!error) return ''
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    if (error?.body) {
        try {
            const parsed = JSON.parse(error.body)
            if (parsed?.message) return parsed.message
        } catch (parseError) {
            return String(error.body)
        }
    }
    if (error?.headers?.message) return error.headers.message
    return 'Không thể kết nối realtime.'
})

const assignmentForm = reactive({
    assignmentId: null,
    userId: null,
    roleName: '',
    plannedStart: '',
    plannedEnd: '',
    plannedMinutes: 0,
    hourlyRate: null,
    fixedAllowance: null,
    notes: ''
})

const expandedAssignmentId = ref(null)
const detailTab = ref('adjustments')
const statusUpdateModalRef = ref(null)

const sanitizeAssignments = (list) => (Array.isArray(list) ? list.filter((item) => item && item.id) : [])

const visibleAssignments = computed(() => assignments.value.filter(Boolean))

const expandedAssignment = computed(() =>
    visibleAssignments.value.find((item) => item.id === expandedAssignmentId.value) || null
)

const adjustmentTypeOptions = ADJUSTMENT_TYPES
const attendanceSourceOptions = ATTENDANCE_SOURCES

const adjustmentState = reactive({
    assignmentId: null,
    loading: false,
    list: [],
    form: {
        type: adjustmentTypeOptions[0]?.value ?? 'BONUS',
        amount: '',
        reason: ''
    },
    submitting: false,
    error: null,
    processingId: null
})

const attendanceState = reactive({
    assignmentId: null,
    loading: false,
    list: [],
    form: {
        source: attendanceSourceOptions[0]?.value ?? 'MANUAL',
        note: ''
    },
    submitting: false,
    error: null,
    action: null
})

const forceSubmitting = (sessionId) => shiftSessionStore.isForceSubmitting(sessionId)

// ShiftInstance không có workShiftId, nên không thể lấy active sessions
const loadActiveSessions = async () => {
    // Không làm gì vì ShiftInstance không có workShiftId
    // Active sessions chỉ có thể lấy từ WorkShift
}

const promptForceEndSession = async (session) => {
    if (!session?.id) return
    const reason = window.prompt('Nhập lý do kết thúc ca cưỡng bức (bắt buộc):')
    if (!reason) {
        toast.warning('Cần nhập lý do để kết thúc ca cưỡng bức.')
        return
    }
    try {
        await shiftSessionStore.forceEndSession(session.id, reason)
        toast.success(`Đã kết thúc ca của ${session.fullName || session.username || 'nhân viên'}.`)
    } catch (error) {
        toast.error(error.message || 'Không thể kết thúc ca.')
    }
}

watch(
    () => currentInstance.value?.id,
    (nextId, prevId) => {
        if (nextId && nextId !== prevId) {
            loadActiveSessions()
        }
    }
)

watch(lastEvent, (event) => {
        if (!event?.session?.workShiftId || !currentInstance.value?.id) return
        if (event.session.workShiftId !== currentInstance.value.id) return
        if (event.type === 'SESSION_STARTED') {
            toast.info(`Nhân viên ${event.session.fullName || event.session.username || '#'+event.session.userId} đã bắt đầu ca.`)
        }
        if (event.type === 'SESSION_ENDED' || event.type === 'SESSION_FORCED') {
            const verb = event.type === 'SESSION_FORCED' ? 'kết thúc cưỡng bức' : 'kết thúc'
            toast.info(`Ca của ${event.session.fullName || event.session.username || '#'+event.session.userId} đã ${verb}.`)
        }
})

const resetDetailStates = () => {
    expandedAssignmentId.value = null
    detailTab.value = 'adjustments'

    adjustmentState.assignmentId = null
    adjustmentState.loading = false
    adjustmentState.list = []
    adjustmentState.error = null
    adjustmentState.submitting = false
    adjustmentState.processingId = null
    adjustmentState.form.type = adjustmentTypeOptions[0]?.value ?? adjustmentState.form.type
    adjustmentState.form.amount = ''
    adjustmentState.form.reason = ''

    attendanceState.assignmentId = null
    attendanceState.loading = false
    attendanceState.list = []
    attendanceState.error = null
    attendanceState.submitting = false
    attendanceState.action = null
    attendanceState.form.source = attendanceSourceOptions[0]?.value ?? attendanceState.form.source
    attendanceState.form.note = ''
}

const loadAdjustmentData = async (assignmentId) => {
    adjustmentState.assignmentId = assignmentId
    adjustmentState.loading = true
    adjustmentState.error = null
    try {
        const data = await getAdjustmentsByAssignment(assignmentId)
        adjustmentState.list = Array.isArray(data) ? data : []
    } catch (err) {
        adjustmentState.error = err.response?.data?.message || 'Không thể tải điều chỉnh.'
        adjustmentState.list = []
    } finally {
        adjustmentState.loading = false
    }
}

const loadAttendanceData = async (assignmentId) => {
    attendanceState.assignmentId = assignmentId
    attendanceState.loading = true
    attendanceState.error = null
    try {
        const data = await getAttendanceByAssignment(assignmentId)
        attendanceState.list = Array.isArray(data) ? data : []
    } catch (err) {
        attendanceState.error = err.response?.data?.message || 'Không thể tải chấm công.'
        attendanceState.list = []
    } finally {
        attendanceState.loading = false
    }
}

const submitAdjustment = async () => {
    if (!expandedAssignment.value) return
    const amountValue = Number(adjustmentState.form.amount)
    if (!amountValue || amountValue <= 0) {
        toast.warning('Số tiền điều chỉnh phải lớn hơn 0.')
        return
    }

    adjustmentState.submitting = true
    try {
        await createAdjustment({
            assignmentId: expandedAssignment.value.id,
            type: adjustmentState.form.type,
            amount: amountValue,
            reason: adjustmentState.form.reason || null
        })
        toast.success('Đã thêm điều chỉnh.')
        adjustmentState.form.amount = ''
        adjustmentState.form.reason = ''
        await Promise.all([loadAdjustmentData(expandedAssignment.value.id), fetchAssignments(true)])
    } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể thêm điều chỉnh.')
    } finally {
        adjustmentState.submitting = false
    }
}

const revokeAdjustmentRecord = async (adjustment) => {
    const reason = window.prompt('Nhập lý do thu hồi (bắt buộc):')
    if (!reason) {
        toast.warning('Cần nhập lý do để thu hồi.')
        return
    }
    adjustmentState.processingId = adjustment.id
    try {
        await revokeAdjustment(adjustment.id, {reason})
        toast.success('Đã thu hồi điều chỉnh.')
        await Promise.all([loadAdjustmentData(adjustment.assignmentId), fetchAssignments(true)])
    } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể thu hồi điều chỉnh.')
    } finally {
        adjustmentState.processingId = null
    }
}

const deleteAdjustmentRecord = async (adjustment) => {
    const confirmed = window.confirm('Bạn có chắc muốn xoá điều chỉnh này?')
    if (!confirmed) return
    adjustmentState.processingId = adjustment.id
    try {
        await deleteAdjustment(adjustment.id)
        toast.success('Đã xoá điều chỉnh.')
        await Promise.all([loadAdjustmentData(adjustment.assignmentId), fetchAssignments(true)])
    } catch (err) {
        logger.error('Failed to delete adjustment:', err)
        toast.error(err.response?.data?.message || 'Không thể xoá điều chỉnh.')
    } finally {
        adjustmentState.processingId = null
    }
}

const submitAttendance = async (action) => {
    if (!expandedAssignment.value) return
    attendanceState.submitting = true
    attendanceState.action = action
    const payload = {
        assignmentId: expandedAssignment.value.id,
        source: attendanceState.form.source,
        note: attendanceState.form.note || null
    }
    try {
        if (action === 'check-in') {
            await checkInAttendance(payload)
            toast.success('Check-in thành công.')
        } else {
            await checkOutAttendance(payload)
            toast.success('Check-out thành công.')
        }
        attendanceState.form.note = ''
        await Promise.all([loadAttendanceData(expandedAssignment.value.id), fetchAssignments(true)])
    } catch (err) {
        logger.error(`Failed to ${action}:`, err)
        toast.error(err.response?.data?.message || `Không thể ${action === 'check-in' ? 'check-in' : 'check-out'}.`)
    } finally {
        attendanceState.submitting = false
        attendanceState.action = null
    }
}

const formatAdjustmentType = (type) => {
    const found = adjustmentTypeOptions.find((opt) => opt.value === type)
    return found?.label || type
}

const formatAttendanceSource = (source) => {
    const found = attendanceSourceOptions.find((opt) => opt.value === source)
    return found?.label || source
}

const resetAssignmentForm = () => {
    assignmentForm.assignmentId = null
    assignmentForm.userId = null
    assignmentForm.roleName = ''
    assignmentForm.plannedStart = currentInstance.value?.startTime?.slice(0, 5) || ''
    assignmentForm.plannedEnd = currentInstance.value?.endTime?.slice(0, 5) || ''
    assignmentForm.plannedMinutes = 0
    assignmentForm.hourlyRate = null
    assignmentForm.fixedAllowance = null
    assignmentForm.notes = ''
}

const fetchStaffOptions = async () => {
    try {
        const data = await getUsers(0, 100)
        staffOptions.value = data?.content || []
    } catch (err) {
        logger.error('Failed to fetch staff options:', err)
        toast.error('Không thể tải danh sách nhân viên.')
    }
}

const refreshCurrentInstance = async (options = {}) => {
    const {showErrorToast = false} = options
    if (!currentInstance.value?.id) return
    try {
        const data = await getShiftInstance(currentInstance.value.id)
        currentInstance.value = data
    } catch (err) {
        logger.error('Failed to refresh current instance:', err)
        if (showErrorToast) {
            toast.error(err.response?.data?.message || 'Không thể tải chi tiết ca.')
        }
    }
}

const open = async (instance) => {
    currentInstance.value = instance
    resetDetailStates()
    await refreshCurrentInstance({showErrorToast: true})
    resetAssignmentForm()
    await fetchStaffOptions()
    await fetchAssignments()
    await loadActiveSessions()
    modalInstance?.show()
}

const hide = () => modalInstance?.hide()

const fetchAssignments = async (keepDetail = false) => {
    if (!currentInstance.value?.id) return
    assignmentsLoading.value = true
    assignmentsError.value = null
    const previousExpanded = keepDetail ? expandedAssignmentId.value : null
    try {
        const data = await getAssignmentsForShift(currentInstance.value.id)
        assignments.value = sanitizeAssignments(data)

        if (keepDetail && previousExpanded) {
            const stillExists = assignments.value.some((item) => item.id === previousExpanded)
            if (stillExists) {
                expandedAssignmentId.value = previousExpanded
                await refreshExpandedDetails()
            } else {
                resetDetailStates()
            }
        } else if (!keepDetail) {
            resetDetailStates()
        }
    } catch (err) {
        logger.error('Failed to fetch assignments:', err)
        assignmentsError.value = err.response?.data?.message || 'Không thể tải phân công.'
        assignments.value = []
        resetDetailStates()
    } finally {
        assignmentsLoading.value = false
    }
}

const refreshExpandedDetails = async () => {
    if (!expandedAssignmentId.value) return
    const stillExists = visibleAssignments.value.some((item) => item.id === expandedAssignmentId.value)
    if (!stillExists) {
        resetDetailStates()
        return
    }
    if (detailTab.value === 'adjustments') {
        await loadAdjustmentData(expandedAssignmentId.value)
    } else {
        await loadAttendanceData(expandedAssignmentId.value)
    }
}

const computeMinutes = (start, end) => {
    if (!start || !end) return 0
    return Math.max(0, (toMinutes(end) - toMinutes(start)))
}

const toMinutes = (time) => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
}

const recomputePlannedMinutes = () => {
    if (!assignmentForm.plannedStart || !assignmentForm.plannedEnd) return
    const diff = computeMinutes(assignmentForm.plannedStart, assignmentForm.plannedEnd)
    assignmentForm.plannedMinutes = diff > 0 ? diff : assignmentForm.plannedMinutes
}

const validateAssignment = () => {
    if (!assignmentForm.userId) {
        toast.warning('Vui lòng chọn nhân viên.')
        return false
    }
    if (!assignmentForm.plannedStart || !assignmentForm.plannedEnd) {
        toast.warning('Vui lòng nhập giờ bắt đầu và kết thúc.')
        return false
    }
    if (assignmentForm.plannedStart >= assignmentForm.plannedEnd) {
        toast.warning('Giờ bắt đầu phải trước giờ kết thúc.')
        return false
    }
    const minutes = assignmentForm.plannedMinutes || computeMinutes(assignmentForm.plannedStart, assignmentForm.plannedEnd)
    if (minutes < 15) {
        toast.warning('Thời lượng ca tối thiểu là 15 phút.')
        return false
    }
    assignmentForm.plannedMinutes = minutes
    return true
}

const toggleAssignmentDetails = async (assignment) => {
    if (!assignment || !assignment.id) return
    if (expandedAssignmentId.value === assignment.id) {
        resetDetailStates()
        return
    }
    resetDetailStates()
    expandedAssignmentId.value = assignment.id
    detailTab.value = 'adjustments'
    await loadAdjustmentData(assignment.id)
}

const switchDetailTab = async (tab) => {
    if (!expandedAssignmentId.value || detailTab.value === tab) return
    detailTab.value = tab
    if (tab === 'adjustments') {
        await loadAdjustmentData(expandedAssignmentId.value)
    } else {
        await loadAttendanceData(expandedAssignmentId.value)
    }
}

const submitAssignment = async () => {
    if (!currentInstance.value?.id) return
    if (!validateAssignment()) return

    const basePayload = {
        shiftId: currentInstance.value.id,
        userId: assignmentForm.userId,
        roleName: assignmentForm.roleName || null,
        plannedStart: assignmentForm.plannedStart,
        plannedEnd: assignmentForm.plannedEnd,
        plannedMinutes: assignmentForm.plannedMinutes,
        hourlyRate: assignmentForm.hourlyRate || null,
        fixedAllowance: assignmentForm.fixedAllowance || null,
        notes: assignmentForm.notes || null
    }

    assignmentFormLoading.value = true
    try {
        if (assignmentForm.assignmentId) {
            const updatePayload = {
                plannedStart: basePayload.plannedStart,
                plannedEnd: basePayload.plannedEnd,
                plannedMinutes: basePayload.plannedMinutes,
                hourlyRate: basePayload.hourlyRate,
                fixedAllowance: basePayload.fixedAllowance,
                notes: basePayload.notes
            }
            await updateShiftAssignment(assignmentForm.assignmentId, updatePayload)
            toast.success('Đã cập nhật phân công.')
        } else {
            await createShiftAssignment(basePayload)
            toast.success('Đã thêm phân công.')
        }
        await fetchAssignments()
        resetAssignmentForm()
    } catch (err) {
        logger.error('Failed to save assignment:', err)
        toast.error(err.response?.data?.message || 'Không thể lưu phân công. Vui lòng thử lại.')
    } finally {
        assignmentFormLoading.value = false
    }
}

const editAssignment = (assignment) => {
    assignmentForm.assignmentId = assignment.id
    assignmentForm.userId = assignment.userId
    assignmentForm.roleName = assignment.roleName || ''
    assignmentForm.plannedStart = assignment.plannedStart?.slice(0, 5) || ''
    assignmentForm.plannedEnd = assignment.plannedEnd?.slice(0, 5) || ''
    assignmentForm.plannedMinutes = assignment.plannedMinutes || 0
    assignmentForm.hourlyRate = assignment.hourlyRate ?? null
    assignmentForm.fixedAllowance = assignment.fixedAllowance ?? null
    assignmentForm.notes = assignment.notes || ''
}

const promptStatusChange = async (assignment) => {
    if (statusUpdateModalRef.value) {
        statusUpdateModalRef.value.show(assignment)
    }
}

const handleAssignmentStatusUpdate = async (payload) => {
    if (!statusUpdateModalRef.value) return
    statusUpdateModalRef.value.setSubmitting(true)
    try {
        const assignment = visibleAssignments.value.find(a => a.id === expandedAssignmentId.value)
        if (!assignment) {
            toast.error('Không tìm thấy phân công.')
            statusUpdateModalRef.value.setSubmitting(false)
            return
        }
        await updateShiftAssignmentStatus(assignment.id, payload)
        toast.success('Đã cập nhật trạng thái phân công.')
        await fetchAssignments(true)
    } catch (err) {
        logger.error('Failed to update assignment status:', err)
        toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái.')
        statusUpdateModalRef.value.setSubmitting(false)
    }
}

const removeAssignment = async (assignment) => {
    if (!assignment?.id) return
    try {
        await deleteShiftAssignment(assignment.id)
        toast.success('Đã xóa phân công.')
        await fetchAssignments()
    } catch (err) {
        logger.error('Failed to delete assignment:', err)
        toast.error(err.response?.data?.message || 'Không thể xóa phân công.')
    }
}

const translateStatus = (status) => {
    const map = {
        PLANNED: 'Lên kế hoạch',
        LOCKED: 'Đã khóa',
        IN_PROGRESS: 'Đang diễn ra',
        DONE: 'Hoàn thành',
        CANCELLED: 'Đã hủy'
    }
    return map[status] || status
}

const translateAssignmentStatus = (status) => {
    const map = {
        SCHEDULED: 'Đã xếp',
        CONFIRMED: 'Đã xác nhận',
        IN_PROGRESS: 'Đang làm',
        COMPLETED: 'Hoàn thành',
        CANCELLED: 'Đã hủy'
    }
    return map[status] || status
}

const statusClass = (status) => {
    switch (status) {
        case 'COMPLETED':
            return 'bg-success'
        case 'IN_PROGRESS':
            return 'bg-info text-dark'
        case 'CANCELLED':
            return 'bg-danger'
        default:
            return 'bg-secondary'
    }
}

const formatTime = (time) => {
    if (!time) return '--:--'
    return time.length === 5 ? time : time.slice(0, 5)
}

defineExpose({open, hide})

onMounted(() => {
    modalInstance = new Modal(modal.value, {backdrop: 'static'})
})

onBeforeUnmount(() => modalInstance?.dispose())
</script>

<style scoped>
.instance-summary {
    padding: 1rem 1.25rem;
    border: 1px solid var(--color-border);
    border-radius: 14px;
    background: var(--color-card-muted);
}

.assignment-detail {
    border: 1px dashed var(--color-border);
    background: var(--color-card-muted);
}

.assignment-form .card-body {
    background: var(--color-card-muted);
    border-radius: 16px;
}

.assignment-table .card-body {
    border-radius: 16px;
}

.badge {
    font-weight: 600;
}

.session-card .list-group-item {
    border: 1px solid var(--color-border-subtle);
    border-radius: 12px;
}

.action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: flex-end;
    align-items: center;
}

@media (max-width: 992px) {
    .assignment-form .card-body,
    .assignment-table .card-body {
        padding: var(--component-padding-sm);
    }
}

@media (max-width: 768px) {
    .action-buttons {
        flex-direction: column;
        width: 100%;
    }

    .action-buttons .btn {
        width: 100%;
        justify-content: center;
    }

    .instance-summary {
        padding: var(--spacing-4);
    }

    .assignment-detail {
        padding: var(--spacing-3);
    }
}

@media (max-width: 576px) {
    .table-responsive {
        font-size: 0.875rem;
    }
}
</style>
