import api from './axios'
import { cleanParams } from './utils'

const BASE_URL = '/api/v1/customers'

// Sử dụng cleanParams từ utils thay vì buildSearchParams

/**
 * 7.1. Lấy danh sách khách hàng (phân trang)
 */
export const getCustomers = async ({ keyword = '', page = 0, size = 15, sort } = {}) => {
    const params = cleanParams({ keyword, page, size, sort })
    const { data } = await api.get(BASE_URL, { params })
    return data
}

/**
 * 7.2. Tìm kiếm khách hàng nhanh (không yêu cầu phân trang đầy đủ)
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
 * 7.3. Tạo khách hàng mới
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
 * 7.4. Lấy chi tiết khách hàng theo ID
 */
export const getCustomerById = async (id) => {
    const { data } = await api.get(`${BASE_URL}/${id}`)
    return data
}

/**
 * 7.5. Lấy khách hàng theo số điện thoại
 */
export const getCustomerByPhone = async (phone) => {
    const { data } = await api.get(`${BASE_URL}/phone/${encodeURIComponent(phone)}`)
    return data
}

/**
 * 7.6. Cập nhật khách hàng
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
 * 7.7. Xóa khách hàng
 */
export const deleteCustomer = async (id) => {
    const { data } = await api.delete(`${BASE_URL}/${id}`)
    return data
}

/**
 * 7.8. Lấy lịch sử mua hàng của khách
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
