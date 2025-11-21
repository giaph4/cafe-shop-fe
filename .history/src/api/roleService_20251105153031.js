import api from './axios'

/**
 * Lấy danh sách tất cả các quyền (VD: ADMIN, STAFF)
 * Giả định endpoint là /roles
 */
export const getAllRoles = async () => {
    const { data } = await api.get('/roles')
    return data
}