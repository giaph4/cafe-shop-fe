import api from './axios'

/**
 * Lấy danh sách tất cả các quyền (VD: ADMIN, STAFF)
 */
export const getAllRoles = async () => {
    const { data } = await api.get('/users/roles') // <-- Sửa đường dẫn ở đây
    return data
}