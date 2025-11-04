// src/api/purchaseOrderService.js

import api from './axios'; // Tái sử dụng instance axios đã cấu hình

/**
 * Lấy danh sách phiếu nhập hàng (có phân trang và lọc)
 * @param {object} params - Các tham số query (page, size, search, startDate, endDate, status, minTotal, maxTotal, sortBy, sortDir)
 * @returns {Promise}
 */
export const getPurchaseOrders = (params) => {
    return api.get('/purchase-orders', { params });
};

/**
 * Lấy chi tiết một phiếu nhập
 * @param {number|string} id - ID của phiếu nhập
 * @returns {Promise}
 */
export const getPurchaseOrderById = (id) => {
    return api.get(`/purchase-orders/${id}`);
};

/**
 * Cập nhật trạng thái của phiếu nhập
 * @param {number|string} id - ID của phiếu nhập
 * @param {string} status - Trạng thái mới (VD: 'COMPLETED' hoặc 'CANCELLED')
 * @returns {Promise}
 */
export const updatePurchaseOrderStatus = (id, status) => {
    // API yêu cầu gửi object { status: "..." } trong body
    return api.put(`/purchase-orders/${id}/status`, { status });
};

/**
 * Xóa một phiếu nhập hàng
 * @param {number|string} id - ID của phiếu nhập
 * @returns {Promise}
 */
export const deletePurchaseOrder = (id) => {
    return api.delete(`/purchase-orders/${id}`);
};

// Các hàm khác (create, update) sẽ được thêm ở bước sau
export const createPurchaseOrder = (data) => {
    return api.post('/purchase-orders', data);
};