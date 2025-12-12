<template>
  <WidgetBase
    :widget="widget"
    :is-editing="isEditing"
    :is-dragging="isDragging"
  >
    <div class="clock-widget">
      <div class="clock-widget__time">
        {{ currentTime }}
      </div>
      <div
        v-if="showDate"
        class="clock-widget__date"
      >
        {{ currentDate }}
      </div>
      <div
        v-if="showTimezone"
        class="clock-widget__timezone"
      >
        {{ timezone }}
      </div>
    </div>
  </WidgetBase>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import WidgetBase from '../WidgetBase.vue'
import { formatDate } from '@/utils/formatters'

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
    }
})

const currentTime = ref('')
const currentDate = ref('')
let timeInterval = null

const showDate = computed(() => props.widget.config?.showDate !== false)

const showTimezone = computed(() => props.widget.config?.showTimezone === true)

const timezone = computed(() => props.widget.config?.timezone || 'Asia/Ho_Chi_Minh')

const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    if (props.widget.config?.showSeconds !== false) {
        return `${hours}:${minutes}:${seconds}`
    }
    return `${hours}:${minutes}`
}

const updateTime = () => {
    const now = new Date()
    currentTime.value = formatTime(now)
    currentDate.value = formatDate(now)
}

onMounted(() => {
    updateTime()
    timeInterval = setInterval(updateTime, 1000)
})

onBeforeUnmount(() => {
    if (timeInterval) {
        clearInterval(timeInterval)
    }
})
</script>

<style scoped>
.clock-widget {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 150px;
    text-align: center;
}

.clock-widget__time {
    font-size: 3rem;
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
}

.clock-widget__date {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    margin-top: var(--spacing-2);
}

.clock-widget__timezone {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
    opacity: 0.7;
}
</style>

