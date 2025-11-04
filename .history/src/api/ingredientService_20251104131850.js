import api from './axios'
export const getIngredients = async (page = 0, size = 10, name = '') => {
    const params = {
        page,
        size,
        sort: 'name,asc', // Luôn sắp xếp theo tên
    }
    if (name) {
        params.name = name
    }

    // API trả về một Page object (có content, totalPages, ...)
    const { data } = await api.get('/ingredients', { params })
    return data
}

// API 35: Create Ingredient
export const createIngredient = async (ingredientData) => {
    const { data } = await api.post('/ingredients', ingredientData)
    return data
}

// API 38: Update Ingredient Info
export const updateIngredient = async ({ id, data }) => {
    const { data: responseData } = await api.put(`/ingredients/${id}`, data)
    return responseData
}

// API 39: Delete Ingredient
export const deleteIngredient = async (id) => {
    await api.delete(`/ingredients/${id}`)
    return id
}

// API 40: Adjust Inventory
export const adjustInventory = async (adjustmentData) => {
    const { data } = await api.patch('/ingredients/adjust-inventory', adjustmentData)
    return data
}