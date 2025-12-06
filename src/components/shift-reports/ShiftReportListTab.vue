<template>
    <div class="shift-report-list-tab">
        <div class="card filter-card mb-4">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-lg-4 col-md-6">
                        <label class="form-label">Work Shift ID <span class="text-danger">*</span></label>
                        <input
                            type="number"
                            class="form-control"
                            v-model.number="workShiftIdInput"
                            min="1"
                            placeholder="Nhập ID ca mẫu"
                            required
                        />
                    </div>
                    <div class="col-lg-8 col-md-6 text-lg-end text-md-start">
                        <button class="btn btn-primary" type="button" @click="handleFetch" :disabled="loading">
                            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                            <i class="bi bi-search me-2"></i>Lấy danh sách
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="error" class="alert alert-danger mb-4" role="alert">
            <i class="bi bi-exclamation-triangle me-2"></i>{{ error }}
        </div>

        <div v-if="reports.length" class="row g-4">
            <div class="col-md-6 col-lg-4" v-for="item in reports" :key="item.reportId">
                <div class="card report-card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h6 class="card-title mb-1">#{{ item.reportId }}</h6>
                                <small class="text-muted">Session {{ item.sessionId }}</small>
                            </div>
                            <span class="badge" :class="statusClass(item.status)">{{ statusLabelFor(item.status) }}</span>
                        </div>
                        <dl class="report-details">
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
                                <dd class="text-success">{{ formatCurrency(item.totalPaidAmount) }}</dd>
                            </div>
                            <div>
                                <dt>Giá trị chưa thanh toán</dt>
                                <dd class="text-danger">{{ formatCurrency(item.totalUnpaidAmount) }}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
        <div v-else-if="!loading" class="text-center text-muted py-5">
            <i class="bi bi-inbox fs-1 d-block mb-3"></i>
            <p>Chưa có báo cáo nào tương ứng.</p>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { formatCurrency, formatDateTime } from '@/utils/formatters'

const props = defineProps({
    reports: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    error: { type: String, default: '' }
})

const emit = defineEmits(['fetch'])

const workShiftIdInput = ref('')

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

const handleFetch = () => {
    emit('fetch', workShiftIdInput.value)
}
</script>

<style scoped>
.filter-card,
.report-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.filter-card :global(.card-body),
.report-card :global(.card-body) {
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

.filter-card :global(.btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
    border-radius: var(--radius-sm);
    padding: var(--spacing-2) var(--spacing-4);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.filter-card :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.filter-card :global(.alert-danger) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-danger);
    background: var(--color-soft-rose);
    color: var(--color-danger);
    padding: var(--spacing-3) var(--spacing-4);
    font-family: var(--font-family-sans);
}

.report-card :global(.card-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.report-card :global(.text-muted) {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.report-card :global(.badge) {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.report-card :global(.badge.bg-info) {
    background: var(--color-soft-indigo);
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
}

.report-card :global(.badge.bg-success) {
    background: var(--color-soft-emerald);
    color: var(--color-success);
    border: 1px solid var(--color-success);
}

.report-card :global(.badge.bg-warning) {
    background: var(--color-soft-amber);
    color: var(--color-warning);
    border: 1px solid var(--color-warning);
}

.report-card :global(.badge.bg-secondary) {
    background: var(--color-card-muted);
    color: var(--color-heading);
    border: 1px solid var(--color-border);
}

.report-details {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--spacing-2) var(--spacing-3);
    margin: 0;
    font-family: var(--font-family-sans);
}

.report-details dt {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.report-details dd {
    margin: 0;
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.report-details :global(.text-success) {
    color: var(--color-success);
}

.report-details :global(.text-danger) {
    color: var(--color-danger);
}
</style>

