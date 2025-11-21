import api from './axios'

/**
 * Lấy danh sách tất cả các quyền. Thử /users/roles, fallback sang /roles nếu 404.
 */
export const getAllRoles = async () => {
    try {
        const { data } = await api.get('/users/roles')
        return data
    } catch (err) {
        if (err.response?.status === 404) {
            const { data } = await api.get('/roles')
            return data
        }
        throw err
    }
}