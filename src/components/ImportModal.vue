<template>
  <div
    v-if="show"
    class="import-modal-overlay"
    @click="handleClose"
  >
    <div
      class="import-modal"
      @click.stop
    >
      <div class="import-modal__header">
        <h3>
          <i class="bi bi-upload me-2" />
          Nhập dữ liệu
        </h3>
        <button
          class="import-modal__close"
          type="button"
          @click="handleClose"
        >
          <i class="bi bi-x-lg" />
        </button>
      </div>

      <div class="import-modal__body">
        <!-- Step 1: File Upload -->
        <div
          v-if="step === 1"
          class="import-modal__step"
        >
          <div class="import-modal__upload-area">
            <input
              ref="fileInput"
              type="file"
              accept=".xlsx,.xls,.csv"
              class="import-modal__file-input"
              @change="handleFileSelect"
            >
            <div
              class="import-modal__dropzone"
              :class="{ 'import-modal__dropzone--dragover': isDragging }"
              @drop="handleDrop"
              @dragover.prevent="isDragging = true"
              @dragleave="isDragging = false"
              @click="fileInput?.click()"
            >
              <i class="bi bi-cloud-upload" />
              <p>Kéo thả file vào đây hoặc click để chọn</p>
              <span>Hỗ trợ: Excel (.xlsx, .xls), CSV (.csv)</span>
            </div>
            <div
              v-if="selectedFile"
              class="import-modal__file-info"
            >
              <i class="bi bi-file-earmark-check" />
              <span>{{ selectedFile.name }}</span>
              <button
                class="import-modal__file-remove"
                type="button"
                @click="removeFile"
              >
                <i class="bi bi-x" />
              </button>
            </div>
          </div>
        </div>

        <!-- Step 2: Preview -->
        <div
          v-if="step === 2"
          class="import-modal__step"
        >
          <div class="import-modal__preview-header">
            <h4>Xem trước dữ liệu</h4>
            <span class="import-modal__preview-count">
              {{ previewData.length }} dòng
            </span>
          </div>
          <div class="import-modal__preview-table">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th
                    v-for="(header, index) in previewHeaders"
                    :key="index"
                  >
                    {{ header }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, rowIndex) in previewData.slice(0, 10)"
                  :key="rowIndex"
                >
                  <td
                    v-for="(header, colIndex) in previewHeaders"
                    :key="colIndex"
                  >
                    {{ row[header] || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
            <div
              v-if="previewData.length > 10"
              class="import-modal__preview-more"
            >
              ... và {{ previewData.length - 10 }} dòng khác
            </div>
          </div>
        </div>

        <!-- Step 3: Column Mapping -->
        <div
          v-if="step === 3"
          class="import-modal__step"
        >
          <div class="import-modal__mapping-header">
            <h4>Ánh xạ cột</h4>
            <p>Chọn cột trong file tương ứng với từng trường dữ liệu</p>
          </div>
          <div class="import-modal__mapping-list">
            <div
              v-for="field in requiredFields"
              :key="field.key"
              class="import-modal__mapping-item"
            >
              <label class="import-modal__mapping-label">
                <span class="import-modal__mapping-field">
                  {{ field.label }}
                  <span
                    v-if="field.required"
                    class="text-danger"
                  >*</span>
                </span>
                <select
                  v-model="columnMapping[field.key]"
                  class="form-select"
                >
                  <option value="">
                    -- Chọn cột --
                  </option>
                  <option
                    v-for="header in previewHeaders"
                    :key="header"
                    :value="header"
                  >
                    {{ header }}
                  </option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <!-- Validation Errors -->
        <div
          v-if="validationErrors.length > 0"
          class="import-modal__errors"
        >
          <div class="import-modal__errors-header">
            <i class="bi bi-exclamation-triangle text-warning" />
            <strong>Có {{ validationErrors.length }} lỗi cần sửa:</strong>
          </div>
          <div class="import-modal__errors-list">
            <div
              v-for="(error, index) in validationErrors.slice(0, 10)"
              :key="index"
              class="import-modal__error-item"
            >
              <span class="import-modal__error-row">Dòng {{ error.row }}:</span>
              <span class="import-modal__error-message">{{ error.message }}</span>
            </div>
            <div
              v-if="validationErrors.length > 10"
              class="import-modal__errors-more"
            >
              ... và {{ validationErrors.length - 10 }} lỗi khác
            </div>
          </div>
        </div>

        <!-- Validation Warnings -->
        <div
          v-if="validationWarnings.length > 0"
          class="import-modal__warnings"
        >
          <div class="import-modal__warnings-header">
            <i class="bi bi-info-circle text-info" />
            <strong>{{ validationWarnings.length }} cảnh báo:</strong>
          </div>
          <div class="import-modal__warnings-list">
            <div
              v-for="(warning, index) in validationWarnings.slice(0, 5)"
              :key="index"
              class="import-modal__warning-item"
            >
              <span class="import-modal__warning-row">Dòng {{ warning.row }}:</span>
              <span class="import-modal__warning-message">{{ warning.message }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="import-modal__footer">
        <button
          v-if="step > 1"
          class="btn btn-outline-secondary"
          type="button"
          @click="previousStep"
        >
          <i class="bi bi-arrow-left me-2" />
          Quay lại
        </button>
        <button
          class="btn btn-outline-secondary"
          type="button"
          @click="handleClose"
        >
          Hủy
        </button>
        <button
          v-if="step < 3"
          class="btn btn-primary"
          type="button"
          :disabled="!canProceed"
          @click="nextStep"
        >
          Tiếp theo
          <i class="bi bi-arrow-right ms-2" />
        </button>
        <button
          v-else
          class="btn btn-primary"
          type="button"
          :disabled="!canImport || isImporting"
          @click="handleImport"
        >
          <i
            v-if="isImporting"
            class="bi bi-arrow-repeat spin me-2"
          />
          <i
            v-else
            class="bi bi-check-lg me-2"
          />
          Nhập dữ liệu
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
    requiredFields: {
        type: Array,
        required: true
    },
    validationRules: {
        type: Array,
        default: () => []
    },
    onImport: {
        type: Function,
        required: true
    }
})

const emit = defineEmits(['close', 'import'])

const fileInput = ref(null)
const step = ref(1)
const selectedFile = ref(null)
const isDragging = ref(false)
const previewData = ref([])
const previewHeaders = ref([])
const columnMapping = ref({})
const validationErrors = ref([])
const validationWarnings = ref([])
const isImporting = ref(false)

const canProceed = computed(() => {
    switch (step.value) {
        case 1:
            return selectedFile.value !== null
        case 2:
            return previewData.value.length > 0
        case 3:
            return props.requiredFields.every(field =>
                !field.required || columnMapping.value[field.key]
            )
        default:
            return false
    }
})

const canImport = computed(() => canProceed.value && validationErrors.value.length === 0)

const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (file) {
        selectedFile.value = file
        loadFile()
    }
}

const handleDrop = (event) => {
    isDragging.value = false
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
        selectedFile.value = file
        loadFile()
    }
}

const removeFile = () => {
    selectedFile.value = null
    previewData.value = []
    previewHeaders.value = []
    columnMapping.value = {}
    validationErrors.value = []
    validationWarnings.value = []
    step.value = 1
    if (fileInput.value) {
        fileInput.value.value = ''
    }
}

const loadFile = async () => {
    if (!selectedFile.value) return

    try {
        const result = await ExportImportService.importFromFile(selectedFile.value, {
            headerRow: 0
        })

        previewData.value = result.data
        if (result.data.length > 0) {
            previewHeaders.value = Object.keys(result.data[0])
        }

        // Auto-map columns if possible
        autoMapColumns()

        step.value = 2
    } catch (err) {
        logger.error('[ImportModal] Không thể đọc file import:', err)
        alert(`Không thể đọc file: ${  err.message || 'Unknown error'}`)
    }
}

const autoMapColumns = () => {
    props.requiredFields.forEach(field => {
        // Try to find matching column by name
        const match = previewHeaders.value.find(header => {
            const headerLower = header.toLowerCase()
            const fieldLower = field.key.toLowerCase()
            return headerLower.includes(fieldLower) || fieldLower.includes(headerLower)
        })
        if (match) {
            columnMapping.value[field.key] = match
        }
    })
}

const nextStep = () => {
    if (step.value === 2) {
        // Validate data
        validateData()
        if (validationErrors.value.length === 0) {
            step.value = 3
        }
    } else if (step.value === 3) {
        // Already at last step
    }
}

const previousStep = () => {
    if (step.value > 1) {
        step.value--
    }
}

const validateData = () => {
    if (!previewData.value.length) return

    // Map data first
    const mappedData = ExportImportService.mapColumns(previewData.value, columnMapping.value)

    // Validate
    const validation = ExportImportService.validateImportData(mappedData, props.validationRules)
    validationErrors.value = validation.errors
    validationWarnings.value = validation.warnings
}

const handleImport = async () => {
    if (!canImport.value) return

    isImporting.value = true

    try {
        // Map data
        const mappedData = ExportImportService.mapColumns(previewData.value, columnMapping.value)

        // Call import handler
        const result = await props.onImport(mappedData)

        emit('import', {
            success: true,
            rowCount: mappedData.length,
            result
        })

        handleClose()
    } catch (err) {
        logger.error('[ImportModal] Nhập dữ liệu thất bại:', err)
        alert(`Nhập dữ liệu thất bại: ${  err.message || 'Unknown error'}`)
    } finally {
        isImporting.value = false
    }
}

const handleClose = () => {
    step.value = 1
    selectedFile.value = null
    previewData.value = []
    previewHeaders.value = []
    columnMapping.value = {}
    validationErrors.value = []
    validationWarnings.value = []
    emit('close')
}

watch(() => props.show, (newVal) => {
    if (!newVal) {
        handleClose()
    }
})
</script>

<style scoped>
.import-modal-overlay {
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

.import-modal {
    background: var(--color-card);
    border-radius: var(--radius-lg);
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.import-modal__header {
    padding: 20px;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.import-modal__header h3 {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--color-heading);
    display: flex;
    align-items: center;
}

.import-modal__close {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.import-modal__close:hover {
    background: var(--color-card-muted);
    color: var(--color-heading);
}

.import-modal__body {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
}

.import-modal__step {
    min-height: 300px;
}

.import-modal__file-input {
    display: none;
}

.import-modal__dropzone {
    border: 2px dashed var(--color-border);
    border-radius: 12px;
    padding: 48px 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: var(--color-card-muted);
}

.import-modal__dropzone:hover,
.import-modal__dropzone--dragover {
    border-color: var(--color-primary);
    background: rgba(44, 120, 115, 0.05);
}

.import-modal__dropzone i {
    font-size: 3rem;
    color: var(--color-primary);
    margin-bottom: 16px;
}

.import-modal__dropzone p {
    margin: 0 0 8px 0;
    font-weight: 500;
    color: var(--color-heading);
}

.import-modal__dropzone span {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.import-modal__file-info {
    margin-top: 16px;
    padding: 12px;
    background: var(--color-card-muted);
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.import-modal__file-info i {
    color: var(--color-success);
    font-size: 1.2rem;
}

.import-modal__file-remove {
    margin-left: auto;
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.import-modal__file-remove:hover {
    background: var(--color-card);
    color: var(--color-heading);
}

.import-modal__preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.import-modal__preview-header h4 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-heading);
}

.import-modal__preview-count {
    font-size: 0.9rem;
    color: var(--color-text-muted);
}

.import-modal__preview-table {
    max-height: 400px;
    overflow: auto;
    border: 1px solid var(--color-border);
    border-radius: 8px;
}

.import-modal__preview-more {
    padding: 12px;
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.9rem;
    background: var(--color-card-muted);
}

.import-modal__mapping-header {
    margin-bottom: 20px;
}

.import-modal__mapping-header h4 {
    margin: 0 0 8px 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-heading);
}

.import-modal__mapping-header p {
    margin: 0;
    font-size: 0.9rem;
    color: var(--color-text-muted);
}

.import-modal__mapping-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.import-modal__mapping-item {
    padding: 12px;
    background: var(--color-card-muted);
    border-radius: 8px;
}

.import-modal__mapping-label {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
}

.import-modal__mapping-field {
    min-width: 150px;
    font-weight: 500;
    color: var(--color-heading);
}

.import-modal__mapping-label select {
    flex: 1;
}

.import-modal__errors,
.import-modal__warnings {
    margin-top: 20px;
    padding: 16px;
    border-radius: 8px;
}

.import-modal__errors {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
}

.import-modal__warnings {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
}

.import-modal__errors-header,
.import-modal__warnings-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
}

.import-modal__errors-list,
.import-modal__warnings-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 200px;
    overflow-y: auto;
}

.import-modal__error-item,
.import-modal__warning-item {
    padding: 8px;
    background: var(--color-card);
    border-radius: 6px;
    font-size: 0.9rem;
}

.import-modal__error-row,
.import-modal__warning-row {
    font-weight: 600;
    margin-right: 8px;
}

.import-modal__errors-more {
    padding: 8px;
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.85rem;
}

.import-modal__footer {
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

