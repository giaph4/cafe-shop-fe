import api from './axios'


export const getIngredients = async (page = 0, size = 10, name = '') => {
    const params = {
        page,
        size,
        sort: 'name,asc',
    }
    if (name) {
        params.name = name
    }

    const { data } = await api.get('/ingredients', { params })
    return data
}


export const createIngredient = async (ingredientData) => {
    const { data } = await api.post('/ingredients', ingredientData)
    return data
}

export const updateIngredient = async ({ id, data }) => {
    const { data: responseData } = await api.put(`/ingredients/${id}`, data)
    return responseData
}

export const deleteIngredient = async (id) => {
    await api.delete(`/ingredients/${id}`)
    return id
}

export const adjustInventory = async (adjustmentData) => {
    const { data } = await api.patch('/ingredients/adjust-inventory', adjustmentData)
    return data
}