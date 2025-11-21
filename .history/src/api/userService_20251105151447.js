import api from './axios'

/**
 * Lấy danh sách người dùng (phân trang, sắp xếp)
 * @param {number} page - Số trang (bắt đầu từ 0)
 * @param {number} size - Kích thước trang
 * @param {string} sort - Chuỗi sắp xếp (vd: 'username,asc')
 */
export const getUsers = async (page, size, sort) => {
    const params = {
        page: page || 0,
        size: size || 10,
        sort: sort || 'username,asc',
    }
    const { data } = await api.get('/users', { params })
    return data
}

/**
 * Cập nhật thông tin người dùng
 * @param {object} param0 - { id, data }
 */
export const updateUser = async ({ id, data }) => {
    const { data: responseData } = await api.put(`/users/${id}`, data)
    return responseData
}