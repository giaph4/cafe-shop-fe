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
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);
    background: var(--color-card);
}

.current-session {
    padding: var(--spacing-4);
    background: linear-gradient(160deg, rgba(244, 246, 255, 0.92), rgba(233, 240, 255, 0.84));
    border-radius: var(--radius-md);
    border: 1px solid rgba(148, 163, 184, 0.18);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.08);
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
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: #fff;
}

.session-info-card__meta h6 {
    margin: 0;
    font-weight: 600;
    color: var(--color-heading);
}

.session-info-card__details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(148, 163, 184, 0.2);
}

.detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.detail-item__label {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
}

.check-actions {
    padding-top: 1rem;
    border-top: 1px solid rgba(148, 163, 184, 0.2);
}

.check-form {
    padding: var(--spacing-4);
    background: var(--color-card);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-xs);
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
    padding: var(--spacing-5);
    background: linear-gradient(160deg, rgba(244, 246, 255, 0.92), rgba(233, 240, 255, 0.84));
    border-radius: var(--radius-md);
    border: 1px solid rgba(148, 163, 184, 0.18);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.08);
    transition: transform var(--transition-base), box-shadow var(--transition-base), background-color var(--transition-base);
}

.assignment-item:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
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
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    color: #fff;
}

.assignment-item__meta {
    flex: 1;
}

.assignment-item__meta h6 {
    margin: 0;
    font-weight: 600;
    color: var(--color-heading);
}

.assignment-item__details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(148, 163, 184, 0.15);
}

.detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
}

.detail-row span {
    color: var(--color-text-muted);
}

.detail-row strong {
    color: var(--color-heading);
    font-weight: 600;
}
</style>

