import api from './axios'
import { buildApiError } from '@/utils/errorHandler'
import { cleanParams } from './utils'

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

/**
 * 12.6 Cập nhật phiếu nhập hàng
 * @param {string|number} id - ID của phiếu nhập cần cập nhật
 * @param {Object} updateData - Dữ liệu cần cập nhật
 * @param {number} [updateData.supplierId] - ID nhà cung cấp
 * @param {string} [updateData.note] - Ghi chú
 * @param {Array} [updateData.items] - Danh sách items (nếu cần cập nhật)
 * @returns {Promise<Object>} Purchase order đã được cập nhật
 */
export const updatePurchaseOrder = async (id, updateData) => {
    if (!id) {
        throw new Error('Purchase order ID is required')
    }
    
    // Chuẩn hóa payload: chỉ gửi các trường có giá trị
    const body = {}
    if (updateData.supplierId !== undefined) {
        body.supplierId = updateData.supplierId
    }
    if (updateData.note !== undefined) {
        body.note = typeof updateData.note === 'string' ? updateData.note.trim() : updateData.note
    }
    if (Array.isArray(updateData.items)) {
        body.items = updateData.items
    }
    
    const { data } = await api.put(`${BASE_URL}/${id}`, body)
    return data
}