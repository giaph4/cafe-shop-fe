<template>
  <WidgetBase
    :widget="widget"
    :is-editing="isEditing"
    :is-dragging="isDragging"
  >
    <div class="calendar-widget">
      <div class="calendar-widget__header">
        <button
          class="btn btn-sm btn-link"
          @click="previousMonth"
        >
          <i class="bi bi-chevron-left" />
        </button>
        <div class="calendar-widget__month-year">
          {{ currentMonthYear }}
        </div>
        <button
          class="btn btn-sm btn-link"
          @click="nextMonth"
        >
          <i class="bi bi-chevron-right" />
        </button>
      </div>
      <div class="calendar-widget__weekdays">
        <div
          v-for="day in weekdays"
          :key="day"
          class="calendar-widget__weekday"
        >
          {{ day }}
        </div>
      </div>
      <div class="calendar-widget__days">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="calendar-widget__day"
          :class="getDayClass(day)"
          @click="handleDayClick(day)"
        >
          <span class="calendar-widget__day-number">{{ day.date }}</span>
          <div
            v-if="day.events && day.events.length > 0"
            class="calendar-widget__day-events"
          >
            <span
              v-for="(event, eventIndex) in day.events.slice(0, 3)"
              :key="eventIndex"
              class="calendar-widget__day-event"
              :style="{ backgroundColor: event.color || 'var(--color-primary)' }"
            />
          </div>
        </div>
      </div>
    </div>
  </WidgetBase>
</template>

<script setup>
import { computed, ref } from 'vue'
import WidgetBase from '../WidgetBase.vue'

const props = defineProps({
    widget: {
        type: Object,
        required: true
    },
    isEditing: {
        type: Boolean,
        default: false
    },
    isDragging: {
        type: Boolean,
        default: false
    },
    data: {
        type: Array,
        default: null
    }
})

const currentDate = ref(new Date())
const events = ref([])

const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

const currentMonthYear = computed(() => {
    const month = currentDate.value.toLocaleDateString('vi-VN', { month: 'long' })
    const year = currentDate.value.getFullYear()
    return `${month} ${year}`
})

const calendarDays = computed(() => {
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const firstDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days = []

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
        days.push({ date: null, isCurrentMonth: false, events: [] })
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day)
        const dayEvents = events.value.filter(e => {
            const eventDate = new Date(e.date)
            return eventDate.toDateString() === date.toDateString()
        })
        days.push({
            date: day,
            isCurrentMonth: true,
            isToday: isToday(date),
            events: dayEvents
        })
    }

    // Fill remaining cells to complete grid
    const remaining = 42 - days.length
    for (let i = 0; i < remaining; i++) {
        days.push({ date: null, isCurrentMonth: false, events: [] })
    }

    return days
})

const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
}

const getDayClass = (day) => ({
    'calendar-widget__day--other-month': !day.isCurrentMonth,
    'calendar-widget__day--today': day.isToday,
    'calendar-widget__day--has-events': day.events && day.events.length > 0
})

const previousMonth = () => {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

const handleDayClick = (day) => {
    if (day.date && day.isCurrentMonth) {
        // Emit event or handle day click
        console.log('Day clicked:', day)
    }
}

// Initialize events from widget config or props
if (props.widget.config?.events) {
    events.value = Array.isArray(props.widget.config.events) ? props.widget.config.events : []
}

if (props.data) {
    events.value = Array.isArray(props.data) ? props.data : []
}
</script>

<style scoped>
.calendar-widget {
    width: 100%;
}

.calendar-widget__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-3);
    border-bottom: 1px solid var(--color-border);
}

.calendar-widget__month-year {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    color: var(--color-text);
}

.calendar-widget__weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: var(--spacing-1);
    padding: var(--spacing-2);
    border-bottom: 1px solid var(--color-border);
}

.calendar-widget__weekday {
    text-align: center;
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
}

.calendar-widget__days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: var(--spacing-1);
    padding: var(--spacing-2);
}

.calendar-widget__day {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: var(--spacing-1);
    border-radius: var(--radius-base);
    cursor: pointer;
    transition: all var(--transition-base);
    position: relative;
}

.calendar-widget__day:hover {
    background: var(--color-bg-muted);
}

.calendar-widget__day--today {
    background: var(--color-primary);
    color: white;
}

.calendar-widget__day--other-month {
    opacity: 0.3;
    cursor: default;
}

.calendar-widget__day-number {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
}

.calendar-widget__day-events {
    display: flex;
    gap: 2px;
    margin-top: auto;
    width: 100%;
    justify-content: center;
}

.calendar-widget__day-event {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    flex-shrink: 0;
}
</style>

