import api from './axios'

export const getPurchaseOrders = async (page = 0, size = 10) => {
    const params = {
        page,
        size,
        sort: 'orderDate,desc', 
    }
    const { data } = await api.get('/purchase-orders', { params })
    return data
}

export const getPurchaseOrderById = async (id) => {
    const { data } = await api.get(`/purchase-orders/${id}`)
    return data
}

export const createPurchaseOrder = async (orderData) => {
    const { data } = await api.post('/purchase-orders', orderData)
    return data
}

export const markOrderAsCompleted = async (id) => {
    const { data } = await api.post(`/purchase-orders/${id}/complete`)
    return data
}

export const cancelPurchaseOrder = async (id) => {
    const { data } = await api.post(`/purchase-orders/${id}/cancel`)
    return data
}