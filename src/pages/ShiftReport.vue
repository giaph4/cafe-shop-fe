<template>
    <div class="page-container container-fluid" data-aos="fade-up">
        <div class="page-header card-shadow">
            <div>
                <h2 class="page-title">Báo cáo ca làm việc</h2>
                <p class="page-subtitle">Theo dõi số liệu phiên làm việc, tái tổng hợp và cập nhật realtime từ sự kiện ca.</p>
            </div>
            <div class="d-flex flex-wrap gap-2 align-items-center">
                <button class="btn btn-outline-secondary" type="button" @click="fetchData" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    Làm mới
                </button>
            </div>
        </div>

        <div class="card tabs-card mb-4 mt-4">
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
                <div v-if="loading && activeTab === 'list'" class="state-block py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                </div>
                <div v-else-if="error && activeTab === 'list'" class="state-block py-5">
                    <div class="alert alert-danger mb-0">{{ error }}</div>
                </div>
                <div v-else class="tab-content">
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
        errorMessage.value = error.message || 'Không thể tải báo cáo ca làm.'
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
        toast.error(error.message || 'Tái tổng hợp thất bại.')
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
        workShiftError.value = error.message || 'Không thể tải danh sách báo cáo.'
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

<style scoped>
.shift-report-page {
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

</style>
