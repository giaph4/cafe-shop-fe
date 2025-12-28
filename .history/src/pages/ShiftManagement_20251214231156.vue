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

import { computed, onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
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
import { useTableData } from '@/composables/useTableData'
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
const templatePage = computed(() => ({
    number: templatePageIndex.value,
    size: templatePageSize.value,
    totalPages: templatesTableData.totalPages.value,
    totalElements: templateTotalElements.value
}))

const calendarLoading = ref(false)
const calendarError = ref(null)
const calendarState = reactive({
    baseDate: startOfMonth(new Date()),
    selectedDate: TODAY_KEY,
    data: {}
})

const shiftSessionStore = useShiftSessionStore()
const { lastEvent } = storeToRefs(shiftSessionStore)

const refreshCurrentSession = async () => {
    try {
        await shiftSessionStore.loadCurrentSession()
    } catch (err) {
        // 404 là bình thường khi user chưa có active session, không cần hiển thị lỗi
        if (err?.response?.status === 404) {
            return
        }
        toast.error(err?.response?.data?.message || 'Không thể làm mới phiên ca.')
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
    } catch {
        toast.error('Không thể tải template ca làm.')
        templateOptions.value = []
    }
}

// Sử dụng useTableData cho shift instances
const instancesTableData = useTableData({
    fetchFn: async (params) => {
        const filterParams = {
            page: params.page,
            size: params.size
        }

        // Chuyển đổi định dạng ngày từ dd/MM/yyyy sang yyyy-MM-dd nếu cần
        if (filters.from) {
            filterParams.from = filters.from.includes('/')
                ? filters.from.split('/').reverse().join('-')
                : filters.from
        }
        if (filters.to) {
            filterParams.to = filters.to.includes('/')
                ? filters.to.split('/').reverse().join('-')
                : filters.to
        }
        if (filters.status) {
            filterParams.status = filters.status
        }

        const data = await listShiftInstances(filterParams)
        const fetchedInstances = data?.content || []

        // Sắp xếp theo ngày mới nhất
        fetchedInstances.sort((a, b) => {
            const dateA = new Date(a.shiftDate)
            const dateB = new Date(b.shiftDate)
            return dateB - dateA
        })

        return {
            ...data,
            content: fetchedInstances
        }
    },
    initialPageSize: 20,
    syncUrl: true,
    pageParam: 'instancePage',
    sizeParam: 'instanceSize',
    zeroBasedPage: true
})

// Expose instance pagination properties
const instancePage = computed(() => instancesTableData.zeroBasedPage.value)
const instancePageSize = computed(() => instancesTableData.pageSize.value)
const instanceTotalPages = computed(() => instancesTableData.totalPages.value)
const setInstancePage = (page) => instancesTableData.setPage(page)

const instancePagination = computed(() => ({
    number: instancePage.value,
    size: instancePageSize.value,
    totalPages: instanceTotalPages.value
}))

// Sử dụng useTableData cho shift templates
const templatesTableData = useTableData({
    fetchFn: async (params) => await getShiftTemplates({
        page: params.page,
        size: params.size
    }),
    initialPageSize: 10,
    syncUrl: true,
    pageParam: 'templatePage',
    sizeParam: 'templateSize',
    zeroBasedPage: true
})

// Expose template pagination properties
const templatePageIndex = computed(() => templatesTableData.zeroBasedPage.value)
const templatePageSize = computed(() => templatesTableData.pageSize.value)
const templateTotalElements = computed(() => templatesTableData.totalElements.value)
const setTemplatePage = (page) => templatesTableData.setPage(page)


const fetchInstances = async () => {
    await instancesTableData.fetchData()
    instances.value = instancesTableData.data.value || []
    loading.value = instancesTableData.loading.value
    error.value = instancesTableData.error.value?.message || null
}

const fetchTemplates = async () => {
    await templatesTableData.fetchData()
    templates.value = templatesTableData.data.value || []
    templateLoading.value = templatesTableData.loading.value
    templateError.value = templatesTableData.error.value?.message || null
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
    setInstancePage(0)
    fetchInstances()
    fetchCalendarData()
}

const handlePageChange = (newPage) => {
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

const promptStatusUpdate = (instance) => {
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

const handleTemplatePageChange = (newPage) => {
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
        const userName = session?.fullName || session?.username || `#${session?.userId}`
        toast.info(`Ca của ${userName} đã bắt đầu.`)
    }
    if (type === 'SESSION_ENDED' || type === 'SESSION_FORCED') {
        const verb = type === 'SESSION_FORCED' ? 'kết thúc cưỡng bức' : 'kết thúc'
        const userName = session?.fullName || session?.username || `#${session?.userId}`
        toast.info(`Ca của ${userName} đã ${verb}.`)
    }
})

watch(
    () => [filters.from, filters.to, filters.status],
    () => {
        setInstancePage(0)
        fetchInstances()
        fetchCalendarData()
    },
    { deep: true }
)

// Watchers được xử lý tự động bởi useTableData

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
