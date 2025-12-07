import api from './axios'
import { buildApiError } from '@/utils/errorHandler'
import { cleanParams } from './utils'

const BASE_URL = '/api/v1/expenses'

/**
 * 13.1 Tạo khoản chi mới
 */
export const createExpense = async (expenseData) => {
    const { data } = await api.post(BASE_URL, expenseData)
    return data
}

/**
 * 13.2 Lấy danh sách chi phí (có lọc)
 */
export const getExpenses = async (filters = {}) => {
    const params = cleanParams({
        page: filters.page || 0,
        size: filters.size || 10,
        startDate: filters.startDate,
        endDate: filters.endDate
    })

    const { data } = await api.get(BASE_URL, { params })
    return data
}

/**
 * 13.3 Lấy chi tiết khoản chi
 */
export const getExpenseById = async (id) => {
    const { data } = await api.get(`${BASE_URL}/${id}`)
    return data
}

/**
 * 13.4 Cập nhật khoản chi
 */
export const updateExpense = async ({ id, data: expenseData }) => {
    const { data } = await api.put(`${BASE_URL}/${id}`, expenseData)
    return data
}

/**
 * 13.5 Xóa khoản chi
 */
export const deleteExpense = async (id) => {
    await api.delete(`${BASE_URL}/${id}`)
}
