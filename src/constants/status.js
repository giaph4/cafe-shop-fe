/**
 * Status Constants
 * Tất cả constants liên quan đến trạng thái (status) của các entity
 */

// Order Status
export const ORDER_STATUS = Object.freeze({
    PENDING: 'PENDING',
    PAID: 'PAID',
    CANCELLED: 'CANCELLED',
    TRANSFERRED: 'TRANSFERRED',
    COMPLETED: 'COMPLETED'
})

export const ORDER_STATUS_LABELS = Object.freeze({
    [ORDER_STATUS.PENDING]: 'Chờ thanh toán',
    [ORDER_STATUS.PAID]: 'Đã thanh toán',
    [ORDER_STATUS.CANCELLED]: 'Đã hủy',
    [ORDER_STATUS.TRANSFERRED]: 'Đã chuyển',
    [ORDER_STATUS.COMPLETED]: 'Hoàn thành'
})

export const ORDER_STATUS_COLORS = Object.freeze({
    [ORDER_STATUS.PENDING]: 'warning',
    [ORDER_STATUS.PAID]: 'success',
    [ORDER_STATUS.CANCELLED]: 'danger',
    [ORDER_STATUS.TRANSFERRED]: 'info',
    [ORDER_STATUS.COMPLETED]: 'success'
})

// Table Status
export const TABLE_STATUS = Object.freeze({
    EMPTY: 'EMPTY',
    AVAILABLE: 'AVAILABLE',
    SERVING: 'SERVING',
    RESERVED: 'RESERVED',
    PENDING: 'PENDING'
})

export const TABLE_STATUS_LABELS = Object.freeze({
    [TABLE_STATUS.EMPTY]: 'Trống',
    [TABLE_STATUS.AVAILABLE]: 'Có sẵn',
    [TABLE_STATUS.SERVING]: 'Đang phục vụ',
    [TABLE_STATUS.RESERVED]: 'Đã đặt',
    [TABLE_STATUS.PENDING]: 'Chờ xử lý'
})

export const TABLE_STATUS_COLORS = Object.freeze({
    [TABLE_STATUS.EMPTY]: 'secondary',
    [TABLE_STATUS.AVAILABLE]: 'success',
    [TABLE_STATUS.SERVING]: 'warning',
    [TABLE_STATUS.RESERVED]: 'info',
    [TABLE_STATUS.PENDING]: 'warning'
})

// Purchase Order Status
export const PURCHASE_ORDER_STATUS = Object.freeze({
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    REJECTED: 'REJECTED'
})

export const PURCHASE_ORDER_STATUS_LABELS = Object.freeze({
    [PURCHASE_ORDER_STATUS.PENDING]: 'Chờ duyệt',
    [PURCHASE_ORDER_STATUS.APPROVED]: 'Đã duyệt',
    [PURCHASE_ORDER_STATUS.COMPLETED]: 'Hoàn thành',
    [PURCHASE_ORDER_STATUS.CANCELLED]: 'Đã hủy',
    [PURCHASE_ORDER_STATUS.REJECTED]: 'Từ chối'
})

// Shift Status
export const SHIFT_STATUS = Object.freeze({
    SCHEDULED: 'SCHEDULED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
})

export const SHIFT_STATUS_LABELS = Object.freeze({
    [SHIFT_STATUS.SCHEDULED]: 'Đã lên lịch',
    [SHIFT_STATUS.IN_PROGRESS]: 'Đang diễn ra',
    [SHIFT_STATUS.COMPLETED]: 'Hoàn thành',
    [SHIFT_STATUS.CANCELLED]: 'Đã hủy'
})

// Shift Assignment Status
export const SHIFT_ASSIGNMENT_STATUS = Object.freeze({
    ASSIGNED: 'ASSIGNED',
    CONFIRMED: 'CONFIRMED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
})

export const SHIFT_ASSIGNMENT_STATUS_LABELS = Object.freeze({
    [SHIFT_ASSIGNMENT_STATUS.ASSIGNED]: 'Đã phân công',
    [SHIFT_ASSIGNMENT_STATUS.CONFIRMED]: 'Đã xác nhận',
    [SHIFT_ASSIGNMENT_STATUS.COMPLETED]: 'Hoàn thành',
    [SHIFT_ASSIGNMENT_STATUS.CANCELLED]: 'Đã hủy'
})

// Product Status
export const PRODUCT_STATUS = Object.freeze({
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    OUT_OF_STOCK: 'OUT_OF_STOCK',
    DISCONTINUED: 'DISCONTINUED'
})

export const PRODUCT_STATUS_LABELS = Object.freeze({
    [PRODUCT_STATUS.ACTIVE]: 'Đang bán',
    [PRODUCT_STATUS.INACTIVE]: 'Ngừng bán',
    [PRODUCT_STATUS.OUT_OF_STOCK]: 'Hết hàng',
    [PRODUCT_STATUS.DISCONTINUED]: 'Ngừng sản xuất'
})

// Voucher Status
export const VOUCHER_STATUS = Object.freeze({
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    EXPIRED: 'EXPIRED',
    USED: 'USED'
})

export const VOUCHER_STATUS_LABELS = Object.freeze({
    [VOUCHER_STATUS.ACTIVE]: 'Hoạt động',
    [VOUCHER_STATUS.INACTIVE]: 'Không hoạt động',
    [VOUCHER_STATUS.EXPIRED]: 'Hết hạn',
    [VOUCHER_STATUS.USED]: 'Đã sử dụng'
})

// Helper functions
export const getStatusLabel = (status, statusLabels) => statusLabels[status] || status

export const getStatusColor = (status, statusColors) => statusColors[status] || 'secondary'

