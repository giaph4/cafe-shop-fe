import api from './axios'

/**
 * Lấy danh sách nhân viên (phân trang, sắp xếp)
 * @param {number} page - Số trang (0-indexed)
 * @param {number} size - Kích thước trang
 * @param {string} sort - Chuỗi sắp xếp (VD: "username,asc")
 */
export const getUsers = async (page, size, sort) => {
    const params = {
        page: page || 0,
        size: size || 15,
        sort: sort || 'username,asc',
    }

    const { data } = await api.get('/users', { params })
    return data
}

/**
 * Cập nhật thông tin nhân viên (bao gồm trạng thái và quyền)
 * @param {number} id - ID của nhân viên
 * @param {object} userData - Dữ liệu cập nhật (UserUpdateRequestDTO)
 */
export const updateUser = async ({ id, data }) => {
    const { data: responseData } = await api.put(`/users/${id}`, data)
    return responseData
}

export const getAllRoles = async () => {
    const { data } = await api.get('users/roles')
    return data
}