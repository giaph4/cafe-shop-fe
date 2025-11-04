
import api from './axios'; 

export const getPurchaseOrders = (params) => {
    return api.get('/purchase-orders', { params });
};

export const getPurchaseOrderById = (id) => {
    return api.get(`/purchase-orders/${id}`);
};

export const updatePurchaseOrderStatus = (id, status) => {
    // API yêu cầu gửi object { status: "..." } trong body
    return api.put(`/purchase-orders/${id}/status`, { status });
};


export const deletePurchaseOrder = (id) => {
    return api.delete(`/purchase-orders/${id}`);
};

export const createPurchaseOrder = (data) => {
    return api.post('/purchase-orders', data);
};