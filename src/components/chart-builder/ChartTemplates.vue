<template>
  <Teleport to="body">
    <div
      ref="modalRef"
      class="modal fade"
      tabindex="-1"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-file-earmark-text me-2" />
              Mẫu biểu đồ
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="hide"
            />
          </div>
          <div class="modal-body">
            <div class="chart-templates">
              <div
                v-for="template in templates"
                :key="template.id"
                class="chart-templates__item"
                @click="handleSelect(template)"
              >
                <div class="chart-templates__preview">
                  <i :class="template.icon" />
                </div>
                <div class="chart-templates__info">
                  <h6 class="chart-templates__title">
                    {{ template.name }}
                  </h6>
                  <p class="chart-templates__description">
                    {{ template.description }}
                  </p>
                  <div class="chart-templates__tags">
                    <span
                      v-for="tag in template.tags"
                      :key="tag"
                      class="badge bg-secondary"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="hide"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useModal } from '@/composables/useModal'

const { modalRef, show, hide } = useModal({
    backdrop: true,
    keyboard: true
})

const emit = defineEmits(['select'])

const templates = [
    {
        id: 'revenue-trend',
        name: 'Xu hướng Doanh thu',
        description: 'Biểu đồ đường thể hiện xu hướng doanh thu theo thời gian',
        icon: 'bi bi-graph-up',
        tags: ['Doanh thu', 'Xu hướng'],
        config: {
            title: 'Xu hướng Doanh thu',
            chartType: 'line',
            dataSource: 'revenue',
            colors: ['var(--color-primary)'],
            legend: { show: true, position: 'top' }
        }
    },
    {
        id: 'category-comparison',
        name: 'So sánh Danh mục',
        description: 'Biểu đồ cột so sánh doanh thu giữa các danh mục',
        icon: 'bi bi-bar-chart',
        tags: ['Danh mục', 'So sánh'],
        config: {
            title: 'Doanh thu theo Danh mục',
            chartType: 'bar',
            dataSource: 'categoryRevenue',
            colors: ['var(--color-primary)', 'var(--color-success)', 'var(--color-warning)'],
            legend: { show: true, position: 'top' }
        }
    },
    {
        id: 'payment-methods',
        name: 'Phương thức Thanh toán',
        description: 'Biểu đồ tròn thể hiện tỷ lệ các phương thức thanh toán',
        icon: 'bi bi-pie-chart',
        tags: ['Thanh toán', 'Tỷ lệ'],
        config: {
            title: 'Phương thức Thanh toán',
            chartType: 'pie',
            dataSource: 'paymentMethods',
            colors: ['#2563eb', '#f97316', '#22c55e', '#facc15', '#ec4899'],
            legend: { show: true, position: 'bottom' }
        }
    },
    {
        id: 'top-products',
        name: 'Top Sản phẩm',
        description: 'Biểu đồ cột ngang thể hiện top sản phẩm bán chạy',
        icon: 'bi bi-trophy',
        tags: ['Sản phẩm', 'Top'],
        config: {
            title: 'Top Sản phẩm',
            chartType: 'bar',
            dataSource: 'topProducts',
            colors: ['var(--color-success)'],
            legend: { show: false }
        }
    },
    {
        id: 'hourly-sales',
        name: 'Doanh thu theo Giờ',
        description: 'Biểu đồ vùng thể hiện doanh thu theo từng giờ trong ngày',
        icon: 'bi bi-clock-history',
        tags: ['Giờ', 'Doanh thu'],
        config: {
            title: 'Doanh thu theo Giờ',
            chartType: 'area',
            dataSource: 'hourlySales',
            colors: ['var(--color-primary)'],
            legend: { show: true, position: 'top' }
        }
    }
]

const handleSelect = (template) => {
    emit('select', template)
    hide()
}

defineExpose({
    show,
    hide
})
</script>

<style scoped>
.chart-templates {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: var(--spacing-3);
}

.chart-templates__item {
    display: flex;
    flex-direction: column;
    padding: var(--spacing-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    background: var(--color-card);
    cursor: pointer;
    transition: all var(--transition-base);
}

.chart-templates__item:hover {
    border-color: var(--color-primary);
    background: var(--color-bg-muted);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.chart-templates__preview {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 120px;
    background: var(--color-bg-muted);
    border-radius: var(--radius-base);
    margin-bottom: var(--spacing-3);
}

.chart-templates__preview i {
    font-size: 3rem;
    color: var(--color-primary);
}

.chart-templates__info {
    flex: 1;
}

.chart-templates__title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
    margin-bottom: var(--spacing-1);
}

.chart-templates__description {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-2);
    line-height: 1.5;
}

.chart-templates__tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-1);
}

.chart-templates__tags .badge {
    font-size: var(--font-size-xs);
    padding: 2px 8px;
}
</style>

