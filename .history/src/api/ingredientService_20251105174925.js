import api from './axios';

export const getIngredients = async (page = 0, size = 10, name = '', sort = 'name,asc') => {
    const params = {
        page,
        size,
        name,
        sort
    };
    const { data } = await api.get('/ingredients', { params });
    return data;
};

export const getAllIngredients = async () => {
    const { data } = await api.get('/ingredients');
    return data;
};

export const createIngredient = async (ingredientData) => {
    const { data } = await api.post('/ingredients', ingredientData);
    return data;
};

export const updateIngredient = async ({ id, data }) => {
    const { data: responseData } = await api.put(`/ingredients/${id}`, data);
    return responseData;
};

export const deleteIngredient = async (id) => {
    await api.delete(`/ingredients/${id}`);
    return id;
};

/**
 * Adjusts the inventory for a specific ingredient.
 * NOTE: Assumes the endpoint is 'POST /ingredients/{id}/adjust-inventory'
 * Please verify this with your backend implementation.
 */
export const adjustInventory = async ({ ingredientId, ...rest }) => {
    const { data } = await api.post(`/ingredients/${ingredientId}/adjust-inventory`, rest);
    return data;
};