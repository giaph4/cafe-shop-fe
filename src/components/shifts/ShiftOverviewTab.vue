<template>
    <div class="shift-overview-tab">
        <!-- KPI Cards Row -->
        <div class="row g-4 mb-4">
            <div class="col-md-3 col-sm-6">
                <div class="kpi-card kpi-card--shifts">
                    <div class="kpi-card__icon">
                        <i class="bi bi-calendar-check"></i>
                    </div>
                    <div class="kpi-card__content">
                        <div class="kpi-card__label">Ca hôm nay:</div>
                        <div class="kpi-card__value">{{ formatNumber(todayShiftsCount) }}</div>
                        <div class="kpi-card__detail">{{ formatNumber(inProgressCount) }} đang diễn ra</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6">
                <div class="kpi-card kpi-card--completed">
                    <div class="kpi-card__icon">
                        <i class="bi bi-check-circle"></i>
                    </div>
                    <div class="kpi-card__content">
                        <div class="kpi-card__label">Đã hoàn thành:</div>
                        <div class="kpi-card__value">{{ formatNumber(completedCount) }}</div>
                        <div class="kpi-card__detail">{{ formatNumber(totalShiftsCount) }} tổng ca</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6">
                <div class="kpi-card kpi-card--planned">
                    <div class="kpi-card__icon">
                        <i class="bi bi-calendar-event"></i>
                    </div>
                    <div class="kpi-card__content">
                        <div class="kpi-card__label">Đã lên lịch:</div>
                        <div class="kpi-card__value">{{ formatNumber(plannedCount) }}</div>
                        <div class="kpi-card__detail">{{ formatNumber(lockedCount) }} đã khóa</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6">
                <div class="kpi-card kpi-card--cancelled">
                    <div class="kpi-card__icon">
                        <i class="bi bi-x-circle"></i>
                    </div>
                    <div class="kpi-card__content">
                        <div class="kpi-card__label">Đã hủy:</div>
                        <div class="kpi-card__value">{{ formatNumber(cancelledCount) }}</div>
                        <div class="kpi-card__detail">{{ formatNumber(assignmentsCount) }} phân công</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-4">
            <div class="col-12">
                <div class="card calendar-card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                            <div>
                                <h5 class="card-title mb-1">Lịch ca làm</h5>
                                <p class="text-muted mb-0">Đánh dấu ngày có ca và xem nhanh lịch trình.</p>
                            </div>
                            <div class="calendar-nav d-flex align-items-center gap-2">
                                <button class="btn btn-outline-secondary btn-sm" type="button" @click="changeMonth(-1)" :disabled="calendarLoading">
                                    <i class="bi bi-chevron-left"></i>
                                </button>
                                <span class="fw-semibold text-nowrap">{{ calendarTitle }}</span>
                                <button class="btn btn-outline-secondary btn-sm" type="button" @click="changeMonth(1)" :disabled="calendarLoading">
                                    <i class="bi bi-chevron-right"></i>
                                </button>
                            </div>
                        </div>

                        <ErrorState 
                            v-if="calendarError" 
                            :message="calendarError"
                        />
                        <div v-else>
                            <LoadingState v-if="calendarLoading" />
                            <div v-else>
                                <div class="calendar-grid mb-3">
                                    <div class="calendar-weekday" v-for="day in WEEK_DAYS" :key="day">{{ day }}</div>
                                    <button
                                        v-for="day in calendarCells"
                                        :key="day.dateKey"
                                        type="button"
                                        class="calendar-day"
                                        :class="{
                                            'is-outside': !day.inCurrentMonth,
                                            'is-today': day.isToday,
                                            'is-selected': calendarState.selectedDate === day.dateKey,
                                            'has-shift': day.hasShifts
                                        }"
                                        @click="handleSelectDay(day)"
                                    >
                                        <span class="day-number">{{ day.label }}</span>
                                        <span v-if="day.hasShifts" class="calendar-indicator"></span>
                                    </button>
                                </div>

                                <div class="selected-day">
                                    <h6 class="mb-3">Ca trong ngày {{ selectedDateLabel }}</h6>
                                    <div v-if="!calendarSelectedShifts.length" class="selected-day__empty text-muted text-center py-3">
                                        Chưa có ca nào. Hãy thêm ca mới cho ngày này.
                                    </div>
                                    <div v-else class="list-group list-group-flush rounded-3">
                                        <div class="list-group-item" v-for="shift in calendarSelectedShifts" :key="shift.id">
                                            <div class="d-flex justify-content-between align-items-start gap-2">
                                                <div>
                                                    <div class="fw-semibold">{{ shift.templateName || 'Ca linh hoạt' }}</div>
                                                    <div class="text-muted small">{{ formatTime(shift.startTime) }} - {{ formatTime(shift.endTime) }}</div>
                                                    <div class="text-muted small" v-if="shift.assignments?.length">
                                                        {{ shift.assignments.length }} phân công
                                                    </div>
                                                </div>
                                                <button class="btn btn-outline-primary btn-sm" type="button" @click="handleViewDetail(shift)">
                                                    <i class="bi bi-eye"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { formatNumber } from '@/utils/formatters'

const WEEK_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const CALENDAR_FETCH_SIZE = 200

const props = defineProps({
    calendarLoading: { type: Boolean, default: false },
    calendarError: { type: String, default: '' },
    calendarState: { type: Object, required: true },
    calendarCells: { type: Array, default: () => [] },
    calendarSelectedShifts: { type: Array, default: () => [] },
    selectedDateLabel: { type: String, default: '' },
    calendarTitle: { type: String, default: '' }
})

const emit = defineEmits([
    'change-month',
    'select-day',
    'view-detail'
])

const formatTime = (time) => {
    if (!time) return '--:--'
    return time.length === 5 ? time : time.slice(0, 5)
}

// Calculate statistics from calendar data
const allShifts = computed(() => {
    if (!props.calendarState?.data) return []
    return Object.values(props.calendarState.data).flat()
})

const todayKey = computed(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
})

const todayShifts = computed(() => {
    return allShifts.value.filter(shift => {
        if (!shift.shiftDate) return false
        const shiftDate = new Date(shift.shiftDate)
        const year = shiftDate.getFullYear()
        const month = String(shiftDate.getMonth() + 1).padStart(2, '0')
        const day = String(shiftDate.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}` === todayKey.value
    })
})

const todayShiftsCount = computed(() => todayShifts.value.length)

const inProgressCount = computed(() => 
    allShifts.value.filter(s => s.status === 'IN_PROGRESS').length
)

const completedCount = computed(() => 
    allShifts.value.filter(s => s.status === 'DONE').length
)

const plannedCount = computed(() => 
    allShifts.value.filter(s => s.status === 'PLANNED').length
)

const lockedCount = computed(() => 
    allShifts.value.filter(s => s.status === 'LOCKED').length
)

const cancelledCount = computed(() => 
    allShifts.value.filter(s => s.status === 'CANCELLED').length
)

const totalShiftsCount = computed(() => allShifts.value.length)

const assignmentsCount = computed(() => {
    return allShifts.value.reduce((sum, shift) => {
        return sum + (shift.assignments?.length || 0)
    }, 0)
})

const changeMonth = (delta) => emit('change-month', delta)
const handleSelectDay = (day) => emit('select-day', day)
const handleViewDetail = (shift) => emit('view-detail', shift)
</script>

<style scoped lang="scss">
/* KPI Cards - Giống Dashboard */
.kpi-card {
    background: #f8fafc;
    border: 1px solid rgba(226, 232, 240, 0.5);
    border-radius: 24px;
    padding: var(--spacing-6);
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04);
    display: flex;
    align-items: center;
    gap: var(--spacing-5);
    transition: all var(--transition-base);
    min-height: 140px;
    height: 100%;
}

.kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.06);
}

.kpi-card__icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    flex-shrink: 0;
    color: #6366f1;
    position: relative;
}

.kpi-card--shifts .kpi-card__icon {
    background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
    box-shadow: 0 2px 8px rgba(124, 58, 237, 0.15);
}

.kpi-card--completed .kpi-card__icon {
    background: linear-gradient(135deg, #d1fae5, #a7f3d0);
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
}

.kpi-card--planned .kpi-card__icon {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.kpi-card--cancelled .kpi-card__icon {
    background: linear-gradient(135deg, #fce7f3, #fbcfe8);
    box-shadow: 0 2px 8px rgba(236, 72, 153, 0.15);
}

.kpi-card__content {
    flex: 1;
    min-width: 0;
}

.kpi-card__label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
    text-transform: none;
    letter-spacing: normal;
    margin-bottom: var(--spacing-2);
    line-height: var(--line-height-normal);
}

.kpi-card__value {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
    margin-bottom: var(--spacing-1);
}

.kpi-card__detail {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
    line-height: var(--line-height-relaxed);
}

.calendar-card {
    border-radius: var(--component-radius-lg);
    border: 1px solid var(--color-border);
    box-shadow: var(--component-shadow);
    background: var(--color-card);
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 0.5rem;
}

.calendar-weekday {
    text-align: center;
    font-weight: 600;
    color: var(--color-text-muted);
}

.calendar-day {
    position: relative;
    border: none;
    background: var(--color-card-muted);
    border-radius: 14px;
    padding: 0.75rem 0.6rem;
    text-align: left;
    transition: all 0.2s ease;
    color: inherit;
}

.calendar-day:hover {
    background: var(--color-soft-primary);
}

.calendar-day.is-outside {
    opacity: 0.4;
}

.calendar-day.is-selected {
    border: 1.5px solid var(--color-primary);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.18);
    background: var(--color-soft-primary);
}

.calendar-day.is-today .day-number {
    font-weight: 700;
    color: var(--color-primary);
}

.calendar-indicator {
    position: absolute;
    right: 12px;
    bottom: 10px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-success);
}

.selected-day {
    border: 1px dashed var(--color-border);
    border-radius: 16px;
    padding: 1rem;
    background: var(--color-card-muted);
}

.selected-day__empty {
    border: 1px dashed var(--color-border);
    border-radius: 16px;
    background: var(--color-card-muted);
}

@media (max-width: 992px) {
    .kpi-card {
        min-height: 120px;
    }
}

@media (max-width: 768px) {
    .kpi-card {
        flex-direction: column;
        text-align: center;
        min-height: auto;
    }

    .calendar-grid {
        gap: 0.25rem;
    }

    .calendar-day {
        padding: 0.5rem 0.4rem;
        font-size: 0.875rem;
    }

    .selected-day {
        padding: 0.75rem;
    }
}

@media (max-width: 576px) {
    .calendar-weekday {
        font-size: 0.75rem;
    }

    .calendar-day {
        padding: 0.4rem 0.3rem;
    }
}
</style>

