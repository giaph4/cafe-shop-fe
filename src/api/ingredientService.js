import api from './axios'

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
 */
export const getIngredientById = async (id) => {
    try {
        const { data } = await api.get(`${BASE_URL}/${id}`)
        return data
    } catch (error) {
        if (error.response?.status === 404 || error.response?.status === 500) {
            // Fallback for legacy endpoint declarations on BE
            const fallbackCandidates = [
                () => api.get(`${BASE_URL}/id/${id}`),
                () => api.get(`${BASE_URL}/id`, { params: { id } }),
            ]

            for (const request of fallbackCandidates) {
                try {
                    const { data } = await request()
                    return data
                } catch (fallbackError) {
                    if (fallbackError.response?.status !== 404) {
                        throw fallbackError
                    }
                }
            }
        }

        throw error
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
