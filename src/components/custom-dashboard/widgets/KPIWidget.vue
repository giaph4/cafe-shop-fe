<template>
  <WidgetBase
    :widget="widget"
    :is-editing="isEditing"
    :is-dragging="isDragging"
  >
    <div class="kpi-widget">
      <div
        v-if="loading"
        class="kpi-widget__loading"
      >
        <div class="spinner-border spinner-border-sm" />
      </div>
      <div
        v-else-if="error"
        class="kpi-widget__error"
      >
        <i class="bi bi-exclamation-triangle" />
        <span>{{ error }}</span>
      </div>
      <div
        v-else
        class="kpi-widget__content"
      >
        <div class="kpi-widget__value">
          {{ formattedValue }}
        </div>
        <div
          v-if="subtitle"
          class="kpi-widget__subtitle"
        >
          {{ subtitle }}
        </div>
        <div
          v-if="widgetData?.change !== undefined"
          class="kpi-widget__change"
          :class="getChangeClass(widgetData.change)"
        >
          <i :class="getChangeIcon(widgetData.change)" />
          <span>{{ formatChange(widgetData.change) }}</span>
        </div>
      </div>
    </div>
  </WidgetBase>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import WidgetBase from '../WidgetBase.vue'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import { fetchKPIData } from '@/api/widgetDataService'

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
        type: [Object, Number, String],
        default: null
    }
})

const loading = ref(false)
const error = ref(null)
const widgetData = ref(null)

// Fetch data nếu có dataSource
const fetchData = async () => {
    if (!props.widget.config?.dataSource) {
        // Nếu có data từ props, dùng data đó
        if (props.data) {
            widgetData.value = typeof props.data === 'object' ? props.data : { value: props.data }
        }
        return
    }

    loading.value = true
    error.value = null

    try {
        const data = await fetchKPIData(props.widget.config)
        widgetData.value = data
    } catch (err) {
        error.value = err.message || 'Không thể tải dữ liệu'
        console.error('Error fetching KPI data:', err)
    } finally {
        loading.value = false
    }
}

const formattedValue = computed(() => {
    const dataToUse = widgetData.value || props.data

    if (!dataToUse && dataToUse !== 0) return 'N/A'

    const value = typeof dataToUse === 'object' ? dataToUse.value : dataToUse
    const format = props.widget.config?.format || 'number'

    if (format === 'currency') {
        return formatCurrency(Number(value) || 0)
    }
    if (format === 'percentage') {
        return `${Number(value) || 0}%`
    }
    return formatNumber(Number(value) || 0)
})

const subtitle = computed(() => widgetData.value?.subtitle || props.widget.config?.subtitle || '')

const getChangeClass = (change) => {
    if (change > 0) return 'kpi-widget__change--positive'
    if (change < 0) return 'kpi-widget__change--negative'
    return 'kpi-widget__change--neutral'
}

const getChangeIcon = (change) => {
    if (change > 0) return 'bi bi-arrow-up'
    if (change < 0) return 'bi bi-arrow-down'
    return 'bi bi-dash'
}

const formatChange = (change) => {
    if (change === undefined || change === null) return ''
    const sign = change > 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
}

// Watch for config changes
watch(() => props.widget.config, () => {
    fetchData()
}, { deep: true })

onMounted(() => {
    fetchData()

    // Auto refresh nếu có refreshInterval
    if (props.widget.config?.refreshInterval && props.widget.config.refreshInterval > 0) {
        const interval = setInterval(() => {
            if (!props.isEditing) {
                fetchData()
            }
        }, props.widget.config.refreshInterval * 1000)

        return () => clearInterval(interval)
    }
})
</script>

<style scoped>
.kpi-widget {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 150px;
    text-align: center;
}

.kpi-widget__loading,
.kpi-widget__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    color: var(--color-text-muted);
    min-height: 150px;
}

.kpi-widget__content {
    width: 100%;
}

.kpi-widget__value {
    font-size: 2.5rem;
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    margin-bottom: var(--spacing-2);
    line-height: 1.2;
}

.kpi-widget__subtitle {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-2);
}

.kpi-widget__change {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-1);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    margin-top: var(--spacing-2);
}

.kpi-widget__change--positive {
    color: var(--color-success);
}

.kpi-widget__change--negative {
    color: var(--color-danger);
}

.kpi-widget__change--neutral {
    color: var(--color-text-muted);
}
</style>

