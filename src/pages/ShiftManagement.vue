<template>
    <div class="shifts-page container-fluid" data-aos="fade-up">
        <div class="page-header mb-4">
            <div>
                <h2 class="page-title">Quản lý Ca làm</h2>
                <p class="page-subtitle">Theo dõi ca làm, phân công nhân viên và trạng thái thực hiện.</p>
            </div>
            <div class="d-flex flex-wrap gap-2">
                <button class="btn btn-outline-primary" type="button" @click="openCreateInstance">
                    <i class="bi bi-plus-lg me-2"></i>Tạo ca làm mới
                </button>
            </div>
        </div>

        <div class="card session-control-card mb-4">
            <div class="card-body">
                <div class="d-flex flex-wrap justify-content-between gap-3 align-items-start">
                    <div class="d-flex flex-column gap-1">
                        <h5 class="card-title mb-0">Phiên ca của tôi</h5>
                        <small class="text-muted">Theo dõi và điều khiển trạng thái ca làm realtime.</small>
                        <span class="badge" :class="sessionRealtimeStatus.variant">{{ sessionRealtimeStatus.label }}</span>
                        <small v-if="sessionRealtimeError" class="text-danger">{{ sessionRealtimeError }}</small>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <button class="btn btn-outline-primary btn-sm" type="button" @click="refreshCurrentSession" :disabled="sessionRefreshing">
                            <span v-if="sessionRefreshing" class="spinner-border spinner-border-sm me-2"></span>
                            Làm mới
                        </button>
                    </div>
                </div>

                <div class="mt-3" v-if="currentSession">
                    <div class="session-info row g-3">
                        <div class="col-md-4">
                            <div class="session-info__item">
                                <span class="session-info__label">Work Shift ID</span>
                                <span class="session-info__value">#{{ currentSession.workShiftId || 'N/A' }}</span>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="session-info__item">
                                <span class="session-info__label">Bắt đầu</span>
                                <span class="session-info__value">{{ formatDateTime(currentSession.startAt) || 'Chưa xác định' }}</span>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="session-info__item">
                                <span class="session-info__label">Trạng thái</span>
                                <span class="session-info__value badge bg-success">{{ currentSession.status }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="d-flex flex-wrap gap-2 mt-3">
                        <button class="btn btn-danger" type="button" @click="handleEndSession" :disabled="endSubmitting || sessionRefreshing">
                            <span v-if="endSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                            Kết thúc ca
                        </button>
                    </div>
                </div>

                <div v-else class="session-start-form">
                    <div class="row g-3 align-items-end">
                        <div class="col-lg-4 col-md-6">
                            <label class="form-label">Chọn ca để nhận <span class="text-danger">*</span></label>
                            <select class="form-select" v-model.number="startForm.workShiftId" :disabled="startSubmitting || !instanceOptions.length">
                                <option :value="null">Chọn Work Shift</option>
                                <option v-for="opt in instanceOptions" :key="opt.value" :value="opt.value">
                                    {{ opt.label }}
                                </option>
                            </select>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <label class="form-label">Vượt giới hạn nhân sự</label>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" role="switch" id="sessionAdminOverride" v-model="startForm.adminOverride" :disabled="startSubmitting" />
                                <label class="form-check-label" for="sessionAdminOverride">Cho phép</label>
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <label class="form-label">&nbsp;</label>
                            <button class="btn btn-success w-100" type="button" @click="handleStartSession" :disabled="startSubmitting || !startForm.workShiftId">
                                <span v-if="startSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                                Nhận ca
                            </button>
                        </div>
                    </div>
                    <p v-if="lastActionErrorMessage" class="text-danger mt-2 mb-0">{{ lastActionErrorMessage }}</p>
                </div>
            </div>
        </div>

        <div class="card filter-card mb-4">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label">Từ ngày</label>
                        <input type="date" class="form-control" v-model="filters.from" />
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label">Đến ngày</label>
                        <input type="date" class="form-control" v-model="filters.to" />
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label">Trạng thái</label>
                        <select class="form-select" v-model="filters.status">
                            <option value="">Tất cả</option>
                            <option v-for="option in SHIFT_STATUSES" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                    <div class="col-lg-3 col-md-6 text-lg-end text-md-start">
                        <button class="btn btn-primary me-2" type="button" @click="fetchInstances">
                            <i class="bi bi-funnel me-1"></i>Lọc
                        </button>
                        <button class="btn btn-outline-secondary" type="button" @click="resetFilters">Xóa bộ lọc</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-4 mb-4">
            <div class="col-12 col-xl-7">
                <div class="card calendar-card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                            <div>
                                <h5 class="card-title mb-1">Lịch ca làm</h5>
                                <p class="text-muted mb-0">Đánh dấu ngày có ca và xem nhanh lịch trình.</p>
                            </div>
                            <div class="calendar-nav d-flex align-items-center gap-2">
                                <button class="btn btn-outline-secondary btn-sm" type="button" @click="changeMonth(-1)" :disabled="calendarLoading">
                                    <i class="bi bi-chevron-left"></i>
                                </button>
                                <span class="fw-semibold text-nowrap">{{ calendarTitle }}</span>
                                <button class="btn btn-outline-secondary btn-sm" type="button" @click="changeMonth(1)" :disabled="calendarLoading">
                                    <i class="bi bi-chevron-right"></i>
                                </button>
                            </div>
                        </div>

                        <div v-if="calendarError" class="alert alert-warning mb-0">
                            {{ calendarError }}
                        </div>
                        <div v-else>
                            <div v-if="calendarLoading" class="text-center py-4">
                                <div class="spinner-border text-primary"></div>
                            </div>
                            <div v-else>
                                <div class="calendar-grid mb-3">
                                    <div class="calendar-weekday" v-for="day in WEEK_DAYS" :key="day">{{ day }}</div>
                                    <button
                                        v-for="day in calendarCells"
                                        :key="day.dateKey"
                                        type="button"
                                        class="calendar-day"
                                        :class="{
                                            'is-outside': !day.inCurrentMonth,
                                            'is-today': day.isToday,
                                            'is-selected': calendarState.selectedDate === day.dateKey,
                                            'has-shift': day.hasShifts
                                        }"
                                        @click="handleSelectDay(day)"
                                    >
                                        <span class="day-number">{{ day.label }}</span>
                                        <span v-if="day.hasShifts" class="calendar-indicator"></span>
                                    </button>
                                </div>

                                <div class="selected-day">
                                    <h6 class="mb-3">Ca trong ngày {{ selectedDateLabel }}</h6>
                                    <div v-if="!calendarSelectedShifts.length" class="selected-day__empty text-muted text-center py-3">
                                        Chưa có ca nào. Hãy thêm ca mới cho ngày này.
                                    </div>
                                    <div v-else class="list-group list-group-flush rounded-3">
                                        <div class="list-group-item" v-for="shift in calendarSelectedShifts" :key="shift.id">
                                            <div class="d-flex justify-content-between align-items-start gap-2">
                                                <div>
                                                    <div class="fw-semibold">{{ shift.templateName || 'Ca linh hoạt' }}</div>
                                                    <div class="text-muted small">{{ formatTime(shift.startTime) }} - {{ formatTime(shift.endTime) }}</div>
                                                    <div class="text-muted small" v-if="shift.assignments?.length">
                                                        {{ shift.assignments.length }} phân công
                                                    </div>
                                                </div>
                                                <button class="btn btn-outline-primary btn-sm" type="button" @click="openDetail(shift)">
                                                    <i class="bi bi-eye"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-12 col-xl-5">
                <div class="card template-card h-100">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                            <div>
                                <h5 class="card-title mb-1">Ca mẫu</h5>
                                <p class="text-muted mb-0">Quản lý khung giờ chuẩn để lập lịch nhanh.</p>
                            </div>
                            <button class="btn btn-primary btn-sm" type="button" @click="openCreateTemplate">
                                <i class="bi bi-plus-lg me-1"></i>Tạo ca mẫu
                            </button>
                        </div>

                        <div v-if="templateError" class="alert alert-warning flex-shrink-0">
                            {{ templateError }}
                        </div>
                        <div v-else-if="templateLoading" class="flex-grow-1 d-flex align-items-center justify-content-center">
                            <div class="spinner-border text-primary"></div>
                        </div>
                        <div v-else-if="!templates.length" class="template-empty flex-grow-1 d-flex align-items-center justify-content-center text-muted text-center py-4">
                            Chưa có ca mẫu nào. Tạo ca mẫu để tái sử dụng khi lên lịch.
                        </div>
                        <div v-else class="template-list flex-grow-1 overflow-auto">
                            <div class="list-group list-group-flush">
                                <div class="list-group-item template-item" v-for="template in templates" :key="template.id">
                                    <div class="d-flex justify-content-between align-items-start gap-3">
                                        <div>
                                            <div class="fw-semibold">{{ template.name }}</div>
                                            <div class="text-muted small">{{ formatTime(template.startTime) }} - {{ formatTime(template.endTime) }}</div>
                                            <div class="text-muted small" v-if="template.requiredRoles?.length">
                                                Vai trò: {{ template.requiredRoles.join(', ') }}
                                            </div>
                                            <div class="text-muted small" v-if="template.updatedAt">
                                                Cập nhật: {{ formatDateTime(template.updatedAt) }}
                                            </div>
                                        </div>
                                        <div class="btn-group btn-group-sm">
                                            <button class="btn btn-outline-secondary" type="button" @click="openEditTemplate(template)">
                                                <i class="bi bi-pencil"></i>
                                            </button>
                                            <button class="btn btn-outline-danger" type="button" @click="removeTemplate(template)">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer" v-if="templatePage.totalPages > 1">
                        <Pagination
                            mode="zero-based"
                            :current-page="templatePage.number"
                            :total-pages="templatePage.totalPages"
                            @page-change="handleTemplatePageChange"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div class="card table-card">
            <div class="card-body">
                <div v-if="loading" class="text-center py-5">
                    <div class="spinner-border text-primary"></div>
                </div>
                <div v-else-if="error" class="alert alert-warning d-flex align-items-center gap-2">
                    <i class="bi bi-exclamation-triangle"></i>
                    <span>{{ error }}</span>
                </div>
                <EmptyState
                    v-else-if="!instances.length"
                    title="Chưa có ca làm nào"
                    message="Tạo ca mới bằng nút ở góc trên bên phải."
                />
                <div v-else class="table-responsive">
                    <table class="table align-middle">
                        <thead class="table-light">
                        <tr>
                            <th>Ngày</th>
                            <th>Giờ</th>
                            <th>Template</th>
                            <th>Trạng thái</th>
                            <th>Phân công</th>
                            <th class="text-end">Hành động</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="instance in instances" :key="instance.id">
                            <td>
                                <div class="fw-semibold">{{ formatDate(instance.shiftDate) }}</div>
                                <div class="text-muted small">Tạo bởi {{ instance.createdBy || 'Hệ thống' }}</div>
                            </td>
                            <td>
                                {{ formatTime(instance.startTime) }} - {{ formatTime(instance.endTime) }}
                                <div class="text-muted small" v-if="instance.notes">{{ instance.notes }}</div>
                            </td>
                            <td>
                                <div class="fw-semibold">{{ instance.templateName }}</div>
                                <div class="text-muted small">ID: {{ instance.templateId }}</div>
                            </td>
                            <td>
                                <span class="badge" :class="statusClass(instance.status)">
                                    {{ translateStatus(instance.status) }}
                                </span>
                            </td>
                            <td>
                                <div class="fw-semibold">{{ instance.assignments?.length || 0 }} nhân viên</div>
                                <div class="text-muted small">
                                    {{ summarizeAssignments(instance.assignments) }}
                                </div>
                            </td>
                            <td class="text-end">
                                <div class="btn-group">
                                    <button class="btn btn-sm btn-outline-primary" @click="openDetail(instance)">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-secondary" @click="openEditInstance(instance)">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-success" @click="promptStatusUpdate(instance)">
                                        <i class="bi bi-arrow-repeat"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" @click="removeInstance(instance)">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="card-footer d-flex justify-content-end" v-if="instancePagination.totalPages > 1">
                <Pagination
                    mode="zero-based"
                    :current-page="instancePagination.number"
                    :total-pages="instancePagination.totalPages"
                    @page-change="handlePageChange"
                />
            </div>
        </div>

        <ShiftInstanceFormModal
            ref="formModal"
            :templates="templateOptions"
            :instance="editingInstance"
            :submitting="formSubmitting"
            @submit="handleFormSubmit"
        />

        <ShiftTemplateFormModal
            ref="templateModal"
            :template="editingTemplate"
            :submitting="templateSubmitting"
            @submit="handleTemplateSubmit"
        />

        <ShiftInstanceDetailModal ref="detailModal" />
    </div>
</template>

<script setup>
import {computed, onMounted, reactive, ref, watch} from 'vue'
import {storeToRefs} from 'pinia'
import {onBeforeRouteLeave, useRoute, useRouter} from 'vue-router'
import EmptyState from '@/components/common/EmptyState.vue'
import Pagination from '@/components/common/Pagination.vue'
import ShiftInstanceFormModal from '@/components/shifts/ShiftInstanceFormModal.vue'
import ShiftTemplateFormModal from '@/components/shifts/ShiftTemplateFormModal.vue'
import ShiftInstanceDetailModal from '@/components/shifts/ShiftInstanceDetailModal.vue'
import {
    SHIFT_STATUSES,
    listShiftInstances,
    deleteShiftInstance,
    updateShiftInstanceStatus,
    createShiftInstances,
    updateShiftInstance,
    getShiftTemplates,
    getShiftTemplate,
    createShiftTemplate,
    updateShiftTemplate,
    deleteShiftTemplate
} from '@/api/shiftService'
import {toast} from 'vue3-toastify'
import {formatDate, formatDateTime} from '@/utils/formatters'
import {PaginationMode, usePagination} from '@/composables/usePagination'
import {useShiftSessionStore} from '@/store/shiftSession'

const WEEK_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const CALENDAR_FETCH_SIZE = 200

const formatDateKey = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const parseDateKey = (key) => {
    if (!key) return null
    const [year, month, day] = key.split('-').map(Number)
    return new Date(year, month - 1, day)
}

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1)
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0)

const TODAY_KEY = formatDateKey(new Date())

const filters = reactive({
    from: '',
    to: '',
    status: ''
})

const loading = ref(false)
const error = ref(null)
const instances = ref([])

const templateOptions = ref([])
const formModal = ref(null)
const templateModal = ref(null)
const detailModal = ref(null)
const editingInstance = ref(null)
const formSubmitting = ref(false)
const editingTemplate = ref(null)
const templateSubmitting = ref(false)

const templates = ref([])
const templateLoading = ref(false)
const templateError = ref(null)
const templatePage = ref({
    number: 0,
    size: 10,
    totalPages: 0,
    totalElements: 0
})

const calendarLoading = ref(false)
const calendarError = ref(null)
const calendarState = reactive({
    baseDate: startOfMonth(new Date()),
    selectedDate: TODAY_KEY,
    data: {}
})

const shiftSessionStore = useShiftSessionStore()
const {
    currentSession,
    currentLoading,
    startSubmitting,
    endSubmitting,
    lastActionError,
    realtimeConnected,
    realtimeConnecting,
    realtimeError,
    lastEvent
} = storeToRefs(shiftSessionStore)

const sessionRefreshing = computed(() => currentLoading.value)

const startForm = reactive({
    workShiftId: null,
    adminOverride: false
})

const instanceOptions = computed(() =>
    instances.value.map((instance) => ({
        value: instance.id ?? null,
        label: instance.templateName
            ? `${instance.templateName} • ${formatDate(instance.shiftDate)} • ${formatTime(instance.startTime)}-${formatTime(instance.endTime)}`
            : `WorkShift #${instance.id}`
    })).filter((item) => item.value !== null)
)

const sessionRealtimeStatus = computed(() => {
    if (realtimeConnecting.value) return { label: 'Đang kết nối realtime…', variant: 'bg-warning text-dark' }
    if (realtimeConnected.value) return { label: 'Realtime đã kết nối', variant: 'bg-success' }
    return { label: 'Chưa kết nối realtime', variant: 'bg-secondary' }
})

const sessionRealtimeError = computed(() => {
    const error = realtimeError.value
    if (!error) return ''
    if (typeof error === 'string') return error
    if (error.message) return error.message
    if (error.body) {
        try {
            const parsed = JSON.parse(error.body)
            if (parsed?.message) return parsed.message
        } catch (parseErr) {
            return String(error.body)
        }
    }
    if (error.headers?.message) return error.headers.message
    return 'Không thể kết nối realtime.'
})

const lastActionErrorMessage = computed(() => {
    const err = lastActionError.value
    if (!err) return ''
    return err.message || 'Đã xảy ra lỗi khi thao tác ca làm.'
})

const refreshCurrentSession = async () => {
    try {
        await shiftSessionStore.loadCurrentSession()
    } catch (error) {
        console.error(error)
        toast.error(error.message || 'Không thể làm mới phiên ca.')
    }
}

const handleStartSession = async () => {
    if (!startForm.workShiftId) {
        toast.warning('Vui lòng chọn Work Shift trước khi nhận ca.')
        return
    }
    try {
        const session = await shiftSessionStore.startSession({
            workShiftId: startForm.workShiftId,
            adminOverride: startForm.adminOverride
        })
        toast.success('Đã bắt đầu ca làm.')
        await shiftSessionStore.fetchActiveSessions(startForm.workShiftId)
        await fetchInstances()
        await fetchCalendarData()
        if (!currentSession.value) {
            await refreshCurrentSession()
        }
    } catch (error) {
        console.error(error)
        toast.error(error.message || 'Không thể bắt đầu ca làm.')
    }
}

const handleEndSession = async () => {
    try {
        await shiftSessionStore.endSession()
        toast.success('Đã kết thúc ca làm.')
        await fetchInstances()
        await fetchCalendarData()
    } catch (error) {
        console.error(error)
        toast.error(error.message || 'Không thể kết thúc ca làm.')
    }
}

const calendarTitle = computed(() =>
    calendarState.baseDate.toLocaleString('vi-VN', {month: 'long', year: 'numeric'})
)

const calendarCells = computed(() => {
    const monthStart = startOfMonth(calendarState.baseDate)
    const leading = (monthStart.getDay() + 6) % 7 // convert Sunday=0 to Monday=0 system
    const gridStart = new Date(monthStart)
    gridStart.setDate(gridStart.getDate() - leading)
    const cells = []
    for (let i = 0; i < 42; i += 1) {
        const current = new Date(gridStart)
        current.setDate(gridStart.getDate() + i)
        const dateKey = formatDateKey(current)
        cells.push({
            dateKey,
            label: current.getDate(),
            inCurrentMonth: current.getMonth() === calendarState.baseDate.getMonth(),
            isToday: dateKey === TODAY_KEY,
            hasShifts: (calendarState.data[dateKey]?.length ?? 0) > 0
        })
    }
    return cells
})

const calendarSelectedShifts = computed(() => {
    const list = calendarState.data[calendarState.selectedDate] || []
    return [...list].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
})

const selectedDateLabel = computed(() => {
    const date = parseDateKey(calendarState.selectedDate)
    return date ? formatDate(date) : ''
})

const fetchTemplateOptions = async () => {
    try {
        const data = await getShiftTemplates({page: 0, size: 100})
        templateOptions.value = data?.content || []
    } catch (err) {
        console.error(err)
        toast.error('Không thể tải template ca làm.')
        templateOptions.value = []
    }
}

const router = useRouter()
const route = useRoute()

const {
    zeroBasedPage: instancePage,
    pageSize: instancePageSize,
    totalPages: instanceTotalPages,
    setPageFromZero: setInstancePage,
    updatePageSize: updateInstancePageSize,
    updateFromResponse: updateInstanceFromResponse,
    rememberCurrent: rememberInstancePage,
    syncQuery: syncInstanceQuery
} = usePagination({
    mode: PaginationMode.ZERO_BASED,
    pageSize: 20,
    persistKey: 'shifts:instances'
})

const instancePagination = computed(() => ({
    number: instancePage.value,
    size: instancePageSize.value,
    totalPages: instanceTotalPages.value
}))

const templatePagination = usePagination({
    mode: PaginationMode.ZERO_BASED,
    pageSize: 5,
    persistKey: 'shifts:templates'
})

const {
    zeroBasedPage: templatePageIndex,
    pageSize: templatePageSize,
    totalPages: templateTotalPages,
    totalElements: templateTotalElements,
    setPageFromZero: setTemplatePage,
    updateFromResponse: updateTemplateFromResponse,
    rememberCurrent: rememberTemplatePage,
    syncQuery: syncTemplateQuery
} = templatePagination

syncInstanceQuery(route, router, {
    queryMode: PaginationMode.ZERO_BASED,
    pageParam: 'instancePage',
    sizeParam: 'instanceSize'
})

syncTemplateQuery(route, router, {
    queryMode: PaginationMode.ZERO_BASED,
    pageParam: 'templatePage',
    sizeParam: 'templateSize'
})

onBeforeRouteLeave(() => {
    rememberInstancePage()
    rememberTemplatePage()
})

let suppressInstanceFetch = false
let suppressTemplateFetch = false

const buildFilterParams = () => ({
    page: instancePage.value,
    size: instancePageSize.value,
    from: filters.from || undefined,
    to: filters.to || undefined,
    status: filters.status || undefined
})

const fetchInstances = async () => {
    loading.value = true
    error.value = null
    try {
        const data = await listShiftInstances(buildFilterParams())
        instances.value = data?.content || []

        if (!startForm.workShiftId && instances.value.length) {
            startForm.workShiftId = instances.value[0]?.id ?? null
        }

        suppressInstanceFetch = true
        const {adjusted} = updateInstanceFromResponse({
            page: data?.number,
            totalPages: data?.totalPages,
            totalElements: data?.totalElements
        })
        suppressInstanceFetch = false

        if (adjusted) {
            toast.info('Trang danh sách ca làm đã được điều chỉnh theo dữ liệu hiện có.', {autoClose: 2500})
        }
    } catch (err) {
        console.error(err)
        error.value = err.response?.data?.message || 'Không thể tải danh sách ca làm.'
        instances.value = []
    } finally {
        loading.value = false
    }
}

const fetchTemplates = async () => {
    templateLoading.value = true
    templateError.value = null
    try {
        const data = await getShiftTemplates({
            page: templatePageIndex.value,
            size: templatePageSize.value
        })
        templates.value = data?.content || []
        suppressTemplateFetch = true
        const { adjusted, totalPages: total } = updateTemplateFromResponse({
            page: data?.number,
            totalPages: data?.totalPages,
            totalElements: data?.totalElements
        })
        const resolvedTotalPages = Number.isFinite(data?.totalPages) ? data.totalPages : total
        const resolvedNumber = Number.isFinite(data?.number) ? data.number : templatePageIndex.value
        const resolvedSize = Number.isFinite(data?.size) ? data.size : templatePageSize.value
        const resolvedTotalElements = Number.isFinite(data?.totalElements)
            ? data.totalElements
            : templateTotalElements.value
        templatePage.value = {
            number: resolvedNumber,
            size: resolvedSize,
            totalPages: resolvedTotalPages,
            totalElements: resolvedTotalElements
        }
        if (adjusted) {
            toast.info('Trang danh sách ca mẫu đã được điều chỉnh theo dữ liệu hiện có.', { autoClose: 2500 })
        }
    } catch (err) {
        console.error(err)
        templateError.value = err.response?.data?.message || 'Không thể tải ca mẫu.'
        templates.value = []
    } finally {
        suppressTemplateFetch = false
        templateLoading.value = false
    }
}

const mapShiftsByDate = (items) => {
    const mapped = Object.create(null)
    items.forEach((item) => {
        const key = formatDateKey(new Date(item.shiftDate))
        if (!mapped[key]) {
            mapped[key] = []
        }
        mapped[key].push(item)
    })
    Object.keys(mapped).forEach((key) => {
        mapped[key].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    })
    return mapped
}

const fetchCalendarData = async () => {
    calendarLoading.value = true
    calendarError.value = null
    try {
        const monthStart = startOfMonth(calendarState.baseDate)
        const monthEnd = endOfMonth(calendarState.baseDate)
        const params = {
            page: 0,
            size: CALENDAR_FETCH_SIZE,
            from: formatDateKey(monthStart),
            to: formatDateKey(monthEnd)
        }
        const data = await listShiftInstances(params)
        const mapped = mapShiftsByDate(Array.isArray(data?.content) ? data.content : [])
        calendarState.data = mapped
        if (!calendarState.selectedDate) {
            calendarState.selectedDate = formatDateKey(monthStart)
        }
        const selectedDate = parseDateKey(calendarState.selectedDate)
        if (!selectedDate || selectedDate.getMonth() !== monthStart.getMonth() || selectedDate.getFullYear() !== monthStart.getFullYear()) {
            const keysInMonth = Object.keys(mapped)
                .filter((key) => {
                    const date = parseDateKey(key)
                    return date && date.getMonth() === monthStart.getMonth() && date.getFullYear() === monthStart.getFullYear()
                })
                .sort()
            calendarState.selectedDate = keysInMonth[0] || formatDateKey(monthStart)
        }
    } catch (err) {
        console.error(err)
        calendarError.value = err.response?.data?.message || 'Không thể tải dữ liệu lịch.'
    } finally {
        calendarLoading.value = false
    }
}

const resetFilters = () => {
    filters.from = ''
    filters.to = ''
    filters.status = ''
    rememberInstancePage()
    setTemplatePage(0)
    fetchTemplates()
    fetchCalendarData()
}

const handlePageChange = (newPage) => {
    rememberInstancePage()
    setInstancePage(newPage)
}

const openCreateInstance = async () => {
    editingInstance.value = null
    await fetchTemplateOptions()
    formModal.value?.show()
}

const openEditInstance = async (instance) => {
    editingInstance.value = instance
    await fetchTemplateOptions()
    formModal.value?.show()
}

const openDetail = (instance) => {
    detailModal.value?.open(instance)
}

const handleFormSubmit = async (payload) => {
    formSubmitting.value = true
    try {
        if (editingInstance.value?.id) {
            await updateShiftInstance(editingInstance.value.id, payload)
            toast.success('Đã cập nhật ca làm.')
        } else {
            await createShiftInstances(payload)
            toast.success('Đã tạo ca làm mới.')
        }
        formModal.value?.hide()
        await fetchInstances()
        await fetchCalendarData()
    } catch (err) {
        console.error(err)
        toast.error(err.response?.data?.message || 'Không thể lưu ca làm.')
    } finally {
        formSubmitting.value = false
    }
}

const promptStatusUpdate = async (instance) => {
    const nextStatus = window.prompt('Nhập trạng thái mới (PLANNED, LOCKED, IN_PROGRESS, DONE, CANCELLED):', instance.status)
    if (!nextStatus) return
    if (!SHIFT_STATUSES.some((item) => item.value === nextStatus)) {
        toast.warning('Trạng thái không hợp lệ.')
        return
    }
    try {
        await updateShiftInstanceStatus(instance.id, {status: nextStatus, notes: instance.notes || null})
        toast.success('Đã cập nhật trạng thái ca làm.')
        await fetchInstances()
        await fetchCalendarData()
    } catch (err) {
        console.error(err)
        toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái.')
    }
}

const removeInstance = async (instance) => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa ca làm này?')
    if (!confirmed) return
    try {
        await deleteShiftInstance(instance.id)
        toast.success('Đã xóa ca làm.')
        await fetchInstances()
        await fetchCalendarData()
    } catch (err) {
        console.error(err)
        toast.error(err.response?.data?.message || 'Không thể xóa ca làm.')
    }
}

const handleTemplatePageChange = async (newPage) => {
    rememberTemplatePage()
    setTemplatePage(newPage)
}

const openCreateTemplate = () => {
    editingTemplate.value = null
    templateModal.value?.show()
}

const openEditTemplate = async (template) => {
    if (!template?.id) return
    editingTemplate.value = {...template}
    templateModal.value?.show()
    try {
        const fresh = await getShiftTemplate(template.id)
        editingTemplate.value = fresh
    } catch (err) {
        console.error(err)
        toast.error(err.response?.data?.message || 'Không thể tải chi tiết ca mẫu.')
    }
}

const handleTemplateSubmit = async (payload) => {
    templateSubmitting.value = true
    try {
        if (editingTemplate.value?.id) {
            await updateShiftTemplate(editingTemplate.value.id, payload)
            toast.success('Đã cập nhật ca mẫu.')
        } else {
            await createShiftTemplate(payload)
            toast.success('Đã tạo ca mẫu mới.')
        }
        templateModal.value?.hide()
        editingTemplate.value = null
        await fetchTemplates()
        await fetchTemplateOptions()
    } catch (err) {
        console.error(err)
        toast.error(err.response?.data?.message || 'Không thể lưu ca mẫu.')
    } finally {
        templateSubmitting.value = false
    }
}

const removeTemplate = async (template) => {
    if (!template?.id) return
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa ca mẫu này?')
    if (!confirmed) return
    try {
        await deleteShiftTemplate(template.id)
        toast.success('Đã xóa ca mẫu.')
        if (templates.value.length === 1 && templatePage.number > 0) {
            templatePage.number -= 1
        }
        await fetchTemplates()
        await fetchTemplateOptions()
    } catch (err) {
        console.error(err)
        toast.error(err.response?.data?.message || 'Không thể xóa ca mẫu.')
    }
}

const changeMonth = async (delta) => {
    const next = new Date(calendarState.baseDate)
    next.setMonth(next.getMonth() + delta)
    calendarState.baseDate = startOfMonth(next)
    calendarState.selectedDate = formatDateKey(calendarState.baseDate)
    await fetchCalendarData()
}

const handleSelectDay = async (day) => {
    if (!day) return
    calendarState.selectedDate = day.dateKey
    if (!day.inCurrentMonth) {
        const targetDate = parseDateKey(day.dateKey)
        if (targetDate) {
            calendarState.baseDate = startOfMonth(targetDate)
            await fetchCalendarData()
        }
    }
}

const formatTime = (time) => {
    if (!time) return '--:--'
    return time.length === 5 ? time : time.slice(0, 5)
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

const statusClass = (status) => {
    switch (status) {
        case 'DONE':
            return 'bg-success'
        case 'LOCKED':
            return 'bg-info text-dark'
        case 'CANCELLED':
            return 'bg-danger'
        case 'IN_PROGRESS':
            return 'bg-warning text-dark'
        default:
            return 'bg-secondary'
    }
}

const summarizeAssignments = (assignmentList) => {
    if (!assignmentList?.length) return 'Chưa phân công'
    const completed = assignmentList.filter((item) => item.status === 'COMPLETED').length
    const inProgress = assignmentList.filter((item) => item.status === 'IN_PROGRESS').length
    if (!completed && !inProgress) {
        return 'Chưa có dữ liệu thực thi'
    }
    return `${completed} hoàn thành • ${inProgress} đang làm`
}

watch(lastEvent, async (event) => {
    if (!event) return
    const { type, session } = event
    if (session?.workShiftId) {
        await shiftSessionStore.fetchActiveSessions(session.workShiftId)
    }
    if (type === 'SESSION_STARTED') {
        toast.info(`Ca của ${session?.fullName || session?.username || '#'+session?.userId} đã bắt đầu.`)
    }
    if (type === 'SESSION_ENDED' || type === 'SESSION_FORCED') {
        const verb = type === 'SESSION_FORCED' ? 'kết thúc cưỡng bức' : 'kết thúc'
        toast.info(`Ca của ${session?.fullName || session?.username || '#'+session?.userId} đã ${verb}.`)
    }
})

watch(
    () => [filters.from, filters.to, filters.status],
    () => {
        rememberInstancePage()
        setInstancePage(0)
        fetchInstances()
        fetchCalendarData()
    },
    {deep: true}
)

watch(
    () => [instancePage.value, instancePageSize.value],
    () => {
        if (suppressInstanceFetch) return
        fetchInstances()
    },
    {immediate: true}
)

watch(
    () => [templatePageIndex.value, templatePageSize.value],
    () => {
        if (suppressTemplateFetch) return
        fetchTemplates()
    },
    {immediate: true}
)

onMounted(() => {
    fetchTemplateOptions()
    fetchCalendarData()
    refreshCurrentSession()
})
</script>

<style scoped>
.shifts-page {
    padding-bottom: 3rem;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
}


.page-title {
    color: var(--color-heading);
    margin-bottom: 0.25rem;
}

.page-subtitle {
    margin-bottom: 0;
}

.filter-card,
.table-card,
.calendar-card,
.template-card {
    border-radius: 18px;
    border: 1px solid var(--color-border);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
}

.template-list {
    background: var(--color-card-muted);
    padding: 1rem;
    border-radius: 16px;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 0.5rem;
}

.calendar-weekday {
    text-align: center;
    font-weight: 600;
    color: var(--color-text-muted);
}

.calendar-day {
    position: relative;
    border: none;
    background: var(--color-card-muted);
    border-radius: 14px;
    padding: 0.75rem 0.6rem;
    text-align: left;
    transition: all 0.2s ease;
    color: inherit;
}

.calendar-day:hover {
    background: var(--color-soft-primary);
}

.calendar-day.is-outside {
    opacity: 0.4;
}

.calendar-day.is-selected {
    border: 1.5px solid var(--color-primary);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.18);
    background: var(--color-soft-primary);
}

.calendar-day.is-today .day-number {
    font-weight: 700;
    color: var(--color-primary);
}

.calendar-indicator {
    position: absolute;
    right: 12px;
    bottom: 10px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-success);
}

.selected-day {
    border: 1px dashed var(--color-border);
    border-radius: 16px;
    padding: 1rem;
    background: var(--color-card-muted);
}

.selected-day__empty,
.template-empty {
    border: 1px dashed var(--color-border);
    border-radius: 16px;
    background: var(--color-card-muted);
}

.template-item {
    border-left: 3px solid transparent;
    transition: border-color 0.2s ease;
}

.template-item:hover {
    border-left-color: var(--color-primary);
    background: var(--color-card-muted);
}

.badge {
    font-weight: 600;
}

.session-control-card {
    border-radius: 18px;
    border: 1px solid var(--color-border);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
}

.session-info__item {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.75rem 1rem;
    border-radius: 14px;
    background: var(--color-card-muted);
    border: 1px solid var(--color-border-subtle);
}

.session-info__label {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.session-info__value {
    font-weight: 600;
}

@media (max-width: 992px) {
    .page-header {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>
