<template>
  <Teleport to="body">
    <div
      ref="modalRef"
      class="modal fade dashboard-templates-modal"
      tabindex="-1"
    >
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-header__content">
              <h5 class="modal-title">
                Dashboard Templates
              </h5>
              <p class="modal-subtitle mb-0">
                Chọn template có sẵn hoặc tạo dashboard mới
              </p>
            </div>
            <button
              type="button"
              class="btn-close"
              @click="handleClose"
            />
          </div>

          <div class="modal-body">
            <div class="dashboard-templates__categories">
              <button
                v-for="category in categories"
                :key="category.key"
                class="btn btn-sm"
                :class="activeCategory === category.key ? 'btn-primary' : 'btn-outline-secondary'"
                @click="activeCategory = category.key"
              >
                {{ category.label }}
              </button>
            </div>

            <div class="dashboard-templates__grid">
              <div
                v-for="template in filteredTemplates"
                :key="template.id"
                class="dashboard-templates__item"
                @click="handleSelectTemplate(template)"
              >
                <div class="dashboard-templates__item-preview">
                  <div class="dashboard-templates__item-preview-content">
                    <div
                      v-for="(widget, index) in template.preview"
                      :key="index"
                      class="dashboard-templates__preview-widget"
                      :style="{ gridColumn: `span ${widget.colSpan || 6}` }"
                    >
                      <div class="dashboard-templates__preview-widget-content" />
                    </div>
                  </div>
                </div>
                <div class="dashboard-templates__item-info">
                  <h6 class="dashboard-templates__item-name">
                    {{ template.name }}
                  </h6>
                  <p class="dashboard-templates__item-description">
                    {{ template.description }}
                  </p>
                  <div class="dashboard-templates__item-meta">
                    <span class="badge bg-secondary">
                      {{ template.widgets.length }} widgets
                    </span>
                    <span
                      v-if="template.role"
                      class="badge bg-info"
                    >
                      {{ template.role }}
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
              @click="handleClose"
            >
              Hủy
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="handleCreateBlank"
            >
              Tạo Dashboard Trống
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useModal } from '@/composables/useModal'
import { useAuthStore } from '@/store/auth'

const props = defineProps({
    role: {
        type: String,
        default: null
    }
})

const emit = defineEmits(['select', 'close', 'create-blank'])

const { modalRef, show, hide } = useModal()
const authStore = useAuthStore()

const activeCategory = ref('all')

const categories = [
    { key: 'all', label: 'Tất cả' },
    { key: 'operations', label: 'Vận hành' },
    { key: 'financial', label: 'Tài chính' },
    { key: 'inventory', label: 'Kho hàng' },
    { key: 'analytics', label: 'Phân tích' }
]

const templates = [
    {
        id: 'operations',
        name: 'Dashboard Vận hành',
        description: 'Theo dõi đơn hàng, ca làm việc, và hiệu suất nhân viên',
        category: 'operations',
        role: 'MANAGER',
        widgets: [
            {
                id: 'widget_1',
                type: 'kpi',
                title: 'Đơn hàng hôm nay',
                icon: 'bi bi-receipt',
                colSpan: 3,
                rowSpan: 1,
                config: { dataSource: 'todayOrders', format: 'number' }
            },
            {
                id: 'widget_2',
                type: 'kpi',
                title: 'Doanh thu hôm nay',
                icon: 'bi bi-cash-stack',
                colSpan: 3,
                rowSpan: 1,
                config: { dataSource: 'todayRevenue', format: 'currency' }
            },
            {
                id: 'widget_3',
                type: 'chart',
                title: 'Doanh thu theo giờ',
                icon: 'bi bi-bar-chart',
                colSpan: 6,
                rowSpan: 2,
                config: { chartType: 'line', dataSource: 'hourlySales', dateFrom: '', dateTo: '' }
            },
            {
                id: 'widget_4',
                type: 'table',
                title: 'Top sản phẩm',
                icon: 'bi bi-table',
                colSpan: 6,
                rowSpan: 2,
                config: { dataSource: 'topProducts', dateFrom: '', dateTo: '' }
            }
        ],
        preview: [
            { colSpan: 3 },
            { colSpan: 3 },
            { colSpan: 6 },
            { colSpan: 6 }
        ]
    },
    {
        id: 'financial',
        name: 'Dashboard Tài chính',
        description: 'Theo dõi doanh thu, lợi nhuận, và chi phí',
        category: 'financial',
        role: 'ADMIN',
        widgets: [
            {
                id: 'widget_1',
                type: 'kpi',
                title: 'Doanh thu tháng',
                icon: 'bi bi-cash-coin',
                colSpan: 4,
                rowSpan: 1,
                config: { dataSource: 'monthRevenue', format: 'currency' }
            },
            {
                id: 'widget_2',
                type: 'kpi',
                title: 'Lợi nhuận',
                icon: 'bi bi-graph-up',
                colSpan: 4,
                rowSpan: 1,
                config: { dataSource: 'profit', format: 'currency' }
            },
            {
                id: 'widget_3',
                type: 'kpi',
                title: 'Chi phí',
                icon: 'bi bi-graph-down',
                colSpan: 4,
                rowSpan: 1,
                config: { dataSource: 'expenses', format: 'currency' }
            },
            {
                id: 'widget_4',
                type: 'chart',
                title: 'Xu hướng doanh thu',
                icon: 'bi bi-line-chart',
                colSpan: 12,
                rowSpan: 2,
                config: { chartType: 'area', dataSource: 'revenue', dateFrom: '', dateTo: '' }
            }
        ],
        preview: [
            { colSpan: 4 },
            { colSpan: 4 },
            { colSpan: 4 },
            { colSpan: 12 }
        ]
    },
    {
        id: 'inventory',
        name: 'Dashboard Kho hàng',
        description: 'Theo dõi tồn kho, đơn nhập, và cảnh báo',
        category: 'inventory',
        role: 'MANAGER',
        widgets: [
            {
                id: 'widget_1',
                type: 'kpi',
                title: 'Nguyên liệu sắp hết',
                icon: 'bi bi-exclamation-triangle',
                colSpan: 6,
                rowSpan: 1,
                config: { dataSource: 'lowStock', format: 'number' }
            },
            {
                id: 'widget_2',
                type: 'kpi',
                title: 'Đơn nhập chờ',
                icon: 'bi bi-cart',
                colSpan: 6,
                rowSpan: 1,
                config: { dataSource: 'pendingOrders', format: 'number' }
            },
            {
                id: 'widget_3',
                type: 'alert',
                title: 'Cảnh báo kho',
                icon: 'bi bi-bell',
                colSpan: 12,
                rowSpan: 2,
                config: { maxItems: 10 }
            }
        ],
        preview: [
            { colSpan: 6 },
            { colSpan: 6 },
            { colSpan: 12 }
        ]
    },
    {
        id: 'analytics',
        name: 'Dashboard Phân tích',
        description: 'Phân tích chi tiết về sản phẩm, khách hàng, và xu hướng',
        category: 'analytics',
        role: 'ADMIN',
        widgets: [
            {
                id: 'widget_1',
                type: 'chart',
                title: 'Doanh thu theo danh mục',
                icon: 'bi bi-pie-chart',
                colSpan: 6,
                rowSpan: 2,
                config: { chartType: 'pie', dataSource: 'categoryRevenue', dateFrom: '', dateTo: '' }
            },
            {
                id: 'widget_2',
                type: 'table',
                title: 'Top khách hàng',
                icon: 'bi bi-people',
                colSpan: 6,
                rowSpan: 2,
                config: { dataSource: 'topCustomers', dateFrom: '', dateTo: '' }
            },
            {
                id: 'widget_3',
                type: 'chart',
                title: 'Xu hướng đơn hàng',
                icon: 'bi bi-graph-up',
                colSpan: 12,
                rowSpan: 2,
                config: { chartType: 'line', dataSource: 'revenue', dateFrom: '', dateTo: '' }
            }
        ],
        preview: [
            { colSpan: 6 },
            { colSpan: 6 },
            { colSpan: 12 }
        ]
    }
]

const filteredTemplates = computed(() => {
    let filtered = templates

    // Filter by category
    if (activeCategory.value !== 'all') {
        filtered = filtered.filter(t => t.category === activeCategory.value)
    }

    // Filter by role if specified
    const userRole = props.role || (authStore.isAdmin ? 'ADMIN' : authStore.isManager ? 'MANAGER' : 'STAFF')
    filtered = filtered.filter(t => !t.role || t.role === userRole || userRole === 'ADMIN')

    return filtered
})

const handleSelectTemplate = (template) => {
    emit('select', template)
    hide()
}

const handleCreateBlank = () => {
    emit('create-blank')
    hide()
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
.dashboard-templates-modal .modal-header__content {
    flex: 1;
}

.dashboard-templates-modal .modal-subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
}

.dashboard-templates__categories {
    display: flex;
    gap: var(--spacing-2);
    margin-bottom: var(--spacing-4);
    flex-wrap: wrap;
}

.dashboard-templates__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--spacing-4);
}

.dashboard-templates__item {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    overflow: hidden;
    cursor: pointer;
    transition: all var(--transition-base);
    background: var(--color-card);
}

.dashboard-templates__item:hover {
    border-color: var(--color-primary);
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dashboard-templates__item-preview {
    background: var(--color-bg-muted);
    padding: var(--spacing-3);
    min-height: 200px;
}

.dashboard-templates__item-preview-content {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: var(--spacing-2);
    height: 100%;
}

.dashboard-templates__preview-widget {
    background: var(--color-primary);
    border-radius: var(--radius-base);
    opacity: 0.3;
    min-height: 40px;
}

.dashboard-templates__item-info {
    padding: var(--spacing-3);
}

.dashboard-templates__item-name {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-1);
    color: var(--color-text);
}

.dashboard-templates__item-description {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-2);
    line-height: 1.4;
}

.dashboard-templates__item-meta {
    display: flex;
    gap: var(--spacing-2);
    flex-wrap: wrap;
}
</style>

