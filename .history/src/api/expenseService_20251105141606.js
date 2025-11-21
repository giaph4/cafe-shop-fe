import api from './axios'

export const getExpenses = async (page = 0, size = 10, name = '') => {
    const params = {
        page,
        size,
        sort,
    }

    const { data } = await api.get('/expenses', { params })
    return data
}

export const getExpenseById = async (id) => {
    const { data } = await api.get(`/expenses/${id}`)
    return data
}

export const createExpense = async (expenseData) => {
    const { data } = await api.post('/expenses', expenseData)
    return data
}

export const updateExpense = async ({ id, data }) => {
    const { data: responseData } = await api.put(`/expenses/${id}`, data)
    return responseData
}

export const deleteExpense = async (id) => {
    await api.delete(`/expenses/${id}`)
    return id
}