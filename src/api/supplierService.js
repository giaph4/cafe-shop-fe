import api from './axios'

const BASE_URL = '/api/v1/suppliers'

const buildQueryParams = (params = {}) => {
    const searchParams = new URLSearchParams()
    if (Number.isFinite(params.page)) searchParams.append('page', params.page)
    if (Number.isFinite(params.size)) searchParams.append('size', params.size)
    if (params.keyword) searchParams.append('keyword', params.keyword)
    return searchParams.toString() ? `?${searchParams.toString()}` : ''
}

/**
 * 11.1 Lấy danh sách nhà cung cấp (hỗ trợ phân trang/search)
 */
export const getSuppliers = async (params = {}) => {
    const query = buildQueryParams(params)
    const { data } = await api.get(`${BASE_URL}${query}`)
    return data
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
