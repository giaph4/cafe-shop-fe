import api from '../axios'

const BASE_URL = '/api/chat'

/**
 * Gửi tin nhắn văn bản
 * @param {number} conversationId - ID hội thoại
 * @param {string} content - Nội dung tin nhắn
 * @returns {Promise<Object>} MessageDTO
 */
export const sendTextMessage = async (conversationId, content) => {
    const { data } = await api.post(`${BASE_URL}/conversations/${conversationId}/messages/text`, null, {
        params: { content }
    })
    return data
}

/**
 * Gửi tin nhắn emoji
 * @param {number} conversationId - ID hội thoại
 * @param {string} code - Mã emoji (ví dụ: "😀", "👍")
 * @returns {Promise<Object>} MessageDTO
 */
export const sendEmojiMessage = async (conversationId, code) => {
    const { data } = await api.post(`${BASE_URL}/conversations/${conversationId}/messages/emoji`, null, {
        params: { code }
    })
    return data
}

/**
 * Gửi tin nhắn đính kèm file
 * @param {number} conversationId - ID hội thoại
 * @param {string} messageText - Nội dung tin nhắn (optional)
 * @param {File[]} files - Danh sách file cần đính kèm
 * @returns {Promise<Object>} MessageDTO
 */
export const sendAttachmentMessage = async (conversationId, messageText, files) => {
    const formData = new FormData()
    if (messageText) {
        formData.append('messageText', messageText)
    }
    files.forEach(file => {
        formData.append('files', file)
    })

    const { data } = await api.post(
        `${BASE_URL}/conversations/${conversationId}/messages/attachments`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }
    )
    return data
}

/**
 * Thu hồi tin nhắn
 * @param {number} messageId - ID tin nhắn
 * @returns {Promise<Object>} MessageDTO
 */
export const recallMessage = async (messageId) => {
    const { data } = await api.post(`${BASE_URL}/messages/${messageId}/recall`)
    return data
}

/**
 * Xóa tin nhắn cho người dùng hiện tại
 * @param {number} messageId - ID tin nhắn
 * @returns {Promise<void>}
 */
export const deleteMessage = async (messageId) => {
    await api.delete(`${BASE_URL}/messages/${messageId}`)
}

/**
 * Đánh dấu tin nhắn đã đọc
 * @param {number} conversationId - ID hội thoại
 * @param {number} messageId - ID tin nhắn
 * @returns {Promise<void>}
 */
export const markMessageSeen = async (conversationId, messageId) => {
    await api.post(`${BASE_URL}/conversations/${conversationId}/messages/${messageId}/seen`)
}

