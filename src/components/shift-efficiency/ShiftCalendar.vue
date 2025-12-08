<template>
    <div class="shift-calendar">
        <div class="calendar-grid">
            <div
                v-for="day in calendarDays"
                :key="day.date"
                class="calendar-day"
                :class="getDayClass(day)"
            >
                <div class="day-header">
                    <div class="day-date">{{ formatDayDate(day.date) }}</div>
                    <div class="day-name">{{ formatDayName(day.date) }}</div>
                </div>
                <div class="day-shifts">
                    <div
                        v-for="shift in day.shifts"
                        :key="shift.shiftId"
                        class="shift-item"
                        :class="getShiftEfficiencyClass(shift.efficiencyScore)"
                        @click="$emit('select', shift)"
                        :title="`${shift.shiftName}: ${shift.efficiencyScore.toFixed(1)} điểm`"
                    >
                        <div class="shift-time">{{ formatTime(shift.startTime) }}</div>
                        <div class="shift-score">{{ shift.efficiencyScore.toFixed(0) }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatDate, formatTime } from '@/utils/formatters'

const props = defineProps({
    shifts: {
        type: Array,
        required: true,
        default: () => []
    }
})

defineEmits(['select'])

const calendarDays = computed(() => {
    const daysMap = new Map()
    
    props.shifts.forEach(shift => {
        const dateKey = shift.date
        if (!daysMap.has(dateKey)) {
            daysMap.set(dateKey, {
                date: dateKey,
                shifts: []
            })
        }
        daysMap.get(dateKey).shifts.push(shift)
    })
    
    return Array.from(daysMap.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 14)
})

const getDayClass = (day) => {
    const today = new Date().toISOString().split('T')[0]
    if (day.date === today) return 'day-today'
    return ''
}

const getShiftEfficiencyClass = (score) => {
    if (score >= 80) return 'shift-excellent'
    if (score >= 60) return 'shift-good'
    if (score >= 40) return 'shift-average'
    return 'shift-poor'
}

const formatDayDate = (date) => {
    const d = new Date(date)
    return d.getDate()
}

const formatDayName = (date) => {
    const d = new Date(date)
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    return days[d.getDay()]
}
</script>

<style scoped>
.shift-calendar {
    font-family: var(--font-family-sans);
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--spacing-3);
}

.calendar-day {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    padding: var(--spacing-2);
    transition: all var(--transition-base);
}

.calendar-day:hover {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
}

.day-today {
    border-color: var(--color-primary);
    background: var(--color-soft-primary);
}

.day-header {
    text-align: center;
    margin-bottom: var(--spacing-2);
    padding-bottom: var(--spacing-2);
    border-bottom: 1px solid var(--color-border);
}

.day-date {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.day-name {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.day-shifts {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.shift-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-2);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.shift-item:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
}

.shift-excellent {
    background: var(--color-soft-emerald);
    border: 1px solid var(--color-success);
}

.shift-good {
    background: var(--color-soft-sky);
    border: 1px solid var(--color-info);
}

.shift-average {
    background: var(--color-soft-amber);
    border: 1px solid var(--color-warning);
}

.shift-poor {
    background: var(--color-soft-rose);
    border: 1px solid var(--color-danger);
}

.shift-time {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
}

.shift-score {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
}

@media (max-width: 768px) {
    .calendar-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>

