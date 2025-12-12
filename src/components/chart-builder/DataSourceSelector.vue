<template>
  <div class="data-source-selector">
    <label class="form-label">
      <i class="bi bi-database me-2" />
      Nguồn dữ liệu
    </label>
    <select
      :value="modelValue"
      class="form-select"
      @change="handleChange"
    >
      <option :value="null">
        Chọn nguồn dữ liệu...
      </option>
      <optgroup label="Báo cáo">
        <option
          v-for="source in reportSources"
          :key="source.value"
          :value="source.value"
        >
          {{ source.label }}
        </option>
      </optgroup>
      <optgroup label="Phân tích">
        <option
          v-for="source in analyticsSources"
          :key="source.value"
          :value="source.value"
        >
          {{ source.label }}
        </option>
      </optgroup>
    </select>

    <!-- Data Source Config -->
    <div
      v-if="modelValue && hasConfig"
      class="data-source-selector__config mt-3"
    >
      <label class="form-label">
        Cấu hình
      </label>
      <div
        v-if="modelValue === 'revenue' || modelValue === 'profit'"
        class="row g-2"
      >
        <div class="col-6">
          <label class="form-label small">
            Từ ngày
          </label>
          <input
            v-model="config.dateFrom"
            type="date"
            class="form-control form-control-sm"
            @change="handleConfigChange"
          >
        </div>
        <div class="col-6">
          <label class="form-label small">
            Đến ngày
          </label>
          <input
            v-model="config.dateTo"
            type="date"
            class="form-control form-control-sm"
            @change="handleConfigChange"
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
    modelValue: {
        type: String,
        default: null
    }
})

const emit = defineEmits(['update:modelValue', 'change', 'config-change'])

const config = ref({
    dateFrom: '',
    dateTo: ''
})

const reportSources = [
    { value: 'revenue', label: 'Doanh thu theo ngày' },
    { value: 'profit', label: 'Lợi nhuận' },
    { value: 'categoryRevenue', label: 'Doanh thu theo danh mục' },
    { value: 'hourlySales', label: 'Doanh thu theo giờ' },
    { value: 'paymentMethods', label: 'Phương thức thanh toán' },
    { value: 'topProducts', label: 'Top sản phẩm' },
    { value: 'topCustomers', label: 'Top khách hàng' },
    { value: 'topStaff', label: 'Top nhân viên' },
    { value: 'expenses', label: 'Chi phí' },
    { value: 'inventory', label: 'Tồn kho' }
]

const analyticsSources = [
    { value: 'customerSegments', label: 'Phân khúc khách hàng' },
    { value: 'productPerformance', label: 'Hiệu suất sản phẩm' },
    { value: 'staffPerformance', label: 'Hiệu suất nhân viên' },
    { value: 'trends', label: 'Xu hướng' },
    { value: 'forecast', label: 'Dự báo' }
]

const hasConfig = computed(() => ['revenue', 'profit', 'categoryRevenue', 'hourlySales'].includes(props.modelValue))

const handleChange = (event) => {
    const value = event.target.value || null
    emit('update:modelValue', value)
    emit('change', value)

    // Reset config
    config.value = { dateFrom: '', dateTo: '' }
}

const handleConfigChange = () => {
    emit('config-change', { ...config.value })
}
</script>

<style scoped>
.data-source-selector {
    margin-bottom: var(--spacing-4);
}

.data-source-selector__config {
    padding: var(--spacing-3);
    background: var(--color-bg-muted);
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
}
</style>

