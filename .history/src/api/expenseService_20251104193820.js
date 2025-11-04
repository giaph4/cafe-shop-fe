import api from './axios'

/**
 * API 53: Lấy danh sách Chi phí (Phân trang và Lọc theo ngày)
 * @param {object} filters - { page, size, startDate, endDate }
 */
export const getExpenses = async (filters) => {
  const params = {
    page: filters.page || 0,
    size: filters.size || 10,
    sort: 'expenseDate,desc', // Sắp xếp theo ngày chi mới nhất
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
 * API 52: Tạo chi phí mới
 */
export const createExpense = async (expenseData) => {
  const { data } = await api.post('/expenses', expenseData)
  return data
}

/**
 * API 55: Cập nhật chi phí
 */
export const updateExpense = async ({ id, data }) => {
  const { data: responseData } = await api.put(`/expenses/${id}`, data)
  return responseData
}

/**
 * API 56: Xoá chi phí
 */
export const deleteExpense = async (id) => {
  await api.delete(`/expenses/${id}`)
  return id
}