// src/api/expenseService.js

import api from './axios' // Import instance axios đã cấu hình

/**
 * Lấy danh sách chi phí (phân trang, lọc)
 * @param {object} params - { page, size, sort, startDate, endDate }
 * @returns {Promise<Page<ExpenseDTO>>}
 */
export const getAllExpenses = async (params) => {
  try {
    const response = await api.get('/expenses', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching expenses:', error.response?.data || error.message)
    throw error.response?.data || error
  }
}

/**
 * Lấy chi tiết một khoản chi
 * @param {number} id
 * @returns {Promise<ExpenseDTO>}
 */
export const getExpenseById = async (id) => {
  try {
    const response = await api.get(`/expenses/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching expense ${id}:`, error.response?.data || error.message)
    throw error.response?.data || error
  }
}

/**
 * Tạo một khoản chi mới
 * @param {object} expenseDTO - Dữ liệu chi phí mới
 * @returns {Promise<ExpenseDTO>}
 */
export const createExpense = async (expenseDTO) => {
  try {
    const response = await api.post('/expenses', expenseDTO)
    return response.data
  } catch (error) {
    console.error('Error creating expense:', error.response?.data || error.message)
    throw error.response?.data || error
  }
}

/**
 * Cập nhật một khoản chi
 * @param {object} { id, expenseDTO }
 * @returns {Promise<ExpenseDTO>}
 */
export const updateExpense = async ({ id, expenseDTO }) => {
  try {
    const response = await api.put(`/expenses/${id}`, expenseDTO)
    return response.data
  } catch (error) {
    console.error(`Error updating expense ${id}:`, error.response?.data || error.message)
    throw error.response?.data || error
  }
}

/**
 * Xoá một khoản chi
 * @param {number} id
 * @returns {Promise<void>}
 */
export const deleteExpense = async (id) => {
  try {
    const response = await api.delete(`/expenses/${id}`)
    return response.data // Thường là noContent()
  } catch (error) {}
    console.error(`Error deleting expense ${id}:`, error.response?.data || error.message)
    throw error.response?.data || error
  }
}