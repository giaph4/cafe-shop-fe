import api from './axios'

// API 4: Get All Categories
export const getCategories = async () => {
  const { data } = await api.get('/categories')
  return data
}

// API 3: Create Category
// (data: { name: "string", description: "string" })
export const createCategory = async (categoryData) => {
  const { data } = await api.post('/categories', categoryData)
  return data
}

// API 5: Update Category
// (data: { id: number, data: { name: "string", description: "string" } })
export const updateCategory = async ({ id, data }) => {
  const { data: responseData } = await api.put(`/categories/${id}`, data)
  return responseData
}

export const deleteCategory = async (id) => {
  await api.delete(`/categories/${id}`)
  return id
}