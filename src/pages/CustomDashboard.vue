<template>
  <div
    class="custom-dashboard-page"
    data-aos="fade-up"
  >
    <!-- Header -->
    <div class="custom-dashboard-page__header">
      <div class="custom-dashboard-page__header-left">
        <h1 class="custom-dashboard-page__title">
          Dashboard Tùy chỉnh
        </h1>
        <div class="custom-dashboard-page__view-selector">
          <button
            v-for="view in views"
            :key="view.key"
            class="btn btn-sm"
            :class="currentView === view.key ? 'btn-primary' : 'btn-outline-secondary'"
            @click="handleViewChange(view.key)"
          >
            <i :class="view.icon" />
            {{ view.label }}
          </button>
        </div>
      </div>
      <div class="custom-dashboard-page__header-actions">
        <button
          v-if="!isEditMode"
          class="btn btn-primary"
          @click="handleEditMode"
        >
          <i class="bi bi-pencil" />
          Tùy chỉnh
        </button>
        <template v-else>
          <button
            class="btn btn-success"
            :disabled="saving"
            @click="handleSave"
          >
            <span
              v-if="saving"
              class="spinner-border spinner-border-sm me-2"
            />
            <i class="bi bi-check-lg" />
            Lưu
          </button>
          <button
            class="btn btn-secondary"
            @click="handleCancel"
          >
            Hủy
          </button>
        </template>
        <button
          class="btn btn-outline-primary"
          @click="handleShowTemplates"
        >
          <i class="bi bi-grid-3x3" />
          Templates
        </button>
        <button
          class="btn btn-outline-secondary"
          @click="handleShowWidgetPicker"
        >
          <i class="bi bi-plus-circle" />
          Thêm Widget
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="custom-dashboard-page__content">
      <!-- Widget Picker Sidebar -->
      <div
        v-if="showWidgetPicker"
        class="custom-dashboard-page__sidebar"
      >
        <WidgetPicker
          @select="handleWidgetSelect"
          @close="showWidgetPicker = false"
        />
      </div>

      <!-- Dashboard Builder -->
      <div
        class="custom-dashboard-page__main"
        :class="{ 'custom-dashboard-page__main--sidebar-open': showWidgetPicker }"
      >
        <div
          v-if="loading"
          class="custom-dashboard-page__loading"
        >
          <div class="spinner-border text-primary" />
          <p class="mt-3 text-muted">
            Đang tải dashboard...
          </p>
        </div>
        <div
          v-else-if="error"
          class="custom-dashboard-page__error"
        >
          <i class="bi bi-exclamation-triangle" />
          <p>{{ error }}</p>
          <button
            class="btn btn-primary"
            @click="loadDashboard"
          >
            Thử lại
          </button>
        </div>
        <DashboardBuilder
          v-else
          :widgets="widgets"
          :is-edit-mode="isEditMode"
          @widget-move="handleWidgetMove"
          @widget-resize="handleWidgetResize"
          @widget-remove="handleWidgetRemove"
          @widget-add="handleWidgetAdd"
        />
      </div>
    </div>

    <!-- Widget Config Modal -->
    <WidgetConfigModal
      ref="widgetConfigModal"
      :widget="selectedWidget"
      :loading="saving"
      @save="handleWidgetSave"
      @close="selectedWidget = null"
    />

    <!-- Templates Modal -->
    <DashboardTemplates
      ref="templatesModal"
      :role="userRole"
      @select="handleTemplateSelect"
      @create-blank="handleCreateBlank"
      @close="() => {}"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useCustomDashboardStore } from '@/store/customDashboard'
import { useAuthStore } from '@/store/auth'
import DashboardBuilder from '@/components/custom-dashboard/DashboardBuilder.vue'
import WidgetPicker from '@/components/custom-dashboard/WidgetPicker.vue'
import WidgetConfigModal from '@/components/custom-dashboard/WidgetConfigModal.vue'
import DashboardTemplates from '@/components/custom-dashboard/DashboardTemplates.vue'
import { toast } from 'vue3-toastify'
import logger from '@/utils/logger'

const customDashboardStore = useCustomDashboardStore()
const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const isEditMode = ref(false)
const showWidgetPicker = ref(false)
const selectedWidget = ref(null)
const widgets = ref([])
const currentView = ref('operations')

const widgetConfigModal = ref(null)
const templatesModal = ref(null)

const views = [
    { key: 'operations', label: 'Vận hành', icon: 'bi bi-gear' },
    { key: 'financial', label: 'Tài chính', icon: 'bi bi-cash-coin' },
    { key: 'inventory', label: 'Kho hàng', icon: 'bi bi-box-seam' },
    { key: 'analytics', label: 'Phân tích', icon: 'bi bi-graph-up' }
]

const userRole = computed(() => {
    if (authStore.isAdmin) return 'ADMIN'
    if (authStore.isManager) return 'MANAGER'
    if (authStore.isStaff) return 'STAFF'
    return 'default'
})

// Watch store state
watch(() => customDashboardStore.currentLayout, (layout) => {
    if (layout && layout.widgets) {
        widgets.value = layout.widgets
    }
}, { deep: true })

watch(() => customDashboardStore.currentView, (view) => {
    currentView.value = view
})

// Load dashboard
const loadDashboard = async () => {
    loading.value = true
    error.value = null

    try {
        customDashboardStore.setCurrentView(currentView.value)
        await customDashboardStore.loadLayout(currentView.value)

        if (customDashboardStore.currentLayout?.widgets) {
            widgets.value = customDashboardStore.currentLayout.widgets
        } else {
            widgets.value = []
        }
    } catch (err) {
        error.value = err.message || 'Không thể tải dashboard'
        logger.error('Không thể tải dashboard:', err)
    } finally {
        loading.value = false
    }
}

// Edit mode
const handleEditMode = () => {
    isEditMode.value = true
    customDashboardStore.setEditMode(true)
}

const handleCancel = () => {
    isEditMode.value = false
    customDashboardStore.setEditMode(false)
    // Reload to reset changes
    loadDashboard()
}

const handleSave = async () => {
    saving.value = true

    try {
        const layout = {
            ...customDashboardStore.currentLayout,
            widgets: widgets.value,
            view: currentView.value
        }

        await customDashboardStore.saveLayout(layout)
        isEditMode.value = false
        customDashboardStore.setEditMode(false)

        toast.success('Đã lưu dashboard thành công!')
    } catch (err) {
        error.value = err.message || 'Không thể lưu dashboard'
        toast.error('Không thể lưu dashboard')
        logger.error('Không thể lưu dashboard:', err)
    } finally {
        saving.value = false
    }
}

// View change
const handleViewChange = async (view) => {
    if (isEditMode.value) {
        const confirmed = confirm('Bạn có muốn lưu thay đổi trước khi chuyển view không?')
        if (confirmed) {
            await handleSave()
        } else {
            handleCancel()
        }
    }

    currentView.value = view
    await loadDashboard()
}

// Widget operations
const handleWidgetSelect = (widget) => {
    widgets.value.push(widget)
    showWidgetPicker.value = false
}

const handleWidgetMove = ({ widget, target }) => {
    const widgetIndex = widgets.value.findIndex(w => w.id === widget.id)
    const targetIndex = widgets.value.findIndex(w => w.id === target.id)

    if (widgetIndex >= 0 && targetIndex >= 0) {
        const [movedWidget] = widgets.value.splice(widgetIndex, 1)
        widgets.value.splice(targetIndex, 0, movedWidget)
    }
}

const handleWidgetResize = ({ widget, event }) => {
    // Implement resize logic if needed
    logger.log('[CustomDashboard] Thay đổi kích thước widget', widget)
}

const handleWidgetRemove = (widgetId) => {
    widgets.value = widgets.value.filter(w => w.id !== widgetId)
}

const handleWidgetAdd = (widget) => {
    widgets.value.push({
        ...widget,
        id: widget.id || `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    })
}

const handleWidgetSave = (updatedWidget) => {
    const index = widgets.value.findIndex(w => w.id === updatedWidget.id)
    if (index >= 0) {
        widgets.value[index] = updatedWidget
    }
    selectedWidget.value = null
    widgetConfigModal.value?.hide()
}

// Templates
const handleShowTemplates = () => {
    templatesModal.value?.show()
}

const handleTemplateSelect = (template) => {
    widgets.value = template.widgets.map(w => ({
        ...w,
        id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }))
    isEditMode.value = true
    customDashboardStore.setEditMode(true)
    toast.success('Đã áp dụng template!')
}

const handleCreateBlank = () => {
    widgets.value = []
    isEditMode.value = true
    customDashboardStore.setEditMode(true)
    toast.info('Đã tạo dashboard trống')
}

const handleShowWidgetPicker = () => {
    showWidgetPicker.value = !showWidgetPicker.value
}

onMounted(() => {
    loadDashboard()
})
</script>

<style scoped>
.custom-dashboard-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: calc(100vh - 120px);
}

.custom-dashboard-page__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-4);
    background: var(--color-card);
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
    gap: var(--spacing-3);
}

.custom-dashboard-page__header-left {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.custom-dashboard-page__title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    margin: 0;
    color: var(--color-text);
}

.custom-dashboard-page__view-selector {
    display: flex;
    gap: var(--spacing-2);
    flex-wrap: wrap;
}

.custom-dashboard-page__header-actions {
    display: flex;
    gap: var(--spacing-2);
    flex-wrap: wrap;
}

.custom-dashboard-page__content {
    display: flex;
    flex: 1;
    overflow: hidden;
    position: relative;
}

.custom-dashboard-page__sidebar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.custom-dashboard-page__main {
    flex: 1;
    overflow-y: auto;
    transition: margin-left var(--transition-base);
}

.custom-dashboard-page__main--sidebar-open {
    margin-left: 320px;
}

.custom-dashboard-page__loading,
.custom-dashboard-page__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    gap: var(--spacing-3);
    color: var(--color-text-muted);
}

.custom-dashboard-page__error {
    color: var(--color-danger);
}
</style>

