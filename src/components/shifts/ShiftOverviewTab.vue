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

<style scoped>
/* KPI Cards */
.kpi-card {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    padding: var(--spacing-4);
    box-shadow: var(--shadow-base);
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    transition: box-shadow var(--transition-base);
    min-height: 120px;
    height: 100%;
}

.kpi-card:hover {
    box-shadow: var(--shadow-hover);
}

.kpi-card__icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-base);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
    background: var(--color-bg-muted);
    color: var(--color-primary);
}

.kpi-card--shifts .kpi-card__icon {
    color: var(--color-primary);
}

.kpi-card--completed .kpi-card__icon {
    color: var(--color-success);
}

.kpi-card--planned .kpi-card__icon {
    color: var(--color-info);
}

.kpi-card--cancelled .kpi-card__icon {
    color: var(--color-danger);
}

.kpi-card__content {
    flex: 1;
    min-width: 0;
}

.kpi-card__label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-2);
    line-height: var(--line-height-normal);
}

.kpi-card__value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    line-height: var(--line-height-tight);
    margin-bottom: var(--spacing-1);
}

.kpi-card__detail {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
    line-height: var(--line-height-relaxed);
}

/* Calendar Card */
.calendar-card {
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-base);
    background: var(--color-bg);
}

.calendar-card :global(.card-body) {
    padding: var(--spacing-4);
}

.calendar-card :global(.card-title) {
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-1);
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: var(--spacing-2);
}

.calendar-weekday {
    text-align: center;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    padding: var(--spacing-2);
}

.calendar-day {
    position: relative;
    border: 1px solid transparent;
    background: var(--color-bg-muted);
    border-radius: var(--radius-base);
    padding: var(--spacing-2);
    text-align: left;
    transition: all var(--transition-base);
    color: var(--color-text);
    cursor: pointer;
}

.calendar-day:hover {
    background: var(--color-primary-soft);
    border-color: var(--color-primary);
}

.calendar-day.is-outside {
    opacity: 0.4;
}

.calendar-day.is-selected {
    border-color: var(--color-primary);
    background: var(--color-primary-soft);
    box-shadow: var(--shadow-sm);
}

.calendar-day.is-today .day-number {
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
}

.calendar-indicator {
    position: absolute;
    right: 8px;
    bottom: 8px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-success);
}

.selected-day {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    padding: var(--spacing-4);
    background: var(--color-bg-muted);
}

.selected-day :global(h6) {
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-3);
}

.selected-day__empty {
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-base);
    background: var(--color-bg-muted);
    padding: var(--spacing-3);
    text-align: center;
    color: var(--color-text-muted);
}

.selected-day :global(.list-group-item) {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    margin-bottom: var(--spacing-2);
    background: var(--color-bg);
    padding: var(--spacing-3);
}

.selected-day :global(.list-group-item:last-child) {
    margin-bottom: 0;
}

/* Responsive */
@media (max-width: 992px) {
    .kpi-card {
        min-height: 100px;
    }
}

@media (max-width: 768px) {
    .kpi-card {
        flex-direction: column;
        text-align: center;
        min-height: auto;
        padding: var(--spacing-3);
    }

    .calendar-grid {
        gap: var(--spacing-1);
    }

    .calendar-day {
        padding: var(--spacing-1);
        font-size: var(--font-size-sm);
    }

    .selected-day {
        padding: var(--spacing-3);
    }
}

@media (max-width: 576px) {
    .calendar-weekday {
        font-size: var(--font-size-xs);
        padding: var(--spacing-1);
    }

    .calendar-day {
        padding: var(--spacing-1);
        font-size: var(--font-size-xs);
    }
}
</style>

