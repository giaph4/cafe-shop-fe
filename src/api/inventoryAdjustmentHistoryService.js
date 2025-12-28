import api from './axios'

const BASE_URL = '/api/v1/inventory-adjustments'

/**
 * Lấy lịch sử điều chỉnh của một nguyên liệu
 */
export const getHistoryByIngredientId = async (ingredientId, page = 0, size = 20) => {
    const response = await api.get(`${BASE_URL}/ingredient/${ingredientId}`, {
        params: { page, size }
    })
    return response.data
}

/**
 * Lấy lịch sử điều chỉnh của một nguyên liệu trong khoảng thời gian
 */
export const getHistoryByIngredientIdAndDateRange = async (
    ingredientId,
    startDate,
    endDate,
    page = 0,
    size = 20
) => {
    const response = await api.get(`${BASE_URL}/ingredient/${ingredientId}/date-range`, {
        params: {
            startDate: startDate instanceof Date ? startDate.toISOString() : startDate,
            endDate: endDate instanceof Date ? endDate.toISOString() : endDate,
            page,
            size
        }
    })
    return response.data
}

/**
 * Lấy tất cả lịch sử điều chỉnh
 */
export const getAllHistory = async (page = 0, size = 20, startDate = null, endDate = null) => {
    const params = { page, size }
    if (startDate) {
        params.startDate = startDate instanceof Date ? startDate.toISOString() : startDate
    }
    if (endDate) {
        params.endDate = endDate instanceof Date ? endDate.toISOString() : endDate
    }
    const response = await api.get(BASE_URL, { params })
    return response.data
}

