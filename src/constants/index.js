/**
 * Application Constants
 * Tất cả constants được tập trung tại đây để dễ quản lý và thay đổi
 */

// API Base URLs
export const API_BASE_URL = '/api/v1'
export const API_ADMIN_URL = '/api/admin'
export const API_MANAGER_URL = '/api/manager'
export const API_STAFF_URL = '/api/staff'
export const API_CHAT_URL = '/api/chat'

// Order Status
export const ORDER_STATUS = Object.freeze({
    PENDING: 'PENDING',
    PAID: 'PAID',
    CANCELLED: 'CANCELLED',
    TRANSFERRED: 'TRANSFERRED'
})

// User Roles
export const USER_ROLES = Object.freeze({
    ADMIN: 'ROLE_ADMIN',
    MANAGER: 'ROLE_MANAGER',
    STAFF: 'ROLE_STAFF'
})

// Table Status
export const TABLE_STATUS = Object.freeze({
    EMPTY: 'EMPTY',
    AVAILABLE: 'AVAILABLE',
    SERVING: 'SERVING',
    RESERVED: 'RESERVED',
    PENDING: 'PENDING'
})

// Purchase Order Status
export const PURCHASE_ORDER_STATUS = Object.freeze({
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
})

// Shift Assignment Status
export const SHIFT_ASSIGNMENT_STATUS = Object.freeze({
    ASSIGNED: 'ASSIGNED',
    CONFIRMED: 'CONFIRMED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
})

// Voucher Types
export const VOUCHER_TYPE = Object.freeze({
    PERCENTAGE: 'PERCENTAGE',
    FIXED: 'FIXED'
})

// Payment Methods
export const PAYMENT_METHOD = Object.freeze({
    CASH: 'CASH',
    CARD: 'CARD',
    BANK_TRANSFER: 'BANK_TRANSFER'
})

// Order Types
export const ORDER_TYPE = Object.freeze({
    DINE_IN: 'DINE_IN',
    TAKE_AWAY: 'TAKE_AWAY'
})

// Timing Constants
export const DEBOUNCE_DELAY = 300
export const API_TIMEOUT = 15000
export const TOAST_DURATION = 3000

// Pagination
export const PAGINATION_DEFAULT_SIZE = 10
export const PAGINATION_SIZE_OPTIONS = [10, 25, 50, 100]

// Pagination Object (for Reports and other modules)
export const PAGINATION = Object.freeze({
    DEFAULT_SIZE: 10,
    SIZE_OPTIONS: [10, 25, 50, 100],
    REPORT_TOPS: [5, 10, 20, 50]
})

// Phone Regex
export const PHONE_REGEX = /^(0\d{9})$/
export const PHONE_REGEX_WITH_PLUS = /^(\+84|0)\d{9}$/

// Date Formats
export const DATE_FORMAT = 'dd/MM/yyyy'
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm'

// Error Messages
export const ERROR_MESSAGES = Object.freeze({
    NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng thử lại.',
    UNAUTHORIZED: 'Bạn không có quyền truy cập.',
    NOT_FOUND: 'Không tìm thấy dữ liệu.',
    SERVER_ERROR: 'Lỗi máy chủ. Vui lòng thử lại sau.',
    VALIDATION_ERROR: 'Dữ liệu không hợp lệ.',
    UNKNOWN_ERROR: 'Đã xảy ra lỗi không xác định.'
})

// Success Messages
export const SUCCESS_MESSAGES = Object.freeze({
    CREATE: 'Tạo mới thành công.',
    UPDATE: 'Cập nhật thành công.',
    DELETE: 'Xóa thành công.',
    SAVE: 'Lưu thành công.'
})

