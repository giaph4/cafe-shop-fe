<template>
  <div
    class="shift-management-page container-fluid"
      
    style="background: var(--color-body-bg); padding: var(--spacing-4);"
  >
    <div class="shift-management-header">
      <div class="shift-management-header__content">
        <div class="shift-management-header__title-section">
          <h2 class="shift-management-header__title">
            Quản lý Ca làm
          </h2>
          <p class="shift-management-header__subtitle">
            Theo dõi ca làm, phân công nhân viên và trạng thái thực hiện.
          </p>
        </div>
        <div class="shift-management-header__actions">
          <button
            v-if="activeTab === 'instances'"
            class="btn btn-primary"
            type="button"
            @click="openCreateInstance"
          >
            <i class="bi bi-plus-lg me-2" />
            Tạo ca làm mới
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
          class="nav nav-pills reports-tabs"
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
        <div class="tab-content mt-4">
          <LoadingState v-if="loading && activeTab !== 'overview'" />
          <ErrorState
            v-else-if="error && activeTab !== 'overview'"
            :message="error"
            @retry="fetchData"
          />
          <template v-else>
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
          </template>
        </div>
      </div>
    </div>

    <Teleport to="body">
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

      <!-- Delete Instance Confirmation Modal -->
      <div
        id="deleteInstanceModal"
        ref="deleteInstanceModalElement"
        class="modal fade"
        tabindex="-1"
        aria-labelledby="deleteInstanceModalLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5
                id="deleteInstanceModalLabel"
                class="modal-title"
              >
                Xác nhận xóa
              </h5>
              <button
                type="button"
                class="btn-close"
                aria-label="Close"
                @click="deleteInstanceBsModal?.hide()"
              />
            </div>
            <div class="modal-body">
              <p>Bạn có chắc chắn muốn xóa ca làm này không?</p>
              <div
                v-if="instanceToDelete"
                class="card mt-3"
              >
                <div class="card-body">
                  <p class="mb-2">
                    <strong>Template:</strong> {{ instanceToDelete.templateName || 'N/A' }}
                  </p>
                  <p class="mb-2">
                    <strong>Ngày:</strong> {{ formatDate(instanceToDelete.shiftDate) }}
                  </p>
                  <p class="mb-0">
                    <strong>Thời gian:</strong> {{ formatTime(instanceToDelete.startTime) }} - {{ formatTime(instanceToDelete.endTime) }}
                  </p>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="deleteInstanceBsModal?.hide()"
              >
                Hủy
              </button>
              <button
                type="button"
                class="btn btn-danger"
                @click="confirmDeleteInstance"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Template Confirmation Modal -->
      <div
        id="deleteTemplateModal"
        ref="deleteTemplateModalElement"
        class="modal fade"
        tabindex="-1"
        aria-labelledby="deleteTemplateModalLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5
                id="deleteTemplateModalLabel"
                class="modal-title"
              >
                Xác nhận xóa
              </h5>
              <button
                type="button"
                class="btn-close"
                aria-label="Close"
                @click="deleteTemplateBsModal?.hide()"
              />
            </div>
            <div class="modal-body">
              <p>Bạn có chắc chắn muốn xóa ca mẫu này không?</p>
              <div
                v-if="templateToDelete"
                class="card mt-3"
              >
                <div class="card-body">
                  <p class="mb-2">
                    <strong>Tên:</strong> {{ templateToDelete.name || 'N/A' }}
                  </p>
                  <p class="mb-0">
                    <strong>Mô tả:</strong> {{ templateToDelete.description || 'N/A' }}
                  </p>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="deleteTemplateBsModal?.hide()"
              >
                Hủy
              </button>
              <button
                type="button"
                class="btn btn-danger"
                @click="confirmDeleteTemplate"
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
import { computed, onMounted, reactive, ref, Teleport, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { Modal } from 'bootstrap'
import { toast } from 'vue3-toastify'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
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
import { formatDate } from '@/utils/formatters'
import { PaginationMode, usePagination } from '@/composables/usePagination'
import { useShiftSessionStore } from '@/store/shiftSession'

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
        if (error.value?.status === 404) {
            return
        }
        toast.error(error.value.message || 'Không thể làm mới phiên ca.')
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
        // Sẽ được xử lý trong modal confirmation nếu cần
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
        toast.error(error.value.message || 'Không thể bắt đầu ca làm.')
    }
}

const handleEndSession = async () => {
    try {
        await shiftSessionStore.endSession()
        toast.success('Đã kết thúc ca làm.')
        await fetchInstances()
        await fetchCalendarData()
    } catch (error) {
        toast.error(error.value.message || 'Không thể kết thúc ca làm.')
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
    } catch (error) {
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

const buildFilterParams = () => {
    const params = {
        page: instancePage.value,
        size: instancePageSize.value
    }

    // Convert date strings to ISO format if they exist
    if (filters.from) {
        params.from = filters.from.includes('/')
            ? filters.from.split('/').reverse().join('-') // Convert dd/MM/yyyy to yyyy-MM-dd
            : filters.from
    }
    if (filters.to) {
        params.to = filters.to.includes('/')
            ? filters.to.split('/').reverse().join('-') // Convert dd/MM/yyyy to yyyy-MM-dd
            : filters.to
    }
    if (filters.status) {
        params.status = filters.status
    }

    return params
}

const fetchInstances = async () => {
    loading.value = true
    error.value = null
    try {
        const data = await listShiftInstances(buildFilterParams())
        const fetchedInstances = data?.content || []

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
        // formatDateKey already returns yyyy-MM-dd format, which is correct for API
        const params = {
            page: 0,
            size: CALENDAR_FETCH_SIZE,
            from: formatDateKey(monthStart), // Already in yyyy-MM-dd format
            to: formatDateKey(monthEnd) // Already in yyyy-MM-dd format
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

const deleteInstanceModalElement = ref(null)
const deleteInstanceBsModal = ref(null)
const instanceToDelete = ref(null)

const removeInstance = (instance) => {
    instanceToDelete.value = instance
    deleteInstanceBsModal.value?.show()
}

const confirmDeleteInstance = async () => {
    if (!instanceToDelete.value) return
    const instance = instanceToDelete.value
    deleteInstanceBsModal.value?.hide()
    try {
        await deleteShiftInstance(instance.id)
        toast.success('Đã xóa ca làm.')
        await fetchInstances()
        await fetchCalendarData()
    } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể xóa ca làm.')
    } finally {
        instanceToDelete.value = null
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

const deleteTemplateModalElement = ref(null)
const deleteTemplateBsModal = ref(null)
const templateToDelete = ref(null)

const removeTemplate = (template) => {
    if (!template?.id) return
    templateToDelete.value = template
    deleteTemplateBsModal.value?.show()
}

const confirmDeleteTemplate = async () => {
    if (!templateToDelete.value) return
    const template = templateToDelete.value
    deleteTemplateBsModal.value?.hide()
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
    } finally {
        templateToDelete.value = null
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
        toast.info(`Ca của ${session?.fullName || session?.username || `#${  session?.userId}`} đã bắt đầu.`)
    }
    if (type === 'SESSION_ENDED' || type === 'SESSION_FORCED') {
        const verb = type === 'SESSION_FORCED' ? 'kết thúc cưỡng bức' : 'kết thúc'
        toast.info(`Ca của ${session?.fullName || session?.username || `#${  session?.userId}`} đã ${verb}.`)
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
    if (deleteInstanceModalElement.value) {
        deleteInstanceBsModal.value = new Modal(deleteInstanceModalElement.value)
    }
    if (deleteTemplateModalElement.value) {
        deleteTemplateBsModal.value = new Modal(deleteTemplateModalElement.value)
    }
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
    gap: var(--spacing-4);
    padding-bottom: var(--spacing-10);
}

/* Header */
.shift-management-header {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    margin-bottom: var(--spacing-4);
    padding: var(--spacing-4);
}

.shift-management-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    flex-wrap: wrap;
}

.shift-management-header__title-section {
    flex: 1;
    min-width: 0;
}

.shift-management-header__title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.shift-management-header__subtitle {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.shift-management-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    align-items: center;
    justify-content: flex-end;
}

.shift-management-header__actions .btn {
    font-size: var(--font-size-base);
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    transition: all var(--transition-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.shift-management-header__actions .btn-primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.shift-management-header__actions .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-dark);
}

.shift-management-header__actions .btn-outline-secondary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.shift-management-header__actions .btn-outline-secondary:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

/* Tabs Card */
.tabs-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.tabs-card :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

/* Tabs Navigation */
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
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    background: transparent;
    transition: all var(--transition-base);
    border: 1px solid transparent;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.reports-tabs .nav-link i {
    font-size: 18px;
    line-height: 1;
}

.reports-tabs .nav-link:hover:not(.active) {
    color: var(--color-heading);
    background: var(--color-card-muted);
    border-color: var(--color-border);
}

.reports-tabs .nav-link.active {
    background: var(--color-primary);
    color: var(--color-text-inverse);
    border-color: var(--color-primary);
}

/* Modal Styles */
:deep(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

:deep(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4);
    background: var(--color-card);
}

:deep(.modal-header .modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

:deep(.modal-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

:deep(.modal-body .card) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
}

:deep(.modal-body .card-body) {
    padding: var(--spacing-3);
    background: var(--color-card-muted);
}

:deep(.modal-footer) {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-4);
    background: var(--color-card);
}

:deep(.modal-footer .btn) {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

:deep(.modal-footer .btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

:deep(.modal-footer .btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

:deep(.modal-footer .btn-danger) {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-text-inverse);
}

:deep(.modal-footer .btn-danger:hover:not(:disabled)) {
    background: var(--color-danger-dark, #a0281d);
}

:deep(.modal-footer .btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

:deep(.modal-footer .btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

:deep(.modal-body label) {
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

/* Responsive */
@media (max-width: 992px) {
    .shift-management-header {
        padding: var(--spacing-3);
    }

    .shift-management-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .shift-management-header__actions {
        width: 100%;
        justify-content: flex-start;
    }

    .shift-management-header__actions :global(.btn) {
        flex: 1;
        min-width: 0;
    }

    .tabs-card :global(.card-body) {
        padding: var(--spacing-3);
    }

    .reports-tabs {
        gap: var(--spacing-2);
    }

    .reports-tabs .nav-link {
        padding: var(--spacing-2) var(--spacing-3);
        font-size: var(--font-size-sm);
    }
}
</style>
