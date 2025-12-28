import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
    saveDashboardLayout,
    loadDashboardLayout,
    loadAllDashboardLayouts,
    deleteDashboardLayout
} from '@/api/customDashboardService'
import { useAuthStore } from './auth'

export const useCustomDashboardStore = defineStore('customDashboard', () => {
    const authStore = useAuthStore()

    // State
    const currentLayout = ref(null)
    const allLayouts = ref([])
    const currentView = ref('operations')
    const isEditMode = ref(false)
    const isLoading = ref(false)
    const error = ref(null)

    // Computed
    const userRole = computed(() => {
        if (authStore.isAdmin) return 'ADMIN'
        if (authStore.isManager) return 'MANAGER'
        if (authStore.isStaff) return 'STAFF'
        return 'default'
    })

    const currentViewLayout = computed(() => {
        if (!currentLayout.value) return null
        return currentLayout.value.view === currentView.value ? currentLayout.value : null
    })

    // Actions
    const setEditMode = (value) => {
        isEditMode.value = value
    }

    const setCurrentView = (view) => {
        currentView.value = view
    }

    const setCurrentLayout = (layout) => {
        currentLayout.value = layout
    }

    const setError = (err) => {
        error.value = err
    }

    const clearError = () => {
        error.value = null
    }

    /**
     * Load dashboard layout cho view hiện tại
     */
    const loadLayout = async (view = null) => {
        isLoading.value = true
        error.value = null

        try {
            const viewToLoad = view || currentView.value
            const layout = await loadDashboardLayout(viewToLoad, userRole.value)

            if (layout) {
                currentLayout.value = layout
            } else {
                // Tạo layout mặc định nếu chưa có
                currentLayout.value = createDefaultLayout(viewToLoad)
            }

            return currentLayout.value
        } catch (err) {
            // Chỉ hiển thị lỗi nếu không phải lỗi API (fallback đã xử lý)
            // Lỗi API (404, 500) đã được xử lý trong service với fallback
            if (err.response && err.response.status < 500 && err.response.status !== 404) {
                error.value = err.message || 'Không thể tải dashboard layout'
                console.error('Error loading dashboard layout:', err)
            }
            // Tạo layout mặc định khi lỗi
            currentLayout.value = createDefaultLayout(view || currentView.value)
            return currentLayout.value
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Load tất cả layouts của user
     */
    const loadAllLayouts = async () => {
        isLoading.value = true
        error.value = null

        try {
            const layouts = await loadAllDashboardLayouts(userRole.value)
            allLayouts.value = layouts
            return layouts
        } catch (err) {
            // Chỉ hiển thị lỗi nếu không phải lỗi API (fallback đã xử lý)
            if (err.response && err.response.status < 500 && err.response.status !== 404) {
                error.value = err.message || 'Không thể tải danh sách dashboard layouts'
                console.error('Error loading all dashboard layouts:', err)
            }
            allLayouts.value = []
            return []
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Save dashboard layout
     */
    const saveLayout = async (layout = null) => {
        isLoading.value = true
        error.value = null

        try {
            const layoutToSave = layout || currentLayout.value
            if (!layoutToSave) {
                throw new Error('Không có layout để lưu')
            }

            const savedLayout = await saveDashboardLayout({
                ...layoutToSave,
                role: userRole.value,
                view: layoutToSave.view || currentView.value
            })

            currentLayout.value = savedLayout

            // Update trong allLayouts
            const index = allLayouts.value.findIndex(l => l.id === savedLayout.id)
            if (index >= 0) {
                allLayouts.value[index] = savedLayout
            } else {
                allLayouts.value.push(savedLayout)
            }

            return savedLayout
        } catch (err) {
            error.value = err.message || 'Không thể lưu dashboard layout'
            console.error('Error saving dashboard layout:', err)
            throw err
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Delete dashboard layout
     */
    const removeLayout = async (layoutId) => {
        isLoading.value = true
        error.value = null

        try {
            await deleteDashboardLayout(layoutId)

            // Xóa khỏi allLayouts
            allLayouts.value = allLayouts.value.filter(l => l.id !== layoutId)

            // Clear currentLayout nếu đang xóa layout hiện tại
            if (currentLayout.value?.id === layoutId) {
                currentLayout.value = null
            }
        } catch (err) {
            error.value = err.message || 'Không thể xóa dashboard layout'
            console.error('Error deleting dashboard layout:', err)
            throw err
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Update widgets trong layout hiện tại
     */
    const updateWidgets = (widgets) => {
        if (!currentLayout.value) {
            currentLayout.value = createDefaultLayout(currentView.value)
        }
        currentLayout.value.widgets = widgets
    }

    /**
     * Add widget vào layout
     */
    const addWidget = (widget) => {
        if (!currentLayout.value) {
            currentLayout.value = createDefaultLayout(currentView.value)
        }
        if (!currentLayout.value.widgets) {
            currentLayout.value.widgets = []
        }
        currentLayout.value.widgets.push(widget)
    }

    /**
     * Remove widget từ layout
     */
    const removeWidget = (widgetId) => {
        if (!currentLayout.value?.widgets) return
        currentLayout.value.widgets = currentLayout.value.widgets.filter(w => w.id !== widgetId)
    }

    /**
     * Update widget trong layout
     */
    const updateWidget = (widgetId, updates) => {
        if (!currentLayout.value?.widgets) return
        const index = currentLayout.value.widgets.findIndex(w => w.id === widgetId)
        if (index >= 0) {
            currentLayout.value.widgets[index] = {
                ...currentLayout.value.widgets[index],
                ...updates
            }
        }
    }

    /**
     * Tạo layout mặc định
     */
    const createDefaultLayout = (view) => ({
        id: `default_${view}_${Date.now()}`,
        name: `Dashboard ${view}`,
        view,
        role: userRole.value,
        widgets: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    })

    /**
     * Reset về layout mặc định
     */
    const resetToDefault = () => {
        currentLayout.value = createDefaultLayout(currentView.value)
    }

    return {
        // State
        currentLayout,
        allLayouts,
        currentView,
        isEditMode,
        isLoading,
        error,

        // Computed
        userRole,
        currentViewLayout,

        // Actions
        setEditMode,
        setCurrentView,
        setCurrentLayout,
        setError,
        clearError,
        loadLayout,
        loadAllLayouts,
        saveLayout,
        removeLayout,
        updateWidgets,
        addWidget,
        removeWidget,
        updateWidget,
        createDefaultLayout,
        resetToDefault
    }
})

