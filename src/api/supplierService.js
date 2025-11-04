import api from './axios'

export const getSuppliers = async () => {
    const { data } = await api.get('/suppliers')
    return data
}

export const createSupplier = async (supplierData) => {
    const { data } = await api.post('/suppliers', supplierData)
    return data
}
export const updateSupplier = async ({ id, data }) => {
    const { data: responseData } = await api.put(`/suppliers/${id}`, data)
    return responseData
}

export const deleteSupplier = async (id) => {
    await api.delete(`/suppliers/${id}`)
    return id
}