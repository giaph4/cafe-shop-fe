import api from './axios'

export const getCategories = async () => {
  const { data } = await api.get('/categories')
  return data
}
// (data: { name: "string", description: "string" })
export const createCategory = async (categoryData) => {
  const { data } = await api.post('/categories', categoryData)
  return data
}

// (data: { id: number, data: { name: "string", description: "string" } })
export const updateCategory = async ({ id, data }) => {
  const { data: responseData } = await api.put(`/categories/${id}`, data)
  return responseData
}

export const deleteCategory = async (id) => {
  await api.delete(`/categories/${id}`)
  return id
}