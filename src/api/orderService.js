import api from './axios'
import { buildApiError } from './utils/errorHandler'
import { cleanParams } from './utils'
import logger from '@/utils/logger'

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
    // Đảm bảo format đúng cho backend
    const payload = {
        productId: Number(itemData.productId),
        quantity: Math.max(1, Math.floor(Number(itemData.quantity)))
    }
    
    // Chỉ thêm notes nếu có giá trị (không gửi null hoặc empty string)
    if (itemData.notes && String(itemData.notes).trim()) {
        payload.notes = String(itemData.notes).trim()
    }
    
    // Validate
    if (!Number.isFinite(payload.productId) || payload.productId <= 0) {
        throw new Error('Product ID không hợp lệ')
    }
    if (!Number.isFinite(payload.quantity) || payload.quantity < 1) {
        throw new Error('Số lượng phải lớn hơn 0')
    }
    
    const { data } = await api.post(`/api/v1/orders/${orderId}/items`, payload);
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
/**
 * Lấy danh sách orders theo khoảng thời gian.
 * 
 * Có fallback logic khi endpoint /date-range trả về 500:
 * - Primary: GET /api/v1/orders/date-range?startDate=...&endDate=...
 * - Fallback: GET /api/v1/orders với filter client-side
 * 
 * @param {string} startDate - Ngày bắt đầu (YYYY-MM-DD)
 * @param {string} endDate - Ngày kết thúc (YYYY-MM-DD)
 * @param {number} [page=0] - Số trang (zero-based)
 * @param {number} [size=10] - Kích thước trang
 * @param {Object} [options] - Tùy chọn bổ sung
 * @param {boolean} [options.useFallback=true] - Có sử dụng fallback khi lỗi 500
 * @returns {Promise<Object>} Response với content, totalElements, totalPages, etc.
 * @throws {Error} Nếu không thể lấy orders và không có fallback
 */
export const getOrdersByDateRange = async (startDate, endDate, page = 0, size = 10, options = {}) => {
    const { useFallback = true } = options
    
    // Validate input
    if (!startDate || !endDate) {
        throw new Error('startDate and endDate are required')
    }

    // Validate date format (basic check)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        throw new Error('Invalid date format. Expected YYYY-MM-DD')
    }

    // Validate date range
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date values')
    }
    if (start > end) {
        throw new Error('startDate must be before or equal to endDate')
    }

    // Primary endpoint: /api/v1/orders/date-range
    try {
        const { data } = await api.get('/api/v1/orders/date-range', {
            params: { startDate, endDate, page, size }
        })
        
        // Validate response format
        if (data && typeof data === 'object') {
            return data
        }
        
        throw new Error('Invalid response format from date-range endpoint')
    } catch (primaryError) {
        const status = primaryError.response?.status
        
        // Chỉ fallback khi 500 (server error) và useFallback = true
        // Các lỗi khác (400, 401, 403, 404) sẽ throw ngay
        if (status !== 500 || !useFallback) {
            // Log error trong development
            if (import.meta.env.DEV && status !== 500) {
                logger.error('[OrderService] Date range endpoint failed:', {
                    status,
                    message: primaryError.message,
                    url: '/api/v1/orders/date-range',
                    params: { startDate, endDate, page, size }
                })
            }
            throw primaryError
        }

        // Fallback: Lấy tất cả orders và filter client-side
        // Log warning trong development
        if (import.meta.env.DEV) {
            logger.warn('[OrderService] Date range endpoint returned 500, using fallback with client-side filtering')
        }

        try {
            // Lấy tất cả orders (với limit hợp lý)
            const fallbackPage = 0
            const fallbackSize = Math.max(size * 10, 100) // Lấy nhiều hơn để filter
            const { data: allOrdersData } = await api.get('/api/v1/orders', {
                params: { page: fallbackPage, size: fallbackSize }
            })

            const allOrders = Array.isArray(allOrdersData?.content) 
                ? allOrdersData.content 
                : (Array.isArray(allOrdersData) ? allOrdersData : [])

            // Filter by date range client-side
            const startDateTime = new Date(startDate + 'T00:00:00').getTime()
            const endDateTime = new Date(endDate + 'T23:59:59').getTime()

            const filteredOrders = allOrders.filter(order => {
                if (!order.createdAt) return false
                const orderDate = new Date(order.createdAt).getTime()
                return orderDate >= startDateTime && orderDate <= endDateTime
            })

            // Paginate filtered results
            const startIndex = page * size
            const endIndex = startIndex + size
            const paginatedOrders = filteredOrders.slice(startIndex, endIndex)
            const totalElements = filteredOrders.length
            const totalPages = Math.ceil(totalElements / size)

            return {
                content: paginatedOrders,
                number: page,
                size: size,
                totalElements: totalElements,
                totalPages: totalPages,
                first: page === 0,
                last: page >= totalPages - 1,
                numberOfElements: paginatedOrders.length,
                // Flag để biết đây là fallback result
                _fallback: true
            }
        } catch (fallbackError) {
            // Log error trong development
            if (import.meta.env.DEV) {
                logger.error('[OrderService] Fallback also failed:', {
                    message: fallbackError.message,
                    url: '/api/v1/orders'
                })
            }
            
            // Throw lỗi gốc (500 từ date-range) thay vì lỗi fallback
            throw primaryError
        }
    }
};

// 8.13. Hủy order
export const cancelOrder = async (orderId) => {
    const { data } = await api.put(`/api/v1/orders/${orderId}/cancel`)
    return data
}

// 8.14. Cập nhật thông tin order (ngoài items)
/**
 * Cập nhật thông tin order như customer, note, table, etc.
 * @param {string|number} orderId - ID của order cần cập nhật
 * @param {Object} orderData - Dữ liệu order cần cập nhật
 * @param {number} [orderData.customerId] - ID khách hàng
 * @param {number} [orderData.tableId] - ID bàn
 * @param {string} [orderData.note] - Ghi chú
 * @param {string} [orderData.status] - Trạng thái order
 * @returns {Promise<Object>} Order đã được cập nhật
 */
export const updateOrder = async (orderId, orderData) => {
    if (!orderId) {
        throw new Error('Order ID is required')
    }
    
    // Chuẩn hóa payload: chỉ gửi các trường có giá trị
    const body = {}
    if (orderData.customerId !== undefined) {
        body.customerId = orderData.customerId
    }
    if (orderData.tableId !== undefined) {
        body.tableId = orderData.tableId
    }
    if (orderData.note !== undefined) {
        body.note = typeof orderData.note === 'string' ? orderData.note.trim() : orderData.note
    }
    if (orderData.status !== undefined) {
        body.status = orderData.status
    }
    
    const { data } = await api.put(`/api/v1/orders/${orderId}`, body)
    return data
}