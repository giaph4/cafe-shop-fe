/**
 * Calculator Math Utilities
 * Xử lý tính toán chính xác, tránh lỗi floating point
 */

/**
 * Chuyển đổi số thành string để tính toán chính xác
 */
function toDecimalString(num) {
    if (typeof num === 'string') return num
    if (num === null || num === undefined || isNaN(num)) return '0'
    return num.toString()
}

/**
 * Làm tròn số thập phân
 */
function roundDecimal(num, decimals = 10) {
    const factor = Math.pow(10, decimals)
    return Math.round(num * factor) / factor
}

/**
 * Cộng hai số
 */
export function add(a, b) {
    const numA = parseFloat(toDecimalString(a)) || 0
    const numB = parseFloat(toDecimalString(b)) || 0
    return roundDecimal(numA + numB)
}

/**
 * Trừ hai số
 */
export function subtract(a, b) {
    const numA = parseFloat(toDecimalString(a)) || 0
    const numB = parseFloat(toDecimalString(b)) || 0
    return roundDecimal(numA - numB)
}

/**
 * Nhân hai số
 */
export function multiply(a, b) {
    const numA = parseFloat(toDecimalString(a)) || 0
    const numB = parseFloat(toDecimalString(b)) || 0
    return roundDecimal(numA * numB)
}

/**
 * Chia hai số
 */
export function divide(a, b) {
    const numA = parseFloat(toDecimalString(a)) || 0
    const numB = parseFloat(toDecimalString(b)) || 0
    if (numB === 0) throw new Error('Không thể chia cho 0')
    return roundDecimal(numA / numB)
}

/**
 * Lũy thừa
 */
export function power(base, exponent) {
    const numBase = parseFloat(toDecimalString(base)) || 0
    const numExp = parseFloat(toDecimalString(exponent)) || 0
    return roundDecimal(Math.pow(numBase, numExp))
}

/**
 * Căn bậc hai
 */
export function sqrt(num) {
    const numVal = parseFloat(toDecimalString(num)) || 0
    if (numVal < 0) throw new Error('Không thể tính căn số âm')
    return roundDecimal(Math.sqrt(numVal))
}

/**
 * Logarit cơ số 10
 */
export function log(num) {
    const numVal = parseFloat(toDecimalString(num)) || 0
    if (numVal <= 0) throw new Error('Log chỉ áp dụng cho số dương')
    return roundDecimal(Math.log10(numVal))
}

/**
 * Logarit tự nhiên
 */
export function ln(num) {
    const numVal = parseFloat(toDecimalString(num)) || 0
    if (numVal <= 0) throw new Error('Ln chỉ áp dụng cho số dương')
    return roundDecimal(Math.log(numVal))
}

/**
 * Sin
 */
export function sin(num) {
    const numVal = parseFloat(toDecimalString(num)) || 0
    return roundDecimal(Math.sin(numVal * Math.PI / 180)) // Chuyển độ sang radian
}

/**
 * Cos
 */
export function cos(num) {
    const numVal = parseFloat(toDecimalString(num)) || 0
    return roundDecimal(Math.cos(numVal * Math.PI / 180))
}

/**
 * Tan
 */
export function tan(num) {
    const numVal = parseFloat(toDecimalString(num)) || 0
    return roundDecimal(Math.tan(numVal * Math.PI / 180))
}

/**
 * Giai thừa
 */
export function factorial(num) {
    const numVal = parseInt(toDecimalString(num)) || 0
    if (numVal < 0) throw new Error('Giai thừa chỉ áp dụng cho số nguyên không âm')
    if (numVal > 170) throw new Error('Số quá lớn để tính giai thừa')
    if (numVal === 0 || numVal === 1) return 1
    let result = 1
    for (let i = 2; i <= numVal; i++) {
        result *= i
    }
    return result
}

/**
 * Tính phần trăm
 */
export function percent(num) {
    const numVal = parseFloat(toDecimalString(num)) || 0
    return roundDecimal(numVal / 100)
}

/**
 * Đổi dấu
 */
export function toggleSign(num) {
    const numVal = parseFloat(toDecimalString(num)) || 0
    return roundDecimal(-numVal)
}

/**
 * Làm tròn đến 100
 */
export function roundTo100(num) {
    const numVal = parseFloat(toDecimalString(num)) || 0
    return Math.round(numVal / 100) * 100
}

/**
 * Làm tròn đến 1000
 */
export function roundTo1000(num) {
    const numVal = parseFloat(toDecimalString(num)) || 0
    return Math.round(numVal / 1000) * 1000
}

/**
 * Tính VAT
 */
export function calculateVAT(amount, vatPercent) {
    const amt = parseFloat(toDecimalString(amount)) || 0
    const vat = parseFloat(toDecimalString(vatPercent)) || 0
    const vatAmount = roundDecimal(amt * vat / 100)
    return {
        subtotal: amt,
        vatPercent: vat,
        vatAmount: vatAmount,
        total: roundDecimal(amt + vatAmount)
    }
}

/**
 * Tính tip
 */
export function calculateTip(amount, tipPercent) {
    const amt = parseFloat(toDecimalString(amount)) || 0
    const tip = parseFloat(toDecimalString(tipPercent)) || 0
    const tipAmount = roundDecimal(amt * tip / 100)
    return {
        subtotal: amt,
        tipPercent: tip,
        tipAmount: tipAmount,
        total: roundDecimal(amt + tipAmount)
    }
}

/**
 * Tính tiền nhanh (Quick Pay)
 */
export function calculateQuickPay(quantity, unitPrice, discount, discountType, vatPercent, tipPercent) {
    const qty = parseFloat(toDecimalString(quantity)) || 0
    const price = parseFloat(toDecimalString(unitPrice)) || 0
    const disc = parseFloat(toDecimalString(discount)) || 0
    
    // Tính subtotal
    let subtotal = roundDecimal(qty * price)
    
    // Áp dụng giảm giá
    let discountAmount = 0
    if (discountType === 'percent') {
        discountAmount = roundDecimal(subtotal * disc / 100)
    } else {
        discountAmount = disc
    }
    const subtotalAfterDiscount = roundDecimal(subtotal - discountAmount)
    
    // Tính VAT
    const vat = parseFloat(toDecimalString(vatPercent)) || 0
    const vatAmount = roundDecimal(subtotalAfterDiscount * vat / 100)
    
    // Tính tip
    const tip = parseFloat(toDecimalString(tipPercent)) || 0
    const tipAmount = roundDecimal(subtotalAfterDiscount * tip / 100)
    
    // Tổng cuối
    const total = roundDecimal(subtotalAfterDiscount + vatAmount + tipAmount)
    
    return {
        quantity: qty,
        unitPrice: price,
        subtotal: subtotal,
        discount: disc,
        discountType: discountType,
        discountAmount: discountAmount,
        subtotalAfterDiscount: subtotalAfterDiscount,
        vatPercent: vat,
        vatAmount: vatAmount,
        tipPercent: tip,
        tipAmount: tipAmount,
        total: total
    }
}

/**
 * Chuyển đổi tiền tệ
 */
export function convertCurrency(amount, exchangeRate) {
    const amt = parseFloat(toDecimalString(amount)) || 0
    const rate = parseFloat(toDecimalString(exchangeRate)) || 0
    return roundDecimal(amt * rate)
}

