import api from './axios'
import logger from '@/utils/logger'

// 8.1. Tạo đơn hàng mới
export const createOrder = async (orderData) => {
    const { data } = await api.post('/api/v1/orders', orderData)
    return data
}

// 8.2. Lấy danh sách orders (phân trang)
export const getOrders = async (page = 0, size = 10) => {
    const { data } = await api.get('/api/v1/orders', { params: { page, size } })
    return data
}

// 8.3. Lấy chi tiết đơn hàng
export const getOrderById = async (orderId) => {
    const { data } = await api.get(`/api/v1/orders/${orderId}`)
    return data
}

// 8.4. Lấy order đang PENDING của bàn
export const getPendingOrderByTable = async (tableId) => {
    const { data } = await api.get(`/api/v1/orders/table/${tableId}/pending`)
    return data
}

// 8.5. Thêm món vào order
export const addItemToOrder = async ({ orderId, itemData }) => {
    // Validate input
    if (!itemData) {
        throw new Error('Item data là bắt buộc')
    }

    if (itemData.productId === null || itemData.productId === undefined) {
        throw new Error('Product ID là bắt buộc')
    }

    // Đảm bảo format đúng cho backend: productId là Long, quantity là int
    const productId = Number(itemData.productId)
    const quantity = Math.max(1, Math.floor(Number(itemData.quantity || 1)))

    // Validate
    if (!Number.isFinite(productId) || productId <= 0 || !Number.isInteger(productId)) {
        throw new Error(`Product ID không hợp lệ: ${itemData.productId} (phải là số nguyên dương)`)
    }
    if (!Number.isFinite(quantity) || quantity < 1 || !Number.isInteger(quantity)) {
        throw new Error(`Số lượng không hợp lệ: ${itemData.quantity} (phải là số nguyên >= 1)`)
    }

    // Tạo payload theo đúng format backend yêu cầu
    // Backend OrderDetailRequestDTO: productId (Long, @NotNull), quantity (int, @Min(1)), notes (String, optional)
    const payload = {
        productId,
        quantity
    }

    // Chỉ thêm notes nếu có giá trị (không gửi null hoặc empty string)
    // Backend sử dụng StringUtils.hasText() để kiểm tra, nên chỉ gửi khi có giá trị
    if (itemData.notes !== null && itemData.notes !== undefined && String(itemData.notes).trim()) {
        payload.notes = String(itemData.notes).trim()
    }

    // Ghi log payload để debug (chỉ trong development)
    if (import.meta.env.DEV) {
        logger.log('[OrderService] Đang thêm món vào đơn hàng:', {
            orderId,
            payload,
            payloadString: JSON.stringify(payload),
            payloadType: {
                productId: typeof payload.productId,
                quantity: typeof payload.quantity,
                notes: typeof payload.notes
            }
        })
    }

    try {
        const { data } = await api.post(`/api/v1/orders/${orderId}/items`, payload)
        return data
    } catch (error) {
        // Ghi log chi tiết lỗi để debug
        const errorResponse = error.response?.data
        const errorDetails = {
            orderId,
            payload,
            payloadString: JSON.stringify(payload),
            url: `/api/v1/orders/${orderId}/items`,
            status: error.response?.status,
            statusText: error.response?.statusText,
            errorMessage: errorResponse?.message || errorResponse?.error || error.message,
            errorData: errorResponse,
            errorHeaders: error.response?.headers,
            // Ghi log toàn bộ response để debug
            fullResponse: error.response
        }

        logger.error('[OrderService] Không thể thêm món:', errorDetails)
        logger.error('[OrderService] Lỗi đầy đủ:', error)
        logger.error('[OrderService] Dữ liệu response lỗi:', errorResponse)

        // Tạo thông báo lỗi thân thiện hơn
        let userFriendlyMessage = 'Không thể thêm món vào đơn hàng'
        if (errorResponse?.message) {
            userFriendlyMessage = errorResponse.message
        } else if (errorResponse?.error) {
            userFriendlyMessage = errorResponse.error
        } else if (error.response?.status === 500) {
            userFriendlyMessage = 'Lỗi server. Vui lòng kiểm tra lại đơn hàng và sản phẩm.'
        }

        // Tạo lỗi mới với thông báo rõ ràng hơn
        const enhancedError = new Error(userFriendlyMessage)
        enhancedError.originalError = error
        enhancedError.status = error.response?.status
        enhancedError.response = error.response
        enhancedError.payload = payload
        enhancedError.orderId = orderId

        throw enhancedError
    }
}

// 8.6. Cập nhật món trong order
export const updateOrderItem = async ({ orderId, orderDetailId, updateData }) => {
    // Đảm bảo format đúng cho backend
    const payload = {
        quantity: Math.max(1, Math.floor(Number(updateData.quantity)))
    }

    // Chỉ thêm notes nếu có giá trị (không gửi null hoặc empty string)
    if (updateData.notes && String(updateData.notes).trim()) {
        payload.notes = String(updateData.notes).trim()
    }

    // Validate
    if (!Number.isFinite(payload.quantity) || payload.quantity < 1) {
        throw new Error('Số lượng phải lớn hơn 0')
    }

    const { data } = await api.put(`/api/v1/orders/${orderId}/items/${orderDetailId}`, payload)
    return data
}

// 8.7. Xóa món khỏi order
export const removeItemFromOrder = async ({ orderId, orderDetailId }) => {
    const { data } = await api.delete(`/api/v1/orders/${orderId}/items/${orderDetailId}`)
    return data
}

// 8.8. Áp dụng voucher
export const applyVoucher = async ({ orderId, voucherCode }) => {
    const { data } = await api.post(`/api/v1/orders/${orderId}/voucher`, { voucherCode })
    return data
}

// 8.9. Xóa voucher
export const removeVoucher = async (orderId) => {
    const { data } = await api.delete(`/api/v1/orders/${orderId}/voucher`)
    return data
}

// 8.10. Thanh toán order
export const processPayment = async ({ orderId, paymentData }) => {
    try {
        const { data } = await api.post(`/api/v1/orders/${orderId}/payment`, paymentData)
        return data
    } catch (error) {
        // Extract error message from response
        const errorMessage = error?.response?.data?.message
            || error?.response?.data?.error
            || error?.message
            || 'Không thể xử lý thanh toán. Vui lòng thử lại.'

        // Create a more descriptive error
        const enhancedError = new Error(errorMessage)
        enhancedError.status = error?.response?.status
        enhancedError.response = error?.response
        enhancedError.originalError = error

        throw enhancedError
    }
}

// 8.11. Lấy orders theo trạng thái
export const getOrdersByStatus = async (status, page = 0, size = 10) => {
    const { data } = await api.get(`/api/v1/orders/status/${status}`, { params: { page, size } })
    return data
}

// 8.12. Lấy đơn hàng theo khoảng thời gian
/**
 * Lấy danh sách đơn hàng theo khoảng thời gian.
 *
 * Có logic dự phòng khi endpoint /date-range trả về 500:
 * - Chính: GET /api/v1/orders/date-range?startDate=...&endDate=...
 * - Dự phòng: GET /api/v1/orders với lọc phía client
 *
 * @param {string} startDate - Ngày bắt đầu (YYYY-MM-DD)
 * @param {string} endDate - Ngày kết thúc (YYYY-MM-DD)
 * @param {number} [page=0] - Số trang (bắt đầu từ 0)
 * @param {number} [size=10] - Kích thước trang
 * @param {Object} [options] - Tùy chọn bổ sung
 * @param {boolean} [options.useFallback=true] - Có sử dụng dự phòng khi lỗi 500
 * @returns {Promise<Object>} Response với content, totalElements, totalPages, etc.
 * @throws {Error} Nếu không thể lấy đơn hàng và không có dự phòng
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

        // Chỉ dùng dự phòng khi 500 (lỗi server) và useFallback = true
        // Các lỗi khác (400, 401, 403, 404) sẽ throw ngay
        if (status !== 500 || !useFallback) {
            // Ghi log lỗi trong development
            if (import.meta.env.DEV && status !== 500) {
                logger.error('[OrderService] Endpoint date range thất bại:', {
                    status,
                    message: primaryError.message,
                    url: '/api/v1/orders/date-range',
                    params: { startDate, endDate, page, size }
                })
            }
            throw primaryError
        }

        // Dự phòng: Lấy tất cả đơn hàng và lọc phía client
        // Ghi log cảnh báo trong development
        if (import.meta.env.DEV) {
            logger.warn('[OrderService] Endpoint date range trả về 500, sử dụng dự phòng với lọc phía client')
        }

        try {
            // Lấy tất cả đơn hàng (với giới hạn hợp lý)
            const fallbackPage = 0
            const fallbackSize = Math.max(size * 10, 100) // Lấy nhiều hơn để lọc
            const { data: allOrdersData } = await api.get('/api/v1/orders', {
                params: { page: fallbackPage, size: fallbackSize }
            })

            const allOrders = Array.isArray(allOrdersData?.content)
                ? allOrdersData.content
                : (Array.isArray(allOrdersData) ? allOrdersData : [])

            // Lọc theo khoảng thời gian phía client
            const startDateTime = new Date(`${startDate}T00:00:00`).getTime()
            const endDateTime = new Date(`${endDate}T23:59:59`).getTime()

            const filteredOrders = allOrders.filter(order => {
                if (!order.createdAt) return false
                const orderDate = new Date(order.createdAt).getTime()
                return orderDate >= startDateTime && orderDate <= endDateTime
            })

            // Phân trang kết quả đã lọc
            const startIndex = page * size
            const endIndex = startIndex + size
            const paginatedOrders = filteredOrders.slice(startIndex, endIndex)
            const totalElements = filteredOrders.length
            const totalPages = Math.ceil(totalElements / size)

            return {
                content: paginatedOrders,
                number: page,
                size,
                totalElements,
                totalPages,
                first: page === 0,
                last: page >= totalPages - 1,
                numberOfElements: paginatedOrders.length,
                // Cờ để biết đây là kết quả dự phòng
                _fallback: true
            }
        } catch (fallbackError) {
            // Ghi log lỗi trong development
            if (import.meta.env.DEV) {
                logger.error('[OrderService] Dự phòng cũng thất bại:', {
                    message: fallbackError.message,
                    url: '/api/v1/orders'
                })
            }

            // Throw lỗi gốc (500 từ date-range) thay vì lỗi dự phòng
            throw primaryError
        }
    }
}

// 8.13. Hủy đơn hàng
export const cancelOrder = async (orderId) => {
    const { data } = await api.put(`/api/v1/orders/${orderId}/cancel`)
    return data
}

// 8.14. Cập nhật thông tin đơn hàng
// Chỉ cho phép cập nhật customerId và tableId cho đơn ở trạng thái PENDING
// Không cho phép cập nhật status (dùng cancelOrder) hoặc note (không có field này trong Order)
/**
 * Cập nhật thông tin đơn hàng (chỉ customerId và tableId)
 * @param {string|number} orderId - ID đơn hàng cần cập nhật
 * @param {Object} orderData - Dữ liệu đơn hàng cần cập nhật { customerId?, tableId? }
 * @returns {Promise<Object>} Đơn hàng đã được cập nhật
 */
export const updateOrder = async (orderId, orderData) => {
    const payload = {}
    if (orderData.customerId !== undefined) {
        payload.customerId = orderData.customerId
    }
    if (orderData.tableId !== undefined) {
        payload.tableId = orderData.tableId
    }
    
    const { data } = await api.put(`/api/v1/orders/${orderId}`, payload)
    return data
}
