<template>
  <div class="chart-builder-page">
    <div class="chart-builder-header">
      <div class="chart-builder-header__content">
        <h2 class="chart-builder-header__title">
          <i class="bi bi-graph-up-arrow" />
          Chart Builder
        </h2>
        <p class="chart-builder-header__subtitle">
          Tạo và tùy chỉnh biểu đồ từ dữ liệu của bạn
        </p>
      </div>
      <div class="chart-builder-header__actions">
        <button
          class="btn btn-outline-secondary"
          @click="handleLoadTemplate"
        >
          <i class="bi bi-file-earmark-text me-2" />
          Mẫu biểu đồ
        </button>
        <button
          class="btn btn-outline-primary"
          @click="handleSaveChart"
        >
          <i class="bi bi-save me-2" />
          Lưu biểu đồ
        </button>
        <button
          class="btn btn-primary"
          @click="handleExportChart"
        >
          <i class="bi bi-download me-2" />
          Xuất biểu đồ
        </button>
      </div>
    </div>

    <div class="chart-builder-content">
      <!-- Left Sidebar: Configuration -->
      <aside class="chart-builder-sidebar">
        <div class="chart-builder-sidebar__section">
          <h6 class="chart-builder-sidebar__title">
            <i class="bi bi-sliders" />
            Cấu hình
          </h6>

          <!-- Data Source Selection -->
          <DataSourceSelector
            v-model="chartConfig.dataSource"
            @change="handleDataSourceChange"
          />

          <!-- Chart Type Selection -->
          <ChartTypeSelector
            v-model="chartConfig.chartType"
            @change="handleChartTypeChange"
          />

          <!-- Chart Configuration -->
          <ChartConfigPanel
            :config="chartConfig"
            :data-source="selectedDataSource"
            @update="handleConfigUpdate"
          />
        </div>
      </aside>

      <!-- Main Content: Preview -->
      <main class="chart-builder-main">
        <div class="chart-builder-preview">
          <div class="chart-builder-preview__header">
            <h5 class="chart-builder-preview__title">
              {{ chartConfig.title || 'Biểu đồ' }}
            </h5>
            <div class="chart-builder-preview__actions">
              <button
                class="btn btn-sm btn-outline-secondary"
                @click="handleRefreshData"
              >
                <i class="bi bi-arrow-clockwise" />
              </button>
              <button
                class="btn btn-sm btn-outline-secondary"
                @click="toggleFullscreen"
              >
                <i class="bi bi-fullscreen" />
              </button>
            </div>
          </div>
          <div class="chart-builder-preview__content">
            <ChartPreview
              :config="chartConfig"
              :data="chartData"
              :loading="loading"
              :error="error"
              @data-update="handleDataUpdate"
            />
          </div>
        </div>
      </main>
    </div>

    <!-- Chart Templates Modal -->
    <ChartTemplates
      ref="templatesModalRef"
      @select="handleTemplateSelect"
    />

    <!-- Save Chart Modal -->
    <Teleport to="body">
      <div
        ref="saveModalRef"
        class="modal fade"
        tabindex="-1"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                Lưu biểu đồ
              </h5>
              <button
                type="button"
                class="btn-close"
                @click="closeSaveModal"
              />
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">
                  Tên biểu đồ
                </label>
                <input
                  v-model="saveChartName"
                  type="text"
                  class="form-control"
                  placeholder="Nhập tên biểu đồ"
                >
              </div>
              <div class="mb-3">
                <label class="form-label">
                  Mô tả
                </label>
                <textarea
                  v-model="saveChartDescription"
                  class="form-control"
                  rows="3"
                  placeholder="Mô tả biểu đồ (tùy chọn)"
                />
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                @click="closeSaveModal"
              >
                Hủy
              </button>
              <button
                type="button"
                class="btn btn-primary"
                :disabled="!saveChartName || saving"
                @click="confirmSaveChart"
              >
                <span
                  v-if="saving"
                  class="spinner-border spinner-border-sm me-2"
                />
                Lưu
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useModal } from '@/composables/useModal'
import { toast } from 'vue3-toastify'
import DataSourceSelector from '@/components/chart-builder/DataSourceSelector.vue'
import ChartTypeSelector from '@/components/chart-builder/ChartTypeSelector.vue'
import ChartConfigPanel from '@/components/chart-builder/ChartConfigPanel.vue'
import ChartPreview from '@/components/chart-builder/ChartPreview.vue'
import ChartTemplates from '@/components/chart-builder/ChartTemplates.vue'
import { useChartBuilderStore } from '@/store/chartBuilder'
import { exportChart } from '@/utils/chartExport'
import logger from '@/utils/logger'

const chartBuilderStore = useChartBuilderStore()
const { modalRef: saveModalRef, show: showSaveModal, hide: hideSaveModal } = useModal()
const templatesModalRef = ref(null)

const loading = ref(false)
const error = ref(null)
const saving = ref(false)
const chartData = ref(null)
const saveChartName = ref('')
const saveChartDescription = ref('')

// Chart configuration
const chartConfig = reactive({
    title: 'Biểu đồ mới',
    chartType: 'line',
    dataSource: null,
    dataSourceConfig: {},
    xAxis: {
        field: null,
        label: 'X Axis',
        type: 'category'
    },
    yAxis: {
        field: null,
        label: 'Y Axis',
        type: 'numeric'
    },
    series: [],
    colors: ['#2563eb'], // Default blue color (can be customized)
    legend: {
        show: true,
        position: 'top'
    },
    animation: {
        enabled: true,
        speed: 800
    },
    height: 400
})

const selectedDataSource = computed(() => chartConfig.dataSource)

const handleDataSourceChange = (dataSource) => {
    chartConfig.dataSource = dataSource
    // Reset series when data source changes
    chartConfig.series = []
    fetchChartData()
}

const handleChartTypeChange = (chartType) => {
    chartConfig.chartType = chartType
    // Adjust config based on chart type
    if (['pie', 'donut'].includes(chartType)) {
        chartConfig.xAxis = null
        chartConfig.yAxis = null
    }
    fetchChartData()
}

const handleConfigUpdate = (updates) => {
    Object.assign(chartConfig, updates)
    fetchChartData()
}

const handleDataUpdate = (data) => {
    chartData.value = data
}

const fetchChartData = async () => {
    if (!chartConfig.dataSource) {
        chartData.value = null
        return
    }

    loading.value = true
    error.value = null

    try {
        // Fetch data based on data source
        const data = await chartBuilderStore.fetchDataSourceData(
            chartConfig.dataSource,
            chartConfig.dataSourceConfig
        )
        chartData.value = data
    } catch (err) {
        error.value = err.message || 'Không thể tải dữ liệu'
        toast.error(error.value)
    } finally {
        loading.value = false
    }
}

const handleRefreshData = () => {
    fetchChartData()
}

const handleLoadTemplate = () => {
    templatesModalRef.value?.show()
}

const handleTemplateSelect = (template) => {
    Object.assign(chartConfig, template.config)
    fetchChartData()
    toast.success('Đã tải mẫu biểu đồ')
}

const handleSaveChart = () => {
    saveChartName.value = chartConfig.title
    saveChartDescription.value = ''
    showSaveModal()
}

const confirmSaveChart = async () => {
    saving.value = true
    try {
        await chartBuilderStore.saveChart({
            name: saveChartName.value,
            description: saveChartDescription.value,
            config: { ...chartConfig },
            createdAt: new Date().toISOString()
        })
        toast.success('Đã lưu biểu đồ thành công!')
        hideSaveModal()
    } catch (err) {
        toast.error(`Không thể lưu biểu đồ: ${  err.message}`)
    } finally {
        saving.value = false
    }
}

const closeSaveModal = () => {
    hideSaveModal()
    saveChartName.value = ''
    saveChartDescription.value = ''
}

const handleExportChart = async () => {
    try {
        const chartElement = document.querySelector('.chart-builder-preview__content')
        if (!chartElement) {
            toast.error('Không tìm thấy biểu đồ để xuất')
            return
        }

        // Show format selector
        const formatChoice = prompt('Chọn định dạng xuất:\n1. PNG\n2. SVG\n3. PDF\n\nNhập số (1-3):', '1')

        let format = 'png'
        if (formatChoice === '2') {
            format = 'svg'
        } else if (formatChoice === '3') {
            format = 'pdf'
        }

        // Try ApexCharts export first for SVG
        if (format === 'svg') {
            const apexChart = chartElement.querySelector('.apexcharts-canvas')
            if (apexChart) {
                const svgElement = apexChart.querySelector('svg')
                if (svgElement) {
                    const svgData = new XMLSerializer().serializeToString(svgElement)
                    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
                    const svgUrl = URL.createObjectURL(svgBlob)
                    const link = document.createElement('a')
                    link.download = `${chartConfig.title || 'chart'}.svg`
                    link.href = svgUrl
                    link.click()
                    URL.revokeObjectURL(svgUrl)
                    toast.success('Đã xuất biểu đồ SVG thành công!')
                    return
                }
            }
        }

        // Use export utility for PNG and PDF
        await exportChart(chartElement, format, chartConfig.title || 'chart')
        toast.success(`Đã xuất biểu đồ ${format.toUpperCase()} thành công!`)
    } catch (err) {
        logger.error('Không thể xuất biểu đồ:', err)
        toast.error(`Không thể xuất biểu đồ: ${  err.message}`)
    }
}

const toggleFullscreen = () => {
    const preview = document.querySelector('.chart-builder-preview')
    if (preview) {
        if (!document.fullscreenElement) {
            preview.requestFullscreen()
        } else {
            document.exitFullscreen()
        }
    }
}

onMounted(() => {
    // Load saved charts if any
    chartBuilderStore.loadSavedCharts()
})
</script>

<style scoped>
.chart-builder-page {
    padding: var(--spacing-4);
    background: var(--color-body-bg);
    min-height: 100vh;
}

.chart-builder-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-4);
    gap: var(--spacing-4);
}

.chart-builder-header__content {
    flex: 1;
}

.chart-builder-header__title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    margin-bottom: var(--spacing-2);
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
}

.chart-builder-header__title i {
    color: var(--color-primary);
}

.chart-builder-header__subtitle {
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    margin: 0;
}

.chart-builder-header__actions {
    display: flex;
    gap: var(--spacing-2);
    flex-wrap: wrap;
}

.chart-builder-content {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: var(--spacing-4);
    height: calc(100vh - 200px);
}

.chart-builder-sidebar {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    padding: var(--spacing-4);
    overflow-y: auto;
}

.chart-builder-sidebar__section {
    margin-bottom: var(--spacing-4);
}

.chart-builder-sidebar__title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
    margin-bottom: var(--spacing-3);
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding-bottom: var(--spacing-2);
    border-bottom: 1px solid var(--color-border);
}

.chart-builder-main {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.chart-builder-preview {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.chart-builder-preview__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
}

.chart-builder-preview__title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
    margin: 0;
}

.chart-builder-preview__actions {
    display: flex;
    gap: var(--spacing-2);
}

.chart-builder-preview__content {
    flex: 1;
    padding: var(--spacing-4);
    overflow: auto;
    display: flex;
    align-items: center;
    justify-content: center;
}

@media (max-width: 1024px) {
    .chart-builder-content {
        grid-template-columns: 1fr;
        height: auto;
    }

    .chart-builder-sidebar {
        order: 2;
    }

    .chart-builder-main {
        order: 1;
    }
}
</style>

