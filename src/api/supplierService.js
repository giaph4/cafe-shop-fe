import api from './axios'
import { buildApiError } from './utils/errorHandler'
import { cleanParams } from './utils'
import logger from '@/utils/logger'

const BASE_URL = '/api/v1/suppliers'

// Sử dụng cleanParams từ utils thay vì buildQueryParams

/**
 * 11.1 Lấy danh sách nhà cung cấp (hỗ trợ phân trang/search)
 * 
 * Normalize response để xử lý cả array và Page format:
 * - Format 1: Page object { content: [], totalElements, totalPages, ... }
 * - Format 2: Array trực tiếp []
 * - Format 3: Object với data property { data: [] }
 * 
 * @param {Object} [params={}] - Query parameters
 * @param {number} [params.page] - Số trang (zero-based)
 * @param {number} [params.size] - Kích thước trang
 * @param {string} [params.keyword] - Từ khóa tìm kiếm
 * @returns {Promise<Object|Array>} Response đã được normalize
 */
export const getSuppliers = async (params = {}) => {
    const query = cleanParams(params)
    const { data } = await api.get(BASE_URL, { params: query })
    
    // Nếu không có data, trả về format chuẩn
    if (!data) {
        // Nếu có params phân trang, trả về Page format
        if (params.page !== undefined || params.size !== undefined) {
            return {
                content: [],
                totalElements: 0,
                totalPages: 0,
                number: params.page || 0,
                size: params.size || 10,
                first: true,
                last: true,
                numberOfElements: 0
            }
        }
        // Nếu không có params phân trang, trả về array
        return []
    }

    // Format 1: Page object (chuẩn Spring Data)
    if (data.content !== undefined && Array.isArray(data.content)) {
        return {
            content: data.content,
            totalElements: typeof data.totalElements === 'number' ? data.totalElements : data.content.length,
            totalPages: typeof data.totalPages === 'number' ? data.totalPages : 1,
            number: typeof data.number === 'number' ? data.number : (params.page || 0),
            size: typeof data.size === 'number' ? data.size : (params.size || 10),
            first: data.first !== undefined ? data.first : (data.number === 0),
            last: data.last !== undefined ? data.last : false,
            numberOfElements: typeof data.numberOfElements === 'number' ? data.numberOfElements : data.content.length
        }
    }

    // Format 2: Array trực tiếp
    if (Array.isArray(data)) {
        // Nếu có params phân trang, convert sang Page format
        if (params.page !== undefined || params.size !== undefined) {
            const page = params.page || 0
            const size = params.size || 10
            const startIndex = page * size
            const endIndex = startIndex + size
            const paginatedContent = data.slice(startIndex, endIndex)
            
            return {
                content: paginatedContent,
                totalElements: data.length,
                totalPages: Math.ceil(data.length / size),
                number: page,
                size: size,
                first: page === 0,
                last: endIndex >= data.length,
                numberOfElements: paginatedContent.length
            }
        }
        // Nếu không có params phân trang, trả về array
        return data
    }

    // Format 3: Object với data property
    if (data.data !== undefined && Array.isArray(data.data)) {
        // Convert sang Page format nếu có params phân trang
        if (params.page !== undefined || params.size !== undefined) {
            const page = params.page || 0
            const size = params.size || 10
            const startIndex = page * size
            const endIndex = startIndex + size
            const paginatedContent = data.data.slice(startIndex, endIndex)
            
            return {
                content: paginatedContent,
                totalElements: data.data.length,
                totalPages: Math.ceil(data.data.length / size),
                number: page,
                size: size,
                first: page === 0,
                last: endIndex >= data.data.length,
                numberOfElements: paginatedContent.length
            }
        }
        // Nếu không có params phân trang, trả về Page format với toàn bộ data
        return {
            content: data.data,
            totalElements: data.data.length,
            totalPages: 1,
            number: 0,
            size: data.data.length,
            first: true,
            last: true,
            numberOfElements: data.data.length
        }
    }

    // Format không xác định: log warning và trả về format mặc định
    if (import.meta.env.DEV) {
        logger.warn('[SupplierService] Unknown response format:', {
            hasContent: data.content !== undefined,
            isArray: Array.isArray(data),
            hasData: data.data !== undefined,
            keys: Object.keys(data)
        })
    }

    // Fallback: trả về format mặc định
    if (params.page !== undefined || params.size !== undefined) {
        return {
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: params.page || 0,
            size: params.size || 10,
            first: true,
            last: true,
            numberOfElements: 0
        }
    }
    return []
}

/**
 * 11.2 Lấy chi tiết nhà cung cấp
 */
export const getSupplierById = async (id) => {
    const { data } = await api.get(`${BASE_URL}/${id}`)
    return data
}

const normalizeSupplierPayload = (payload = {}) => ({
    name: payload.name?.trim(),
    contactPerson: payload.contactPerson?.trim() || null,
    phone: payload.phone?.trim(),
    email: payload.email?.trim() || null,
    address: payload.address?.trim() || null
})

/**
 * 11.3 Tạo nhà cung cấp mới
 */
export const createSupplier = async (supplierData) => {
    const payload = normalizeSupplierPayload(supplierData)
    const { data } = await api.post(BASE_URL, payload)
    return data
}

/**
 * 11.4 Cập nhật nhà cung cấp
 */
export const updateSupplier = async ({ id, data: supplierData }) => {
    const payload = normalizeSupplierPayload(supplierData)
    const { data } = await api.put(`${BASE_URL}/${id}`, payload)
    return data
}

/**
 * 11.5 Xóa nhà cung cấp
 */
export const deleteSupplier = async (id) => {
    await api.delete(`${BASE_URL}/${id}`)
}
