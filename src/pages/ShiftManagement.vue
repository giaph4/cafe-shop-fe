<template>
    <div class="shift-management-page container-fluid" data-aos="fade-up">
        <div class="shift-management-header">
            <div class="shift-management-header__content">
                <div class="shift-management-header__title-section">
                    <h2 class="page-title">Quản lý Ca làm</h2>
                    <p class="page-subtitle">Theo dõi ca làm, phân công nhân viên và trạng thái thực hiện.</p>
                </div>
                <div class="shift-management-header__actions">
                    <button class="btn btn-primary" type="button" @click="openCreateInstance" v-if="activeTab === 'instances'">
                        <i class="bi bi-plus-lg me-2"></i>Tạo ca làm mới
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
                <div v-if="loading && activeTab !== 'overview'" class="state-block py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                </div>
                <div v-else-if="error && activeTab !== 'overview'" class="state-block py-5">
                    <div class="alert alert-danger mb-0">{{ error }}</div>
                </div>
                <div v-else class="tab-content">
                    <ShiftOverviewTab
                        v-if="activeTab === 'overview'"
                        :calendar-loading="calendarLoading"
                        :calendar-error="calendarError"
                        :calendar-state="calendarState"
                        :calendar-cells="calendarCells"
                        :calendar-selected-shifts="calendarSelectedShifts"
                        :selected-date-label="selectedDateLabel"
                        :calendar-title="calendarTitle"
                        @change-month="changeMonth"
                        @select-day="handleSelectDay"
                        @view-detail="openDetail"
                    />
                    <ShiftInstancesTab
                        v-else-if="activeTab === 'instances'"
                        :instances="instances"
                        :loading="loading"
                        :error="error"
                        :filters="filters"
                        :status-options="SHIFT_STATUSES"
                        :pagination="instancePagination"
                        @filter="fetchInstances"
                        @reset-filters="resetFilters"
                        @view-detail="openDetail"
                        @edit="openEditInstance"
                        @update-status="promptStatusUpdate"
                        @remove="removeInstance"
                        @page-change="handlePageChange"
                    />
                    <ShiftTemplatesTab
                        v-else-if="activeTab === 'templates'"
                        :templates="templates"
                        :loading="templateLoading"
                        :error="templateError"
                        :pagination="templatePage"
                        @create="openCreateTemplate"
                        @edit="openEditTemplate"
                        @remove="removeTemplate"
                        @page-change="handleTemplatePageChange"
                    />
                </div>
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

        <ShiftStatusUpdateModal
            ref="statusModal"
            :status-options="SHIFT_STATUSES"
            @submit="handleStatusUpdate"
        />
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import ShiftOverviewTab from '@/components/shifts/ShiftOverviewTab.vue'
import ShiftInstancesTab from '@/components/shifts/ShiftInstancesTab.vue'
import ShiftTemplatesTab from '@/components/shifts/ShiftTemplatesTab.vue'
import ShiftInstanceFormModal from '@/components/shifts/ShiftInstanceFormModal.vue'
import ShiftTemplateFormModal from '@/components/shifts/ShiftTemplateFormModal.vue'
import ShiftInstanceDetailModal from '@/components/shifts/ShiftInstanceDetailModal.vue'
import ShiftStatusUpdateModal from '@/components/shifts/ShiftStatusUpdateModal.vue'
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
import { toast } from 'vue3-toastify'
import { formatDate, formatDateTime } from '@/utils/formatters'
import { PaginationMode, usePagination } from '@/composables/usePagination'
import { useShiftSessionStore } from '@/store/shiftSession'

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

const activeTab = ref('overview')
const tabs = [
    { key: 'overview', label: 'Tổng quan', icon: 'bi bi-speedometer2' },
    { key: 'instances', label: 'Danh sách ca làm', icon: 'bi bi-calendar-check' },
    { key: 'templates', label: 'Ca mẫu', icon: 'bi bi-file-earmark-text' }
]

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
const statusModal = ref(null)
const editingInstance = ref(null)
const updatingStatusInstance = ref(null)
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
    const err = realtimeError.value
    if (!err) return ''
    if (typeof err === 'string') return err
    if (err.message) return err.message
    if (err.body) {
        try {
            const parsed = JSON.parse(err.body)
            if (parsed?.message) return parsed.message
        } catch (parseErr) {
            return String(err.body)
        }
    }
    if (err.headers?.message) return err.headers.message
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
        // 404 là bình thường khi user chưa có active session, không cần log hoặc hiển thị lỗi
        if (error?.status === 404) {
            return
        }
        toast.error(error.message || 'Không thể làm mới phiên ca.')
    }
}

const handleStartSession = async () => {
    if (!startForm.workShiftId) {
        toast.warning('Vui lòng chọn Work Shift trước khi nhận ca.')
        return
    }
    
    // Validation: Check xem user đã có active session chưa
    // Nếu đã có active session, không cho start session mới (trừ khi admin override)
    if (currentSession.value && currentSession.value.status === 'ACTIVE') {
        if (!startForm.adminOverride) {
            toast.warning('Bạn đang có một ca làm đang hoạt động. Vui lòng kết thúc ca hiện tại trước khi bắt đầu ca mới.')
            return
        }
        // Nếu admin override, cho phép start nhưng cảnh báo
        const confirmed = confirm('Bạn đang có ca làm đang hoạt động. Bạn có chắc chắn muốn bắt đầu ca mới?')
        if (!confirmed) {
            return
        }
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
        toast.error(error.message || 'Không thể kết thúc ca làm.')
    }
}

const calendarTitle = computed(() =>
    calendarState.baseDate.toLocaleString('vi-VN', { month: 'long', year: 'numeric' })
)

const calendarCells = computed(() => {
    const monthStart = startOfMonth(calendarState.baseDate)
    const leading = (monthStart.getDay() + 6) % 7
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
        const data = await getShiftTemplates({ page: 0, size: 100 })
        templateOptions.value = data?.content || []
    } catch (err) {
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
    pageSize: 10,
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
    status: filters.status || undefined,
    sort: 'shiftDate,desc' // Sắp xếp theo ngày mới nhất
})

const fetchInstances = async () => {
    loading.value = true
    error.value = null
    try {
        const data = await listShiftInstances(buildFilterParams())
        let fetchedInstances = data?.content || []
        
        // Sắp xếp theo ngày mới nhất (nếu backend chưa sort)
        fetchedInstances.sort((a, b) => {
            const dateA = new Date(a.shiftDate)
            const dateB = new Date(b.shiftDate)
            return dateB - dateA // Mới nhất trước
        })
        
        instances.value = fetchedInstances

        if (!startForm.workShiftId && instances.value.length) {
            startForm.workShiftId = instances.value[0]?.id ?? null
        }

        suppressInstanceFetch = true
        const { adjusted } = updateInstanceFromResponse({
            page: data?.number,
            totalPages: data?.totalPages,
            totalElements: data?.totalElements
        })
        suppressInstanceFetch = false

        if (adjusted) {
            toast.info('Trang danh sách ca làm đã được điều chỉnh theo dữ liệu hiện có.', { autoClose: 2500 })
        }
    } catch (err) {
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
        toast.error(err.response?.data?.message || 'Không thể lưu ca làm.')
    } finally {
        formSubmitting.value = false
    }
}

const promptStatusUpdate = async (instance) => {
    updatingStatusInstance.value = instance
    statusModal.value?.show(instance)
}

const handleStatusUpdate = async (payload) => {
    if (!updatingStatusInstance.value) return
    statusModal.value?.setSubmitting(true)
    try {
        await updateShiftInstanceStatus(updatingStatusInstance.value.id, payload)
        toast.success('Đã cập nhật trạng thái ca làm.')
        await fetchInstances()
        await fetchCalendarData()
        statusModal.value?.setSubmitting(false)
    } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái.')
        statusModal.value?.setSubmitting(false)
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
    editingTemplate.value = { ...template }
    templateModal.value?.show()
    try {
        const fresh = await getShiftTemplate(template.id)
        editingTemplate.value = fresh
    } catch (err) {
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
        if (templates.value.length === 1 && templatePage.value.number > 0) {
            templatePage.value.number -= 1
        }
        await fetchTemplates()
        await fetchTemplateOptions()
    } catch (err) {
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

const fetchData = () => {
    if (activeTab.value === 'overview') {
        fetchCalendarData()
        fetchTemplates()
        refreshCurrentSession()
    } else if (activeTab.value === 'instances') {
        fetchInstances()
    } else if (activeTab.value === 'templates') {
        fetchTemplates()
    }
}

watch(activeTab, (newTab) => {
    if (newTab === 'overview') {
        fetchCalendarData()
        fetchTemplates()
        refreshCurrentSession()
    } else if (newTab === 'instances') {
        fetchInstances()
    } else if (newTab === 'templates') {
        fetchTemplates()
    }
})

watch(lastEvent, async (event) => {
    if (!event) return
    const { type, session } = event
    if (session?.workShiftId) {
        await shiftSessionStore.fetchActiveSessions(session.workShiftId)
    }
    if (type === 'SESSION_STARTED') {
        toast.info(`Ca của ${session?.fullName || session?.username || '#' + session?.userId} đã bắt đầu.`)
    }
    if (type === 'SESSION_ENDED' || type === 'SESSION_FORCED') {
        const verb = type === 'SESSION_FORCED' ? 'kết thúc cưỡng bức' : 'kết thúc'
        toast.info(`Ca của ${session?.fullName || session?.username || '#' + session?.userId} đã ${verb}.`)
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
    { deep: true }
)

watch(
    () => [instancePage.value, instancePageSize.value],
    () => {
        if (suppressInstanceFetch) return
        fetchInstances()
    },
    { immediate: true }
)

watch(
    () => [templatePageIndex.value, templatePageSize.value],
    () => {
        if (suppressTemplateFetch) return
        fetchTemplates()
    },
    { immediate: true }
)

onMounted(() => {
    fetchTemplateOptions()
    fetchCalendarData()
    fetchTemplates()
    refreshCurrentSession()
})
</script>

<style scoped>
.shift-management-page {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
    padding-bottom: 2rem;
}

.shift-management-header {
    background: #ffffff;
    background: linear-gradient(165deg, #ffffff, rgba(255, 255, 255, 0.95));
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04);
    margin-bottom: 1.5rem;
    padding: 1.5rem;
}

.shift-management-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.shift-management-header__title-section {
    flex: 1;
    min-width: 0;
}

.shift-management-header__actions {
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
    .card-shadow {
        padding: 1.25rem;
    }
}
</style>
