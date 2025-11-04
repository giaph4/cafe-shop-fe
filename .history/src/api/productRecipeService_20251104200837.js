import api from './axios'

/**
 * Lấy công thức (danh sách NVL) của một sản phẩm.
 * [cite_start]API: GET /api/v1/products/{productId}/recipe [cite: 1039-1041]
 */
export const getRecipeByProductId = async (productId) => {
    try {
        const { data } = await api.get(`/products/${productId}/recipe`);
        return data; // Trả về mảng ProductIngredientDTO
    } catch (error) {
        console.error(`Failed to fetch recipe for product ${productId}:`, error);
        throw new Error(error.response?.data?.message || "Lỗi khi tải công thức");
    }
}


export const setRecipeForProduct = async (productId, ingredients) => {
    try {
        // Request body của BE yêu cầu một object có key là "ingredients"
        const requestBody = { ingredients: ingredients };
        const { data } = await api.put(`/products/${productId}/recipe`, requestBody);
        return data; // Trả về mảng ProductIngredientDTO đã cập nhật
    } catch (error) {
        console.error(`Failed to set recipe for product ${productId}:`, error);
        throw new Error(error.response?.data?.message || "Lỗi khi cập nhật công thức");
    }
}