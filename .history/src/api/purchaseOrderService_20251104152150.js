import api from './axios'

// API 42: Get All Purchase Orders (Paginated)
export const getPurchaseOrders = async (page = 0, size = 10) => {
    const params = {
        page,
        size,
        sort: 'orderDate,desc', // Luôn sắp xếp mới nhất lên trên
    }
    const { data } = await api.get('/purchase-orders', { params })
    return data
}

// API 43: Get Purchase Order by ID
export const getPurchaseOrderById = async (id) => {
    const { data } = await api.get(`/purchase-orders/${id}`)
    return data
}

// API 41: Create Purchase Order
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
