<template>
    <div class="shift-overview-tab">
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

                        <div v-if="calendarError" class="alert alert-warning mb-0">
                            {{ calendarError }}
                        </div>
                        <div v-else>
                            <div v-if="calendarLoading" class="text-center py-4">
                                <div class="spinner-border text-primary"></div>
                            </div>
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

const changeMonth = (delta) => emit('change-month', delta)
const handleSelectDay = (day) => emit('select-day', day)
const handleViewDetail = (shift) => emit('view-detail', shift)
</script>

<style scoped>
.calendar-card {
    border-radius: 18px;
    border: 1px solid var(--color-border);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
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

</style>

