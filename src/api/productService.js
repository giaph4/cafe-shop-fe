import api from './axios'
import { cleanParams } from './helpers'
import { createFormData, createFileFormData, getMultipartHeaders } from './helpers'

const BASE_URL = '/api/v1/products'

/**
 * Tạo sản phẩm mới (không có ảnh)
 */
export const createProduct = async (productData) => {
    const { data } = await api.post(BASE_URL, productData)
    return data
}

/**
 * Tạo sản phẩm với ảnh (Multipart)
 */
export const createProductWithImage = async (productData, image) => {
    const formData = createFormData(productData, 'product', image, 'image')
    const { data } = await api.post(BASE_URL, formData, {
        headers: getMultipartHeaders()
    })
    return data
}

/**
 * Lấy danh sách sản phẩm (có lọc)
 */
export const getProducts = async (filters = {}) => {
    const params = cleanParams(filters)
    const { data } = await api.get(BASE_URL, { params })
    return data
}

/**
 * Lấy chi tiết sản phẩm
 */
export const getProductById = async (id) => {
    const { data } = await api.get(`${BASE_URL}/${id}`)
    return data
}

/**
 * Cập nhật sản phẩm
 */
export const updateProduct = async (id, productData) => {
    const { data } = await api.put(`${BASE_URL}/${id}`, productData)
    return data
}

/**
 * Cập nhật sản phẩm với ảnh (Multipart)
 */
export const updateProductWithImage = async (id, productData, image) => {
    const formData = createFormData(productData, 'product', image, 'image')
    const { data } = await api.put(`${BASE_URL}/${id}`, formData, {
        headers: getMultipartHeaders()
    })
    return data
}

/**
 * Upload ảnh cho sản phẩm
 */
export const uploadProductImage = async ({ id, image }) => {
    const formData = createFileFormData(image, 'image')
    const { data } = await api.post(`${BASE_URL}/${id}/image`, formData, {
        headers: getMultipartHeaders()
    })
    return data
}

/**
 * Xóa ảnh sản phẩm
 */
export const deleteProductImage = async (id) => {
    const { data } = await api.delete(`${BASE_URL}/${id}/image`)
    return data
}

/**
 * Bật/tắt trạng thái sản phẩm
 */
export const toggleProductAvailability = async (id) => {
    const { data } = await api.patch(`${BASE_URL}/${id}/toggle-availability`)
    return data
}

/**
 * Xóa sản phẩm
 */
export const deleteProduct = async (id) => {
    await api.delete(`${BASE_URL}/${id}`)
}

/**
 * Lấy công thức sản phẩm
 */
export const getProductRecipe = async (productId) => {
    const { data } = await api.get(`${BASE_URL}/${productId}/recipe`)
    return data
}

/**
 * Cập nhật công thức sản phẩm
 */
export const updateProductRecipe = async (productId, recipeDTO) => {
    const { data } = await api.put(`${BASE_URL}/${productId}/recipe`, recipeDTO)
    return data
}
