import api from './axios'
import { cleanParams } from './helpers'

const BASE_URL = '/api/v1/customers'

/**
 * Lấy danh sách khách hàng (phân trang)
 */
export const getCustomers = async ({ keyword = '', page = 0, size = 15, sort } = {}) => {
    const params = cleanParams({ keyword, page, size, sort })
    try {
        const { data } = await api.get(BASE_URL, { params })
        // Debug log để kiểm tra response format
        if (import.meta.env.DEV) {
            console.log('[customerService] getCustomers response:', {
                hasContent: !!data?.content,
                contentLength: data?.content?.length,
                totalPages: data?.totalPages,
                totalElements: data?.totalElements,
                isArray: Array.isArray(data),
                dataKeys: data ? Object.keys(data) : []
            })
        }
        return data
    } catch (error) {
        console.error('[customerService] getCustomers error:', error)
        throw error
    }
}

/**
 * Tìm kiếm khách hàng nhanh (không yêu cầu phân trang đầy đủ)
 * Giữ lại để tái sử dụng ở POS – fallback về getCustomers
 */
export const searchCustomers = async ({ keyword = '', page = 0, size = 5 } = {}) => {
    const response = await getCustomers({ keyword, page, size })
    if (Array.isArray(response?.content)) {
        return response
    }
    return Array.isArray(response) ? { content: response } : { content: [] }
}

/**
 * Tạo khách hàng mới
 */
export const createCustomer = async (customerData) => {
    const payload = {
        fullName: customerData.fullName,
        phone: customerData.phone,
        email: customerData.email ?? null
    }
    const { data } = await api.post(BASE_URL, payload)
    return data
}

/**
 * Lấy chi tiết khách hàng theo ID
 */
export const getCustomerById = async (id) => {
    const { data } = await api.get(`${BASE_URL}/${id}`)
    return data
}

/**
 * Lấy khách hàng theo số điện thoại
 */
export const getCustomerByPhone = async (phone) => {
    const { data } = await api.get(`${BASE_URL}/phone/${encodeURIComponent(phone)}`)
    return data
}

/**
 * Cập nhật khách hàng
 */
export const updateCustomer = async ({ id, data: customerData }) => {
    const payload = {
        fullName: customerData.fullName,
        phone: customerData.phone,
        email: customerData.email ?? null
    }
    const { data } = await api.put(`${BASE_URL}/${id}`, payload)
    return data
}

/**
 * Xóa khách hàng
 */
export const deleteCustomer = async (id) => {
    const { data } = await api.delete(`${BASE_URL}/${id}`)
    return data
}

/**
 * Lấy lịch sử mua hàng của khách hàng
 */
export const getCustomerPurchaseHistory = async ({
    id,
    startDate,
    endDate,
    status,
    page = 0,
    size = 10
} = {}) => {
    const params = cleanParams({
        page,
        size,
        startDate,
        endDate,
        status
    })

    const { data } = await api.get(`${BASE_URL}/${id}/purchase-history`, { params })
    return data
}
