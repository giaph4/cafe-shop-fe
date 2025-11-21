import api from './axios';

// 8.1. Tạo đơn hàng mới
export const createOrder = async (orderData) => {
    const { data } = await api.post('/api/v1/orders', orderData);
    return data;
};

// 8.2. Lấy danh sách orders (phân trang)
export const getOrders = async (page = 0, size = 10) => {
    const { data } = await api.get('/api/v1/orders', { params: { page, size } });
    return data;
};

// 8.3. Lấy chi tiết đơn hàng
export const getOrderById = async (orderId) => {
    const { data } = await api.get(`/api/v1/orders/${orderId}`);
    return data;
};

// 8.4. Lấy order đang PENDING của bàn
export const getPendingOrderByTable = async (tableId) => {
    const { data } = await api.get(`/api/v1/orders/table/${tableId}/pending`);
    return data;
};

// 8.5. Thêm món vào order
export const addItemToOrder = async ({ orderId, itemData }) => {
    const { data } = await api.post(`/api/v1/orders/${orderId}/items`, itemData);
    return data;
};

// 8.6. Cập nhật món trong order
export const updateOrderItem = async ({ orderId, orderDetailId, updateData }) => {
    const { data } = await api.put(`/api/v1/orders/${orderId}/items/${orderDetailId}`, updateData);
    return data;
};

// 8.7. Xóa món khỏi order
export const removeItemFromOrder = async ({ orderId, orderDetailId }) => {
    const { data } = await api.delete(`/api/v1/orders/${orderId}/items/${orderDetailId}`);
    return data;
};

// 8.8. Áp dụng voucher
export const applyVoucher = async ({ orderId, voucherCode }) => {
    const { data } = await api.post(`/api/v1/orders/${orderId}/voucher`, { voucherCode });
    return data;
};

// 8.9. Xóa voucher
export const removeVoucher = async (orderId) => {
    const { data } = await api.delete(`/api/v1/orders/${orderId}/voucher`);
    return data;
};

// 8.10. Thanh toán order
export const processPayment = async ({ orderId, paymentData }) => {
    const { data } = await api.post(`/api/v1/orders/${orderId}/payment`, paymentData);
    return data;
};

// 8.11. Lấy orders theo trạng thái
export const getOrdersByStatus = async (status, page = 0, size = 10) => {
    const { data } = await api.get(`/api/v1/orders/status/${status}`, { params: { page, size } });
    return data;
};

// 8.12. Lấy orders theo khoảng thời gian
export const getOrdersByDateRange = async (startDate, endDate, page = 0, size = 10) => {
    const { data } = await api.get('/api/v1/orders/date-range', {
        params: { startDate, endDate, page, size }
    });
    return data;
};

// 8.13. Hủy order
export const cancelOrder = async (orderId) => {
    const { data } = await api.put(`/api/v1/orders/${orderId}/cancel`)
    return data
}
