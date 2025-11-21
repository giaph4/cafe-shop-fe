import api from './axios'

/**
 * Lấy danh sách chi phí (phân trang, lọc theo ngày)
 * @param {object} filters - { page, size, sort, startDate, endDate }
 */
export const getExpenses = async (filters) => {
    const params = {
        page: filters.page || 0,
        size: filters.size || 10,
        sort: filters.sort || 'expenseDate,desc',
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
    }

    // Xóa các param rỗng hoặc null
    Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === '') {
            delete params[key]
        }
    })

    const { data } = await api.get('/expenses', { params })
    return data
}

/**
 * Lấy chi tiết một khoản chi
 */
export const getExpenseById = async (id) => {
    const { data } = await api.get(`/expenses/${id}`)
    return data
}

/**
 * Tạo (ghi nhận) một khoản chi mới
 */
export const createExpense = async (expenseData) => {
    const { data } = await api.post('/expenses', expenseData)
    return data
}

/**
 * Cập nhật thông tin một khoản chi
 */
export const updateExpense = async ({ id, data }) => {
    const { data: responseData } = await api.put(`/expenses/${id}`, data)
    return responseData
}

/**
 * Xoá một khoản chi
 */
export const deleteExpense = async (id) => {
    await api.delete(`/expenses/${id}`)
    return id
}