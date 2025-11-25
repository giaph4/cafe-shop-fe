import api from './axios'
import { cleanParams } from './utils'
import { buildApiError } from './utils/errorHandler'

const BASE_URL = '/api/v1/users'

export const getAllRoles = async () => {
    const {data} = await api.get(`${BASE_URL}/roles`)
    return data
}

export const getUsers = async (params = {}) => {
    const query = cleanParams({page: 0, size: 15, sort: 'username,asc', ...params})
    const {data} = await api.get(BASE_URL, {params: query})
    return data
}

export const getUserById = async (id) => {
    const {data} = await api.get(`${BASE_URL}/${id}`)
    return data
}

/**
 * Chuẩn hóa payload để tạo user mới
 * @param {Object} payload - Dữ liệu user cần tạo
 * @param {string} payload.username - Tên đăng nhập (bắt buộc)
 * @param {string} payload.password - Mật khẩu (bắt buộc)
 * @param {string} payload.fullName - Họ và tên (bắt buộc)
 * @param {string} payload.email - Email (bắt buộc)
 * @param {string} payload.phone - Số điện thoại (bắt buộc)
 * @param {number[]} payload.roleIds - Danh sách ID quyền (bắt buộc)
 * @param {string} [payload.address] - Địa chỉ (tùy chọn)
 * @param {string} [payload.avatarUrl] - URL avatar (tùy chọn)
 * @returns {Object} Payload đã được chuẩn hóa
 * @throws {Error} Nếu thiếu các trường bắt buộc
 */
export const buildUserCreatePayload = (payload = {}) => {
    const safeTrim = (value) => (typeof value === 'string' ? value.trim() : value)

    // Validate các trường bắt buộc
    if (!payload.username || typeof payload.username !== 'string' || !safeTrim(payload.username)) {
        throw new Error('Username is required')
    }
    if (!payload.password || typeof payload.password !== 'string' || !payload.password.trim()) {
        throw new Error('Password is required')
    }
    if (!payload.fullName || typeof payload.fullName !== 'string' || !safeTrim(payload.fullName)) {
        throw new Error('Full name is required')
    }
    if (!payload.email || typeof payload.email !== 'string' || !safeTrim(payload.email)) {
        throw new Error('Email is required')
    }
    if (!payload.phone || typeof payload.phone !== 'string' || !safeTrim(payload.phone)) {
        throw new Error('Phone is required')
    }
    if (!Array.isArray(payload.roleIds) || payload.roleIds.length === 0) {
        throw new Error('At least one role is required')
    }

    const body = {
        username: safeTrim(payload.username),
        password: payload.password, // Không trim password để giữ nguyên
        fullName: safeTrim(payload.fullName),
        email: safeTrim(payload.email),
        phone: safeTrim(payload.phone),
        roleIds: payload.roleIds.filter((id) => Number.isInteger(id) && id > 0), // Chỉ lấy số nguyên dương
        address: safeTrim(payload.address) || null,
        avatarUrl: safeTrim(payload.avatarUrl) || null
    }

    return body
}

/**
 * Tạo user mới (admin only)
 * Gọi API POST /api/v1/users để tạo user với đầy đủ quyền kiểm soát
 * @param {Object} userData - Dữ liệu user cần tạo
 * @param {string} userData.username - Tên đăng nhập (bắt buộc)
 * @param {string} userData.password - Mật khẩu (bắt buộc)
 * @param {string} userData.fullName - Họ và tên (bắt buộc)
 * @param {string} userData.email - Email (bắt buộc)
 * @param {string} userData.phone - Số điện thoại (bắt buộc)
 * @param {number[]} userData.roleIds - Danh sách ID quyền (bắt buộc)
 * @param {string} [userData.address] - Địa chỉ (tùy chọn)
 * @param {string} [userData.avatarUrl] - URL avatar (tùy chọn)
 * @returns {Promise<Object>} User đã được tạo
 * @throws {Error} Nếu validation thất bại hoặc API call thất bại
 */
export const createUser = async (userData) => {
    // Chuẩn hóa và validate payload trước khi gửi
    // buildUserCreatePayload sẽ throw error nếu thiếu trường bắt buộc
    const body = buildUserCreatePayload(userData)
    
    // Gọi API tạo user
    // Endpoint này cho phép admin tạo user với đầy đủ quyền kiểm soát (bao gồm roleIds)
    const {data} = await api.post(BASE_URL, body)
    return data
}

export const buildUserUpdatePayload = (payload = {}) => {
    const safeTrim = (value) => {
        if (value === null || value === undefined) return null
        if (typeof value === 'string') {
            const trimmed = value.trim()
            return trimmed === '' ? null : trimmed
        }
        return value
    }

    const body = {
        fullName: safeTrim(payload.fullName) || '',
        phone: safeTrim(payload.phone) || '',
        email: safeTrim(payload.email),
        status: payload.status || 'ACTIVE',
        roleIds: Array.isArray(payload.roleIds) ? payload.roleIds.filter(id => Number.isInteger(id) && id > 0) : [],
        avatarUrl: safeTrim(payload.avatarUrl),
        address: safeTrim(payload.address),
        removeAvatar: Boolean(payload.removeAvatar)
    }

    // Nếu removeAvatar là true, set avatarUrl thành null
    if (body.removeAvatar) {
        body.avatarUrl = null
    }

    return body
}

export const updateUser = async (idOrPayload, maybePayload) => {
    const {id, payload} = (() => {
        if (typeof idOrPayload === 'object' && idOrPayload !== null && 'id' in idOrPayload) {
            return {id: idOrPayload.id, payload: idOrPayload.data ?? idOrPayload.payload ?? {}}
        }
        return {id: idOrPayload, payload: maybePayload ?? {}}
    })()

    const body = buildUserUpdatePayload(payload)
    const {data} = await api.put(`${BASE_URL}/${id}`, body)
    return data
}

export const changePassword = async (passwordData) => {
    const {data} = await api.post(`${BASE_URL}/change-password`, passwordData)
    return data
}

/**
 * Admin reset password cho user (admin only)
 * @param {string|number} userId - ID của user cần reset password
 * @param {string} newPassword - Mật khẩu mới
 * @returns {Promise<Object>} Response từ server
 * @throws {Error} Nếu userId hoặc newPassword không hợp lệ
 */
export const adminResetPassword = async (userId, newPassword) => {
    if (!userId) {
        throw new Error('User ID is required')
    }
    if (!newPassword || typeof newPassword !== 'string' || !newPassword.trim()) {
        throw new Error('New password is required')
    }
    
    // Gọi API reset password
    const {data} = await api.post(`${BASE_URL}/${userId}/reset-password`, {
        newPassword: newPassword.trim()
    })
    return data
}

/**
 * Lấy activity logs (audit logs) của user
 * @param {string|number} userId - ID của user cần lấy logs
 * @param {Object} [params] - Tham số tùy chọn
 * @param {number} [params.page] - Số trang (mặc định 0)
 * @param {number} [params.size] - Kích thước trang (mặc định 20)
 * @param {string} [params.action] - Lọc theo action
 * @param {string} [params.startDate] - Ngày bắt đầu (ISO format)
 * @param {string} [params.endDate] - Ngày kết thúc (ISO format)
 * @returns {Promise<Object>} Page<ActivityLog> hoặc Array<ActivityLog>
 */
export const getUserActivityLogs = async (userId, params = {}) => {
    if (!userId) {
        throw new Error('User ID is required')
    }
    
    // Chuẩn hóa params
    const queryParams = cleanParams({
        page: params.page || 0,
        size: params.size || 20,
        action: params.action || null,
        startDate: params.startDate || null,
        endDate: params.endDate || null
    })
    
    const {data} = await api.get(`${BASE_URL}/${userId}/activity-logs`, {
        params: queryParams
    })
    return data
}
