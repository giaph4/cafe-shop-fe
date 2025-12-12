import api from './axios'
import logger from '@/utils/logger'

const BASE_URL = '/api/dashboard/custom'

/**
 * Lưu layout dashboard vào backend
 * @param {Object} layout - Dữ liệu layout dashboard
 * @param {string} layout.name - Tên dashboard
 * @param {string} layout.view - View dashboard (operations, financial, inventory, etc.)
 * @param {Array} layout.widgets - Mảng cấu hình widgets
 * @param {string} layout.role - Vai trò người dùng
 * @returns {Promise<Object>} Layout đã lưu
 */
export const saveDashboardLayout = (layout) =>
    // Endpoint API chưa có trong backend, chỉ dùng localStorage
    saveDashboardLayoutToLocalStorage(layout)


/**
 * Tải layout dashboard từ backend
 * @param {string} view - Tên view dashboard
 * @param {string} role - Vai trò người dùng
 * @returns {Promise<Object|null>} Layout dashboard hoặc null
 */
export const loadDashboardLayout = (view, role) =>
    // Endpoint API chưa có trong backend, chỉ dùng localStorage
    loadDashboardLayoutFromLocalStorage(view, role)


/**
 * Tải tất cả layouts dashboard của người dùng
 * @param {string} role - Vai trò người dùng
 * @returns {Promise<Array>} Mảng layouts dashboard
 */
export const loadAllDashboardLayouts = (role) =>
    // Endpoint API chưa có trong backend, chỉ dùng localStorage
    loadAllDashboardLayoutsFromLocalStorage(role)


/**
 * Xóa layout dashboard
 * @param {string} layoutId - ID layout
 * @returns {Promise<void>}
 */
export const deleteDashboardLayout = (layoutId) => {
    // Endpoint API chưa có trong backend, chỉ dùng localStorage
    deleteDashboardLayoutFromLocalStorage(layoutId)
}

/**
 * Sao chép layout dashboard từ người dùng khác
 * @param {string} sourceUserId - ID người dùng nguồn
 * @param {string} sourceLayoutId - ID layout nguồn
 * @param {string} newName - Tên layout mới
 * @returns {Promise<Object>} Layout đã sao chép
 */
export const cloneDashboardLayout = async (sourceUserId, sourceLayoutId, newName) => {
    const { data } = await api.post(`${BASE_URL}/clone`, {
        sourceUserId,
        sourceLayoutId,
        newName
    })
    return data
}

/**
 * Xuất cấu hình layout dashboard
 * @param {string} layoutId - ID layout
 * @returns {Promise<Object>} Cấu hình layout dạng JSON
 */
export const exportDashboardLayout = async (layoutId) => {
    try {
        const { data } = await api.get(`${BASE_URL}/${layoutId}/export`)
        return data
    } catch (error) {
        // Dùng localStorage nếu API thất bại
        if (error.response?.status === 404 || error.response?.status >= 500) {
            return exportDashboardLayoutFromLocalStorage(layoutId)
        }
        throw error
    }
}

/**
 * Nhập cấu hình layout dashboard
 * @param {Object} layoutConfig - Cấu hình layout dạng JSON
 * @returns {Promise<Object>} Layout đã nhập
 */
export const importDashboardLayout = async (layoutConfig) => {
    try {
        const { data } = await api.post(`${BASE_URL}/import`, layoutConfig)
        return data
    } catch (error) {
        // Dùng localStorage nếu API thất bại
        if (error.response?.status === 404 || error.response?.status >= 500) {
            return importDashboardLayoutToLocalStorage(layoutConfig)
        }
        throw error
    }
}

// ==================== Dự phòng LocalStorage ====================

const STORAGE_KEY = 'custom_dashboard_layouts'

const saveDashboardLayoutToLocalStorage = (layout) => {
    try {
        const layouts = loadAllDashboardLayoutsFromLocalStorage(layout.role || 'default')
        const existingIndex = layouts.findIndex(l => l.id === layout.id)

        const layoutToSave = {
            ...layout,
            id: layout.id || `layout_${Date.now()}`,
            updatedAt: new Date().toISOString(),
            createdAt: layout.createdAt || new Date().toISOString()
        }

        if (existingIndex >= 0) {
            layouts[existingIndex] = layoutToSave
        } else {
            layouts.push(layoutToSave)
        }

        const key = `${STORAGE_KEY}_${layout.role || 'default'}`
        localStorage.setItem(key, JSON.stringify(layouts))
        return layoutToSave
    } catch (error) {
        logger.error('Lỗi khi lưu layout dashboard vào localStorage:', error)
        throw error
    }
}

const loadDashboardLayoutFromLocalStorage = (view, role) => {
    try {
        const layouts = loadAllDashboardLayoutsFromLocalStorage(role)
        return layouts.find(l => l.view === view) || null
    } catch (error) {
        logger.error('Lỗi khi tải layout dashboard từ localStorage:', error)
        return null
    }
}

const loadAllDashboardLayoutsFromLocalStorage = (role) => {
    try {
        const key = `${STORAGE_KEY}_${role || 'default'}`
        const data = localStorage.getItem(key)
        return data ? JSON.parse(data) : []
    } catch (error) {
        logger.error('Lỗi khi tải tất cả layouts dashboard từ localStorage:', error)
        return []
    }
}

const deleteDashboardLayoutFromLocalStorage = (layoutId) => {
    try {
        // Tìm và xóa từ tất cả các vai trò
        const roles = ['ADMIN', 'MANAGER', 'STAFF', 'default']
        roles.forEach(role => {
            const layouts = loadAllDashboardLayoutsFromLocalStorage(role)
            const filtered = layouts.filter(l => l.id !== layoutId)
            const key = `${STORAGE_KEY}_${role}`
            localStorage.setItem(key, JSON.stringify(filtered))
        })
    } catch (error) {
        logger.error('Lỗi khi xóa layout dashboard từ localStorage:', error)
    }
}

const exportDashboardLayoutFromLocalStorage = (layoutId) => {
    try {
        const roles = ['ADMIN', 'MANAGER', 'STAFF', 'default']
        for (const role of roles) {
            const layouts = loadAllDashboardLayoutsFromLocalStorage(role)
            const layout = layouts.find(l => l.id === layoutId)
            if (layout) {
                return layout
            }
        }
        return null
    } catch (error) {
        logger.error('Lỗi khi xuất layout dashboard từ localStorage:', error)
        return null
    }
}

const importDashboardLayoutToLocalStorage = (layoutConfig) => {
    const _role = layoutConfig.role || 'default'
    const layoutToImport = {
        ...layoutConfig,
        id: `layout_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
    return saveDashboardLayoutToLocalStorage(layoutToImport)
}

