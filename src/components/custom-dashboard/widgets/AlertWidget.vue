<template>
  <WidgetBase
    :widget="widget"
    :is-editing="isEditing"
    :is-dragging="isDragging"
  >
    <div class="alert-widget">
      <div
        v-if="loading"
        class="alert-widget__loading"
      >
        <div class="spinner-border spinner-border-sm" />
      </div>
      <div
        v-else-if="error"
        class="alert-widget__error"
      >
        <i class="bi bi-exclamation-triangle" />
        <span>{{ error }}</span>
      </div>
      <div
        v-else-if="alerts && alerts.length > 0"
        class="alert-widget__list"
      >
        <div
          v-for="(alert, index) in displayedAlerts"
          :key="getAlertKey(alert, index)"
          class="alert-widget__item"
          :class="getAlertClass(alert)"
        >
          <div class="alert-widget__item-icon">
            <i :class="getAlertIcon(alert)" />
          </div>
          <div class="alert-widget__item-content">
            <div class="alert-widget__item-title">
              {{ alert.title || alert.type || 'Cảnh báo' }}
            </div>
            <div
              v-if="alert.message"
              class="alert-widget__item-message"
            >
              {{ alert.message }}
            </div>
            <div
              v-if="alert.timestamp"
              class="alert-widget__item-time"
            >
              {{ formatTime(alert.timestamp) }}
            </div>
          </div>
        </div>
      </div>
      <div
        v-else
        class="alert-widget__empty"
      >
        <i class="bi bi-check-circle" />
        <p>Không có cảnh báo</p>
      </div>
    </div>
  </WidgetBase>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import WidgetBase from '../WidgetBase.vue'
import { formatDateTime } from '@/utils/formatters'
import { fetchAlertData } from '@/api/widgetDataService'

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

const loading = ref(false)
const error = ref(null)
const alerts = ref([])
let refreshInterval = null

const maxItems = computed(() => props.widget.config?.maxItems || 10)

const displayedAlerts = computed(() => alerts.value.slice(0, maxItems.value))

// Fetch data từ API
const fetchData = async () => {
    loading.value = true
    error.value = null

    try {
        const data = await fetchAlertData(props.widget.config)
        alerts.value = Array.isArray(data) ? data : []
    } catch (err) {
        error.value = err.message || 'Không thể tải dữ liệu'
        console.error('Error fetching alert data:', err)
        alerts.value = []
    } finally {
        loading.value = false
    }
}

const getAlertKey = (alert, index) => alert.id || alert._id || index

const getAlertClass = (alert) => {
    const severity = (alert.severity || 'info').toLowerCase()
    if (severity.includes('error') || severity.includes('critical')) {
        return 'alert-widget__item--danger'
    }
    if (severity.includes('warning')) {
        return 'alert-widget__item--warning'
    }
    if (severity.includes('success')) {
        return 'alert-widget__item--success'
    }
    return 'alert-widget__item--info'
}

const getAlertIcon = (alert) => {
    const severity = (alert.severity || 'info').toLowerCase()
    if (severity.includes('error') || severity.includes('critical')) {
        return 'bi bi-x-circle'
    }
    if (severity.includes('warning')) {
        return 'bi bi-exclamation-triangle'
    }
    if (severity.includes('success')) {
        return 'bi bi-check-circle'
    }
    return 'bi bi-info-circle'
}

const formatTime = (timestamp) => {
    if (!timestamp) return ''
    return formatDateTime(timestamp)
}

watch(() => props.data, (newData) => {
    if (newData) {
        alerts.value = Array.isArray(newData) ? newData : []
    }
}, { immediate: true })

watch(() => props.widget.config, () => {
    fetchData()
}, { deep: true })

onMounted(() => {
    // Initialize với data từ widget config nếu có
    if (props.widget.config?.data) {
        alerts.value = Array.isArray(props.widget.config.data) ? props.widget.config.data : []
    } else {
        fetchData()
    }

    // Auto refresh nếu có refreshInterval
    if (props.widget.config?.refreshInterval && props.widget.config.refreshInterval > 0) {
        refreshInterval = setInterval(() => {
            if (!props.isEditing) {
                fetchData()
            }
        }, props.widget.config.refreshInterval * 1000)
    }
})

onBeforeUnmount(() => {
    if (refreshInterval) {
        clearInterval(refreshInterval)
    }
})
</script>

<style scoped>
.alert-widget {
    width: 100%;
    min-height: 200px;
}

.alert-widget__loading,
.alert-widget__error,
.alert-widget__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    min-height: 200px;
    color: var(--color-text-muted);
}

.alert-widget__list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.alert-widget__item {
    display: flex;
    gap: var(--spacing-3);
    padding: var(--spacing-3);
    border-radius: var(--radius-base);
    border: 1px solid;
    transition: all var(--transition-base);
}

.alert-widget__item:hover {
    transform: translateX(4px);
}

.alert-widget__item-icon {
    font-size: 20px;
    flex-shrink: 0;
}

.alert-widget__item-content {
    flex: 1;
    min-width: 0;
}

.alert-widget__item-title {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-1);
}

.alert-widget__item-message {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-1);
}

.alert-widget__item-time {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    opacity: 0.7;
}

.alert-widget__item--danger {
    background: rgba(220, 53, 69, 0.1);
    border-color: var(--color-danger);
    color: var(--color-danger);
}

.alert-widget__item--warning {
    background: rgba(255, 193, 7, 0.1);
    border-color: var(--color-warning);
    color: var(--color-warning);
}

.alert-widget__item--success {
    background: rgba(25, 135, 84, 0.1);
    border-color: var(--color-success);
    color: var(--color-success);
}

.alert-widget__item--info {
    background: rgba(13, 110, 253, 0.1);
    border-color: var(--color-info);
    color: var(--color-info);
}
</style>

