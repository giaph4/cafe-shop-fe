<template>
    <div class="attendance-overview">
        <div class="check-in-out-card card mb-4">
            <div class="card-body">
                <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
                    <div>
                        <h5 class="mb-1">Chấm công nhanh</h5>
                        <p class="text-muted mb-0">Thực hiện check-in/check-out cho ca làm hiện tại</p>
                    </div>
                    <button class="btn btn-outline-secondary btn-sm" type="button" @click="$emit('refresh')" :disabled="loading">
                        <i class="bi bi-arrow-clockwise me-1"></i>Làm mới
                    </button>
                </div>

                <LoadingState v-if="loading" />

                <div v-else-if="currentSession" class="current-session">
                    <div class="session-info-card">
                        <div class="session-info-card__header">
                            <div class="session-info-card__icon bg-success">
                                <i class="bi bi-check-circle"></i>
                            </div>
                            <div class="session-info-card__meta">
                                <h6 class="mb-1">Ca làm đang hoạt động</h6>
                                <p class="text-muted mb-0 small">Work Shift #{{ currentSession.workShiftId }}</p>
                            </div>
                        </div>
                        <div class="session-info-card__details">
                            <div class="detail-item">
                                <span class="detail-item__label">Thời gian bắt đầu</span>
                                <strong>{{ formatDateTime(currentSession.startTime) }}</strong>
                            </div>
                            <div class="detail-item">
                                <span class="detail-item__label">Thời gian kết thúc</span>
                                <strong>{{ formatDateTime(currentSession.endTime) }}</strong>
                            </div>
                        </div>
                    </div>

                    <div class="check-actions mt-4">
                        <form @submit.prevent="handleCheckIn" class="check-form">
                            <div class="row g-3 align-items-end">
                                <div class="col-md-4">
                                    <label class="form-label">Nguồn chấm công</label>
                                    <select class="form-select" v-model="checkInForm.source" required>
                                        <option v-for="source in attendanceSources" :key="source.value" :value="source.value">
                                            {{ source.label }}
                                        </option>
                                    </select>
                                </div>
                                <div class="col-md-5">
                                    <label class="form-label">Ghi chú (tùy chọn)</label>
                                    <input type="text" class="form-control" v-model="checkInForm.note" maxlength="255" placeholder="Nhập ghi chú nếu có" />
                                </div>
                                <div class="col-md-3">
                                    <button class="btn btn-success w-100" type="submit" :disabled="checkInSubmitting || checkOutSubmitting">
                                        <span v-if="checkInSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                                        <i v-else class="bi bi-box-arrow-in-right me-2"></i>
                                        Check-in
                                    </button>
                                </div>
                            </div>
                        </form>

                        <form @submit.prevent="handleCheckOut" class="check-form mt-3">
                            <div class="row g-3 align-items-end">
                                <div class="col-md-4">
                                    <label class="form-label">Nguồn chấm công</label>
                                    <select class="form-select" v-model="checkOutForm.source" required>
                                        <option v-for="source in attendanceSources" :key="source.value" :value="source.value">
                                            {{ source.label }}
                                        </option>
                                    </select>
                                </div>
                                <div class="col-md-5">
                                    <label class="form-label">Ghi chú (tùy chọn)</label>
                                    <input type="text" class="form-control" v-model="checkOutForm.note" maxlength="255" placeholder="Nhập ghi chú nếu có" />
                                </div>
                                <div class="col-md-3">
                                    <button class="btn btn-danger w-100" type="submit" :disabled="checkInSubmitting || checkOutSubmitting">
                                        <span v-if="checkOutSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                                        <i v-else class="bi bi-box-arrow-right me-2"></i>
                                        Check-out
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                <div v-else class="no-session">
                    <div class="no-session__icon">
                        <i class="bi bi-calendar-x"></i>
                    </div>
                    <h6 class="no-session__title">Không có ca làm đang hoạt động</h6>
                    <p class="text-muted mb-0">Bạn cần có ca làm được phân công và đang hoạt động để thực hiện chấm công.</p>
                </div>
            </div>
        </div>

        <div class="assignments-card card">
            <div class="card-header border-0">
                <h5 class="mb-1">Danh sách ca làm của tôi</h5>
                <p class="text-muted mb-0">Các ca làm đã được phân công</p>
            </div>
            <div class="card-body">
                <LoadingState v-if="loading" />
                <EmptyState
                    v-else-if="!assignments || assignments.length === 0"
                    title="Chưa có ca làm"
                    message="Chưa có ca làm nào được phân công."
                />
                <div v-else class="assignments-list">
                    <div v-for="assignment in assignments" :key="assignment.id" class="assignment-item">
                        <div class="assignment-item__header">
                            <div class="assignment-item__icon" :class="getStatusClass(assignment.status)">
                                <i :class="getStatusIcon(assignment.status)"></i>
                            </div>
                            <div class="assignment-item__meta">
                                <h6 class="mb-1">Ca làm #{{ assignment.shiftInstance?.id || 'N/A' }}</h6>
                                <p class="text-muted mb-0 small">
                                    {{ formatDateTime(assignment.shiftInstance?.startTime) }} - 
                                    {{ formatDateTime(assignment.shiftInstance?.endTime) }}
                                </p>
                            </div>
                            <span class="badge" :class="getStatusBadgeClass(assignment.status)">
                                {{ getStatusLabel(assignment.status) }}
                            </span>
                        </div>
                        <div class="assignment-item__details">
                            <div class="detail-row">
                                <span>Work Shift ID:</span>
                                <strong>#{{ assignment.shiftInstance?.workShiftId || 'N/A' }}</strong>
                            </div>
                            <div class="detail-row" v-if="assignment.shiftInstance?.shiftTemplate">
                                <span>Template:</span>
                                <strong>{{ assignment.shiftInstance.shiftTemplate.name }}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ATTENDANCE_SOURCES } from '@/api/shiftService'
import { formatDateTime } from '@/utils/formatters'
import { useAuthStore } from '@/store/auth'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const props = defineProps({
    currentSession: Object,
    assignments: Array,
    loading: Boolean,
    checkInSubmitting: Boolean,
    checkOutSubmitting: Boolean
})

const emit = defineEmits(['check-in', 'check-out', 'refresh'])

const authStore = useAuthStore()

const attendanceSources = ATTENDANCE_SOURCES

const checkInForm = reactive({
    source: attendanceSources[0]?.value || 'MANUAL',
    note: ''
})

const checkOutForm = reactive({
    source: attendanceSources[0]?.value || 'MANUAL',
    note: ''
})

const handleCheckIn = () => {
    if (!props.currentSession) return
    
    const payload = {
        assignmentId: props.currentSession.assignmentId,
        shiftId: props.currentSession.shiftInstanceId,
        userId: authStore.user?.id,
        source: checkInForm.source,
        note: checkInForm.note || null
    }
    
    emit('check-in', payload)
    checkInForm.note = ''
}

const handleCheckOut = () => {
    if (!props.currentSession) return
    
    const payload = {
        assignmentId: props.currentSession.assignmentId,
        shiftId: props.currentSession.shiftInstanceId,
        userId: authStore.user?.id,
        source: checkOutForm.source,
        note: checkOutForm.note || null
    }
    
    emit('check-out', payload)
    checkOutForm.note = ''
}

const getStatusClass = (status) => {
    const map = {
        'PENDING': 'bg-warning',
        'ACCEPTED': 'bg-success',
        'REJECTED': 'bg-danger',
        'CANCELLED': 'bg-secondary'
    }
    return map[status] || 'bg-secondary'
}

const getStatusIcon = (status) => {
    const map = {
        'PENDING': 'bi bi-clock',
        'ACCEPTED': 'bi bi-check-circle',
        'REJECTED': 'bi bi-x-circle',
        'CANCELLED': 'bi bi-x-octagon'
    }
    return map[status] || 'bi bi-question-circle'
}

const getStatusBadgeClass = (status) => {
    const map = {
        'PENDING': 'bg-warning-subtle text-warning-emphasis',
        'ACCEPTED': 'bg-success-subtle text-success-emphasis',
        'REJECTED': 'bg-danger-subtle text-danger-emphasis',
        'CANCELLED': 'bg-secondary-subtle text-secondary-emphasis'
    }
    return map[status] || 'bg-secondary-subtle text-secondary-emphasis'
}

const getStatusLabel = (status) => {
    const map = {
        'PENDING': 'Chờ xác nhận',
        'ACCEPTED': 'Đã chấp nhận',
        'REJECTED': 'Đã từ chối',
        'CANCELLED': 'Đã hủy'
    }
    return map[status] || status
}
</script>

<style scoped lang="scss">
.attendance-overview {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
}

.check-in-out-card,
.assignments-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.check-in-out-card :global(.card-body),
.assignments-card :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.check-in-out-card :global(h5),
.assignments-card :global(.card-header h5) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.check-in-out-card :global(.text-muted),
.assignments-card :global(.text-muted) {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.check-in-out-card :global(.btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.check-in-out-card :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.current-session {
    padding: var(--spacing-4);
    background: var(--color-card-muted);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
}

.session-info-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.session-info-card__header {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.session-info-card__icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
}

.session-info-card__icon.bg-success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.session-info-card__meta h6 {
    margin: 0;
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.session-info-card__details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-3);
    padding-top: var(--spacing-3);
    border-top: 1px solid var(--color-border);
}

.detail-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.detail-item__label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.detail-item strong {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.check-actions {
    padding-top: var(--spacing-3);
    border-top: 1px solid var(--color-border);
}

.check-form {
    padding: var(--spacing-4);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
}

.check-form :global(.form-label) {
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.check-form :global(.form-control),
.check-form :global(.form-select) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.check-form :global(.form-control:focus),
.check-form :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.check-form :global(.btn) {
    border-radius: var(--radius-sm);
    padding: var(--spacing-2) var(--spacing-4);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.check-form :global(.btn-success) {
    background: var(--color-success);
    border-color: var(--color-success);
    color: var(--color-text-inverse);
}

.check-form :global(.btn-success:hover:not(:disabled)) {
    background: var(--color-success-dark, #059669);
}

.check-form :global(.btn-danger) {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-text-inverse);
}

.check-form :global(.btn-danger:hover:not(:disabled)) {
    background: var(--color-danger-dark, #a0281d);
}

.no-session {
    text-align: center;
    padding: var(--spacing-8) var(--spacing-4);
}

.no-session__icon {
    font-size: 4rem;
    color: var(--color-text-muted);
    margin-bottom: 1rem;
}

.no-session__title {
    font-weight: 600;
    color: var(--color-heading);
    margin-bottom: 0.5rem;
}

.assignments-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.assignment-item {
    padding: var(--spacing-4);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    transition: all var(--transition-base);
}

.assignment-item:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

.assignment-item__header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.assignment-item__icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
}

.assignment-item__icon.bg-warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.assignment-item__icon.bg-success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.assignment-item__icon.bg-danger {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.assignment-item__icon.bg-secondary {
    background: var(--color-card-muted);
    color: var(--color-heading);
}

.assignment-item__meta {
    flex: 1;
}

.assignment-item__meta h6 {
    margin: 0;
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.assignment-item :global(.badge) {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.assignment-item :global(.badge.bg-warning-subtle) {
    background: var(--color-soft-amber);
    color: var(--color-warning);
    border: 1px solid var(--color-warning);
}

.assignment-item :global(.badge.bg-success-subtle) {
    background: var(--color-soft-emerald);
    color: var(--color-success);
    border: 1px solid var(--color-success);
}

.assignment-item :global(.badge.bg-danger-subtle) {
    background: var(--color-soft-rose);
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
}

.assignment-item :global(.badge.bg-secondary-subtle) {
    background: var(--color-card-muted);
    color: var(--color-heading);
    border: 1px solid var(--color-border);
}

.assignment-item__details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-2);
    padding-top: var(--spacing-3);
    border-top: 1px solid var(--color-border);
}

.detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.detail-row span {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.detail-row strong {
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
}
</style>

