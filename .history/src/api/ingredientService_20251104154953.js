import api from './axios'

// API 36: Get Ingredients (Paginated, Searchable, Sortable)
export const getIngredients = async (page = 0, size = 10, name = '', sort = 'name,asc') => {
    const params = {
        page,
        size,
        sort,
    }
    if (name) {
        params.name = name
    }

    const { data } = await api.get('/ingredients', { params })
    return data
}


export const getAllIngredients = async () => {
    const { data } = await api.get('/ingredients')
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
    // Đã fix lỗi 400, gửi đúng DTO
    const { data } = await api.patch('/ingredients/adjust-inventory', adjustmentData)
    return data
}