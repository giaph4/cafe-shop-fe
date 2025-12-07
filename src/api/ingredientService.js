import api from './axios'
import { buildApiError } from '@/utils/errorHandler'
import logger from '@/utils/logger'

const BASE_URL = '/api/v1/ingredients'

const normalizeIngredientPayload = (payload = {}) => {
    const reorderLevel = payload.reorderLevel

    return {
        name: payload.name?.trim(),
        unit: payload.unit?.trim(),
        reorderLevel: reorderLevel === '' || reorderLevel === null || typeof reorderLevel === 'undefined'
            ? null
            : Number(reorderLevel)
    }
}

/**
 * 10.1 Lấy danh sách nguyên liệu (phân trang)
 */
export const getIngredients = async ({ name, page, size }) => {
    const params = {
        page: typeof page === 'number' ? page : 0,
        size: typeof size === 'number' ? size : 15,
    }

    const trimmedName = name?.trim()
    if (trimmedName) {
        params.name = trimmedName
    }

    const { data } = await api.get(BASE_URL, { params })
    return data
}

/**
 * 10.x Lấy toàn bộ nguyên liệu (dùng cho dropdown)
 */
export const getAllIngredients = async () => {
    const { data } = await api.get(BASE_URL, {
        params: {
            page: 0,
            size: 1000,
        }
    })

    if (data?.content) {
        return data.content
    }

    return Array.isArray(data) ? data : []
}

/**
 * 10.2 Lấy chi tiết nguyên liệu
 * 
 * Hỗ trợ fallback cho các endpoint không chuẩn từ backend:
 * - Primary: GET /api/v1/ingredients/{id}
 * - Fallback 1: GET /api/v1/ingredients/id/{id}
 * - Fallback 2: GET /api/v1/ingredients/id?id={id}
 * 
 * @param {string|number} id - ID của nguyên liệu
 * @returns {Promise<Object>} Thông tin nguyên liệu
 * @throws {Error} Nếu không tìm thấy hoặc có lỗi khác
 */
export const getIngredientById = async (id) => {
    // Validate input
    if (!id && id !== 0) {
        throw new Error('Ingredient ID is required')
    }

    const normalizedId = String(id).trim()
    if (!normalizedId) {
        throw new Error('Ingredient ID cannot be empty')
    }

    // Primary endpoint: chuẩn REST API
    try {
        const { data } = await api.get(`${BASE_URL}/${normalizedId}`)
        if (data && typeof data === 'object') {
            return data
        }
        throw new Error('Invalid response format from primary endpoint')
    } catch (primaryError) {
        const status = primaryError.response?.status
        
        // Chỉ fallback khi 404 (not found) hoặc 500 (server error)
        // Không fallback cho các lỗi khác (401, 403, 400, etc.)
        if (status !== 404 && status !== 500) {
            throw primaryError
        }

        // Fallback endpoints: thử các endpoint legacy
        const fallbackEndpoints = [
            {
                name: 'id-path',
                request: () => api.get(`${BASE_URL}/id/${normalizedId}`)
            },
            {
                name: 'id-query',
                request: () => api.get(`${BASE_URL}/id`, { params: { id: normalizedId } })
            }
        ]

        let lastError = primaryError

        for (const endpoint of fallbackEndpoints) {
            try {
                const { data } = await endpoint.request()
                if (data && typeof data === 'object') {
                    // Log fallback success trong development
                    if (import.meta.env.DEV) {
                        logger.warn(`[IngredientService] Used fallback endpoint: ${endpoint.name} for ID: ${normalizedId}`)
                    }
                    return data
                }
                throw new Error(`Invalid response format from fallback endpoint: ${endpoint.name}`)
            } catch (fallbackError) {
                const fallbackStatus = fallbackError.response?.status
                
                // Nếu fallback trả về 404, tiếp tục thử endpoint tiếp theo
                // Nếu là lỗi khác (500, 400, etc.), lưu lại nhưng vẫn thử endpoint tiếp theo
                if (fallbackStatus !== 404) {
                    lastError = fallbackError
                }
                
                // Nếu không phải 404, không throw ngay mà tiếp tục thử endpoint cuối cùng
            }
        }

        // Tất cả fallback đều thất bại, throw lỗi cuối cùng
        throw lastError
    }
}

/**
 * 10.3 Tạo nguyên liệu mới
 */
export const createIngredient = async (ingredientData) => {
    const payload = normalizeIngredientPayload(ingredientData)
    const { data } = await api.post(BASE_URL, payload)
    return data
}

/**
 * 10.4 Cập nhật thông tin nguyên liệu
 */
export const updateIngredient = async ({ id, data: ingredientData }) => {
    const payload = normalizeIngredientPayload(ingredientData)

    const { data } = await api.put(`${BASE_URL}/${id}`, payload)
    return data
}

/**
 * 10.5 Điều chỉnh tồn kho
 */
export const adjustInventory = async (adjustmentData) => {
    const ingredientId = Number(adjustmentData.ingredientId)
    const rawQuantity = adjustmentData.newQuantityOnHand

    if (!Number.isFinite(ingredientId) || ingredientId <= 0) {
        throw new Error('Thiếu thông tin nguyên liệu hợp lệ để điều chỉnh tồn kho.')
    }

    if (rawQuantity === '' || rawQuantity === null || typeof rawQuantity === 'undefined') {
        throw new Error('Số lượng tồn kho mới phải được cung cấp.')
    }

    const parsedQuantity = Number(rawQuantity)
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
        throw new Error('Số lượng tồn kho mới phải là số không âm.')
    }

    const payload = {
        ingredientId,
        newQuantityOnHand: rawQuantity.toString(),
        reason: adjustmentData.reason?.trim() || null,
    }

    const { data } = await api.patch(`${BASE_URL}/adjust-inventory`, payload)
    return data
}

/**
 * 10.6 Xóa nguyên liệu
 */
export const deleteIngredient = async (id) => {
    await api.delete(`${BASE_URL}/${id}`)
}
