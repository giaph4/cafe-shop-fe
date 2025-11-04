import api from './axios'

/**
 * API 42: Lấy danh sách đơn hàng (Có phân trang VÀ LỌC)
 * @param {object} filters - { page, size, status, supplierId, startDate, endDate }
 */
export const getPurchaseOrders = async (filters) => {
    const params = {
        page: filters.page || 0,
        size: filters.size || 10,
        sort: 'orderDate,desc',
        status: filters.status || null,
        supplierId: filters.supplierId || null,
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
    }

    // Xóa các param rỗng hoặc null
    Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === '') {
            delete params[key]
        }
    })

    const { data } = await api.get('/purchase-orders', { params })
    return data
}

/**
 * API 43: Lấy chi tiết một đơn hàng
 */
export const getPurchaseOrderById = async (id) => {
    const { data } = await api.get(`/purchase-orders/${id}`)
    return data
}

/**
 * API 41: Tạo đơn hàng mới
 */
export const createPurchaseOrder = async (orderData) => {
    const { data } = await api.post('/purchase-orders', orderData)
    return data
}

/**
 * API 44: Đánh dấu hoàn thành
 */
export const markOrderAsCompleted = async (id) => {
    const { data } = await api.post(`/purchase-orders/${id}/complete`)
    return data
}

/**
 * API 45: Huỷ đơn hàng
 */
export const cancelPurchaseOrder = async (id) => {
    const { data } = await api.post(`/purchase-orders/${id}/cancel`)
    return data
}