<template>
  <div class="chart-config-panel">
    <!-- Title -->
    <div class="chart-config-panel__section">
      <label class="form-label">
        Tiêu đề biểu đồ
      </label>
      <input
        v-model="localConfig.title"
        type="text"
        class="form-control"
        placeholder="Nhập tiêu đề"
        @input="updateConfig"
      >
    </div>

    <!-- X Axis (if applicable) -->
    <div
      v-if="showAxes"
      class="chart-config-panel__section"
    >
      <label class="form-label">
        Trục X
      </label>
      <input
        v-model="localConfig.xAxis.label"
        type="text"
        class="form-control mb-2"
        placeholder="Nhãn trục X"
        @input="updateConfig"
      >
    </div>

    <!-- Y Axis (if applicable) -->
    <div
      v-if="showAxes"
      class="chart-config-panel__section"
    >
      <label class="form-label">
        Trục Y
      </label>
      <input
        v-model="localConfig.yAxis.label"
        type="text"
        class="form-control mb-2"
        placeholder="Nhãn trục Y"
        @input="updateConfig"
      >
    </div>

    <!-- Colors -->
    <div class="chart-config-panel__section">
      <label class="form-label">
        Màu sắc
      </label>
      <div class="chart-config-panel__colors">
        <div
          v-for="(color, index) in localConfig.colors"
          :key="index"
          class="chart-config-panel__color-item"
        >
          <input
            v-model="localConfig.colors[index]"
            type="color"
            class="form-control form-control-color"
            @change="updateConfig"
          >
          <button
            v-if="localConfig.colors.length > 1"
            class="btn btn-sm btn-outline-danger"
            @click="removeColor(index)"
          >
            <i class="bi bi-x" />
          </button>
        </div>
        <button
          class="btn btn-sm btn-outline-primary"
          @click="addColor"
        >
          <i class="bi bi-plus" />
          Thêm màu
        </button>
      </div>
    </div>

    <!-- Legend -->
    <div class="chart-config-panel__section">
      <div class="form-check form-switch">
        <input
          v-model="localConfig.legend.show"
          class="form-check-input"
          type="checkbox"
          @change="updateConfig"
        >
        <label class="form-check-label">
          Hiển thị chú thích
        </label>
      </div>
      <div
        v-if="localConfig.legend.show"
        class="mt-2"
      >
        <label class="form-label small">
          Vị trí
        </label>
        <select
          v-model="localConfig.legend.position"
          class="form-select form-select-sm"
          @change="updateConfig"
        >
          <option value="top">
            Trên
          </option>
          <option value="bottom">
            Dưới
          </option>
          <option value="left">
            Trái
          </option>
          <option value="right">
            Phải
          </option>
        </select>
      </div>
    </div>

    <!-- Animation -->
    <div class="chart-config-panel__section">
      <div class="form-check form-switch">
        <input
          v-model="localConfig.animation.enabled"
          class="form-check-input"
          type="checkbox"
          @change="updateConfig"
        >
        <label class="form-check-label">
          Bật animation
        </label>
      </div>
      <div
        v-if="localConfig.animation.enabled"
        class="mt-2"
      >
        <label class="form-label small">
          Tốc độ (ms)
        </label>
        <input
          v-model.number="localConfig.animation.speed"
          type="number"
          class="form-control form-control-sm"
          min="100"
          max="2000"
          step="100"
          @input="updateConfig"
        >
      </div>
    </div>

    <!-- Height -->
    <div class="chart-config-panel__section">
      <label class="form-label">
        Chiều cao (px)
      </label>
      <input
        v-model.number="localConfig.height"
        type="number"
        class="form-control"
        min="200"
        max="800"
        step="50"
        @input="updateConfig"
      >
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'

const props = defineProps({
    config: {
        type: Object,
        required: true
    },
    dataSource: {
        type: String,
        default: null
    }
})

const emit = defineEmits(['update'])

const localConfig = ref({ ...props.config })

const showAxes = computed(() => !['pie', 'donut', 'radialBar'].includes(props.config.chartType))

const updateConfig = () => {
    emit('update', { ...localConfig.value })
}

const addColor = () => {
    // Convert CSS variable to hex if needed, otherwise use default blue
    const defaultColor = '#2563eb'
    localConfig.value.colors.push(defaultColor)
    updateConfig()
}

// Convert CSS variable colors to hex when component mounts
const convertCssVarToHex = (color) => {
    if (!color || typeof color !== 'string') return '#2563eb'
    if (color.startsWith('var(--')) {
        // Try to get computed value from document
        if (typeof document !== 'undefined') {
            const tempEl = document.createElement('div')
            tempEl.style.color = color
            document.body.appendChild(tempEl)
            const computedColor = window.getComputedStyle(tempEl).color
            document.body.removeChild(tempEl)
            // Convert rgb/rgba to hex
            if (computedColor.startsWith('rgb')) {
                const rgb = computedColor.match(/\d+/g)
                if (rgb && rgb.length >= 3) {
                    return '#' + rgb.slice(0, 3).map(x => {
                        const hex = parseInt(x).toString(16)
                        return hex.length === 1 ? '0' + hex : hex
                    }).join('')
                }
            }
        }
        return '#2563eb' // Fallback to default
    }
    // If already hex or valid color, return as is
    if (color.startsWith('#')) return color
    return '#2563eb' // Fallback
}

const removeColor = (index) => {
    if (localConfig.value.colors.length > 1) {
        localConfig.value.colors.splice(index, 1)
        updateConfig()
    }
}

watch(() => props.config, (newConfig) => {
    const convertedConfig = { ...newConfig }
    // Convert any CSS variable colors to hex
    if (convertedConfig.colors && Array.isArray(convertedConfig.colors)) {
        convertedConfig.colors = convertedConfig.colors.map(convertCssVarToHex)
    }
    localConfig.value = convertedConfig
}, { deep: true })

// Convert colors on mount
onMounted(() => {
    if (localConfig.value.colors && Array.isArray(localConfig.value.colors)) {
        localConfig.value.colors = localConfig.value.colors.map(convertCssVarToHex)
        updateConfig()
    }
})
</script>

<style scoped>
.chart-config-panel__section {
    margin-bottom: var(--spacing-4);
    padding-bottom: var(--spacing-3);
    border-bottom: 1px solid var(--color-border);
}

.chart-config-panel__section:last-child {
    border-bottom: none;
}

.chart-config-panel__colors {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.chart-config-panel__color-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
}

.chart-config-panel__color-item input[type="color"] {
    width: 50px;
    height: 40px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    cursor: pointer;
}
</style>

