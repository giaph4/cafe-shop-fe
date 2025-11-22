<template>
    <div class="shift-report-detail-tab">
        <div class="card filter-card mb-4">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-lg-4 col-md-6">
                        <label class="form-label">Session ID <span class="text-danger">*</span></label>
                        <input
                            type="number"
                            class="form-control"
                            v-model.number="sessionIdInput"
                            min="1"
                            placeholder="Nhập ID phiên"
                            required
                        />
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label">Tùy chọn</label>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" role="switch" id="refreshData" v-model="refresh" />
                            <label class="form-check-label" for="refreshData">Lấy mới dữ liệu</label>
                        </div>
                    </div>
                    <div class="col-lg-5 col-md-12 text-lg-end text-md-start">
                        <button class="btn btn-primary me-2" type="button" @click="handleFetch" :disabled="loading">
                            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                            <i class="bi bi-search me-2"></i>Lấy báo cáo
                        </button>
                        <button
                            class="btn btn-outline-success"
                            type="button"
                            :disabled="loading || !report"
                            @click="handleRegenerate"
                        >
                            <i class="bi bi-arrow-clockwise me-2"></i>Tái tổng hợp
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="errorMessage" class="alert alert-danger mb-4" role="alert">
            <i class="bi bi-exclamation-triangle me-2"></i>{{ errorMessage }}
        </div>

        <div v-if="report" class="report-content">
            <div class="card info-card mb-4">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
                        <div>
                            <h5 class="card-title mb-2">Thông tin phiên ca</h5>
                            <p class="text-muted mb-0">Chi tiết về phiên ca làm việc và thời gian thực hiện.</p>
                        </div>
                        <div class="connection-status" :data-state="connectionState">
                            <span class="connection-indicator"></span>
                            <span class="connection-text">{{ connectionStatusLabel }}</span>
                            <button
                                v-if="connectionState !== 'online'"
                                type="button"
                                class="btn btn-sm btn-outline-primary ms-2"
                                :disabled="connectingRealtime"
                                @click="handleReconnect"
                            >
                                {{ connectingRealtime ? 'Đang kết nối...' : 'Kết nối lại' }}
                            </button>
                        </div>
                    </div>
                    <div v-if="connectionError" class="text-danger small mb-2">{{ connectionError }}</div>

                    <div class="row g-3">
                        <div class="col-md-4">
                            <div class="info-item">
                                <span class="info-label">Trạng thái phiên</span>
                                <span class="badge" :class="statusClass(report.status)">{{ statusLabel }}</span>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="info-item">
                                <span class="info-label">Nhân viên phụ trách</span>
                                <span class="info-value">#{{ report.userId }} — {{ report.username || 'Không rõ' }}</span>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="info-item">
                                <span class="info-label">Ca mẫu</span>
                                <span class="info-value">{{ report.workShiftId ? `#${report.workShiftId}` : 'Không xác định' }}</span>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="info-item">
                                <span class="info-label">Bắt đầu</span>
                                <span class="info-value">{{ formatDateTime(report.startAt) }}</span>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="info-item">
                                <span class="info-label">Kết thúc</span>
                                <span class="info-value">{{ report.endAt ? formatDateTime(report.endAt) : 'Chưa kết thúc' }}</span>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="info-item">
                                <span class="info-label">Tổng hợp lúc</span>
                                <span class="info-value">{{ formatDateTime(report.generatedAt) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-4 mb-4">
                <div class="col-md-3 col-sm-6 d-flex">
                    <div class="metric-card w-100">
                        <div class="metric-label">Tổng đơn</div>
                        <div class="metric-value">{{ formatNumber(report.totalOrders) }}</div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 d-flex">
                    <div class="metric-card metric-card--success w-100">
                        <div class="metric-label">Doanh thu đã thanh toán</div>
                        <div class="metric-value">{{ formatCurrency(report.totalPaidAmount) }}</div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 d-flex">
                    <div class="metric-card metric-card--warning w-100">
                        <div class="metric-label">Giá trị chưa thanh toán</div>
                        <div class="metric-value">{{ formatCurrency(report.totalUnpaidAmount) }}</div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 d-flex">
                    <div class="metric-card w-100">
                        <div class="metric-label">Đơn chuyển giao</div>
                        <div class="metric-value">{{ formatNumber(report.transferredOrders) }}</div>
                    </div>
                </div>
            </div>

            <div class="row g-4 mb-4">
                <div class="col-md-6">
                    <div class="card table-card">
                        <div class="card-body">
                            <h6 class="card-title mb-3">Phân bổ theo phương thức thanh toán</h6>
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Phương thức</th>
                                            <th>Đơn hàng</th>
                                            <th class="text-end">Doanh thu</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-if="!report.paymentBreakdown.length">
                                            <td colspan="3" class="text-center text-muted py-4">Không có dữ liệu</td>
                                        </tr>
                                        <tr v-for="method in report.paymentBreakdown" :key="method.paymentMethod">
                                            <td>{{ paymentMethodLabel(method.paymentMethod) }}</td>
                                            <td>{{ formatNumber(method.orderCount) }}</td>
                                            <td class="text-end">{{ formatCurrency(method.totalAmount) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card table-card">
                        <div class="card-body">
                            <h6 class="card-title mb-3">Top sản phẩm theo số lượng</h6>
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Sản phẩm</th>
                                            <th>Số lượng</th>
                                            <th class="text-end">Doanh thu</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-if="!report.topProducts.length">
                                            <td colspan="3" class="text-center text-muted py-4">Không có dữ liệu</td>
                                        </tr>
                                        <tr v-for="product in report.topProducts" :key="product.productId || product.productName">
                                            <td>
                                                <strong>{{ product.productName || 'Không rõ' }}</strong>
                                                <small v-if="product.productId" class="text-muted d-block">#{{ product.productId }}</small>
                                            </td>
                                            <td>{{ formatNumber(product.quantity) }}</td>
                                            <td class="text-end">{{ formatCurrency(product.totalAmount) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card event-log-card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h6 class="card-title mb-1">Nhật ký sự kiện mới nhất</h6>
                            <small class="text-muted">Tự động cập nhật từ realtime events</small>
                        </div>
                    </div>
                    <div v-if="!eventLog.length" class="text-center text-muted py-4">
                        Chưa có sự kiện nào.
                    </div>
                    <div v-else class="event-log">
                        <div v-for="(event, index) in eventLog" :key="index" class="event-item">
                            <div class="event-meta">
                                <span class="badge" :class="eventStatusClass(event.eventType)">{{ event.eventType }}</span>
                                <span class="text-muted small">{{ formatDateTime(event.receivedAt) }}</span>
                            </div>
                            <div class="event-body">
                                Session #{{ event.session?.id ?? 'N/A' }} — {{ event.session?.status ?? 'UNKNOWN' }}
                                <span v-if="event.report"> | Báo cáo #{{ event.report.reportId }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { formatCurrency, formatNumber, formatDateTime } from '@/utils/formatters'

const props = defineProps({
    report: { type: Object, default: null },
    loading: { type: Boolean, default: false },
    errorMessage: { type: String, default: '' },
    eventLog: { type: Array, default: () => [] },
    connectionState: { type: String, default: 'offline' },
    connectionStatusLabel: { type: String, default: '' },
    connectionError: { type: String, default: '' },
    connectingRealtime: { type: Boolean, default: false }
})

const emit = defineEmits(['fetch', 'regenerate', 'reconnect'])

const sessionIdInput = ref('')
const refresh = ref(false)

const statusLabel = computed(() => statusLabelFor(props.report?.status))

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

const statusClass = (status) => {
    switch ((status || '').toUpperCase()) {
        case 'ACTIVE':
            return 'bg-info text-dark'
        case 'CLOSED':
            return 'bg-success'
        case 'FORCED':
            return 'bg-warning text-dark'
        default:
            return 'bg-secondary'
    }
}

const eventStatusClass = (eventType) => {
    if (eventType?.includes('STARTED')) return 'bg-info text-dark'
    if (eventType?.includes('ENDED')) return 'bg-success'
    if (eventType?.includes('FORCED')) return 'bg-warning text-dark'
    return 'bg-secondary'
}

const paymentMethodLabel = (code) => {
    if (!code) return 'Không xác định'
    const normalized = String(code).toUpperCase()
    const map = {
        CASH: 'Tiền mặt',
        CREDIT_CARD: 'Thẻ tín dụng',
        DEBIT_CARD: 'Thẻ ghi nợ',
        BANK_TRANSFER: 'Chuyển khoản',
        E_WALLET: 'Ví điện tử',
        QRIS: 'Thanh toán QR',
        OTHER: 'Khác'
    }
    return map[normalized] || normalized
}

const handleFetch = () => {
    emit('fetch', { sessionId: sessionIdInput.value, refresh: refresh.value })
}

const handleRegenerate = () => {
    emit('regenerate')
}

const handleReconnect = () => {
    emit('reconnect')
}
</script>

<style scoped>
.filter-card,
.info-card,
.table-card,
.event-log-card {
    border-radius: 18px;
    border: 1px solid var(--color-border);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
}

.connection-status {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.75rem;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.12);
    color: var(--color-text-muted);
    font-size: 0.9rem;
}

.connection-status[data-state='online'] {
    background: rgba(34, 197, 94, 0.12);
    color: #15803d;
}

.connection-status[data-state='connecting'] {
    background: rgba(59, 130, 246, 0.12);
    color: #1d4ed8;
}

.connection-status[data-state='offline'] {
    background: rgba(248, 113, 113, 0.15);
    color: #b91c1c;
}

.connection-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6);
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem 1rem;
    border-radius: 14px;
    background: var(--color-card-muted);
    border: 1px solid var(--color-border-subtle);
}

.info-label {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.info-value {
    font-weight: 600;
}

.metric-card {
    padding: 1.25rem;
    border-radius: 16px;
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    border: 1px solid var(--color-border);
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
    height: 100%;
    min-height: 140px;
}

.metric-card--success .metric-value {
    color: #047857;
}

.metric-card--warning .metric-value {
    color: #b91c1c;
}

.metric-label {
    font-size: 0.88rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    margin-bottom: 0.5rem;
}

.metric-value {
    font-size: 1.6rem;
    font-weight: 700;
}

.event-log {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.event-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    background: var(--color-card-muted);
    border: 1px solid var(--color-border-subtle);
}

.event-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.event-body {
    font-size: 0.95rem;
    color: var(--color-text);
}
</style>

