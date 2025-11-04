import api from './axios'
export const getExpenses = async (filters) => {
    const params = {
        page: filters.page || 0,
        size: filters.size || 10,
        sort: 'expenseDate,desc', 
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
    }

    Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === '') {
            delete params[key]
        }
    })

    const { data } = await api.get('/expenses', { params })
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

/**
 * API 56: Xoá chi phí
 */
export const deleteExpense = async (id) => {
    await api.delete(`/expenses/${id}`)
    return id
}