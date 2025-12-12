<template>
  <div
    v-if="show"
    class="export-modal-overlay"
    @click="handleClose"
  >
    <div
      class="export-modal"
      @click.stop
    >
      <div class="export-modal__header">
        <h3>
          <i class="bi bi-download me-2" />
          Xuất dữ liệu
        </h3>
        <button
          class="export-modal__close"
          type="button"
          @click="handleClose"
        >
          <i class="bi bi-x-lg" />
        </button>
      </div>

      <div class="export-modal__body">
        <!-- Format Selection -->
        <div class="export-modal__section">
          <label class="export-modal__label">
            <i class="bi bi-file-earmark me-2" />
            Định dạng
          </label>
          <div class="export-modal__formats">
            <button
              v-for="format in formats"
              :key="format.id"
              class="export-modal__format"
              :class="{ 'export-modal__format--active': selectedFormat === format.id }"
              type="button"
              @click="selectedFormat = format.id"
            >
              <i :class="format.icon" />
              <span>{{ format.label }}</span>
            </button>
          </div>
        </div>

        <!-- Column Selection -->
        <div
          v-if="availableColumns.length > 0"
          class="export-modal__section"
        >
          <label class="export-modal__label">
            <i class="bi bi-list-columns me-2" />
            Chọn cột xuất
          </label>
          <div class="export-modal__columns">
            <label
              v-for="col in availableColumns"
              :key="col.key"
              class="export-modal__column-item"
            >
              <input
                v-model="selectedColumns"
                type="checkbox"
                :value="col.key"
              >
              <span>{{ col.label }}</span>
            </label>
          </div>
          <div class="export-modal__column-actions">
            <button
              class="btn btn-sm btn-outline-primary"
              type="button"
              @click="selectAllColumns"
            >
              Chọn tất cả
            </button>
            <button
              class="btn btn-sm btn-outline-secondary"
              type="button"
              @click="deselectAllColumns"
            >
              Bỏ chọn tất cả
            </button>
          </div>
        </div>

        <!-- Options -->
        <div class="export-modal__section">
          <label class="export-modal__label">
            <i class="bi bi-gear me-2" />
            Tùy chọn
          </label>
          <div class="export-modal__options">
            <label class="export-modal__option">
              <input
                v-model="options.includeHeaders"
                type="checkbox"
              >
              <span>Bao gồm tiêu đề</span>
            </label>
            <label
              v-if="hasFilters"
              class="export-modal__option"
            >
              <input
                v-model="options.applyFilters"
                type="checkbox"
              >
              <span>Áp dụng bộ lọc hiện tại</span>
            </label>
            <label
              v-if="hasCharts"
              class="export-modal__option"
            >
              <input
                v-model="options.includeCharts"
                type="checkbox"
              >
              <span>Bao gồm biểu đồ (PDF)</span>
            </label>
          </div>
        </div>

        <!-- Filename -->
        <div class="export-modal__section">
          <label class="export-modal__label">
            <i class="bi bi-file-earmark-text me-2" />
            Tên file
          </label>
          <input
            v-model="filename"
            type="text"
            class="form-control"
            :placeholder="defaultFilename"
          >
        </div>
      </div>

      <div class="export-modal__footer">
        <button
          class="btn btn-outline-secondary"
          type="button"
          @click="handleClose"
        >
          Hủy
        </button>
        <button
          class="btn btn-primary"
          type="button"
          :disabled="isExporting"
          @click="handleExport"
        >
          <i
            v-if="isExporting"
            class="bi bi-arrow-repeat spin me-2"
          />
          <i
            v-else
            class="bi bi-download me-2"
          />
          Xuất dữ liệu
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ExportImportService } from '@/services/exportImportService'
import logger from '@/utils/logger'

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    data: {
        type: Array,
        default: () => []
    },
    columns: {
        type: Array,
        default: () => []
    },
    hasFilters: {
        type: Boolean,
        default: false
    },
    hasCharts: {
        type: Boolean,
        default: false
    },
    defaultFilename: {
        type: String,
        default: 'export'
    }
})

const emit = defineEmits(['close', 'export'])

const selectedFormat = ref('excel')
const selectedColumns = ref([])
const isExporting = ref(false)
const filename = ref('')
const options = ref({
    includeHeaders: true,
    applyFilters: true,
    includeCharts: false
})

const formats = [
    { id: 'excel', label: 'Excel (XLSX)', icon: 'bi bi-file-earmark-spreadsheet' },
    { id: 'csv', label: 'CSV', icon: 'bi bi-filetype-csv' },
    { id: 'json', label: 'JSON', icon: 'bi bi-filetype-json' },
    { id: 'pdf', label: 'PDF', icon: 'bi bi-file-earmark-pdf' }
]

const availableColumns = computed(() => props.columns.length > 0 ? props.columns : [])

const defaultFilename = computed(() => {
    const ext = selectedFormat.value === 'excel' ? 'xlsx' : selectedFormat.value
    return `${props.defaultFilename}.${ext}`
})

watch(() => props.show, (newVal) => {
    if (newVal) {
        // Initialize selected columns
        if (availableColumns.value.length > 0) {
            selectedColumns.value = availableColumns.value.map(col => col.key)
        }
        filename.value = defaultFilename.value
    }
})

watch(selectedFormat, () => {
    const ext = selectedFormat.value === 'excel' ? 'xlsx' : selectedFormat.value
    const baseName = filename.value.replace(/\.[^.]+$/, '')
    filename.value = `${baseName}.${ext}`
})

const selectAllColumns = () => {
    selectedColumns.value = availableColumns.value.map(col => col.key)
}

const deselectAllColumns = () => {
    selectedColumns.value = []
}

const handleClose = () => {
    emit('close')
}

const handleExport = async () => {
    if (selectedColumns.value.length === 0 && availableColumns.value.length > 0) {
        alert('Vui lòng chọn ít nhất một cột để xuất')
        return
    }

    isExporting.value = true

    try {
        // Prepare data
        const exportData = props.data
        if (options.value.applyFilters && props.hasFilters) {
            // Data should already be filtered by parent
        }

        // Prepare columns
        let exportColumns = null
        if (availableColumns.value.length > 0 && selectedColumns.value.length > 0) {
            exportColumns = availableColumns.value
                .filter(col => selectedColumns.value.includes(col.key))
                .map(col => ({
                    label: col.label,
                    key: col.key,
                    value: col.value
                }))
        }

        // Export based on format
        const exportOptions = {
            filename: filename.value || defaultFilename.value,
            columns: exportColumns,
            includeHeaders: options.value.includeHeaders,
            ...(selectedFormat.value === 'excel' && {
                sheetName: 'Data',
                formatting: {
                    widths: exportColumns ? exportColumns.map(() => 15) : null
                }
            }),
            ...(selectedFormat.value === 'pdf' && {
                title: props.defaultFilename,
                columns: exportColumns,
                orientation: 'portrait'
            })
        }

        let result
        switch (selectedFormat.value) {
            case 'excel':
                result = ExportImportService.exportToExcel(exportData, exportOptions)
                break
            case 'csv':
                result = ExportImportService.exportToCSV(exportData, exportOptions)
                break
            case 'json':
                result = ExportImportService.exportToJSON(exportData, exportOptions)
                break
            case 'pdf':
                result = await ExportImportService.exportToPDF(exportData, exportOptions)
                break
            default:
                throw new Error('Unsupported format')
        }

        emit('export', {
            format: selectedFormat.value,
            filename: result.filename,
            rowCount: exportData.length
        })

        handleClose()
    } catch (err) {
        logger.error('[ExportModal] Xuất dữ liệu thất bại:', err)
        alert(`Xuất dữ liệu thất bại: ${  err.message || 'Unknown error'}`)
    } finally {
        isExporting.value = false
    }
}
</script>

<style scoped>
.export-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.export-modal {
    background: var(--color-card);
    border-radius: var(--radius-lg);
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.export-modal__header {
    padding: 20px;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.export-modal__header h3 {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--color-heading);
    display: flex;
    align-items: center;
}

.export-modal__close {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.export-modal__close:hover {
    background: var(--color-card-muted);
    color: var(--color-heading);
}

.export-modal__body {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
}

.export-modal__section {
    margin-bottom: 24px;
}

.export-modal__section:last-child {
    margin-bottom: 0;
}

.export-modal__label {
    display: flex;
    align-items: center;
    font-weight: 600;
    color: var(--color-heading);
    margin-bottom: 12px;
    font-size: 0.95rem;
}

.export-modal__formats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
}

.export-modal__format {
    padding: 16px;
    border: 2px solid var(--color-border);
    background: var(--color-card);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
}

.export-modal__format:hover {
    border-color: var(--color-primary);
    background: rgba(44, 120, 115, 0.05);
}

.export-modal__format--active {
    border-color: var(--color-primary);
    background: rgba(44, 120, 115, 0.1);
    color: var(--color-primary);
}

.export-modal__format i {
    font-size: 1.5rem;
}

.export-modal__format span {
    font-size: 0.85rem;
    font-weight: 500;
}

.export-modal__columns {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
    margin-bottom: 12px;
    max-height: 200px;
    overflow-y: auto;
    padding: 8px;
    background: var(--color-card-muted);
    border-radius: 8px;
}

.export-modal__column-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px;
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.2s ease;
}

.export-modal__column-item:hover {
    background: var(--color-card);
}

.export-modal__column-item input[type="checkbox"] {
    cursor: pointer;
}

.export-modal__column-actions {
    display: flex;
    gap: 8px;
}

.export-modal__options {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.export-modal__option {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

.export-modal__option input[type="checkbox"] {
    cursor: pointer;
}

.export-modal__footer {
    padding: 16px 20px;
    border-top: 1px solid var(--color-border);
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

.spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>

