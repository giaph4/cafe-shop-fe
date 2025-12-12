<template>
  <Teleport to="body">
    <div
      id="reportBuilderModal"
      ref="modalRef"
      class="modal fade"
      tabindex="-1"
      aria-labelledby="reportBuilderModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-header__content">
              <h5 class="modal-title">
                Tạo báo cáo tổng hợp
              </h5>
              <p class="modal-subtitle">
                Chọn khoảng thời gian và các phần muốn bao gồm
              </p>
            </div>
            <div class="modal-header__actions">
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
          </div>
          <div class="modal-body">
            <div class="report-builder">
              <div class="mb-4">
                <label class="form-label">Khoảng thời gian</label>
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label small">Từ ngày</label>
                    <input
                      v-model="localConfig.startDate"
                      type="date"
                      class="form-control clean-input"
                    >
                  </div>
                  <div class="col-md-6">
                    <label class="form-label small">Đến ngày</label>
                    <input
                      v-model="localConfig.endDate"
                      type="date"
                      class="form-control clean-input"
                    >
                  </div>
                </div>
              </div>

              <div class="mb-4">
                <label class="form-label">Các phần báo cáo</label>
                <div class="sections-list">
                  <div
                    v-for="(enabled, key) in localConfig.sections"
                    :key="key"
                    class="section-item"
                  >
                    <div class="form-check">
                      <input
                        :id="`section-${key}`"
                        v-model="localConfig.sections[key]"
                        class="form-check-input"
                        type="checkbox"
                      >
                      <label
                        :for="`section-${key}`"
                        class="form-check-label"
                      >
                        {{ getSectionLabel(key) }}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-if="validationError"
                class="alert alert-warning"
              >
                <i class="bi bi-exclamation-triangle me-2" />
                {{ validationError }}
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-flat btn-flat--outline"
              data-bs-dismiss="modal"
            >
              Hủy
            </button>
            <button
              type="button"
              class="btn btn-flat btn-flat--primary"
              :disabled="!canGenerate || loading"
              @click="handleGenerate"
            >
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
              />
              <i
                v-else
                class="bi bi-file-earmark-text me-2"
              />
              Tạo báo cáo
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Modal } from 'bootstrap'

const props = defineProps({
    config: {
        type: Object,
        default: () => ({
            startDate: '',
            endDate: '',
            sections: {
                executiveSummary: true,
                financialPerformance: true,
                operationalMetrics: true,
                productPerformance: true,
                customerInsights: true,
                staffPerformance: true,
                trends: true
            }
        })
    },
    loading: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['generate', 'close'])

const modalRef = ref(null)
let modalInstance = null

const localConfig = ref({
    startDate: props.config.startDate || '',
    endDate: props.config.endDate || '',
    sections: { ...props.config.sections }
})

const validationError = ref('')

watch(() => props.config, (newConfig) => {
    localConfig.value = {
        startDate: newConfig.startDate || '',
        endDate: newConfig.endDate || '',
        sections: { ...newConfig.sections }
    }
}, { deep: true })

const canGenerate = computed(() => localConfig.value.startDate &&
           localConfig.value.endDate &&
           !validationError.value &&
           Object.values(localConfig.value.sections).some(v => v === true))

const getSectionLabel = (key) => {
    const labels = {
        executiveSummary: 'Tóm tắt điều hành',
        financialPerformance: 'Hiệu suất tài chính',
        operationalMetrics: 'Chỉ số vận hành',
        productPerformance: 'Hiệu suất sản phẩm',
        customerInsights: 'Thông tin khách hàng',
        staffPerformance: 'Hiệu suất nhân viên',
        trends: 'Xu hướng và dự báo'
    }
    return labels[key] || key
}

const validate = () => {
    validationError.value = ''

    if (!localConfig.value.startDate || !localConfig.value.endDate) {
        return
    }

    const start = new Date(localConfig.value.startDate)
    const end = new Date(localConfig.value.endDate)

    if (start > end) {
        validationError.value = 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc'
        return
    }

    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    if (daysDiff > 365) {
        validationError.value = 'Khoảng thời gian không được vượt quá 365 ngày'
    }
}

watch([() => localConfig.value.startDate, () => localConfig.value.endDate], () => {
    validate()
})

const initModal = () => {
    if (modalRef.value && !modalInstance) {
        modalInstance = new Modal(modalRef.value, {
            backdrop: true,
            keyboard: true
        })
    }
}

const hideModal = () => {
    if (modalInstance) {
        modalInstance.hide()
    }
}

const handleGenerate = () => {
    if (!canGenerate.value) return

    validate()
    if (validationError.value) return

    emit('generate', { ...localConfig.value })
    hideModal()
}

hideModal()
emit('close')

onMounted(async () => {
    await nextTick()
    initModal()

    // Listen for Bootstrap modal events
    if (modalRef.value) {
        modalRef.value.addEventListener('hidden.bs.modal', () => {
            emit('close')
        })
    }
})

onBeforeUnmount(() => {
    if (modalInstance) {
        modalInstance.dispose()
        modalInstance = null
    }
})

// Expose methods for parent component
defineExpose({
    show: () => {
        if (!modalInstance) {
            initModal()
        }
        modalInstance?.show()
    },
    hide: hideModal
})
</script>

<style scoped>
.report-builder {
    font-family: var(--font-family-sans);
}

.sections-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.section-item {
    padding: var(--spacing-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    transition: background-color var(--transition-fast);
}

.section-item:hover {
    background: var(--color-card-muted);
}

.form-check {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
}

.form-check-input {
    margin: 0;
    cursor: pointer;
}

.form-check-label {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-base);
    color: var(--color-text);
    cursor: pointer;
    margin: 0;
}

.alert {
    font-family: var(--font-family-sans);
    border-radius: var(--radius-sm);
    border: 1px solid;
    padding: var(--spacing-3) var(--spacing-4);
}

.alert-warning {
    background: var(--color-soft-amber);
    border-color: var(--color-warning);
    color: var(--color-text);
}

.alert i {
    color: var(--color-warning);
}

.spinner-border-sm {
    width: 1rem;
    height: 1rem;
    border-width: 0.15em;
    border-color: currentColor;
    border-right-color: transparent;
}
</style>

