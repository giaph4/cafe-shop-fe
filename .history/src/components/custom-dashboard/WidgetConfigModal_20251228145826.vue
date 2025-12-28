<template>
  <Teleport to="body">
    <div
      ref="modalRef"
      class="modal fade widget-config-modal"
      tabindex="-1"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-header__content">
              <h5 class="modal-title">
                Cấu hình Widget
              </h5>
              <p class="modal-subtitle mb-0">
                {{ widget?.name || 'Cấu hình widget' }}
              </p>
            </div>
            <button
              type="button"
              class="btn-close"
              @click="handleClose"
            />
          </div>

          <form @submit.prevent="handleSubmit">
            <div class="modal-body">
              <!-- Basic Settings -->
              <div class="widget-config-section">
                <h6 class="widget-config-section__title">
                  <i class="bi bi-gear" />
                  Cài đặt cơ bản
                </h6>
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Tiêu đề</label>
                    <input
                      v-model="formData.title"
                      type="text"
                      class="form-control"
                      placeholder="Nhập tiêu đề widget"
                    >
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Icon</label>
                    <input
                      v-model="formData.icon"
                      type="text"
                      class="form-control"
                      placeholder="bi bi-speedometer2"
                    >
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Cột (Col Span)</label>
                    <select
                      v-model.number="formData.colSpan"
                      class="form-select"
                    >
                      <option
                        v-for="i in 12"
                        :key="i"
                        :value="i"
                      >
                        {{ i }} cột
                      </option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Hàng (Row Span)</label>
                    <select
                      v-model.number="formData.rowSpan"
                      class="form-select"
                    >
                      <option
                        v-for="i in 5"
                        :key="i"
                        :value="i"
                      >
                        {{ i }} hàng
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Widget Type Specific Settings -->
              <div
                v-if="widget?.type === 'kpi'"
                class="widget-config-section"
              >
                <h6 class="widget-config-section__title">
                  <i class="bi bi-sliders" />
                  Cài đặt KPI
                </h6>
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Định dạng</label>
                    <select
                      v-model="formData.config.format"
                      class="form-select"
                    >
                      <option value="number">
                        Số
                      </option>
                      <option value="currency">
                        Tiền tệ
                      </option>
                      <option value="percentage">
                        Phần trăm
                      </option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Nguồn dữ liệu</label>
                    <select
                      v-model="formData.config.dataSource"
                      class="form-select"
                    >
                      <option value="revenue">
                        Doanh thu hôm nay
                      </option>
                      <option value="todayRevenue">
                        Doanh thu hôm nay
                      </option>
                      <option value="monthRevenue">
                        Doanh thu tháng này
                      </option>
                      <option value="orders">
                        Đơn hàng hôm nay
                      </option>
                      <option value="todayOrders">
                        Đơn hàng hôm nay
                      </option>
                      <option value="monthOrders">
                        Đơn hàng tháng này
                      </option>
                      <option value="customers">
                        Tổng khách hàng
                      </option>
                      <option value="profit">
                        Lợi nhuận
                      </option>
                      <option value="expenses">
                        Chi phí
                      </option>
                      <option value="lowStock">
                        Nguyên liệu sắp hết
                      </option>
                      <option value="pendingOrders">
                        Đơn nhập chờ
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div
                v-if="widget?.type === 'chart'"
                class="widget-config-section"
              >
                <h6 class="widget-config-section__title">
                  <i class="bi bi-sliders" />
                  Cài đặt Biểu đồ
                </h6>
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Loại biểu đồ</label>
                    <select
                      v-model="formData.config.chartType"
                      class="form-select"
                    >
                      <option value="line">
                        Đường
                      </option>
                      <option value="bar">
                        Cột
                      </option>
                      <option value="area">
                        Vùng
                      </option>
                      <option value="pie">
                        Tròn
                      </option>
                      <option value="donut">
                        Vành khuyên
                      </option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Chiều cao</label>
                    <input
                      v-model.number="formData.config.height"
                      type="number"
                      class="form-control"
                      min="200"
                      max="600"
                      step="50"
                    >
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Nguồn dữ liệu</label>
                    <select
                      v-model="formData.config.dataSource"
                      class="form-select"
                    >
                      <option value="revenue">
                        Doanh thu theo ngày
                      </option>
                      <option value="categoryRevenue">
                        Doanh thu theo danh mục
                      </option>
                      <option value="hourlySales">
                        Doanh thu theo giờ
                      </option>
                      <option value="products">
                        Sản phẩm
                      </option>
                      <option value="paymentMethods">
                        Phương thức thanh toán
                      </option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <div class="form-check mt-4">
                      <input
                        id="showLegend"
                        v-model="formData.config.showLegend"
                        class="form-check-input"
                        type="checkbox"
                      >
                      <label
                        class="form-check-label"
                        for="showLegend"
                      >
                        Hiển thị chú giải
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-if="widget?.type === 'table'"
                class="widget-config-section"
              >
                <h6 class="widget-config-section__title">
                  <i class="bi bi-sliders" />
                  Cài đặt Bảng
                </h6>
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Số dòng mỗi trang</label>
                    <input
                      v-model.number="formData.config.pageSize"
                      type="number"
                      class="form-control"
                      min="5"
                      max="50"
                    >
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Nguồn dữ liệu</label>
                    <select
                      v-model="formData.config.dataSource"
                      class="form-select"
                    >
                      <option value="topProducts">
                        Top sản phẩm
                      </option>
                      <option value="products">
                        Sản phẩm
                      </option>
                      <option value="topCustomers">
                        Top khách hàng
                      </option>
                      <option value="topStaff">
                        Top nhân viên
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Data Source & Filters -->
              <div class="widget-config-section">
                <h6 class="widget-config-section__title">
                  <i class="bi bi-funnel" />
                  Bộ lọc & Khoảng thời gian
                </h6>
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Từ ngày</label>
                    <input
                      v-model="formData.config.dateFrom"
                      type="date"
                      class="form-control"
                    >
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Đến ngày</label>
                    <input
                      v-model="formData.config.dateTo"
                      type="date"
                      class="form-control"
                    >
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">  (giây)</label>
                    <input
                      v-model.number="formData.config.refreshInterval"
                      type="number"
                      class="form-control"
                      min="0"
                      step="10"
                      placeholder="0 = không tự động"
                    >
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                @click="handleClose"
              >
                Hủy
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="loading"
              >
                <span
                  v-if="loading"
                  class="spinner-border spinner-border-sm me-2"
                />
                Lưu
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useModal } from '@/composables/useModal'

const props = defineProps({
    widget: {
        type: Object,
        default: null
    },
    loading: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['save', 'close'])

const { modalRef, show, hide } = useModal()

const formData = ref({
    title: '',
    icon: '',
    colSpan: 6,
    rowSpan: 1,
    config: {
        format: 'number',
        chartType: 'line',
        height: 300,
        showLegend: true,
        pageSize: 10,
        dataSource: '',
        dateFrom: '',
        dateTo: '',
        refreshInterval: 0
    }
})

const initializeForm = () => {
    if (props.widget) {
        formData.value = {
            title: props.widget.title || '',
            icon: props.widget.icon || '',
            colSpan: props.widget.colSpan || 6,
            rowSpan: props.widget.rowSpan || 1,
            config: {
                ...formData.value.config,
                ...(props.widget.config || {})
            }
        }
    }
}

watch(() => props.widget, () => {
    initializeForm()
}, { immediate: true, deep: true })

const handleSubmit = () => {
    const updatedWidget = {
        ...props.widget,
        ...formData.value
    }
    emit('save', updatedWidget)
}

const handleClose = () => {
    hide()
    emit('close')
}

defineExpose({
    show,
    hide
})
</script>

<style scoped>
.widget-config-modal .modal-header__content {
    flex: 1;
}

.widget-config-modal .modal-subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
}

.widget-config-section {
    margin-bottom: var(--spacing-4);
    padding-bottom: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
}

.widget-config-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
}

.widget-config-section__title {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--spacing-3);
    color: var(--color-text);
}
</style>

