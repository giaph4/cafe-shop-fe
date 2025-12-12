<template>
  <div class="shift-report-detail-tab">
    <div class="card filter-card mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-lg-4 col-md-6">
            <label class="form-label">Session ID <span class="text-danger">*</span></label>
            <input
              v-model.number="sessionIdInput"
              type="number"
              class="form-control"
              min="1"
              placeholder="Nhập ID phiên"
              required
            >
          </div>
          <div class="col-lg-3 col-md-6">
            <label class="form-label">Tùy chọn</label>
            <div class="form-check form-switch">
              <input
                id="refreshData"
                v-model="refresh"
                class="form-check-input"
                type="checkbox"
                role="switch"
              >
              <label
                class="form-check-label"
                for="refreshData"
              >Lấy mới dữ liệu</label>
            </div>
          </div>
          <div class="col-lg-5 col-md-12 text-lg-end text-md-start">
            <button
              class="btn btn-primary me-2"
              type="button"
              :disabled="loading"
              @click="handleFetch"
            >
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
              />
              <i class="bi bi-search me-2" />Lấy báo cáo
            </button>
            <button
              class="btn btn-outline-success"
              type="button"
              :disabled="loading || !report"
              @click="handleRegenerate"
            >
              <i class="bi bi-arrow-clockwise me-2" />Tái tổng hợp
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="alert alert-danger mb-4"
      role="alert"
    >
      <i class="bi bi-exclamation-triangle me-2" />{{ errorMessage }}
    </div>

    <div
      v-if="report"
      class="report-content"
    >
      <div class="card info-card mb-4">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
            <div>
              <h5 class="card-title mb-2">
                Thông tin phiên ca
              </h5>
              <p class="text-muted mb-0">
                Chi tiết về phiên ca làm việc và thời gian thực hiện.
              </p>
            </div>
            <div
              class="connection-status"
              :data-state="connectionState"
            >
              <span class="connection-indicator" />
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
          <div
            v-if="connectionError"
            class="text-danger small mb-2"
          >
            {{ connectionError }}
          </div>

          <div class="row g-3">
            <div class="col-md-4">
              <div class="info-item">
                <span class="info-label">Trạng thái phiên</span>
                <span
                  class="badge"
                  :class="statusClass(report.status)"
                >{{ statusLabel }}</span>
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
            <div class="metric-label">
              Tổng đơn
            </div>
            <div class="metric-value">
              {{ formatNumber(report.totalOrders) }}
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6 d-flex">
          <div class="metric-card metric-card--success w-100">
            <div class="metric-label">
              Doanh thu đã thanh toán
            </div>
            <div class="metric-value">
              {{ formatCurrency(report.totalPaidAmount) }}
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6 d-flex">
          <div class="metric-card metric-card--warning w-100">
            <div class="metric-label">
              Giá trị chưa thanh toán
            </div>
            <div class="metric-value">
              {{ formatCurrency(report.totalUnpaidAmount) }}
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6 d-flex">
          <div class="metric-card w-100">
            <div class="metric-label">
              Đơn chuyển giao
            </div>
            <div class="metric-value">
              {{ formatNumber(report.transferredOrders) }}
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-md-6">
          <div class="card table-card">
            <div class="card-body">
              <h6 class="card-title mb-3">
                Phân bổ theo phương thức thanh toán
              </h6>
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Phương thức</th>
                      <th>Đơn hàng</th>
                      <th class="text-end">
                        Doanh thu
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!report.paymentBreakdown.length">
                      <td
                        colspan="3"
                        class="text-center text-muted py-4"
                      >
                        Không có dữ liệu
                      </td>
                    </tr>
                    <tr
                      v-for="method in report.paymentBreakdown"
                      :key="method.paymentMethod"
                    >
                      <td>{{ paymentMethodLabel(method.paymentMethod) }}</td>
                      <td>{{ formatNumber(method.orderCount) }}</td>
                      <td class="text-end">
                        {{ formatCurrency(method.totalAmount) }}
                      </td>
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
              <h6 class="card-title mb-3">
                Top sản phẩm theo số lượng
              </h6>
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Số lượng</th>
                      <th class="text-end">
                        Doanh thu
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!report.topProducts.length">
                      <td
                        colspan="3"
                        class="text-center text-muted py-4"
                      >
                        Không có dữ liệu
                      </td>
                    </tr>
                    <tr
                      v-for="product in report.topProducts"
                      :key="product.productId || product.productName"
                    >
                      <td>
                        <strong>{{ product.productName || 'Không rõ' }}</strong>
                        <small
                          v-if="product.productId"
                          class="text-muted d-block"
                        >#{{ product.productId }}</small>
                      </td>
                      <td>{{ formatNumber(product.quantity) }}</td>
                      <td class="text-end">
                        {{ formatCurrency(product.totalAmount) }}
                      </td>
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
              <h6 class="card-title mb-1">
                Nhật ký sự kiện mới nhất
              </h6>
              <small class="text-muted">Tự động cập nhật từ realtime events</small>
            </div>
          </div>
          <div
            v-if="!eventLog.length"
            class="text-center text-muted py-4"
          >
            Chưa có sự kiện nào.
          </div>
          <div
            v-else
            class="event-log"
          >
            <div
              v-for="(event, index) in eventLog"
              :key="index"
              class="event-item"
            >
              <div class="event-meta">
                <span
                  class="badge"
                  :class="eventStatusClass(event.eventType)"
                >{{ event.eventType }}</span>
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
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.filter-card :global(.card-body),
.info-card :global(.card-body),
.table-card :global(.card-body),
.event-log-card :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.filter-card :global(.form-label) {
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-control) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-control:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.filter-card :global(.form-check-label) {
    font-size: var(--font-size-base);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.filter-card :global(.btn) {
    border-radius: var(--radius-sm);
    padding: var(--spacing-2) var(--spacing-4);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.filter-card :global(.btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.filter-card :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.filter-card :global(.btn-outline-success) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.filter-card :global(.btn-outline-success:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.filter-card :global(.alert-danger) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-danger);
    background: var(--color-soft-rose);
    color: var(--color-danger);
    padding: var(--spacing-3) var(--spacing-4);
    font-family: var(--font-family-sans);
}

.info-card :global(.card-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.info-card :global(.text-muted) {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.connection-status {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    background: var(--color-card-muted);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    font-family: var(--font-family-sans);
}

.connection-status[data-state='online'] {
    background: var(--color-soft-emerald);
    color: var(--color-success);
    border: 1px solid var(--color-success);
}

.connection-status[data-state='connecting'] {
    background: var(--color-soft-indigo);
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
}

.connection-status[data-state='offline'] {
    background: var(--color-soft-rose);
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
}

.connection-status :global(.btn-sm) {
    border-radius: var(--radius-sm);
    padding: var(--spacing-1) var(--spacing-2);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.connection-status :global(.btn-outline-primary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.connection-status :global(.btn-outline-primary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.connection-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: currentColor;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    padding: var(--spacing-3);
    border-radius: var(--radius-sm);
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
}

.info-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.info-value {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.info-item :global(.badge) {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.info-item :global(.badge.bg-info) {
    background: var(--color-soft-indigo);
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
}

.info-item :global(.badge.bg-success) {
    background: var(--color-soft-emerald);
    color: var(--color-success);
    border: 1px solid var(--color-success);
}

.info-item :global(.badge.bg-warning) {
    background: var(--color-soft-amber);
    color: var(--color-warning);
    border: 1px solid var(--color-warning);
}

.info-item :global(.badge.bg-secondary) {
    background: var(--color-card-muted);
    color: var(--color-heading);
    border: 1px solid var(--color-border);
}

.metric-card {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    height: 100%;
    min-height: 140px;
    transition: all var(--transition-base);
}

.metric-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

.metric-card--success .metric-value {
    color: var(--color-success);
}

.metric-card--warning .metric-value {
    color: var(--color-danger);
}

.metric-label {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.metric-value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.event-log-card :global(.card-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.event-log-card :global(.text-muted) {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.table-card :global(.card-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-3);
    font-family: var(--font-family-sans);
}

.table-card :global(.table) {
    margin-bottom: 0;
}

.table-card :global(.table thead),
.table-card :global(.table thead.table-light) {
    background: var(--color-card-muted);
}

.table-card :global(.table thead th) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    background: var(--color-card-muted);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-3);
    font-family: var(--font-family-sans);
}

.table-card :global(.table tbody td) {
    padding: var(--spacing-3);
    vertical-align: middle;
    border-bottom: 1px solid var(--color-border);
    font-family: var(--font-family-sans);
}

.table-card :global(.table tbody tr:last-child td) {
    border-bottom: none;
}

.table-card :global(.table tbody tr:hover) {
    background: var(--color-card-muted);
}

.table-card :global(strong) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.table-card :global(.text-muted) {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.event-log {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.event-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    padding: var(--spacing-3);
    border-radius: var(--radius-sm);
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
}

.event-meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
}

.event-meta :global(.badge) {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.event-meta :global(.badge.bg-info) {
    background: var(--color-soft-indigo);
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
}

.event-meta :global(.badge.bg-success) {
    background: var(--color-soft-emerald);
    color: var(--color-success);
    border: 1px solid var(--color-success);
}

.event-meta :global(.badge.bg-warning) {
    background: var(--color-soft-amber);
    color: var(--color-warning);
    border: 1px solid var(--color-warning);
}

.event-meta :global(.badge.bg-secondary) {
    background: var(--color-card-muted);
    color: var(--color-heading);
    border: 1px solid var(--color-border);
}

.event-meta :global(.text-muted) {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.event-body {
    font-size: var(--font-size-base);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}
</style>

