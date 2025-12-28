import api from './axios'
import { cleanParams } from './helpers'

const BASE_URL = '/api/v1/purchase-orders'

/**
 * Tạo phiếu nhập hàng
 */
export const createPurchaseOrder = async (orderData) => {
    const { data } = await api.post(BASE_URL, orderData)
    return data
}

/**
 * Lấy danh sách phiếu nhập (có lọc)
 */
export const getPurchaseOrders = async (filters = {}) => {
    const params = cleanParams({
        page: filters.page || 0,
        size: filters.size || 10,
        status: filters.status,
        supplierId: filters.supplierId,
        startDate: filters.startDate,
        endDate: filters.endDate
    })

    const { data } = await api.get(BASE_URL, { params })
    return data
}

/**
 * Lấy chi tiết phiếu nhập
 */
export const getPurchaseOrderById = async (id) => {
    const { data } = await api.get(`${BASE_URL}/${id}`)
    return data
}

/**
 * Hoàn thành phiếu nhập
 */
export const markOrderAsCompleted = async (id) => {
    const { data } = await api.post(`${BASE_URL}/${id}/complete`)
    return data
}

/**
 * Hủy phiếu nhập
 */
export const cancelPurchaseOrder = async (id) => {
    const { data } = await api.post(`${BASE_URL}/${id}/cancel`)
    return data
}

/**
 * Cập nhật phiếu nhập hàng
 * @deprecated Backend KHÔNG hỗ trợ endpoint PUT /api/v1/purchase-orders/{id}
 * PurchaseOrderController chỉ có các endpoint:
 * - POST /api/v1/purchase-orders (create)
 * - GET /api/v1/purchase-orders (list)
 * - GET /api/v1/purchase-orders/{id} (get by id)
 * - POST /api/v1/purchase-orders/{id}/complete (complete)
 * - POST /api/v1/purchase-orders/{id}/cancel (cancel)
 *
 * Nếu cần cập nhật purchase order, cần tạo endpoint mới trong backend
 * @param {string|number} id - ID của phiếu nhập cần cập nhật
 * @param {Object} updateData - Dữ liệu cần cập nhật
 * @returns {Promise<Object>} Purchase order đã được cập nhật
 * @throws {Error} Backend không hỗ trợ endpoint này
 */
export const updatePurchaseOrder = async (_id, _updateData) => {
    throw new Error('Backend không hỗ trợ cập nhật purchase order. Vui lòng liên hệ admin để thêm tính năng này.')
}
