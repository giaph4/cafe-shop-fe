import api from './axios'

const BASE_URL = '/api/v1/purchase-orders'

/**
 * 12.1 Tạo phiếu nhập hàng
 */
export const createPurchaseOrder = async (orderData) => {
    const { data } = await api.post(BASE_URL, orderData)
    return data
}

/**
 * 12.2 Lấy danh sách phiếu nhập (có lọc)
 */
export const getPurchaseOrders = async (filters) => {
    const params = {
        page: filters.page || 0,
        size: filters.size || 10,
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

    const { data } = await api.get(BASE_URL, { params })
    return data
}

/**
 * 12.3 Lấy chi tiết phiếu nhập
 */
export const getPurchaseOrderById = async (id) => {
    const { data } = await api.get(`${BASE_URL}/${id}`)
    return data
}

/**
 * 12.4 Hoàn thành phiếu nhập
 */
export const markOrderAsCompleted = async (id) => {
    const { data } = await api.post(`${BASE_URL}/${id}/complete`)
    return data
}

/**
 * 12.5 Hủy phiếu nhập
 */
export const cancelPurchaseOrder = async (id) => {
    const { data } = await api.post(`${BASE_URL}/${id}/cancel`)
    return data
}
