<template>
  <div
    class="page-container container-fluid"
    data-aos="fade-up"
    style="background: var(--color-body-bg); padding: var(--spacing-4);"
  >
    <div class="page-header card-shadow">
      <div>
        <h2 class="page-title">
          Báo cáo ca làm việc
        </h2>
        <p class="page-subtitle">
          Theo dõi số liệu phiên làm việc, tái tổng hợp và cập nhật realtime từ sự kiện ca.
        </p>
      </div>
      <div class="d-flex flex-wrap gap-2 align-items-center">
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
          Làm mới
        </button>
      </div>
    </div>

    <div class="card tabs-card mb-4 mt-4">
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
          <ShiftReportDetailTab
            v-if="activeTab === 'detail'"
            :report="report"
            :loading="loading"
            :error-message="errorMessage"
            :event-log="eventLog"
            :connection-state="connectionState"
            :connection-status-label="connectionStatusLabel"
            :connection-error="connectionError"
            :connecting-realtime="connectingRealtime"
            @fetch="handleFetchReport"
            @regenerate="handleRegenerate"
            @reconnect="handleReconnect"
          />
          <ShiftReportListTab
            v-else-if="activeTab === 'list'"
            :reports="workShiftReports"
            :loading="workShiftLoading"
            :error="workShiftError"
            @fetch="handleFetchWorkShiftReports"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { toast } from 'vue3-toastify'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import ShiftReportDetailTab from '@/components/shift-reports/ShiftReportDetailTab.vue'
import ShiftReportListTab from '@/components/shift-reports/ShiftReportListTab.vue'
import { getShiftReport, regenerateShiftReport, listShiftReportsByWorkShift } from '@/api/shiftReportService'
import { useShiftSessionEvents } from '@/composables/useShiftSessionEvents'

const activeTab = ref('detail')
const tabs = [
    { key: 'detail', label: 'Báo cáo chi tiết', icon: 'bi bi-file-earmark-text' },
    { key: 'list', label: 'Danh sách theo Work Shift', icon: 'bi bi-list-ul' }
]

const loading = ref(false)
const report = ref(null)
const errorMessage = ref('')

const workShiftLoading = ref(false)
const workShiftReports = ref([])
const workShiftError = ref('')

const eventLog = ref([])

const parseId = (value) => {
    const num = Number(value)
    return Number.isFinite(num) && num > 0 ? num : null
}

const handleFetchReport = async ({ sessionId, refresh = false }) => {
    const parsedId = parseId(sessionId)
    if (!parsedId) {
        errorMessage.value = 'Session ID không hợp lệ.'
        return
    }
    loading.value = true
    errorMessage.value = ''
    try {
        const data = await getShiftReport(parsedId, { refresh })
        report.value = data
        toast.success('Đã tải báo cáo ca làm.')
    } catch (error) {
        report.value = null
        errorMessage.value = error.value.message || 'Không thể tải báo cáo ca làm.'
        toast.error(errorMessage.value)
    } finally {
        loading.value = false
    }
}

const handleRegenerate = async () => {
    if (!report.value?.sessionId) return
    loading.value = true
    try {
        const regenerated = await regenerateShiftReport(report.value.sessionId)
        report.value = regenerated
        toast.success('Đã tái tổng hợp báo cáo ca làm.')
    } catch (error) {
        toast.error(error.value.message || 'Tái tổng hợp thất bại.')
    } finally {
        loading.value = false
    }
}

const handleFetchWorkShiftReports = async (workShiftId) => {
    const parsedId = parseId(workShiftId)
    if (!parsedId) {
        workShiftError.value = 'Work Shift ID không hợp lệ.'
        return
    }
    workShiftLoading.value = true
    workShiftError.value = ''
    try {
        workShiftReports.value = await listShiftReportsByWorkShift(parsedId)
        if (workShiftReports.value.length === 0) {
            toast.info('Không tìm thấy báo cáo nào cho Work Shift này.')
        } else {
            toast.success(`Đã tải ${workShiftReports.value.length} báo cáo.`)
        }
    } catch (error) {
        workShiftReports.value = []
        workShiftError.value = error.value.message || 'Không thể tải danh sách báo cáo.'
        toast.error(workShiftError.value)
    } finally {
        workShiftLoading.value = false
    }
}

const pushEventLog = (payload) => {
    eventLog.value = [
        {
            ...payload,
            receivedAt: new Date().toISOString()
        },
        ...eventLog.value
    ].slice(0, 20)
}

const handleSessionEvent = (event) => {
    if (!event) return
    pushEventLog(event)

    const currentSessionId = report.value?.sessionId
    if (!currentSessionId || Number(event.session?.id) !== Number(currentSessionId)) {
        return
    }

    if (event.report) {
        report.value = event.report
        toast.info('Báo cáo đã được cập nhật từ realtime event.')
    }
}

const {
    connect,
    disconnect,
    ensureConnected,
    connected: connectedRealtime,
    connecting: connectingRealtimeRef,
    lastError
} = useShiftSessionEvents(handleSessionEvent)

const connectingRealtime = computed(() => connectingRealtimeRef.value)

const connectionState = computed(() => {
    if (connectingRealtime.value) return 'connecting'
    return connectedRealtime.value ? 'online' : 'offline'
})

const connectionStatusLabel = computed(() => {
    switch (connectionState.value) {
        case 'online':
            return 'Realtime đã kết nối'
        case 'connecting':
            return 'Đang kết nối realtime…'
        default:
            return 'Chưa kết nối realtime'
    }
})

const connectionError = computed(() => {
    const error = lastError.value
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

const handleReconnect = () => {
    ensureConnected()
}

const fetchData = () => {
    if (activeTab.value === 'detail' && report.value) {
        handleFetchReport({ sessionId: report.value.sessionId, refresh: true })
    } else if (activeTab.value === 'list' && workShiftReports.value.length) {
        // Có thể thêm logic refresh list nếu cần
    }
}

const error = computed(() => activeTab.value === 'list' ? workShiftError.value : null)

watch(connectionState, (state) => {
    if (state === 'offline') {
        ensureConnected()
    }
})

watch(activeTab, (newTab) => {
    if (newTab === 'detail' && report.value) {
        // Giữ nguyên report hiện tại
    } else if (newTab === 'list') {
        // Reset list khi chuyển tab
        workShiftReports.value = []
        workShiftError.value = ''
    }
})

onMounted(() => {
    connect()
})

onBeforeUnmount(() => {
    disconnect()
})
</script>

<style scoped lang="scss">
.shift-report-page {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
    padding-bottom: var(--spacing-12);
}

.card-shadow {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
}

.page-title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.page-subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.card-shadow .btn {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.card-shadow .btn-outline-secondary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.card-shadow .btn-outline-secondary:hover:not(:disabled) {
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

@media (max-width: 768px) {
    .card-shadow {
        padding: var(--spacing-4);
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>
