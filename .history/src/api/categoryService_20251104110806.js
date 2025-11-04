import api from './axios'

// API 4: Get All Categories
export const getCategories = async () => {
    const { data } = await api.get('/categories')
    return data
}

export const createCategory = async (categoryData) => {
    const { data } = await api.post('/categories', categoryData)
    return data
}

export const updateCategory = async ({ id, data }) => {
    const { data: responseData } = await api.put(`/categories/${id}`, data)
    return responseData
}

export const deleteCategory = async (id) => {
    await api.delete(`/categories/${id}`)
    return id
}