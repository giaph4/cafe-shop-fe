import api from './axios'

// Tạo order mới
export const createOrder = async (payload) => {
    // payload: { type: 'TAKE_AWAY'|'AT_TABLE', tableId?, customerId?, voucherCode?, items: [{ productId, quantity, notes? }] }
    const { data } = await api.post('/orders', payload)
    return data
}

// Lấy order đang PENDING của 1 bàn
export const getPendingOrderByTable = async (tableId) => {
    const { data } = await api.get(`/orders/table/${tableId}/pending`)
    return data
}

// Thêm món vào order
export const addOrderItem = async (orderId, item) => {
    // item: { productId, quantity, notes? }
    const { data } = await api.post(`/orders/${orderId}/items`, item)
    return data
}

// Cập nhật món trong order
export const updateOrderItem = async (orderId, orderDetailId, item) => {
    // item: { quantity?, notes? }
    const { data } = await api.put(`/orders/${orderId}/items/${orderDetailId}`, item)
    return data
}

// Xoá món khỏi order
export const deleteOrderItem = async (orderId, orderDetailId) => {
    const { data } = await api.delete(`/orders/${orderId}/items/${orderDetailId}`)
    return data
}

// Áp dụng voucher
export const applyVoucher = async (orderId, voucherCode) => {
    const { data } = await api.post(`/orders/${orderId}/voucher`, { voucherCode })
    return data
}

// Gỡ voucher
export const removeVoucher = async (orderId) => {
    const { data } = await api.delete(`/orders/${orderId}/voucher`)
    return data
}

// Thanh toán
export const payOrder = async (orderId, paymentMethod) => {
    const { data } = await api.post(`/orders/${orderId}/payment`, { paymentMethod })
    return data
}

// Huỷ order
export const cancelOrder = async (orderId) => {
    const { data } = await api.post(`/orders/${orderId}/cancel`)
    return data
}


