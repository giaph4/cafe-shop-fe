import api from '../axios'

const BASE_URL = '/api/chat/conversations'

/**
 * Lấy danh sách hội thoại của người dùng (phân trang)
 * @param {number} page - Trang hiện tại, mặc định 0
 * @param {number} size - Số lượng hội thoại trên mỗi trang, mặc định 20, giới hạn 1-100
 * @returns {Promise<Object>} Page<ConversationSummaryDTO>
 */
export const listConversations = async (page = 0, size = 20) => {
    const { data } = await api.get(BASE_URL, {
        params: { page, size }
    })
    return data
}

/**
 * Lấy thông tin chi tiết hội thoại
 * @param {number} conversationId - ID hội thoại
 * @returns {Promise<Object>} ConversationSummaryDTO
 */
export const getConversation = async (conversationId) => {
    const { data } = await api.get(`${BASE_URL}/${conversationId}`)
    return data
}

/**
 * Tạo hội thoại trực tiếp (1-1)
 * @param {number} targetUserId - ID người dùng đích
 * @returns {Promise<Object>} ConversationSummaryDTO
 */
export const createDirectConversation = async (targetUserId) => {
    const { data } = await api.post(`${BASE_URL}/direct/${targetUserId}`)
    return data
}

/**
 * Tạo hội thoại nhóm
 * @param {string} title - Tiêu đề nhóm
 * @param {number[]} memberIds - Danh sách ID thành viên
 * @returns {Promise<Object>} ConversationSummaryDTO
 */
export const createGroupConversation = async (title, memberIds) => {
    const { data } = await api.post(`${BASE_URL}/group`, {
        title,
        memberIds
    })
    return data
}

/**
 * Lấy danh sách thành viên của hội thoại
 * @param {number} conversationId - ID hội thoại
 * @returns {Promise<Array>} List<ConversationMemberDTO>
 */
export const listMembers = async (conversationId) => {
    const { data } = await api.get(`${BASE_URL}/${conversationId}/members`)
    return data
}

/**
 * Thêm thành viên vào hội thoại
 * @param {number} conversationId - ID hội thoại
 * @param {number[]} memberIds - Danh sách ID thành viên cần thêm (tối đa 100)
 * @returns {Promise<void>}
 */
export const addMembers = async (conversationId, memberIds) => {
    await api.post(`${BASE_URL}/${conversationId}/members`, memberIds)
}

/**
 * Xóa thành viên khỏi hội thoại
 * @param {number} conversationId - ID hội thoại
 * @param {number} memberId - ID thành viên cần xóa
 * @returns {Promise<void>}
 */
export const removeMember = async (conversationId, memberId) => {
    await api.delete(`${BASE_URL}/${conversationId}/members/${memberId}`)
}

/**
 * Cập nhật vai trò thành viên
 * @param {number} conversationId - ID hội thoại
 * @param {number} memberId - ID thành viên
 * @param {string} role - Vai trò mới (ADMIN, MEMBER)
 * @returns {Promise<void>}
 */
export const updateMemberRole = async (conversationId, memberId, role) => {
    await api.patch(`${BASE_URL}/${conversationId}/members/${memberId}/role`, null, {
        params: { role }
    })
}

/**
 * Pin/Unpin hội thoại
 * @param {number} conversationId - ID hội thoại
 * @param {boolean} pinned - true để pin, false để unpin
 * @returns {Promise<void>}
 */
export const pinConversation = async (conversationId, pinned) => {
    await api.patch(`${BASE_URL}/${conversationId}/pin`, null, {
        params: { pinned }
    })
}

/**
 * Lấy danh sách tin nhắn của hội thoại (phân trang)
 * @param {number} conversationId - ID hội thoại
 * @param {number} page - Trang hiện tại, mặc định 0
 * @param {number} size - Số lượng tin nhắn trên mỗi trang, mặc định 20, giới hạn 1-100
 * @param {number} beforeMessageId - ID tin nhắn để lấy tin nhắn trước đó (optional)
 * @returns {Promise<Object>} Page<MessageDTO>
 */
export const listMessages = async (conversationId, page = 0, size = 20, beforeMessageId = null) => {
    const params = { page, size }
    if (beforeMessageId) {
        params.beforeMessageId = beforeMessageId
    }
    const { data } = await api.get(`${BASE_URL}/${conversationId}/messages`, { params })
    return data
}

