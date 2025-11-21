import api from './axios'

// Danh sách sản phẩm (phân trang, tìm kiếm, sắp xếp, theo danh mục)
export const getProducts = async ({ page = 0, size = 12, sort = 'createdAt,desc', keyword = '', categoryId = null, status = null }) => {
    const params = { page, size, sort }
    if (keyword) params.keyword = keyword
    if (categoryId) params.categoryId = categoryId
    if (status) params.status = status
    const { data } = await api.get('/products', { params })
    return data
}

// Chi tiết sản phẩm
export const getProductById = async (id) => {
    const { data } = await api.get(`/products/${id}`)
    return data
}

// Cập nhật thông tin sản phẩm (không bao gồm ảnh)
export const updateProduct = async ({ id, data }) => {
    const { data: responseData } = await api.put(`/products/${id}`, data)
    return responseData
}

// Tạo sản phẩm mới
export const createProduct = async (data) => {
    const { data: responseData } = await api.post('/products', data)
    return responseData
}

// Xoá sản phẩm
export const deleteProduct = async (id) => {
    await api.delete(`/products/${id}`)
    return id
}

// Upload ảnh sản phẩm (multipart/form-data)
export const uploadProductImage = async (id, file) => {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post(`/products/${id}/image`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
}

// Lấy công thức sản phẩm
export const getProductRecipe = async (productId) => {
    const { data } = await api.get(`/products/${productId}/recipe`)
    return data
}

// Cập nhật công thức sản phẩm
export const updateProductRecipe = async (productId, recipeItems) => {
    // recipeItems: [{ ingredientId, quantity, unit }]
    const { data } = await api.put(`/products/${productId}/recipe`, { items: recipeItems })
    return data
}


