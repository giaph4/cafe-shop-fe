import api from './axios'
import { cleanParams } from './utils'
import { buildApiError } from './utils/errorHandler'

const BASE_URL = '/api/v1/products'

/**
 * 4.1 Tạo sản phẩm mới (không có ảnh)
 */
export const createProduct = async (productData) => {
    const {data} = await api.post(BASE_URL, productData)
    return data
}

/**
 * 4.2 Tạo sản phẩm với ảnh (Multipart)
 */
export const createProductWithImage = async (productData, image) => {
    const formData = new FormData()
    formData.append('product', new Blob([JSON.stringify(productData)], {type: 'application/json'}))
    if (image) {
        formData.append('image', image)
    }

    const {data} = await api.post(BASE_URL, formData, {
        headers: {'Content-Type': 'multipart/form-data'},
    })
    return data
}

/**
 * 4.3 Lấy danh sách sản phẩm (có lọc)
 */
export const getProducts = async (filters = {}) => {
    const params = cleanParams(filters)
    const {data} = await api.get(BASE_URL, {params})
    return data
}

/**
 * 4.4 Lấy chi tiết sản phẩm
 */
export const getProductById = async (id) => {
    const {data} = await api.get(`${BASE_URL}/${id}`)
    return data
}

/**
 * 4.5 Cập nhật sản phẩm
 */
export const updateProduct = async (id, productData) => {
    const {data} = await api.put(`${BASE_URL}/${id}`, productData)
    return data
}

/**
 * 4.6 Cập nhật sản phẩm với ảnh (Multipart)
 */
export const updateProductWithImage = async (id, productData, image) => {
    const formData = new FormData()
    formData.append('product', new Blob([JSON.stringify(productData)], {type: 'application/json'}))
    if (image) {
        formData.append('image', image)
    }

    const {data} = await api.put(`${BASE_URL}/${id}`, formData, {
        headers: {'Content-Type': 'multipart/form-data'},
    })
    return data
}

/**
 * 4.7 Upload ảnh cho sản phẩm
 */
export const uploadProductImage = async ({id, image}) => {
    const formData = new FormData()
    formData.append('image', image)
    const {data} = await api.post(`${BASE_URL}/${id}/image`, formData, {
        headers: {'Content-Type': 'multipart/form-data'},
    })
    return data
}

/**
 * 4.8 Xóa ảnh sản phẩm
 */
export const deleteProductImage = async (id) => {
    const {data} = await api.delete(`${BASE_URL}/${id}/image`)
    return data
}

/**
 * 4.9 Bật/tắt trạng thái sản phẩm
 */
export const toggleProductAvailability = async (id) => {
    const {data} = await api.patch(`${BASE_URL}/${id}/toggle-availability`)
    return data
}

/**
 * 4.10 Xóa sản phẩm
 */
export const deleteProduct = async (id) => {
    await api.delete(`${BASE_URL}/${id}`)
}

/**
 * 5.1 Lấy công thức sản phẩm
 */
export const getProductRecipe = async (productId) => {
    const {data} = await api.get(`${BASE_URL}/${productId}/recipe`)
    return data
}

/**
 * 5.2 Cập nhật công thức sản phẩm
 */
export const updateProductRecipe = async (productId, recipeDTO) => {
    const {data} = await api.put(`${BASE_URL}/${productId}/recipe`, recipeDTO)
    return data
}
