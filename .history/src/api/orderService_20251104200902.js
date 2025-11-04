import api from './axios'

/**
 * Lọc đơn hàng theo nhiều tiêu chí (ngày, trạng thái...).
 * [cite_start]API: GET /api/v1/orders/date-range [cite: 855-858]
 * [cite_start]API: GET /api/v1/orders/status/{status} [cite: 845-848]
 * [cite_start]API: GET /api/v1/orders [cite: 718-720]
 * * Chúng ta sẽ gộp các API lọc này vào một hàm duy nhất.
 *
 * @param {Object} params - Gồm { page, size, startDate, endDate, status }
 */
export const getOrders = async (params) => {
    try {
        // Tách status ra khỏi params vì nó là path variable
        const { status, ...queryParams } = params;

        let url = '/orders';

        // Backend dùng các endpoint khác nhau để lọc
        if (status) {
            url = `/orders/status/${status}`;
        } else if (queryParams.startDate && queryParams.endDate) {
            url = '/orders/date-range';
        }

        const { data } = await api.get(url, { params: queryParams });
        return data; // Trả về cấu trúc Page
    } catch (error) {
        console.error("Failed to fetch orders:", error);
        throw new Error(error.response?.data?.message || "Lỗi khi tải danh sách đơn hàng");
    }
}

/**
 * Lấy chi tiết đơn hàng theo ID.
 * [cite_start]API: GET /api/v1/orders/{id} [cite: 735-737]
 */
export const getOrderById = async (id) => {
    try {
        const { data } = await api.get(`/orders/${id}`);
        return data;
    } catch (error) {
        console.error(`Failed to fetch order ${id}:`, error);
        throw new Error(error.response?.data?.message || "Lỗi khi tải chi tiết đơn hàng");
    }
}

/**
 * Tạo đơn hàng mới (Order).
 * [cite_start]API: POST /api/v1/orders [cite: 671-673]
 * @param {Object} orderData - Gồm { tableId, type, items: [{ productId, quantity, notes }] }
 */
export const createOrder = async (orderData) => {
    try {
        const { data } = await api.post('/orders', orderData);
        return data;
    } catch (error) {
        console.error("Failed to create order:", error);
        throw new Error(error.response?.data?.message || "Lỗi khi tạo đơn hàng");
    }
}

/**
 * Hủy một đơn hàng PENDING.
 * [cite_start]API: POST /api/v1/orders/{orderId}/cancel [cite: 865-867]
 */
export const cancelOrder = async (orderId) => {
    try {
        const { data } = await api.post(`/orders/${orderId}/cancel`);
        return data;
    } catch (error) {
        console.error(`Failed to cancel order ${orderId}:`, error);
        throw new Error(error.response?.data?.message || "Lỗi khi hủy đơn hàng");
    }
}

// ----- Các API CRUD cho Order Items (Thêm/Sửa/Xóa món trong đơn PENDING) -----

/**
 * Thêm món vào đơn hàng PENDING.
 * [cite_start]API: POST /api/v1/orders/{orderId}/items [cite: 761-763]
 */
export const addItemToOrder = async (orderId, itemData) => {
    try {
        const { data } = await api.post(`/orders/${orderId}/items`, itemData);
        return data;
    } catch (error) {
        console.error(`Failed to add item to order ${orderId}:`, error);
        throw new Error(error.response?.data?.message || "Lỗi khi thêm món");
    }
}

/**
 * Xóa món khỏi đơn hàng PENDING.
 * [cite_start]API: DELETE /api/v1/orders/{orderId}/items/{orderDetailId} [cite: 776-778]
 */
export const removeItemFromOrder = async (orderId, orderDetailId) => {
    try {
        const { data } = await api.delete(`/orders/${orderId}/items/${orderDetailId}`);
        return data;
    } catch (error) {
        console.error(`Failed to remove item ${orderDetailId} from order ${orderId}:`, error);
        throw new Error(error.response?.data?.message || "Lỗi khi xoá món");
    }
}

/**
 * Cập nhật số lượng/ghi chú của món trong đơn hàng PENDING.
 * [cite_start]API: PUT /api/v1/orders/{orderId}/items/{orderDetailId} [cite: 785-787]
 */
export const updateItemInOrder = async (orderId, orderDetailId, updateData) => {
    try {
        const { data } = await api.put(`/orders/${orderId}/items/${orderDetailId}`, updateData);
        return data;
    } catch (error) {
        console.error(`Failed to update item ${orderDetailId} in order ${orderId}:`, error);
        throw new Error(error.response?.data?.message || "Lỗi khi cập nhật món");
    }
}

// ----- Các API thanh toán và Voucher -----

/**
 * Áp dụng voucher vào đơn hàng.
 * [cite_start]API: POST /api/v1/orders/{orderId}/voucher [cite: 814-816]
 */
export const applyVoucher = async (orderId, voucherCode) => {
    try {
        // API yêu cầu object { "voucherCode": "CODE" }
        const { data } = await api.post(`/orders/${orderId}/voucher`, { voucherCode });
        return data;
    } catch (error) {
        console.error(`Failed to apply voucher to order ${orderId}:`, error);
        // Lỗi 400 (Voucher không hợp lệ) cũng sẽ đi vào đây
        throw new Error(error.response?.data?.message || "Lỗi khi áp dụng voucher");
    }
}

/**
 * Gỡ voucher khỏi đơn hàng.
 * [cite_start]API: DELETE /api/v1/orders/{orderId}/voucher [cite: 835-837]
 */
export const removeVoucher = async (orderId) => {
    try {
        const { data } = await api.delete(`/orders/${orderId}/voucher`);
        return data;
    } catch (error) {
        console.error(`Failed to remove voucher from order ${orderId}:`, error);
        throw new Error(error.response?.data?.message || "Lỗi khi gỡ voucher");
    }
}

/**
 * Thanh toán đơn hàng PENDING.
 * [cite_start]API: POST /api/v1/orders/{orderId}/payment [cite: 799-801]
 */
export const payOrder = async (orderId, paymentMethod) => {
    try {
        // API yêu cầu object { "paymentMethod": "CASH" }
        const { data } = await api.post(`/orders/${orderId}/payment`, { paymentMethod });
        return data;
    } catch (error) {
        console.error(`Failed to pay for order ${orderId}:`, error);
        throw new Error(error.response?.data?.message || "Lỗi khi thanh toán");
    }
}