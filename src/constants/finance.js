/**
 * Finance Constants
 * Tất cả constants liên quan đến tài chính, chi phí, lợi nhuận
 */

// VAT (Thuế GTGT)
export const VAT_RATE = 0.1 // 10%
export const VAT_RATE_PERCENT = 10

// Cost Analysis Thresholds
export const COST_RATIO_THRESHOLD = {
    HIGH: 80, // Tỷ lệ chi phí/doanh thu cao
    MEDIUM: 60,
    LOW: 40
}

export const COST_PER_ORDER_THRESHOLD = {
    HIGH: 100000, // VNĐ
    MEDIUM: 50000,
    LOW: 20000
}

// Profit Margin Thresholds
export const PROFIT_MARGIN_THRESHOLD = {
    EXCELLENT: 40, // %
    GOOD: 30,
    AVERAGE: 20,
    LOW: 10
}

// Product Classification Thresholds (BCG Matrix)
export const PRODUCT_CLASSIFICATION = {
    VOLUME_THRESHOLD: 50, // Số lượng bán
    MARGIN_THRESHOLD: 30 // Margin %
}

// Category Cost Ratio Thresholds
export const CATEGORY_COST_RATIO_THRESHOLD = {
    HIGH: 40, // % của tổng chi phí
    MEDIUM: 20,
    LOW: 10
}

// Currency
export const CURRENCY = {
    SYMBOL: 'VNĐ',
    CODE: 'VND',
    DECIMAL_PLACES: 0
}

// Rounding
export const ROUNDING = {
    PRICE: 1000, // Làm tròn giá đến 1000
    AMOUNT: 1 // Làm tròn số lượng đến 1
}

// Payment Methods
export const PAYMENT_METHODS = Object.freeze({
    CASH: 'CASH',
    CARD: 'CARD',
    BANK_TRANSFER: 'BANK_TRANSFER',
    E_WALLET: 'E_WALLET'
})

export const PAYMENT_METHOD_LABELS = Object.freeze({
    [PAYMENT_METHODS.CASH]: 'Tiền mặt',
    [PAYMENT_METHODS.CARD]: 'Thẻ',
    [PAYMENT_METHODS.BANK_TRANSFER]: 'Chuyển khoản',
    [PAYMENT_METHODS.E_WALLET]: 'Ví điện tử'
})

// Expense Categories
export const EXPENSE_CATEGORIES = Object.freeze({
    INGREDIENTS: 'INGREDIENTS',
    LABOR: 'LABOR',
    RENT: 'RENT',
    UTILITIES: 'UTILITIES',
    MARKETING: 'MARKETING',
    OTHER: 'OTHER'
})

export const EXPENSE_CATEGORY_LABELS = Object.freeze({
    [EXPENSE_CATEGORIES.INGREDIENTS]: 'Nguyên liệu',
    [EXPENSE_CATEGORIES.LABOR]: 'Nhân công',
    [EXPENSE_CATEGORIES.RENT]: 'Thuê mặt bằng',
    [EXPENSE_CATEGORIES.UTILITIES]: 'Tiện ích',
    [EXPENSE_CATEGORIES.MARKETING]: 'Marketing',
    [EXPENSE_CATEGORIES.OTHER]: 'Khác'
})

// Discount Types
export const DISCOUNT_TYPES = Object.freeze({
    PERCENTAGE: 'PERCENTAGE',
    FIXED: 'FIXED'
})

// Voucher Types
export const VOUCHER_TYPES = Object.freeze({
    PERCENTAGE: 'PERCENTAGE',
    FIXED: 'FIXED',
    FREE_SHIPPING: 'FREE_SHIPPING',
    BUY_X_GET_Y: 'BUY_X_GET_Y'
})

