.shift-report__connection {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.45rem 0.75rem;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.05);
    color: var(--color-text-muted, #64748b);
    font-size: 0.9rem;
    width: fit-content;
}

.shift-report__connection[data-state='online'] {
    background: rgba(34, 197, 94, 0.12);
    color: #15803d;
}

.shift-report__connection[data-state='connecting'] {
    background: rgba(59, 130, 246, 0.12);
    color: #1d4ed8;
}

.shift-report__connection[data-state='offline'] {
    background: rgba(248, 113, 113, 0.15);
    color: #b91c1c;
}

.shift-report__connection-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6);
}

.shift-report__connection-text {
    font-weight: 600;
}

.shift-report__connection-error {
    margin: 0;
    font-size: 0.85rem;
    color: #b91c1c;
}

.shift-report__btn--compact {
    padding: 0.35rem 0.75rem;
    min-width: auto;
    font-size: 0.85rem;
}
<template>
    <div class="shift-report">
        <header class="shift-report__header">
            <div class="shift-report__title-block">
                <div>
                    <h1>Báo cáo ca làm việc</h1>
                    <p class="shift-report__subtitle">
                        Theo dõi số liệu phiên làm việc, tái tổng hợp và cập nhật realtime từ sự kiện ca.
                    </p>
                </div>

                <div class="shift-report__connection" :data-state="connectionState">
                    <span class="shift-report__connection-indicator" aria-hidden="true"></span>
                    <span class="shift-report__connection-text">{{ connectionStatusLabel }}</span>
                    <button
                        v-if="connectionState !== 'online'"
                        type="button"
                        class="shift-report__btn shift-report__btn--ghost shift-report__btn--compact"
                        :disabled="connectingRealtime"
                        @click="ensureConnected"
                    >
                        {{ connectingRealtime ? 'Đang kết nối lại…' : 'Kết nối lại' }}
                    </button>
                </div>
                <p v-if="connectionError" class="shift-report__connection-error" role="status">
                    {{ connectionError }}
                </p>
            </div>

            <form class="shift-report__session-form" @submit.prevent="handleFetchReport">
                <label class="shift-report__input-group">
                    <span>Session ID</span>
                    <input
                        v-model.trim="sessionIdInput"
                        type="number"
                        min="1"
                        placeholder="Nhập ID phiên"
                        required
                    />
                </label>

                <label class="shift-report__checkbox">
                    <input type="checkbox" v-model="refresh" />
                    <span>Lấy mới dữ liệu (refresh)</span>
                </label>

                <button class="shift-report__btn shift-report__btn--primary" type="submit" :disabled="loading">
                    <span v-if="loading" class="shift-report__spinner" aria-hidden="true"></span>
                    <span v-else>Lấy báo cáo</span>
                </button>

                <button
                    class="shift-report__btn shift-report__btn--ghost"
                    type="button"
                    :disabled="loading || !report"
                    @click="handleRegenerate"
                >
                    Tái tổng hợp (Regenerate)
                </button>
            </form>
        </header>

        <section v-if="errorMessage" class="shift-report__error" role="alert">
            {{ errorMessage }}
        </section>

        <section v-if="report" class="shift-report__content">
            <div class="shift-report__info">
                <div class="shift-report__info-row">
                    <div class="shift-report__info-item">
                        <span class="shift-report__info-label">Trạng thái phiên</span>
                        <span class="shift-report__status" :data-status="report.status">
                            {{ statusLabel }}
                        </span>
                    </div>
                    <div class="shift-report__info-item">
                        <span class="shift-report__info-label">Nhân viên phụ trách</span>
                        <span class="shift-report__info-value">#{{ report.userId }} — {{ report.username || 'Không rõ' }}</span>
                    </div>
                    <div class="shift-report__info-item">
                        <span class="shift-report__info-label">Ca mẫu</span>
                        <span class="shift-report__info-value">{{ report.workShiftId ? `#${report.workShiftId}` : 'Không xác định' }}</span>
                    </div>
                </div>

                <div class="shift-report__info-row">
                    <div class="shift-report__info-item">
                        <span class="shift-report__info-label">Bắt đầu</span>
                        <span class="shift-report__info-value">{{ formatDateTime(report.startAt) }}</span>
                    </div>
                    <div class="shift-report__info-item">
                        <span class="shift-report__info-label">Kết thúc</span>
                        <span class="shift-report__info-value">{{ report.endAt ? formatDateTime(report.endAt) : 'Chưa kết thúc' }}</span>
                    </div>
                    <div class="shift-report__info-item">
                        <span class="shift-report__info-label">Tổng hợp lúc</span>
                        <span class="shift-report__info-value">{{ formatDateTime(report.generatedAt) }}</span>
                    </div>
                </div>
            </div>

            <div class="shift-report__metrics">
                <article class="shift-report__metric-card">
                    <p class="shift-report__metric-label">Tổng đơn</p>
                    <p class="shift-report__metric-value">{{ formatNumber(report.totalOrders) }}</p>
                </article>
                <article class="shift-report__metric-card">
                    <p class="shift-report__metric-label">Doanh thu đã thanh toán</p>
                    <p class="shift-report__metric-value shift-report__metric-value--positive">{{ formatCurrency(report.totalPaidAmount) }}</p>
                </article>
                <article class="shift-report__metric-card">
                    <p class="shift-report__metric-label">Giá trị chưa thanh toán</p>
                    <p class="shift-report__metric-value shift-report__metric-value--warn">{{ formatCurrency(report.totalUnpaidAmount) }}</p>
                </article>
                <article class="shift-report__metric-card">
                    <p class="shift-report__metric-label">Đơn chuyển giao</p>
                    <p class="shift-report__metric-value">{{ formatNumber(report.transferredOrders) }}</p>
                </article>
            </div>

            <div class="shift-report__grids">
                <section class="shift-report__panel">
                    <header class="shift-report__panel-header">
                        <h2>Phân bổ theo phương thức thanh toán</h2>
                    </header>
                    <table class="shift-report__table">
                        <thead>
                            <tr>
                                <th>Phương thức</th>
                                <th>Đơn hàng</th>
                                <th>Doanh thu</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="!report.paymentBreakdown.length">
                                <td colspan="3" class="shift-report__empty">Không có dữ liệu</td>
                            </tr>
                            <tr v-for="method in report.paymentBreakdown" :key="method.paymentMethod">
                                <td>{{ paymentMethodLabel(method.paymentMethod) }}</td>
                                <td>{{ formatNumber(method.orderCount) }}</td>
                                <td>{{ formatCurrency(method.totalAmount) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                <section class="shift-report__panel">
                    <header class="shift-report__panel-header">
                        <h2>Top sản phẩm theo số lượng</h2>
                    </header>
                    <table class="shift-report__table">
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Số lượng</th>
                                <th>Doanh thu</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="!report.topProducts.length">
                                <td colspan="3" class="shift-report__empty">Không có dữ liệu</td>
                            </tr>
                            <tr v-for="product in report.topProducts" :key="product.productId || product.productName">
                                <td>
                                    <strong>{{ product.productName || 'Không rõ' }}</strong>
                                    <small v-if="product.productId" class="shift-report__muted">#{{ product.productId }}</small>
                                </td>
                                <td>{{ formatNumber(product.quantity) }}</td>
                                <td>{{ formatCurrency(product.totalAmount) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>
            </div>

            <section class="shift-report__panel">
                <header class="shift-report__panel-header">
                    <h2>Nhật ký sự kiện mới nhất</h2>
                    <span class="shift-report__event-hint">Tự động cập nhật từ /topic/shifts/session-events</span>
                </header>
                <ul class="shift-report__event-log">
                    <li v-if="!eventLog.length" class="shift-report__empty">Chưa có sự kiện nào.</li>
                    <li v-for="(event, index) in eventLog" :key="index" class="shift-report__event-item">
                        <div class="shift-report__event-meta">
                            <span class="shift-report__status" :data-status="event.eventType">{{ event.eventType }}</span>
                            <span class="shift-report__muted">{{ formatDateTime(event.receivedAt) }}</span>
                        </div>
                        <div class="shift-report__event-body">
                            <span>Session #{{ event.session?.id ?? 'N/A' }} — {{ event.session?.status ?? 'UNKNOWN' }}</span>
                            <span v-if="event.report"> | Báo cáo #{{ event.report.reportId }}</span>
                        </div>
                    </li>
                </ul>
            </section>
        </section>

        <section class="shift-report__panel shift-report__panel--secondary">
            <header class="shift-report__panel-header">
                <h2>Báo cáo theo Work Shift ID</h2>
                <p class="shift-report__muted">Liệt kê toàn bộ báo cáo thuộc ca mẫu xác định.</p>
            </header>
            <form class="shift-report__workshift-form" @submit.prevent="handleFetchWorkShiftReports">
                <label class="shift-report__input-group">
                    <span>Work Shift ID</span>
                    <input v-model.trim="workShiftIdInput" type="number" min="1" placeholder="Nhập ID ca mẫu" required />
                </label>
                <button class="shift-report__btn shift-report__btn--primary" type="submit" :disabled="workShiftLoading">
                    <span v-if="workShiftLoading" class="shift-report__spinner" aria-hidden="true"></span>
                    <span v-else>Lấy danh sách</span>
                </button>
            </form>

            <p v-if="workShiftError" class="shift-report__error" role="alert">{{ workShiftError }}</p>

            <div v-if="workShiftReports.length" class="shift-report__workshift-grid">
                <article v-for="item in workShiftReports" :key="item.reportId" class="shift-report__workshift-card">
                    <header>
                        <h3>#{{ item.reportId }} — Session {{ item.sessionId }}</h3>
                        <span class="shift-report__status" :data-status="item.status">{{ statusLabelFor(item.status) }}</span>
                    </header>
                    <dl>
                        <div>
                            <dt>Bắt đầu</dt>
                            <dd>{{ formatDateTime(item.startAt) }}</dd>
                        </div>
                        <div>
                            <dt>Kết thúc</dt>
                            <dd>{{ item.endAt ? formatDateTime(item.endAt) : 'Chưa kết thúc' }}</dd>
                        </div>
                        <div>
                            <dt>Doanh thu đã thanh toán</dt>
                            <dd>{{ formatCurrency(item.totalPaidAmount) }}</dd>
                        </div>
                        <div>
                            <dt>Giá trị chưa thanh toán</dt>
                            <dd>{{ formatCurrency(item.totalUnpaidAmount) }}</dd>
                        </div>
                    </dl>
                </article>
            </div>
            <p v-else class="shift-report__empty">Chưa có báo cáo nào tương ứng.</p>
        </section>
    </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { toast } from 'vue3-toastify'
import { getShiftReport, regenerateShiftReport, listShiftReportsByWorkShift } from '@/api/shiftReportService'
import { formatCurrency, formatNumber, formatDateTime } from '@/utils/formatters'
import { useShiftSessionEvents } from '@/composables/useShiftSessionEvents'

const sessionIdInput = ref('')
const refresh = ref(false)
const loading = ref(false)
const report = ref(null)
const errorMessage = ref('')

const workShiftIdInput = ref('')
const workShiftLoading = ref(false)
const workShiftReports = ref([])
const workShiftError = ref('')

const eventLog = ref([])

const statusLabel = computed(() => statusLabelFor(report.value?.status))

const paymentMethodLabel = (code) => {
    if (!code) return 'Không xác định'
    const normalized = String(code).toUpperCase()
    switch (normalized) {
    case 'CASH':
        return 'Tiền mặt'
    case 'CREDIT_CARD':
        return 'Thẻ tín dụng'
    case 'DEBIT_CARD':
        return 'Thẻ ghi nợ'
    case 'BANK_TRANSFER':
        return 'Chuyển khoản'
    case 'E_WALLET':
        return 'Ví điện tử'
    case 'QRIS':
        return 'Thanh toán QR'
    case 'OTHER':
        return 'Khác'
    default:
        return normalized
    }
}

const statusLabelFor = (status) => {
    switch ((status || '').toUpperCase()) {
    case 'ACTIVE':
        return 'ĐANG HOẠT ĐỘNG'
    case 'CLOSED':
        return 'ĐÃ KẾT THÚC'
    case 'FORCED':
        return 'KẾT CA CƯỠNG BỨC'
    default:
        return status || 'KHÔNG RÕ'
    }
}

const parseId = (value) => {
    const num = Number(value)
    return Number.isFinite(num) && num > 0 ? num : null
}

const handleFetchReport = async () => {
    const sessionId = parseId(sessionIdInput.value)
    if (!sessionId) {
        errorMessage.value = 'Session ID không hợp lệ.'
        return
    }
    loading.value = true
    errorMessage.value = ''
    try {
        const data = await getShiftReport(sessionId, { refresh: refresh.value })
        report.value = data
        toast.success('Đã tải báo cáo ca làm.')
    } catch (error) {
        report.value = null
        errorMessage.value = error.message || 'Không thể tải báo cáo ca làm.'
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

const handleFetchWorkShiftReports = async () => {
    const workShiftId = parseId(workShiftIdInput.value)
    if (!workShiftId) {
        workShiftError.value = 'Work Shift ID không hợp lệ.'
        return
    }
    workShiftLoading.value = true
    workShiftError.value = ''
    try {
        workShiftReports.value = await listShiftReportsByWorkShift(workShiftId)
    } catch (error) {
        workShiftReports.value = []
        workShiftError.value = error.message || 'Không thể tải danh sách báo cáo.'
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

watch(connectionState, (state) => {
    if (state === 'offline') {
        ensureConnected()
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
.shift-report {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.shift-report__header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.5rem;
}

.shift-report__title-block {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1 1 320px;
}

.shift-report__subtitle {
    color: var(--color-text-muted, #64748b);
    margin-top: 0.35rem;
}

.shift-report__session-form {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: flex-end;
}

.shift-report__input-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.shift-report__input-group input {
    min-width: 160px;
    border-radius: 8px;
    border: 1px solid rgba(148, 163, 184, 0.4);
    padding: 0.55rem 0.75rem;
    background: var(--color-surface, #0f172a0d);
    color: inherit;
}

.shift-report__checkbox {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.95rem;
    color: var(--color-text-muted, #64748b);
}

.shift-report__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 160px;
    padding: 0.6rem 1.2rem;
    border-radius: 10px;
    border: 1px solid transparent;
    font-weight: 600;
    transition: transform 0.16s ease, box-shadow 0.16s ease;
    cursor: pointer;
}

.shift-report__btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.shift-report__btn--primary {
    background: linear-gradient(135deg, #2563eb, #4f46e5);
    color: #fff;
}

.shift-report__btn--primary:not(:disabled):hover {
    box-shadow: 0 12px 24px rgba(37, 99, 235, 0.25);
    transform: translateY(-1px);
}

.shift-report__btn--ghost {
    background: transparent;
    border-color: rgba(37, 99, 235, 0.4);
    color: #2563eb;
}

.shift-report__btn--ghost:not(:disabled):hover {
    background: rgba(37, 99, 235, 0.08);
}

.shift-report__spinner {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.6);
    border-top-color: #2563eb;
    animation: shift-report-spin 0.8s linear infinite;
}

@keyframes shift-report-spin {
    to {
        transform: rotate(360deg);
    }
}

.shift-report__error {
    padding: 0.9rem 1.1rem;
    border-radius: 10px;
    background: rgba(239, 68, 68, 0.1);
    color: #b91c1c;
    font-weight: 600;
}

.shift-report__info {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.shift-report__info-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
}

.shift-report__info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.85rem 1.1rem;
    border-radius: 12px;
    background: var(--color-elevated, rgba(15, 23, 42, 0.04));
}

.shift-report__info-label {
    font-size: 0.85rem;
    color: var(--color-text-muted, #64748b);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.shift-report__info-value {
    font-weight: 600;
}

.shift-report__status {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.75rem;
    border-radius: 999px;
    background: rgba(37, 99, 235, 0.12);
    color: #1d4ed8;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.78rem;
}

.shift-report__status[data-status='CLOSED'],
.shift-report__status[data-status='SESSION_ENDED'] {
    background: rgba(16, 185, 129, 0.12);
    color: #047857;
}

.shift-report__status[data-status='FORCED'],
.shift-report__status[data-status='SESSION_FORCED'] {
    background: rgba(249, 115, 22, 0.18);
    color: #c2410c;
}

.shift-report__status[data-status='ACTIVE'],
.shift-report__status[data-status='SESSION_STARTED'] {
    background: rgba(59, 130, 246, 0.15);
    color: #1d4ed8;
}

.shift-report__metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.shift-report__metric-card {
    padding: 1.1rem 1.2rem;
    border-radius: 16px;
    background: var(--color-elevated, rgba(15, 23, 42, 0.06));
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.shift-report__metric-label {
    font-size: 0.88rem;
    color: var(--color-text-muted, #64748b);
    text-transform: uppercase;
}

.shift-report__metric-value {
    font-size: 1.6rem;
    font-weight: 700;
}

.shift-report__metric-value--positive {
    color: #047857;
}

.shift-report__metric-value--warn {
    color: #b91c1c;
}

.shift-report__grids {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
}

.shift-report__panel {
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.25);
    background: var(--color-elevated, #fff);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.shift-report__panel--secondary {
    margin-top: 1rem;
}

.shift-report__panel-header {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.shift-report__panel-header h2 {
    font-size: 1.15rem;
    font-weight: 700;
}

.shift-report__table {
    width: 100%;
    border-collapse: collapse;
}

.shift-report__table th,
.shift-report__table td {
    padding: 0.65rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid rgba(226, 232, 240, 0.65);
}

.shift-report__table th {
    font-size: 0.85rem;
    text-transform: uppercase;
    color: var(--color-text-muted, #64748b);
}

.shift-report__empty {
    text-align: center;
    padding: 1rem 0;
    color: var(--color-text-muted, #64748b);
}

.shift-report__muted {
    color: var(--color-text-muted, #94a3b8);
    font-size: 0.85rem;
}

.shift-report__event-log {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.shift-report__event-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem 0.85rem;
    border-radius: 12px;
    background: rgba(15, 23, 42, 0.04);
}

.shift-report__event-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.shift-report__event-body {
    font-size: 0.95rem;
    color: var(--color-text, #0f172a);
}

.shift-report__event-hint {
    font-size: 0.85rem;
    color: var(--color-text-muted, #94a3b8);
}

.shift-report__workshift-form {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    aligners: flex-end;
}

.shift-report__workshift-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1rem;
}

.shift-report__workshift-card {
    padding: 1rem;
    border-radius: 16px;
    border: 1px solid rgba(203, 213, 225, 0.6);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    background: var(--color-surface, rgba(248, 250, 252, 0.75));
}

.shift-report__workshift-card header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
}

.shift-report__workshift-card dl {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.6rem 1.1rem;
}

.shift-report__workshift-card dt {
    font-size: 0.85rem;
    color: var(--color-text-muted, #64748b);
    text-transform: uppercase;
}

.shift-report__workshift-card dd {
    margin: 0;
    font-weight: 600;
}

@media (max-width: 960px) {
    .shift-report__grids {
        grid-template-columns: 1fr;
    }

    .shift-report__metrics {
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    }
}

@media (max-width: 720px) {
    .shift-report__session-form {
        flex-direction: column;
        align-items: stretch;
    }

    .shift-report__btn {
        width: 100%;
        min-width: 0;
    }
}

</style>
