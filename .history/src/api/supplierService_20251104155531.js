import api from './axios'

// API 31: Get All Suppliers
export const getSuppliers = async () => {
    const { data } = await api.get('/suppliers')
    return data
}

// API 30: Create Supplier
export const createSupplier = async (supplierData) => {
    const { data } = await api.post('/suppliers', supplierData)
    return data
}

// API 33: Update Supplier
export const updateSupplier = async ({ id, data }) => {
    const { data: responseData } = await api.put(`/suppliers/${id}`, data)
    return responseData
}

// API 34: Delete Supplier
export const deleteSupplier = async (id) => {
    await api.delete(`/suppliers/${id}`)
    return id
}